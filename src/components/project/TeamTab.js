import React, { useState, useEffect, useMemo } from 'react';
import Select from 'react-select';
import { projectAPI, companyAPI, taskRoleAPI } from '../../services/api';
import DeleteConfirmModal from '../common/DeleteConfirmModal';
import { usePermissions, PERMISSIONS } from '../../context/PermissionsContext';
import { useToast } from '../../context/ToastContext';

const TeamTab = ({ projectId, project, users, isProjectOwner, isProjectManager, onRefresh }) => {
  const { hasPermission } = usePermissions();
  const toast = useToast();
  const [showAddMember, setShowAddMember] = useState(false);
  const [showAddRole, setShowAddRole] = useState(false);
  const [selectedUserOption, setSelectedUserOption] = useState(null);
  const [selectedRoleOptions, setSelectedRoleOptions] = useState([]);
  const [newRole, setNewRole] = useState({ name: '', description: '', color: '#6366f1' });
  const [memberToRemove, setMemberToRemove] = useState(null);
  const [roleToRemove, setRoleToRemove] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [companyRoles, setCompanyRoles] = useState([]);
  const [projectRoles, setProjectRoles] = useState([]);

  // Permission logic
  const canAddMembers = isProjectOwner || isProjectManager || hasPermission(PERMISSIONS.ASSIGN_EMPLOYEE_TO_PROJECT);
  const canRemoveMembers = isProjectOwner || isProjectManager || hasPermission(PERMISSIONS.REMOVE_EMPLOYEE_FROM_PROJECT);
  const canManageRoles = isProjectOwner || isProjectManager;

  // Clear error after some time
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  // Fetch roles
  useEffect(() => {
    fetchRoles();
  }, [projectId, project]);

  const fetchRoles = async () => {
    try {
      const projectRolesRes = await taskRoleAPI.getAll(projectId);
      setProjectRoles(projectRolesRes.data || []);

      if (project?.company) {
        const companyId = typeof project.company === 'object' ? project.company._id : project.company;
        const response = await companyAPI.getById(companyId);

        if (response.data?.designations) {
          const roles = response.data.designations
            .sort((a, b) => a.level - b.level)
            .map(d => d.name);
          setCompanyRoles(roles);
        }
      }
    } catch (error) {
      console.error('Error fetching roles:', error);
    }
  };

  // Combine company and project roles for selection options
  const roleOptions = useMemo(() => {
    const projectSpecific = projectRoles.map(r => ({ value: r.name, label: r.name }));
    const standard = [
      { value: 'Project Manager', label: 'Project Manager' },
      ...companyRoles.map(r => ({ value: r, label: r }))
    ];

    return [
      { label: 'Project Specific Roles', options: projectSpecific },
      { label: 'Standard Roles', options: standard }
    ];
  }, [projectRoles, companyRoles]);

  // Get available users options for react-select
  const userOptions = useMemo(() => {
    if (!users) return [];

    const available = users.filter(user => {
      const isAlreadyMember = project.members?.some(member =>
        (member.user?._id === user._id) || (member._id === user._id) || (member === user._id)
      );
      const isOwner = project.owner?._id === user._id || project.owner === user._id;
      return !isAlreadyMember && !isOwner;
    });

    return available.map(u => ({
      value: u._id,
      label: `${u.name} (${u.email})`,
      user: u
    }));
  }, [users, project.members, project.owner]);

  const handleCreateRole = async () => {
    if (!newRole.name.trim()) return;
    setLoading(true);
    setError(null);
    try {
      await taskRoleAPI.create(projectId, {
        name: newRole.name.trim(),
        description: newRole.description.trim(),
        color: newRole.color,
        order: projectRoles.length + 1
      });
      setNewRole({ name: '', description: '', color: '#6366f1' });
      setShowAddRole(false);
      toast.success('Role created successfully');
      await fetchRoles();
    } catch (error) {
      const msg = error.response?.data?.message || 'Failed to create role';
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteRole = async () => {
    if (!roleToRemove) return;
    setLoading(true);
    try {
      await taskRoleAPI.delete(projectId, roleToRemove._id);
      setRoleToRemove(null);
      toast.success('Role deleted');
      await fetchRoles();
    } catch (error) {
      toast.error('Failed to delete role');
    } finally {
      setLoading(false);
    }
  };

  const handleAddMember = async () => {
    if (!selectedUserOption || selectedRoleOptions.length === 0) return;
    setLoading(true);
    setError(null);
    try {
      const combinedRoles = selectedRoleOptions.map(opt => opt.value).join(', ');
      await projectAPI.addTeamMember(projectId, selectedUserOption.value, combinedRoles);

      setSelectedUserOption(null);
      setSelectedRoleOptions([]);
      setShowAddMember(false);
      toast.success('Member added successfully');
      await onRefresh();
    } catch (error) {
      const msg = error.response?.data?.message || 'Failed to add member';
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveMember = async () => {
    if (!memberToRemove) return;
    setLoading(true);
    try {
      const memberUserId = memberToRemove.user?._id || memberToRemove._id || memberToRemove.user;
      await projectAPI.removeTeamMember(projectId, memberUserId);
      setMemberToRemove(null);
      toast.success('Member removed');
      await onRefresh();
    } catch (error) {
      toast.error('Failed to remove member');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateMemberRoles = async (member, newRoles) => {
    setLoading(true);
    try {
      const userId = member.user?._id || member._id || member.user;
      await projectAPI.addTeamMember(projectId, userId, newRoles);
      toast.success('Member roles updated');
      await onRefresh();
    } catch (error) {
      toast.error('Failed to update member roles');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveSpecificRole = (member, roleToRemove) => {
    const currentRoles = member.role?.split(',').map(r => r.trim()) || [];
    const updatedRoles = currentRoles.filter(r => r !== roleToRemove).join(', ');

    if (updatedRoles === '') {
      toast.error('At least one role is required. Remove the member instead.');
      return;
    }

    handleUpdateMemberRoles(member, updatedRoles);
  };

  const handleAddSpecificRole = (member, roleToAdd) => {
    const currentRoles = member.role?.split(',').map(r => r.trim()) || [];
    if (currentRoles.includes(roleToAdd)) {
      toast.error('Role already assigned');
      return;
    }
    const updatedRoles = [...currentRoles, roleToAdd].join(', ');
    handleUpdateMemberRoles(member, updatedRoles);
  };

  const renderAvatar = (user, size, bgColor) => {
    const u = user?.user || user;
    if (u?.profile?.profilePicture) {
      return (
        <img
          src={u.profile.profilePicture}
          alt={u.name}
          style={{ width: size, height: size, borderRadius: '50%', objectFit: 'cover' }}
        />
      );
    }
    return (
      <div style={{
        width: size, height: size, borderRadius: '50%', backgroundColor: bgColor,
        display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white',
        fontSize: size * 0.4, fontWeight: '600'
      }}>
        {u?.name?.charAt(0).toUpperCase() || '?'}
      </div>
    );
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      {/* SECTION: PROJECT ROLES */}
      <section>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div>
            <h2 style={{ fontSize: '20px', fontWeight: '600', color: '#172b4d' }}>Project Roles</h2>
            <p style={{ color: '#5e6c84', fontSize: '14px' }}>Define specific roles for this project</p>
          </div>
          {canManageRoles && (
            <button
              onClick={() => setShowAddRole(true)}
              style={{ padding: '8px 16px', backgroundColor: '#ebecf0', borderRadius: '3px', border: 'none', cursor: 'pointer', fontWeight: '500' }}
            >
              + Create Role
            </button>
          )}
        </div>

        {showAddRole && (
          <div style={{ backgroundColor: '#f4f5f7', padding: '20px', borderRadius: '3px', border: '1px solid #dfe1e6', marginBottom: '16px' }}>
            <h3 style={{ fontSize: '14px', fontWeight: '700', marginBottom: '12px' }}>New Project Role</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr 100px', gap: '12px', marginBottom: '16px' }}>
              <input
                placeholder="Role Name"
                value={newRole.name}
                onChange={e => setNewRole({ ...newRole, name: e.target.value })}
                style={{ padding: '8px', borderRadius: '3px', border: '1px solid #ddd' }}
              />
              <input
                placeholder="Description"
                value={newRole.description}
                onChange={e => setNewRole({ ...newRole, description: e.target.value })}
                style={{ padding: '8px', borderRadius: '3px', border: '1px solid #ddd' }}
              />
              <input
                type="color"
                value={newRole.color}
                onChange={e => setNewRole({ ...newRole, color: e.target.value })}
                style={{ height: '35px', padding: '0', border: 'none', cursor: 'pointer' }}
              />
            </div>
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center', justifyContent: 'flex-end' }}>
              {error && <span style={{ color: '#ff5630', fontSize: '13px' }}>{error}</span>}
              <button onClick={() => setShowAddRole(false)} style={{ border: 'none', background: 'none', cursor: 'pointer' }}>Cancel</button>
              <button
                onClick={handleCreateRole}
                disabled={!newRole.name || loading}
                style={{ backgroundColor: '#0052cc', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '3px', cursor: 'pointer' }}
              >
                {loading ? 'Creating...' : 'Create'}
              </button>
            </div>
          </div>
        )}

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
          {projectRoles.map(role => (
            <div key={role._id} style={{
              padding: '12px 16px', backgroundColor: 'white', borderRadius: '8px',
              border: `1px solid ${role.color}40`, borderLeft: `4px solid ${role.color}`,
              width: '240px', position: 'relative', boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
            }}>
              <div style={{ fontWeight: '700', fontSize: '14px' }}>{role.name}</div>
              <div style={{ fontSize: '12px', color: '#5e6c84' }}>{role.description}</div>
              {canManageRoles && (
                <button onClick={() => setRoleToRemove(role)} style={{ position: 'absolute', top: '8px', right: '8px', border: 'none', background: 'none', color: '#ff5630', cursor: 'pointer' }}>×</button>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* SECTION: TEAM MEMBERS */}
      <section>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <div>
            <h2 style={{ fontSize: '20px', fontWeight: '600', color: '#172b4d' }}>Team Members</h2>
            <p style={{ color: '#5e6c84', fontSize: '14px' }}>Manage project access</p>
          </div>
          {canAddMembers && (
            <button
              onClick={() => setShowAddMember(true)}
              style={{ padding: '8px 16px', backgroundColor: '#0052cc', color: 'white', border: 'none', borderRadius: '3px', cursor: 'pointer', fontWeight: '500' }}
            >
              Add Member
            </button>
          )}
        </div>

        {showAddMember && (
          <div style={{ backgroundColor: '#f4f5f7', padding: '24px', borderRadius: '3px', marginBottom: '24px', border: '1px solid #dfe1e6' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', marginBottom: '6px' }}>USER</label>
                <Select
                  options={userOptions}
                  value={selectedUserOption}
                  onChange={setSelectedUserOption}
                  placeholder="Select user..."
                  isClearable
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', marginBottom: '6px' }}>ROLES</label>
                <Select
                  isMulti
                  options={roleOptions}
                  value={selectedRoleOptions}
                  onChange={setSelectedRoleOptions}
                  placeholder="Select roles..."
                />
              </div>
            </div>
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center', justifyContent: 'flex-end' }}>
              {error && <span style={{ color: '#ff5630', fontSize: '13px' }}>{error}</span>}
              <button
                onClick={() => { setShowAddMember(false); setError(null); }}
                style={{ border: 'none', background: 'none', cursor: 'pointer' }}
              >
                Cancel
              </button>
              <button
                onClick={handleAddMember}
                disabled={!selectedUserOption || selectedRoleOptions.length === 0 || loading}
                style={{ backgroundColor: '#36b37e', color: 'white', border: 'none', padding: '8px 20px', borderRadius: '3px', cursor: 'pointer', fontWeight: '600' }}
              >
                {loading ? 'Adding...' : 'Add Member'}
              </button>
            </div>
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {/* Owner */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '16px', backgroundColor: '#e3fcef', borderRadius: '8px' }}>
            {renderAvatar(project.owner, 40, '#36b37e')}
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '14px', fontWeight: '700' }}>{project.owner?.name}</div>
              <div style={{ fontSize: '12px', opacity: 0.8 }}>{project.owner?.email}</div>
            </div>
            <div style={{ backgroundColor: '#36b37e', color: 'white', padding: '4px 8px', borderRadius: '4px', fontSize: '10px', fontWeight: '700' }}>OWNER</div>
          </div>

          {/* Members */}
          {project.members?.map((member, i) => (
            <div key={member._id || i} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '16px', backgroundColor: 'white', borderRadius: '8px', border: '1px solid #dfe1e6' }}>
              {renderAvatar(member.user, 40, '#0052cc')}
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '14px', fontWeight: '600' }}>{member.user?.name || 'Unknown'}</div>
                <div style={{ fontSize: '12px', color: '#5e6c84' }}>{member.user?.email}</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginTop: '6px', alignItems: 'center' }}>
                  {member.role?.split(',').map((r, idx) => (
                    <span
                      key={idx}
                      style={{
                        backgroundColor: '#ebecf0',
                        padding: '2px 8px',
                        borderRadius: '3px',
                        fontSize: '10px',
                        fontWeight: '700',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}
                    >
                      {r.trim()}
                      {canAddMembers && (
                        <button
                          onClick={() => handleRemoveSpecificRole(member, r.trim())}
                          style={{ border: 'none', background: 'none', color: '#DE350B', cursor: 'pointer', padding: '0', fontSize: '12px', lineHeight: '1' }}
                          title="Remove this role"
                        >
                          ×
                        </button>
                      )}
                    </span>
                  ))}

                  {canAddMembers && (
                    <div style={{ width: '150px', marginLeft: '8px' }}>
                      <Select
                        placeholder="+ Add role"
                        options={roleOptions}
                        onChange={(opt) => handleAddSpecificRole(member, opt.value)}
                        value={null}
                        styles={{
                          control: (base) => ({
                            ...base,
                            minHeight: '24px',
                            height: '24px',
                            fontSize: '10px',
                            borderRadius: '3px',
                          }),
                          indicatorsContainer: (base) => ({ ...base, height: '24px' }),
                          valueContainer: (base) => ({ ...base, padding: '0 4px' }),
                          placeholder: (base) => ({ ...base, fontSize: '10px' }),
                          option: (base) => ({ ...base, fontSize: '11px', padding: '4px 8px' })
                        }}
                      />
                    </div>
                  )}
                </div>
              </div>
              {canRemoveMembers && (
                <button onClick={() => setMemberToRemove(member)} style={{ padding: '6px 10px', border: '1px solid #dfe1e6', background: 'white', color: '#DE350B', cursor: 'pointer', fontSize: '12px', borderRadius: '3px' }}>Remove Member</button>
              )}
            </div>
          ))}
        </div>
      </section>

      <DeleteConfirmModal isOpen={!!memberToRemove} onClose={() => setMemberToRemove(null)} onConfirm={handleRemoveMember} title="Remove Member" itemName={memberToRemove?.user?.name} />
      <DeleteConfirmModal isOpen={!!roleToRemove} onClose={() => setRoleToRemove(null)} onConfirm={handleDeleteRole} title="Delete Role" itemName={roleToRemove?.name} />
    </div>
  );
};

export default TeamTab;