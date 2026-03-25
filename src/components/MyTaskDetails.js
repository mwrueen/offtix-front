import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { myTasksAPI, BASE_SERVER_URL } from '../services/api';
import { useToast } from '../context/ToastContext';
import Layout from './Layout';
import PageHeader from './PageHeader';
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
        <div className="max-w-[1400px] mx-auto px-10 py-40 text-center animate-pulse space-y-12 italic">
          <div className="w-16 h-16 border-8 border-slate-50 border-t-indigo-600 rounded-full animate-spin mx-auto shadow-sm" />
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Retrieving task requirements...</p>
        </div>
      </Layout>
    );
  }

  if (error || !taskData) {
    return (
      <Layout>
        <div className="max-w-4xl mx-auto my-40 bg-white rounded-3xl p-32 shadow-sm border border-rose-100 text-center space-y-12 animate-in zoom-in-95 duration-700 font-sans italic">
          <div className="text-9xl grayscale opacity-10">🚫</div>
          <h2 className="text-4xl font-bold text-slate-900 uppercase italic tracking-tight text-rose-600">Task Not Found</h2>
          <p className="text-lg font-medium text-slate-500 max-w-xl mx-auto leading-relaxed">{error || 'The requested task detail could not be retrieved from the central registry.'}</p>
          <button onClick={() => navigate('/my-tasks')} className="px-16 py-5 bg-slate-900 text-white rounded-2xl font-bold text-xs uppercase tracking-widest shadow-lg hover:bg-slate-950 transition-all active:scale-95">Back to Tasks</button>
        </div>
      </Layout>
    );
  }

  const { task, workflowType, allowedActions } = taskData;

  return (
    <Layout>
      <div className="max-w-7xl mx-auto py-12 px-6 space-y-12 animate-in fade-in duration-1000 font-sans pb-40">
        <PageHeader
          title={task.title}
          subtitle={`Detailed task specification and lifecycle management for ${task.project?.title || 'Standalone Project'}.`}
          icon="📋"
          stats={[
            { label: 'Priority', value: task.priority?.toUpperCase() },
            { label: 'Status', value: task.status?.name?.toUpperCase() }
          ]}
          actions={<button onClick={() => navigate('/my-tasks')} className="px-8 py-3 text-xs font-bold uppercase tracking-widest text-slate-400 hover:text-slate-900 transition-all underline underline-offset-8 italic">Back to Task Queue</button>}
        />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-8 space-y-12 italic">
            {/* Description */}
            {task.description && (
              <div className="bg-white p-12 rounded-[3rem] border border-slate-200 shadow-sm space-y-8">
                <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-4">Task Description & Intelligence</h3>
                <p className="text-lg font-medium text-slate-600 leading-relaxed whitespace-pre-wrap uppercase tracking-tight">{task.description}</p>
              </div>
            )}

            {/* Workflow Chain */}
            {workflowType === 'sequential' && taskData.sequentialAssignees && (
              <div className="bg-white p-12 rounded-[3rem] border border-slate-200 shadow-sm space-y-10">
                <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-4 text-center">Work Allocation Sequence</h3>
                <div className="grid grid-cols-1 gap-6 max-w-2xl mx-auto">
                  {taskData.sequentialAssignees.map((assignee, idx) => (
                    <div key={idx} className={`p-8 rounded-[2.5rem] border-2 transition-all duration-500 relative ${assignee.isCurrent ? 'bg-indigo-50 border-indigo-200 shadow-md scale-105 z-10' : 'bg-slate-50 border-slate-100'}`}>
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-4">
                          <span className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs font-bold ${assignee.isCurrent ? 'bg-indigo-600 text-white' : 'bg-white text-slate-400 border border-slate-100'}`}>{idx + 1}</span>
                          <span className={`text-lg font-bold uppercase tracking-tight ${assignee.isCurrent ? 'text-indigo-900' : 'text-slate-600'}`}>{assignee.user.name}</span>
                          {assignee.isCurrent && <span className="text-[8px] font-bold text-indigo-500 uppercase tracking-widest animate-pulse ml-2 italic">Active Lead</span>}
                        </div>
                        <span className={`px-4 py-1 rounded-xl text-[9px] font-bold uppercase tracking-widest italic border ${getStatusColorClasses(assignee.status)}`}>{getStatusLabel(assignee.status)}</span>
                      </div>
                      {(assignee.startedAt || assignee.completedAt) && (
                        <div className="flex gap-8 mt-4 pt-4 border-t border-white/50">
                          {assignee.startedAt && <div className="space-y-1"><span className="text-[8px] text-slate-400 uppercase tracking-widest block font-bold">Initiated</span><span className="text-[10px] font-bold text-slate-500">{formatDate(assignee.startedAt)}</span></div>}
                          {assignee.completedAt && <div className="space-y-1"><span className="text-[8px] text-slate-400 uppercase tracking-widest block font-bold">Completed</span><span className="text-[10px] font-bold text-slate-500">{formatDate(assignee.completedAt)}</span></div>}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Discussion & Updates */}
            {taskData.activity && taskData.activity.length > 0 && (
              <div className="bg-slate-900 p-12 lg:p-20 rounded-[4rem] text-white space-y-12 shadow-2xl">
                <h3 className="text-sm font-bold uppercase tracking-[0.5em] text-indigo-400 border-b border-white/5 pb-8 italic text-center">Operational Event Ledger</h3>
                <div className="space-y-12">
                  {taskData.activity.map((item, idx) => (
                    <div key={item._id} className="relative pl-12 border-l-2 border-white/5 group">
                      <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-slate-950 border-2 border-indigo-500 group-hover:scale-150 transition-transform" />
                      <div className="flex flex-col sm:flex-row justify-between mb-4 gap-4">
                        <div className="font-bold text-indigo-400 text-sm tracking-tight flex items-center gap-3">
                          <span className="text-white uppercase italic">{item.performedBy?.name || 'System'}</span>
                          <span className="text-[10px] opacity-40">➔</span>
                          <span className="uppercase tracking-widest">{item.action.replace(/_/g, ' ')}</span>
                        </div>
                        <span className="text-[9px] font-bold text-slate-500 italic uppercase tracking-widest">{formatDate(item.createdAt)}</span>
                      </div>
                      {item.note && (
                        <div className="bg-white/5 backdrop-blur-md p-8 rounded-[2.5rem] border border-white/5 mb-4 shadow-inner">
                          <div className="text-slate-200 text-sm font-medium leading-relaxed prose prose-invert max-w-none" dangerouslySetInnerHTML={{ __html: item.note }} />
                        </div>
                      )}
                      {item.message && <p className="p-8 bg-indigo-950/30 border-l-4 border-indigo-500 rounded-r-3xl mb-4 italic text-sm text-indigo-100 uppercase tracking-tight">"{item.message}"</p>}
                      <div className="flex flex-wrap gap-4">
                        {item.metadata?.link && <a href={item.metadata.link} target="_blank" rel="noopener noreferrer" className="px-6 py-2.5 bg-white/5 rounded-xl text-[10px] font-bold text-indigo-400 hover:bg-white/10 transition-all border border-white/5 italic">View Reference ↗</a>}
                        {item.documents?.map((doc, dIdx) => (
                          <a key={dIdx} href={`${BASE_SERVER_URL}/${doc.path}`} target="_blank" rel="noopener noreferrer" className="px-6 py-2.5 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-[10px] font-bold text-emerald-400 hover:bg-emerald-500/20 transition-all italic flex items-center gap-3">Artifact: {doc.originalName} <span className="opacity-40">{Math.round(doc.size / 1024)}KB</span></a>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="lg:col-span-4 space-y-8 italic">
            <div className="bg-white p-10 rounded-[3rem] border border-slate-200 shadow-sm space-y-8">
              <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-4">Task Control Console</h3>
              <div className="grid grid-cols-1 gap-4">
                {allowedActions.canStart && (
                  <button onClick={handleStart} disabled={actionLoading} className="w-full py-5 bg-indigo-600 text-white rounded-2xl font-bold text-xs uppercase tracking-[0.2em] shadow-lg hover:bg-slate-950 hover:-translate-y-1 transition-all active:scale-95 disabled:grayscale">Start Execution</button>
                )}
                {allowedActions.canPause && (
                  <button onClick={handlePause} disabled={actionLoading} className="w-full py-5 bg-amber-500 text-white rounded-2xl font-bold text-xs uppercase tracking-[0.2em] shadow-lg hover:bg-amber-600 hover:-translate-y-1 transition-all active:scale-95 disabled:grayscale">Pause Operation</button>
                )}
                {allowedActions.canComplete && (
                  <button onClick={handleCompleteClick} disabled={actionLoading} className="w-full py-5 bg-slate-900 text-white rounded-2xl font-bold text-xs uppercase tracking-[0.2em] shadow-lg hover:bg-emerald-600 hover:-translate-y-1 transition-all active:scale-95 disabled:grayscale">Submit Completion</button>
                )}
                {allowedActions.canSendBack && (
                  <button onClick={handleSendBackClick} disabled={actionLoading} className="w-full py-5 bg-white border-2 border-rose-100 text-rose-600 rounded-2xl font-bold text-xs uppercase tracking-[0.2em] hover:bg-rose-50 hover:-translate-y-1 transition-all active:scale-95 disabled:grayscale">Request Revision</button>
                )}
              </div>
            </div>

            <div className="bg-slate-50 p-10 rounded-[3rem] border border-slate-200 space-y-6">
              <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-200 pb-4">Task Metadata</h3>
              <div className="space-y-6">
                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Current Status</span>
                  <div className="flex"><span className={`px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest border-2 ${getStatusColorClasses(task.status?.slug || task.status?.name?.toLowerCase())}`}>{task.status?.name}</span></div>
                </div>
                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Priority Index</span>
                  <div className="flex"><span className={`px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest border-2 ${task.priority === 'urgent' ? 'bg-rose-50 text-rose-600 border-rose-100' : 'bg-indigo-50 text-indigo-600 border-indigo-100'}`}>{task.priority}</span></div>
                </div>
                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Project Descriptor</span>
                  <p className="text-sm font-bold text-slate-900 uppercase tracking-tight">{task.project?.title || 'Standalone'}</p>
                </div>
                <div className="space-y-1 pt-4 border-t border-slate-200">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">System Identifier</span>
                  <p className="font-mono text-[9px] text-slate-400 truncate bg-white p-3 rounded-xl border border-slate-100 shadow-inner">{taskId}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Action Modals */}
      {actionModal && (
        <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-md flex items-center justify-center z-[1000] p-6 animate-in fade-in duration-300">
          <div className="bg-white rounded-[4rem] w-full max-w-4xl p-12 lg:p-16 shadow-2xl border border-slate-200 animate-in zoom-in-95 duration-500 italic font-sans overflow-hidden">
            <div className="flex justify-between items-center mb-10">
              <h3 className="text-3xl font-black uppercase tracking-tighter text-slate-900 italic flex items-center gap-4">
                <span className={`w-3 h-10 rounded-full ${actionModal === 'complete' ? 'bg-indigo-600' : 'bg-rose-500'}`} />
                {actionModal === 'complete' ? 'Operational Finalization' : 'Revision Request Protocol'}
              </h3>
              <button onClick={() => setActionModal(null)} className="w-12 h-12 flex items-center justify-center bg-slate-50 border border-slate-100 rounded-2xl text-2xl text-slate-400 hover:text-rose-600 transition-all">×</button>
            </div>

            <div className="space-y-10 max-h-[60vh] overflow-y-auto no-scrollbar pr-2">
              <div className="space-y-4">
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest ml-1">Technical Documentation / Logs</label>
                <div className="rounded-[2rem] border-2 border-slate-100 overflow-hidden bg-white shadow-inner">
                  <ReactQuill value={formData.note} onChange={(val) => setFormData({ ...formData, note: val })} className="h-48" theme="snow" placeholder="Briefly document technical outcomes or procedural deviations..." />
                  <div className="h-12" />
                </div>
              </div>

              <div className="space-y-4">
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest ml-1">Summary Brief</label>
                <textarea value={formData.message} onChange={(e) => setFormData({ ...formData, message: e.target.value })} className="w-full px-8 py-6 bg-slate-50 border-2 border-slate-100 rounded-3xl text-sm font-bold text-slate-700 outline-none focus:bg-white focus:border-indigo-400 transition-all min-h-[120px] shadow-inner uppercase tracking-tight" placeholder="Summary for next sequential lead..." />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                <div className="space-y-4">
                  <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest ml-1">External Resource URL</label>
                  <input type="text" value={formData.link} onChange={(e) => setFormData({ ...formData, link: e.target.value })} className="w-full px-6 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl text-xs font-bold text-indigo-600 outline-none focus:bg-white focus:border-indigo-400 transition-all shadow-inner tracking-tight" placeholder="https://resource.nexus/..." />
                </div>
                <div className="space-y-4">
                  <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest ml-1">Upload Project Artifacts</label>
                  <div className="relative group/file">
                    <input type="file" multiple onChange={handleFileChange} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" />
                    <div className="px-8 py-4 bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl text-center group-hover/file:bg-indigo-50 group-hover/file:border-indigo-300 transition-all">
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{selectedFiles.length > 0 ? `${selectedFiles.length} Artifacts Selected` : 'Attach Documents'}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-6 pt-10 mt-10 border-t border-slate-100">
              <button onClick={() => setActionModal(null)} className="px-10 py-4 text-xs font-bold uppercase tracking-widest text-slate-400 hover:text-slate-900 transition-all italic underline underline-offset-8">Abort Operation</button>
              <button onClick={handleModalSubmit} disabled={actionLoading} className={`px-16 py-4 rounded-2xl font-bold text-xs uppercase tracking-[0.2em] text-white shadow-xl transition-all active:scale-95 disabled:grayscale ${actionModal === 'complete' ? 'bg-indigo-600 hover:bg-slate-950' : 'bg-rose-600 hover:bg-rose-700'}`}>{actionLoading ? 'Processing...' : (actionModal === 'complete' ? 'Commit Completion' : 'Confirm Revision')}</button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default MyTaskDetails;
