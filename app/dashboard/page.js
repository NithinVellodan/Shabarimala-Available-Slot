'use client';

import { useState, useEffect, useCallback } from 'react';
import Header from '@/components/Header';
import DevotionalBanner from '@/components/DevotionalBanner';
import AvailableSlotsCard from '@/components/AvailableSlotsCard';
import AvailabilityCalendar from '@/components/AvailabilityCalendar';
import RecipientAlertCard from '@/components/RecipientAlertCard';
import TermsAndConditions from '@/components/TermsAndConditions';
import { formatISTTime } from '@/lib/dateUtils';
import { Sparkles, ExternalLink, X } from 'lucide-react';

// ── ADMIN/TECHNICAL COMPONENTS (commented out for pilgrim-facing view) ──────
// import StatisticsCards from '@/components/StatisticsCards';
// import MonitoringControls from '@/components/MonitoringControls';
// import LiveApiPayloadCard from '@/components/LiveApiPayloadCard';
// import ApiStatus from '@/components/ApiStatus';
// import ActivityTimeline from '@/components/ActivityTimeline';
// import MonitoredDates from '@/components/MonitoredDates';
// ─────────────────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [apiData, setApiData] = useState(null);
  const [apiHealth, setApiHealth] = useState(null);
  const [settings, setSettings] = useState(null);
  const [lastChecked, setLastChecked] = useState(null);
  const [newlyAvailableDates, setNewlyAvailableDates] = useState([]);
  const [alertBanner, setAlertBanner] = useState(null);

  // ── ADMIN STATE (kept but unused in public view) ─────────────────────────
  // const [monitoredDates, setMonitoredDates] = useState([]);
  // const [history, setHistory] = useState([]);
  // const [selectedDates, setSelectedDates] = useState([]);
  // const [latency, setLatency] = useState(null);
  // const [dataMode, setDataMode] = useState('LIVE');
  // ─────────────────────────────────────────────────────────────────────────

  const fetchData = useCallback(async (isManual = false) => {
    if (isManual) setIsRefreshing(true);
    try {
      const cacheBuster = Date.now();

      // 1. Fetch live availability
      const availRes = await fetch(`/api/availability?refresh=${isManual}&mode=LIVE&_t=${cacheBuster}`, {
        cache: 'no-store'
      });
      const availJson = await availRes.json();

      if (availJson.success && availJson.data) {
        setApiData(availJson.data);
        setApiHealth(availJson.health);
        setLastChecked(availJson.checkedAt);
      } else {
        setApiHealth(availJson.health || { status: 'NETWORK_ERROR', message: availJson.error });
      }

      // 2. Fetch settings (for notification recipient)
      const monRes = await fetch(`/api/monitoring?_t=${cacheBuster}`, { cache: 'no-store' });
      const monJson = await monRes.json();
      if (monJson.settings) setSettings(monJson.settings);

      // 3. Notify if newly available dates detected
      if (availJson.data?.newlyAvailableDates?.length > 0) {
        setNewlyAvailableDates(availJson.data.newlyAvailableDates);
        setAlertBanner({
          title: '🚨 New Darshan Slots Available!',
          dates: availJson.data.newlyAvailableDates,
          timestamp: formatISTTime(new Date())
        });
      }

      // ── ADMIN fetches (commented out for public view) ─────────────────
      // if (monJson.monitoredDates) setMonitoredDates(monJson.monitoredDates);
      // if (monJson.history) setHistory(monJson.history);
      // if (availJson.latency) setLatency(availJson.latency);
      // ───────────────────────────────────────────────────────────────────

    } catch (err) {
      console.error('Failed to fetch dashboard data:', err);
    } finally {
      setLoading(false);
      if (isManual) setIsRefreshing(false);
    }
  }, []);

  // Initial load
  useEffect(() => { fetchData(false); }, [fetchData]);

  // Auto-refresh every 60 seconds
  useEffect(() => {
    const interval = setInterval(() => fetchData(false), 60000);
    return () => clearInterval(interval);
  }, [fetchData]);

  // Save notification recipient
  const handleSaveAlertRecipient = async (name, email, sendTest) => {
    try {
      const res = await fetch('/api/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'save_alert_recipient', name, email, sendTest })
      });
      const json = await res.json();
      if (json.settings) setSettings(json.settings);
      fetchData(false);
      return json;
    } catch (err) {
      return { success: false, error: err.message };
    }
  };

  // ── ADMIN HANDLERS (kept for future admin panel use) ──────────────────────
  // const handleToggleMode = async () => { ... }
  // const handleSelectDate = (dateStr) => { ... }
  // const handleAddSelectedToMonitoring = async () => { ... }
  // const handleMonitorAllDates = async () => { ... }
  // const handleAddSingleDate = async (dateStr) => { ... }
  // const handleToggleDate = async (dateStr, enabled) => { ... }
  // const handleRemoveDate = async (dateStr) => { ... }
  // const handleStartMonitoring = async () => { ... }
  // const handlePauseMonitoring = async () => { ... }
  // const handleUpdateSettings = async (newSettings) => { ... }
  // const handleSimulateSlotRelease = async (simDate, makeAvailable) => { ... }
  // ─────────────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Header
        apiHealth={apiHealth}
        onRefresh={() => fetchData(true)}
        isRefreshing={isRefreshing}
        // dataMode and onToggleMode hidden from pilgrim view
      />

      <main className="flex-1 w-full max-w-4xl mx-auto px-4 sm:px-6 py-6 space-y-6">

        {/* ── NEW SLOT ALERT BANNER ─────────────────────────────────────── */}
        {alertBanner && (
          <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-500 to-saffron-600 text-white shadow-lg flex items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-white/20 rounded-xl shrink-0">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="text-base font-black">{alertBanner.title}</h3>
                <p className="text-xs text-white/90 mt-0.5">
                  Available: <b>{alertBanner.dates.join(', ')}</b> • Detected at {alertBanner.timestamp}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <a
                href="https://sabarimalaonline.org/#/darshan"
                target="_blank" rel="noopener noreferrer"
                className="px-3 py-1.5 rounded-lg bg-white text-navy-900 text-xs font-bold flex items-center gap-1.5 hover:bg-slate-100 transition-colors"
              >
                Book Now <ExternalLink className="w-3.5 h-3.5" />
              </a>
              <button type="button" onClick={() => setAlertBanner(null)}
                className="p-1 rounded-lg hover:bg-white/20 text-white">
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* ── 1. DEVOTIONAL BANNER ─────────────────────────────────────── */}
        <DevotionalBanner />

        {/* ── 2. AVAILABLE SLOTS HERO ──────────────────────────────────── */}
        <AvailableSlotsCard
          apiData={apiData}
          lastChecked={lastChecked}
          isRefreshing={isRefreshing}
          onRefresh={() => fetchData(true)}
        />

        {/* ── 3. AVAILABILITY CALENDAR ─────────────────────────────────── */}
        <AvailabilityCalendar
          apiData={apiData}
          monitoredDates={[]}
          newlyAvailableDates={newlyAvailableDates}
          selectedDates={[]}
          lastChecked={lastChecked}
          // Admin callbacks removed from pilgrim view:
          // onSelectDate={handleSelectDate}
          // onBatchSelect={setSelectedDates}
          // onAddSelectedToMonitoring={handleAddSelectedToMonitoring}
          // onMonitorAllDates={handleMonitorAllDates}
        />

        {/* ── 4. NOTIFICATION ALERT SETUP ──────────────────────────────── */}
        <div id="alert-setup">
          <RecipientAlertCard
            settings={settings}
            onSaveRecipient={handleSaveAlertRecipient}
            onRefresh={() => fetchData(true)}
          />
        </div>

        {/* ── 5. TERMS & CONDITIONS ────────────────────────────────────── */}
        <TermsAndConditions />

        {/* ── ADMIN SECTIONS (commented out, kept for admin panel) ─────────
        <StatisticsCards ... />
        <MonitoringControls ... />
        <LiveApiPayloadCard ... />
        <MonitoredDates ... />
        <ApiStatus ... />
        <ActivityTimeline ... />
        ─────────────────────────────────────────────────────────────────── */}

      </main>

      {/* ── FOOTER ───────────────────────────────────────────────────────── */}
      <footer className="mt-auto border-t border-saffron-200 bg-gradient-to-r from-navy-900 to-navy-800 py-6">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 space-y-3">

          <p className="text-saffron-400 font-bold tracking-widest text-[11px] uppercase text-center">
            🙏 &nbsp; Swamiye Saranam Ayyappa &nbsp; • &nbsp; ॐ &nbsp; • &nbsp; ശബരിമലക്ക് ജയ് &nbsp; 🙏
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
            <div className="text-white font-black">Sabarimala Slot Alert</div>
            <div>
              <span className="text-slate-400">Official booking: </span>
              <a href="https://sabarimalaonline.org/#/darshan" target="_blank" rel="noopener noreferrer"
                className="text-saffron-400 font-bold hover:text-saffron-300 hover:underline">
                sabarimalaonline.org
              </a>
            </div>
            <div className="text-slate-500 text-[11px] text-center sm:text-right">
              Informational only • No payment • No booking
            </div>
          </div>

          <p className="text-[11px] text-slate-600 text-center border-t border-navy-800 pt-3">
            Not affiliated with TDB or Kerala Government. Use of this service is subject to our{' '}
            <button onClick={() => document.getElementById('terms-section')?.scrollIntoView({ behavior: 'smooth' })}
              className="text-saffron-500 hover:text-saffron-300 underline cursor-pointer">
              Terms of Use
            </button>.
          </p>
        </div>
      </footer>
    </div>
  );
}
