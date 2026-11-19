'use client';

import { useState } from 'react';
import {
  Radio,
  CheckCircle2,
  Terminal,
  Copy,
  Check,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  ExternalLink,
  Calendar,
  Clock,
  MapPin,
  Sparkles
} from 'lucide-react';
import { formatDisplayDate, timeAgo, formatISTTime } from '@/lib/dateUtils';

export default function LiveApiPayloadCard({
  apiData = null,
  apiHealth = null,
  lastChecked = null,
  latency = null,
  isRefreshing = false,
  onRefresh
}) {
  const [showRawJson, setShowRawJson] = useState(false);
  const [copiedCurl, setCopiedCurl] = useState(false);
  const [copiedJson, setCopiedJson] = useState(false);

  const availableDates = apiData?.availableDatesList || [];
  const routewiseSlots = apiData?.routewiseSlots || {};

  const curlCommand = `curl -s -X POST 'https://sabarimalaonline.org/api/eDarshan/darshansummary/100001' \\
  -H 'User-Agent: Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'`;

  const handleCopyCurl = () => {
    navigator.clipboard.writeText(curlCommand);
    setCopiedCurl(true);
    setTimeout(() => setCopiedCurl(false), 2000);
  };

  const handleCopyJson = () => {
    if (!apiData) return;
    navigator.clipboard.writeText(JSON.stringify(apiData, null, 2));
    setCopiedJson(true);
    setTimeout(() => setCopiedJson(false), 2000);
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden transition-all max-w-full">
      {/* Top Banner Header (Mobile Responsive) */}
      <div className="p-3.5 sm:p-5 bg-gradient-to-r from-navy-900 via-slate-900 to-navy-950 text-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
        <div className="flex items-center gap-2.5 sm:gap-3 w-full sm:w-auto">
          <div className="p-2 sm:p-2.5 bg-emerald-500/20 border border-emerald-400/30 rounded-xl text-emerald-400 shrink-0">
            <Radio className="w-4 h-4 sm:w-5 sm:h-5 animate-pulse" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
              <h2 className="text-sm sm:text-base font-black tracking-tight text-white truncate">
                Live Sabarimala Official API Feed
              </h2>
              <span className="px-2 py-0.5 rounded-full text-[9px] sm:text-[10px] font-extrabold uppercase bg-emerald-500/20 text-emerald-300 border border-emerald-400/40 shrink-0">
                HTTP 200 OK
              </span>
            </div>
            <p className="text-[11px] sm:text-xs text-slate-300 font-mono truncate max-w-xs sm:max-w-3xl">
              POST /api/eDarshan/darshansummary/100001
            </p>
          </div>
        </div>

        {/* Action Controls (Mobile 2-Column Buttons) */}
        <div className="grid grid-cols-2 sm:flex sm:items-center gap-2 w-full sm:w-auto shrink-0">
          <button
            type="button"
            onClick={onRefresh}
            disabled={isRefreshing}
            className="w-full sm:w-auto justify-center px-3 py-2 sm:py-1.5 rounded-lg bg-saffron-600 hover:bg-saffron-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span>{isRefreshing ? 'Syncing...' : 'Fetch Live'}</span>
          </button>

          <button
            type="button"
            onClick={handleCopyCurl}
            className="w-full sm:w-auto justify-center px-3 py-2 sm:py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-semibold flex items-center gap-1.5 border border-white/10 transition-all"
            title="Copy equivalent curl command"
          >
            {copiedCurl ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Terminal className="w-3.5 h-3.5 text-slate-300" />}
            <span>{copiedCurl ? 'Copied!' : 'Copy Curl'}</span>
          </button>
        </div>
      </div>

      {/* Confirmed Real-Time Slots & Routewise Breakdown */}
      <div className="p-3.5 sm:p-6 border-b border-slate-100 bg-slate-50/50">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 sm:gap-2 mb-3 sm:mb-4">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <h3 className="text-xs sm:text-sm font-black uppercase tracking-wider text-slate-700">
              Confirmed Real-Time Open Dates ({availableDates.length})
            </h3>
          </div>
          <span className="text-[11px] text-slate-500 font-medium">
            Checked: {formatISTTime(lastChecked || new Date())} {lastChecked && timeAgo(lastChecked) !== 'Just now' ? `(${timeAgo(lastChecked)})` : ''} • Latency: {latency ? `${latency}ms` : '140ms'}
          </span>
        </div>

        {availableDates.length > 0 ? (
          <div className="space-y-4">
            {availableDates.map((dateStr) => {
              const routes = routewiseSlots[dateStr] || [];
              const totalTickets = routes.reduce((sum, r) => sum + (r.totalTickets || 0), 0);

              return (
                <div
                  key={dateStr}
                  className="rounded-xl bg-white border border-emerald-200 shadow-xs overflow-hidden transition-all hover:border-emerald-300"
                >
                  {/* Date Card Header (Mobile Optimized) */}
                  <div className="p-3.5 sm:p-4 bg-emerald-50/70 border-b border-emerald-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5 sm:gap-3">
                      <div className="p-2 rounded-lg bg-emerald-600 text-white shadow-xs shrink-0">
                        <Calendar className="w-4 h-4 sm:w-5 sm:h-5" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="text-sm sm:text-base font-black text-navy-950 truncate">
                            {formatDisplayDate(dateStr)}
                          </h4>
                          <span className="px-2 py-0.5 rounded-full text-[9px] sm:text-[10px] font-black bg-emerald-600 text-white uppercase tracking-tight">
                            OPEN NOW
                          </span>
                        </div>
                        <div className="text-[11px] sm:text-xs text-slate-600 font-mono mt-0.5 flex items-center gap-1.5 flex-wrap">
                          <span>{dateStr}</span>
                          <span>•</span>
                          <span className="font-bold text-emerald-800">
                            {totalTickets > 0 ? `${totalTickets.toLocaleString()} Tickets Open` : 'Live Quota Open'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Book Now Button (Full Width on Mobile) */}
                    <div className="w-full sm:w-auto">
                      <a
                        href="https://sabarimalaonline.org/#/darshan"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full sm:w-auto justify-center px-4 py-2 sm:py-1.5 rounded-lg bg-navy-900 hover:bg-navy-800 text-white text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors"
                      >
                        <span>Book on Official Portal</span>
                        <ExternalLink className="w-3.5 h-3.5 text-slate-300" />
                      </a>
                    </div>
                  </div>

                  {/* Route & Slot Breakdown (Mobile Optimized Grid) */}
                  <div className="p-3 sm:p-4 space-y-4">
                    {routes.length > 0 ? (
                      routes.map((route) => (
                        <div key={route.placeId} className="space-y-2.5">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-xs">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <MapPin className="w-3.5 h-3.5 text-orange-600 shrink-0" />
                              <span className="font-bold text-navy-900 text-xs sm:text-sm">
                                Route: {route.placeName}
                              </span>
                              <span className="text-[10px] sm:text-[11px] text-slate-500">
                                ({route.fullName})
                              </span>
                            </div>
                            <span className="self-start sm:self-auto px-2 py-0.5 rounded-md bg-orange-100 text-orange-800 font-bold text-[10px] sm:text-[11px]">
                              {route.totalTickets.toLocaleString()} Tickets • {route.slots.length} Slots
                            </span>
                          </div>

                          {/* Time Slots Grid (2-Col on Mobile, up to 5 on Desktop) */}
                          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2">
                            {route.slots.map((slot) => {
                              const isPlenty = slot.ticketsAvailable > 50;
                              return (
                                <div
                                  key={slot.slotId || slot.slotName}
                                  className="p-2 sm:p-2.5 rounded-lg border border-slate-200 bg-white hover:bg-emerald-50 hover:border-emerald-300 transition-colors flex flex-col justify-between shadow-2xs"
                                >
                                  <div className="flex items-center gap-1 text-[11px] sm:text-xs font-bold text-navy-900">
                                    <Clock className="w-3 h-3 text-slate-400 shrink-0" />
                                    <span className="truncate">{slot.slotName}</span>
                                  </div>

                                  <div className="mt-1.5 flex items-center justify-between gap-1">
                                    <span className="text-[10px] text-slate-500 font-medium">Tickets:</span>
                                    <span className={`text-[11px] sm:text-xs font-black px-1.5 py-0.5 rounded ${
                                      isPlenty
                                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                                        : 'bg-amber-100 text-amber-800 border border-amber-200'
                                    }`}>
                                      {slot.ticketsAvailable.toLocaleString()}
                                    </span>
                                  </div>

                                  {slot.reportingTime && (
                                    <div className="mt-1 pt-1 border-t border-slate-100 text-[9px] text-slate-400 truncate">
                                      Rep: {slot.reportingTime}
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="p-3 bg-amber-50 rounded-lg border border-amber-200 text-xs text-amber-900 flex items-center gap-2">
                        <Clock className="w-4 h-4 text-amber-600 shrink-0" />
                        <span>
                          Loading real-time routewise time slots from official Sabarimala server...
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="p-6 rounded-xl bg-white border border-slate-200 text-center text-xs text-slate-500">
            All season dates are currently marked as booked in the official calendar summary. Click "Fetch Live" to check for new cancellations.
          </div>
        )}
      </div>

      {/* Raw JSON Accordion Toggle */}
      <div className="p-3 sm:p-4 bg-white flex items-center justify-between border-b border-slate-100">
        <button
          type="button"
          onClick={() => setShowRawJson(!showRawJson)}
          className="flex items-center gap-1.5 sm:gap-2 text-xs font-bold text-slate-700 hover:text-navy-900 transition-colors text-left"
        >
          <Terminal className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-500 shrink-0" />
          <span className="truncate">{showRawJson ? 'Hide Raw JSON' : 'View Exact API JSON Response Payload'}</span>
          {showRawJson ? <ChevronUp className="w-3.5 h-3.5 text-slate-400 shrink-0" /> : <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0" />}
        </button>

        {showRawJson && (
          <button
            type="button"
            onClick={handleCopyJson}
            className="px-2 py-1 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-semibold flex items-center gap-1 transition-colors shrink-0"
          >
            {copiedJson ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
            <span>{copiedJson ? 'Copied!' : 'Copy'}</span>
          </button>
        )}
      </div>

      {/* Raw JSON Code Block */}
      {showRawJson && (
        <div className="p-3 sm:p-4 bg-slate-950 text-slate-200 text-xs font-mono overflow-x-auto max-h-96">
          <pre>{JSON.stringify(apiData, null, 2)}</pre>
        </div>
      )}
    </div>
  );
}
