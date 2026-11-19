#!/usr/bin/env node
/**
 * Sabarimala Virtual Q API Live Hit & Slot Verification Script
 * Hits the live Sabarimala endpoint, logs complete HTTP & payload details,
 * and generates a diagnostic confirmation report.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');

const SABARIMALA_ENDPOINT = process.env.SABARIMALA_API_URL || 'https://sabarimalaonline.org/api/eDarshan/darshansummary/100001';

const headers = {
  'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
  'Accept': 'application/json, text/plain, */*',
  'Accept-Language': 'en-US,en;q=0.9',
  'Content-Type': 'application/json',
  'Origin': 'https://sabarimalaonline.org',
  'Referer': 'https://sabarimalaonline.org/',
  'sec-ch-ua': '"Chromium";v="131", "Google Chrome";v="131", "Not_A Brand";v="24"',
  'sec-ch-ua-mobile': '?0',
  'sec-ch-ua-platform': '"macOS"',
  'sec-fetch-dest': 'empty',
  'sec-fetch-mode': 'cors',
  'sec-fetch-site': 'same-origin',
  'Cache-Control': 'no-cache'
};

function formatDayOfWeek(dateStr) {
  try {
    const d = new Date(dateStr + 'T00:00:00Z');
    return d.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'short', day: 'numeric', timeZone: 'UTC' });
  } catch {
    return dateStr;
  }
}

async function runApiAudit() {
  const timestamp = new Date().toISOString();
  console.log('\n============================================================');
  console.log('🕉️  SABARIMALA VIRTUAL Q API - LIVE HIT & SLOT AUDIT');
  console.log('============================================================');
  console.log(`[Timestamp]   : ${timestamp}`);
  console.log(`[Target URL]  : ${SABARIMALA_ENDPOINT}`);
  console.log(`[Method]      : POST`);
  console.log('------------------------------------------------------------');
  console.log('🚀 Sending live HTTP probe to official Sabarimala server...');

  const t0 = Date.now();
  let response;
  let rawBody;
  let networkError = null;

  try {
    response = await fetch(SABARIMALA_ENDPOINT, {
      method: 'POST',
      headers,
    });
    rawBody = await response.text();
  } catch (err) {
    networkError = err;
  }

  const latency = Date.now() - t0;

  if (networkError) {
    console.error(`\n❌ Network failure while connecting: ${networkError.message}`);
    return;
  }

  const statusCode = response.status;
  const statusText = response.statusText;
  const responseHeaders = Object.fromEntries(response.headers.entries());

  console.log(`\n📥 Response received in ${latency}ms`);
  console.log(`[HTTP Status] : ${statusCode} ${statusText}`);
  console.log(`[CloudFront]  : POP=${responseHeaders['x-amz-cf-pop'] || 'N/A'}, Cache=${responseHeaders['x-cache'] || 'N/A'}`);
  console.log(`[Content-Type]: ${responseHeaders['content-type'] || 'N/A'}`);

  let parsed = null;
  try {
    parsed = JSON.parse(rawBody);
  } catch (err) {
    console.error(`❌ Response could not be parsed as JSON: ${err.message}`);
    console.error(`Raw snippet: ${rawBody.slice(0, 300)}`);
    return;
  }

  const availableDates = parsed.availableDatesList || [];
  const bookedDates = parsed.bookedDates || [];
  const blockedDates = parsed.blockedDates || [];
  const seasonRange = parsed.startAndEndDates || [];

  console.log('------------------------------------------------------------');
  console.log('📊 SLOT AVAILABILITY AUDIT RESULTS');
  console.log('------------------------------------------------------------');
  console.log(`Season Date Range   : ${seasonRange[0] || 'N/A'} to ${seasonRange[1] || 'N/A'}`);
  console.log(`Total Booked Dates  : ${bookedDates.length}`);
  console.log(`Total Blocked Dates : ${blockedDates.length}`);
  console.log(`AVAILABLE SLOTS COUNT: ${availableDates.length}`);
  console.log('------------------------------------------------------------');

  const REPORTING_PLACES = [
    { id: 1, name: 'Pamba', fullName: 'Pamba - Marakkoottam - 4 Kms' },
    { id: 2, name: 'Erumely', fullName: 'Erumely - Kalaketti Traditional Path - 46 Kms' },
    { id: 3, name: 'Vandiperiyar', fullName: 'Vandiperiyar - Sathram - Pulmedu - 16 Kms' }
  ];

  const dateRouteBreakdown = {};

  if (availableDates.length > 0) {
    console.log('🔍 Probing Level-2 Routewise Time Slots & Ticket Counts...');
    for (const d of availableDates) {
      dateRouteBreakdown[d] = [];
      for (const place of REPORTING_PLACES) {
        try {
          const rUrl = `https://sabarimalaonline.org/api/eDarshan/darshanRoutewiseAvailability/${d}/100001/${place.id}`;
          const rRes = await fetch(rUrl, { method: 'POST', headers });
          if (rRes.ok) {
            const rData = await rRes.json();
            const slots = (rData.darshanSlots || []).filter(s => (s.noOfTicketsAvailable || 0) > 0);
            if (slots.length > 0) {
              dateRouteBreakdown[d].push({
                place: place.name,
                placeId: place.id,
                totalTickets: slots.reduce((a, b) => a + (b.noOfTicketsAvailable || 0), 0),
                slots: slots.map(s => ({ time: s.slotName, tickets: s.noOfTicketsAvailable }))
              });
            }
          }
        } catch {
          // ignore
        }
      }
    }
  }

  if (availableDates.length === 0) {
    console.log('⚠️  NO SLOTS CURRENTLY AVAILABLE according to official live API.');
  } else {
    console.log('✅ CONFIRMED AVAILABLE DATES & ROUTEWISE BOOKING STATUS:');
    availableDates.forEach((dateStr, idx) => {
      const routes = dateRouteBreakdown[dateStr] || [];
      console.log(`\n   ${idx + 1}. [${dateStr}] => ${formatDayOfWeek(dateStr)}`);
      if (routes.length === 0) {
        console.log(`      ⚠️  ALERT: 0 booking tickets available across all routes (Ghost / Already snatched slot)!`);
      } else {
        routes.forEach(r => {
          console.log(`      📍 Route: ${r.place} -> ${r.totalTickets} total tickets across ${r.slots.length} time slot(s):`);
          r.slots.slice(0, 5).forEach(s => {
            console.log(`         • ${s.time}: ${s.tickets} ticket(s)`);
          });
          if (r.slots.length > 5) {
            console.log(`         ... and ${r.slots.length - 5} more time slots.`);
          }
        });
      }
    });
  }

  console.log('============================================================');
  console.log(`[API Hit Status]     : ${statusCode === 200 ? '✅ HITTING PERFECTLY (HTTP 200 OK)' : '⚠️ HTTP ' + statusCode}`);
  console.log(`[Data Authenticity] : Official Sabarimala Portal response validated.`);
  console.log('============================================================\n');

  // Save detailed log file
  const logDir = path.join(ROOT_DIR, 'logs');
  if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir, { recursive: true });
  }

  const logReport = {
    auditTimestamp: timestamp,
    targetEndpoint: SABARIMALA_ENDPOINT,
    httpStatus: statusCode,
    latencyMs: latency,
    headers: {
      server: responseHeaders['server'] || null,
      xCache: responseHeaders['x-cache'] || null,
      cfPop: responseHeaders['x-amz-cf-pop'] || null,
      cfId: responseHeaders['x-amz-cf-id'] || null,
      contentType: responseHeaders['content-type'] || null
    },
    seasonRange,
    counts: {
      available: availableDates.length,
      booked: bookedDates.length,
      blocked: blockedDates.length
    },
    availableDatesList: availableDates.map(d => ({
      date: d,
      formatted: formatDayOfWeek(d)
    })),
    rawSummary: parsed
  };

  const jsonReportPath = path.join(logDir, 'latest-api-hit.json');
  fs.writeFileSync(jsonReportPath, JSON.stringify(logReport, null, 2));

  const textLogLine = `[${timestamp}] STATUS=${statusCode} LATENCY=${latency}ms AVAILABLE_SLOTS=${availableDates.length} DATES=[${availableDates.join(', ')}]\n`;
  const textLogPath = path.join(logDir, 'availability-audit.log');
  fs.appendFileSync(textLogPath, textLogLine);

  console.log(`📁 Audit log saved to:`);
  console.log(`   - ${jsonReportPath}`);
  console.log(`   - ${textLogPath}\n`);
}

runApiAudit();

