import React, { useState, useEffect, useRef } from 'react';
import TaskStatusManager from './TaskStatusManager';
import { useAuth } from '../../context/AuthContext';

const TaskFormJira = ({ 
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
  const { state } = useAuth();
  const currentUser = state.user;
  
  const [issueType, setIssueType] = useState(taskForm.issueType || 'task');
  const [labels, setLabels] = useState(taskForm.labels || []);
  const [labelInput, setLabelInput] = useState('');
  const [storyPoints, setStoryPoints] = useState(taskForm.storyPoints || '');
  const [showAssigneeDropdown, setShowAssigneeDropdown] = useState(false);
  const [assigneeSearch, setAssigneeSearch] = useState('');
  
  const assigneeDropdownRef = useRef(null);
  
  // Close dropdown when clicking outside
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

  const handleSubmitWithExtras = (e) => {
    e.preventDefault();
    onSubmit(e);
  };
  
  const handleAddLabel = (e) => {
    if (e.key === 'Enter' && labelInput.trim() && !labels.includes(labelInput.trim())) {
      const newLabels = [...labels, labelInput.trim()];
      setLabels(newLabels);
      setLabelInput('');
    }
  };
  
  const handleRemoveLabel = (label) => {
    const newLabels = labels.filter(l => l !== label);
    setLabels(newLabels);
  };
  
  const getIssueTypeIcon = (type) => {
    const icons = {
      task: { icon: '✓', color: '#0052cc', bg: '#deebff', label: 'Task' },
      bug: { icon: '🐛', color: '#de350b', bg: '#ffebe6', label: 'Bug' },
      story: { icon: '📖', color: '#00875a', bg: '#e3fcef', label: 'Story' },
      epic: { icon: '⚡', color: '#6554c0', bg: '#eae6ff', label: 'Epic' }
    };
    return icons[type] || icons.task;
  };
  
  const getUserInitials = (user) => {
    if (!user || !user.name) return '?';
    const names = user.name.split(' ');
    if (names.length >= 2) {
      return (names[0][0] + names[1][0]).toUpperCase();
    }
    return user.name.substring(0, 2).toUpperCase();
  };
  
  const getUserColor = (userId) => {
    const colors = ['#0052cc', '#00875a', '#6554c0', '#ff8b00', '#de350b', '#00b8d9'];
    const index = userId ? userId.charCodeAt(userId.length - 1) % colors.length : 0;
    return colors[index];
  };
  
  const handleToggleAssignee = (userId) => {
    const currentAssignees = taskForm.assignees || [];
    let newAssignees;
    
    if (currentAssignees.includes(userId)) {
      newAssignees = currentAssignees.filter(id => id !== userId);
    } else {
      newAssignees = [...currentAssignees, userId];
    }
    
    setTaskForm({...taskForm, assignees: newAssignees});
  };
  
  const handleRemoveAssignee = (userId) => {
    const newAssignees = (taskForm.assignees || []).filter(id => id !== userId);
    setTaskForm({...taskForm, assignees: newAssignees});
  };
  
  const handleClearAssignees = () => {
    setTaskForm({...taskForm, assignees: []});
    setShowAssigneeDropdown(false);
    setAssigneeSearch('');
  };
  
  const filteredUsers = users.filter(user => 
    user.name.toLowerCase().includes(assigneeSearch.toLowerCase())
  );
  
  const selectedAssignees = (taskForm.assignees || [])
    .map(id => users.find(u => u._id === id))
    .filter(Boolean);
  
  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(9, 30, 66, 0.54)',
      display: 'flex',
      alignItems: 'flex-start',
      justifyContent: 'center',
      zIndex: 1000,
      padding: '40px 20px',
      overflowY: 'auto'
    }}
    onClick={onCancel}
    >
      <div style={{
        backgroundColor: '#ffffff',
        borderRadius: '3px',
        width: '100%',
        maxWidth: '900px',
        boxShadow: '0 20px 32px -8px rgba(9, 30, 66, 0.25)',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", sans-serif',
        marginTop: '20px',
        marginBottom: '40px'
      }}
      onClick={(e) => e.stopPropagation()}
      >
        <div style={{ 
          padding: '24px 32px', 
          borderBottom: '2px solid #dfe1e6',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '32px',
              height: '32px',
              backgroundColor: getIssueTypeIcon(issueType).bg,
              borderRadius: '3px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '16px'
            }}>
              {getIssueTypeIcon(issueType).icon}
            </div>
            <h2 style={{ 
              margin: 0, 
              fontSize: '20px', 
              fontWeight: '500', 
              color: '#172b4d'
            }}>
              {editingTask ? 'Edit Issue' : parentTask ? 'Create Subtask' : 'Create Issue'}
            </h2>
          </div>
          <button
            type="button"
            onClick={onCancel}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '24px',
              color: '#5e6c84',
              cursor: 'pointer',
              padding: '4px 8px',
              lineHeight: 1,
              borderRadius: '3px'
            }}
            onMouseEnter={(e) => e.target.style.backgroundColor = '#f4f5f7'}
            onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
          >
            ×
          </button>
        </div>
        
        <div style={{ padding: '32px' }}>
          {error && (
            <div style={{
              padding: '12px 16px',
              backgroundColor: '#ffebe6',
              border: '1px solid #ff8f73',
              borderRadius: '3px',
              marginBottom: '24px',
              color: '#de350b',
              fontSize: '14px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <span style={{ fontSize: '16px' }}>⚠️</span>
              {error}
            </div>
          )}
          
          <form onSubmit={handleSubmitWithExtras}>
            {!editingTask && !parentTask && (
              <div style={{ marginBottom: '24px' }}>
                <label style={{
                  display: 'block',
                  marginBottom: '8px',
                  fontSize: '12px',
                  fontWeight: '700',
                  color: '#5e6c84',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px'
                }}>
                  Issue Type
                </label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  {['task', 'bug', 'story', 'epic'].map(type => {
                    const typeInfo = getIssueTypeIcon(type);
                    const isSelected = issueType === type;
                    return (
                      <button
                        key={type}
                        type="button"
                        onClick={() => setIssueType(type)}
                        style={{
                          flex: 1,
                          padding: '12px',
                          border: `2px solid ${isSelected ? typeInfo.color : '#dfe1e6'}`,
                          borderRadius: '3px',
                          backgroundColor: isSelected ? typeInfo.bg : 'white',
                          cursor: 'pointer',
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          gap: '4px',
                          transition: 'all 0.2s'
                        }}
                        onMouseEnter={(e) => {
                          if (!isSelected) {
                            e.currentTarget.style.borderColor = typeInfo.color;
                            e.currentTarget.style.backgroundColor = typeInfo.bg + '40';
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (!isSelected) {
                            e.currentTarget.style.borderColor = '#dfe1e6';
                            e.currentTarget.style.backgroundColor = 'white';
                          }
                        }}
                      >
                        <span style={{ fontSize: '20px' }}>{typeInfo.icon}</span>
                        <span style={{ 
                          fontSize: '12px', 
                          fontWeight: '600',
                          color: isSelected ? typeInfo.color : '#5e6c84'
                        }}>
                          {typeInfo.label}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: '32px' }}>
              
              <div>
                <div style={{ marginBottom: '24px' }}>
                  <label style={{
                    display: 'block',
                    marginBottom: '8px',
                    fontSize: '12px',
                    fontWeight: '700',
                    color: '#5e6c84',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px'
                  }}>
                    Summary <span style={{ color: '#de350b' }}>*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="What needs to be done?"
                    value={taskForm.title}
                    onChange={(e) => setTaskForm({...taskForm, title: e.target.value})}
                    required
                    autoFocus
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      border: '2px solid #dfe1e6',
                      borderRadius: '3px',
                      fontSize: '14px',
                      fontFamily: 'inherit',
                      transition: 'border-color 0.2s, box-shadow 0.2s',
                      outline: 'none'
                    }}
                    onFocus={(e) => {
                      e.target.style.borderColor = '#0052cc';
                      e.target.style.boxShadow = '0 0 0 1px #0052cc';
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = '#dfe1e6';
                      e.target.style.boxShadow = 'none';
                    }}
                  />
                </div>
                
                <div style={{ marginBottom: '24px' }}>
                  <label style={{ 
                    display: 'block', 
                    marginBottom: '8px', 
                    fontSize: '12px', 
                    fontWeight: '700', 
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
                    rows="8"
                    style={{
                      width: '100%',
                      padding: '12px',
                      border: '2px solid #dfe1e6',
                      borderRadius: '3px',
                      fontSize: '14px',
                      fontFamily: 'inherit',
                      resize: 'vertical',
                      minHeight: '150px',
                      outline: 'none'
                    }}
                    onFocus={(e) => {
                      e.target.style.borderColor = '#0052cc';
                      e.target.style.boxShadow = '0 0 0 1px #0052cc';
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = '#dfe1e6';
                      e.target.style.boxShadow = 'none';
                    }}
                  />
                </div>
                
                <div style={{ marginBottom: '24px' }}>
                  <label style={{ 
                    display: 'block', 
                    marginBottom: '8px', 
                    fontSize: '12px', 
                    fontWeight: '700', 
                    color: '#5e6c84',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px'
                  }}>
                    Labels
                  </label>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '8px' }}>
                    {labels.map((label, index) => (
                      <span key={index} style={{
                        padding: '4px 8px',
                        backgroundColor: '#f4f5f7',
                        border: '1px solid #dfe1e6',
                        borderRadius: '3px',
                        fontSize: '12px',
                        color: '#172b4d',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}>
                        {label}
                        <button
                          type="button"
                          onClick={() => handleRemoveLabel(label)}
                          style={{
                            background: 'none',
                            border: 'none',
                            color: '#5e6c84',
                            cursor: 'pointer',
                            padding: 0,
                            fontSize: '14px',
                            lineHeight: 1
                          }}
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                  <input
                    type="text"
                    placeholder="Add labels (press Enter)"
                    value={labelInput}
                    onChange={(e) => setLabelInput(e.target.value)}
                    onKeyPress={handleAddLabel}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      border: '2px solid #dfe1e6',
                      borderRadius: '3px',
                      fontSize: '13px',
                      outline: 'none'
                    }}
                    onFocus={(e) => e.target.style.borderColor = '#0052cc'}
                    onBlur={(e) => e.target.style.borderColor = '#dfe1e6'}
                  />
                </div>
              </div>
              
              <div>
                <div style={{ 
                  backgroundColor: '#f4f5f7', 
                  padding: '16px', 
                  borderRadius: '3px',
                  border: '1px solid #dfe1e6'
                }}>
                  <h4 style={{ 
                    margin: '0 0 16px 0', 
                    fontSize: '12px', 
                    fontWeight: '700', 
                    color: '#5e6c84',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px'
                  }}>
                    Details
                  </h4>
                  
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
                  
                  <div style={{ marginBottom: '16px', position: 'relative' }} ref={assigneeDropdownRef}>
                    <label style={{ 
                      display: 'block', 
                      marginBottom: '6px', 
                      fontSize: '12px', 
                      fontWeight: '600', 
                      color: '#5e6c84',
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px'
                    }}>
                      Assignee
                    </label>
                    
                    {/* Selected Assignees Display */}
                    <div style={{
                      minHeight: '38px',
                      border: '1px solid #dfe1e6',
                      borderRadius: '3px',
                      padding: '4px',
                      backgroundColor: 'white',
                      cursor: 'pointer',
                      display: 'flex',
                      flexWrap: 'wrap',
                      gap: '4px',
                      alignItems: 'center'
                    }}
                    onClick={() => setShowAssigneeDropdown(!showAssigneeDropdown)}
                    >
                      {selectedAssignees.length > 0 ? (
                        selectedAssignees.map(user => (
                          <div key={user._id} style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            backgroundColor: '#f4f5f7',
                            padding: '4px 8px',
                            borderRadius: '3px',
                            fontSize: '13px'
                          }}
                          onClick={(e) => e.stopPropagation()}
                          >
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
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleRemoveAssignee(user._id);
                              }}
                              style={{
                                background: 'none',
                                border: 'none',
                                cursor: 'pointer',
                                padding: '0 4px',
                                fontSize: '16px',
                                color: '#5e6c84',
                                lineHeight: '1'
                              }}
                            >
                              ×
                            </button>
                          </div>
                        ))
                      ) : (
                        <span style={{ 
                          color: '#8993a4', 
                          fontSize: '13px',
                          padding: '6px 8px'
                        }}>
                          Unassigned
                        </span>
                      )}
                      <div style={{ marginLeft: 'auto', padding: '0 8px', color: '#5e6c84' }}>
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                          <path d="M8 10l4-4H4z"/>
                        </svg>
                      </div>
                    </div>
                    
                    {/* Assignee Dropdown */}
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
                        boxShadow: '0 4px 8px rgba(9, 30, 66, 0.15)',
                        zIndex: 1000,
                        maxHeight: '300px',
                        overflowY: 'auto'
                      }}>
                        {/* Search Input */}
                        <div style={{ padding: '8px', borderBottom: '1px solid #dfe1e6' }}>
                          <input
                            type="text"
                            placeholder="Search users..."
                            value={assigneeSearch}
                            onChange={(e) => setAssigneeSearch(e.target.value)}
                            onClick={(e) => e.stopPropagation()}
                            autoFocus
                            style={{
                              width: '100%',
                              padding: '6px 8px',
                              border: '1px solid #dfe1e6',
                              borderRadius: '3px',
                              fontSize: '13px',
                              outline: 'none'
                            }}
                          />
                        </div>
                        
                        {/* Unassigned Option */}
                        <div
                          onClick={(e) => {
                            e.stopPropagation();
                            handleClearAssignees();
                          }}
                          style={{
                            padding: '8px 12px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            fontSize: '13px',
                            backgroundColor: selectedAssignees.length === 0 ? '#f4f5f7' : 'transparent',
                            borderBottom: '1px solid #f4f5f7'
                          }}
                          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f4f5f7'}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = selectedAssignees.length === 0 ? '#f4f5f7' : 'transparent';
                          }}
                        >
                          <div style={{
                            width: '24px',
                            height: '24px',
                            borderRadius: '50%',
                            backgroundColor: '#dfe1e6',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '14px'
                          }}>
                            <svg width="16" height="16" viewBox="0 0 16 16" fill="#5e6c84">
                              <path d="M8 8c1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3 1.34 3 3 3zm0 1c-2 0-6 1-6 3v1h12v-1c0-2-4-3-6-3z"/>
                            </svg>
                          </div>
                          <span style={{ color: '#172b4d' }}>Unassigned</span>
                        </div>
                        
                        {/* User List */}
                        {filteredUsers.map(user => {
                          const isSelected = taskForm.assignees && taskForm.assignees.includes(user._id);
                          return (
                            <div
                              key={user._id}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleToggleAssignee(user._id);
                              }}
                              style={{
                                padding: '8px 12px',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                fontSize: '13px',
                                backgroundColor: isSelected ? '#deebff' : 'transparent'
                              }}
                              onMouseEnter={(e) => {
                                if (!isSelected) {
                                  e.currentTarget.style.backgroundColor = '#f4f5f7';
                                }
                              }}
                              onMouseLeave={(e) => {
                                if (!isSelected) {
                                  e.currentTarget.style.backgroundColor = 'transparent';
                                } else {
                                  e.currentTarget.style.backgroundColor = '#deebff';
                                }
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
                              <span style={{ color: '#172b4d', flex: 1 }}>{user.name}</span>
                              {isSelected && (
                                <svg width="16" height="16" viewBox="0 0 16 16" fill="#0052cc">
                                  <path d="M6.5 11.5l-3-3 1-1 2 2 5-5 1 1z"/>
                                </svg>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                  
                  <div style={{ marginBottom: '16px' }}>
                    <label style={{ 
                      display: 'block', 
                      marginBottom: '6px', 
                      fontSize: '12px', 
                      fontWeight: '600', 
                      color: '#5e6c84'
                    }}>
                      Reporter
                    </label>
                    <div style={{
                      padding: '8px',
                      backgroundColor: 'white',
                      border: '1px solid #dfe1e6',
                      borderRadius: '3px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px'
                    }}>
                      <div style={{
                        width: '24px',
                        height: '24px',
                        borderRadius: '50%',
                        backgroundColor: getUserColor(currentUser?._id),
                        color: 'white',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '10px',
                        fontWeight: '600'
                      }}>
                        {getUserInitials(currentUser)}
                      </div>
                      <span style={{ fontSize: '13px', color: '#172b4d' }}>
                        {currentUser?.name || 'Unknown'}
                      </span>
                    </div>
                  </div>
                  
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
                  
                  <div style={{ marginBottom: '16px' }}>
                    <label style={{ 
                      display: 'block', 
                      marginBottom: '6px', 
                      fontSize: '12px', 
                      fontWeight: '600', 
                      color: '#5e6c84'
                    }}>
                      Story Points
                    </label>
                    <input
                      type="number"
                      placeholder="0"
                      value={storyPoints}
                      onChange={(e) => setStoryPoints(e.target.value)}
                      min="0"
                      step="1"
                      style={{
                        width: '100%',
                        padding: '6px 8px',
                        border: '1px solid #dfe1e6',
                        borderRadius: '3px',
                        fontSize: '13px'
                      }}
                    />
                  </div>
                  
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
                  
                  <div style={{ marginBottom: '16px' }}>
                    <label style={{ 
                      display: 'block', 
                      marginBottom: '6px', 
                      fontSize: '12px', 
                      fontWeight: '600', 
                      color: '#5e6c84'
                    }}>
                      Original Estimate (hours)
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
                  
                  <div style={{ marginBottom: '0' }}>
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
            </div>
            
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: '12px', 
              paddingTop: '24px', 
              borderTop: '2px solid #dfe1e6',
              marginTop: '32px'
            }}>
              <div style={{ fontSize: '12px', color: '#5e6c84' }}>
                * Required fields
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  type="button"
                  onClick={onCancel}
                  style={{
                    padding: '10px 20px',
                    backgroundColor: 'transparent',
                    color: '#5e6c84',
                    border: 'none',
                    borderRadius: '3px',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: '500',
                    transition: 'background-color 0.2s'
                  }}
                  onMouseEnter={(e) => e.target.style.backgroundColor = '#f4f5f7'}
                  onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{
                    padding: '10px 20px',
                    backgroundColor: '#0052cc',
                    color: 'white',
                    border: 'none',
                    borderRadius: '3px',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: '500',
                    transition: 'background-color 0.2s'
                  }}
                  onMouseEnter={(e) => e.target.style.backgroundColor = '#0747a6'}
                  onMouseLeave={(e) => e.target.style.backgroundColor = '#0052cc'}
                >
                  {editingTask ? 'Update Issue' : 'Create Issue'}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default TaskFormJira;
