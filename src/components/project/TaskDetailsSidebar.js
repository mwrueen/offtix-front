import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';

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

  // Local state for form fields
  const [formData, setFormData] = useState({});
  const [hasChanges, setHasChanges] = useState(false);

  // Initialize form data when selectedTask changes
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

  // Click outside handler for assignee dropdown
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

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
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
      // Clean up the form data before sending
      const cleanedData = { ...formData };

      // Remove empty string values and replace with undefined
      if (cleanedData.priority === '') {
        delete cleanedData.priority;
      }
      if (cleanedData.status === '') {
        delete cleanedData.status;
      }
      if (cleanedData.sprint === '') {
        delete cleanedData.sprint;
      }
      if (cleanedData.phase === '') {
        delete cleanedData.phase;
      }
      if (cleanedData.dueDate === '') {
        delete cleanedData.dueDate;
      }

      // Clean up duration - remove if value is empty or undefined
      if (cleanedData.duration) {
        if (!cleanedData.duration.value || cleanedData.duration.value === '') {
          delete cleanedData.duration;
        }
      }

      await onUpdateTask(selectedTask._id, cleanedData);
      setHasChanges(false);
    }
  };

  const handleCancel = () => {
    // Reset form data to original task data
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
    if (names.length >= 2) {
      return (names[0][0] + names[names.length - 1][0]).toUpperCase();
    }
    return user.name.substring(0, 2).toUpperCase();
  };

  const getUserColor = (userId) => {
    const colors = ['#0052cc', '#00875a', '#ff8b00', '#6554c0', '#00b8d9', '#ff5630'];
    const index = userId ? userId.charCodeAt(userId.length - 1) % colors.length : 0;
    return colors[index];
  };

  const getPriorityIcon = (priority) => {
    const icons = {
      urgent: { icon: '⬆️', color: '#d73527', label: 'Urgent' },
      high: { icon: '⬆', color: '#ff8b00', label: 'High' },
      medium: { icon: '➡', color: '#ffab00', label: 'Medium' },
      low: { icon: '⬇', color: '#36b37e', label: 'Low' }
    };
    return icons[priority] || { icon: '➡', color: '#6b7280', label: 'None' };
  };

  const getIssueTypeIcon = (type) => {
    const types = {
      task: { icon: '✓', color: '#0052cc', label: 'Task' },
      bug: { icon: '🐛', color: '#de350b', label: 'Bug' },
      story: { icon: '📖', color: '#00875a', label: 'Story' },
      epic: { icon: '⚡', color: '#6554c0', label: 'Epic' }
    };
    return types[type] || types.task;
  };

  // Collapsed view
  if (isCollapsed) {
    return (
      <div style={{
        width: '48px',
        backgroundColor: '#f4f5f7',
        borderLeft: '1px solid #dfe1e6',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        paddingTop: '16px'
      }}>
        <button
          onClick={onToggleCollapse}
          style={{
            background: 'none',
            border: 'none',
            fontSize: '20px',
            cursor: 'pointer',
            color: '#5e6c84',
            padding: '8px',
            borderRadius: '3px',
            transition: 'background-color 0.2s'
          }}
          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#dfe1e6'}
          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
          title="Expand sidebar"
        >
          ◀
        </button>
      </div>
    );
  }

  // If no task is selected, show project information
  if (!selectedTask) {
    return (
      <div style={{
        width: '380px',
        backgroundColor: '#f4f5f7',
        borderLeft: '1px solid #dfe1e6',
        overflowY: 'auto',
        padding: '24px',
        position: 'relative'
      }}>
        <button
          onClick={onToggleCollapse}
          style={{
            position: 'absolute',
            top: '16px',
            right: '16px',
            background: 'none',
            border: 'none',
            fontSize: '16px',
            cursor: 'pointer',
            color: '#5e6c84',
            padding: '4px',
            borderRadius: '3px'
          }}
          title="Collapse sidebar"
        >
          ▶
        </button>
        <h3 style={{ margin: '0 0 20px 0', fontSize: '16px', fontWeight: '600', color: '#172b4d' }}>
          Project Details
        </h3>
        
        {/* Project Info */}
        <div style={{ marginBottom: '24px' }}>
          <div style={{ fontSize: '12px', fontWeight: '600', color: '#5e6c84', marginBottom: '8px', textTransform: 'uppercase' }}>
            Project Name
          </div>
          <div style={{ fontSize: '14px', color: '#172b4d' }}>
            {project.title}
          </div>
        </div>

        {project.description && (
          <div style={{ marginBottom: '24px' }}>
            <div style={{ fontSize: '12px', fontWeight: '600', color: '#5e6c84', marginBottom: '8px', textTransform: 'uppercase' }}>
              Description
            </div>
            <div style={{ fontSize: '14px', color: '#172b4d', lineHeight: '1.5' }}>
              {project.description}
            </div>
          </div>
        )}

        {/* Team Members */}
        <div style={{ marginBottom: '24px' }}>
          <div style={{ fontSize: '12px', fontWeight: '600', color: '#5e6c84', marginBottom: '8px', textTransform: 'uppercase' }}>
            Team Members ({users.length})
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {users.map(user => (
              <div key={user._id} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  backgroundColor: getUserColor(user._id),
                  color: 'white',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '12px',
                  fontWeight: '600'
                }}>
                  {getUserInitials(user)}
                </div>
                <div>
                  <div style={{ fontSize: '14px', color: '#172b4d', fontWeight: '500' }}>
                    {user.name}
                  </div>
                  <div style={{ fontSize: '12px', color: '#5e6c84' }}>
                    {user.email}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Activity */}
        <div>
          <div style={{ fontSize: '12px', fontWeight: '600', color: '#5e6c84', marginBottom: '8px', textTransform: 'uppercase' }}>
            Recent Activity
          </div>
          {project.activityLog && project.activityLog.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {project.activityLog.slice(-5).reverse().map((activity, index) => (
                <div key={index} style={{
                  padding: '12px',
                  backgroundColor: 'white',
                  borderRadius: '3px',
                  border: '1px solid #dfe1e6'
                }}>
                  <div style={{ fontSize: '13px', color: '#172b4d', marginBottom: '4px' }}>
                    {activity.description || activity.action}
                  </div>
                  <div style={{ fontSize: '11px', color: '#5e6c84' }}>
                    {new Date(activity.timestamp).toLocaleString()}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ fontSize: '13px', color: '#5e6c84', fontStyle: 'italic' }}>
              No recent activity
            </div>
          )}
        </div>
      </div>
    );
  }

  // Show task details
  const issueType = getIssueTypeIcon(selectedTask.issueType || 'task');
  const priority = getPriorityIcon(formData.priority || selectedTask.priority);
  const selectedAssignees = users.filter(u => formData.assignees?.includes(u._id)) || [];
  const filteredUsers = users.filter(user =>
    user.name.toLowerCase().includes(assigneeSearch.toLowerCase())
  );

  return (
    <div style={{
      width: '380px',
      backgroundColor: '#f4f5f7',
      borderLeft: '1px solid #dfe1e6',
      overflowY: 'auto',
      display: 'flex',
      flexDirection: 'column'
    }}>
      {/* Header */}
      <div style={{
        padding: '16px 24px',
        borderBottom: '1px solid #dfe1e6',
        backgroundColor: 'white',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '16px' }}>{issueType.icon}</span>
          <span style={{ fontSize: '12px', color: '#5e6c84', fontWeight: '600' }}>
            {issueType.label.toUpperCase()}
          </span>
        </div>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <button
            onClick={onToggleCollapse}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '16px',
              cursor: 'pointer',
              color: '#5e6c84',
              padding: '4px'
            }}
            title="Collapse sidebar"
          >
            ▶
          </button>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '20px',
              cursor: 'pointer',
              color: '#5e6c84',
              padding: '4px'
            }}
          >
            ✕
          </button>
        </div>
      </div>

      {/* Content */}
      <div style={{ padding: '24px', flex: 1 }}>
        {/* Title */}
        <div style={{ marginBottom: '24px' }}>
          <div style={{ fontSize: '20px', fontWeight: '600', color: '#172b4d', lineHeight: '1.3' }}>
            {selectedTask.title}
          </div>
        </div>

        {/* Description */}
        <div style={{ marginBottom: '24px' }}>
          <div style={{ fontSize: '12px', fontWeight: '600', color: '#5e6c84', marginBottom: '8px', textTransform: 'uppercase' }}>
            Description
          </div>
          <textarea
            value={formData.description || ''}
            onChange={(e) => handleFieldChange('description', e.target.value)}
            placeholder="Add a description..."
            style={{
              width: '100%',
              minHeight: '100px',
              padding: '8px',
              border: '1px solid #dfe1e6',
              borderRadius: '3px',
              fontSize: '14px',
              fontFamily: 'inherit',
              resize: 'vertical',
              backgroundColor: 'white'
            }}
          />
        </div>

        {/* Details Section */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Status */}
          <div>
            <div style={{ fontSize: '12px', fontWeight: '600', color: '#5e6c84', marginBottom: '8px' }}>
              STATUS
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {/* Current Status Display */}
              {selectedTask.status && (
                <div style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '6px 12px',
                  backgroundColor: selectedTask.status.color || '#dfe1e6',
                  color: 'white',
                  borderRadius: '3px',
                  fontSize: '13px',
                  fontWeight: '500',
                  alignSelf: 'flex-start'
                }}>
                  <span style={{
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    backgroundColor: 'white'
                  }} />
                  {selectedTask.status.name}
                </div>
              )}

              {/* Status Dropdown */}
              <select
                value={formData.status || ''}
                onChange={(e) => handleFieldChange('status', e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px',
                  border: '1px solid #dfe1e6',
                  borderRadius: '3px',
                  fontSize: '14px',
                  backgroundColor: 'white',
                  cursor: 'pointer'
                }}
              >
                <option value="">Select status</option>
                {taskStatuses && taskStatuses.length > 0 ? (
                  taskStatuses.map(status => (
                    <option key={status._id} value={status._id}>{status.name}</option>
                  ))
                ) : (
                  <option disabled>No statuses available</option>
                )}
              </select>
            </div>
          </div>

          {/* Assignees */}
          <div ref={assigneeDropdownRef}>
            <div style={{ fontSize: '12px', fontWeight: '600', color: '#5e6c84', marginBottom: '8px' }}>
              ASSIGNEES
            </div>
            <div style={{ position: 'relative' }}>
              <div
                onClick={() => setShowAssigneeDropdown(!showAssigneeDropdown)}
                style={{
                  padding: '8px',
                  backgroundColor: 'white',
                  border: '1px solid #dfe1e6',
                  borderRadius: '3px',
                  cursor: 'pointer',
                  minHeight: '38px'
                }}
              >
                {selectedAssignees.length > 0 ? (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                    {selectedAssignees.map(user => (
                      <div key={user._id} style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        padding: '2px 6px',
                        backgroundColor: '#f4f5f7',
                        borderRadius: '3px',
                        fontSize: '12px'
                      }}>
                        <div style={{
                          width: '20px',
                          height: '20px',
                          borderRadius: '50%',
                          backgroundColor: getUserColor(user._id),
                          color: 'white',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '10px',
                          fontWeight: '600'
                        }}>
                          {getUserInitials(user)}
                        </div>
                        <span>{user.name}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <span style={{ color: '#5e6c84', fontSize: '14px' }}>Unassigned</span>
                )}
              </div>

              {showAssigneeDropdown && (
                <div style={{
                  position: 'absolute',
                  top: '100%',
                  left: 0,
                  right: 0,
                  marginTop: '4px',
                  backgroundColor: 'white',
                  border: '1px solid #dfe1e6',
                  borderRadius: '3px',
                  boxShadow: '0 4px 8px rgba(9, 30, 66, 0.25)',
                  zIndex: 1000,
                  maxHeight: '300px',
                  overflowY: 'auto'
                }}>
                  <input
                    type="text"
                    placeholder="Search users..."
                    value={assigneeSearch}
                    onChange={(e) => setAssigneeSearch(e.target.value)}
                    autoFocus
                    style={{
                      width: '100%',
                      padding: '8px',
                      border: 'none',
                      borderBottom: '1px solid #dfe1e6',
                      fontSize: '14px',
                      outline: 'none'
                    }}
                  />
                  {filteredUsers && filteredUsers.length > 0 ? (
                    filteredUsers.map(user => {
                      const isSelected = selectedAssignees.some(a => a._id === user._id);
                      return (
                        <div
                          key={user._id}
                          onClick={() => handleToggleAssignee(user._id)}
                          style={{
                            padding: '8px 12px',
                            cursor: 'pointer',
                            backgroundColor: isSelected ? '#deebff' : 'transparent',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px'
                          }}
                          onMouseEnter={(e) => {
                            if (!isSelected) e.currentTarget.style.backgroundColor = '#f4f5f7';
                          }}
                          onMouseLeave={(e) => {
                            if (!isSelected) e.currentTarget.style.backgroundColor = 'transparent';
                          }}
                        >
                          <div style={{
                            width: '24px',
                            height: '24px',
                            borderRadius: '50%',
                            backgroundColor: getUserColor(user._id),
                            color: 'white',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '11px',
                            fontWeight: '600'
                          }}>
                            {getUserInitials(user)}
                          </div>
                          <span style={{ fontSize: '14px', flex: 1 }}>{user.name}</span>
                          {isSelected && (
                            <span style={{ color: '#0052cc', fontSize: '16px' }}>✓</span>
                          )}
                        </div>
                      );
                    })
                  ) : (
                    <div style={{ padding: '12px', textAlign: 'center', color: '#5e6c84', fontSize: '14px' }}>
                      No users found
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Priority */}
          <div>
            <div style={{ fontSize: '12px', fontWeight: '600', color: '#5e6c84', marginBottom: '8px' }}>
              PRIORITY
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {/* Current Priority Display */}
              {selectedTask.priority && (
                <div style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '6px 12px',
                  backgroundColor:
                    selectedTask.priority === 'urgent' ? '#de350b' :
                    selectedTask.priority === 'high' ? '#ff5630' :
                    selectedTask.priority === 'medium' ? '#ff991f' :
                    '#36b37e',
                  color: 'white',
                  borderRadius: '3px',
                  fontSize: '13px',
                  fontWeight: '500',
                  alignSelf: 'flex-start'
                }}>
                  {selectedTask.priority === 'urgent' && '⬆️'}
                  {selectedTask.priority === 'high' && '⬆'}
                  {selectedTask.priority === 'medium' && '➡'}
                  {selectedTask.priority === 'low' && '⬇'}
                  {' '}
                  {selectedTask.priority.charAt(0).toUpperCase() + selectedTask.priority.slice(1)}
                </div>
              )}

              {/* Priority Dropdown */}
              <select
                value={formData.priority || ''}
                onChange={(e) => handleFieldChange('priority', e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px',
                  border: '1px solid #dfe1e6',
                  borderRadius: '3px',
                  fontSize: '14px',
                  backgroundColor: 'white',
                  cursor: 'pointer'
                }}
              >
                <option value="">None</option>
                <option value="urgent">⬆️ Urgent</option>
                <option value="high">⬆ High</option>
                <option value="medium">➡ Medium</option>
                <option value="low">⬇ Low</option>
              </select>
            </div>
          </div>

          {/* Sprint */}
          {sprints && sprints.length > 0 && (
            <div>
              <div style={{ fontSize: '12px', fontWeight: '600', color: '#5e6c84', marginBottom: '8px' }}>
                SPRINT
              </div>
              <select
                value={formData.sprint || ''}
                onChange={(e) => handleFieldChange('sprint', e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px',
                  border: '1px solid #dfe1e6',
                  borderRadius: '3px',
                  fontSize: '14px',
                  backgroundColor: 'white',
                  cursor: 'pointer'
                }}
              >
                <option value="">None</option>
                {sprints.map(sprint => (
                  <option key={sprint._id} value={sprint._id}>
                    {sprint.name} (Sprint #{sprint.sprintNumber})
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Phase */}
          {phases && phases.length > 0 && (
            <div>
              <div style={{ fontSize: '12px', fontWeight: '600', color: '#5e6c84', marginBottom: '8px' }}>
                PHASE
              </div>
              <select
                value={formData.phase || ''}
                onChange={(e) => handleFieldChange('phase', e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px',
                  border: '1px solid #dfe1e6',
                  borderRadius: '3px',
                  fontSize: '14px',
                  backgroundColor: 'white',
                  cursor: 'pointer'
                }}
              >
                <option value="">None</option>
                {phases.map(phase => (
                  <option key={phase._id} value={phase._id}>{phase.name}</option>
                ))}
              </select>
            </div>
          )}

          {/* Duration */}
          <div>
            <div style={{ fontSize: '12px', fontWeight: '600', color: '#5e6c84', marginBottom: '8px' }}>
              DURATION (OPTIONAL)
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <input
                type="number"
                placeholder="0"
                value={formData.duration?.value || ''}
                onChange={(e) => {
                  const value = e.target.value;
                  handleFieldChange('duration', {
                    value: value ? parseFloat(value) : undefined,
                    unit: formData.duration?.unit || 'hours'
                  });
                }}
                min="0"
                step="0.5"
                style={{
                  flex: 1,
                  padding: '8px',
                  border: '1px solid #dfe1e6',
                  borderRadius: '3px',
                  fontSize: '14px',
                  backgroundColor: 'white'
                }}
              />
              <select
                value={formData.duration?.unit || 'hours'}
                onChange={(e) => {
                  handleFieldChange('duration', {
                    value: formData.duration?.value,
                    unit: e.target.value
                  });
                }}
                style={{
                  padding: '8px',
                  border: '1px solid #dfe1e6',
                  borderRadius: '3px',
                  fontSize: '14px',
                  backgroundColor: 'white',
                  cursor: 'pointer',
                  minWidth: '100px'
                }}
              >
                <option value="minutes">Minutes</option>
                <option value="hours">Hours</option>
                <option value="days">Days</option>
                <option value="weeks">Weeks</option>
              </select>
            </div>
          </div>

          {/* Due Date */}
          <div>
            <div style={{ fontSize: '12px', fontWeight: '600', color: '#5e6c84', marginBottom: '8px' }}>
              DUE DATE
            </div>
            <input
              type="date"
              value={formData.dueDate || ''}
              onChange={(e) => handleFieldChange('dueDate', e.target.value)}
              style={{
                width: '100%',
                padding: '8px',
                border: '1px solid #dfe1e6',
                borderRadius: '3px',
                fontSize: '14px',
                backgroundColor: 'white'
              }}
            />
          </div>
        </div>
      </div>

      {/* Save/Cancel Buttons - Fixed at bottom */}
      {hasChanges && (
        <div style={{
          padding: '16px 24px',
          borderTop: '1px solid #dfe1e6',
          backgroundColor: 'white',
          display: 'flex',
          gap: '8px',
          justifyContent: 'flex-end'
        }}>
          <button
            onClick={handleCancel}
            style={{
              padding: '8px 16px',
              backgroundColor: 'white',
              border: '1px solid #dfe1e6',
              borderRadius: '3px',
              fontSize: '14px',
              fontWeight: '500',
              cursor: 'pointer',
              color: '#5e6c84'
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            style={{
              padding: '8px 16px',
              backgroundColor: '#0052cc',
              border: 'none',
              borderRadius: '3px',
              fontSize: '14px',
              fontWeight: '500',
              cursor: 'pointer',
              color: 'white'
            }}
          >
            Save Changes
          </button>
        </div>
      )}
    </div>
  );
};

export default TaskDetailsSidebar;

