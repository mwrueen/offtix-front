import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCompanyFilter } from '../hooks/useCompanyFilter';
import { useToast } from '../context/ToastContext';
import { getCookie } from '../utils/cookies';
import { usePermissions, PERMISSIONS } from '../context/PermissionsContext';
import Layout from './Layout';
import PageHeader from './PageHeader';
import DeleteConfirmModal from './common/DeleteConfirmModal';

const permissionCategories = [
  { title: 'Personnel Management', icon: '👥', permissions: [{ key: 'addEmployee', label: 'Add Employee', description: 'Permit adding new staff members.' }, { key: 'viewEmployeeList', label: 'View Employees', description: 'Access the organizational directory.' }, { key: 'editEmployee', label: 'Edit Employee', description: 'Modify employee profiles and details.' }] },
  { title: 'Access & Roles', icon: '🛡️', permissions: [{ key: 'createDesignation', label: 'Create Role', description: 'Define new organizational roles.' }, { key: 'viewDesignations', label: 'View Roles', description: 'Review the list of defined roles.' }, { key: 'editDesignation', label: 'Edit Role', description: 'Update permissions for existing roles.' }, { key: 'deleteDesignation', label: 'Delete Role', description: 'Remove roles from the system.' }] },
  { title: 'Project Operations', icon: '📋', permissions: [{ key: 'createProject', label: 'Create Project', description: 'Start new organizational projects.' }, { key: 'editProject', label: 'Edit Project', description: 'Manage project parameters and settings.' }, { key: 'deleteProject', label: 'Delete Project', description: 'Remove project entries.' }, { key: 'assignEmployeeToProject', label: 'Assign to Project', description: 'Allocate staff to specific projects.' }, { key: 'removeEmployeeFromProject', label: 'Remove from Project', description: 'Revoke project assignments.' }, { key: 'viewProjectAnalytics', label: 'View Analytics', description: 'Access performance reports and data.' }] },
  { title: 'Task Workflow', icon: '✅', permissions: [{ key: 'createTask', label: 'Create Task', description: 'Add deliverables to projects.' }, { key: 'editTask', label: 'Edit Task', description: 'Modify task details and status.' }, { key: 'deleteTask', label: 'Delete Task', description: 'Remove individual task items.' }] },
  { title: 'Recruitment & Hiring', icon: '🎯', permissions: [{ key: 'manageRecruitment', label: 'Manage Recruitment', description: 'Enable job creation and applicant lifecycle management.' }] },
  { title: 'System Settings', icon: '⚙️', permissions: [{ key: 'manageCompanySettings', label: 'Manage Settings', description: 'Configure overall company parameters.' }] }
];

const ManageRoles = () => {
  const navigate = useNavigate();
  const { state: authState } = useAuth();
  const { selectedCompany } = useCompanyFilter();
  const toast = useToast();
  const { hasPermission } = usePermissions();
  const [company, setCompany] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedRole, setSelectedRole] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);
  const [editingRole, setEditingRole] = useState(null);
  const [editPermissions, setEditPermissions] = useState({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (selectedCompany && selectedCompany.id !== 'personal') {
      fetchCompany();
    }
  }, [selectedCompany]);

  const fetchCompany = async () => {
    try {
      const token = getCookie('authToken');
      const response = await fetch(`/api/companies/${selectedCompany.id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        setCompany(await response.json());
      }
    } catch {
      toast.showToast('Failed to load company data.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteRole = async (did) => {
    try {
      const token = getCookie('authToken');
      const res = await fetch(`/api/companies/${selectedCompany.id}/designations/${did}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        toast.showToast('Role successfully removed.', 'success');
        fetchCompany();
        setShowDeleteConfirm(null);
      } else {
        toast.showToast('Failed to delete role.', 'error');
      }
    } catch {
      toast.showToast('Connection error.', 'error');
    }
  };

  const handleEditRole = (d) => {
    setEditingRole(d);
    setEditPermissions({ ...d.permissions });
  };

  const handlePermissionToggle = (k) => {
    setEditPermissions(prev => ({ ...prev, [k]: !prev[k] }));
  };

  const handleSavePermissions = async () => {
    if (!editingRole) return;
    setSaving(true);
    try {
      const token = getCookie('authToken');
      const res = await fetch(`/api/companies/${selectedCompany.id}/designation-permissions`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          designationId: editingRole._id,
          permissions: editPermissions
        })
      });
      if (res.ok) {
        toast.showToast('Permissions updated.', 'success');
        fetchCompany();
        setEditingRole(null);
      } else {
        toast.showToast('Failed to sync permissions.', 'error');
      }
    } catch {
      toast.showToast('Network error.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const getPermissionCount = (p) => p ? Object.values(p).filter(Boolean).length : 0;

  if (!selectedCompany || selectedCompany.id === 'personal') {
    return (
      <Layout>
        <div className="max-w-3xl mx-auto my-32 p-16 bg-white rounded-2xl border border-slate-200 text-center shadow-sm">
          <div className="text-6xl mb-8 opacity-20">🛡️</div>
          <h2 className="text-xl font-bold text-slate-800 tracking-tight mb-4">No Organization Selected</h2>
          <p className="text-xs font-medium text-slate-500 mb-8 max-w-sm mx-auto">
            Please select an active company to manage user roles and permissions.
          </p>
          <button onClick={() => navigate('/overview')} className="px-10 py-3.5 bg-indigo-600 text-white rounded-xl font-bold text-[10px] uppercase tracking-widest shadow-md hover:bg-slate-900 transition-all">Go to Overview</button>
        </div>
      </Layout>
    );
  }

  if (loading) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center py-40 space-y-6">
          <div className="w-10 h-10 border-4 border-slate-100 border-t-indigo-600 rounded-full animate-spin mx-auto shadow-sm" />
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none">Refreshing roles...</p>
        </div>
      </Layout>
    );
  }

  if (!hasPermission(PERMISSIONS.VIEW_DESIGNATIONS)) {
    return (
      <Layout>
        <div className="max-w-3xl mx-auto my-32 p-16 bg-white rounded-2xl text-center shadow-sm border border-slate-200">
          <div className="text-6xl mb-8 opacity-20 select-none">🔒</div>
          <h2 className="text-xl font-bold text-slate-800 tracking-tight mb-4">Access Denied</h2>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-8">
            You do not have the required permissions to view organizational roles.
          </p>
          <button onClick={() => navigate('/overview')} className="px-10 py-3.5 bg-indigo-600 text-white rounded-xl font-bold text-[10px] uppercase tracking-widest hover:bg-slate-900 transition-all shadow-md">Return to Overview</button>
        </div>
      </Layout>
    );
  }

  const designations = company?.designations || [];

  return (
    <Layout>
      <div className="space-y-12 pb-40">
        <PageHeader
          title="Role Management"
          subtitle={`Configure access permissions and organizational hierarchy for ${company?.name || 'the company'}.`}
          icon="🛡️"
          stats={[
            { label: 'Active Roles', value: designations.length },
            { label: 'System Permissions', value: Object.keys(PERMISSIONS).length }
          ]}
          actions={hasPermission(PERMISSIONS.CREATE_DESIGNATION) && (
            <button
              onClick={() => navigate('/create-role')}
              className="px-8 py-3.5 bg-indigo-600 text-white rounded-xl font-bold text-[10px] uppercase tracking-widest shadow-lg hover:bg-slate-900 transition-all active:scale-95 flex items-center gap-2"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14m-7-7v14" /></svg>
              Create New Role
            </button>
          )}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {designations.map((role, i) => (
            <div
              key={role._id || i}
              onClick={() => setSelectedRole(selectedRole === role ? null : role)}
              className={`group bg-white p-6 rounded-2xl border transition-all cursor-pointer relative 
                ${selectedRole === role ? 'border-indigo-400 shadow-md ring-1 ring-indigo-400' : 'border-slate-200 shadow-sm hover:border-indigo-200 hover:shadow-md'}`}
            >
              <div className="relative z-10 flex flex-col">
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <h3 className="text-lg font-bold text-slate-900 tracking-tight group-hover:text-indigo-600 transition-colors leading-tight mb-1">{role.name}</h3>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Level #{i + 1}</span>
                  </div>
                  <div className="w-10 h-10 bg-slate-50 border border-slate-100 rounded-xl flex items-center justify-center text-xl group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-colors">🛡️</div>
                </div>
                {role.description ? (
                  <div 
                    className="text-xs font-medium text-slate-500 mb-8 leading-relaxed prose prose-slate prose-xs max-w-none"
                    dangerouslySetInnerHTML={{ __html: role.description }}
                  />
                ) : (
                  <p className="text-xs font-medium text-slate-400 mb-8 leading-relaxed italic">
                    No description provided for this role.
                  </p>
                )}
                <div className="flex items-center justify-between pt-6 border-t border-slate-50 group-hover:border-indigo-50">
                  <div className={`px-4 py-1.5 rounded-lg text-[9px] font-bold uppercase tracking-widest transition-all ${selectedRole === role ? 'bg-indigo-600 text-white shadow-md' : 'bg-slate-100 text-slate-500'}`}>
                    {getPermissionCount(role.permissions)} Active Permissions
                  </div>
                  <div className={`transition-all duration-300 ${selectedRole === role ? 'rotate-90 text-indigo-600' : 'text-slate-300 translate-x-1'}`}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6" /></svg>
                  </div>
                </div>
              </div>

              {selectedRole === role && (
                <div className="mt-6 space-y-6 pt-6 border-t border-slate-100 border-dashed">
                  <div className="grid grid-cols-1 gap-2">
                    {Object.entries(role.permissions).filter(([_, v]) => v).map(([key]) => (
                      <div key={key} className="flex items-center gap-3 py-2.5 px-4 bg-indigo-50/50 rounded-xl border border-indigo-100/50 text-indigo-700 hover:bg-indigo-100/50 transition-colors">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                        <span className="text-[10px] font-bold uppercase tracking-widest">{key.replace(/([A-Z])/g, ' $1').trim()}</span>
                      </div>
                    ))}
                  </div>
                  <div className="flex gap-3 pt-2">
                    {hasPermission(PERMISSIONS.EDIT_DESIGNATION) && (
                      <button
                        onClick={(e) => { e.stopPropagation(); handleEditRole(role); }}
                        className="flex-1 py-3 bg-slate-900 text-white rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-indigo-600 hover:shadow-lg transition-all active:scale-95"
                      >
                        Modify Access
                      </button>
                    )}
                    {hasPermission(PERMISSIONS.DELETE_DESIGNATION) && (
                      <button
                        onClick={(e) => { e.stopPropagation(); setShowDeleteConfirm(role); }}
                        className="w-12 h-12 bg-rose-50 text-rose-500 rounded-xl flex items-center justify-center border border-rose-100 hover:bg-rose-600 hover:text-white hover:shadow-lg transition-all active:scale-95"
                      >
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18m-2 0v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6m3 0V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2M10 11v6m4-6v6" /></svg>
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}

          {designations.length === 0 && (
            <div className="col-span-full bg-white p-20 rounded-2xl border border-slate-200 text-center">
              <div className="text-6xl mb-6 opacity-10">🛡️</div>
              <h3 className="text-lg font-bold text-slate-400 uppercase tracking-widest">No Roles Defined</h3>
              <p className="text-xs font-medium text-slate-400 mb-8">
                The organizational directory is currently empty.
              </p>
              <button
                onClick={() => navigate('/create-role')}
                className="px-10 py-3.5 bg-indigo-600 text-white rounded-xl font-bold text-[10px] uppercase tracking-widest shadow-md hover:bg-slate-900 transition-all"
              >
                Create First Role
              </button>
            </div>
          )}
        </div>
      </div>

      <DeleteConfirmModal
        isOpen={!!showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(null)}
        onConfirm={() => handleDeleteRole(showDeleteConfirm?._id)}
        title="Delete Role"
        message={`Confirm permanent deletion of the "${showDeleteConfirm?.name}" role. All assigned employees will lose their specific permission access.`}
        itemName={showDeleteConfirm?.name}
      />

      {editingRole && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-[2000] p-6" onClick={() => { setEditingRole(null); setEditPermissions({}); }}>
          <div className="bg-white rounded-2xl w-full max-w-5xl max-h-[90vh] flex flex-col shadow-xl border border-slate-200 overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="px-10 py-8 bg-slate-900 text-white flex justify-between items-center shrink-0">
              <div>
                <h2 className="text-2xl font-bold tracking-tight">Edit Permissions</h2>
                <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest mt-1">Role: {editingRole.name}</p>
              </div>
              <button onClick={() => { setEditingRole(null); setEditPermissions({}); }} className="w-10 h-10 rounded-xl bg-white/10 text-white flex items-center justify-center text-2xl hover:bg-rose-600 transition-all font-bold">×</button>
            </div>

            <div className="p-10 overflow-y-auto scrollbar-none flex-1 space-y-12 bg-slate-50/30">
              {permissionCategories.map((cat, ci) => (
                <div key={ci} className="space-y-6">
                  <div className="flex items-center gap-4">
                    <span className="text-2xl bg-white w-12 h-12 rounded-xl shadow-sm flex items-center justify-center border border-slate-100">{cat.icon}</span>
                    <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-widest flex-1 border-b border-slate-100 pb-2">{cat.title}</h3>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {cat.permissions.map((p) => (
                      <div
                        key={p.key}
                        className={`group p-5 rounded-xl border transition-all cursor-pointer flex justify-between items-center 
                          ${editPermissions[p.key] ? 'border-indigo-400 bg-white shadow-sm ring-1 ring-indigo-400' : 'border-slate-200 bg-white hover:border-indigo-200 hover:shadow-sm'}`}
                        onClick={() => handlePermissionToggle(p.key)}
                      >
                        <div className="flex-1 pr-6">
                          <div className={`text-[11px] font-bold uppercase tracking-widest mb-1 transition-colors ${editPermissions[p.key] ? 'text-indigo-600' : 'text-slate-900'}`}>{p.label}</div>
                          <div className="text-[10px] font-medium text-slate-400 leading-relaxed pr-4">{p.description}</div>
                        </div>
                        <div className={`w-10 h-5 rounded-full p-1 transition-all flex items-center shrink-0 ${editPermissions[p.key] ? 'bg-indigo-600' : 'bg-slate-200'}`}>
                          <div className={`w-3 h-3 rounded-full bg-white shadow transform transition-transform ${editPermissions[p.key] ? 'translate-x-5' : 'translate-x-0'}`}></div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div className="px-10 py-8 bg-slate-50 border-t border-slate-200 flex justify-end gap-6 items-center shrink-0">
              <button onClick={() => { setEditingRole(null); setEditPermissions({}); }} className="text-[10px] font-bold uppercase tracking-widest text-slate-400 hover:text-slate-900 transition-all">Cancel</button>
              <button
                onClick={handleSavePermissions}
                disabled={saving}
                className="px-10 py-4 bg-indigo-600 text-white rounded-xl font-bold text-[10px] uppercase tracking-widest shadow-xl hover:bg-slate-900 transition-all active:scale-95 disabled:opacity-50"
              >
                {saving ? 'Saving...' : 'Save Permissions'}
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default ManageRoles;

