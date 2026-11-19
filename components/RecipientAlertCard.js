'use client';

import { useState } from 'react';
import {
  Bell,
  Mail,
  User,
  CheckCircle2,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Send,
  AlertCircle,
  Edit3
} from 'lucide-react';

export default function RecipientAlertCard({
  settings = {},
  onSaveRecipient,
  onRefresh
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [name, setName] = useState(settings?.recipient_name || '');
  const [email, setEmail] = useState(settings?.alert_recipient_email || 'nithin@godlandinfotech.com, nithinbabuvellodan@gmail.com');
  const [sendTest, setSendTest] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusMessage, setStatusMessage] = useState(null);

  const activeName = settings?.recipient_name || 'Devotee';
  const activeEmail = settings?.alert_recipient_email || 'nithin@godlandinfotech.com, nithinbabuvellodan@gmail.com';
  const isEmailEnabled = settings?.email_notification_enabled ?? true;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email) {
      setStatusMessage({ type: 'error', text: 'Please enter at least one recipient email address.' });
      return;
    }

    setIsSubmitting(true);
    setStatusMessage(null);

    try {
      const res = await onSaveRecipient(name.trim(), email.trim(), sendTest);
      if (res.success) {
        setStatusMessage({
          type: 'success',
          text: `Alert configured successfully! ${sendTest ? 'A verification test email was sent.' : ''}`
        });
        setTimeout(() => {
          setIsOpen(false);
          setStatusMessage(null);
        }, 2500);
      } else {
        setStatusMessage({ type: 'error', text: res.error || 'Failed to update alert settings.' });
      }
    } catch (err) {
      setStatusMessage({ type: 'error', text: err.message || 'Error saving settings.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-gradient-to-r from-saffron-50/80 via-white to-orange-50/60 rounded-2xl border border-saffron-200/80 shadow-xs overflow-hidden">
      {/* Summary View on Screen */}
      <div className="p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-start sm:items-center gap-3">
          <div className="p-2.5 rounded-xl bg-gradient-to-tr from-saffron-600 to-amber-500 text-white shadow-sm shadow-saffron-500/20 shrink-0">
            <Bell className="w-5 h-5 animate-pulse-subtle" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-black uppercase tracking-wider text-saffron-900">
                Slot Release Notification Alerts
              </span>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping"></span>
                ACTIVE & LISTENING
              </span>
            </div>

            <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-navy-900 font-medium">
              <span className="flex items-center gap-1 font-bold">
                <User className="w-3.5 h-3.5 text-saffron-600" />
                <span>Recipient:</span> <span className="text-saffron-800 underline decoration-saffron-300">{activeName}</span>
              </span>
              <span className="text-slate-300 hidden sm:inline">•</span>
              <span className="flex items-center gap-1 text-slate-700">
                <Mail className="w-3.5 h-3.5 text-slate-400" />
                <span className="font-mono text-[11px] bg-white px-2 py-0.5 rounded border border-slate-200 truncate max-w-xs sm:max-w-md">
                  {activeEmail}
                </span>
              </span>
            </div>
          </div>
        </div>

        {/* Toggle Button */}
        <button
          type="button"
          onClick={() => {
            setName(settings?.recipient_name || '');
            setEmail(settings?.alert_recipient_email || activeEmail);
            setIsOpen(!isOpen);
          }}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold bg-navy-900 hover:bg-navy-800 text-white shadow-sm transition-all shrink-0 group"
        >
          {isOpen ? (
            <>
              <span>Close</span>
              <ChevronUp className="w-4 h-4" />
            </>
          ) : (
            <>
              <Edit3 className="w-4 h-4 text-saffron-400 group-hover:rotate-12 transition-transform" />
              <span>Configure / Add Recipient</span>
              <ChevronDown className="w-4 h-4 text-slate-400" />
            </>
          )}
        </button>
      </div>

      {/* Expandable In-Screen Form */}
      {isOpen && (
        <div className="p-4 sm:p-6 bg-white/95 border-t border-saffron-100 backdrop-blur-xs animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="max-w-2xl">
            <h4 className="text-sm font-black tracking-tight text-navy-900 flex items-center gap-1.5 mb-1">
              <Sparkles className="w-4 h-4 text-saffron-600" />
              <span>Configure Alert Recipient Directly on Screen</span>
            </h4>
            <p className="text-xs text-slate-500 mb-4">
              Enter the recipient name and email addresses. When a Virtual Q Darshan slot opens up, consolidated alerts will be dispatched immediately.
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Recipient Name */}
                <div>
                  <label className="block text-xs font-bold text-navy-900 mb-1">
                    Recipient / Devotee Name
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      placeholder="e.g. Nithin Vellodan"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 rounded-lg border border-slate-300 text-xs font-medium text-navy-900 focus:outline-none focus:ring-2 focus:ring-saffron-500"
                    />
                  </div>
                  <span className="text-[10px] text-slate-400">Used for personalizing your email notifications</span>
                </div>

                {/* Recipient Email */}
                <div>
                  <label className="block text-xs font-bold text-navy-900 mb-1">
                    Recipient Email Address(es)
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      placeholder="e.g. nithin@godlandinfotech.com, dev@gmail.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 rounded-lg border border-slate-300 text-xs font-medium text-navy-900 focus:outline-none focus:ring-2 focus:ring-saffron-500"
                    />
                  </div>
                  <span className="text-[10px] text-slate-400">Separate multiple emails with commas</span>
                </div>
              </div>

              {/* Checkbox for verification test email */}
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="sendTestCheck"
                  checked={sendTest}
                  onChange={(e) => setSendTest(e.target.checked)}
                  className="w-4 h-4 rounded border-slate-300 text-saffron-600 focus:ring-saffron-500"
                />
                <label htmlFor="sendTestCheck" className="text-xs text-slate-700 font-medium cursor-pointer">
                  Send an instant confirmation verification email now to confirm delivery
                </label>
              </div>

              {/* Actions & Feedback */}
              <div className="flex flex-wrap items-center gap-3 pt-2">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-xs font-bold bg-saffron-600 hover:bg-saffron-700 text-white shadow-xs transition-colors disabled:opacity-50"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{isSubmitting ? 'Saving & Verifying...' : 'Save & Activate Notification Alert'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
                >
                  Cancel
                </button>

                {statusMessage && (
                  <div className={`text-xs font-semibold flex items-center gap-1.5 ${
                    statusMessage.type === 'success' ? 'text-emerald-700' : 'text-rose-700'
                  }`}>
                    {statusMessage.type === 'success' ? (
                      <>
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span>{statusMessage.text}</span>
                      </>
                    ) : (
                      <>
                        <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                        <span>{statusMessage.text}</span>
                      </>
                    )}
                  </div>
                )}
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
