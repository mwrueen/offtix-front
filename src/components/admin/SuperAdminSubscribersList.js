import React, { useState, useEffect } from 'react';
import { subscriptionAPI } from '../../services/api';

const SuperAdminSubscribersList = () => {
  const [subscribersData, setSubscribersData] = useState({
    totalUsers: 0,
    premiumCount: 0,
    freeCount: 0,
    subscribers: []
  });
  const [monthlyPrice, setMonthlyPrice] = useState(10);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState({ type: '', text: '' });

  // Filter, Search & Pagination State
  const [activeTab, setActiveTab] = useState('all'); // 'all', 'premium', 'free'
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [actionUserId, setActionUserId] = useState(null);

  useEffect(() => {
    fetchSubscribers();
  }, []);

  // Reset to page 1 when filter or search query changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, activeTab, itemsPerPage]);

  const fetchSubscribers = async () => {
    try {
      setLoading(true);
      const [subRes, configRes] = await Promise.all([
        subscriptionAPI.getSubscribers(),
        subscriptionAPI.getPlanConfig().catch(() => ({ data: null }))
      ]);

      if (subRes.data) {
        setSubscribersData(subRes.data);
      }
      if (configRes.data && configRes.data.monthlyPrice) {
        setMonthlyPrice(configRes.data.monthlyPrice);
      }
    } catch (err) {
      console.error('Error fetching subscribers:', err);
    } finally {
      setLoading(false);
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

      setSubscribersData(prev => {
        const updatedSubs = prev.subscribers.map(s => {
          if (s._id === user._id) {
            return {
              ...s,
              plan: newPlan,
              isPremium: newPlan === 'premium',
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

  // Filter subscribers based on search query & selected tab
  const filteredSubscribers = (subscribersData.subscribers || []).filter(sub => {
    const matchesSearch = sub.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          sub.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (sub.company?.name && sub.company.name.toLowerCase().includes(searchQuery.toLowerCase()));

    if (!matchesSearch) return false;
    if (activeTab === 'premium') return sub.isPremium;
    if (activeTab === 'free') return !sub.isPremium;
    return true;
  });

  // Calculate pagination slices
  const totalItems = filteredSubscribers.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage) || 1;
  const validCurrentPage = Math.min(Math.max(1, currentPage), totalPages);
  const startIndex = (validCurrentPage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, totalItems);
  const paginatedSubscribers = filteredSubscribers.slice(startIndex, endIndex);

  const estimatedMRR = subscribersData.premiumCount * monthlyPrice;

  // Generate pagination page numbers range
  const getPageNumbers = () => {
    const pages = [];
    const maxVisible = 5;
    let start = Math.max(1, validCurrentPage - 2);
    let end = Math.min(totalPages, start + maxVisible - 1);
    if (end - start + 1 < maxVisible) {
      start = Math.max(1, end - maxVisible + 1);
    }
    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    return pages;
  };

  if (loading) {
    return (
      <div className="p-12 text-center text-slate-500 font-medium">
        Loading subscribers list...
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
              SuperAdmin Analytics
            </span>
            <h1 className="text-3xl font-black text-white mt-3 tracking-tight">
              Premium Package Subscribers Directory
            </h1>
            <p className="text-sm text-slate-300 mt-1 max-w-2xl">
              Track live users using the Premium plan across all organizations and personal workspaces. Grant or revoke Premium access instantly.
            </p>
          </div>

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

      {/* SUBSCRIBERS TABLE CARD */}
      <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200/80 space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-5">
          <div>
            <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-indigo-600 inline-block" />
              Registered Subscribers Directory
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Filtered list of platform users and their subscription statuses.
            </p>
          </div>

          {/* Search Bar & Filter Tabs */}
          <div className="flex flex-col sm:flex-row items-center gap-3">
            <div className="relative w-full sm:w-64">
              <svg className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                placeholder="Search user, email or company..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:border-indigo-500 focus:bg-white transition-all"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 text-xs"
                >
                  ✕
                </button>
              )}
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
              {paginatedSubscribers.length === 0 ? (
                <tr>
                  <td colSpan="6" className="py-8 text-center text-slate-400 font-medium">
                    No matching users found for "{searchQuery}".
                  </td>
                </tr>
              ) : (
                paginatedSubscribers.map(sub => (
                  <tr key={sub._id} className={`hover:bg-slate-50/70 transition-colors ${sub.isPremium ? 'bg-indigo-50/20' : ''}`}>
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

                    <td className="py-3.5 px-4">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                        sub.role === 'superadmin' ? 'bg-purple-100 text-purple-700' :
                        sub.role === 'admin' ? 'bg-indigo-100 text-indigo-700' :
                        'bg-slate-100 text-slate-600'
                      }`}>
                        {sub.role}
                      </span>
                    </td>

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

                    <td className="py-3.5 px-4">
                      {sub.isPremium ? (
                        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-gradient-to-r from-amber-500 to-indigo-600 text-white font-extrabold text-[11px] shadow-xs">
                          ⚡ Premium (${monthlyPrice}/mo)
                        </span>
                      ) : (
                        <span className="px-2.5 py-1 rounded-full bg-slate-100 text-slate-500 font-bold text-[11px]">
                          Free Tier
                        </span>
                      )}
                    </td>

                    <td className="py-3.5 px-4">
                      <span className={`inline-flex items-center gap-1 text-[11px] font-bold ${
                        sub.isPremium ? 'text-emerald-600' : 'text-slate-400'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${sub.isPremium ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                        {sub.stripeCustomerId ? 'Stripe Subscribed' : sub.isPremium ? 'Manually Granted' : 'Standard Free'}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      {sub.isPremium ? (
                        <button
                          onClick={() => handleTogglePlan(sub, 'free')}
                          disabled={actionUserId === sub._id}
                          className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-[11px] rounded-xl transition-all cursor-pointer"
                        >
                          {actionUserId === sub._id ? 'Updating...' : 'Set to Free'}
                        </button>
                      ) : (
                        <button
                          onClick={() => handleTogglePlan(sub, 'premium')}
                          disabled={actionUserId === sub._id}
                          className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-[11px] rounded-xl transition-all shadow-xs cursor-pointer"
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

        {/* PAGINATION FOOTER CONTROL BAR */}
        {totalItems > 0 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-slate-100">
            {/* Page Size & Result Counter */}
            <div className="flex items-center gap-3 text-xs text-slate-500">
              <span>Showing <strong>{startIndex + 1}</strong> to <strong>{endIndex}</strong> of <strong>{totalItems}</strong> subscribers</span>
              
              <div className="flex items-center gap-1.5 border-l border-slate-200 pl-3">
                <span className="text-slate-400">Rows per page:</span>
                <select
                  value={itemsPerPage}
                  onChange={e => setItemsPerPage(Number(e.target.value))}
                  className="bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-xs font-bold text-slate-700 outline-none focus:border-indigo-500 cursor-pointer"
                >
                  <option value={10}>10</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                </select>
              </div>
            </div>

            {/* Page Navigation Buttons */}
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={validCurrentPage === 1}
                className="px-3 py-1.5 bg-slate-50 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed border border-slate-200 rounded-xl text-xs font-bold text-slate-700 transition-all flex items-center gap-1 cursor-pointer"
              >
                ‹ Prev
              </button>

              {getPageNumbers().map(pageNum => (
                <button
                  key={pageNum}
                  onClick={() => setCurrentPage(pageNum)}
                  className={`w-8 h-8 rounded-xl text-xs font-bold transition-all ${
                    validCurrentPage === pageNum
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200'
                  }`}
                >
                  {pageNum}
                </button>
              ))}

              <button
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={validCurrentPage === totalPages}
                className="px-3 py-1.5 bg-slate-50 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed border border-slate-200 rounded-xl text-xs font-bold text-slate-700 transition-all flex items-center gap-1 cursor-pointer"
              >
                Next ›
              </button>
            </div>
          </div>
        )}

      </div>

    </div>
  );
};

export default SuperAdminSubscribersList;
