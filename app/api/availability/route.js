// API Route: /api/availability
import { NextResponse } from 'next/server';
import { getAvailability, fetchRoutewiseSlots, simulateDateAvailability, resetMockState } from '@/lib/availabilityService';
import { getApiHealth, runMonitoringCheck } from '@/lib/monitoringService';
import { db } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const forceMode = searchParams.get('mode');
    const triggerRefresh = searchParams.get('refresh') === 'true';

    const settings = await db.getSettings();
    const mode = forceMode || settings?.data_mode || 'LIVE';

    console.log(`[API /api/availability] GET request received | mode: ${mode} | refresh: ${triggerRefresh}`);

    // Always fetch fresh availability directly so data is NEVER null or blocked by lock
    const result = await getAvailability(mode);

    // Deep fetch routewise slots (Level-2) for confirmed available dates
    const routewiseSlots = {};
    if (result.success && result.data && Array.isArray(result.data.availableDatesList) && result.data.availableDatesList.length > 0) {
      if (mode === 'LIVE') {
        await Promise.all(
          result.data.availableDatesList.map(async (d) => {
            try {
              const routes = await fetchRoutewiseSlots(d);
              if (routes && routes.length > 0) {
                routewiseSlots[d] = routes;
              }
            } catch (err) {
              console.warn(`[API] Failed to fetch routewise slots for ${d}:`, err.message);
            }
          })
        );
      } else {
        // Mock fallback routewise data
        result.data.availableDatesList.forEach(d => {
          routewiseSlots[d] = [
            {
              placeId: 1,
              placeName: 'Pamba',
              fullName: 'Pamba - Marakkoottam - 4 Kms',
              totalTickets: 250,
              slots: [
                { slotId: 4, slotName: '07:00 - 08:00', ticketsAvailable: 50, reportingTime: '04:00 - 06:00' },
                { slotId: 5, slotName: '08:00 - 09:00', ticketsAvailable: 100, reportingTime: '05:00 - 07:00' },
                { slotId: 6, slotName: '09:00 - 10:00', ticketsAvailable: 100, reportingTime: '06:00 - 08:00' }
              ]
            }
          ];
        });
      }
      result.data.routewiseSlots = routewiseSlots;
    }

    // If refresh requested, run background monitoring check to update history and trigger alerts if needed
    if (triggerRefresh && result.success) {
      runMonitoringCheck({ force: true, modeOverride: mode }).catch(err => {
        console.warn('[API /api/availability] Background monitoring check error:', err.message);
      });
    }

    const health = await getApiHealth();

    const availableList = result.data?.availableDatesList || [];
    console.log(`[API /api/availability] Result: status=${result.status} | success=${result.success !== false} | availableSlots=${availableList.length}`);

    return NextResponse.json({
      success: result.success !== false,
      status: result.status,
      data: result.data || null,
      latency: result.latency || null,
      health,
      settings,
      checkedAt: result.checkedAt || new Date().toISOString()
    }, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });
  } catch (err) {
    console.error('[API /api/availability] Error processing request:', err);
    return NextResponse.json(
      {
        success: false,
        status: 'NETWORK_ERROR',
        error: err.message
      },
      {
        status: 500,
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate'
        }
      }
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
