import React, { useState, useEffect, useRef } from 'react';
import TaskStatusManager from './TaskStatusManager';
import { Button, Card } from '../ui';
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
  phases = [],
  workflowRoles = []
}) => {
  const { state } = useAuth();
  const currentUser = state.user;
  
  const [issueType, setIssueType] = useState(taskForm.issueType || 'task');
  const [labels, setLabels] = useState(taskForm.labels || []);
  const [labelInput, setLabelInput] = useState('');
  const [storyPoints, setStoryPoints] = useState(taskForm.storyPoints || '');
  const [showAssigneeDropdown, setShowAssigneeDropdown] = useState(false);
  const [assigneeSearch, setAssigneeSearch] = useState('');

  // Workflow Roles State
  const [useRoleWorkflow, setUseRoleWorkflow] = useState(taskForm.useRoleWorkflow || false);
  const [roleAssignments, setRoleAssignments] = useState(taskForm.roleAssignments || []);
  const [expandedRoles, setExpandedRoles] = useState({});
  
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

  // Initialize role assignments when workflow is enabled
  const handleToggleRoleWorkflow = (enabled) => {
    setUseRoleWorkflow(enabled);
    if (enabled && roleAssignments.length === 0 && workflowRoles.length > 0) {
      // Initialize with all available roles in order
      const initialAssignments = workflowRoles
        .sort((a, b) => a.order - b.order)
        .map((role, index) => ({
          role: role._id,
          order: index + 1,
          assignees: role.defaultAssignees || []
        }));
      setRoleAssignments(initialAssignments);
      setTaskForm({...taskForm, useRoleWorkflow: enabled, roleAssignments: initialAssignments});
    } else {
      setTaskForm({...taskForm, useRoleWorkflow: enabled});
    }
  };

  const handleToggleRoleAssignee = (roleId, userId) => {
    const updatedAssignments = roleAssignments.map(ra => {
      if (ra.role === roleId) {
        const currentAssignees = ra.assignees || [];
        const newAssignees = currentAssignees.includes(userId)
          ? currentAssignees.filter(id => id !== userId)
          : [...currentAssignees, userId];
        return { ...ra, assignees: newAssignees };
      }
      return ra;
    });
    setRoleAssignments(updatedAssignments);
    setTaskForm({...taskForm, roleAssignments: updatedAssignments});
  };

  const toggleRoleExpanded = (roleId) => {
    setExpandedRoles(prev => ({ ...prev, [roleId]: !prev[roleId] }));
  };

  const getRoleById = (roleId) => workflowRoles.find(r => r._id === roleId);

  const getRoleAssigneesDisplay = (roleId) => {
    const assignment = roleAssignments.find(ra => ra.role === roleId);
    if (!assignment || !assignment.assignees || assignment.assignees.length === 0) {
      return 'No assignees';
    }
    return assignment.assignees.map(id => {
      const user = users.find(u => u._id === id);
      return user?.name || 'Unknown';
    }).join(', ');
  };

  return (
    <div className="fixed inset-0 bg-[rgba(9,30,66,0.54)] flex items-start justify-center z-[1000] p-10 overflow-y-auto"
      onClick={onCancel}
    >
      <div className="bg-white rounded border w-full max-w-[900px] shadow-[0_20px_32px_-8px_rgba(9,30,66,0.25)] font-sans mt-5 mb-10"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6 lg:p-8 border-b-2 border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded bg-slate-100 flex items-center justify-center text-base font-medium">
              {getIssueTypeIcon(issueType).icon}
            </div>
            <h2 className="m-0 text-xl font-medium text-slate-800">
              {editingTask ? 'Edit Issue' : parentTask ? 'Create Subtask' : 'Create Issue'}
            </h2>
          </div>
          <button
            type="button"
            onClick={onCancel}
            className="bg-transparent border-0 text-2xl text-slate-500 cursor-pointer p-1 rounded hover:bg-slate-100 transition-colors"
          >
            ×
          </button>
        </div>
        
        <div className="p-8">
          {error && (
            <div className="py-3 px-4 bg-red-50 border border-red-200 rounded mb-6 text-red-700 text-sm flex items-center gap-2">
              <span className="text-base">⚠️</span>
              {error}
            </div>
          )}
          
          <form onSubmit={handleSubmitWithExtras}>
            {!editingTask && !parentTask && (
              <div className="mb-6">
                <label className="block mb-2 text-xs font-bold text-gray-500 uppercase tracking-wide">
                  Issue Type
                </label>
                <div className="flex gap-2">
                  {['task', 'bug', 'story', 'epic'].map(type => {
                    const typeInfo = getIssueTypeIcon(type);
                    const isSelected = issueType === type;
                    return (
                      <button
                        key={type}
                        type="button"
                        onClick={() => setIssueType(type)}
                        className={`flex-1 p-3 border-2 rounded cursor-pointer flex flex-col items-center gap-1 transition-all ${
                          isSelected 
                            ? `border-[${typeInfo.color}] bg-[${typeInfo.bg}]`
                            : 'border-gray-200 bg-white hover:border-blue-600 hover:bg-blue-50'
                        }`}
                      >
                        <span className="text-xl">{typeInfo.icon}</span>
                        <span className={`text-xs font-semibold ${
                          isSelected ? `text-[${typeInfo.color}]` : 'text-gray-500'
                        }`}>
                          {typeInfo.label}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
            
            <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-8">
              
              <div>
                <div className="mb-6">
                  <label className="block mb-2 text-xs font-bold text-gray-500 uppercase tracking-wide">
                    Summary <span className="text-red-600">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="What needs to be done?"
                    value={taskForm.title}
                    onChange={(e) => setTaskForm({...taskForm, title: e.target.value})}
                    required
                    autoFocus
                    className="w-full py-2.5 px-3 border-2 border-gray-200 rounded text-sm outline-none transition-all focus:border-blue-600 focus:shadow-[0_0_0_1px_#0052cc]"
                  />
                </div>
                
                <div className="mb-6">
                  <label className="block mb-2 text-xs font-bold text-gray-500 uppercase tracking-wide">
                    Description
                  </label>
                  <textarea
                    placeholder="Add a description..."
                    value={taskForm.description}
                    onChange={(e) => setTaskForm({...taskForm, description: e.target.value})}
                    rows="8"
                    className="w-full p-3 border-2 border-gray-200 rounded text-sm resize-y min-h-[150px] outline-none transition-all focus:border-blue-600 focus:shadow-[0_0_0_1px_#0052cc]"
                  />
                </div>
                
                <div className="mb-6">
                  <label className="block mb-2 text-xs font-bold text-gray-500 uppercase tracking-wide">
                    Labels
                  </label>
                  <div className="flex flex-wrap gap-1.5 mb-2">
                    {labels.map((label, index) => (
                      <span key={index} className="py-1 px-2 bg-gray-50 border border-gray-200 rounded text-xs text-gray-800 flex items-center gap-1">
                        {label}
                        <button
                          type="button"
                          onClick={() => handleRemoveLabel(label)}
                          className="bg-transparent border-0 text-gray-500 cursor-pointer p-0 text-sm leading-none hover:text-gray-700"
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
                    className="w-full py-2 px-3 border-2 border-gray-200 rounded text-xs outline-none focus:border-blue-600"
                  />
                </div>
              </div>
              
              <div>
                <div className="bg-slate-100 p-4 rounded border border-slate-200">
                  <h4 className="m-0 mb-4 text-xs font-bold text-slate-500 uppercase tracking-wide">
                    Details
                  </h4>
                  
                  <div className="mb-4">
                    <TaskStatusManager
                      projectId={projectId}
                      taskStatuses={taskStatuses}
                      onStatusesUpdate={onStatusesUpdate}
                      selectedStatus={taskForm.status}
                      onStatusChange={(value) => setTaskForm({...taskForm, status: value})}
                      isProjectOwner={isProjectOwner}
                    />
                  </div>
                  
                  <div className="mb-4 relative" ref={assigneeDropdownRef}>
                    <label className="block mb-1.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                      Assignee
                    </label>
                    
                    {/* Selected Assignees Display */}
                    <div className="min-h-10 border border-slate-200 rounded p-1 bg-white cursor-pointer flex flex-wrap gap-1 items-center"
                      onClick={() => setShowAssigneeDropdown(!showAssigneeDropdown)}
                    >
                      {selectedAssignees.length > 0 ? (
                        selectedAssignees.map(user => (
                          <div key={user._id} className="flex items-center gap-1.5 bg-slate-100 px-2 py-1 rounded text-sm"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <div className="w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center text-xs font-semibold">
                              {getUserInitials(user)}
                            </div>
                            <span>{user.name}</span>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleRemoveAssignee(user._id);
                              }}
                              className="bg-transparent border-0 cursor-pointer p-0.5 text-base text-slate-500 hover:text-slate-700"
                            >
                              ×
                            </button>
                          </div>
                        ))
                      ) : (
                        <span className="text-slate-400 text-sm px-2 py-1.5">
                          Unassigned
                        </span>
                      )}
                      <div className="ml-auto px-2 text-slate-500">
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                          <path d="M8 10l4-4H4z"/>
                        </svg>
                      </div>
                    </div>
                    
                    {/* Assignee Dropdown */}
                    {showAssigneeDropdown && (
                      <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded shadow-lg z-[1000] max-h-72 overflow-y-auto">
                        {/* Search Input */}
                        <div className="p-2 border-b border-slate-200">
                          <input
                            type="text"
                            placeholder="Search users..."
                            value={assigneeSearch}
                            onChange={(e) => setAssigneeSearch(e.target.value)}
                            onClick={(e) => e.stopPropagation()}
                            autoFocus
                            className="w-full p-2 border border-slate-200 rounded text-sm outline-none"
                          />
                        </div>
                        
                        {/* Unassigned Option */}
                        <div
                          onClick={(e) => {
                            e.stopPropagation();
                            handleClearAssignees();
                          }}
                          className={`p-3 cursor-pointer flex items-center gap-2 text-sm border-b border-slate-100 ${selectedAssignees.length === 0 ? 'bg-slate-100' : 'hover:bg-slate-100'}`}
                        >
                          <div className="w-6 h-6 rounded-full bg-slate-200 flex items-center justify-center text-sm">
                            <svg width="16" height="16" viewBox="0 0 16 16" fill="#5e6c84">
                              <path d="M8 8c1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3 1.34 3 3 3zm0 1c-2 0-6 1-6 3v1h12v-1c0-2-4-3-6-3z"/>
                            </svg>
                          </div>
                          <span className="text-slate-800">Unassigned</span>
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
                              className={`p-3 cursor-pointer flex items-center gap-2 text-sm ${isSelected ? 'bg-blue-50' : 'hover:bg-slate-100'}`}
                            >
                              <div className="w-6 h-6 rounded-full bg-indigo-600 text-white flex items-center justify-center text-xs font-semibold">
                                {getUserInitials(user)}
                              </div>
                              <span className="text-slate-800 flex-1">{user.name}</span>
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
                  
                  <div className="mb-4">
                    <label className="block mb-1.5 text-xs font-semibold text-slate-500">
                      Reporter
                    </label>
                    <div className="p-2 bg-white border border-slate-200 rounded flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-indigo-600 text-white flex items-center justify-center text-xs font-semibold">
                        {getUserInitials(currentUser)}
                      </div>
                      <span className="text-sm text-slate-800">
                        {currentUser?.name || 'Unknown'}
                      </span>
                    </div>
                  </div>
                  
                  <div className="mb-4">
                    <label className="block mb-1.5 text-xs font-semibold text-slate-500">
                      Priority
                    </label>
                    <select
                      value={taskForm.priority}
                      onChange={(e) => setTaskForm({...taskForm, priority: e.target.value})}
                      className="w-full p-2 border border-slate-200 rounded text-sm bg-white"
                    >
                      <option value="">None</option>
                      <option value="low">🟢 Low</option>
                      <option value="medium">🟡 Medium</option>
                      <option value="high">🟠 High</option>
                      <option value="urgent">🔴 Urgent</option>
                    </select>
                  </div>
                  
                  <div className="mb-4">
                    <label className="block mb-1.5 text-xs font-semibold text-slate-500">
                      Story Points
                    </label>
                    <input
                      type="number"
                      placeholder="0"
                      value={storyPoints}
                      onChange={(e) => setStoryPoints(e.target.value)}
                      min="0"
                      step="1"
                      className="w-full p-2 border border-slate-200 rounded text-sm"
                    />
                  </div>
                  
                  <div className="mb-4">
                    <label className="block mb-1.5 text-xs font-semibold text-slate-600">
                      Phase
                    </label>
                    <select
                      value={taskForm.phase || ''}
                      onChange={(e) => setTaskForm({...taskForm, phase: e.target.value})}
                      className="w-full px-2 py-1.5 border border-slate-200 rounded text-sm bg-white"
                    >
                      <option value="">No Phase</option>
                      {phases.map(phase => (
                        <option key={phase._id} value={phase._id}>
                          {phase.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <div className="mb-4">
                    <label className="block mb-1.5 text-xs font-semibold text-slate-500">
                      Sprint
                    </label>
                    <select
                      value={taskForm.sprint || ''}
                      onChange={(e) => setTaskForm({...taskForm, sprint: e.target.value})}
                      className="w-full p-2 border border-slate-200 rounded text-sm bg-white"
                    >
                      <option value="">No Sprint</option>
                      {sprints.map(sprint => (
                        <option key={sprint._id} value={sprint._id}>
                          {sprint.name} (Sprint #{sprint.sprintNumber})
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Workflow Roles Section */}
                  {workflowRoles.length > 0 && (
                    <div className="mb-4">
                      <div className="flex items-center justify-between mb-2">
                        <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                          🔄 Workflow Roles
                        </label>
                        <label className="flex items-center gap-1.5 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={useRoleWorkflow}
                            onChange={(e) => handleToggleRoleWorkflow(e.target.checked)}
                            className="cursor-pointer"
                          />
                          <span className="text-xs text-slate-500">Enable</span>
                        </label>
                      </div>

                      {useRoleWorkflow && (
                        <div className="border border-slate-200 rounded bg-slate-50">
                          {workflowRoles
                            .sort((a, b) => a.order - b.order)
                            .map((role, index) => {
                              const isExpanded = expandedRoles[role._id];
                              const assignment = roleAssignments.find(ra => ra.role === role._id);
                              const assignedCount = assignment?.assignees?.length || 0;

                              return (
                                <div key={role._id} className={index < workflowRoles.length - 1 ? 'border-b border-slate-200' : ''}>
                                  {/* Role Header */}
                                  <div
                                    onClick={() => toggleRoleExpanded(role._id)}
                                    className="p-3 flex items-center gap-2 cursor-pointer bg-slate-50"
                                  >
                                    <span className="text-base">{role.icon || '📋'}</span>
                                    <div className="flex-1">
                                      <div className="text-sm font-medium text-slate-800 flex items-center gap-1.5">
                                        <span className="w-4 h-4 rounded-full bg-indigo-600 text-white flex items-center justify-center text-xs font-semibold">
                                          {index + 1}
                                        </span>
                                        {role.name}
                                      </div>
                                      <div className="text-xs text-slate-400 mt-0.5">
                                        {assignedCount} assignee{assignedCount !== 1 ? 's' : ''}
                                      </div>
                                    </div>
                                    <span className={`text-slate-400 transition-transform duration-200 ${isExpanded ? 'rotate-180' : 'rotate-0'}`}>▼</span>
                                  </div>

                                  {/* Role Assignees */}
                                  {isExpanded && (
                                    <div className="p-3 bg-white border-t border-slate-100">
                                      <div className="text-xs text-slate-400 mb-1.5">
                                        Select assignees for this role:
                                      </div>
                                      <div className="max-h-36 overflow-y-auto">
                                        {users.map(user => {
                                          const isSelected = assignment?.assignees?.includes(user._id);
                                          return (
                                            <div
                                              key={user._id}
                                              onClick={() => handleToggleRoleAssignee(role._id, user._id)}
                                              className={`p-2 flex items-center gap-2 cursor-pointer rounded ${isSelected ? 'bg-blue-50' : 'hover:bg-slate-100'}`}
                                            >
                                              <div className="w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center text-xs font-semibold">
                                                {getUserInitials(user)}
                                              </div>
                                              <span className="text-xs text-slate-800 flex-1">
                                                {user.name}
                                              </span>
                                              {isSelected && (
                                                <svg width="14" height="14" viewBox="0 0 16 16" fill="#0052cc">
                                                  <path d="M6.5 11.5l-3-3 1-1 2 2 5-5 1 1z"/>
                                                </svg>
                                              )}
                                            </div>
                                          );
                                        })}
                                      </div>
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                        </div>
                      )}

                      {useRoleWorkflow && (
                        <p className="text-[10px] text-slate-400 mt-1.5 mb-0">
                          When workflow starts, assignees will be notified in sequence.
                        </p>
                      )}
                    </div>
                  )}

                  <div className="mb-4">
                    <label className="block mb-1.5 text-xs font-semibold text-slate-500">
                      Original Estimate (hours)
                    </label>
                    <input
                      type="number"
                      placeholder="0h"
                      value={taskForm.duration}
                      onChange={(e) => setTaskForm({...taskForm, duration: e.target.value})}
                      className="w-full p-2 border border-slate-200 rounded text-sm"
                    />
                  </div>
                  
                  <div className="mb-4">
                    <label className="block mb-1.5 text-xs font-semibold text-slate-500">
                      Start Date
                    </label>
                    <input
                      type="date"
                      value={taskForm.startDate || ''}
                      onChange={(e) => setTaskForm({...taskForm, startDate: e.target.value})}
                      className="w-full p-2 border border-slate-200 rounded text-sm"
                    />
                  </div>
                  
                  <div className="mb-0">
                    <label className="block mb-1.5 text-xs font-semibold text-slate-500">
                      Due Date
                    </label>
                    <input
                      type="date"
                      value={taskForm.dueDate}
                      onChange={(e) => setTaskForm({...taskForm, dueDate: e.target.value})}
                      className="w-full p-2 border border-slate-200 rounded text-sm"
                    />
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex justify-between items-center gap-3 pt-6 border-t-2 border-slate-200 mt-8">
              <div className="text-xs text-slate-500">
                * Required fields
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={onCancel}>
                  Cancel
                </Button>
                <Button variant="primary" type="submit">
                  {editingTask ? 'Update Issue' : 'Create Issue'}
                </Button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default TaskFormJira;
