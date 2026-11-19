'use client';

import { useState } from 'react';
import {
  Play,
  Pause,
  RefreshCw,
  Sliders,
  Sparkles,
  Zap,
  CheckCircle2,
  Clock,
  Layers,
  HelpCircle
} from 'lucide-react';

export default function MonitoringControls({
  settings = {},
  isRefreshing = false,
  onStart,
  onPause,
  onRefresh,
  onUpdateSettings,
  onSimulateSlotRelease
}) {
  const [showSimModal, setShowSimModal] = useState(false);
  const [simDate, setSimDate] = useState('2026-12-19');

  const isMonitoringActive = settings?.monitoring_enabled ?? true;
  const monitoringMode = settings?.monitoring_mode || 'SELECTED';
  const intervalSeconds = settings?.monitoring_interval || 300;

  const handleModeChange = (mode) => {
    onUpdateSettings({ monitoring_mode: mode });
  };

  const handleIntervalChange = (seconds) => {
    onUpdateSettings({ monitoring_interval: parseInt(seconds, 10) });
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-4 sm:p-6">
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
        
        {/* Left: Status & Engine info */}
        <div>
          <div className="flex items-center gap-3">
            <span className="text-sm font-black uppercase tracking-wider text-slate-500">
              Monitoring Engine
            </span>
            {isMonitoringActive ? (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                ACTIVE & LISTENING
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-300">
                <Pause className="w-3 h-3 text-amber-600" />
                PAUSED
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 mt-1 max-w-xl">
            Independent background worker compares successive availability snapshots, detects newly cancelled or opened slots, and fires immediate Telegram alerts without requiring login credentials.
          </p>
        </div>

        {/* Right: Primary Controls */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-3 w-full lg:w-auto">
          {/* Start / Pause Button */}
          {isMonitoringActive ? (
            <button
              type="button"
              onClick={onPause}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-300 transition-colors shadow-xs"
            >
              <Pause className="w-4 h-4 text-amber-600" />
              <span>Pause Monitoring</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={onStart}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold bg-emerald-600 hover:bg-emerald-700 text-white transition-colors shadow-xs"
            >
              <Play className="w-4 h-4" />
              <span>Resume Monitoring</span>
            </button>
          )}

          {/* Manual Refresh */}
          <button
            type="button"
            onClick={onRefresh}
            disabled={isRefreshing}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold bg-navy-900 hover:bg-navy-800 text-white transition-colors shadow-xs disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-saffron-400' : ''}`} />
            <span>{isRefreshing ? 'Checking API...' : 'Run Check Now'}</span>
          </button>

          {/* Simulate Slot Release Button (for demonstration) */}
          {onSimulateSlotRelease && (
            <button
              type="button"
              onClick={() => setShowSimModal(!showSimModal)}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 transition-colors"
              title="Test the slot alert trigger by simulating an available date"
            >
              <Sparkles className="w-3.5 h-3.5 text-purple-600" />
              <span>Simulate Slot Alert</span>
            </button>
          )}
        </div>
      </div>

      {/* Sub-bar: Configuration options (Mode & Interval) */}
      <div className="mt-5 pt-4 border-t border-slate-100 grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
        
        {/* Monitoring Mode Selection */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-2">
          <span className="font-bold text-navy-900 flex items-center gap-1">
            <Layers className="w-3.5 h-3.5 text-saffron-600" />
            Monitoring Scope:
          </span>
          <div className="inline-flex p-1 bg-slate-100 rounded-lg border border-slate-200">
            <button
              type="button"
              onClick={() => handleModeChange('SELECTED')}
              className={`px-3 py-1 rounded-md font-semibold transition-all ${
                monitoringMode === 'SELECTED'
                  ? 'bg-white text-navy-900 shadow-xs'
                  : 'text-slate-600 hover:text-navy-900'
              }`}
            >
              Mode 1: Selected Dates Only
            </button>
            <button
              type="button"
              onClick={() => handleModeChange('ALL')}
              className={`px-3 py-1 rounded-md font-semibold transition-all ${
                monitoringMode === 'ALL'
                  ? 'bg-white text-navy-900 shadow-xs'
                  : 'text-slate-600 hover:text-navy-900'
              }`}
            >
              Mode 2: All Season Dates
            </button>
          </div>
        </div>

        {/* Polling Interval Selection */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-end gap-2">
          <span className="font-bold text-navy-900 flex items-center gap-1">
            <Clock className="w-3.5 h-3.5 text-saffron-600" />
            Check Interval:
          </span>
          <select
            value={intervalSeconds}
            onChange={(e) => handleIntervalChange(e.target.value)}
            className="px-3 py-1 rounded-lg bg-slate-100 border border-slate-200 text-navy-900 font-semibold focus:outline-none focus:ring-2 focus:ring-saffron-500"
          >
            <option value="60">1 Minute (Testing only)</option>
            <option value="180">3 Minutes</option>
            <option value="300">5 Minutes (Recommended)</option>
            <option value="600">10 Minutes</option>
            <option value="900">15 Minutes</option>
          </select>
        </div>

      </div>

      {/* Simulation Modal / Drawer for QA and demonstration */}
      {showSimModal && (
        <div className="mt-4 p-4 rounded-xl bg-purple-50/70 border border-purple-200 text-xs">
          <div className="flex items-center justify-between mb-2">
            <div className="font-bold text-purple-950 flex items-center gap-1.5">
              <Zap className="w-4 h-4 text-purple-600" />
              <span>Slot Availability Simulator</span>
            </div>
            <button
              onClick={() => setShowSimModal(false)}
              className="text-purple-600 hover:text-purple-900 font-bold"
            >
              ✕
            </button>
          </div>
          <p className="text-purple-800 text-[11px] mb-3">
            Since real Darshan slots depend on devotee cancellations, use this testing tool to simulate a booked date becoming available (e.g. <b>2026-12-19</b>). The monitoring engine will detect the status transition and trigger Telegram notification logic.
          </p>
          <div className="flex flex-wrap items-center gap-2">
            <input
              type="date"
              value={simDate}
              onChange={(e) => setSimDate(e.target.value)}
              className="px-3 py-1 rounded border border-purple-300 bg-white text-navy-900"
            />
            <button
              type="button"
              onClick={() => {
                onSimulateSlotRelease(simDate, true);
                setShowSimModal(false);
              }}
              className="px-3 py-1 rounded bg-purple-700 hover:bg-purple-800 text-white font-bold transition-colors"
            >
              Make Available & Run Detection
            </button>
            <button
              type="button"
              onClick={() => {
                onSimulateSlotRelease(simDate, false);
                setShowSimModal(false);
              }}
              className="px-3 py-1 rounded bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold transition-colors"
            >
              Reset to Booked
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
