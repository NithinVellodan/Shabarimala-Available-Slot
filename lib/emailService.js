// Free Gmail SMTP Email Service via Nodemailer
import nodemailer from 'nodemailer';
import { formatDisplayDate } from './dateUtils.js';
import { db } from './supabase.js';

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
 * Sends a slot availability email alert
 */
export async function sendEmailAlert({
  darshanDate,
  previousStatus = 'BOOKED',
  currentStatus = 'AVAILABLE',
  recipientOverride = null
}) {
  const settings = await db.getSettings();
  if (settings && settings.email_notification_enabled === false) {
    console.log('[Email] Email alerts disabled in settings, skipping for', darshanDate);
    return { success: false, skipped: true, reason: 'Email notifications disabled in settings' };
  }

  const senderUser = process.env.GMAIL_USER;
  const recipient = recipientOverride || process.env.ALERT_RECIPIENT_EMAIL || senderUser;

  if (!senderUser || !process.env.GMAIL_APP_PASSWORD) {
    return {
      success: false,
      error: 'Gmail SMTP credentials (GMAIL_USER or GMAIL_APP_PASSWORD) are not configured'
    };
  }

  if (!recipient) {
    return {
      success: false,
      error: 'No alert recipient email address specified'
    };
  }

  const transporter = createTransporter();
  if (!transporter) {
    return { success: false, error: 'Could not initialize Gmail SMTP transporter' };
  }

  const formattedDate = formatDisplayDate(darshanDate);
  const subject = `🚨 SABARIMALA SLOT AVAILABLE: ${formattedDate}`;

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
    .table-details { width: 100%; border-collapse: collapse; margin-bottom: 24px; }
    .table-details td { padding: 10px 12px; border-bottom: 1px solid #f1f5f9; font-size: 13px; }
    .table-details td.label { color: #64748b; font-weight: 600; width: 40%; }
    .table-details td.value { color: #0f172a; font-weight: 700; }
    .status-badge { display: inline-block; padding: 3px 10px; border-radius: 9999px; background: #d1fae5; color: #065f46; font-weight: 800; font-size: 12px; }
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
        <h2 class="alert-title">🚨 NEW SLOT AVAILABLE!</h2>
        <p class="alert-sub">A previously booked Darshan date is now showing open availability.</p>
      </div>

      <table class="table-details">
        <tr>
          <td class="label">Darshan Date</td>
          <td class="value">${formattedDate} (${darshanDate})</td>
        </tr>
        <tr>
          <td class="label">Previous Status</td>
          <td class="value" style="color: #e11d48;">${previousStatus}</td>
        </tr>
        <tr>
          <td class="label">Current Status</td>
          <td class="value"><span class="status-badge">🟢 ${currentStatus}</span></td>
        </tr>
        <tr>
          <td class="label">Detected At</td>
          <td class="value">${new Date().toLocaleString('en-IN', { timeStyle: 'medium', dateStyle: 'medium' })}</td>
        </tr>
      </table>

      <div class="btn-container">
        <a href="${OFFICIAL_BOOKING_URL}" class="btn" target="_blank">Book Now on Official Portal ➔</a>
      </div>

      <div class="notice">
        <b>Important Devotee Notice:</b> Sabarimala Slot Alert is an automated notification service and does NOT perform automatic bookings or store devotee credentials. Please complete your reservation manually on the official Devaswom portal: <a href="${OFFICIAL_BOOKING_URL}" style="color: #ea580c;">sabarimalaonline.org</a>
      </div>
    </div>
  </div>
</body>
</html>
  `;

  const textContent = `🚨 SABARIMALA SLOT AVAILABLE!

Darshan Date: ${formattedDate} (${darshanDate})
Previous Status: ${previousStatus}
Current Status: AVAILABLE

A previously unavailable Sabarimala Virtual Q date is now showing availability.
Please verify immediately.

Official booking link:
${OFFICIAL_BOOKING_URL}

(Devotees must complete actual Darshan booking on the official portal.)`;

  try {
    const info = await transporter.sendMail({
      from: `"Sabarimala Slot Alert" <${senderUser}>`,
      to: recipient,
      subject: subject,
      text: textContent,
      html: htmlContent
    });

    // Log notification in database
    await db.addNotificationLog({
      darshan_date: darshanDate,
      notification_type: 'EMAIL',
      delivery_status: 'SENT',
      sent_at: new Date().toISOString(),
      error_message: null
    });

    return {
      success: true,
      messageId: info.messageId,
      recipient
    };
  } catch (err) {
    console.error('[Email] Failed to send alert email:', err);

    await db.addNotificationLog({
      darshan_date: darshanDate,
      notification_type: 'EMAIL',
      delivery_status: 'FAILED',
      sent_at: new Date().toISOString(),
      error_message: err.message
    });

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
  const recipient = recipientEmail || process.env.ALERT_RECIPIENT_EMAIL || user;

  if (!user || !pass) {
    return {
      success: false,
      error: 'Gmail User or App Password is missing'
    };
  }

  if (!recipient) {
    return {
      success: false,
      error: 'Please specify a recipient email address'
    };
  }

  const transporter = createTransporter(user, pass);
  if (!transporter) {
    return { success: false, error: 'Could not create Gmail transporter' };
  }

  const timestamp = new Date().toLocaleString('en-IN', { timeStyle: 'medium', dateStyle: 'medium' });

  try {
    const info = await transporter.sendMail({
      from: `"Sabarimala Slot Alert" <${user}>`,
      to: recipient,
      subject: '🔔 Sabarimala Slot Alert - Free Email Test',
      text: `Your free Gmail SMTP notification integration is working properly!\n\nTimestamp: ${timestamp}\nRecipient: ${recipient}\n\nWhenever a monitored Virtual Q slot becomes available, you will receive an alert here immediately.`,
      html: `
        <div style="font-family: sans-serif; max-width: 500px; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px; background: #ffffff;">
          <h2 style="color: #ea580c; margin-top: 0;">🔔 Sabarimala Slot Alert</h2>
          <p style="font-size: 14px; color: #334155;">Your free Gmail SMTP notification integration is working properly!</p>
          <div style="background: #f8fafc; padding: 12px; border-radius: 8px; font-size: 12px; margin: 15px 0;">
            <b>Test Timestamp:</b> ${timestamp}<br>
            <b>Delivered To:</b> ${recipient}<br>
            <b>Official Portal:</b> <a href="${OFFICIAL_BOOKING_URL}">sabarimalaonline.org</a>
          </div>
          <p style="font-size: 12px; color: #64748b;">Whenever a monitored Virtual Q slot becomes available, you will receive an alert here immediately.</p>
        </div>
      `
    });

    return {
      success: true,
      message: `Test email sent successfully to ${recipient}!`,
      messageId: info.messageId
    };
  } catch (err) {
    return {
      success: false,
      error: err.message || 'Failed to authenticate with Gmail SMTP. Check App Password.'
    };
  }
}
