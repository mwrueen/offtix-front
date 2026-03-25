import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { userAPI } from '../services/api';
import Layout from './Layout';
import UserForm from './UserForm';
import DeleteConfirmModal from './common/DeleteConfirmModal';


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
      <div className="bg-white p-10 rounded-[40px] shadow-sm border border-slate-100 mb-10 transition-all hover:shadow-md">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-10">
          <div>
            <h1 className="text-4xl font-black text-slate-800 tracking-tight flex items-center gap-4">
              <span className="p-3 bg-indigo-50 rounded-2xl text-2xl">👥</span> Identity Hub
            </h1>
            <p className="text-slate-500 font-medium mt-2 max-w-md">
              Orchestrate user access and cryptographic credentials across the network.
            </p>
          </div>
          <button
            onClick={() => setShowForm(true)}
            className="px-8 py-4 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-indigo-600 transition-all active:scale-95 shadow-xl shadow-slate-200 flex items-center gap-3"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M12 5v14M5 12h14" /></svg>
            Provision User
          </button>
        </div>

        <div className="space-y-4">
          {loading ? (
            Array(3).fill(0).map((_, index) => (
              <div key={index} className="p-8 border border-slate-100 rounded-[32px] flex flex-col md:flex-row justify-between items-start md:items-center gap-6 animate-pulse bg-slate-50/50">
                <div className="flex-1 space-y-3">
                  <div className="h-6 bg-slate-200 rounded-lg w-1/4"></div>
                  <div className="h-4 bg-slate-100 rounded-lg w-1/3"></div>
                  <div className="h-5 bg-slate-200 rounded-full w-20"></div>
                </div>
                <div className="flex gap-4">
                  <div className="h-10 bg-slate-200 rounded-xl w-24"></div>
                  <div className="h-10 bg-slate-200 rounded-xl w-24"></div>
                </div>
              </div>
            ))
          ) : users.length > 0 ? (
            <div className="grid grid-cols-1 gap-6">
              {users.map((user) => (
                <div key={user._id} className="group p-8 border border-slate-100 rounded-[32px] flex flex-col md:flex-row justify-between items-start md:items-center gap-6 hover:shadow-2xl hover:shadow-slate-100 hover:border-indigo-100 transition-all duration-500 bg-white relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-1.5 h-full bg-slate-50 group-hover:bg-indigo-500 transition-colors"></div>

                  <div className="flex items-center gap-6 flex-1 min-w-0">
                    <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center text-2xl font-black text-slate-400 group-hover:bg-indigo-600 group-hover:text-white group-hover:rotate-12 transition-all duration-500 shrink-0">
                      {user.name?.charAt(0)?.toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <div className="text-xl font-black text-slate-800 tracking-tight truncate group-hover:text-indigo-600 transition-colors">{user.name}</div>
                      <div className="text-sm font-medium text-slate-500 truncate mb-3">{user.email}</div>
                      <span className={`inline-block px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${user.role === 'superadmin' ? 'bg-rose-50 text-rose-600 border-rose-100' :
                          user.role === 'admin' ? 'bg-indigo-50 text-indigo-600 border-indigo-100' :
                            'bg-emerald-50 text-emerald-600 border-emerald-100'
                        }`}>
                        {user.role}
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-3 relative z-10">
                    <button
                      onClick={() => navigate(`/users/${user._id}`)}
                      className="px-6 py-3 bg-white border border-slate-100 text-slate-600 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-50 hover:border-slate-200 transition-all active:scale-95 flex items-center gap-2"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></svg>
                      Inspect
                    </button>
                    <button
                      onClick={() => handleEditUser(user)}
                      className="px-6 py-3 bg-white border border-slate-100 text-indigo-600 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-50 hover:border-indigo-100 transition-all active:scale-95 flex items-center gap-2"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>
                      Modify
                    </button>
                    {state.user?.role === 'superadmin' && user._id !== state.user.id && (
                      <button
                        onClick={() => setShowDeleteModal(user)}
                        className="px-6 py-3 bg-white border border-slate-100 text-rose-500 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-rose-50 hover:border-rose-100 transition-all active:scale-95 flex items-center gap-2"
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M10 11v6M14 11v6" /></svg>
                        Purge
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-slate-50 p-24 rounded-[56px] border-4 border-dashed border-slate-200 text-center animate-in zoom-in duration-700">
              <div className="text-8xl mb-6 opacity-20 grayscale">👥</div>
              <h3 className="text-2xl font-black text-slate-800">Identity Void</h3>
              <p className="text-slate-500 font-medium max-w-sm mx-auto mt-2 italic">The central directory is currently devoid of registered subjects.</p>
              <button
                onClick={() => setShowForm(true)}
                className="mt-10 px-8 py-4 bg-indigo-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-100"
              >
                Create Initial Node
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
        title="Access Revocation"
        message="Propagating purge request. This user's cryptographic identity will be permanently excised from the network. Proceed with caution."
        itemName={showDeleteModal?.name}
      />
    </Layout>
  );
};

export default UserList;