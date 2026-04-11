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
      <div className="space-y-8 pb-20 fade-in text-slate-900">
        <PageHeader
          title="System Users"
          subtitle="Directory of all personnel with platform access. Manage roles and permissions."
          icon={<div className="w-12 h-12 bg-white text-indigo-600 rounded-xl flex items-center justify-center text-2xl shadow-sm border border-slate-100">👥</div>}
          stats={[
            { label: 'Active Personnel', value: users.length },
            { label: 'Platform Access', value: state.user?.role?.charAt(0).toUpperCase() + state.user?.role?.slice(1) }
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
            Array(4).fill(0).map((_, i) => <div key={i} className="h-24 bg-white rounded-xl border border-slate-200 animate-pulse" />)
          ) : users.length > 0 ? (
            <div className="grid grid-cols-1 gap-3">
              {users.map((user) => (
                <div key={user._id} className="group bg-white p-5 rounded-2xl border border-slate-200 hover:border-indigo-200 hover:shadow-sm transition-all flex flex-col md:flex-row items-center gap-6">
                  <div className="w-12 h-12 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center text-indigo-600 text-lg font-bold shrink-0">
                    {user.name?.charAt(0)?.toUpperCase()}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-0.5">
                      <h3 className="text-base font-bold text-slate-900 truncate">{user.name}</h3>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${user.role === 'superadmin' ? 'bg-rose-50 text-rose-600 border-rose-100' :
                        user.role === 'admin' ? 'bg-indigo-50 text-indigo-600 border-indigo-100' :
                          'bg-slate-50 text-slate-500 border-slate-200'
                        }`}>
                        {user.role}
                      </span>
                    </div>
                    <div className="text-xs font-medium text-slate-500 truncate">{user.email}</div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => navigate(`/profile/view/${user._id}`)}
                      className="px-3 py-1.5 bg-white text-slate-600 rounded-lg text-xs font-bold hover:bg-slate-50 transition-colors border border-slate-200"
                    >
                      Profile
                    </button>
                    <button
                      onClick={() => navigate(`/users/${user._id}`)}
                      className="px-3 py-1.5 bg-slate-900 text-white rounded-lg text-xs font-bold hover:bg-slate-800 transition-all"
                    >
                      Manage
                    </button>
                    <button
                      onClick={() => handleEditUser(user)}
                      className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
                      title="Edit Basic Info"
                    >
                      ✏️
                    </button>
                    {state.user?.role === 'superadmin' && user._id !== state.user.id && (
                      <button
                        onClick={() => setShowDeleteModal(user)}
                        className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all"
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
            <div className="bg-white p-12 rounded-3xl border border-dashed border-slate-200 text-center space-y-4">
              <div className="text-4xl">👤</div>
              <div className="space-y-1">
                <h3 className="text-lg font-bold text-slate-900">No Users Found</h3>
                <p className="text-sm text-slate-500 max-w-sm mx-auto">The directory is currently empty. Add your first system user to get started.</p>
              </div>
              <button
                onClick={() => setShowForm(true)}
                className="px-6 py-2 bg-indigo-600 text-white rounded-lg font-bold text-sm hover:bg-indigo-700 transition-all shadow-md"
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
        message={`Are you sure you want to permanently delete "${showDeleteModal?.name}"? This action cannot be undone.`}
        itemName={showDeleteModal?.name}
      />
    </Layout>
  );
};

export default UserList;