// Free Gmail SMTP Email Service via Nodemailer
import nodemailer from 'nodemailer';
import { formatDisplayDate, formatTimestamp } from './dateUtils.js';
import { db } from './supabase.js';
import { fetchRoutewiseSlots, fetchLiveAvailability } from './availabilityService.js';

const OFFICIAL_BOOKING_URL = 'https://sabarimalaonline.org/#/darshan';
const WEBSITE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://shabarimala-slot.vercel.app';

/**
 * Creates a Nodemailer SMTP transporter for Gmail
 */
function createTransporter(customUser = null, customPass = null) {
  const user = customUser || process.env.GMAIL_USER;
  const pass = customPass || process.env.GMAIL_APP_PASSWORD;

  if (!user || !pass) {
    return null;
  }

  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: user.trim(),
      pass: pass.trim().replace(/\s+/g, '') // Google App Passwords may have spaces
    }
  });
}

/**
 * Formats recipient list: supports comma-separated string or array
 */
function normalizeRecipients(recipients) {
  if (!recipients) return '';
  if (Array.isArray(recipients)) {
    return recipients.map(r => r.trim()).filter(Boolean).join(', ');
  }
  return String(recipients)
    .split(',')
    .map(r => r.trim())
    .filter(Boolean)
    .join(', ');
}

/**
 * Sends a single-date or multi-date consolidated email alert
 */
export async function sendEmailAlert({
  darshanDate, // can be single dateStr or array of dates
  dates = null,
  previousStatus = 'BOOKED',
  currentStatus = 'AVAILABLE',
  recipientOverride = null,
  routeDetailsMap = {}
}) {
  const settings = await db.getSettings();
  if (settings && settings.email_notification_enabled === false) {
    console.log('[Email] Email alerts disabled in settings');
    return { success: false, skipped: true, reason: 'Email notifications disabled in settings' };
  }

  const senderUser = process.env.GMAIL_USER;
  const rawRecipient = recipientOverride || settings?.alert_recipient_email || process.env.ALERT_RECIPIENT_EMAIL || senderUser;
  const recipients = normalizeRecipients(rawRecipient);

  if (!senderUser || !process.env.GMAIL_APP_PASSWORD) {
    return {
      success: false,
      error: 'Gmail SMTP credentials (GMAIL_USER or GMAIL_APP_PASSWORD) are not configured'
    };
  }

  if (!recipients) {
    return {
      success: false,
      error: 'No alert recipient email address specified'
    };
  }

  const transporter = createTransporter();
  if (!transporter) {
    return { success: false, error: 'Could not initialize Gmail SMTP transporter' };
  }

  const recipientName = settings?.recipient_name || '';

  // Handle both single date and multi-date arrays
  const rawDateList = dates || (Array.isArray(darshanDate) ? darshanDate : [darshanDate]);

  // Real-time slot verification: populate live routes and filter out ghost/zero-ticket dates
  const liveRouteMap = { ...routeDetailsMap };
  const verifiedDateList = [];

  for (const d of rawDateList) {
    if (!liveRouteMap[d]) {
      try {
        const routes = await fetchRoutewiseSlots(d);
        if (routes && routes.length > 0) {
          liveRouteMap[d] = routes;
        }
      } catch (err) {
        console.warn('[Email] Failed to fetch real-time routes for', d, err.message);
      }
    }

    // Only include dates that have confirmed booking tickets
    const routesForDate = liveRouteMap[d] || [];
    const totalTicketsForDate = routesForDate.reduce((sum, r) => sum + (r.totalTickets || 0), 0);
    if (routesForDate.length > 0 && totalTicketsForDate > 0) {
      verifiedDateList.push(d);
    } else {
      console.warn(`[Email] ⚠️ Skipping email alert for ${d}: Real-time check confirmed 0 booking tickets available.`);
    }
  }

  // If no dates have valid tickets in real time, suppress false alarm!
  if (verifiedDateList.length === 0) {
    return {
      success: false,
      skipped: true,
      reason: 'Zero tickets available across candidate dates in real-time check'
    };
  }

  const dateList = verifiedDateList;
  const isMultiple = dateList.length > 1;

  const subject = isMultiple
    ? `🚨 Sabarimala Slot Alert — ${dateList.length} Dates Now Available!`
    : `🚨 Sabarimala Slot Alert — ${formatDisplayDate(dateList[0])} is Now Open!`;

  const datesListHtml = dateList
    .map(d => `<li style="padding: 6px 0; font-size: 14px; color: #0f172a; font-weight: 600;">📅 ${formatDisplayDate(d)}</li>`)
    .join('');

  const htmlContent = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #f8fafc; margin: 0; padding: 20px;">
  <div style="max-width: 520px; margin: 0 auto; background: #ffffff; border-radius: 14px; border: 1px solid #e2e8f0; overflow: hidden;">

    <!-- Header -->
    <div style="background: linear-gradient(135deg, #ea580c, #c2410c); padding: 24px; text-align: center;">
      <div style="font-size: 28px; margin-bottom: 6px;">🕉️</div>
      <h1 style="margin: 0; color: #fff; font-size: 18px; font-weight: 800;">Sabarimala Slot Alert</h1>
      <p style="margin: 4px 0 0; color: rgba(255,255,255,0.85); font-size: 12px;">Virtual Q Darshan Availability Monitor</p>
    </div>

    <!-- Body -->
    <div style="padding: 28px 24px;">
      <p style="font-size: 15px; font-weight: 700; color: #065f46; background: #ecfdf5; border: 1px solid #a7f3d0; border-radius: 10px; padding: 14px 16px; margin: 0 0 20px; text-align: center;">
        🟢 Darshan slot(s) are now <strong>AVAILABLE</strong> on the official portal!
      </p>

      <p style="font-size: 13px; color: #475569; margin: 0 0 8px;"><strong>Available Date(s):</strong></p>
      <ul style="margin: 0 0 24px; padding-left: 20px; list-style: disc;">
        ${datesListHtml}
      </ul>

      <p style="font-size: 12px; color: #94a3b8; margin: 0 0 24px;">Detected at: ${formatTimestamp(new Date())}</p>

      <!-- CTA Buttons -->
      <div style="text-align: center; margin-bottom: 24px;">
        <a href="${OFFICIAL_BOOKING_URL}" target="_blank"
          style="display: inline-block; background: #ea580c; color: #fff; text-decoration: none; padding: 12px 28px; border-radius: 8px; font-weight: 800; font-size: 14px; margin-bottom: 10px;">
          Book Now — Official Portal ➔
        </a>
        <br>
        <a href="${WEBSITE_URL}/dashboard" target="_blank"
          style="display: inline-block; color: #ea580c; text-decoration: none; font-size: 12px; font-weight: 600; margin-top: 8px;">
          🔔 View Live Dashboard
        </a>
      </div>

      <!-- Footer -->
      <p style="font-size: 11px; color: #94a3b8; text-align: center; border-top: 1px solid #f1f5f9; padding-top: 14px; margin: 0; line-height: 1.6;">
        This is an informational alert only. No booking has been made on your behalf.<br>
        Complete your booking at <a href="${OFFICIAL_BOOKING_URL}" style="color: #ea580c;">sabarimalaonline.org</a><br><br>
        🙏 Swamiye Saranam Ayyappa &nbsp;•&nbsp;
        <a href="${WEBSITE_URL}" style="color: #ea580c;">${WEBSITE_URL}</a>
      </p>
    </div>

  </div>
</body>
</html>`;

  const textContent = `🚨 Sabarimala Slot Alert

Available Date(s):
${dateList.map(d => `• ${formatDisplayDate(d)}`).join('\n')}

Detected at: ${formatTimestamp(new Date())}

Book Now: ${OFFICIAL_BOOKING_URL}
Dashboard: ${WEBSITE_URL}/dashboard

🙏 Swamiye Saranam Ayyappa
${WEBSITE_URL}`;

  try {
    const info = await transporter.sendMail({
      from: `"Sabarimala Slot Alert" <${senderUser}>`,
      to: recipients,
      subject: subject,
      text: textContent,
      html: htmlContent
    });

    // Log notification in database for each date
    for (const d of dateList) {
      await db.addNotificationLog({
        darshan_date: d,
        notification_type: 'EMAIL',
        delivery_status: 'SENT',
        sent_at: new Date().toISOString(),
        error_message: null
      });
    }

    return {
      success: true,
      messageId: info.messageId,
      recipients,
      count: dateList.length
    };
  } catch (err) {
    console.error('[Email] Failed to send alert email:', err);

    for (const d of dateList) {
      await db.addNotificationLog({
        darshan_date: d,
        notification_type: 'EMAIL',
        delivery_status: 'FAILED',
        sent_at: new Date().toISOString(),
        error_message: err.message
      });
    }

    return {
      success: false,
      error: err.message
    };
  }
}

/**
 * Sends a test email to verify Gmail SMTP setup
 */
export async function sendTestEmail(customUser = null, customPass = null, recipientEmail = null) {
  const user = customUser || process.env.GMAIL_USER;
  const pass = customPass || process.env.GMAIL_APP_PASSWORD;
  const rawRecipient = recipientEmail || process.env.ALERT_RECIPIENT_EMAIL || user;
  const recipients = normalizeRecipients(rawRecipient);

  if (!user || !pass) {
    return {
      success: false,
      error: 'Gmail User or App Password is missing'
    };
  }

  if (!recipients) {
    return {
      success: false,
      error: 'Please specify a recipient email address'
    };
  }

  const transporter = createTransporter(user, pass);
  if (!transporter) {
    return { success: false, error: 'Could not create Gmail transporter' };
  }

  const timestamp = formatTimestamp(new Date());

  let liveDatesHtml = '';
  let liveDatesTxt = '';
  try {
    const live = await fetchLiveAvailability();
    if (live.success && live.data?.availableDatesList?.length > 0) {
      const datesFormatted = live.data.availableDatesList.map(d => formatDisplayDate(d)).join(', ');
      liveDatesHtml = `
        <div style="margin-top: 12px; padding: 10px 14px; background: #ecfdf5; border: 1px solid #a7f3d0; border-radius: 8px; font-size: 13px; color: #065f46;">
          <b>🟢 Current Confirmed Open Dates in System:</b><br>${datesFormatted}
        </div>
      `;
      liveDatesTxt = `\nCurrent Confirmed Open Dates: ${datesFormatted}`;
    }
  } catch {
    // optional live lookup
  }

  try {
    const info = await transporter.sendMail({
      from: `"Sabarimala Slot Alert" <${user}>`,
      to: recipients,
      subject: '🔔 Sabarimala Slot Alert - Integration Verified',
      text: `Sabarimala Slot Alert — Integration Verified\n\nTimestamp: ${timestamp}\nDashboard: ${WEBSITE_URL}/dashboard\nOfficial Booking: ${OFFICIAL_BOOKING_URL}\n\n🙏 Swamiye Saranam Ayyappa`,
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 480px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 14px; overflow: hidden; background: #ffffff;">
          <div style="background: linear-gradient(135deg, #ea580c, #c2410c); padding: 20px 24px; text-align: center;">
            <div style="font-size: 26px; margin-bottom: 4px;">🕉️</div>
            <h2 style="margin: 0; color: #fff; font-size: 16px; font-weight: 800;">Sabarimala Slot Alert</h2>
            <p style="margin: 4px 0 0; color: rgba(255,255,255,0.85); font-size: 11px;">Email Integration Verified</p>
          </div>
          <div style="padding: 24px;">
            <p style="font-size: 14px; color: #065f46; background: #ecfdf5; border: 1px solid #a7f3d0; border-radius: 8px; padding: 12px 14px; margin: 0 0 18px;">
              ✅ Your email alerts are <strong>active</strong>. You will be notified the moment a Sabarimala Darshan slot opens.
            </p>
            <p style="font-size: 12px; color: #64748b; margin: 0 0 4px;"><b>Sent at:</b> ${timestamp}</p>
            ${liveDatesHtml}
            <div style="text-align: center; margin: 20px 0;">
              <a href="${WEBSITE_URL}/dashboard" target="_blank"
                style="display: inline-block; background: #ea580c; color: #fff; text-decoration: none; padding: 11px 26px; border-radius: 8px; font-weight: 700; font-size: 13px;">
                🔔 Open Live Dashboard
              </a>
            </div>
            <p style="font-size: 11px; color: #94a3b8; text-align: center; border-top: 1px solid #f1f5f9; padding-top: 12px; margin: 0; line-height: 1.6;">
              Informational only • No booking made on your behalf<br>
              Official bookings: <a href="${OFFICIAL_BOOKING_URL}" style="color: #ea580c;">sabarimalaonline.org</a><br><br>
              🙏 Swamiye Saranam Ayyappa &nbsp;•&nbsp; <a href="${WEBSITE_URL}" style="color: #ea580c;">${WEBSITE_URL}</a>
            </p>
          </div>
        </div>
      `
    });

    return {
      success: true,
      message: `Test email sent successfully to ${recipients}!`,
      messageId: info.messageId
    };
  } catch (err) {
    return {
      success: false,
      error: err.message || 'Failed to authenticate with Gmail SMTP. Check App Password.'
    };
  }
}
