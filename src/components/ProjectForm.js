import React, { useState } from 'react';
import { useCompany } from '../context/CompanyContext';

const ProjectForm = ({ onSubmit, initialData = null, onCancel }) => {
  const { company } = useCompany();
  const [formData, setFormData] = useState({
    title: initialData?.title || '',
    description: initialData?.description || '',
    status: initialData?.status || 'planning',
    priority: initialData?.priority || 'medium',
    endDate: initialData?.endDate ? new Date(initialData.endDate).toISOString().split('T')[0] : '',
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    const submitData = { ...formData };
    if (submitData.endDate) {
      submitData.endDate = new Date(submitData.endDate);
    }
    onSubmit(submitData);
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const inputStyle = {
    width: '100%',
    padding: '12px 16px',
    border: '1px solid #d1d5db',
    borderRadius: '6px',
    fontSize: '14px',
    fontFamily: 'inherit',
    transition: 'border-color 0.15s ease-in-out, box-shadow 0.15s ease-in-out',
    backgroundColor: '#ffffff',
    boxSizing: 'border-box'
  };

  const labelStyle = {
    display: 'block',
    marginBottom: '8px',
    fontSize: '14px',
    fontWeight: '500',
    color: '#374151',
    lineHeight: '1.25'
  };

  const fieldGroupStyle = {
    marginBottom: '24px'
  };

  return (
    <div style={{
      backgroundColor: '#ffffff',
      border: '1px solid #e5e7eb',
      borderRadius: '8px',
      padding: '32px',
      maxWidth: '800px'
    }}>
      <div style={{ marginBottom: '24px' }}>
        <h3 style={{ 
          margin: '0 0 8px 0', 
          fontSize: '18px', 
          fontWeight: '600', 
          color: '#111827' 
        }}>
          {initialData ? 'Edit Project' : 'Create New Project'}
        </h3>
        <p style={{ 
          margin: 0, 
          fontSize: '14px', 
          color: '#6b7280' 
        }}>
          {initialData ? 'Update project information below' : 'Fill in the details to create a new project'}
        </p>
        {company && (
          <div style={{
            marginTop: '12px',
            padding: '12px',
            backgroundColor: '#f3f4f6',
            borderRadius: '6px',
            fontSize: '14px',
            color: '#374151'
          }}>
            <strong>Company:</strong> {company.name}
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit}>
        <div style={fieldGroupStyle}>
          <label style={labelStyle}>Project Title *</label>
          <input
            type="text"
            name="title"
            placeholder="e.g., Website Redesign, Mobile App Development"
            value={formData.title}
            onChange={handleChange}
            required
            style={{
              ...inputStyle,
              ':focus': {
                borderColor: '#3b82f6',
                outline: 'none',
                boxShadow: '0 0 0 3px rgba(59, 130, 246, 0.1)'
              }
            }}
          />
        </div>
        
        <div style={fieldGroupStyle}>
          <label style={labelStyle}>Project Description *</label>
          <textarea
            name="description"
            placeholder="Provide a detailed description of the project objectives, scope, and deliverables..."
            value={formData.description}
            onChange={handleChange}
            required
            rows="4"
            style={{
              ...inputStyle,
              resize: 'vertical',
              minHeight: '120px',
              lineHeight: '1.5'
            }}
          />
        </div>
        
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
          gap: '20px',
          marginBottom: '32px'
        }}>
          <div>
            <label style={labelStyle}>Project Status</label>
            <select 
              name="status" 
              value={formData.status} 
              onChange={handleChange} 
              style={{
                ...inputStyle,
                cursor: 'pointer'
              }}
            >
              <option value="planning">Planning</option>
              <option value="active">Active</option>
              <option value="completed">Completed</option>
              <option value="on-hold">On Hold</option>
            </select>
          </div>
          
          <div>
            <label style={labelStyle}>Priority Level</label>
            <select 
              name="priority" 
              value={formData.priority} 
              onChange={handleChange} 
              style={{
                ...inputStyle,
                cursor: 'pointer'
              }}
            >
              <option value="low">Low Priority</option>
              <option value="medium">Medium Priority</option>
              <option value="high">High Priority</option>
              <option value="urgent">Urgent</option>
            </select>
          </div>
          
          <div>
            <label style={labelStyle}>Target Completion Date</label>
            <input
              type="date"
              name="endDate"
              value={formData.endDate}
              onChange={handleChange}
              style={{
                ...inputStyle,
                cursor: 'pointer'
              }}
            />
          </div>
        </div>
        
        <div style={{
          display: 'flex',
          justifyContent: 'flex-end',
          gap: '12px',
          paddingTop: '24px',
          borderTop: '1px solid #e5e7eb'
        }}>
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              style={{
                padding: '12px 24px',
                backgroundColor: '#ffffff',
                color: '#374151',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                cursor: 'pointer',
                fontWeight: '500',
                fontSize: '14px',
                transition: 'all 0.15s ease-in-out'
              }}
            >
              Cancel
            </button>
          )}
          <button
            type="submit"
            style={{
              padding: '12px 24px',
              backgroundColor: '#3b82f6',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontWeight: '500',
              fontSize: '14px',
              transition: 'all 0.15s ease-in-out',
              boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)'
            }}
          >
            {initialData ? 'Update Project' : 'Create Project'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ProjectForm;