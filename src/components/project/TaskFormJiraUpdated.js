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
    <div className="mb-4 relative" ref={assigneeDropdownRef}>
      <label className="block mb-1.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">
        Assignee
      </label>
      
      {/* Selected Assignees Display */}
      <div className="min-h-[38px] border border-gray-200 rounded cursor-pointer flex flex-wrap gap-1 items-center p-1 bg-white"
      onClick={() => setShowAssigneeDropdown(!showAssigneeDropdown)}
      >
        {selectedAssignees.length > 0 ? (
          selectedAssignees.map(user => (
            <div key={user._id} className="flex items-center gap-1.5 bg-gray-50 py-1 px-2 rounded text-xs"
            onClick={(e) => e.stopPropagation()}
            >
              <div className="w-5 h-5 rounded-full text-white flex items-center justify-center text-xs font-semibold" style={{ backgroundColor: getUserColor(user._id) }}>
                {getUserInitials(user)}
              </div>
              <span>{user.name}</span>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleRemoveAssignee(user._id);
                }}
                className="bg-transparent border-0 cursor-pointer px-1 text-base text-gray-500 leading-none hover:text-gray-700"
              >
                ×
              </button>
            </div>
          ))
        ) : (
          <span className="text-gray-400 text-xs py-1.5 px-2">
            Unassigned
          </span>
        )}
        <div className="ml-auto py-0 px-2 text-gray-500">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
            <path d="M8 10l4-4H4z"/>
          </svg>
        </div>
      </div>
      
      {/* Assignee Dropdown */}
      {showAssigneeDropdown && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded shadow-lg z-[1000] max-h-[300px] overflow-y-auto">
          {/* Search Input */}
          <div className="p-2 border-b border-gray-200">
            <input
              type="text"
              placeholder="Search users..."
              value={assigneeSearch}
              onChange={(e) => setAssigneeSearch(e.target.value)}
              onClick={(e) => e.stopPropagation()}
              autoFocus
              className="w-full py-1.5 px-2 border border-gray-200 rounded text-xs outline-none"
            />
          </div>
          
          {/* Unassigned Option */}
          <div
            onClick={(e) => {
              e.stopPropagation();
              handleClearAssignees();
            }}
            className={`py-2 px-3 cursor-pointer flex items-center gap-2 text-xs border-b border-gray-50 hover:bg-gray-50 ${
              selectedAssignees.length === 0 ? 'bg-gray-50' : 'bg-transparent'
            }`}
          >
            <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center text-sm">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="#5e6c84">
                <path d="M8 8c1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3 1.34 3 3 3zm0 1c-2 0-6 1-6 3v1h12v-1c0-2-4-3-6-3z"/>
              </svg>
            </div>
            <span className="text-gray-800">Unassigned</span>
          </div>

