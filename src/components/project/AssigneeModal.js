import React, { useState, useEffect } from 'react';
import { taskAPI } from '../../services/api';
import { useToast } from '../../context/ToastContext';

const AssigneeModal = ({ task, projectId, users = [], taskRoles = [], onClose, onUpdate }) => {
  const { showToast } = useToast();
  const [roleAssignments, setRoleAssignments] = useState([]); // Array of { roleId, userIds }
  const [selectedRoleId, setSelectedRoleId] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Initialize from task
  useEffect(() => {
    if (task) {
      const initialAssignments = task.roleAssignments?.map(ra => ({
        roleId: ra.role?._id || ra.role,
        userIds: ra.assignees?.map(a => a._id || a) || []
      })) || [];
      setRoleAssignments(initialAssignments);

      if (taskRoles.length > 0 && !selectedRoleId) {
        setSelectedRoleId(taskRoles[0]._id);
      }
    }
  }, [task, taskRoles]);

  const getUserInitials = (user) => {
    if (!user || !user.name) return '?';
    const names = user.name.split(' ');
    return names.length >= 2 ? (names[0][0] + names[names.length - 1][0]).toUpperCase() : user.name.substring(0, 2).toUpperCase();
  };

  const getUserColor = (userId) => {
    const colors = ['#0052cc', '#00875a', '#ff8b00', '#6554c0', '#00b8d9', '#ff5630'];
    return colors[userId ? userId.charCodeAt(userId.length - 1) % colors.length : 0];
  };

  const currentRole = taskRoles.find(r => r._id === selectedRoleId);

  // Get all available users who aren't assigned to THIS role yet
  const availableUsers = users.filter(user => {
    const matchesSearch = (user.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (user.email || '').toLowerCase().includes(searchQuery.toLowerCase());

    if (!selectedRoleId) return matchesSearch;

    // Check if already assigned to THIS role
    const currentRA = roleAssignments.find(ra => ra.roleId === selectedRoleId);
    const isAlreadyAssignedToThisRole = currentRA?.userIds.includes(user._id);

    return matchesSearch && !isAlreadyAssignedToThisRole;
  });

  // Split into recommended (have the role name in projectRole) and others
  const recommendedUsers = availableUsers.filter(user => {
    if (!currentRole) return false;
    const userRoles = (user.projectRole || '').split(',').map(r => r.trim());
    return userRoles.includes(currentRole.name);
  });

  const otherUsers = availableUsers.filter(user => {
    if (!currentRole) return true;
    const userRoles = (user.projectRole || '').split(',').map(r => r.trim());
    return !userRoles.includes(currentRole.name);
  });

  const handleToggleUser = (userId) => {
    if (!selectedRoleId) return;

    setRoleAssignments(prev => {
      const existingIdx = prev.findIndex(ra => ra.roleId === selectedRoleId);
      if (existingIdx > -1) {
        const newRA = [...prev];
        const userIds = [...newRA[existingIdx].userIds];
        if (userIds.includes(userId)) {
          newRA[existingIdx].userIds = userIds.filter(id => id !== userId);
        } else {
          newRA[existingIdx].userIds.push(userId);
        }
        return newRA.filter(ra => ra.userIds.length > 0);
      } else {
        return [...prev, { roleId: selectedRoleId, userIds: [userId] }];
      }
    });
  };

  const removeAssignment = (roleId, userId) => {
    setRoleAssignments(prev => prev.map(ra => {
      if (ra.roleId === roleId) {
        return { ...ra, userIds: ra.userIds.filter(id => id !== userId) };
      }
      return ra;
    }).filter(ra => ra.userIds.length > 0));
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);

      // Calculate flat assignees list (unique user IDs)
      const flatAssignees = [...new Set(roleAssignments.flatMap(ra => ra.userIds))];

      // Format roleAssignments for backend
      const formattedRA = roleAssignments.map((ra, idx) => ({
        role: ra.roleId,
        assignees: ra.userIds,
        order: idx + 1
      }));

      await taskAPI.update(projectId, task._id, {
        assignees: flatAssignees,
        roleAssignments: formattedRA,
        useRoleWorkflow: formattedRA.length > 0
      });

      showToast('Assignments updated successfully', 'success');
      if (onUpdate) onUpdate();
      onClose();
    } catch (error) {
      console.error('Error updating assignments:', error);
      showToast(error.response?.data?.error || 'Failed to update assignments', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  if (!task) return null;

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(9, 30, 66, 0.54)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000 }} onClick={onClose}>
      <div style={{ backgroundColor: 'white', borderRadius: '12px', width: '95%', maxWidth: '900px', height: '85vh', maxHeight: '750px', display: 'flex', flexDirection: 'column', boxShadow: '0 20px 40px rgba(0,0,0,0.2)', overflow: 'hidden' }} onClick={(e) => e.stopPropagation()}>

        {/* Header */}
        <div style={{ padding: '24px', borderBottom: '1px solid #dfe1e6', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'linear-gradient(to right, #f4f5f7, #ffffff)' }}>
          <div>
            <h3 style={{ margin: 0, fontSize: '22px', fontWeight: '700', color: '#172b4d', letterSpacing: '-0.02em' }}>Manage Role Assignments</h3>
            <p style={{ margin: '6px 0 0 0', fontSize: '14px', color: '#5e6c84' }}>Assign specific team members to task roles for <strong>{task.title}</strong></p>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: '28px', cursor: 'pointer', color: '#5e6c84', padding: '8px', lineHeight: 1, borderRadius: '50%', transition: 'background-color 0.2s' }}>×</button>
        </div>

        {/* Triple Column Layout */}
        <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>

          {/* Column 1: Roles Sidebar */}
          <div style={{ width: '220px', borderRight: '1px solid #dfe1e6', backgroundColor: '#f9fafb', display: 'flex', flexDirection: 'column' }}>
            <div style={{ padding: '16px 20px', fontSize: '12px', fontWeight: '700', color: '#5e6c84', textTransform: 'uppercase' }}>Select Role</div>
            <div style={{ flex: 1, overflowY: 'auto' }}>
              {taskRoles.map(role => (
                <div
                  key={role._id}
                  onClick={() => setSelectedRoleId(role._id)}
                  style={{
                    padding: '12px 20px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px',
                    backgroundColor: selectedRoleId === role._id ? '#e6effc' : 'transparent',
                    borderLeft: `4px solid ${selectedRoleId === role._id ? '#0052cc' : 'transparent'}`,
                    transition: 'all 0.2s'
                  }}
                >
                  <span style={{ fontSize: '14px', fontWeight: selectedRoleId === role._id ? '600' : '400', color: selectedRoleId === role._id ? '#0052cc' : '#42526e' }}>{role.name}</span>
                  {roleAssignments.find(ra => ra.roleId === role._id)?.userIds.length > 0 && (
                    <span style={{ backgroundColor: '#0052cc', color: 'white', borderRadius: '10px', padding: '1px 6px', fontSize: '10px' }}>
                      {roleAssignments.find(ra => ra.roleId === role._id).userIds.length}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Column 2: Available Members */}
          <div style={{ flex: 1.2, display: 'flex', flexDirection: 'column', borderRight: '1px solid #dfe1e6' }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid #dfe1e6' }}>
              <div style={{ marginBottom: '12px', fontSize: '15px', fontWeight: '600', color: '#172b4d' }}>Users with "{currentRole?.name}" Role</div>
              <input
                type="text" placeholder="Filter team members..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                style={{ width: '100%', padding: '10px 14px', borderRadius: '6px', border: '2px solid #dfe1e6', fontSize: '14px', outline: 'none', transition: 'border-color 0.2s' }}
                onFocus={(e) => e.target.style.borderColor = '#0052cc'}
                onBlur={(e) => e.target.style.borderColor = '#dfe1e6'}
              />
            </div>
            <div style={{ flex: 1, overflowY: 'auto', padding: '16px' }}>
              {recommendedUsers.length > 0 && (
                <>
                  <div style={{ fontSize: '11px', fontWeight: '700', color: '#0052cc', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Recommended Members</div>
                  {recommendedUsers.map(user => (
                    <div key={user._id} onClick={() => handleToggleUser(user._id)} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px', borderRadius: '8px', cursor: 'pointer', transition: 'background-color 0.2s', marginBottom: '4px', border: '1px solid transparent' }} onMouseEnter={e => e.currentTarget.style.backgroundColor = '#f4f5f7'} onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}>
                      {user.profile?.profilePicture ? (
                        <img src={user.profile.profilePicture} alt="" style={{ width: '36px', height: '36px', borderRadius: '50%', objectFit: 'cover' }} />
                      ) : (
                        <div style={{ width: '36px', height: '36px', borderRadius: '50%', backgroundColor: getUserColor(user._id), color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', fontWeight: '600' }}>{getUserInitials(user)}</div>
                      )}
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: '14px', fontWeight: '600', color: '#172b4d' }}>{user.name}</div>
                        <div style={{ fontSize: '11px', color: '#5e6c84' }}>{user.projectRole || 'Team Member'}</div>
                      </div>
                      <div style={{ color: '#0052cc', fontWeight: 'bold', fontSize: '18px' }}>+</div>
                    </div>
                  ))}
                  <div style={{ height: '16px' }} />
                </>
              )}

              {otherUsers.length > 0 && (
                <>
                  <div style={{ fontSize: '11px', fontWeight: '700', color: '#5e6c84', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{recommendedUsers.length > 0 ? 'Other Team Members' : 'Available Members'}</div>
                  {otherUsers.map(user => (
                    <div key={user._id} onClick={() => handleToggleUser(user._id)} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px', borderRadius: '8px', cursor: 'pointer', transition: 'background-color 0.2s', marginBottom: '4px' }} onMouseEnter={e => e.currentTarget.style.backgroundColor = '#f4f5f7'} onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}>
                      {user.profile?.profilePicture ? (
                        <img src={user.profile.profilePicture} alt="" style={{ width: '36px', height: '36px', borderRadius: '50%', objectFit: 'cover' }} />
                      ) : (
                        <div style={{ width: '36px', height: '36px', borderRadius: '50%', backgroundColor: getUserColor(user._id), color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', fontWeight: '600' }}>{getUserInitials(user)}</div>
                      )}
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: '14px', fontWeight: '600', color: '#172b4d' }}>{user.name}</div>
                        <div style={{ fontSize: '11px', color: '#5e6c84' }}>{user.projectRole || 'Team Member'}</div>
                      </div>
                      <div style={{ color: '#0052cc', fontWeight: 'bold', fontSize: '18px' }}>+</div>
                    </div>
                  ))}
                </>
              )}

              {availableUsers.length === 0 && (
                <div style={{ textAlign: 'center', padding: '40px 20px', color: '#6b778c', fontSize: '14px' }}>
                  {searchQuery ? 'No matching users found' : 'All members have been assigned to this role.'}
                </div>
              )}
            </div>
          </div>

          {/* Column 3: Current Assignments */}
          <div style={{ flex: 1, backgroundColor: '#f4f5f7', display: 'flex', flexDirection: 'column' }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid #dfe1e6', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '12px', fontWeight: '700', color: '#5e6c84', textTransform: 'uppercase' }}>All Assignments</span>
              <span style={{ fontSize: '11px', color: '#5e6c84', backgroundColor: 'white', padding: '2px 8px', borderRadius: '10px', border: '1px solid #dfe1e6' }}>
                {roleAssignments.reduce((acc, curr) => acc + curr.userIds.length, 0)} Total
              </span>
            </div>
            <div style={{ flex: 1, overflowY: 'auto', padding: '16px' }}>
              {roleAssignments.length > 0 ? (
                roleAssignments.map(ra => {
                  const roleObj = taskRoles.find(r => r._id === ra.roleId);
                  return (
                    <div key={ra.roleId} style={{ marginBottom: '20px' }}>
                      <div style={{ fontSize: '11px', fontWeight: '700', color: '#5e6c84', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: roleObj?.color || '#0052cc' }}></span>
                        {roleObj?.name}
                      </div>
                      {ra.userIds.map(uid => {
                        const userObj = users.find(u => u._id === uid);
                        const profilePicture = userObj?.profile?.profilePicture;
                        return (
                          <div key={uid} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 12px', backgroundColor: 'white', borderRadius: '6px', border: '1px solid #dfe1e6', marginBottom: '6px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                            {profilePicture ? (
                              <img src={profilePicture} alt="" style={{ width: '24px', height: '24px', borderRadius: '50%', objectFit: 'cover' }} />
                            ) : (
                              <div style={{ width: '24px', height: '24px', borderRadius: '50%', backgroundColor: getUserColor(uid), color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', fontWeight: '600' }}>{getUserInitials(userObj)}</div>
                            )}
                            <span style={{ fontSize: '13px', flex: 1, fontWeight: '500', color: '#172b4d' }}>{userObj?.name}</span>
                            <button onClick={() => removeAssignment(ra.roleId, uid)} style={{ background: 'none', border: 'none', color: '#de350b', cursor: 'pointer', fontSize: '16px', fontWeight: 'bold', padding: '4px' }}>×</button>
                          </div>
                        );
                      })}
                    </div>
                  );
                })
              ) : (
                <div style={{ textAlign: 'center', padding: '60px 20px', color: '#6b778c' }}>
                  <div style={{ fontSize: '32px', marginBottom: '12px' }}>�</div>
                  <div style={{ fontSize: '14px' }}>No members assigned yet.</div>
                  <div style={{ fontSize: '12px', marginTop: '4px' }}>Pick a role and add members from the lists.</div>
                </div>
              )}
            </div>
          </div>

        </div>

        {/* Footer */}
        <div style={{ padding: '20px 24px', borderTop: '1px solid #dfe1e6', display: 'flex', justifyContent: 'flex-end', gap: '12px', backgroundColor: 'white' }}>
          <button onClick={onClose} disabled={isSaving} style={{ padding: '10px 20px', backgroundColor: 'white', border: '1px solid #dfe1e6', borderRadius: '6px', fontSize: '14px', fontWeight: '600', cursor: 'pointer', color: '#42526e' }}>Cancel</button>
          <button onClick={handleSave} disabled={isSaving} style={{ padding: '10px 30px', backgroundColor: '#0052cc', border: 'none', borderRadius: '6px', fontSize: '14px', fontWeight: '600', cursor: 'pointer', color: 'white', boxShadow: '0 4px 6px rgba(0, 82, 204, 0.2)' }}>
            {isSaving ? 'Updating...' : 'Save Assignments'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AssigneeModal;
