import React, { useState, useEffect } from 'react';
import { useCompany } from '../../context/CompanyContext';
import api from '../../services/api';

const MemberForm = ({ onClose }) => {
  const [users, setUsers] = useState([]);
  const [formData, setFormData] = useState({
    userId: '',
    designation: '',
    salary: 0
  });
  const [loading, setLoading] = useState(false);
  const { company, addMember } = useCompany();

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await api.get('/users');
        setUsers(response.data);
      } catch (error) {
        console.error('Error fetching users:', error);
      }
    };
    fetchUsers();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await addMember(formData.userId, formData.designation, formData.salary);
      onClose();
    } catch (error) {
      alert('Error adding member: ' + error.response?.data?.message);
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
          }}>Add Team Member</h2>
          <p style={{
            margin: 0,
            fontSize: '14px',
            color: '#64748b'
          }}>Invite a user to join your company team</p>
        </div>
        
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '20px' }}>
            <label style={{
              display: 'block',
              marginBottom: '8px',
              fontSize: '14px',
              fontWeight: '500',
              color: '#374151'
            }}>Select User *</label>
            <select
              required
              style={{
                width: '100%',
                padding: '12px 16px',
                border: '1px solid #d1d5db',
                borderRadius: '8px',
                fontSize: '14px',
                boxSizing: 'border-box',
                backgroundColor: 'white',
                cursor: 'pointer'
              }}
              value={formData.userId}
              onChange={(e) => setFormData({...formData, userId: e.target.value})}
            >
              <option value="">Choose a user to add...</option>
              {users.map(user => (
                <option key={user._id} value={user._id}>
                  {user.name} ({user.email})
                </option>
              ))}
            </select>
          </div>
          
          <div style={{ marginBottom: '20px' }}>
            <label style={{
              display: 'block',
              marginBottom: '8px',
              fontSize: '14px',
              fontWeight: '500',
              color: '#374151'
            }}>Designation *</label>
            <select
              required
              style={{
                width: '100%',
                padding: '12px 16px',
                border: '1px solid #d1d5db',
                borderRadius: '8px',
                fontSize: '14px',
                boxSizing: 'border-box',
                backgroundColor: 'white',
                cursor: 'pointer'
              }}
              value={formData.designation}
              onChange={(e) => setFormData({...formData, designation: e.target.value})}
            >
              <option value="">Select designation...</option>
              {company?.designations?.map((designation, index) => (
                <option key={index} value={designation.name}>
                  {designation.name}
                </option>
              ))}
            </select>
          </div>
          
          <div style={{ marginBottom: '32px' }}>
            <label style={{
              display: 'block',
              marginBottom: '8px',
              fontSize: '14px',
              fontWeight: '500',
              color: '#374151'
            }}>Monthly Salary (Optional)</label>
            <input
              type="number"
              placeholder="Enter monthly salary"
              value={formData.salary}
              onChange={(e) => setFormData({...formData, salary: Number(e.target.value)})}
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
              {loading ? 'Adding...' : 'Add Member'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default MemberForm;