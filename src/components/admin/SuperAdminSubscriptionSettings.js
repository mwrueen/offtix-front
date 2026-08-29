import React, { useState, useEffect } from 'react';
import { subscriptionAPI } from '../../services/api';

const SuperAdminSubscriptionSettings = () => {
  const [planConfig, setPlanConfig] = useState({
    name: 'Premium Plan',
    monthlyPrice: 10,
    currency: 'usd',
    description: '',
    premiumFeatures: {
      allowAI: true,
      allowProjectFiles: true,
      allowChatDocs: true,
      allowTaskCompletionDocs: true
    },
    freeRestrictions: {
      allowAI: false,
      allowProjectFiles: false,
      allowChatDocs: false,
      allowTaskCompletionDocs: false
    }
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    fetchPlanConfig();
  }, []);

  const fetchPlanConfig = async () => {
    try {
      setLoading(true);
      const res = await subscriptionAPI.getPlanConfig();
      if (res.data) {
        setPlanConfig({
          name: res.data.name || 'Premium Plan',
          monthlyPrice: res.data.monthlyPrice !== undefined ? res.data.monthlyPrice : 10,
          currency: res.data.currency || 'usd',
          description: res.data.description || '',
          premiumFeatures: res.data.premiumFeatures || {
            allowAI: true,
            allowProjectFiles: true,
            allowChatDocs: true,
            allowTaskCompletionDocs: true
          },
          freeRestrictions: res.data.freeRestrictions || {
            allowAI: false,
            allowProjectFiles: false,
            allowChatDocs: false,
            allowTaskCompletionDocs: false
          }
        });
      }
    } catch (err) {
      console.error('Error fetching plan config:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveConfig = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage({ type: '', text: '' });
    try {
      await subscriptionAPI.updatePlanConfig(planConfig);
      setMessage({ type: 'success', text: '✅ Subscription plan pricing and feature restrictions updated successfully!' });
    } catch (err) {
      console.error('Error saving plan config:', err);
      setMessage({ type: 'error', text: err.response?.data?.error || 'Failed to update plan configuration' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="p-12 text-center text-slate-500 font-medium">
        Loading subscription settings...
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6 my-4">
      
      {/* Title */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full">
            SuperAdmin Control
          </span>
          <h1 className="text-2xl font-black text-slate-900 mt-2">
            Subscription Pricing & Feature Settings
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Set monthly Premium package price and toggle feature permissions for Free accounts.
          </p>
        </div>
      </div>

      {message.text && (
        <div className={`p-4 rounded-2xl text-xs font-semibold shadow-xs ${
          message.type === 'success' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-rose-50 text-rose-800 border border-rose-200'
        }`}>
          {message.text}
        </div>
      )}

      {/* Settings Form */}
      <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200/80 space-y-6">
        <form onSubmit={handleSaveConfig} className="space-y-8">
          
          {/* Pricing */}
          <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200/70">
            <h3 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
              <svg className="w-4 h-4 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Premium Plan Pricing Configuration
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Monthly Price ($ USD)
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={planConfig.monthlyPrice}
                  onChange={e => setPlanConfig({ ...planConfig, monthlyPrice: parseFloat(e.target.value) || 0 })}
                  className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-xl text-sm font-bold text-slate-900 outline-none focus:border-indigo-500"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Currency Code
                </label>
                <input
                  type="text"
                  value={planConfig.currency}
                  onChange={e => setPlanConfig({ ...planConfig, currency: e.target.value.toLowerCase() })}
                  className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-xl text-sm uppercase text-slate-900 outline-none focus:border-indigo-500"
                  required
                />
              </div>
            </div>
          </div>

          {/* Feature Permissions Matrix */}
          <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200/70">
            <h3 className="text-sm font-bold text-slate-900 mb-2 flex items-center gap-2">
              <svg className="w-4 h-4 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              Free Account Feature Permissions (Checked = Allowed for Free Users)
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Uncheck features below to lock them on Free accounts and require a Premium subscription upgrade.
            </p>

            <div className="space-y-3 bg-white p-4 rounded-xl border border-slate-200">
              <label className="flex items-center justify-between cursor-pointer p-2 hover:bg-slate-50 rounded-lg">
                <div>
                  <span className="text-xs font-bold text-slate-900 block">AI System-Wide Tools</span>
                  <span className="text-[11px] text-slate-500">Generating task breakdowns, job posts, project descriptions & audio transcripts</span>
                </div>
                <input
                  type="checkbox"
                  checked={planConfig.freeRestrictions.allowAI}
                  onChange={e => setPlanConfig({
                    ...planConfig,
                    freeRestrictions: { ...planConfig.freeRestrictions, allowAI: e.target.checked }
                  })}
                  className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
                />
              </label>

              <label className="flex items-center justify-between cursor-pointer p-2 hover:bg-slate-50 rounded-lg border-t border-slate-100">
                <div>
                  <span className="text-xs font-bold text-slate-900 block">Project File Uploads & Attachments</span>
                  <span className="text-[11px] text-slate-500">Uploading files, attachments & repositories inside projects</span>
                </div>
                <input
                  type="checkbox"
                  checked={planConfig.freeRestrictions.allowProjectFiles}
                  onChange={e => setPlanConfig({
                    ...planConfig,
                    freeRestrictions: { ...planConfig.freeRestrictions, allowProjectFiles: e.target.checked }
                  })}
                  className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
                />
              </label>

              <label className="flex items-center justify-between cursor-pointer p-2 hover:bg-slate-50 rounded-lg border-t border-slate-100">
                <div>
                  <span className="text-xs font-bold text-slate-900 block">Chat Document & File Sending</span>
                  <span className="text-[11px] text-slate-500">Sending documents, zip archives, and media files in project & team chat</span>
                </div>
                <input
                  type="checkbox"
                  checked={planConfig.freeRestrictions.allowChatDocs}
                  onChange={e => setPlanConfig({
                    ...planConfig,
                    freeRestrictions: { ...planConfig.freeRestrictions, allowChatDocs: e.target.checked }
                  })}
                  className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
                />
              </label>

              <label className="flex items-center justify-between cursor-pointer p-2 hover:bg-slate-50 rounded-lg border-t border-slate-100">
                <div>
                  <span className="text-xs font-bold text-slate-900 block">Task Completion Document Attachments</span>
                  <span className="text-[11px] text-slate-500">Attaching proof documents when completing or returning task steps</span>
                </div>
                <input
                  type="checkbox"
                  checked={planConfig.freeRestrictions.allowTaskCompletionDocs}
                  onChange={e => setPlanConfig({
                    ...planConfig,
                    freeRestrictions: { ...planConfig.freeRestrictions, allowTaskCompletionDocs: e.target.checked }
                  })}
                  className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
                />
              </label>
            </div>
          </div>

          <button
            type="submit"
            disabled={saving}
            className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
          >
            {saving ? 'Saving Settings...' : 'Save Plan Pricing & Feature Settings'}
          </button>
        </form>
      </div>

    </div>
  );
};

export default SuperAdminSubscriptionSettings;
