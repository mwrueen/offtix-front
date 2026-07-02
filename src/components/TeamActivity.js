import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../context/ToastContext';
import Layout from './Layout';
import PageHeader from './PageHeader';
import api from '../services/api';
import { useCompanyFilter } from '../hooks/useCompanyFilter';

const TeamActivity = () => {
  const [teamMembers, setTeamMembers] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedProject, setSelectedProject] = useState('');
  
  const getLocalToday = () => {
    const d = new Date();
    const o = d.getTimezoneOffset();
    return new Date(d.getTime() - (o * 60 * 1000)).toISOString().split('T')[0];
  };
  
  const [selectedDate, setSelectedDate] = useState(getLocalToday());
  const { state: companyState, companyFilter } = useCompanyFilter();
  const [isInitializing, setIsInitializing] = useState(true);
  const navigate = useNavigate();
  const toast = useToast();

  useEffect(() => {
    if (companyState.loading) return;
    const ctrl = new AbortController();
    const fetchProjects = async () => {
      try {
        const config = { signal: ctrl.signal };
        if (companyFilter.companyId && companyFilter.companyId !== 'personal') {
          config.headers = { 'X-Company-Id': companyFilter.companyId };
          config.params = { companyId: companyFilter.companyId };
        }
        const res = await api.get('/projects', config);
        setProjects(res.data || []);
      } catch (e) { if (e.name !== 'CanceledError') console.error('Error fetching projects', e); }
    };
    fetchProjects();
    return () => ctrl.abort();
  }, [companyFilter.companyId, companyState.loading]);

  useEffect(() => {
    if (companyState.loading) return;
    const ctrl = new AbortController();
    const fetchActivity = async () => {
      try {
        setLoading(true);
        const config = { params: {}, signal: ctrl.signal };
        if (companyFilter.companyId && companyFilter.companyId !== 'personal') {
          config.headers = { 'X-Company-Id': companyFilter.companyId };
          config.params.companyId = companyFilter.companyId;
        }
        if (selectedProject) config.params.projectId = selectedProject;
        if (selectedDate) config.params.date = selectedDate;
        const res = await api.get('/team-activity', config);
        setTeamMembers(res.data);
        setError(null);
        setIsInitializing(false);
      } catch (e) {
        if (e.name !== 'CanceledError') {
          setError(e.response?.data?.error || 'Failed to fetch team activity');
          toast?.showToast?.('Connection lost.', 'error');
        }
      } finally { setLoading(false); }
    };
    fetchActivity();
    return () => ctrl.abort();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [companyFilter.companyId, selectedProject, selectedDate, companyState.loading]);

  const formatDate = (ds) => {
    if (!ds) return 'N/A';
    const d = new Date(ds); const n = new Date(); const df = n - d;
    const m = Math.floor(df / 60000); const h = Math.floor(m / 60);
    if (m < 1) return 'Just now'; if (m < 60) return `${m}m ago`; if (h < 24) return `${h}h ago`;
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: d.getFullYear() !== n.getFullYear() ? 'numeric' : undefined });
  };

  const getStatusClasses = (status) => {
    const map = {
      in_progress: 'bg-emerald-50 text-emerald-600 border-emerald-100',
      paused: 'bg-amber-50 text-amber-600 border-amber-100',
      idle: 'bg-slate-100 text-slate-500 border-slate-200',
      away: 'bg-slate-100 text-slate-500 border-slate-200'
    };
    return map[status] || 'bg-slate-100 text-slate-400 border-slate-200';
  };

  const clearFilters = () => { setSelectedProject(''); setSelectedDate(new Date().toISOString().split('T')[0]); };

  if (loading || companyState.loading || isInitializing) return (
    <Layout>
      <div className="px-6 py-24 text-center space-y-4">
        <div className="w-10 h-10 border-4 border-slate-200 border-t-indigo-600 rounded-full animate-spin mx-auto" />
        <p className="text-sm font-medium text-slate-500">Synchronizing team activity...</p>
      </div>
    </Layout>
  );

  return (
    <Layout>
      <div className="space-y-8 pb-24">
        <PageHeader
          title="Team Activity"
          subtitle="Real-time overview of active tasks and progress across your team."
          icon="👥"
          stats={[
            { label: 'Active', value: teamMembers.filter(m => m.status === 'in_progress').length },
            { label: 'Paused', value: teamMembers.filter(m => m.status === 'paused').length },
            { label: 'Away', value: teamMembers.filter(m => m.status === 'idle').length }
          ]}
        />

        {/* Filters Bar */}
        <div className="bg-white rounded-2xl p-5 flex items-center gap-6 shadow-sm flex-wrap border border-slate-200">
          <div className="flex items-center gap-3">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Project</span>
            <select 
              value={selectedProject} 
              onChange={(e) => setSelectedProject(e.target.value)} 
              className="px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-700 outline-none focus:bg-white focus:border-indigo-400 transition-all min-w-[200px]"
            >
              <option value="">All Projects</option>
              {projects.map(p => <option key={p._id} value={p._id}>{p.title}</option>)}
            </select>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Date</span>
            <input 
              type="date" 
              value={selectedDate} 
              onChange={(e) => setSelectedDate(e.target.value)} 
              className="px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-700 outline-none focus:bg-white focus:border-indigo-400 transition-all" 
            />
          </div>
          {(selectedProject || selectedDate) && (
            <button 
              onClick={clearFilters} 
              className="ml-auto px-5 py-2 bg-slate-100 text-slate-600 rounded-xl text-xs font-semibold hover:bg-rose-50 hover:text-rose-600 transition-all active:scale-95 border border-slate-200"
            >
              Clear Filters
            </button>
          )}
        </div>

        <div className="space-y-4">
          {error ? (
            <div className="max-w-xl mx-auto my-24 p-8 bg-white rounded-2xl border border-slate-200 text-center shadow-sm">
              <h3 className="text-xl font-semibold text-slate-900 mb-2">Unable to load activity</h3>
              <p className="text-slate-600 text-sm mb-6">{error}</p>
            </div>
          ) : teamMembers.length === 0 ? (
            <div className="bg-white rounded-2xl p-12 text-center border border-slate-200 shadow-sm">
              <h3 className="text-xl font-semibold text-slate-900 mb-2">No activity logged</h3>
              <p className="text-slate-600 text-sm">No activity records found for the selected criteria.</p>
              {(selectedProject || selectedDate) && (
                <button onClick={clearFilters} className="mt-6 px-6 py-2.5 bg-indigo-600 text-white rounded-lg font-medium text-sm hover:bg-indigo-700 transition-colors">
                  Reset Filters
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6">
              {teamMembers.map((m) => {
                const isWorking = m.status === 'in_progress';
                const task = m.currentTask || m.lastTask;
                const activityTime = m.currentTask ? m.currentTask.startedAt : (m.lastTask ? m.lastTask.completedAt : null);

                return (
                  <div
                    key={m.user._id}
                    className={`group rounded-xl p-5 border transition-all duration-200 flex flex-col md:flex-row md:items-center justify-between gap-5 ${isWorking ? 'bg-indigo-50/50 border-indigo-400 shadow-md ring-2 ring-indigo-500/10 scale-[1.01]' : 'bg-white border-slate-200 hover:border-indigo-200 shadow-sm hover:shadow'}`}
                  >
                    <div className="flex-1 min-w-0 space-y-3">
                      {/* Top Row: User Avatar, Name, Status Badge */}
                      <div className="flex items-center gap-3">
                        {isWorking && (
                          <div className="relative flex h-3 w-3 shrink-0">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-3 w-3 bg-indigo-600"></span>
                          </div>
                        )}
                        <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center text-xs font-bold shadow-sm border border-slate-200">
                          {m.user.name.charAt(0)}
                        </div>
                        <h3 className="text-base font-semibold text-slate-900 truncate">
                          {m.user.name}
                        </h3>
                        <span className={`shrink-0 px-2.5 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider border ${getStatusClasses(m.status)}`}>
                          {m.status === 'in_progress' ? 'Working' : m.status.replace('_', ' ')}
                        </span>
                        {task && (
                          <span className="shrink-0 px-2.5 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-600 border border-slate-200">
                            {task.project?.title || 'Global'}
                          </span>
                        )}
                      </div>

                      {/* Middle Row: Current/Last Task */}
                      <div className="flex items-center gap-2">
                        {task ? (
                          <div 
                            onClick={() => navigate(`/my-tasks/${task._id}`)}
                            className="text-sm font-medium text-slate-700 truncate hover:text-indigo-600 transition-colors cursor-pointer"
                          >
                            {task.title}
                          </div>
                        ) : (
                          <span className="text-sm text-slate-400 italic font-medium">No recorded activity</span>
                        )}
                      </div>

                      {/* Bottom Row: Metadata (Time and Email) */}
                      <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-slate-500 font-medium">
                        <div className="flex items-center gap-1.5">
                          <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <span>{m.currentTask ? `Started: ${formatDate(activityTime)}` : `Last active: ${activityTime ? formatDate(activityTime) : 'Never'}`}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                          </svg>
                          <span>{m.user.email}</span>
                        </div>
                      </div>
                    </div>

                    <div className="shrink-0 flex items-center">
                      <button 
                        onClick={() => navigate(`/employees/${m.user._id}`)}
                        className="group relative inline-flex items-center justify-center gap-2 px-6 py-2.5 bg-white border border-slate-200 text-slate-600 rounded-xl font-semibold text-sm hover:bg-slate-50 hover:border-indigo-300 hover:text-indigo-600 transition-all duration-300 shadow-sm hover:shadow active:scale-95"
                      >
                        <span>View Details</span>
                        <svg className="w-4 h-4 transition-transform group-hover:translate-x-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                        </svg>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default TeamActivity;
