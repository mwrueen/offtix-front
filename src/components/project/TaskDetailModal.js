import React, { useState, useCallback, useEffect } from 'react';
import TaskWorkflow from './TaskWorkflow';
import { taskAPI } from '../../services/api';

const TaskDetailModal = ({
  task,
  project,
  users,
  taskStatuses,
  sprints,
  phases,
  taskRoles,
  onUpdateTask,
  onClose
}) => {
  const [formData, setFormData] = useState({});
  const [hasChanges, setHasChanges] = useState(false);

  // Per-member duration state
  const [durationInputs, setDurationInputs] = useState({});   // { [raId_userId]: minutes }
  const [savingDuration, setSavingDuration] = useState({});    // { [raId_userId]: bool }
  const [durationSaved, setDurationSaved] = useState({});      // { [raId_userId]: bool }

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

  // Load existing per-member durations whenever the task changes
  const loadDurations = useCallback(async () => {
    if (!task || !project) return;
    try {
      const res = await taskAPI.getTaskDurations(project._id || project.id, task._id);
      const inputs = {};
      (res.data.durations || []).forEach(d => {
        (d.members || []).forEach(m => {
          const uid = m.user?._id || m.user;
          if (uid) inputs[`${d.roleAssignmentId}_${uid}`] = m.durationMinutes ? +(m.durationMinutes / 60).toFixed(2) : '';
        });
      });
      setDurationInputs(inputs);
    } catch (err) {
      console.error('Error loading durations:', err);
    }
  }, [task, project]);

  useEffect(() => { loadDurations(); }, [loadDurations]);

  useEffect(() => {
    const handleEsc = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handleEsc);
    return () => document.removeEventListener('keydown', handleEsc);
  }, [onClose]);

  const handleFieldChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setHasChanges(true);
  };

  const handleSave = async () => {
    if (task && onUpdateTask && hasChanges) {
      const cleanedData = { ...formData };
      if (cleanedData.priority === '') delete cleanedData.priority;
      if (cleanedData.status === '') delete cleanedData.status;
      if (cleanedData.sprint === '') delete cleanedData.sprint;
      if (cleanedData.phase === '') delete cleanedData.phase;
      if (cleanedData.dueDate === '') delete cleanedData.dueDate;
      await onUpdateTask(task._id, cleanedData);
      setHasChanges(false);
      onClose();
    }
  };

  // Save a single member's duration for a role assignment
  const handleSaveDuration = async (raId, userId, hours) => {
    const key = `${raId}_${userId}`;
    setSavingDuration(prev => ({ ...prev, [key]: true }));
    try {
      await taskAPI.setRoleDuration(project._id || project.id, task._id, {
        roleAssignmentId: raId,
        targetUserId: userId,
        durationMinutes: Math.round((Number(hours) || 0) * 60),
      });
      setDurationSaved(prev => ({ ...prev, [key]: true }));
      setTimeout(() => setDurationSaved(prev => ({ ...prev, [key]: false })), 2000);
    } catch (err) {
      console.error('Error saving duration:', err);
    } finally {
      setSavingDuration(prev => ({ ...prev, [key]: false }));
    }
  };

  const getUserInitials = (user) => {
    if (!user || !user.name) return '?';
    const names = user.name.split(' ');
    return names.length >= 2 ? (names[0][0] + names[names.length - 1][0]).toUpperCase() : user.name.substring(0, 2).toUpperCase();
  };

  const getUserColor = (userId) => {
    const colors = ['#0052cc', '#00875a', '#ff8b00', '#6554c0', '#00b8d9', '#ff5630'];
    return colors[userId ? userId.charCodeAt(userId.length - 1) % colors.length : 0];
  };

  if (!task) return null;

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
        backgroundColor: 'rgba(9, 30, 66, 0.54)',
        display: 'flex', alignItems: 'flex-start', justifyContent: 'center',
        paddingTop: '60px', zIndex: 1000, overflowY: 'auto'
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          backgroundColor: 'white', borderRadius: '8px', width: '100%', maxWidth: '800px',
          maxHeight: 'calc(100vh - 120px)', display: 'flex', flexDirection: 'column',
          boxShadow: '0 8px 16px rgba(9, 30, 66, 0.25), 0 0 1px rgba(9, 30, 66, 0.31)',
          marginBottom: '60px'
        }}
      >
        {/* Header */}
        <div style={{
          padding: '20px 24px', borderBottom: '1px solid #dfe1e6',
          display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start'
        }}>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <span style={{
                padding: '2px 8px', backgroundColor: '#0052cc', color: 'white',
                borderRadius: '3px', fontSize: '11px', fontWeight: '600', textTransform: 'uppercase'
              }}>
                {task.issueType || 'Task'}
              </span>
              {task.status && (
                <span style={{
                  padding: '2px 8px', backgroundColor: task.status.color || '#dfe1e6',
                  color: 'white', borderRadius: '3px', fontSize: '11px', fontWeight: '500'
                }}>
                  {task.status.name}
                </span>
              )}
            </div>
            <input
              type="text"
              value={formData.title || ''}
              onChange={(e) => handleFieldChange('title', e.target.value)}
              style={{
                width: '100%', fontSize: '20px', fontWeight: '600', color: '#172b4d',
                border: 'none', outline: 'none', padding: '4px 0',
                backgroundColor: 'transparent'
              }}
              placeholder="Task title"
            />
          </div>
          <button onClick={onClose} style={{
            background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer',
            color: '#5e6c84', padding: '4px', marginLeft: '16px'
          }}>×</button>
        </div>

        {/* Content */}
        <div style={{ flex: 1, overflowY: 'auto', display: 'flex' }}>
          {/* Main Content */}
          <div style={{ flex: 1, padding: '24px', borderRight: '1px solid #dfe1e6' }}>
            {/* Description */}
            <div style={{ marginBottom: '24px' }}>
              <label style={{ fontSize: '12px', fontWeight: '600', color: '#5e6c84', display: 'block', marginBottom: '8px', textTransform: 'uppercase' }}>
                Description
              </label>
              <textarea
                value={formData.description || ''}
                onChange={(e) => handleFieldChange('description', e.target.value)}
                placeholder="Add a description..."
                style={{
                  width: '100%', minHeight: '120px', padding: '12px', border: '1px solid #dfe1e6',
                  borderRadius: '3px', fontSize: '14px', fontFamily: 'inherit', resize: 'vertical',
                  backgroundColor: '#fafbfc', lineHeight: '1.6'
                }}
              />
            </div>

            {/* Duration per Role / Member */}
            <div style={{ marginBottom: '24px' }}>
              <label style={{ fontSize: '12px', fontWeight: '600', color: '#5e6c84', display: 'block', marginBottom: '12px', textTransform: 'uppercase' }}>
                Duration
              </label>
              {task.roleAssignments && task.roleAssignments.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {task.roleAssignments.map(ra => {
                    const raId = ra._id?.toString() || ra._id;
                    const roleObj = taskRoles?.find(r => (r._id === (ra.role?._id || ra.role)));
                    const roleName = ra.role?.name || roleObj?.name || 'Role';
                    const assignees = ra.assignees || [];
                    return (
                      <div key={raId} style={{ backgroundColor: '#f4f5f7', borderRadius: '6px', padding: '12px' }}>
                        {/* Role header */}
                        <div style={{ fontSize: '11px', fontWeight: '700', color: '#0052cc', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '10px' }}>
                          {roleName}
                        </div>
                        {assignees.length === 0 ? (
                          <p style={{ fontSize: '13px', color: '#97a0af', margin: 0 }}>No members assigned</p>
                        ) : (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            {assignees.map(assignee => {
                              const uid = assignee._id?.toString() || assignee._id || assignee?.toString();
                              const userObj = typeof assignee === 'object' ? assignee : users?.find(u => u._id === uid);
                              const key = `${raId}_${uid}`;
                              const isSaving = savingDuration[key];
                              const isSaved = durationSaved[key];
                              return (
                                <div key={uid} style={{ display: 'flex', alignItems: 'center', gap: '10px', backgroundColor: 'white', border: '1px solid #dfe1e6', borderRadius: '4px', padding: '8px 10px' }}>
                                  {/* Avatar */}
                                  <div style={{ width: '28px', height: '28px', borderRadius: '50%', backgroundColor: getUserColor(uid), color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: '600', flexShrink: 0 }}>
                                    {getUserInitials(userObj)}
                                  </div>
                                  {/* Name */}
                                  <span style={{ flex: 1, fontSize: '13px', fontWeight: '500', color: '#172b4d' }}>
                                    {userObj?.name || 'Unknown'}
                                  </span>
                                  {/* Hours input */}
                                  <input
                                    type="number"
                                    min="0"
                                    step="0.5"
                                    placeholder="0"
                                    value={durationInputs[key] ?? ''}
                                    onChange={e => setDurationInputs(prev => ({ ...prev, [key]: e.target.value }))}
                                    style={{ width: '70px', padding: '5px 8px', border: '1px solid #dfe1e6', borderRadius: '3px', fontSize: '13px', textAlign: 'right' }}
                                  />
                                  <span style={{ fontSize: '12px', color: '#5e6c84' }}>hr</span>
                                  {/* Save button */}
                                  <button
                                    onClick={() => handleSaveDuration(raId, uid, durationInputs[key] ?? 0)}
                                    disabled={isSaving}
                                    style={{ padding: '5px 10px', fontSize: '12px', fontWeight: '600', borderRadius: '3px', border: 'none', cursor: isSaving ? 'not-allowed' : 'pointer', backgroundColor: isSaved ? '#00875a' : '#0052cc', color: 'white', minWidth: '52px' }}
                                  >
                                    {isSaving ? '…' : isSaved ? '✓' : 'Save'}
                                  </button>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p style={{ fontSize: '13px', color: '#97a0af' }}>No role assignments on this task.</p>
              )}
            </div>

            {/* Task Workflow */}
            {task && project && (
              <TaskWorkflow
                task={task}
                projectId={project._id || project.id}
                onTaskUpdate={async () => {
                  try {
                    await taskAPI.getTaskWithWorkflow(project._id || project.id, task._id);
                    if (onUpdateTask) await onUpdateTask(task._id, {});
                  } catch (error) {
                    console.error('Error refreshing task:', error);
                  }
                }}
              />
            )}
          </div>

          {/* Side Details */}
          <div style={{ width: '280px', padding: '24px', backgroundColor: '#fafbfc' }}>
            {/* Status */}
            <div style={{ marginBottom: '20px' }}>
              <label style={{ fontSize: '12px', fontWeight: '600', color: '#5e6c84', display: 'block', marginBottom: '8px' }}>STATUS</label>
              <select
                value={formData.status || ''}
                onChange={(e) => handleFieldChange('status', e.target.value)}
                style={{ width: '100%', padding: '8px', border: '1px solid #dfe1e6', borderRadius: '3px', fontSize: '14px', backgroundColor: 'white', cursor: 'pointer' }}
              >
                <option value="">Select status</option>
                {taskStatuses?.map(status => (<option key={status._id} value={status._id}>{status.name}</option>))}
              </select>
            </div>

            {/* Priority */}
            <div style={{ marginBottom: '20px' }}>
              <label style={{ fontSize: '12px', fontWeight: '600', color: '#5e6c84', display: 'block', marginBottom: '8px' }}>PRIORITY</label>
              <select value={formData.priority || ''} onChange={(e) => handleFieldChange('priority', e.target.value)} style={{ width: '100%', padding: '8px', border: '1px solid #dfe1e6', borderRadius: '3px', fontSize: '14px', backgroundColor: 'white', cursor: 'pointer' }}>
                <option value="">None</option>
                <option value="urgent">⬆️ Urgent</option>
                <option value="high">⬆ High</option>
                <option value="medium">➡ Medium</option>
                <option value="low">⬇ Low</option>
              </select>
            </div>

            {/* Due Date */}
            <div style={{ marginBottom: '20px' }}>
              <label style={{ fontSize: '12px', fontWeight: '600', color: '#5e6c84', display: 'block', marginBottom: '8px' }}>DUE DATE</label>
              <input type="date" value={formData.dueDate || ''} onChange={(e) => handleFieldChange('dueDate', e.target.value)} style={{ width: '100%', padding: '8px', border: '1px solid #dfe1e6', borderRadius: '3px', fontSize: '14px', backgroundColor: 'white' }} />
            </div>

            {/* Sprint */}
            {sprints?.length > 0 && (
              <div style={{ marginBottom: '20px' }}>
                <label style={{ fontSize: '12px', fontWeight: '600', color: '#5e6c84', display: 'block', marginBottom: '8px' }}>SPRINT</label>
                <select value={formData.sprint || ''} onChange={(e) => handleFieldChange('sprint', e.target.value)} style={{ width: '100%', padding: '8px', border: '1px solid #dfe1e6', borderRadius: '3px', fontSize: '14px', backgroundColor: 'white', cursor: 'pointer' }}>
                  <option value="">None</option>
                  {sprints.map(sprint => (<option key={sprint._id} value={sprint._id}>{sprint.name}</option>))}
                </select>
              </div>
            )}

            {/* Phase */}
            {phases?.length > 0 && (
              <div style={{ marginBottom: '20px' }}>
                <label style={{ fontSize: '12px', fontWeight: '600', color: '#5e6c84', display: 'block', marginBottom: '8px' }}>PHASE</label>
                <select value={formData.phase || ''} onChange={(e) => handleFieldChange('phase', e.target.value)} style={{ width: '100%', padding: '8px', border: '1px solid #dfe1e6', borderRadius: '3px', fontSize: '14px', backgroundColor: 'white', cursor: 'pointer' }}>
                  <option value="">None</option>
                  {phases.map(phase => (<option key={phase._id} value={phase._id}>{phase.name}</option>))}
                </select>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div style={{ padding: '16px 24px', borderTop: '1px solid #dfe1e6', display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
          <button onClick={onClose} style={{ padding: '10px 16px', backgroundColor: 'white', border: '1px solid #dfe1e6', borderRadius: '3px', fontSize: '14px', fontWeight: '500', cursor: 'pointer', color: '#5e6c84' }}>Cancel</button>
          <button onClick={handleSave} disabled={!hasChanges} style={{ padding: '10px 16px', backgroundColor: hasChanges ? '#0052cc' : '#c1c7d0', border: 'none', borderRadius: '3px', fontSize: '14px', fontWeight: '500', cursor: hasChanges ? 'pointer' : 'not-allowed', color: 'white' }}>Save Changes</button>
        </div>
      </div>
    </div>
  );
};

export default TaskDetailModal;

