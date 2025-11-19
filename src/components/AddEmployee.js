import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCompanyFilter } from '../hooks/useCompanyFilter';
import { useToast } from '../context/ToastContext';
import { getCookie } from '../utils/cookies';
import Layout from './Layout';
import Input from './common/Input';

const AddEmployee = () => {
  const navigate = useNavigate();
  const { state } = useAuth();
  const { selectedCompany } = useCompanyFilter();
  const toast = useToast();

  const [formData, setFormData] = useState({
    email: '',
    designation: '',
    salary: ''
  });

  const [designations, setDesignations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingDesignations, setLoadingDesignations] = useState(true);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (selectedCompany && selectedCompany.id !== 'personal') {
      fetchDesignations();
    }
  }, [selectedCompany]);

  const fetchDesignations = async () => {
    try {
      const token = getCookie('authToken');
      const response = await fetch(`/api/companies/${selectedCompany.id}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const company = await response.json();
        setDesignations(company.designations || []);
      }
    } catch (error) {
      console.error('Error fetching designations:', error);
      toast?.showToast?.('Failed to load designations', 'error');
    } finally {
      setLoadingDesignations(false);
    }
  };

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

  const validateForm = () => {
    const newErrors = {};

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (!formData.designation) {
      newErrors.designation = 'Designation is required';
    }

    if (formData.salary && isNaN(formData.salary)) {
      newErrors.salary = 'Salary must be a number';
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
      const response = await fetch(`/api/invitations/company/${selectedCompany.id}/invite`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email: formData.email.trim(),
          designation: formData.designation,
          salary: formData.salary ? parseFloat(formData.salary) : 0
        })
      });

      if (response.ok) {
        const data = await response.json();
        toast?.showToast?.(data.message || 'Invitation sent successfully!', 'success');
        navigate('/overview');
      } else {
        const errorData = await response.json();
        toast?.showToast?.(errorData.message || 'Failed to send invitation', 'error');
      }
    } catch (error) {
      console.error('Error sending invitation:', error);
      toast?.showToast?.('Failed to send invitation. Please try again.', 'error');
    } finally {
      setLoading(false);
    }
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
            Please select a company to add employees
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
      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          padding: '40px',
          borderRadius: '16px',
          marginBottom: '30px',
          boxShadow: '0 10px 40px rgba(102, 126, 234, 0.2)',
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
                <line x1="20" y1="8" x2="20" y2="14"></line>
                <line x1="23" y1="11" x2="17" y2="11"></line>
              </svg>
            </div>
            <div>
              <h1 style={{ margin: '0 0 4px 0', fontSize: '28px', fontWeight: '700' }}>
                Invite Employee
              </h1>
              <p style={{ margin: 0, fontSize: '15px', opacity: 0.9 }}>
                Send an invitation to join {selectedCompany.name}
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
            <div style={{ marginBottom: '24px' }}>
              <Input
                label="Employee Email"
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="employee@example.com"
                error={errors.email}
                required
                helperText="An invitation will be sent to this email address"
              />
            </div>

            <div style={{ marginBottom: '24px' }}>
              <Input
                label="Designation / Role"
                type="select"
                name="designation"
                value={formData.designation}
                onChange={handleChange}
                error={errors.designation}
                required
                disabled={loadingDesignations}
                options={[
                  { value: '', label: loadingDesignations ? 'Loading roles...' : 'Select a role' },
                  ...designations.map(d => ({ value: d.name, label: d.name }))
                ]}
                helperText="Select the role for this employee"
              />
            </div>

            <div style={{ marginBottom: '32px' }}>
              <Input
                label="Salary (Optional)"
                type="number"
                name="salary"
                value={formData.salary}
                onChange={handleChange}
                placeholder="0"
                error={errors.salary}
                helperText="Enter the employee's salary (leave blank for 0)"
              />
            </div>

            {/* Info Box */}
            <div style={{
              padding: '16px',
              background: '#eff6ff',
              border: '1px solid #bfdbfe',
              borderRadius: '10px',
              marginBottom: '32px'
            }}>
              <div style={{ display: 'flex', gap: '12px' }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: '2px' }}>
                  <circle cx="12" cy="12" r="10"></circle>
                  <line x1="12" y1="16" x2="12" y2="12"></line>
                  <line x1="12" y1="8" x2="12.01" y2="8"></line>
                </svg>
                <div style={{ fontSize: '14px', color: '#1e40af', lineHeight: '1.6' }}>
                  <strong>How it works:</strong>
                  <ul style={{ margin: '8px 0 0 0', paddingLeft: '20px' }}>
                    <li>If the user is registered, they'll receive a notification immediately</li>
                    <li>If not registered, they can sign up using this email</li>
                    <li>After registration/login, they'll see the invitation in their notifications</li>
                    <li>They can accept or reject the invitation</li>
                    <li>Upon acceptance, they'll get access to the company with the assigned role</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button
                type="button"
                onClick={() => navigate('/overview')}
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
                onMouseEnter={(e) => {
                  if (!loading) {
                    e.target.style.background = '#f8fafc';
                    e.target.style.borderColor = '#cbd5e1';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!loading) {
                    e.target.style.background = 'white';
                    e.target.style.borderColor = '#e2e8f0';
                  }
                }}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading || loadingDesignations}
                style={{
                  padding: '12px 28px',
                  background: loading ? '#94a3b8' : 'linear-gradient(135deg, #667eea, #764ba2)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '10px',
                  cursor: loading || loadingDesignations ? 'not-allowed' : 'pointer',
                  fontWeight: '600',
                  fontSize: '15px',
                  boxShadow: loading ? 'none' : '0 4px 12px rgba(102, 126, 234, 0.3)',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => {
                  if (!loading && !loadingDesignations) {
                    e.target.style.transform = 'translateY(-2px)';
                    e.target.style.boxShadow = '0 6px 16px rgba(102, 126, 234, 0.4)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!loading && !loadingDesignations) {
                    e.target.style.transform = 'translateY(0)';
                    e.target.style.boxShadow = '0 4px 12px rgba(102, 126, 234, 0.3)';
                  }
                }}
              >
                {loading ? 'Sending Invitation...' : 'Send Invitation'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </Layout>
  );
};

export default AddEmployee;

