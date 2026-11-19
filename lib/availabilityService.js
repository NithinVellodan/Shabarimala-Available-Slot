// Sabarimala Availability Service
// Connects to the official Sabarimala Virtual Q darshansummary endpoint
// and provides fallback/mock data for testing state changes.

const SABARIMALA_ENDPOINT = process.env.SABARIMALA_API_URL || 'https://sabarimalaonline.org/api/eDarshan/darshansummary/100001';

// In-memory mock state for simulation mode
let mockState = {
  availableDatesList: ["2027-01-07", "2027-01-08", "2027-01-09"],
  startAndEndDates: ["2026-11-20", "2027-03-09"],
  blockedDates: [],
  bookedDates: [
    "2026-11-20", "2026-11-21", "2026-11-22", "2026-11-23", "2026-11-24",
    "2026-11-25", "2026-11-26", "2026-11-27", "2026-11-28", "2026-11-29",
    "2026-11-30", "2026-12-01", "2026-12-02", "2026-12-03", "2026-12-04",
    "2026-12-05", "2026-12-06", "2026-12-07", "2026-12-08", "2026-12-09",
    "2026-12-10", "2026-12-11", "2026-12-12", "2026-12-13", "2026-12-14",
    "2026-12-15", "2026-12-16", "2026-12-17", "2026-12-18", "2026-12-19",
    "2026-12-20", "2026-12-21", "2026-12-22", "2026-12-23", "2026-12-24",
    "2026-12-25", "2026-12-31", "2027-01-01", "2027-01-02", "2027-01-03",
    "2027-01-04", "2027-01-05", "2027-01-06"
  ],
  reportingTime: "180",
  welfare: "Y",
  frequency: null,
  frequencyList: null
};

/**
 * Standard browser emulation headers to prevent CloudFront 403
 */
export function getStandardBrowserHeaders() {
  return {
    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
    'Accept': 'application/json, text/plain, */*',
    'Accept-Language': 'en-US,en;q=0.9',
    'Content-Type': 'application/json',
    'Origin': 'https://sabarimalaonline.org',
    'Referer': 'https://sabarimalaonline.org/',
    'sec-ch-ua': '"Chromium";v="131", "Google Chrome";v="131", "Not_A Brand";v="24"',
    'sec-ch-ua-mobile': '?0',
    'sec-ch-ua-platform': '"macOS"',
    'sec-fetch-dest': 'empty',
    'sec-fetch-mode': 'cors',
    'sec-fetch-site': 'same-origin',
    'Cache-Control': 'no-cache'
  };
}

/**
 * Validates the raw API response structure
 */
export function validateApiResponse(data) {
  if (!data || typeof data !== 'object') {
    return { valid: false, reason: 'Response is not a valid JSON object' };
  }
  if (!Array.isArray(data.availableDatesList)) {
    return { valid: false, reason: 'Missing availableDatesList array' };
  }
  if (!Array.isArray(data.bookedDates)) {
    return { valid: false, reason: 'Missing bookedDates array' };
  }
  if (!Array.isArray(data.startAndEndDates) || data.startAndEndDates.length < 2) {
    return { valid: false, reason: 'Missing or invalid startAndEndDates' };
  }
  return { valid: true };
}

/**
 * Fetches live availability from official Sabarimala endpoint
 */
export async function fetchLiveAvailability(timeoutMs = 15000) {
  const startTime = Date.now();
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(SABARIMALA_ENDPOINT, {
      method: 'POST',
      headers: getStandardBrowserHeaders(),
      signal: controller.signal
    });

    clearTimeout(timeoutId);
    const latency = Date.now() - startTime;

    if (response.status === 403) {
      return {
        success: false,
        status: 'ACCESS_BLOCKED',
        statusCode: 403,
        error: 'CloudFront or WAF rejected the server request (HTTP 403)',
        latency,
        checkedAt: new Date().toISOString()
      };
    }

    if (response.status === 401) {
      return {
        success: false,
        status: 'AUTHENTICATION_REQUIRED',
        statusCode: 401,
        error: 'Sabarimala API requires an active session or authentication token',
        latency,
        checkedAt: new Date().toISOString()
      };
    }

    if (!response.ok) {
      return {
        success: false,
        status: 'NETWORK_ERROR',
        statusCode: response.status,
        error: `Official API returned HTTP ${response.status}`,
        latency,
        checkedAt: new Date().toISOString()
      };
    }

    const data = await response.json();
    const validation = validateApiResponse(data);
    if (!validation.valid) {
      return {
        success: false,
        status: 'NETWORK_ERROR',
        statusCode: 200,
        error: `Unexpected payload schema: ${validation.reason}`,
        latency,
        checkedAt: new Date().toISOString()
      };
    }

    return {
      success: true,
      status: 'CONNECTED',
      statusCode: 200,
      data: {
        availableDatesList: data.availableDatesList || [],
        bookedDates: data.bookedDates || [],
        blockedDates: data.blockedDates || [],
        startAndEndDates: data.startAndEndDates || [],
        reportingTime: data.reportingTime || '180',
        welfare: data.welfare || 'Y'
      },
      latency,
      checkedAt: new Date().toISOString()
    };
  } catch (err) {
    clearTimeout(timeoutId);
    const latency = Date.now() - startTime;
    const isTimeout = err.name === 'AbortError';

    return {
      success: false,
      status: 'NETWORK_ERROR',
      statusCode: 0,
      error: isTimeout ? 'Request timed out after 15 seconds' : err.message,
      latency,
      checkedAt: new Date().toISOString()
    };
  }
}

/**
 * Returns mock availability data for safe testing & simulation
 */
export function getMockAvailability() {
  return {
    success: true,
    status: 'CONNECTED',
    isMock: true,
    statusCode: 200,
    latency: 120,
    data: JSON.parse(JSON.stringify(mockState)),
    checkedAt: new Date().toISOString()
  };
}

/**
 * Simulates a date becoming available in mock state (e.g. for demonstrating alerts)
 */
export function simulateDateAvailability(dateStr, makeAvailable = true) {
  if (makeAvailable) {
    mockState.bookedDates = mockState.bookedDates.filter(d => d !== dateStr);
    mockState.blockedDates = mockState.blockedDates.filter(d => d !== dateStr);
    if (!mockState.availableDatesList.includes(dateStr)) {
      mockState.availableDatesList.push(dateStr);
    }
  } else {
    mockState.availableDatesList = mockState.availableDatesList.filter(d => d !== dateStr);
    if (!mockState.bookedDates.includes(dateStr)) {
      mockState.bookedDates.push(dateStr);
    }
  }
  return mockState;
}

/**
 * Resets mock state to baseline
 */
export function resetMockState() {
  mockState = {
    availableDatesList: ["2027-01-07", "2027-01-08", "2027-01-09"],
    startAndEndDates: ["2026-11-20", "2027-03-09"],
    blockedDates: [],
    bookedDates: [
      "2026-11-20", "2026-11-21", "2026-11-22", "2026-11-23", "2026-11-24",
      "2026-11-25", "2026-11-26", "2026-11-27", "2026-11-28", "2026-11-29",
      "2026-11-30", "2026-12-01", "2026-12-02", "2026-12-03", "2026-12-04",
      "2026-12-05", "2026-12-06", "2026-12-07", "2026-12-08", "2026-12-09",
      "2026-12-10", "2026-12-11", "2026-12-12", "2026-12-13", "2026-12-14",
      "2026-12-15", "2026-12-16", "2026-12-17", "2026-12-18", "2026-12-19",
      "2026-12-20", "2026-12-21", "2026-12-22", "2026-12-23", "2026-12-24",
      "2026-12-25", "2026-12-31", "2027-01-01", "2027-01-02", "2027-01-03",
      "2027-01-04", "2027-01-05", "2027-01-06"
    ],
    reportingTime: "180",
    welfare: "Y",
    frequency: null,
    frequencyList: null
  };
  return mockState;
}

/**
 * Universal availability resolver: respects setting or mode parameter
 */
export async function getAvailability(forceMode = null) {
  const mode = forceMode || process.env.NEXT_PUBLIC_DEFAULT_DATA_MODE || 'LIVE';

  if (mode === 'MOCK') {
    return getMockAvailability();
  }

  // Try live first
  const liveResult = await fetchLiveAvailability();
  if (liveResult.success) {
    return liveResult;
  }

  // If live failed due to access block, return the status transparently!
  // Do NOT mask the failure or pretend it's available.
  return liveResult;
}
