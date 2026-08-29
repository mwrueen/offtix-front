import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { myTasksAPI, taskAPI, getAssetUrl } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { useCompany } from '../../context/CompanyContext';
import { useAuth } from '../../context/AuthContext';
import Layout from '../layout/Layout';
import PageHeader from '../layout/PageHeader';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import GenerateAITasksModal from './GenerateAITasksModal';

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
  const [actionModal, setActionModal] = useState(null); // 'complete', 'sendBack', 'completeSubtask', 'editActivity'
  const [activeSubtaskId, setActiveSubtaskId] = useState(null);
  const [editActivityId, setEditActivityId] = useState(null);
  const [viewingActivity, setViewingActivity] = useState(null);
  const [formData, setFormData] = useState({ note: '', message: '', link: '' });
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [existingDocs, setExistingDocs] = useState([]);

  const { state: authState } = useAuth();
  const user = authState.user;

  const isPremiumUser = user?.role === 'superadmin' ||
                        user?.subscription?.plan === 'premium' ||
                        companyState?.selectedCompany?.subscription?.plan === 'premium';

  const [showSubtaskForm, setShowSubtaskForm] = useState(false);
  const [showAISubtasksModal, setShowAISubtasksModal] = useState(false);
  const [newSubtaskTitle, setNewSubtaskTitle] = useState('');
  const [isSubmittingSubtask, setIsSubmittingSubtask] = useState(false);

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

  const handleEditActivityClick = (activity) => {
    setEditActivityId(activity._id);
    setFormData({
      note: activity.note || '',
      message: activity.message || '',
      link: activity.metadata?.link || ''
    });
    setExistingDocs(activity.documents || []);
    setSelectedFiles([]);
    setActionModal('editActivity');
  };


  const handleModalSubmit = async () => {
    setActionLoading(actionModal);
    try {
      if (actionModal === 'complete') {
        if (taskData.workflowType === 'sequential') {
          await myTasksAPI.completeSequential(taskId, formData.note, formData.message, formData.link, selectedFiles);
        } else {
          await myTasksAPI.complete(taskId, formData.note, formData.message, formData.link, selectedFiles);
        }
        toast?.showToast?.('Task completed successfully', 'success');
      } else if (actionModal === 'completeSubtask') {
        await myTasksAPI.complete(activeSubtaskId, formData.note || 'Completed', formData.message, formData.link, selectedFiles);
        toast?.showToast?.('Subtask completed successfully', 'success');
      } else if (actionModal === 'editActivity') {
        const keepDocIds = existingDocs.map(d => d._id || d.filename).filter(Boolean);
        await myTasksAPI.editActivity(editActivityId, formData.note, formData.message, formData.link, selectedFiles, keepDocIds);
        toast?.showToast?.('Completion details updated successfully', 'success');
      } else {
        if (taskData.workflowType === 'sequential') {
          await myTasksAPI.sendBackSequential(taskId, formData.note, formData.message, formData.link, selectedFiles);
        } else {
          await myTasksAPI.sendBack(taskId, formData.note, formData.message, formData.link, selectedFiles);
        }
        toast?.showToast?.('Task sent back successfully', 'success');
      }
      setActionModal(null);
      setActiveSubtaskId(null);
      setEditActivityId(null);
      setFormData({ note: '', message: '', link: '' });
      setSelectedFiles([]);
      fetchTaskDetails();
    } catch (err) {
      toast?.showToast?.(err.response?.data?.error || `Failed to process action`, 'error');
    } finally {
      setActionLoading(null);
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

  const handleGenerateAISubtasksSubmit = async (generatedSubtasks) => {
    if (!taskData?.task?.project?._id) return;
    
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

      const promises = generatedSubtasks.map(st => {
        const payload = {
          title: st.title,
          description: st.description,
          parent: taskId,
          project: projectId,
          roleAssignments,
          assignees,
          useRoleWorkflow,
          priority: taskData.task.priority
        };
        return taskAPI.create(projectId, payload);
      });

      await Promise.all(promises);
      toast?.showToast?.('AI subtasks created successfully', 'success');
      fetchTaskDetails();
    } catch (err) {
      console.error("AI Subtasks creation error:", err);
      toast?.showToast?.('Failed to create AI subtasks', 'error');
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
                  <div className="flex items-center gap-2">
                    <button onClick={() => setShowAISubtasksModal(true)} className="text-purple-600 text-xs font-bold bg-purple-50 px-3 py-1.5 rounded-lg hover:bg-purple-100 transition border border-purple-100 shadow-sm">✨ Generate AI Subtasks</button>
                    <button onClick={() => setShowSubtaskForm(!showSubtaskForm)} className="text-indigo-600 text-xs font-bold bg-indigo-50 px-3 py-1.5 rounded-lg hover:bg-indigo-100 transition border border-indigo-100 shadow-sm">+ Add Subtask</button>
                  </div>
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
                      const isAssignedToThisSt = isUserAssignedToSubtask(st);

                      const completionActivity = taskData.activity?.find(a => {
                        const aTaskId = (a.task?._id || a.task)?.toString();
                        const stId = (st._id || st.id)?.toString();
                        return aTaskId === stId && a.action === 'completed';
                      });

                      const completionDocs = completionActivity?.documents || completionActivity?.files || st.documents || [];
                      const completionLink = completionActivity?.metadata?.link || completionActivity?.link || st.link;


                      const currentUserIdStr = (user?.id || user?._id)?.toString();
                      const activeUserObj = st.activeUser || st.activeStartedBy;
                      const activeUserId = (activeUserObj?._id || activeUserObj?.id || activeUserObj)?.toString();
                      const isRunningByMe = isActive && isAssignedToThisSt && (!activeUserId || activeUserId === currentUserIdStr);
                      const isRunningByOther = isActive && activeUserId && activeUserId !== currentUserIdStr;

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
                                  const isThisCompleter = isCompleted && (st.completedBy ? aId === st.completedBy._id?.toString() : true);
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
                                {isCompleted && (
                                  <div className="px-3.5 py-1.5 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-lg text-xs font-bold shadow-sm flex items-center gap-1.5 cursor-default">
                                    <span>✓</span>
                                    <span>Completed</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          )}

                          {isCompleted && (completionActivity || completionDocs.length > 0 || completionLink) && (
                            <div className="mt-4 p-4 bg-slate-50 rounded-xl border border-slate-200 shadow-2xs">
                              <div className="flex items-center justify-between mb-3 border-b border-slate-200 pb-2">
                                <div className="flex items-center gap-2">
                                  <h5 className="text-xs font-bold text-slate-800 uppercase tracking-tight">Completion Details</h5>
                                  {completionDocs.length > 0 && (
                                    <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 font-extrabold text-[10px] rounded-full border border-emerald-200">
                                      📎 {completionDocs.length} File{completionDocs.length === 1 ? '' : 's'}
                                    </span>
                                  )}
                                </div>
                                <div className="flex items-center gap-2">
                                  {completionActivity && (
                                    <button
                                      onClick={() => setViewingActivity({ title: st.title, activity: completionActivity, docs: completionDocs, link: completionLink })}
                                      className="text-[10px] font-bold text-indigo-700 hover:text-indigo-900 bg-indigo-50 hover:bg-indigo-100 px-2.5 py-1 rounded-md border border-indigo-200/80 transition-colors"
                                    >
                                      🔍 View Full Details
                                    </button>
                                  )}
                                  {completionActivity && (completionActivity.performedBy?._id || completionActivity.performedBy)?.toString() === (user?._id || user?.id)?.toString() && (
                                    <button 
                                      onClick={() => handleEditActivityClick(completionActivity)}
                                      className="text-[10px] font-bold text-slate-600 hover:text-slate-900 bg-white hover:bg-slate-100 border border-slate-200 px-2.5 py-1 rounded-md transition-colors"
                                    >
                                      Edit
                                    </button>
                                  )}
                                </div>
                              </div>
                              {completionActivity?.note && (
                                <div className="text-xs text-slate-700 prose max-w-none mb-3 bg-white p-3 rounded-lg border border-slate-200/60" dangerouslySetInnerHTML={{ __html: completionActivity.note }} />
                              )}
                              {completionActivity?.message && completionActivity.message !== '[object File]' && (
                                <div className="text-xs text-slate-600 italic bg-white p-2.5 rounded-lg border border-slate-200/60 mb-3">"{completionActivity.message}"</div>
                              )}
                              <div className="flex flex-wrap items-center gap-2 mt-3 pt-2 border-t border-slate-200/60">
                                {completionLink && (
                                  <a href={completionLink} target="_blank" rel="noopener noreferrer" className="px-3 py-1.5 bg-indigo-600 text-white rounded-lg text-[11px] font-bold shadow-xs hover:bg-indigo-700 transition-all flex items-center gap-1.5">
                                    <span>🔗</span>
                                    <span>View Deliverable Link ↗</span>
                                  </a>
                                )}
                                {completionDocs.map((doc, dIdx) => (
                                  <a key={dIdx} href={getAssetUrl(doc.path || doc.url)} target="_blank" rel="noopener noreferrer" className="px-3 py-1.5 bg-emerald-600 text-white rounded-lg text-[11px] font-bold shadow-xs hover:bg-emerald-700 transition-all flex items-center gap-1.5">
                                    <span>📄</span>
                                    <span>{doc.originalName || doc.filename || `Attachment ${dIdx + 1}`} ↗</span>
                                  </a>
                                ))}
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
                      {item.message && item.message !== '[object File]' && <p className="p-4 bg-indigo-50 border-l-4 border-indigo-400 rounded-r-lg mb-4 text-sm text-indigo-900">"{item.message}"</p>}
                      <div className="flex flex-wrap gap-3">
                        {item.metadata?.link && <a href={item.metadata.link} target="_blank" rel="noopener noreferrer" className="px-4 py-2 bg-slate-100 rounded-lg text-xs font-medium text-indigo-700 hover:bg-indigo-100 transition-colors">View Reference ↗</a>}
                        {item.documents?.map((doc, dIdx) => (
                          <a key={dIdx} href={getAssetUrl(doc.path)} target="_blank" rel="noopener noreferrer" className="px-4 py-2 bg-emerald-50 border border-emerald-200 rounded-lg text-xs font-medium text-emerald-700 hover:bg-emerald-100 transition-colors flex items-center gap-2">Artifact: {doc.originalName}</a>
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
        <div className="fixed inset-0 bg-slate-900/35 backdrop-blur-sm flex items-center justify-center z-[1000] p-4 sm:p-6">
          <div className="bg-white rounded-2xl w-full max-w-2xl p-6 lg:p-8 shadow-xl border border-slate-200 overflow-hidden">
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl shadow-inner ${actionModal === 'complete' || actionModal === 'completeSubtask' || actionModal === 'editActivity' ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'}`}>
                  {actionModal === 'complete' || actionModal === 'completeSubtask' || actionModal === 'editActivity' ? '✅' : '↩️'}
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900 leading-tight">
                    {actionModal === 'complete' ? 'Complete Task' : actionModal === 'completeSubtask' ? 'Complete Subtask' : actionModal === 'editActivity' ? 'Edit Completion Details' : 'Send Task Back'}
                  </h3>
                  <p className="text-sm text-slate-500 font-medium">
                    {actionModal === 'complete' || actionModal === 'completeSubtask' ? 'Submit your final deliverables and notes.' : actionModal === 'editActivity' ? 'Update your previously submitted completion details.' : 'Return the task to the previous assignee for revisions.'}
                  </p>
                </div>
              </div>
              <button onClick={() => setActionModal(null)} className="w-8 h-8 flex items-center justify-center bg-slate-100 text-slate-500 rounded-full hover:bg-slate-200 transition-colors">
                ✕
              </button>
            </div>

            <div className="space-y-5 max-h-[65vh] overflow-y-auto pr-2 custom-scrollbar">
              <div className="space-y-2">
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider ml-1">Internal Notes (Private)</label>
                <div className="rounded-xl border border-slate-200 overflow-hidden bg-white">
                  <ReactQuill value={formData.note} onChange={(val) => setFormData({ ...formData, note: val })} className="h-32" theme="snow" placeholder="Document your progress or notes..." />
                  <div className="h-8" />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider ml-1">Message for Next Person</label>
                <textarea value={formData.message} onChange={(e) => setFormData({ ...formData, message: e.target.value })} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-700 outline-none focus:bg-white focus:border-indigo-400 transition-colors min-h-[80px] resize-none" placeholder="Add a message for the next person in the workflow..." />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-2">
                  <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider ml-1">Resource Link</label>
                  <input type="text" value={formData.link} onChange={(e) => setFormData({ ...formData, link: e.target.value })} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-indigo-700 outline-none focus:bg-white focus:border-indigo-400 transition-colors" placeholder="https://link.com" />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider ml-1">Upload Documents / Attachments</label>
                    {!isPremiumUser && (
                      <span className="text-[9px] font-bold text-amber-700 bg-amber-100 px-1.5 py-0.5 rounded-full border border-amber-200">
                        ⚡ Premium Feature
                      </span>
                    )}
                  </div>

                  {!isPremiumUser ? (
                    <div
                      onClick={() => window.dispatchEvent(new CustomEvent('open-upgrade-modal', { detail: { featureKey: 'allowTaskCompletionDocs' } }))}
                      className="border-2 border-dashed border-amber-300 bg-amber-50/60 hover:bg-amber-100/70 transition-all rounded-xl p-3 text-center cursor-pointer flex flex-col items-center justify-center gap-1.5"
                    >
                      <div className="w-6 h-6 rounded-md bg-amber-200/80 text-amber-800 flex items-center justify-center text-sm shadow-2xs">⚡</div>
                      <span className="text-amber-800 text-[11px] font-bold">Upload Documents (Requires Premium)</span>
                      <span className="text-slate-500 text-[10px]">Click to upgrade and attach proof files</span>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <div className="relative group/file border-2 border-dashed border-slate-300 hover:border-indigo-400 bg-slate-50 hover:bg-indigo-50/40 rounded-xl p-3 text-center transition-all cursor-pointer flex flex-col items-center justify-center gap-1.5">
                        <input 
                          type="file" 
                          title=""
                          multiple 
                          onChange={(e) => {
                            if (e.target.files?.length) {
                              const newFiles = Array.from(e.target.files);
                              setSelectedFiles(prev => [...prev, ...newFiles]);
                              e.target.value = '';
                            }
                          }} 
                          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10 text-transparent file:hidden" 
                        />
                        <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-600 flex items-center justify-center text-lg shadow-2xs">📂</div>
                        <div>
                          <span className="text-xs font-bold text-slate-700 block">Click or Drag Files to Upload</span>
                          <span className="text-[10px] text-slate-400 font-medium">Images, PDFs, Documents, ZIPs</span>
                        </div>
                      </div>

                      {(selectedFiles.length > 0 || existingDocs.length > 0) && (
                        <div className="space-y-1.5">
                          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                            Files ({selectedFiles.length + existingDocs.length}):
                          </span>
                          <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                            {existingDocs.map((doc, idx) => (
                              <div key={`existing-${idx}`} className="p-2 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between gap-2 text-xs">
                                <div className="flex items-center gap-2 min-w-0 flex-1">
                                  <span className="text-emerald-700 font-bold shrink-0">📄</span>
                                  <span className="font-semibold text-emerald-900 truncate" title={doc.originalName || doc.filename}>
                                    {doc.originalName || doc.filename}
                                  </span>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => setExistingDocs(prev => prev.filter((_, i) => i !== idx))}
                                  className="text-slate-400 hover:text-rose-600 p-0.5 hover:bg-rose-50 rounded transition-colors font-bold text-xs"
                                  title="Remove file"
                                >
                                  ✕
                                </button>
                              </div>
                            ))}

                            {selectedFiles.map((file, idx) => (
                              <div key={`selected-${idx}`} className="p-2 bg-indigo-50 border border-indigo-200 rounded-xl flex items-center justify-between gap-2 text-xs">
                                <div className="flex items-center gap-2 min-w-0 flex-1">
                                  <span className="text-indigo-600 font-bold shrink-0">📁</span>
                                  <div className="min-w-0 flex-1">
                                    <div className="font-semibold text-indigo-900 truncate" title={file.name}>{file.name}</div>
                                    <div className="text-[10px] text-indigo-600/70 font-medium">{(file.size / 1024).toFixed(1)} KB</div>
                                  </div>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => setSelectedFiles(prev => prev.filter((_, i) => i !== idx))}
                                  className="text-slate-400 hover:text-rose-600 p-0.5 hover:bg-rose-50 rounded transition-colors font-bold text-xs"
                                  title="Remove file"
                                >
                                  ✕
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>

              </div>
            </div>

            <div className="flex justify-end gap-3 pt-5 mt-5 border-t border-slate-100">
              <button 
                onClick={() => setActionModal(null)} 
                className="px-5 py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={handleModalSubmit} 
                disabled={actionLoading}
                className={`px-5 py-2.5 text-sm font-bold text-white rounded-xl shadow-sm transition-colors flex items-center gap-2 ${
                  actionModal === 'complete' || actionModal === 'completeSubtask' || actionModal === 'editActivity' 
                    ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-200/50' 
                    : 'bg-rose-600 hover:bg-rose-700 shadow-rose-200/50'
                }`}
              >
                {actionLoading && <span className="animate-spin text-sm">⏳</span>}
                {actionModal === 'complete' ? 'Confirm Completion' : actionModal === 'completeSubtask' ? 'Confirm Completion' : actionModal === 'editActivity' ? 'Save Changes' : 'Confirm Return'}
              </button>
            </div>
          </div>
        </div>
      )}

      <GenerateAITasksModal
        isOpen={showAISubtasksModal}
        onClose={() => setShowAISubtasksModal(false)}
        onGenerate={handleGenerateAISubtasksSubmit}
        projectTitle={task?.title}
        projectDescription={task?.description}
        modalTitle="Generate AI Subtasks"
        modalSubtitle="Auto-generate essential subtasks based on this task's title and description"
      />

      {viewingActivity && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-[2500] p-4" onClick={() => setViewingActivity(null)}>
          <div className="bg-white rounded-3xl w-full max-w-2xl p-6 sm:p-8 shadow-2xl border border-slate-100 space-y-6" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-start border-b border-slate-100 pb-4">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-800 px-2.5 py-0.5 rounded-full">Completed Deliverable</span>
                <h3 className="text-xl font-bold text-slate-900 mt-1">{viewingActivity.title}</h3>
              </div>
              <button onClick={() => setViewingActivity(null)} className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center text-lg">✕</button>
            </div>

            {viewingActivity.activity?.note && (
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Internal Notes</label>
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 text-xs text-slate-700 prose max-w-none" dangerouslySetInnerHTML={{ __html: viewingActivity.activity.note }} />
              </div>
            )}

            {viewingActivity.activity?.message && viewingActivity.activity.message !== '[object File]' && (
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Communication Message</label>
                <div className="bg-indigo-50/70 p-4 rounded-2xl border border-indigo-100 text-xs text-indigo-900 italic">"{viewingActivity.activity.message}"</div>
              </div>
            )}

            {viewingActivity.link && (
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Resource / Deliverable Link</label>
                <div>
                  <a href={viewingActivity.link} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold hover:bg-indigo-700 transition-colors shadow-xs">
                    <span>🔗</span>
                    <span>{viewingActivity.link} ↗</span>
                  </a>
                </div>
              </div>
            )}

            {viewingActivity.docs && viewingActivity.docs.length > 0 && (
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Attached Proof Files ({viewingActivity.docs.length})</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {viewingActivity.docs.map((doc, idx) => (
                    <a key={idx} href={getAssetUrl(doc.path || doc.url)} target="_blank" rel="noopener noreferrer" className="p-3 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-xl flex items-center gap-3 text-emerald-800 transition-colors group">
                      <div className="w-9 h-9 rounded-lg bg-emerald-500 text-white flex items-center justify-center text-base shadow-xs shrink-0">📄</div>
                      <div className="min-w-0 flex-1">
                        <div className="text-xs font-bold truncate group-hover:underline">{doc.originalName || doc.filename || `File ${idx + 1}`}</div>
                        <div className="text-[10px] opacity-75 font-semibold mt-0.5">Click to Open / Download ↗</div>
                      </div>
                    </a>
                  ))}
                </div>
              </div>
            )}

            <div className="flex justify-end pt-4 border-t border-slate-100">
              <button onClick={() => setViewingActivity(null)} className="px-6 py-2.5 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800 transition-colors">Close</button>
            </div>
          </div>
        </div>
      )}

    </Layout>
  );
};

export default MyTaskDetails;
