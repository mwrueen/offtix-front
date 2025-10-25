import React, { useState } from 'react';
import { useCompany } from '../../context/CompanyContext';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import Layout from '../Layout';
import CompanyForm from './CompanyForm';
import MemberForm from './MemberForm';
import { companyApi } from '../../services/companyApi';

const SalaryForm = ({ member, onClose, onUpdate }) => {
  const [salary, setSalary] = useState(member.currentSalary || 0);
  const [reason, setReason] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    onUpdate(member._id, salary, reason);
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      backgroundColor: 'rgba(0,0,0,0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 50
    }}>
      <div style={{
        backgroundColor: 'white',
        borderRadius: '12px',
        padding: '32px',
        width: '100%',
        maxWidth: '400px'
      }}>
        <h3 style={{ margin: '0 0 16px 0', fontSize: '18px', fontWeight: '600' }}>Update Salary</h3>
        <p style={{ margin: '0 0 24px 0', color: '#64748b' }}>Employee: {member.user?.name}</p>
        
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500' }}>New Salary</label>
            <input
              type="number"
              value={salary}
              onChange={(e) => setSalary(Number(e.target.value))}
              style={{
                width: '100%',
                padding: '12px 16px',
                border: '1px solid #d1d5db',
                borderRadius: '8px',
                fontSize: '14px',
                boxSizing: 'border-box'
              }}
            />
          </div>
          
          <div style={{ marginBottom: '24px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500' }}>Reason</label>
            <input
              type="text"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g., Annual increment, Promotion"
              style={{
                width: '100%',
                padding: '12px 16px',
                border: '1px solid #d1d5db',
                borderRadius: '8px',
                fontSize: '14px',
                boxSizing: 'border-box'
              }}
            />
          </div>
          
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: '12px 24px',
                backgroundColor: 'white',
                color: '#374151',
                border: '1px solid #d1d5db',
                borderRadius: '8px',
                cursor: 'pointer'
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              style={{
                padding: '12px 24px',
                backgroundColor: '#3b82f6',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer'
              }}
            >
              Update Salary
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const DesignationForm = ({ onClose, onAdd }) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    onAdd(name, description);
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      backgroundColor: 'rgba(0,0,0,0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 50
    }}>
      <div style={{
        backgroundColor: 'white',
        borderRadius: '12px',
        padding: '32px',
        width: '100%',
        maxWidth: '400px'
      }}>
        <h3 style={{ margin: '0 0 24px 0', fontSize: '18px', fontWeight: '600' }}>Add Designation</h3>
        
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500' }}>Designation Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              style={{
                width: '100%',
                padding: '12px 16px',
                border: '1px solid #d1d5db',
                borderRadius: '8px',
                fontSize: '14px',
                boxSizing: 'border-box'
              }}
            />
          </div>
          
          <div style={{ marginBottom: '24px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500' }}>Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows="3"
              style={{
                width: '100%',
                padding: '12px 16px',
                border: '1px solid #d1d5db',
                borderRadius: '8px',
                fontSize: '14px',
                boxSizing: 'border-box',
                resize: 'vertical'
              }}
            />
          </div>
          
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: '12px 24px',
                backgroundColor: 'white',
                color: '#374151',
                border: '1px solid #d1d5db',
                borderRadius: '8px',
                cursor: 'pointer'
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              style={{
                padding: '12px 24px',
                backgroundColor: '#3b82f6',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer'
              }}
            >
              Add Designation
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const ChangeDesignationForm = ({ member, designations, onClose, onUpdate }) => {
  const [selectedDesignation, setSelectedDesignation] = useState(member.designation || '');

  const handleSubmit = (e) => {
    e.preventDefault();
    onUpdate(member._id, selectedDesignation);
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      backgroundColor: 'rgba(0,0,0,0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 50
    }}>
      <div style={{
        backgroundColor: 'white',
        borderRadius: '12px',
        padding: '32px',
        width: '100%',
        maxWidth: '400px'
      }}>
        <h3 style={{ margin: '0 0 16px 0', fontSize: '18px', fontWeight: '600' }}>Change Designation</h3>
        <p style={{ margin: '0 0 24px 0', color: '#64748b' }}>Employee: {member.user?.name}</p>
        
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '24px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500' }}>Select Designation</label>
            <select
              value={selectedDesignation}
              onChange={(e) => setSelectedDesignation(e.target.value)}
              required
              style={{
                width: '100%',
                padding: '12px 16px',
                border: '1px solid #d1d5db',
                borderRadius: '8px',
                fontSize: '14px',
                boxSizing: 'border-box',
                backgroundColor: 'white'
              }}
            >
              <option value="">Select a designation</option>
              {designations.map((designation, index) => (
                <option key={index} value={designation.name}>
                  {designation.name}
                </option>
              ))}
            </select>
          </div>
          
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: '12px 24px',
                backgroundColor: 'white',
                color: '#374151',
                border: '1px solid #d1d5db',
                borderRadius: '8px',
                cursor: 'pointer'
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              style={{
                padding: '12px 24px',
                backgroundColor: '#3b82f6',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer'
              }}
            >
              Update Designation
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const CompanyManagement = () => {
  const { company, loading, fetchMyCompany } = useCompany();
  const { state } = useAuth();
  const toast = useToast();
  const [showCompanyForm, setShowCompanyForm] = useState(false);
  const [showMemberForm, setShowMemberForm] = useState(false);
  const [activeTab, setActiveTab] = useState('employees');
  const [showSalaryForm, setShowSalaryForm] = useState(null);
  const [showDesignationForm, setShowDesignationForm] = useState(false);
  const [showPermissionForm, setShowPermissionForm] = useState(null);
  const [showChangeDesignationForm, setShowChangeDesignationForm] = useState(null);
  
  // Get user permissions
  const userPermission = company?.permissions?.find(p => p.user?._id === state.user?._id);
  const isOwner = company?.owner?._id === state.user?._id;
  const isSuperAdmin = state.user?.role === 'superadmin';
  
  const canManageEmployees = isSuperAdmin || isOwner || userPermission?.canManageEmployees;
  const canManageDesignations = isSuperAdmin || isOwner || userPermission?.canManageDesignations;
  const canManageSalaries = isSuperAdmin || isOwner || userPermission?.canManageSalaries;

  if (loading) return <Layout><div style={{ textAlign: 'center', padding: '50px' }}>Loading company...</div></Layout>;

  if (!company) {
    return (
      <Layout>
        <div style={{
          textAlign: 'center',
          padding: '60px 40px',
          backgroundColor: 'white',
          borderRadius: '12px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
        }}>
          <div style={{ fontSize: '48px', marginBottom: '20px' }}>🏢</div>
          <h3 style={{ margin: '0 0 10px 0', color: '#1e293b' }}>No company yet</h3>
          <p style={{ margin: '0 0 20px 0', color: '#64748b' }}>Create your company to manage teams and projects!</p>
          <button
            onClick={() => setShowCompanyForm(true)}
            style={{
              padding: '12px 24px',
              backgroundColor: '#3b82f6',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontWeight: '600'
            }}
          >
            Create Company
          </button>
        </div>
        {showCompanyForm && <CompanyForm onClose={() => setShowCompanyForm(false)} />}
      </Layout>
    );
  }

  const handleSalaryUpdate = async (memberId, newSalary, reason) => {
    try {
      await companyApi.updateMemberSalary(company._id, { memberId, newSalary, reason });
      await fetchMyCompany();
      toast.success('Salary updated successfully!');
      setShowSalaryForm(null);
    } catch (error) {
      toast.error('Error updating salary: ' + (error.response?.data?.message || 'Please try again'));
    }
  };

  const handleAddDesignation = async (name, description) => {
    try {
      await companyApi.addDesignation(company._id, { name, description });
      await fetchMyCompany();
      toast.success('Designation added successfully!');
      setShowDesignationForm(false);
    } catch (error) {
      toast.error('Error adding designation: ' + (error.response?.data?.message || 'Please try again'));
    }
  };

  const handleChangeDesignation = async (memberId, newDesignation) => {
    try {
      await companyApi.updateMemberDesignation(company._id, { memberId, designation: newDesignation });
      await fetchMyCompany();
      toast.success('Designation updated successfully!');
      setShowChangeDesignationForm(null);
    } catch (error) {
      toast.error('Error updating designation: ' + (error.response?.data?.message || 'Please try again'));
    }
  };

  const tabs = [
    { id: 'employees', label: 'Employees', icon: '👥' },
    { id: 'designations', label: 'Designations', icon: '🏆' },
    { id: 'permissions', label: 'Permissions', icon: '🔐' }
  ];

  const renderEmployees = () => (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '600', color: '#1e293b' }}>Team Members</h3>
        {canManageEmployees && (
          <button
            onClick={() => setShowMemberForm(true)}
            style={{
              padding: '8px 16px',
              backgroundColor: '#3b82f6',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '14px'
            }}
          >
            + Add Employee
          </button>
        )}
      </div>
      
      {company.members?.map((member) => (
        <div key={member._id} style={{
          padding: '20px',
          backgroundColor: '#f8fafc',
          borderRadius: '8px',
          marginBottom: '16px',
          border: '1px solid #e2e8f0'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{
                width: '40px',
                height: '40px',
                backgroundColor: '#3b82f6',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                fontWeight: '600',
                fontSize: '14px'
              }}>
                {member.user?.name?.charAt(0)?.toUpperCase() || '?'}
              </div>
              <div>
                <h4 style={{ margin: '0 0 2px 0', color: '#1e293b', fontSize: '16px', fontWeight: '600' }}>
                  {member.user?.name || 'Unknown User'}
                </h4>
                <p style={{ margin: 0, color: '#64748b', fontSize: '14px' }}>
                  {member.designation} • ${member.currentSalary?.toLocaleString() || '0'}/month
                </p>
              </div>
            </div>
            
            <div style={{ display: 'flex', gap: '8px' }}>
              {canManageEmployees && (
                <button
                  onClick={() => setShowChangeDesignationForm(member)}
                  style={{
                    padding: '6px 12px',
                    backgroundColor: '#8b5cf6',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '12px'
                  }}
                >
                  Change Role
                </button>
              )}
              {canManageSalaries && (
                <button
                  onClick={() => setShowSalaryForm(member)}
                  style={{
                    padding: '6px 12px',
                    backgroundColor: '#10b981',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '12px'
                  }}
                >
                  Update Salary
                </button>
              )}
              {isOwner && (
                <button
                  onClick={() => setShowPermissionForm(member)}
                  style={{
                    padding: '6px 12px',
                    backgroundColor: '#f59e0b',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '12px'
                  }}
                >
                  Permissions
                </button>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );

  const renderDesignations = () => (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '600', color: '#1e293b' }}>Company Designations</h3>
        {canManageDesignations && (
          <button
            onClick={() => setShowDesignationForm(true)}
            style={{
              padding: '8px 16px',
              backgroundColor: '#3b82f6',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '14px'
            }}
          >
            + Add Designation
          </button>
        )}
      </div>
      
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '16px' }}>
        {company.designations?.map((designation, index) => (
          <div key={index} style={{
            padding: '16px',
            backgroundColor: '#f8fafc',
            borderRadius: '8px',
            border: '1px solid #e2e8f0'
          }}>
            <h4 style={{ margin: '0 0 8px 0', color: '#1e293b', fontSize: '16px', fontWeight: '600' }}>
              {designation.name}
            </h4>
            <p style={{ margin: 0, color: '#64748b', fontSize: '14px' }}>
              {designation.description || 'No description'}
            </p>
          </div>
        ))}
      </div>
    </div>
  );

  const renderPermissions = () => (
    <div>
      <h3 style={{ margin: '0 0 24px 0', fontSize: '18px', fontWeight: '600', color: '#1e293b' }}>User Permissions</h3>
      
      {company.permissions?.map((permission) => (
        <div key={permission._id} style={{
          padding: '20px',
          backgroundColor: '#f8fafc',
          borderRadius: '8px',
          marginBottom: '16px',
          border: '1px solid #e2e8f0'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h4 style={{ margin: '0 0 4px 0', color: '#1e293b', fontSize: '16px', fontWeight: '600' }}>
                {permission.user?.name}
              </h4>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {permission.canManageEmployees && <span style={{ padding: '2px 8px', backgroundColor: '#d1fae5', color: '#065f46', borderRadius: '12px', fontSize: '12px' }}>Employees</span>}
                {permission.canManageDesignations && <span style={{ padding: '2px 8px', backgroundColor: '#dbeafe', color: '#1e40af', borderRadius: '12px', fontSize: '12px' }}>Designations</span>}
                {permission.canManageProjects && <span style={{ padding: '2px 8px', backgroundColor: '#fef3c7', color: '#92400e', borderRadius: '12px', fontSize: '12px' }}>Projects</span>}
                {permission.canManageClients && <span style={{ padding: '2px 8px', backgroundColor: '#e0e7ff', color: '#3730a3', borderRadius: '12px', fontSize: '12px' }}>Clients</span>}
                {permission.canManageSalaries && <span style={{ padding: '2px 8px', backgroundColor: '#fed7aa', color: '#9a3412', borderRadius: '12px', fontSize: '12px' }}>Salaries</span>}
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <Layout>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '30px'
      }}>
        <div>
          <h2 style={{ margin: '0 0 5px 0', color: '#1e293b', fontSize: '24px' }}>{company.name}</h2>
          <p style={{ margin: 0, color: '#64748b' }}>{company.description || 'Manage your company team and organization'}</p>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '24px' }}>
        {/* Tab Navigation */}
        <div style={{
          width: '200px',
          backgroundColor: 'white',
          borderRadius: '12px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
          border: '1px solid #e2e8f0',
          padding: '20px',
          height: 'fit-content'
        }}>
          {tabs.map((tab) => (
            <div
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                padding: '12px 16px',
                borderRadius: '8px',
                cursor: 'pointer',
                marginBottom: '4px',
                backgroundColor: activeTab === tab.id ? '#3b82f6' : 'transparent',
                color: activeTab === tab.id ? 'white' : '#374151',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                fontSize: '14px',
                fontWeight: '500',
                transition: 'all 0.2s'
              }}
            >
              <span>{tab.icon}</span>
              {tab.label}
            </div>
          ))}
        </div>

        {/* Tab Content */}
        <div style={{ flex: 1 }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '12px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
            border: '1px solid #e2e8f0',
            padding: '32px'
          }}>
            {activeTab === 'employees' && renderEmployees()}
            {activeTab === 'designations' && renderDesignations()}
            {activeTab === 'permissions' && renderPermissions()}
          </div>
        </div>
      </div>

      {showMemberForm && <MemberForm onClose={() => setShowMemberForm(false)} />}
      {showSalaryForm && (
        <SalaryForm 
          member={showSalaryForm} 
          onClose={() => setShowSalaryForm(null)}
          onUpdate={handleSalaryUpdate}
        />
      )}
      {showDesignationForm && (
        <DesignationForm 
          onClose={() => setShowDesignationForm(false)}
          onAdd={handleAddDesignation}
        />
      )}
      {showChangeDesignationForm && (
        <ChangeDesignationForm 
          member={showChangeDesignationForm}
          designations={company.designations || []}
          onClose={() => setShowChangeDesignationForm(null)}
          onUpdate={handleChangeDesignation}
        />
      )}
    </Layout>
  );
};

export default CompanyManagement;