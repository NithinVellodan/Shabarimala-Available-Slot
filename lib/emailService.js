// Free Gmail SMTP Email Service via Nodemailer
import nodemailer from 'nodemailer';
import { formatDisplayDate, formatTimestamp } from './dateUtils.js';
import { db } from './supabase.js';
import { fetchRoutewiseSlots, fetchLiveAvailability } from './availabilityService.js';

const OFFICIAL_BOOKING_URL = 'https://sabarimalaonline.org/#/darshan';

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
    ? `🚨 SABARIMALA SLOTS OPEN: ${dateList.length} Dates Verified with Open Tickets!`
    : `🚨 SABARIMALA SLOT OPEN: ${formatDisplayDate(dateList[0])}`;

  // Build rows for dates with rich route & slot details
  const datesRowsHtml = dateList
    .map(d => {
      const routes = liveRouteMap[d] || [];
      const routeText = routes.length > 0
        ? `<div style="margin-top: 8px; font-size: 13px; color: #334155; background: #fff7ed; border-left: 3px solid #ea580c; padding: 8px 12px; border-radius: 6px;">
            ${routes.map(r => `
              <div style="margin-bottom: 6px;">
                <strong>📍 Route:</strong> <span style="color: #c2410c; font-weight: 800;">${r.placeName}</span>
                <span style="display: inline-block; margin-left: 6px; padding: 2px 8px; border-radius: 9999px; background: #ea580c; color: #ffffff; font-size: 11px; font-weight: 800;">${r.totalTickets} Tickets Open</span>
                <div style="margin-top: 4px; font-size: 12px; color: #64748b;">
                  <b>Slots:</b> ${r.slots.slice(0, 4).map(s => `${s.slotName} (${s.ticketsAvailable} tkts)`).join(' &bull; ')}
                  ${r.slots.length > 4 ? ` &bull; <i>+${r.slots.length - 4} more slots</i>` : ''}
                </div>
              </div>
            `).join('')}
          </div>`
        : '';

      return `
      <tr>
        <td style="padding: 14px 14px; border-bottom: 1px solid #f1f5f9; font-weight: 700; color: #0f172a; font-size: 15px;">
          📅 ${formatDisplayDate(d)} <span style="font-size: 11px; color: #64748b; font-weight: 500;">(${d})</span>
          ${routeText}
        </td>
        <td style="padding: 14px 14px; border-bottom: 1px solid #f1f5f9; text-align: right; vertical-align: top;">
          <span style="display: inline-block; padding: 4px 10px; border-radius: 9999px; background: #d1fae5; color: #065f46; font-weight: 800; font-size: 11px;">🟢 OPEN NOW</span>
        </td>
      </tr>
    `;
    })
    .join('');

  const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 20px; color: #0f172a; }
    .container { max-width: 580px; margin: 0 auto; background: #ffffff; border-radius: 16px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); }
    .header { background: linear-gradient(135deg, #ea580c, #c2410c); padding: 28px 24px; text-align: center; color: #ffffff; }
    .header h1 { margin: 0; font-size: 20px; font-weight: 800; letter-spacing: -0.5px; }
    .header p { margin: 6px 0 0; font-size: 13px; opacity: 0.9; }
    .content { padding: 28px 24px; }
    .alert-box { background: #ecfdf5; border: 1px solid #a7f3d0; border-radius: 12px; padding: 16px; margin-bottom: 24px; text-align: center; }
    .alert-title { color: #065f46; font-size: 16px; font-weight: 800; margin: 0 0 4px; }
    .alert-sub { color: #047857; font-size: 13px; margin: 0; }
    .table-details { width: 100%; border-collapse: collapse; margin-bottom: 24px; border: 1px solid #f1f5f9; border-radius: 8px; overflow: hidden; }
    .btn-container { text-align: center; margin: 28px 0; }
    .btn { display: inline-block; background: #0f172a; color: #ffffff !important; text-decoration: none; padding: 14px 32px; border-radius: 10px; font-weight: 800; font-size: 14px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
    .notice { font-size: 11px; color: #94a3b8; text-align: center; line-height: 1.5; border-top: 1px solid #f1f5f9; padding-top: 16px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🕉️ SABARIMALA SLOT ALERT</h1>
      <p>Virtual Q Darshan Availability Monitor</p>
    </div>
    <div class="content">
      <div class="alert-box">
        <h2 class="alert-title">🚨 ${isMultiple ? `${dateList.length} NEW SLOTS AVAILABLE!` : 'NEW SLOT AVAILABLE!'}</h2>
        <p class="alert-sub">Previously booked Darshan date(s) are now showing open availability on the official portal.</p>
      </div>

      <table class="table-details">
        <thead style="background: #f8fafc; border-bottom: 2px solid #e2e8f0;">
          <tr>
            <th style="padding: 10px 14px; text-align: left; font-size: 12px; font-weight: 800; color: #475569; text-transform: uppercase;">Darshan Date</th>
            <th style="padding: 10px 14px; text-align: right; font-size: 12px; font-weight: 800; color: #475569; text-transform: uppercase;">Current Status</th>
          </tr>
        </thead>
        <tbody>
          ${datesRowsHtml}
        </tbody>
      </table>

      <div style="font-size: 12px; color: #64748b; margin-bottom: 16px; text-align: center;">
        Detected at: <b>${formatTimestamp(new Date())}</b>
      </div>

      <div class="alert-box" style="background: #fffbeb; border: 1px solid #fef3c7; text-align: left; padding: 14px 18px; margin-bottom: 20px;">
        <h3 style="margin: 0 0 6px; font-size: 13px; color: #92400e; font-weight: 800; text-transform: uppercase;">👉 Crucial Steps to Book on Portal:</h3>
        <ol style="margin: 0; padding-left: 20px; font-size: 13px; color: #78350f; line-height: 1.6;">
          <li>Click the <b>Book Now</b> button below and login to your account.</li>
          <li>Choose your target Darshan date on the calendar.</li>
          <li><b>Important:</b> Select the Route matching the alert (e.g. <b>Pamba</b>) — other routes will show 0 tickets!</li>
          <li>Pick your desired time slot and complete booking promptly.</li>
        </ol>
      </div>

      <div class="btn-container">
        <a href="${OFFICIAL_BOOKING_URL}" class="btn" target="_blank">Book Now on Official Portal ➔</a>
      </div>

      <div class="notice">
        <b>Important Devotee Notice:</b> Sabarimala Slot Alert is an automated notification service and does NOT perform automated bookings or store devotee credentials. Please complete your reservation manually on the official Devaswom portal: <a href="${OFFICIAL_BOOKING_URL}" style="color: #ea580c;">sabarimalaonline.org</a>
      </div>
    </div>
  </div>
</body>
</html>
  `;

  const textContent = `🚨 SABARIMALA SLOTS OPEN!

Verified Open Dates:
${dateList.map(d => {
  const routes = liveRouteMap[d] || [];
  const routeStr = routes.map(r => `  -> Route: ${r.placeName} (${r.totalTickets} tickets)\n     Slots: ${r.slots.slice(0, 3).map(s => s.slotName).join(', ')}`).join('\n');
  return `• ${formatDisplayDate(d)} (${d}) - OPEN\n${routeStr}`;
}).join('\n\n')}

CRITICAL BOOKING TIP:
On sabarimalaonline.org, select the matching Route (e.g. Pamba) to see and reserve these slots.

Detected at: ${formatTimestamp(new Date())}

Official booking link:
${OFFICIAL_BOOKING_URL}`;

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
      text: `Your Gmail notification integration is working properly!\n\nTimestamp: ${timestamp}\nRecipients: ${recipients}${liveDatesTxt}\n\nWhenever a monitored Virtual Q slot becomes available, you will receive an alert with verified route and time slot details.`,
      html: `
        <div style="font-family: sans-serif; max-width: 500px; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px; background: #ffffff;">
          <h2 style="color: #ea580c; margin-top: 0;">🔔 Sabarimala Slot Alert</h2>
          <p style="font-size: 14px; color: #334155;">Your Gmail notification integration is active and verified!</p>
          <div style="background: #f8fafc; padding: 12px; border-radius: 8px; font-size: 12px; margin: 15px 0;">
            <b>Test Timestamp:</b> ${timestamp}<br>
            <b>Delivered To:</b> ${recipients}<br>
            <b>Official Portal:</b> <a href="${OFFICIAL_BOOKING_URL}">sabarimalaonline.org</a>
          </div>
          ${liveDatesHtml}
          <p style="font-size: 12px; color: #64748b; margin-top: 15px;">Whenever a monitored Virtual Q slot becomes available, all configured recipients will receive real-time alerts with exact route and time slot details.</p>
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
