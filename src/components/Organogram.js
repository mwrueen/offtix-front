import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useCompanyFilter } from '../hooks/useCompanyFilter';
import { useToast } from '../context/ToastContext';
import { getCookie } from '../utils/cookies';
import Layout from './Layout';

const Organogram = () => {
  const { state } = useAuth();
  const { selectedCompany } = useCompanyFilter();
  const toast = useToast();
  
  const [hierarchy, setHierarchy] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [designations, setDesignations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingEmployee, setEditingEmployee] = useState(null);
  const [selectedManager, setSelectedManager] = useState('');
  const [saving, setSaving] = useState(false);
  const [viewMode, setViewMode] = useState('tree'); // 'tree' or 'list'

  useEffect(() => {
    if (selectedCompany && selectedCompany.id !== 'personal') {
      fetchOrganogram();
    }
  }, [selectedCompany]);

  const fetchOrganogram = async () => {
    try {
      setLoading(true);
      const token = getCookie('authToken');
      const response = await fetch(`/api/companies/${selectedCompany.id}/organogram`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setHierarchy(data.hierarchy || []);
        setEmployees(data.employees || []);
        setDesignations(data.designations || []);
      }
    } catch (error) {
      console.error('Error fetching organogram:', error);
      toast?.showToast?.('Failed to load organization structure', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateManager = async () => {
    if (!editingEmployee) return;
    
    setSaving(true);
    try {
      const token = getCookie('authToken');
      const response = await fetch(`/api/companies/${selectedCompany.id}/reporting-manager`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          memberId: editingEmployee.memberId,
          reportsTo: selectedManager || null
        })
      });

      if (response.ok) {
        toast?.showToast?.('Reporting manager updated successfully', 'success');
        fetchOrganogram();
        setEditingEmployee(null);
        setSelectedManager('');
      } else {
        const data = await response.json();
        toast?.showToast?.(data.message || 'Failed to update', 'error');
      }
    } catch (error) {
      toast?.showToast?.('Failed to update reporting manager', 'error');
    } finally {
      setSaving(false);
    }
  };

  const getLevelColor = (level) => {
    const colors = {
      0: '#dc2626', // Owner - Red
      1: '#7c3aed', // Level 1 - Purple
      2: '#2563eb', // Level 2 - Blue
      3: '#0891b2', // Level 3 - Cyan
      4: '#059669', // Level 4 - Green
      5: '#64748b'  // Level 5 - Gray
    };
    return colors[level] || colors[5];
  };

  // Render a single employee node
  const EmployeeNode = ({ node, depth = 0 }) => {
    const hasChildren = node.children && node.children.length > 0;
    const color = getLevelColor(node.level);
    
    return (
      <div style={{ marginLeft: depth > 0 ? '40px' : 0 }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          padding: '16px 20px',
          background: 'white',
          borderRadius: '12px',
          border: `2px solid ${color}20`,
          marginBottom: '12px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
          transition: 'all 0.2s',
          position: 'relative'
        }}>
          {depth > 0 && (
            <div style={{
              position: 'absolute',
              left: '-30px',
              top: '50%',
              width: '20px',
              height: '2px',
              background: '#e2e8f0'
            }} />
          )}
          
          {/* Avatar */}
          <div style={{
            width: '50px',
            height: '50px',
            borderRadius: '50%',
            background: `linear-gradient(135deg, ${color}, ${color}dd)`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            fontWeight: '700',
            fontSize: '18px',
            marginRight: '16px',
            flexShrink: 0
          }}>
            {node.avatar ? (
              <img src={node.avatar} alt="" style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
            ) : (
              node.name?.charAt(0).toUpperCase()
            )}
          </div>

          {/* Info */}
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <span style={{ fontWeight: '600', fontSize: '16px', color: '#1e293b' }}>{node.name}</span>
              {node.isOwner && (
                <span style={{
                  padding: '2px 8px',
                  background: '#fef3c7',
                  color: '#92400e',
                  borderRadius: '4px',
                  fontSize: '11px',
                  fontWeight: '600'
                }}>OWNER</span>
              )}
            </div>
            <div style={{ fontSize: '14px', color: color, fontWeight: '500' }}>{node.designation}</div>
            <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '2px' }}>{node.email}</div>
          </div>

          {/* Edit Button */}
          {node.memberId && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setEditingEmployee(node);
                setSelectedManager(node.reportsTo || '');
              }}
              style={{
                padding: '8px 16px',
                background: '#f1f5f9',
                color: '#475569',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '13px',
                fontWeight: '500',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => { e.target.style.background = '#e2e8f0'; }}
              onMouseLeave={(e) => { e.target.style.background = '#f1f5f9'; }}
            >
              Set Manager
            </button>
          )}
        </div>

        {/* Children */}
        {hasChildren && (
          <div style={{ borderLeft: '2px solid #e2e8f0', marginLeft: '25px', paddingLeft: '0' }}>
            {node.children.map((child, idx) => (
              <EmployeeNode key={child.id} node={child} depth={depth + 1} />
            ))}
          </div>
        )}
      </div>
    );
  };

  if (!selectedCompany || selectedCompany.id === 'personal') {
    return (
      <Layout>
        <div style={{ background: 'white', padding: '50px', borderRadius: '12px', textAlign: 'center' }}>
          <h2 style={{ color: '#1e293b', marginBottom: '16px' }}>No Company Selected</h2>
          <p style={{ color: '#64748b' }}>Please select a company to view the organization structure</p>
        </div>
      </Layout>
    );
  }

  if (loading) {
    return (
      <Layout>
        <div style={{ textAlign: 'center', padding: '50px' }}>
          <div style={{ fontSize: '18px', color: '#64748b' }}>Loading organization structure...</div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{
          background: 'linear-gradient(135deg, #0891b2 0%, #0e7490 100%)',
          padding: '40px',
          borderRadius: '16px',
          marginBottom: '30px',
          color: 'white'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{
                width: '56px',
                height: '56px',
                borderRadius: '14px',
                background: 'rgba(255,255,255,0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                  <circle cx="9" cy="7" r="4"></circle>
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                  <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                </svg>
              </div>
              <div>
                <h1 style={{ margin: '0 0 4px 0', fontSize: '28px', fontWeight: '700' }}>Organization Chart</h1>
                <p style={{ margin: 0, opacity: 0.9 }}>{employees.length} employees in {selectedCompany.name}</p>
              </div>
            </div>
            
            {/* View Toggle */}
            <div style={{ display: 'flex', gap: '8px', background: 'rgba(255,255,255,0.2)', borderRadius: '10px', padding: '4px' }}>
              <button
                onClick={() => setViewMode('tree')}
                style={{
                  padding: '8px 16px',
                  background: viewMode === 'tree' ? 'white' : 'transparent',
                  color: viewMode === 'tree' ? '#0891b2' : 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontWeight: '600',
                  fontSize: '13px'
                }}
              >
                Tree View
              </button>
              <button
                onClick={() => setViewMode('list')}
                style={{
                  padding: '8px 16px',
                  background: viewMode === 'list' ? 'white' : 'transparent',
                  color: viewMode === 'list' ? '#0891b2' : 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontWeight: '600',
                  fontSize: '13px'
                }}
              >
                List View
              </button>
            </div>
          </div>
        </div>

        {/* Hierarchy Legend */}
        <div style={{
          display: 'flex',
          gap: '16px',
          flexWrap: 'wrap',
          marginBottom: '24px',
          padding: '16px 20px',
          background: 'white',
          borderRadius: '12px'
        }}>
          {designations.map((d, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{
                width: '12px',
                height: '12px',
                borderRadius: '50%',
                background: getLevelColor(d.level)
              }} />
              <span style={{ fontSize: '13px', color: '#475569' }}>L{d.level}: {d.name}</span>
            </div>
          ))}
        </div>

        {/* Content */}
        {viewMode === 'tree' ? (
          <div style={{ background: '#f8fafc', padding: '24px', borderRadius: '16px' }}>
            {hierarchy.length > 0 ? (
              hierarchy.map((node, idx) => (
                <EmployeeNode key={node.id} node={node} />
              ))
            ) : (
              <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
                <p>No hierarchy structure defined yet.</p>
                <p style={{ fontSize: '14px' }}>Click "Set Manager" on employees to build the organization chart.</p>
              </div>
            )}
          </div>
        ) : (
          /* List View */
          <div style={{ background: 'white', borderRadius: '16px', overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#f8fafc' }}>
                  <th style={{ padding: '16px', textAlign: 'left', fontWeight: '600', color: '#475569', fontSize: '13px' }}>EMPLOYEE</th>
                  <th style={{ padding: '16px', textAlign: 'left', fontWeight: '600', color: '#475569', fontSize: '13px' }}>DESIGNATION</th>
                  <th style={{ padding: '16px', textAlign: 'left', fontWeight: '600', color: '#475569', fontSize: '13px' }}>LEVEL</th>
                  <th style={{ padding: '16px', textAlign: 'left', fontWeight: '600', color: '#475569', fontSize: '13px' }}>REPORTS TO</th>
                  <th style={{ padding: '16px', textAlign: 'center', fontWeight: '600', color: '#475569', fontSize: '13px' }}>ACTION</th>
                </tr>
              </thead>
              <tbody>
                {employees.map((emp, idx) => (
                  <tr key={emp.id} style={{ borderTop: '1px solid #e2e8f0' }}>
                    <td style={{ padding: '16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{
                          width: '40px',
                          height: '40px',
                          borderRadius: '50%',
                          background: getLevelColor(emp.level),
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: 'white',
                          fontWeight: '600'
                        }}>
                          {emp.name?.charAt(0)}
                        </div>
                        <div>
                          <div style={{ fontWeight: '600', color: '#1e293b' }}>{emp.name}</div>
                          <div style={{ fontSize: '12px', color: '#94a3b8' }}>{emp.email}</div>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '16px', color: '#475569' }}>{emp.designation}</td>
                    <td style={{ padding: '16px' }}>
                      <span style={{
                        padding: '4px 12px',
                        background: `${getLevelColor(emp.level)}15`,
                        color: getLevelColor(emp.level),
                        borderRadius: '20px',
                        fontSize: '13px',
                        fontWeight: '600'
                      }}>
                        Level {emp.level}
                      </span>
                    </td>
                    <td style={{ padding: '16px', color: '#475569' }}>
                      {employees.find(e => e.id === emp.reportsTo)?.name || '-'}
                    </td>
                    <td style={{ padding: '16px', textAlign: 'center' }}>
                      {emp.memberId && (
                        <button
                          onClick={() => {
                            setEditingEmployee(emp);
                            setSelectedManager(emp.reportsTo || '');
                          }}
                          style={{
                            padding: '6px 14px',
                            background: '#0891b2',
                            color: 'white',
                            border: 'none',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            fontSize: '12px',
                            fontWeight: '500'
                          }}
                        >
                          Set Manager
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Edit Manager Modal */}
      {editingEmployee && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}
        onClick={() => setEditingEmployee(null)}>
          <div style={{
            background: 'white',
            padding: '32px',
            borderRadius: '16px',
            maxWidth: '500px',
            width: '90%'
          }}
          onClick={(e) => e.stopPropagation()}>
            <h3 style={{ margin: '0 0 8px 0', fontSize: '20px', color: '#1e293b' }}>Set Reporting Manager</h3>
            <p style={{ margin: '0 0 24px 0', color: '#64748b' }}>
              Select who <strong>{editingEmployee.name}</strong> reports to
            </p>
            
            <select
              value={selectedManager}
              onChange={(e) => setSelectedManager(e.target.value)}
              style={{
                width: '100%',
                padding: '14px',
                border: '2px solid #e2e8f0',
                borderRadius: '10px',
                fontSize: '15px',
                marginBottom: '24px',
                outline: 'none'
              }}
            >
              <option value="">No Manager (Top Level)</option>
              {employees
                .filter(e => e.id !== editingEmployee.id)
                .sort((a, b) => a.level - b.level)
                .map(emp => (
                  <option key={emp.id} value={emp.id}>
                    {emp.name} - {emp.designation} (Level {emp.level})
                  </option>
                ))}
            </select>

            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                onClick={() => setEditingEmployee(null)}
                style={{
                  flex: 1,
                  padding: '14px',
                  background: 'white',
                  color: '#64748b',
                  border: '1px solid #e2e8f0',
                  borderRadius: '10px',
                  cursor: 'pointer',
                  fontWeight: '600'
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleUpdateManager}
                disabled={saving}
                style={{
                  flex: 1,
                  padding: '14px',
                  background: saving ? '#94a3b8' : '#0891b2',
                  color: 'white',
                  border: 'none',
                  borderRadius: '10px',
                  cursor: saving ? 'not-allowed' : 'pointer',
                  fontWeight: '600'
                }}
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default Organogram;

