import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { myTasksAPI } from '../services/api';
import { useToast } from '../context/ToastContext';
import { useCompany } from '../context/CompanyContext';
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
  const { state: companyState } = useCompany();
  const selectedCompanyId = companyState.selectedCompany?.id || 'personal';

  const fetchTasks = useCallback(async () => {
    try {
      setLoading(true);
      const response = await myTasksAPI.getAll(selectedCompanyId);
      setTasks(response.data || []);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.error || 'Unable to load task stream.');
    } finally { setLoading(false); }
  }, [selectedCompanyId]);

  useEffect(() => { fetchTasks(); }, [fetchTasks]);

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

  const getPriorityClasses = (priority) => {
    const map = {
      urgent: 'bg-rose-50 text-rose-700 border border-rose-200',
      high: 'bg-amber-50 text-amber-700 border border-amber-200',
      medium: 'bg-sky-50 text-sky-700 border border-sky-200',
      low: 'bg-slate-100 text-slate-600 border border-slate-200'
    };
    return map[priority] || 'bg-slate-100 text-slate-600 border border-slate-200';
  };

  const getTaskStatus = (task) => {
    if (task.workflowType === 'sequential') return task.userAssignee?.status || 'pending';
    if (task.workflowType === 'role') return task.userStep?.status || 'pending';
    return task.userStep?.status || 'assigned';
  };

  const renderActionButtons = (task) => {
    const taskStatus = getTaskStatus(task);
    const isLoading = actionLoading[task._id];
    const canStartTask = task.canStart === true;

    if (taskStatus === 'pending' || taskStatus === 'active') {
      return (
        <button
          onClick={(e) => { e.stopPropagation(); handleStart(task._id, task.workflowType); }}
          disabled={isLoading || !canStartTask}
          className={`group relative inline-flex items-center justify-center gap-2 px-6 py-2.5 overflow-hidden font-semibold text-sm transition-all duration-300 rounded-xl shadow-sm hover:shadow active:scale-95 ${canStartTask ? 'bg-gradient-to-r from-indigo-600 to-indigo-500 text-white hover:from-indigo-500 hover:to-indigo-400 hover:-translate-y-0.5' : 'bg-slate-100 text-slate-400 cursor-not-allowed opacity-70'}`}
        >
          {isLoading === 'starting' ? (
            <svg className="animate-spin w-4 h-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          ) : (
            <svg className={`w-4 h-4 transition-transform duration-300 ${canStartTask ? 'group-hover:translate-x-0.5' : ''}`} fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.348a1.125 1.125 0 010 1.971l-11.54 6.347c-.75.412-1.667-.13-1.667-.986V5.653z" />
            </svg>
          )}
          <span>{isLoading === 'starting' ? 'Starting...' : 'Start Task'}</span>
        </button>
      );
    }

    if (taskStatus === 'in_progress') {
      return (
        <div className="flex items-center gap-3">
          {task.workflowType === 'sequential' && (
            <button onClick={(e) => { e.stopPropagation(); handlePause(task._id); }} disabled={isLoading} className="group relative inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-white border border-amber-200 text-amber-600 rounded-xl font-semibold text-sm hover:bg-amber-50 hover:border-amber-300 transition-all duration-300 shadow-sm hover:shadow active:scale-95">
              <svg className="w-4 h-4 group-hover:scale-105 transition-transform" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 5.25v13.5m-7.5-13.5v13.5" />
              </svg>
              <span>Pause</span>
            </button>
          )}
          <button onClick={(e) => handleCompleteClick(e, task)} disabled={isLoading} className="group relative inline-flex items-center justify-center gap-2 px-6 py-2.5 bg-gradient-to-r from-emerald-600 to-emerald-500 text-white rounded-xl font-semibold text-sm hover:from-emerald-500 hover:to-emerald-400 transition-all duration-300 shadow-sm hover:shadow hover:-translate-y-0.5 active:scale-95">
            <svg className="w-4 h-4 group-hover:scale-110 transition-transform duration-300" fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
            </svg>
            <span>Complete</span>
          </button>
          {task.workflowType === 'sequential' && (
            <button onClick={(e) => handleSendBackClick(e, task)} disabled={isLoading} className="group relative inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-white border border-rose-200 text-rose-600 rounded-xl font-semibold text-sm hover:bg-rose-50 hover:border-rose-300 transition-all duration-300 shadow-sm hover:shadow active:scale-95">
              <svg className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 15L3 9m0 0l6-6M3 9h12a6 6 0 010 12h-3" />
              </svg>
              <span>Return</span>
            </button>
          )}
        </div>
      );
    }

    if (taskStatus === 'paused') {
      return (
        <button onClick={(e) => { e.stopPropagation(); handleStart(task._id, task.workflowType); }} disabled={isLoading || !canStartTask} className="group relative inline-flex items-center justify-center gap-2 px-6 py-2.5 bg-gradient-to-r from-indigo-600 to-indigo-500 text-white rounded-xl font-semibold text-sm hover:from-indigo-500 hover:to-indigo-400 transition-all duration-300 shadow-sm hover:shadow hover:-translate-y-0.5 active:scale-95">
          <svg className="w-4 h-4 group-hover:translate-x-0.5 transition-transform duration-300" fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.348a1.125 1.125 0 010 1.971l-11.54 6.347c-.75.412-1.667-.13-1.667-.986V5.653z" />
          </svg>
          <span>Resume</span>
        </button>
      );
    }
    return null;
  };

  if (loading) return (
    <Layout>
      <div className="px-6 py-24 text-center space-y-4">
        <div className="w-10 h-10 border-4 border-slate-200 border-t-indigo-600 rounded-full animate-spin mx-auto" />
        <p className="text-sm font-medium text-slate-500">Loading your tasks...</p>
      </div>
    </Layout>
  );

  if (error) return (
    <Layout>
      <div className="max-w-xl mx-auto my-24 p-8 bg-white rounded-2xl border border-slate-200 text-center shadow-sm">
        <h3 className="text-xl font-semibold text-slate-900 mb-2">Unable to load tasks</h3>
        <p className="text-slate-600 text-sm mb-6">{error}</p>
        <button onClick={fetchTasks} className="px-5 py-2.5 bg-indigo-600 text-white rounded-lg font-medium text-sm hover:bg-indigo-700 transition-colors">Retry</button>
      </div>
    </Layout>
  );

  return (
    <Layout>
      <div className="space-y-8 pb-24">
        <PageHeader
          title="My Tasks"
          subtitle={`${tasks.length} assignment${tasks.length === 1 ? '' : 's'} currently in your queue.`}
          icon="✅"
          stats={[
            { label: 'Pending', value: tasks.filter(t => ['pending', 'active'].includes(getTaskStatus(t))).length },
            { label: 'In Progress', value: tasks.filter(t => getTaskStatus(t) === 'in_progress').length }
          ]}
        />

        <div className="space-y-4">
          {tasks.length === 0 ? (
            <div className="bg-white rounded-2xl p-12 text-center border border-slate-200 shadow-sm">
              <h3 className="text-xl font-semibold text-slate-900 mb-2">No tasks assigned</h3>
              <p className="text-slate-600 text-sm">You are all caught up. New tasks will appear here automatically.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6">
              {tasks.map((task) => {
                const status = getTaskStatus(task);
                const sd = task.userStep?.startDate || task.userAssignee?.startDate || task.startDate;
                const ed = task.userStep?.dueDate || task.userAssignee?.dueDate || task.dueDate;
                const formattedStart = sd ? new Date(sd).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : '--';
                const formattedEnd = ed ? new Date(ed).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : '--';
                const hours = task.durationMinutes ? (task.durationMinutes / 60).toFixed(2) : '0.00';

                return (
                  <div
                    key={task._id}
                    onClick={() => navigate(`/my-tasks/${task._id}`)}
                    className="group bg-white rounded-xl p-5 border border-slate-200 hover:border-indigo-200 shadow-sm hover:shadow transition-all duration-200 cursor-pointer flex flex-col md:flex-row md:items-center justify-between gap-5"
                  >
                    <div className="flex-1 min-w-0 space-y-3">
                      {/* Top Row: Priority, Project, Title */}
                      <div className="flex items-center gap-3">
                        <h3 className="text-base font-semibold text-slate-900 truncate group-hover:text-indigo-600 transition-colors">
                          {task.title}
                        </h3>
                        {task.priority && (
                          <span className={`shrink-0 px-2.5 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider ${getPriorityClasses(task.priority)}`}>
                            {task.priority}
                          </span>
                        )}
                        <span className="shrink-0 px-2.5 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-600 border border-slate-200">
                          {task.project?.title || 'Global'}
                        </span>
                      </div>

                      {/* Bottom Row: Metadata */}
                      <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm">
                        <div className="flex items-center gap-2">
                           <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold capitalize border ${getStatusClasses(status)}`}>
                             {status.replace('_', ' ')}
                           </span>
                        </div>

                        <div className="flex items-center gap-1.5 text-slate-500 text-xs font-medium">
                          <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <span>Start: {formattedStart}</span>
                        </div>

                        <div className="flex items-center gap-1.5 text-slate-500 text-xs font-medium">
                          <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <span>Due: {formattedEnd}</span>
                        </div>

                        <div className="flex items-center gap-1.5 text-indigo-700 text-xs font-bold bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-100">
                          <svg className="w-4 h-4 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <span>{hours} Hrs</span>
                        </div>
                      </div>
                    </div>

                    <div className="shrink-0 flex items-center mt-2 md:mt-0" onClick={e => e.stopPropagation()}>
                      {renderActionButtons(task)}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {actionModal && (
          <div className="fixed inset-0 bg-slate-900/35 backdrop-blur-sm flex items-center justify-center z-[2000] p-6">
            <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-xl overflow-hidden border border-slate-200">
              <div className="px-8 py-6 border-b border-slate-200 bg-white flex items-center justify-between shrink-0">
                <div className="flex items-center gap-4">
                  <div className={`w-11 h-11 rounded-lg flex items-center justify-center ${actionModal === 'complete' ? 'bg-indigo-100 text-indigo-700' : 'bg-rose-100 text-rose-700'}`}>
                    {actionModal === 'complete' ? '✓' : '↩'}
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold text-slate-800">{actionModal === 'complete' ? 'Submit Task Progress' : 'Return for Revision'}</h2>
                    <p className="text-xs text-slate-500 mt-1">Task ID: {activeTask?._id?.slice(-8).toUpperCase()}</p>
                  </div>
                </div>
                <button onClick={() => { setActionModal(null); setActiveTask(null); }} className="w-9 h-9 rounded-lg bg-slate-100 text-slate-500 flex items-center justify-center text-xl hover:bg-slate-200 transition-colors">×</button>
              </div>

              <div className="p-8 lg:p-10 overflow-y-auto space-y-8 flex-1 bg-white">
                <div className="space-y-4">
                  <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider ml-1">Internal Note (Private)</label>
                  <div className="rounded-xl border border-slate-200 overflow-hidden shadow-sm focus-within:border-indigo-400 transition-colors p-2">
                    <ReactQuill value={formData.note} onChange={(v) => setFormData({ ...formData, note: v })} className="min-h-[200px] border-none text-sm font-medium" theme="snow" placeholder="Document your progress or implementation details..." />
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  <div className="space-y-3">
                    <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider ml-1">Communication Log</label>
                    <textarea value={formData.message} onChange={e => setFormData({ ...formData, message: e.target.value })} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium outline-none focus:bg-white focus:border-indigo-400 transition-colors min-h-[200px] resize-none" placeholder="Message for the next person in workflow..." />
                  </div>
                  <div className="space-y-6">
                    <div className="space-y-3">
                      <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider ml-1">Relevant Resource Link</label>
                      <input type="text" value={formData.link} onChange={e => setFormData({ ...formData, link: e.target.value })} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none focus:bg-white focus:border-indigo-400 transition-colors" placeholder="https://resource-link.com" />
                    </div>
                    <div className="space-y-3">
                      <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider ml-1">Supporting Documents</label>
                      <div className="border-2 border-dashed border-slate-300 rounded-xl p-8 bg-slate-50 hover:bg-white hover:border-indigo-400 transition-colors cursor-pointer relative flex flex-col items-center justify-center gap-3 min-h-[140px]">
                        <input type="file" multiple onChange={handleFileChange} className="absolute inset-0 opacity-0 cursor-pointer z-20" />
                        <div className="text-center px-4">
                          <p className="text-sm font-medium text-slate-800 mb-1">{selectedFiles.length > 0 ? `${selectedFiles.length} file${selectedFiles.length === 1 ? '' : 's'} selected` : 'Click to upload files'}</p>
                          <p className="text-xs text-slate-500">Max 50MB per file</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="px-8 py-5 border-t border-slate-200 flex flex-col sm:flex-row justify-end gap-3 bg-slate-50 shrink-0">
                <button onClick={() => { setActionModal(null); setActiveTask(null); }} className="px-5 py-2.5 font-medium text-sm text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors">Cancel</button>
                <button
                  onClick={handleModalSubmit}
                  disabled={activeTask && actionLoading[activeTask._id]}
                  className={`px-8 py-2.5 rounded-lg font-medium text-sm text-white transition-colors min-w-[200px] ${actionModal === 'complete' ? 'bg-indigo-600 hover:bg-indigo-700' : 'bg-rose-600 hover:bg-rose-700'} ${(activeTask && actionLoading[activeTask._id]) ? 'opacity-50 cursor-wait' : ''}`}
                >
                  {(activeTask && actionLoading[activeTask._id]) ? 'Processing...' : (actionModal === 'complete' ? 'Submit Update' : 'Confirm Return')}
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
