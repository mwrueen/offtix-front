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
      setTasks(response.data || []);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.error || 'Unable to load task stream.');
    } finally { setLoading(false); }
  };

  const handleStart = async (taskId, workflowType) => {
    setActionLoading(prev => ({ ...prev, [taskId]: 'starting' }));
    try {
      if (workflowType === 'sequential') await myTasksAPI.startSequential(taskId);
      else await myTasksAPI.start(taskId);
      toast?.showToast?.('Task processing started.', 'success');
      fetchTasks();
    } catch (err) { toast?.showToast?.('Failed to start task.', 'error'); }
    finally { setActionLoading(prev => ({ ...prev, [taskId]: null })); }
  };

  const handlePause = async (taskId) => {
    setActionLoading(prev => ({ ...prev, [taskId]: 'pausing' }));
    try {
      await myTasksAPI.pauseSequential(taskId);
      toast?.showToast?.('Task paused.', 'info');
      fetchTasks();
    } catch (err) { toast?.showToast?.('Failed to pause task.', 'error'); }
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
        toast?.showToast?.('Task completed successfully.', 'success');
      } else {
        await myTasksAPI.sendBackSequential(taskId, formData.note, formData.message, formData.link, selectedFiles);
        toast?.showToast?.('Task returned to previous step.', 'info');
      }
      setActionModal(null); setActiveTask(null); setFormData({ note: '', message: '', link: '' }); setSelectedFiles([]); fetchTasks();
    } catch (err) { toast?.showToast?.('Submission failed.', 'error'); }
    finally { setActionLoading(prev => ({ ...prev, [taskId]: null })); }
  };

  const handleFileChange = (e) => { if (e.target.files) setSelectedFiles(Array.from(e.target.files)); };

  const getStatusClasses = (status) => {
    const map = {
      pending: 'bg-slate-100 text-slate-500 border-slate-200',
      active: 'bg-indigo-50 text-indigo-600 border-indigo-100',
      in_progress: 'bg-emerald-50 text-emerald-600 border-emerald-100',
      paused: 'bg-amber-50 text-amber-600 border-amber-100',
      completed: 'bg-indigo-600 text-white border-indigo-700',
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
        <button
          onClick={(e) => { e.stopPropagation(); handleStart(task._id, task.workflowType); }}
          disabled={isLoading || !canStartTask}
          className={`px-8 py-3 rounded-xl font-bold text-xs uppercase tracking-widest transition-all active:scale-95 shadow-md flex items-center gap-2 ${canStartTask ? 'bg-indigo-600 text-white hover:bg-indigo-700' : 'bg-slate-100 text-slate-300 cursor-not-allowed opacity-50'}`}
        >
          {isLoading === 'starting' ? 'Starting...' : 'Start Task'}
        </button>
      );
    }

    if (taskStatus === 'in_progress') {
      return (
        <div className="flex items-center gap-3">
          {task.workflowType === 'sequential' && (
            <button onClick={(e) => { e.stopPropagation(); handlePause(task._id); }} disabled={isLoading} className="px-6 py-3 bg-amber-500 text-white rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-amber-600 transition-all active:scale-95">
              Pause
            </button>
          )}
          <button onClick={(e) => handleCompleteClick(e, task)} disabled={isLoading} className="px-8 py-3 bg-indigo-600 text-white rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-indigo-700 transition-all active:scale-95">
            Complete
          </button>
          {task.workflowType === 'sequential' && (
            <button onClick={(e) => handleSendBackClick(e, task)} disabled={isLoading} className="px-6 py-3 bg-white text-rose-600 border border-rose-100 rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-rose-50 transition-all active:scale-95">Return</button>
          )}
        </div>
      );
    }

    if (taskStatus === 'paused') {
      return (
        <button onClick={(e) => { e.stopPropagation(); handleStart(task._id, task.workflowType); }} disabled={isLoading || !canStartTask} className="px-8 py-3 bg-indigo-600 text-white rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-indigo-700 transition-all active:scale-95">
          Resume
        </button>
      );
    }
    return null;
  };

  if (loading) return (
    <Layout>
      <div className="p-40 text-center animate-in fade-in space-y-8">
        <div className="w-12 h-12 border-4 border-slate-100 border-t-indigo-600 rounded-full animate-spin mx-auto" />
        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Loading task stream...</p>
      </div>
    </Layout>
  );

  if (error) return (
    <Layout>
      <div className="max-w-xl mx-auto my-40 p-12 bg-white rounded-3xl border border-slate-200 text-center shadow-lg animate-in zoom-in-95">
        <div className="text-6xl mb-6">⚠️</div>
        <h3 className="text-2xl font-bold text-slate-900 mb-2">Access Denied</h3>
        <p className="text-slate-500 text-sm mb-8">{error}</p>
        <button onClick={fetchTasks} className="px-8 py-3 bg-indigo-600 text-white rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-indigo-700 transition-all">Retry Connection</button>
      </div>
    </Layout>
  );

  return (
    <Layout>
      <div className="space-y-12 animate-in fade-in duration-700 pb-40">
        <PageHeader
          title="Personal Task Stream"
          subtitle={`${tasks.length} active assignments requiring attention.`}
          icon="📋"
          stats={[
            { label: 'Pending', value: tasks.filter(t => ['pending', 'active'].includes(getTaskStatus(t))).length },
            { label: 'In Progress', value: tasks.filter(t => getTaskStatus(t) === 'in_progress').length }
          ]}
        />

        <div className="space-y-6">
          {tasks.length === 0 ? (
            <div className="bg-white rounded-3xl p-32 text-center border border-slate-200 shadow-sm transition-all duration-500 hover:shadow-md">
              <div className="text-7xl mb-6">🎯</div>
              <h3 className="text-2xl font-bold text-slate-900 mb-2">Queue Clear</h3>
              <p className="text-slate-500 text-sm">All directives have been processed. Awaiting new assignments.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6">
              {tasks.map((task, idx) => {
                const status = getTaskStatus(task);
                return (
                  <div key={task._id} onClick={() => navigate(`/my-tasks/${task._id}`)} className="group bg-white rounded-3xl p-8 border border-slate-200 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer overflow-hidden relative animate-in slide-in-from-bottom-8" style={{ animationDelay: `${idx * 50}ms` }}>
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8 relative z-10">
                      <div className="flex-1 min-w-0 space-y-4">
                        <div className="flex flex-wrap items-center gap-3">
                          {task.priority && (
                            <span className={`px-4 py-1 rounded-full text-[9px] font-bold uppercase tracking-wider ${task.priority === 'urgent' ? 'bg-rose-600 text-white' : task.priority === 'high' ? 'bg-amber-400 text-amber-900' : 'bg-slate-100 text-slate-600'}`}>
                              {task.priority} Priority
                            </span>
                          )}
                          <span className="text-[9px] font-bold text-indigo-600 uppercase tracking-widest bg-indigo-50 px-4 py-1 rounded-full border border-indigo-100 truncate max-w-xs">
                            {task.project?.title || 'Global Workspace'}
                          </span>
                        </div>

                        <div className="space-y-1">
                          <h3 className="text-xl font-bold text-slate-900 truncate group-hover:text-indigo-600 transition-colors">{task.title}</h3>
                          <p className="text-[10px] text-slate-400 font-medium uppercase tracking-widest">ID: {task._id.slice(-8).toUpperCase()}</p>
                        </div>

                        <div className="flex flex-wrap items-center gap-6 pt-2">
                          <div className="flex items-center gap-3">
                            <span className={`px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider border transition-all ${getStatusClasses(status)}`}>
                              {status.replace('_', ' ')}
                            </span>
                          </div>

                          {task.status && (
                            <div className="flex items-center gap-3 pl-4 border-l border-slate-100">
                              <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: task.status.color || '#64748b' }} />
                              <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">{task.status.name}</span>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="shrink-0" onClick={e => e.stopPropagation()}>
                        {renderActionButtons(task)}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {actionModal && (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-[2000] p-6 animate-in fade-in duration-300">
            <div className="bg-white rounded-3xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 border border-white/20">
              <div className="px-8 py-6 border-b border-slate-100 bg-slate-900 text-white flex items-center justify-between shrink-0">
                <div>
                  <h2 className="text-xl font-bold uppercase tracking-tight">{actionModal === 'complete' ? 'Submit Task Progress' : 'Return for Revision'}</h2>
                  <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest mt-1">ID: {activeTask?._id?.toUpperCase()}</p>
                </div>
                <button onClick={() => { setActionModal(null); setActiveTask(null); }} className="w-10 h-10 rounded-xl bg-white/10 text-white flex items-center justify-center text-xl hover:bg-rose-600 transition-all active:scale-90 font-bold">×</button>
              </div>

              <div className="p-8 lg:p-12 overflow-y-auto space-y-10 scrollbar-none flex-1 bg-white">
                <div className="space-y-4">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Internal Note (Private)</label>
                  <div className="rounded-2xl border border-slate-200 overflow-hidden shadow-sm focus-within:border-indigo-400 transition-all p-2">
                    <ReactQuill value={formData.note} onChange={(v) => setFormData({ ...formData, note: v })} className="min-h-[200px] border-none text-sm font-medium" theme="snow" placeholder="Document your progress or implementation details..." />
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                  <div className="space-y-3">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Communication Log</label>
                    <textarea value={formData.message} onChange={e => setFormData({ ...formData, message: e.target.value })} className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-medium outline-none focus:bg-white focus:border-indigo-400 transition-all min-h-[200px] resize-none" placeholder="Message for the next person in workflow..." />
                  </div>
                  <div className="space-y-6">
                    <div className="space-y-3">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Relevant Resource Link</label>
                      <input type="text" value={formData.link} onChange={e => setFormData({ ...formData, link: e.target.value })} className="w-full px-6 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none focus:bg-white focus:border-indigo-400 transition-all" placeholder="https://resource-link.com" />
                    </div>
                    <div className="space-y-3">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Supporting Documents</label>
                      <div className="border-2 border-dashed border-slate-200 rounded-2xl p-10 bg-slate-50 hover:bg-white hover:border-indigo-600 transition-all cursor-pointer relative flex flex-col items-center justify-center gap-4 min-h-[140px]">
                        <div className="text-4xl grayscale">📎</div>
                        <input type="file" multiple onChange={handleFileChange} className="absolute inset-0 opacity-0 cursor-pointer z-20" />
                        <div className="text-center px-4">
                          <p className="text-xs font-bold text-slate-900 uppercase tracking-widest mb-1">{selectedFiles.length > 0 ? `${selectedFiles.length} files selected` : 'Click to upload files'}</p>
                          <p className="text-[10px] text-slate-400 font-medium">Max 50MB per file</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="px-8 py-6 border-t border-slate-100 flex flex-col sm:flex-row justify-end gap-4 bg-slate-50 shrink-0">
                <button onClick={() => { setActionModal(null); setActiveTask(null); }} className="px-8 py-3 font-bold text-[11px] uppercase tracking-widest text-slate-400 hover:text-slate-900 transition-all">Cancel</button>
                <button
                  onClick={handleModalSubmit}
                  disabled={activeTask && actionLoading[activeTask._id]}
                  className={`px-12 py-4 rounded-xl font-bold text-xs uppercase tracking-[0.2em] text-white transition-all hover:scale-105 active:scale-95 shadow-lg min-w-[240px] ${actionModal === 'complete' ? 'bg-indigo-600' : 'bg-rose-600'} ${(activeTask && actionLoading[activeTask._id]) ? 'grayscale opacity-50 cursor-wait' : ''}`}
                >
                  {(activeTask && actionLoading[activeTask._id]) ? 'Processing...' : (actionModal === 'complete' ? 'Finalize Submission' : 'Confirm Return')}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default MyTasksList;
