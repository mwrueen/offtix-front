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
  { title: 'Employee_Management', icon: '👥', permissions: [{ key: 'addEmployee', label: 'Add Employee', description: 'Can add new employees to the company' }, { key: 'viewEmployeeList', label: 'View Employees', description: 'Can view the list of all employees' }, { key: 'editEmployee', label: 'Edit Employee', description: 'Can modify employee information' }] },
  { title: 'Role_Management', icon: '🛡️', permissions: [{ key: 'createDesignation', label: 'Create Role', description: 'Can create new roles/designations' }, { key: 'viewDesignations', label: 'View Roles', description: 'Can view all roles/designations' }, { key: 'editDesignation', label: 'Edit Role', description: 'Can modify role permissions' }, { key: 'deleteDesignation', label: 'Delete Role', description: 'Can delete roles/designations' }] },
  { title: 'Project_Management', icon: '📋', permissions: [{ key: 'createProject', label: 'Create Project', description: 'Can create new projects' }, { key: 'editProject', label: 'Edit Project', description: 'Can edit project details and status' }, { key: 'deleteProject', label: 'Delete Project', description: 'Can delete projects' }, { key: 'assignEmployeeToProject', label: 'Assign to Project', description: 'Can assign employees to projects' }, { key: 'removeEmployeeFromProject', label: 'Remove from Project', description: 'Can remove employees from projects' }, { key: 'viewProjectAnalytics', label: 'View Analytics', description: 'Can view project reports and analytics' }] },
  { title: 'Task_Management', icon: '✅', permissions: [{ key: 'createTask', label: 'Create Task', description: 'Can create tasks within projects' }, { key: 'editTask', label: 'Edit Task', description: 'Can modify task information' }, { key: 'deleteTask', label: 'Delete Task', description: 'Can delete tasks' }] },
  { title: 'Company_Settings', icon: '⚙️', permissions: [{ key: 'manageCompanySettings', label: 'Manage Settings', description: 'Can modify company settings' }] }
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
    } catch { toast.showToast('CORE_FETCH_INTERRUPTION', 'error'); }
    finally { setLoading(false); }
  };

  const handleDeleteRole = async (did) => {
    try {
      const token = getCookie('authToken');
      const res = await fetch(`/api/companies/${selectedCompany.id}/designations/${did}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` } });
      if (res.ok) { toast.showToast('ROLE_EXPUNGED_SUCCESSFULLY', 'warning'); fetchCompany(); setShowDeleteConfirm(null); }
      else toast.showToast('EXPUNGE_PROTOCOL_FAILED', 'error');
    } catch { toast.showToast('PROTOCOL_ERROR_DELETION', 'error'); }
  };

  const handleEditRole = (d) => { setEditingRole(d); setEditPermissions({ ...d.permissions }); };
  const handlePermissionToggle = (k) => setEditPermissions(prev => ({ ...prev, [k]: !prev[k] }));

  const handleSavePermissions = async () => {
    if (!editingRole) return; setSaving(true);
    try {
      const token = getCookie('authToken');
      const res = await fetch(`/api/companies/${selectedCompany.id}/designation-permissions`, { method: 'PUT', headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ designationId: editingRole._id, permissions: editPermissions }) });
      if (res.ok) { toast.showToast('ACCESS_MATRIX_SYNCHRONIZED', 'success'); fetchCompany(); setEditingRole(null); }
      else toast.showToast('MATRIX_UPDATE_FAILED', 'error');
    } catch { toast.showToast('CONNECTION_LOSS_SYNC', 'error'); }
    finally { setSaving(false); }
  };

  const getPermissionCount = (p) => p ? Object.values(p).filter(Boolean).length : 0;

  if (!selectedCompany || selectedCompany.id === 'personal') return (
    <Layout>
      <div className="max-w-4xl mx-auto my-32 p-24 bg-white rounded-[6rem] border-4 border-dashed border-slate-50 text-center shadow-24 relative overflow-hidden group italic">
        <div className="text-9xl mb-12 grayscale opacity-10 group-hover:grayscale-0 group-hover:rotate-12 transition-all duration-1000">🛡️</div>
        <h2 className="text-4xl font-black text-slate-200 uppercase tracking-[0.5em] mb-6 group-hover:text-slate-950 transition-colors">NO_SYSTEM_CONTEXT</h2>
        <p className="text-[12px] font-black text-slate-400 italic mb-16 opacity-50 uppercase tracking-widest max-w-lg mx-auto leading-relaxed">Select an operational entity sector from the primary command terminal to manage the underlying access hierarchy infrastructure.</p>
        <button onClick={() => navigate('/dashboard')} className="px-16 py-7 bg-indigo-600 text-white rounded-[3rem] font-black text-[11px] uppercase tracking-[0.4em] shadow-24 hover:bg-slate-950 transition-all italic">RETURN_TO_CORE_COMMAND</button>
      </div>
    </Layout>
  );

  if (loading) return (
    <Layout>
      <div className="max-w-[1600px] mx-auto px-10 py-40 text-center animate-pulse space-y-12">
        <div className="w-24 h-24 border-8 border-slate-100 border-t-indigo-600 rounded-full animate-spin mx-auto shadow-24" />
        <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.6em] italic">DECRYPTING_ACCESS_MATRIX...</p>
      </div>
    </Layout>
  );

  if (!hasPermission(PERMISSIONS.VIEW_DESIGNATIONS)) return (
    <Layout>
      <div className="max-w-4xl mx-auto my-32 p-32 bg-slate-950 rounded-[6rem] text-center shadow-24 border border-white/5 relative overflow-hidden italic">
        <div className="text-[150px] mb-12 grayscale opacity-40 animate-pulse select-none">🔒</div>
        <h2 className="text-5xl font-black text-white uppercase tracking-[0.2em] mb-6">AUTHORITY_DENIED</h2>
        <p className="text-[12px] font-black text-slate-500 uppercase tracking-[0.5em] mb-16 underline underline-offset-8 decoration-white/10 decoration-dashed">Level_5_Clearance_Required // Node_Decryption_Keys_Negative</p>
        <button onClick={() => navigate('/dashboard')} className="px-16 py-7 bg-white text-slate-950 rounded-[3rem] font-black text-[11px] uppercase tracking-[0.4em] hover:scale-105 active:scale-95 transition-all shadow-24 italic">REQUEST_RELOCATION_PROTOCOL</button>
        <div className="absolute top-0 right-0 w-[50%] h-full bg-rose-600/10 rounded-full blur-[140px] pointer-events-none" />
      </div>
    </Layout>
  );

  return (
    <Layout>
      <div className="max-w-[1600px] mx-auto px-10 py-16 space-y-20 animate-in fade-in slide-in-from-bottom-20 duration-1000">
        <PageHeader
          title="ACCESS_MATRIX_CORE"
          subtitle={`Management of ${company?.designations?.length || 0} authority profiles in current sector cluster.`}
          icon={<div className="w-16 h-16 bg-slate-950 text-white rounded-full flex items-center justify-center text-3xl shadow-24 border-4 border-white/10 italic">🛡️</div>}
          stats={[{ label: 'ACTIVE_PROFILES', value: company?.designations?.length || 0 }, { label: 'SECURITY_LEVEL', value: 'LVL_5' }]}
          actions={hasPermission(PERMISSIONS.CREATE_DESIGNATION) && <button onClick={() => navigate('/create-role')} className="px-12 py-6 bg-slate-950 text-white rounded-[2.5rem] font-black text-[10px] uppercase tracking-[0.4em] shadow-24 hover:bg-indigo-600 transition-all italic underline decoration-white/20 underline-offset-8">+ INITIALIZE_NEW_ROLE</button>}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12 italic">
          {company?.designations?.map((d, i) => (
            <div key={i} onClick={() => setSelectedRole(selectedRole === d ? null : d)} className={`group bg-white p-12 rounded-[4.5rem] border border-slate-100 shadow-sm hover:shadow-24 hover:-translate-y-4 transition-all duration-1000 cursor-pointer overflow-hidden relative ${selectedRole === d ? 'ring-8 ring-indigo-50/50 border-indigo-200' : ''}`}>
              <div className="absolute top-0 right-0 w-24 h-24 bg-slate-50 group-hover:bg-indigo-50/50 rounded-bl-[6rem] transition-colors" />
              <div className="relative z-10 h-full flex flex-col">
                <div className="flex justify-between items-start mb-10 translate-y-2">
                  <div>
                    <h3 className="text-2xl font-black text-slate-950 uppercase tracking-tighter group-hover:text-indigo-600 transition-colors mb-2 leading-tight">{d.name}</h3>
                    <span className="text-[10px] font-black text-slate-300 uppercase tracking-[0.4em] italic">AUTHORITY_PROFILE_{i + 1}</span>
                  </div>
                  <div className="w-16 h-16 bg-slate-50 rounded-[2rem] flex items-center justify-center text-3xl group-hover:rotate-12 transition-all duration-700 shadow-inner group-hover:bg-white group-hover:shadow-24">🛡️</div>
                </div>
                <p className="text-sm font-black text-slate-400 italic mb-12 flex-1 leading-relaxed uppercase tracking-widest line-clamp-3 opacity-60 group-hover:opacity-100 transition-opacity break-words">
                  {d.description || 'MISSION_PROTOCOL_PARAMETER_NULL'}
                </p>
                <div className="flex items-center justify-between pt-10 border-t border-slate-50 group-hover:border-indigo-50">
                  <div className={`px-6 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-[0.2em] transition-all ${selectedRole === d ? 'bg-indigo-600 text-white' : 'bg-slate-900 text-white shadow-lg'}`}> {getPermissionCount(d.permissions)} KEYS_GRANTED </div>
                  <div className={`transition-all duration-700 ${selectedRole === d ? 'rotate-90 text-indigo-600 text-2xl scale-125' : 'group-hover:translate-x-3 opacity-20 text-xl'}`}>→</div>
                </div>
              </div>

              {selectedRole === d && <div className="mt-12 animate-in slide-in-from-top-12 duration-1000 space-y-8 pt-12 border-t-4 border-slate-50 border-dashed">
                <div className="grid grid-cols-1 gap-5">
                  {Object.entries(d.permissions).filter(([_, v]) => v).map(([k]) => (
                    <div key={k} className="flex items-center gap-6 py-4 px-8 bg-indigo-50/50 rounded-[2rem] border-2 border-indigo-100/50 text-indigo-600 group/perm">
                      <span className="text-xl animate-pulse">✓</span>
                      <span className="text-[10px] font-black uppercase tracking-[0.3em]">{k.replace(/([A-Z])/g, ' $1').trim()}</span>
                    </div>
                  ))}
                </div>
                <div className="flex gap-6 pt-10 border-t border-slate-50">
                  {hasPermission(PERMISSIONS.EDIT_DESIGNATION) && <button onClick={(e) => { e.stopPropagation(); handleEditRole(d); }} className="flex-1 py-6 bg-indigo-600 text-white rounded-[2rem] text-[10px] font-black uppercase tracking-[0.4em] hover:bg-slate-950 transition-all active:scale-95 shadow-24">MODIFY_MATRIX</button>}
                  {hasPermission(PERMISSIONS.DELETE_DESIGNATION) && <button onClick={(e) => { e.stopPropagation(); setShowDeleteConfirm(d); }} className="w-20 h-20 bg-rose-50 text-rose-500 rounded-[2.5rem] flex items-center justify-center text-3xl hover:bg-rose-500 hover:text-white transition-all active:scale-95 shadow-sm">🗑</button>}
                </div>
              </div>}
            </div>
          ))}

          {(!company?.designations || company.designations.length === 0) && (
            <div className="col-span-full bg-white p-40 rounded-[6rem] border-4 border-dashed border-slate-50 text-center opacity-40 group hover:opacity-100 transition-opacity">
              <div className="text-9xl mb-12 grayscale opacity-20 group-hover:grayscale-0 group-hover:scale-110 transition-transform duration-1000">🛡️</div>
              <h3 className="text-4xl font-black text-slate-200 uppercase tracking-[0.5em] mb-4 group-hover:text-slate-950 transition-colors">REGISTRY_EMPTY</h3>
              <p className="text-[12px] font-black text-slate-400 uppercase tracking-[0.4em] mb-16 italic opacity-50 underline decoration-slate-100 underline-offset-8">NO_AUTHORITY_NODES_DEFINED_IN_SECTOR</p>
              <button onClick={() => navigate('/create-role')} className="px-16 py-7 bg-slate-950 text-white rounded-[3rem] font-black text-[11px] uppercase tracking-[0.5em] hover:bg-indigo-600 transition-all shadow-24 italic">INITIALIZE_FIRST_NODE</button>
            </div>
          )}
        </div>
      </div>

      <DeleteConfirmModal isOpen={!!showDeleteConfirm} onClose={() => setShowDeleteConfirm(null)} onConfirm={() => handleDeleteRole(showDeleteConfirm?._id)} title="PROTOCOL_EXPUNGE_REGISTRY" message={`Confirmation required for permanent excision of profile "${showDeleteConfirm?.name}" from organogram organic registry. All assigned nodes will lose current clearance level access.`} itemName={showDeleteConfirm?.name?.toUpperCase()} />

      {/* Modern Permission Editor Modal */}
      {editingRole && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-3xl flex items-center justify-center z-[1000] p-10 animate-in fade-in duration-500 italic" onClick={() => { setEditingRole(null); setEditPermissions({}); }}>
          <div className="bg-white rounded-[5rem] w-full max-w-6xl max-h-[90vh] flex flex-col shadow-24 border border-white/20 overflow-hidden animate-in zoom-in-95 slide-in-from-top-32 duration-1000" onClick={(e) => e.stopPropagation()}>
            <div className="absolute top-0 right-0 p-20 text-9xl font-black italic opacity-5 grayscale pointer-events-none select-none">MATRIX</div>
            <div className="px-16 py-12 bg-slate-950 border-b border-white/10 relative overflow-hidden shrink-0 italic">
              <div className="relative z-10 flex justify-between items-center">
                <div>
                  <h2 className="text-4xl font-black text-white uppercase tracking-tighter mb-2 italic">Matrix_Modification_Interface</h2>
                  <p className="text-[11px] font-black text-slate-500 uppercase tracking-[0.6em] italic underline underline-offset-8 decoration-white/10">Editing: {editingRole.name.toUpperCase()} // SEC_MOD_AVAIL</p>
                </div>
                <button onClick={() => { setEditingRole(null); setEditPermissions({}); }} className="w-20 h-20 rounded-[2.5rem] bg-white/5 border border-white/10 flex items-center justify-center text-white hover:bg-white hover:text-slate-950 hover:scale-110 hover:rotate-90 transition-all text-4xl shadow-24 italic">×</button>
              </div>
              <div className="absolute top-0 right-0 w-[40%] h-full bg-indigo-500/10 rounded-full blur-[120px] pointer-events-none" />
            </div>

            <div className="p-16 overflow-y-auto custom-scrollbar flex-1 space-y-20 bg-slate-50/10">
              {permissionCategories.map((cat, ci) => (
                <div key={ci} className="space-y-12 animate-in slide-in-from-bottom-12 duration-1000 italic" style={{ animationDelay: `${ci * 150}ms` }}>
                  <div className="flex items-center gap-10">
                    <span className="text-5xl grayscale opacity-30 select-none">{cat.icon}</span>
                    <h3 className="text-lg font-black text-slate-950 uppercase tracking-[0.4em] flex-1 border-b-2 border-slate-100 pb-4">{cat.title}</h3>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                    {cat.permissions.map((p) => (
                      <div key={p.key} className={`group p-10 rounded-[3rem] border-4 transition-all duration-700 cursor-pointer flex justify-between items-center italic ${editPermissions[p.key] ? 'border-indigo-600 bg-white shadow-24 shadow-indigo-100 scale-[1.02]' : 'border-slate-100/50 bg-white hover:bg-slate-50 hover:border-slate-200'}`} onClick={() => handlePermissionToggle(p.key)}>
                        <div className="flex-1 pr-10">
                          <div className={`text-sm font-black uppercase tracking-widest mb-3 transition-colors ${editPermissions[p.key] ? 'text-indigo-600' : 'text-slate-950'}`}>{p.label}</div>
                          <div className="text-[10px] font-black text-slate-400 italic leading-relaxed uppercase pr-6 opacity-60 group-hover:opacity-100 transition-opacity">{p.description}</div>
                        </div>
                        <div className={`w-20 h-10 rounded-full p-2 transition-all duration-700 flex items-center shadow-inner ${editPermissions[p.key] ? 'bg-indigo-600' : 'bg-slate-200'}`}>
                          <div className={`w-6 h-6 rounded-full bg-white shadow-lg transform transition-transform duration-700 ${editPermissions[p.key] ? 'translate-x-10' : 'translate-x-0'}`}></div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div className="px-16 py-12 bg-white border-t border-slate-100 flex justify-between items-center shrink-0">
              <div className="text-[10px] font-black text-slate-300 uppercase italic tracking-widest">COMMIT_HASH: {editingRole._id?.slice(-12)}</div>
              <div className="flex gap-10">
                <button onClick={() => { setEditingRole(null); setEditPermissions({}); }} className="px-12 py-7 text-[11px] font-black uppercase tracking-[0.5em] text-slate-400 hover:text-rose-500 transition-all italic underline decoration-slate-100 underline-offset-8">X_ABORT_CHANGES</button>
                <button onClick={handleSavePermissions} disabled={saving} className="px-16 py-7 bg-slate-950 text-white rounded-[3rem] font-black text-[11px] uppercase tracking-[0.4em] shadow-24 hover:bg-indigo-600 hover:scale-105 active:scale-95 transition-all disabled:opacity-50 group relative overflow-hidden italic">
                  <span className="relative z-10">{saving ? 'SYNCHRONIZING_MATRIX...' : 'AUTHORIZE_PROTOCOL_SYNC'}</span>
                  <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:animate-[shimmer_3s_infinite]" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default ManageRoles;
