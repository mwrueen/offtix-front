import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import TaskWorkflow from './TaskWorkflow';
import { taskAPI } from '../../services/api';

const TaskDetailsSidebar = ({
  selectedTask,
  project,
  users,
  taskStatuses,
  sprints,
  phases,
  onUpdateTask,
  onClose,
  isCollapsed,
  onToggleCollapse
}) => {
  const { state: authState } = useAuth();
  const [editingField, setEditingField] = useState(null);
  const [showAssigneeDropdown, setShowAssigneeDropdown] = useState(false);
  const [assigneeSearch, setAssigneeSearch] = useState('');
  const assigneeDropdownRef = useRef(null);

  const [formData, setFormData] = useState({});
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    if (selectedTask) {
      setFormData({
        title: selectedTask.title || '',
        description: selectedTask.description || '',
        status: selectedTask.status?._id || selectedTask.status || '',
        priority: selectedTask.priority || '',
        sprint: selectedTask.sprint?._id || '',
        phase: selectedTask.phase?._id || '',
        dueDate: selectedTask.dueDate ? new Date(selectedTask.dueDate).toISOString().split('T')[0] : '',
        duration: selectedTask.duration || { value: '', unit: 'hours' },
        assignees: selectedTask.assignees?.map(a => a._id) || []
      });
      setHasChanges(false);
    }
  }, [selectedTask]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (assigneeDropdownRef.current && !assigneeDropdownRef.current.contains(event.target)) {
        setShowAssigneeDropdown(false);
        setAssigneeSearch('');
      }
    };
    if (showAssigneeDropdown) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showAssigneeDropdown]);

  const handleFieldChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setHasChanges(true);
  };

  const handleToggleAssignee = (userId) => {
    if (!selectedTask) return;
    const currentAssignees = formData.assignees || [];
    const newAssignees = currentAssignees.includes(userId)
      ? currentAssignees.filter(id => id !== userId)
      : [...currentAssignees, userId];
    handleFieldChange('assignees', newAssignees);
  };

  const handleSave = async () => {
    if (selectedTask && onUpdateTask && hasChanges) {
      const cleanedData = { ...formData };
      if (cleanedData.priority === '') delete cleanedData.priority;
      if (cleanedData.status === '') delete cleanedData.status;
      if (cleanedData.sprint === '') delete cleanedData.sprint;
      if (cleanedData.phase === '') delete cleanedData.phase;
      if (cleanedData.dueDate === '') delete cleanedData.dueDate;
      if (cleanedData.duration && (!cleanedData.duration.value || cleanedData.duration.value === '')) delete cleanedData.duration;
      await onUpdateTask(selectedTask._id, cleanedData);
      setHasChanges(false);
    }
  };

  const handleCancel = () => {
    if (selectedTask) {
      setFormData({
        title: selectedTask.title || '',
        description: selectedTask.description || '',
        status: selectedTask.status?._id || selectedTask.status || '',
        priority: selectedTask.priority || '',
        sprint: selectedTask.sprint?._id || '',
        phase: selectedTask.phase?._id || '',
        dueDate: selectedTask.dueDate ? new Date(selectedTask.dueDate).toISOString().split('T')[0] : '',
        duration: selectedTask.duration || { value: '', unit: 'hours' },
        assignees: selectedTask.assignees?.map(a => a._id) || []
      });
      setHasChanges(false);
    }
  };

  const getUserInitials = (user) => {
    if (!user || !user.name) return '?';
    const names = user.name.split(' ');
    if (names.length >= 2) return (names[0][0] + names[names.length - 1][0]).toUpperCase();
    return user.name.substring(0, 2).toUpperCase();
  };

  const getPriorityConfig = (priority) => {
    const map = {
      urgent: { icon: '!', label: 'Critical', bg: 'bg-rose-600', text: 'text-white' },
      high: { icon: '↑', label: 'High', bg: 'bg-rose-100', text: 'text-rose-600' },
      medium: { icon: '-', label: 'Medium', bg: 'bg-indigo-100', text: 'text-indigo-600' },
      low: { icon: '↓', label: 'Low', bg: 'bg-slate-100', text: 'text-slate-500' }
    };
    return map[priority] || { icon: '?', label: 'None', bg: 'bg-slate-50', text: 'text-slate-400' };
  };

  if (isCollapsed) {
    return (
      <div className="w-12 bg-slate-50 border-l border-slate-200 flex flex-col items-center pt-4 transition-all h-screen sticky top-0">
        <button onClick={onToggleCollapse} className="p-2 rounded-lg hover:bg-slate-200 text-slate-400 transition-all font-bold" title="Expand Details">◀</button>
      </div>
    );
  }

  if (!selectedTask) {
    return (
      <div className="w-[400px] bg-slate-50 border-l border-slate-200 overflow-y-auto p-10 relative h-screen sticky top-0 font-sans">
        <button onClick={onToggleCollapse} className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-900 font-bold">▶</button>
        <div className="space-y-10">
          <div>
            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-6 italic underline underline-offset-8">Project Hub Overview</h3>
            <div className="p-8 bg-white rounded-3xl border border-slate-200 shadow-sm space-y-2">
              <h2 className="text-xl font-bold text-slate-900 uppercase italic tracking-tight">{project.title}</h2>
              <div className="text-xs text-slate-500 italic leading-relaxed" dangerouslySetInnerHTML={{ __html: project.description || '' }} />
            </div>
          </div>

          <div>
            <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-6">Staff Roster ({users.length})</h3>
            <div className="grid grid-cols-1 gap-3">
              {users.map(user => (
                <div key={user._id} className="flex items-center gap-4 p-3 bg-white border border-slate-100 rounded-2xl hover:border-indigo-100 transition-all group">
                  <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center text-xs font-bold shadow-md group-hover:scale-110 transition-transform">{getUserInitials(user)}</div>
                  <div>
                    <div className="text-xs font-bold text-slate-900 italic">{user.name}</div>
                    <div className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">{user.email}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  const priorityCfg = getPriorityConfig(formData.priority || selectedTask.priority);
  const selectedAssignees = users.filter(u => formData.assignees?.includes(u._id)) || [];
  const filteredUsers = users.filter(user => user.name.toLowerCase().includes(assigneeSearch.toLowerCase()));

  return (
    <div className="w-[420px] bg-slate-50 border-l border-slate-200 overflow-y-auto flex flex-col h-screen sticky top-0 font-sans shadow-2xl">
      <div className="px-8 py-6 bg-white border-b border-slate-100 flex justify-between items-center z-20">
        <div className="flex items-center gap-3">
          <span className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center text-xs font-bold italic shadow-md">T</span>
          <span className="text-[10px] font-bold text-slate-900 uppercase tracking-widest italic">Task Inspector</span>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={onToggleCollapse} className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-slate-950 font-bold">▶</button>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-rose-600 text-xl font-bold">✕</button>
        </div>
      </div>

      <div className="p-8 space-y-8 flex-1">
        <div className="p-8 bg-white rounded-3xl border border-slate-200 shadow-sm space-y-4 group">
          <input
            className="w-full text-lg font-bold text-slate-950 uppercase italic tracking-tight outline-none focus:text-indigo-600 transition-colors bg-transparent"
            value={formData.title}
            onChange={(e) => handleFieldChange('title', e.target.value)}
          />
          <textarea
            value={formData.description || ''}
            onChange={(e) => handleFieldChange('description', e.target.value)}
            placeholder="Document task requirements..."
            className="w-full min-h-[120px] p-4 bg-slate-50 border border-slate-100 rounded-2xl text-xs font-medium text-slate-600 italic leading-relaxed outline-none focus:bg-white focus:border-indigo-100 transition-all resize-none"
          />
        </div>

        <div className="space-y-6">
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Lifecycle Status</label>
            <div className="grid grid-cols-1 gap-2">
              {selectedTask.status && (
                <div className="px-5 py-2.5 bg-indigo-600 text-white rounded-xl text-[10px] font-bold uppercase tracking-widest italic shadow-lg flex items-center gap-3">
                  <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                  {selectedTask.status.name}
                </div>
              )}
              <select
                value={formData.status || ''}
                onChange={(e) => handleFieldChange('status', e.target.value)}
                className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-[10px] font-bold uppercase tracking-widest text-slate-900 outline-none focus:border-indigo-400 cursor-pointer shadow-sm transition-all"
              >
                <option value="">Update Hub Status</option>
                {taskStatuses?.map(status => <option key={status._id} value={status._id}>{status.name}</option>)}
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Assigned Personnel</label>
            <div className="relative" ref={assigneeDropdownRef}>
              <div onClick={() => setShowAssigneeDropdown(!showAssigneeDropdown)} className="p-4 bg-white border border-slate-200 rounded-2xl cursor-pointer min-h-[50px] flex flex-wrap gap-2 shadow-sm hover:border-indigo-100 transition-all">
                {selectedAssignees.length > 0 ? selectedAssignees.map(user => (
                  <div key={user._id} className="flex items-center gap-2 px-3 py-1 bg-slate-100 border border-slate-200 rounded-lg text-[10px] font-bold text-slate-600 uppercase tracking-tight italic">
                    <div className="w-5 h-5 rounded-md bg-slate-900 text-white flex items-center justify-center text-[8px]">{getUserInitials(user)}</div>
                    <span>{user.name}</span>
                  </div>
                )) : <span className="text-[10px] text-slate-400 font-bold italic uppercase tracking-widest mt-0.5">Unassigned Entity</span>}
              </div>

              {showAssigneeDropdown && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-slate-200 rounded-3xl shadow-xl z-[100] max-h-[280px] overflow-hidden flex flex-col font-sans">
                  <input type="text" placeholder="Search roster..." value={assigneeSearch} onChange={(e) => setAssigneeSearch(e.target.value)} autoFocus className="w-full px-6 py-4 text-xs font-bold border-b border-slate-100 outline-none focus:bg-slate-50 transition-all uppercase italic" />
                  <div className="overflow-y-auto flex-1">
                    {filteredUsers.map(user => {
                      const isSelected = selectedAssignees.some(a => a._id === user._id);
                      return (
                        <div key={user._id} onClick={() => handleToggleAssignee(user._id)} className={`flex items-center gap-4 px-6 py-4 cursor-pointer transition-all ${isSelected ? 'bg-indigo-50 border-l-4 border-indigo-600' : 'hover:bg-slate-50 border-l-4 border-transparent'}`}>
                          <div className="w-8 h-8 rounded-lg bg-slate-900 text-white flex items-center justify-center text-[10px] font-bold italic shadow-sm">{getUserInitials(user)}</div>
                          <div className="flex-1">
                            <div className="text-xs font-bold text-slate-900 italic">{user.name}</div>
                            <div className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">{user.email}</div>
                          </div>
                          {isSelected && <span className="text-indigo-600 font-bold">✓</span>}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Priority Scale</label>
              <div className="space-y-2">
                {selectedTask.priority && (
                  <div className={`px-4 py-2.5 rounded-xl text-[9px] font-bold uppercase tracking-widest shadow-sm flex items-center gap-2 italic ${priorityCfg.bg} ${priorityCfg.text}`}>
                    <span className="font-bold text-sm">{priorityCfg.icon}</span>
                    {selectedTask.priority}
                  </div>
                )}
                <select value={formData.priority || ''} onChange={(e) => handleFieldChange('priority', e.target.value)} className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-[10px] font-bold uppercase tracking-widest text-slate-900 outline-none bg-white shadow-sm">
                  <option value="">None</option>
                  <option value="urgent">Critical !</option>
                  <option value="high">High +</option>
                  <option value="medium">Medium =</option>
                  <option value="low">Low -</option>
                </select>
              </div>
            </div>
            <div className="space-y-2 text-right">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mr-1 text-right block">Timeline Target</label>
              <input type="date" value={formData.dueDate || ''} onChange={(e) => handleFieldChange('dueDate', e.target.value)} className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-[10px] font-bold uppercase tracking-widest text-indigo-600 outline-none shadow-sm text-center" />
            </div>
          </div>

          <div className="pt-8 border-t border-slate-100">
            <TaskWorkflow task={selectedTask} projectId={project._id || project.id} onRefresh={() => onUpdateTask(selectedTask._id, {})} />
          </div>
        </div>
      </div>

      {hasChanges && (
        <div className="p-8 bg-slate-950 text-white animate-in slide-in-from-bottom-full duration-500 shadow-2xl relative z-30">
          <p className="text-[9px] font-bold text-indigo-400 uppercase tracking-widest mb-4 italic text-center">Protocol Changes Detected</p>
          <div className="flex gap-4">
            <button onClick={handleCancel} className="flex-1 py-4 text-[10px] font-bold uppercase tracking-widest text-slate-400 hover:text-white transition-all italic underline underline-offset-8">Abort</button>
            <button onClick={handleSave} className="flex-[2] py-4 bg-indigo-600 text-white rounded-xl font-bold text-[10px] uppercase tracking-widest shadow-lg hover:bg-emerald-600 transition-all italic">Commit Shifts</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default TaskDetailsSidebar;
