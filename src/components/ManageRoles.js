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
  { title: 'Employee Management', icon: '👥', permissions: [{ key: 'addEmployee', label: 'Add Employee', description: 'Can add new employees to the company' }, { key: 'viewEmployeeList', label: 'View Employees', description: 'Can view the list of all employees' }, { key: 'editEmployee', label: 'Edit Employee', description: 'Can modify employee information' }] },
  { title: 'Role & Permissions', icon: '🛡️', permissions: [{ key: 'createDesignation', label: 'Create Role', description: 'Can create new roles/designations' }, { key: 'viewDesignations', label: 'View Roles', description: 'Can view all roles/designations' }, { key: 'editDesignation', label: 'Edit Role', description: 'Can modify role permissions' }, { key: 'deleteDesignation', label: 'Delete Role', description: 'Can delete roles/designations' }] },
  { title: 'Project Operations', icon: '📋', permissions: [{ key: 'createProject', label: 'Create Project', description: 'Can create new projects' }, { key: 'editProject', label: 'Edit Project', description: 'Can edit project details and status' }, { key: 'deleteProject', label: 'Delete Project', description: 'Can delete projects' }, { key: 'assignEmployeeToProject', label: 'Assign to Project', description: 'Can assign employees to projects' }, { key: 'removeEmployeeFromProject', label: 'Remove from Project', description: 'Can remove employees from projects' }, { key: 'viewProjectAnalytics', label: 'View Analytics', description: 'Can view project reports and analytics' }] },
  { title: 'Task Workflow', icon: '✅', permissions: [{ key: 'createTask', label: 'Create Task', description: 'Can create tasks within projects' }, { key: 'editTask', label: 'Edit Task', description: 'Can modify task information' }, { key: 'deleteTask', label: 'Delete Task', description: 'Can delete tasks' }] },
  { title: 'Company Settings', icon: '⚙️', permissions: [{ key: 'manageCompanySettings', label: 'Manage Settings', description: 'Can modify company settings' }] }
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

  useEffect(() => { if (selectedCompany && selectedCompany.id !== 'personal') fetchCompany(); }, [selectedCompany]);

  const fetchCompany = async () => {
    try {
      const token = getCookie('authToken');
      const response = await fetch(`/api/companies/${selectedCompany.id}`, { headers: { 'Authorization': `Bearer ${token}` } });
      if (response.ok) setCompany(await response.json());
    } catch { toast.showToast('Failed to fetch company data.', 'error'); }
    finally { setLoading(false); }
  };

  const handleDeleteRole = async (did) => {
    try {
      const token = getCookie('authToken');
      const res = await fetch(`/api/companies/${selectedCompany.id}/designations/${did}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` } });
      if (res.ok) { toast.showToast('Role deleted successfully.', 'warning'); fetchCompany(); setShowDeleteConfirm(null); }
      else toast.showToast('Failed to delete role.', 'error');
    } catch { toast.showToast('Protocol error.', 'error'); }
  };

  const handleEditRole = (d) => { setEditingRole(d); setEditPermissions({ ...d.permissions }); };
  const handlePermissionToggle = (k) => setEditPermissions(prev => ({ ...prev, [k]: !prev[k] }));

  const handleSavePermissions = async () => {
    if (!editingRole) return; setSaving(true);
    try {
      const token = getCookie('authToken');
      const res = await fetch(`/api/companies/${selectedCompany.id}/designation-permissions`, { method: 'PUT', headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ designationId: editingRole._id, permissions: editPermissions }) });
      if (res.ok) { toast.showToast('Permissions updated.', 'success'); fetchCompany(); setEditingRole(null); }
      else toast.showToast('Sync failed.', 'error');
    } catch { toast.showToast('Connection loss.', 'error'); }
    finally { setSaving(false); }
  };

  const getPermissionCount = (p) => p ? Object.values(p).filter(Boolean).length : 0;

  if (!selectedCompany || selectedCompany.id === 'personal') return (
    <Layout>
      <div className="max-w-3xl mx-auto my-32 p-16 bg-white rounded-3xl border-2 border-dashed border-slate-100 text-center shadow-sm font-sans">
        <div className="text-8xl mb-8 opacity-20">🛡️</div>
        <h2 className="text-3xl font-bold text-slate-800 tracking-tight mb-4">No Organization Selected</h2>
        <p className="text-sm font-medium text-slate-500 mb-10 max-w-sm mx-auto">Please select a company to manage user roles and organizational permissions.</p>
        <button onClick={() => navigate('/dashboard')} className="px-10 py-3 bg-indigo-600 text-white rounded-xl font-bold text-xs uppercase tracking-widest shadow-md hover:bg-slate-950 transition-all">Go to Dashboard</button>
      </div>
    </Layout>
  );

  if (loading) return (
    <Layout>
      <div className="p-40 text-center animate-pulse space-y-8">
        <div className="w-12 h-12 border-4 border-slate-100 border-t-indigo-600 rounded-full animate-spin mx-auto shadow-sm" />
        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest italic">Decrypting access matrix...</p>
      </div>
    </Layout>
  );

  if (!hasPermission(PERMISSIONS.VIEW_DESIGNATIONS)) return (
    <Layout>
      <div className="max-w-3xl mx-auto my-32 p-16 bg-slate-900 rounded-3xl text-center shadow-xl border border-white/10 relative overflow-hidden font-sans">
        <div className="text-8xl mb-8 opacity-30 select-none">🔒</div>
        <h2 className="text-4xl font-bold text-white uppercase tracking-tight mb-4">Access Denied</h2>
        <p className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-10 italic">Insufficient permissions to view role designations.</p>
        <button onClick={() => navigate('/dashboard')} className="px-10 py-3 bg-white text-slate-900 rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-indigo-50 transition-all shadow-lg">Return to Dashboard</button>
      </div>
    </Layout>
  );

  return (
    <Layout>
      <div className="space-y-12 animate-in fade-in duration-700 pb-40">
        <PageHeader
          title="Role Management"
          subtitle={`Configure access permissions and authorization levels for ${company?.name || 'the organization'}.`}
          icon="🛡️"
          stats={[
            { label: 'Active Roles', value: company?.designations?.length || 0 },
            { label: 'Total Permissions', value: Object.keys(PERMISSIONS).length }
          ]}
          actions={hasPermission(PERMISSIONS.CREATE_DESIGNATION) && <button onClick={() => navigate('/create-role')} className="px-8 py-3 bg-indigo-600 text-white rounded-xl font-bold text-xs uppercase tracking-widest shadow-lg hover:bg-slate-950 transition-all active:scale-95 flex items-center gap-2"><span>+</span> Add New Role</button>}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 font-sans">
          {company?.designations?.map((d, i) => (
            <div key={i} onClick={() => setSelectedRole(selectedRole === d ? null : d)} className={`group bg-white p-8 rounded-3xl border transition-all duration-300 cursor-pointer overflow-hidden relative ${selectedRole === d ? 'border-indigo-400 shadow-xl scale-[1.02]' : 'border-slate-200 shadow-sm hover:shadow-lg hover:-translate-y-1'}`}>
              <div className="relative z-10 h-full flex flex-col">
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <h3 className="text-xl font-bold text-slate-900 uppercase tracking-tight group-hover:text-indigo-600 transition-colors leading-tight mb-1">{d.name}</h3>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest italic">System Role #{i + 1}</span>
                  </div>
                  <div className="w-12 h-12 bg-slate-50 border border-slate-100 rounded-2xl flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">🛡️</div>
                </div>
                <p className="text-xs font-semibold text-slate-500 italic mb-8 flex-1 leading-relaxed opacity-70 group-hover:opacity-100 line-clamp-2">
                  {d.description || 'No description provided for this role.'}
                </p>
                <div className="flex items-center justify-between pt-6 border-t border-slate-100 group-hover:border-indigo-50">
                  <div className={`px-4 py-1.5 rounded-full text-[9px] font-bold uppercase tracking-widest transition-all ${selectedRole === d ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-500'}`}> {getPermissionCount(d.permissions)} Active Rules </div>
                  <div className={`transition-all duration-500 font-bold ${selectedRole === d ? 'rotate-90 text-indigo-600 text-xl' : 'opacity-20 translate-x-1'}`}>→</div>
                </div>
              </div>

              {selectedRole === d && <div className="mt-8 animate-in slide-in-from-top-4 duration-500 space-y-6 pt-6 border-t border-slate-100 border-dashed">
                <div className="grid grid-cols-1 gap-3">
                  {Object.entries(d.permissions).filter(([_, v]) => v).map(([k]) => (
                    <div key={k} className="flex items-center gap-3 py-2 px-4 bg-indigo-50 rounded-xl border border-indigo-100 text-indigo-600">
                      <span className="text-sm font-bold">✓</span>
                      <span className="text-[10px] font-bold uppercase tracking-widest">{k.replace(/([A-Z])/g, ' $1').trim()}</span>
                    </div>
                  ))}
                </div>
                <div className="flex gap-4 pt-4 border-t border-slate-100">
                  {hasPermission(PERMISSIONS.EDIT_DESIGNATION) && <button onClick={(e) => { e.stopPropagation(); handleEditRole(d); }} className="flex-1 py-3 bg-slate-900 text-white rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-slate-800 transition-all shadow-md">Modify Permissions</button>}
                  {hasPermission(PERMISSIONS.DELETE_DESIGNATION) && <button onClick={(e) => { e.stopPropagation(); setShowDeleteConfirm(d); }} className="w-12 h-12 bg-white border border-rose-100 text-rose-500 rounded-xl flex items-center justify-center text-2xl hover:bg-rose-600 hover:text-white transition-all shadow-sm">🗑</button>}
                </div>
              </div>}
            </div>
          ))}

          {(!company?.designations || company.designations.length === 0) && (
            <div className="col-span-full bg-white p-20 rounded-3xl border-2 border-dashed border-slate-200 text-center opacity-60">
              <div className="text-7xl mb-6 grayscale opacity-20">🛡️</div>
              <h3 className="text-2xl font-bold text-slate-400 uppercase tracking-widest">No Roles Defined</h3>
              <p className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-8 italic">The organizational directory is empty.</p>
              <button onClick={() => navigate('/create-role')} className="px-10 py-3 bg-indigo-600 text-white rounded-xl font-bold text-xs uppercase tracking-widest shadow-lg hover:bg-slate-900 transition-all">Create First Role</button>
            </div>
          )}
        </div>
      </div>

      <DeleteConfirmModal isOpen={!!showDeleteConfirm} onClose={() => setShowDeleteConfirm(null)} onConfirm={() => handleDeleteRole(showDeleteConfirm?._id)} title="Delete Role Designation" message={`Are you sure you want to permanently delete the role "${showDeleteConfirm?.name}"? All employees currently assigned to this role will lose their special permissions.`} itemName={showDeleteConfirm?.name} />

      {editingRole && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-[2000] p-6 animate-in fade-in duration-300 font-sans" onClick={() => { setEditingRole(null); setEditPermissions({}); }}>
          <div className="bg-white rounded-3xl w-full max-w-5xl max-h-[90vh] flex flex-col shadow-2xl border border-white/20 overflow-hidden animate-in zoom-in-95 duration-500" onClick={(e) => e.stopPropagation()}>
            <div className="px-10 py-6 bg-slate-900 text-white flex justify-between items-center shrink-0">
              <div>
                <h2 className="text-2xl font-bold uppercase italic tracking-tight">Modify Permissions Matrix</h2>
                <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest mt-1">Editing authority rules for: {editingRole.name}</p>
              </div>
              <button onClick={() => { setEditingRole(null); setEditPermissions({}); }} className="w-10 h-10 rounded-xl bg-white/10 text-white flex items-center justify-center text-3xl hover:bg-rose-600 transition-all font-bold">×</button>
            </div>

            <div className="p-10 overflow-y-auto scrollbar-none flex-1 space-y-12 bg-slate-50/10">
              {permissionCategories.map((cat, ci) => (
                <div key={ci} className="space-y-6">
                  <div className="flex items-center gap-4">
                    <span className="text-3xl opacity-30 select-none">{cat.icon}</span>
                    <h3 className="text-[11px] font-bold text-slate-500 uppercase tracking-widest flex-1 border-b border-slate-200 pb-2 italic">{cat.title}</h3>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {cat.permissions.map((p) => (
                      <div key={p.key} className={`group p-6 rounded-2xl border transition-all duration-300 cursor-pointer flex justify-between items-center ${editPermissions[p.key] ? 'border-indigo-600 bg-white shadow-md' : 'border-slate-200 bg-white hover:border-indigo-200'}`} onClick={() => handlePermissionToggle(p.key)}>
                        <div className="flex-1 pr-6">
                          <div className={`text-xs font-bold uppercase tracking-widest mb-1 transition-colors ${editPermissions[p.key] ? 'text-indigo-600' : 'text-slate-900'}`}>{p.label}</div>
                          <div className="text-[10px] font-medium text-slate-400 leading-relaxed pr-4">{p.description}</div>
                        </div>
                        <div className={`w-10 h-5 rounded-full p-1 transition-all flex items-center shadow-inner shrink-0 ${editPermissions[p.key] ? 'bg-indigo-600' : 'bg-slate-200'}`}>
                          <div className={`w-3 h-3 rounded-full bg-white shadow-md transform transition-transform ${editPermissions[p.key] ? 'translate-x-5' : 'translate-x-0'}`}></div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div className="px-10 py-6 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row justify-end gap-6 items-center shrink-0">
              <button onClick={() => { setEditingRole(null); setEditPermissions({}); }} className="px-8 py-3 text-[11px] font-bold uppercase tracking-widest text-slate-400 hover:text-rose-600 transition-all italic underline underline-offset-8">Cancel Changes</button>
              <button onClick={handleSavePermissions} disabled={saving} className="px-12 py-3.5 bg-indigo-600 text-white rounded-xl font-bold text-xs uppercase tracking-widest shadow-xl hover:bg-slate-950 transition-all disabled:opacity-50">
                {saving ? 'Synchronizing...' : 'Save Configuration Link'}
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default ManageRoles;
