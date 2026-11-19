'use client';

import { useState, useEffect } from 'react';
import Header from '@/components/Header';
import TelegramSettings from '@/components/TelegramSettings';
import EmailSettings from '@/components/EmailSettings';
import {
  Settings,
  Database,
  Server,
  Cloud,
  CheckCircle,
  Copy,
  Check,
  Code2,
  ExternalLink,
  Shield,
  Bell,
  Mail,
  Send
} from 'lucide-react';

export default function SettingsPage() {
  const [loading, setLoading] = useState(true);
  const [notificationConfig, setNotificationConfig] = useState(null);
  const [logs, setLogs] = useState([]);
  const [settings, setSettings] = useState(null);
  const [apiHealth, setApiHealth] = useState(null);
  const [copiedSql, setCopiedSql] = useState(false);
  const [activeTab, setActiveTab] = useState('ALL'); // 'ALL' | 'TELEGRAM' | 'EMAIL'

  const loadSettings = async () => {
    try {
      const notifRes = await fetch('/api/notifications');
      const notifJson = await notifRes.json();
      setNotificationConfig(notifJson);
      setLogs(notifJson.logs || []);

      const monRes = await fetch('/api/monitoring');
      const monJson = await monRes.json();
      setSettings(monJson.settings);
      setApiHealth(monJson.health);
    } catch (e) {
      console.error('Failed to load settings:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSettings();
  }, []);

  // Telegram Handlers
  const handleSendTestNotification = async (token, chatId) => {
    const res = await fetch('/api/notifications', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'test', token, chatId })
    });
    return await res.json();
  };

  const handleToggleNotification = async (enabled) => {
    const res = await fetch('/api/notifications', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'toggle', enabled })
    });
    const json = await res.json();
    if (json.settings) {
      setSettings(json.settings);
      loadSettings();
    }
  };

  // Email Handlers
  const handleSendTestEmail = async (user, pass, recipient) => {
    const res = await fetch('/api/notifications', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'test_email', user, pass, recipient })
    });
    return await res.json();
  };

  const handleToggleEmail = async (enabled) => {
    const res = await fetch('/api/notifications', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'toggle_email', enabled })
    });
    const json = await res.json();
    if (json.settings) {
      setSettings(json.settings);
      loadSettings();
    }
  };

  const handleSaveRecipientEmail = async (recipient) => {
    const res = await fetch('/api/notifications', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'save_recipient_email', recipient })
    });
    const json = await res.json();
    if (json.settings) {
      setSettings(json.settings);
      loadSettings();
    }
  };

  const handleUpdateMonitoringSettings = async (updates) => {
    const res = await fetch('/api/monitoring', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'update_settings', settings: updates })
    });
    const json = await res.json();
    if (json.settings) {
      setSettings(json.settings);
    }
  };

  const sampleSql = `-- Run this in Supabase SQL editor:
CREATE TABLE IF NOT EXISTS monitored_dates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    darshan_date DATE NOT NULL UNIQUE,
    monitoring_enabled BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS availability_snapshots (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    available_dates JSONB NOT NULL DEFAULT '[]'::jsonb,
    booked_dates JSONB NOT NULL DEFAULT '[]'::jsonb,
    blocked_dates JSONB NOT NULL DEFAULT '[]'::jsonb,
    start_date DATE,
    end_date DATE,
    checked_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    request_status TEXT NOT NULL DEFAULT 'CONNECTED'
);

CREATE TABLE IF NOT EXISTS availability_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    darshan_date DATE NOT NULL,
    previous_status TEXT NOT NULL,
    current_status TEXT NOT NULL,
    detected_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS notification_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    darshan_date DATE NOT NULL,
    notification_type TEXT NOT NULL DEFAULT 'TELEGRAM',
    delivery_status TEXT NOT NULL DEFAULT 'SENT',
    sent_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    error_message TEXT
);

CREATE TABLE IF NOT EXISTS monitoring_settings (
    id TEXT PRIMARY KEY DEFAULT 'default',
    monitoring_enabled BOOLEAN NOT NULL DEFAULT true,
    monitoring_interval INTEGER NOT NULL DEFAULT 300,
    notification_enabled BOOLEAN NOT NULL DEFAULT true,
    email_notification_enabled BOOLEAN NOT NULL DEFAULT true,
    alert_recipient_email TEXT,
    monitoring_mode TEXT NOT NULL DEFAULT 'SELECTED',
    data_mode TEXT NOT NULL DEFAULT 'LIVE',
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);`;

  const copySql = () => {
    navigator.clipboard.writeText(sampleSql);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 2000);
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Header apiHealth={apiHealth} />

      <main className="flex-1 w-full px-4 sm:px-6 lg:px-8 xl:px-10 2xl:px-12 py-6 space-y-6">
        
        {/* Title */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-saffron-50 text-saffron-700">
              <Settings className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-black tracking-tight text-navy-900">
                Alert Channels & Settings
              </h2>
              <p className="text-xs text-slate-500">
                Configure your free Telegram and Gmail alerts, monitoring worker cadence, Supabase persistence, and cloud hosting.
              </p>
            </div>
          </div>

          {/* Quick channel tabs */}
          <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-slate-200 shadow-2xs text-xs font-bold">
            <button
              onClick={() => setActiveTab('ALL')}
              className={`px-3 py-1.5 rounded-lg transition-colors ${activeTab === 'ALL' ? 'bg-navy-900 text-white' : 'text-slate-600 hover:text-navy-900'}`}
            >
              All Alerts
            </button>
            <button
              onClick={() => setActiveTab('TELEGRAM')}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors ${activeTab === 'TELEGRAM' ? 'bg-sky-600 text-white' : 'text-slate-600 hover:text-navy-900'}`}
            >
              <Send className="w-3.5 h-3.5" />
              <span>Telegram</span>
            </button>
            <button
              onClick={() => setActiveTab('EMAIL')}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors ${activeTab === 'EMAIL' ? 'bg-saffron-600 text-white' : 'text-slate-600 hover:text-navy-900'}`}
            >
              <Mail className="w-3.5 h-3.5" />
              <span>Gmail (Free)</span>
            </button>
          </div>
        </div>

        {/* 1. Telegram Notifications */}
        {(activeTab === 'ALL' || activeTab === 'TELEGRAM') && (
          <TelegramSettings
            notificationConfig={notificationConfig?.telegram || notificationConfig}
            logs={logs.filter(l => l.notification_type === 'TELEGRAM')}
            onSendTestNotification={handleSendTestNotification}
            onToggleNotification={handleToggleNotification}
          />
        )}

        {/* 2. Free Gmail Email Notifications */}
        {(activeTab === 'ALL' || activeTab === 'EMAIL') && (
          <EmailSettings
            emailConfig={notificationConfig?.email}
            onSendTestEmail={handleSendTestEmail}
            onToggleEmail={handleToggleEmail}
            onSaveRecipientEmail={handleSaveRecipientEmail}
          />
        )}

        {/* 3. Monitoring Engine Settings */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 sm:p-6">
          <div className="flex items-center gap-2 mb-4">
            <Server className="w-5 h-5 text-saffron-600" />
            <h3 className="text-base font-black tracking-tight text-navy-900">
              Monitoring Engine Parameters
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            {/* Polling Interval */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
              <label className="font-bold text-navy-900 block mb-1">
                Polling Frequency
              </label>
              <p className="text-slate-500 text-[11px] mb-3">
                Frequency at which the worker requests the official Sabarimala summary.
              </p>
              <select
                value={settings?.monitoring_interval || 300}
                onChange={(e) => handleUpdateMonitoringSettings({ monitoring_interval: parseInt(e.target.value, 10) })}
                className="w-full px-3 py-2 rounded-lg bg-white border border-slate-300 font-semibold text-navy-900 focus:outline-none focus:ring-2 focus:ring-saffron-500"
              >
                <option value="60">1 Minute (Testing only)</option>
                <option value="180">3 Minutes</option>
                <option value="300">5 Minutes (Recommended standard)</option>
                <option value="600">10 Minutes</option>
                <option value="900">15 Minutes</option>
              </select>
            </div>

            {/* Monitoring Scope */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
              <label className="font-bold text-navy-900 block mb-1">
                Monitoring Scope
              </label>
              <p className="text-slate-500 text-[11px] mb-3">
                Which dates trigger notifications when they transition from Booked to Available.
              </p>
              <select
                value={settings?.monitoring_mode || 'SELECTED'}
                onChange={(e) => handleUpdateMonitoringSettings({ monitoring_mode: e.target.value })}
                className="w-full px-3 py-2 rounded-lg bg-white border border-slate-300 font-semibold text-navy-900 focus:outline-none focus:ring-2 focus:ring-saffron-500"
              >
                <option value="SELECTED">Mode 1: Monitored Dates Only</option>
                <option value="ALL">Mode 2: All Season Dates (Devaswom Range)</option>
              </select>
            </div>

            {/* Data Mode */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
              <label className="font-bold text-navy-900 block mb-1">
                Availability Provider Mode
              </label>
              <p className="text-slate-500 text-[11px] mb-3">
                Switch between live official endpoint and mock simulation engine.
              </p>
              <select
                value={settings?.data_mode || 'LIVE'}
                onChange={(e) => handleUpdateMonitoringSettings({ data_mode: e.target.value })}
                className="w-full px-3 py-2 rounded-lg bg-white border border-slate-300 font-semibold text-navy-900 focus:outline-none focus:ring-2 focus:ring-saffron-500"
              >
                <option value="LIVE">Live Official Sabarimala API</option>
                <option value="MOCK">Mock Simulation (For QA / Testing)</option>
              </select>
            </div>
          </div>
        </div>

        {/* 4. Supabase Database & Persistence */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 sm:p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Database className="w-5 h-5 text-emerald-600" />
              <div>
                <h3 className="text-base font-black tracking-tight text-navy-900">
                  Supabase Database Integration
                </h3>
                <p className="text-xs text-slate-500">
                  Dual-mode persistence: Connected to Supabase PostgreSQL or active local storage fallback.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={copySql}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
            >
              {copiedSql ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedSql ? 'Copied SQL' : 'Copy Schema SQL'}</span>
            </button>
          </div>

          <div className="p-3.5 rounded-xl bg-emerald-50/60 border border-emerald-200 text-xs text-emerald-900 flex items-start gap-2.5 mb-4">
            <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <b>Automated Fallback Active:</b> If Supabase credentials are not supplied in <code className="bg-white px-1 py-0.5 rounded text-[11px] font-mono">.env</code>, the application persists monitored dates and history to local file storage (<code className="bg-white px-1 py-0.5 rounded text-[11px] font-mono">.data/store.json</code>). When you add your Supabase URL & keys, it immediately switches to cloud PostgreSQL with zero code changes.
            </div>
          </div>

          <details className="mt-2 text-xs">
            <summary className="font-semibold text-slate-700 cursor-pointer hover:text-navy-900">
              View Supabase SQL Schema (5 Tables with RLS)
            </summary>
            <pre className="mt-2 p-3.5 rounded-xl bg-slate-900 text-slate-200 font-mono text-[11px] overflow-x-auto max-h-56 leading-relaxed">
              {sampleSql}
            </pre>
          </details>
        </div>

        {/* 5. Railway / Render Worker Deployment Guide */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 sm:p-6">
          <div className="flex items-center gap-2 mb-3">
            <Cloud className="w-5 h-5 text-indigo-600" />
            <h3 className="text-base font-black tracking-tight text-navy-900">
              24/7 Monitoring Worker Deployment (Railway / Render)
            </h3>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed mb-4">
            To ensure slot alerts are dispatched around the clock even when your browser is closed, run the dedicated worker script (<code className="bg-slate-100 px-1 py-0.5 rounded font-mono text-navy-900">workers/availabilityWorker.js</code>) on a background service like Railway or Render:
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
              <div className="font-bold text-navy-900 mb-1">Railway Setup</div>
              <ol className="list-decimal list-inside space-y-1.5 text-slate-600">
                <li>Deploy this repo to Railway as a <b>Service</b>.</li>
                <li>Set <b>Start Command</b> to: <code className="font-mono bg-white px-1 py-0.5 rounded text-navy-900">npm run worker</code></li>
                <li>Add environment variables: <code className="font-mono bg-white px-1 py-0.5 rounded text-navy-900">TELEGRAM_BOT_TOKEN</code>, <code className="font-mono bg-white px-1 py-0.5 rounded text-navy-900">TELEGRAM_CHAT_ID</code>, <code className="font-mono bg-white px-1 py-0.5 rounded text-navy-900">GMAIL_USER</code>, <code className="font-mono bg-white px-1 py-0.5 rounded text-navy-900">GMAIL_APP_PASSWORD</code></li>
              </ol>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
              <div className="font-bold text-navy-900 mb-1">Render Setup</div>
              <ol className="list-decimal list-inside space-y-1.5 text-slate-600">
                <li>Create a <b>Background Worker</b> on Render.</li>
                <li>Set <b>Build Command</b>: <code className="font-mono bg-white px-1 py-0.5 rounded text-navy-900">npm install</code></li>
                <li>Set <b>Start Command</b>: <code className="font-mono bg-white px-1 py-0.5 rounded text-navy-900">npm run worker</code></li>
                <li>Attach your Telegram, Gmail, and Supabase environment variables.</li>
              </ol>
            </div>
          </div>
        </div>

      </main>
    </div>
  );
}
