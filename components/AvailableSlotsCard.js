'use client';

import { ExternalLink, CalendarCheck2, Clock, RefreshCw, Bell, AlertCircle } from 'lucide-react';
import { formatDisplayDate, formatTimestamp } from '@/lib/dateUtils';

const OFFICIAL_BOOKING_URL = 'https://sabarimalaonline.org/#/darshan';

export default function AvailableSlotsCard({ apiData, lastChecked, isRefreshing, onRefresh }) {
  const availableDates = apiData?.availableDatesList || [];
  const hasSlots = availableDates.length > 0;

  return (
    <div className={`rounded-2xl overflow-hidden border shadow-sm ${
      hasSlots
        ? 'border-emerald-300 bg-gradient-to-br from-emerald-50 via-white to-green-50'
        : 'border-slate-200 bg-white'
    }`}>

      {/* Header bar */}
      <div className={`px-5 py-4 flex items-center justify-between gap-3 ${
        hasSlots
          ? 'bg-gradient-to-r from-emerald-600 to-green-600'
          : 'bg-gradient-to-r from-slate-700 to-slate-800'
      }`}>
        <div className="flex items-center gap-3">
          <div className="p-2 bg-white/20 rounded-xl">
            <CalendarCheck2 className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-sm font-black text-white tracking-tight">
              {hasSlots ? `🟢 ${availableDates.length} Slot${availableDates.length > 1 ? 's' : ''} Open Right Now!` : '⏳ No Slots Available Yet'}
            </h2>
            <p className="text-[11px] text-white/75 mt-0.5">
              Sabarimala Virtual Q — Live from official portal
            </p>
          </div>
        </div>

        {/* Refresh button */}
        <button
          type="button"
          onClick={onRefresh}
          disabled={isRefreshing}
          title="Refresh now"
          className="p-2 rounded-lg bg-white/15 hover:bg-white/25 text-white transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
        </button>
      </div>

      <div className="p-5">
        {hasSlots ? (
          <>
            {/* Available date cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-5">
              {availableDates.map((date) => (
                <div
                  key={date}
                  className="flex flex-col gap-3 p-4 rounded-xl bg-white border border-emerald-200 shadow-xs hover:shadow-md transition-shadow"
                >
                  <div className="flex items-center gap-2">
                    <span className="flex h-2.5 w-2.5 relative shrink-0">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                    </span>
                    <span className="text-sm font-black text-navy-900">{formatDisplayDate(date)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800">
                      ✅ OPEN
                    </span>
                    <a
                      href={OFFICIAL_BOOKING_URL}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-saffron-600 hover:bg-saffron-700 text-white text-xs font-bold transition-colors shadow-xs"
                    >
                      Book Now <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </div>
              ))}
            </div>

            {/* CTA banner */}
            <div className="rounded-xl bg-saffron-50 border border-saffron-200 p-4 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div>
                <p className="text-sm font-bold text-saffron-900">Act fast — slots fill up quickly!</p>
                <p className="text-xs text-saffron-700 mt-0.5">Go to the official Sabarimala portal and complete your booking now.</p>
              </div>
              <a
                href={OFFICIAL_BOOKING_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-saffron-600 hover:bg-saffron-700 text-white text-sm font-black shadow transition-colors shrink-0 w-full sm:w-auto justify-center"
              >
                Open Official Portal <ExternalLink className="w-4 h-4" />
              </a>
            </div>
          </>
        ) : (
          /* No slots available */
          <div className="flex flex-col items-center justify-center py-8 gap-4 text-center">
            <div className="p-4 rounded-full bg-slate-100">
              <AlertCircle className="w-8 h-8 text-slate-400" />
            </div>
            <div>
              <p className="text-base font-bold text-navy-900">All Darshan slots are currently booked</p>
              <p className="text-sm text-slate-500 mt-1 max-w-sm">
                No slots are open right now. We're monitoring 24/7 — set up an alert below and we'll email you the moment a slot opens.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto justify-center">
              <button
                type="button"
                onClick={() => document.getElementById('alert-setup')?.scrollIntoView({ behavior: 'smooth' })}
                className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-navy-900 hover:bg-navy-800 text-white text-sm font-bold shadow transition-colors"
              >
                <Bell className="w-4 h-4" /> Set Up Email Alert
              </button>
              <a
                href={OFFICIAL_BOOKING_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl border border-slate-300 hover:bg-slate-50 text-slate-700 text-sm font-bold transition-colors"
              >
                Check Official Portal <ExternalLink className="w-4 h-4" />
              </a>
            </div>
          </div>
        )}

        {/* Last checked */}
        <div className="mt-4 flex items-center gap-1.5 text-[11px] text-slate-400">
          <Clock className="w-3 h-3" />
          <span>Last checked: {lastChecked ? formatTimestamp(lastChecked) : 'Fetching…'}</span>
          <span className="ml-1 inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-slate-100 text-slate-500 font-medium">
            Auto-refreshes every 60s
          </span>
        </div>
      </div>
    </div>
  );
}
