import React from 'react';

const BoardView = ({ tasks, taskStatuses, onEditTask, onDeleteTask, onAddSubtask }) => {
  const getTasksByStatus = (statusId) => {
    return tasks.filter(task => task.status?._id === statusId);
  };

  const getUnassignedTasks = () => {
    return tasks.filter(task => !task.status);
  };

  return (
    <div style={{
      backgroundColor: '#f4f5f7',
      padding: '16px',
      borderRadius: '3px',
      minHeight: '600px'
    }}>
      <div style={{
        display: 'flex',
        gap: '16px',
        overflowX: 'auto',
        paddingBottom: '16px'
      }}>
        {/* Unassigned Column */}
        <StatusColumn
          title="Unassigned"
          tasks={getUnassignedTasks()}
          color="#6b7280"
          onEditTask={onEditTask}
          onDeleteTask={onDeleteTask}
          onAddSubtask={onAddSubtask}
        />
        
        {/* Status Columns */}
        {taskStatuses.map(status => (
          <StatusColumn
            key={status._id}
            title={status.name}
            tasks={getTasksByStatus(status._id)}
            color={status.color || '#6b7280'}
            onEditTask={onEditTask}
            onDeleteTask={onDeleteTask}
            onAddSubtask={onAddSubtask}
          />
        ))}
      </div>
    </div>
  );
};

const StatusColumn = ({ title, tasks, color, onEditTask, onDeleteTask, onAddSubtask }) => {
  return (
    <div style={{
      backgroundColor: '#ffffff',
      borderRadius: '6px',
      minWidth: '280px',
      maxWidth: '280px',
      border: '1px solid #dfe1e6'
    }}>
      <div style={{
        padding: '12px 16px',
        borderBottom: '1px solid #f4f5f7',
        display: 'flex',
        alignItems: 'center',
        gap: '8px'
      }}>
        <div style={{
          width: '12px',
          height: '12px',
          borderRadius: '50%',
          backgroundColor: color
        }} />
        <span style={{
          fontSize: '14px',
          fontWeight: '600',
          color: '#172b4d',
          textTransform: 'uppercase'
        }}>
          {title}
        </span>
        <span style={{
          fontSize: '12px',
          color: '#5e6c84',
          backgroundColor: '#f4f5f7',
          padding: '2px 6px',
          borderRadius: '10px'
        }}>
          {tasks.length}
        </span>
      </div>
      
      <div style={{
        padding: '8px',
        minHeight: '500px'
      }}>
        {tasks.map(task => (
          <TaskCard
            key={task._id}
            task={task}
            onEdit={onEditTask}
            onDelete={onDeleteTask}
            onAddSubtask={onAddSubtask}
          />
        ))}
      </div>
    </div>
  );
};

const TaskCard = ({ task, onEdit, onDelete, onAddSubtask }) => {
  const getPriorityColor = (priority) => {
    const colors = {
      urgent: '#d73527',
      high: '#ff8b00',
      medium: '#ffab00',
      low: '#36b37e'
    };
    return colors[priority] || '#6b7280';
  };

  return (
    <div style={{
      backgroundColor: '#ffffff',
      border: '1px solid #dfe1e6',
      borderRadius: '6px',
      padding: '12px',
      marginBottom: '8px',
      cursor: 'pointer',
      boxShadow: '0 1px 2px rgba(9, 30, 66, 0.25)'
    }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: '8px'
      }}>
        <div style={{
          fontSize: '14px',
          fontWeight: '500',
          color: '#172b4d',
          lineHeight: '1.3'
        }}>
          {task.title}
        </div>
        
        {task.priority && (
          <div style={{
            width: '8px',
            height: '8px',
            borderRadius: '50%',
            backgroundColor: getPriorityColor(task.priority),
            flexShrink: 0,
            marginLeft: '8px',
            marginTop: '4px'
          }} />
        )}
      </div>
      
      {task.description && (
        <div style={{
          fontSize: '12px',
          color: '#5e6c84',
          marginBottom: '8px',
          lineHeight: '1.4'
        }}>
          {task.description.substring(0, 80)}...
        </div>
      )}
      
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        fontSize: '12px',
        color: '#5e6c84'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {task.assignees && task.assignees.length > 0 && (
            <div style={{
              width: '20px',
              height: '20px',
              borderRadius: '50%',
              backgroundColor: '#0052cc',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              fontSize: '10px',
              fontWeight: 'bold'
            }}>
              {task.assignees[0].name.charAt(0).toUpperCase()}
            </div>
          )}
          
          {task.dueDate && (
            <div>
              📅 {new Date(task.dueDate).toLocaleDateString()}
            </div>
          )}
        </div>
        
        <div style={{ display: 'flex', gap: '4px' }}>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onEdit(task);
            }}
            style={{
              padding: '2px',
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
            onClick={(e) => {
              e.stopPropagation();
              onAddSubtask(task._id);
            }}
            style={{
              padding: '2px',
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
            onClick={(e) => {
              e.stopPropagation();
              onDelete(task._id);
            }}
            style={{
              padding: '2px',
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
    </div>
  );
};

export default BoardView;