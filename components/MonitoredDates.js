'use client';

import { useState } from 'react';
import {
  Bell,
  BellOff,
  Trash2,
  Plus,
  Calendar,
  CheckCircle2,
  XCircle,
  Clock,
  Sparkles,
  ExternalLink
} from 'lucide-react';
import { formatDisplayDate, getDateStatus, timeAgo } from '@/lib/dateUtils';

export default function MonitoredDates({
  monitoredDates = [],
  apiData = null,
  newlyAvailableDates = [],
  lastChecked = null,
  onToggleDate,
  onRemoveDate,
  onAddDate
}) {
  const [newDateInput, setNewDateInput] = useState('');
  const [inputError, setInputError] = useState('');

  const handleAddSubmit = (e) => {
    e.preventDefault();
    if (!newDateInput) {
      setInputError('Please pick a valid date');
      return;
    }
    setInputError('');
    onAddDate(newDateInput);
    setNewDateInput('');
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'AVAILABLE':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
            AVAILABLE
          </span>
        );
      case 'NEWLY_AVAILABLE':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-800 border border-blue-400 animate-pulse">
            <Sparkles className="w-3 h-3 text-blue-600" />
            NEWLY AVAILABLE!
          </span>
        );
      case 'BOOKED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
            <XCircle className="w-3 h-3 text-rose-500" />
            BOOKED
          </span>
        );
      case 'BLOCKED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-600 border border-slate-200">
            BLOCKED
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
            UNKNOWN
          </span>
        );
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
      {/* Header with Title and Add Date form */}
      <div className="p-4 sm:p-6 border-b border-slate-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-lg sm:text-xl font-black tracking-tight text-navy-900">
              Monitored Darshan Dates
            </h3>
            <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-saffron-100 text-saffron-800">
              {monitoredDates.length}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Dates monitored by the background worker for real-time slot release alerts.
          </p>
        </div>

        {/* Add custom date form */}
        <form onSubmit={handleAddSubmit} className="flex items-center gap-2 w-full sm:w-auto">
          <input
            type="date"
            value={newDateInput}
            onChange={(e) => {
              setNewDateInput(e.target.value);
              setInputError('');
            }}
            min="2026-11-20"
            max="2027-03-09"
            className="px-3 py-1.5 rounded-lg border border-slate-300 text-xs text-navy-900 focus:outline-none focus:ring-2 focus:ring-saffron-500"
          />
          <button
            type="submit"
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold bg-navy-900 hover:bg-navy-800 text-white shadow-xs transition-colors shrink-0"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Date</span>
          </button>
        </form>
      </div>

      {inputError && (
        <div className="px-6 py-2 bg-rose-50 text-rose-700 text-xs border-b border-rose-100">
          {inputError}
        </div>
      )}

      {/* Monitored Dates Table */}
      {monitoredDates.length === 0 ? (
        <div className="p-8 text-center">
          <Calendar className="w-10 h-10 text-slate-300 mx-auto mb-2" />
          <h4 className="text-sm font-bold text-navy-900">No dates being monitored yet</h4>
          <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 mb-4">
            Select dates on the calendar above or add specific dates to start tracking slot availability.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs sm:text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                <th className="py-3 px-4 sm:px-6">Date</th>
                <th className="py-3 px-4">Current Status</th>
                <th className="py-3 px-4">Previous Status</th>
                <th className="py-3 px-4">Last Checked</th>
                <th className="py-3 px-4">Alert Notification</th>
                <th className="py-3 px-4 sm:px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {monitoredDates.map((item) => {
                const currentStatus = getDateStatus(item.darshan_date, apiData, newlyAvailableDates);
                const isAvailable = currentStatus === 'AVAILABLE' || currentStatus === 'NEWLY_AVAILABLE';

                return (
                  <tr
                    key={item.darshan_date}
                    className={`hover:bg-slate-50/80 transition-colors ${
                      currentStatus === 'NEWLY_AVAILABLE' ? 'bg-blue-50/40' : ''
                    }`}
                  >
                    {/* Date */}
                    <td className="py-3.5 px-4 sm:px-6 font-semibold text-navy-900">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-saffron-600" />
                        <div>
                          <div className="font-bold text-slate-900">
                            {formatDisplayDate(item.darshan_date)}
                          </div>
                          <div className="text-[11px] text-slate-400 font-mono">
                            {item.darshan_date}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Current Status */}
                    <td className="py-3.5 px-4">
                      {getStatusBadge(currentStatus)}
                    </td>

                    {/* Previous Status */}
                    <td className="py-3.5 px-4 text-slate-600">
                      <span className="text-xs font-medium">
                        {item.previous_status || 'BOOKED'}
                      </span>
                    </td>

                    {/* Last Checked */}
                    <td className="py-3.5 px-4 text-slate-500">
                      <div className="flex items-center gap-1.5 text-xs">
                        <Clock className="w-3 h-3 text-slate-400" />
                        <span>{lastChecked ? timeAgo(lastChecked) : 'Pending'}</span>
                      </div>
                    </td>

                    {/* Notification State */}
                    <td className="py-3.5 px-4">
                      {item.monitoring_enabled ? (
                        <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700">
                          <Bell className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Enabled</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs font-semibold text-slate-400">
                          <BellOff className="w-3.5 h-3.5" />
                          <span>Paused</span>
                        </span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4 sm:px-6 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {isAvailable && (
                          <a
                            href="https://sabarimalaonline.org/#/darshan"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs transition-colors"
                          >
                            <span>Book Now</span>
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        )}

                        <button
                          type="button"
                          onClick={() => onToggleDate(item.darshan_date, !item.monitoring_enabled)}
                          title={item.monitoring_enabled ? 'Pause alerts for this date' : 'Resume alerts'}
                          className={`p-1.5 rounded-lg border transition-colors ${
                            item.monitoring_enabled
                              ? 'bg-slate-50 hover:bg-slate-100 text-slate-600 border-slate-200'
                              : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border-emerald-200'
                          }`}
                        >
                          {item.monitoring_enabled ? <BellOff className="w-3.5 h-3.5" /> : <Bell className="w-3.5 h-3.5" />}
                        </button>

                        <button
                          type="button"
                          onClick={() => onRemoveDate(item.darshan_date)}
                          title="Remove from monitoring list"
                          className="p-1.5 rounded-lg border border-slate-200 hover:bg-rose-50 text-slate-400 hover:text-rose-600 hover:border-rose-200 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
