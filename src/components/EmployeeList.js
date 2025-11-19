import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { employeeAPI } from '../services/api';
import { useCompany } from '../context/CompanyContext';
import Layout from './Layout';

const EmployeeList = () => {
  const navigate = useNavigate();
  const { state } = useCompany();
  const selectedCompany = state.selectedCompany;
  const [employees, setEmployees] = useState([]);
  const [company, setCompany] = useState(null);
  const [designations, setDesignations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDesignation, setFilterDesignation] = useState('all');

  useEffect(() => {
    if (selectedCompany && selectedCompany.id !== 'personal') {
      fetchEmployees();
    } else {
      navigate('/overview');
    }
  }, [selectedCompany, navigate]);

  const fetchEmployees = async () => {
    try {
      setLoading(true);
      const response = await employeeAPI.getAll(selectedCompany.id);
      setEmployees(response.data.employees || []);
      setCompany(response.data.company);
      setDesignations(response.data.designations || []);
    } catch (error) {
      console.error('Error fetching employees:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredEmployees = employees.filter(emp => {
    const matchesSearch = emp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         emp.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDesignation = filterDesignation === 'all' || emp.designation === filterDesignation;
    return matchesSearch && matchesDesignation;
  });

  const getDesignationColor = (designation) => {
    if (designation === 'Owner') return '#ef4444';
    if (designation === 'Managing Director') return '#f59e0b';
    if (designation === 'HR Manager') return '#10b981';
    if (designation === 'Project Manager') return '#3b82f6';
    return '#6b7280';
  };

  return (
    <Layout>
      <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '30px'
        }}>
          <div>
            <h2 style={{ margin: '0 0 8px 0', color: '#1e293b', fontSize: '28px' }}>
              Employee Directory
            </h2>
            <p style={{ margin: 0, color: '#64748b', fontSize: '14px' }}>
              {company?.name} • {filteredEmployees.length} {filteredEmployees.length === 1 ? 'employee' : 'employees'}
            </p>
          </div>
          <button
            onClick={() => navigate('/add-employee')}
            style={{
              padding: '12px 24px',
              backgroundColor: '#3b82f6',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontWeight: '500',
              fontSize: '14px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            <span>➕</span> Add Employee
          </button>
        </div>

        {/* Filters */}
        <div style={{
          backgroundColor: 'white',
          padding: '20px',
          borderRadius: '12px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
          marginBottom: '24px',
          display: 'flex',
          gap: '16px',
          flexWrap: 'wrap'
        }}>
          <div style={{ flex: '1', minWidth: '250px' }}>
            <input
              type="text"
              placeholder="🔍 Search by name or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 16px',
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                fontSize: '14px',
                outline: 'none'
              }}
            />
          </div>
          <div style={{ minWidth: '200px' }}>
            <select
              value={filterDesignation}
              onChange={(e) => setFilterDesignation(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 16px',
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                fontSize: '14px',
                outline: 'none',
                cursor: 'pointer'
              }}
            >
              <option value="all">All Designations</option>
              <option value="Owner">Owner</option>
              {designations.map(des => (
                <option key={des._id} value={des.name}>{des.name}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Employee Grid */}
        {loading ? (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
            gap: '20px'
          }}>
            {Array(6).fill(0).map((_, index) => (
              <div key={index} style={{
                backgroundColor: 'white',
                borderRadius: '12px',
                padding: '24px',
                boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                border: '1px solid #e2e8f0'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '16px' }}>
                  <div style={{
                    width: '60px',
                    height: '60px',
                    borderRadius: '50%',
                    backgroundColor: '#f1f5f9'
                  }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ width: '120px', height: '16px', backgroundColor: '#f1f5f9', borderRadius: '4px', marginBottom: '8px' }} />
                    <div style={{ width: '180px', height: '14px', backgroundColor: '#f1f5f9', borderRadius: '4px' }} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : filteredEmployees.length > 0 ? (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
            gap: '20px'
          }}>
            {filteredEmployees.map((employee) => (
              <div
                key={employee._id}
                onClick={() => navigate(`/employees/${employee._id}`)}
                style={{
                  backgroundColor: 'white',
                  borderRadius: '12px',
                  padding: '24px',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                  border: '1px solid #e2e8f0',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  ':hover': {
                    boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                    transform: 'translateY(-2px)'
                  }
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.boxShadow = '0 4px 6px rgba(0,0,0,0.1)';
                  e.currentTarget.style.transform = 'translateY(-2px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.1)';
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
              >
                {/* Employee Header */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '16px' }}>
                  <div style={{
                    width: '60px',
                    height: '60px',
                    borderRadius: '50%',
                    backgroundColor: getDesignationColor(employee.designation) + '20',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '24px',
                    fontWeight: 'bold',
                    color: getDesignationColor(employee.designation),
                    backgroundImage: employee.profile?.profilePicture ? `url(${employee.profile.profilePicture})` : 'none',
                    backgroundSize: 'cover',
                    backgroundPosition: 'center'
                  }}>
                    {!employee.profile?.profilePicture && employee.name.charAt(0).toUpperCase()}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <h3 style={{
                      margin: '0 0 4px 0',
                      fontSize: '16px',
                      fontWeight: '600',
                      color: '#1e293b',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap'
                    }}>
                      {employee.name}
                    </h3>
                    <p style={{
                      margin: 0,
                      fontSize: '13px',
                      color: '#64748b',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap'
                    }}>
                      {employee.email}
                    </p>
                  </div>
                </div>

                {/* Employee Details */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '12px', color: '#64748b', fontWeight: '500' }}>Designation</span>
                    <span style={{
                      padding: '4px 12px',
                      borderRadius: '12px',
                      fontSize: '12px',
                      fontWeight: '600',
                      backgroundColor: getDesignationColor(employee.designation) + '15',
                      color: getDesignationColor(employee.designation)
                    }}>
                      {employee.designation}
                    </span>
                  </div>

                  {employee.profile?.title && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '12px', color: '#64748b', fontWeight: '500' }}>Title</span>
                      <span style={{ fontSize: '13px', color: '#1e293b', fontWeight: '500' }}>
                        {employee.profile.title}
                      </span>
                    </div>
                  )}

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '12px', color: '#64748b', fontWeight: '500' }}>Joined</span>
                    <span style={{ fontSize: '13px', color: '#1e293b' }}>
                      {new Date(employee.joinedAt).toLocaleDateString('en-US', { 
                        month: 'short', 
                        year: 'numeric' 
                      })}
                    </span>
                  </div>

                  {!employee.isOwner && employee.currentSalary > 0 && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '12px', color: '#64748b', fontWeight: '500' }}>Salary</span>
                      <span style={{ fontSize: '13px', color: '#10b981', fontWeight: '600' }}>
                        ${employee.currentSalary.toLocaleString()}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div style={{
            backgroundColor: 'white',
            borderRadius: '12px',
            padding: '60px 20px',
            textAlign: 'center',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
          }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>👥</div>
            <h3 style={{ margin: '0 0 8px 0', fontSize: '18px', color: '#374151' }}>No employees found</h3>
            <p style={{ margin: 0, fontSize: '14px', color: '#64748b' }}>
              {searchTerm || filterDesignation !== 'all' 
                ? 'Try adjusting your filters' 
                : 'Start by adding your first employee'}
            </p>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default EmployeeList;

