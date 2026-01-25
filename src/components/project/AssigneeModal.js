import React, { useState, useRef, useEffect } from 'react';
import { taskAPI } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';

const AssigneeModal = ({ task, projectId, users = [], onClose, onUpdate }) => {
  const { showToast } = useToast();
  const { state: authState } = useAuth();
  const [assignees, setAssignees] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddDropdown, setShowAddDropdown] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const dropdownRef = useRef(null);
  const searchInputRef = useRef(null);

  // Initialize assignees from task
  useEffect(() => {
    if (task) {
      const taskAssignees = task.assignees || [];
      setAssignees(taskAssignees.map(a => typeof a === 'object' ? a._id : a));
    }
  }, [task]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowAddDropdown(false);
        setSearchQuery('');
      }
    };

    if (showAddDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
      // Focus search input when dropdown opens
      setTimeout(() => {
        if (searchInputRef.current) {
          searchInputRef.current.focus();
        }
      }, 100);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showAddDropdown]);

  // Close on Escape key
  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === 'Escape') {
        if (showAddDropdown) {
          setShowAddDropdown(false);
        } else {
          onClose();
        }
      }
    };
    document.addEventListener('keydown', handleEsc);
    return () => document.removeEventListener('keydown', handleEsc);
  }, [showAddDropdown, onClose]);

  const getUserById = (userId) => {
    return users.find(u => u._id === userId);
  };

  const getUserInitials = (user) => {
    if (!user || !user.name) return '?';
    const names = user.name.split(' ');
    return names.length >= 2
      ? (names[0][0] + names[names.length - 1][0]).toUpperCase()
      : user.name.substring(0, 2).toUpperCase();
  };

  const getUserColor = (userId) => {
    const colors = ['#0052cc', '#00875a', '#ff8b00', '#6554c0', '#00b8d9', '#ff5630', '#5243aa', '#36b37e'];
    return colors[userId ? userId.charCodeAt(userId.length - 1) % colors.length : 0];
  };

  const filteredUsers = users.filter(user => {
    const query = searchQuery.toLowerCase();
    return (
      !assignees.includes(user._id) &&
      (user.name?.toLowerCase().includes(query) || user.email?.toLowerCase().includes(query))
    );
  });

  const handleAddAssignee = (userId) => {
    if (!assignees.includes(userId)) {
      setAssignees([...assignees, userId]);
      setSearchQuery('');
      setShowAddDropdown(false);
    }
  };

  const handleRemoveAssignee = (userId) => {
    setAssignees(assignees.filter(id => id !== userId));
  };

  const handleMoveUp = (index) => {
    if (index > 0) {
      const newAssignees = [...assignees];
      [newAssignees[index - 1], newAssignees[index]] = [newAssignees[index], newAssignees[index - 1]];
      setAssignees(newAssignees);
    }
  };

  const handleMoveDown = (index) => {
    if (index < assignees.length - 1) {
      const newAssignees = [...assignees];
      [newAssignees[index], newAssignees[index + 1]] = [newAssignees[index + 1], newAssignees[index]];
      setAssignees(newAssignees);
    }
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      await taskAPI.update(projectId, task._id, { assignees });
      showToast('Assignees updated successfully', 'success');
      if (onUpdate) {
        onUpdate();
      }
      onClose();
    } catch (error) {
      console.error('Error updating assignees:', error);
      showToast(error.response?.data?.error || 'Failed to update assignees', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  if (!task) return null;

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(9, 30, 66, 0.54)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 2000
      }}
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: 'white',
          borderRadius: '8px',
          width: '90%',
          maxWidth: '600px',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 8px 16px rgba(9, 30, 66, 0.25), 0 0 1px rgba(9, 30, 66, 0.31)'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{
          padding: '20px 24px',
          borderBottom: '1px solid #dfe1e6',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div>
            <h3 style={{ margin: 0, fontSize: '20px', fontWeight: '600', color: '#172b4d' }}>
              Manage Assignees
            </h3>
            <p style={{ margin: '4px 0 0 0', fontSize: '14px', color: '#5e6c84' }}>
              {task.title}
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '24px',
              cursor: 'pointer',
              color: '#5e6c84',
              padding: '4px',
              lineHeight: 1
            }}
          >
            ×
          </button>
        </div>

        {/* Content */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '24px' }}>
          {/* Current Assignees List */}
          <div style={{ marginBottom: '24px' }}>
            <label style={{
              display: 'block',
              fontSize: '12px',
              fontWeight: '600',
              color: '#5e6c84',
              marginBottom: '12px',
              textTransform: 'uppercase'
            }}>
              Assignees ({assignees.length})
            </label>

            {assignees.length === 0 ? (
              <div style={{
                padding: '40px',
                textAlign: 'center',
                backgroundColor: '#fafbfc',
                borderRadius: '4px',
                border: '1px dashed #dfe1e6'
              }}>
                <div style={{ fontSize: '32px', marginBottom: '8px', opacity: 0.5 }}>👤</div>
                <p style={{ margin: 0, fontSize: '14px', color: '#5e6c84' }}>
                  No assignees. Click "Add Assignee" to get started.
                </p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {assignees.map((userId, index) => {
                  const user = getUserById(userId);
                  if (!user) return null;

                  return (
                    <div
                      key={userId}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        padding: '12px',
                        backgroundColor: '#fafbfc',
                        borderRadius: '4px',
                        border: '1px solid #dfe1e6'
                      }}
                    >
                      {/* Sequence Number */}
                      <div style={{
                        width: '28px',
                        height: '28px',
                        borderRadius: '50%',
                        backgroundColor: '#0052cc',
                        color: 'white',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '12px',
                        fontWeight: '600',
                        flexShrink: 0
                      }}>
                        {index + 1}
                      </div>

                      {/* Avatar */}
                      <div style={{
                        width: '40px',
                        height: '40px',
                        borderRadius: '50%',
                        backgroundColor: getUserColor(userId),
                        color: 'white',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '14px',
                        fontWeight: '600',
                        flexShrink: 0
                      }}>
                        {getUserInitials(user)}
                      </div>

                      {/* User Info */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{
                          fontSize: '14px',
                          fontWeight: '500',
                          color: '#172b4d',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap'
                        }}>
                          {user.name}
                        </div>
                        {user.email && (
                          <div style={{
                            fontSize: '12px',
                            color: '#5e6c84',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap'
                          }}>
                            {user.email}
                          </div>
                        )}
                      </div>

                      {/* Move Buttons */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                        <button
                          onClick={() => handleMoveUp(index)}
                          disabled={index === 0}
                          style={{
                            width: '24px',
                            height: '24px',
                            border: '1px solid #dfe1e6',
                            borderRadius: '3px',
                            backgroundColor: index === 0 ? '#f4f5f7' : 'white',
                            cursor: index === 0 ? 'not-allowed' : 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '12px',
                            color: index === 0 ? '#a8b1bd' : '#5e6c84'
                          }}
                          title="Move up"
                        >
                          ↑
                        </button>
                        <button
                          onClick={() => handleMoveDown(index)}
                          disabled={index === assignees.length - 1}
                          style={{
                            width: '24px',
                            height: '24px',
                            border: '1px solid #dfe1e6',
                            borderRadius: '3px',
                            backgroundColor: index === assignees.length - 1 ? '#f4f5f7' : 'white',
                            cursor: index === assignees.length - 1 ? 'not-allowed' : 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '12px',
                            color: index === assignees.length - 1 ? '#a8b1bd' : '#5e6c84'
                          }}
                          title="Move down"
                        >
                          ↓
                        </button>
                      </div>

                      {/* Remove Button */}
                      <button
                        onClick={() => handleRemoveAssignee(userId)}
                        style={{
                          width: '32px',
                          height: '32px',
                          border: 'none',
                          borderRadius: '4px',
                          backgroundColor: '#ffebe6',
                          color: '#de350b',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '18px',
                          lineHeight: 1
                        }}
                        title="Remove"
                      >
                        ×
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Add Assignee Button */}
          <div style={{ position: 'relative' }} ref={dropdownRef}>
            <button
              onClick={() => setShowAddDropdown(!showAddDropdown)}
              style={{
                width: '100%',
                padding: '10px 16px',
                border: '2px dashed #dfe1e6',
                borderRadius: '4px',
                backgroundColor: 'white',
                color: '#0052cc',
                fontSize: '14px',
                fontWeight: '500',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = '#0052cc';
                e.currentTarget.style.backgroundColor = '#f4f5f7';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = '#dfe1e6';
                e.currentTarget.style.backgroundColor = 'white';
              }}
            >
              <span>+</span>
              <span>Add Assignee</span>
            </button>

            {/* Dropdown */}
            {showAddDropdown && (
              <div style={{
                position: 'absolute',
                top: '100%',
                left: 0,
                right: 0,
                marginTop: '8px',
                backgroundColor: 'white',
                border: '1px solid #dfe1e6',
                borderRadius: '4px',
                boxShadow: '0 4px 8px rgba(9, 30, 66, 0.25)',
                zIndex: 1000,
                maxHeight: '300px',
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column'
              }}>
                {/* Search Input */}
                <div style={{ padding: '8px', borderBottom: '1px solid #dfe1e6' }}>
                  <input
                    ref={searchInputRef}
                    type="text"
                    placeholder="Search users..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '8px',
                      border: '1px solid #dfe1e6',
                      borderRadius: '3px',
                      fontSize: '14px',
                      outline: 'none'
                    }}
                    onFocus={(e) => e.target.style.borderColor = '#0052cc'}
                    onBlur={(e) => e.target.style.borderColor = '#dfe1e6'}
                  />
                </div>

                {/* User List */}
                <div style={{ overflowY: 'auto', maxHeight: '250px' }}>
                  {filteredUsers.length > 0 ? (
                    filteredUsers.map(user => (
                      <div
                        key={user._id}
                        onClick={() => handleAddAssignee(user._id)}
                        style={{
                          padding: '10px 12px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '12px',
                          borderBottom: '1px solid #f4f5f7'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f4f5f7'}
                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'white'}
                      >
                        <div style={{
                          width: '32px',
                          height: '32px',
                          borderRadius: '50%',
                          backgroundColor: getUserColor(user._id),
                          color: 'white',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '12px',
                          fontWeight: '600',
                          flexShrink: 0
                        }}>
                          {getUserInitials(user)}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{
                            fontSize: '14px',
                            fontWeight: '500',
                            color: '#172b4d',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap'
                          }}>
                            {user.name}
                          </div>
                          {user.email && (
                            <div style={{
                              fontSize: '12px',
                              color: '#5e6c84',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap'
                            }}>
                              {user.email}
                            </div>
                          )}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div style={{
                      padding: '20px',
                      textAlign: 'center',
                      color: '#5e6c84',
                      fontSize: '14px'
                    }}>
                      {searchQuery ? 'No users found' : 'All users are already assigned'}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div style={{
          padding: '16px 24px',
          borderTop: '1px solid #dfe1e6',
          display: 'flex',
          justifyContent: 'flex-end',
          gap: '8px'
        }}>
          <button
            onClick={onClose}
            disabled={isSaving}
            style={{
              padding: '10px 16px',
              backgroundColor: 'white',
              border: '1px solid #dfe1e6',
              borderRadius: '4px',
              fontSize: '14px',
              fontWeight: '500',
              cursor: isSaving ? 'not-allowed' : 'pointer',
              color: '#5e6c84'
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving}
            style={{
              padding: '10px 16px',
              backgroundColor: isSaving ? '#c1c7d0' : '#0052cc',
              border: 'none',
              borderRadius: '4px',
              fontSize: '14px',
              fontWeight: '500',
              cursor: isSaving ? 'not-allowed' : 'pointer',
              color: 'white'
            }}
          >
            {isSaving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AssigneeModal;

