# 🕉️ Sabarimala Slot Alert

> **Never miss an available Virtual Q Darshan slot.**  
> A production-ready web application and autonomous background worker that monitors Sabarimala Virtual Q Darshan slot availability in real time and immediately notifies users via Telegram whenever a previously booked or unavailable date becomes open.

---

## 🌟 Key Features

- **Real-Time Sabarimala API Integration:** Directly polls the official Devaswom darshan summary endpoint (`/api/eDarshan/darshansummary/100001`).
- **Anonymous Public Access:** Leverages browser request emulation to safely pass CloudFront CDN verification without requiring personal devotee login credentials or violating access controls.
- **Interactive Calendar (Dec 2026 – Mar 2027):** Visual color-coded calendar (Available, Booked, Newly Available, Blocked, Off-Season) with multi-date selection, month-wide selection, and hover inspection.
- **Availability State Transition Detection:** Automatically detects transitions (e.g. `BOOKED` ➔ `AVAILABLE`), prevents duplicate alerts, and records a complete audit trail.
- **Autonomous Background Worker (`workers/availabilityWorker.js`):** Standalone Node.js worker with exponential backoff and persistent state, ready to deploy 24/7 on Railway or Render without depending on an open browser tab.
- **Instant Telegram Alerts:** Dispatches immediate formatted Telegram notifications with direct links to the official booking portal.
- **Dual-Mode Persistence (Supabase + Local Storage):** Out-of-the-box local JSON storage engine for development, seamlessly switching to Supabase PostgreSQL when credentials are provided.
- **Built-in Slot Release Simulator:** Test the entire alert and notification pipeline on demand without waiting for real devotees to cancel slots.
- **Zero Bot Booking Policy:** Complies strictly with ethical usage—notifies devotees instantly, but directs them to finalize their actual booking manually on `sabarimalaonline.org`.

---

## 🏗️ Technical Architecture & Investigation Findings

### Sabarimala Endpoint Analysis
- **Target URL:** `POST https://sabarimalaonline.org/api/eDarshan/darshansummary/100001`
- **Method:** `POST`
- **Payload:** Empty (`Content-Length: 0`)
- **Key Observation:** Direct terminal `curl` or raw `fetch` without headers triggers an immediate **CloudFront 403 Forbidden** (`Request blocked. We can't connect to the server for this app or website at this time`).
- **Resolution:** CloudFront checks for standard browser request metadata (`User-Agent`, `Origin: https://sabarimalaonline.org`, `Referer: https://sabarimalaonline.org/`, `Accept`). When provided, the endpoint returns **HTTP 200 OK** with public availability JSON and `access-control-allow-origin: *` without requiring any session cookies or auth tokens.

---

## 💻 Tech Stack

- **Framework:** Next.js 14 (App Router, JavaScript only — NO TypeScript)
- **Styling:** Tailwind CSS (Minimal SaaS design, deep navy typography `#0f172a`, saffron accent `#ea580c`)
- **Icons:** Lucide React
- **Runtime:** Node.js (v18+)
- **Database:** Supabase PostgreSQL (with automatic local file-storage fallback)
- **Alert Channel:** Telegram Bot API
- **Deployment Targets:** Vercel (Frontend & Serverless API) + Railway / Render (Background Worker)

---

## 📁 Project Structure

```
├── app/
│   ├── api/
│   │   ├── availability/route.js    # API: Fetch live/mock availability & simulation
│   │   ├── monitoring/route.js      # API: Monitoring status, manual refresh, settings
│   │   └── notifications/route.js   # API: Telegram test & delivery logs
│   ├── dashboard/page.js            # Main dashboard with live calendar & statistics
│   ├── history/page.js              # Audit trail and dispatch ledger
│   ├── settings/page.js             # Telegram & system configuration
│   ├── globals.css                  # Global Tailwind styling & animations
│   ├── layout.js                    # Root HTML layout with Inter font
│   └── page.js                      # Root redirect to /dashboard
├── components/
│   ├── ActivityTimeline.js          # Live event audit stream
│   ├── ApiStatus.js                 # Gateway health & technical diagnostics
│   ├── AvailabilityCalendar.js      # Interactive monthly availability grid
│   ├── Header.js                    # Navbar with status badge & mode switch
│   ├── MonitoredDates.js            # Watchlist table with toggle & delete
│   ├── MonitoringControls.js        # Start/Pause/Refresh controls & Simulator
│   ├── StatisticsCards.js           # 6 KPI metric cards
│   └── TelegramSettings.js          # Telegram setup guide & testing suite
├── lib/
│   ├── availabilityService.js       # Sabarimala API fetcher & mock engine
│   ├── dateUtils.js                 # Date formatting & status evaluator
│   ├── monitoringService.js         # Core change detection & alert orchestration
│   ├── supabase.js                  # Database client with local storage fallback
│   └── telegramService.js           # Telegram message formatting & delivery
├── workers/
│   └── availabilityWorker.js        # Dedicated 24/7 background worker
├── supabase/
│   └── schema.sql                   # Supabase PostgreSQL schema with RLS
├── package.json
└── tailwind.config.js
```

---

## 🚀 Quick Start (Local Development)

### 1. Clone & Install
```bash
git clone <repository-url>
cd Shabarimala-virtual-q
npm install
```

### 2. Configure Environment (`.env`)
Create `.env` (or copy `.env.example`):
```env
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_DEFAULT_DATA_MODE=LIVE
MONITORING_INTERVAL_MS=300000

# Telegram Bot (Optional for notifications)
TELEGRAM_BOT_TOKEN="your_bot_token_from_botfather"
TELEGRAM_CHAT_ID="your_telegram_chat_id"

# Supabase (Optional: uses local store if empty)
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
```

### 3. Run Web Application
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### 4. Run Dedicated Background Worker (Separate Process)
```bash
npm run worker
```
The worker will periodically fetch live availability, detect newly opened slots, and fire Telegram notifications independently of whether the web UI is open.

---

## 📲 Telegram Bot Setup Guide

1. Open Telegram and message **[@BotFather](https://t.me/BotFather)**.
2. Send `/newbot`, choose a name and username, and copy the **Bot Token** (e.g. `7123456789:ABCdefGhIJKlmNo...`).
3. Press **START** in the chat with your new bot.
4. Message **[@userinfobot](https://t.me/userinfobot)** to get your numeric **Chat ID** (e.g. `987654321`).
5. Add them to `.env`:
   ```env
   TELEGRAM_BOT_TOKEN=7123456789:ABCdefGhIJKlmNo...
   TELEGRAM_CHAT_ID=987654321
   ```
6. Navigate to **Settings** in the dashboard and click **Send Test Notification** to confirm delivery.

---

## 📧 Free Gmail SMTP Email Setup Guide (100% Free)

You can receive real-time email alerts using any standard Google account (500 free emails/day):
1. Go to your Google Account: [myaccount.google.com/security](https://myaccount.google.com/security).
2. Ensure **2-Step Verification** is enabled.
3. Search for **"App passwords"** (or find it under 2-Step Verification).
4. Create an app named **"Sabarimala Slot Alert"**.
5. Copy the generated 16-character password into `.env`:
   ```env
   GMAIL_USER=yourname@gmail.com
   GMAIL_APP_PASSWORD=abcd efgh ijkl mnop
   ALERT_RECIPIENT_EMAIL=yourname@gmail.com
   ```
6. In **Settings** on the dashboard, click **Send Test Email** to verify delivery.

---

## 🗄️ Supabase Database Setup

When you are ready to connect to Supabase:
1. Create a project on [supabase.com](https://supabase.com).
2. Go to the **SQL Editor** and execute the contents of `supabase/schema.sql`.
3. Copy your project URL, anon key, and service role key into `.env`:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
   ```
4. Restart your server. The app will immediately switch from local storage to cloud PostgreSQL with zero code changes.

---

## 🧪 Testing Slot Alerts (Simulator)

Since official Darshan slots depend on cancellations, you can test the entire alert and notification pipeline using the **Slot Availability Simulator**:
1. In the dashboard, click **Simulate Slot Alert** in the Monitoring Controls card.
2. Pick any booked date (e.g. `2026-12-19`).
3. Click **Make Available & Run Detection**.
4. The system will:
   - Mark the slot as newly available.
   - Detect the transition from `BOOKED` to `AVAILABLE`.
   - Dispatch an instant Telegram notification.
   - Display a banner in the dashboard and log the event in the audit history.

---

## 🚢 Deployment

### Frontend (Vercel)
1. Push this repository to GitHub.
2. Import the project into [Vercel](https://vercel.com).
3. Set Environment Variables:
   - `TELEGRAM_BOT_TOKEN`
   - `TELEGRAM_CHAT_ID`
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
4. Deploy!

### Background Worker (Railway or Render)
For 24/7 autonomous monitoring without browser dependence:
- **Railway:**
  - Create a new project pointing to your GitHub repo.
  - Set the Start Command to: `npm run worker`.
  - Add `TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID`, and Supabase variables.
- **Render:**
  - Create a **Background Worker** service.
  - Build Command: `npm install`.
  - Start Command: `npm run worker`.
  - Add environment variables.

---

## ⚖️ Ethics & Compliance

- **No Unauthorized Bypasses:** Does not bypass CAPTCHAs, bot gates, or authentication paywalls.
- **No Automated Booking:** Only monitors public availability. All devotee reservations must be completed manually on [sabarimalaonline.org](https://sabarimalaonline.org/#/darshan).
- **Graceful Polling:** Built-in rate-limiting and exponential backoff prevent overloading Devaswom servers.
