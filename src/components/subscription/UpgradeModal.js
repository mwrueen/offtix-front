import React, { useState } from 'react';
import { subscriptionAPI } from '../../services/api';

const featureTitles = {
  ai: 'AI Assistant & System-Wide AI Tools',
  projectFiles: 'Project File Uploads & Attachments',
  chatDocs: 'Sending Documents & Files in Chat',
  taskCompletionDocs: 'Task Completion File Attachments'
};

const featureDescriptions = {
  ai: 'AI-powered project description generation, task Breakdown, job posting creation, and audio transcription are available exclusively on the Premium Plan ($10/month).',
  projectFiles: 'Uploading project attachments and managing repository files is restricted to Premium accounts ($10/month).',
  chatDocs: 'Sending PDF documents, zip archives, and media files in project and team chat channels requires a Premium subscription ($10/month).',
  taskCompletionDocs: 'Attaching completion proof documents and file evidence when submitting tasks requires a Premium subscription ($10/month).'
};

const UpgradeModal = ({ isOpen, onClose, featureKey = 'ai' }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleUpgradeClick = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await subscriptionAPI.createCheckoutSession();
      if (response.data?.url) {
        window.location.href = response.data.url;
      } else {
        window.location.href = '/pricing';
      }
    } catch (err) {
      console.error('Checkout Error:', err);
      setError(err.response?.data?.error || 'Failed to initialize checkout. Redirecting to Pricing...');
      setTimeout(() => {
        window.location.href = '/pricing';
      }, 1500);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-fade-in">
      <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-6 border border-slate-100 relative overflow-hidden">
        {/* Top Decorative Gradient */}
        <div className="absolute top-0 left-0 right-0 h-2.5 bg-gradient-to-r from-amber-500 via-indigo-600 to-emerald-500" />

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 w-8 h-8 rounded-full flex items-center justify-center hover:bg-slate-100 transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Header Badge & Title */}
        <div className="flex flex-col items-center text-center mt-2 mb-4">
          <div className="w-14 h-14 bg-gradient-to-br from-amber-100 to-indigo-100 text-indigo-600 rounded-2xl flex items-center justify-center shadow-inner mb-3">
            <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <span className="text-[11px] font-bold tracking-wider uppercase bg-amber-100 text-amber-800 px-3 py-0.5 rounded-full mb-1">
            Premium Plan Required
          </span>
          <h3 className="text-xl font-extrabold text-slate-900">
            {featureTitles[featureKey] || 'Premium Feature Locked'}
          </h3>
        </div>

        {/* Feature Description */}
        <p className="text-xs text-slate-600 text-center mb-5 leading-relaxed bg-slate-50 p-3.5 rounded-2xl border border-slate-200/60">
          {featureDescriptions[featureKey] || 'This action is restricted on Free accounts. Upgrade to Premium ($10/month) to unlock AI system-wide and document attachments.'}
        </p>

        {/* Premium Highlights */}
        <div className="space-y-2 mb-6">
          <div className="flex items-center gap-2.5 text-xs text-slate-700">
            <svg className="w-4 h-4 text-emerald-500 shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <span><strong>System-Wide AI</strong> for project tasks, jobs & audio transcripts</span>
          </div>
          <div className="flex items-center gap-2.5 text-xs text-slate-700">
            <svg className="w-4 h-4 text-emerald-500 shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <span><strong>Unlimited Project File Uploads</strong> & attachment storage</span>
          </div>
          <div className="flex items-center gap-2.5 text-xs text-slate-700">
            <svg className="w-4 h-4 text-emerald-500 shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <span><strong>Send Documents & Files</strong> in project & team chat</span>
          </div>
          <div className="flex items-center gap-2.5 text-xs text-slate-700">
            <svg className="w-4 h-4 text-emerald-500 shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <span><strong>Task Completion Proof</strong> document attachments</span>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-2.5 bg-rose-50 border border-rose-200 text-rose-600 rounded-xl text-xs text-center font-medium">
            {error}
          </div>
        )}

        {/* Buttons */}
        <div className="flex flex-col gap-2">
          <button
            onClick={handleUpgradeClick}
            disabled={loading}
            className="w-full py-3 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white font-bold text-sm rounded-2xl shadow-lg shadow-indigo-500/25 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-[0.99]"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                Connecting to Stripe...
              </>
            ) : (
              <>
                Upgrade to Premium — $10/month
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </>
            )}
          </button>
          <button
            onClick={onClose}
            className="w-full py-2.5 text-xs text-slate-500 hover:text-slate-700 font-medium transition-colors cursor-pointer"
          >
            Continue with Free Account
          </button>
        </div>
      </div>
    </div>
  );
};

export default UpgradeModal;
