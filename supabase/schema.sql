-- Sabarimala Slot Alert - Supabase Schema
-- Run this script in the Supabase SQL Editor to initialize all tables, indexes, and RLS policies.

-- Enable UUID extension if not enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Monitored Dates Table
CREATE TABLE IF NOT EXISTS monitored_dates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    darshan_date DATE NOT NULL UNIQUE,
    monitoring_enabled BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_monitored_dates_date ON monitored_dates(darshan_date);
CREATE INDEX IF NOT EXISTS idx_monitored_dates_enabled ON monitored_dates(monitoring_enabled);

-- 2. Availability Snapshots Table
CREATE TABLE IF NOT EXISTS availability_snapshots (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    available_dates JSONB NOT NULL DEFAULT '[]'::jsonb,
    booked_dates JSONB NOT NULL DEFAULT '[]'::jsonb,
    blocked_dates JSONB NOT NULL DEFAULT '[]'::jsonb,
    start_date DATE,
    end_date DATE,
    checked_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    request_status TEXT NOT NULL DEFAULT 'CONNECTED'
);

CREATE INDEX IF NOT EXISTS idx_availability_snapshots_checked_at ON availability_snapshots(checked_at DESC);

-- 3. Availability History Table
CREATE TABLE IF NOT EXISTS availability_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    darshan_date DATE NOT NULL,
    previous_status TEXT NOT NULL,
    current_status TEXT NOT NULL,
    detected_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_availability_history_detected_at ON availability_history(detected_at DESC);
CREATE INDEX IF NOT EXISTS idx_availability_history_date ON availability_history(darshan_date);

-- 4. Notification Logs Table
CREATE TABLE IF NOT EXISTS notification_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    darshan_date DATE NOT NULL,
    notification_type TEXT NOT NULL DEFAULT 'TELEGRAM',
    delivery_status TEXT NOT NULL DEFAULT 'SENT',
    sent_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    error_message TEXT
);

CREATE INDEX IF NOT EXISTS idx_notification_logs_sent_at ON notification_logs(sent_at DESC);

-- 5. Monitoring Settings Table
CREATE TABLE IF NOT EXISTS monitoring_settings (
    id TEXT PRIMARY KEY DEFAULT 'default',
    monitoring_enabled BOOLEAN NOT NULL DEFAULT true,
    monitoring_interval INTEGER NOT NULL DEFAULT 300, -- seconds
    notification_enabled BOOLEAN NOT NULL DEFAULT true,
    monitoring_mode TEXT NOT NULL DEFAULT 'SELECTED', -- 'SELECTED' or 'ALL'
    data_mode TEXT NOT NULL DEFAULT 'LIVE', -- 'LIVE' or 'MOCK'
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Insert default settings row if not exists
INSERT INTO monitoring_settings (id, monitoring_enabled, monitoring_interval, notification_enabled, monitoring_mode, data_mode)
VALUES ('default', true, 300, true, 'SELECTED', 'LIVE')
ON CONFLICT (id) DO NOTHING;

-- Row Level Security (RLS) Configuration
ALTER TABLE monitored_dates ENABLE ROW LEVEL SECURITY;
ALTER TABLE availability_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE availability_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE monitoring_settings ENABLE ROW LEVEL SECURITY;

-- Allow read/write for authenticated and public anon users with API key
CREATE POLICY "Allow anon read monitored_dates" ON monitored_dates FOR SELECT USING (true);
CREATE POLICY "Allow anon insert/update monitored_dates" ON monitored_dates FOR ALL USING (true);

CREATE POLICY "Allow anon read availability_snapshots" ON availability_snapshots FOR SELECT USING (true);
CREATE POLICY "Allow anon insert availability_snapshots" ON availability_snapshots FOR ALL USING (true);

CREATE POLICY "Allow anon read availability_history" ON availability_history FOR SELECT USING (true);
CREATE POLICY "Allow anon insert availability_history" ON availability_history FOR ALL USING (true);

CREATE POLICY "Allow anon read notification_logs" ON notification_logs FOR SELECT USING (true);
CREATE POLICY "Allow anon insert notification_logs" ON notification_logs FOR ALL USING (true);

CREATE POLICY "Allow anon read monitoring_settings" ON monitoring_settings FOR SELECT USING (true);
CREATE POLICY "Allow anon update monitoring_settings" ON monitoring_settings FOR ALL USING (true);
