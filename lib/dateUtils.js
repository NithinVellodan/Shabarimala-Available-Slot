// Date utility functions for Sabarimala Slot Alert

/**
 * Normalizes any date to YYYY-MM-DD format in local/UTC consistent representation
 */
export function formatDate(date) {
  if (!date) return '';
  if (typeof date === 'string') {
    // If already in YYYY-MM-DD
    if (/^\d{4}-\d{2}-\d{2}$/.test(date)) return date;
    const d = new Date(date);
    if (isNaN(d.getTime())) return date;
    return d.toISOString().split('T')[0];
  }
  const d = new Date(date);
  if (isNaN(d.getTime())) return '';
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Human readable date: e.g. "19 December 2026"
 */
export function formatDisplayDate(dateStr) {
  if (!dateStr) return '';
  const [year, month, day] = dateStr.split('-');
  if (!year || !month || !day) return dateStr;
  const d = new Date(parseInt(year, 10), parseInt(month, 10) - 1, parseInt(day, 10));
  return d.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });
}

/**
 * Formats full timestamp in IST: e.g. "19 Nov 2026, 02:55:10 PM IST"
 */
export function formatTimestamp(isoStr) {
  if (!isoStr) return 'Never';
  const d = new Date(isoStr);
  if (isNaN(d.getTime())) return 'Invalid date';
  const formatted = new Intl.DateTimeFormat('en-IN', {
    timeZone: 'Asia/Kolkata',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true
  }).format(d);
  return `${formatted.replace(/\b(am|pm)\b/i, m => m.toUpperCase())} IST`;
}

/**
 * Formats time in IST: e.g. "02:55:10 PM IST"
 * Falls back to current time in IST if no valid timestamp is provided.
 */
export function formatISTTime(dateOrIso, includeSeconds = true) {
  const d = dateOrIso ? new Date(dateOrIso) : new Date();
  const validDate = isNaN(d.getTime()) ? new Date() : d;
  const options = {
    timeZone: 'Asia/Kolkata',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  };
  if (includeSeconds) {
    options.second = '2-digit';
  }
  const formatted = new Intl.DateTimeFormat('en-IN', options).format(validDate);
  return `${formatted.replace(/\b(am|pm)\b/i, m => m.toUpperCase())} IST`;
}

/**
 * Returns current time in IST formatted
 */
export function getCurrentISTTime(includeSeconds = true) {
  return formatISTTime(new Date(), includeSeconds);
}

/**
 * Relative time: e.g. "2 minutes ago", "Just now"
 */
export function timeAgo(isoStr) {
  if (!isoStr) return 'Never';
  const date = new Date(isoStr);
  if (isNaN(date.getTime())) return 'Never';
  const now = new Date();
  const diffInSeconds = Math.floor((now - date) / 1000);

  if (diffInSeconds < 10) return 'Just now';
  if (diffInSeconds < 60) return `${Math.max(1, diffInSeconds)}s ago`;
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return `${diffInHours}h ago`;
  const diffInDays = Math.floor(diffInHours / 24);
  return `${diffInDays}d ago`;
}

/**
 * Checks if a date falls within [startDate, endDate] inclusive
 */
export function isDateWithinSeason(dateStr, startAndEndDates) {
  if (!dateStr || !startAndEndDates || startAndEndDates.length < 2) return false;
  const [start, end] = startAndEndDates;
  return dateStr >= start && dateStr <= end;
}

/**
 * Evaluates the status of a specific date based on API response lists
 * AVAILABLE | BOOKED | BLOCKED | UNKNOWN
 */
export function getDateStatus(dateStr, apiData, newlyAvailableDates = []) {
  if (!apiData) return 'UNKNOWN';

  // Check if it's marked as newly available in session
  if (newlyAvailableDates && newlyAvailableDates.includes(dateStr)) {
    return 'NEWLY_AVAILABLE';
  }

  const { availableDatesList = [], bookedDates = [], blockedDates = [], startAndEndDates = [] } = apiData;

  // Validate against startAndEndDates
  if (startAndEndDates.length >= 2) {
    if (!isDateWithinSeason(dateStr, startAndEndDates)) {
      return 'UNKNOWN';
    }
  }

  if (availableDatesList && availableDatesList.includes(dateStr)) {
    return 'AVAILABLE';
  }
  if (bookedDates && bookedDates.includes(dateStr)) {
    return 'BOOKED';
  }
  if (blockedDates && blockedDates.includes(dateStr)) {
    return 'BLOCKED';
  }

  return 'UNKNOWN';
}

/**
 * Helper to build calendar grid for a given year and month (0-indexed month)
 */
export function getCalendarMonthData(year, month) {
  const firstDayOfMonth = new Date(year, month, 1);
  const lastDayOfMonth = new Date(year, month + 1, 0);

  const startDayOfWeek = firstDayOfMonth.getDay(); // 0 is Sunday
  const daysInMonth = lastDayOfMonth.getDate();

  // Days from previous month to pad the start
  const prevMonthLastDay = new Date(year, month, 0).getDate();
  const paddingDaysBefore = [];
  for (let i = startDayOfWeek - 1; i >= 0; i--) {
    const day = prevMonthLastDay - i;
    const prevMonth = month === 0 ? 11 : month - 1;
    const prevYear = month === 0 ? year - 1 : year;
    const mStr = String(prevMonth + 1).padStart(2, '0');
    const dStr = String(day).padStart(2, '0');
    paddingDaysBefore.push({
      dateStr: `${prevYear}-${mStr}-${dStr}`,
      dayNumber: day,
      isCurrentMonth: false
    });
  }

  // Days of current month
  const currentMonthDays = [];
  for (let day = 1; day <= daysInMonth; day++) {
    const mStr = String(month + 1).padStart(2, '0');
    const dStr = String(day).padStart(2, '0');
    currentMonthDays.push({
      dateStr: `${year}-${mStr}-${dStr}`,
      dayNumber: day,
      isCurrentMonth: true
    });
  }

  // Days from next month to complete the grid (up to 42 cells or 35 cells)
  const totalCells = Math.ceil((paddingDaysBefore.length + currentMonthDays.length) / 7) * 7;
  const paddingDaysAfter = [];
  const remainingCells = totalCells - (paddingDaysBefore.length + currentMonthDays.length);
  for (let day = 1; day <= remainingCells; day++) {
    const nextMonth = month === 11 ? 0 : month + 1;
    const nextYear = month === 11 ? year + 1 : year;
    const mStr = String(nextMonth + 1).padStart(2, '0');
    const dStr = String(day).padStart(2, '0');
    paddingDaysAfter.push({
      dateStr: `${nextYear}-${mStr}-${dStr}`,
      dayNumber: day,
      isCurrentMonth: false
    });
  }

  return [...paddingDaysBefore, ...currentMonthDays, ...paddingDaysAfter];
}
