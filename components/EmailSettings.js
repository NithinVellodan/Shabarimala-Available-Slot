'use client';

import { useState, useEffect } from 'react';
import {
  Mail,
  Send,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  ShieldCheck,
  ExternalLink,
  Copy,
  Check,
  Sparkles,
  Plus,
  X,
  Eye,
  EyeOff
} from 'lucide-react';

function parseEmailList(emailStr) {
  if (!emailStr) return [];
  if (Array.isArray(emailStr)) return emailStr.map(e => e.trim()).filter(Boolean);
  return String(emailStr)
    .split(',')
    .map(e => e.trim())
    .filter(Boolean);
}

export default function EmailSettings({
  emailConfig = {},
  onSendTestEmail,
  onToggleEmail,
  onSaveRecipientEmail
}) {
  const [testUser, setTestUser] = useState('');
  const [testPass, setTestPass] = useState('');
  const [testRecipient, setTestRecipient] = useState(emailConfig?.recipientEmail || '');
  const [emailsList, setEmailsList] = useState(() => parseEmailList(emailConfig?.recipientEmail));
  const [newEmail, setNewEmail] = useState('');
  const [inputError, setInputError] = useState('');
  const [showExisting, setShowExisting] = useState(false); // Hidden by default so user only types new email
  const [testResult, setTestResult] = useState(null);
  const [isSendingTest, setIsSendingTest] = useState(false);
  const [isSavingRecipient, setIsSavingRecipient] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    if (emailConfig?.recipientEmail) {
      setEmailsList(parseEmailList(emailConfig.recipientEmail));
      setTestRecipient(emailConfig.recipientEmail);
    }
  }, [emailConfig?.recipientEmail]);

  const isConfigured = emailConfig?.configured;
  const isEnabled = emailConfig?.enabled ?? true;

  const handleTest = async (e) => {
    e.preventDefault();
    setIsSendingTest(true);
    setTestResult(null);

    try {
      const res = await onSendTestEmail(
        testUser.trim() || null,
        testPass.trim() || null,
        testRecipient.trim() || null
      );
      setTestResult(res);
    } catch (err) {
      setTestResult({ success: false, error: err.message });
    } finally {
      setIsSendingTest(false);
    }
  };

  const handleAddEmail = () => {
    const trimmed = newEmail.trim().toLowerCase();
    if (!trimmed) return;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmed)) {
      setInputError('Please enter a valid email address');
      return;
    }
    if (emailsList.includes(trimmed)) {
      setInputError('This email is already in the list');
      return;
    }
    const updated = [...emailsList, trimmed];
    setEmailsList(updated);
    setNewEmail('');
    setInputError('');
    saveEmailList(updated);
  };

  const handleRemoveEmail = (targetEmail) => {
    const updated = emailsList.filter(e => e !== targetEmail);
    setEmailsList(updated);
    saveEmailList(updated);
  };

  const saveEmailList = async (listToSave) => {
    setIsSavingRecipient(true);
    try {
      await onSaveRecipientEmail(listToSave.join(', '));
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2500);
    } catch (err) {
      console.error('Failed to save recipient:', err);
    } finally {
      setIsSavingRecipient(false);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Configuration Status Card */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 sm:p-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-5 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-orange-50 text-saffron-700">
                <Mail className="w-5 h-5" />
              </div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-black tracking-tight text-navy-900">
                  Free Gmail Email Notifications
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800">
                  100% FREE (500/day)
                </span>
              </div>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Get slot release alerts sent directly to your email inbox using your Google account with zero subscription costs.
            </p>
          </div>

          {/* Master Enable/Disable Toggle */}
          <div className="flex items-center gap-3">
            <span className="text-xs font-semibold text-slate-600">
              Email Alerts {isEnabled ? 'Active' : 'Disabled'}
            </span>
            <button
              type="button"
              onClick={() => onToggleEmail(!isEnabled)}
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
              <div className={`w-2.5 h-2.5 rounded-full ${emailConfig?.isGmailUserSet ? 'bg-emerald-500' : 'bg-amber-400'}`}></div>
              <div>
                <div className="text-xs font-bold text-navy-900">GMAIL_USER</div>
                <div className="text-[11px] text-slate-500">
                  {emailConfig?.isGmailUserSet ? `Configured (${emailConfig.gmailUser})` : 'Not set in .env'}
                </div>
              </div>
            </div>
            {emailConfig?.isGmailUserSet ? (
              <span className="text-xs font-bold text-emerald-600">Ready</span>
            ) : (
              <span className="text-xs font-medium text-amber-600">Missing</span>
            )}
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className={`w-2.5 h-2.5 rounded-full ${emailConfig?.isGmailAppPassSet ? 'bg-emerald-500' : 'bg-amber-400'}`}></div>
              <div>
                <div className="text-xs font-bold text-navy-900">GMAIL_APP_PASSWORD</div>
                <div className="text-[11px] text-slate-500">
                  {emailConfig?.isGmailAppPassSet ? '16-character App Password Set' : 'Not set in .env'}
                </div>
              </div>
            </div>
            {emailConfig?.isGmailAppPassSet ? (
              <span className="text-xs font-bold text-emerald-600">Ready</span>
            ) : (
              <span className="text-xs font-medium text-amber-600">Missing</span>
            )}
          </div>
        </div>

        {/* Set Recipient Email */}
        <div className="mt-5 pt-4 border-t border-slate-100">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-3">
            <div>
              <label className="block text-xs font-bold text-navy-900">
                Alert Recipient Email Addresses
              </label>
              <p className="text-[11px] text-slate-500">
                Where slot alerts are delivered. You can add multiple emails.
              </p>
            </div>
            
            {/* Show/Hide existing toggle button */}
            {emailsList.length > 0 && (
              <button
                type="button"
                onClick={() => setShowExisting(!showExisting)}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-semibold text-slate-600 hover:text-navy-900 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
              >
                {showExisting ? (
                  <>
                    <EyeOff className="w-3.5 h-3.5 text-slate-500" />
                    <span>Hide added emails ({emailsList.length})</span>
                  </>
                ) : (
                  <>
                    <Eye className="w-3.5 h-3.5 text-saffron-600" />
                    <span>View added emails ({emailsList.length})</span>
                  </>
                )}
              </button>
            )}
          </div>

          {/* Collapsible list of already added emails */}
          {showExisting && emailsList.length > 0 && (
            <div className="p-3 mb-3 bg-slate-50 rounded-xl border border-slate-200 animate-fadeIn">
              <div className="text-[11px] font-bold text-slate-600 mb-2 flex items-center justify-between">
                <span>Active Recipients ({emailsList.length}):</span>
                {saveSuccess && <span className="text-emerald-600 font-bold">✓ Saved</span>}
              </div>
              <div className="flex flex-wrap gap-2">
                {emailsList.map((email) => (
                  <span
                    key={email}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-white border border-slate-300 text-navy-900 shadow-2xs"
                  >
                    <span>{email}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveEmail(email)}
                      className="text-slate-400 hover:text-red-500 transition-colors p-0.5 rounded-full hover:bg-red-50"
                      title={`Remove ${email}`}
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Clean Input for ONLY typing new email */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            <div className="relative flex-1">
              <input
                type="email"
                placeholder="Type new email to add (e.g. friend@gmail.com)..."
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
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs text-navy-900 focus:outline-none focus:ring-2 focus:ring-saffron-500 placeholder:text-slate-400"
              />
            </div>
            <button
              type="button"
              onClick={handleAddEmail}
              disabled={isSavingRecipient || !newEmail.trim()}
              className="inline-flex items-center justify-center gap-1 px-4 py-2 rounded-lg text-xs font-bold bg-navy-900 hover:bg-navy-800 disabled:bg-slate-300 text-white shadow-xs transition-colors shrink-0"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Email</span>
            </button>
          </div>

          {inputError && (
            <p className="text-[11px] text-red-600 mt-1.5 font-medium">{inputError}</p>
          )}

          {!showExisting && emailsList.length > 0 && (
            <div className="mt-2 text-[11px] text-slate-500 flex items-center justify-between">
              <span>{emailsList.length} recipient(s) currently receiving alerts. Click <b>"View added emails"</b> above to view or remove.</span>
              {saveSuccess && <span className="text-emerald-600 font-bold">✓ Saved</span>}
            </div>
          )}
        </div>

        {/* Send Test Email form */}
        <div className="mt-6 pt-5 border-t border-slate-100">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
            Send Test Email Alert
          </h4>
          <p className="text-xs text-slate-500 mb-3">
            Test your Gmail SMTP connection. You can use your configured credentials from <code className="font-mono bg-slate-100 px-1 py-0.5 rounded text-navy-900">.env</code> or test with temporary keys below:
          </p>

          <form onSubmit={handleTest} className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Gmail Address (Optional if set in .env)
                </label>
                <input
                  type="email"
                  placeholder="yourname@gmail.com"
                  value={testUser}
                  onChange={(e) => setTestUser(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-300 text-xs font-mono text-navy-900 focus:outline-none focus:ring-2 focus:ring-saffron-500"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  16-Char App Password (Optional)
                </label>
                <input
                  type="password"
                  placeholder="abcd efgh ijkl mnop"
                  value={testPass}
                  onChange={(e) => setTestPass(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-300 text-xs font-mono text-navy-900 focus:outline-none focus:ring-2 focus:ring-saffron-500"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Recipient Email
                </label>
                <input
                  type="email"
                  placeholder="recipient@example.com"
                  value={testRecipient}
                  onChange={(e) => setTestRecipient(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-300 text-xs font-mono text-navy-900 focus:outline-none focus:ring-2 focus:ring-saffron-500"
                />
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="submit"
                disabled={isSendingTest}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-saffron-600 hover:bg-saffron-700 text-white shadow-xs transition-colors disabled:opacity-50"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{isSendingTest ? 'Sending Test Email...' : 'Send Test Email'}</span>
              </button>

              {testResult && (
                <div className={`text-xs font-semibold flex items-center gap-1.5 ${testResult.success ? 'text-emerald-700' : 'text-rose-700'}`}>
                  {testResult.success ? (
                    <>
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span>{testResult.message}</span>
                    </>
                  ) : (
                    <>
                      <AlertCircle className="w-4 h-4 text-rose-600" />
                      <span>{testResult.error}</span>
                    </>
                  )}
                </div>
              )}
            </div>
          </form>
        </div>

      </div>

      {/* Google App Password Guide */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Step by step guide */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5">
          <div className="flex items-center gap-2 mb-3">
            <HelpCircle className="w-4 h-4 text-saffron-600" />
            <h4 className="text-sm font-black tracking-tight text-navy-900">
              How to get a Free Google App Password (1 minute)
            </h4>
          </div>
          <ol className="space-y-3 text-xs text-slate-600 list-decimal list-inside leading-relaxed">
            <li>
              Go to your Google Account:{' '}
              <a
                href="https://myaccount.google.com/security"
                target="_blank"
                rel="noopener noreferrer"
                className="text-saffron-700 font-bold hover:underline inline-flex items-center gap-0.5"
              >
                <span>myaccount.google.com/security</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </li>
            <li>
              Make sure <b>2-Step Verification</b> is turned <b>ON</b>.
            </li>
            <li>
              Search for <b>&quot;App passwords&quot;</b> in the search bar (or under 2-Step Verification).
            </li>
            <li>
              Enter an App name (e.g. <code className="bg-slate-100 px-1 py-0.5 rounded font-mono text-navy-900">Sabarimala Alert</code>) and click <b>Create</b>.
            </li>
            <li>
              Google generates a <b>16-character password</b>. Add it to your <code className="bg-slate-100 px-1 py-0.5 rounded font-mono text-navy-900">.env</code>:
              <pre className="mt-1.5 p-2 rounded bg-slate-900 text-slate-200 font-mono text-[11px] overflow-x-auto">
{`GMAIL_USER="yourname@gmail.com"
GMAIL_APP_PASSWORD="abcd efgh ijkl mnop"
ALERT_RECIPIENT_EMAIL="yourname@gmail.com"`}
              </pre>
            </li>
          </ol>
        </div>

        {/* Benefits & Zero Cost Assurance */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Sparkles className="w-4 h-4 text-amber-500" />
              <h4 className="text-sm font-black tracking-tight text-navy-900">
                Why Gmail SMTP via Nodemailer?
              </h4>
            </div>
            <ul className="space-y-2.5 text-xs text-slate-600">
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span><b>100% Free Forever:</b> Google allows up to 500 outgoing SMTP emails per day for free with any standard Gmail account.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span><b>No Credit Card or SaaS Signup:</b> No third-party email marketing platforms, quotas, or subscription expirations.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span><b>High Deliverability:</b> Directly sent from Google servers, ensuring alerts land in your primary inbox instead of spam.</span>
              </li>
            </ul>
          </div>

          <div className="mt-4 p-3 rounded-xl bg-emerald-50 border border-emerald-100 text-xs text-emerald-800">
            💡 <b>Dual Alert System:</b> You can keep both Telegram and Email active simultaneously to guarantee you never miss a slot even if your phone is on silent!
          </div>
        </div>

      </div>

    </div>
  );
}
