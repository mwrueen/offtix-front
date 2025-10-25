import React from 'react';
import TaskCard from './TaskCard';

const TaskList = ({ tasks, onEditTask, onDeleteTask, onAddSubtask }) => {
  const totalTasks = tasks.reduce((count, task) => count + 1 + (task.subtasks?.length || 0), 0);

  return (
    <div style={{
      backgroundColor: '#ffffff',
      border: '1px solid #dfe1e6',
      borderRadius: '3px',
      boxShadow: '0 1px 2px rgba(9, 30, 66, 0.25)',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", sans-serif'
    }}>
      <div style={{
        padding: '16px 24px',
        borderBottom: '1px solid #dfe1e6',
        backgroundColor: '#f4f5f7'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ 
            margin: 0, 
            fontSize: '16px', 
            fontWeight: '600', 
            color: '#172b4d',
            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", sans-serif'
          }}>
            Issues ({totalTasks})
          </h3>
          <div style={{ 
            display: 'flex', 
            gap: '16px', 
            fontSize: '12px', 
            color: '#5e6c84',
            alignItems: 'center'
          }}>
            <select style={{
              padding: '4px 8px',
              border: '1px solid #dfe1e6',
              borderRadius: '3px',
              fontSize: '12px',
              backgroundColor: 'white',
              color: '#5e6c84'
            }}>
              <option>Group by: None</option>
              <option>Group by: Status</option>
              <option>Group by: Assignee</option>
              <option>Group by: Priority</option>
            </select>
            <span style={{ color: '#dfe1e6' }}>|</span>
            <select style={{
              padding: '4px 8px',
              border: '1px solid #dfe1e6',
              borderRadius: '3px',
              fontSize: '12px',
              backgroundColor: 'white',
              color: '#5e6c84'
            }}>
              <option>Sort by: Created</option>
              <option>Sort by: Updated</option>
              <option>Sort by: Priority</option>
              <option>Sort by: Due Date</option>
            </select>
          </div>
        </div>
      </div>
      
      <div style={{ padding: '0' }}>
        {tasks.length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: '64px 24px',
            color: '#5e6c84'
          }}>
            <div style={{ 
              fontSize: '48px', 
              marginBottom: '16px',
              opacity: 0.5
            }}>📋</div>
            <h4 style={{ 
              margin: '0 0 8px 0', 
              fontSize: '16px', 
              color: '#172b4d',
              fontWeight: '500'
            }}>
              No issues yet
            </h4>
            <p style={{ 
              margin: 0, 
              fontSize: '14px',
              color: '#5e6c84',
              lineHeight: '1.4'
            }}>
              Create an issue to get started with your project tracking.
            </p>
          </div>
        ) : (
          <div style={{ padding: '8px 16px' }}>
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
        )}
      </div>
    </div>
  );
};

export default TaskList;