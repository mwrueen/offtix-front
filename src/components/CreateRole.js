import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCompanyFilter } from '../hooks/useCompanyFilter';
import { useToast } from '../context/ToastContext';
import { getCookie } from '../utils/cookies';
import Layout from './Layout';
import Input from './common/Input';

const CreateRole = () => {
  const navigate = useNavigate();
  const { state } = useAuth();
  const { selectedCompany } = useCompanyFilter();
  const toast = useToast();

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
    assignEmployeeToProject: false,
    removeEmployeeFromProject: false
  });

  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

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
        { key: 'assignEmployeeToProject', label: 'Assign to Project', description: 'Can assign employees to projects' },
        { key: 'removeEmployeeFromProject', label: 'Remove from Project', description: 'Can remove employees from projects' }
      ]
    }
  ];

  if (!selectedCompany || selectedCompany.id === 'personal') {
    return (
      <Layout>
        <div style={{
          background: 'white',
          padding: '50px',
          borderRadius: '12px',
          textAlign: 'center',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
        }}>
          <h2 style={{ color: '#1e293b', marginBottom: '16px' }}>No Company Selected</h2>
          <p style={{ color: '#64748b', marginBottom: '24px' }}>
            Please select a company to create roles
          </p>
          <button
            onClick={() => navigate('/overview')}
            style={{
              padding: '12px 24px',
              background: 'linear-gradient(135deg, #667eea, #764ba2)',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontWeight: '600'
            }}
          >
            Go to Overview
          </button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div style={{ maxWidth: '900px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{
          background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
          padding: '40px',
          borderRadius: '16px',
          marginBottom: '30px',
          boxShadow: '0 10px 40px rgba(16, 185, 129, 0.2)',
          color: 'white'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '12px' }}>
            <div style={{
              width: '56px',
              height: '56px',
              borderRadius: '14px',
              background: 'rgba(255, 255, 255, 0.2)',
              backdropFilter: 'blur(10px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '2px solid rgba(255, 255, 255, 0.3)'
            }}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                <circle cx="8.5" cy="7" r="4"></circle>
                <polyline points="17 11 19 13 23 9"></polyline>
              </svg>
            </div>
            <div>
              <h1 style={{ margin: '0 0 4px 0', fontSize: '28px', fontWeight: '700' }}>
                Create New Role
              </h1>
              <p style={{ margin: 0, fontSize: '15px', opacity: 0.9 }}>
                Define a new role with custom permissions for {selectedCompany.name}
              </p>
            </div>
          </div>
        </div>

        {/* Form Card */}
        <div style={{
          background: 'white',
          padding: '40px',
          borderRadius: '16px',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
          border: '1px solid #e2e8f0'
        }}>
          <form onSubmit={handleSubmit}>
            {/* Basic Information */}
            <div style={{ marginBottom: '32px' }}>
              <h3 style={{ margin: '0 0 20px 0', fontSize: '18px', fontWeight: '700', color: '#1e293b' }}>
                Basic Information
              </h3>
              
              <div style={{ marginBottom: '20px' }}>
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
            <div style={{ marginBottom: '32px' }}>
              <h3 style={{ margin: '0 0 20px 0', fontSize: '18px', fontWeight: '700', color: '#1e293b' }}>
                Permissions
              </h3>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                {permissionGroups.map((group, index) => (
                  <div key={index} style={{
                    padding: '24px',
                    background: '#f8fafc',
                    borderRadius: '12px',
                    border: '1px solid #e2e8f0'
                  }}>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      marginBottom: '16px',
                      color: '#475569'
                    }}>
                      {group.icon}
                      <h4 style={{ margin: 0, fontSize: '16px', fontWeight: '600' }}>
                        {group.title}
                      </h4>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      {group.permissions.map((perm) => (
                        <label
                          key={perm.key}
                          style={{
                            display: 'flex',
                            alignItems: 'flex-start',
                            gap: '12px',
                            cursor: 'pointer',
                            padding: '12px',
                            background: 'white',
                            borderRadius: '8px',
                            border: '1px solid #e2e8f0',
                            transition: 'all 0.2s'
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.borderColor = '#cbd5e1';
                            e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.05)';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.borderColor = '#e2e8f0';
                            e.currentTarget.style.boxShadow = 'none';
                          }}
                        >
                          <input
                            type="checkbox"
                            checked={permissions[perm.key]}
                            onChange={() => handlePermissionChange(perm.key)}
                            style={{
                              width: '18px',
                              height: '18px',
                              marginTop: '2px',
                              cursor: 'pointer',
                              accentColor: '#10b981'
                            }}
                          />
                          <div style={{ flex: 1 }}>
                            <div style={{ fontWeight: '600', color: '#1e293b', marginBottom: '4px' }}>
                              {perm.label}
                            </div>
                            <div style={{ fontSize: '13px', color: '#64748b' }}>
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
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', paddingTop: '20px', borderTop: '1px solid #e2e8f0' }}>
              <button
                type="button"
                onClick={() => navigate('/manage-roles')}
                disabled={loading}
                style={{
                  padding: '12px 28px',
                  background: 'white',
                  color: '#64748b',
                  border: '1px solid #e2e8f0',
                  borderRadius: '10px',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  fontWeight: '600',
                  fontSize: '15px',
                  transition: 'all 0.2s',
                  opacity: loading ? 0.5 : 1
                }}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                style={{
                  padding: '12px 28px',
                  background: loading ? '#94a3b8' : 'linear-gradient(135deg, #10b981, #059669)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '10px',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  fontWeight: '600',
                  fontSize: '15px',
                  boxShadow: loading ? 'none' : '0 4px 12px rgba(16, 185, 129, 0.3)',
                  transition: 'all 0.2s'
                }}
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

