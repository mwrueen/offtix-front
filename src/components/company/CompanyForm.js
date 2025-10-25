import React, { useState } from 'react';
import { useCompany } from '../../context/CompanyContext';

const CompanyForm = ({ onClose }) => {
  const [formData, setFormData] = useState({
    name: '',
    description: ''
  });
  const [loading, setLoading] = useState(false);
  const { createCompany } = useCompany();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await createCompany(formData);
      onClose();
    } catch (error) {
      alert('Error creating company: ' + error.response?.data?.message);
    } finally {
      setLoading(false);
    }
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
        maxWidth: '500px',
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
      }}>
        <div style={{ marginBottom: '24px' }}>
          <h2 style={{
            margin: '0 0 8px 0',
            fontSize: '24px',
            fontWeight: '600',
            color: '#1e293b'
          }}>Create Company</h2>
          <p style={{
            margin: 0,
            fontSize: '14px',
            color: '#64748b'
          }}>Set up your company to manage teams and projects</p>
        </div>
        
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '20px' }}>
            <label style={{
              display: 'block',
              marginBottom: '8px',
              fontSize: '14px',
              fontWeight: '500',
              color: '#374151'
            }}>Company Name *</label>
            <input
              type="text"
              required
              placeholder="e.g., Acme Corporation, Tech Solutions Inc."
              style={{
                width: '100%',
                padding: '12px 16px',
                border: '1px solid #d1d5db',
                borderRadius: '8px',
                fontSize: '14px',
                boxSizing: 'border-box',
                transition: 'border-color 0.15s ease-in-out'
              }}
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
            />
          </div>
          
          <div style={{ marginBottom: '32px' }}>
            <label style={{
              display: 'block',
              marginBottom: '8px',
              fontSize: '14px',
              fontWeight: '500',
              color: '#374151'
            }}>Description</label>
            <textarea
              placeholder="Brief description of your company and what it does..."
              rows="4"
              style={{
                width: '100%',
                padding: '12px 16px',
                border: '1px solid #d1d5db',
                borderRadius: '8px',
                fontSize: '14px',
                boxSizing: 'border-box',
                resize: 'vertical',
                minHeight: '100px',
                lineHeight: '1.5'
              }}
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
            />
          </div>
          
          <div style={{
            display: 'flex',
            justifyContent: 'flex-end',
            gap: '12px',
            paddingTop: '24px',
            borderTop: '1px solid #e5e7eb'
          }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: '12px 24px',
                backgroundColor: 'white',
                color: '#374151',
                border: '1px solid #d1d5db',
                borderRadius: '8px',
                cursor: 'pointer',
                fontWeight: '500',
                fontSize: '14px'
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              style={{
                padding: '12px 24px',
                backgroundColor: '#3b82f6',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: loading ? 'not-allowed' : 'pointer',
                fontWeight: '500',
                fontSize: '14px',
                opacity: loading ? 0.5 : 1
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

export default CompanyForm;