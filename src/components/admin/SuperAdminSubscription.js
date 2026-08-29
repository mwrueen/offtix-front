import React, { useState, useEffect } from 'react';
import { subscriptionAPI } from '../../services/api';

const SuperAdminSubscription = () => {
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

  const [subscribersData, setSubscribersData] = useState({
    totalUsers: 0,
    premiumCount: 0,
    freeCount: 0,
    subscribers: []
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  // Filter & Search state for subscribers table
  const [activeTab, setActiveTab] = useState('all'); // 'all', 'premium', 'free'
  const [searchQuery, setSearchQuery] = useState('');
  const [actionUserId, setActionUserId] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [configRes, subRes] = await Promise.all([
        subscriptionAPI.getPlanConfig(),
        subscriptionAPI.getSubscribers().catch(err => ({ data: null }))
      ]);

      if (configRes.data) {
        setPlanConfig({
          name: configRes.data.name || 'Premium Plan',
          monthlyPrice: configRes.data.monthlyPrice !== undefined ? configRes.data.monthlyPrice : 10,
          currency: configRes.data.currency || 'usd',
          description: configRes.data.description || '',
          premiumFeatures: configRes.data.premiumFeatures || {
            allowAI: true,
            allowProjectFiles: true,
            allowChatDocs: true,
            allowTaskCompletionDocs: true
          },
          freeRestrictions: configRes.data.freeRestrictions || {
            allowAI: false,
            allowProjectFiles: false,
            allowChatDocs: false,
            allowTaskCompletionDocs: false
          }
        });
      }

      if (subRes.data) {
        setSubscribersData(subRes.data);
      }
    } catch (err) {
      console.error('Error fetching subscription data:', err);
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

  const handleTogglePlan = async (user, newPlan) => {
    setActionUserId(user._id);
    setMessage({ type: '', text: '' });
    try {
      await subscriptionAPI.manualSetUserPlan({ targetUserId: user._id, plan: newPlan });
      setMessage({
        type: 'success',
        text: `Updated ${user.email}'s plan status to ${newPlan.toUpperCase()}!`
      });

      // Update local state smoothly
      setSubscribersData(prev => {
        const updatedSubs = prev.subscribers.map(s => {
          if (s._id === user._id) {
            return {
              ...s,
              plan: newPlan,
              isPremium: newPlan === 'premium' || s.role === 'superadmin',
              status: newPlan === 'premium' ? 'active' : 'none'
            };
          }
          return s;
        });
        return {
          ...prev,
          premiumCount: updatedSubs.filter(s => s.isPremium).length,
          freeCount: updatedSubs.filter(s => !s.isPremium).length,
          subscribers: updatedSubs
        };
      });
    } catch (err) {
      console.error('Error updating user plan:', err);
      setMessage({ type: 'error', text: err.response?.data?.error || 'Failed to update user plan' });
    } finally {
      setActionUserId(null);
    }
  };

  // Filtered subscribers list
  const filteredSubscribers = (subscribersData.subscribers || []).filter(sub => {
    const matchesSearch = sub.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          sub.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (sub.company?.name && sub.company.name.toLowerCase().includes(searchQuery.toLowerCase()));

    if (!matchesSearch) return false;
    if (activeTab === 'premium') return sub.isPremium;
    if (activeTab === 'free') return !sub.isPremium;
    return true;
  });

  const estimatedMRR = subscribersData.premiumCount * (planConfig.monthlyPrice || 10);

  if (loading) {
    return (
      <div className="p-12 text-center text-slate-500 font-medium">
        Loading subscription & subscriber management system...
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-8 my-4">
      
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-indigo-900 via-slate-900 to-slate-900 p-8 rounded-3xl text-white shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-indigo-300 bg-indigo-500/20 border border-indigo-400/30 px-3 py-1 rounded-full">
              SuperAdmin Control Center
            </span>
            <h1 className="text-3xl font-black text-white mt-3 tracking-tight">
              Subscription & Premium User Management
            </h1>
            <p className="text-sm text-slate-300 mt-1 max-w-2xl">
              Monitor active Premium members, view revenue estimates, adjust plan prices, and customize system-wide feature permissions for Free accounts.
            </p>
          </div>

          {/* Quick Metrics */}
          <div className="flex gap-4 shrink-0">
            <div className="bg-white/10 backdrop-blur-md border border-white/10 p-4 rounded-2xl min-w-[130px]">
              <p className="text-[10px] font-extrabold uppercase text-indigo-200">Active Premium</p>
              <div className="flex items-center gap-2 mt-1">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
                <p className="text-2xl font-black text-white">{subscribersData.premiumCount}</p>
              </div>
            </div>
            <div className="bg-white/10 backdrop-blur-md border border-white/10 p-4 rounded-2xl min-w-[130px]">
              <p className="text-[10px] font-extrabold uppercase text-indigo-200">Est. MRR</p>
              <p className="text-2xl font-black text-emerald-400 mt-1">${estimatedMRR}</p>
            </div>
          </div>
        </div>
      </div>

      {message.text && (
        <div className={`p-4 rounded-2xl text-xs font-semibold shadow-xs ${
          message.type === 'success' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-rose-50 text-rose-800 border border-rose-200'
        }`}>
          {message.text}
        </div>
      )}

      {/* SECTION 1: ACTIVE PREMIUM SUBSCRIBERS TABLE */}
      <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200/80 space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-5">
          <div>
            <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-indigo-600 inline-block" />
              Active Premium Package Subscribers & Users
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Live list of users currently using the Premium package across all organizations and personal workspaces.
            </p>
          </div>

          {/* Search & Filter Tabs */}
          <div className="flex flex-col sm:flex-row items-center gap-3">
            <div className="relative w-full sm:w-64">
              <svg className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                placeholder="Search user or email..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:border-indigo-500 focus:bg-white transition-all"
              />
            </div>

            <div className="flex bg-slate-100 p-1 rounded-xl shrink-0">
              <button
                onClick={() => setActiveTab('all')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  activeTab === 'all' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                All ({subscribersData.totalUsers})
              </button>
              <button
                onClick={() => setActiveTab('premium')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  activeTab === 'premium' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                ⚡ Premium ({subscribersData.premiumCount})
              </button>
              <button
                onClick={() => setActiveTab('free')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  activeTab === 'free' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                Free ({subscribersData.freeCount})
              </button>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto rounded-2xl border border-slate-200">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50/80 text-slate-400 font-extrabold uppercase text-[10px] tracking-wider border-b border-slate-200">
              <tr>
                <th className="py-3.5 px-4">User</th>
                <th className="py-3.5 px-4">Role</th>
                <th className="py-3.5 px-4">Organization / Workspace</th>
                <th className="py-3.5 px-4">Subscription Plan</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {filteredSubscribers.length === 0 ? (
                <tr>
                  <td colSpan="6" className="py-8 text-center text-slate-400 font-medium">
                    No matching users found for "{searchQuery}".
                  </td>
                </tr>
              ) : (
                filteredSubscribers.map(sub => (
                  <tr key={sub._id} className={`hover:bg-slate-50/70 transition-colors ${sub.isPremium ? 'bg-indigo-50/20' : ''}`}>
                    
                    {/* User info */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-slate-100 overflow-hidden flex items-center justify-center font-bold text-slate-700 text-xs shrink-0 border border-slate-200">
                          {sub.avatar ? (
                            <img src={sub.avatar} alt="" className="w-full h-full object-cover" />
                          ) : (
                            sub.name?.charAt(0)?.toUpperCase()
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="font-bold text-slate-900 truncate leading-tight">{sub.name}</p>
                          <p className="text-[11px] text-slate-400 truncate">{sub.email}</p>
                        </div>
                      </div>
                    </td>

                    {/* Role */}
                    <td className="py-3.5 px-4">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                        sub.role === 'superadmin' ? 'bg-purple-100 text-purple-700' :
                        sub.role === 'admin' ? 'bg-indigo-100 text-indigo-700' :
                        'bg-slate-100 text-slate-600'
                      }`}>
                        {sub.role}
                      </span>
                    </td>

                    {/* Organization */}
                    <td className="py-3.5 px-4 font-medium text-slate-700">
                      {sub.company ? (
                        <span className="flex items-center gap-1.5 font-bold text-slate-800">
                          <svg className="w-3.5 h-3.5 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                          </svg>
                          {sub.company.name}
                        </span>
                      ) : (
                        <span className="text-slate-400 italic">Personal Workspace</span>
                      )}
                    </td>

                    {/* Plan */}
                    <td className="py-3.5 px-4">
                      {sub.isPremium ? (
                        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-gradient-to-r from-amber-500 to-indigo-600 text-white font-extrabold text-[11px] shadow-xs">
                          ⚡ Premium ($10/mo)
                        </span>
                      ) : (
                        <span className="px-2.5 py-1 rounded-full bg-slate-100 text-slate-500 font-bold text-[11px]">
                          Free Tier
                        </span>
                      )}
                    </td>

                    {/* Status */}
                    <td className="py-3.5 px-4">
                      <span className={`inline-flex items-center gap-1 text-[11px] font-bold ${
                        sub.isPremium ? 'text-emerald-600' : 'text-slate-400'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${sub.isPremium ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                        {sub.role === 'superadmin' ? 'SuperAdmin Included' : sub.stripeCustomerId ? 'Stripe Subscribed' : sub.isPremium ? 'Manually Granted' : 'Standard Free'}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4 text-right">
                      {sub.role === 'superadmin' ? (
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">SuperAdmin</span>
                      ) : sub.isPremium ? (
                        <button
                          onClick={() => handleTogglePlan(sub, 'free')}
                          disabled={actionUserId === sub._id}
                          className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-[11px] rounded-xl transition-all"
                        >
                          {actionUserId === sub._id ? 'Updating...' : 'Set to Free'}
                        </button>
                      ) : (
                        <button
                          onClick={() => handleTogglePlan(sub, 'premium')}
                          disabled={actionUserId === sub._id}
                          className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-[11px] rounded-xl transition-all shadow-xs"
                        >
                          {actionUserId === sub._id ? 'Updating...' : 'Grant Premium'}
                        </button>
                      )}
                    </td>

                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* SECTION 2: SUBSCRIPTION PLAN & FEATURE RESTRICTIONS FORM */}
      <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200/80 space-y-6">
        <div className="border-b border-slate-100 pb-4">
          <h2 className="text-lg font-black text-slate-900">
            Subscription Pricing & Feature Restrictions Matrix
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            SuperAdmin controls for setting monthly price and toggling system-wide feature permissions for Free vs Premium tiers.
          </p>
        </div>

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

          {/* Restrictions Matrix */}
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

export default SuperAdminSubscription;
