'use client';

import { useState } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Info,
  CalendarCheck2,
  Check,
  Plus,
  Eye,
  CheckCircle,
  HelpCircle,
  Clock
} from 'lucide-react';
import {
  getCalendarMonthData,
  getDateStatus,
  formatDisplayDate,
  formatTimestamp,
  isDateWithinSeason
} from '@/lib/dateUtils';

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export default function AvailabilityCalendar({
  apiData = null,
  monitoredDates = [],
  newlyAvailableDates = [],
  selectedDates = [],
  onSelectDate,
  onBatchSelect,
  onAddSelectedToMonitoring,
  onMonitorAllDates,
  lastChecked = null
}) {
  // Requirement: Initial calendar month December 2026
  const [currentYear, setCurrentYear] = useState(2026);
  const [currentMonth, setCurrentMonth] = useState(11); // 0-indexed: 11 = December
  const [hoveredDate, setHoveredDate] = useState(null);

  const calendarDays = getCalendarMonthData(currentYear, currentMonth);

  const prevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(y => y - 1);
    } else {
      setCurrentMonth(m => m - 1);
    }
  };

  const nextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(y => y + 1);
    } else {
      setCurrentMonth(m => m + 1);
    }
  };

  const jumpToDec2026 = () => {
    setCurrentYear(2026);
    setCurrentMonth(11);
  };

  const jumpToJan2027 = () => {
    setCurrentYear(2027);
    setCurrentMonth(0);
  };

  // Set of monitored dates for fast lookup
  const monitoredSet = new Set(monitoredDates.map(m => m.darshan_date));
  const selectedSet = new Set(selectedDates);

  // Quick action: Select entire month's dates that are within season
  const handleSelectEntireMonth = () => {
    const monthDates = calendarDays
      .filter(d => d.isCurrentMonth && isDateWithinSeason(d.dateStr, apiData?.startAndEndDates))
      .map(d => d.dateStr);

    if (onBatchSelect) {
      // Toggle or select all
      const allSelected = monthDates.every(d => selectedSet.has(d));
      if (allSelected) {
        // Deselect month dates
        onBatchSelect(selectedDates.filter(d => !monthDates.includes(d)));
      } else {
        // Add month dates
        const combined = Array.from(new Set([...selectedDates, ...monthDates]));
        onBatchSelect(combined);
      }
    }
  };

  const getDayStatusStyle = (status, isMonitored, isSelected) => {
    let base = 'relative transition-all rounded-lg p-1.5 sm:p-2.5 flex flex-col items-center justify-between min-h-[58px] sm:min-h-[72px] border text-xs sm:text-sm font-semibold select-none cursor-pointer ';

    if (isSelected) {
      base += ' ring-2 ring-saffron-500 shadow-md ';
    }

    switch (status) {
      case 'AVAILABLE':
        return base + 'bg-emerald-500/15 border-emerald-400 text-emerald-900 hover:bg-emerald-500/25';
      case 'NEWLY_AVAILABLE':
        return base + 'bg-blue-500/20 border-blue-500 text-blue-900 font-bold animate-pulse-subtle hover:bg-blue-500/30';
      case 'BOOKED':
        return base + 'bg-rose-500/10 border-rose-200 text-rose-800 hover:bg-rose-500/20';
      case 'BLOCKED':
        return base + 'bg-slate-200/70 border-slate-300 text-slate-500 hover:bg-slate-200';
      case 'UNKNOWN':
      default:
        return base + 'bg-amber-500/10 border-amber-200 text-amber-800/80 hover:bg-amber-500/20';
    }
  };

  const getStatusBadgePill = (status) => {
    switch (status) {
      case 'AVAILABLE':
        return <span className="w-2 h-2 rounded-full bg-emerald-500"></span>;
      case 'NEWLY_AVAILABLE':
        return <span className="w-2 h-2 rounded-full bg-blue-500 animate-ping"></span>;
      case 'BOOKED':
        return <span className="w-2 h-2 rounded-full bg-rose-500"></span>;
      case 'BLOCKED':
        return <span className="w-2 h-2 rounded-full bg-slate-400"></span>;
      default:
        return <span className="w-2 h-2 rounded-full bg-amber-400"></span>;
    }
  };

  const hoveredStatus = hoveredDate ? getDateStatus(hoveredDate, apiData, newlyAvailableDates) : null;
  const isHoveredMonitored = hoveredDate ? monitoredSet.has(hoveredDate) : false;

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
      {/* Calendar Header with Navigation */}
      <div className="p-4 sm:p-6 border-b border-slate-100 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h2 className="text-xl sm:text-2xl font-black tracking-tight text-navy-900">
              {MONTH_NAMES[currentMonth]} {currentYear}
            </h2>
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg">
              <button
                type="button"
                onClick={prevMonth}
                aria-label="Previous month"
                className="p-1 rounded hover:bg-white text-slate-600 hover:text-navy-900 transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={nextMonth}
                aria-label="Next month"
                className="p-1 rounded hover:bg-white text-slate-600 hover:text-navy-900 transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
          <div className="flex items-center gap-2 mt-1 text-xs text-slate-500">
            <Clock className="w-3.5 h-3.5 text-slate-400" />
            <span>Last checked: {lastChecked ? formatTimestamp(lastChecked) : 'Pending check'}</span>
            {apiData?.startAndEndDates && (
              <span className="hidden sm:inline text-slate-400">
                • Season: {apiData.startAndEndDates[0]} to {apiData.startAndEndDates[1]}
              </span>
            )}
          </div>
        </div>

        {/* Quick Month Jump Buttons & Selection Actions */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1 bg-slate-50 border border-slate-200 rounded-lg p-1 text-xs">
            <button
              type="button"
              onClick={jumpToDec2026}
              className={`px-2.5 py-1 rounded font-medium transition-colors ${
                currentYear === 2026 && currentMonth === 11
                  ? 'bg-navy-900 text-white font-bold'
                  : 'text-slate-600 hover:text-navy-900'
              }`}
            >
              Dec 2026
            </button>
            <button
              type="button"
              onClick={jumpToJan2027}
              className={`px-2.5 py-1 rounded font-medium transition-colors ${
                currentYear === 2027 && currentMonth === 0
                  ? 'bg-navy-900 text-white font-bold'
                  : 'text-slate-600 hover:text-navy-900'
              }`}
            >
              Jan 2027
            </button>
          </div>

          <button
            type="button"
            onClick={handleSelectEntireMonth}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
          >
            Select Month
          </button>

          {selectedDates.length > 0 && (
            <>
              <button
                type="button"
                onClick={() => onBatchSelect([])}
                className="px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-500 hover:text-slate-800 transition-colors"
              >
                Clear ({selectedDates.length})
              </button>

              <button
                type="button"
                onClick={onAddSelectedToMonitoring}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-saffron-600 hover:bg-saffron-700 text-white shadow-xs transition-all"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Monitor Selected ({selectedDates.length})</span>
              </button>
            </>
          )}

          {onMonitorAllDates && (
            <button
              type="button"
              onClick={onMonitorAllDates}
              className="px-3 py-1.5 rounded-lg text-xs font-bold border border-slate-300 text-slate-700 hover:bg-slate-50 transition-colors"
            >
              Monitor Entire Season
            </button>
          )}
        </div>
      </div>

      {/* Status Legend */}
      <div className="px-4 sm:px-6 py-2.5 bg-slate-50 border-b border-slate-100 flex flex-wrap items-center gap-4 text-xs font-medium text-slate-600">
        <span className="font-bold text-navy-900 text-[11px] uppercase tracking-wider">Legend:</span>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-md bg-emerald-500"></span>
          <span>Available</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-md bg-rose-500"></span>
          <span>Booked</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-md bg-blue-500"></span>
          <span>Newly Available</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-md bg-slate-400"></span>
          <span>Blocked</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-md bg-amber-400"></span>
          <span>Unknown / Off-Season</span>
        </div>
        <div className="flex items-center gap-1.5 ml-auto text-[11px] text-slate-400">
          <span className="inline-block w-2 h-2 rounded-full border border-saffron-500 bg-saffron-100"></span>
          <span>Dot indicates currently monitored</span>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="p-3 sm:p-6">
        {/* Weekday headers */}
        <div className="grid grid-cols-7 gap-1.5 sm:gap-2 mb-2 text-center text-xs font-bold uppercase tracking-wider text-slate-400">
          {WEEKDAYS.map((day) => (
            <div key={day} className="py-1">
              {day}
            </div>
          ))}
        </div>

        {/* Days cells */}
        <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
          {calendarDays.map((cell, idx) => {
            const status = getDateStatus(cell.dateStr, apiData, newlyAvailableDates);
            const isMonitored = monitoredSet.has(cell.dateStr);
            const isSelected = selectedSet.has(cell.dateStr);

            return (
              <div
                key={idx}
                onClick={() => onSelectDate && onSelectDate(cell.dateStr)}
                onMouseEnter={() => setHoveredDate(cell.dateStr)}
                onMouseLeave={() => setHoveredDate(null)}
                className={`
                  ${getDayStatusStyle(status, isMonitored, isSelected)}
                  ${!cell.isCurrentMonth ? 'opacity-35 grayscale-[50%]' : ''}
                `}
              >
                {/* Top row: day number and monitored badge */}
                <div className="w-full flex items-center justify-between">
                  <span className={`text-xs sm:text-sm font-bold ${cell.isCurrentMonth ? 'text-navy-900' : 'text-slate-400'}`}>
                    {cell.dayNumber}
                  </span>
                  {isMonitored && (
                    <span
                      title="Actively Monitored"
                      className="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full bg-saffron-600 ring-2 ring-white"
                    ></span>
                  )}
                </div>

                {/* Bottom row: status indicator pill */}
                <div className="w-full flex items-center justify-between mt-1">
                  <div className="flex items-center gap-1">
                    {getStatusBadgePill(status)}
                    <span className="hidden sm:inline text-[10px] font-bold uppercase tracking-tight truncate">
                      {status === 'NEWLY_AVAILABLE' ? 'NEW' : status}
                    </span>
                  </div>
                  {isSelected && (
                    <span className="p-0.5 rounded bg-saffron-600 text-white">
                      <Check className="w-2.5 h-2.5" />
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Floating Info Tooltip / Inspector bar */}
      <div className="p-3 sm:p-4 bg-slate-50 border-t border-slate-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs">
        {hoveredDate ? (
          <div className="flex items-center gap-3">
            <span className="font-bold text-navy-900">{formatDisplayDate(hoveredDate)} ({hoveredDate}):</span>
            <span className="font-semibold text-slate-700">Status: <b className="capitalize">{hoveredStatus}</b></span>
            <span>•</span>
            <span className={isHoveredMonitored ? 'text-saffron-700 font-bold' : 'text-slate-500'}>
              {isHoveredMonitored ? '✓ In Monitoring List' : 'Not monitored'}
            </span>
            {apiData?.reportingTime && (
              <>
                <span>•</span>
                <span className="text-slate-500">Reporting Time: {apiData.reportingTime} mins</span>
              </>
            )}
          </div>
        ) : (
          <div className="flex items-center gap-2 text-slate-500">
            <Info className="w-4 h-4 text-slate-400" />
            <span>Hover over any date to inspect slot details. Click to select or multi-select dates.</span>
          </div>
        )}

        <div className="text-slate-500 text-[11px]">
          {selectedDates.length > 0 ? `${selectedDates.length} date(s) selected` : 'Click dates to select'}
        </div>
      </div>
    </div>
  );
}
