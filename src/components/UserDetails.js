import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Layout from './Layout';
import { userAPI, BASE_SERVER_URL } from '../services/api';
import { useAuth } from '../context/AuthContext';
import PageHeader from './PageHeader';

const UserDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { state } = useAuth();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [updatingPassword, setUpdatingPassword] = useState(false);

  useEffect(() => {
    if (state.user?.role !== 'admin' && state.user?.role !== 'superadmin') {
      navigate('/dashboard');
      return;
    }
    fetchUser();
  }, [id, state.user, navigate]);

  const fetchUser = async () => {
    try {
      setLoading(true);
      const response = await userAPI.getById(id);
      setUser(response.data);
    } catch (error) {
      console.error('Failed to retrieve user data', error);
      navigate('/users');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordUpdate = async (e) => {
    e.preventDefault();
    setPasswordError('');
    setPasswordSuccess('');

    if (!newPassword || newPassword.length < 6) {
      setPasswordError('Password must be at least 6 characters.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError('Passwords do not match.');
      return;
    }

    setUpdatingPassword(true);

    try {
      await userAPI.updatePassword(id, newPassword);
      setPasswordSuccess('Password updated successfully.');
      setNewPassword('');
      setConfirmPassword('');

      setTimeout(() => {
        setShowPasswordModal(false);
        setPasswordSuccess('');
      }, 2000);
    } catch (error) {
      setPasswordError(error.response?.data?.error || 'Failed to update password.');
    } finally {
      setUpdatingPassword(false);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="max-w-7xl mx-auto px-6 py-40 text-center animate-pulse flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-2 border-slate-200 border-t-indigo-600 rounded-full animate-spin" />
          <p className="text-sm font-medium text-slate-400">Loading profile data...</p>
        </div>
      </Layout>
    );
  }

  if (!user) {
    return (
      <Layout>
        <div className="max-w-7xl mx-auto px-6 py-40 text-center space-y-8">
          <h2 className="text-2xl font-bold text-slate-400">User Not Found</h2>
          <button onClick={() => navigate('/users')} className="px-6 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-all shadow-sm">Back to Directory</button>
        </div>
      </Layout>
    );
  }

  const profile = user.profile || {};
  const getImageUrl = (url) => {
    if (!url) return '';
    if (url.startsWith('http')) return url;
    return `${BASE_SERVER_URL}${url}`;
  };

  return (
    <Layout>
      <div className="max-w-6xl mx-auto space-y-8 pb-32 animate-in fade-in duration-700">
        <PageHeader
          title="User Profile"
          subtitle={`Professional profile information for ${user.name}`}
          icon="👤"
          stats={[
            { label: 'Platform Role', value: user.role.charAt(0).toUpperCase() + user.role.slice(1) },
            { label: 'Join Year', value: new Date(user.createdAt).getFullYear().toString() }
          ]}
          actions={
            <div className="flex gap-4">
              <button onClick={() => navigate(-1)} className="px-4 py-2 text-sm font-semibold text-slate-500 hover:text-slate-900 transition-colors">Go Back</button>
              {state.user?.role === 'superadmin' && (
                <button
                  onClick={() => setShowPasswordModal(true)}
                  className="px-6 py-2.5 bg-slate-900 text-white rounded-xl font-bold text-sm shadow-md hover:bg-slate-800 transition-all flex items-center gap-2"
                >
                  <span>🔑</span> Change Password
                </button>
              )}
            </div>
          }
        />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Sidebar */}
          <div className="lg:col-span-4 space-y-8">
            <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm flex flex-col items-center text-center">
              <div className="w-32 h-32 rounded-3xl bg-slate-50 border border-slate-100 shadow-sm overflow-hidden mb-6 relative group">
                {profile.profilePicture ? (
                  <img src={getImageUrl(profile.profilePicture)} alt="" className="w-full h-full object-cover transition-transform group-hover:scale-105 duration-500" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-indigo-600 text-4xl font-bold">{user.name.charAt(0)}</div>
                )}
              </div>
              <h2 className="text-xl font-bold text-slate-900 mb-1 leading-tight">{user.name}</h2>
              <p className="text-sm font-medium text-slate-500 mb-6">{user.email}</p>

              <div className="flex flex-wrap gap-2 justify-center">
                <span className={`px-4 py-1.5 rounded-full text-[11px] font-bold border ${user.role === 'superadmin' ? 'bg-rose-50 text-rose-600 border-rose-100' : 'bg-indigo-50 text-indigo-600 border-indigo-100'}`}>
                  {user.role.toUpperCase()}
                </span>
                {profile.title && (
                  <span className="px-4 py-1.5 rounded-full bg-slate-50 text-slate-600 border border-slate-200 text-[11px] font-bold">
                    {profile.title}
                  </span>
                )}
              </div>
            </div>

            <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm space-y-6">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest border-b border-slate-50 pb-4">Personal Info</h4>
              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-lg shrink-0">📅</div>
                  <div className="pt-0.5">
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Joined Offtix</div>
                    <div className="text-sm font-semibold text-slate-900">{new Date(user.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}</div>
                  </div>
                </div>
                {profile.location && (
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-lg shrink-0">📍</div>
                    <div className="pt-0.5">
                      <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Location</div>
                      <div className="text-sm font-semibold text-slate-900">{profile.location}</div>
                    </div>
                  </div>
                )}
                {profile.phone && (
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-lg shrink-0">📱</div>
                    <div className="pt-0.5">
                      <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Phone</div>
                      <div className="text-sm font-semibold text-slate-900">{profile.phone}</div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-8 space-y-8">
            {profile.summary && (
              <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest border-b border-slate-50 pb-4 mb-6">About</h4>
                <p className="text-base text-slate-600 font-medium leading-relaxed">
                  {profile.summary}
                </p>
              </div>
            )}

            {profile.skills && profile.skills.length > 0 && (
              <div className="space-y-4">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest px-1">Skills & Expertise</h4>
                <div className="flex flex-wrap gap-2">
                  {profile.skills.map((skill, index) => (
                    <span key={index} className="px-4 py-2 bg-indigo-50/40 border border-indigo-100 rounded-xl text-xs font-bold text-indigo-700 shadow-sm">
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {profile.experience && profile.experience.length > 0 && (
              <div className="space-y-4">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest px-1">Work History</h4>
                <div className="space-y-4">
                  {profile.experience.map((exp, index) => (
                    <div key={index} className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm hover:border-indigo-100 transition-colors">
                      <div className="flex flex-col md:flex-row justify-between mb-4 gap-2">
                        <div>
                          <h5 className="text-lg font-bold text-slate-900 leading-snug">{exp.position}</h5>
                          <p className="text-sm font-bold text-indigo-600">{exp.company}</p>
                        </div>
                        <div className="text-xs font-bold text-slate-400 shrink-0">
                          {exp.startDate?.split('-')[0]} — {exp.current ? 'Present' : exp.endDate?.split('-')[0]}
                        </div>
                      </div>
                      <p className="text-sm font-medium text-slate-600 leading-relaxed">
                        {exp.description}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {!profile.summary && (!profile.skills || profile.skills.length === 0) && (!profile.experience || profile.experience.length === 0) && (
              <div className="py-24 bg-white rounded-2xl border border-dashed border-slate-200 text-center flex flex-col items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-slate-50 flex items-center justify-center text-2xl">📄</div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 uppercase tracking-widest mb-1">Profile incomplete</h3>
                  <p className="text-xs text-slate-500">No professional details have been added to this profile yet.</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {showPasswordModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-[2000] p-4 font-sans animate-in fade-in">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-in zoom-in-95">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center">
              <div>
                <h3 className="text-lg font-bold text-slate-900">Change Password</h3>
                <p className="text-xs font-medium text-slate-500">Updating security access for {user.name}</p>
              </div>
              <button onClick={() => setShowPasswordModal(false)} className="text-slate-400 hover:text-slate-900 text-2xl font-light">×</button>
            </div>

            <form onSubmit={handlePasswordUpdate} className="p-6 space-y-6">
              {passwordError && <div className="p-3 bg-rose-50 text-rose-600 rounded-lg text-xs font-bold flex items-center gap-2"><span>⚠️</span> {passwordError}</div>}
              {passwordSuccess && <div className="p-3 bg-emerald-50 text-emerald-600 rounded-lg text-xs font-bold flex items-center gap-2"><span>✅</span> {passwordSuccess}</div>}

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">New Password</label>
                <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder="Minimum 6 characters" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all" disabled={updatingPassword} />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Confirm New Password</label>
                <input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} placeholder="Repeat password to confirm" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all" disabled={updatingPassword} />
              </div>

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowPasswordModal(false)} className="px-4 py-2.5 text-sm font-bold border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50 transition-all">Cancel</button>
                <button type="submit" disabled={updatingPassword} className="flex-1 py-2.5 bg-indigo-600 text-white rounded-xl font-bold text-sm shadow-md hover:bg-indigo-700 transition-all disabled:opacity-50">
                  {updatingPassword ? 'Saving Changes...' : 'Update Password'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default UserDetails;