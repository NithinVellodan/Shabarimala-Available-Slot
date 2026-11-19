'use client';

import { useState } from 'react';
import {
  ShieldCheck,
  Info,
  AlertTriangle,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  BookOpen,
  Ban,
  CreditCard,
  Globe,
  Lock,
  Phone,
  FileText,
  HelpCircle,
} from 'lucide-react';

const sections = [
  {
    id: 'purpose',
    icon: <Info className="w-4 h-4" />,
    title: 'Purpose & Nature of This Service',
    color: 'blue',
    content: (
      <div className="space-y-3 text-sm text-slate-700 leading-relaxed">
        <p>
          This website — <strong>"Sabarimala Slot Alert / Virtual Q Darshan Monitor"</strong> — is a
          <strong> purely informational, free, devotional-service tool</strong> created to assist
          Ayyappa devotees in tracking the availability of Darshan slots on the official
          Sabarimala Virtual Queue (Virtual Q) portal.
        </p>
        <p>
          The service continuously monitors the official Sabarimala Virtual Q API
          (<a href="https://sabarimalaonline.org" target="_blank" rel="noopener noreferrer" className="text-saffron-700 underline font-semibold">sabarimalaonline.org</a>)
          and delivers real-time email notifications to registered devotees when slots become available.
          No human intervention is involved — the monitoring is fully automated.
        </p>
        <p>
          The sole purpose of this tool is to <strong>notify devotees</strong> so they can visit the
          official portal at the right time and complete their own booking. This service itself
          performs <u>no booking</u> of any kind.
        </p>
      </div>
    ),
  },
  {
    id: 'no-booking',
    icon: <Ban className="w-4 h-4" />,
    title: 'No Booking Service — We Do Not Book Slots',
    color: 'rose',
    content: (
      <div className="space-y-3 text-sm text-slate-700 leading-relaxed">
        <div className="bg-rose-50 border border-rose-200 rounded-xl p-3 flex gap-2">
          <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          <p className="font-semibold text-rose-800">
            This website does <u>NOT</u> book, reserve, allocate, or hold any Sabarimala Darshan
            slots on behalf of any devotee or pilgrim.
          </p>
        </div>
        <ul className="list-disc pl-5 space-y-1.5">
          <li>No booking is ever made through this platform.</li>
          <li>No slot is reserved, locked, or held in your name by this service.</li>
          <li>We have no access to the Sabarimala booking backend to place bookings.</li>
          <li>Receiving an alert from this service does <strong>not</strong> mean a slot is booked for you.</li>
          <li>Upon receiving an alert, the devotee must immediately visit the official portal and
            complete the booking themselves.</li>
          <li>Slots are limited and highly competitive — an alert does not guarantee you will
            successfully book a slot before others.</li>
        </ul>
        <p className="font-semibold text-navy-900">
          👉 All Darshan bookings must be done directly at:{' '}
          <a href="https://sabarimalaonline.org/#/darshan" target="_blank" rel="noopener noreferrer"
            className="text-saffron-700 underline">
            sabarimalaonline.org
          </a>
        </p>
      </div>
    ),
  },
  {
    id: 'no-payment',
    icon: <CreditCard className="w-4 h-4" />,
    title: 'No Payment — Completely Free of Charge',
    color: 'emerald',
    content: (
      <div className="space-y-3 text-sm text-slate-700 leading-relaxed">
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 flex gap-2">
          <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
          <p className="font-semibold text-emerald-800">
            This service is <u>completely free</u>. We do not charge any fee, commission,
            subscription, or donation for using this tool.
          </p>
        </div>
        <ul className="list-disc pl-5 space-y-1.5">
          <li>No registration fee, subscription fee, or one-time charge.</li>
          <li>No payment gateway integration — we do not collect card, UPI, or bank details.</li>
          <li>No premium tier or paid plan — all features are free for all devotees.</li>
          <li>We will <strong>never</strong> ask for money in exchange for slot alerts or booking assistance.</li>
          <li>If anyone claims to offer Sabarimala slots for a fee using this service, it is a
            <strong className="text-rose-700"> fraud</strong>. Please report it immediately.</li>
        </ul>
        <p className="text-xs text-slate-500 italic">
          Official Sabarimala Virtual Q slot booking fees (if any) are paid directly on the official
          government portal and are unrelated to this service.
        </p>
      </div>
    ),
  },
  {
    id: 'no-affiliation',
    icon: <Globe className="w-4 h-4" />,
    title: 'No Affiliation with TDB or Government',
    color: 'amber',
    content: (
      <div className="space-y-3 text-sm text-slate-700 leading-relaxed">
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex gap-2">
          <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <p className="font-semibold text-amber-800">
            This website has <u>no official affiliation</u> with the Travancore Devaswom Board (TDB),
            the Government of Kerala, Sabarimala Temple authorities, or any associated government body.
          </p>
        </div>
        <ul className="list-disc pl-5 space-y-1.5">
          <li>This is an independent, privately developed devotional-service tool.</li>
          <li>We are not endorsed by, affiliated with, or authorised by TDB or any government entity.</li>
          <li>The official Sabarimala Virtual Q system is operated exclusively by the Kerala Government /
            Travancore Devaswom Board.</li>
          <li>All official communications, booking confirmations, and ticketing are issued solely by the
            TDB through their official channels.</li>
          <li>For official information, visit:{' '}
            <a href="https://www.sabarimala.kerala.gov.in" target="_blank" rel="noopener noreferrer"
              className="text-saffron-700 underline">
              sabarimala.kerala.gov.in
            </a>
          </li>
        </ul>
      </div>
    ),
  },
  {
    id: 'accuracy',
    icon: <HelpCircle className="w-4 h-4" />,
    title: 'Accuracy & Reliability Disclaimer',
    color: 'purple',
    content: (
      <div className="space-y-3 text-sm text-slate-700 leading-relaxed">
        <ul className="list-disc pl-5 space-y-1.5">
          <li>
            Slot availability data is fetched from the official Sabarimala API in near-real time.
            However, there may be a <strong>monitoring interval delay</strong> (typically 60–120 seconds)
            between when a slot opens on the official portal and when this service detects it.
          </li>
          <li>
            Availability shown on this dashboard reflects the status at the time of the last API check.
            It is <strong>not a guarantee</strong> that slots will still be available when you visit the
            official portal.
          </li>
          <li>
            The official Sabarimala portal may be under maintenance, have rate-limiting, or be
            temporarily inaccessible. During such periods, this service may show stale data or be
            unable to send alerts.
          </li>
          <li>
            We are not responsible for missed booking opportunities due to alert delays, server
            downtime, email delivery failures, spam filtering, or any other technical issue.
          </li>
          <li>
            Use of this service is entirely at the devotee's own discretion and risk.
          </li>
        </ul>
      </div>
    ),
  },
  {
    id: 'responsibility',
    icon: <BookOpen className="w-4 h-4" />,
    title: "Pilgrim's Responsibility",
    color: 'saffron',
    content: (
      <div className="space-y-3 text-sm text-slate-700 leading-relaxed">
        <p>
          Every pilgrim who uses this alert service retains full and sole responsibility for their
          own Sabarimala yatra, including but not limited to:
        </p>
        <ul className="list-disc pl-5 space-y-1.5">
          <li>Completing the official Virtual Q booking on <a href="https://sabarimalaonline.org" target="_blank" rel="noopener noreferrer" className="text-saffron-700 underline">sabarimalaonline.org</a>.</li>
          <li>Obtaining the official booking confirmation and Virtual Q ticket from the portal.</li>
          <li>Ensuring all pilgrim details (name, age, ID proof) entered on the official portal are
            accurate and valid.</li>
          <li>Adhering to all Sabarimala pilgrimage rules, dress code, and guidelines as stipulated
            by the Travancore Devaswom Board.</li>
          <li>Completing the mandatory 41-day Mandala Deeksha (penance period) before the pilgrimage,
            as per tradition.</li>
          <li>Carrying valid ID proof during the pilgrimage as required by the authorities.</li>
          <li>Planning travel, accommodation, and health preparations independently.</li>
          <li>Verifying all booking details directly on the official portal before travel.</li>
        </ul>
        <p className="text-xs text-slate-500 italic mt-1">
          This service is merely a notification helper — the full responsibility of the pilgrimage
          and booking lies with the devotee.
        </p>
      </div>
    ),
  },
  {
    id: 'privacy',
    icon: <Lock className="w-4 h-4" />,
    title: 'Privacy & Data Usage',
    color: 'slate',
    content: (
      <div className="space-y-3 text-sm text-slate-700 leading-relaxed">
        <ul className="list-disc pl-5 space-y-1.5">
          <li>
            The only personal information collected is the <strong>alert recipient name and email
            address(es)</strong> entered by the user for the purpose of sending slot availability
            notifications.
          </li>
          <li>
            Email addresses are stored securely and are used <strong>exclusively</strong> for sending
            Sabarimala slot availability alerts. They are never sold, shared, or used for any other
            purpose.
          </li>
          <li>
            No login, password, Aadhaar, or government ID information is collected by this service.
          </li>
          <li>
            Users can remove their email address at any time by visiting the alert settings on the
            dashboard.
          </li>
          <li>
            This service does not use tracking cookies, analytics, or advertising scripts.
          </li>
        </ul>
      </div>
    ),
  },
  {
    id: 'contact',
    icon: <Phone className="w-4 h-4" />,
    title: 'Contact & Feedback',
    color: 'teal',
    content: (
      <div className="space-y-3 text-sm text-slate-700 leading-relaxed">
        <p>
          This tool is built and maintained with devotion for Lord Ayyappa by a volunteer developer
          as a service to the Ayyappa devotee community. It is provided free of charge as a
          <em> seva</em> (selfless service).
        </p>
        <p>
          If you encounter any technical issues, false alerts, or have suggestions for improvement,
          please reach out. We are committed to keeping this service accurate and reliable for every
          Swami who wishes to visit Sabarimala.
        </p>
        <div className="bg-saffron-50 border border-saffron-200 rounded-xl p-3 mt-2">
          <p className="text-xs font-bold text-saffron-900">
            🙏 Swamiye Saranam Ayyappa — May Lord Ayyappa bless your pilgrimage and grant you
            darshan at the sacred Sannidhanam.
          </p>
        </div>
      </div>
    ),
  },
];

const colorMap = {
  blue: { bg: 'bg-blue-50', border: 'border-blue-200', icon: 'bg-blue-100 text-blue-700', title: 'text-blue-900' },
  rose: { bg: 'bg-rose-50', border: 'border-rose-200', icon: 'bg-rose-100 text-rose-700', title: 'text-rose-900' },
  emerald: { bg: 'bg-emerald-50', border: 'border-emerald-200', icon: 'bg-emerald-100 text-emerald-700', title: 'text-emerald-900' },
  amber: { bg: 'bg-amber-50', border: 'border-amber-200', icon: 'bg-amber-100 text-amber-700', title: 'text-amber-900' },
  purple: { bg: 'bg-purple-50', border: 'border-purple-200', icon: 'bg-purple-100 text-purple-700', title: 'text-purple-900' },
  saffron: { bg: 'bg-orange-50', border: 'border-orange-200', icon: 'bg-orange-100 text-orange-700', title: 'text-orange-900' },
  slate: { bg: 'bg-slate-50', border: 'border-slate-200', icon: 'bg-slate-100 text-slate-700', title: 'text-slate-900' },
  teal: { bg: 'bg-teal-50', border: 'border-teal-200', icon: 'bg-teal-100 text-teal-700', title: 'text-teal-900' },
};

function AccordionItem({ section }) {
  const [open, setOpen] = useState(false);
  const c = colorMap[section.color] || colorMap.slate;

  return (
    <div className={`rounded-xl border ${c.border} overflow-hidden`}>
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className={`w-full flex items-center justify-between gap-3 px-4 py-3.5 text-left ${c.bg} hover:brightness-95 transition-all`}
      >
        <div className="flex items-center gap-3">
          <span className={`p-1.5 rounded-lg ${c.icon}`}>{section.icon}</span>
          <span className={`text-sm font-bold ${c.title}`}>{section.title}</span>
        </div>
        {open
          ? <ChevronUp className={`w-4 h-4 ${c.title} shrink-0`} />
          : <ChevronDown className={`w-4 h-4 ${c.title} shrink-0`} />
        }
      </button>
      {open && (
        <div className="px-5 py-4 bg-white border-t border-slate-100">
          {section.content}
        </div>
      )}
    </div>
  );
}

export default function TermsAndConditions({ defaultExpanded = false }) {
  const [expanded, setExpanded] = useState(defaultExpanded);

  return (
    <div id="terms-section" className="rounded-2xl border border-saffron-200 bg-gradient-to-br from-saffron-50/60 via-white to-amber-50/40 shadow-xs overflow-hidden">

      {/* Header */}
      <div className="bg-gradient-to-r from-navy-900 to-navy-800 px-5 py-4 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-saffron-500/20 text-saffron-300">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-black text-white tracking-tight">
              Terms of Use & Disclaimer
            </h3>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Please read before using this service • Informational use only
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setExpanded(e => !e)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-saffron-600 hover:bg-saffron-500 text-white text-xs font-bold transition-colors shrink-0"
        >
          {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          {expanded ? 'Collapse' : 'Read Full Terms'}
        </button>
      </div>

      {/* Quick summary badges — always visible */}
      <div className="px-5 py-4 flex flex-wrap gap-2 border-b border-saffron-100">
        {[
          { icon: <Ban className="w-3.5 h-3.5" />, label: 'No Booking Service', color: 'bg-rose-100 text-rose-800 border-rose-200' },
          { icon: <CreditCard className="w-3.5 h-3.5" />, label: 'No Payment Collected', color: 'bg-emerald-100 text-emerald-800 border-emerald-200' },
          { icon: <Globe className="w-3.5 h-3.5" />, label: 'Not Affiliated with TDB / Govt', color: 'bg-amber-100 text-amber-800 border-amber-200' },
          { icon: <ShieldCheck className="w-3.5 h-3.5" />, label: 'Informational / Alert Tool Only', color: 'bg-blue-100 text-blue-800 border-blue-200' },
          { icon: <Lock className="w-3.5 h-3.5" />, label: 'Email Used Only for Alerts', color: 'bg-purple-100 text-purple-800 border-purple-200' },
        ].map(({ icon, label, color }) => (
          <span key={label} className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold border ${color}`}>
            {icon} {label}
          </span>
        ))}
      </div>

      {/* Expandable full T&C */}
      {expanded && (
        <div className="px-4 sm:px-6 py-5 space-y-3">
          <p className="text-xs text-slate-500 italic mb-4">
            Last updated: November 2026 &nbsp;|&nbsp; By using this service you agree to these terms.
          </p>
          {sections.map(section => (
            <AccordionItem key={section.id} section={section} />
          ))}

          {/* Official links footer inside T&C */}
          <div className="mt-4 p-4 rounded-xl bg-saffron-50 border border-saffron-200 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div>
              <p className="text-xs font-bold text-navy-900">🏛️ Official Sabarimala Resources</p>
              <p className="text-[11px] text-slate-500 mt-0.5">Use only official portals for booking, queries, and information.</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <a href="https://sabarimalaonline.org/#/darshan" target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-saffron-600 hover:bg-saffron-700 text-white text-xs font-bold transition-colors">
                Virtual Q Booking <ExternalLink className="w-3 h-3" />
              </a>
              <a href="https://www.sabarimala.kerala.gov.in" target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-navy-900 hover:bg-navy-800 text-white text-xs font-bold transition-colors">
                TDB Official Site <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
