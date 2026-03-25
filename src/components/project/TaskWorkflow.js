import React, { useState, useRef } from 'react';
import { taskAPI } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';

const TaskWorkflow = ({ task, projectId, onTaskUpdate }) => {
  const { showToast } = useToast();
  const { state: authState } = useAuth();
  const currentUser = authState.user;
  const [showHandoffModal, setShowHandoffModal] = useState(false);
  const [handoffData, setHandoffData] = useState({
    comment: '',
    urls: [{ title: '', url: '' }],
    files: []
  });
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);

  if (!task || !task.useRoleWorkflow || !task.roleAssignments || task.roleAssignments.length === 0) {
    return null;
  }

  const currentRoleIndex = task.currentRoleIndex ?? -1;
  const isWorkflowStarted = currentRoleIndex >= 0;
  const currentRole = isWorkflowStarted && task.roleAssignments[currentRoleIndex];
  const isCurrentUserAssigned = currentRole && currentRole.assignees?.some(
    assignee => assignee._id === currentUser?._id || assignee === currentUser?._id
  );
  const isWorkflowComplete = task.roleAssignments.every(ra => ra.status === 'completed' || ra.status === 'skipped');

  const handleStartWorkflow = async () => {
    try {
      const response = await taskAPI.startWorkflow(projectId, task._id);
      showToast('Workflow started! Team members have been notified.', 'success');
      if (onTaskUpdate) onTaskUpdate(response.data);
    } catch (error) {
      showToast(error.response?.data?.error || 'Failed to start workflow', 'error');
    }
  };

  const handleCompleteRole = async () => {
    try {
      setUploading(true);
      const formData = new FormData();
      formData.append('comment', handoffData.comment);
      formData.append('urls', JSON.stringify(handoffData.urls.filter(u => u.title && u.url)));
      handoffData.files.forEach(file => formData.append(`files`, file));

      const token = localStorage.getItem('token');
      const response = await fetch(
        `${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/projects/${projectId}/tasks/${task._id}/workflow/complete-role`,
        {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}` },
          body: formData
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to complete role');
      }

      const updatedTask = await response.json();
      showToast('Step completed and handed off to the next team.', 'success');
      setShowHandoffModal(false);
      setHandoffData({ comment: '', urls: [{ title: '', url: '' }], files: [] });
      if (onTaskUpdate) onTaskUpdate(updatedTask);
    } catch (error) {
      showToast(error.message || 'Failed to complete role', 'error');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h5 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Workflow Progression</h5>
        {isWorkflowComplete && (
          <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-lg">✓ Completed</span>
        )}
      </div>

      <div className="space-y-3 relative">
        {/* Connector Line */}
        <div className="absolute left-[15px] top-4 bottom-4 w-0.5 bg-slate-100 -z-10" />

        {task.roleAssignments.map((ra, idx) => {
          const isActive = idx === currentRoleIndex;
          const isCompleted = ra.status === 'completed';
          const isPending = !isActive && !isCompleted;

          return (
            <div key={idx} className={`flex items-start gap-4 p-4 rounded-xl border transition-all ${isActive ? 'bg-indigo-50/50 border-indigo-200 shadow-sm' : 'bg-white border-slate-100 opacity-60'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 border-2 ${isCompleted ? 'bg-emerald-500 border-emerald-500 text-white' : isActive ? 'bg-white border-indigo-500 text-indigo-500 animate-pulse' : 'bg-white border-slate-200 text-slate-400'}`}>
                {isCompleted ? '✓' : idx + 1}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <h6 className={`text-xs font-bold uppercase ${isActive ? 'text-indigo-900' : 'text-slate-700'}`}>{ra.role?.name || 'Step'}</h6>
                  <span className={`text-[9px] font-bold px-2 py-0.5 rounded uppercase ${isCompleted ? 'text-emerald-600' : isActive ? 'text-indigo-600' : 'text-slate-400'}`}>
                    {ra.status || (isPending ? 'Pending' : '')}
                  </span>
                </div>
                <div className="flex -space-x-1.5 overflow-hidden">
                  {ra.assignees?.map((a, i) => (
                    <div key={i} className="w-6 h-6 rounded border border-white bg-slate-200 flex items-center justify-center text-[8px] font-bold text-slate-600" title={a.name}>
                      {a.name?.[0]}
                    </div>
                  ))}
                </div>

                {isActive && isCurrentUserAssigned && (
                  <div className="mt-4">
                    <button
                      onClick={() => setShowHandoffModal(true)}
                      className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-[10px] font-bold uppercase transition-all shadow-sm"
                    >
                      Complete & Handoff
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {!isWorkflowStarted && (
        <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 border-dashed text-center">
          <p className="text-xs text-slate-500 mb-3 font-medium">Workflow has not been initiated for this task.</p>
          <button
            onClick={handleStartWorkflow}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2.5 rounded-xl text-xs font-bold shadow-md transition-all active:scale-95"
          >
            Initiate Workflow
          </button>
        </div>
      )}

      {/* Handoff Modal */}
      {showHandoffModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-[2000] p-4" onClick={() => !uploading && setShowHandoffModal(false)}>
          <div className="bg-white rounded-2xl p-8 w-full max-w-lg shadow-2xl border border-slate-200 animate-in zoom-in-95" onClick={e => e.stopPropagation()}>
            <div className="mb-6">
              <h3 className="text-lg font-bold text-slate-900">Task Handoff</h3>
              <p className="text-xs text-slate-500 mt-1">Add completion notes and files for the next team.</p>
            </div>

            <div className="space-y-6">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider ml-1">Completion Notes</label>
                <textarea
                  value={handoffData.comment}
                  onChange={e => setHandoffData({ ...handoffData, comment: e.target.value })}
                  placeholder="What was achieved? Any instructions for the next role?"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium outline-none focus:bg-white focus:border-indigo-400 min-h-[100px] resize-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider ml-1">Attachments</label>
                <div className="flex flex-wrap gap-2">
                  <input ref={fileInputRef} type="file" multiple className="hidden" onChange={e => setHandoffData(prev => ({ ...prev, files: [...prev.files, ...Array.from(e.target.files)] }))} />
                  <button onClick={() => fileInputRef.current?.click()} className="px-4 py-2 border border-slate-200 rounded-lg text-xs font-bold text-slate-600 hover:bg-slate-50 transition-all flex items-center gap-2">
                    <span>📎</span> Attach Files
                  </button>
                  {handoffData.files.map((f, i) => (
                    <div key={i} className="flex items-center gap-2 bg-indigo-50 text-indigo-700 px-3 py-1.5 rounded-lg text-[10px] font-bold border border-indigo-100">
                      <span className="truncate max-w-[120px]">{f.name}</span>
                      <button onClick={() => setHandoffData(prev => ({ ...prev, files: prev.files.filter((_, idx) => idx !== i) }))} className="text-indigo-400 hover:text-indigo-600">×</button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex gap-3 pt-6 border-t border-slate-100">
                <button onClick={() => setShowHandoffModal(false)} disabled={uploading} className="flex-1 py-2.5 text-xs font-bold text-slate-500 hover:text-slate-900 transition-all">Cancel</button>
                <button onClick={handleCompleteRole} disabled={uploading} className="flex-[2] py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md transition-all disabled:opacity-50">
                  {uploading ? 'Processing Handoff...' : 'Complete & Send'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TaskWorkflow;

