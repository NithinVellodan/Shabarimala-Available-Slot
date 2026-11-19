'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Bell, Flame, ExternalLink, RefreshCw, ShieldCheck, AlertTriangle, Radio } from 'lucide-react';

export default function Header({ apiHealth, onRefresh, isRefreshing, dataMode, onToggleMode }) {
  const pathname = usePathname();

  const getStatusBadge = () => {
    const status = apiHealth?.status || 'UNKNOWN';
    switch (status) {
      case 'CONNECTED':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            CONNECTED
          </span>
        );
      case 'ACCESS_BLOCKED':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
            <AlertTriangle className="w-3 h-3 text-rose-500" />
            ACCESS BLOCKED
          </span>
        );
      case 'AUTHENTICATION_REQUIRED':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
            <AlertTriangle className="w-3 h-3 text-amber-500" />
            AUTH REQUIRED
          </span>
        );
      case 'STALE_DATA':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
            <span className="w-2 h-2 rounded-full bg-amber-500"></span>
            STALE DATA
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
            <span className="w-2 h-2 rounded-full bg-slate-400"></span>
            {status}
          </span>
        );
    }
  };

  const navItems = [
    { name: 'Dashboard', href: '/dashboard' },
    { name: 'Activity History', href: '/history' },
    { name: 'Settings & Alerts', href: '/settings' },
    { name: 'Terms & Disclaimer', href: '/terms' },
  ];

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-sm">
      <div className="w-full px-4 sm:px-6 lg:px-8 xl:px-10 2xl:px-12">
        <div className="flex items-center justify-between h-16 sm:h-20">
          
          {/* Logo & Branding */}
          <div className="flex items-center gap-3">
            <Link href="/dashboard" className="flex items-center gap-3 group">
              <div className="relative w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-gradient-to-tr from-saffron-600 to-amber-500 flex items-center justify-center text-white shadow-md shadow-saffron-500/20 group-hover:scale-105 transition-transform overflow-hidden">
                {/* Ayyappa small icon — Om symbol */}
                <span className="text-2xl font-black leading-none select-none">ॐ</span>
                <Flame className="w-3 h-3 text-amber-200 absolute bottom-1 right-1 opacity-80" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-base sm:text-lg font-black tracking-tight text-navy-900 group-hover:text-saffron-700 transition-colors">
                    SABARIMALA SLOT ALERT
                  </h1>
                </div>
                <p className="hidden sm:block text-xs font-bold text-saffron-600 tracking-wide">
                  🙏 Swamiye Saranam Ayyappa
                </p>
              </div>
            </Link>
          </div>

          {/* Nav links */}
          <nav className="hidden md:flex items-center gap-1">
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`px-3.5 py-2 rounded-lg text-sm font-semibold transition-all ${
                    isActive
                      ? 'bg-saffron-50 text-saffron-700 border border-saffron-200 shadow-sm'
                      : 'text-slate-600 hover:text-navy-900 hover:bg-slate-100'
                  }`}
                >
                  {item.name}
                </Link>
              );
            })}
          </nav>

          {/* Right Action Controls */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Status badge */}
            <div className="hidden lg:flex items-center">
              {getStatusBadge()}
            </div>

            {/* Mode Toggle Button */}
            {onToggleMode && (
              <button
                type="button"
                onClick={onToggleMode}
                title="Toggle between Live Official API and Simulation Mock Mode"
                className={`hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                  dataMode === 'LIVE'
                    ? 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100'
                    : 'bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-100'
                }`}
              >
                <Radio className="w-3.5 h-3.5" />
                <span>{dataMode === 'LIVE' ? 'Mode: Live API' : 'Mode: Mock Sim'}</span>
              </button>
            )}

            {/* Manual Refresh Button */}
            {onRefresh && (
              <button
                type="button"
                onClick={onRefresh}
                disabled={isRefreshing}
                title="Refresh availability now"
                className="p-2 sm:px-3 sm:py-1.5 rounded-lg text-xs font-medium bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 flex items-center gap-1.5 disabled:opacity-50 transition-colors"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-saffron-600' : ''}`} />
                <span className="hidden sm:inline">{isRefreshing ? 'Checking...' : 'Refresh'}</span>
              </button>
            )}

            {/* Official Sabarimala Portal CTA */}
            <a
              href="https://sabarimalaonline.org/#/darshan"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg text-xs sm:text-sm font-bold bg-navy-900 hover:bg-navy-800 text-white shadow-sm hover:shadow transition-all group"
            >
              <span>Book on Portal</span>
              <ExternalLink className="w-3.5 h-3.5 text-slate-300 group-hover:text-white transition-colors" />
            </a>
          </div>

        </div>

        {/* Mobile Navigation Bar */}
        <div className="flex md:hidden items-center justify-around py-2 border-t border-slate-100 text-xs">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`px-3 py-1.5 rounded-md font-semibold ${
                pathname === item.href
                  ? 'bg-saffron-50 text-saffron-700 font-bold'
                  : 'text-slate-600'
              }`}
            >
              {item.name}
            </Link>
          ))}
        </div>

      </div>
    </header>
  );
}
