// API Route: /api/notifications
import { NextResponse } from 'next/server';
import { db } from '@/lib/supabase';
import { sendTestNotification } from '@/lib/telegramService';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const logs = await db.getNotificationLogs(50);
    const settings = await db.getSettings();

    const isBotTokenSet = Boolean(process.env.TELEGRAM_BOT_TOKEN);
    const isChatIdSet = Boolean(process.env.TELEGRAM_CHAT_ID);

    return NextResponse.json({
      configured: isBotTokenSet && isChatIdSet,
      details: {
        isBotTokenSet,
        isChatIdSet,
        notificationEnabled: settings?.notification_enabled ?? true
      },
      logs
    });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { action, token, chatId, enabled } = body;

    if (action === 'test') {
      const result = await sendTestNotification(token, chatId);
      if (!result.success) {
        return NextResponse.json({ success: false, error: result.error }, { status: 400 });
      }
      return NextResponse.json({ success: true, message: 'Test message sent successfully to Telegram!' });
    }

    if (action === 'toggle') {
      const updated = await db.updateSettings({ notification_enabled: enabled !== false });
      return NextResponse.json({ success: true, settings: updated });
    }

    return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
