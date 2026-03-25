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

  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    try {
      setLoading(true);
      const response = await myTasksAPI.getAll();
      setTasks(response.data);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to fetch tasks');
      toast?.showToast?.('Failed to load tasks', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleStart = async (taskId, workflowType) => {
    setActionLoading(prev => ({ ...prev, [taskId]: 'starting' }));
    try {
      if (workflowType === 'sequential') {
        await myTasksAPI.startSequential(taskId);
      } else {
        await myTasksAPI.start(taskId);
      }
      toast?.showToast?.('Task started successfully', 'success');
      fetchTasks();
    } catch (err) {
      toast?.showToast?.(err.response?.data?.error || 'Failed to start task', 'error');
    } finally {
      setActionLoading(prev => ({ ...prev, [taskId]: null }));
    }
  };

  const handlePause = async (taskId) => {
    setActionLoading(prev => ({ ...prev, [taskId]: 'pausing' }));
    try {
      await myTasksAPI.pauseSequential(taskId);
      toast?.showToast?.('Task paused', 'success');
      fetchTasks();
    } catch (err) {
      toast?.showToast?.(err.response?.data?.error || 'Failed to pause task', 'error');
    } finally {
      setActionLoading(prev => ({ ...prev, [taskId]: null }));
    }
  };

  const handleCompleteClick = (e, task) => {
    e.stopPropagation();
    if (task.workflowType === 'sequential') {
      setActiveTask(task);
      setActionModal('complete');
    } else {
      navigate(`/my-tasks/${task._id}`);
    }
  };

  const handleSendBackClick = (e, task) => {
    e.stopPropagation();
    if (task.workflowType === 'sequential') {
      setActiveTask(task);
      setActionModal('sendBack');
    } else {
      navigate(`/my-tasks/${task._id}`);
    }
  };

  const handleModalSubmit = async () => {
    if (!activeTask) return;
    const taskId = activeTask._id;
    setActionLoading(prev => ({ ...prev, [taskId]: actionModal === 'complete' ? 'completing' : 'sendingBack' }));
    try {
      if (actionModal === 'complete') {
        await myTasksAPI.completeSequential(taskId, formData.note, formData.message, formData.link, selectedFiles);
        toast?.showToast?.('Task completed successfully', 'success');
      } else {
        await myTasksAPI.sendBackSequential(taskId, formData.note, formData.message, formData.link, selectedFiles);
        toast?.showToast?.('Task sent back successfully', 'success');
      }
      setActionModal(null);
      setActiveTask(null);
      setFormData({ note: '', message: '', link: '' });
      setSelectedFiles([]);
      fetchTasks();
    } catch (err) {
      toast?.showToast?.(err.response?.data?.error || 'Failed to process action', 'error');
    } finally {
      setActionLoading(prev => ({ ...prev, [taskId]: null }));
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files) {
      setSelectedFiles(Array.from(e.target.files));
    }
  };

  const getStatusClasses = (status) => {
    const statusMap = {
      pending: 'bg-slate-100 text-slate-500 border-slate-200',
      active: 'bg-emerald-50 text-emerald-600 border-emerald-100',
      in_progress: 'bg-blue-50 text-blue-600 border-blue-100',
      paused: 'bg-amber-50 text-amber-600 border-amber-100',
      completed: 'bg-emerald-50 text-emerald-600 border-emerald-100',
      skipped: 'bg-amber-50 text-amber-600 border-amber-100',
      needs_changes: 'bg-red-50 text-red-600 border-red-100',
      blocked: 'bg-slate-100 text-slate-600 border-slate-200',
      assigned: 'bg-slate-100 text-slate-500 border-slate-200'
    };
    return statusMap[status] || 'bg-slate-100 text-slate-500 border-slate-200';
  };

  const getStatusLabel = (status) => {
    const labelMap = {
      pending: 'Pending',
      active: 'Active',
      in_progress: 'In Progress',
      paused: 'Paused',
      completed: 'Completed',
      skipped: 'Skipped',
      needs_changes: 'Needs Changes',
      blocked: 'Blocked',
      assigned: 'Assigned'
    };
    return labelMap[status] || status;
  };

  const canShowActions = (task) => {
    if (task.workflowType === 'sequential') {
      return task.userAssignee && task.userAssignee.isCurrent;
    } else if (task.workflowType === 'role') {
      return task.userStep && task.userStep.isCurrent;
    }
    return false;
  };

  const getTaskStatus = (task) => {
    if (task.workflowType === 'sequential') {
      return task.userAssignee?.status || 'pending';
    } else if (task.workflowType === 'role') {
      return task.userStep?.status || 'pending';
    }
    return task.userStep?.status || 'assigned';
  };

  const renderActionButtons = (task) => {
    if (!canShowActions(task)) {
      return null;
    }

    const taskStatus = getTaskStatus(task);
    const isLoading = actionLoading[task._id];
    const canStartTask = task.canStart !== false; // Default to true if not specified

    if (taskStatus === 'pending' || taskStatus === 'active') {
      return (
        <div className="flex flex-col items-end gap-1.5">
          <button
            onClick={(e) => { e.stopPropagation(); handleStart(task._id, task.workflowType); }}
            disabled={isLoading || !canStartTask}
            className={`px-6 py-2 rounded-xl text-sm font-bold transition-all shadow-sm active:scale-95 min-w-[100px] ${canStartTask
              ? 'bg-emerald-500 text-white hover:bg-emerald-600 shadow-emerald-100'
              : 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'
              } ${isLoading ? 'opacity-70 cursor-wait' : ''}`}
            title={!canStartTask ? 'Complete or pause your current task first' : ''}
          >
            {isLoading === 'starting' ? 'Starting...' : '▶️ Start'}
          </button>
          {!canStartTask && (
            <span className="text-[10px] text-red-500 font-bold uppercase tracking-tight text-right max-w-[150px]">
              Complete current task first
            </span>
          )}
        </div>
      );
    }

    if (taskStatus === 'in_progress') {
      return (
        <div className="flex gap-2.5">
          {task.workflowType === 'sequential' && (
            <button
              onClick={(e) => { e.stopPropagation(); handlePause(task._id); }}
              disabled={isLoading}
              className={`px-5 py-2 bg-amber-500 text-white rounded-xl text-sm font-bold shadow-lg shadow-amber-100 hover:bg-amber-600 transition-all active:scale-95 min-w-[100px] ${isLoading ? 'opacity-70 cursor-wait' : ''}`}
            >
              {isLoading === 'pausing' ? 'Pausing...' : '⏸️ Pause'}
            </button>
          )}
          <button
            onClick={(e) => handleCompleteClick(e, task)}
            disabled={isLoading}
            className={`px-5 py-2 bg-indigo-600 text-white rounded-xl text-sm font-bold shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all active:scale-95 min-w-[110px] ${isLoading ? 'opacity-70 cursor-wait' : ''}`}
          >
            {isLoading === 'completing' ? 'Completing...' : '✅ Complete'}
          </button>
          {task.workflowType === 'sequential' && (
            <button
              onClick={(e) => handleSendBackClick(e, task)}
              disabled={isLoading}
              className={`px-5 py-2 bg-white text-red-600 border border-red-200 rounded-xl text-sm font-bold hover:bg-red-50 transition-all active:scale-95 min-w-[110px] ${isLoading ? 'opacity-70 cursor-wait' : ''}`}
            >
              {isLoading === 'sendingBack' ? 'Sending Back...' : '↩️ Send Back'}
            </button>
          )}
        </div>
      );
    }

    if (taskStatus === 'paused') {
      return (
        <div className="flex flex-col items-end gap-1.5">
          <button
            onClick={(e) => { e.stopPropagation(); handleStart(task._id, task.workflowType); }}
            disabled={isLoading || !canStartTask}
            className={`px-6 py-2 rounded-xl text-sm font-bold transition-all shadow-sm active:scale-95 min-w-[100px] ${canStartTask
              ? 'bg-emerald-500 text-white hover:bg-emerald-600 shadow-emerald-100'
              : 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'
              } ${isLoading ? 'opacity-70 cursor-wait' : ''}`}
            title={!canStartTask ? 'Complete or pause your current task first' : ''}
          >
            {isLoading === 'starting' ? 'Resuming...' : '▶️ Resume'}
          </button>
          {!canStartTask && (
            <span className="text-[10px] text-red-500 font-bold uppercase tracking-tight text-right max-w-[150px]">
              Complete current task first
            </span>
          )}
        </div>
      );
    }

    return null;
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center p-24 text-center">
          <div className="w-12 h-12 border-4 border-slate-100 border-t-indigo-600 rounded-full animate-spin mb-4"></div>
          <p className="text-slate-500 text-base font-semibold">Fetching your assigned missions...</p>
        </div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout>
        <div className="bg-red-50 border border-red-100 p-8 rounded-2xl text-center text-red-800 max-w-2xl mx-auto my-12 shadow-sm">
          <p className="m-0 font-bold text-lg mb-2">Access Error</p>
          <p className="m-0 opacity-80">{error}</p>
          <button
            onClick={fetchTasks}
            className="mt-6 px-6 py-2 bg-red-600 text-white rounded-xl font-bold text-sm hover:bg-red-700 transition-all"
          >
            Retry Sync
          </button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <PageHeader
        title="My Tasks"
        subtitle={`${tasks.length} ${tasks.length === 1 ? 'mission' : 'missions'} currently on your radar`}
        icon={
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2"></path>
            <rect x="9" y="3" width="6" height="4" rx="1"></rect>
          </svg>
        }
        stats={[
          { label: 'Assigned', value: tasks.filter(t => getTaskStatus(t) === 'pending' || getTaskStatus(t) === 'active').length, color: 'slate' },
          { label: 'Active', value: tasks.filter(t => getTaskStatus(t) === 'in_progress').length, color: 'blue' }
        ]}
      />

      {/* Tasks List */}
      {tasks.length === 0 ? (
        <div className="bg-white rounded-3xl p-24 text-center shadow-sm border border-slate-200 border-dashed max-w-4xl mx-auto">
          <div className="text-7xl mb-6 grayscale opacity-40">📋</div>
          <h3 className="text-2xl font-bold text-slate-800 mb-3">All Caught Up!</h3>
          <p className="text-slate-500 max-w-md mx-auto leading-relaxed">
            You don't have any tasks assigned to you right now. Use this time to recharge or check the team board.
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          {tasks.map((task, index) => (
            <div
              key={task._id}
              className={`p-6 border-b ${index === tasks.length - 1 ? 'border-none' : 'border-slate-100'} hover:bg-slate-50 transition-all cursor-pointer group`}
              onClick={() => navigate(`/my-tasks/${task._id}`)}
            >
              <div className="flex items-center justify-between gap-6">
                {/* Left: Task Info */}
                <div className="flex-1 min-w-0">
                  <h3 className="text-base font-bold text-slate-800 mb-2 truncate group-hover:text-indigo-600 transition-colors tracking-tight">
                    {task.title}
                  </h3>
                  <div className="flex items-center gap-4 flex-wrap">
                    {task.project && (
                      <span className="text-xs font-semibold text-slate-500 flex items-center gap-1.5 bg-slate-50 px-2 py-1 rounded-lg">
                        <span className="opacity-60">📁</span> {task.project.title}
                      </span>
                    )}
                    {task.priority && (
                      <span className={`text-[10px] px-2.5 py-1 rounded-lg font-black uppercase tracking-wider shadow-sm ${task.priority === 'urgent' ? 'bg-red-50 text-red-600' :
                        task.priority === 'high' ? 'bg-amber-50 text-amber-600' :
                          task.priority === 'medium' ? 'bg-blue-50 text-blue-600' : 'bg-emerald-50 text-emerald-600'
                        }`}>
                        {task.priority}
                      </span>
                    )}
                  </div>
                </div>

                {/* Middle: Status */}
                <div className="flex items-center gap-3">
                  {task.status && (
                    <span className="px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap border" style={{
                      backgroundColor: task.status.color ? `${task.status.color}10` : '#f1f5f9',
                      color: task.status.color || '#64748b',
                      borderColor: task.status.color ? `${task.status.color}20` : '#e2e8f0',
                    }}>
                      {task.status.name}
                    </span>
                  )}
                  <span className={`px-3 py-1.5 rounded-full text-xs font-black whitespace-nowrap border uppercase tracking-wider ${getStatusClasses(getTaskStatus(task))}`}>
                    {getStatusLabel(getTaskStatus(task))}
                  </span>
                </div>

                {/* Right: Action Buttons */}
                <div
                  className="min-w-[120px] flex justify-end"
                  onClick={(e) => e.stopPropagation()}
                >
                  {renderActionButtons(task)}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {actionModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-[1000] p-4 transition-all duration-300">
          <div className="bg-white rounded-3xl w-full max-w-[650px] max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
            {/* Modal Header */}
            <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <h2 className="m-0 text-xl font-bold text-slate-800 tracking-tight">
                {actionModal === 'complete' ? 'Complete Task' : 'Send Back to Previous'}
              </h2>
              <button
                onClick={() => {
                  setActionModal(null);
                  setActiveTask(null);
                }}
                className="bg-transparent border-none text-2xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 p-1 flex items-center justify-center rounded-xl transition-all h-10 w-10 active:scale-95"
              >
                &times;
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-8 overflow-y-auto custom-scrollbar">
              <div className="mb-6">
                <label className="block mb-2 text-sm font-bold text-slate-700">
                  Note Check <span className="text-slate-400 font-normal ml-2">(Rich Text Editor)</span>
                </label>
                <div className="rounded-2xl border border-slate-200 overflow-hidden shadow-inner bg-white">
                  <ReactQuill
                    value={formData.note}
                    onChange={(value) => setFormData({ ...formData, note: value })}
                    className="h-36 mb-12"
                    theme="snow"
                  />
                </div>
              </div>

              <div className="mb-6">
                <label className="block mb-2 text-sm font-bold text-slate-700">
                  Message
                </label>
                <textarea
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm text-slate-800 outline-none focus:ring-4 focus:ring-indigo-50 focus:border-indigo-500 transition-all min-h-[100px] resize-y"
                  placeholder="Tell your team about the progress..."
                />
              </div>

              <div className="mb-6">
                <label className="block mb-2 text-sm font-bold text-slate-700">
                  Results Link
                </label>
                <input
                  type="text"
                  value={formData.link}
                  onChange={(e) => setFormData({ ...formData, link: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm text-slate-800 outline-none focus:ring-4 focus:ring-indigo-50 focus:border-indigo-500 transition-all"
                  placeholder="https://cloud.storage.com/your-result"
                />
              </div>

              <div className="mb-2">
                <label className="block mb-2 text-sm font-bold text-slate-700">
                  Attachments
                </label>
                <div className="border-2 border-dashed border-slate-200 rounded-2xl p-8 bg-slate-50 flex flex-col items-center justify-center gap-3 hover:border-indigo-400 hover:bg-slate-100/50 transition-all cursor-pointer group">
                  <div className="text-3xl grayscale opacity-30 group-hover:grayscale-0 group-hover:opacity-100 transition-all">📎</div>
                  <input
                    type="file"
                    multiple
                    onChange={handleFileChange}
                    className="w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-bold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 cursor-pointer"
                  />
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-2 px-6 text-center">
                    Drag & drop or click to upload relevant assets
                  </p>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-8 py-6 border-t border-slate-100 flex justify-end gap-3 bg-slate-50/50">
              <button
                onClick={() => {
                  setActionModal(null);
                  setActiveTask(null);
                }}
                className="px-6 py-2.5 rounded-xl border border-slate-200 bg-white font-bold text-sm text-slate-600 hover:bg-slate-50 hover:text-slate-800 transition-all active:scale-95 shadow-sm"
              >
                Cancel
              </button>
              <button
                onClick={handleModalSubmit}
                disabled={activeTask && actionLoading[activeTask._id]}
                className={`px-8 py-2.5 rounded-xl font-black text-sm text-white transition-all active:scale-95 shadow-lg ${actionModal === 'complete'
                  ? 'bg-emerald-500 hover:bg-emerald-600 shadow-emerald-200'
                  : 'bg-red-500 hover:bg-red-600 shadow-red-200'
                  } ${activeTask && actionLoading[activeTask._id] ? 'opacity-70 cursor-wait' : ''}`}
              >
                {(activeTask && actionLoading[activeTask._id]) ? 'Processing...' : (actionModal === 'complete' ? '✓ Complete Task' : 'Send Back')}
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default MyTasksList;
