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
  
  // Assignee Selector Component
  const AssigneeSelector = () => (
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

