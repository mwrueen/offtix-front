import React, { useState, useEffect } from 'react';
import { taskAPI } from '../../services/api';
import { useToast } from '../../context/ToastContext';

const AssigneeModal = ({ task, projectId, users = [], onClose, onUpdate }) => {
  const { showToast } = useToast();
  const [assignedUserIds, setAssignedUserIds] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Initialize assignees from task
  useEffect(() => {
    if (task) {
      const taskAssignees = task.assignees || [];
      setAssignedUserIds(taskAssignees.map(a => typeof a === 'object' ? a._id : a));
    }
  }, [task]);

  // Helper to get user initials
  const getUserInitials = (user) => {
    if (!user || !user.name) return '?';
    const names = user.name.split(' ');
    return names.length >= 2
      ? (names[0][0] + names[names.length - 1][0]).toUpperCase()
      : user.name.substring(0, 2).toUpperCase();
  };

  // Helper to get user color
  const getUserColor = (userId) => {
    const colors = ['#0052cc', '#00875a', '#ff8b00', '#6554c0', '#00b8d9', '#ff5630', '#5243aa', '#36b37e'];
    return colors[userId ? userId.charCodeAt(userId.length - 1) % colors.length : 0];
  };

  // Filter available users based on search
  const availableUsers = users.filter(user =>
    !assignedUserIds.includes(user._id) &&
    (
      (user.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (user.email || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (user.profile?.title || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (user.projectRole || '').toLowerCase().includes(searchQuery.toLowerCase())
    )
  );

  // Get current assigned user objects
  const assignedUsers = assignedUserIds.map(id => users.find(u => u._id === id)).filter(Boolean);

  const handleToggleUser = (userId) => {
    if (assignedUserIds.includes(userId)) {
      setAssignedUserIds(prev => prev.filter(id => id !== userId));
    } else {
      setAssignedUserIds(prev => [...prev, userId]);
      setSearchQuery(''); // Optional: clear search after adding
    }
  };

  const renderUserAvatar = (user) => {
    if (user.profile?.profilePicture) {
      return (
        <img
          src={user.profile.profilePicture}
          alt={user.name}
          style={{
            width: '32px', height: '32px', borderRadius: '50%',
            objectFit: 'cover', flexShrink: 0
          }}
        />
      );
    }
    return (
      <div style={{
        width: '32px', height: '32px', borderRadius: '50%',
        backgroundColor: getUserColor(user._id), color: 'white',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: '12px', fontWeight: '600', flexShrink: 0
      }}>
        {getUserInitials(user)}
      </div>
    );
  };

  const getUserSubtext = (user) => {
    if (user.projectRole) {
      return (
        <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{
            backgroundColor: '#e6effc', color: '#0052cc', fontSize: '11px',
            padding: '2px 6px', borderRadius: '3px', fontWeight: '500'
          }}>
            {user.projectRole}
          </span>
          <span style={{ opacity: 0.7 }}>{user.email}</span>
        </span>
      );
    }
    return user.profile?.title || user.email;
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      await taskAPI.update(projectId, task._id, { assignees: assignedUserIds });
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
        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
        backgroundColor: 'rgba(9, 30, 66, 0.54)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 2000
      }}
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: 'white', borderRadius: '8px', width: '90%', maxWidth: '800px',
          height: '80vh', maxHeight: '700px', display: 'flex', flexDirection: 'column',
          boxShadow: '0 8px 30px rgba(0,0,0,0.12)', overflow: 'hidden'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{
          padding: '20px 24px', borderBottom: '1px solid #dfe1e6',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          backgroundColor: '#f4f5f7'
        }}>
          <div>
            <h3 style={{ margin: 0, fontSize: '20px', fontWeight: '600', color: '#172b4d' }}>
              Manage Assignees
            </h3>
            <p style={{ margin: '4px 0 0 0', fontSize: '14px', color: '#5e6c84', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '400px' }}>
              For task: <strong>{task.title}</strong>
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer',
              color: '#5e6c84', padding: '4px', lineHeight: 1, borderRadius: '4px'
            }}
            className="hover-bg-gray"
          >
            ×
          </button>
        </div>

        {/* Content - Two Columns */}
        <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>

          {/* Left Column: Available Users */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', borderRight: '1px solid #dfe1e6' }}>
            <div style={{ padding: '16px', borderBottom: '1px solid #dfe1e6', backgroundColor: '#fff' }}>
              <div style={{ fontWeight: '600', color: '#42526e', marginBottom: '8px', fontSize: '12px', textTransform: 'uppercase' }}>
                Available Team Members
              </div>
              <input
                type="text"
                placeholder="Search by name, email or title..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                autoFocus
                style={{
                  width: '100%', padding: '8px 12px', borderRadius: '3px',
                  border: '1px solid #dfe1e6', fontSize: '14px', outline: 'none'
                }}
              />
            </div>

            <div style={{ flex: 1, overflowY: 'auto', padding: '12px' }}>
              {availableUsers.length > 0 ? (
                availableUsers.map(user => (
                  <div
                    key={user._id}
                    onClick={() => handleToggleUser(user._id)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '12px',
                      padding: '8px 12px', borderRadius: '4px', cursor: 'pointer',
                      transition: 'background-color 0.1s', marginBottom: '4px'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f4f5f7'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                  >
                    {renderUserAvatar(user)}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: '14px', fontWeight: '500', color: '#172b4d' }}>
                        {user.name}
                      </div>
                      <div style={{ fontSize: '12px', color: '#5e6c84' }}>
                        {getUserSubtext(user)}
                      </div>
                    </div>
                    <div style={{ color: '#0052cc', fontSize: '18px' }}>+</div>
                  </div>
                ))
              ) : (
                <div style={{ textAlign: 'center', padding: '32px', color: '#6b778c' }}>
                  {searchQuery ? 'No matching users found' : 'All users assigned'}
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Assigned Users */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', backgroundColor: '#fafbfc' }}>
            <div style={{ padding: '16px', borderBottom: '1px solid #dfe1e6' }}>
              <div style={{ fontWeight: '600', color: '#42526e', fontSize: '12px', textTransform: 'uppercase' }}>
                Assigned To ({assignedUsers.length})
              </div>
            </div>

            <div style={{ flex: 1, overflowY: 'auto', padding: '12px' }}>
              {assignedUsers.length > 0 ? (
                assignedUsers.map(user => (
                  <div
                    key={user._id}
                    onClick={() => handleToggleUser(user._id)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '12px',
                      padding: '8px 12px', borderRadius: '4px', cursor: 'pointer',
                      backgroundColor: 'white', border: '1px solid #dfe1e6',
                      marginBottom: '8px', boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = '#ffbdad';
                      e.currentTarget.style.backgroundColor = '#fffbfb';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = '#dfe1e6';
                      e.currentTarget.style.backgroundColor = 'white';
                    }}
                  >
                    {renderUserAvatar(user)}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: '14px', fontWeight: '500', color: '#172b4d' }}>
                        {user.name}
                      </div>
                      <div style={{ fontSize: '12px', color: '#5e6c84' }}>
                        {getUserSubtext(user)}
                      </div>
                    </div>
                    <div style={{ color: '#de350b', fontSize: '18px', fontWeight: 'bold' }}>×</div>
                  </div>
                ))
              ) : (
                <div style={{
                  textAlign: 'center', padding: '40px 20px', color: '#6b778c',
                  border: '2px dashed #dfe1e6', borderRadius: '8px', margin: '12px'
                }}>
                  <div style={{ fontSize: '24px', marginBottom: '8px' }}>👤</div>
                  <div>No assignees selected</div>
                  <div style={{ fontSize: '12px', marginTop: '4px' }}>Select users from the left to assign them</div>
                </div>
              )}
            </div>
          </div>

        </div>

        {/* Footer */}
        <div style={{
          padding: '16px 24px', borderTop: '1px solid #dfe1e6',
          display: 'flex', justifyContent: 'flex-end', gap: '12px',
          backgroundColor: '#fff'
        }}>
          <button
            onClick={onClose}
            disabled={isSaving}
            style={{
              padding: '8px 16px', backgroundColor: 'white', border: '1px solid #dfe1e6',
              borderRadius: '3px', fontSize: '14px', fontWeight: '500',
              cursor: isSaving ? 'not-allowed' : 'pointer', color: '#42526e'
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving}
            style={{
              padding: '8px 24px', backgroundColor: '#0052cc', border: 'none',
              borderRadius: '3px', fontSize: '14px', fontWeight: '500',
              cursor: isSaving ? 'not-allowed' : 'pointer', color: 'white',
              boxShadow: '0 1px 2px rgba(0,0,0,0.1)'
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
