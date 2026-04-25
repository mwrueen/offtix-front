import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import Select from 'react-select';
import { projectAPI, companyAPI, taskRoleAPI } from '../../services/api';
import DeleteConfirmModal from '../common/DeleteConfirmModal';
import { usePermissions, PERMISSIONS } from '../../context/PermissionsContext';
import { useToast } from '../../context/ToastContext';
import { Button, Badge } from '../ui';

const TeamTab = ({ projectId, project, users, isProjectOwner, isProjectManager, onRefresh }) => {
  const navigate = useNavigate();
  const { hasPermission } = usePermissions();
  const { showToast } = useToast();
  const [showAddMember, setShowAddMember] = useState(false);
  const [showAddRole, setShowAddRole] = useState(false);
  const [selectedUserOption, setSelectedUserOption] = useState(null);
  const [selectedRoleOptions, setSelectedRoleOptions] = useState([]);
  const [newRole, setNewRole] = useState({ name: '', description: '', color: '#6366f1' });
  const [memberToRemove, setMemberToRemove] = useState(null);
  const [roleToRemove, setRoleToRemove] = useState(null);
  const [loading, setLoading] = useState(false);
  const [companyRoles, setCompanyRoles] = useState([]);
  const [projectRoles, setProjectRoles] = useState([]);

  const canAddMembers = isProjectOwner || isProjectManager || hasPermission(PERMISSIONS.ASSIGN_EMPLOYEE_TO_PROJECT);
  const canRemoveMembers = isProjectOwner || isProjectManager || hasPermission(PERMISSIONS.REMOVE_EMPLOYEE_FROM_PROJECT);
  const canManageRoles = isProjectOwner || isProjectManager;

  useEffect(() => { fetchRoles(); }, [projectId, project]);

  const fetchRoles = async () => {
    try {
      const projectRolesRes = await taskRoleAPI.getAll(projectId);
      setProjectRoles(projectRolesRes.data || []);
      if (project?.company) {
        const companyId = typeof project.company === 'object' ? project.company._id : project.company;
        const response = await companyAPI.getById(companyId);
        if (response.data?.designations) {
          setCompanyRoles(response.data.designations.sort((a, b) => a.level - b.level).map(d => d.name));
        }
      }
    } catch (e) { console.error('Error fetching roles', e); }
  };

  const roleOptions = useMemo(() => {
    const projectSpecific = projectRoles.map(r => ({ value: r.name, label: r.name }));
    const standard = [{ value: 'Project Manager', label: 'Project Manager' }, ...companyRoles.map(r => ({ value: r, label: r }))];
    return [
      { label: 'Project Specific Roles', options: projectSpecific },
      { label: 'Standard Company Roles', options: standard }
    ];
  }, [projectRoles, companyRoles]);

  const userOptions = useMemo(() => {
    if (!users) return [];
    const available = users.filter(user => !project.members?.some(m => (m.user?._id || m.user) === user._id) && project.owner?._id !== user._id && project.owner !== user._id);
    return available.map(u => ({ value: u._id, label: `${u.name} (${u.email})`, user: u }));
  }, [users, project.members, project.owner]);

  const handleCreateRole = async () => {
    if (!newRole.name.trim()) return;
    setLoading(true);
    try {
      await taskRoleAPI.create(projectId, { ...newRole, order: projectRoles.length + 1 });
      setNewRole({ name: '', description: '', color: '#6366f1' });
      setShowAddRole(false);
      showToast('Role created successfully', 'success');
      fetchRoles();
    } catch (e) { showToast('Failed to create role', 'error'); }
    finally { setLoading(false); }
  };

  const handleAddMember = async () => {
    if (!selectedUserOption || selectedRoleOptions.length === 0) return;
    setLoading(true);
    try {
      const combinedRoles = selectedRoleOptions.map(opt => opt.value).join(', ');
      await projectAPI.addTeamMember(projectId, selectedUserOption.value, combinedRoles);
      setSelectedUserOption(null); setSelectedRoleOptions([]); setShowAddMember(false);
      showToast('Team member added successfully', 'success');
      onRefresh();
    } catch (e) { showToast('Failed to add team member', 'error'); }
    finally { setLoading(false); }
  };

  const handleRemoveMember = async () => {
    if (!memberToRemove) return;
    setLoading(true);
    try {
      await projectAPI.removeTeamMember(projectId, memberToRemove.user?._id || memberToRemove.user);
      setMemberToRemove(null);
      showToast('Team member removed successfully', 'success');
      onRefresh();
    } catch (e) { showToast('Failed to remove team member', 'error'); }
    finally { setLoading(false); }
  };

  const handleDeleteRole = async () => {
    if (!roleToRemove) return;
    setLoading(true);
    try {
      await taskRoleAPI.delete(projectId, roleToRemove._id);
      setRoleToRemove(null);
      showToast('Role deleted successfully', 'success');
      fetchRoles();
    } catch (e) { showToast('Failed to delete role', 'error'); }
    finally { setLoading(false); }
  };

  const selectStyles = {
    control: (base) => ({
      ...base,
      borderRadius: '12px',
      padding: '4px 8px',
      border: '1px solid #e2e8f0',
      backgroundColor: '#f8fafc',
      boxShadow: 'none',
      '&:hover': { borderColor: '#cbd5e1' },
      fontSize: '14px',
      fontWeight: '500'
    }),
    placeholder: (base) => ({ ...base, color: '#94a3b8' }),
    menu: (base) => ({ ...base, borderRadius: '12px', overflow: 'hidden', border: '1px solid #f1f5f9', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }),
    option: (base, state) => ({
      ...base,
      backgroundColor: state.isSelected ? '#4f46e5' : state.isFocused ? '#f1f5f9' : '#ffffff',
      color: state.isSelected ? '#ffffff' : '#1e293b',
      fontSize: '14px'
    }),
  };

  return (
    <div className="space-y-12 pb-20 animate-in fade-in duration-500">
      {/* Roles Section */}
      <section className="space-y-6">
        <div className="flex justify-between items-end border-b border-slate-200 pb-4">
          <div>
            <h3 className="text-xl font-bold text-slate-900">Project Roles</h3>
            <p className="text-sm text-slate-500 mt-1">Define specialization and workflow roles for project tasks</p>
          </div>
          {canManageRoles && (
            <Button variant="primary" size="sm" onClick={() => setShowAddRole(true)}>
              + Create Role
            </Button>
          )}
        </div>

        {showAddRole && (
          <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-md space-y-6 animate-in zoom-in-95">
            <h4 className="text-sm font-bold text-slate-900 uppercase tracking-widest">New Role Specification</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Role Title</label>
                <input
                  placeholder="e.g. Lead Architect"
                  value={newRole.name}
                  onChange={e => setNewRole({ ...newRole, name: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 px-4 py-2.5 rounded-xl text-sm font-medium outline-none focus:bg-white focus:border-indigo-400 transition-all"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Responsibilities</label>
                <input
                  placeholder="Brief description..."
                  value={newRole.description}
                  onChange={e => setNewRole({ ...newRole, description: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 px-4 py-2.5 rounded-xl text-sm font-medium outline-none focus:bg-white focus:border-indigo-400 transition-all"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Indicator Color</label>
                <div className="flex items-center gap-3 bg-slate-50 border border-slate-200 px-4 py-2 rounded-xl">
                  <input type="color" value={newRole.color} onChange={e => setNewRole({ ...newRole, color: e.target.value })} className="h-6 w-10 border-none cursor-pointer rounded bg-transparent" />
                  <span className="text-xs font-bold text-slate-600 uppercase font-mono">{newRole.color}</span>
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-3 pt-4 border-t border-slate-50">
              <Button variant="ghost" size="sm" onClick={() => setShowAddRole(false)}>Cancel</Button>
              <Button variant="primary" size="sm" onClick={handleCreateRole} disabled={loading} loading={loading}>
                Create Role
              </Button>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {projectRoles.map(role => (
            <div key={role._id} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm relative group hover:shadow-md transition-all">
              <div className="absolute top-0 left-0 w-1.5 h-full rounded-l-2xl" style={{ backgroundColor: role.color }} />
              <div className="flex justify-between items-start mb-4">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center shadow-sm" style={{ backgroundColor: `${role.color}15`, color: role.color }}>
                  🎖️
                </div>
                {canManageRoles && (
                  <Button variant="ghost" size="sm" onClick={() => setRoleToRemove(role)} className="text-slate-300 hover:text-rose-500 !p-1">×</Button>
                )}
              </div>
              <h4 className="text-base font-bold text-slate-900 mb-1">{role.name}</h4>
              <p className="text-[11px] text-slate-500 leading-relaxed line-clamp-2">{role.description || 'No description provided.'}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Team Members Section */}
      <section className="space-y-6">
        <div className="flex justify-between items-end border-b border-slate-200 pb-4">
          <div>
            <h3 className="text-xl font-bold text-slate-900">Project Team</h3>
            <p className="text-sm text-slate-500 mt-1">Manage personnel and their specific roles within this project</p>
          </div>
          {canAddMembers && (
            <Button variant="primary" size="sm" onClick={() => setShowAddMember(true)}>
              + Add Member
            </Button>
          )}
        </div>

        {showAddMember && (
          <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-md space-y-8 animate-in zoom-in-95">
            <h4 className="text-sm font-bold text-slate-900 uppercase tracking-widest">Integrate New Team Member</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">User Identity</label>
                <Select options={userOptions} value={selectedUserOption} onChange={setSelectedUserOption} styles={selectStyles} placeholder="Search by name or email..." />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Assigned Project Roles</label>
                <Select isMulti options={roleOptions} value={selectedRoleOptions} onChange={setSelectedRoleOptions} styles={selectStyles} placeholder="Select one or more roles..." />
              </div>
            </div>
            <div className="flex justify-end gap-3 pt-6 border-t border-slate-50">
              <Button variant="ghost" size="sm" onClick={() => setShowAddMember(false)}>Cancel</Button>
              <Button variant="primary" size="sm" onClick={handleAddMember} disabled={loading || !selectedUserOption} loading={loading}>
                Add Member
              </Button>
            </div>
          </div>
        )}

        <div className="space-y-4">
          {/* Team Manager Identity - Only visible if project has a manager */}
          {(project.projectManager || isProjectOwner) && (
            <div className="bg-white p-6 rounded-3xl shadow-sm flex items-center justify-between border-2 border-indigo-100 bg-gradient-to-r from-indigo-50/30 to-transparent">
              <div className="flex items-center gap-6">
                <div className="w-16 h-16 rounded-2xl bg-white border-2 border-indigo-200 flex items-center justify-center text-2xl font-black text-indigo-600 shadow-sm overflow-hidden">
                  {project.projectManager?.profile?.avatar ? (
                    <img src={project.projectManager.profile.avatar} alt="" className="w-full h-full object-cover" />
                  ) : (
                    project.projectManager?.name?.[0].toUpperCase() || '?'
                  )}
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md">Project Manager</span>
                    {isProjectOwner && (
                      <button 
                        onClick={() => setShowAddMember('pm')} 
                        className="text-[10px] font-bold text-slate-400 hover:text-indigo-600 transition-colors underline cursor-pointer"
                      >
                        {project.projectManager ? 'Change PM' : 'Assign PM'}
                      </button>
                    )}
                  </div>
                  <h4 className="text-lg font-bold text-slate-900 leading-tight">
                    {project.projectManager?.name || (isProjectOwner ? 'Unassigned' : 'No Project Manager')}
                  </h4>
                  <p className="text-xs text-slate-500 font-medium">{project.projectManager?.email || 'Assign someone to manage this project'}</p>
                </div>
              </div>
              <div className="px-5 py-2.5 bg-white rounded-2xl text-[10px] font-bold uppercase tracking-[0.2em] text-indigo-500 border border-indigo-50 shadow-sm">
                Management Tier
              </div>
            </div>
          )}

          {/* PM Assignment Selector */}
          {showAddMember === 'pm' && isProjectOwner && (
            <div className="bg-indigo-50/50 p-6 rounded-2xl border border-indigo-100 space-y-4 animate-in slide-in-from-top-4">
              <div className="flex justify-between items-center">
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-widest">Select Project Manager</h4>
                <button onClick={() => setShowAddMember(false)} className="text-slate-400 hover:text-slate-600">×</button>
              </div>
              <div className="flex gap-3">
                <div className="flex-1">
                  <Select 
                    options={users?.map(u => ({ value: u._id, label: `${u.name} (${u.email})` }))} 
                    onChange={async (opt) => {
                      try {
                        await projectAPI.update(projectId, { projectManager: opt.value });
                        showToast('Project Manager updated', 'success');
                        onRefresh();
                        setShowAddMember(false);
                      } catch (e) { showToast('Update failed', 'error'); }
                    }} 
                    styles={selectStyles} 
                    placeholder="Select a user from organization..." 
                  />
                </div>
              </div>
            </div>
          )}

          {/* Owner Identity */}
          <div className="bg-slate-900 text-white p-6 rounded-3xl shadow-lg flex items-center justify-between border-4 border-slate-800">
            <div className="flex items-center gap-6">
              <div className="w-16 h-16 rounded-2xl bg-indigo-600 border border-indigo-400/30 flex items-center justify-center text-2xl font-black italic shadow-inner">
                {project.owner?.name?.[0].toUpperCase()}
              </div>
              <div>
                <h4
                  onClick={() => navigate(`/profile/view/${project.owner?._id || project.owner}`)}
                  className="text-lg font-bold cursor-pointer hover:text-indigo-400 transition-colors"
                >
                  {project.owner?.name}
                </h4>
                <p className="text-xs text-slate-400 font-medium font-sans">{project.owner?.email}</p>
                <div className="mt-2 text-[10px] font-bold uppercase tracking-widest text-indigo-400">Project Owner</div>
              </div>
            </div>
            <div className="px-4 py-1.5 bg-slate-800 rounded-xl text-[10px] font-bold uppercase tracking-widest text-slate-400 border border-white/5">
              Mission Control
            </div>
          </div>

          {/* Member List */}
          <div className="grid grid-cols-1 gap-4">
            {project.members?.map((member, i) => (
              <div key={member._id || i} className="bg-white p-6 rounded-2xl border border-slate-200 flex items-center justify-between hover:shadow-md transition-all group">
                <div className="flex items-center gap-6">
                  <div className="w-14 h-14 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center text-xl font-bold text-slate-400 group-hover:bg-indigo-50 group-hover:text-indigo-400 transition-colors">
                    {member.user?.name?.[0].toUpperCase() || '?'}
                  </div>
                  <div>
                    <h4
                      onClick={() => navigate(`/profile/view/${member.user?._id || member.user}`)}
                      className="text-base font-bold text-slate-900 group-hover:text-indigo-600 transition-colors cursor-pointer hover:underline"
                    >
                      {member.user?.name || 'Unknown User'}
                    </h4>
                    <p className="text-xs text-slate-400 font-medium mt-0.5">{member.user?.email}</p>
                    <div className="flex flex-wrap gap-2 mt-3">
                      {member.role?.split(',').map((r, idx) => (
                        <Badge key={idx} variant="primary" size="sm">{r.trim()}</Badge>
                      ))}
                    </div>
                  </div>
                </div>
                {canRemoveMembers && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setMemberToRemove(member)}
                    className="text-rose-500 hover:bg-rose-50 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    Remove
                  </Button>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      <DeleteConfirmModal
        isOpen={!!memberToRemove}
        onClose={() => setMemberToRemove(null)}
        onConfirm={handleRemoveMember}
        title="Remove Team Member"
        message={`Are you sure you want to remove ${memberToRemove?.user?.name} from this project? They will no longer have access to mission assets.`}
      />

      <DeleteConfirmModal
        isOpen={!!roleToRemove}
        onClose={() => setRoleToRemove(null)}
        onConfirm={handleDeleteRole}
        title="Delete Project Role"
        message={`Are you sure you want to delete the role: ${roleToRemove?.name}? Active assignments to this role will remain but lose their reference.`}
      />
    </div>
  );
};

export default TeamTab;