// Supabase Client and Database Layer with local fallback
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseKey);

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseKey, {
      auth: { persistSession: false }
    })
  : null;

// Local persistent file store for development/standalone run without Supabase
const DATA_DIR = path.join(process.cwd(), '.data');
const DB_FILE = path.join(DATA_DIR, 'store.json');

// Initial in-memory state
const initialData = {
  monitored_dates: [
    { id: '1', darshan_date: '2026-12-19', monitoring_enabled: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
    { id: '2', darshan_date: '2026-12-20', monitoring_enabled: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
    { id: '3', darshan_date: '2026-12-25', monitoring_enabled: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
    { id: '4', darshan_date: '2027-01-07', monitoring_enabled: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  ],
  availability_snapshots: [],
  availability_history: [
    {
      id: 'h-1',
      darshan_date: '2027-01-07',
      previous_status: 'BOOKED',
      current_status: 'AVAILABLE',
      detected_at: new Date(Date.now() - 3600000 * 2).toISOString()
    }
  ],
  notification_logs: [
    {
      id: 'n-1',
      darshan_date: '2027-01-07',
      notification_type: 'TELEGRAM',
      delivery_status: 'SENT',
      sent_at: new Date(Date.now() - 3600000 * 2).toISOString(),
      error_message: null
    }
  ],
  monitoring_settings: {
    id: 'default',
    monitoring_enabled: true,
    monitoring_interval: 300,
    notification_enabled: true,
    monitoring_mode: 'SELECTED',
    data_mode: process.env.NEXT_PUBLIC_DEFAULT_DATA_MODE || 'LIVE',
    updated_at: new Date().toISOString()
  }
};

let memoryStore = { ...initialData };

function readLocalStore() {
  try {
    if (typeof window === 'undefined') {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      if (!fs.existsSync(DB_FILE)) {
        fs.writeFileSync(DB_FILE, JSON.stringify(initialData, null, 2), 'utf-8');
        return initialData;
      }
      const raw = fs.readFileSync(DB_FILE, 'utf-8');
      return JSON.parse(raw);
    }
    return memoryStore;
  } catch (err) {
    console.warn('[DB] Fallback reading local store:', err.message);
    return memoryStore;
  }
}

function writeLocalStore(data) {
  memoryStore = data;
  try {
    if (typeof window === 'undefined') {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
    }
  } catch (err) {
    console.warn('[DB] Fallback writing local store:', err.message);
  }
}

export const db = {
  /**
   * Monitored Dates
   */
  async getMonitoredDates() {
    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase
          .from('monitored_dates')
          .select('*')
          .order('darshan_date', { ascending: true });
        if (!error && data) return data;
        console.warn('[Supabase] Error fetching monitored dates, falling back:', error?.message);
      } catch (e) {
        console.warn('[Supabase] Exception:', e.message);
      }
    }
    const store = readLocalStore();
    return store.monitored_dates || [];
  },

  async addMonitoredDates(dateStrings) {
    const dates = Array.isArray(dateStrings) ? dateStrings : [dateStrings];
    const now = new Date().toISOString();

    if (isSupabaseConfigured && supabase) {
      try {
        const rows = dates.map(d => ({
          darshan_date: d,
          monitoring_enabled: true,
          updated_at: now
        }));
        const { data, error } = await supabase
          .from('monitored_dates')
          .upsert(rows, { onConflict: 'darshan_date' })
          .select();
        if (!error) return data;
      } catch (e) {
        console.warn('[Supabase] Add dates failed, using fallback:', e.message);
      }
    }

    const store = readLocalStore();
    const existing = new Set(store.monitored_dates.map(item => item.darshan_date));
    for (const d of dates) {
      if (!existing.has(d)) {
        store.monitored_dates.push({
          id: 'date_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
          darshan_date: d,
          monitoring_enabled: true,
          created_at: now,
          updated_at: now
        });
        existing.add(d);
      }
    }
    store.monitored_dates.sort((a, b) => a.darshan_date.localeCompare(b.darshan_date));
    writeLocalStore(store);
    return store.monitored_dates;
  },

  async removeMonitoredDate(darshanDate) {
    if (isSupabaseConfigured && supabase) {
      try {
        const { error } = await supabase
          .from('monitored_dates')
          .delete()
          .eq('darshan_date', darshanDate);
        if (!error) return true;
      } catch (e) {
        console.warn('[Supabase] Delete failed:', e.message);
      }
    }
    const store = readLocalStore();
    store.monitored_dates = store.monitored_dates.filter(d => d.darshan_date !== darshanDate);
    writeLocalStore(store);
    return true;
  },

  async toggleMonitoredDate(darshanDate, enabled) {
    const now = new Date().toISOString();
    if (isSupabaseConfigured && supabase) {
      try {
        const { error } = await supabase
          .from('monitored_dates')
          .update({ monitoring_enabled: enabled, updated_at: now })
          .eq('darshan_date', darshanDate);
        if (!error) return true;
      } catch (e) {
        console.warn('[Supabase] Toggle failed:', e.message);
      }
    }
    const store = readLocalStore();
    const target = store.monitored_dates.find(d => d.darshan_date === darshanDate);
    if (target) {
      target.monitoring_enabled = enabled;
      target.updated_at = now;
      writeLocalStore(store);
    }
    return true;
  },

  /**
   * Availability Snapshots
   */
  async saveSnapshot(snapshot) {
    const record = {
      available_dates: snapshot.availableDatesList || [],
      booked_dates: snapshot.bookedDates || [],
      blocked_dates: snapshot.blockedDates || [],
      start_date: snapshot.startAndEndDates?.[0] || null,
      end_date: snapshot.startAndEndDates?.[1] || null,
      checked_at: snapshot.checkedAt || new Date().toISOString(),
      request_status: snapshot.requestStatus || 'CONNECTED'
    };

    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase
          .from('availability_snapshots')
          .insert([record])
          .select();
        if (!error && data) return data[0];
      } catch (e) {
        console.warn('[Supabase] Save snapshot failed:', e.message);
      }
    }

    const store = readLocalStore();
    const entry = { id: 'snap_' + Date.now(), ...record };
    store.availability_snapshots.unshift(entry);
    // Keep last 100 snapshots
    if (store.availability_snapshots.length > 100) {
      store.availability_snapshots = store.availability_snapshots.slice(0, 100);
    }
    writeLocalStore(store);
    return entry;
  },

  async getLatestSnapshot() {
    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase
          .from('availability_snapshots')
          .select('*')
          .order('checked_at', { ascending: false })
          .limit(1);
        if (!error && data && data.length > 0) return data[0];
      } catch (e) {
        console.warn('[Supabase] Get latest snapshot failed:', e.message);
      }
    }

    const store = readLocalStore();
    return store.availability_snapshots?.[0] || null;
  },

  /**
   * Availability History
   */
  async getHistory(limit = 50) {
    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase
          .from('availability_history')
          .select('*')
          .order('detected_at', { ascending: false })
          .limit(limit);
        if (!error && data) return data;
      } catch (e) {
        console.warn('[Supabase] Get history failed:', e.message);
      }
    }

    const store = readLocalStore();
    return (store.availability_history || []).slice(0, limit);
  },

  async addHistory(event) {
    const entry = {
      darshan_date: event.darshan_date,
      previous_status: event.previous_status,
      current_status: event.current_status,
      detected_at: event.detected_at || new Date().toISOString()
    };

    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase
          .from('availability_history')
          .insert([entry])
          .select();
        if (!error && data) return data[0];
      } catch (e) {
        console.warn('[Supabase] Add history failed:', e.message);
      }
    }

    const store = readLocalStore();
    const newRecord = { id: 'hist_' + Date.now() + Math.random().toString(36).substring(2, 5), ...entry };
    store.availability_history.unshift(newRecord);
    if (store.availability_history.length > 200) {
      store.availability_history = store.availability_history.slice(0, 200);
    }
    writeLocalStore(store);
    return newRecord;
  },

  /**
   * Notification Logs
   */
  async getNotificationLogs(limit = 50) {
    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase
          .from('notification_logs')
          .select('*')
          .order('sent_at', { ascending: false })
          .limit(limit);
        if (!error && data) return data;
      } catch (e) {
        console.warn('[Supabase] Get notification logs failed:', e.message);
      }
    }

    const store = readLocalStore();
    return (store.notification_logs || []).slice(0, limit);
  },

  async addNotificationLog(log) {
    const entry = {
      darshan_date: log.darshan_date,
      notification_type: log.notification_type || 'TELEGRAM',
      delivery_status: log.delivery_status || 'SENT',
      sent_at: log.sent_at || new Date().toISOString(),
      error_message: log.error_message || null
    };

    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase
          .from('notification_logs')
          .insert([entry])
          .select();
        if (!error && data) return data[0];
      } catch (e) {
        console.warn('[Supabase] Add notification log failed:', e.message);
      }
    }

    const store = readLocalStore();
    const newRecord = { id: 'notif_' + Date.now(), ...entry };
    store.notification_logs.unshift(newRecord);
    if (store.notification_logs.length > 200) {
      store.notification_logs = store.notification_logs.slice(0, 200);
    }
    writeLocalStore(store);
    return newRecord;
  },

  /**
   * Settings
   */
  async getSettings() {
    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase
          .from('monitoring_settings')
          .select('*')
          .eq('id', 'default')
          .single();
        if (!error && data) return data;
      } catch (e) {
        console.warn('[Supabase] Get settings failed:', e.message);
      }
    }

    const store = readLocalStore();
    return store.monitoring_settings || initialData.monitoring_settings;
  },

  async updateSettings(updates) {
    const now = new Date().toISOString();
    const newSettings = { ...updates, updated_at: now };

    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase
          .from('monitoring_settings')
          .upsert({ id: 'default', ...newSettings })
          .select()
          .single();
        if (!error && data) return data;
      } catch (e) {
        console.warn('[Supabase] Update settings failed:', e.message);
      }
    }

    const store = readLocalStore();
    store.monitoring_settings = { ...store.monitoring_settings, ...newSettings };
    writeLocalStore(store);
    return store.monitoring_settings;
  }
};
