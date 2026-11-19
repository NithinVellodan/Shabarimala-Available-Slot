'use client';

import { useState } from 'react';
import {
  Activity,
  CheckCircle,
  AlertTriangle,
  Send,
  Sparkles,
  RefreshCw,
  Clock,
  ArrowRight
} from 'lucide-react';
import { formatDisplayDate, formatTimestamp, timeAgo } from '@/lib/dateUtils';

export default function ActivityTimeline({ history = [], onRefresh, isRefreshing = false }) {
  const [filter, setFilter] = useState('ALL');

  const getEventIcon = (event) => {
    if (event.current_status === 'AVAILABLE') {
      return (
        <div className="p-2 rounded-xl bg-emerald-100 text-emerald-700">
          <Sparkles className="w-4 h-4" />
        </div>
      );
    }
    if (event.current_status === 'BOOKED') {
      return (
        <div className="p-2 rounded-xl bg-rose-100 text-rose-700">
          <CheckCircle className="w-4 h-4" />
        </div>
      );
    }
    if (event.current_status === 'ACCESS_BLOCKED' || event.current_status === 'NETWORK_ERROR') {
      return (
        <div className="p-2 rounded-xl bg-amber-100 text-amber-700">
          <AlertTriangle className="w-4 h-4" />
        </div>
      );
    }
    return (
      <div className="p-2 rounded-xl bg-slate-100 text-slate-700">
        <Activity className="w-4 h-4" />
      </div>
    );
  };

  const getEventTitle = (event) => {
    if (event.darshan_date === 'SYSTEM') {
      return `API Health Event: ${event.current_status}`;
    }
    if (event.current_status === 'AVAILABLE') {
      return `Slot Release Detected: ${formatDisplayDate(event.darshan_date)}`;
    }
    if (event.current_status === 'BOOKED') {
      return `Slot Reserved/Filled: ${formatDisplayDate(event.darshan_date)}`;
    }
    return `Status Change for ${event.darshan_date}`;
  };

  const filteredHistory = history.filter((item) => {
    if (filter === 'ALL') return true;
    if (filter === 'RELEASED') return item.current_status === 'AVAILABLE';
    if (filter === 'SYSTEM') return item.darshan_date === 'SYSTEM';
    return true;
  });

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
      {/* Header */}
      <div className="p-4 sm:p-6 border-b border-slate-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-lg sm:text-xl font-black tracking-tight text-navy-900">
              Activity History
            </h3>
            <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-700">
              {history.length} events
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Audit trail of API syncs, status transitions, and slot availability detections.
          </p>
        </div>

        {/* Filter buttons */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg text-xs">
            <button
              type="button"
              onClick={() => setFilter('ALL')}
              className={`px-2.5 py-1 rounded font-medium transition-colors ${
                filter === 'ALL' ? 'bg-white text-navy-900 shadow-xs font-bold' : 'text-slate-600'
              }`}
            >
              All
            </button>
            <button
              type="button"
              onClick={() => setFilter('RELEASED')}
              className={`px-2.5 py-1 rounded font-medium transition-colors ${
                filter === 'RELEASED' ? 'bg-white text-navy-900 shadow-xs font-bold' : 'text-slate-600'
              }`}
            >
              Released Slots
            </button>
            <button
              type="button"
              onClick={() => setFilter('SYSTEM')}
              className={`px-2.5 py-1 rounded font-medium transition-colors ${
                filter === 'SYSTEM' ? 'bg-white text-navy-900 shadow-xs font-bold' : 'text-slate-600'
              }`}
            >
              System Logs
            </button>
          </div>

          {onRefresh && (
            <button
              type="button"
              onClick={onRefresh}
              disabled={isRefreshing}
              className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-600 transition-colors"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-saffron-600' : ''}`} />
            </button>
          )}
        </div>
      </div>

      {/* Timeline items */}
      {filteredHistory.length === 0 ? (
        <div className="p-8 text-center text-xs text-slate-400">
          No events recorded matching the current filter.
        </div>
      ) : (
        <div className="divide-y divide-slate-100 max-h-[460px] overflow-y-auto">
          {filteredHistory.map((item, idx) => {
            const isSlotAvailable = item.current_status === 'AVAILABLE';

            return (
              <div
                key={item.id || idx}
                className={`p-4 sm:px-6 flex items-start gap-3.5 hover:bg-slate-50/70 transition-colors ${
                  isSlotAvailable ? 'bg-emerald-50/20' : ''
                }`}
              >
                {getEventIcon(item)}

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <h4 className="text-xs sm:text-sm font-bold text-navy-900 truncate">
                      {getEventTitle(item)}
                    </h4>
                    <span className="text-[11px] text-slate-400 font-medium shrink-0">
                      {timeAgo(item.detected_at)}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 mt-1 text-xs text-slate-600">
                    {item.darshan_date !== 'SYSTEM' && (
                      <span className="inline-flex items-center gap-1 font-mono text-[11px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-700">
                        <span>{item.previous_status || 'UNKNOWN'}</span>
                        <ArrowRight className="w-2.5 h-2.5 text-slate-400" />
                        <span className={`font-bold ${isSlotAvailable ? 'text-emerald-700' : 'text-slate-900'}`}>
                          {item.current_status}
                        </span>
                      </span>
                    )}

                    <span className="text-[11px] text-slate-400">
                      Detected at {formatTimestamp(item.detected_at)}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
