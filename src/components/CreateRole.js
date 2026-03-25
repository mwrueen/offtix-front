import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCompanyFilter } from '../hooks/useCompanyFilter';
import { useToast } from '../context/ToastContext';
import { getCookie } from '../utils/cookies';
import { usePermissions, PERMISSIONS } from '../context/PermissionsContext';
import Layout from './Layout';
import Input from './common/Input';
import PageHeader from './PageHeader';

const CreateRole = () => {
  const navigate = useNavigate();
  const { state } = useAuth();
  const { selectedCompany } = useCompanyFilter();
  const toast = useToast();
  const { hasPermission, loading: permLoading } = usePermissions();

  const [formData, setFormData] = useState({
    name: '',
    description: ''
  });

  const [permissions, setPermissions] = useState({
    addEmployee: false,
    viewEmployeeList: true,
    editEmployee: false,
    createDesignation: false,
    viewDesignations: true,
    editDesignation: false,
    deleteDesignation: false,
    createProject: false,
    editProject: false,
    deleteProject: false,
    assignEmployeeToProject: false,
    removeEmployeeFromProject: false,
    viewProjectAnalytics: false,
    createTask: false,
    editTask: false,
    deleteTask: false
  });

  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
  };

  const handlePermissionChange = (permission) => {
    setPermissions(prev => ({ ...prev, [permission]: !prev[permission] }));
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.name.trim()) newErrors.name = 'Role name is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) {
      toast?.showToast?.('Please fix the errors in the form', 'error');
      return;
    }
    setLoading(true);
    try {
      const token = getCookie('authToken');
      const response = await fetch(`/api/companies/${selectedCompany.id}/designations`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: formData.name.trim(),
          description: formData.description.trim(),
          permissions
        })
      });

      if (response.ok) {
        toast?.showToast?.('Role created successfully!', 'success');
        navigate('/manage-roles');
      } else {
        const errorData = await response.json();
        toast?.showToast?.(errorData.message || 'Failed to create role', 'error');
      }
    } catch (error) {
      console.error('Error creating role:', error);
      toast?.showToast?.('Failed to create role. Please try again.', 'error');
    } finally { setLoading(false); }
  };

  const permissionGroups = [
    {
      title: 'Employee Management',
      icon: '👥',
      permissions: [
        { key: 'addEmployee', label: 'Invite Employees', description: 'Authorize new staff invitations.' },
        { key: 'viewEmployeeList', label: 'Directory Access', description: 'View professional profiles.' },
        { key: 'editEmployee', label: 'Modify Personnel', description: 'Update profile and compensation.' }
      ]
    },
    {
      title: 'Role Architecture',
      icon: '🛡️',
      permissions: [
        { key: 'createDesignation', label: 'Define Roles', description: 'Create new authority levels.' },
        { key: 'viewDesignations', label: 'Audit Roles', description: 'Monitor structural hierarchy.' },
        { key: 'editDesignation', label: 'Update Authority', description: 'Modify active permissions.' },
        { key: 'deleteDesignation', label: 'Revoke Roles', description: 'Remove structural designations.' }
      ]
    },
    {
      title: 'Project Operations',
      icon: '📁',
      permissions: [
        { key: 'createProject', label: 'Initiate Projects', description: 'Start new mission clusters.' },
        { key: 'editProject', label: 'Manage Scope', description: 'Modify project parameters.' },
        { key: 'deleteProject', label: 'Archive Projects', description: 'Remove project signals.' },
        { key: 'assignEmployeeToProject', label: 'Staff Allocation', description: 'Assign resources to tasks.' },
        { key: 'viewProjectAnalytics', label: 'Performance Review', description: 'Access operational reports.' }
      ]
    },
    {
      title: 'Task Execution',
      icon: '✅',
      permissions: [
        { key: 'createTask', label: 'Define Tasks', description: 'Create project deliverables.' },
        { key: 'editTask', label: 'Modify Tasks', description: 'Update execution status.' },
        { key: 'deleteTask', label: 'Flush Tasks', description: 'Remove task nodes.' }
      ]
    }
  ];

  if (!selectedCompany || selectedCompany.id === 'personal') {
    return (
      <Layout>
        <div className="bg-white p-20 rounded-3xl text-center shadow-lg border border-slate-200 animate-in fade-in zoom-in-95 duration-500">
          <div className="text-8xl mb-6 opacity-20">🏢</div>
          <h2 className="text-3xl font-bold text-slate-800 uppercase italic tracking-tight">No Organization Selected</h2>
          <p className="text-slate-500 mb-10 max-w-sm mx-auto font-medium">
            Please select an active organization to define new authority roles.
          </p>
          <button onClick={() => navigate('/overview')} className="px-10 py-4 bg-indigo-600 text-white rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-slate-900 transition-all shadow-lg active:scale-95">Go to Overview</button>
        </div>
      </Layout>
    );
  }

  if (permLoading) return <Layout><div className="p-40 text-center animate-pulse"><div className="w-12 h-12 border-4 border-slate-100 border-t-indigo-600 rounded-full animate-spin mx-auto mb-4" /><p className="text-xs font-bold text-slate-400 uppercase tracking-widest italic">Syncing Permissions...</p></div></Layout>;

  if (!hasPermission(PERMISSIONS.CREATE_DESIGNATION)) {
    return (
      <Layout>
        <div className="bg-white p-20 rounded-3xl text-center shadow-lg border border-slate-200 animate-in fade-in zoom-in-95 duration-500">
          <div className="text-8xl mb-6 opacity-20">🔒</div>
          <h2 className="text-3xl font-bold text-slate-800 uppercase italic tracking-tight">Access Restricted</h2>
          <p className="text-slate-500 mb-10 max-w-sm mx-auto font-medium font-sans">
            You do not possess the necessary clearance level to define new organizational roles.
          </p>
          <button onClick={() => navigate('/overview')} className="px-10 py-4 bg-indigo-600 text-white rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-slate-900 transition-all shadow-lg active:scale-95">Release Signal</button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-5xl mx-auto space-y-10 pb-40">
        <PageHeader
          title="Create New Role"
          subtitle={`Define a specific clearance level and permission matrix for ${selectedCompany.name}.`}
          icon="🛡️"
          stats={[
            { label: 'Clearing Center', value: selectedCompany.name },
            { label: 'Mode', value: 'WRITE_ACCESS' }
          ]}
          actions={
            <div className="flex gap-4">
              <button onClick={() => navigate('/manage-roles')} className="px-8 py-3.5 text-xs font-bold uppercase tracking-widest text-slate-400 hover:text-rose-600 transition-all italic underline underline-offset-8">Abort Protocol</button>
              <button onClick={handleSubmit} disabled={loading} className="px-10 py-3.5 bg-indigo-600 text-white rounded-xl font-bold text-xs uppercase tracking-widest shadow-lg hover:bg-slate-950 transition-all disabled:opacity-50 italic"> {loading ? 'Processing...' : 'Authorize New Role'} </button>
            </div>
          }
        />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 font-sans">
          <div className="lg:col-span-4 space-y-6">
            <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm space-y-8">
              <h3 className="text-base font-bold text-slate-900 uppercase italic tracking-tight border-b border-slate-100 pb-4">Role Fundamentals</h3>
              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest ml-1">Designation Label</label>
                  <input type="text" name="name" value={formData.name} onChange={handleChange} placeholder="e.g. Lead Architect" className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-900 outline-none focus:bg-white focus:border-indigo-400 transition-all italic" />
                  {errors.name && <p className="text-[10px] text-rose-500 font-bold ml-1">{errors.name}</p>}
                </div>
                <div className="space-y-2">
                  <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest ml-1">Mission Description</label>
                  <textarea name="description" value={formData.description} onChange={handleChange} rows="4" placeholder="Detail the authority scope..." className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-medium text-slate-600 outline-none focus:bg-white focus:border-indigo-400 transition-all resize-none italic" />
                </div>
              </div>
            </div>
            <div className="bg-slate-900 p-8 rounded-[2.5rem] text-white shadow-xl relative overflow-hidden group">
              <div className="relative z-10">
                <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest mb-4 opacity-80 italic">Hierarchy Notice</p>
                <p className="text-sm font-medium italic leading-relaxed text-slate-300">Defining precise permissions ensures secure organizational integrity and operational efficiency.</p>
              </div>
              <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
            </div>
          </div>

          <div className="lg:col-span-8 space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {permissionGroups.map((group, index) => (
                <div key={index} className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm space-y-6 transition-all hover:border-indigo-100 hover:shadow-md">
                  <div className="flex items-center gap-3 border-b border-slate-50 pb-4">
                    <span className="text-2xl">{group.icon}</span>
                    <h4 className="text-sm font-bold text-slate-900 uppercase italic tracking-tight">{group.title}</h4>
                  </div>
                  <div className="space-y-3">
                    {group.permissions.map((perm) => (
                      <label key={perm.key} className={`group/perm flex items-start gap-3 cursor-pointer p-4 rounded-2xl border transition-all ${permissions[perm.key] ? 'bg-indigo-50/50 border-indigo-200' : 'bg-slate-50 border-slate-100 hover:border-slate-300'}`}>
                        <div className={`mt-1 h-5 w-5 rounded-md border-2 transition-all flex items-center justify-center ${permissions[perm.key] ? 'bg-indigo-600 border-indigo-600' : 'bg-white border-slate-300 group-hover/perm:border-indigo-400'}`}>
                          {permissions[perm.key] && <span className="text-white text-[10px]">✓</span>}
                        </div>
                        <input type="checkbox" className="hidden" checked={permissions[perm.key]} onChange={() => handlePermissionChange(perm.key)} />
                        <div className="flex-1">
                          <p className={`text-xs font-bold uppercase tracking-tight transition-colors ${permissions[perm.key] ? 'text-indigo-900' : 'text-slate-800'}`}>{perm.label}</p>
                          <p className="text-[10px] text-slate-400 font-medium leading-relaxed mt-0.5">{perm.description}</p>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default CreateRole;
