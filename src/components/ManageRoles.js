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

// Permission categories for better organization
const permissionCategories = [
  {
    title: 'Employee Management',
    icon: '👥',
    permissions: [
      { key: 'addEmployee', label: 'Add Employee', description: 'Can add new employees to the company' },
      { key: 'viewEmployeeList', label: 'View Employees', description: 'Can view the list of all employees' },
      { key: 'editEmployee', label: 'Edit Employee', description: 'Can modify employee information' }
    ]
  },
  {
    title: 'Role Management',
    icon: '🛡️',
    permissions: [
      { key: 'createDesignation', label: 'Create Role', description: 'Can create new roles/designations' },
      { key: 'viewDesignations', label: 'View Roles', description: 'Can view all roles/designations' },
      { key: 'editDesignation', label: 'Edit Role', description: 'Can modify role permissions' },
      { key: 'deleteDesignation', label: 'Delete Role', description: 'Can delete roles/designations' }
    ]
  },
  {
    title: 'Project Management',
    icon: '📋',
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
    icon: '✅',
    permissions: [
      { key: 'createTask', label: 'Create Task', description: 'Can create tasks within projects' },
      { key: 'editTask', label: 'Edit Task', description: 'Can modify task information' },
      { key: 'deleteTask', label: 'Delete Task', description: 'Can delete tasks' }
    ]
  },
  {
    title: 'Company Settings',
    icon: '⚙️',
    permissions: [
      { key: 'manageCompanySettings', label: 'Manage Settings', description: 'Can modify company settings' }
    ]
  }
];

const ManageRoles = () => {
  const navigate = useNavigate();
  const { state } = useAuth();
  const { selectedCompany } = useCompanyFilter();
  const toast = useToast();
  const { hasPermission, PERMISSIONS: PERMS } = usePermissions();

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
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setCompany(data);
      }
    } catch (error) {
      console.error('Error fetching company:', error);
      toast?.showToast?.('Failed to load company data', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteRole = async (designationId) => {
    try {
      const token = getCookie('authToken');
      const response = await fetch(`/api/companies/${selectedCompany.id}/designations/${designationId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        toast?.showToast?.('Role deleted successfully', 'success');
        fetchCompany();
        setShowDeleteConfirm(null);
      } else {
        const errorData = await response.json();
        toast?.showToast?.(errorData.message || 'Failed to delete role', 'error');
      }
    } catch (error) {
      console.error('Error deleting role:', error);
      toast?.showToast?.('Failed to delete role. Please try again.', 'error');
    }
  };

  const handleEditRole = (designation) => {
    setEditingRole(designation);
    setEditPermissions({ ...designation.permissions });
  };

  const handlePermissionToggle = (key) => {
    setEditPermissions(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const handleSavePermissions = async () => {
    if (!editingRole) return;

    setSaving(true);
    try {
      const token = getCookie('authToken');
      const response = await fetch(`/api/companies/${selectedCompany.id}/designation-permissions`, {
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

      if (response.ok) {
        toast?.showToast?.('Permissions updated successfully', 'success');
        fetchCompany();
        setEditingRole(null);
        setEditPermissions({});
      } else {
        const errorData = await response.json();
        toast?.showToast?.(errorData.message || 'Failed to update permissions', 'error');
      }
    } catch (error) {
      console.error('Error updating permissions:', error);
      toast?.showToast?.('Failed to update permissions. Please try again.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const getPermissionCount = (permissions) => {
    if (!permissions) return 0;
    return Object.values(permissions).filter(Boolean).length;
  };

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
            Please select a company to manage roles
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

  if (loading) {
    return (
      <Layout>
        <div style={{ textAlign: 'center', padding: '50px' }}>
          <div style={{ fontSize: '18px', color: '#64748b' }}>Loading roles...</div>
        </div>
      </Layout>
    );
  }

  if (!hasPermission(PERMISSIONS.VIEW_DESIGNATIONS)) {
    return (
      <Layout>
        <div style={{
          background: 'white',
          padding: '50px',
          borderRadius: '12px',
          textAlign: 'center',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
        }}>
          <div style={{ fontSize: '48px', marginBottom: '20px' }}>🔒</div>
          <h2 style={{ color: '#1e293b', marginBottom: '16px' }}>Access Denied</h2>
          <p style={{ color: '#64748b', marginBottom: '24px' }}>
            You don't have permission to view or manage roles
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
      <PageHeader
        title="Manage Roles"
        subtitle={`${company?.designations?.length || 0} roles in ${selectedCompany.name}`}
        icon={
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
            <circle cx="8.5" cy="7" r="4"></circle>
            <polyline points="17 11 19 13 23 9"></polyline>
          </svg>
        }
        actions={
          hasPermission(PERMISSIONS.CREATE_DESIGNATION) && (
            <button
              onClick={() => navigate('/create-role')}
              style={{
                padding: '12px 24px',
                background: 'white',
                color: '#8b5cf6',
                border: 'none',
                borderRadius: '10px',
                cursor: 'pointer',
                fontWeight: '600',
                fontSize: '14px',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="5" x2="12" y2="19"></line>
                <line x1="5" y1="12" x2="19" y2="12"></line>
              </svg>
              Create New Role
            </button>
          )
        }
      />

      {/* Roles Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))',
        gap: '20px'
      }}>
        {company?.designations?.map((designation, index) => (
          <div
            key={index}
            style={{
              background: 'white',
              padding: '28px',
              borderRadius: '16px',
              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
              border: '1px solid #e2e8f0',
              transition: 'all 0.2s',
              cursor: 'pointer'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.boxShadow = '0 8px 24px rgba(0, 0, 0, 0.12)';
              e.currentTarget.style.transform = 'translateY(-4px)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.boxShadow = '0 1px 3px rgba(0, 0, 0, 0.1)';
              e.currentTarget.style.transform = 'translateY(0)';
            }}
            onClick={() => setSelectedRole(selectedRole === designation ? null : designation)}
          >
            <div style={{ marginBottom: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                <h3 style={{ margin: 0, fontSize: '20px', fontWeight: '700', color: '#1e293b' }}>
                  {designation.name}
                </h3>
                <span style={{ padding: '4px 12px', background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)', color: 'white', borderRadius: '12px', fontSize: '12px', fontWeight: '600' }}>
                  {getPermissionCount(designation.permissions)} permissions
                </span>
              </div>
              {designation.description && (
                <p style={{ margin: '8px 0 0 0', fontSize: '14px', color: '#64748b', lineHeight: '1.5' }}>
                  {designation.description}
                </p>
              )}
            </div>

            {selectedRole === designation && designation.permissions && (
              <div style={{ marginTop: '20px', paddingTop: '20px', borderTop: '1px solid #e2e8f0' }}>
                <h4 style={{ margin: '0 0 12px 0', fontSize: '14px', fontWeight: '600', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Permissions
                </h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {Object.entries(designation.permissions).map(([key, value]) => (
                    value && (
                      <div key={key} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: '#10b981' }}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="20 6 9 17 4 12"></polyline>
                        </svg>
                        <span>{key.replace(/([A-Z])/g, ' $1').trim()}</span>
                      </div>
                    )
                  ))}
                </div>

                {(hasPermission(PERMISSIONS.EDIT_DESIGNATION) || hasPermission(PERMISSIONS.DELETE_DESIGNATION)) && (
                  <div style={{ display: 'flex', gap: '8px', marginTop: '20px', paddingTop: '16px', borderTop: '1px solid #e2e8f0' }}>
                    {hasPermission(PERMISSIONS.EDIT_DESIGNATION) && (
                      <button
                        onClick={(e) => { e.stopPropagation(); handleEditRole(designation); }}
                        style={{ flex: 1, padding: '10px', background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '600', fontSize: '13px' }}
                      >
                        Edit
                      </button>
                    )}
                    {hasPermission(PERMISSIONS.DELETE_DESIGNATION) && (
                      <button
                        onClick={(e) => { e.stopPropagation(); setShowDeleteConfirm(designation); }}
                        style={{ flex: 1, padding: '10px', background: 'linear-gradient(135deg, #ef4444, #dc2626)', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '600', fontSize: '13px' }}
                      >
                        Delete
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {(!company?.designations || company.designations.length === 0) && (
        <div style={{ background: 'white', padding: '60px', borderRadius: '16px', textAlign: 'center', boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)' }}>
          <h3 style={{ margin: '0 0 12px 0', fontSize: '20px', fontWeight: '600', color: '#1e293b' }}>No Roles Yet</h3>
          <button
            onClick={() => navigate('/create-role')}
            style={{ padding: '12px 28px', background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)', color: 'white', border: 'none', borderRadius: '10px', cursor: 'pointer', fontWeight: '600' }}
          >
            Create First Role
          </button>
        </div>
      )}

      <DeleteConfirmModal
        isOpen={!!showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(null)}
        onConfirm={() => handleDeleteRole(showDeleteConfirm?._id)}
        title="Delete Role"
        message={`Are you sure you want to delete "${showDeleteConfirm?.name}"? This action cannot be undone.`}
        itemName={showDeleteConfirm?.name}
      />

      {editingRole && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0, 0, 0, 0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, backdropFilter: 'blur(4px)', padding: '20px' }} onClick={() => { setEditingRole(null); setEditPermissions({}); }}>
          <div style={{ background: 'white', borderRadius: '20px', maxWidth: '700px', width: '100%', maxHeight: '90vh', overflow: 'hidden', boxShadow: '0 25px 80px rgba(0, 0, 0, 0.3)', display: 'flex', flexDirection: 'column' }} onClick={(e) => e.stopPropagation()}>
            <div style={{ padding: '24px 28px', borderBottom: '1px solid #e2e8f0', background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)', color: 'white' }}>
              <h2 style={{ margin: 0, fontSize: '22px', fontWeight: '700' }}>Edit Permissions</h2>
              <p style={{ margin: '4px 0 0 0', fontSize: '14px', opacity: 0.9 }}>{editingRole.name}</p>
            </div>
            <div style={{ padding: '24px 28px', overflowY: 'auto', flex: 1 }}>
              {permissionCategories.map((category, catIndex) => (
                <div key={catIndex} style={{ marginBottom: '24px' }}>
                  <h3 style={{ margin: '0 0 16px 0', fontSize: '16px', fontWeight: '600', color: '#1e293b' }}>{category.title}</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {category.permissions.map((perm) => (
                      <div key={perm.key} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 16px', background: editPermissions[perm.key] ? '#f0fdf4' : '#f8fafc', borderRadius: '10px', border: `1px solid ${editPermissions[perm.key] ? '#86efac' : '#e2e8f0'}` }}>
                        <div>
                          <div style={{ fontWeight: '600', fontSize: '14px' }}>{perm.label}</div>
                          <div style={{ fontSize: '12px', color: '#64748b' }}>{perm.description}</div>
                        </div>
                        <button onClick={() => handlePermissionToggle(perm.key)} style={{ width: '48px', height: '26px', borderRadius: '13px', border: 'none', background: editPermissions[perm.key] ? '#10b981' : '#cbd5e1', cursor: 'pointer', position: 'relative' }}>
                          <div style={{ width: '22px', height: '22px', borderRadius: '50%', background: 'white', position: 'absolute', top: '2px', left: editPermissions[perm.key] ? '24px' : '2px', transition: 'all 0.2s' }}></div>
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            <div style={{ padding: '20px 28px', borderTop: '1px solid #e2e8f0', display: 'flex', gap: '12px', justifyContent: 'flex-end', background: '#f8fafc' }}>
              <button onClick={() => { setEditingRole(null); setEditPermissions({}); }} style={{ padding: '12px 24px', background: 'white', border: '1px solid #e2e8f0', borderRadius: '10px', cursor: 'pointer' }}>Cancel</button>
              <button onClick={handleSavePermissions} disabled={saving} style={{ padding: '12px 24px', background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)', color: 'white', border: 'none', borderRadius: '10px', cursor: 'pointer', fontWeight: '600' }}>{saving ? 'Saving...' : 'Save Changes'}</button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default ManageRoles;
