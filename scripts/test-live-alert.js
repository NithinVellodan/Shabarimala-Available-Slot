#!/usr/bin/env node
/**
 * Test Live Real-Time Slot Alert
 * Queries the official Sabarimala API in real-time, finds current open slots,
 * and formats the exact alert message dispatched to Telegram & Email.
 */
import 'dotenv/config';
import { fetchLiveAvailability, fetchRoutewiseSlots } from '../lib/availabilityService.js';
import { formatDisplayDate } from '../lib/dateUtils.js';
import { sendSlotAlertNotification } from '../lib/telegramService.js';
import { sendEmailAlert } from '../lib/emailService.js';
import { db } from '../lib/supabase.js';

async function main() {
  console.log('='.repeat(60));
  console.log('🕉️  TESTING REAL-TIME SABARIMALA SLOT ALERT GENERATION');
  console.log('='.repeat(60));

  console.log('📡 1. Querying official Sabarimala calendar API in real time...');
  const live = await fetchLiveAvailability();
  if (!live.success) {
    console.error(`❌ Live check failed: ${live.error}`);
    return;
  }

  const openDates = live.data?.availableDatesList || [];
  console.log(`✅ API Connected (${live.latency}ms). Open dates found: ${openDates.length}`);
  console.log('Dates:', openDates);

  if (openDates.length === 0) {
    console.log('No dates are open right now in the calendar summary.');
    return;
  }

  console.log('\n🔍 2. Probing Level-2 real-time routewise booking slots...');
  const verifiedDates = [];
  const routeMap = {};

  for (const dateStr of openDates) {
    const routes = await fetchRoutewiseSlots(dateStr);
    if (routes && routes.length > 0) {
      verifiedDates.push(dateStr);
      routeMap[dateStr] = routes;
      const totalTickets = routes.reduce((a, b) => a + (b.totalTickets || 0), 0);
      console.log(`  ✅ [${dateStr}] (${formatDisplayDate(dateStr)}): ${totalTickets} tickets across ${routes.length} route(s)`);
      routes.forEach(r => {
        console.log(`     📍 Route: ${r.placeName} -> ${r.totalTickets} tickets open`);
      });
    } else {
      console.log(`  ⚠️ [${dateStr}]: 0 booking tickets available across routes (Suppressed from alert).`);
    }
  }

  if (verifiedDates.length === 0) {
    console.log('\n⚠️ No dates currently have verified tickets > 0. Alerts are cleanly suppressed.');
    return;
  }

  console.log(`\n📬 3. Real-Time Alert Preview for first open date (${verifiedDates[0]}):`);
  const targetDate = verifiedDates[0];
  const targetRoutes = routeMap[targetDate];
  const totalTickets = targetRoutes.reduce((a, b) => a + (b.totalTickets || 0), 0);

  console.log('-'.repeat(60));
  console.log(`🚨 SABARIMALA VIRTUAL Q SLOT OPEN!`);
  console.log(`📅 Darshan Date: ${formatDisplayDate(targetDate)} (${targetDate})`);
  console.log(`🎟️ Total Available Tickets: ${totalTickets}`);
  console.log(`🟢 Status: AVAILABLE`);
  console.log(`\nConfirmed Real-Time Routes & Slots:`);
  targetRoutes.forEach(r => {
    console.log(`📍 Route: ${r.placeName} [${r.totalTickets} tickets]`);
    r.slots.slice(0, 4).forEach(s => {
      console.log(`  • ${s.slotName}: ${s.ticketsAvailable} ticket(s)`);
    });
  });
  console.log(`\n👉 HOW TO BOOK ON THE PORTAL:`);
  console.log(`1. Open https://sabarimalaonline.org/#/darshan`);
  console.log(`2. Select Date: ${formatDisplayDate(targetDate)}`);
  console.log(`3. ⚠️ CRITICAL: Select Route: "${targetRoutes[0].placeName}"`);
  console.log(`4. Choose your preferred time slot & confirm.`);
  console.log('-'.repeat(60));

  const shouldSend = process.argv.includes('--send');
  if (shouldSend) {
    console.log('\n🚀 Dispatching live test alert to configured channels...');
    const settings = await db.getSettings();

    // Telegram
    if (process.env.TELEGRAM_BOT_TOKEN && process.env.TELEGRAM_CHAT_ID) {
      const tgRes = await sendSlotAlertNotification({
        darshanDate: targetDate,
        previousStatus: 'BOOKED',
        currentStatus: 'AVAILABLE',
        routeDetails: targetRoutes
      });
      console.log(`Telegram dispatch: ${tgRes.success ? '✅ SENT' : '❌ FAILED: ' + tgRes.error}`);
    } else {
      console.log('Telegram not configured (TELEGRAM_BOT_TOKEN missing)');
    }

    // Email
    if (process.env.GMAIL_USER && process.env.GMAIL_APP_PASSWORD) {
      const emailRes = await sendEmailAlert({
        dates: verifiedDates,
        currentStatus: 'AVAILABLE',
        routeDetailsMap: routeMap
      });
      console.log(`Email dispatch: ${emailRes.success ? '✅ SENT to ' + emailRes.recipients : '❌ FAILED: ' + emailRes.error}`);
    } else {
      console.log('Gmail SMTP not configured');
    }
  } else {
    console.log('\n💡 Tip: Run `node scripts/test-live-alert.js --send` to actually dispatch this alert to your Email/Telegram!');
  }
}

main().catch(console.error);

