import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useCompanyFilter } from '../hooks/useCompanyFilter';
import { useNavigate } from 'react-router-dom';
import { getCookie } from '../utils/cookies';
import Layout from './Layout';

const Company = () => {
  const { state } = useAuth();
  const { selectedCompany } = useCompanyFilter();
  const navigate = useNavigate();
  const [company, setCompany] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showAddEmployee, setShowAddEmployee] = useState(false);
  const [showSalaryUpdate, setShowSalaryUpdate] = useState(null);
  const [showRoleUpdate, setShowRoleUpdate] = useState(null);
  const [showCreateCompany, setShowCreateCompany] = useState(false);
  const [showCreateDesignation, setShowCreateDesignation] = useState(false);
  const [showDesignations, setShowDesignations] = useState(false);

  useEffect(() => {
    if (selectedCompany) {
      fetchCompany();
    }
  }, [selectedCompany]);

  const fetchCompany = async () => {
    if (!selectedCompany) {
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const token = getCookie('authToken');

      // Handle Personal mode
      if (selectedCompany.id === 'personal') {
        setCompany(null);
        setLoading(false);
        return;
      }

      // Fetch specific company data
      const response = await fetch(`/api/companies/${selectedCompany.id}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setCompany(data);
      } else {
        const errorData = await response.text();
        console.log('Company not found or error:', response.status, errorData);
        setCompany(null);
      }
    } catch (error) {
      console.error('Error fetching company:', error);
      setCompany(null);
    } finally {
      setLoading(false);
    }
  };

  // Comprehensive company creator check with debugging
  const isCompanyCreator = company && state.user && (
    company.owner?._id === state.user.id ||
    company.owner?.toString() === state.user.id?.toString() ||
    company.owner === state.user.id ||
    String(company.owner?._id) === String(state.user.id)
  );

  // Debug logging
  console.log('=== COMPANY CREATOR DEBUG ===');
  console.log('Company:', company);
  console.log('Company owner:', company?.owner);
  console.log('Company owner ID:', company?.owner?._id);
  console.log('Current user:', state.user);
  console.log('Current user ID:', state.user?.id);
  console.log('Is company creator:', isCompanyCreator);
  console.log('Auth state:', state);
  console.log('============================');

  if (loading) {
    return (
      <Layout>
        <div style={{ textAlign: 'center', padding: '50px' }}>Loading...</div>
      </Layout>
    );
  }

  if (!company) {
    return (
      <Layout>


        <div style={{
          backgroundColor: 'white',
          padding: '50px',
          borderRadius: '12px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '48px', marginBottom: '20px' }}>
            {selectedCompany?.id === 'personal' ? '👤' : '🏢'}
          </div>
          <h2 style={{ margin: '0 0 10px 0', color: '#1e293b' }}>
            {selectedCompany?.id === 'personal' ? 'Personal Mode' : 'No Company Data'}
          </h2>
          <p style={{ margin: '0 0 30px 0', color: '#64748b' }}>
            {selectedCompany?.id === 'personal'
              ? 'You are in personal mode. Switch to a company to view company overview.'
              : 'No company data available or you may not have access to this company.'}
          </p>
          {selectedCompany?.id === 'personal' && (
            <button
              onClick={() => setShowCreateCompany(true)}
              style={{
                padding: '12px 24px',
                backgroundColor: '#3b82f6',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontWeight: '500'
              }}
            >
              Create Company
            </button>
          )}
        </div>

        {showCreateCompany && (
          <CreateCompanyModal
            onClose={() => setShowCreateCompany(false)}
            onSuccess={() => {
              setShowCreateCompany(false);
              fetchCompany();
            }}
          />
        )}
      </Layout>
    );
  }

  return (
    <Layout>
      <div style={{
        backgroundColor: 'white',
        padding: '30px',
        borderRadius: '12px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
        marginBottom: '30px'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <div>
            <h2 style={{ margin: '0 0 5px 0', color: '#1e293b' }}>{company.name}</h2>
            <p style={{ margin: 0, color: '#64748b' }}>{company.description}</p>
          </div>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            {/* Always show button for debugging - remove condition temporarily */}
            <button
              onClick={() => setShowAddEmployee(true)}
              style={{
                padding: '12px 24px',
                backgroundColor: '#3b82f6',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontWeight: '500'
              }}
            >
              Add Employee
            </button>
            <button
              onClick={() => setShowCreateDesignation(true)}
              style={{
                padding: '12px 24px',
                backgroundColor: '#10b981',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontWeight: '500'
              }}
            >
              Create Designation
            </button>
            <button
              onClick={() => setShowDesignations(true)}
              style={{
                padding: '12px 24px',
                backgroundColor: '#8b5cf6',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontWeight: '500'
              }}
            >
              Manage Designations
            </button>


          </div>
        </div>

        <div style={{ marginBottom: '30px' }}>
          <h3 style={{ margin: '0 0 15px 0', color: '#1e293b' }}>Company Statistics</h3>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '15px'
          }}>
            <div style={{
              padding: '20px',
              backgroundColor: '#f8fafc',
              borderRadius: '8px',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#3b82f6' }}>
                {company.members?.length || 0}
              </div>
              <div style={{ fontSize: '14px', color: '#64748b' }}>Total Employees</div>
            </div>
            <div style={{
              padding: '20px',
              backgroundColor: '#f8fafc',
              borderRadius: '8px',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#10b981' }}>
                {company.designations?.length || 0}
              </div>
              <div style={{ fontSize: '14px', color: '#64748b' }}>Designations</div>
            </div>
          </div>
        </div>

        <div>
          <h3 style={{ margin: '0 0 20px 0', color: '#1e293b' }}>Employees</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            {company.members?.map((member) => (
              <div key={member._id} style={{
                padding: '20px',
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <div>
                  <div style={{ fontWeight: 'bold', color: '#1e293b' }}>
                    {member.user?.name}
                  </div>
                  <div style={{ fontSize: '14px', color: '#64748b' }}>
                    {member.user?.email}
                  </div>
                  <div style={{ fontSize: '14px', color: '#64748b', marginTop: '5px' }}>
                    <span style={{
                      padding: '2px 8px',
                      backgroundColor: '#3b82f615',
                      color: '#3b82f6',
                      borderRadius: '10px',
                      fontSize: '12px',
                      fontWeight: 'bold',
                      marginRight: '10px'
                    }}>
                      {member.designation}
                    </span>
                    {member.currentSalary > 0 && (
                      <span style={{ color: '#10b981', fontWeight: 'bold' }}>
                        ${member.currentSalary.toLocaleString()}
                      </span>
                    )}
                  </div>
                </div>
                {isCompanyCreator && member.user?._id !== state.user?._id && (
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <button
                      onClick={() => setShowRoleUpdate(member)}
                      style={{
                        padding: '8px 12px',
                        backgroundColor: '#8b5cf6',
                        color: 'white',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontSize: '12px'
                      }}
                    >
                      Change Role
                    </button>
                    <button
                      onClick={() => setShowSalaryUpdate(member)}
                      style={{
                        padding: '8px 12px',
                        backgroundColor: '#10b981',
                        color: 'white',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontSize: '12px'
                      }}
                    >
                      Update Salary
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Add Employee Modal */}
      {showAddEmployee && (
        <AddEmployeeModal
          company={company}
          onClose={() => setShowAddEmployee(false)}
          onSuccess={() => {
            setShowAddEmployee(false);
            fetchCompany();
          }}
        />
      )}

      {/* Update Salary Modal */}
      {showSalaryUpdate && (
        <UpdateSalaryModal
          member={showSalaryUpdate}
          company={company}
          onClose={() => setShowSalaryUpdate(null)}
          onSuccess={() => {
            setShowSalaryUpdate(null);
            fetchCompany();
          }}
        />
      )}

      {/* Update Role Modal */}
      {showRoleUpdate && (
        <UpdateRoleModal
          member={showRoleUpdate}
          company={company}
          onClose={() => setShowRoleUpdate(null)}
          onSuccess={() => {
            setShowRoleUpdate(null);
            fetchCompany();
          }}
        />
      )}

      {/* Create Designation Modal */}
      {showCreateDesignation && (
        <CreateDesignationModal
          company={company}
          onClose={() => setShowCreateDesignation(false)}
          onSuccess={() => {
            setShowCreateDesignation(false);
            fetchCompany();
          }}
        />
      )}

      {/* Manage Designations Modal */}
      {showDesignations && (
        <ManageDesignationsModal
          company={company}
          onClose={() => setShowDesignations(false)}
          onSuccess={() => {
            setShowDesignations(false);
            fetchCompany();
          }}
        />
      )}
    </Layout>
  );
};

const AddEmployeeModal = ({ company, onClose, onSuccess }) => {
  const [email, setEmail] = useState('');
  const [designation, setDesignation] = useState('Employee');
  const [salary, setSalary] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch(`/api/companies/${company._id}/add-member`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${getCookie('authToken')}`
        },
        body: JSON.stringify({
          email,
          designation,
          salary: salary ? parseInt(salary) : 0
        })
      });

      if (response.ok) {
        onSuccess();
      } else {
        const error = await response.json();
        alert(error.message);
      }
    } catch (error) {
      alert('Error adding employee');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000
    }}>
      <div style={{
        backgroundColor: 'white',
        padding: '30px',
        borderRadius: '12px',
        width: '400px',
        maxWidth: '90vw'
      }}>
        <h3 style={{ margin: '0 0 20px 0' }}>Add Employee</h3>
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '6px', fontWeight: '600' }}>
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              style={{
                width: '100%',
                padding: '12px',
                border: '1px solid #d1d5db',
                borderRadius: '8px'
              }}
            />
          </div>
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '6px', fontWeight: '600' }}>
              Designation
            </label>
            <select
              value={designation}
              onChange={(e) => setDesignation(e.target.value)}
              style={{
                width: '100%',
                padding: '12px',
                border: '1px solid #d1d5db',
                borderRadius: '8px'
              }}
            >
              {company.designations?.map((des) => (
                <option key={des._id} value={des.name}>{des.name}</option>
              ))}
            </select>
          </div>
          <div style={{ marginBottom: '30px' }}>
            <label style={{ display: 'block', marginBottom: '6px', fontWeight: '600' }}>
              Salary (Optional)
            </label>
            <input
              type="number"
              value={salary}
              onChange={(e) => setSalary(e.target.value)}
              style={{
                width: '100%',
                padding: '12px',
                border: '1px solid #d1d5db',
                borderRadius: '8px'
              }}
            />
          </div>
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: '12px 20px',
                backgroundColor: '#6b7280',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer'
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              style={{
                padding: '12px 20px',
                backgroundColor: loading ? '#9ca3af' : '#3b82f6',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: loading ? 'not-allowed' : 'pointer'
              }}
            >
              {loading ? 'Adding...' : 'Add Employee'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const UpdateSalaryModal = ({ member, company, onClose, onSuccess }) => {
  const [salary, setSalary] = useState(member.currentSalary || '');
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch(`/api/companies/${company._id}/update-salary`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${getCookie('authToken')}`
        },
        body: JSON.stringify({
          memberId: member._id,
          newSalary: parseInt(salary),
          reason
        })
      });

      if (response.ok) {
        onSuccess();
      } else {
        const error = await response.json();
        alert(error.message);
      }
    } catch (error) {
      alert('Error updating salary');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000
    }}>
      <div style={{
        backgroundColor: 'white',
        padding: '30px',
        borderRadius: '12px',
        width: '400px',
        maxWidth: '90vw'
      }}>
        <h3 style={{ margin: '0 0 20px 0' }}>Update Salary - {member.user?.name}</h3>
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '6px', fontWeight: '600' }}>
              New Salary
            </label>
            <input
              type="number"
              value={salary}
              onChange={(e) => setSalary(e.target.value)}
              required
              style={{
                width: '100%',
                padding: '12px',
                border: '1px solid #d1d5db',
                borderRadius: '8px'
              }}
            />
          </div>
          <div style={{ marginBottom: '30px' }}>
            <label style={{ display: 'block', marginBottom: '6px', fontWeight: '600' }}>
              Reason
            </label>
            <input
              type="text"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g., Annual increment, Promotion"
              style={{
                width: '100%',
                padding: '12px',
                border: '1px solid #d1d5db',
                borderRadius: '8px'
              }}
            />
          </div>
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: '12px 20px',
                backgroundColor: '#6b7280',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer'
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              style={{
                padding: '12px 20px',
                backgroundColor: loading ? '#9ca3af' : '#10b981',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: loading ? 'not-allowed' : 'pointer'
              }}
            >
              {loading ? 'Updating...' : 'Update Salary'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const UpdateRoleModal = ({ member, company, onClose, onSuccess }) => {
  const [designation, setDesignation] = useState(member.designation || '');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch(`/api/companies/${company._id}/update-designation`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${getCookie('authToken')}`
        },
        body: JSON.stringify({
          memberId: member._id,
          designation
        })
      });

      if (response.ok) {
        onSuccess();
      } else {
        const error = await response.json();
        alert(error.message);
      }
    } catch (error) {
      alert('Error updating role');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000
    }}>
      <div style={{
        backgroundColor: 'white',
        padding: '30px',
        borderRadius: '12px',
        width: '400px',
        maxWidth: '90vw'
      }}>
        <h3 style={{ margin: '0 0 20px 0' }}>Update Role - {member.user?.name}</h3>
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '30px' }}>
            <label style={{ display: 'block', marginBottom: '6px', fontWeight: '600' }}>
              Designation
            </label>
            <select
              value={designation}
              onChange={(e) => setDesignation(e.target.value)}
              required
              style={{
                width: '100%',
                padding: '12px',
                border: '1px solid #d1d5db',
                borderRadius: '8px'
              }}
            >
              {company.designations?.map((des) => (
                <option key={des._id} value={des.name}>{des.name}</option>
              ))}
            </select>
          </div>
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: '12px 20px',
                backgroundColor: '#6b7280',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer'
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              style={{
                padding: '12px 20px',
                backgroundColor: loading ? '#9ca3af' : '#8b5cf6',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: loading ? 'not-allowed' : 'pointer'
              }}
            >
              {loading ? 'Updating...' : 'Update Role'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const CreateDesignationModal = ({ company, onClose, onSuccess }) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch(`/api/companies/${company._id}/designations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${getCookie('authToken')}`
        },
        body: JSON.stringify({ name, description, permissions })
      });

      if (response.ok) {
        onSuccess();
      } else {
        const error = await response.json();
        alert(error.message);
      }
    } catch (error) {
      alert('Error creating designation');
    } finally {
      setLoading(false);
    }
  };

  const permissionLabels = {
    addEmployee: 'Add Employee',
    viewEmployeeList: 'View Employee List',
    editEmployee: 'Edit Employee',
    createDesignation: 'Create Designation',
    viewDesignations: 'View Designations',
    editDesignation: 'Edit Designation',
    deleteDesignation: 'Delete Designation',
    createProject: 'Create Project',
    assignEmployeeToProject: 'Assign Employee to Project',
    removeEmployeeFromProject: 'Remove Employee from Project'
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000
    }}>
      <div style={{
        backgroundColor: 'white',
        padding: '30px',
        borderRadius: '12px',
        width: '500px',
        maxWidth: '90vw',
        maxHeight: '80vh',
        overflow: 'auto'
      }}>
        <h3 style={{ margin: '0 0 20px 0' }}>Create Designation</h3>
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '6px', fontWeight: '600' }}>
              Designation Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              style={{
                width: '100%',
                padding: '12px',
                border: '1px solid #d1d5db',
                borderRadius: '8px'
              }}
            />
          </div>
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '6px', fontWeight: '600' }}>
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              style={{
                width: '100%',
                padding: '12px',
                border: '1px solid #d1d5db',
                borderRadius: '8px',
                resize: 'vertical'
              }}
            />
          </div>
          <div style={{ marginBottom: '30px' }}>
            <label style={{ display: 'block', marginBottom: '12px', fontWeight: '600' }}>
              Permissions
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              {Object.entries(permissionLabels).map(([key, label]) => (
                <label key={key} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px' }}>
                  <input
                    type="checkbox"
                    checked={permissions[key]}
                    onChange={(e) => setPermissions({ ...permissions, [key]: e.target.checked })}
                  />
                  {label}
                </label>
              ))}
            </div>
          </div>
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: '12px 20px',
                backgroundColor: '#6b7280',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer'
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              style={{
                padding: '12px 20px',
                backgroundColor: loading ? '#9ca3af' : '#10b981',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: loading ? 'not-allowed' : 'pointer'
              }}
            >
              {loading ? 'Creating...' : 'Create Designation'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const ManageDesignationsModal = ({ company, onClose, onSuccess }) => {
  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000
    }}>
      <div style={{
        backgroundColor: 'white',
        padding: '30px',
        borderRadius: '12px',
        width: '600px',
        maxWidth: '90vw',
        maxHeight: '80vh',
        overflow: 'auto'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h3 style={{ margin: 0 }}>Manage Designations</h3>
          <button
            onClick={onClose}
            style={{
              padding: '8px 16px',
              backgroundColor: '#6b7280',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer'
            }}
          >
            Close
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {company.designations?.map((designation) => (
            <div key={designation._id} style={{
              padding: '16px',
              border: '1px solid #e2e8f0',
              borderRadius: '8px',
              backgroundColor: '#f8fafc'
            }}>
              <div style={{ marginBottom: '12px' }}>
                <h4 style={{ margin: '0 0 4px 0', color: '#1e293b' }}>{designation.name}</h4>
                <p style={{ margin: 0, fontSize: '14px', color: '#64748b' }}>{designation.description}</p>
              </div>

              <div>
                <h5 style={{ margin: '0 0 8px 0', fontSize: '14px', fontWeight: '600', color: '#374151' }}>Permissions:</h5>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                  {Object.entries(designation.permissions || {}).map(([key, value]) => (
                    value && (
                      <span key={key} style={{
                        padding: '2px 8px',
                        backgroundColor: '#10b981',
                        color: 'white',
                        borderRadius: '12px',
                        fontSize: '12px',
                        fontWeight: '500'
                      }}>
                        {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                      </span>
                    )
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const CreateCompanyModal = ({ onClose, onSuccess }) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const token = getCookie('authToken');
      const response = await fetch('/api/companies', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ name, description })
      });

      if (response.ok) {
        onSuccess();
      } else {
        const error = await response.json();
        alert(error.message);
      }
    } catch (error) {
      alert('Error creating company');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000
    }}>
      <div style={{
        backgroundColor: 'white',
        padding: '30px',
        borderRadius: '12px',
        width: '400px',
        maxWidth: '90vw'
      }}>
        <h3 style={{ margin: '0 0 20px 0' }}>Create Company</h3>
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '6px', fontWeight: '600' }}>
              Company Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              style={{
                width: '100%',
                padding: '12px',
                border: '1px solid #d1d5db',
                borderRadius: '8px'
              }}
            />
          </div>
          <div style={{ marginBottom: '30px' }}>
            <label style={{ display: 'block', marginBottom: '6px', fontWeight: '600' }}>
              Description (Optional)
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              style={{
                width: '100%',
                padding: '12px',
                border: '1px solid #d1d5db',
                borderRadius: '8px',
                resize: 'vertical'
              }}
            />
          </div>
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: '12px 20px',
                backgroundColor: '#6b7280',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer'
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              style={{
                padding: '12px 20px',
                backgroundColor: loading ? '#9ca3af' : '#3b82f6',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: loading ? 'not-allowed' : 'pointer'
              }}
            >
              {loading ? 'Creating...' : 'Create Company'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Company;