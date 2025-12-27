import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { employeeAPI } from '../services/api';
import { useCompany } from '../context/CompanyContext';
import { getCookie } from '../utils/cookies';
import Layout from './Layout';
import DeleteConfirmModal from './common/DeleteConfirmModal';

const EmployeeDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { state } = useCompany();
  const selectedCompany = state.selectedCompany;
  const [employee, setEmployee] = useState(null);
  const [company, setCompany] = useState(null);
  const [designations, setDesignations] = useState([]);
  const [allEmployees, setAllEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showSalaryModal, setShowSalaryModal] = useState(false);
  const [showDesignationModal, setShowDesignationModal] = useState(false);
  const [showManagerModal, setShowManagerModal] = useState(false);
  const [showRemoveModal, setShowRemoveModal] = useState(false);
  const [newSalary, setNewSalary] = useState('');
  const [salaryReason, setSalaryReason] = useState('');
  const [newDesignation, setNewDesignation] = useState('');
  const [selectedManager, setSelectedManager] = useState('');

  useEffect(() => {
    if (selectedCompany && selectedCompany.id !== 'personal') {
      fetchEmployeeDetails();
    } else {
      navigate('/overview');
    }
  }, [selectedCompany, id, navigate]);

  const fetchEmployeeDetails = async () => {
    try {
      setLoading(true);
      const response = await employeeAPI.getById(selectedCompany.id, id);
      setEmployee(response.data.employee);
      setCompany(response.data.company);
      setDesignations(response.data.designations || []);
      setNewDesignation(response.data.employee.designation);
      setSelectedManager(response.data.employee.reportsTo || '');

      // Fetch all employees for manager dropdown
      const token = getCookie('authToken');
      const orgResponse = await fetch(`/api/companies/${selectedCompany.id}/organogram`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      if (orgResponse.ok) {
        const orgData = await orgResponse.json();
        setAllEmployees(orgData.employees || []);
      }
    } catch (error) {
      console.error('Error fetching employee details:', error);
      navigate('/employees');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateSalary = async () => {
    try {
      await employeeAPI.updateSalary(selectedCompany.id, id, parseFloat(newSalary), salaryReason);
      setShowSalaryModal(false);
      setNewSalary('');
      setSalaryReason('');
      fetchEmployeeDetails();
    } catch (error) {
      console.error('Error updating salary:', error);
      alert('Failed to update salary');
    }
  };

  const handleUpdateDesignation = async () => {
    try {
      await employeeAPI.updateDesignation(selectedCompany.id, id, newDesignation);
      setShowDesignationModal(false);
      fetchEmployeeDetails();
    } catch (error) {
      console.error('Error updating designation:', error);
      alert('Failed to update designation');
    }
  };

  const handleUpdateManager = async () => {
    try {
      const token = getCookie('authToken');
      const response = await fetch(`/api/companies/${selectedCompany.id}/reporting-manager`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          memberId: employee.memberId,
          reportsTo: selectedManager || null
        })
      });

      if (response.ok) {
        setShowManagerModal(false);
        fetchEmployeeDetails();
      } else {
        const data = await response.json();
        alert(data.message || 'Failed to update manager');
      }
    } catch (error) {
      console.error('Error updating manager:', error);
      alert('Failed to update manager');
    }
  };

  const handleRemoveEmployee = async () => {
    try {
      await employeeAPI.remove(selectedCompany.id, id);
      navigate('/employees');
    } catch (error) {
      console.error('Error removing employee:', error);
      alert('Failed to remove employee');
    }
  };

  if (loading) {
    return (
      <Layout>
        <div style={{ textAlign: 'center', padding: '50px' }}>
          <div style={{ fontSize: '24px', marginBottom: '16px' }}>⏳</div>
          <p>Loading employee details...</p>
        </div>
      </Layout>
    );
  }

  if (!employee) {
    return (
      <Layout>
        <div style={{ textAlign: 'center', padding: '50px' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>❌</div>
          <h2>Employee Not Found</h2>
          <button 
            onClick={() => navigate('/employees')}
            style={{
              padding: '12px 24px',
              backgroundColor: '#3b82f6',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              marginTop: '16px'
            }}
          >
            Back to Employees
          </button>
        </div>
      </Layout>
    );
  }

  const profile = employee.profile || {};

  return (
    <Layout>
      <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '30px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <button
              onClick={() => navigate('/employees')}
              style={{
                padding: '8px 12px',
                backgroundColor: '#f1f5f9',
                color: '#475569',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '14px'
              }}
            >
              ← Back
            </button>
            <div>
              <h2 style={{ margin: '0 0 5px 0', color: '#1e293b', fontSize: '24px' }}>Employee Profile</h2>
              <p style={{ margin: 0, color: '#64748b' }}>{company?.name}</p>
            </div>
          </div>
          {!employee.isOwner && (
            <button
              onClick={() => setShowRemoveModal(true)}
              style={{
                padding: '10px 20px',
                backgroundColor: '#ef4444',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '500'
              }}
            >
              Remove Employee
            </button>
          )}
        </div>

        {/* Profile Card */}
        <div style={{
          backgroundColor: 'white',
          borderRadius: '12px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
          border: '1px solid #e2e8f0',
          overflow: 'hidden',
          marginBottom: '24px'
        }}>
          {/* Profile Header */}
          <div style={{
            background: profile.coverPhoto ? `url(${profile.coverPhoto})` : 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            padding: '40px 32px',
            color: 'white',
            textAlign: 'center',
            position: 'relative'
          }}>
            {profile.coverPhoto && (
              <div style={{
                position: 'absolute',
                inset: 0,
                backgroundColor: 'rgba(0,0,0,0.4)'
              }} />
            )}
            <div style={{ position: 'relative', zIndex: 1 }}>
              <div style={{
                width: '120px',
                height: '120px',
                borderRadius: '50%',
                backgroundColor: 'rgba(255,255,255,0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '48px',
                margin: '0 auto 20px',
                backgroundImage: profile.profilePicture ? `url(${profile.profilePicture})` : 'none',
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                border: '4px solid rgba(255,255,255,0.3)'
              }}>
                {!profile.profilePicture && employee.name.charAt(0).toUpperCase()}
              </div>
              <h1 style={{ margin: '0 0 8px 0', fontSize: '28px', fontWeight: 'bold' }}>{employee.name}</h1>
              <p style={{ margin: '0 0 16px 0', fontSize: '16px', opacity: 0.9 }}>{employee.email}</p>
              <div style={{ display: 'flex', justifyContent: 'center', gap: '12px', flexWrap: 'wrap' }}>
                <span style={{
                  backgroundColor: employee.isOwner ? '#ef4444' : '#3b82f6',
                  color: 'white',
                  padding: '6px 16px',
                  borderRadius: '20px',
                  fontSize: '14px',
                  fontWeight: 'bold'
                }}>
                  {employee.designation}
                </span>
                {profile.title && (
                  <span style={{
                    backgroundColor: 'rgba(255,255,255,0.2)',
                    color: 'white',
                    padding: '6px 16px',
                    borderRadius: '20px',
                    fontSize: '14px',
                    fontWeight: '500'
                  }}>
                    {profile.title}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Profile Content */}
          <div style={{ padding: '32px' }}>
            {/* Employment Information */}
            <div style={{ marginBottom: '32px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '600', color: '#1e293b' }}>
                  💼 Employment Information
                </h3>
                {!employee.isOwner && (
                  <button
                    onClick={() => setShowDesignationModal(true)}
                    style={{
                      padding: '6px 12px',
                      backgroundColor: '#f1f5f9',
                      color: '#475569',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontSize: '12px',
                      fontWeight: '500'
                    }}
                  >
                    Change Designation
                  </button>
                )}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#64748b', textTransform: 'uppercase', marginBottom: '4px' }}>
                    Designation
                  </label>
                  <p style={{ margin: 0, fontSize: '14px', color: '#1e293b', fontWeight: '500' }}>{employee.designation}</p>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#64748b', textTransform: 'uppercase', marginBottom: '4px' }}>
                    Joined Date
                  </label>
                  <p style={{ margin: 0, fontSize: '14px', color: '#1e293b' }}>
                    {new Date(employee.joinedAt).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </p>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#64748b', textTransform: 'uppercase', marginBottom: '4px' }}>
                    Reports To
                  </label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <p style={{ margin: 0, fontSize: '14px', color: '#1e293b' }}>
                      {allEmployees.find(e => e.id === employee.reportsTo)?.name || 'No Manager'}
                    </p>
                    {!employee.isOwner && (
                      <button
                        onClick={() => setShowManagerModal(true)}
                        style={{
                          padding: '4px 8px',
                          backgroundColor: '#0891b2',
                          color: 'white',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          fontSize: '11px',
                          fontWeight: '500'
                        }}
                      >
                        Change
                      </button>
                    )}
                  </div>
                </div>
                {profile.phone && (
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#64748b', textTransform: 'uppercase', marginBottom: '4px' }}>
                      Phone
                    </label>
                    <p style={{ margin: 0, fontSize: '14px', color: '#1e293b' }}>{profile.phone}</p>
                  </div>
                )}
                {profile.location && (
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#64748b', textTransform: 'uppercase', marginBottom: '4px' }}>
                      Location
                    </label>
                    <p style={{ margin: 0, fontSize: '14px', color: '#1e293b' }}>{profile.location}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Salary Information */}
            {!employee.isOwner && (
              <div style={{ marginBottom: '32px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                  <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '600', color: '#1e293b' }}>
                    💰 Salary Information
                  </h3>
                  <button
                    onClick={() => setShowSalaryModal(true)}
                    style={{
                      padding: '6px 12px',
                      backgroundColor: '#f1f5f9',
                      color: '#475569',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontSize: '12px',
                      fontWeight: '500'
                    }}
                  >
                    Update Salary
                  </button>
                </div>
                <div style={{
                  padding: '20px',
                  backgroundColor: '#f8fafc',
                  borderRadius: '8px',
                  border: '1px solid #e2e8f0',
                  marginBottom: '16px'
                }}>
                  <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '4px' }}>Current Salary</div>
                  <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#10b981' }}>
                    ${employee.currentSalary?.toLocaleString() || '0'}
                  </div>
                </div>

                {employee.salaryHistory && employee.salaryHistory.length > 0 && (
                  <div>
                    <h4 style={{ margin: '0 0 12px 0', fontSize: '14px', fontWeight: '600', color: '#64748b' }}>
                      Salary History
                    </h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {employee.salaryHistory.slice().reverse().map((history, index) => (
                        <div key={index} style={{
                          padding: '12px 16px',
                          backgroundColor: '#f8fafc',
                          borderRadius: '6px',
                          border: '1px solid #e2e8f0',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center'
                        }}>
                          <div>
                            <div style={{ fontSize: '14px', fontWeight: '600', color: '#1e293b' }}>
                              ${history.amount.toLocaleString()}
                            </div>
                            <div style={{ fontSize: '12px', color: '#64748b' }}>
                              {history.reason || 'Salary update'}
                            </div>
                          </div>
                          <div style={{ fontSize: '12px', color: '#64748b', textAlign: 'right' }}>
                            {new Date(history.effectiveDate).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric'
                            })}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Professional Summary */}
            {profile.summary && (
              <div style={{ marginBottom: '32px' }}>
                <h3 style={{ margin: '0 0 16px 0', fontSize: '18px', fontWeight: '600', color: '#1e293b' }}>
                  📝 Professional Summary
                </h3>
                <div style={{
                  padding: '20px',
                  backgroundColor: '#f8fafc',
                  borderRadius: '8px',
                  border: '1px solid #e2e8f0'
                }}>
                  <p style={{ margin: 0, fontSize: '14px', lineHeight: '1.6', color: '#374151' }}>{profile.summary}</p>
                </div>
              </div>
            )}

            {/* Skills */}
            {profile.skills && profile.skills.length > 0 && (
              <div style={{ marginBottom: '32px' }}>
                <h3 style={{ margin: '0 0 16px 0', fontSize: '18px', fontWeight: '600', color: '#1e293b' }}>
                  ⚡ Skills
                </h3>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {profile.skills.map((skill, index) => (
                    <span
                      key={index}
                      style={{
                        backgroundColor: '#3b82f6',
                        color: 'white',
                        padding: '6px 12px',
                        borderRadius: '16px',
                        fontSize: '12px',
                        fontWeight: '500'
                      }}
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Salary Update Modal */}
        {showSalaryModal && (
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
              maxWidth: '400px',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)'
            }}>
              <h3 style={{ margin: '0 0 20px 0', fontSize: '18px', fontWeight: '600', color: '#1e293b' }}>
                Update Salary
              </h3>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '8px' }}>
                  New Salary Amount
                </label>
                <input
                  type="number"
                  value={newSalary}
                  onChange={(e) => setNewSalary(e.target.value)}
                  placeholder="Enter new salary"
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px',
                    fontSize: '14px',
                    outline: 'none'
                  }}
                />
              </div>
              <div style={{ marginBottom: '24px' }}>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '8px' }}>
                  Reason (Optional)
                </label>
                <input
                  type="text"
                  value={salaryReason}
                  onChange={(e) => setSalaryReason(e.target.value)}
                  placeholder="e.g., Annual increment, Promotion"
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px',
                    fontSize: '14px',
                    outline: 'none'
                  }}
                />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                <button
                  onClick={() => {
                    setShowSalaryModal(false);
                    setNewSalary('');
                    setSalaryReason('');
                  }}
                  style={{
                    padding: '10px 20px',
                    backgroundColor: 'white',
                    color: '#374151',
                    border: '1px solid #d1d5db',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: '500'
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleUpdateSalary}
                  disabled={!newSalary}
                  style={{
                    padding: '10px 20px',
                    backgroundColor: newSalary ? '#3b82f6' : '#d1d5db',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: newSalary ? 'pointer' : 'not-allowed',
                    fontSize: '14px',
                    fontWeight: '500'
                  }}
                >
                  Update
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Designation Update Modal */}
        {showDesignationModal && (
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
              maxWidth: '400px',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)'
            }}>
              <h3 style={{ margin: '0 0 20px 0', fontSize: '18px', fontWeight: '600', color: '#1e293b' }}>
                Change Designation
              </h3>
              <div style={{ marginBottom: '24px' }}>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '8px' }}>
                  Select Designation
                </label>
                <select
                  value={newDesignation}
                  onChange={(e) => setNewDesignation(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px',
                    fontSize: '14px',
                    outline: 'none',
                    cursor: 'pointer'
                  }}
                >
                  {designations.map(des => (
                    <option key={des._id} value={des.name}>{des.name}</option>
                  ))}
                </select>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                <button
                  onClick={() => setShowDesignationModal(false)}
                  style={{
                    padding: '10px 20px',
                    backgroundColor: 'white',
                    color: '#374151',
                    border: '1px solid #d1d5db',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: '500'
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleUpdateDesignation}
                  style={{
                    padding: '10px 20px',
                    backgroundColor: '#3b82f6',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: '500'
                  }}
                >
                  Update
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Manager Update Modal */}
        {showManagerModal && (
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
              maxWidth: '400px',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)'
            }}>
              <h3 style={{ margin: '0 0 20px 0', fontSize: '18px', fontWeight: '600', color: '#1e293b' }}>
                Set Reporting Manager
              </h3>
              <p style={{ margin: '0 0 16px 0', color: '#64748b', fontSize: '14px' }}>
                Select who {employee?.name} reports to
              </p>
              <div style={{ marginBottom: '24px' }}>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '8px' }}>
                  Select Manager
                </label>
                <select
                  value={selectedManager}
                  onChange={(e) => setSelectedManager(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px',
                    fontSize: '14px',
                    outline: 'none',
                    cursor: 'pointer'
                  }}
                >
                  <option value="">No Manager (Top Level)</option>
                  {allEmployees
                    .filter(e => e.id !== id)
                    .sort((a, b) => (a.level || 5) - (b.level || 5))
                    .map(emp => (
                      <option key={emp.id} value={emp.id}>
                        {emp.name} - {emp.designation} (Level {emp.level || 5})
                      </option>
                    ))}
                </select>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                <button
                  onClick={() => setShowManagerModal(false)}
                  style={{
                    padding: '10px 20px',
                    backgroundColor: 'white',
                    color: '#374151',
                    border: '1px solid #d1d5db',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: '500'
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleUpdateManager}
                  style={{
                    padding: '10px 20px',
                    backgroundColor: '#0891b2',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: '500'
                  }}
                >
                  Update
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Remove Employee Confirmation Modal */}
        <DeleteConfirmModal
          isOpen={showRemoveModal}
          onClose={() => setShowRemoveModal(false)}
          onConfirm={() => {
            setShowRemoveModal(false);
            handleRemoveEmployee();
          }}
          title="Remove Employee"
          message="This will remove the employee from your company. They will lose access to company resources and projects."
          itemName={employee?.name}
          itemDescription={`${employee?.email} • ${employee?.designation || 'Employee'}`}
          confirmButtonText="Remove Employee"
          icon="👤"
        />
      </div>
    </Layout>
  );
};

export default EmployeeDetails;

