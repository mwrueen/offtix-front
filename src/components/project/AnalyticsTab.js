import React, { useEffect, useState } from 'react';
import { projectAPI } from '../../services/api';
import { useCompany } from '../../context/CompanyContext';

const AnalyticsTab = ({ projectId }) => {
  const { state: companyState } = useCompany();
  const companyCurrency = companyState?.selectedCompany?.currency || 'USD';
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
  }, [projectId]);

  const fetchAnalytics = async () => {
    try {
      const res = await projectAPI.getAnalytics(projectId);
      setAnalytics(res.data);
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 animate-pulse">
        <div className="w-10 h-10 border-4 border-slate-200 border-t-indigo-600 rounded-full animate-spin mb-4" />
        <p className="text-slate-400 font-bold text-[10px] uppercase tracking-widest">Loading Analytics...</p>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="text-center py-24 bg-white rounded-3xl border border-slate-200 shadow-sm">
        <p className="text-slate-500 font-medium">No analytics data available for this project yet.</p>
      </div>
    );
  }

  const getHealthBadge = (status) => {
    const statusMap = {
      'healthy': 'bg-emerald-50 text-emerald-700 border-emerald-200',
      'at-risk': 'bg-amber-50 text-amber-700 border-amber-200',
      'critical': 'bg-rose-50 text-rose-700 border-rose-200',
      'completed': 'bg-indigo-50 text-indigo-700 border-indigo-200',
      'on-hold': 'bg-slate-50 text-slate-700 border-slate-200'
    };
    return statusMap[status] || 'bg-slate-50 text-slate-700 border-slate-200';
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      {/* Hero Health Section */}
      <div className="relative overflow-hidden bg-slate-950 rounded-3xl p-8 lg:p-12 shadow-xl border border-slate-800">
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-600/5 rounded-full blur-[100px] -mr-48 -mt-48" />

        <div className="relative z-10">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12">
            <div>
              <h2 className="text-2xl font-bold text-white uppercase tracking-tight">Project Health & Status</h2>
              <p className="text-slate-500 text-sm mt-1">Key performance indicators and operational health score.</p>
            </div>
            <div className={`px-4 py-1.5 rounded-xl border text-[10px] font-bold uppercase tracking-wider ${getHealthBadge(analytics.health.status)}`}>
              Status: {analytics.health.status.replace('-', ' ')}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white/5 border border-white/10 p-6 rounded-2xl flex flex-col justify-center">
              <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest mb-3">Health Score</p>
              <div className="text-3xl font-black text-white flex items-baseline gap-1">
                {analytics.health.score}
                <span className="text-xs text-slate-500 font-bold">/100</span>
              </div>
            </div>

            <div className="bg-white/5 border border-white/10 p-6 rounded-2xl flex flex-col justify-center">
              <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest mb-3">Overall Progress</p>
              <div className="text-3xl font-black text-white">{analytics.overview.progress}%</div>
            </div>

            <div className="bg-white/5 border border-white/10 p-6 rounded-2xl flex flex-col justify-center">
              <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest mb-3">Timeline Status</p>
              <div className="flex flex-col">
                <span className={`text-sm font-bold ${analytics.timeline.isOverdue ? 'text-rose-400' : 'text-emerald-400'}`}>
                  {analytics.timeline.isOverdue ? 'BEHIND SCHEDULE' : 'ON SCHEDULE'}
                </span>
                <span className="text-[10px] text-slate-500 mt-1 uppercase font-bold tracking-tight">{analytics.timeline.daysRemaining} days remaining</span>
              </div>
            </div>

            <div className="bg-white/5 border border-white/10 p-6 rounded-2xl flex flex-col justify-center">
              <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest mb-3">Project Team</p>
              <div className="text-sm font-bold text-white">
                <span className="text-indigo-400">{analytics.overview.teamSize}</span> active members
                <div className="text-[10px] text-slate-500 mt-1 uppercase">{analytics.overview.deviceCount || 0} tracked assets</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Schedule/Timeline Tracking */}
        <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm flex flex-col">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h3 className="text-lg font-bold text-slate-900 capitalize tracking-tight">Project Schedule</h3>
              <p className="text-xs text-slate-500 mt-0.5">Timeline execution and deadline management</p>
            </div>
            <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600 font-bold text-sm border border-indigo-100 italic">
              {analytics.timeline.progress}%
            </div>
          </div>

          <div className="space-y-8 flex-1 flex flex-col justify-center">
            <div className="relative pt-2">
              <div className="flex justify-between text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 px-1">
                <span>START: {new Date(analytics.timeline.startDate).toLocaleDateString()}</span>
                <span>END: {new Date(analytics.timeline.endDate).toLocaleDateString()}</span>
              </div>
              <div className="h-2.5 w-full bg-slate-100 rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all duration-1000 ${analytics.timeline.isOverdue ? 'bg-rose-500' : 'bg-indigo-600'}`}
                  style={{ width: `${Math.min(100, analytics.timeline.progress)}%` }}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-slate-50/50 p-6 rounded-2xl border border-slate-100">
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">Time Elapsed</p>
                <div className="text-2xl font-bold text-slate-900">{analytics.timeline.daysElapsed} <span className="text-xs text-slate-400 font-medium">Days</span></div>
              </div>
              <div className={`p-6 rounded-2xl border ${analytics.timeline.isOverdue ? 'bg-rose-50 border-rose-100' : 'bg-slate-50/50 border-slate-100'}`}>
                <p className={`text-[9px] font-bold uppercase tracking-widest mb-1 ${analytics.timeline.isOverdue ? 'text-rose-500' : 'text-slate-400'}`}>
                  {analytics.timeline.isOverdue ? 'Days Overdue' : 'Days Remaining'}
                </p>
                <div className={`text-2xl font-bold ${analytics.timeline.isOverdue ? 'text-rose-600' : 'text-slate-900'}`}>{Math.abs(analytics.timeline.daysRemaining)}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Budget Analysis */}
        <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm flex flex-col">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h3 className="text-lg font-bold text-slate-900 capitalize tracking-tight">Budget Analysis</h3>
              <p className="text-xs text-slate-500 mt-0.5">Capital usage and expenditure mapping</p>
            </div>
            <div className={`px-3 py-1 rounded-lg font-bold text-[9px] border tracking-widest uppercase ${analytics.budget.isOverBudget ? 'bg-rose-50 text-rose-600 border-rose-200' : 'bg-emerald-50 text-emerald-600 border-emerald-200'}`}>
              {analytics.budget.utilization}% spent
            </div>
          </div>

          <div className="space-y-8 flex-1 flex flex-col justify-center">
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-1">
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1 px-1">Allocation</p>
                <p className="text-base font-bold text-slate-900 truncate">{companyCurrency} {analytics.budget.budgetAmount.toLocaleString()}</p>
              </div>
              <div className="space-y-1">
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1 px-1">Actual</p>
                <p className={`text-base font-bold truncate ${analytics.budget.isOverBudget ? 'text-rose-500' : 'text-slate-900'}`}>
                  {companyCurrency} {analytics.budget.actualCost.toLocaleString()}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1 px-1">Variance</p>
                <p className={`text-base font-bold truncate ${analytics.budget.remaining < 0 ? 'text-rose-500' : 'text-emerald-500'}`}>
                  {companyCurrency} {analytics.budget.remaining.toLocaleString()}
                </p>
              </div>
            </div>

            <div className="relative pt-2">
              <div className="h-2.5 w-full bg-slate-100 rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all duration-1000 ${analytics.budget.isOverBudget ? 'bg-rose-500' : analytics.budget.utilization > 85 ? 'bg-amber-500' : 'bg-emerald-500'}`}
                  style={{ width: `${Math.min(100, analytics.budget.utilization)}%` }}
                />
              </div>
            </div>

            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 text-center">
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-tight">Variance is {analytics.budget.isOverBudget ? 'Critical (Over Budget)' : 'Within Operational Parameters'}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Grid Metrics Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Milestone Drilldown */}
        <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm group hover:shadow-md transition-all">
          <div className="w-10 h-10 bg-indigo-50 p-2 rounded-xl mb-6 flex items-center justify-center text-lg shadow-inner">🎯</div>
          <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-6">Milestones</h4>
          <div className="space-y-4">
            <div className="flex justify-between items-center bg-slate-50 p-3 rounded-xl">
              <span className="text-[10px] text-slate-500 font-bold uppercase tracking-tight">Completion Rate</span>
              <span className="text-sm font-bold text-indigo-600">{analytics.milestones.progress}%</span>
            </div>
            <div className="flex justify-between items-center px-1">
              <span className="text-xs text-slate-500 font-medium">Total Tracked</span>
              <span className="text-sm font-bold text-slate-900">{analytics.milestones.total}</span>
            </div>
            <div className="flex justify-between items-center px-1">
              <span className="text-xs text-slate-500 font-medium">Successful</span>
              <span className="text-sm font-bold text-emerald-600">{analytics.milestones.completed}</span>
            </div>
            <div className="flex justify-between items-center px-1 border-t border-slate-50 pt-2">
              <span className="text-xs text-slate-500 font-medium">Delayed</span>
              <span className="text-sm font-bold text-rose-500">{analytics.milestones.delayed}</span>
            </div>
          </div>
        </div>

        {/* Risk Assessment */}
        <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm group hover:shadow-md transition-all font-sans">
          <div className="w-10 h-10 bg-rose-50 p-2 rounded-xl mb-6 flex items-center justify-center text-lg shadow-inner">⚠️</div>
          <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-6">Risk Assessment</h4>
          <div className="space-y-4">
            <div className="flex justify-between items-center bg-slate-50 p-3 rounded-xl">
              <span className="text-[10px] text-slate-500 font-bold uppercase tracking-tight">Mitigated Ratio</span>
              <span className="text-sm font-bold text-emerald-600">{Math.round((analytics.risks.mitigated / (analytics.risks.total || 1)) * 100)}%</span>
            </div>
            <div className="flex justify-between items-center px-1">
              <span className="text-xs text-slate-500 font-medium">Active Risks</span>
              <span className="text-sm font-bold text-slate-900">{analytics.risks.total}</span>
            </div>
            <div className="flex justify-between items-center px-1">
              <span className="text-xs text-slate-500 font-medium">Critical Issues</span>
              <span className="text-sm font-bold text-rose-600">{analytics.risks.critical}</span>
            </div>
            <div className="flex justify-between items-center px-1 border-t border-slate-50 pt-2">
              <span className="text-xs text-slate-500 font-medium">High Impact</span>
              <span className="text-sm font-bold text-amber-600">{analytics.risks.high}</span>
            </div>
          </div>
        </div>

        {/* Dependency Map */}
        <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm group hover:shadow-md transition-all">
          <div className="w-10 h-10 bg-emerald-50 p-2 rounded-xl mb-6 flex items-center justify-center text-lg shadow-inner">🔗</div>
          <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-6">Dependencies</h4>
          <div className="space-y-4">
            <div className="flex justify-between items-center bg-slate-50 p-3 rounded-xl">
              <span className="text-[10px] text-slate-500 font-bold uppercase tracking-tight">Resolution Rate</span>
              <span className="text-sm font-bold text-emerald-600">{Math.round((analytics.dependencies.resolved / (analytics.dependencies.total || 1)) * 100)}%</span>
            </div>
            <div className="flex justify-between items-center px-1">
              <span className="text-xs text-slate-500 font-medium">Total Linked</span>
              <span className="text-sm font-bold text-slate-900">{analytics.dependencies.total}</span>
            </div>
            <div className="flex justify-between items-center px-1">
              <span className="text-xs text-slate-500 font-medium">Current Blocks</span>
              <span className="text-sm font-bold text-rose-500">{analytics.dependencies.blocked}</span>
            </div>
            <div className="flex justify-between items-center px-1 border-t border-slate-50 pt-2">
              <span className="text-xs text-slate-500 font-medium">Resolved</span>
              <span className="text-sm font-bold text-emerald-600">{analytics.dependencies.resolved}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsTab;
