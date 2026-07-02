import React from 'react';
import { useNavigate } from 'react-router-dom';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import { useAuth } from '../context/AuthContext';
import { useCompanyFilter } from '../hooks/useCompanyFilter';
import { useToast } from '../context/ToastContext';
import { getCookie } from '../utils/cookies';
import { usePermissions, PERMISSIONS } from '../context/PermissionsContext';
import Layout from './Layout';
import PageHeader from './PageHeader';

const CreateRole = () => {
  const navigate = useNavigate();
  const { state } = useAuth();
  const { selectedCompany } = useCompanyFilter();
  const toast = useToast();
  const { hasPermission, loading: permLoading } = usePermissions();

  const [formData, setFormData] = React.useState({
    name: '',
    description: ''
  });

  const [permissions, setPermissions] = React.useState({
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
    deleteTask: false,
    manageRecruitment: false
  });

  const [loading, setLoading] = React.useState(false);
  const [errors, setErrors] = React.useState({});

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
      toast?.showToast?.('Please review the role details', 'error');
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
        toast?.showToast?.('Role created successfully.', 'success');
        navigate('/manage-roles');
      } else {
        const errorData = await response.json();
        toast?.showToast?.(errorData.message || 'Failed to create role', 'error');
      }
    } catch (error) {
      console.error('Error creating role:', error);
      toast?.showToast?.('Failed to create role. Please try again.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const permissionGroups = [
    {
      title: 'Personnel Management',
      icon: '👥',
      permissions: [
        { key: 'addEmployee', label: 'Invite Employees', description: 'Permit sending invitations to new staff.' },
        { key: 'viewEmployeeList', label: 'Directory View', description: 'Access to the company employee list.' },
        { key: 'editEmployee', label: 'Modify Profiles', description: 'Update employee details and roles.' }
      ]
    },
    {
      title: 'Access Control',
      icon: '🛡️',
      permissions: [
        { key: 'createDesignation', label: 'Define New Roles', description: 'Create and configure new authority levels.' },
        { key: 'viewDesignations', label: 'Audit Role List', description: 'Review the organizational role structure.' },
        { key: 'editDesignation', label: 'Modify Permissions', description: 'Update active role configurations.' },
        { key: 'deleteDesignation', label: 'Remove Roles', description: 'Delete existing organizational roles.' }
      ]
    },
    {
      title: 'Project Coordination',
      icon: '📁',
      permissions: [
        { key: 'createProject', label: 'Initiate Projects', description: 'Start new organizational projects.' },
        { key: 'editProject', label: 'Adjust Settings', description: 'Manage project timelines and parameters.' },
        { key: 'deleteProject', label: 'Archive Projects', description: 'Remove or archive completed projects.' },
        { key: 'assignEmployeeToProject', label: 'Resource Allocation', description: 'Assign employees to specific projects.' },
        { key: 'viewProjectAnalytics', label: 'Reporting & Insights', description: 'Access advanced project performance reports.' }
      ]
    },
    {
      title: 'Task Management',
      icon: '✅',
      permissions: [
        { key: 'createTask', label: 'Add Deliverables', description: 'Create new tasks within projects.' },
        { key: 'editTask', label: 'Update Status', description: 'Modify task progress and deadlines.' },
        { key: 'deleteTask', label: 'Remove Tasks', description: 'Delete individual task entries.' }
      ]
    },
    {
      title: 'Recruitment & Hiring',
      icon: '🎯',
      permissions: [
        { key: 'manageRecruitment', label: 'Manage Recruitment', description: 'Access to job creation and applicant lifecycle.' }
      ]
    }
  ];

  if (!selectedCompany || selectedCompany.id === 'personal') {
    return (
      <Layout>
        <div className="bg-white p-20 rounded-3xl text-center shadow-lg border border-slate-200 animate-in fade-in zoom-in-95 duration-500">
          <div className="text-8xl mb-6 opacity-20">🏢</div>
          <h2 className="text-2xl font-bold text-slate-800 tracking-tight">No Company Selected</h2>
          <p className="text-slate-500 mb-10 max-w-sm mx-auto font-medium">
            Please select an active company to define new organizational roles.
          </p>
          <button onClick={() => navigate('/overview')} className="px-10 py-4 bg-indigo-600 text-white rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-slate-900 transition-all shadow-lg active:scale-95">Return to Overview</button>
        </div>
      </Layout>
    );
  }

  if (permLoading) return (
    <Layout>
      <div className="flex flex-col items-center justify-center py-40 animate-in fade-in space-y-6">
        <div className="w-12 h-12 border-4 border-slate-100 border-t-indigo-600 rounded-full animate-spin mx-auto shadow-sm" />
        <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">Validating configuration...</p>
      </div>
    </Layout>
  );

  if (!hasPermission(PERMISSIONS.CREATE_DESIGNATION)) {
    return (
      <Layout>
        <div className="bg-white p-20 rounded-3xl text-center shadow-lg border border-slate-200 animate-in fade-in zoom-in-95 duration-500">
          <div className="text-8xl mb-6 opacity-20">🔒</div>
          <h2 className="text-2xl font-bold text-slate-800 tracking-tight">Access Restricted</h2>
          <p className="text-slate-500 mb-10 max-w-sm mx-auto font-medium">
            You do not have the required permissions to define new roles for this organization.
          </p>
          <button onClick={() => navigate('/overview')} className="px-10 py-4 bg-indigo-600 text-white rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-slate-900 transition-all shadow-lg active:scale-95">Go Back</button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-6xl mx-auto space-y-10 pb-40">
        <PageHeader
          title="New Role Configuration"
          subtitle={`Define permissions and access levels for the ${selectedCompany.name} organization.`}
          icon="🛡️"
          stats={[
            { label: 'Organization', value: selectedCompany.name },
            { label: 'Account', value: state.user?.name || 'Personal' }
          ]}
          actions={
            <div className="flex gap-3">
              <button
                onClick={() => navigate('/manage-roles')}
                className="px-6 py-3 text-[10px] font-bold uppercase tracking-widest text-slate-400 hover:text-rose-600 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={loading}
                className="px-8 py-3 bg-indigo-600 text-white rounded-xl font-bold text-[10px] uppercase tracking-widest shadow-lg hover:bg-slate-900 transition-all active:scale-95 disabled:opacity-50"
              >
                {loading ? 'Creating Role...' : 'Save Role'}
              </button>
            </div>
          }
        />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-4 space-y-6">
            <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm space-y-8">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-4 flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                Role Details
              </h3>
              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Role Name</label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="e.g. Project Manager"
                    className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-900 outline-none focus:bg-white focus:border-indigo-400 transition-all"
                  />
                  {errors.name && <p className="text-[10px] text-rose-500 font-bold ml-1">{errors.name}</p>}
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Description</label>
                  <div className="rounded-xl border border-slate-200 overflow-hidden bg-slate-50 focus-within:bg-white focus-within:border-indigo-400 transition-all [&_.ql-toolbar]:border-none [&_.ql-toolbar]:bg-slate-100/50 [&_.ql-container]:border-none [&_.ql-editor]:text-sm [&_.ql-editor]:text-slate-600 [&_.ql-editor]:min-h-[160px] [&_.ql-editor]:font-medium">
                    <ReactQuill
                      theme="snow"
                      value={formData.description}
                      onChange={(val) => setFormData(prev => ({ ...prev, description: val }))}
                      placeholder="Briefly describe the responsibilities associated with this role..."
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-slate-900 p-8 rounded-2xl text-white shadow-xl border border-white/5">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 rounded-lg bg-indigo-500 flex items-center justify-center text-lg">💡</div>
                <h4 className="text-[10px] font-bold uppercase tracking-widest text-indigo-400">Configuration Note</h4>
              </div>
              <p className="text-xs text-slate-400 font-medium leading-relaxed">
                Roles define what users can see and do. Be selective with administrative permissions to maintain organizational security.
              </p>
            </div>
          </div>

          <div className="lg:col-span-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {permissionGroups.map((group, index) => (
                <div key={index} className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm space-y-6">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-xl bg-slate-50 w-10 h-10 flex items-center justify-center rounded-xl">{group.icon}</span>
                    <h4 className="text-xs font-bold text-slate-900 uppercase tracking-widest">{group.title}</h4>
                  </div>
                  <div className="space-y-2.5">
                    {group.permissions.map((perm) => (
                      <label
                        key={perm.key}
                        className={`group flex items-start gap-4 cursor-pointer p-4 rounded-xl border transition-all 
                          ${permissions[perm.key] ? 'bg-indigo-50 border-indigo-200 ring-2 ring-indigo-50' : 'bg-slate-50/50 border-slate-100 hover:border-slate-300'}`}
                      >
                        <div className={`mt-0.5 h-5 w-5 rounded-md border-2 transition-all flex items-center justify-center shrink-0 
                          ${permissions[perm.key] ? 'bg-indigo-600 border-indigo-600' : 'bg-white border-slate-200 group-hover:border-indigo-400'}`}>
                          {permissions[perm.key] && (
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" className="text-white">
                              <polyline points="20 6 9 17 4 12" />
                            </svg>
                          )}
                        </div>
                        <input type="checkbox" className="hidden" checked={permissions[perm.key]} onChange={() => handlePermissionChange(perm.key)} />
                        <div className="flex-1">
                          <p className={`text-[11px] font-bold uppercase tracking-tight ${permissions[perm.key] ? 'text-indigo-900' : 'text-slate-800'}`}>
                            {perm.label}
                          </p>
                          <p className="text-[10px] text-slate-400 font-medium leading-normal mt-0.5">{perm.description}</p>
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

