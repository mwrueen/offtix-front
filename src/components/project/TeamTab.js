import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Select from 'react-select';
import { projectAPI, companyAPI, taskRoleAPI, userAPI, invitationAPI, getAssetUrl } from '../../services/api';
import DeleteConfirmModal from '../common/DeleteConfirmModal';
import { usePermissions, PERMISSIONS } from '../../context/PermissionsContext';
import { useToast } from '../../context/ToastContext';
import { Button } from '../ui';

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
  const [showPMSelector, setShowPMSelector] = useState(false);
  const [selectedPMOption, setSelectedPMOption] = useState(null);
  const [pmLoading, setPmLoading] = useState(false);
  const [confirmUnassignPM, setConfirmUnassignPM] = useState(false);

  // Email search states for Personal Account & Fallback Invite
  const [emailSearch, setEmailSearch] = useState('');
  const [searchingUser, setSearchingUser] = useState(false);
  const [matchedUser, setMatchedUser] = useState(null);
  const [emailLookupMsg, setEmailLookupMsg] = useState('');
  const [selectInputValue, setSelectInputValue] = useState('');
  const [customInviteEmail, setCustomInviteEmail] = useState('');
  const [isCustomEmailInvite, setIsCustomEmailInvite] = useState(false);

  const isPersonal = !project?.company || project?.company === 'personal' || (typeof project?.company === 'object' && project?.company?.id === 'personal');

  const canAddMembers = isProjectOwner || isProjectManager || hasPermission(PERMISSIONS.ASSIGN_EMPLOYEE_TO_PROJECT);
  const canRemoveMembers = isProjectOwner || isProjectManager || hasPermission(PERMISSIONS.REMOVE_EMPLOYEE_FROM_PROJECT);
  const canManageRoles = isProjectOwner || isProjectManager;

  // Debounced search for user by email in database
  useEffect(() => {
    if (!isPersonal) return;
    const query = emailSearch.trim();
    if (!query || query.length < 3) {
      setMatchedUser(null);
      setSelectedUserOption(null);
      setEmailLookupMsg(query ? 'Type full user email to search...' : '');
      return;
    }

    const timer = setTimeout(async () => {
      setSearchingUser(true);
      setEmailLookupMsg('Searching database...');
      try {
        const res = await userAPI.getAll(null, null, null, query);
        const userList = res.data?.users || res.data || [];
        // Find exact or closest match by email
        const exactMatch = userList.find(u => u.email?.toLowerCase() === query.toLowerCase());
        const bestMatch = exactMatch || (userList.length === 1 ? userList[0] : null);

        if (bestMatch && (bestMatch.email?.toLowerCase().includes(query.toLowerCase()) || bestMatch.name?.toLowerCase().includes(query.toLowerCase()))) {
          // Check if user is already a project member
          const alreadyIn = project?.members?.some(m => (m.user?._id || m.user) === bestMatch._id);
          if (alreadyIn) {
            setMatchedUser(null);
            setSelectedUserOption(null);
            setEmailLookupMsg('This user is already a member of this project.');
          } else {
            setMatchedUser(bestMatch);
            setSelectedUserOption({ value: bestMatch._id, label: `${bestMatch.name} (${bestMatch.email})`, user: bestMatch });
            setEmailLookupMsg('');
          }
        } else {
          setMatchedUser(null);
          setSelectedUserOption(null);
          setEmailLookupMsg('No registered user found with this email address.');
        }
      } catch (err) {
        console.error('User email search error', err);
        setMatchedUser(null);
        setSelectedUserOption(null);
        setEmailLookupMsg('Error searching user.');
      } finally {
        setSearchingUser(false);
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [emailSearch, isPersonal, project?.members]);

  const fetchRoles = useCallback(async () => {
    try {
      const projectRolesRes = await taskRoleAPI.getAll(projectId);
      setProjectRoles(projectRolesRes.data || []);
      if (project?.company && typeof project.company === 'object') {
        const companyId = project.company._id || project.company.id;
        const response = await companyAPI.getById(companyId);
        if (response.data?.designations) {
          setCompanyRoles(response.data.designations.sort((a, b) => a.level - b.level).map(d => d.name));
        }
      }
    } catch (e) { console.error('Error fetching roles', e); }
  }, [projectId, project]);

  useEffect(() => { fetchRoles(); }, [fetchRoles]);

  const roleOptions = useMemo(() => {
    const projectSpecific = projectRoles.map(r => ({ value: r.name, label: r.name }));
    const standard = [{ value: 'Project Manager', label: 'Project Manager' }, ...companyRoles.map(r => ({ value: r, label: r }))];
    return [
      { label: 'Project Roles', options: projectSpecific },
      { label: 'Company Roles', options: standard }
    ];
  }, [projectRoles, companyRoles]);

  const userOptions = useMemo(() => {
    if (!users) return [];
    const available = users.filter(user => !project?.members?.some(m => (m.user?._id || m.user) === user._id));
    return available.map(u => ({ value: u._id, label: `${u.name} (${u.email})`, user: u }));
  }, [users, project?.members]);

  // Owner CAN be assigned as PM — no owner filter
  const pmOptions = useMemo(() => {
    if (!users) return [];
    return users.map(u => ({ value: u._id, label: `${u.name} (${u.email})`, user: u }));
  }, [users]);

  const handleAssignPM = async () => {
    if (!selectedPMOption) return;
    setPmLoading(true);
    try {
      await projectAPI.update(projectId, { projectManager: selectedPMOption.value });
      showToast('Project Manager assigned successfully', 'success');
      setSelectedPMOption(null);
      setShowPMSelector(false);
      onRefresh();
    } catch (e) { showToast('Failed to assign Project Manager', 'error'); }
    finally { setPmLoading(false); }
  };

  const handleUnassignPM = async () => {
    setPmLoading(true);
    try {
      await projectAPI.update(projectId, { projectManager: null });
      showToast('Project Manager unassigned', 'success');
      setConfirmUnassignPM(false);
      setShowPMSelector(false);
      onRefresh();
    } catch (e) { showToast('Failed to unassign Project Manager', 'error'); }
    finally { setPmLoading(false); }
  };

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

      if (selectedUserOption.isEmailInvite || isCustomEmailInvite) {
        const inviteEmail = customInviteEmail || selectedUserOption.value;
        const companyId = typeof project?.company === 'object' ? (project.company._id || project.company.id) : project?.company;

        if (companyId && companyId !== 'personal') {
          await invitationAPI.send(companyId, {
            email: inviteEmail,
            designation: selectedRoleOptions[0]?.value || 'Team Member'
          });
        }
        showToast(`Invitation sent to ${inviteEmail} successfully!`, 'success');
      } else {
        await projectAPI.addTeamMember(projectId, selectedUserOption.value, combinedRoles);
        showToast(isPersonal ? 'Member invited to project successfully' : 'Team member added successfully', 'success');
      }

      setSelectedUserOption(null);
      setSelectedRoleOptions([]);
      setMatchedUser(null);
      setEmailSearch('');
      setCustomInviteEmail('');
      setIsCustomEmailInvite(false);
      setShowAddMember(false);
      onRefresh();
    } catch (e) {
      const msg = e.response?.data?.error || e.message;
      showToast(msg || (isPersonal ? 'Failed to invite member' : 'Failed to add team member'), 'error');
    }
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

  const CustomNoOptionsMessage = useCallback((props) => {
    const typedValue = selectInputValue.trim();

    return (
      <div className="p-3 text-center space-y-2.5">
        <p className="text-xs font-semibold text-slate-500">
          {typedValue ? `No registered user found for "${typedValue}"` : 'No available users found'}
        </p>

        {typedValue && (
          <button
            type="button"
            onClick={() => {
              setCustomInviteEmail(typedValue);
              setIsCustomEmailInvite(true);
              setSelectedUserOption({ value: typedValue, label: `Invite ${typedValue} (by Email)`, isEmailInvite: true });
            }}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg text-xs font-bold transition-all w-full justify-center border border-indigo-200"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
            Invite "{typedValue}" by Email
          </button>
        )}

        <button
          type="button"
          onClick={() => navigate('/recruitment')}
          className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold transition-all w-full justify-center border border-slate-200"
        >
          <svg className="w-3.5 h-3.5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
          Go to Recruitment Page
        </button>
      </div>
    );
  }, [selectInputValue, navigate]);

  const selectStyles = {
    control: (base) => ({
      ...base, borderRadius: '12px', padding: '2px 6px', border: '1px solid #e2e8f0',
      backgroundColor: '#f8fafc', boxShadow: 'none', '&:hover': { borderColor: '#a5b4fc' }, fontSize: '14px', fontWeight: '500'
    }),
    placeholder: (base) => ({ ...base, color: '#94a3b8' }),
    menu: (base) => ({ ...base, borderRadius: '12px', overflow: 'hidden', border: '1px solid #e2e8f0', boxShadow: '0 20px 40px -10px rgba(0,0,0,0.12)' }),
    option: (base, state) => ({
      ...base, backgroundColor: state.isSelected ? '#4f46e5' : state.isFocused ? '#eef2ff' : '#ffffff',
      color: state.isSelected ? '#ffffff' : '#1e293b', fontSize: '13px', fontWeight: '500'
    }),
  };

  const getInitials = (name) => name ? name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) : '?';
  const avatarColors = ['bg-indigo-500', 'bg-violet-500', 'bg-emerald-500', 'bg-amber-500', 'bg-rose-500', 'bg-sky-500', 'bg-pink-500', 'bg-teal-500'];
  const getAvatarColor = (name) => avatarColors[(name?.charCodeAt(0) || 0) % avatarColors.length];

  const currentPM = project.projectManager;
  const owner = project.owner;
  const totalCount = 1 + (project.members?.length || 0);

  return (
    <div className="space-y-10 pb-20 animate-in fade-in duration-300">

      {/* ── Header strip ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Team</h2>
          <p className="text-sm text-slate-500 mt-0.5">{totalCount} member{totalCount !== 1 ? 's' : ''} · {projectRoles.length} custom role{projectRoles.length !== 1 ? 's' : ''}</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate('/recruitment')}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold border border-slate-200 bg-white text-slate-700 hover:border-indigo-300 hover:text-indigo-600 transition-all shadow-xs"
          >
            <svg className="w-3.5 h-3.5 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            Recruitment
          </button>

          {canManageRoles && (
            <button
              onClick={() => { setShowAddRole(v => !v); setShowAddMember(false); }}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold border transition-all ${showAddRole ? 'bg-violet-600 text-white border-transparent' : 'bg-white border-slate-200 text-slate-700 hover:border-violet-300 hover:text-violet-700'}`}
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" /></svg>
              {showAddRole ? 'Cancel' : 'New Role'}
            </button>
          )}
          {canAddMembers && (
            <button
              onClick={() => { setShowAddMember(v => !v); setShowAddRole(false); setEmailSearch(''); setMatchedUser(null); setSelectedUserOption(null); setSelectInputValue(''); setIsCustomEmailInvite(false); setCustomInviteEmail(''); }}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold border transition-all ${showAddMember ? 'bg-indigo-600 text-white border-transparent' : 'bg-indigo-600 text-white border-transparent hover:bg-indigo-700'}`}
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" /></svg>
              {showAddMember ? 'Cancel' : (isPersonal ? 'Invite Member' : 'Add Member')}
            </button>
          )}
        </div>
      </div>

      {/* ── New Role Form ── */}
      {showAddRole && (
        <div className="bg-violet-50/60 border border-violet-100 rounded-2xl p-6 space-y-5 animate-in slide-in-from-top-4">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-base">🎖️</span>
            <h4 className="text-sm font-bold text-slate-800">Create New Role</h4>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Role Name *</label>
              <input
                placeholder="e.g. Lead Designer"
                value={newRole.name}
                onChange={e => setNewRole({ ...newRole, name: e.target.value })}
                className="w-full bg-white border border-slate-200 px-4 py-2.5 rounded-xl text-sm font-medium outline-none focus:border-violet-400 transition-all"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Description</label>
              <input
                placeholder="Brief responsibilities..."
                value={newRole.description}
                onChange={e => setNewRole({ ...newRole, description: e.target.value })}
                className="w-full bg-white border border-slate-200 px-4 py-2.5 rounded-xl text-sm font-medium outline-none focus:border-violet-400 transition-all"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Color</label>
              <div className="flex items-center gap-3 bg-white border border-slate-200 px-4 py-2 rounded-xl">
                <input type="color" value={newRole.color} onChange={e => setNewRole({ ...newRole, color: e.target.value })} className="h-6 w-10 border-none cursor-pointer rounded bg-transparent" />
                <span className="text-xs font-bold text-slate-500 font-mono uppercase">{newRole.color}</span>
              </div>
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-3 border-t border-violet-100">
            <button onClick={() => setShowAddRole(false)} className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-all">Cancel</button>
            <Button variant="primary" size="sm" onClick={handleCreateRole} disabled={loading || !newRole.name.trim()} loading={loading}>Create Role</Button>
          </div>
        </div>
      )}

      {/* ── Add / Invite Member Form ── */}
      {showAddMember && (
        <div className="bg-indigo-50/60 border border-indigo-100 rounded-2xl p-6 space-y-5 animate-in slide-in-from-top-4">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-base">👤</span>
            <h4 className="text-sm font-bold text-slate-800">{isPersonal ? 'Invite Team Member' : 'Add Team Member'}</h4>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                {isPersonal ? 'Find User by Email *' : 'Select User *'}
              </label>
              {isPersonal ? (
                <div>
                  <div className="relative">
                    <input
                      type="email"
                      placeholder="Type full user email (e.g. user@example.com)..."
                      value={emailSearch}
                      onChange={(e) => setEmailSearch(e.target.value)}
                      className="w-full bg-white border border-slate-200 px-4 py-2.5 rounded-xl text-sm font-medium outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 transition-all placeholder:text-slate-400"
                    />
                    {searchingUser && (
                      <span className="absolute right-3 top-3 text-xs text-indigo-600 font-bold animate-pulse">Searching...</span>
                    )}
                  </div>
                  {emailLookupMsg && !matchedUser && (
                    <div className="space-y-2 mt-2">
                      <p className="text-xs font-semibold text-slate-500 leading-snug">{emailLookupMsg}</p>
                      {emailSearch.includes('@') && (
                        <button
                          type="button"
                          onClick={() => {
                            setCustomInviteEmail(emailSearch);
                            setIsCustomEmailInvite(true);
                            setSelectedUserOption({ value: emailSearch, label: `Invite ${emailSearch} (by Email)`, isEmailInvite: true });
                          }}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-100 hover:bg-indigo-200 text-indigo-800 rounded-lg text-xs font-bold transition-all border border-indigo-300"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                          Invite "{emailSearch}" to Project
                        </button>
                      )}
                    </div>
                  )}
                </div>
              ) : (
                <Select
                  options={userOptions}
                  value={selectedUserOption}
                  onChange={(opt) => {
                    setSelectedUserOption(opt);
                    if (!opt?.isEmailInvite) {
                      setIsCustomEmailInvite(false);
                      setCustomInviteEmail('');
                    }
                  }}
                  onInputChange={(val) => setSelectInputValue(val)}
                  components={{ NoOptionsMessage: CustomNoOptionsMessage }}
                  styles={selectStyles}
                  placeholder="Search by name or email..."
                  isClearable
                />
              )}
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Assign Roles *</label>
              <Select isMulti options={roleOptions} value={selectedRoleOptions} onChange={setSelectedRoleOptions} styles={selectStyles} placeholder="Select one or more roles..." />
            </div>
          </div>

          {/* Email Invite Selection Preview */}
          {selectedUserOption?.isEmailInvite && (
            <div className="p-3.5 bg-indigo-50 border border-indigo-200 rounded-xl flex items-center justify-between shadow-xs animate-in fade-in duration-200">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold text-sm">
                  ✉️
                </div>
                <div>
                  <p className="text-xs font-bold text-indigo-900 leading-snug">Invite by Email</p>
                  <p className="text-xs text-indigo-700 font-medium">{selectedUserOption.value}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => { setSelectedUserOption(null); setIsCustomEmailInvite(false); setCustomInviteEmail(''); }}
                className="text-xs font-bold text-slate-400 hover:text-slate-600"
              >
                Clear
              </button>
            </div>
          )}

          {/* Matched User Preview Card for Personal Account */}
          {isPersonal && matchedUser && (
            <div className="p-3.5 bg-white border border-indigo-200 rounded-xl flex items-center justify-between shadow-xs animate-in fade-in duration-200">
              <div className="flex items-center gap-3.5 min-w-0">
                {(() => {
                  const pic = matchedUser.profilePicture || matchedUser.profile?.profilePicture || matchedUser.avatar;
                  return (
                    <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-indigo-500 to-violet-600 text-white flex items-center justify-center font-bold text-sm overflow-hidden shrink-0 shadow-sm relative">
                      {pic ? (
                        <img
                          src={getAssetUrl(pic)}
                          alt={matchedUser.name}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.target.style.display = 'none';
                            if (e.target.nextSibling) e.target.nextSibling.style.display = 'flex';
                          }}
                        />
                      ) : null}
                      <span className={`w-full h-full flex items-center justify-center font-bold ${pic ? 'hidden' : ''}`}>
                        {getInitials(matchedUser.name)}
                      </span>
                    </div>
                  );
                })()}
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-bold text-slate-900 truncate leading-snug">{matchedUser.name}</p>
                    <span className="px-1.5 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 text-[9px] font-extrabold rounded uppercase tracking-wider">
                      Matched
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 truncate">{matchedUser.email}</p>
                </div>
              </div>
            </div>
          )}


          <div className="flex justify-end gap-2 pt-3 border-t border-indigo-100">
            <button onClick={() => setShowAddMember(false)} className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-all">Cancel</button>
            <Button variant="primary" size="sm" onClick={handleAddMember} disabled={loading || !selectedUserOption || selectedRoleOptions.length === 0} loading={loading}>
              {isPersonal ? 'Invite Member' : 'Add Member'}
            </Button>
          </div>
        </div>
      )}

      {/* ── Leadership Cards ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Owner */}
        <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl p-6 flex items-center gap-4 shadow-lg">
          <div className="absolute top-0 right-0 w-40 h-40 bg-indigo-500/10 rounded-full translate-x-10 -translate-y-10 pointer-events-none" />
          <div className={`w-14 h-14 rounded-xl ${getAvatarColor(owner?.name)} flex items-center justify-center text-lg font-black text-white shadow-md shrink-0`}>
            {getInitials(owner?.name)}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest mb-0.5">Project Owner</div>
            <h4
              onClick={() => navigate(`/profile/view/${owner?._id || owner}`)}
              className="text-base font-bold text-white cursor-pointer hover:text-indigo-300 transition-colors truncate"
            >
              {owner?.name}
            </h4>
            <p className="text-xs text-slate-400 truncate">{owner?.email}</p>
          </div>
          <div className="shrink-0 px-2.5 py-1 bg-indigo-500/20 rounded-lg text-[10px] font-bold text-indigo-300 border border-indigo-500/20 uppercase tracking-wide">
            Owner
          </div>
        </div>

        {/* Project Manager */}
        <div className={`relative overflow-hidden rounded-2xl p-6 flex items-center gap-4 border-2 transition-all ${currentPM ? 'bg-white border-indigo-100 shadow-sm' : 'bg-slate-50 border-dashed border-slate-200'}`}>
          {currentPM ? (
            <>
              <div className={`w-14 h-14 rounded-xl ${getAvatarColor(currentPM?.name)} flex items-center justify-center text-lg font-black text-white shadow-md shrink-0`}>
                {getInitials(currentPM?.name)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest mb-0.5">Project Manager</div>
                <h4
                  onClick={() => navigate(`/profile/view/${currentPM?._id || currentPM}`)}
                  className="text-base font-bold text-slate-900 cursor-pointer hover:text-indigo-600 transition-colors truncate"
                >
                  {currentPM?.name}
                </h4>
                <p className="text-xs text-slate-400 truncate">{currentPM?.email}</p>
              </div>
              {isProjectOwner && (
                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    onClick={() => { setShowPMSelector(v => !v); setSelectedPMOption(null); }}
                    className="px-3 py-1.5 rounded-lg text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-all"
                  >
                    Change
                  </button>
                  <button
                    onClick={() => setConfirmUnassignPM(true)}
                    className="px-3 py-1.5 rounded-lg text-xs font-bold text-rose-600 bg-rose-50 hover:bg-rose-100 transition-all"
                  >
                    Remove
                  </button>
                </div>
              )}
            </>
          ) : (
            <>
              <div className="w-14 h-14 rounded-xl bg-slate-200 flex items-center justify-center text-2xl shrink-0">👤</div>
              <div className="flex-1">
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Project Manager</div>
                <p className="text-sm font-semibold text-slate-500">No manager assigned yet</p>
                <p className="text-xs text-slate-400 mt-0.5">Assign someone to lead this project</p>
              </div>
              {isProjectOwner && (
                <button
                  onClick={() => { setShowPMSelector(v => !v); setSelectedPMOption(null); }}
                  className="shrink-0 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition-all shadow-sm"
                >
                  + Assign PM
                </button>
              )}
            </>
          )}
        </div>
      </div>

      {/* PM Selector inline */}
      {showPMSelector && isProjectOwner && (
        <div className="bg-indigo-50 border border-indigo-200 rounded-2xl p-5 space-y-3 animate-in slide-in-from-top-4">
          <div className="flex items-center justify-between mb-1">
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wide">
              {currentPM ? 'Change Project Manager' : 'Assign Project Manager'}
            </h4>
            <button onClick={() => { setShowPMSelector(false); setSelectedPMOption(null); }} className="text-slate-400 hover:text-slate-600 text-xl leading-none">×</button>
          </div>
          <p className="text-xs text-slate-500">The project owner can also be assigned as the project manager.</p>
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1">
              <Select
                options={pmOptions}
                value={selectedPMOption}
                onChange={setSelectedPMOption}
                styles={selectStyles}
                placeholder="Search user by name or email..."
                isClearable
              />
            </div>
            <Button variant="primary" size="sm" onClick={handleAssignPM} disabled={pmLoading || !selectedPMOption} loading={pmLoading}>
              Confirm
            </Button>
          </div>
        </div>
      )}

      {/* ── Project Roles ── */}
      {projectRoles.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider">Project Roles</h3>
            <span className="text-xs text-slate-400 font-medium">{projectRoles.length} role{projectRoles.length !== 1 ? 's' : ''}</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
            {projectRoles.map(role => (
              <div key={role._id} className="group relative bg-white border border-slate-200 rounded-xl px-4 py-3 hover:shadow-md transition-all" style={{ borderLeftColor: role.color, borderLeftWidth: '3px' }}>
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <h4 className="text-xs font-bold text-slate-900 truncate">{role.name}</h4>
                    {role.description && <p className="text-[11px] text-slate-400 mt-0.5 line-clamp-1">{role.description}</p>}
                  </div>
                  {canManageRoles && (
                    <button
                      onClick={() => setRoleToRemove(role)}
                      className="opacity-0 group-hover:opacity-100 text-slate-300 hover:text-rose-500 transition-all shrink-0 text-lg leading-none"
                    >×</button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Members List ── */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider">Members</h3>
          <span className="text-xs text-slate-400 font-medium">{project.members?.length || 0} member{(project.members?.length || 0) !== 1 ? 's' : ''}</span>
        </div>

        {(!project.members || project.members.length === 0) ? (
          <div className="py-16 text-center border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50">
            <div className="text-5xl mb-3 opacity-30">👥</div>
            <p className="text-sm font-semibold text-slate-500">No members yet</p>
            {canAddMembers && <p className="text-xs text-slate-400 mt-1">Click "{isPersonal ? 'Invite Member' : 'Add Member'}" to invite people to this project.</p>}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
            {project.members.map((member, i) => {
              const name = member.user?.name || 'Unknown User';
              const userObj = typeof member.user === 'object' ? member.user : {};
              const pic = userObj.profilePicture || userObj.profile?.profilePicture || userObj.avatar;
              const roles = member.role ? member.role.split(',').map(r => r.trim()).filter(Boolean) : [];
              return (
                <div key={member._id || i} className="group bg-white border border-slate-200 rounded-2xl p-4 flex items-center gap-4 hover:border-indigo-200 hover:shadow-md transition-all">
                  <div className={`w-11 h-11 rounded-xl ${getAvatarColor(name)} flex items-center justify-center text-sm font-black text-white shrink-0 overflow-hidden relative`}>
                    {pic ? (
                      <img
                        src={getAssetUrl(pic)}
                        alt={name}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.target.style.display = 'none';
                          if (e.target.nextSibling) e.target.nextSibling.style.display = 'flex';
                        }}
                      />
                    ) : null}
                    <span className={`w-full h-full flex items-center justify-center font-bold ${pic ? 'hidden' : ''}`}>
                      {getInitials(name)}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4
                      onClick={() => navigate(`/profile/view/${member.user?._id || member.user}`)}
                      className="text-sm font-bold text-slate-900 cursor-pointer hover:text-indigo-600 transition-colors truncate"
                    >
                      {name}
                    </h4>
                    <p className="text-[11px] text-slate-400 truncate">{member.user?.email}</p>
                    {roles.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {roles.map((r, idx) => (
                          <span key={idx} className="px-2 py-0.5 bg-indigo-50 text-indigo-700 text-[10px] font-bold rounded-md border border-indigo-100">
                            {r}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  {canRemoveMembers && (
                    <button
                      onClick={() => setMemberToRemove(member)}
                      className="shrink-0 opacity-0 group-hover:opacity-100 p-2 rounded-lg text-slate-300 hover:text-rose-500 hover:bg-rose-50 transition-all"
                      title="Remove member"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7a4 4 0 11-8 0 4 4 0 018 0zM9 14a6 6 0 00-6 6v1h12v-1a6 6 0 00-6-6zM21 12h-6" />
                      </svg>
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modals */}
      <DeleteConfirmModal
        isOpen={!!memberToRemove}
        onClose={() => setMemberToRemove(null)}
        onConfirm={handleRemoveMember}
        title="Remove Team Member"
        message={`Remove ${memberToRemove?.user?.name} from this project? They will lose access to all project assets.`}
      />
      <DeleteConfirmModal
        isOpen={!!roleToRemove}
        onClose={() => setRoleToRemove(null)}
        onConfirm={handleDeleteRole}
        title="Delete Project Role"
        message={`Delete the role "${roleToRemove?.name}"? Existing assignments using this role will remain but lose their reference.`}
      />
      <DeleteConfirmModal
        isOpen={confirmUnassignPM}
        onClose={() => setConfirmUnassignPM(false)}
        onConfirm={handleUnassignPM}
        title="Remove Project Manager"
        message={`Remove ${currentPM?.name || 'the current Project Manager'} from their management role? Their membership (if any) will remain unaffected.`}
        confirmButtonText="Yes, Remove"
      />
    </div>
  );
};

export default TeamTab;