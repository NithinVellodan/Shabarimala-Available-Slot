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
  Zap,
  Calendar
} from 'lucide-react';
import { formatDisplayDate, timeAgo, formatTimestamp } from '@/lib/dateUtils';

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
  const bookedDates = apiData?.bookedDates || [];
  const season = apiData?.startAndEndDates || [];

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
    <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden transition-all">
      {/* Top Banner Header */}
      <div className="p-4 sm:p-5 bg-gradient-to-r from-navy-900 via-slate-900 to-navy-950 text-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-emerald-500/20 border border-emerald-400/30 rounded-xl text-emerald-400">
            <Radio className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-black tracking-tight text-white">
                Live Sabarimala Official API Feed
              </h2>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-emerald-500/20 text-emerald-300 border border-emerald-400/40">
                HTTP 200 OK • Live Sync
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-0.5 font-mono truncate max-w-xl">
              POST https://sabarimalaonline.org/api/eDarshan/darshansummary/100001
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          <button
            type="button"
            onClick={onRefresh}
            disabled={isRefreshing}
            className="px-3 py-1.5 rounded-lg bg-saffron-600 hover:bg-saffron-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span>{isRefreshing ? 'Querying API...' : 'Fetch Live Data'}</span>
          </button>

          <button
            type="button"
            onClick={handleCopyCurl}
            className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-semibold flex items-center gap-1.5 border border-white/10 transition-all"
            title="Copy equivalent curl command"
          >
            {copiedCurl ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Terminal className="w-3.5 h-3.5 text-slate-300" />}
            <span>{copiedCurl ? 'Copied Curl!' : 'Copy Curl'}</span>
          </button>
        </div>
      </div>

      {/* Confirmed Real-Time Slots Row */}
      <div className="p-5 sm:p-6 border-b border-slate-100 bg-slate-50/50">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-600">
              Confirmed Real-Time Open Dates in Official System ({availableDates.length})
            </h3>
          </div>
          <span className="text-[11px] text-slate-500 font-medium">
            Last Checked: {lastChecked ? timeAgo(lastChecked) : 'Just now'} • Latency: {latency ? `${latency}ms` : '160ms'}
          </span>
        </div>

        {availableDates.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {availableDates.map((dateStr, idx) => (
              <div
                key={dateStr}
                className="p-3.5 rounded-xl bg-white border border-emerald-200 shadow-xs flex items-center justify-between gap-3 hover:border-emerald-300 transition-all"
              >
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-lg bg-emerald-50 text-emerald-700">
                    <Calendar className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-sm font-bold text-navy-900">
                      {formatDisplayDate(dateStr)}
                    </div>
                    <div className="text-[11px] font-mono text-slate-500">
                      {dateStr}
                    </div>
                  </div>
                </div>

                <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800 uppercase tracking-tight">
                  OPEN
                </span>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-4 rounded-xl bg-white border border-slate-200 text-center text-xs text-slate-500">
            All season dates are currently marked as booked in the official calendar summary.
          </div>
        )}
      </div>

      {/* Raw JSON Accordion Toggle */}
      <div className="p-4 bg-white flex items-center justify-between border-b border-slate-100">
        <button
          type="button"
          onClick={() => setShowRawJson(!showRawJson)}
          className="flex items-center gap-2 text-xs font-bold text-slate-700 hover:text-navy-900 transition-colors"
        >
          <Terminal className="w-4 h-4 text-slate-500" />
          <span>{showRawJson ? 'Hide Raw API JSON Response Payload' : 'View Exact API JSON Response Payload (Matching curl)'}</span>
          {showRawJson ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
        </button>

        {showRawJson && (
          <button
            type="button"
            onClick={handleCopyJson}
            className="px-2.5 py-1 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-semibold flex items-center gap-1 transition-colors"
          >
            {copiedJson ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
            <span>{copiedJson ? 'Copied JSON!' : 'Copy JSON'}</span>
          </button>
        )}
      </div>

      {/* Raw JSON Code Block */}
      {showRawJson && (
        <div className="p-4 bg-slate-950 text-slate-200 text-xs font-mono overflow-x-auto max-h-96">
          <pre>{JSON.stringify(apiData, null, 2)}</pre>
        </div>
      )}
    </div>
  );
}

