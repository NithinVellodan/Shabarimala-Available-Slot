// Telegram Bot Notification Service
import { formatDisplayDate } from './dateUtils.js';
import { db } from './supabase.js';
import { fetchRoutewiseSlots, fetchLiveAvailability } from './availabilityService.js';

const OFFICIAL_BOOKING_URL = 'https://sabarimalaonline.org/#/darshan';

export async function sendTelegramMessage(text, customToken = null, customChatId = null) {
  const token = customToken || process.env.TELEGRAM_BOT_TOKEN;
  const chatId = customChatId || process.env.TELEGRAM_CHAT_ID;

  if (!token || !chatId) {
    return {
      success: false,
      error: 'Telegram Bot Token or Chat ID is not configured'
    };
  }

  const endpoint = `https://api.telegram.org/bot${token}/sendMessage`;

  try {
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        chat_id: chatId,
        text: text,
        parse_mode: 'HTML',
        disable_web_page_preview: false
      })
    });

    const data = await res.json();
    if (!res.ok || !data.ok) {
      return {
        success: false,
        error: data.description || `HTTP ${res.status}: Failed to deliver Telegram message`
      };
    }

    return {
      success: true,
      data: data.result
    };
  } catch (err) {
    return {
      success: false,
      error: err.message || 'Network error delivering Telegram message'
    };
  }
}

/**
 * Dispatches an availability alert for a specific date
 */
/**
 * Dispatches an availability alert for a specific date with real-time slot verification
 */
export async function sendSlotAlertNotification({
  darshanDate,
  previousStatus = 'BOOKED',
  currentStatus = 'AVAILABLE',
  routeDetails = []
}) {
  const settings = await db.getSettings();
  if (settings && settings.notification_enabled === false) {
    console.log('[Telegram] Notifications disabled in settings, skipping alert for', darshanDate);
    return { success: false, skipped: true, reason: 'Notifications disabled' };
  }

  // Real-time slot verification if not provided
  let verifiedRoutes = routeDetails;
  if (!verifiedRoutes || verifiedRoutes.length === 0) {
    try {
      verifiedRoutes = await fetchRoutewiseSlots(darshanDate);
    } catch (e) {
      console.warn('[Telegram] Could not fetch real-time routes for', darshanDate, e.message);
    }
  }

  // If no routes have tickets available in real time, suppress false alarm!
  if (!verifiedRoutes || verifiedRoutes.length === 0) {
    console.warn(`[Telegram] ⚠️ Suppressing alert for ${darshanDate}: Real-time check confirmed 0 booking tickets available.`);
    return { success: false, skipped: true, reason: 'Zero tickets available in real-time check' };
  }

  const formattedDate = formatDisplayDate(darshanDate);
  const totalTicketsAllRoutes = verifiedRoutes.reduce((acc, r) => acc + (r.totalTickets || 0), 0);

  const routeSections = verifiedRoutes.map(r => {
    const slotsFormatted = r.slots.slice(0, 5).map(s => `  • <b>${s.slotName}</b> (${s.ticketsAvailable} tickets)`).join('\n');
    const moreText = r.slots.length > 5 ? `\n  <i>... and ${r.slots.length - 5} more time slots</i>` : '';
    return `📍 <b>Route: ${r.placeName}</b> [${r.totalTickets} tickets]\n${slotsFormatted}${moreText}`;
  }).join('\n\n');

  const recommendedRoute = verifiedRoutes[0]?.placeName || 'Pamba';

  const message = `🚨 <b>SABARIMALA VIRTUAL Q SLOT OPEN!</b>

📅 <b>Darshan Date:</b> ${formattedDate} (<code>${darshanDate}</code>)
🎟️ <b>Total Available Tickets:</b> ${totalTicketsAllRoutes}
🟢 <b>Status:</b> ${currentStatus} (was ${previousStatus})

<b>Confirmed Real-Time Routes & Slots:</b>
${routeSections}

👉 <b>HOW TO BOOK ON THE PORTAL:</b>
1. Open the booking link below.
2. Select Date: <b>${formattedDate}</b>.
3. ⚠️ <b>CRITICAL:</b> Select <b>Route: "${recommendedRoute}"</b> (slots will not show if wrong route is selected!).
4. Choose your preferred time slot & confirm.

🔗 <b>Official Portal:</b>
${OFFICIAL_BOOKING_URL}

⚡ <i>Slots fill within minutes. Please book immediately.</i>`;

  const result = await sendTelegramMessage(message);

  // Log in notification_logs
  await db.addNotificationLog({
    darshan_date: darshanDate,
    notification_type: 'TELEGRAM',
    delivery_status: result.success ? 'SENT' : 'FAILED',
    sent_at: new Date().toISOString(),
    error_message: result.success ? null : result.error
  });

  return result;
}

/**
 * Sends a test notification with real-time Sabarimala API status
 */
export async function sendTestNotification(customToken = null, customChatId = null) {
  const timestamp = new Date().toLocaleString('en-IN', { timeStyle: 'medium', dateStyle: 'medium' });

  // Query real-time status
  let realTimeStatusText = 'Checking real-time official API...';
  try {
    const live = await fetchLiveAvailability();
    if (live.success && live.data?.availableDatesList) {
      const dates = live.data.availableDatesList;
      realTimeStatusText = `✅ Official API Connected (${live.latency}ms)\n` +
        `📅 Open Dates Found: ${dates.length > 0 ? dates.map(d => formatDisplayDate(d)).join(', ') : 'None'}`;
    }
  } catch {
    realTimeStatusText = 'Connected to alert service';
  }

  const message = `🔔 <b>Sabarimala Slot Alert - Integration Verified</b>

Your Telegram notification integration is active and listening for live Virtual Q slot openings.

🕒 <b>Timestamp:</b> ${timestamp}
${realTimeStatusText}

🔗 <b>Official Portal:</b> ${OFFICIAL_BOOKING_URL}

Whenever slots become available, you will receive real-time alerts with exact route and time slot details.`;

  return await sendTelegramMessage(message, customToken, customChatId);
}
