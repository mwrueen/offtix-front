import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { userAPI } from '../../services/api';
import Layout from '../layout/Layout';
import UserForm from './UserForm';
import DeleteConfirmModal from '../common/DeleteConfirmModal';
import PageHeader from '../layout/PageHeader';

const UserList = () => {
  const { state } = useAuth();
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(null);
  
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalUsers, setTotalUsers] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const limit = 10;

  useEffect(() => {
    if (state.user?.role !== 'admin' && state.user?.role !== 'superadmin') {
      navigate('/dashboard');
      return;
    }

    const delayDebounceFn = setTimeout(() => {
      fetchUsers(currentPage, searchQuery);
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [state.user, navigate, currentPage, searchQuery]);

  const fetchUsers = async (page = 1, search = '') => {
    try {
      setLoading(true);
      const response = await userAPI.getAll(null, page, limit, search);
      if (response.data && response.data.pagination) {
        setUsers(response.data.data);
        setTotalPages(response.data.pagination.totalPages);
        setTotalUsers(response.data.pagination.total);
      } else {
        setUsers(response.data);
        setTotalUsers(response.data.length);
        setTotalPages(1);
      }
    } catch (error) {
      console.error('Failed to fetch users', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async (userId) => {
    try {
      await userAPI.delete(userId);
      fetchUsers(currentPage, searchQuery);
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
            { label: 'Active Personnel', value: totalUsers },
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
          <div className="flex justify-between items-center bg-white p-3 rounded-2xl border border-slate-200 shadow-sm">
            <div className="relative w-full max-w-md">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="h-5 w-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <input
                type="text"
                placeholder="Search users by name or email..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                className="block w-full pl-10 pr-3 py-2 border border-slate-200 rounded-xl leading-5 bg-slate-50 placeholder-slate-400 focus:outline-none focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm transition-all"
              />
            </div>
          </div>

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

          {!loading && users.length > 0 && totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-slate-200 bg-white px-4 py-3 sm:px-6 rounded-2xl mt-4">
              <div className="flex flex-1 justify-between sm:hidden">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="relative inline-flex items-center rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                >
                  Previous
                </button>
                <button
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="relative ml-3 inline-flex items-center rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                >
                  Next
                </button>
              </div>
              <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm text-slate-700">
                    Showing <span className="font-medium">{(currentPage - 1) * limit + 1}</span> to <span className="font-medium">{Math.min(currentPage * limit, totalUsers)}</span> of{' '}
                    <span className="font-medium">{totalUsers}</span> results
                  </p>
                </div>
                <div>
                  <nav className="isolate inline-flex -space-x-px rounded-md shadow-sm" aria-label="Pagination">
                    <button
                      onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                      disabled={currentPage === 1}
                      className="relative inline-flex items-center rounded-l-md px-2 py-2 text-slate-400 ring-1 ring-inset ring-slate-300 hover:bg-slate-50 focus:z-20 focus:outline-offset-0 disabled:opacity-50"
                    >
                      <span className="sr-only">Previous</span>
                      <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                        <path fillRule="evenodd" d="M12.79 5.23a.75.75 0 01-.02 1.06L8.832 10l3.938 3.71a.75.75 0 11-1.04 1.08l-4.5-4.25a.75.75 0 010-1.08l4.5-4.25a.75.75 0 011.06.02z" clipRule="evenodd" />
                      </svg>
                    </button>
                    {[...Array(totalPages)].map((_, i) => (
                      <button
                        key={i + 1}
                        onClick={() => setCurrentPage(i + 1)}
                        className={`relative inline-flex items-center px-4 py-2 text-sm font-semibold ${currentPage === i + 1 ? 'z-10 bg-indigo-600 text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600' : 'text-slate-900 ring-1 ring-inset ring-slate-300 hover:bg-slate-50 focus:z-20 focus:outline-offset-0'}`}
                      >
                        {i + 1}
                      </button>
                    ))}
                    <button
                      onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                      disabled={currentPage === totalPages}
                      className="relative inline-flex items-center rounded-r-md px-2 py-2 text-slate-400 ring-1 ring-inset ring-slate-300 hover:bg-slate-50 focus:z-20 focus:outline-offset-0 disabled:opacity-50"
                    >
                      <span className="sr-only">Next</span>
                      <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                        <path fillRule="evenodd" d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z" clipRule="evenodd" />
                      </svg>
                    </button>
                  </nav>
                </div>
              </div>
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
            fetchUsers(currentPage, searchQuery);
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
