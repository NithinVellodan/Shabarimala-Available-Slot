'use client';

import { useState, useEffect, useCallback } from 'react';
import Header from '@/components/Header';
import RecipientAlertCard from '@/components/RecipientAlertCard';
// --- Admin/technical imports (commented out — not shown to pilgrims) ---
// import ActivityTimeline from '@/components/ActivityTimeline';
// import ApiStatus from '@/components/ApiStatus';
// import LiveApiPayloadCard from '@/components/LiveApiPayloadCard';
// import StatisticsCards from '@/components/StatisticsCards';
// import MonitoringControls from '@/components/MonitoringControls';
// import MonitoredDates from '@/components/MonitoredDates';
// import AvailabilityCalendar from '@/components/AvailabilityCalendar';

// --- User-facing imports ---
import DevotionalBanner from '@/components/DevotionalBanner';
import SlotsOverview from '@/components/SlotsOverview';
import TermsAndConditions from '@/components/TermsAndConditions';
import { formatISTTime } from '@/lib/dateUtils';
import { Sparkles, ExternalLink, X } from 'lucide-react';

export default function DashboardPage() {
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [apiData, setApiData] = useState(null);
  const [apiHealth, setApiHealth] = useState(null);
  const [settings, setSettings] = useState(null);
  const [monitoredDates, setMonitoredDates] = useState([]);
  const [history, setHistory] = useState([]);
  const [newlyAvailableDates, setNewlyAvailableDates] = useState([]);
  const [selectedDates, setSelectedDates] = useState([]);
  const [lastChecked, setLastChecked] = useState(null);
  const [latency, setLatency] = useState(null);
  const [dataMode, setDataMode] = useState('LIVE');
  const [alertBanner, setAlertBanner] = useState(null);

  // Fetch full state from backend
  const fetchData = useCallback(async (isManual = false) => {
    if (isManual) setIsRefreshing(true);
    try {
      const cacheBuster = Date.now();
      // 1. Fetch Availability with no-store and unique timestamp
      const availRes = await fetch(`/api/availability?refresh=${isManual}&mode=${dataMode}&_t=${cacheBuster}`, {
        cache: 'no-store'
      });
      const availJson = await availRes.json();

      if (availJson.success && availJson.data) {
        setApiData(availJson.data);
        setApiHealth(availJson.health);
        setLastChecked(availJson.checkedAt);
        if (availJson.latency) {
          setLatency(availJson.latency);
        } else if (availJson.data?.latency) {
          setLatency(availJson.data.latency);
        }
      } else {
        setApiHealth(availJson.health || { status: 'NETWORK_ERROR', message: availJson.error });
      }

      // 2. Fetch Monitoring State with no-store
      const monRes = await fetch(`/api/monitoring?_t=${cacheBuster}`, {
        cache: 'no-store'
      });
      const monJson = await monRes.json();
      if (monJson.settings) setSettings(monJson.settings);
      if (monJson.monitoredDates) setMonitoredDates(monJson.monitoredDates);
      if (monJson.history) setHistory(monJson.history);
      if (monJson.settings?.data_mode && monJson.settings.data_mode !== dataMode) {
        setDataMode(monJson.settings.data_mode);
      }

      // Check if newly available dates exist
      if (availJson.data?.newlyAvailableDates && availJson.data.newlyAvailableDates.length > 0) {
        setNewlyAvailableDates(availJson.data.newlyAvailableDates);
        setAlertBanner({
          title: '🚨 New Darshan Slots Available!',
          dates: availJson.data.newlyAvailableDates,
          timestamp: formatISTTime(new Date())
        });
      }
    } catch (err) {
      console.error('Failed to fetch dashboard data:', err);
    } finally {
      setLoading(false);
      if (isManual) setIsRefreshing(false);
    }
  }, [dataMode]);

  // Initial load
  useEffect(() => {
    fetchData(false);
  }, [fetchData]);

  // Periodic polling in browser dashboard (every 60s)
  useEffect(() => {
    const interval = setInterval(() => {
      fetchData(false);
    }, 60000);
    return () => clearInterval(interval);
  }, [fetchData]);

  // Toggle Live vs Mock Mode
  const handleToggleMode = async () => {
    const newMode = dataMode === 'LIVE' ? 'MOCK' : 'LIVE';
    setDataMode(newMode);
    try {
      await fetch('/api/monitoring', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update_settings',
          settings: { data_mode: newMode }
        })
      });
      fetchData(true);
    } catch (e) {
      console.error('Failed to toggle mode:', e);
    }
  };

  // Date selection in Calendar
  const handleSelectDate = (dateStr) => {
    setSelectedDates(prev =>
      prev.includes(dateStr) ? prev.filter(d => d !== dateStr) : [...prev, dateStr]
    );
  };

  // Add selected dates to monitored list
  const handleAddSelectedToMonitoring = async () => {
    if (selectedDates.length === 0) return;
    try {
      const res = await fetch('/api/monitoring', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'add_dates',
          dates: selectedDates
        })
      });
      const json = await res.json();
      if (json.monitoredDates) {
        setMonitoredDates(json.monitoredDates);
        setSelectedDates([]);
      }
    } catch (e) {
      console.error('Failed to add selected dates:', e);
    }
  };

  // Monitor entire season
  const handleMonitorAllDates = async () => {
    try {
      await fetch('/api/monitoring', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update_settings',
          settings: { monitoring_mode: 'ALL' }
        })
      });
      fetchData(true);
    } catch (e) {
      console.error('Failed to monitor all dates:', e);
    }
  };

  // Add single custom date
  const handleAddSingleDate = async (dateStr) => {
    try {
      const res = await fetch('/api/monitoring', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'add_dates',
          dates: [dateStr]
        })
      });
      const json = await res.json();
      if (json.monitoredDates) {
        setMonitoredDates(json.monitoredDates);
      }
    } catch (e) {
      console.error('Failed to add date:', e);
    }
  };

  // Toggle monitoring on specific date
  const handleToggleDate = async (dateStr, enabled) => {
    try {
      const res = await fetch('/api/monitoring', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'toggle_date',
          date: dateStr,
          enabled
        })
      });
      const json = await res.json();
      if (json.monitoredDates) {
        setMonitoredDates(json.monitoredDates);
      }
    } catch (e) {
      console.error('Failed to toggle date:', e);
    }
  };

  // Remove date from monitoring
  const handleRemoveDate = async (dateStr) => {
    try {
      const res = await fetch('/api/monitoring', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'remove_date',
          date: dateStr
        })
      });
      const json = await res.json();
      if (json.monitoredDates) {
        setMonitoredDates(json.monitoredDates);
      }
    } catch (e) {
      console.error('Failed to remove date:', e);
    }
  };

  // Start / Pause monitoring
  const handleStartMonitoring = async () => {
    await fetch('/api/monitoring', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'start' })
    });
    fetchData(false);
  };

  const handlePauseMonitoring = async () => {
    await fetch('/api/monitoring', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'pause' })
    });
    fetchData(false);
  };

  const handleUpdateSettings = async (newSettings) => {
    await fetch('/api/monitoring', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'update_settings', settings: newSettings })
    });
    fetchData(false);
  };

  // Save recipient name & email directly from Dashboard Screen
  const handleSaveAlertRecipient = async (name, email, sendTest) => {
    try {
      const res = await fetch('/api/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'save_alert_recipient',
          name,
          email,
          sendTest
        })
      });
      const json = await res.json();
      if (json.settings) {
        setSettings(json.settings);
      }
      fetchData(false);
      return json;
    } catch (err) {
      return { success: false, error: err.message };
    }
  };

  // Simulate slot release (for demonstration & testing)
  const handleSimulateSlotRelease = async (simDate, makeAvailable) => {
    try {
      // 1. Switch to MOCK mode if not already
      if (dataMode !== 'MOCK') {
        setDataMode('MOCK');
        await fetch('/api/monitoring', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'update_settings',
            settings: { data_mode: 'MOCK' }
          })
        });
      }

      // 2. Trigger mock simulation
      await fetch('/api/availability', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'simulate',
          date: simDate,
          makeAvailable
        })
      });

      // 3. Trigger immediate monitoring cycle to detect change & send Telegram alert
      const refreshRes = await fetch('/api/monitoring', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'refresh' })
      });
      const refreshJson = await refreshRes.json();

      if (makeAvailable) {
        setAlertBanner({
          title: `🚨 Slot Simulation: ${simDate} Released!`,
          dates: [simDate],
          timestamp: formatISTTime(new Date()),
          details: 'Monitoring check detected status transition from BOOKED to AVAILABLE and dispatched Telegram notification logic.'
        });
      } else {
        setAlertBanner(null);
      }

      fetchData(false);
    } catch (e) {
      console.error('Simulation failed:', e);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Header
        apiHealth={apiHealth}
        onRefresh={() => fetchData(true)}
        isRefreshing={isRefreshing}
      />

      <main className="flex-1 w-full max-w-3xl mx-auto px-4 sm:px-6 py-6 space-y-6">

        {/* ── 1. Devotional Banner ──────────────────────── */}
        <DevotionalBanner />

        {/* ── 2. Alert Banner (shown only when new slots detected) ── */}
        {alertBanner && (
          <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-amber-500 to-saffron-600 text-white shadow-lg flex items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-white/20 rounded-xl shrink-0">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="text-base font-black">{alertBanner.title}</h3>
                <p className="text-xs text-white/90 mt-0.5">
                  Dates: <b>{alertBanner.dates.join(', ')}</b> • {alertBanner.timestamp}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <a
                href="https://sabarimalaonline.org/#/darshan"
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-1.5 rounded-lg bg-white text-navy-900 text-xs font-bold flex items-center gap-1.5"
              >
                Book Now <ExternalLink className="w-3.5 h-3.5" />
              </a>
              <button onClick={() => setAlertBanner(null)} className="p-1 rounded-lg hover:bg-white/20">
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* ── 3. Slot Availability (main user section) ─── */}
        <SlotsOverview
          apiData={apiData}
          lastChecked={lastChecked}
          isRefreshing={isRefreshing}
          onRefresh={() => fetchData(true)}
        />

        {/* ── 4. Email Notification Setup ──────────────── */}
        <RecipientAlertCard
          settings={settings}
          onSaveRecipient={handleSaveAlertRecipient}
          onRefresh={() => fetchData(true)}
        />

        {/* ── 5. Terms & Conditions ────────────────────── */}
        <TermsAndConditions />

        {/*
          ── ADMIN / TECHNICAL SECTIONS (hidden from pilgrims) ──
          Uncomment below to restore for admin use.

          <StatisticsCards
            monitoredDatesCount={monitoredDates.length}
            availableDatesCount={apiData?.availableDatesList?.length || 0}
            bookedDatesCount={apiData?.bookedDates?.length || 0}
            blockedDatesCount={apiData?.blockedDates?.length || 0}
            newlyReleasedCount={newlyAvailableDates.length}
            lastChecked={lastChecked}
            apiHealth={apiHealth}
          />

          <MonitoringControls
            settings={settings}
            isRefreshing={isRefreshing}
            onStart={handleStartMonitoring}
            onPause={handlePauseMonitoring}
            onRefresh={() => fetchData(true)}
            onUpdateSettings={handleUpdateSettings}
            onSimulateSlotRelease={handleSimulateSlotRelease}
          />

          <LiveApiPayloadCard
            apiData={apiData}
            apiHealth={apiHealth}
            lastChecked={lastChecked}
            latency={latency}
            isRefreshing={isRefreshing}
            onRefresh={() => fetchData(true)}
          />

          <AvailabilityCalendar
            apiData={apiData}
            monitoredDates={monitoredDates}
            newlyAvailableDates={newlyAvailableDates}
            selectedDates={selectedDates}
            onSelectDate={handleSelectDate}
            onBatchSelect={setSelectedDates}
            onAddSelectedToMonitoring={handleAddSelectedToMonitoring}
            onMonitorAllDates={handleMonitorAllDates}
            lastChecked={lastChecked}
          />

          <MonitoredDates
            monitoredDates={monitoredDates}
            apiData={apiData}
            newlyAvailableDates={newlyAvailableDates}
            lastChecked={lastChecked}
            onToggleDate={handleToggleDate}
            onRemoveDate={handleRemoveDate}
            onAddDate={handleAddSingleDate}
          />

          <ApiStatus
            apiHealth={apiHealth}
            apiData={apiData}
            lastChecked={lastChecked}
            latency={latency}
          />

          <ActivityTimeline
            history={history}
            onRefresh={() => fetchData(true)}
            isRefreshing={isRefreshing}
          />
        */}

      </main>

      {/* Footer */}
      <footer className="mt-auto border-t border-saffron-200 bg-gradient-to-r from-navy-900 via-navy-900 to-navy-800 py-6 text-center text-xs text-slate-400">
        <div className="w-full px-4 sm:px-6 lg:px-8 xl:px-10 2xl:px-12 space-y-4">

          {/* Devotional line */}
          <p className="text-saffron-400 font-bold tracking-widest text-[11px] uppercase">
            🙏 &nbsp; ॐ شبريمالا • Swamiye Saranam Ayyappa • ശബരിമലക്ക് ജയ് &nbsp; 🙏
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-white">
              <span className="font-black text-sm">Sabarimala Slot Alert</span>
              <span className="text-slate-500">•</span>
              <span className="text-slate-400 text-xs">Virtual Q Availability Monitor</span>
            </div>

            <div className="text-center">
              <span className="text-slate-400">Official Booking Gateway: </span>
              <a
                href="https://sabarimalaonline.org/#/darshan"
                target="_blank"
                rel="noopener noreferrer"
                className="text-saffron-400 font-bold hover:text-saffron-300 hover:underline transition-colors"
              >
                sabarimalaonline.org
              </a>
            </div>

            <div className="text-slate-500 text-[11px] text-right">
              <span className="block">Not affiliated with TDB or Kerala Government.</span>
              <span className="block">Informational only • No payment • No booking.</span>
            </div>
          </div>

          <div className="border-t border-navy-800 pt-3 text-[11px] text-slate-600">
            This is a free, independent devotional-service tool. All Darshan bookings must be completed on the official Sabarimala portal.
            Use of this service is subject to our{' '}
            <button
              onClick={() => document.getElementById('terms-section')?.scrollIntoView({ behavior: 'smooth' })}
              className="text-saffron-500 hover:text-saffron-300 underline cursor-pointer transition-colors"
            >
              Terms of Use & Disclaimer
            </button>
            .
          </div>
        </div>
      </footer>
    </div>
  );
}
