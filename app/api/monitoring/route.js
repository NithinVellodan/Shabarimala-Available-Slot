// API Route: /api/monitoring
import { NextResponse } from 'next/server';
import { db } from '@/lib/supabase';
import { runMonitoringCheck, getApiHealth } from '@/lib/monitoringService';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const settings = await db.getSettings();
    const monitoredDates = await db.getMonitoredDates();
    const latestSnapshot = await db.getLatestSnapshot();
    const health = await getApiHealth();
    const history = await db.getHistory(20);

    return NextResponse.json({
      settings,
      monitoredDates,
      latestSnapshot,
      health,
      history
    });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { action, date, dates, enabled, settings: newSettings } = body;

    switch (action) {
      case 'refresh': {
        const checkResult = await runMonitoringCheck({ force: true });
        return NextResponse.json({ success: true, result: checkResult });
      }

      case 'start':
      case 'resume': {
        const updated = await db.updateSettings({ monitoring_enabled: true });
        return NextResponse.json({ success: true, settings: updated });
      }

      case 'pause':
      case 'stop': {
        const updated = await db.updateSettings({ monitoring_enabled: false });
        return NextResponse.json({ success: true, settings: updated });
      }

      case 'add_dates': {
        const toAdd = dates || (date ? [date] : []);
        if (toAdd.length === 0) {
          return NextResponse.json({ error: 'No dates provided' }, { status: 400 });
        }
        const updatedList = await db.addMonitoredDates(toAdd);
        return NextResponse.json({ success: true, monitoredDates: updatedList });
      }

      case 'remove_date': {
        if (!date) {
          return NextResponse.json({ error: 'Date is required' }, { status: 400 });
        }
        await db.removeMonitoredDate(date);
        const updatedList = await db.getMonitoredDates();
        return NextResponse.json({ success: true, monitoredDates: updatedList });
      }

      case 'toggle_date': {
        if (!date) {
          return NextResponse.json({ error: 'Date is required' }, { status: 400 });
        }
        await db.toggleMonitoredDate(date, enabled !== false);
        const updatedList = await db.getMonitoredDates();
        return NextResponse.json({ success: true, monitoredDates: updatedList });
      }

      case 'update_settings': {
        if (!newSettings || typeof newSettings !== 'object') {
          return NextResponse.json({ error: 'Settings object required' }, { status: 400 });
        }
        const updated = await db.updateSettings(newSettings);
        return NextResponse.json({ success: true, settings: updated });
      }

      default:
        return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 });
    }
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
