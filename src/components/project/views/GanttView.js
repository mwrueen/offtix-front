import React from 'react';

const GanttView = ({ tasks, onEditTask, onDeleteTask, onAddSubtask }) => {
  const today = new Date();
  const startDate = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000); // 30 days ago
  const endDate = new Date(today.getTime() + 60 * 24 * 60 * 60 * 1000); // 60 days from now
  
  const totalDays = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24));
  const dayWidth = 40;

  const getTaskPosition = (task) => {
    const taskStart = task.startDate ? new Date(task.startDate) : today;
    const taskEnd = task.dueDate ? new Date(task.dueDate) : new Date(taskStart.getTime() + 7 * 24 * 60 * 60 * 1000);
    
    const startOffset = Math.max(0, (taskStart - startDate) / (1000 * 60 * 60 * 24));
    const duration = Math.max(1, (taskEnd - taskStart) / (1000 * 60 * 60 * 1000));
    
    return {
      left: startOffset * dayWidth,
      width: Math.max(dayWidth, duration * dayWidth)
    };
  };

  const generateDateHeaders = () => {
    const headers = [];
    const current = new Date(startDate);
    
    while (current <= endDate) {
      headers.push(new Date(current));
      current.setDate(current.getDate() + 1);
    }
    
    return headers;
  };

  const dateHeaders = generateDateHeaders();

  return (
    <div style={{
      backgroundColor: 'white',
      border: '1px solid #dfe1e6',
      borderRadius: '3px',
      overflow: 'hidden'
    }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        borderBottom: '2px solid #dfe1e6'
      }}>
        <div style={{
          width: '300px',
          padding: '12px 16px',
          backgroundColor: '#f4f5f7',
          borderRight: '1px solid #dfe1e6',
          fontSize: '11px',
          fontWeight: '600',
          color: '#5e6c84',
          textTransform: 'uppercase'
        }}>
          Task
        </div>
        
        <div style={{
          flex: 1,
          overflowX: 'auto',
          backgroundColor: '#f4f5f7'
        }}>
          <div style={{
            display: 'flex',
            width: totalDays * dayWidth
          }}>
            {dateHeaders.map((date, index) => (
              <div
                key={index}
                style={{
                  width: dayWidth,
                  padding: '8px 4px',
                  borderRight: '1px solid #e1e4e8',
                  fontSize: '10px',
                  textAlign: 'center',
                  color: '#5e6c84',
                  backgroundColor: date.toDateString() === today.toDateString() ? '#e3f2fd' : 'transparent'
                }}
              >
                <div>{date.getDate()}</div>
                <div>{date.toLocaleDateString('en', { month: 'short' })}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Tasks */}
      <div style={{ maxHeight: '600px', overflowY: 'auto' }}>
        {tasks.length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: '48px 24px',
            color: '#64748b'
          }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>📊</div>
            <h4 style={{ margin: '0 0 8px 0', fontSize: '16px', color: '#1e293b' }}>No tasks to display</h4>
            <p style={{ margin: 0, fontSize: '14px' }}>Create tasks with dates to see them in the Gantt chart.</p>
          </div>
        ) : (
          tasks.map(task => (
            <GanttRow
              key={task._id}
              task={task}
              totalDays={totalDays}
              dayWidth={dayWidth}
              getTaskPosition={getTaskPosition}
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

const GanttRow = ({ task, totalDays, dayWidth, getTaskPosition, onEdit, onDelete, onAddSubtask }) => {
  const position = getTaskPosition(task);
  
  const getPriorityColor = (priority) => {
    const colors = {
      urgent: '#d73527',
      high: '#ff8b00',
      medium: '#ffab00',
      low: '#36b37e'
    };
    return colors[priority] || '#0052cc';
  };

  return (
    <div style={{
      display: 'flex',
      borderBottom: '1px solid #f4f5f7',
      minHeight: '48px'
    }}>
      <div style={{
        width: '300px',
        padding: '12px 16px',
        borderRight: '1px solid #dfe1e6',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <div>
          <div style={{
            fontSize: '14px',
            fontWeight: '500',
            color: '#172b4d',
            marginBottom: '4px'
          }}>
            {task.title}
          </div>
          <div style={{
            fontSize: '12px',
            color: '#5e6c84'
          }}>
            {task.assignees && task.assignees.length > 0 && task.assignees[0].name}
          </div>
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
      
      <div style={{
        flex: 1,
        position: 'relative',
        overflowX: 'auto'
      }}>
        <div style={{
          width: totalDays * dayWidth,
          height: '100%',
          position: 'relative'
        }}>
          {/* Task Bar */}
          <div
            style={{
              position: 'absolute',
              left: position.left,
              width: position.width,
              height: '20px',
              top: '14px',
              backgroundColor: getPriorityColor(task.priority),
              borderRadius: '10px',
              display: 'flex',
              alignItems: 'center',
              padding: '0 8px',
              color: 'white',
              fontSize: '11px',
              fontWeight: '500',
              cursor: 'pointer',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
            }}
            onClick={() => onEdit(task)}
          >
            <span style={{ 
              overflow: 'hidden', 
              textOverflow: 'ellipsis', 
              whiteSpace: 'nowrap' 
            }}>
              {task.title}
            </span>
          </div>
          
          {/* Progress indicator */}
          {task.status && (
            <div
              style={{
                position: 'absolute',
                left: position.left,
                width: position.width * 0.6, // Assume 60% progress
                height: '20px',
                top: '14px',
                backgroundColor: 'rgba(255,255,255,0.3)',
                borderRadius: '10px'
              }}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default GanttView;