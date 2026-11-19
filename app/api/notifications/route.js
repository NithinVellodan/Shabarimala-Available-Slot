// API Route: /api/notifications
import { NextResponse } from 'next/server';
import { db } from '@/lib/supabase.js';
import { sendTestNotification } from '@/lib/telegramService.js';
import { sendTestEmail } from '@/lib/emailService.js';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const logs = await db.getNotificationLogs(50);
    const settings = await db.getSettings();

    const isBotTokenSet = Boolean(process.env.TELEGRAM_BOT_TOKEN);
    const isChatIdSet = Boolean(process.env.TELEGRAM_CHAT_ID);

    const isGmailUserSet = Boolean(process.env.GMAIL_USER);
    const isGmailAppPassSet = Boolean(process.env.GMAIL_APP_PASSWORD);
    const recipientEmail = settings?.alert_recipient_email || process.env.ALERT_RECIPIENT_EMAIL || (isGmailUserSet ? process.env.GMAIL_USER : '');
    const recipientName = settings?.recipient_name || 'Devotee';

    return NextResponse.json({
      configured: (isBotTokenSet && isChatIdSet) || (isGmailUserSet && isGmailAppPassSet),
      telegram: {
        configured: isBotTokenSet && isChatIdSet,
        isBotTokenSet,
        isChatIdSet,
        enabled: settings?.notification_enabled ?? true
      },
      email: {
        configured: isGmailUserSet && isGmailAppPassSet,
        isGmailUserSet,
        isGmailAppPassSet,
        gmailUser: process.env.GMAIL_USER ? process.env.GMAIL_USER.replace(/(.{2})(.*)(@.*)/, '$1***$3') : '',
        recipientEmail,
        recipientName,
        enabled: settings?.email_notification_enabled ?? true
      },
      settings,
      logs
    });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { action, token, chatId, enabled, user, pass, recipient } = body;

    // Telegram Test
    if (action === 'test') {
      const result = await sendTestNotification(token, chatId);
      if (!result.success) {
        return NextResponse.json({ success: false, error: result.error }, { status: 400 });
      }
      return NextResponse.json({ success: true, message: 'Test message sent successfully to Telegram!' });
    }

    // Email Test
    if (action === 'test_email') {
      const result = await sendTestEmail(user, pass, recipient);
      if (!result.success) {
        return NextResponse.json({ success: false, error: result.error }, { status: 400 });
      }
      return NextResponse.json({ success: true, message: result.message });
    }

    // Toggle Telegram
    if (action === 'toggle' || action === 'toggle_telegram') {
      const updated = await db.updateSettings({ notification_enabled: enabled !== false });
      return NextResponse.json({ success: true, settings: updated });
    }

    // Toggle Email
    if (action === 'toggle_email') {
      const updated = await db.updateSettings({ email_notification_enabled: enabled !== false });
      return NextResponse.json({ success: true, settings: updated });
    }

    // Save Recipient Name & Email directly from Screen
    if (action === 'save_alert_recipient') {
      const { name, email: recipientEmailInput, sendTest = true } = body;
      if (!recipientEmailInput) {
        return NextResponse.json({ error: 'Recipient email is required' }, { status: 400 });
      }

      const updated = await db.updateSettings({
        recipient_name: (name || '').trim(),
        alert_recipient_email: recipientEmailInput.trim(),
        email_notification_enabled: true
      });

      let testResult = null;
      if (sendTest) {
        testResult = await sendTestEmail(null, null, recipientEmailInput.trim());
      }

      return NextResponse.json({
        success: true,
        message: `Alert recipient updated to ${name ? name + ' (' + recipientEmailInput + ')' : recipientEmailInput}`,
        settings: updated,
        testResult
      });
    }

    // Save Recipient Email (legacy)
    if (action === 'save_recipient_email') {
      if (!recipient) {
        return NextResponse.json({ error: 'Recipient email is required' }, { status: 400 });
      }
      const updated = await db.updateSettings({ alert_recipient_email: recipient.trim() });
      return NextResponse.json({ success: true, settings: updated });
    }

    return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
