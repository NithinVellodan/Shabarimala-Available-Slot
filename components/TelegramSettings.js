'use client';

import { useState } from 'react';
import {
  Send,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Bell,
  BellOff,
  ExternalLink,
  ShieldAlert,
  Copy,
  Check
} from 'lucide-react';

export default function TelegramSettings({
  notificationConfig = {},
  logs = [],
  onSendTestNotification,
  onToggleNotification
}) {
  const [testToken, setTestToken] = useState('');
  const [testChatId, setTestChatId] = useState('');
  const [testResult, setTestResult] = useState(null);
  const [isSendingTest, setIsSendingTest] = useState(false);
  const [copied, setCopied] = useState(false);

  const isConfigured = notificationConfig?.configured;
  const isEnabled = notificationConfig?.details?.notificationEnabled ?? true;

  const handleTest = async (e) => {
    e.preventDefault();
    setIsSendingTest(true);
    setTestResult(null);

    try {
      const res = await onSendTestNotification(
        testToken.trim() || null,
        testChatId.trim() || null
      );
      setTestResult(res);
    } catch (err) {
      setTestResult({ success: false, error: err.message });
    } finally {
      setIsSendingTest(false);
    }
  };

  const copyTemplate = () => {
    const template = `🚨 SABARIMALA SLOT AVAILABLE!

Darshan Date: 19 December 2026
Previous Status: BOOKED
Current Status: AVAILABLE

A previously unavailable Sabarimala Virtual Q date is now showing availability.
Please verify immediately.

Official booking link:
https://sabarimalaonline.org/#/darshan`;
    navigator.clipboard.writeText(template);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      
      {/* Configuration Status Card */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 sm:p-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-5 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-sky-50 text-sky-600">
                <Send className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-black tracking-tight text-navy-900">
                Telegram Notifications
              </h3>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Direct real-time alerts sent to your Telegram account or group as soon as a slot opens.
            </p>
          </div>

          {/* Master Enable/Disable Toggle */}
          <div className="flex items-center gap-3">
            <span className="text-xs font-semibold text-slate-600">
              Alerts {isEnabled ? 'Active' : 'Disabled'}
            </span>
            <button
              type="button"
              onClick={() => onToggleNotification(!isEnabled)}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                isEnabled ? 'bg-emerald-600' : 'bg-slate-300'
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                  isEnabled ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        </div>

        {/* Status indicators */}
        <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className={`w-2.5 h-2.5 rounded-full ${notificationConfig?.details?.isBotTokenSet ? 'bg-emerald-500' : 'bg-amber-400'}`}></div>
              <div>
                <div className="text-xs font-bold text-navy-900">TELEGRAM_BOT_TOKEN</div>
                <div className="text-[11px] text-slate-500">
                  {notificationConfig?.details?.isBotTokenSet ? 'Configured in Environment' : 'Not set in .env'}
                </div>
              </div>
            </div>
            {notificationConfig?.details?.isBotTokenSet ? (
              <span className="text-xs font-bold text-emerald-600">Ready</span>
            ) : (
              <span className="text-xs font-medium text-amber-600">Missing</span>
            )}
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className={`w-2.5 h-2.5 rounded-full ${notificationConfig?.details?.isChatIdSet ? 'bg-emerald-500' : 'bg-amber-400'}`}></div>
              <div>
                <div className="text-xs font-bold text-navy-900">TELEGRAM_CHAT_ID</div>
                <div className="text-[11px] text-slate-500">
                  {notificationConfig?.details?.isChatIdSet ? 'Configured in Environment' : 'Not set in .env'}
                </div>
              </div>
            </div>
            {notificationConfig?.details?.isChatIdSet ? (
              <span className="text-xs font-bold text-emerald-600">Ready</span>
            ) : (
              <span className="text-xs font-medium text-amber-600">Missing</span>
            )}
          </div>
        </div>

        {/* Test Notification form */}
        <div className="mt-6 pt-5 border-t border-slate-100">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
            Send Test Alert
          </h4>
          <p className="text-xs text-slate-500 mb-3">
            Verify your Telegram connection. You can use your environment credentials or test with temporary keys below:
          </p>

          <form onSubmit={handleTest} className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Custom Bot Token (Optional if set in .env)
                </label>
                <input
                  type="password"
                  placeholder="e.g. 123456789:ABCdefGhIJKlmNoPQRstuVWxYZ"
                  value={testToken}
                  onChange={(e) => setTestToken(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-300 text-xs font-mono text-navy-900 focus:outline-none focus:ring-2 focus:ring-saffron-500"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Custom Chat ID (Optional if set in .env)
                </label>
                <input
                  type="text"
                  placeholder="e.g. 987654321 or -100123456789"
                  value={testChatId}
                  onChange={(e) => setTestChatId(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-300 text-xs font-mono text-navy-900 focus:outline-none focus:ring-2 focus:ring-saffron-500"
                />
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="submit"
                disabled={isSendingTest}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-sky-600 hover:bg-sky-700 text-white shadow-xs transition-colors disabled:opacity-50"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{isSendingTest ? 'Sending Test...' : 'Send Test Notification'}</span>
              </button>

              {testResult && (
                <div className={`text-xs font-semibold flex items-center gap-1.5 ${testResult.success ? 'text-emerald-700' : 'text-rose-700'}`}>
                  {testResult.success ? (
                    <>
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span>{testResult.message || 'Notification delivered successfully!'}</span>
                    </>
                  ) : (
                    <>
                      <AlertCircle className="w-4 h-4 text-rose-600" />
                      <span>{testResult.error || 'Failed to deliver notification'}</span>
                    </>
                  )}
                </div>
              )}
            </div>
          </form>
        </div>

      </div>

      {/* Setup Guide & Template Preview */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Step by step guide */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5">
          <div className="flex items-center gap-2 mb-3">
            <HelpCircle className="w-4 h-4 text-saffron-600" />
            <h4 className="text-sm font-black tracking-tight text-navy-900">
              How to setup Telegram alerts in 2 minutes
            </h4>
          </div>
          <ol className="space-y-3 text-xs text-slate-600 list-decimal list-inside">
            <li className="leading-relaxed">
              Open Telegram and search for <b>@BotFather</b>. Send the message <code className="bg-slate-100 px-1 py-0.5 rounded text-navy-900 font-mono">/newbot</code> and follow the prompts to get your <b>Bot Token</b>.
            </li>
            <li className="leading-relaxed">
              Start a chat with your newly created bot by clicking <b>START</b>.
            </li>
            <li className="leading-relaxed">
              To get your numeric <b>Chat ID</b>, open <b>@userinfobot</b> in Telegram and copy your numeric Id.
            </li>
            <li className="leading-relaxed">
              Add both values to your <code className="bg-slate-100 px-1 py-0.5 rounded text-navy-900 font-mono">.env</code> file or Railway/Render environment variables:
              <pre className="mt-1.5 p-2 rounded bg-slate-900 text-slate-200 font-mono text-[11px] overflow-x-auto">
{`TELEGRAM_BOT_TOKEN="your_bot_token"
TELEGRAM_CHAT_ID="your_chat_id"`}
              </pre>
            </li>
          </ol>
        </div>

        {/* Message Template Preview */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-black tracking-tight text-navy-900">
                Official Alert Format
              </h4>
              <button
                type="button"
                onClick={copyTemplate}
                className="text-xs text-slate-500 hover:text-navy-900 flex items-center gap-1 font-semibold"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied' : 'Copy sample'}</span>
              </button>
            </div>
            <div className="p-3.5 rounded-xl bg-slate-900 text-slate-100 font-mono text-xs whitespace-pre-wrap leading-relaxed border border-slate-800 shadow-inner">
{`🚨 SABARIMALA SLOT AVAILABLE!

Darshan Date: 19 December 2026
Previous Status: BOOKED
Current Status: AVAILABLE

A previously unavailable Sabarimala Virtual Q date is now showing availability.
Please verify immediately.

Official booking link:
https://sabarimalaonline.org/#/darshan`}
            </div>
          </div>
          <div className="mt-3 text-[11px] text-slate-400">
            ⚠️ <b>Zero Bot Booking Policy:</b> Notifications provide direct official links. Actual devotee booking must be finalized on sabarimalaonline.org.
          </div>
        </div>

      </div>

      {/* Recent Notification Logs */}
      {logs && logs.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5">
          <h4 className="text-sm font-black tracking-tight text-navy-900 mb-3">
            Recent Notification Deliveries
          </h4>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  <th className="py-2 px-3">Date</th>
                  <th className="py-2 px-3">Channel</th>
                  <th className="py-2 px-3">Delivery Status</th>
                  <th className="py-2 px-3">Sent At</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {logs.slice(0, 10).map((log, idx) => (
                  <tr key={idx} className="hover:bg-slate-50">
                    <td className="py-2 px-3 font-semibold text-navy-900">{log.darshan_date}</td>
                    <td className="py-2 px-3 text-slate-600">{log.notification_type || 'TELEGRAM'}</td>
                    <td className="py-2 px-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${log.delivery_status === 'SENT' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}`}>
                        {log.delivery_status}
                      </span>
                    </td>
                    <td className="py-2 px-3 text-slate-400 font-mono text-[11px]">
                      {new Date(log.sent_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

    </div>
  );
}
