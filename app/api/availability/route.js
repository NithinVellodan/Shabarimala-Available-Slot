// API Route: /api/availability
import { NextResponse } from 'next/server';
import { getAvailability, simulateDateAvailability, resetMockState } from '@/lib/availabilityService';
import { getApiHealth, runMonitoringCheck } from '@/lib/monitoringService';
import { db } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const forceMode = searchParams.get('mode');
    const triggerRefresh = searchParams.get('refresh') === 'true';

    let result;
    if (triggerRefresh) {
      result = await runMonitoringCheck({ force: true, modeOverride: forceMode });
    } else {
      const settings = await db.getSettings();
      const mode = forceMode || settings?.data_mode || 'LIVE';
      result = await getAvailability(mode);
    }

    const health = await getApiHealth();
    const settings = await db.getSettings();

    return NextResponse.json({
      success: result.success !== false,
      status: result.status,
      data: result.data || result.summary || null,
      health,
      settings,
      checkedAt: result.checkedAt || new Date().toISOString()
    });
  } catch (err) {
    return NextResponse.json(
      {
        success: false,
        status: 'NETWORK_ERROR',
        error: err.message
      },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { action, date, makeAvailable } = body;

    if (action === 'simulate') {
      if (!date) {
        return NextResponse.json({ error: 'Date is required for simulation' }, { status: 400 });
      }
      const updatedMock = simulateDateAvailability(date, makeAvailable !== false);
      return NextResponse.json({
        success: true,
        message: `Date ${date} simulated as ${makeAvailable !== false ? 'AVAILABLE' : 'BOOKED'}`,
        data: updatedMock
      });
    }

    if (action === 'reset_mock') {
      const reset = resetMockState();
      return NextResponse.json({
        success: true,
        message: 'Mock state reset to baseline',
        data: reset
      });
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
