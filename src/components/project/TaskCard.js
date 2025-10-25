import React from 'react';

const TaskCard = ({ task, level = 0, onEdit, onDelete, onAddSubtask }) => {
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

  return (
    <div>
      <div
        style={{
          backgroundColor: '#ffffff',
          border: '1px solid #dfe1e6',
          borderRadius: '3px',
          marginBottom: '2px',
          marginLeft: `${indent}px`,
          transition: 'box-shadow 0.15s ease-in-out, border-color 0.15s ease-in-out',
          cursor: 'pointer',
          fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", sans-serif'
        }}
        onMouseEnter={(e) => {
          e.target.style.borderColor = '#b3d4ff';
          e.target.style.boxShadow = '0 1px 3px rgba(9, 30, 66, 0.25)';
        }}
        onMouseLeave={(e) => {
          e.target.style.borderColor = '#dfe1e6';
          e.target.style.boxShadow = 'none';
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
              
              {/* Dependencies Info */}
              {task.dependencies && task.dependencies.length > 0 && (
                <div style={{ 
                  marginBottom: '8px',
                  fontSize: '11px', 
                  color: '#5e6c84',
                  fontStyle: 'italic'
                }}>
                  <span style={{ fontWeight: '600' }}>Depends on:</span> {task.dependencies.map(dep => `${dep.title}${dep.status ? ` (${dep.status.name})` : ''}`).join(', ')}
                </div>
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
              
              {/* Status and Dependencies Row */}
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
                
                {task.dependencies && task.dependencies.length > 0 && (
                  <span style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '4px',
                    padding: '2px 6px',
                    backgroundColor: '#fff4e6',
                    border: '1px solid #ffcc95',
                    borderRadius: '11px',
                    fontSize: '10px',
                    color: '#974f0c'
                  }}>
                    🔗 {task.dependencies.length}
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
                    e.target.style.backgroundColor = '#f4f5f7';
                    e.target.style.borderColor = '#b3d4ff';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.backgroundColor = 'transparent';
                    e.target.style.borderColor = '#dfe1e6';
                  }}
                >
                  +
                </button>
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
                    e.target.style.backgroundColor = '#f4f5f7';
                    e.target.style.borderColor = '#b3d4ff';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.backgroundColor = 'transparent';
                    e.target.style.borderColor = '#dfe1e6';
                  }}
                >
                  ✏️
                </button>
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
                    e.target.style.backgroundColor = '#ffebe6';
                    e.target.style.borderColor = '#ff8f73';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.backgroundColor = 'transparent';
                    e.target.style.borderColor = '#dfe1e6';
                  }}
                >
                  🗑️
                </button>
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