// Sabarimala Monitoring Orchestration Service
import { db } from './supabase.js';
import { getAvailability } from './availabilityService.js';
import { sendSlotAlertNotification } from './telegramService.js';
import { sendEmailAlert } from './emailService.js';

// Track in-memory lock to prevent overlapping runs
let isMonitoringCheckRunning = false;

/**
 * Runs a single monitoring iteration
 */
export async function runMonitoringCheck(options = {}) {
  const { force = false, modeOverride = null } = options;

  if (isMonitoringCheckRunning) {
    return {
      status: 'SKIPPED',
      message: 'Monitoring check already in progress'
    };
  }

  isMonitoringCheckRunning = true;

  try {
    const settings = await db.getSettings();

    // If monitoring is disabled and not forced, exit early
    if (!settings.monitoring_enabled && !force) {
      isMonitoringCheckRunning = false;
      return {
        status: 'PAUSED',
        message: 'Monitoring is currently paused in settings'
      };
    }

    const dataMode = modeOverride || settings.data_mode || 'LIVE';
    const previousSnapshot = await db.getLatestSnapshot();

    // 1. Fetch current availability
    const checkResult = await getAvailability(dataMode);

    // 2. Handle API Errors cleanly
    if (!checkResult.success) {
      // Save snapshot with error status
      await db.saveSnapshot({
        availableDatesList: previousSnapshot?.available_dates || [],
        bookedDates: previousSnapshot?.booked_dates || [],
        blockedDates: previousSnapshot?.blocked_dates || [],
        startAndEndDates: [previousSnapshot?.start_date, previousSnapshot?.end_date],
        checkedAt: checkResult.checkedAt,
        requestStatus: checkResult.status
      });

      // Record activity history for failure
      await db.addHistory({
        darshan_date: 'SYSTEM',
        previous_status: 'N/A',
        current_status: checkResult.status,
        detected_at: checkResult.checkedAt
      });

      isMonitoringCheckRunning = false;
      return {
        status: checkResult.status,
        success: false,
        error: checkResult.error,
        statusCode: checkResult.statusCode,
        checkedAt: checkResult.checkedAt
      };
    }

    const currentData = checkResult.data;
    const nowIso = checkResult.checkedAt;

    // 3. Save new successful snapshot
    const savedSnapshot = await db.saveSnapshot({
      availableDatesList: currentData.availableDatesList,
      bookedDates: currentData.bookedDates,
      blockedDates: currentData.blockedDates,
      startAndEndDates: currentData.startAndEndDates,
      checkedAt: nowIso,
      requestStatus: 'CONNECTED'
    });

    // 4. Compare with previous successful snapshot to detect newly available dates
    const prevAvailable = new Set(previousSnapshot?.available_dates || []);
    const prevBooked = new Set(previousSnapshot?.booked_dates || []);
    const currentAvailable = new Set(currentData.availableDatesList || []);

    // Dates that became available (in currentAvailable, but not in prevAvailable)
    // Note: If no previous snapshot exists, we don't alert on existing available slots to prevent spamming on first run
    const hasPreviousSnapshot = Boolean(previousSnapshot && previousSnapshot.available_dates);
    
    // Potential newly available dates
    const newlyAvailableDates = [];
    if (hasPreviousSnapshot) {
      for (const d of currentData.availableDatesList) {
        if (!prevAvailable.has(d)) {
          newlyAvailableDates.push(d);
        }
      }
    }

    // Also check dates that transitioned from AVAILABLE to BOOKED
    if (hasPreviousSnapshot) {
      for (const d of (previousSnapshot.available_dates || [])) {
        if (!currentAvailable.has(d) && currentData.bookedDates.includes(d)) {
          await db.addHistory({
            darshan_date: d,
            previous_status: 'AVAILABLE',
            current_status: 'BOOKED',
            detected_at: nowIso
          });
        }
      }
    }

    // 5. Determine which dates to alert on based on Monitoring Mode
    const monitoredRows = await db.getMonitoredDates();
    const activeMonitoredDates = new Set(
      monitoredRows.filter(r => r.monitoring_enabled).map(r => r.darshan_date)
    );

    const datesToAlert = [];
    const monitoringMode = settings.monitoring_mode || 'SELECTED';

    for (const dateStr of newlyAvailableDates) {
      if (monitoringMode === 'ALL') {
        datesToAlert.push(dateStr);
      } else if (activeMonitoredDates.has(dateStr)) {
        datesToAlert.push(dateStr);
      }
    }

    // 6. Deduplication and Dispatch Notifications
    const recentNotifications = await db.getNotificationLogs(50);
    // Find notifications sent within the last 4 hours for this date
    const alertedDates = new Set();
    const fourHoursAgo = Date.now() - 4 * 3600 * 1000;
    for (const notif of recentNotifications) {
      if (notif.delivery_status === 'SENT' && new Date(notif.sent_at).getTime() > fourHoursAgo) {
        alertedDates.add(notif.darshan_date);
      }
    }

    const dispatchedAlerts = [];
    for (const dateStr of datesToAlert) {
      // Check if already notified while remaining continuously available
      if (!alertedDates.has(dateStr)) {
        const prevStatus = prevBooked.has(dateStr) ? 'BOOKED' : 'UNAVAILABLE';
        
        // Log in history
        await db.addHistory({
          darshan_date: dateStr,
          previous_status: prevStatus,
          current_status: 'AVAILABLE',
          detected_at: nowIso
        });

        // Send Telegram alert
        const telegramRes = await sendSlotAlertNotification({
          darshanDate: dateStr,
          previousStatus: prevStatus,
          currentStatus: 'AVAILABLE'
        });

        // Send Free Gmail Email alert
        const emailRes = await sendEmailAlert({
          darshanDate: dateStr,
          previousStatus: prevStatus,
          currentStatus: 'AVAILABLE'
        });

        dispatchedAlerts.push({
          date: dateStr,
          telegram: telegramRes,
          email: emailRes
        });
      }
    }

    isMonitoringCheckRunning = false;
    return {
      status: 'CONNECTED',
      success: true,
      dataMode,
      checkedAt: nowIso,
      latency: checkResult.latency,
      summary: {
        totalAvailable: currentData.availableDatesList.length,
        totalBooked: currentData.bookedDates.length,
        totalBlocked: currentData.blockedDates.length,
        newlyAvailableCount: newlyAvailableDates.length,
        newlyAvailableDates,
        alertsDispatched: dispatchedAlerts.length,
        dispatchedAlerts
      }
    };
  } catch (err) {
    isMonitoringCheckRunning = false;
    console.error('[MonitoringService] Unexpected error in monitoring check:', err);
    return {
      status: 'NETWORK_ERROR',
      success: false,
      error: err.message,
      checkedAt: new Date().toISOString()
    };
  }
}

/**
 * Calculates current health status of API and monitoring
 */
export async function getApiHealth() {
  const latestSnapshot = await db.getLatestSnapshot();
  const settings = await db.getSettings();

  if (!latestSnapshot) {
    return {
      status: 'UNKNOWN',
      message: 'No API checks recorded yet',
      lastChecked: null,
      isStale: false
    };
  }

  const lastCheckedTime = new Date(latestSnapshot.checked_at).getTime();
  const now = Date.now();
  const expectedIntervalMs = (settings.monitoring_interval || 300) * 1000;
  const isStale = (now - lastCheckedTime) > (expectedIntervalMs * 2);

  if (latestSnapshot.request_status !== 'CONNECTED') {
    return {
      status: latestSnapshot.request_status,
      message: `Last check reported ${latestSnapshot.request_status}`,
      lastChecked: latestSnapshot.checked_at,
      isStale
    };
  }

  if (isStale) {
    return {
      status: 'STALE_DATA',
      message: 'Monitoring check has not completed recently',
      lastChecked: latestSnapshot.checked_at,
      isStale: true
    };
  }

  return {
    status: 'CONNECTED',
    message: 'API operational and responding normally',
    lastChecked: latestSnapshot.checked_at,
    isStale: false
  };
}
