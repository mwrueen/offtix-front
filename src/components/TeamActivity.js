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
  }, [companyFilter.companyId, selectedProject, selectedDate, companyState.loading]);

  const formatDate = (ds) => {
    if (!ds) return 'N/A';
    const d = new Date(ds); const n = new Date(); const df = n - d;
    const m = Math.floor(df / 60000); const h = Math.floor(m / 60); const dy = Math.floor(h / 24);
    if (m < 1) return 'Just now'; if (m < 60) return `${m}m ago`; if (h < 24) return `${h}h ago`;
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: d.getFullYear() !== n.getFullYear() ? 'numeric' : undefined });
  };

  const getStatusBadge = (s) => {
    const cfg = {
      in_progress: { label: 'Working', color: 'emerald', bg: 'bg-emerald-50 text-emerald-600 border-emerald-100', ping: true },
      paused: { label: 'Paused', color: 'amber', bg: 'bg-amber-50 text-amber-600 border-amber-100', ping: false },
      idle: { label: 'Away', color: 'slate', bg: 'bg-slate-50 text-slate-400 border-slate-100', ping: false }
    }[s] || { label: 'Away', color: 'slate', bg: 'bg-slate-50 text-slate-400 border-slate-100', ping: false };
    return (
      <span className={`px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest inline-flex items-center gap-2 border shadow-sm ${cfg.bg} whitespace-nowrap`}>
        {cfg.ping && <span className="flex relative w-1.5 h-1.5"><span className={`absolute inline-flex w-full h-full rounded-full bg-${cfg.color}-500 opacity-75 animate-ping`}></span><span className={`relative inline-flex rounded-full h-1.5 w-1.5 bg-${cfg.color}-500`}></span></span>}
        {!cfg.ping && <span className={`w-1.5 h-1.5 rounded-full bg-${cfg.color}-400`} />}
        {cfg.label}
      </span>
    );
  };

  const clearFilters = () => { setSelectedProject(''); setSelectedDate(new Date().toISOString().split('T')[0]); };

  if (loading || companyState.loading || isInitializing) return (
    <Layout>
      <div className="max-w-[1600px] mx-auto px-10 py-40 text-center animate-in fade-in space-y-8">
        <div className="w-12 h-12 border-4 border-slate-100 border-t-indigo-600 rounded-full animate-spin mx-auto shadow-sm" />
        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest italic">Synchronizing team activity...</p>
      </div>
    </Layout>
  );

  return (
    <Layout>
      <div className="max-w-[1600px] mx-auto px-6 py-12 animate-in fade-in duration-700 space-y-12">
        <PageHeader
          title="Team Activity"
          subtitle="Real-time overview of current active tasks and progress across the organization."
          icon="👥"
          stats={[
            { label: 'Active', value: teamMembers.filter(m => m.status === 'in_progress').length },
            { label: 'Paused', value: teamMembers.filter(m => m.status === 'paused').length },
            { label: 'Away', value: teamMembers.filter(m => m.status === 'idle').length }
          ]}
        />

        {/* Filters Bar */}
        <div className="bg-white rounded-3xl p-6 flex items-center gap-8 shadow-sm flex-wrap border border-slate-200 animate-in slide-in-from-top-4 duration-700">
          <div className="flex items-center gap-4">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest italic flex items-center gap-2">Project: </span>
            <select value={selectedProject} onChange={(e) => setSelectedProject(e.target.value)} className="px-6 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-[10px] font-bold uppercase tracking-widest text-slate-900 outline-none focus:bg-white focus:border-indigo-400 transition-all min-w-[200px] shadow-inner">
              <option value="">All Projects</option>
              {projects.map(p => <option key={p._id} value={p._id}>{p.title}</option>)}
            </select>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest italic flex items-center gap-2">Date: </span>
            <input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} className="px-6 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-[10px] font-bold uppercase tracking-widest text-slate-900 outline-none focus:bg-white focus:border-indigo-400 transition-all shadow-inner" />
          </div>
          {(selectedProject || selectedDate) && <button onClick={clearFilters} className="ml-auto px-6 py-2.5 bg-slate-100 text-slate-500 rounded-xl text-[9px] font-bold uppercase tracking-widest hover:bg-rose-50 hover:text-rose-600 transition-all active:scale-95 shadow-sm">Clear Filters</button>}
        </div>

        {error ? (
          <div className="bg-rose-50 border border-rose-100 p-12 rounded-2xl text-center text-rose-600 animate-pulse">
            <p className="text-lg font-bold italic uppercase tracking-widest">{error}</p>
          </div>
        ) : teamMembers.length === 0 ? (
          <div className="text-center px-10 py-32 bg-white rounded-3xl border border-dashed border-slate-200 opacity-60">
            <div className="text-7xl mb-8">🔍</div>
            <h3 className="text-2xl font-bold text-slate-400 uppercase tracking-widest">No Activity Logged</h3>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-6 italic max-w-xl mx-auto leading-relaxed">
              No activity records found for the selected criteria.
            </p>
            {(selectedProject || selectedDate) && <button onClick={clearFilters} className="mt-8 px-8 py-3 bg-indigo-600 text-white rounded-xl font-bold text-[10px] uppercase tracking-widest shadow-lg hover:bg-slate-950 transition-all">Reset Filters</button>}
          </div>
        ) : (
          <div className="bg-white rounded-3xl overflow-hidden shadow-xl border border-slate-200 relative group font-sans">
            <div className="grid grid-cols-[80px_2.5fr_1.5fr_2fr_1.5fr_120px] gap-6 px-10 py-5 bg-slate-900 text-white sticky top-0 z-20">
              {['User', 'Name / Email', 'Status', 'Current Task', 'Project', 'Actions'].map(h => <div key={h} className="text-[10px] font-bold uppercase tracking-widest opacity-40">{h}</div>)}
            </div>
            <div className="divide-y divide-slate-100 relative z-10">
              {teamMembers.map((m, i) => (
                <div key={m.user._id} className="grid grid-cols-[80px_2.5fr_1.5fr_2fr_1.5fr_120px] gap-6 items-center px-10 py-8 hover:bg-slate-50 transition-all duration-500 group">
                  <div>
                    <div className="w-12 h-12 rounded-xl bg-slate-100 text-slate-900 flex items-center justify-center text-xl font-bold shadow-inner group-hover:scale-110 transition-transform"> {m.user.name.charAt(0)} </div>
                  </div>
                  <div className="min-w-0 pr-6">
                    <div className="text-lg font-bold text-slate-950 truncate group-hover:text-indigo-600 transition-colors tracking-tight leading-tight"> {m.user.name} </div>
                    <div className="text-[10px] text-slate-400 truncate font-bold mt-1 opacity-70"> {m.user.email} </div>
                  </div>
                  <div> {getStatusBadge(m.status)} </div>
                  <div className="min-w-0 pr-6">
                    {(m.currentTask || m.lastTask) ? (
                      <div className="space-y-1">
                        <div className="text-sm font-bold text-slate-800 tracking-tight leading-tight group-hover:text-indigo-600 transition-colors cursor-pointer hover:underline underline-offset-4" onClick={() => navigate(`/my-tasks/${(m.currentTask || m.lastTask)._id}`)}> {(m.currentTask || m.lastTask).title} </div>
                        <div className="flex items-center gap-2">
                          <span className={`w-1.5 h-1.5 rounded-full ${m.currentTask ? 'bg-indigo-600' : 'bg-slate-300'}`} />
                          <span className="text-[9px] text-slate-400 font-bold uppercase tracking-widest"> {m.currentTask ? 'Active Now' : 'Completed'} </span>
                        </div>
                      </div>
                    ) : <span className="text-[10px] text-slate-200 font-bold uppercase tracking-widest italic">No record</span>}
                  </div>
                  <div className="min-w-0">
                    {(m.currentTask || m.lastTask) ? (
                      <div className="space-y-1">
                        <div className="text-xs text-slate-600 truncate flex items-center gap-2 font-bold uppercase tracking-tight"> {(m.currentTask || m.lastTask).project?.title || 'General'} </div>
                        <div className="text-[9px] font-bold uppercase tracking-wider text-slate-400">
                          {m.currentTask ? `Started: ${formatDate(m.currentTask.startedAt)}` : `Finished: ${formatDate(m.lastTask.completedAt)}`}
                        </div>
                      </div>
                    ) : null}
                  </div>
                  <div className="text-right">
                    <button onClick={() => navigate(`/employees/${m.user._id}`)} className="bg-white border border-slate-200 text-slate-500 text-[9px] font-bold uppercase tracking-widest px-4 py-2 rounded-lg transition-all hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-100 shadow-sm active:scale-95">Details</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default TeamActivity;
