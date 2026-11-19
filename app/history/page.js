'use client';

import { useState, useEffect } from 'react';
import Header from '@/components/Header';
import ActivityTimeline from '@/components/ActivityTimeline';
import { History, Bell, Send, CheckCircle2, Clock } from 'lucide-react';
import { formatDisplayDate, formatTimestamp } from '@/lib/dateUtils';

export default function HistoryPage() {
  const [history, setHistory] = useState([]);
  const [logs, setLogs] = useState([]);
  const [apiHealth, setApiHealth] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    try {
      const monRes = await fetch('/api/monitoring');
      const monJson = await monRes.json();
      setHistory(monJson.history || []);
      setApiHealth(monJson.health);

      const notifRes = await fetch('/api/notifications');
      const notifJson = await notifRes.json();
      setLogs(notifJson.logs || []);
    } catch (e) {
      console.error('Failed to load history:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Header apiHealth={apiHealth} />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-indigo-50 text-indigo-700">
              <History className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-black tracking-tight text-navy-900">
                Audit Trail & History
              </h2>
              <p className="text-xs text-slate-500">
                Full chronological ledger of availability state changes, alert triggers, and Telegram dispatches.
              </p>
            </div>
          </div>
        </div>

        {/* Activity Timeline Component */}
        <ActivityTimeline history={history} onRefresh={loadData} />

        {/* Telegram Notifications Log */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-4 sm:p-6 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Send className="w-5 h-5 text-sky-600" />
              <h3 className="text-base font-black tracking-tight text-navy-900">
                Telegram Dispatch Ledger
              </h3>
            </div>
            <span className="text-xs text-slate-500">
              {logs.length} dispatches logged
            </span>
          </div>

          {logs.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-400">
              No notifications dispatched yet. As newly available slots are detected, records will appear here.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                    <th className="py-3 px-4 sm:px-6">Darshan Date</th>
                    <th className="py-3 px-4">Channel</th>
                    <th className="py-3 px-4">Delivery Status</th>
                    <th className="py-3 px-4">Timestamp</th>
                    <th className="py-3 px-4 sm:px-6">Error Detail</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {logs.map((log, idx) => (
                    <tr key={log.id || idx} className="hover:bg-slate-50/80">
                      <td className="py-3 px-4 sm:px-6 font-bold text-navy-900">
                        {log.darshan_date === 'SYSTEM' ? 'SYSTEM BROADCAST' : formatDisplayDate(log.darshan_date)}
                      </td>
                      <td className="py-3 px-4 text-slate-600 font-medium">
                        {log.notification_type || 'TELEGRAM'}
                      </td>
                      <td className="py-3 px-4">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          log.delivery_status === 'SENT'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-rose-100 text-rose-800'
                        }`}>
                          {log.delivery_status === 'SENT' && <CheckCircle2 className="w-3 h-3 text-emerald-600" />}
                          {log.delivery_status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-500 font-mono text-[11px]">
                        {formatTimestamp(log.sent_at)}
                      </td>
                      <td className="py-3 px-4 sm:px-6 text-slate-400 text-[11px]">
                        {log.error_message || 'Delivered with HTTP 200'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </main>
    </div>
  );
}
