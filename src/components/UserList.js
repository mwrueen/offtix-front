import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { userAPI } from '../services/api';
import Layout from './Layout';
import UserForm from './UserForm';
import DeleteConfirmModal from './common/DeleteConfirmModal';
import PageHeader from './PageHeader';

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
      setLoading(true);
      const response = await userAPI.getAll();
      setUsers(response.data);
    } catch (error) {
      console.error('Failed to fetch users', error);
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
      console.error('Failed to delete user', error);
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
      <div className="space-y-8 pb-12">
        <PageHeader
          title="User Management"
          subtitle="Manage system users, assigned roles, and access permissions across the organization."
          icon={<div className="w-12 h-12 bg-white text-indigo-600 rounded-xl flex items-center justify-center text-2xl shadow-sm border border-slate-100">👥</div>}
          stats={[
            { label: 'Total Users', value: users.length },
            { label: 'Your Role', value: state.user?.role?.toUpperCase() }
          ]}
          actions={
            <button
              onClick={() => setShowForm(true)}
              className="px-6 py-2.5 bg-indigo-600 text-white rounded-lg font-bold text-sm hover:bg-indigo-700 transition-all shadow-sm flex items-center gap-2"
            >
              <span>+</span>
              <span>Add User</span>
            </button>
          }
        />

        <div className="space-y-4">
          {loading ? (
            Array(4).fill(0).map((_, i) => <div key={i} className="h-20 bg-white rounded-xl border border-slate-100 animate-pulse" />)
          ) : users.length > 0 ? (
            <div className="grid grid-cols-1 gap-4">
              {users.map((user) => (
                <div key={user._id} className="group bg-white p-6 rounded-2xl border border-slate-200 hover:border-indigo-400 hover:shadow-md transition-all flex flex-col md:flex-row items-center gap-6">
                  <div className="w-12 h-12 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-700 text-lg font-bold shrink-0">
                    {user.name?.charAt(0)?.toUpperCase()}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-1">
                      <h3 className="text-lg font-bold text-slate-800 truncate leading-tight">{user.name}</h3>
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border transition-all ${user.role === 'superadmin' ? 'bg-rose-50 text-rose-700 border-rose-100' :
                        user.role === 'admin' ? 'bg-indigo-50 text-indigo-700 border-indigo-100' :
                          'bg-slate-50 text-slate-600 border-slate-200'
                        }`}>
                        {user.role}
                      </span>
                    </div>
                    <div className="text-xs font-medium text-slate-500 truncate">{user.email}</div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => navigate(`/profile/view/${user._id}`)}
                      className="px-4 py-2 bg-slate-900 text-white rounded-lg text-xs font-bold hover:bg-indigo-600 transition-all border border-slate-800"
                    >
                      View CV
                    </button>
                    <button
                      onClick={() => navigate(`/users/${user._id}`)}
                      className="px-4 py-2 bg-slate-50 text-slate-600 rounded-lg text-xs font-bold hover:bg-slate-100 transition-colors border border-slate-200"
                    >
                      Audit
                    </button>
                    <button
                      onClick={() => handleEditUser(user)}
                      className="p-2 bg-indigo-50 text-indigo-600 rounded-lg hover:bg-indigo-100 transition-colors border border-indigo-100"
                      title="Edit User"
                    >
                      ✏️
                    </button>
                    {state.user?.role === 'superadmin' && user._id !== state.user.id && (
                      <button
                        onClick={() => setShowDeleteModal(user)}
                        className="p-2 bg-rose-50 text-rose-600 rounded-lg hover:bg-rose-100 transition-colors border border-rose-100"
                        title="Delete User"
                      >
                        🗑
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white p-12 rounded-3xl border-2 border-dashed border-slate-100 text-center space-y-6">
              <div className="text-6xl opacity-20">👤</div>
              <div className="space-y-2">
                <h3 className="text-2xl font-bold text-slate-800">No Users Found</h3>
                <p className="text-sm text-slate-500 max-w-sm mx-auto">The user directory is currently empty. Start by adding your first system user.</p>
              </div>
              <button
                onClick={() => setShowForm(true)}
                className="px-8 py-3 bg-indigo-600 text-white rounded-lg font-bold text-sm hover:bg-indigo-700 transition-all shadow-md"
              >
                Add User
              </button>
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

      <DeleteConfirmModal
        isOpen={!!showDeleteModal}
        onClose={() => setShowDeleteModal(null)}
        onConfirm={() => handleDeleteUser(showDeleteModal._id)}
        title="Delete User"
        message={`Are you sure you want to permanently delete "${showDeleteModal?.name}"? This action cannot be undone and the user will lose all system access.`}
        itemName={showDeleteModal?.name}
      />
    </Layout>
  );
};

export default UserList;