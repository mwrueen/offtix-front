import React from 'react';

const ListView = ({ tasks, onEditTask, onDeleteTask, onAddSubtask }) => {
  return (
    <div style={{
      backgroundColor: 'white',
      border: '1px solid #dfe1e6',
      borderRadius: '3px'
    }}>
      <div style={{
        padding: '12px 16px',
        borderBottom: '1px solid #dfe1e6',
        backgroundColor: '#f4f5f7',
        display: 'grid',
        gridTemplateColumns: '40px 2fr 120px 100px 120px 100px 80px',
        gap: '12px',
        fontSize: '11px',
        fontWeight: '600',
        color: '#5e6c84',
        textTransform: 'uppercase'
      }}>
        <div></div>
        <div>Issue</div>
        <div>Status</div>
        <div>Priority</div>
        <div>Assignee</div>
        <div>Due Date</div>
        <div>Actions</div>
      </div>
      
      <div>
        {tasks.length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: '48px 24px',
            color: '#64748b'
          }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>📋</div>
            <h4 style={{ margin: '0 0 8px 0', fontSize: '16px', color: '#1e293b' }}>No issues yet</h4>
            <p style={{ margin: 0, fontSize: '14px' }}>Create an issue to get started with your project.</p>
          </div>
        ) : (
          tasks.map(task => (
            <TaskListRow
              key={task._id}
              task={task}
              onEdit={onEditTask}
              onDelete={onDeleteTask}
              onAddSubtask={onAddSubtask}
            />
          ))
        )}
      </div>
    </div>
  );
};

const TaskListRow = ({ task, onEdit, onDelete, onAddSubtask }) => {
  const getPriorityColor = (priority) => {
    const colors = {
      urgent: '#d73527',
      high: '#ff8b00',
      medium: '#ffab00',
      low: '#36b37e'
    };
    return colors[priority] || '#6b7280';
  };

  const getStatusColor = (status) => {
    if (!status || !status.color) {
      return { bg: '#f3f4f6', text: '#374151' };
    }
    return {
      bg: status.color + '20',
      text: status.color
    };
  };

  const statusColor = getStatusColor(task.status);

  return (
    <div style={{
      padding: '12px 16px',
      borderBottom: '1px solid #f4f5f7',
      display: 'grid',
      gridTemplateColumns: '40px 2fr 120px 100px 120px 100px 80px',
      gap: '12px',
      alignItems: 'center',
      fontSize: '14px'
    }}>
      <div style={{
        width: '16px',
        height: '16px',
        backgroundColor: '#0052cc',
        borderRadius: '3px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '10px',
        color: 'white',
        fontWeight: 'bold'
      }}>
        T
      </div>
      
      <div>
        <div style={{ fontWeight: '500', color: '#172b4d', marginBottom: '4px' }}>
          {task.title}
        </div>
        {task.description && (
          <div style={{ fontSize: '12px', color: '#5e6c84' }}>
            {task.description.substring(0, 60)}...
          </div>
        )}
      </div>
      
      <div>
        {task.status && (
          <span style={{
            padding: '4px 8px',
            borderRadius: '12px',
            fontSize: '11px',
            fontWeight: '600',
            backgroundColor: statusColor.bg,
            color: statusColor.text,
            textTransform: 'uppercase'
          }}>
            {task.status.name}
          </span>
        )}
      </div>
      
      <div>
        {task.priority && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <div style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              backgroundColor: getPriorityColor(task.priority)
            }} />
            <span style={{ fontSize: '12px', textTransform: 'capitalize' }}>
              {task.priority}
            </span>
          </div>
        )}
      </div>
      
      <div>
        {task.assignees && task.assignees.length > 0 && (
          <div style={{ fontSize: '12px', color: '#5e6c84' }}>
            {task.assignees[0].name}
            {task.assignees.length > 1 && ` +${task.assignees.length - 1}`}
          </div>
        )}
      </div>
      
      <div>
        {task.dueDate && (
          <div style={{ fontSize: '12px', color: '#5e6c84' }}>
            {new Date(task.dueDate).toLocaleDateString()}
          </div>
        )}
      </div>
      
      <div style={{ display: 'flex', gap: '4px' }}>
        <button
          onClick={() => onEdit(task)}
          style={{
            padding: '4px',
            backgroundColor: 'transparent',
            border: 'none',
            cursor: 'pointer',
            fontSize: '12px',
            color: '#5e6c84'
          }}
        >
          ✏️
        </button>
        <button
          onClick={() => onAddSubtask(task._id)}
          style={{
            padding: '4px',
            backgroundColor: 'transparent',
            border: 'none',
            cursor: 'pointer',
            fontSize: '12px',
            color: '#5e6c84'
          }}
        >
          +
        </button>
        <button
          onClick={() => onDelete(task._id)}
          style={{
            padding: '4px',
            backgroundColor: 'transparent',
            border: 'none',
            cursor: 'pointer',
            fontSize: '12px',
            color: '#ef4444'
          }}
        >
          🗑️
        </button>
      </div>
    </div>
  );
};

export default ListView;