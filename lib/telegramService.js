// Telegram Bot Notification Service
import { formatDisplayDate } from './dateUtils.js';
import { db } from './supabase.js';

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
export async function sendSlotAlertNotification({
  darshanDate,
  previousStatus = 'BOOKED',
  currentStatus = 'AVAILABLE'
}) {
  const settings = await db.getSettings();
  if (settings && settings.notification_enabled === false) {
    console.log('[Telegram] Notifications disabled in settings, skipping alert for', darshanDate);
    return { success: false, skipped: true, reason: 'Notifications disabled' };
  }

  const formattedDate = formatDisplayDate(darshanDate);
  const message = `🚨 <b>SABARIMALA SLOT AVAILABLE!</b>

<b>Darshan Date:</b> ${formattedDate} (${darshanDate})
<b>Previous Status:</b> ${previousStatus}
<b>Current Status:</b> 🟢 <b>${currentStatus}</b>

A previously unavailable Sabarimala Virtual Q date is now showing availability!

⚡ <i>Please verify and book immediately.</i>

🔗 <b>Official booking link:</b>
${OFFICIAL_BOOKING_URL}

<i>Notice: Sabarimala Slot Alert does not automatically book slots. Please open the official portal to complete your reservation.</i>`;

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
 * Sends a test notification to verify bot token and chat ID setup
 */
export async function sendTestNotification(customToken = null, customChatId = null) {
  const timestamp = new Date().toLocaleString('en-IN', { timeStyle: 'medium', dateStyle: 'medium' });
  const message = `🔔 <b>Sabarimala Slot Alert - Test Notification</b>

Your Telegram notification integration is working properly!

🕒 <b>Timestamp:</b> ${timestamp}
🎯 <b>Status:</b> Active & Listening
🔗 <b>Official Portal:</b> ${OFFICIAL_BOOKING_URL}

Whenever a monitored date becomes available, you will receive an alert here immediately.`;

  return await sendTelegramMessage(message, customToken, customChatId);
}
