import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { usePermissions, PERMISSIONS } from '../../context/PermissionsContext';

const TaskCard = ({ task, level = 0, onEdit, onDelete, onAddSubtask }) => {
  const { state: authState } = useAuth();
  const { hasPermission, isSuperAdmin } = usePermissions();
  const currentUserId = authState?.user?._id || authState?.user?.id;
  const getStatusColor = (status) => {
    if (!status || !status.color) {
      return { bg: '#f4f5f7', text: '#5e6c84', border: '#dfe1e6' };
    }
    return {
      bg: status.color + '20',
      text: status.color,
      border: status.color + '40'
    };
  };

  const getPriorityIcon = (priority) => {
    const icons = {
      urgent: { icon: '🔴', color: '#de350b' },
      high: { icon: '🟠', color: '#ff8b00' },
      medium: { icon: '🟡', color: '#ffab00' },
      low: { icon: '🟢', color: '#36b37e' }
    };
    return icons[priority] || { icon: '⚪', color: '#5e6c84' };
  };

  const statusColor = getStatusColor(task.status);
  const priority = getPriorityIcon(task.priority);
  const indent = level * 24;

  // Determine if current user is the active assignee in sequential workflow
  const isCurrentActiveAssignee = () => {
    if (!currentUserId || !task.useSequentialWorkflow || !task.sequentialAssignees) {
      return false;
    }

    const currentAssignee = task.sequentialAssignees[task.currentAssigneeIndex];
    if (!currentAssignee) return false;

    const assigneeUserId = currentAssignee.user._id || currentAssignee.user;
    return assigneeUserId.toString() === currentUserId.toString();
  };

  const isActive = isCurrentActiveAssignee();

  return (
    <div>
      <div
        style={{
          backgroundColor: isActive ? '#eff6ff' : '#ffffff',
          border: isActive ? '2px solid #3b82f6' : '1px solid #dfe1e6',
          borderRadius: '3px',
          marginBottom: '2px',
          marginLeft: `${indent}px`,
          transition: 'box-shadow 0.15s ease-in-out, border-color 0.15s ease-in-out',
          cursor: 'pointer',
          fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", sans-serif',
          boxShadow: isActive ? '0 2px 8px rgba(59, 130, 246, 0.2)' : 'none'
        }}
        onMouseEnter={(e) => {
          if (!isActive) {
            e.target.style.borderColor = '#b3d4ff';
            e.target.style.boxShadow = '0 1px 3px rgba(9, 30, 66, 0.25)';
          }
        }}
        onMouseLeave={(e) => {
          if (!isActive) {
            e.target.style.borderColor = '#dfe1e6';
            e.target.style.boxShadow = 'none';
          }
        }}
      >
        <div style={{ padding: '12px 16px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '20px 1fr auto', gap: '12px', alignItems: 'start' }}>

            {/* Task Type Icon */}
            <div style={{
              width: '16px',
              height: '16px',
              backgroundColor: level > 0 ? '#36b37e' : '#0052cc',
              borderRadius: '3px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '10px',
              color: 'white',
              fontWeight: 'bold',
              marginTop: '2px',
              flexShrink: 0
            }}>
              {level > 0 ? 'S' : 'T'}
            </div>

            {/* Main Content - Title and Description */}
            <div style={{ minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                <h4 style={{
                  margin: 0,
                  fontSize: '14px',
                  fontWeight: '500',
                  color: '#172b4d',
                  cursor: 'pointer',
                  lineHeight: '1.3'
                }} onClick={() => onEdit(task)}>
                  {task.title}
                </h4>

                {isActive && (
                  <span style={{
                    padding: '2px 8px',
                    borderRadius: '4px',
                    fontSize: '11px',
                    fontWeight: '600',
                    backgroundColor: '#3b82f6',
                    color: 'white',
                    textTransform: 'uppercase',
                    letterSpacing: '0.3px'
                  }}>
                    Your Turn
                  </span>
                )}

                {task.priority && (
                  <span
                    style={{
                      fontSize: '12px',
                      color: priority.color
                    }}
                    title={`Priority: ${task.priority}`}
                  >
                    {priority.icon}
                  </span>
                )}
              </div>

              {task.description && (
                <p style={{
                  margin: '0 0 12px 0',
                  fontSize: '13px',
                  color: '#5e6c84',
                  lineHeight: '1.4',
                  display: '-webkit-box',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden'
                }}>
                  {task.description}
                </p>
              )}
            </div>

            {/* Right Side - Metadata */}
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '8px',
              alignItems: 'flex-end',
              minWidth: '200px'
            }}>

              {/* Status Row */}
              <div style={{ display: 'flex', gap: '6px', alignItems: 'center', flexWrap: 'wrap' }}>
                {task.status && (
                  <span style={{
                    padding: '2px 8px',
                    borderRadius: '11px',
                    fontSize: '11px',
                    fontWeight: '600',
                    backgroundColor: statusColor.bg,
                    color: statusColor.text,
                    border: `1px solid ${statusColor.border}`,
                    textTransform: 'uppercase',
                    letterSpacing: '0.3px'
                  }}>
                    {task.status.name}
                  </span>
                )}
              </div>

              {/* Team and Dates Row */}
              <div style={{ display: 'flex', gap: '12px', alignItems: 'center', fontSize: '11px', color: '#5e6c84' }}>
                {task.assignees && task.assignees.length > 0 && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <span>👤</span>
                    <span>{task.assignees.map(a => a.name).join(', ')}</span>
                  </div>
                )}

                {task.useSequentialWorkflow && task.sequentialAssignees && task.sequentialAssignees.length > 0 && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <span>🔄</span>
                    <span>
                      {task.sequentialAssignees.map((sa, idx) => {
                        const user = sa.user;
                        const userName = user.name || user.email || 'Unknown';
                        const isCurrent = idx === task.currentAssigneeIndex;
                        return (
                          <span
                            key={idx}
                            style={{
                              fontWeight: isCurrent ? '700' : '400',
                              color: isCurrent ? '#3b82f6' : '#5e6c84',
                              textDecoration: sa.status === 'completed' ? 'line-through' : 'none'
                            }}
                          >
                            {userName}{idx < task.sequentialAssignees.length - 1 ? ' → ' : ''}
                          </span>
                        );
                      })}
                    </span>
                  </div>
                )}

                {task.duration && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <span>⏱️</span>
                    <span>{task.duration}h</span>
                  </div>
                )}
              </div>

              {/* Dates Row */}
              <div style={{ display: 'flex', gap: '12px', alignItems: 'center', fontSize: '11px', color: '#5e6c84' }}>
                {task.startDate && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <span>🚀</span>
                    <span>{new Date(task.startDate).toLocaleDateString()}</span>
                  </div>
                )}

                {task.dueDate && (
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    color: new Date(task.dueDate) < new Date() ? '#de350b' : '#5e6c84'
                  }}>
                    <span>📅</span>
                    <span>{new Date(task.dueDate).toLocaleDateString()}</span>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', gap: '4px', marginTop: '4px' }}>
                {(isSuperAdmin || hasPermission(PERMISSIONS.CREATE_TASK)) && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onAddSubtask(task._id);
                    }}
                    style={{
                      padding: '4px 6px',
                      backgroundColor: 'transparent',
                      color: '#5e6c84',
                      border: '1px solid #dfe1e6',
                      borderRadius: '3px',
                      cursor: 'pointer',
                      fontSize: '10px',
                      transition: 'all 0.15s ease-in-out'
                    }}
                    title="Add subtask"
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = '#f4f5f7';
                      e.currentTarget.style.borderColor = '#b3d4ff';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = 'transparent';
                      e.currentTarget.style.borderColor = '#dfe1e6';
                    }}
                  >
                    +
                  </button>
                )}
                {(isSuperAdmin || hasPermission(PERMISSIONS.EDIT_TASK)) && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onEdit(task);
                    }}
                    style={{
                      padding: '4px 6px',
                      backgroundColor: 'transparent',
                      color: '#5e6c84',
                      border: '1px solid #dfe1e6',
                      borderRadius: '3px',
                      cursor: 'pointer',
                      fontSize: '10px',
                      transition: 'all 0.15s ease-in-out'
                    }}
                    title="Edit"
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = '#f4f5f7';
                      e.currentTarget.style.borderColor = '#b3d4ff';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = 'transparent';
                      e.currentTarget.style.borderColor = '#dfe1e6';
                    }}
                  >
                    ✏️
                  </button>
                )}
                {(isSuperAdmin || hasPermission(PERMISSIONS.DELETE_TASK)) && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDelete(task._id);
                    }}
                    style={{
                      padding: '4px 6px',
                      backgroundColor: 'transparent',
                      color: '#de350b',
                      border: '1px solid #dfe1e6',
                      borderRadius: '3px',
                      cursor: 'pointer',
                      fontSize: '10px',
                      transition: 'all 0.15s ease-in-out'
                    }}
                    title="Delete"
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = '#ffebe6';
                      e.currentTarget.style.borderColor = '#ff8f73';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = 'transparent';
                      e.currentTarget.style.borderColor = '#dfe1e6';
                    }}
                  >
                    🗑️
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Subtasks */}
      {task.subtasks && task.subtasks.map(subtask => (
        <TaskCard
          key={subtask._id}
          task={subtask}
          level={level + 1}
          onEdit={onEdit}
          onDelete={onDelete}
          onAddSubtask={onAddSubtask}
        />
      ))}
    </div>
  );
};

export default TaskCard;