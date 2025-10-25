import React from 'react';
import TaskStatusManager from './TaskStatusManager';

const TaskForm = ({ 
  taskForm, 
  setTaskForm, 
  onSubmit, 
  onCancel, 
  taskStatuses, 
  editingTask, 
  parentTask,
  projectId,
  onStatusesUpdate,
  availableTasks = [],
  error,
  isProjectOwner = false,
  users = [],
  sprints = [],
  phases = []
}) => {
  return (
    <div style={{
      backgroundColor: '#ffffff',
      border: '1px solid #dfe1e6',
      borderRadius: '3px',
      marginBottom: '24px',
      boxShadow: '0 1px 2px rgba(9, 30, 66, 0.25)'
    }}>
      <div style={{ 
        padding: '16px 24px', 
        borderBottom: '1px solid #dfe1e6',
        backgroundColor: '#f4f5f7'
      }}>
        <h3 style={{ 
          margin: 0, 
          fontSize: '16px', 
          fontWeight: '600', 
          color: '#172b4d',
          fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", sans-serif'
        }}>
          {editingTask ? 'Edit Issue' : parentTask ? 'Create Subtask' : 'Create Issue'}
        </h3>
      </div>
      
      <div style={{ padding: '24px' }}>
        {error && (
          <div style={{
            padding: '12px 16px',
            backgroundColor: '#ffebe6',
            border: '1px solid #ff8f73',
            borderRadius: '3px',
            marginBottom: '20px',
            color: '#de350b',
            fontSize: '14px'
          }}>
            {error}
          </div>
        )}
        
        <form onSubmit={onSubmit}>
          {/* Main Content Area - Title and Description */}
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '32px' }}>
            
            {/* Left Column - Main Content */}
            <div>
              <div style={{ marginBottom: '24px' }}>
                <label style={{ 
                  display: 'block', 
                  marginBottom: '8px', 
                  fontSize: '12px', 
                  fontWeight: '600', 
                  color: '#5e6c84',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px'
                }}>
                  Summary *
                </label>
                <input
                  type="text"
                  placeholder="What needs to be done?"
                  value={taskForm.title}
                  onChange={(e) => setTaskForm({...taskForm, title: e.target.value})}
                  required
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: '2px solid #dfe1e6',
                    borderRadius: '3px',
                    fontSize: '14px',
                    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", sans-serif',
                    transition: 'border-color 0.2s ease-in-out',
                    outline: 'none'
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#0052cc'}
                  onBlur={(e) => e.target.style.borderColor = '#dfe1e6'}
                />
              </div>
              
              <div style={{ marginBottom: '24px' }}>
                <label style={{ 
                  display: 'block', 
                  marginBottom: '8px', 
                  fontSize: '12px', 
                  fontWeight: '600', 
                  color: '#5e6c84',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px'
                }}>
                  Description
                </label>
                <textarea
                  placeholder="Add a description..."
                  value={taskForm.description}
                  onChange={(e) => setTaskForm({...taskForm, description: e.target.value})}
                  rows="6"
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '2px solid #dfe1e6',
                    borderRadius: '3px',
                    fontSize: '14px',
                    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", sans-serif',
                    resize: 'vertical',
                    minHeight: '120px',
                    outline: 'none'
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#0052cc'}
                  onBlur={(e) => e.target.style.borderColor = '#dfe1e6'}
                />
              </div>
            </div>
            
            {/* Right Column - Metadata */}
            <div style={{ 
              backgroundColor: '#f4f5f7', 
              padding: '16px', 
              borderRadius: '3px',
              border: '1px solid #dfe1e6'
            }}>
              <h4 style={{ 
                margin: '0 0 16px 0', 
                fontSize: '12px', 
                fontWeight: '600', 
                color: '#5e6c84',
                textTransform: 'uppercase',
                letterSpacing: '0.5px'
              }}>
                Details
              </h4>
              
              {/* Status */}
              <div style={{ marginBottom: '16px' }}>
                <TaskStatusManager
                  projectId={projectId}
                  taskStatuses={taskStatuses}
                  onStatusesUpdate={onStatusesUpdate}
                  selectedStatus={taskForm.status}
                  onStatusChange={(value) => setTaskForm({...taskForm, status: value})}
                  isProjectOwner={isProjectOwner}
                />
              </div>
              
              {/* Assignees */}
              <div style={{ marginBottom: '16px' }}>
                <label style={{ 
                  display: 'block', 
                  marginBottom: '6px', 
                  fontSize: '12px', 
                  fontWeight: '600', 
                  color: '#5e6c84'
                }}>
                  Assignee
                </label>
                <select
                  multiple
                  value={taskForm.assignees}
                  onChange={(e) => {
                    const values = Array.from(e.target.selectedOptions, option => option.value);
                    setTaskForm({...taskForm, assignees: values});
                  }}
                  style={{
                    width: '100%',
                    padding: '6px 8px',
                    border: '1px solid #dfe1e6',
                    borderRadius: '3px',
                    fontSize: '13px',
                    backgroundColor: 'white',
                    minHeight: '60px'
                  }}
                >
                  {users.map(user => (
                    <option key={user._id} value={user._id}>
                      {user.name}
                    </option>
                  ))}
                </select>
              </div>
              
              {/* Priority */}
              <div style={{ marginBottom: '16px' }}>
                <label style={{ 
                  display: 'block', 
                  marginBottom: '6px', 
                  fontSize: '12px', 
                  fontWeight: '600', 
                  color: '#5e6c84'
                }}>
                  Priority
                </label>
                <select
                  value={taskForm.priority}
                  onChange={(e) => setTaskForm({...taskForm, priority: e.target.value})}
                  style={{
                    width: '100%',
                    padding: '6px 8px',
                    border: '1px solid #dfe1e6',
                    borderRadius: '3px',
                    fontSize: '13px',
                    backgroundColor: 'white'
                  }}
                >
                  <option value="">None</option>
                  <option value="low">🟢 Low</option>
                  <option value="medium">🟡 Medium</option>
                  <option value="high">🟠 High</option>
                  <option value="urgent">🔴 Urgent</option>
                </select>
              </div>
              
              {/* Phase */}
              <div style={{ marginBottom: '16px' }}>
                <label style={{ 
                  display: 'block', 
                  marginBottom: '6px', 
                  fontSize: '12px', 
                  fontWeight: '600', 
                  color: '#5e6c84'
                }}>
                  Phase
                </label>
                <select
                  value={taskForm.phase || ''}
                  onChange={(e) => setTaskForm({...taskForm, phase: e.target.value})}
                  style={{
                    width: '100%',
                    padding: '6px 8px',
                    border: '1px solid #dfe1e6',
                    borderRadius: '3px',
                    fontSize: '13px',
                    backgroundColor: 'white'
                  }}
                >
                  <option value="">No Phase</option>
                  {phases.map(phase => (
                    <option key={phase._id} value={phase._id}>
                      {phase.name}
                    </option>
                  ))}
                </select>
              </div>
              
              {/* Sprint */}
              <div style={{ marginBottom: '16px' }}>
                <label style={{ 
                  display: 'block', 
                  marginBottom: '6px', 
                  fontSize: '12px', 
                  fontWeight: '600', 
                  color: '#5e6c84'
                }}>
                  Sprint
                </label>
                <select
                  value={taskForm.sprint || ''}
                  onChange={(e) => setTaskForm({...taskForm, sprint: e.target.value})}
                  style={{
                    width: '100%',
                    padding: '6px 8px',
                    border: '1px solid #dfe1e6',
                    borderRadius: '3px',
                    fontSize: '13px',
                    backgroundColor: 'white'
                  }}
                >
                  <option value="">No Sprint</option>
                  {sprints.map(sprint => (
                    <option key={sprint._id} value={sprint._id}>
                      {sprint.name} (Sprint #{sprint.sprintNumber})
                    </option>
                  ))}
                </select>
              </div>

              {/* Dependencies */}
              <div style={{ marginBottom: '16px' }}>
                <label style={{ 
                  display: 'block', 
                  marginBottom: '6px', 
                  fontSize: '12px', 
                  fontWeight: '600', 
                  color: '#5e6c84'
                }}>
                  Dependencies
                </label>
                <select
                  multiple
                  value={taskForm.dependencies}
                  onChange={(e) => {
                    const values = Array.from(e.target.selectedOptions, option => option.value);
                    setTaskForm({...taskForm, dependencies: values});
                  }}
                  style={{
                    width: '100%',
                    padding: '6px 8px',
                    border: '1px solid #dfe1e6',
                    borderRadius: '3px',
                    fontSize: '13px',
                    backgroundColor: 'white',
                    minHeight: '60px'
                  }}
                >
                  {availableTasks
                    .filter(task => task._id !== editingTask?._id)
                    .map(task => (
                    <option key={task._id} value={task._id}>
                      {task.title} {task.status ? `(${task.status.name})` : ''}
                    </option>
                  ))}
                </select>
                <div style={{ fontSize: '11px', color: '#6b778c', marginTop: '4px' }}>
                  Hold Ctrl/Cmd to select multiple
                </div>
              </div>
              
              {/* Duration */}
              <div style={{ marginBottom: '16px' }}>
                <label style={{ 
                  display: 'block', 
                  marginBottom: '6px', 
                  fontSize: '12px', 
                  fontWeight: '600', 
                  color: '#5e6c84'
                }}>
                  Original Estimate
                </label>
                <input
                  type="number"
                  placeholder="0h"
                  value={taskForm.duration}
                  onChange={(e) => setTaskForm({...taskForm, duration: e.target.value})}
                  style={{
                    width: '100%',
                    padding: '6px 8px',
                    border: '1px solid #dfe1e6',
                    borderRadius: '3px',
                    fontSize: '13px'
                  }}
                />
              </div>
              
              {/* Start Date */}
              <div style={{ marginBottom: '16px' }}>
                <label style={{ 
                  display: 'block', 
                  marginBottom: '6px', 
                  fontSize: '12px', 
                  fontWeight: '600', 
                  color: '#5e6c84'
                }}>
                  Start Date
                </label>
                <input
                  type="date"
                  value={taskForm.startDate || ''}
                  onChange={(e) => setTaskForm({...taskForm, startDate: e.target.value})}
                  style={{
                    width: '100%',
                    padding: '6px 8px',
                    border: '1px solid #dfe1e6',
                    borderRadius: '3px',
                    fontSize: '13px'
                  }}
                />
              </div>
              
              {/* Due Date */}
              <div style={{ marginBottom: '16px' }}>
                <label style={{ 
                  display: 'block', 
                  marginBottom: '6px', 
                  fontSize: '12px', 
                  fontWeight: '600', 
                  color: '#5e6c84'
                }}>
                  Due Date
                </label>
                <input
                  type="date"
                  value={taskForm.dueDate}
                  onChange={(e) => setTaskForm({...taskForm, dueDate: e.target.value})}
                  style={{
                    width: '100%',
                    padding: '6px 8px',
                    border: '1px solid #dfe1e6',
                    borderRadius: '3px',
                    fontSize: '13px'
                  }}
                />
              </div>
            </div>
          </div>
          
          {/* Action Buttons */}
          <div style={{ 
            display: 'flex', 
            justifyContent: 'flex-end', 
            gap: '8px', 
            paddingTop: '24px', 
            borderTop: '1px solid #dfe1e6',
            marginTop: '24px'
          }}>
            <button
              type="button"
              onClick={onCancel}
              style={{
                padding: '8px 16px',
                backgroundColor: 'transparent',
                color: '#5e6c84',
                border: '1px solid #dfe1e6',
                borderRadius: '3px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '500'
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              style={{
                padding: '8px 16px',
                backgroundColor: '#0052cc',
                color: 'white',
                border: 'none',
                borderRadius: '3px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '500'
              }}
            >
              {editingTask ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TaskForm;