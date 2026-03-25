import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCompanyFilter } from '../hooks/useCompanyFilter';
import { useToast } from '../context/ToastContext';
import { getCookie } from '../utils/cookies';
import { usePermissions, PERMISSIONS } from '../context/PermissionsContext';
import Layout from './Layout';
import Input from './common/Input';

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


  // No need for local permission check — handled by PermissionsContext

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handlePermissionChange = (permission) => {
    setPermissions(prev => ({
      ...prev,
      [permission]: !prev[permission]
    }));
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Role name is required';
    }

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
    } finally {
      setLoading(false);
    }
  };

  const permissionGroups = [
    {
      title: 'Employee Management',
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
          <circle cx="9" cy="7" r="4"></circle>
          <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
          <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
        </svg>
      ),
      permissions: [
        { key: 'addEmployee', label: 'Add Employee', description: 'Can invite new employees to the company' },
        { key: 'viewEmployeeList', label: 'View Employee List', description: 'Can view all employees in the company' },
        { key: 'editEmployee', label: 'Edit Employee', description: 'Can update employee information and salary' }
      ]
    },
    {
      title: 'Role Management',
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
          <circle cx="8.5" cy="7" r="4"></circle>
          <polyline points="17 11 19 13 23 9"></polyline>
        </svg>
      ),
      permissions: [
        { key: 'createDesignation', label: 'Create Role', description: 'Can create new roles/designations' },
        { key: 'viewDesignations', label: 'View Roles', description: 'Can view all roles/designations' },
        { key: 'editDesignation', label: 'Edit Role', description: 'Can modify role permissions' },
        { key: 'deleteDesignation', label: 'Delete Role', description: 'Can delete roles/designations' }
      ]
    },
    {
      title: 'Project Management',
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path>
        </svg>
      ),
      permissions: [
        { key: 'createProject', label: 'Create Project', description: 'Can create new projects' },
        { key: 'editProject', label: 'Edit Project', description: 'Can edit project details and status' },
        { key: 'deleteProject', label: 'Delete Project', description: 'Can delete projects' },
        { key: 'assignEmployeeToProject', label: 'Assign to Project', description: 'Can assign employees to projects' },
        { key: 'removeEmployeeFromProject', label: 'Remove from Project', description: 'Can remove employees from projects' },
        { key: 'viewProjectAnalytics', label: 'View Analytics', description: 'Can view project reports and analytics' }
      ]
    },
    {
      title: 'Task Management',
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="9 11 12 14 22 4"></polyline>
          <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"></path>
        </svg>
      ),
      permissions: [
        { key: 'createTask', label: 'Create Task', description: 'Can create tasks within projects' },
        { key: 'editTask', label: 'Edit Task', description: 'Can modify task information' },
        { key: 'deleteTask', label: 'Delete Task', description: 'Can delete tasks' }
      ]
    }
  ];

  if (!selectedCompany || selectedCompany.id === 'personal') {
    return (
      <Layout>
        <div className="bg-white p-12 rounded-xl text-center shadow-sm">
          <h2 className="text-slate-800 mb-4">No Company Selected</h2>
          <p className="text-slate-500 mb-6">
            Please select a company to create roles
          </p>
          <button
            onClick={() => navigate('/overview')}
            className="px-6 py-3 bg-gradient-to-br from-indigo-500 to-purple-600 text-white border-0 rounded-lg cursor-pointer font-semibold"
          >
            Go to Overview
          </button>
        </div>
      </Layout>
    );
  }

  if (permLoading) {
    return (
      <Layout>
        <div className="text-center p-12">
          <div className="text-lg text-slate-500">Checking permissions...</div>
        </div>
      </Layout>
    );
  }

  if (!hasPermission(PERMISSIONS.CREATE_DESIGNATION)) {
    return (
      <Layout>
        <div className="bg-white p-12 rounded-xl text-center shadow-sm">
          <div className="text-5xl mb-5">🔒</div>
          <h2 className="text-slate-800 mb-4">Access Denied</h2>
          <p className="text-slate-500 mb-6">
            You don't have permission to create roles
          </p>
          <button
            onClick={() => navigate('/overview')}
            className="px-6 py-3 bg-gradient-to-br from-indigo-500 to-purple-600 text-white border-0 rounded-lg cursor-pointer font-semibold"
          >
            Go to Overview
          </button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 p-10 rounded-2xl mb-8 shadow-2xl shadow-emerald-500/20 text-white">
          <div className="flex items-center gap-4 mb-3">
            <div className="w-14 h-14 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center border-2 border-white/30">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                <circle cx="8.5" cy="7" r="4"></circle>
                <polyline points="17 11 19 13 23 9"></polyline>
              </svg>
            </div>
            <div>
              <h1 className="m-0 mb-1 text-3xl font-bold">
                Create New Role
              </h1>
              <p className="m-0 text-base opacity-90">
                Define a new role with custom permissions for {selectedCompany.name}
              </p>
            </div>
          </div>
        </div>

        {/* Form Card */}
        <div className="bg-white p-10 rounded-2xl shadow-sm border border-slate-200">
          <form onSubmit={handleSubmit}>
            {/* Basic Information */}
            <div className="mb-8">
              <h3 className="m-0 mb-5 text-lg font-bold text-slate-800">
                Basic Information
              </h3>

              <div className="mb-5">
                <Input
                  label="Role Name"
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="e.g., Senior Developer, Marketing Manager"
                  error={errors.name}
                  required
                />
              </div>

              <div>
                <Input
                  label="Description (Optional)"
                  type="textarea"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  placeholder="Describe the responsibilities and expectations for this role"
                  rows={3}
                />
              </div>
            </div>

            {/* Permissions */}
            <div className="mb-8">
              <h3 className="m-0 mb-5 text-lg font-bold text-slate-800">
                Permissions
              </h3>

              <div className="flex flex-col gap-6">
                {permissionGroups.map((group, index) => (
                  <div key={index} className="p-6 bg-slate-50 rounded-xl border border-slate-200">
                    <div className="flex items-center gap-2.5 mb-4 text-slate-600">
                      {group.icon}
                      <h4 className="m-0 text-base font-semibold">
                        {group.title}
                      </h4>
                    </div>

                    <div className="flex flex-col gap-3">
                      {group.permissions.map((perm) => (
                        <label
                          key={perm.key}
                          className="flex items-start gap-3 cursor-pointer p-3 bg-white rounded-lg border border-slate-200 transition-all duration-200 hover:border-slate-300 hover:shadow-sm"
                        >
                          <input
                            type="checkbox"
                            checked={permissions[perm.key]}
                            onChange={() => handlePermissionChange(perm.key)}
                            className="w-4.5 h-4.5 mt-0.5 cursor-pointer accent-emerald-500"
                          />
                          <div className="flex-1">
                            <div className="font-semibold text-slate-800 mb-1">
                              {perm.label}
                            </div>
                            <div className="text-xs text-slate-500">
                              {perm.description}
                            </div>
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 justify-end pt-5 border-t border-slate-200">
              <button
                type="button"
                onClick={() => navigate('/manage-roles')}
                disabled={loading}
                className={`px-7 py-3 bg-white text-slate-500 border border-slate-200 rounded-xl font-semibold text-sm transition-all duration-200 ${
                  loading ? 'cursor-not-allowed opacity-50' : 'cursor-pointer hover:bg-slate-50'
                }`}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className={`px-7 py-3 text-white border-0 rounded-xl font-semibold text-sm transition-all duration-200 ${
                  loading 
                    ? 'bg-slate-400 cursor-not-allowed' 
                    : 'bg-gradient-to-br from-emerald-500 to-emerald-600 cursor-pointer shadow-lg shadow-emerald-500/30 hover:shadow-xl'
                }`}
              >
                {loading ? 'Creating Role...' : 'Create Role'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </Layout>
  );
};

export default CreateRole;

