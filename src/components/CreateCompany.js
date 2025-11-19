import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCompany } from '../context/CompanyContext';
import { useToast } from '../context/ToastContext';
import Layout from './Layout';
import Input from './common/Input';

const CreateCompany = () => {
  const navigate = useNavigate();
  const { state } = useAuth();
  const { createCompany } = useCompany();
  const toast = useToast();
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    industry: '',
    website: '',
    address: '',
    city: '',
    state: '',
    country: '',
    zipCode: '',
    phone: '',
    email: '',
    foundedYear: '',
    companySize: '',
    founderRole: 'Founder/Owner'
  });

  const [additionalRoles, setAdditionalRoles] = useState([]);
  const [newRole, setNewRole] = useState({ name: '', description: '' });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear error for this field
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handleAddRole = () => {
    if (!newRole.name.trim()) {
      toast?.showToast?.('Please enter a role name', 'error');
      return;
    }

    setAdditionalRoles(prev => [...prev, { ...newRole, id: Date.now() }]);
    setNewRole({ name: '', description: '' });
  };

  const handleRemoveRole = (roleId) => {
    setAdditionalRoles(prev => prev.filter(role => role.id !== roleId));
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Company name is required';
    }

    if (!formData.description.trim()) {
      newErrors.description = 'Company description is required';
    }

    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (formData.website && !/^https?:\/\/.+/.test(formData.website)) {
      newErrors.website = 'Please enter a valid URL (starting with http:// or https://)';
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
      // Prepare company data
      const companyData = {
        name: formData.name.trim(),
        description: formData.description.trim(),
        industry: formData.industry,
        website: formData.website,
        address: formData.address,
        city: formData.city,
        state: formData.state,
        country: formData.country,
        zipCode: formData.zipCode,
        phone: formData.phone,
        email: formData.email,
        foundedYear: formData.foundedYear,
        companySize: formData.companySize,
        founderRole: formData.founderRole,
        additionalRoles: additionalRoles.map(role => ({
          name: role.name,
          description: role.description
        }))
      };

      console.log('=== CREATING COMPANY ===');
      console.log('Company data being sent:', companyData);
      console.log('========================');

      await createCompany(companyData);
      toast?.showToast?.('Company created successfully!', 'success');
      navigate('/overview');
    } catch (error) {
      console.error('Error creating company:', error);
      toast?.showToast?.(
        error.response?.data?.message || 'Failed to create company. Please try again.',
        'error'
      );
    } finally {
      setLoading(false);
    }
  };

  const companySizeOptions = [
    { value: '', label: 'Select company size' },
    { value: '1-10', label: '1-10 employees' },
    { value: '11-50', label: '11-50 employees' },
    { value: '51-200', label: '51-200 employees' },
    { value: '201-500', label: '201-500 employees' },
    { value: '501-1000', label: '501-1000 employees' },
    { value: '1000+', label: '1000+ employees' }
  ];

  const industryOptions = [
    { value: '', label: 'Select industry' },
    { value: 'Technology', label: 'Technology' },
    { value: 'Finance', label: 'Finance' },
    { value: 'Healthcare', label: 'Healthcare' },
    { value: 'Education', label: 'Education' },
    { value: 'Retail', label: 'Retail' },
    { value: 'Manufacturing', label: 'Manufacturing' },
    { value: 'Consulting', label: 'Consulting' },
    { value: 'Real Estate', label: 'Real Estate' },
    { value: 'Other', label: 'Other' }
  ];

  return (
    <Layout>
      <div style={{
        maxWidth: '900px',
        margin: '0 auto'
      }}>
        {/* Header */}
        <div style={{
          marginBottom: '32px'
        }}>
          <h1 style={{
            margin: '0 0 8px 0',
            fontSize: '32px',
            fontWeight: '700',
            color: '#1e293b',
            letterSpacing: '-0.5px'
          }}>
            Create New Company
          </h1>
          <p style={{
            margin: 0,
            fontSize: '16px',
            color: '#64748b'
          }}>
            Set up your company profile and start managing your team and projects
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit}>
          {/* Basic Information */}
          <div style={{
            backgroundColor: '#ffffff',
            borderRadius: '12px',
            padding: '32px',
            marginBottom: '24px',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
            border: '1px solid #e2e8f0'
          }}>
            <h2 style={{
              margin: '0 0 24px 0',
              fontSize: '20px',
              fontWeight: '600',
              color: '#1e293b',
              borderBottom: '2px solid #f1f5f9',
              paddingBottom: '12px'
            }}>
              Basic Information
            </h2>

            <Input
              label="Company Name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="e.g., Acme Corporation, Tech Solutions Inc."
              required
              error={errors.name}
            />

            <Input
              label="Description"
              name="description"
              type="textarea"
              value={formData.description}
              onChange={handleChange}
              placeholder="Brief description of your company..."
              required
              rows={4}
              error={errors.description}
              helperText="Provide a brief overview of what your company does"
            />

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
              gap: '20px'
            }}>
              <Input
                label="Industry"
                name="industry"
                type="select"
                value={formData.industry}
                onChange={handleChange}
                options={industryOptions}
              />

              <Input
                label="Company Size"
                name="companySize"
                type="select"
                value={formData.companySize}
                onChange={handleChange}
                options={companySizeOptions}
              />

              <Input
                label="Founded Year"
                name="foundedYear"
                type="number"
                value={formData.foundedYear}
                onChange={handleChange}
                placeholder="e.g., 2020"
                min="1800"
                max={new Date().getFullYear()}
              />
            </div>
          </div>

          {/* Contact Information */}
          <div style={{
            backgroundColor: '#ffffff',
            borderRadius: '12px',
            padding: '32px',
            marginBottom: '24px',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
            border: '1px solid #e2e8f0'
          }}>
            <h2 style={{
              margin: '0 0 24px 0',
              fontSize: '20px',
              fontWeight: '600',
              color: '#1e293b',
              borderBottom: '2px solid #f1f5f9',
              paddingBottom: '12px'
            }}>
              Contact Information
            </h2>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
              gap: '20px'
            }}>
              <Input
                label="Email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="contact@company.com"
                error={errors.email}
              />

              <Input
                label="Phone"
                name="phone"
                type="tel"
                value={formData.phone}
                onChange={handleChange}
                placeholder="+1 (555) 123-4567"
              />

              <Input
                label="Website"
                name="website"
                type="url"
                value={formData.website}
                onChange={handleChange}
                placeholder="https://www.company.com"
                error={errors.website}
              />
            </div>
          </div>

          {/* Address Information */}
          <div style={{
            backgroundColor: '#ffffff',
            borderRadius: '12px',
            padding: '32px',
            marginBottom: '24px',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
            border: '1px solid #e2e8f0'
          }}>
            <h2 style={{
              margin: '0 0 24px 0',
              fontSize: '20px',
              fontWeight: '600',
              color: '#1e293b',
              borderBottom: '2px solid #f1f5f9',
              paddingBottom: '12px'
            }}>
              Address Information
            </h2>

            <Input
              label="Street Address"
              name="address"
              value={formData.address}
              onChange={handleChange}
              placeholder="123 Main Street"
            />

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '20px'
            }}>
              <Input
                label="City"
                name="city"
                value={formData.city}
                onChange={handleChange}
                placeholder="San Francisco"
              />

              <Input
                label="State/Province"
                name="state"
                value={formData.state}
                onChange={handleChange}
                placeholder="California"
              />

              <Input
                label="Country"
                name="country"
                value={formData.country}
                onChange={handleChange}
                placeholder="United States"
              />

              <Input
                label="Zip/Postal Code"
                name="zipCode"
                value={formData.zipCode}
                onChange={handleChange}
                placeholder="94102"
              />
            </div>
          </div>

          {/* Founder/Owner Role */}
          <div style={{
            backgroundColor: '#ffffff',
            borderRadius: '12px',
            padding: '32px',
            marginBottom: '24px',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
            border: '1px solid #e2e8f0'
          }}>
            <h2 style={{
              margin: '0 0 16px 0',
              fontSize: '20px',
              fontWeight: '600',
              color: '#1e293b',
              borderBottom: '2px solid #f1f5f9',
              paddingBottom: '12px'
            }}>
              Your Role
            </h2>

            <div style={{
              backgroundColor: '#f0f9ff',
              border: '1px solid #bae6fd',
              borderRadius: '8px',
              padding: '16px',
              marginBottom: '20px'
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'start',
                gap: '12px'
              }}>
                <span style={{ fontSize: '20px' }}>ℹ️</span>
                <div>
                  <p style={{
                    margin: '0 0 8px 0',
                    fontSize: '14px',
                    fontWeight: '600',
                    color: '#0c4a6e'
                  }}>
                    You will be the company owner
                  </p>
                  <p style={{
                    margin: 0,
                    fontSize: '13px',
                    color: '#075985',
                    lineHeight: '1.5'
                  }}>
                    As the creator of this company, you will automatically be assigned as the owner with full administrative privileges. You can specify your role/title below.
                  </p>
                </div>
              </div>
            </div>

            <Input
              label="Your Role/Title"
              name="founderRole"
              value={formData.founderRole}
              onChange={handleChange}
              placeholder="e.g., Founder, CEO, Managing Director"
              required
              helperText="This will be your designation in the company"
            />
          </div>

          {/* Additional Roles */}
          <div style={{
            backgroundColor: '#ffffff',
            borderRadius: '12px',
            padding: '32px',
            marginBottom: '24px',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
            border: '1px solid #e2e8f0'
          }}>
            <h2 style={{
              margin: '0 0 16px 0',
              fontSize: '20px',
              fontWeight: '600',
              color: '#1e293b',
              borderBottom: '2px solid #f1f5f9',
              paddingBottom: '12px'
            }}>
              Additional Roles (Optional)
            </h2>

            <p style={{
              margin: '0 0 24px 0',
              fontSize: '14px',
              color: '#64748b'
            }}>
              Define additional roles/designations that you plan to use in your company. You can always add more later.
            </p>

            {/* List of added roles */}
            {additionalRoles.length > 0 && (
              <div style={{ marginBottom: '24px' }}>
                {additionalRoles.map((role) => (
                  <div
                    key={role.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '12px 16px',
                      backgroundColor: '#f8fafc',
                      border: '1px solid #e2e8f0',
                      borderRadius: '8px',
                      marginBottom: '8px'
                    }}
                  >
                    <div style={{ flex: 1 }}>
                      <div style={{
                        fontSize: '14px',
                        fontWeight: '600',
                        color: '#1e293b',
                        marginBottom: '4px'
                      }}>
                        {role.name}
                      </div>
                      {role.description && (
                        <div style={{
                          fontSize: '13px',
                          color: '#64748b'
                        }}>
                          {role.description}
                        </div>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveRole(role.id)}
                      style={{
                        padding: '6px 12px',
                        backgroundColor: '#fee2e2',
                        color: '#dc2626',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontSize: '13px',
                        fontWeight: '500',
                        transition: 'all 0.2s'
                      }}
                      onMouseEnter={(e) => {
                        e.target.style.backgroundColor = '#fecaca';
                      }}
                      onMouseLeave={(e) => {
                        e.target.style.backgroundColor = '#fee2e2';
                      }}
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Add new role form */}
            <div style={{
              backgroundColor: '#f8fafc',
              border: '1px dashed #cbd5e1',
              borderRadius: '8px',
              padding: '20px'
            }}>
              <Input
                label="Role Name"
                name="roleName"
                value={newRole.name}
                onChange={(e) => setNewRole({ ...newRole, name: e.target.value })}
                placeholder="e.g., Project Manager, Developer, Designer"
                style={{ marginBottom: '16px' }}
              />

              <Input
                label="Role Description"
                name="roleDescription"
                type="textarea"
                value={newRole.description}
                onChange={(e) => setNewRole({ ...newRole, description: e.target.value })}
                placeholder="Brief description of this role..."
                rows={2}
                style={{ marginBottom: '16px' }}
              />

              <button
                type="button"
                onClick={handleAddRole}
                style={{
                  padding: '10px 20px',
                  backgroundColor: '#f1f5f9',
                  color: '#475569',
                  border: '1px solid #cbd5e1',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '600',
                  transition: 'all 0.2s',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
                onMouseEnter={(e) => {
                  e.target.style.backgroundColor = '#e2e8f0';
                }}
                onMouseLeave={(e) => {
                  e.target.style.backgroundColor = '#f1f5f9';
                }}
              >
                <span style={{ fontSize: '16px' }}>➕</span>
                Add Role
              </button>
            </div>
          </div>

          {/* Form Actions */}
          <div style={{
            display: 'flex',
            gap: '16px',
            justifyContent: 'flex-end',
            paddingTop: '24px',
            borderTop: '2px solid #e2e8f0'
          }}>
            <button
              type="button"
              onClick={() => navigate(-1)}
              disabled={loading}
              style={{
                padding: '14px 28px',
                backgroundColor: '#f8fafc',
                color: '#64748b',
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                cursor: loading ? 'not-allowed' : 'pointer',
                fontSize: '15px',
                fontWeight: '600',
                transition: 'all 0.2s',
                opacity: loading ? 0.6 : 1
              }}
              onMouseEnter={(e) => {
                if (!loading) {
                  e.target.style.backgroundColor = '#f1f5f9';
                }
              }}
              onMouseLeave={(e) => {
                if (!loading) {
                  e.target.style.backgroundColor = '#f8fafc';
                }
              }}
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={loading}
              style={{
                padding: '14px 32px',
                background: loading
                  ? '#94a3b8'
                  : 'linear-gradient(135deg, #3b82f6, #2563eb)',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: loading ? 'not-allowed' : 'pointer',
                fontSize: '15px',
                fontWeight: '600',
                transition: 'all 0.2s',
                boxShadow: loading ? 'none' : '0 4px 12px rgba(59, 130, 246, 0.3)',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
              onMouseEnter={(e) => {
                if (!loading) {
                  e.target.style.transform = 'translateY(-1px)';
                  e.target.style.boxShadow = '0 6px 16px rgba(59, 130, 246, 0.4)';
                }
              }}
              onMouseLeave={(e) => {
                if (!loading) {
                  e.target.style.transform = 'translateY(0)';
                  e.target.style.boxShadow = '0 4px 12px rgba(59, 130, 246, 0.3)';
                }
              }}
            >
              {loading ? (
                <>
                  <span style={{
                    width: '16px',
                    height: '16px',
                    border: '2px solid #ffffff',
                    borderTop: '2px solid transparent',
                    borderRadius: '50%',
                    animation: 'spin 1s linear infinite'
                  }}></span>
                  Creating...
                </>
              ) : (
                <>
                  <span style={{ fontSize: '18px' }}>🏢</span>
                  Create Company
                </>
              )}
            </button>
          </div>
        </form>

        {/* Add keyframe animation for loading spinner */}
        <style>
          {`
            @keyframes spin {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
          `}
        </style>
      </div>
    </Layout>
  );
};

export default CreateCompany;

