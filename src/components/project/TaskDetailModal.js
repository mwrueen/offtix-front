import React, { useState, useRef, useEffect } from 'react';
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
  const [showAssigneeDropdown, setShowAssigneeDropdown] = useState(false);
  const [assigneeSearch, setAssigneeSearch] = useState('');
  const assigneeDropdownRef = useRef(null);

  const [formData, setFormData] = useState({});
  const [hasChanges, setHasChanges] = useState(false);

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
        duration: task.duration || { value: '', unit: 'hours' },
        assignees: task.assignees?.map(a => a._id || a) || [],
        role: task.role?._id || task.role || '',
        roleAssignments: task.roleAssignments?.map(ra => ({
          roleId: ra.role?._id || ra.role,
          userIds: ra.assignees?.map(a => a._id || a) || []
        })) || []
      });
      setHasChanges(false);
    }
  }, [task]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (assigneeDropdownRef.current && !assigneeDropdownRef.current.contains(event.target)) {
        setShowAssigneeDropdown(false);
        setAssigneeSearch('');
      }
    };
    if (showAssigneeDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showAssigneeDropdown]);

  useEffect(() => {
    const handleEsc = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handleEsc);
    return () => document.removeEventListener('keydown', handleEsc);
  }, [onClose]);

  const handleFieldChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setHasChanges(true);

    // Auto-assignment logic if role is changed
    if (field === 'role' && value) {
      const selectedRole = taskRoles.find(r => r._id === value);
      if (selectedRole) {
        const matchingUsers = users.filter(u =>
          u.projectRole && u.projectRole.split(',').map(r => r.trim()).includes(selectedRole.name)
        );

        if (matchingUsers.length === 1) {
          const userId = matchingUsers[0]._id;
          addRoleAssignment(value, userId);
        }
      }
    }
  };

  const addRoleAssignment = (roleId, userId) => {
    setFormData(prev => {
      const currentRoleAssignments = [...(prev.roleAssignments || [])];
      const roleIndex = currentRoleAssignments.findIndex(ra => ra.roleId === roleId);

      if (roleIndex > -1) {
        if (!currentRoleAssignments[roleIndex].userIds.includes(userId)) {
          currentRoleAssignments[roleIndex].userIds.push(userId);
        }
      } else {
        currentRoleAssignments.push({ roleId, userIds: [userId] });
      }

      // Also ensure flat assignees is updated
      const allUserIds = new Set(prev.assignees || []);
      allUserIds.add(userId);

      return {
        ...prev,
        roleAssignments: currentRoleAssignments,
        assignees: Array.from(allUserIds)
      };
    });
    setHasChanges(true);
  };

  const removeRoleAssignment = (roleId, userId) => {
    setFormData(prev => {
      const currentRoleAssignments = (prev.roleAssignments || [])
        .map(ra => {
          if (ra.roleId === roleId) {
            return { ...ra, userIds: ra.userIds.filter(id => id !== userId) };
          }
          return ra;
        })
        .filter(ra => ra.userIds.length > 0);

      // Re-calculate flat assignees
      const allUserIds = new Set();
      currentRoleAssignments.forEach(ra => ra.userIds.forEach(id => allUserIds.add(id)));

      return {
        ...prev,
        roleAssignments: currentRoleAssignments,
        assignees: Array.from(allUserIds)
      };
    });
    setHasChanges(true);
  };

  const handleToggleAssignee = (userId) => {
    if (!formData.role) return; // Must have role to add role-wise

    const roleId = formData.role;
    const currentAssignments = formData.roleAssignments || [];
    const isAssignedToThisRole = currentAssignments.some(ra => ra.roleId === roleId && ra.userIds.includes(userId));

    if (isAssignedToThisRole) {
      removeRoleAssignment(roleId, userId);
    } else {
      addRoleAssignment(roleId, userId);
    }
  };

  const handleSave = async () => {
    if (task && onUpdateTask && hasChanges) {
      const cleanedData = { ...formData };

      // Format roleAssignments for backend
      if (cleanedData.roleAssignments) {
        cleanedData.roleAssignments = cleanedData.roleAssignments.map((ra, idx) => ({
          role: ra.roleId,
          assignees: ra.userIds,
          order: idx + 1
        }));
        cleanedData.useRoleWorkflow = cleanedData.roleAssignments.length > 0;
      }

      if (cleanedData.priority === '') delete cleanedData.priority;
      if (cleanedData.status === '') delete cleanedData.status;
      if (cleanedData.sprint === '') delete cleanedData.sprint;
      if (cleanedData.phase === '') delete cleanedData.phase;
      if (cleanedData.dueDate === '') delete cleanedData.dueDate;
      if (cleanedData.duration && (!cleanedData.duration.value || cleanedData.duration.value === '')) {
        delete cleanedData.duration;
      }

      await onUpdateTask(task._id, cleanedData);
      setHasChanges(false);
      onClose();
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

  const selectedAssignees = users.filter(u => formData.assignees?.includes(u._id)) || [];
  const filteredUsers = users.filter(user => {
    const matchesSearch = (user.name || '').toLowerCase().includes(assigneeSearch.toLowerCase());
    if (!formData.role) return matchesSearch;

    const selectedRoleObj = taskRoles.find(r => r._id === formData.role);
    if (!selectedRoleObj) return matchesSearch;

    const userRoles = (user.projectRole || '').split(',').map(r => r.trim());
    return matchesSearch && userRoles.includes(selectedRoleObj.name);
  });

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
            <div style={{ marginBottom: '24px' }}>
              <label style={{ fontSize: '12px', fontWeight: '600', color: '#5e6c84', display: 'block', marginBottom: '8px', textTransform: 'uppercase' }}>
                Description
              </label>
              <textarea
                value={formData.description || ''}
                onChange={(e) => handleFieldChange('description', e.target.value)}
                placeholder="Add a description..."
                style={{
                  width: '100%', minHeight: '150px', padding: '12px', border: '1px solid #dfe1e6',
                  borderRadius: '3px', fontSize: '14px', fontFamily: 'inherit', resize: 'vertical',
                  backgroundColor: '#fafbfc', lineHeight: '1.6'
                }}
              />
            </div>

            {/* Duration */}
            <div style={{ marginBottom: '24px' }}>
              <label style={{ fontSize: '12px', fontWeight: '600', color: '#5e6c84', display: 'block', marginBottom: '8px', textTransform: 'uppercase' }}>
                Duration
              </label>
              <div style={{ display: 'flex', gap: '8px' }}>
                <input
                  type="number"
                  placeholder="0"
                  value={formData.duration?.value || ''}
                  onChange={(e) => handleFieldChange('duration', { value: e.target.value ? parseFloat(e.target.value) : undefined, unit: formData.duration?.unit || 'hours' })}
                  min="0" step="0.5"
                  style={{ flex: 1, padding: '8px', border: '1px solid #dfe1e6', borderRadius: '3px', fontSize: '14px' }}
                />
                <select
                  value={formData.duration?.unit || 'hours'}
                  onChange={(e) => handleFieldChange('duration', { value: formData.duration?.value, unit: e.target.value })}
                  style={{ padding: '8px', border: '1px solid #dfe1e6', borderRadius: '3px', fontSize: '14px', minWidth: '100px', cursor: 'pointer' }}
                >
                  <option value="minutes">Minutes</option>
                  <option value="hours">Hours</option>
                  <option value="days">Days</option>
                  <option value="weeks">Weeks</option>
                </select>
              </div>
            </div>

            {/* Task Workflow */}
            {task && project && (
              <TaskWorkflow
                task={task}
                projectId={project._id || project.id}
                onTaskUpdate={async (updatedTask) => {
                  // Refresh task data
                  try {
                    const response = await taskAPI.getTaskWithWorkflow(project._id || project.id, task._id);
                    if (onUpdateTask) {
                      // Trigger refresh by calling update
                      await onUpdateTask(task._id, {});
                    }
                  } catch (error) {
                    console.error('Error refreshing task:', error);
                  }
                }}
              />
            )}
          </div>

          {/* Side Details */}
          <div style={{ width: '280px', padding: '24px', backgroundColor: '#fafbfc' }}>
            {/* Role */}
            <div style={{ marginBottom: '20px' }}>
              <label style={{ fontSize: '12px', fontWeight: '600', color: '#5e6c84', display: 'block', marginBottom: '8px' }}>ROLE</label>
              <select
                value={formData.role || ''}
                onChange={(e) => handleFieldChange('role', e.target.value)}
                style={{ width: '100%', padding: '8px', border: '1px solid #dfe1e6', borderRadius: '3px', fontSize: '14px', backgroundColor: 'white', cursor: 'pointer' }}
              >
                <option value="">Select role</option>
                {taskRoles?.map(role => (<option key={role._id} value={role._id}>{role.name}</option>))}
              </select>
            </div>

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

            {/* Assignees */}
            <div style={{ marginBottom: '20px' }} ref={assigneeDropdownRef}>
              <label style={{ fontSize: '12px', fontWeight: '600', color: '#5e6c84', display: 'block', marginBottom: '8px' }}>ASSIGNEES</label>
              <div style={{ position: 'relative' }}>
                <div onClick={() => setShowAssigneeDropdown(!showAssigneeDropdown)} style={{ padding: '8px', backgroundColor: 'white', border: '1px solid #dfe1e6', borderRadius: '3px', cursor: 'pointer', minHeight: '38px' }}>
                  <span style={{ color: '#5e6c84', fontSize: '14px' }}>
                    {formData.role ? 'Select users for role...' : 'Select role first to assign'}
                  </span>
                </div>
                {showAssigneeDropdown && formData.role && (
                  <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, marginTop: '4px', backgroundColor: 'white', border: '1px solid #dfe1e6', borderRadius: '3px', boxShadow: '0 4px 8px rgba(9, 30, 66, 0.25)', zIndex: 1000, maxHeight: '200px', overflowY: 'auto' }}>
                    <input type="text" placeholder="Search users..." value={assigneeSearch} onChange={(e) => setAssigneeSearch(e.target.value)} autoFocus style={{ width: '100%', padding: '8px', border: 'none', borderBottom: '1px solid #dfe1e6', fontSize: '14px', outline: 'none' }} />
                    {filteredUsers.map(user => {
                      const isSelected = formData.roleAssignments?.some(ra => ra.roleId === formData.role && ra.userIds.includes(user._id));
                      return (
                        <div key={user._id} onClick={() => handleToggleAssignee(user._id)} style={{ padding: '8px 12px', cursor: 'pointer', backgroundColor: isSelected ? '#deebff' : 'transparent', display: 'flex', alignItems: 'center', gap: '8px' }} onMouseEnter={(e) => { if (!isSelected) e.currentTarget.style.backgroundColor = '#f4f5f7'; }} onMouseLeave={(e) => { if (!isSelected) e.currentTarget.style.backgroundColor = 'transparent'; }}>
                          <div style={{ width: '24px', height: '24px', borderRadius: '50%', backgroundColor: getUserColor(user._id), color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: '600' }}>{getUserInitials(user)}</div>
                          <span style={{ fontSize: '14px', flex: 1 }}>{user.name}</span>
                          {isSelected && <span style={{ color: '#0052cc' }}>✓</span>}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Role Assignments List */}
            {formData.roleAssignments?.length > 0 && (
              <div style={{ marginBottom: '20px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {formData.roleAssignments.map((ra, idx) => {
                    const roleObj = taskRoles.find(r => r._id === ra.roleId);
                    return ra.userIds.map(uid => {
                      const userObj = users.find(u => u._id === uid);
                      return (
                        <div key={`${ra.roleId}-${uid}`} style={{
                          display: 'flex', alignItems: 'center', gap: '8px',
                          backgroundColor: 'white', border: '1px solid #dfe1e6',
                          padding: '6px 10px', borderRadius: '3px', fontSize: '13px'
                        }}>
                          <div style={{ width: '24px', height: '24px', borderRadius: '50%', backgroundColor: getUserColor(uid), color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', fontWeight: '600' }}>
                            {getUserInitials(userObj)}
                          </div>
                          <div style={{ flex: 1 }}>
                            <span style={{ fontWeight: '500' }}>{userObj?.name}</span>
                            <span style={{ marginLeft: '8px', padding: '2px 6px', backgroundColor: '#e6effc', color: '#0052cc', borderRadius: '3px', fontSize: '11px' }}>
                              {roleObj?.name}
                            </span>
                          </div>
                          <button
                            onClick={() => removeRoleAssignment(ra.roleId, uid)}
                            style={{ background: 'none', border: 'none', color: '#de350b', cursor: 'pointer', fontSize: '16px', fontWeight: 'bold' }}
                          >
                            ×
                          </button>
                        </div>
                      );
                    });
                  })}
                </div>
              </div>
            )}

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

