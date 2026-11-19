// Sabarimala Slot Alert - Dedicated Background Monitoring Worker
// Can be deployed on Railway, Render, Fly.io, or run locally via `npm run worker`
import 'dotenv/config';
import { db } from '../lib/supabase.js';
import { runMonitoringCheck } from '../lib/monitoringService.js';

const DEFAULT_INTERVAL_SECONDS = parseInt(process.env.MONITORING_INTERVAL_SECONDS || '300', 10);
let currentIntervalMs = DEFAULT_INTERVAL_SECONDS * 1000;
let consecutiveErrors = 0;
let isRunning = true;
let activeTimer = null;

console.log('='.repeat(60));
console.log('🕉️  SABARIMALA SLOT ALERT - BACKGROUND WORKER');
console.log('='.repeat(60));
console.log(`[Worker] Started at: ${new Date().toISOString()}`);
console.log(`[Worker] Default interval: ${DEFAULT_INTERVAL_SECONDS}s (${DEFAULT_INTERVAL_SECONDS / 60} min)`);
console.log(`[Worker] Official Endpoint: https://sabarimalaonline.org/api/eDarshan/darshansummary/100001`);
console.log(`[Worker] Telegram Bot configured: ${Boolean(process.env.TELEGRAM_BOT_TOKEN)}`);
console.log('='.repeat(60));

async function executeCycle() {
  if (!isRunning) return;

  const cycleStart = new Date().toISOString();
  console.log(`\n[Worker Cycle ${cycleStart}] Running availability check...`);

  try {
    const settings = await db.getSettings();
    if (!settings.monitoring_enabled) {
      console.log('[Worker] Monitoring is paused in settings. Waiting for next interval...');
      scheduleNext(settings.monitoring_interval ? settings.monitoring_interval * 1000 : currentIntervalMs);
      return;
    }

    const result = await runMonitoringCheck();

    if (result.success) {
      consecutiveErrors = 0;
      currentIntervalMs = (settings.monitoring_interval || DEFAULT_INTERVAL_SECONDS) * 1000;

      const summary = result.summary || {};
      console.log(`[Worker] ✅ Check succeeded (${result.latency}ms) [Mode: ${result.dataMode}]`);
      console.log(`[Worker] Available: ${summary.totalAvailable} | Booked: ${summary.totalBooked} | Blocked: ${summary.totalBlocked}`);

      if (summary.newlyAvailableCount > 0) {
        console.log(`[Worker] 🚨 NEWLY AVAILABLE SLOTS DETECTED:`, summary.newlyAvailableDates);
        console.log(`[Worker] 🔔 Alerts dispatched: ${summary.alertsDispatched}`);
      } else {
        console.log('[Worker] No newly available slots in this cycle.');
      }
    } else {
      consecutiveErrors++;
      console.warn(`[Worker] ⚠️ Check failed with status [${result.status}]: ${result.error || 'Unknown error'}`);
      
      // Exponential backoff for temporary errors (up to 15 minutes max)
      const backoffFactor = Math.min(Math.pow(2, consecutiveErrors - 1), 6);
      const backoffMs = Math.min(currentIntervalMs * backoffFactor, 15 * 60 * 1000);
      console.log(`[Worker] Backing off: next check in ${Math.round(backoffMs / 1000)}s (consecutive errors: ${consecutiveErrors})`);
      scheduleNext(backoffMs);
      return;
    }
  } catch (err) {
    consecutiveErrors++;
    console.error('[Worker] Fatal error during cycle execution:', err);
  }

  scheduleNext(currentIntervalMs);
}

function scheduleNext(delayMs) {
  if (!isRunning) return;
  console.log(`[Worker] Next check scheduled in ${Math.round(delayMs / 1000)}s...`);
  activeTimer = setTimeout(executeCycle, delayMs);
}

// Graceful termination handling
function handleShutdown(signal) {
  console.log(`\n[Worker] Received ${signal}. Shutting down worker gracefully...`);
  isRunning = false;
  if (activeTimer) {
    clearTimeout(activeTimer);
  }
  console.log('[Worker] Background worker stopped.');
  process.exit(0);
}

process.on('SIGINT', () => handleShutdown('SIGINT'));
process.on('SIGTERM', () => handleShutdown('SIGTERM'));

// Immediate initial execution
executeCycle();
