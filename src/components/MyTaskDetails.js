import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { myTasksAPI, taskAPI, BASE_SERVER_URL } from '../services/api';
import { useToast } from '../context/ToastContext';
import { useCompany } from '../context/CompanyContext';
import { useAuth } from '../context/AuthContext';
import Layout from './Layout';
import PageHeader from './PageHeader';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';

const MyTaskDetails = () => {
  const { id: taskId } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const { state: companyState } = useCompany();
  const selectedCompanyId = companyState.selectedCompany?.id || 'personal';

  const [taskData, setTaskData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionLoading, setActionLoading] = useState(null);
  const [subtaskActionLoading, setSubtaskActionLoading] = useState({});
  const [actionModal, setActionModal] = useState(null); // 'complete', 'sendBack', 'completeSubtask'
  const [activeSubtaskId, setActiveSubtaskId] = useState(null);
  const [formData, setFormData] = useState({ note: '', message: '', link: '' });
  const [selectedFiles, setSelectedFiles] = useState([]);

  const { state: authState } = useAuth();
  const user = authState.user;
  const [showSubtaskForm, setShowSubtaskForm] = useState(false);
  const [newSubtaskTitle, setNewSubtaskTitle] = useState('');
  const [isSubmittingSubtask, setIsSubmittingSubtask] = useState(false);

  const getUserInitials = (user) => {
    if (!user || !user.name) return '?';
    const names = user.name.split(' ');
    return names.length >= 2 ? (names[0][0] + names[names.length - 1][0]).toUpperCase() : user.name.substring(0, 2).toUpperCase();
  };

  const getUserColor = (userId) => {
    const colors = ['#0052cc', '#00875a', '#ff8b00', '#6554c0', '#00b8d9', '#ff5630'];
    return colors[userId ? userId.charCodeAt(userId.length - 1) % colors.length : 0];
  };

  const getSubtaskAssignees = (st) => {
    const usersMap = new Map();
    if (st.roleAssignments) {
      st.roleAssignments.forEach(ra => ra.assignees?.forEach(a => usersMap.set(a._id || a, a)));
    }
    if (st.sequentialAssignees) {
      st.sequentialAssignees.forEach(sa => sa.user && usersMap.set(sa.user._id || sa.user, sa.user));
    }
    if (st.assignees) {
      st.assignees.forEach(a => usersMap.set(a._id || a, a));
    }
    return Array.from(usersMap.values()).filter(a => typeof a === 'object' && a.name);
  };

  const isUserAssignedToSubtask = (st) => {
    if (!user) return false;
    const currentUserId = user.id || user._id;
    if (!currentUserId) return false;

    // Check roleAssignments
    if (st.roleAssignments && st.roleAssignments.length > 0) {
      const assigned = st.roleAssignments.some(ra =>
        ra.assignees?.some(a => {
          const assigneeId = a._id || a;
          return assigneeId === currentUserId || assigneeId.toString() === currentUserId.toString();
        })
      );
      if (assigned) return true;
    }

    // Check sequentialAssignees
    if (st.sequentialAssignees && st.sequentialAssignees.length > 0) {
      const assigned = st.sequentialAssignees.some(sa => {
        const assigneeId = sa.user?._id || sa.user;
        return assigneeId === currentUserId || assigneeId?.toString() === currentUserId.toString();
      });
      if (assigned) return true;
    }

    // Check regular assignees
    if (st.assignees && st.assignees.length > 0) {
      const assigned = st.assignees.some(a => {
        const assigneeId = a._id || a;
        return assigneeId === currentUserId || assigneeId.toString() === currentUserId.toString();
      });
      if (assigned) return true;
    }

    return false;
  };

  const fetchTaskDetails = useCallback(async () => {
    try {
      setLoading(true);
      const response = await myTasksAPI.getById(taskId, selectedCompanyId);
      setTaskData(response.data);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to fetch task details');
      toast?.showToast?.('Failed to load task details', 'error');
    } finally {
      setLoading(false);
    }
  }, [taskId, selectedCompanyId, toast]);

  useEffect(() => {
    fetchTaskDetails();
  }, [fetchTaskDetails]);

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
      if (taskData.workflowType === 'sequential') {
        await myTasksAPI.pauseSequential(taskId);
      } else {
        await myTasksAPI.pause(taskId);
      }
      toast?.showToast?.('Task paused', 'success');
      fetchTaskDetails();
    } catch (err) {
      toast?.showToast?.(err.response?.data?.error || 'Failed to pause task', 'error');
    } finally {
      setActionLoading(null);
    }
  };

  const handleSubtaskStart = async (subtaskId) => {
    setSubtaskActionLoading(prev => ({ ...prev, [subtaskId]: 'starting' }));
    try {
      await myTasksAPI.start(subtaskId);
      toast?.showToast?.('Subtask started successfully', 'success');
      fetchTaskDetails();
    } catch (err) {
      toast?.showToast?.(err.response?.data?.error || 'Failed to start subtask', 'error');
    } finally {
      setSubtaskActionLoading(prev => ({ ...prev, [subtaskId]: null }));
    }
  };

  const handleSubtaskPause = async (subtaskId) => {
    setSubtaskActionLoading(prev => ({ ...prev, [subtaskId]: 'pausing' }));
    try {
      await myTasksAPI.pause(subtaskId);
      toast?.showToast?.('Subtask paused successfully', 'success');
      fetchTaskDetails();
    } catch (err) {
      toast?.showToast?.(err.response?.data?.error || 'Failed to pause subtask', 'error');
    } finally {
      setSubtaskActionLoading(prev => ({ ...prev, [subtaskId]: null }));
    }
  };

  const handleSubtaskCompleteClick = (subtaskId) => {
    setActiveSubtaskId(subtaskId);
    setActionModal('completeSubtask');
  };

  const handleCompleteClick = () => {
    setActionModal('complete');
  };

  const handleSendBackClick = () => {
    setActionModal('sendBack');
  };

  const handleModalSubmit = async () => {
    setActionLoading(actionModal);
    try {
      if (actionModal === 'complete') {
        await myTasksAPI.completeSequential(taskId, formData.note, formData.message, formData.link, selectedFiles);
        toast?.showToast?.('Task completed successfully', 'success');
      } else if (actionModal === 'completeSubtask') {
        await myTasksAPI.complete(activeSubtaskId, formData.note || 'Completed', selectedFiles);
        toast?.showToast?.('Subtask completed successfully', 'success');
      } else {
        await myTasksAPI.sendBackSequential(taskId, formData.note, formData.message, formData.link, selectedFiles);
        toast?.showToast?.('Task sent back successfully', 'success');
      }
      setActionModal(null);
      setActiveSubtaskId(null);
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

  const handleCreateSubtask = async () => {
    if (!newSubtaskTitle.trim() || !taskData?.task?.project?._id) return;

    setIsSubmittingSubtask(true);
    try {
      const projectId = taskData.task.project._id;

      let roleAssignments = [];
      let assignees = [];
      let useRoleWorkflow = false;

      if (taskData.workflowType === 'role' && taskData.steps?.current?.role) {
        roleAssignments = [{
          role: taskData.steps.current.role._id || taskData.steps.current.role,
          assignees: [user._id],
          order: 1
        }];
        useRoleWorkflow = true;
      } else {
        assignees = [user._id];
      }

      const payload = {
        title: newSubtaskTitle,
        parent: taskId,
        project: projectId,
        roleAssignments,
        assignees,
        useRoleWorkflow,
        priority: taskData.task.priority
      };

      await taskAPI.create(projectId, payload);
      toast?.showToast?.('Subtask created successfully', 'success');
      setNewSubtaskTitle('');
      setShowSubtaskForm(false);
      fetchTaskDetails();
    } catch (err) {
      console.error("Subtask creation error:", err, err.response?.data);
      const errorMsg = err.response?.data?.error || err.response?.data?.message || err.message || 'Failed to create subtask';
      toast?.showToast?.(errorMsg, 'error');
    } finally {
      setIsSubmittingSubtask(false);
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
      todo: 'bg-slate-100 text-slate-600 border-slate-200',
      pending: 'bg-slate-100 text-slate-600 border-slate-200',
      active: 'bg-indigo-50 text-indigo-600 border-indigo-100',
      in_progress: 'bg-indigo-50 text-indigo-600 border-indigo-100',
      paused: 'bg-amber-50 text-amber-600 border-amber-100',
      completed: 'bg-emerald-50 text-emerald-600 border-emerald-100',
      cancelled: 'bg-rose-50 text-rose-600 border-rose-100'
    };
    return statusMap[status] || 'bg-slate-100 text-slate-500';
  };

  const getStatusLabel = (status) => {
    const labelMap = {
      todo: 'To do',
      pending: 'To do',
      active: 'In Progress',
      in_progress: 'In Progress',
      paused: 'Paused',
      completed: 'Completed',
      cancelled: 'Cancelled'
    };
    return labelMap[status] || status;
  };

  if (loading && !taskData) {
    return (
      <Layout>
        <div className="max-w-5xl mx-auto px-6 py-24 text-center space-y-4">
          <div className="w-10 h-10 border-4 border-slate-200 border-t-indigo-600 rounded-full animate-spin mx-auto" />
          <p className="text-sm font-medium text-slate-500">Loading task details...</p>
        </div>
      </Layout>
    );
  }

  if (error || !taskData) {
    return (
      <Layout>
        <div className="max-w-3xl mx-auto my-24 bg-white rounded-2xl p-10 shadow-sm border border-rose-200 text-center space-y-4">
          <h2 className="text-2xl font-semibold text-rose-700">Task not found</h2>
          <p className="text-sm text-slate-600 max-w-xl mx-auto">{error || 'The requested task could not be loaded.'}</p>
          <button onClick={() => navigate('/my-tasks')} className="px-5 py-2.5 bg-slate-900 text-white rounded-lg font-medium text-sm hover:bg-slate-800 transition-colors">Back to Tasks</button>
        </div>
      </Layout>
    );
  }

  const { task, workflowType, allowedActions } = taskData;

  return (
    <Layout>
      <div className="max-w-7xl mx-auto py-8 px-6 space-y-8 pb-24">
        <PageHeader
          title={
            <div className="flex items-center gap-3">
              {allowedActions.canPause && (
                <div className="relative flex h-3 w-3 shrink-0">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-indigo-600"></span>
                </div>
              )}
              <span>{task.title}</span>
              {allowedActions.canPause && (
                <span className="px-2 py-0.5 bg-indigo-100 text-indigo-700 text-[10px] font-bold uppercase rounded-md tracking-wider animate-pulse">Running</span>
              )}
            </div>
          }
          subtitle={`Task details and workflow activity for ${task.project?.title || 'Standalone Project'}.`}
          icon="✅"
          stats={[
            { label: 'Priority', value: task.priority?.toUpperCase() },
            { label: 'Status', value: task.status?.name?.toUpperCase() }
          ]}
          actions={<button onClick={() => navigate('/my-tasks')} className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors">Back to Task Queue</button>}
        />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-8 space-y-8">
            {/* Description */}
            {task.description && (
              <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                <h3 className="text-xs font-semibold text-slate-600 uppercase tracking-wider border-b border-slate-200 pb-3">Task Description</h3>
                <div className="text-sm font-normal text-slate-700 leading-relaxed prose max-w-none" dangerouslySetInnerHTML={{ __html: task.description }} />
              </div>
            )}

            {/* Subtasks Section */}
            {taskData.subtasks && (
              <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm space-y-6">
                <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                  <h3 className="text-xs font-semibold text-slate-600 uppercase tracking-wider">Subtasks ({taskData.subtasks.length})</h3>
                  <button onClick={() => setShowSubtaskForm(!showSubtaskForm)} className="text-indigo-600 text-xs font-bold bg-indigo-50 px-3 py-1.5 rounded-lg hover:bg-indigo-100 transition border border-indigo-100 shadow-sm">+ Add Subtask</button>
                </div>

                {showSubtaskForm && (
                  <div className="bg-slate-50 p-6 rounded-xl border border-slate-200 space-y-4">
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-500 uppercase ml-1">Subtask Title</label>
                      <input type="text" value={newSubtaskTitle} onChange={e => setNewSubtaskTitle(e.target.value)} className="w-full px-4 py-2 border border-slate-200 rounded-lg text-sm bg-white" placeholder="E.g., Login Page, Write Tests..." autoFocus />
                    </div>
                    <div className="bg-indigo-50 border border-indigo-100 p-3 rounded-lg flex items-center gap-2">
                      <span className="text-indigo-700 text-xs font-medium">ℹ️ You will be automatically assigned to this subtask inheriting your active task role.</span>
                    </div>
                    <div className="flex gap-3 justify-end pt-2">
                      <button onClick={() => setShowSubtaskForm(false)} className="px-4 py-2 text-xs font-bold text-slate-500 hover:bg-slate-200 rounded-lg">Cancel</button>
                      <button onClick={handleCreateSubtask} disabled={isSubmittingSubtask} className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-xs font-bold hover:bg-indigo-700 shadow-sm disabled:opacity-50">
                        {isSubmittingSubtask ? 'Adding...' : 'Save Subtask'}
                      </button>
                    </div>
                  </div>
                )}

                <div className="space-y-4">
                  {taskData.subtasks.length === 0 && !showSubtaskForm && (
                    <p className="text-sm text-slate-400 text-center py-6 border border-dashed border-slate-200 rounded-xl bg-slate-50">No subtasks found.</p>
                  )}
                  {(() => {
                    const getEffectiveStatus = (st) => {
                      const currentUserId = user?.id || user?._id;

                      if (currentUserId) {
                        // Check sequentialAssignees for current user
                        if (st.sequentialAssignees && st.sequentialAssignees.length > 0) {
                          const myAssignment = st.sequentialAssignees.find(sa => {
                            const assigneeId = sa.user?._id || sa.user;
                            return assigneeId === currentUserId || assigneeId?.toString() === currentUserId.toString();
                          });
                          if (myAssignment) return myAssignment.status;
                          // If it uses sequential and we are not in it, we don't share the global status
                          return 'unassigned';
                        }

                        // Check roleAssignments for current user
                        if (st.roleAssignments && st.roleAssignments.length > 0) {
                          const myRoleAssignment = st.roleAssignments.find(ra => 
                            ra.assignees?.some(a => {
                              const assigneeId = a._id || a;
                              return assigneeId === currentUserId || assigneeId?.toString() === currentUserId.toString();
                            })
                          );
                          if (myRoleAssignment) return myRoleAssignment.status;
                          // If it uses role workflow and we are not in it, we don't share the global status
                          return 'unassigned';
                        }
                      }

                      // Fall back to task-level status (only for generic shared assignees)
                      const raw = st.status?.slug || st.status?.name || 'todo';
                      return typeof raw === 'string' ? raw.toLowerCase().trim() : 'todo';
                    };

                    // Check if any subtask is currently active/in-progress FOR THE CURRENT USER
                    const hasActiveSubtask = taskData.subtasks.some(st => {
                      const stStatusNorm = getEffectiveStatus(st).replace(/[\s\-_]/g, '');
                      const isCompleted = ['completed', 'done'].includes(stStatusNorm);
                      const isPaused = !isCompleted && Boolean(st.pausedAt) && !st.activeUser;
                      const isActive = !isCompleted && !isPaused && (['active', 'inprogress'].includes(stStatusNorm) || Boolean(st.activeUser));
                      return isActive;
                    });

                    return taskData.subtasks.map(st => {
                      const stStatusRaw = getEffectiveStatus(st);
                      // Normalize for comparison
                      const stStatusNorm = stStatusRaw.replace(/[\s\-_]/g, '');

                      const isStLoading = subtaskActionLoading[st._id];
                      const isCompleted = ['completed', 'done'].includes(stStatusNorm);
                      // Paused state is determined by pausedAt field (independent of project's status taxonomy)
                      const isPaused = !isCompleted && Boolean(st.pausedAt) && !st.activeUser;
                      const isActive = !isCompleted && !isPaused && (['active', 'inprogress'].includes(stStatusNorm) || Boolean(st.activeUser));
                      const isPending = !isActive && !isPaused && !isCompleted;
                      const isAssignedToThisSt = isUserAssignedToSubtask(st);

                      const currentUserIdStr = (user?.id || user?._id)?.toString();
                      const activeUserObj = st.activeUser || st.activeStartedBy;
                      const activeUserId = (activeUserObj?._id || activeUserObj?.id || activeUserObj)?.toString();
                      const isRunningByMe = isActive && Boolean(activeUserId && currentUserIdStr && activeUserId === currentUserIdStr);
                      const isRunningByOther = isActive && Boolean(activeUserId && currentUserIdStr && activeUserId !== currentUserIdStr);

                      const subtaskAssignees = getSubtaskAssignees(st);

                      // 1. Parent task MUST be running (canPause is true)
                      // 2. No other subtask is active OR this subtask itself is paused (can be resumed)
                      // 3. User must be explicitly assigned to this subtask
                      // 4. If currently active, only the active user can resume
                      const canStart = isAssignedToThisSt && allowedActions.canPause && (!hasActiveSubtask || (isPaused && !isRunningByOther));

                      const initials = (name) => (name || '?').split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
                      const avatarColors = ['bg-orange-500', 'bg-sky-500', 'bg-rose-500', 'bg-violet-500', 'bg-emerald-500', 'bg-amber-500'];
                      const colorFor = (id) => avatarColors[(id?.toString() || '').split('').reduce((s, c) => s + c.charCodeAt(0), 0) % avatarColors.length];

                      return (
                        <div key={st._id} className="border border-slate-200 rounded-xl p-4 bg-white shadow-sm space-y-3">
                          <div className="flex items-center justify-between gap-4">
                            <h4 className="font-bold text-slate-800 text-sm flex items-center gap-2 min-w-0">
                              <span className="text-slate-400 text-xs">↳</span>
                              <span className="truncate">{st.title}</span>
                            </h4>
                          </div>

                          {/* Assignees + active indicator */}
                          {(subtaskAssignees.length > 0 || activeUserObj) && (
                            <div className="flex items-center justify-between gap-3 flex-wrap">
                              <div className="flex items-center gap-2 flex-wrap">
                                {subtaskAssignees.map(a => {
                                  const aId = (a._id || a.id)?.toString();
                                  const isThisActive = isActive && activeUserId && aId === activeUserId;
                                  const isThisPaused = isPaused && activeUserId && aId === activeUserId;
                                  const isThisCompleter = isCompleted && st.completedBy && aId === st.completedBy._id.toString();
                                  return (
                                    <div key={aId} className={`flex items-center gap-1.5 pl-1 pr-2.5 py-1 rounded-full border ${isThisActive ? 'border-emerald-300 bg-emerald-50' : isThisPaused ? 'border-amber-300 bg-amber-50' : isThisCompleter ? 'border-emerald-400 bg-emerald-100' : 'border-slate-200 bg-slate-50'}`}>
                                      <div className={`w-5 h-5 rounded-full ${isThisCompleter ? 'bg-emerald-500' : colorFor(aId)} text-white text-[9px] font-bold flex items-center justify-center`}>
                                        {initials(a.name)}
                                      </div>
                                      <span className={`text-[11px] font-medium ${isThisCompleter ? 'text-emerald-800' : isThisPaused ? 'text-amber-800' : 'text-slate-700'}`}>{a.name}</span>
                                      {isThisActive && (
                                        <span className="flex items-center gap-1 ml-0.5">
                                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                                          <span className="text-[9px] font-bold text-emerald-700 uppercase tracking-wide">Active</span>
                                        </span>
                                      )}
                                      {isThisPaused && (
                                        <span className="flex items-center gap-1 ml-0.5">
                                          <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                                          <span className="text-[9px] font-bold text-amber-700 uppercase tracking-wide">Paused</span>
                                        </span>
                                      )}
                                      {isThisCompleter && (
                                        <span className="flex items-center gap-1 ml-0.5">
                                          <span className="text-[9px] font-bold text-emerald-700 uppercase tracking-wide whitespace-nowrap">Completed</span>
                                        </span>
                                      )}
                                    </div>
                                  );
                                })}
                              </div>

                              <div className="flex items-center gap-2">
                          
                                {isActive && isRunningByMe && (
                                  <>
                                    <button
                                      onClick={(e) => { e.stopPropagation(); handleSubtaskPause(st._id); }}
                                      disabled={isStLoading}
                                      className="px-3.5 py-1.5 bg-amber-500 text-white rounded-lg text-xs font-bold hover:bg-amber-600 transition-colors shadow-sm disabled:opacity-50"
                                    >
                                      {isStLoading === 'pausing' ? 'Pausing...' : 'Pause'}
                                    </button>
                                    <button
                                      onClick={(e) => { e.stopPropagation(); handleSubtaskCompleteClick(st._id); }}
                                      disabled={isStLoading}
                                      className="px-3.5 py-1.5 bg-slate-900 text-white rounded-lg text-xs font-bold hover:bg-slate-800 transition-colors shadow-sm disabled:opacity-50"
                                    >
                                      Complete
                                    </button>
                                  </>
                                )}

                                {!isActive && !isCompleted && canStart && (
                                  <button
                                    onClick={(e) => { e.stopPropagation(); handleSubtaskStart(st._id); }}
                                    disabled={isStLoading}
                                    className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-colors shadow-sm disabled:opacity-50 ${isStLoading ? 'bg-slate-100 text-slate-400' : isPaused ? 'bg-emerald-600 text-white hover:bg-emerald-700' : 'bg-indigo-600 text-white hover:bg-indigo-700'}`}
                                  >
                                    {isStLoading === 'starting' ? 'Starting...' : isPaused ? 'Resume' : 'Start'}
                                  </button>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    });
                  })()}
                </div>
              </div>
            )}

            {/* Workflow Chain */}
            {workflowType === 'sequential' && taskData.sequentialAssignees && (
              <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm space-y-6">
                <h3 className="text-xs font-semibold text-slate-600 uppercase tracking-wider border-b border-slate-200 pb-3">Work Allocation Sequence</h3>
                <div className="grid grid-cols-1 gap-6 max-w-2xl mx-auto">
                  {taskData.sequentialAssignees.map((assignee, idx) => (
                    <div key={idx} className={`p-6 rounded-xl border relative ${assignee.isCurrent ? 'bg-indigo-50 border-indigo-200 shadow-sm' : 'bg-slate-50 border-slate-200'}`}>
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-4">
                          <span className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-semibold ${assignee.isCurrent ? 'bg-indigo-600 text-white' : 'bg-white text-slate-500 border border-slate-200'}`}>{idx + 1}</span>
                          <span className={`text-base font-semibold ${assignee.isCurrent ? 'text-indigo-900' : 'text-slate-700'}`}>{assignee.user.name}</span>
                          {assignee.isCurrent && <span className="text-[11px] font-medium text-indigo-700 ml-1">Current Assignee</span>}
                        </div>
                        <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColorClasses(assignee.status)}`}>{getStatusLabel(assignee.status)}</span>
                      </div>
                      {(assignee.startedAt || assignee.completedAt) && (
                        <div className="flex gap-8 mt-4 pt-4 border-t border-slate-200">
                          {assignee.startedAt && <div className="space-y-1"><span className="text-xs text-slate-500 block font-medium">Started</span><span className="text-xs font-medium text-slate-700">{formatDate(assignee.startedAt)}</span></div>}
                          {assignee.completedAt && <div className="space-y-1"><span className="text-xs text-slate-500 block font-medium">Completed</span><span className="text-xs font-medium text-slate-700">{formatDate(assignee.completedAt)}</span></div>}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Discussion & Updates */}
            {taskData.activity && taskData.activity.length > 0 && (
              <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm space-y-6">
                <h3 className="text-xs font-semibold text-slate-600 uppercase tracking-wider border-b border-slate-200 pb-3">Activity Timeline</h3>
                <div className="space-y-8">
                  {taskData.activity.map((item, idx) => (
                    <div key={item._id} className="relative pl-8 border-l-2 border-slate-200">
                      <div className="absolute -left-[7px] top-1 w-3 h-3 rounded-full bg-white border-2 border-indigo-400" />
                      <div className="flex flex-col sm:flex-row justify-between mb-4 gap-4">
                        <div className="font-medium text-slate-700 text-sm flex items-center gap-2 flex-wrap">
                          <span className="text-indigo-700">{item.performedBy?.name || 'System'}</span>
                          <span className="text-slate-400">→</span>
                          <span className="text-slate-600 capitalize text-sm">{item.action.replace(/_/g, ' ')}</span>
                          {item.task && item.task._id !== taskId && (
                            <>
                              <span className="text-slate-400 text-[10px]">on subtask</span>
                              <span className="text-slate-700 font-bold text-[10px] bg-slate-100 px-1.5 py-0.5 rounded-md border border-slate-200">{item.task.title}</span>
                            </>
                          )}
                        </div>
                        <span className="text-xs font-medium text-slate-500">{formatDate(item.createdAt)}</span>
                      </div>
                      {item.note && (
                        <div className="bg-slate-50 p-5 rounded-xl border border-slate-200 mb-4">
                          <div className="text-slate-600 text-sm font-medium leading-relaxed prose max-w-none" dangerouslySetInnerHTML={{ __html: item.note }} />
                        </div>
                      )}
                      {item.message && <p className="p-4 bg-indigo-50 border-l-4 border-indigo-400 rounded-r-lg mb-4 text-sm text-indigo-900">"{item.message}"</p>}
                      <div className="flex flex-wrap gap-3">
                        {item.metadata?.link && <a href={item.metadata.link} target="_blank" rel="noopener noreferrer" className="px-4 py-2 bg-slate-100 rounded-lg text-xs font-medium text-indigo-700 hover:bg-indigo-100 transition-colors">View Reference ↗</a>}
                        {item.documents?.map((doc, dIdx) => (
                          <a key={dIdx} href={`${BASE_SERVER_URL}/${doc.path}`} target="_blank" rel="noopener noreferrer" className="px-4 py-2 bg-emerald-50 border border-emerald-200 rounded-lg text-xs font-medium text-emerald-700 hover:bg-emerald-100 transition-colors flex items-center gap-2">Artifact: {doc.originalName}</a>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="lg:col-span-4 space-y-6">


            <div className={`p-6 rounded-2xl shadow-sm space-y-5 border transition-all duration-300 ${allowedActions.canPause ? 'bg-gradient-to-br from-emerald-50 to-indigo-50 border-indigo-300 ring-2 ring-indigo-200/50' : 'bg-white border-slate-200'}`}>
              {/* Header */}
              {allowedActions.canPause ? (
                <div className="flex items-center justify-between border-b border-indigo-200 pb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="relative flex h-3 w-3">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                    </div>
                    <h3 className="text-xs font-bold text-emerald-800 uppercase tracking-wider">Currently Running</h3>
                  </div>
                  <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 text-[10px] font-black uppercase rounded-md tracking-widest border border-emerald-200">LIVE</span>
                </div>
              ) : (
                <h3 className="text-xs font-semibold text-slate-600 uppercase tracking-wider border-b border-slate-200 pb-3">Task Actions</h3>
              )}

              <div className="grid grid-cols-1 gap-3">
                {/* Running state: Pause + Complete are primary */}
                {allowedActions.canPause && (
                  <button
                    onClick={handlePause}
                    disabled={actionLoading}
                    className="w-full py-3 bg-amber-500 text-white rounded-xl font-semibold text-sm hover:bg-amber-600 active:scale-95 transition-all shadow-sm disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 5.25v13.5m-7.5-13.5v13.5" />
                    </svg>
                    {actionLoading === 'pausing' ? 'Pausing...' : 'Pause Task'}
                  </button>
                )}
                {allowedActions.canComplete && (
                  <button
                    onClick={handleCompleteClick}
                    disabled={actionLoading}
                    className={`w-full py-3 text-white rounded-xl font-semibold text-sm active:scale-95 transition-all shadow-sm disabled:opacity-50 flex items-center justify-center gap-2 ${allowedActions.canPause ? 'bg-indigo-600 hover:bg-indigo-700' : 'bg-slate-900 hover:bg-slate-800'}`}
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                    </svg>
                    {actionLoading === 'completing' ? 'Submitting...' : 'Complete Task'}
                  </button>
                )}
                {/* Not running: show Start */}
                {allowedActions.canStart && (
                  <button
                    onClick={handleStart}
                    disabled={actionLoading}
                    className="w-full py-3 bg-indigo-600 text-white rounded-xl font-semibold text-sm hover:bg-indigo-700 active:scale-95 transition-all shadow-sm disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.348a1.125 1.125 0 010 1.971l-11.54 6.347c-.75.412-1.667-.13-1.667-.986V5.653z" />
                    </svg>
                    {actionLoading === 'starting' ? 'Starting...' : 'Start Task'}
                  </button>
                )}
                {allowedActions.canSendBack && (
                  <button onClick={handleSendBackClick} disabled={actionLoading} className="w-full py-2.5 bg-white border border-rose-200 text-rose-700 rounded-xl font-semibold text-sm hover:bg-rose-50 active:scale-95 transition-all disabled:opacity-50">Send Back</button>
                )}
              </div>

              {/* No actions available */}
              {!allowedActions.canStart && !allowedActions.canPause && !allowedActions.canComplete && (
                <p className="text-xs text-slate-400 text-center italic pt-1">No actions available for this task.</p>
              )}
            </div>
            {/* Assignments Block */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
              <h3 className="text-xs font-semibold text-slate-600 uppercase tracking-wider border-b border-slate-200 pb-3">All Assignees</h3>

              {/* Role Workflow Assignees */}
              {task.useRoleWorkflow && task.roleAssignments && task.roleAssignments.length > 0 && (
                <div className="space-y-2">
                  {task.roleAssignments.map((ra, idx) => {
                    const isRunning = (ra.status === 'active' || ra.status === 'in_progress');
                    const isCompleted = ra.status === 'completed';
                    const isPending = !isRunning && !isCompleted;
                    return (
                      <div key={ra._id || idx} className={`rounded-xl border p-3 transition-all ${isRunning ? 'bg-emerald-50 border-emerald-300 shadow-sm' :
                        isCompleted ? 'bg-slate-50 border-slate-100 opacity-70' :
                          'bg-slate-50 border-slate-100'
                        }`}>
                        {/* Role header */}
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                            <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[8px] text-white ${isRunning ? 'bg-emerald-500' : isCompleted ? 'bg-indigo-500' : 'bg-slate-300'
                              }`}>{idx + 1}</span>
                            {ra.role?.name || 'Role'}
                          </span>
                          {isRunning && (
                            <div className="flex items-center gap-1.5">
                              <div className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                              </div>
                              <span className="text-[9px] font-black text-emerald-700 uppercase tracking-widest">Running</span>
                            </div>
                          )}
                          {isCompleted && <span className="text-[9px] font-bold text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded">Done ✓</span>}
                        </div>
                        {/* Assignees in this role */}
                        <div className="flex flex-col gap-1.5">
                          {ra.assignees?.map(a => (
                            <div key={a._id || a} className={`flex items-center gap-2 px-2 py-1.5 rounded-lg ${isRunning ? 'bg-white border border-emerald-200' : 'bg-white border border-slate-100'
                              }`}>
                              <div className={`w-6 h-6 rounded-md flex items-center justify-center text-[10px] font-black uppercase ${isRunning ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'
                                }`}>{(a.name || '?').charAt(0)}</div>
                              <span className={`text-xs font-semibold ${isRunning ? 'text-emerald-800' : 'text-slate-600'
                                }`}>{a.name || 'User'}</span>
                              {isRunning && <span className="ml-auto text-[8px] font-black text-emerald-600 uppercase">● Active</span>}
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Sequential Workflow Assignees */}
              {task.useSequentialWorkflow && task.sequentialAssignees && task.sequentialAssignees.length > 0 && (
                <div className="space-y-2">
                  {task.sequentialAssignees.map((sa, idx) => {
                    const isRunning = sa.status === 'in_progress' || sa.status === 'active';
                    const isCompleted = sa.status === 'completed';
                    return (
                      <div key={sa._id || idx} className={`flex items-center justify-between px-3 py-2.5 rounded-xl border ${isRunning ? 'bg-emerald-50 border-emerald-300 shadow-sm' :
                        isCompleted ? 'bg-slate-50 border-slate-100 opacity-70' :
                          'bg-slate-50 border-slate-100'
                        }`}>
                        <div className="flex items-center gap-2">
                          <div className={`w-6 h-6 rounded-md flex items-center justify-center text-[9px] font-black uppercase ${isRunning ? 'bg-emerald-100 text-emerald-700' : isCompleted ? 'bg-indigo-100 text-indigo-600' : 'bg-slate-200 text-slate-500'
                            }`}>{(sa.user?.name || '?').charAt(0)}</div>
                          <span className={`text-xs font-semibold ${isRunning ? 'text-emerald-800' : 'text-slate-700'
                            }`}>{sa.user?.name || 'User'}</span>
                        </div>
                        {isRunning && (
                          <div className="flex items-center gap-1.5">
                            <div className="relative flex h-2 w-2">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                            </div>
                            <span className="text-[9px] font-black text-emerald-700 uppercase">Running</span>
                          </div>
                        )}
                        {isCompleted && <span className="text-[9px] font-bold text-indigo-600">Done ✓</span>}
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Generic Assignees (no workflow) */}
              {task.assignees && task.assignees.length > 0 && !task.useRoleWorkflow && !task.useSequentialWorkflow && (
                <div className="flex flex-col gap-2">
                  {task.assignees.map(a => (
                    <div key={a._id} className="flex items-center gap-2 p-2 rounded-lg border border-slate-100 bg-slate-50">
                      <div className="w-6 h-6 rounded-md bg-slate-200 text-slate-600 flex items-center justify-center text-[10px] font-bold uppercase">{a.name?.charAt(0) || '?'}</div>
                      <span className="text-xs font-semibold text-slate-700">{a.name || 'User'}</span>
                    </div>
                  ))}
                </div>
              )}

              {!task.useRoleWorkflow && !task.useSequentialWorkflow && !task.assignees?.length && (
                <p className="text-xs text-slate-400 italic">No members assigned.</p>
              )}
            </div>

          </div>
        </div>
      </div>

      {/* Action Modals */}
      {actionModal && (
        <div className="fixed inset-0 bg-slate-900/35 backdrop-blur-sm flex items-center justify-center z-[1000] p-6">
          <div className="bg-white rounded-2xl w-full max-w-4xl p-8 lg:p-10 shadow-xl border border-slate-200 overflow-hidden">
            <div className="flex justify-between items-center mb-8">
              <div className="flex items-center gap-4">
                <div className={`w-11 h-11 rounded-lg flex items-center justify-center ${actionModal === 'complete' || actionModal === 'completeSubtask' ? 'bg-indigo-100 text-indigo-700' : 'bg-rose-100 text-rose-700'}`}>
                  {actionModal === 'complete' || actionModal === 'completeSubtask' ? '✓' : '↩'}
                </div>
                <h3 className="text-xl font-semibold text-slate-800">
                  {actionModal === 'complete' || actionModal === 'completeSubtask' ? 'Submit Task Completion' : 'Request Revision'}
                </h3>
              </div>
              <button onClick={() => { setActionModal(null); setActiveSubtaskId(null); }} className="w-9 h-9 flex items-center justify-center bg-slate-100 rounded-lg text-slate-500 hover:bg-slate-200 transition-colors">×</button>
            </div>

            <div className="space-y-8 max-h-[60vh] overflow-y-auto pr-2">
              <div className="space-y-3">
                <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider ml-1">Internal Notes (Private)</label>
                <div className="rounded-xl border border-slate-200 overflow-hidden bg-white">
                  <ReactQuill value={formData.note} onChange={(val) => setFormData({ ...formData, note: val })} className="h-40" theme="snow" placeholder="Document your progress or notes..." />
                  <div className="h-8" />
                </div>
              </div>

              <div className="space-y-3">
                <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider ml-1">Message for Next Person</label>
                <textarea value={formData.message} onChange={(e) => setFormData({ ...formData, message: e.target.value })} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-700 outline-none focus:bg-white focus:border-indigo-400 transition-colors min-h-[100px] resize-none" placeholder="Add a message for the next person in the workflow..." />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-3">
                  <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider ml-1">Resource Link</label>
                  <input type="text" value={formData.link} onChange={(e) => setFormData({ ...formData, link: e.target.value })} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm font-medium text-indigo-700 outline-none focus:bg-white focus:border-indigo-400 transition-colors" placeholder="https://link.com" />
                </div>
                <div className="space-y-3">
                  <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider ml-1">Upload Documents</label>
                  <div className="relative group/file">
                    <input type="file" multiple onChange={handleFileChange} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" />
                    <div className="px-6 py-3 bg-slate-50 border-2 border-dashed border-slate-300 rounded-xl text-center group-hover/file:bg-indigo-50 group-hover/file:border-indigo-300 transition-colors">
                      <span className="text-xs font-medium text-slate-600">{selectedFiles.length > 0 ? `${selectedFiles.length} files selected` : 'Click to upload'}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-4 pt-8 mt-8 border-t border-slate-100">
              <button onClick={() => { setActionModal(null); setActiveSubtaskId(null); }} className="px-5 py-2.5 text-sm font-medium text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors">Cancel</button>
              <button onClick={handleModalSubmit} disabled={actionLoading} className={`px-8 py-2.5 rounded-lg font-medium text-sm text-white transition-colors disabled:opacity-50 ${actionModal === 'complete' || actionModal === 'completeSubtask' ? 'bg-indigo-600 hover:bg-indigo-700' : 'bg-rose-600 hover:bg-rose-700'}`}>{actionLoading ? 'Processing...' : (actionModal === 'complete' || actionModal === 'completeSubtask' ? 'Submit Completion' : 'Confirm Return')}</button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default MyTaskDetails;
