import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { myTasksAPI } from '../services/api';
import { useToast } from '../context/ToastContext';
import Layout from './Layout';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';

const MyTaskDetails = () => {
  const { id: taskId } = useParams();
  const navigate = useNavigate();
  const toast = useToast();

  const [taskData, setTaskData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionLoading, setActionLoading] = useState(null);
  const [actionModal, setActionModal] = useState(null); // 'complete' or 'sendBack'
  const [formData, setFormData] = useState({ note: '', message: '', link: '' });
  const [selectedFiles, setSelectedFiles] = useState([]);

  useEffect(() => {
    fetchTaskDetails();
  }, [taskId]);

  const fetchTaskDetails = async () => {
    try {
      setLoading(true);
      const response = await myTasksAPI.getById(taskId);
      setTaskData(response.data);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to fetch task details');
      toast?.showToast?.('Failed to load task details', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleStart = async () => {
    setActionLoading('starting');
    try {
      if (taskData.workflowType === 'sequential') {
        await myTasksAPI.startSequential(taskId);
      } else {
        await myTasksAPI.start(taskId);
      }
      toast?.showToast?.('Task started successfully', 'success');
      fetchTaskDetails();
    } catch (err) {
      toast?.showToast?.(err.response?.data?.error || 'Failed to start task', 'error');
    } finally {
      setActionLoading(null);
    }
  };

  const handlePause = async () => {
    setActionLoading('pausing');
    try {
      await myTasksAPI.pauseSequential(taskId);
      toast?.showToast?.('Task paused', 'success');
      fetchTaskDetails();
    } catch (err) {
      toast?.showToast?.(err.response?.data?.error || 'Failed to pause task', 'error');
    } finally {
      setActionLoading(null);
    }
  };

  const handleCompleteClick = () => {
    setActionModal('complete');
  };

  const handleSendBackClick = () => {
    setActionModal('sendBack');
  };

  const handleModalSubmit = async () => {
    setActionLoading(actionModal === 'complete' ? 'completing' : 'sendingBack');
    try {
      if (actionModal === 'complete') {
        await myTasksAPI.completeSequential(taskId, formData.note, formData.message, formData.link, selectedFiles);
        toast?.showToast?.('Task completed successfully', 'success');
      } else {
        await myTasksAPI.sendBackSequential(taskId, formData.note, formData.message, formData.link, selectedFiles);
        toast?.showToast?.('Task sent back successfully', 'success');
      }
      setActionModal(null);
      setFormData({ note: '', message: '', link: '' });
      setSelectedFiles([]);
      fetchTaskDetails();
    } catch (err) {
      toast?.showToast?.(err.response?.data?.error || `Failed to process action`, 'error');
    } finally {
      setActionLoading(null);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files) {
      setSelectedFiles(Array.from(e.target.files));
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColorClasses = (status) => {
    const statusMap = {
      pending: 'bg-slate-100 text-slate-500 border-slate-200',
      active: 'bg-emerald-50 text-emerald-600 border-emerald-100',
      in_progress: 'bg-indigo-50 text-indigo-600 border-indigo-100',
      paused: 'bg-amber-50 text-amber-600 border-amber-100',
      completed: 'bg-emerald-50 text-emerald-600 border-emerald-100'
    };
    return statusMap[status] || 'bg-slate-100 text-slate-500';
  };

  const getStatusLabel = (status) => {
    const labelMap = {
      pending: 'Pending',
      active: 'Active',
      in_progress: 'In Progress',
      paused: 'Paused',
      completed: 'Completed'
    };
    return labelMap[status] || status;
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center p-24 text-center">
          <div className="text-6xl mb-6 animate-bounce">📋</div>
          <div className="text-xl font-bold text-slate-500 animate-pulse tracking-tight italic">Decrypting task metadata...</div>
        </div>
      </Layout>
    );
  }

  if (error || !taskData) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center p-24 text-center bg-white rounded-[48px] shadow-sm border border-slate-100">
          <div className="text-8xl mb-8 opacity-20 grayscale">🚫</div>
          <h3 className="text-2xl font-black text-rose-600 tracking-tight uppercase">Access Denied / Not Found</h3>
          <p className="text-slate-500 font-medium mt-2 max-w-sm mx-auto uppercase text-xs tracking-[0.2em]">{error || 'Task artifact does not exist.'}</p>
          <button
            onClick={() => navigate('/my-tasks')}
            className="mt-10 px-8 py-4 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-indigo-600 transition-all active:scale-95 shadow-xl shadow-slate-200"
          >
            Back to Inventory
          </button>
        </div>
      </Layout>
    );
  }

  const { task, workflowType, allowedActions } = taskData;

  return (
    <Layout>
      {/* Header */}
      <div className="bg-gradient-to-br from-indigo-600 to-purple-700 p-10 lg:p-14 rounded-[56px] shadow-2xl shadow-indigo-200 mb-10 relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-[500px] h-full bg-white/5 rounded-bl-[200px] -z-0 group-hover:bg-white/10 transition-colors duration-700"></div>

        <div className="flex flex-col md:flex-row items-start md:items-center gap-10 relative z-10">
          <button
            onClick={() => navigate('/my-tasks')}
            className="flex items-center gap-3 px-6 py-3 bg-white/10 backdrop-blur-md rounded-2xl text-white font-black text-[10px] uppercase tracking-[0.2em] hover:bg-white/20 transition-all border border-white/10 active:scale-95 group/back"
          >
            <svg className="group-hover/back:-translate-x-1 transition-transform" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M19 12H5M12 19l-7-7 7-7" /></svg>
            Task Queue
          </button>
          <div className="flex-1">
            <h1 className="text-4xl lg:text-5xl font-black text-white tracking-tight mb-4">
              {task.title}
            </h1>
            {task.project && (
              <p className="inline-flex items-center gap-3 px-4 py-2 bg-indigo-950/30 backdrop-blur-md rounded-full text-indigo-100 text-xs font-black uppercase tracking-widest border border-white/5 shadow-inner">
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse"></span>
                Node: {task.project.title}
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-10 animate-in fade-in slide-in-from-left duration-700">
          {/* Description */}
          {task.description && (
            <div className="bg-white p-10 rounded-[48px] shadow-sm border border-slate-100 hover:shadow-xl transition-all group">
              <h3 className="text-lg font-black text-slate-800 mb-6 flex items-center gap-3">
                <span className="w-8 h-[2px] bg-indigo-500 group-hover:w-12 transition-all"></span> Intelligence
              </h3>
              <p className="text-slate-500 font-medium leading-relaxed whitespace-pre-wrap">
                {task.description}
              </p>
            </div>
          )}

          {/* Sequential Assignees */}
          {workflowType === 'sequential' && taskData.sequentialAssignees && (
            <div className="bg-white p-10 rounded-[48px] shadow-sm border border-slate-100 hover:shadow-xl transition-all group">
              <h3 className="text-lg font-black text-slate-800 mb-10 flex items-center gap-3">
                <span className="w-8 h-[2px] bg-purple-500 group-hover:w-12 transition-all"></span> Propagation Chain
              </h3>
              <div className="space-y-6 relative ml-4 border-l-2 border-slate-50 pl-10">
                {taskData.sequentialAssignees.map((assignee, idx) => (
                  <div key={idx} className={`relative p-8 rounded-[32px] border-2 transition-all duration-500 ${assignee.isCurrent
                      ? 'bg-indigo-50 border-indigo-200 shadow-xl shadow-indigo-100 scale-[1.02]'
                      : 'bg-white border-slate-100'
                    }`}>
                    {/* Step Number Badge */}
                    <div className={`absolute -left-[58px] top-1/2 -translate-y-1/2 w-10 h-10 rounded-full border-4 border-white flex items-center justify-center font-black text-xs shadow-md transition-colors ${assignee.isCurrent ? 'bg-indigo-600 text-white' : 'bg-slate-200 text-slate-500'
                      }`}>
                      {idx + 1}
                    </div>

                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-6">
                      <div className="flex items-center gap-4 min-w-0">
                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-xl font-black shrink-0 shadow-inner ${assignee.isCurrent ? 'bg-indigo-600 text-white rotate-3' : 'bg-slate-100 text-slate-400'
                          }`}>
                          {assignee.user.name?.charAt(0).toUpperCase()}
                        </div>
                        <div className="truncate">
                          <div className={`text-lg font-black tracking-tight truncate ${assignee.isCurrent ? 'text-indigo-900' : 'text-slate-700'}`}>
                            {assignee.user.name}
                          </div>
                          {assignee.isCurrent && (
                            <span className="inline-block mt-1 px-3 py-0.5 bg-indigo-200 text-indigo-700 rounded-full text-[9px] font-black uppercase tracking-widest animate-pulse">
                              Active Node
                            </span>
                          )}
                        </div>
                      </div>
                      <span className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border shadow-inner ${getStatusColorClasses(assignee.status)}`}>
                        {getStatusLabel(assignee.status)}
                      </span>
                    </div>

                    {(assignee.startedAt || assignee.completedAt) && (
                      <div className="flex flex-wrap gap-6 pt-6 border-t border-slate-100/50">
                        {assignee.startedAt && (
                          <div className="space-y-1">
                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Initialization</p>
                            <p className="text-xs font-bold text-slate-600">{formatDate(assignee.startedAt)}</p>
                          </div>
                        )}
                        {assignee.completedAt && (
                          <div className="space-y-1">
                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Finalization</p>
                            <p className="text-xs font-bold text-slate-600">{formatDate(assignee.completedAt)}</p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Activity Timeline */}
          {taskData.activity && taskData.activity.length > 0 && (
            <div className="bg-slate-900 p-10 lg:p-14 rounded-[56px] shadow-2xl border border-slate-800 group relative overflow-hidden">
              {/* Satellite Background Glow */}
              <div className="absolute -bottom-20 -right-20 w-[400px] h-[400px] bg-indigo-500/10 rounded-full blur-[100px] pointer-events-none"></div>

              <h3 className="text-lg font-black text-white mb-12 flex items-center gap-3 relative z-10">
                <span className="w-8 h-[2px] bg-emerald-500 group-hover:w-12 transition-all"></span> Event Ledger
              </h3>
              <div className="space-y-12 relative z-10">
                {taskData.activity.map((item, idx) => (
                  <div key={item._id} className="relative pl-12 border-l-2 border-slate-800">
                    {/* Indicator Dot */}
                    <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-slate-900 border-2 border-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.3)]"></div>

                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
                      <div className="font-black text-indigo-400 text-sm tracking-tight flex items-center gap-3 capitalize group/item">
                        <span className="text-white group-hover/item:text-emerald-400 transition-colors uppercase italic">{item.performedBy?.name || 'Protocol'}</span>
                        <span className="text-[10px] opacity-40">➔</span>
                        <span className="uppercase tracking-[0.1em]">{item.action.replace(/_/g, ' ')}</span>
                      </div>
                      <div className="text-[10px] font-bold text-slate-500 italic">
                        {formatDate(item.createdAt)}
                      </div>
                    </div>

                    {item.note && (
                      <div className="bg-slate-800/50 backdrop-blur-sm p-6 rounded-[24px] border border-slate-700/50 mb-4 shadow-inner">
                        <div className="text-slate-300 text-sm font-medium leading-relaxed prose prose-invert max-w-none prose-sm" dangerouslySetInnerHTML={{ __html: item.note }} />
                      </div>
                    )}

                    {item.message && (
                      <div className="p-6 bg-indigo-950/20 border-l-4 border-indigo-500 rounded-r-2xl mb-4 italic text-sm text-indigo-200">
                        "{item.message}"
                      </div>
                    )}

                    <div className="flex flex-wrap gap-4">
                      {item.metadata?.link && (
                        <a href={item.metadata.link} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-3 px-4 py-2 bg-slate-800 rounded-xl text-xs font-bold text-indigo-400 hover:bg-slate-700 transition-all border border-slate-700">
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l1.72 1.71" /><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l-1.71-1.71" /></svg>
                          External Resource
                        </a>
                      )}

                      {item.documents && item.documents.length > 0 && (
                        <div className="flex flex-wrap gap-3">
                          {item.documents.map((doc, docIdx) => (
                            <a key={docIdx} href={`http://localhost:5000/${doc.path}`} target="_blank" rel="noopener noreferrer" className="group/doc inline-flex items-center gap-3 px-4 py-2 bg-emerald-900/20 border border-emerald-900/50 rounded-xl text-xs font-bold text-emerald-400 hover:bg-emerald-900/40 transition-all">
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"></path><polyline points="13 2 13 9 20 9"></polyline></svg>
                              {doc.originalName || 'Artifact'}
                              <span className="opacity-40 font-black">[{Math.round(doc.size / 1024)}KB]</span>
                            </a>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-10 animate-in fade-in slide-in-from-right duration-700">
          {/* Actions */}
          <div className="bg-white p-10 rounded-[48px] shadow-sm border border-slate-100 group">
            <h3 className="text-lg font-black text-slate-800 mb-8 flex items-center gap-3">
              <span className="w-8 h-[2px] bg-slate-900 group-hover:w-12 transition-all"></span> Command Menu
            </h3>
            <div className="space-y-4">
              {allowedActions.canStart && (
                <button
                  onClick={handleStart}
                  disabled={actionLoading}
                  className="w-full flex items-center justify-between p-6 bg-emerald-600 text-white rounded-[24px] font-black text-sm uppercase tracking-widest hover:bg-emerald-700 hover:-translate-y-1 active:scale-95 transition-all shadow-xl shadow-emerald-100 disabled:opacity-50 disabled:grayscale disabled:pointer-events-none group/btn"
                >
                  {actionLoading === 'starting' ? 'Initializing...' : '▶ Start Execution'}
                  <svg className="group-hover/btn:translate-x-1 transition-transform" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M5 12h14M12 5l7 7-7 7" /></svg>
                </button>
              )}
              {allowedActions.canPause && (
                <button
                  onClick={handlePause}
                  disabled={actionLoading}
                  className="w-full flex items-center justify-between p-6 bg-amber-500 text-white rounded-[24px] font-black text-sm uppercase tracking-widest hover:bg-amber-600 hover:-translate-y-1 active:scale-95 transition-all shadow-xl shadow-amber-100 disabled:opacity-50 disabled:pointer-events-none group/btn"
                >
                  {actionLoading === 'pausing' ? 'Suspending...' : '⏸ Suspend Node'}
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><rect x="6" y="4" width="4" height="16"></rect><rect x="14" y="4" width="4" height="16"></rect></svg>
                </button>
              )}
              {allowedActions.canComplete && (
                <button
                  onClick={handleCompleteClick}
                  disabled={actionLoading}
                  className="w-full flex items-center justify-between p-6 bg-indigo-600 text-white rounded-[24px] font-black text-sm uppercase tracking-widest hover:bg-indigo-700 hover:-translate-y-1 active:scale-95 transition-all shadow-xl shadow-indigo-100 disabled:opacity-50 disabled:pointer-events-none group/btn"
                >
                  {actionLoading === 'completing' ? 'Finalizing...' : '✓ Validate Step'}
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
                </button>
              )}
              {allowedActions.canSendBack && (
                <button
                  onClick={handleSendBackClick}
                  disabled={actionLoading}
                  className="w-full flex items-center justify-between p-6 bg-white border-2 border-rose-100 text-rose-600 rounded-[24px] font-black text-sm uppercase tracking-widest hover:bg-rose-50 hover:-translate-y-1 active:scale-95 transition-all disabled:opacity-50 disabled:pointer-events-none group/btn"
                >
                  {actionLoading === 'sendingBack' ? 'Reverting...' : '↩ Revert Node'}
                  <svg className="group-hover/btn:-translate-x-1 transition-transform" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M19 12H5M12 19l-7-7 7-7" /></svg>
                </button>
              )}
            </div>
          </div>

          {/* Task Info */}
          <div className="bg-slate-50 p-10 rounded-[48px] border border-slate-200">
            <h3 className="text-lg font-black text-slate-800 mb-8 flex items-center gap-3">
              <span className="w-8 h-[2px] bg-indigo-200"></span> Specification
            </h3>
            <div className="space-y-8">
              {task.status && (
                <div className="space-y-2">
                  <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Runtime State</div>
                  <div className="flex">
                    <span className={`px-5 py-2 rounded-2xl text-[11px] font-black uppercase tracking-widest border-2 shadow-inner ${getStatusColorClasses(task.status.slug || task.status.name.toLowerCase())}`}>
                      {task.status.name}
                    </span>
                  </div>
                </div>
              )}
              {task.priority && (
                <div className="space-y-2">
                  <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Priority Class</div>
                  <div className="flex">
                    <span className={`px-5 py-2 rounded-2xl text-[11px] font-black uppercase tracking-widest border-2 shadow-inner ${task.priority === 'urgent' ? 'bg-rose-50 text-rose-600 border-rose-100' :
                        task.priority === 'high' ? 'bg-amber-50 text-amber-600 border-amber-100' :
                          task.priority === 'medium' ? 'bg-indigo-50 text-indigo-600 border-indigo-100' :
                            'bg-emerald-50 text-emerald-600 border-emerald-100'
                      }`}>
                      {task.priority} Alpha
                    </span>
                  </div>
                </div>
              )}
              <div className="space-y-2">
                <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Task ID</div>
                <div className="font-mono text-[11px] text-slate-400 bg-white p-3 rounded-xl border border-slate-100 truncate shadow-inner">
                  {taskId}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Action Modal */}
      {actionModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xl flex items-center justify-center z-[1000] p-6 animate-in fade-in duration-300">
          <div className="bg-white rounded-[48px] w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in zoom-in duration-500">
            {/* Modal Header */}
            <div className="p-10 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <h2 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-4">
                <span className={`w-3 h-10 rounded-full ${actionModal === 'complete' ? 'bg-emerald-500' : 'bg-rose-500'}`}></span>
                {actionModal === 'complete' ? 'Finalize Operational Step' : 'Node Reversion Protocol'}
              </h2>
              <button
                onClick={() => setActionModal(null)}
                className="w-12 h-12 rounded-2xl bg-white border border-slate-100 flex items-center justify-center text-slate-400 hover:text-rose-500 hover:border-rose-100 transition-all hover:rotate-90 active:scale-90"
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M18 6L6 18M6 6l12 12" /></svg>
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-10 overflow-y-auto no-scrollbar space-y-10">
              <div className="space-y-4">
                <label className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-3">
                  Briefing Editor <span className="text-[9px] opacity-40 font-bold italic">(Rich Text Interface)</span>
                </label>
                <div className="rounded-[32px] border-2 border-slate-100 overflow-hidden bg-white shadow-inner focus-within:border-indigo-500 transition-colors">
                  <ReactQuill
                    value={formData.note}
                    onChange={(value) => setFormData({ ...formData, note: value })}
                    className="h-48"
                    theme="snow"
                    placeholder="Enter cryptographic logs, technical notes, or operational briefings..."
                  />
                  <div className="h-14"></div> {/* Quill spacer */}
                </div>
              </div>

              <div className="space-y-4">
                <label className="text-xs font-black text-slate-400 uppercase tracking-[0.2em]">Summary Packet</label>
                <textarea
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  className="w-full p-8 bg-slate-50 border-2 border-slate-100 rounded-[32px] text-sm font-bold text-slate-700 outline-none focus:bg-white focus:border-indigo-400 transition-all min-h-[120px] shadow-inner"
                  placeholder="Summarize the action for the propagation chain..."
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                <div className="space-y-4">
                  <label className="text-xs font-black text-slate-400 uppercase tracking-[0.2em]">Resource URL</label>
                  <input
                    type="text"
                    value={formData.link}
                    onChange={(e) => setFormData({ ...formData, link: e.target.value })}
                    className="w-full p-6 bg-slate-50 border-2 border-slate-100 rounded-[24px] text-sm font-bold text-slate-700 outline-none focus:bg-white focus:border-indigo-400 transition-all shadow-inner"
                    placeholder="https://intel.nexus/ref/..."
                  />
                </div>

                <div className="space-y-4">
                  <label className="text-xs font-black text-slate-400 uppercase tracking-[0.2em]">Artifact Extraction</label>
                  <div className="relative group/file">
                    <input
                      type="file"
                      multiple
                      onChange={handleFileChange}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                    />
                    <div className="p-6 bg-slate-50 border-2 border-dashed border-slate-200 rounded-[24px] text-center group-hover/file:bg-indigo-50 group-hover/file:border-indigo-300 transition-all">
                      <div className="text-indigo-500 mb-2">
                        <svg className="mx-auto" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12" /></svg>
                      </div>
                      <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest whitespace-nowrap">
                        {selectedFiles.length > 0 ? `${selectedFiles.length} Artifacts Selected` : 'Upload Assets'}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-10 border-t border-slate-100 flex justify-end gap-6 bg-slate-50/50">
              <button
                onClick={() => setActionModal(null)}
                className="px-10 py-5 text-slate-400 font-black text-[10px] uppercase tracking-[0.2em] hover:text-slate-900 transition-colors"
              >
                Abort Protocol
              </button>
              <button
                onClick={handleModalSubmit}
                disabled={actionLoading}
                className={`px-12 py-5 rounded-[24px] font-black text-sm uppercase tracking-widest text-white shadow-2xl transition-all active:scale-95 disabled:opacity-50 ${actionModal === 'complete'
                    ? 'bg-emerald-600 shadow-emerald-100 hover:bg-emerald-700'
                    : 'bg-rose-600 shadow-rose-100 hover:bg-rose-700'
                  }`}
              >
                {actionLoading ? 'Synthesizing...' : (actionModal === 'complete' ? 'Execute Validation' : 'Confirm Reversion')}
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default MyTaskDetails;
