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
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
    <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center z-[2000]" onClick={onClose}>
      <div className="bg-white rounded-xl w-[95%] max-w-[900px] h-[85vh] max-h-[750px] flex flex-col shadow-2xl overflow-hidden" onClick={(e) => e.stopPropagation()}>

        {/* Header */}
        <div className="p-6 border-b border-gray-200 flex justify-between items-center bg-gradient-to-r from-gray-50 to-white">
          <div>
            <h3 className="m-0 text-xl font-bold text-gray-800 tracking-tight">Manage Role Assignments</h3>
            <p className="mt-1.5 mb-0 text-sm text-gray-600">Assign specific team members to task roles for <strong>{task.title}</strong></p>
          </div>
          <button onClick={onClose} className="bg-transparent border-0 text-3xl cursor-pointer text-gray-500 p-2 leading-none rounded-full hover:bg-gray-100 transition-colors">×</button>
        </div>

        {/* Triple Column Layout */}
        <div className="flex-1 flex overflow-hidden">

          {/* Column 1: Roles Sidebar */}
          <div className="w-[220px] border-r border-gray-200 bg-gray-50 flex flex-col">
            <div className="px-5 py-4 text-xs font-bold text-gray-500 uppercase">Select Role</div>
            <div className="flex-1 overflow-y-auto">
              {taskRoles.map(role => (
                <div
                  key={role._id}
                  onClick={() => setSelectedRoleId(role._id)}
                  className={`p-3 px-5 cursor-pointer flex items-center gap-2.5 transition-all duration-200 ${
                    selectedRoleId === role._id 
                      ? 'bg-blue-50 border-l-4 border-l-blue-600' 
                      : 'bg-transparent border-l-4 border-l-transparent hover:bg-gray-50'
                  }`}
                >
                  <span className={`text-sm ${
                    selectedRoleId === role._id 
                      ? 'font-semibold text-blue-600' 
                      : 'font-normal text-gray-700'
                  }`}>{role.name}</span>
                  {roleAssignments.find(ra => ra.roleId === role._id)?.userIds.length > 0 && (
                    <span className="bg-blue-600 text-white rounded-full px-1.5 py-0.5 text-xs">
                      {roleAssignments.find(ra => ra.roleId === role._id).userIds.length}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Column 2: Available Members */}
          <div className="flex-[1.2] flex flex-col border-r border-gray-200">
            <div className="px-5 py-4 border-b border-gray-200">
              <div className="mb-3 text-base font-semibold text-gray-800">Users with "{currentRole?.name}" Role</div>
              <input
                type="text" 
                placeholder="Filter team members..." 
                value={searchQuery} 
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full py-2.5 px-3.5 rounded-md border-2 border-gray-200 text-sm outline-none transition-colors focus:border-blue-600"
              />
            </div>
            <div className="flex-1 overflow-y-auto p-4">
              {recommendedUsers.length > 0 && (
                <>
                  <div className="text-xs font-bold text-blue-600 mb-2 uppercase tracking-wider">Recommended Members</div>
                  {recommendedUsers.map(user => (
                    <div key={user._id} onClick={() => handleToggleUser(user._id)} className="flex items-center gap-3 p-2.5 rounded-lg cursor-pointer transition-colors mb-1 border border-transparent hover:bg-gray-50">
                      {user.profile?.profilePicture ? (
                        <img src={user.profile.profilePicture} alt="" className="w-9 h-9 rounded-full object-cover" />
                      ) : (
                        <div className="w-9 h-9 rounded-full text-white flex items-center justify-center text-sm font-semibold" style={{ backgroundColor: getUserColor(user._id) }}>{getUserInitials(user)}</div>
                      )}
                      <div className="flex-1">
                        <div className="text-sm font-semibold text-gray-800">{user.name}</div>
                        <div className="text-xs text-gray-500">{user.projectRole || 'Team Member'}</div>
                      </div>
                      <div className="text-blue-600 font-bold text-lg">+</div>
                    </div>
                  ))}
                  <div className="h-4" />
                </>
              )}

              {otherUsers.length > 0 && (
                <>
                  <div className="text-xs font-bold text-gray-500 mb-2 uppercase tracking-wider">{recommendedUsers.length > 0 ? 'Other Team Members' : 'Available Members'}</div>
                  {otherUsers.map(user => (
                    <div key={user._id} onClick={() => handleToggleUser(user._id)} className="flex items-center gap-3 p-2.5 rounded-lg cursor-pointer transition-colors mb-1 hover:bg-gray-50">
                      {user.profile?.profilePicture ? (
                        <img src={user.profile.profilePicture} alt="" className="w-9 h-9 rounded-full object-cover" />
                      ) : (
                        <div className="w-9 h-9 rounded-full text-white flex items-center justify-center text-sm font-semibold" style={{ backgroundColor: getUserColor(user._id) }}>{getUserInitials(user)}</div>
                      )}
                      <div className="flex-1">
                        <div className="text-sm font-semibold text-gray-800">{user.name}</div>
                        <div className="text-xs text-gray-500">{user.projectRole || 'Team Member'}</div>
                      </div>
                      <div className="text-blue-600 font-bold text-lg">+</div>
                    </div>
                  ))}
                </>
              )}

              {availableUsers.length === 0 && (
                <div className="text-center py-10 px-5 text-gray-500 text-sm">
                  {searchQuery ? 'No matching users found' : 'All members have been assigned to this role.'}
                </div>
              )}
            </div>
          </div>

          {/* Column 3: Current Assignments */}
          <div className="flex-1 bg-gray-50 flex flex-col">
            <div className="px-5 py-4 border-b border-gray-200 flex justify-between items-center">
              <span className="text-xs font-bold text-gray-500 uppercase">All Assignments</span>
              <span className="text-xs text-gray-600 bg-white py-0.5 px-2 rounded-full border border-gray-200">
                {roleAssignments.reduce((acc, curr) => acc + curr.userIds.length, 0)} Total
              </span>
            </div>
            <div className="flex-1 overflow-y-auto p-4">
              {roleAssignments.length > 0 ? (
                roleAssignments.map(ra => {
                  const roleObj = taskRoles.find(r => r._id === ra.roleId);
                  return (
                    <div key={ra.roleId} className="mb-5">
                      <div className="text-xs font-bold text-gray-500 mb-2 flex items-center gap-1.5 uppercase tracking-wider">
                        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: roleObj?.color || '#0052cc' }}></span>
                        {roleObj?.name}
                      </div>
                      {ra.userIds.map(uid => {
                        const userObj = users.find(u => u._id === uid);
                        const profilePicture = userObj?.profile?.profilePicture;
                        return (
                          <div key={uid} className="flex items-center gap-2.5 p-2 px-3 bg-white rounded-md border border-gray-200 mb-1.5 shadow-sm">
                            {profilePicture ? (
                              <img src={profilePicture} alt="" className="w-6 h-6 rounded-full object-cover" />
                            ) : (
                              <div className="w-6 h-6 rounded-full text-white flex items-center justify-center text-xs font-semibold" style={{ backgroundColor: getUserColor(uid) }}>{getUserInitials(userObj)}</div>
                            )}
                            <span className="text-sm flex-1 font-medium text-gray-800">{userObj?.name}</span>
                            <button onClick={() => removeAssignment(ra.roleId, uid)} className="bg-transparent border-0 text-red-600 cursor-pointer text-base font-bold p-1 hover:bg-red-50 rounded">×</button>
                          </div>
                        );
                      })}
                    </div>
                  );
                })
              ) : (
                <div className="text-center py-15 px-5 text-gray-500">
                  <div className="text-[32px] mb-3">�</div>
                  <div className="text-sm">No members assigned yet.</div>
                  <div className="text-xs mt-1">Pick a role and add members from the lists.</div>
                </div>
              )}
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="px-6 py-5 border-t border-gray-200 flex justify-end gap-3 bg-white">
          <button onClick={onClose} disabled={isSaving} className="py-2.5 px-5 bg-white border border-gray-200 rounded-md text-sm font-semibold cursor-pointer text-gray-600 hover:bg-gray-50">Cancel</button>
          <button onClick={handleSave} disabled={isSaving} className="py-2.5 px-7 bg-blue-600 border-0 rounded-md text-sm font-semibold cursor-pointer text-white shadow-lg hover:bg-blue-700">
            {isSaving ? 'Updating...' : 'Save Assignments'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AssigneeModal;
