import React, { useState, useCallback, useEffect } from 'react';
import TaskWorkflow from './TaskWorkflow';
import { taskAPI } from '../../services/api';

const TaskDetailModal = ({ task, projectId, users, taskStatuses, sprints, phases, taskRoles, onUpdateTask, onClose, onDelete }) => {
  const [formData, setFormData] = useState({});
  const [hasChanges, setHasChanges] = useState(false);
  const [durationInputs, setDurationInputs] = useState({});
  const [savingDuration, setSavingDuration] = useState({});
  const [durationSaved, setDurationSaved] = useState({});

  useEffect(() => {
    if (task) {
      setFormData({
        title: task.title || '',
        description: task.description || '',
        status: task.status?._id || task.status || '',
        priority: task.priority || '',
        sprint: task.sprint?._id || '',
        phase: task.phase?._id || '',
        dueDate: task.dueDate ? new Date(task.dueDate).toISOString().split('T')[0] : '',
      });
      setHasChanges(false);
    }
  }, [task]);

  const loadDurations = useCallback(async () => {
    if (!task || !projectId) return;
    try {
      const res = await taskAPI.getTaskDurations(projectId, task._id);
      const inputs = {};
      (res.data.durations || []).forEach(d => {
        (d.members || []).forEach(m => {
          const uid = m.user?._id || m.user;
          if (uid) inputs[`${d.roleAssignmentId}_${uid}`] = m.durationMinutes ? +(m.durationMinutes / 60).toFixed(2) : '';
        });
      });
      setDurationInputs(inputs);
    } catch (err) { console.error('Failed to load durations', err); }
  }, [task, projectId]);

  useEffect(() => { loadDurations(); }, [loadDurations]);

  const handleFieldChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setHasChanges(true);
  };

  const handleSave = async () => {
    if (task && onUpdateTask && hasChanges) {
      const cleanedData = { ...formData };
      ['priority', 'status', 'sprint', 'phase', 'dueDate'].forEach(k => { if (cleanedData[k] === '') delete cleanedData[k]; });
      await onUpdateTask(task._id, cleanedData);
      setHasChanges(false);
      onClose();
    }
  };

  const handleSaveDuration = async (raId, userId, hours) => {
    const key = `${raId}_${userId}`;
    setSavingDuration(prev => ({ ...prev, [key]: true }));
    try {
      await taskAPI.setRoleDuration(projectId, task._id, { roleAssignmentId: raId, targetUserId: userId, durationMinutes: Math.round((Number(hours) || 0) * 60) });
      setDurationSaved(prev => ({ ...prev, [key]: true }));
      setTimeout(() => setDurationSaved(prev => ({ ...prev, [key]: false })), 2000);
    } catch (err) { console.error('Failed to save duration', err); }
    finally { setSavingDuration(prev => ({ ...prev, [key]: false })); }
  };

  if (!task) return null;

  return (
    <div className="fixed inset-0 bg-slate-700/50 backdrop-blur-sm flex items-center justify-center z-[2000] p-4" onClick={onClose}>
      <div
        className="bg-white rounded-2xl w-full max-w-6xl h-[85vh] shadow-2xl overflow-hidden flex flex-col md:flex-row border border-slate-200"
        onClick={e => e.stopPropagation()}
      >
        {/* Main Content Area */}
        <div className="flex-1 flex flex-col min-w-0 bg-white">
          {/* Header */}
          <div className="p-8 border-b border-slate-100 flex justify-between items-start shrink-0">
            <div className="min-w-0 flex-1 pr-6">
              <div className="flex items-center gap-2 mb-2">
                <span className="bg-indigo-100 text-indigo-700 px-2.5 py-1 rounded text-[10px] font-bold uppercase">{task.issueType || 'Task'}</span>
                <span className="text-[10px] font-medium text-slate-400">ID: {task._id.slice(-8).toUpperCase()}</span>
              </div>
              <input
                type="text"
                value={formData.title}
                onChange={e => handleFieldChange('title', e.target.value)}
                className="w-full text-2xl font-bold text-slate-900 bg-transparent border-none outline-none focus:ring-0 placeholder:text-slate-200"
                placeholder="Task Title"
              />
            </div>
            <button onClick={onClose} className="w-10 h-10 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-600 transition-colors">
              <span className="text-2xl leading-none">&times;</span>
            </button>
          </div>

          {/* Content Scrollable */}
          <div className="flex-1 overflow-y-auto p-8 space-y-10">
            {/* Description Section */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                <h5 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Description</h5>
              </div>
              <textarea
                value={formData.description}
                onChange={e => handleFieldChange('description', e.target.value)}
                className="w-full min-h-[160px] p-4 bg-slate-50 rounded-xl border border-slate-200 text-sm font-medium text-slate-700 leading-relaxed outline-none focus:bg-white focus:border-indigo-400 transition-all placeholder:text-slate-300 resize-none"
                placeholder="Add a detailed description for this task..."
              />
            </div>

            {/* Roles & Duration Section */}
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                  <h5 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Members & Duration</h5>
                </div>
                <span className="text-[10px] font-medium text-slate-400">Assignments: {task.roleAssignments?.length || '0'}</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {task.roleAssignments?.map(ra => {
                  const raId = ra._id?.toString() || ra._id;
                  const roleName = ra.role?.name || 'Assigned Role';
                  return (
                    <div key={raId} className="bg-slate-50 rounded-2xl border border-slate-200 p-6">
                      <div className="flex items-center justify-between mb-4">
                        <h6 className="text-[11px] font-bold text-slate-700 uppercase">{roleName}</h6>
                        <div className="text-[9px] font-bold text-slate-400">{ra.assignees?.length || 0} Members</div>
                      </div>
                      <div className="space-y-3">
                        {ra.assignees?.map(assignee => {
                          const uid = assignee._id?.toString() || assignee._id || assignee?.toString();
                          const key = `${raId}_${uid}`;
                          return (
                            <div key={uid} className="flex items-center gap-3 bg-white p-3 rounded-xl border border-slate-100 shadow-sm">
                              <div className="w-8 h-8 rounded-lg bg-slate-200 border border-slate-100 flex items-center justify-center text-[10px] font-bold text-slate-600 shrink-0 overflow-hidden">
                                {assignee.avatar ? <img src={assignee.avatar} alt="" className="w-full h-full object-cover" /> : assignee.name?.[0]}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="text-[11px] font-bold text-slate-900 truncate">{assignee.name}</div>
                              </div>
                              <div className="flex items-center gap-2">
                                <input
                                  type="number" step="0.5"
                                  value={durationInputs[key] ?? ''}
                                  onChange={e => setDurationInputs(prev => ({ ...prev, [key]: e.target.value }))}
                                  className="w-12 py-1.5 bg-slate-50 border border-slate-200 rounded text-center text-xs font-bold outline-none focus:border-indigo-400"
                                  placeholder="0"
                                />
                                <button
                                  onClick={() => handleSaveDuration(raId, uid, durationInputs[key] ?? 0)}
                                  disabled={savingDuration[key]}
                                  className={`px-3 py-1.5 rounded text-[9px] font-bold uppercase transition-all ${durationSaved[key] ? 'bg-emerald-500 text-white' : 'bg-slate-800 text-white hover:bg-slate-950 disabled:opacity-50'}`}
                                >
                                  {savingDuration[key] ? '...' : durationSaved[key] ? 'Saved' : 'Save'}
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Workflow Section */}
            {task && projectId && (
              <div className="pt-8 border-t border-slate-100 space-y-4">
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                  <h5 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Task Workflow</h5>
                </div>
                <TaskWorkflow
                  task={task}
                  projectId={projectId}
                  onTaskUpdate={async () => {
                    await taskAPI.getTaskWithWorkflow(projectId, task._id);
                    if (onUpdateTask) await onUpdateTask(task._id, {});
                  }}
                />
              </div>
            )}
          </div>

          {/* Footer Action Bar */}
          <div className="p-8 border-t border-slate-100 bg-slate-50 flex justify-between items-center shrink-0">
            <button
              onClick={() => onDelete?.(task)}
              className="px-6 py-2.5 text-rose-600 border border-rose-200 rounded-xl text-xs font-bold hover:bg-rose-50 transition-all"
            >
              Delete Task
            </button>
            <div className="flex items-center gap-4">
              <button
                onClick={onClose}
                className="px-6 py-2.5 text-xs font-bold text-slate-500 hover:text-slate-900 transition-all font-bold"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={!hasChanges}
                className={`px-8 py-2.5 rounded-xl text-xs font-bold transition-all shadow-sm ${hasChanges ? 'bg-indigo-600 text-white hover:bg-indigo-700' : 'bg-slate-200 text-slate-400 cursor-not-allowed'}`}
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>

        {/* Sidebar Controls */}
        <div className="w-full md:w-80 bg-slate-50 border-l border-slate-100 p-8 flex flex-col gap-8 shrink-0 overflow-y-auto">
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block ml-1">Status</label>
            <select
              value={formData.status}
              onChange={e => handleFieldChange('status', e.target.value)}
              className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold outline-none focus:border-indigo-400 transition-all cursor-pointer"
            >
              <option value="">Select Status</option>
              {taskStatuses?.map(s => <option key={s._id} value={s._id}>{s.name}</option>)}
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block ml-1">Priority</label>
            <select
              value={formData.priority}
              onChange={e => handleFieldChange('priority', e.target.value)}
              className={`w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold outline-none focus:border-indigo-400 transition-all cursor-pointer ${formData.priority === 'urgent' ? 'text-rose-600' : formData.priority === 'high' ? 'text-orange-600' : ''}`}
            >
              <option value="">No Priority</option>
              <option value="urgent">Urgent</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block ml-1">Due Date</label>
            <input
              type="date"
              value={formData.dueDate}
              onChange={e => handleFieldChange('dueDate', e.target.value)}
              className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold outline-none focus:border-indigo-400 transition-all"
            />
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block ml-1">Sprint</label>
            <select
              value={formData.sprint}
              onChange={e => handleFieldChange('sprint', e.target.value)}
              className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold outline-none focus:border-indigo-400 transition-all cursor-pointer"
            >
              <option value="">No Sprint</option>
              {sprints?.map(s => <option key={s._id} value={s._id}>{s.name}</option>)}
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block ml-1">Phase</label>
            <select
              value={formData.phase}
              onChange={e => handleFieldChange('phase', e.target.value)}
              className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold outline-none focus:border-indigo-400 transition-all cursor-pointer"
            >
              <option value="">No Phase</option>
              {phases?.map(p => <option key={p._id} value={p._id}>{p.name}</option>)}
            </select>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TaskDetailModal;
