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
      } catch (e) { if (e.name !== 'CanceledError') console.error('Project_Sync_Error', e); }
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
          setError(e.response?.data?.error || 'Failed to fetch team vitality');
          toast?.showToast?.('VITALITY_LINK_SEVERED', 'error');
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
    if (m < 1) return 'JUST NOW'; if (m < 60) return `${m}M AGO`; if (h < 24) return `${h}H AGO`;
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: d.getFullYear() !== n.getFullYear() ? 'numeric' : undefined }).toUpperCase();
  };

  const getStatusBadge = (s) => {
    const cfg = {
      in_progress: { label: 'ACTIVE_NODE', color: 'emerald-400', bg: 'bg-emerald-500/10', ping: true },
      paused: { label: 'STANDBY_MODE', color: 'amber-400', bg: 'bg-amber-500/10', ping: false },
      idle: { label: 'OFFLINE_LINK', color: 'slate-400', bg: 'bg-slate-500/10', ping: false }
    }[s] || { label: 'OFFLINE_LINK', color: 'slate-400', bg: 'bg-slate-500/10', ping: false };
    return (
      <span className={`px-4 py-2 rounded-xl text-[8px] font-black uppercase tracking-[0.2em] italic inline-flex items-center gap-3 border border-${cfg.color}/20 ${cfg.bg} text-${cfg.color} shadow-lg whitespace-nowrap`}>
        {cfg.ping && <span className="flex relative w-2 h-2"><span className={`absolute inline-flex w-full h-full rounded-full bg-${cfg.color} opacity-75 animate-ping`}></span><span className={`relative inline-flex rounded-full h-2 w-2 bg-${cfg.color}`}></span></span>}
        {!cfg.ping && <span className={`w-2 h-2 rounded-full bg-${cfg.color}`} />}
        {cfg.label}
      </span>
    );
  };

  const clearFilters = () => { setSelectedProject(''); setSelectedDate(new Date().toISOString().split('T')[0]); };

  if (loading || companyState.loading || isInitializing) return (
    <Layout>
      <div className="max-w-[1600px] mx-auto px-10 py-40 text-center animate-pulse space-y-12">
        <div className="w-24 h-24 border-8 border-slate-100 border-t-indigo-600 rounded-full animate-spin mx-auto shadow-24" />
        <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.6em] italic">SYNCHRONIZING_TEAM_VITALITY_CORE...</p>
      </div>
    </Layout>
  );

  return (
    <Layout>
      <div className="max-w-[1600px] mx-auto px-10 py-16 animate-in fade-in slide-in-from-bottom-20 duration-1000 space-y-16 italic">
        <PageHeader
          title="TEAM_VITALITY_SURVEILLANCE"
          subtitle="Real-time synchronization of organizational entities. Monitor progress and maintain kinetic momentum."
          icon={<div className="w-16 h-16 bg-slate-950 text-white rounded-full flex items-center justify-center text-3xl shadow-24 border-4 border-white/10 italic">🛰️</div>}
          stats={[
            { label: 'NODES_ACTIVE', value: teamMembers.filter(m => m.status === 'in_progress').length, color: 'emerald' },
            { label: 'STANDBY_CORE', value: teamMembers.filter(m => m.status === 'paused').length, color: 'amber' },
            { label: 'OFFLINE_REG', value: teamMembers.filter(m => m.status === 'idle').length, color: 'slate' }
          ]}
        />

        {/* Filters Bar */}
        <div className="bg-white rounded-[3.5rem] p-10 flex items-center gap-10 shadow-24 flex-wrap border border-slate-100 animate-in slide-in-from-top-12 duration-1000">
          <div className="flex items-center gap-6 group/filter">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic flex items-center gap-2"> <span className="w-2 h-2 rounded-full bg-indigo-600 animate-pulse" /> SECTOR_FILTER: </span>
            <select value={selectedProject} onChange={(e) => setSelectedProject(e.target.value)} className="px-10 py-4 bg-slate-50 border-2 border-slate-50 rounded-[1.8rem] text-[10px] font-black uppercase tracking-widest text-slate-900 outline-none focus:bg-white focus:border-indigo-400 focus:shadow-24 transition-all min-w-[250px] shadow-inner italic">
              <option value="">GLOBAL_SECTOR</option>
              {projects.map(p => <option key={p._id} value={p._id}>{p.title.toUpperCase()}</option>)}
            </select>
          </div>
          <div className="flex items-center gap-6 group/filter">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic flex items-center gap-2"> <span className="w-2 h-2 rounded-full bg-amber-500" /> TEMPORAL_ID: </span>
            <input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} className="px-10 py-4 bg-slate-50 border-2 border-slate-50 rounded-[1.8rem] text-[10px] font-black uppercase tracking-widest text-indigo-600 outline-none focus:bg-white focus:border-indigo-400 focus:shadow-24 transition-all shadow-inner italic" />
          </div>
          {(selectedProject || selectedDate) && <button onClick={clearFilters} className="ml-auto px-10 py-4 bg-slate-950 text-white rounded-[1.8rem] text-[9px] font-black uppercase tracking-widest hover:bg-rose-600 transition-all active:scale-95 shadow-24 italic">ABORT_FILTERS</button>}
        </div>

        {error ? (
          <div className="bg-rose-50 border-4 border-rose-100 p-16 rounded-[4rem] text-center text-rose-600 animate-pulse">
            <p className="text-xl font-black italic uppercase tracking-widest">{error}</p>
          </div>
        ) : teamMembers.length === 0 ? (
          <div className="text-center px-10 py-32 bg-white rounded-[6rem] border-4 border-dashed border-slate-100 opacity-40 grayscale group hover:opacity-100 hover:grayscale-0 transition-all duration-[2s]">
            <div className="text-9xl mb-12 group-hover:scale-125 transition-transform duration-1000">🔍</div>
            <h3 className="text-4xl font-black text-slate-200 uppercase tracking-[0.6em] group-hover:text-slate-950 transition-colors">NO_ACTIVITY_LOGGED</h3>
            <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.4em] mt-10 italic max-w-2xl mx-auto leading-relaxed">
              {selectedProject || selectedDate ? `Negative telemetry results for ${selectedProject ? projects.find(p => p._id === selectedProject)?.title.toUpperCase() : 'SPECIFIED_SECTOR'} during temporal window ${selectedDate}.` : 'No inductive activity found for current team grid.'}
            </p>
            <p className="text-slate-300 text-[9px] mt-12 font-black uppercase tracking-widest italic opacity-50">SYNC_STATUS: NEGATIVE_TELEMETRY</p>
            {(selectedProject || selectedDate) && <button onClick={clearFilters} className="mt-16 px-16 py-7 bg-indigo-600 text-white rounded-[3rem] font-black text-[11px] uppercase tracking-[0.5em] shadow-24 hover:bg-slate-950 transition-all">RESET_VITALITY_ARRAY</button>}
          </div>
        ) : (
          <div className="bg-white rounded-[5rem] overflow-hidden shadow-24 border border-slate-50 relative group">
            <div className="absolute top-0 right-0 w-[40%] h-[40%] bg-indigo-500/5 rounded-full blur-[120px] pointer-events-none" />
            <div className="grid grid-cols-[100px_2fr_1.5fr_2fr_1.5fr_120px] gap-6 px-12 py-10 bg-slate-950 text-white relative z-10">
              {['MOD', 'ENTITY_IDENT', 'STATUS_CODE', 'ACTIVE_DIRECTIVE', 'PROJECT_UPLINK', 'ACTION'].map(h => <div key={h} className="text-[10px] font-black uppercase tracking-[0.4em] opacity-40">{h}</div>)}
            </div>
            <div className="divide-y divide-slate-50 relative z-10">
              {teamMembers.map((m, i) => (
                <div key={m.user._id} className="grid grid-cols-[100px_2fr_1.5fr_2fr_1.5fr_120px] gap-6 items-center px-12 py-10 hover:bg-slate-50/80 transition-all duration-700 group cursor-default">
                  <div>
                    <div className="w-16 h-16 rounded-[1.8rem] bg-slate-950 text-white flex items-center justify-center text-2xl font-black shadow-24 group-hover:rotate-12 transition-all duration-1000 uppercase italic"> {m.user.name.charAt(0)} </div>
                  </div>
                  <div className="min-w-0 pr-8">
                    <div className="text-xl font-black text-slate-950 truncate group-hover:text-indigo-600 transition-colors uppercase tracking-tighter leading-tight italic"> {m.user.name} </div>
                    <div className="text-[10px] text-slate-400 truncate font-black mt-1 opacity-50 underline decoration-slate-200 underline-offset-4"> {m.user.email} </div>
                  </div>
                  <div> {getStatusBadge(m.status)} </div>
                  <div className="min-w-0 pr-8">
                    {(m.currentTask || m.lastTask) ? (
                      <div className="space-y-2">
                        <div className="text-sm font-black text-slate-800 uppercase italic tracking-tight leading-tight group-hover:text-indigo-600 transition-colors cursor-pointer hover:underline underline-offset-8" onClick={() => navigate(`/my-tasks/${(m.currentTask || m.lastTask)._id}`)}> {(m.currentTask || m.lastTask).title} </div>
                        <div className="flex items-center gap-3">
                          <span className={`w-2 h-2 rounded-full ${m.currentTask ? 'bg-indigo-600 shadow-[0_0_8px_rgba(99,102,241,1)]' : 'bg-slate-300'}`} />
                          <span className="text-[9px] text-slate-300 font-black uppercase tracking-widest italic"> {m.currentTask ? 'DIRECTIVE_ACTIVE' : (m.status === 'paused' ? 'INTERRUPT_MODE' : 'LOG_ARCHIVED')} </span>
                        </div>
                      </div>
                    ) : <span className="text-[10px] text-slate-200 font-black uppercase italic tracking-widest">ZERO_ACTIVITY_INDEX</span>}
                  </div>
                  <div className="min-w-0">
                    {(m.currentTask || m.lastTask) ? (
                      <div className="space-y-2">
                        <div className="text-[11px] text-slate-600 truncate flex items-center gap-3 font-black uppercase italic tracking-tight underline decoration-indigo-200 decoration-4"> <span className="text-lg grayscale group-hover:grayscale-0 transition-all">📁</span> {(m.currentTask || m.lastTask).project?.title || 'GLOBAL_CORE'} </div>
                        <div className={`text-[9px] font-black uppercase tracking-[0.3em] font-black ${m.currentTask ? 'text-indigo-400' : 'text-slate-300'}`}> {m.currentTask ? `SYN_INIT » ${formatDate(m.currentTask.startedAt)}` : m.status === 'paused' ? `HALT » ${formatDate(m.lastTask.pausedAt)}` : `TERM » ${formatDate(m.lastTask.completedAt)}`} </div>
                      </div>
                    ) : null}
                  </div>
                  <div className="text-right">
                    <button onClick={() => navigate(`/employees/${m.user._id}`)} className="bg-slate-950 text-white text-[9px] font-black uppercase tracking-[0.4em] px-6 py-4 rounded-[1.2rem] transition-all hover:bg-indigo-600 hover:scale-105 shadow-24 active:scale-95 italic">IDENTITY</button>
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
