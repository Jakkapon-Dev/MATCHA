import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Sliders,
  ShieldCheck,
  Trash2,
  AlertTriangle,
  CheckCircle2,
  Clock,
  ExternalLink,
  Lock,
  Database
} from 'lucide-react';
import { api } from '../../services/api';
import { useToast } from '../../context/ToastContext';

export default function PreferencesTab({ preferences, onTogglePreference }) {
  const { showToast } = useToast();

  // Server Marketing Consent State
  const [consent, setConsent] = useState(null);
  const [consentLoading, setConsentLoading] = useState(true);
  const [updatingConsent, setUpdatingConsent] = useState(false);

  // Deletion Request State
  const [deletionReq, setDeletionReq] = useState(null);
  const [deletionLoading, setDeletionLoading] = useState(true);
  const [showDeletionModal, setShowDeletionModal] = useState(false);
  const [deletionReason, setDeletionReason] = useState('');
  const [submittingDeletion, setSubmittingDeletion] = useState(false);

  const prefItems = [
    { key: 'vipAlerts', title: 'VIP Early Drop Alerts', desc: 'Get notified 30 minutes before limited seasonal collections drop.' },
    { key: 'orderUpdates', title: 'Order & Shipping Notifications', desc: 'Receive real-time tracking updates via SMS & Email.' },
    { key: 'newsletter', title: 'MatchA Editorial Newsletter', desc: 'Weekly stories, streetwear lookbooks, and exclusive discounts.' },
    { key: 'smsAlerts', title: 'SMS Priority Access', desc: 'Direct text alerts for surprise restocks and warehouse drops.' }
  ];

  useEffect(() => {
    let active = true;

    // Load server consent
    api.getConsent()
      .then(res => {
        if (active && res && res.data) {
          setConsent(res.data);
        }
      })
      .catch(err => {
        console.warn('[Consent] Could not load server consent:', err.message);
      })
      .finally(() => {
        if (active) setConsentLoading(false);
      });

    // Load existing deletion request
    api.getDeletionRequest()
      .then(res => {
        if (active && res && res.data) {
          setDeletionReq(res.data);
        }
      })
      .catch(err => {
        console.warn('[Deletion] Could not load deletion status:', err.message);
      })
      .finally(() => {
        if (active) setDeletionLoading(false);
      });

    return () => { active = false; };
  }, []);

  const handleToggleConsent = async () => {
    const nextOptedIn = !consent?.optedIn;
    setUpdatingConsent(true);
    try {
      const res = await api.updateConsent({ optedIn: nextOptedIn, version: '1.1' });
      if (res && res.data) {
        setConsent(res.data);
        showToast(
          nextOptedIn
            ? 'Marketing consent opted in and logged on server.'
            : 'Marketing consent withdrawn.',
          'success'
        );
      }
    } catch (err) {
      showToast(err.message || 'Failed to update consent preferences.', 'error');
    } finally {
      setUpdatingConsent(false);
    }
  };

  const handleSubmitDeletion = async (e) => {
    e.preventDefault();
    setSubmittingDeletion(true);
    try {
      const res = await api.submitDeletionRequest({ reason: deletionReason });
      if (res && res.data) {
        setDeletionReq(res.data);
        setShowDeletionModal(false);
        setDeletionReason('');
        showToast('Data deletion request submitted successfully.', 'success');
      }
    } catch (err) {
      showToast(err.message || 'Could not submit deletion request.', 'error');
    } finally {
      setSubmittingDeletion(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* 1. Communication & Drop Preferences */}
      <div className="bg-white border border-matcha-border p-6 sm:p-8 space-y-6">
        <div className="flex items-center justify-between pb-4 border-b border-matcha-border">
          <div className="flex items-center gap-2">
            <Sliders size={18} className="text-matcha-primary" />
            <h2 className="text-base font-extrabold uppercase tracking-tight text-[#0A0A0A]">
              Communication & Drop Preferences
            </h2>
          </div>
        </div>

        <div className="space-y-3">
          {prefItems.map((item) => (
            <div key={item.key} className="flex items-center justify-between p-4 border border-matcha-border bg-matcha-bg/40">
              <div>
                <h4 className="text-xs font-bold text-[#0A0A0A] uppercase font-mono">{item.title}</h4>
                <p className="text-[11px] font-mono text-matcha-muted mt-0.5">{item.desc}</p>
              </div>
              <button
                type="button"
                onClick={() => onTogglePreference(item.key)}
                className={`w-12 h-6 rounded-full transition-colors p-1 cursor-pointer flex items-center ${
                  preferences[item.key] ? 'bg-matcha-primary justify-end' : 'bg-matcha-border justify-start'
                }`}
              >
                <div className="w-4 h-4 rounded-full bg-white" />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* 2. Server-Recorded Marketing Consent (Opt-in) */}
      <div className="bg-white border border-matcha-border p-6 sm:p-8 space-y-6">
        <div className="flex items-center justify-between pb-4 border-b border-matcha-border">
          <div className="flex items-center gap-2">
            <ShieldCheck size={18} className="text-matcha-primary" />
            <h2 className="text-base font-extrabold uppercase tracking-tight text-[#0A0A0A]">
              Marketing Consent (Server-Persisted Opt-In)
            </h2>
          </div>
          <Link
            to="/legal/privacy"
            className="text-xs font-mono text-matcha-primary hover:underline flex items-center gap-1"
          >
            <span>Privacy Policy</span>
            <ExternalLink size={12} />
          </Link>
        </div>

        <div className="p-4 border border-matcha-border bg-matcha-bg/30 rounded-xl space-y-3">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-1">
              <h4 className="text-xs font-bold text-[#0A0A0A] uppercase font-mono flex items-center gap-2">
                <span>Promotional & Direct Marketing Consent</span>
                {consent && (
                  <span className="text-[10px] px-2 py-0.5 rounded bg-matcha-border/40 font-mono text-matcha-muted font-normal">
                    v{consent.version || '1.1'}
                  </span>
                )}
              </h4>
              <p className="text-[11px] text-[#555555] leading-relaxed">
                Receive curated collection announcements, exclusive personal color styling recommendations, and early access discount codes.
                We record your affirmative consent, policy version, and timestamp on the server in compliance with PDPA guidelines.
              </p>
              {consent?.updatedAt && (
                <p className="text-[10px] font-mono text-matcha-muted">
                  Last recorded: {new Date(consent.updatedAt).toLocaleString()}
                </p>
              )}
            </div>

            <button
              type="button"
              disabled={consentLoading || updatingConsent}
              onClick={handleToggleConsent}
              className={`w-12 h-6 rounded-full transition-colors p-1 cursor-pointer flex items-center shrink-0 ${
                consent?.optedIn ? 'bg-matcha-primary justify-end' : 'bg-matcha-border justify-start'
              } ${updatingConsent ? 'opacity-50' : ''}`}
            >
              <div className="w-4 h-4 rounded-full bg-white" />
            </button>
          </div>
        </div>
      </div>

      {/* 3. LocalStorage & Browser Storage Disclosure */}
      <div className="bg-white border border-matcha-border p-6 sm:p-8 space-y-4">
        <div className="flex items-center gap-2 pb-3 border-b border-matcha-border">
          <Database size={18} className="text-matcha-primary" />
          <h2 className="text-base font-extrabold uppercase tracking-tight text-[#0A0A0A]">
            Client Storage & Cookie Disclosure
          </h2>
        </div>

        <p className="text-xs text-[#555555] leading-relaxed">
          MatchA does not use third-party advertising or cross-site tracking cookies. We store strictly necessary functional keys in your browser:
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-mono">
          <div className="p-3 border border-matcha-border/60 bg-matcha-bg/20 rounded">
            <span className="font-bold text-black">matcha_token:</span>
            <span className="text-matcha-muted ml-1">Authentication session credential</span>
          </div>
          <div className="p-3 border border-matcha-border/60 bg-matcha-bg/20 rounded">
            <span className="font-bold text-black">matcha_cart:</span>
            <span className="text-matcha-muted ml-1">Current cart items across sessions</span>
          </div>
          <div className="p-3 border border-matcha-border/60 bg-matcha-bg/20 rounded">
            <span className="font-bold text-black">matcha_personal_color:</span>
            <span className="text-matcha-muted ml-1">Personal Color Quiz styling results</span>
          </div>
          <div className="p-3 border border-matcha-border/60 bg-matcha-bg/20 rounded">
            <span className="font-bold text-black">matcha_lang:</span>
            <span className="text-matcha-muted ml-1">Language preference (EN / TH)</span>
          </div>
        </div>
      </div>

      {/* 4. Data Deletion Request (Data Subject Rights) */}
      <div className="bg-white border border-red-200 p-6 sm:p-8 space-y-4 rounded-2xl">
        <div className="flex items-center justify-between pb-3 border-b border-red-100">
          <div className="flex items-center gap-2">
            <Trash2 size={18} className="text-red-500" />
            <h2 className="text-base font-extrabold uppercase tracking-tight text-red-950">
              Account & Data Deletion
            </h2>
          </div>
          <span className="text-[11px] font-mono font-semibold text-red-600 bg-red-50 px-2.5 py-1 rounded-full">
            Data Subject Rights
          </span>
        </div>

        <div className="space-y-3 text-xs text-[#555555] leading-relaxed">
          <p>
            You have the right to request permanent deletion of your personal account, saved addresses, and profile metadata from our servers.
          </p>

          <div className="p-3.5 bg-amber-50/70 border border-amber-200 rounded-lg text-amber-900 text-xs flex gap-2.5">
            <AlertTriangle size={16} className="text-amber-600 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <span className="font-bold">Accounting & Legal Retention Compliance:</span>
              <p className="text-[11px] text-amber-800">
                Under Thai commercial accounting and tax regulations, historical completed purchase invoices must be retained for at least 5 years. Upon approving your deletion request, your customer name, phone, and delivery address will be permanently anonymized from order archives.
              </p>
            </div>
          </div>
        </div>

        {deletionReq ? (
          <div className="p-4 border border-matcha-border bg-matcha-bg/40 rounded-xl space-y-2">
            <div className="flex items-center gap-2">
              {deletionReq.status === 'pending' ? (
                <Clock size={16} className="text-amber-500" />
              ) : deletionReq.status === 'completed' ? (
                <CheckCircle2 size={16} className="text-emerald-500" />
              ) : (
                <AlertTriangle size={16} className="text-gray-500" />
              )}
              <span className="text-xs font-bold uppercase font-mono text-black">
                Request Status: {deletionReq.status}
              </span>
            </div>
            <p className="text-[11px] font-mono text-matcha-muted">
              Submitted: {new Date(deletionReq.createdAt).toLocaleString()}
            </p>
            {deletionReq.reason && (
              <p className="text-xs text-gray-700 italic font-mono">
                Reason: &quot;{deletionReq.reason}&quot;
              </p>
            )}
            <p className="text-[11px] text-[#666666]">
              Your deletion request is in queue. Our data protection team processes authenticated requests within standard regulatory timeframes.
            </p>
          </div>
        ) : (
          <div className="pt-2">
            <button
              type="button"
              onClick={() => setShowDeletionModal(true)}
              className="px-4 py-2 border border-red-300 text-red-600 text-xs font-mono font-bold uppercase rounded-lg hover:bg-red-50 transition-colors cursor-pointer"
            >
              Submit Data Deletion Request
            </button>
          </div>
        )}
      </div>

      {/* Deletion Request Modal */}
      {showDeletionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white border border-matcha-border rounded-2xl max-w-md w-full p-6 space-y-5 shadow-2xl">
            <div className="flex items-center gap-2 text-red-600">
              <AlertTriangle size={20} />
              <h3 className="text-base font-black uppercase tracking-tight">Confirm Deletion Request</h3>
            </div>

            <p className="text-xs text-[#555555] leading-relaxed">
              This will submit a formal data deletion ticket for your account. Your login credentials, saved addresses, and profile pictures will be deleted. Past financial orders will be anonymized for compliance.
            </p>

            <form onSubmit={handleSubmitDeletion} className="space-y-4">
              <div>
                <label className="block text-xs font-mono font-bold uppercase text-black mb-1">
                  Reason for Leaving (Optional)
                </label>
                <textarea
                  rows={3}
                  value={deletionReason}
                  onChange={(e) => setDeletionReason(e.target.value)}
                  placeholder="Tell us why you are deleting your account..."
                  className="w-full text-xs p-2.5 border border-matcha-border rounded-lg focus:outline-none focus:border-matcha-primary"
                  maxLength={500}
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowDeletionModal(false)}
                  className="px-4 py-2 text-xs font-mono uppercase font-bold border border-matcha-border rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingDeletion}
                  className="px-4 py-2 text-xs font-mono uppercase font-bold bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
                >
                  {submittingDeletion ? 'Submitting...' : 'Confirm Request'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

