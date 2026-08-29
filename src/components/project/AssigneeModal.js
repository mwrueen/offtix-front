import React, { useState, useEffect } from 'react';
import { taskAPI, getAssetUrl } from '../../services/api';
import { useToast } from '../../context/ToastContext';

const getUserId = (user) => {
  if (!user) return null;
  if (typeof user === 'string') return user;
  return (user._id || user.id || '').toString();
};

const getRoleId = (role) => {
  if (!role) return null;
  if (typeof role === 'string') return role;
  return (role._id || role.id || '').toString();
};

const AssigneeModal = ({ task, projectId, users = [], taskRoles = [], onClose, onUpdate }) => {
  const { showToast } = useToast();
  const [roleAssignments, setRoleAssignments] = useState([]); // Array of { roleId, userIds }
  const [searchQuery, setSearchQuery] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Initialize from task
  useEffect(() => {
    if (task) {
      const initialAssignments = (task.roleAssignments || []).map(ra => ({
        roleId: getRoleId(ra.role),
        userIds: (ra.assignees || []).map(a => getUserId(a)).filter(Boolean)
      })).filter(ra => ra.roleId);

      if (initialAssignments.length === 0 && (task.assignees || []).length > 0) {
        // Fallback: if task has direct assignees but no roleAssignments yet
        const defaultRoleId = getRoleId(taskRoles[0]) || 'general';
        const assigneeIds = (task.assignees || []).map(a => getUserId(a)).filter(Boolean);
        if (assigneeIds.length > 0) {
          initialAssignments.push({ roleId: defaultRoleId, userIds: assigneeIds });
        }
      }

      setRoleAssignments(initialAssignments);
    }
  }, [task, taskRoles]);

  const getUserInitials = (user) => {
    if (!user || !user.name) return '?';
    const names = user.name.split(' ');
    return names.length >= 2 ? (names[0][0] + names[names.length - 1][0]).toUpperCase() : user.name.substring(0, 2).toUpperCase();
  };

  const getUserColor = (userId) => {
    const uidStr = (userId || '').toString();
    const colors = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#06b6d4', '#ec4899'];
    return colors[uidStr ? uidStr.charCodeAt(uidStr.length - 1) % colors.length : 0];
  };

  const getUserAvatarUrl = (user) => {
    if (!user) return null;
    const pic = user.profilePicture || user.profile?.profilePicture || user.avatar;
    return pic ? getAssetUrl(pic) : null;
  };

  // Filter available users by search query
  const filteredUsers = users.filter(user => {
    return (user.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (user.email || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (user.projectRole || '').toLowerCase().includes(searchQuery.toLowerCase());
  });

  // Assign user to their matching project role or first available task role
  const handleAssignUser = (user, targetRoleId = null) => {
    const uid = getUserId(user);
    if (!uid) return;

    let roleIdToUse = targetRoleId ? getRoleId(targetRoleId) : null;

    if (!roleIdToUse) {
      // Auto-detect role matching user's projectRole
      const userRoles = (user.projectRole || '').split(',').map(r => r.trim().toLowerCase());
      const matchingRole = taskRoles.find(r => userRoles.includes((r.name || '').toLowerCase()));
      if (matchingRole) {
        roleIdToUse = getRoleId(matchingRole);
      } else {
        roleIdToUse = getRoleId(taskRoles[0]) || 'general';
      }
    }

    if (!roleIdToUse) return;

    setRoleAssignments(prev => {
      const existingIdx = prev.findIndex(ra => getRoleId(ra.roleId) === roleIdToUse);
      if (existingIdx > -1) {
        const newRA = [...prev];
        const userIds = [...(newRA[existingIdx].userIds || [])];
        if (!userIds.some(id => getUserId(id) === uid)) {
          userIds.push(uid);
        }
        newRA[existingIdx] = { ...newRA[existingIdx], userIds };
        return newRA;
      } else {
        return [...prev, { roleId: roleIdToUse, userIds: [uid] }];
      }
    });
  };

  // Add an additional role for a user
  const handleAddUserToRole = (targetRoleId, userId) => {
    const targetRid = getRoleId(targetRoleId);
    const targetUid = getUserId(userId);
    if (!targetRid || !targetUid) return;

    setRoleAssignments(prev => {
      const existingIdx = prev.findIndex(ra => getRoleId(ra.roleId) === targetRid);
      if (existingIdx > -1) {
        const newRA = [...prev];
        const userIds = [...(newRA[existingIdx].userIds || [])];
        if (!userIds.some(id => getUserId(id) === targetUid)) {
          userIds.push(targetUid);
        }
        newRA[existingIdx] = { ...newRA[existingIdx], userIds };
        return newRA;
      } else {
        return [...prev, { roleId: targetRid, userIds: [targetUid] }];
      }
    });
  };

  // Remove specific role assignment for a user
  const removeUserRole = (userId, roleId) => {
    const targetUid = getUserId(userId);
    const targetRid = getRoleId(roleId);

    setRoleAssignments(prev => prev.map(ra => {
      if (getRoleId(ra.roleId) === targetRid) {
        return { ...ra, userIds: (ra.userIds || []).filter(id => getUserId(id) !== targetUid) };
      }
      return ra;
    }).filter(ra => ra.userIds.length > 0));
  };

  // Remove user completely from all task roles
  const removeUserCompletely = (userId) => {
    const targetUid = getUserId(userId);

    setRoleAssignments(prev => prev.map(ra => ({
      ...ra,
      userIds: (ra.userIds || []).filter(id => getUserId(id) !== targetUid)
    })).filter(ra => ra.userIds.length > 0));
  };

  // Auto-assign all team members based on matching roles
  const handleAutoAssignAll = () => {
    const newAssignments = JSON.parse(JSON.stringify(roleAssignments));
    let addedCount = 0;

    users.forEach(user => {
      const uid = getUserId(user);
      if (!uid) return;
      const userRoles = (user.projectRole || '').split(',').map(r => r.trim().toLowerCase());

      taskRoles.forEach(tr => {
        const trId = getRoleId(tr);
        if (userRoles.includes((tr.name || '').toLowerCase())) {
          let ra = newAssignments.find(a => getRoleId(a.roleId) === trId);
          if (!ra) {
            ra = { roleId: trId, userIds: [] };
            newAssignments.push(ra);
          }
          if (!ra.userIds.some(id => getUserId(id) === uid)) {
            ra.userIds.push(uid);
            addedCount++;
          }
        }
      });
    });

    setRoleAssignments(newAssignments.filter(ra => ra.userIds.length > 0));
    showToast(`Auto-assigned ${addedCount} role membership(s) based on team project roles`, 'success');
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      const taskId = task._id || task.id;

      const isValidObjectId = (id) => typeof id === 'string' && /^[0-9a-fA-F]{24}$/.test(id);

      const flatAssignees = [...new Set(roleAssignments.flatMap(ra => (ra.userIds || []).map(id => getUserId(id))))].filter(Boolean);

      const formattedRA = roleAssignments
        .filter(ra => isValidObjectId(getRoleId(ra.roleId)))
        .map((ra, idx) => ({
          role: getRoleId(ra.roleId),
          assignees: (ra.userIds || []).map(id => getUserId(id)).filter(Boolean),
          order: idx + 1
        }));

      await taskAPI.update(projectId, taskId, {
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

  // Aggregate unique assigned users and their roles for clean single-card user rendering
  const assignedUserIds = [...new Set(roleAssignments.flatMap(ra => (ra.userIds || []).map(id => getUserId(id))))].filter(Boolean);

  const assignedUserList = assignedUserIds.map(uid => {
    const userObj = users.find(u => getUserId(u) === uid) || { _id: uid, name: 'Team Member', projectRole: 'Member' };
    const assignedRoles = roleAssignments
      .filter(ra => (ra.userIds || []).some(id => getUserId(id) === uid))
      .map(ra => taskRoles.find(tr => getRoleId(tr) === getRoleId(ra.roleId)))
      .filter(Boolean);

    return {
      user: userObj,
      userId: uid,
      roles: assignedRoles
    };
  });

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-[2000] p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl w-full max-w-[960px] h-[82vh] max-h-[720px] flex flex-col shadow-2xl overflow-hidden border border-slate-100" onClick={(e) => e.stopPropagation()}>

        {/* Header */}
        <div className="p-5 px-6 border-b border-slate-200/80 flex justify-between items-center bg-slate-50/50">
          <div>
            <h3 className="m-0 text-lg font-bold text-slate-800 tracking-tight">Manage Role Assignments</h3>
            <p className="mt-0.5 mb-0 text-xs text-slate-500">Assign team members to task roles for <strong className="text-slate-700">{task.title}</strong></p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleAutoAssignAll}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg text-xs font-semibold transition-all shadow-xs hover:shadow-md hover:from-blue-700 hover:to-indigo-700 cursor-pointer"
              title="Automatically match project team members to task roles"
            >
              <span>⚡</span> Auto-Assign Team
            </button>
            <button onClick={onClose} className="bg-transparent border-0 text-xl cursor-pointer text-slate-400 hover:text-slate-600 p-1.5 leading-none rounded-lg hover:bg-slate-100 transition-colors">
              ✕
            </button>
          </div>
        </div>

        {/* Two Column Layout */}
        <div className="flex-1 flex overflow-hidden">

          {/* Column 1: Team Members */}
          <div className="w-[360px] shrink-0 flex flex-col border-r border-slate-200/80 bg-slate-50/40">
            <div className="p-4 px-5 border-b border-slate-200/80 bg-white">
              <div className="mb-2.5 flex items-center justify-between">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Project Team</span>
                <span className="text-[11px] font-semibold text-slate-500 bg-slate-100 px-2.5 py-0.5 rounded-full">{users.length} Members</span>
              </div>
              <div className="relative">
                <svg className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  type="text" 
                  placeholder="Search members by name or role..." 
                  value={searchQuery} 
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full py-2 pl-9 pr-3 rounded-xl border border-slate-200 text-xs outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-100 transition-all placeholder:text-slate-400 bg-white"
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-2.5">
              {filteredUsers.length > 0 ? (
                filteredUsers.map(user => {
                  const uid = getUserId(user);
                  return (
                    <div key={uid} className="p-3 rounded-xl border border-slate-200/70 bg-white hover:border-indigo-300 hover:shadow-xs transition-all flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        {getUserAvatarUrl(user) ? (
                          <img src={getUserAvatarUrl(user)} alt="" className="w-9 h-9 rounded-full object-cover shrink-0 ring-1 ring-slate-200" />
                        ) : (
                          <div className="w-9 h-9 rounded-full text-white flex items-center justify-center text-xs font-bold shrink-0 shadow-2xs" style={{ backgroundColor: getUserColor(uid) }}>
                            {getUserInitials(user)}
                          </div>
                        )}
                        <div className="min-w-0 flex-1">
                          <div className="text-xs font-semibold text-slate-800 truncate" title={user.name}>{user.name}</div>
                          <span className="inline-block mt-0.5 px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 text-[10px] font-medium border border-slate-200/60">
                            {user.projectRole || 'Team Member'}
                          </span>
                        </div>
                      </div>

                      {/* Single clean + Add button */}
                      <button
                        onClick={() => handleAssignUser(user)}
                        className="px-3.5 py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-600 text-indigo-600 hover:text-white text-xs font-semibold transition-all border border-indigo-100/80 cursor-pointer shadow-2xs shrink-0"
                        title={`Assign as ${user.projectRole || 'default role'}`}
                      >
                        + Add
                      </button>
                    </div>
                  );
                })
              ) : (
                <div className="text-center py-12 text-slate-400 text-xs">
                  {searchQuery ? 'No matching team members found' : 'No team members available.'}
                </div>
              )}
            </div>
          </div>

          {/* Column 2: Assignees */}
          <div className="flex-1 bg-white flex flex-col min-w-0">
            <div className="p-4 px-5 border-b border-slate-200/80 flex justify-between items-center bg-white">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Assignees</span>
              <span className="text-[11px] font-semibold text-indigo-700 bg-indigo-50 border border-indigo-100 px-2.5 py-0.5 rounded-full">
                {assignedUserList.length} Total
              </span>
            </div>

            <div className="flex-1 overflow-y-auto p-5 space-y-3">
              {assignedUserList.length > 0 ? (
                assignedUserList.map(({ user, userId, roles }) => (
                  <div key={userId} className="p-3.5 bg-slate-50/60 rounded-xl border border-slate-200/80 shadow-2xs hover:border-slate-300 transition-all flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3 min-w-0 flex-1">
                      {getUserAvatarUrl(user) ? (
                        <img src={getUserAvatarUrl(user)} alt="" className="w-9 h-9 rounded-full object-cover shrink-0 ring-1 ring-slate-200 mt-0.5" />
                      ) : (
                        <div className="w-9 h-9 rounded-full text-white flex items-center justify-center text-xs font-bold shrink-0 shadow-2xs mt-0.5" style={{ backgroundColor: getUserColor(userId) }}>
                          {getUserInitials(user)}
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <div className="text-xs font-bold text-slate-800 truncate" title={user.name}>{user.name}</div>
                        
                        {/* Assigned Roles List under Name */}
                        <div className="flex flex-wrap items-center gap-1.5 mt-2">
                          {roles.map(role => {
                            const rId = getRoleId(role);
                            return (
                              <span key={rId} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white text-slate-700 text-[11px] font-medium border border-slate-200/90 shadow-2xs">
                                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: role.color || '#3b82f6' }}></span>
                                <span>{role.name}</span>
                                <button
                                  onClick={() => removeUserRole(userId, rId)}
                                  className="hover:text-rose-600 text-slate-400 p-0.5 text-xs border-0 bg-transparent cursor-pointer font-bold leading-none ml-0.5"
                                  title={`Remove ${role.name} role`}
                                >
                                  ×
                                </button>
                              </span>
                            );
                          })}

                          {/* Add Another Role Selector Dropdown */}
                          {taskRoles.filter(tr => !roles.some(r => getRoleId(r) === getRoleId(tr))).length > 0 && (
                            <select
                              value=""
                              onChange={(e) => {
                                if (e.target.value) handleAddUserToRole(e.target.value, userId);
                              }}
                              className="text-[11px] font-medium bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200/80 rounded-lg px-2.5 py-1 outline-none cursor-pointer transition-colors"
                              title="Add another task role"
                            >
                              <option value="" disabled>+ Role</option>
                              {taskRoles
                                .filter(tr => !roles.some(r => getRoleId(r) === getRoleId(tr)))
                                .map(tr => (
                                  <option key={getRoleId(tr)} value={getRoleId(tr)}>+ {tr.name}</option>
                                ))}
                            </select>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Remove user completely from all task roles */}
                    <button
                      onClick={() => removeUserCompletely(userId)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer border-0 bg-transparent shrink-0"
                      title="Remove all assignments for this user"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                ))
              ) : (
                <div className="text-center py-16 px-4 text-slate-400">
                  <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3 text-xl">
                    👤
                  </div>
                  <div className="text-xs font-semibold text-slate-600">No assignees added yet.</div>
                  <div className="text-[11px] text-slate-400 mt-1">Click + Add on team members to assign them.</div>
                </div>
              )}
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="p-4 px-6 border-t border-slate-200/80 flex justify-end gap-3 bg-slate-50/50">
          <button onClick={onClose} disabled={isSaving} className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer">
            Cancel
          </button>
          <button onClick={handleSave} disabled={isSaving} className="px-6 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 border-0 rounded-xl text-xs font-semibold text-white shadow-sm hover:shadow-md transition-all cursor-pointer">
            {isSaving ? 'Updating...' : 'Save Assignments'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AssigneeModal;
