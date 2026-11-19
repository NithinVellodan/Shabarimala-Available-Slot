'use client';

import { ShieldCheck, Info, ExternalLink } from 'lucide-react';

export default function DevotionalBanner() {

  return (
    <div className="relative overflow-hidden rounded-2xl border border-saffron-200 shadow-md bg-gradient-to-br from-amber-50 via-saffron-50 to-orange-50">

      {/* Subtle Om watermark background */}
      <div
        className="absolute inset-0 flex items-center justify-center pointer-events-none select-none opacity-[0.04]"
        aria-hidden="true"
      >
        <span className="text-[20rem] font-black text-saffron-900 leading-none">ॐ</span>
      </div>

      <div className="relative z-10 p-5 sm:p-7 flex flex-col md:flex-row items-center md:items-stretch gap-6 md:gap-8">

        {/* ── Left: Ayyappa image ─────────────────────────── */}
        <div className="shrink-0 flex items-center justify-center">
          <div className="relative">
            {/* Golden glow ring */}
            <div className="absolute -inset-2 rounded-full bg-gradient-to-tr from-amber-400 via-saffron-500 to-yellow-400 opacity-60 blur-sm"></div>
            <div className="relative w-28 h-28 sm:w-36 sm:h-36 rounded-full overflow-hidden border-4 border-amber-400 shadow-xl ring-2 ring-amber-300/50">
              <img
                src="/ayyappa.jpg"
                alt="Lord Ayyappa — Swamiye Saranam Ayyappa"
                className="w-full h-full object-cover object-top"
              />
            </div>
            {/* Diya glow at bottom */}
            <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 text-lg select-none">🪔</div>
          </div>
        </div>

        {/* ── Centre: Devotional text ─────────────────────── */}
        <div className="flex-1 flex flex-col justify-center text-center md:text-left">

          {/* Devotional greeting */}
          <p className="text-[11px] sm:text-xs font-bold tracking-[0.2em] uppercase text-saffron-600 mb-1">
            🙏 &nbsp;ഓം നമഃ ശിവായ &nbsp;•&nbsp; Swamiye Saranam Ayyappa &nbsp;•&nbsp; ॐ
          </p>

          <h2 className="text-xl sm:text-2xl font-black text-navy-900 leading-tight">
            Sabarimala Virtual Q&nbsp;
            <span className="text-saffron-700">Darshan Slot Monitor</span>
          </h2>

          <p className="mt-2 text-xs sm:text-sm text-slate-600 leading-relaxed max-w-xl">
            A <strong className="text-navy-900">free, devotional-service tool</strong> that monitors the official
            Sabarimala Virtual Q portal and sends you an instant email alert the moment a Darshan slot becomes
            available — so you can book directly on the official portal without missing the window.
          </p>

          {/* Three disclaimer chips */}
          <div className="mt-4 flex flex-wrap gap-2 justify-center md:justify-start">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
              <ShieldCheck className="w-3.5 h-3.5" /> Informational Only
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-blue-100 text-blue-800 border border-blue-200">
              <ShieldCheck className="w-3.5 h-3.5" /> No Payment Collected
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-purple-100 text-purple-800 border border-purple-200">
              <ShieldCheck className="w-3.5 h-3.5" /> No Booking Service
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
              <ShieldCheck className="w-3.5 h-3.5" /> No TDB Affiliation
            </span>
          </div>
        </div>

        {/* ── Right: Official portal CTA ─────────────────── */}
        <div className="shrink-0 flex flex-col items-center md:items-end justify-center gap-3">
          <div className="bg-white/70 backdrop-blur-sm rounded-xl border border-saffron-200 p-4 text-center max-w-xs shadow-sm">
            <Info className="w-5 h-5 text-saffron-600 mx-auto mb-1.5" />
            <p className="text-[11px] font-bold text-navy-900 leading-snug mb-2">
              All Darshan bookings must be done on the <span className="text-saffron-700">Official Sabarimala Portal</span>.
              This site does <u>not</u> book slots.
            </p>
            <a
              href="https://sabarimalaonline.org/#/darshan"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-saffron-600 hover:bg-saffron-700 text-white text-xs font-bold shadow transition-colors"
            >
              <span>Official Booking Portal</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>

      </div>

      {/* Bottom ribbon */}
      <div className="relative z-10 bg-gradient-to-r from-saffron-600 via-amber-500 to-saffron-600 px-5 py-2 text-center">
        <p className="text-white text-[11px] font-semibold tracking-wide">
          🙏 &nbsp; ശബരിമലയിൽ ഭഗവാൻ അയ്യപ്പന്റെ അനുഗ്രഹം ഉണ്ടാകട്ടെ &nbsp;•&nbsp;
          May Lord Ayyappa bless every pilgrim's sacred Sabarimala yatra &nbsp; 🙏
        </p>
      </div>
    </div>
  );
}
