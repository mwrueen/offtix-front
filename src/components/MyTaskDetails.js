import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { myTasksAPI, BASE_SERVER_URL } from '../services/api';
import { useToast } from '../context/ToastContext';
import { useCompany } from '../context/CompanyContext';
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
  const [actionModal, setActionModal] = useState(null); // 'complete' or 'sendBack'
  const [formData, setFormData] = useState({ note: '', message: '', link: '' });
  const [selectedFiles, setSelectedFiles] = useState([]);

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
          title={task.title}
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
                <p className="text-sm font-normal text-slate-700 leading-relaxed whitespace-pre-wrap">{task.description}</p>
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
                        <div className="font-medium text-slate-700 text-sm flex items-center gap-2">
                          <span className="text-indigo-700">{item.performedBy?.name || 'System'}</span>
                          <span className="text-slate-400">→</span>
                          <span className="text-slate-600 capitalize text-sm">{item.action.replace(/_/g, ' ')}</span>
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
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-5">
              <h3 className="text-xs font-semibold text-slate-600 uppercase tracking-wider border-b border-slate-200 pb-3">Task Actions</h3>
              <div className="grid grid-cols-1 gap-4">
                {allowedActions.canStart && (
                  <button onClick={handleStart} disabled={actionLoading} className="w-full py-2.5 bg-indigo-600 text-white rounded-lg font-medium text-sm hover:bg-indigo-700 transition-colors disabled:opacity-50">Start Task</button>
                )}
                {allowedActions.canPause && (
                  <button onClick={handlePause} disabled={actionLoading} className="w-full py-2.5 bg-amber-500 text-white rounded-lg font-medium text-sm hover:bg-amber-600 transition-colors disabled:opacity-50">Pause Task</button>
                )}
                {allowedActions.canComplete && (
                  <button onClick={handleCompleteClick} disabled={actionLoading} className="w-full py-2.5 bg-slate-900 text-white rounded-lg font-medium text-sm hover:bg-slate-800 transition-colors disabled:opacity-50">Complete Task</button>
                )}
                {allowedActions.canSendBack && (
                  <button onClick={handleSendBackClick} disabled={actionLoading} className="w-full py-2.5 bg-white border border-rose-200 text-rose-700 rounded-lg font-medium text-sm hover:bg-rose-50 transition-colors disabled:opacity-50">Send Back</button>
                )}
              </div>
            </div>

            <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 space-y-6">
              <h3 className="text-xs font-semibold text-slate-600 uppercase tracking-wider border-b border-slate-200 pb-3">Task Metadata</h3>
              <div className="space-y-6">
                <div className="space-y-1">
                  <span className="text-xs font-medium text-slate-500">Current Status</span>
                  <div className="flex"><span className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColorClasses(task.status?.slug || task.status?.name?.toLowerCase())}`}>{task.status?.name}</span></div>
                </div>
                <div className="space-y-1">
                  <span className="text-xs font-medium text-slate-500">Priority</span>
                  <div className="flex"><span className={`px-3 py-1 rounded-full text-xs font-medium border ${task.priority === 'urgent' ? 'bg-rose-50 text-rose-700 border-rose-200' : 'bg-indigo-50 text-indigo-700 border-indigo-200'}`}>{task.priority}</span></div>
                </div>
                <div className="space-y-1">
                  <span className="text-xs font-medium text-slate-500">Project</span>
                  <p className="text-sm font-semibold text-slate-900">{task.project?.title || 'Standalone'}</p>
                </div>
                <div className="space-y-1 pt-4 border-t border-slate-200">
                  <span className="text-xs font-medium text-slate-500">System Identifier</span>
                  <p className="font-mono text-xs text-slate-500 truncate bg-white p-3 rounded-lg border border-slate-200">{taskId}</p>
                </div>
              </div>
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
                <div className={`w-11 h-11 rounded-lg flex items-center justify-center ${actionModal === 'complete' ? 'bg-indigo-100 text-indigo-700' : 'bg-rose-100 text-rose-700'}`}>
                  {actionModal === 'complete' ? '✓' : '↩'}
                </div>
                <h3 className="text-xl font-semibold text-slate-800">
                  {actionModal === 'complete' ? 'Submit Task Completion' : 'Request Revision'}
                </h3>
              </div>
              <button onClick={() => setActionModal(null)} className="w-9 h-9 flex items-center justify-center bg-slate-100 rounded-lg text-slate-500 hover:bg-slate-200 transition-colors">×</button>
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
              <button onClick={() => setActionModal(null)} className="px-5 py-2.5 text-sm font-medium text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors">Cancel</button>
              <button onClick={handleModalSubmit} disabled={actionLoading} className={`px-8 py-2.5 rounded-lg font-medium text-sm text-white transition-colors disabled:opacity-50 ${actionModal === 'complete' ? 'bg-indigo-600 hover:bg-indigo-700' : 'bg-rose-600 hover:bg-rose-700'}`}>{actionLoading ? 'Processing...' : (actionModal === 'complete' ? 'Submit Completion' : 'Confirm Return')}</button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default MyTaskDetails;
