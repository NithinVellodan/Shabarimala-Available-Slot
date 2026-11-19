'use client';

import { useState, useEffect, useCallback } from 'react';
import Header from '@/components/Header';
import StatisticsCards from '@/components/StatisticsCards';
import AvailabilityCalendar from '@/components/AvailabilityCalendar';
import MonitoredDates from '@/components/MonitoredDates';
import MonitoringControls from '@/components/MonitoringControls';
import ActivityTimeline from '@/components/ActivityTimeline';
import ApiStatus from '@/components/ApiStatus';
import { Sparkles, ExternalLink, AlertCircle, X } from 'lucide-react';

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
      // 1. Fetch Availability
      const availRes = await fetch(`/api/availability?refresh=${isManual}&mode=${dataMode}`);
      const availJson = await availRes.json();

      if (availJson.success) {
        setApiData(availJson.data);
        setApiHealth(availJson.health);
        setLastChecked(availJson.checkedAt);
        if (availJson.data?.latency) setLatency(availJson.data.latency);
      } else {
        setApiHealth(availJson.health || { status: 'NETWORK_ERROR', message: availJson.error });
      }

      // 2. Fetch Monitoring State
      const monRes = await fetch('/api/monitoring');
      const monJson = await monRes.json();
      if (monJson.settings) setSettings(monJson.settings);
      if (monJson.monitoredDates) setMonitoredDates(monJson.monitoredDates);
      if (monJson.history) setHistory(monJson.history);
      if (monJson.settings?.data_mode) setDataMode(monJson.settings.data_mode);

      // Check if newly available dates exist
      if (availJson.data?.newlyAvailableDates && availJson.data.newlyAvailableDates.length > 0) {
        setNewlyAvailableDates(availJson.data.newlyAvailableDates);
        setAlertBanner({
          title: '🚨 New Darshan Slots Available!',
          dates: availJson.data.newlyAvailableDates,
          timestamp: new Date().toLocaleTimeString()
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
          timestamp: new Date().toLocaleTimeString(),
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
        dataMode={dataMode}
        onToggleMode={handleToggleMode}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        
        {/* Alert Banner for newly available slots */}
        {alertBanner && (
          <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-amber-500 to-saffron-600 text-white shadow-lg flex items-start justify-between gap-4 animate-in fade-in slide-in-from-top-4 duration-300">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-white/20 rounded-xl backdrop-blur-sm shrink-0">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="text-base font-black tracking-tight">
                  {alertBanner.title}
                </h3>
                <p className="text-xs text-white/90 mt-0.5">
                  Available Dates: <b>{alertBanner.dates.join(', ')}</b> • Detected at {alertBanner.timestamp}
                </p>
                {alertBanner.details && (
                  <p className="text-[11px] text-white/80 mt-1 font-mono">
                    {alertBanner.details}
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <a
                href="https://sabarimalaonline.org/#/darshan"
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-1.5 rounded-lg bg-white text-navy-900 text-xs font-bold shadow-sm hover:bg-slate-100 flex items-center gap-1.5 transition-colors"
              >
                <span>Book on Official Portal</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
              <button
                type="button"
                onClick={() => setAlertBanner(null)}
                className="p-1 rounded-lg hover:bg-white/20 text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* 1. Statistics Cards */}
        <StatisticsCards
          monitoredDatesCount={monitoredDates.length}
          availableDatesCount={apiData?.availableDatesList?.length || 0}
          bookedDatesCount={apiData?.bookedDates?.length || 0}
          blockedDatesCount={apiData?.blockedDates?.length || 0}
          newlyReleasedCount={newlyAvailableDates.length}
          lastChecked={lastChecked}
          apiHealth={apiHealth}
        />

        {/* 2. Monitoring Engine Controls */}
        <MonitoringControls
          settings={settings}
          isRefreshing={isRefreshing}
          onStart={handleStartMonitoring}
          onPause={handlePauseMonitoring}
          onRefresh={() => fetchData(true)}
          onUpdateSettings={handleUpdateSettings}
          onSimulateSlotRelease={handleSimulateSlotRelease}
        />

        {/* 3. Availability Calendar */}
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

        {/* 4. Monitored Dates Management */}
        <MonitoredDates
          monitoredDates={monitoredDates}
          apiData={apiData}
          newlyAvailableDates={newlyAvailableDates}
          lastChecked={lastChecked}
          onToggleDate={handleToggleDate}
          onRemoveDate={handleRemoveDate}
          onAddDate={handleAddSingleDate}
        />

        {/* 5. Gateway Health & Technical Diagnostics */}
        <ApiStatus
          apiHealth={apiHealth}
          apiData={apiData}
          lastChecked={lastChecked}
          latency={latency}
        />

        {/* 6. Activity Timeline */}
        <ActivityTimeline
          history={history}
          onRefresh={() => fetchData(true)}
          isRefreshing={isRefreshing}
        />

      </main>

      {/* Footer */}
      <footer className="mt-auto border-t border-slate-200 bg-white py-6 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="font-bold text-navy-900">Sabarimala Slot Alert</span>
            <span>•</span>
            <span>Virtual Q Availability Monitor</span>
          </div>
          <div>
            Official Booking Gateway:{' '}
            <a
              href="https://sabarimalaonline.org/#/darshan"
              target="_blank"
              rel="noopener noreferrer"
              className="text-saffron-700 font-semibold hover:underline"
            >
              sabarimalaonline.org
            </a>
          </div>
          <div className="text-slate-400 text-[11px]">
            Devotees must complete actual Darshan booking on the official portal.
          </div>
        </div>
      </footer>
    </div>
  );
}
