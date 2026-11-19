'use client';

import Header from '@/components/Header';
import TermsAndConditions from '@/components/TermsAndConditions';
import DevotionalBanner from '@/components/DevotionalBanner';

export default function TermsPage() {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Header />

      <main className="flex-1 w-full px-4 sm:px-6 lg:px-8 xl:px-10 2xl:px-12 py-6 space-y-6">
        <DevotionalBanner />
        <TermsAndConditions defaultExpanded />
      </main>

      <footer className="mt-auto border-t border-saffron-200 bg-gradient-to-r from-navy-900 via-navy-900 to-navy-800 py-5 text-center text-xs text-slate-500">
        <p className="text-saffron-400 font-bold tracking-widest text-[11px] uppercase">
          🙏 &nbsp; Swamiye Saranam Ayyappa &nbsp; 🙏
        </p>
        <p className="mt-1 text-slate-500">
          Informational only • No payment • No booking • Not affiliated with TDB or Kerala Government.
        </p>
      </footer>
    </div>
  );
}
