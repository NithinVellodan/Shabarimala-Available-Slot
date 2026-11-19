'use client';

import { Calendar, CheckCircle2, XCircle, Ban, Sparkles, Clock } from 'lucide-react';
import { formatTimestamp, timeAgo } from '@/lib/dateUtils';

export default function StatisticsCards({
  monitoredDatesCount = 0,
  availableDatesCount = 0,
  bookedDatesCount = 0,
  blockedDatesCount = 0,
  newlyReleasedCount = 0,
  lastChecked = null,
  apiHealth = null
}) {
  const cards = [
    {
      label: 'Monitored Dates',
      value: monitoredDatesCount,
      sublabel: 'Custom watchlist active',
      icon: Calendar,
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-50',
      borderColor: 'border-indigo-100',
    },
    {
      label: 'Available Dates',
      value: availableDatesCount,
      sublabel: 'Darshan slots open',
      icon: CheckCircle2,
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-50',
      borderColor: 'border-emerald-100',
    },
    {
      label: 'Booked Dates',
      value: bookedDatesCount,
      sublabel: 'Fully reserved',
      icon: XCircle,
      color: 'text-rose-600',
      bgColor: 'bg-rose-50',
      borderColor: 'border-rose-100',
    },
    {
      label: 'Blocked Dates',
      value: blockedDatesCount,
      sublabel: 'Not released by Devaswom',
      icon: Ban,
      color: 'text-slate-600',
      bgColor: 'bg-slate-100',
      borderColor: 'border-slate-200',
    },
    {
      label: 'Newly Released',
      value: newlyReleasedCount,
      sublabel: 'Detected in recent checks',
      icon: Sparkles,
      color: 'text-amber-600',
      bgColor: 'bg-amber-50',
      borderColor: 'border-amber-200',
      highlight: newlyReleasedCount > 0,
    },
    {
      label: 'Last API Check',
      value: lastChecked ? timeAgo(lastChecked) : 'Pending',
      sublabel: lastChecked ? formatTimestamp(lastChecked) : 'Waiting for initial sync',
      icon: Clock,
      color: apiHealth?.status === 'CONNECTED' ? 'text-teal-600' : 'text-slate-600',
      bgColor: apiHealth?.status === 'CONNECTED' ? 'bg-teal-50' : 'bg-slate-50',
      borderColor: 'border-slate-200',
      isText: true
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
      {cards.map((card, idx) => {
        const Icon = card.icon;
        return (
          <div
            key={idx}
            className={`p-4 rounded-xl bg-white border ${card.borderColor} shadow-xs transition-all hover:shadow-md flex flex-col justify-between ${
              card.highlight ? 'ring-2 ring-amber-400 bg-amber-50/30' : ''
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                {card.label}
              </span>
              <div className={`p-1.5 rounded-lg ${card.bgColor}`}>
                <Icon className={`w-4 h-4 ${card.color}`} />
              </div>
            </div>

            <div className="mt-1">
              <div className={`font-black tracking-tight text-navy-900 ${
                card.isText ? 'text-base sm:text-lg truncate' : 'text-2xl sm:text-3xl'
              }`}>
                {card.value}
              </div>
              <div className="text-[11px] text-slate-500 truncate mt-1">
                {card.sublabel}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
