'use client';

import { useState, useEffect } from 'react';
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
  Edit3,
  Plus,
  X,
  Eye,
  EyeOff
} from 'lucide-react';

function maskEmail(email) {
  const [local] = email.split('@');
  if (!local) return '****@****';
  const masked = local.length <= 2 ? '****' : local[0] + '****' + local[local.length - 1];
  return masked + '@****';
}

function parseEmailList(emailStr) {
  if (!emailStr) return [];
  if (Array.isArray(emailStr)) return emailStr.map(e => e.trim()).filter(Boolean);
  return String(emailStr)
    .split(',')
    .map(e => e.trim())
    .filter(Boolean);
}

export default function RecipientAlertCard({
  settings = {},
  onSaveRecipient,
  onRefresh
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [name, setName] = useState(settings?.recipient_name || '');
  const [emailsList, setEmailsList] = useState(() => parseEmailList(settings?.alert_recipient_email));
  const [newEmail, setNewEmail] = useState('');
  const [inputError, setInputError] = useState('');
  const [showExistingList, setShowExistingList] = useState(true);
  const [sendTest, setSendTest] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusMessage, setStatusMessage] = useState(null);

  const activeName = settings?.recipient_name || 'Devotee';
  const rawActiveEmail = settings?.alert_recipient_email || 'nithin@godlandinfotech.com, nithinbabuvellodan@gmail.com';

  // Sync when settings change
  useEffect(() => {
    if (settings?.recipient_name) setName(settings.recipient_name);
    if (settings?.alert_recipient_email) {
      setEmailsList(parseEmailList(settings.alert_recipient_email));
    }
  }, [settings?.recipient_name, settings?.alert_recipient_email]);

  // Add new email to list
  const handleAddEmail = () => {
    const trimmed = newEmail.trim().toLowerCase();
    if (!trimmed) return;

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmed)) {
      setInputError('Please enter a valid email address (e.g. name@domain.com)');
      return;
    }

    if (emailsList.includes(trimmed)) {
      setInputError('This email is already in the recipient list');
      return;
    }

    setEmailsList([...emailsList, trimmed]);
    setNewEmail('');
    setInputError('');
  };

  // Remove email from list
  const handleRemoveEmail = (targetEmail) => {
    setEmailsList(emailsList.filter(e => e !== targetEmail));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // If user has typed an email in the input but hasn't clicked "Add", auto-add it
    let finalEmails = [...emailsList];
    const pendingEmail = newEmail.trim().toLowerCase();
    if (pendingEmail) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (emailRegex.test(pendingEmail) && !finalEmails.includes(pendingEmail)) {
        finalEmails.push(pendingEmail);
      }
    }

    if (finalEmails.length === 0) {
      setStatusMessage({ type: 'error', text: 'Please add at least one recipient email address.' });
      return;
    }

    setIsSubmitting(true);
    setStatusMessage(null);

    const emailStr = finalEmails.join(', ');

    try {
      const res = await onSaveRecipient(name.trim(), emailStr, sendTest);
      if (res.success) {
        setStatusMessage({
          type: 'success',
          text: `Alert configured successfully! ${sendTest ? 'A verification test email was sent.' : ''}`
        });
        setNewEmail('');
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
    <div id="alerts" className="bg-gradient-to-r from-saffron-50/80 via-white to-orange-50/60 rounded-2xl border border-saffron-200/80 shadow-xs overflow-hidden">
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
            </div>
          </div>
        </div>

        {/* Toggle Button */}
        <button
          type="button"
          onClick={() => {
            setName(settings?.recipient_name || '');
            setEmailsList(parseEmailList(settings?.alert_recipient_email || rawActiveEmail));
            setNewEmail('');
            setInputError('');
            setIsOpen(!isOpen);
          }}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold bg-navy-900 hover:bg-navy-800 text-white shadow-sm transition-all shrink-0 group w-full sm:w-auto justify-center"
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
          <div className="w-full max-w-4xl">
            <h4 className="text-sm font-black tracking-tight text-navy-900 flex items-center gap-1.5 mb-1">
              <Sparkles className="w-4 h-4 text-saffron-600" />
              <span>Manage Alert Recipients</span>
            </h4>
            <p className="text-xs text-slate-500 mb-4">
              Add new recipient email addresses below. When a Virtual Q slot opens, verified real-time alerts will be sent to all listed emails.
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
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

              {/* Already Added Emails Section (Visible with chips & hide toggle) */}
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold text-navy-900">
                      Already Added Emails ({emailsList.length})
                    </span>
                    <span className="text-[10px] text-slate-500">
                      (Will receive alerts)
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowExistingList(!showExistingList)}
                    className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-600 hover:text-navy-900 transition-colors"
                  >
                    {showExistingList ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    <span>{showExistingList ? 'Hide list' : 'Show list'}</span>
                  </button>
                </div>

                {showExistingList && (
                  emailsList.length > 0 ? (
                    <div className="flex flex-wrap gap-2 pt-1">
                      {emailsList.map((em, idx) => (
                        <span
                          key={idx}
                          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-900 border border-emerald-200 shadow-2xs"
                        >
                          <Mail className="w-3.5 h-3.5 text-emerald-600" />
                          <span className="font-mono text-[11px]">{maskEmail(em)}</span>
                          <button
                            type="button"
                            onClick={() => handleRemoveEmail(em)}
                            title="Remove this email"
                            className="p-0.5 rounded-full hover:bg-emerald-200 text-emerald-700 transition-colors ml-1"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-amber-800 bg-amber-50 p-2 rounded-lg border border-amber-200">
                      No emails currently added. Please type a new email below and click Add.
                    </p>
                  )
                )}
              </div>

              {/* Clean Input For Typing ONLY New Email */}
              <div>
                <label className="block text-xs font-bold text-navy-900 mb-1">
                  Type New Email to Add
                </label>
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                  <div className="relative flex-1">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type="email"
                      placeholder="Type new email (e.g. devotee@gmail.com)"
                      value={newEmail}
                      onChange={(e) => {
                        setNewEmail(e.target.value);
                        setInputError('');
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddEmail();
                        }
                      }}
                      className="w-full pl-9 pr-3 py-2 rounded-lg border border-slate-300 text-xs font-medium text-navy-900 focus:outline-none focus:ring-2 focus:ring-saffron-500"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={handleAddEmail}
                    className="px-4 py-2 rounded-lg bg-navy-900 hover:bg-navy-800 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-xs transition-colors shrink-0"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Email</span>
                  </button>
                </div>
                {inputError ? (
                  <p className="text-[11px] text-rose-600 mt-1 font-semibold">{inputError}</p>
                ) : (
                  <p className="text-[10px] text-slate-400 mt-1">
                    Type a new email and click <b>Add Email</b> (or press Enter) to add it to your recipient list.
                  </p>
                )}
              </div>

              {/* Checkbox for verification test email */}
              <div className="flex items-center gap-2 pt-1">
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
