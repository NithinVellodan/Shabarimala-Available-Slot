'use client';

import { ExternalLink, RefreshCw, Clock, CalendarCheck2, CalendarX2, AlertCircle, Info } from 'lucide-react';
import { formatDisplayDate, timeAgo } from '@/lib/dateUtils';

const BOOKING_URL = 'https://sabarimalaonline.org/#/darshan';

export default function SlotsOverview({ apiData, lastChecked, isRefreshing, onRefresh }) {
  const availableDates = apiData?.availableDatesList || [];
  const bookedDates   = apiData?.bookedDates || [];
  const hasAvailable  = availableDates.length > 0;

  return (
    <div className="space-y-4">

      {/* ── Title row ─────────────────────────────────────── */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h2 className="text-lg font-black text-navy-900">Darshan Slot Availability</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Live status from the official Sabarimala Virtual Q portal
          </p>
        </div>
        <div className="flex items-center gap-3">
          {lastChecked && (
            <span className="text-[11px] text-slate-400 flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              Updated {timeAgo(lastChecked)}
            </span>
          )}
          <button
            onClick={onRefresh}
            disabled={isRefreshing}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 disabled:opacity-50 transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-saffron-600' : ''}`} />
            {isRefreshing ? 'Checking…' : 'Refresh'}
          </button>
        </div>
      </div>

      {/* ── Available slots ──────────────────────────────── */}
      <div className={`rounded-2xl border p-5 ${hasAvailable ? 'border-emerald-300 bg-emerald-50/60' : 'border-slate-200 bg-white'}`}>
        <div className="flex items-center gap-2 mb-4">
          <CalendarCheck2 className={`w-5 h-5 ${hasAvailable ? 'text-emerald-600' : 'text-slate-400'}`} />
          <h3 className={`text-sm font-black uppercase tracking-wide ${hasAvailable ? 'text-emerald-800' : 'text-slate-500'}`}>
            Available Slots {hasAvailable && <span className="ml-1 px-2 py-0.5 rounded-full bg-emerald-500 text-white text-[11px]">{availableDates.length}</span>}
          </h3>
        </div>

        {hasAvailable ? (
          <div className="space-y-3">
            {availableDates.map((date, i) => (
              <div key={i} className="flex items-center justify-between gap-3 bg-white rounded-xl border border-emerald-200 px-4 py-3 shadow-xs">
                <div className="flex items-center gap-3">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0"></span>
                  <div>
                    <p className="text-sm font-bold text-navy-900">{formatDisplayDate(date)}</p>
                    <p className="text-[11px] text-slate-400">{date}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 border border-emerald-200">
                    🟢 OPEN
                  </span>
                  <a
                    href={BOOKING_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-sm transition-colors"
                  >
                    Book Now <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>
            ))}

            {/* Reminder */}
            <div className="flex items-start gap-2 mt-2 p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-800">
              <Info className="w-4 h-4 shrink-0 mt-0.5 text-amber-600" />
              <p>
                Slots are limited and fill up fast. Click <strong>Book Now</strong> and complete your booking directly on the official Sabarimala portal.
                This website does <u>not</u> book slots on your behalf.
              </p>
            </div>
          </div>
        ) : (
          <div className="text-center py-8">
            <AlertCircle className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <p className="text-sm font-bold text-slate-600">No slots available right now</p>
            <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto">
              All Darshan dates are currently fully booked. Enable email alerts below — we'll notify you the moment a slot opens.
            </p>
          </div>
        )}
      </div>

      {/* ── Booked / Full dates ──────────────────────────── */}
      {bookedDates.length > 0 && (
        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <div className="flex items-center gap-2 mb-4">
            <CalendarX2 className="w-5 h-5 text-slate-400" />
            <h3 className="text-sm font-black uppercase tracking-wide text-slate-500">
              Fully Booked Dates
              <span className="ml-1 text-[11px] font-semibold text-slate-400">({bookedDates.length})</span>
            </h3>
          </div>
          <div className="flex flex-wrap gap-2">
            {bookedDates.map((date, i) => (
              <span key={i} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 border border-slate-200 text-xs font-semibold text-slate-600">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-400 shrink-0"></span>
                {formatDisplayDate(date)}
              </span>
            ))}
          </div>
          <p className="text-[11px] text-slate-400 mt-3">
            These dates are fully reserved. Slots occasionally get released — set up email alerts to be first to know.
          </p>
        </div>
      )}

      {/* ── Official portal CTA ─────────────────────────── */}
      <div className="rounded-xl border border-saffron-200 bg-saffron-50/50 p-4 flex items-center justify-between gap-4 flex-wrap">
        <div>
          <p className="text-sm font-bold text-navy-900">Official Sabarimala Virtual Q Portal</p>
          <p className="text-xs text-slate-500 mt-0.5">All bookings must be completed on the official portal</p>
        </div>
        <a
          href={BOOKING_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-saffron-600 hover:bg-saffron-700 text-white text-xs font-bold shadow transition-colors shrink-0"
        >
          Go to Official Portal <ExternalLink className="w-3.5 h-3.5" />
        </a>
      </div>

    </div>
  );
}
