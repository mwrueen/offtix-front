import React, { useState, useCallback, useEffect } from 'react';
import { taskAPI } from '../../services/api';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';

const TaskDetailModal = ({ task, projectId, users, taskStatuses, taskRoles, meetingNotes, onUpdateTask, onUpdate, onClose, onDelete }) => {
  const [formData, setFormData] = useState({});
  const [hasChanges, setHasChanges] = useState(false);
  const [durationInputs, setDurationInputs] = useState({});
  const [savingDuration, setSavingDuration] = useState({});
  const [durationSaved, setDurationSaved] = useState({});
  const [roleAssignments, setRoleAssignments] = useState([]);
  const [hasRoleChanges, setHasRoleChanges] = useState(false);

  const quillModules = {
    toolbar: [
      [{ header: [1, 2, 3, false] }],
      ['bold', 'italic', 'underline', 'strike'],
      [{ list: 'ordered' }, { list: 'bullet' }],
      ['link', 'blockquote', 'code-block'],
      ['clean']
    ]
  };

  useEffect(() => {
    if (task) {
      setFormData({
        title: task.title || '',
        description: task.description || '',
        status: task.status?._id || task.status || '',
        priority: task.priority || '',
        meeting: task.meeting?._id || task.meeting || '',
      });
      const initialAssignments = task.useRoleWorkflow
        ? (task.roleAssignments || [])
            .map(ra => ({
              assignmentId: ra._id?.toString?.() || ra._id || null,
              roleId: ra.role?._id || ra.role,
              userIds: (ra.assignees || []).map(a => a._id || a),
            }))
            .filter(ra => ra.userIds.length > 0)
        : [];
      setRoleAssignments(initialAssignments);
      setHasRoleChanges(false);
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
    const updateHandler = onUpdateTask || onUpdate;
    if (task && updateHandler && hasChanges) {
      const formattedRoleAssignments = roleAssignments.map((ra, idx) => ({
        role: ra.roleId,
        assignees: ra.userIds,
        order: idx + 1
      }));
      const flatAssignees = [...new Set(formattedRoleAssignments.flatMap(ra => ra.assignees))];
      const cleanedData = { ...formData };
      ['priority', 'status'].forEach(k => { if (cleanedData[k] === '') delete cleanedData[k]; });
      if (hasRoleChanges) {
        cleanedData.assignees = flatAssignees;
        cleanedData.roleAssignments = formattedRoleAssignments;
        cleanedData.useRoleWorkflow = formattedRoleAssignments.length > 0;
      }
      await updateHandler(task._id, cleanedData);
      setHasChanges(false);
      setHasRoleChanges(false);
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
      <div className="bg-white rounded-2xl w-full max-w-5xl max-h-[85vh] shadow-2xl overflow-hidden flex flex-col border border-slate-200" onClick={e => e.stopPropagation()}>
        {/* Main Content Area */}
        <div className="flex-1 flex flex-col min-w-0 min-h-0 bg-white">
          {/* Header */}
          <div className="p-8 border-b border-slate-100 flex justify-between items-start shrink-0">
            <div className="min-w-0 flex-1 pr-6">
              <div className="flex items-center gap-2 mb-2">
                <span className="bg-indigo-100 text-indigo-700 px-2.5 py-1 rounded text-[10px] font-bold uppercase">{task.issueType || 'Task'}</span>
                <span className="text-[10px] font-medium text-slate-400">ID: {task._id.slice(-8).toUpperCase()}</span>
                {task.requirement && (
                  <div className="flex items-center gap-1.5 ml-2 pl-2 border-l border-slate-200">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">Requirement:</span>
                    <span className="bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded text-[10px] font-black uppercase ring-1 ring-emerald-100 italic">
                      {task.requirement.title || 'Linked Requirement'}
                    </span>
                  </div>
                )}
                {task.meeting && (
                  <div className="flex items-center gap-1.5 ml-2 pl-2 border-l border-slate-200">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">Meeting:</span>
                    <span className="bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded text-[10px] font-black uppercase ring-1 ring-indigo-100 italic">
                      {task.meeting.title || 'Linked Meeting'}
                    </span>
                  </div>
                )}
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
          <div className="flex-1 min-h-0 overflow-y-auto p-8 space-y-10">
            {/* Description Section */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                <h5 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Description</h5>
              </div>
              <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
                <ReactQuill
                  theme="snow"
                  modules={quillModules}
                  value={formData.description || ''}
                  onChange={(content, delta, source, editor) => {
                    if (source === 'user') {
                      handleFieldChange('description', content);
                    }
                  }}
                  placeholder="Add a detailed description for this task..."
                  className="min-h-[180px]"
                />
              </div>
            </div>

            {/* ── Assign Member Section ── */}
            {roleAssignments.length > 0 && (
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                  <h5 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Assigned Members</h5>
                  <span className="bg-amber-100 text-amber-700 text-[9px] font-bold px-2 py-0.5 rounded-full uppercase">
                    {roleAssignments.length} {roleAssignments.length === 1 ? 'Step' : 'Steps'}
                  </span>
                </div>

                <div className="space-y-3">
                  {roleAssignments.map((ra, idx) => {
                    const role = taskRoles?.find(r => r._id === ra.roleId);
                    const roleColor = role?.color || '#6366f1';
                    const raId = ra.assignmentId;
                    const roleUsers = ra.userIds.map(uid => users.find(u => u._id === uid)).filter(Boolean);
                    return (
                      <div key={ra.roleId} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden" style={{ borderLeftColor: roleColor, borderLeftWidth: 3 }}>
                        <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-100 bg-slate-50/30">
                          <div className="w-6 h-6 rounded-full flex items-center justify-center text-white text-[9px] font-bold shrink-0" style={{ backgroundColor: roleColor }}>{idx + 1}</div>
                          <span className="text-sm leading-none">{role?.icon || '👤'}</span>
                          <span className="text-[11px] font-bold text-slate-800 flex-1 uppercase tracking-wide">{role?.name || 'Role'}</span>
                          <span className="text-[9px] text-slate-400">{roleUsers.length} member{roleUsers.length !== 1 ? 's' : ''}</span>
                        </div>
                        <div className="px-4 py-3 space-y-2">
                          {roleUsers.map(assignee => {
                            const uid = assignee._id?.toString() || assignee._id;
                            const key = `${raId || ra.roleId}_${uid}`;
                            const initials = assignee.name?.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() || '?';
                            return (
                              <div key={uid} className="flex items-center gap-3 bg-slate-50 rounded-xl px-3 py-2.5 border border-slate-100">
                                <div className="w-7 h-7 rounded-lg flex items-center justify-center text-white text-[10px] font-bold shrink-0 overflow-hidden" style={{ backgroundColor: roleColor }}>
                                  {assignee.profile?.profilePicture ? <img src={assignee.profile.profilePicture} alt="" className="w-full h-full object-cover" /> : initials}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="text-[11px] font-bold text-slate-800 truncate">{assignee.name}</div>
                                  {assignee.projectRole && <div className="text-[9px] text-slate-400">{assignee.projectRole}</div>}
                                </div>
                                <div className="flex items-center gap-1.5 shrink-0">
                                  <div className="relative flex items-center">
                                    <input type="number" step="0.5" min="0" placeholder="0" value={durationInputs[key] ?? ''} onChange={e => setDurationInputs(prev => ({ ...prev, [key]: e.target.value }))} className="w-14 pr-6 pl-2 py-1.5 bg-white border border-slate-200 rounded-lg text-center text-[10px] font-bold outline-none focus:border-indigo-400" />
                                    <span className="absolute right-2 text-[9px] text-slate-400 font-bold pointer-events-none">h</span>
                                  </div>
                                  <button onClick={() => handleSaveDuration(raId, uid, durationInputs[key] ?? 0)} disabled={savingDuration[key] || !raId} title={!raId ? 'Save task first' : 'Save duration'} className={`px-2.5 py-1.5 rounded-lg text-[9px] font-bold uppercase tracking-wide transition-all ${durationSaved[key] ? 'bg-emerald-500 text-white' : 'bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed'}`}>
                                    {savingDuration[key] ? '…' : durationSaved[key] ? '✓' : 'Save'}
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
            )}
          </div>

          {/* Footer Action Bar */}
          <div className="p-6 border-t border-slate-100 bg-slate-50 space-y-4 shrink-0">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block ml-1">Reference Meeting</label>
                <select
                  value={formData.meeting}
                  onChange={e => handleFieldChange('meeting', e.target.value)}
                  className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold outline-none focus:border-indigo-400 transition-all cursor-pointer"
                >
                  <option value="">No Meeting Link</option>
                  {(meetingNotes || []).map(m => <option key={m._id} value={m._id}>{m.title}</option>)}
                </select>
              </div>
            </div>

            <div className="flex justify-between items-center">
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
        </div>
      </div>
    </div>
  );
};

export default TaskDetailModal;
