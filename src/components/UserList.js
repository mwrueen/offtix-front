import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { userAPI } from '../services/api';
import Layout from './Layout';
import UserForm from './UserForm';

const DeleteConfirmModal = ({ user, onClose, onConfirm }) => {
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
        maxWidth: '400px',
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)'
      }}>
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>⚠️</div>
          <h3 style={{ margin: '0 0 8px 0', fontSize: '18px', fontWeight: '600', color: '#1e293b' }}>Delete User</h3>
          <p style={{ margin: 0, color: '#64748b', fontSize: '14px' }}>This action cannot be undone.</p>
        </div>
        
        <div style={{
          padding: '16px',
          backgroundColor: '#fef2f2',
          borderRadius: '8px',
          marginBottom: '24px',
          border: '1px solid #fecaca'
        }}>
          <p style={{ margin: '0 0 8px 0', fontSize: '14px', color: '#374151' }}>
            Are you sure you want to delete:
          </p>
          <div style={{ fontWeight: '600', color: '#1e293b' }}>{user?.name}</div>
          <div style={{ fontSize: '12px', color: '#64748b' }}>{user?.email}</div>
        </div>
        
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
          <button
            onClick={onClose}
            style={{
              padding: '12px 24px',
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
            onClick={onConfirm}
            style={{
              padding: '12px 24px',
              backgroundColor: '#ef4444',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '500'
            }}
          >
            Delete User
          </button>
        </div>
      </div>
    </div>
  );
};

const UserList = () => {
  const { state } = useAuth();
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(null);

  useEffect(() => {
    if (state.user?.role !== 'admin' && state.user?.role !== 'superadmin') {
      navigate('/dashboard');
      return;
    }
    fetchUsers();
  }, [state.user, navigate]);

  const fetchUsers = async () => {
    try {
      const response = await userAPI.getAll();
      setUsers(response.data);
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async (userId) => {
    try {
      await userAPI.delete(userId);
      fetchUsers();
      setShowDeleteModal(null);
    } catch (error) {
      console.error('Error deleting user:', error);
    }
  };

  const handleEditUser = (user) => {
    setEditingUser(user);
    setShowForm(true);
  };

  if (state.user?.role !== 'admin' && state.user?.role !== 'superadmin') {
    return null;
  }

  return (
    <Layout>
      <div style={{
        backgroundColor: 'white',
        padding: '30px',
        borderRadius: '12px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
          <h2 style={{ margin: 0, color: '#1e293b' }}>User Management</h2>
          <button 
            onClick={() => setShowForm(true)}
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
            Add New User
          </button>
        </div>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          {loading ? (
            Array(3).fill(0).map((_, index) => (
              <div key={index} style={{
                padding: '20px',
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <div>
                  <div style={{ width: '120px', height: '16px', backgroundColor: '#f1f5f9', borderRadius: '4px', marginBottom: '8px' }}></div>
                  <div style={{ width: '180px', height: '14px', backgroundColor: '#f1f5f9', borderRadius: '4px', marginBottom: '8px' }}></div>
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <div style={{ width: '50px', height: '20px', backgroundColor: '#f1f5f9', borderRadius: '10px' }}></div>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <div style={{ width: '50px', height: '32px', backgroundColor: '#f1f5f9', borderRadius: '6px' }}></div>
                  <div style={{ width: '60px', height: '32px', backgroundColor: '#f1f5f9', borderRadius: '6px' }}></div>
                </div>
              </div>
            ))
          ) : users.length > 0 ? (
            users.map((user) => (
              <div key={user._id} style={{
                padding: '20px',
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <div>
                  <div style={{ fontWeight: 'bold', color: '#1e293b' }}>{user.name}</div>
                  <div style={{ fontSize: '14px', color: '#64748b' }}>{user.email}</div>
                  <div style={{ display: 'flex', gap: '10px', marginTop: '5px' }}>
                    <span style={{
                      padding: '2px 8px',
                      borderRadius: '10px',
                      fontSize: '12px',
                      fontWeight: 'bold',
                      backgroundColor: user.role === 'superadmin' ? '#ef444415' : user.role === 'admin' ? '#3b82f615' : '#10b98115',
                      color: user.role === 'superadmin' ? '#ef4444' : user.role === 'admin' ? '#3b82f6' : '#10b981'
                    }}>
                      {user.role}
                    </span>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button 
                    onClick={() => navigate(`/users/${user._id}`)}
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
                    View
                  </button>
                  <button 
                    onClick={() => handleEditUser(user)}
                    style={{
                      padding: '8px 12px',
                      backgroundColor: '#3b82f6',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontSize: '12px'
                    }}
                  >
                    Edit
                  </button>
                  {state.user?.role === 'superadmin' && user._id !== state.user.id && (
                    <button 
                      onClick={() => setShowDeleteModal(user)}
                      style={{
                        padding: '8px 12px',
                        backgroundColor: '#ef4444',
                        color: 'white',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontSize: '12px'
                      }}
                    >
                      Delete
                    </button>
                  )}
                </div>
              </div>
            ))
          ) : (
            <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
              <div style={{ fontSize: '48px', marginBottom: '16px' }}>👥</div>
              <p>No users found.</p>
            </div>
          )}
        </div>
      </div>
      
      {showForm && (
        <UserForm 
          user={editingUser}
          onClose={() => {
            setShowForm(false);
            setEditingUser(null);
          }}
          onSave={() => {
            fetchUsers();
            setShowForm(false);
            setEditingUser(null);
          }}
        />
      )}
      
      {showDeleteModal && (
        <DeleteConfirmModal
          user={showDeleteModal}
          onClose={() => setShowDeleteModal(null)}
          onConfirm={() => handleDeleteUser(showDeleteModal._id)}
        />
      )}
    </Layout>
  );
};

export default UserList;