import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { myTasksAPI } from '../services/api';
import { useToast } from '../context/ToastContext';
import Layout from './Layout';
import PageHeader from './PageHeader';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';

const MyTasksList = () => {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionLoading, setActionLoading] = useState({});
  const [actionModal, setActionModal] = useState(null); // 'complete' or 'sendBack'
  const [activeTask, setActiveTask] = useState(null);
  const [formData, setFormData] = useState({ note: '', message: '', link: '' });
  const [selectedFiles, setSelectedFiles] = useState([]);
  const navigate = useNavigate();
  const toast = useToast();

  useEffect(() => { fetchTasks(); }, []);

  const fetchTasks = async () => {
    try {
      setLoading(true);
      const response = await myTasksAPI.getAll();
      setTasks(response.data);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to fetch tasks');
      toast?.showToast?.('MISSION_DIRECTIVE_SYNC_FAILED', 'error');
    } finally { setLoading(false); }
  };

  const handleStart = async (taskId, workflowType) => {
    setActionLoading(prev => ({ ...prev, [taskId]: 'starting' }));
    try {
      if (workflowType === 'sequential') await myTasksAPI.startSequential(taskId);
      else await myTasksAPI.start(taskId);
      toast?.showToast?.('DIRECTIVE_PROCESS_INITIALIZED', 'success');
      fetchTasks();
    } catch (err) { toast?.showToast?.(err.response?.data?.error || 'FAILED_TO_START_SIG', 'error'); }
    finally { setActionLoading(prev => ({ ...prev, [taskId]: null })); }
  };

  const handlePause = async (taskId) => {
    setActionLoading(prev => ({ ...prev, [taskId]: 'pausing' }));
    try {
      await myTasksAPI.pauseSequential(taskId);
      toast?.showToast?.('SIGNAL_SUSPENDED_ON_STANDBY', 'info');
      fetchTasks();
    } catch (err) { toast?.showToast?.(err.response?.data?.error || 'FAILED_TO_PAUSE_SIG', 'error'); }
    finally { setActionLoading(prev => ({ ...prev, [taskId]: null })); }
  };

  const handleCompleteClick = (e, task) => {
    e.stopPropagation();
    if (task.workflowType === 'sequential') { setActiveTask(task); setActionModal('complete'); }
    else navigate(`/my-tasks/${task._id}`);
  };

  const handleSendBackClick = (e, task) => {
    e.stopPropagation();
    if (task.workflowType === 'sequential') { setActiveTask(task); setActionModal('sendBack'); }
    else navigate(`/my-tasks/${task._id}`);
  };

  const handleModalSubmit = async () => {
    if (!activeTask) return;
    const taskId = activeTask._id;
    setActionLoading(prev => ({ ...prev, [taskId]: actionModal === 'complete' ? 'completing' : 'sendingBack' }));
    try {
      if (actionModal === 'complete') {
        await myTasksAPI.completeSequential(taskId, formData.note, formData.message, formData.link, selectedFiles);
        toast?.showToast?.('MISSION_DIRECTIVE_SYNC_SUCCESSFUL', 'success');
      } else {
        await myTasksAPI.sendBackSequential(taskId, formData.note, formData.message, formData.link, selectedFiles);
        toast?.showToast?.('DIRECTIVE_REPELLED_TO_PREVIOUS_NODE', 'info');
      }
      setActionModal(null); setActiveTask(null); setFormData({ note: '', message: '', link: '' }); setSelectedFiles([]); fetchTasks();
    } catch (err) { toast?.showToast?.(err.response?.data?.error || 'ACTION_PROTOCOL_FAILURE', 'error'); }
    finally { setActionLoading(prev => ({ ...prev, [taskId]: null })); }
  };

  const handleFileChange = (e) => { if (e.target.files) setSelectedFiles(Array.from(e.target.files)); };

  const getStatusClasses = (status) => {
    const map = {
      pending: 'bg-slate-100 text-slate-500 border-slate-200',
      active: 'bg-indigo-50 text-indigo-600 border-indigo-100',
      in_progress: 'bg-emerald-50 text-emerald-600 border-emerald-100',
      paused: 'bg-amber-50 text-amber-600 border-amber-100',
      completed: 'bg-indigo-600 text-white border-white shadow-24',
      needs_changes: 'bg-rose-50 text-rose-600 border-rose-100'
    };
    return map[status] || 'bg-slate-100 text-slate-400 border-slate-200';
  };

  const getTaskStatus = (task) => {
    if (task.workflowType === 'sequential') return task.userAssignee?.status || 'pending';
    if (task.workflowType === 'role') return task.userStep?.status || 'pending';
    return task.userStep?.status || 'assigned';
  };

  const renderActionButtons = (task) => {
    const isCurrent = task.workflowType === 'sequential' ? (task.userAssignee && task.userAssignee.isCurrent) : (task.userStep && task.userStep.isCurrent);
    if (!isCurrent) return null;
    const taskStatus = getTaskStatus(task);
    const isLoading = actionLoading[task._id];
    const canStartTask = task.canStart !== false;

    if (taskStatus === 'pending' || taskStatus === 'active') {
      return (
        <div className="flex flex-col items-end gap-4 shrink-0">
          <button
            onClick={(e) => { e.stopPropagation(); handleStart(task._id, task.workflowType); }}
            disabled={isLoading || !canStartTask}
            className={`px-12 py-5 rounded-[2.5rem] font-black text-[11px] uppercase tracking-[0.4em] transition-all active:scale-95 shadow-24 italic border-8 border-white relative overflow-hidden group/btn ${canStartTask ? 'bg-slate-950 text-white hover:bg-indigo-600 hover:scale-110' : 'bg-slate-50 text-slate-300 cursor-not-allowed shadow-none border-slate-100 font-bold opacity-40'}`}
          >
            <span className="relative z-10 flex items-center gap-4"> {isLoading === 'starting' ? 'SYNCING...' : '▶ INITIALIZE_SIGNAL'} </span>
            <div className="absolute top-0 left-0 w-full h-full bg-white/10 -translate-x-full group-hover/btn:animate-[shimmer_3s_infinite]" />
          </button>
          {!canStartTask && <span className="text-[10px] font-black text-rose-500 uppercase italic tracking-[0.2em] text-right max-w-[280px] opacity-60 underline underline-offset-8 decoration-rose-100">AWAITING_PREREQUISITE_CLEARANCE_SIG</span>}
        </div>
      );
    }

    if (taskStatus === 'in_progress') {
      return (
        <div className="flex flex-wrap justify-end gap-6 shrink-0">
          {task.workflowType === 'sequential' && (
            <button onClick={(e) => { e.stopPropagation(); handlePause(task._id); }} disabled={isLoading} className="px-10 py-5 bg-amber-500 text-white border-4 border-white rounded-[2.5rem] font-black text-[11px] uppercase tracking-[0.4em] shadow-24 hover:bg-amber-600 hover:scale-110 transition-all active:scale-95 italic group relative overflow-hidden">
              <span className="relative z-10">⏸ PAUSE</span>
            </button>
          )}
          <button onClick={(e) => handleCompleteClick(e, task)} disabled={isLoading} className="px-12 py-5 bg-indigo-600 text-white border-8 border-white rounded-[2.5rem] font-black text-[11px] uppercase tracking-[0.5em] shadow-24 hover:bg-slate-950 hover:scale-110 transition-all active:scale-95 italic group relative overflow-hidden">
            <span className="relative z-10 flex items-center gap-4"> ✓ COMPLETE <span className="text-2xl">→</span> </span>
            <div className="absolute top-0 left-0 w-full h-full bg-white/10 -translate-x-full group-hover:animate-[shimmer_3s_infinite]" />
          </button>
          {task.workflowType === 'sequential' && (
            <button onClick={(e) => handleSendBackClick(e, task)} disabled={isLoading} className="px-8 py-5 bg-white text-rose-600 border-4 border-rose-100 rounded-[2rem] font-black text-[11px] uppercase tracking-[0.4em] hover:bg-rose-50 hover:border-rose-300 transition-all active:scale-95 italic">↩ REPEL_SIG</button>
          )}
        </div>
      );
    }

    if (taskStatus === 'paused') {
      return (
        <button onClick={(e) => { e.stopPropagation(); handleStart(task._id, task.workflowType); }} disabled={isLoading || !canStartTask} className="px-12 py-5 bg-emerald-600 text-white border-8 border-white rounded-[2.5rem] font-black text-[11px] uppercase tracking-[0.5em] shadow-24 hover:bg-slate-950 hover:scale-110 transition-all active:scale-95 italic group relative overflow-hidden shrink-0">
          <span className="relative z-10 flex items-center gap-4"> ▶ RESUME_SIGNAL </span>
          <div className="absolute top-0 left-0 w-full h-full bg-white/10 -translate-x-full group-hover:animate-[shimmer_3s_infinite]" />
        </button>
      );
    }
    return null;
  };

  if (loading) return (
    <Layout>
      <div className="max-w-[1700px] mx-auto px-10 py-60 text-center animate-pulse space-y-16 italic">
        <div className="w-40 h-40 border-[16px] border-slate-50 border-t-indigo-600 rounded-[4rem] animate-spin mx-auto shadow-24" />
        <p className="text-[12px] font-black uppercase tracking-[0.8em] text-slate-400 italic underline underline-offset-[16px] decoration-indigo-200">SYNCHRONIZING_PERSONAL_DIRECTIVE_STREAMS_...</p>
      </div>
    </Layout>
  );

  if (error) return (
    <Layout>
      <div className="max-w-5xl mx-auto my-40 p-32 bg-white rounded-[7rem] border-8 border-rose-100 text-center shadow-24 relative overflow-hidden group animate-in zoom-in-95 duration-1200 italic">
        <div className="absolute top-0 right-0 p-32 text-[260px] font-black italic opacity-[0.03] grayscale pointer-events-none select-none text-rose-950 leading-none">ABORT</div>
        <div className="relative z-10 space-y-12">
          <div className="text-[180px] grayscale opacity-10 group-hover:scale-125 group-hover:rotate-12 group-hover:grayscale-0 transition-all duration-3000 inline-block drop-shadow-2xl">⚠️</div>
          <div>
            <h3 className="text-6xl font-black text-rose-950 uppercase italic tracking-tighter drop-shadow-sm group-hover:text-rose-600 transition-all leading-none">SIGNAL_ACCESS_PROTOCOL_DENIED</h3>
            <p className="text-xl font-black text-slate-400 uppercase tracking-[0.4em] italic mt-12 leading-relaxed opacity-60 underline underline-offset-[24px] decoration-rose-50 max-w-4xl mx-auto text-center">{error.toUpperCase()}</p>
          </div>
          <button onClick={fetchTasks} className="mt-12 px-24 py-8 bg-slate-950 text-white rounded-[3rem] font-black text-[14px] uppercase tracking-[0.8em] transition-all hover:bg-rose-950 hover:scale-110 active:scale-95 shadow-24 italic border-8 border-white group relative overflow-hidden">
            <span className="relative z-10">RE-INITIATE_CORE_SYNC_PROTOCOL</span>
            <div className="absolute top-0 left-0 w-full h-full bg-white/10 -translate-x-full group-hover:animate-[shimmer_3s_infinite]" />
          </button>
        </div>
        <div className="absolute -bottom-64 -left-64 w-[1000px] h-[1000px] bg-rose-500/[0.03] rounded-full blur-[200px] pointer-events-none group-hover:scale-125 transition-transform duration-[4s]" />
      </div>
    </Layout>
  );

  return (
    <Layout>
      <div className="max-w-[1700px] mx-auto px-6 py-20 space-y-24 animate-in fade-in duration-1500 italic pb-60">
        <PageHeader
          title="PERSONAL_DIRECTIVE_STREAM"
          subtitle={`${tasks.length} ACTIVE_MISSIONS_PENDING_ACTION_WITHIN_THE_SYSTEM_GRID`}
          icon={<div className="w-24 h-24 bg-slate-950 text-white rounded-[3.5rem] flex items-center justify-center text-5xl shadow-24 border-8 border-white shadow-indigo-950/20 group-hover:rotate-12 transition-transform duration-1000 italic shrink-0">🛰️</div>}
          stats={[
            { label: 'AWAITING_PROTOCOL', value: tasks.filter(t => ['pending', 'active'].includes(getTaskStatus(t))).length, color: 'indigo' },
            { label: 'IN_EXECUTION_SYSTS', value: tasks.filter(t => getTaskStatus(t) === 'in_progress').length, color: 'emerald' }
          ]}
        />

        <div className="space-y-12">
          {tasks.length === 0 ? (
            <div className="bg-white rounded-[7rem] p-60 text-center border-[12px] border-dashed border-slate-50 relative overflow-hidden group/empty shadow-24 animate-in zoom-in-95 duration-1500">
              <div className="absolute top-0 right-0 p-32 text-[280px] font-black italic opacity-[0.03] grayscale pointer-events-none select-none text-slate-950 leading-none">CLEAR</div>
              <div className="relative z-10 space-y-16">
                <div className="text-[200px] grayscale opacity-10 group-hover/empty:scale-125 group-hover/empty:rotate-[15deg] group-hover/empty:grayscale-0 transition-all duration-[2.5s] inline-block drop-shadow-2xl select-none">🎯</div>
                <div>
                  <h3 className="text-7xl font-black text-slate-950 uppercase italic tracking-tighter drop-shadow-sm group-hover/empty:text-indigo-600 transition-colors leading-none">ALL_DIRECTIVES_VERIFIED</h3>
                  <p className="text-xl font-black text-slate-400 uppercase tracking-[0.6em] italic opacity-60 max-w-5xl mx-auto leading-relaxed mt-12 underline underline-offset-[24px] decoration-slate-100 text-center">System queue cleared. Personnel readiness status: OPTIMAL. Awaiting next tactical signal from primary command nodes for synchronization sequence.</p>
                </div>
              </div>
              <div className="absolute -bottom-64 -left-64 w-[1000px] h-[1000px] bg-indigo-500/[0.04] rounded-full blur-[200px] pointer-events-none group-hover/empty:scale-125 transition-transform duration-[3s]" />
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-12">
              {tasks.map((task, idx) => {
                const status = getTaskStatus(task);
                return (
                  <div key={task._id} onClick={() => navigate(`/my-tasks/${task._id}`)} className={`group bg-white rounded-[6rem] p-16 border-8 border-slate-50 shadow-sm hover:shadow-24 hover:-translate-y-8 lg:hover:-translate-y-16 transition-all duration-1000 cursor-pointer overflow-hidden relative animate-in slide-in-from-bottom-24 group/card`} style={{ animationDelay: `${idx * 100}ms` }}>
                    <div className="absolute top-0 left-0 w-4 h-full bg-slate-100 group-hover:bg-indigo-600 transition-all duration-[1.2s] ${status === 'in_progress' ? 'bg-indigo-600 w-6' : ''}" />
                    <div className="absolute top-0 right-0 p-20 text-[260px] font-black italic opacity-[0.015] grayscale pointer-events-none select-none text-slate-950 leading-none group-hover:scale-125 transition-transform duration-[3s]">SIG</div>

                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-16 relative z-10">
                      <div className="flex-1 min-w-0 space-y-10">
                        <div className="flex flex-wrap items-center gap-6">
                          {task.priority && (
                            <span className={`px-8 py-2.5 rounded-[2rem] text-[10px] font-black uppercase tracking-[0.4em] italic shadow-24 border-4 border-white group/prio hover:scale-110 transition-all ${task.priority === 'urgent' ? 'bg-rose-600 text-white' : task.priority === 'high' ? 'bg-amber-400 text-white' : 'bg-slate-950 text-white shadow-indigo-950/20'}`}>
                              <span className="opacity-40 mr-2">#</span>{task.priority.toUpperCase()}_PRIORITY_LEVEL
                            </span>
                          )}
                          <span className="text-[10px] font-black text-indigo-600 uppercase tracking-[0.5em] bg-white px-8 py-2.5 rounded-[2rem] border-4 border-slate-50 shadow-inner italic hover:bg-slate-50 transition-all truncate max-w-md"> {task.project?.title?.toUpperCase() || 'GLOBAL_CORE_SECTOR'} </span>
                        </div>

                        <div className="space-y-4">
                          <h3 className="text-4xl lg:text-5xl font-black text-slate-950 uppercase italic tracking-tighter truncate group-hover:text-indigo-600 transition-all leading-none drop-shadow-sm">{task.title}</h3>
                          <p className="text-[12px] font-black text-slate-400 uppercase tracking-[0.6em] italic opacity-40 underline underline-offset-8 decoration-slate-50"> NODE_ID: {task._id.slice(-16).toUpperCase()} </p>
                        </div>

                        <div className="flex flex-wrap items-center gap-12 pt-4">
                          <div className="flex items-center gap-6 group/status-tag">
                            <div className={`w-4 h-4 rounded-full shadow-[0_0_15px_currentColor] group-hover/status-tag:animate-ping ${status === 'in_progress' ? 'bg-indigo-600' : 'bg-slate-300'}`} />
                            <span className={`px-10 py-3 rounded-[2.5rem] text-[11px] font-black uppercase tracking-[0.6em] border-8 shadow-24 transition-all hover:scale-110 italic ${getStatusClasses(status)}`}> {status.toUpperCase().replace('_', ' ')} </span>
                          </div>

                          {task.status && (
                            <div className="flex items-center gap-8 border-l-8 border-slate-50 pl-12 italic group/sub-status">
                              <div className="w-4 h-4 rounded-[1rem] shadow-[0_0_10px_currentColor] animate-pulse" style={{ backgroundColor: task.status.color || '#64748b' }} />
                              <div className="flex flex-col">
                                <span className="text-[9px] font-black text-slate-300 uppercase tracking-[0.6em] leading-none mb-2 underline underline-offset-4 decoration-slate-100">SUB_SIGNAL_STATUS_SIG</span>
                                <span className="text-[11px] font-black uppercase tracking-widest leading-none drop-shadow-sm" style={{ color: task.status.color || '#64748b' }}>{task.status.name?.toUpperCase()}</span>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="shrink-0 group-hover:scale-105 transition-transform duration-1000" onClick={e => e.stopPropagation()}> {renderActionButtons(task)} </div>
                    </div>

                    <div className="absolute -bottom-64 -right-64 w-[600px] h-[600px] bg-indigo-500/[0.04] rounded-full blur-[180px] group-hover:opacity-100 opacity-0 transition-opacity duration-2000 pointer-events-none group-hover:scale-125" />
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Neural Interaction Modal Zeta */}
        {actionModal && (
          <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-3xl flex items-center justify-center z-[2000] p-12 lg:p-24 animate-in fade-in duration-700">
            <div className="bg-white rounded-[7rem] w-full max-w-6xl max-h-[95vh] flex flex-col shadow-24 overflow-hidden animate-in zoom-in-95 duration-700 border-8 border-white/20 relative italic">
              <div className="absolute top-0 right-0 p-32 text-[320px] font-black italic opacity-[0.015] grayscale pointer-events-none select-none text-slate-950 leading-none">MODAL</div>

              <div className="px-20 py-16 border-b-8 border-white/5 bg-slate-950 text-white flex items-center justify-between relative overflow-hidden shrink-0">
                <div className="relative z-10 space-y-4">
                  <h2 className="text-5xl lg:text-6xl font-black uppercase italic tracking-tighter leading-none drop-shadow-2xl">{actionModal === 'complete' ? 'MISSION_SIGNAL_FINALIZE' : 'DIRECTIVE_REPEL_PROTOCOL'}</h2>
                  <p className="text-[12px] font-black text-indigo-400 uppercase tracking-[0.8em] italic underline underline-offset-8 decoration-white/5"> NODE_SIG_UPLINK: {activeTask?._id?.toUpperCase()} </p>
                </div>
                <button onClick={() => { setActionModal(null); setActiveTask(null); }} className="w-24 h-24 rounded-[3.5rem] bg-white/5 border-8 border-white/10 text-white flex items-center justify-center text-5xl hover:bg-rose-600 hover:text-white hover:border-white transition-all active:scale-90 group/close relative z-10 font-black">✕</button>
                <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-indigo-600/10 rounded-full blur-[200px] -translate-y-1/2 translate-x-1/2 animate-pulse pointer-events-none"></div>
              </div>

              <div className="p-16 lg:p-24 overflow-y-auto space-y-16 scrollbar-none flex-1 bg-white relative z-10">
                <div className="space-y-8">
                  <label className="text-[13px] font-black text-slate-400 uppercase tracking-[0.6em] flex items-center gap-6 italic ml-10 underline underline-offset-[16px] decoration-slate-100 mb-8"> <span className="w-4 h-12 bg-indigo-600 rounded-full shadow-[0_0_20px_rgba(79,70,229,0.5)] animate-bounce" /> PRIMARY_MISSION_SUCCESS_LOG </label>
                  <div className="rounded-[4rem] border-8 border-slate-50 overflow-hidden shadow-24 focus-within:border-indigo-100 transition-all bg-white p-6 relative group/editor">
                    <ReactQuill value={formData.note} onChange={(v) => setFormData({ ...formData, note: v })} className="min-h-[300px] mb-16 border-none text-xl font-bold italic" theme="snow" placeholder="RECOVER_MISSION_DATA_AND_DOCUMENT_PROTOCOL_SUCCESS_LOGS_..." />
                    <div className="absolute top-0 right-0 p-12 text-8xl font-black italic opacity-[0.03] select-none pointer-events-none group-hover/editor:opacity-10 transition-opacity">TEXT_DATA</div>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-20">
                  <div className="space-y-8">
                    <label className="text-[12px] font-black text-slate-400 uppercase tracking-[0.5em] italic ml-12"> ENCRYPTED_MISSION_COMMS </label>
                    <textarea value={formData.message} onChange={e => setFormData({ ...formData, message: e.target.value })} className="w-full px-12 py-10 bg-slate-50 border-8 border-slate-50 rounded-[4rem] text-xl font-black italic tracking-tighter outline-none focus:bg-white focus:border-indigo-600 focus:shadow-24 transition-all min-h-[250px] lg:min-h-[350px] resize-none placeholder:text-slate-200 shadow-inner scrollbar-none" placeholder="INITIALIZE_TRANSMISSION_PAYLOAD_DIRECTIVES_..." />
                  </div>
                  <div className="space-y-12">
                    <div className="space-y-8">
                      <label className="text-[12px] font-black text-slate-400 uppercase tracking-[0.5em] italic ml-12"> EXTERNAL_INTEGRATION_RESOURCE_LINK </label>
                      <input type="text" value={formData.link} onChange={e => setFormData({ ...formData, link: e.target.value })} className="w-full px-12 py-8 bg-slate-50 border-8 border-slate-50 rounded-[2.5rem] text-sm font-black italic tracking-widest outline-none focus:bg-white focus:border-indigo-600 transition-all shadow-inner placeholder:text-slate-200" placeholder="HTTPS://UPLINK.DYNAMICS_CORE.NET" />
                    </div>
                    <div className="space-y-8">
                      <label className="text-[12px] font-black text-slate-400 uppercase tracking-[0.5em] italic ml-12"> TARGET_ASSET_EVIDENCE_STREAM </label>
                      <div className="border-8 border-dashed border-slate-100 rounded-[4rem] p-16 bg-slate-50 group/upload hover:bg-white hover:border-indigo-600 transition-all cursor-pointer relative overflow-hidden flex flex-col items-center justify-center gap-8 shadow-inner min-h-[200px]">
                        <div className="text-8xl grayscale group-hover/upload:grayscale-0 group-hover/upload:scale-125 group-hover/upload:rotate-12 transition-all duration-1000 select-none drop-shadow-2xl">📎</div>
                        <input type="file" multiple onChange={handleFileChange} className="absolute inset-0 opacity-0 cursor-pointer z-20" />
                        <div className="text-center relative z-10 px-6">
                          <p className="text-[14px] font-black text-slate-900 uppercase tracking-[0.4em] mb-2">{selectedFiles.length > 0 ? `${selectedFiles.length} MISSION_FILES_STAGED` : 'STAGING_AREA_FOR_ASSET_FILES'}</p>
                          <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest italic opacity-60"> AUTHORIZED_TRANSFER_NODE_ACTIVE </p>
                        </div>
                        <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/[0.03] rounded-bl-full group-hover/upload:scale-[3] transition-transform duration-2000 -z-0" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="px-20 py-16 border-t-8 border-slate-50 flex flex-col sm:flex-row justify-end gap-12 bg-slate-50/50 relative z-20 shrink-0">
                <button onClick={() => { setActionModal(null); setActiveTask(null); }} className="px-12 py-6 font-black text-[13px] uppercase tracking-[0.6em] text-slate-400 hover:text-rose-600 transition-all italic underline underline-offset-[16px] decoration-slate-100 hover:decoration-rose-100">X_ABORT_MODAL_COMMAND</button>
                <button
                  onClick={handleModalSubmit}
                  disabled={activeTask && actionLoading[activeTask._id]}
                  className={`px-24 py-8 rounded-[3.5rem] font-black text-[14px] uppercase tracking-[0.8em] text-white transition-all hover:scale-110 active:scale-95 shadow-24 italic border-8 border-white group/submit relative overflow-hidden min-w-[400px] ${actionModal === 'complete' ? 'bg-indigo-600 shadow-indigo-500/30' : 'bg-rose-600 shadow-rose-500/30'} ${(activeTask && actionLoading[activeTask._id]) ? 'grayscale opacity-50 cursor-wait' : ''}`}
                >
                  <span className="relative z-10 flex items-center justify-center gap-10">
                    {(activeTask && actionLoading[activeTask._id]) ? (
                      <>
                        <div className="w-8 h-8 border-8 border-white/20 border-t-white rounded-full animate-spin" />
                        SYNCHRONIZING_CORE...
                      </>
                    ) : (
                      <>
                        <span className="text-4xl group-hover/submit:rotate-12 transition-transform duration-700">{actionModal === 'complete' ? '🎖️' : '↪'}</span>
                        {actionModal === 'complete' ? 'AUTHORIZE_FINAL_MISSION_SYNC' : 'CONFIRM_REPEL_SEQ_PROTOCOL'}
                        <span className="text-3xl group-hover/submit:translate-x-6 transition-transform duration-700">→</span>
                      </>
                    )}
                  </span>
                  <div className="absolute top-0 left-0 w-full h-full bg-white/20 -translate-x-full group-hover:animate-[shimmer_3s_infinite]" />
                </button>
              </div>
              <div className="absolute -bottom-64 -right-64 w-[800px] h-[800px] bg-indigo-500/5 rounded-full blur-[180px] pointer-events-none" />
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default MyTasksList;
