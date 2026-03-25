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
        <div className="max-w-7xl mx-auto px-6 py-40 text-center animate-pulse space-y-8">
          <div className="w-12 h-12 border-4 border-slate-100 border-t-indigo-600 rounded-full animate-spin mx-auto shadow-sm" />
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest italic">Loading user profile...</p>
        </div>
      </Layout>
    );
  }

  if (!user) {
    return (
      <Layout>
        <div className="max-w-7xl mx-auto px-6 py-40 text-center space-y-12">
          <div className="text-8xl grayscale opacity-20">🚫</div>
          <h2 className="text-3xl font-bold text-slate-900 uppercase tracking-tight italic">User Not Found</h2>
          <button onClick={() => navigate('/users')} className="px-10 py-4 bg-indigo-600 text-white rounded-xl font-bold text-xs uppercase tracking-widest shadow-lg active:scale-95">Back to Directory</button>
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
      <div className="max-w-6xl mx-auto space-y-12 pb-40 animate-in fade-in duration-700">
        <PageHeader
          title="User Audit Detail"
          subtitle={`Viewing comprehensive professional profile for ${user.name}.`}
          icon="👥"
          stats={[
            { label: 'Platform Role', value: user.role.toUpperCase() },
            { label: 'Entity ID', value: user._id.slice(-6).toUpperCase() }
          ]}
          actions={
            <div className="flex gap-4">
              <button onClick={() => navigate(-1)} className="px-8 py-3.5 text-xs font-bold uppercase tracking-widest text-slate-400 hover:text-slate-900 transition-all italic underline underline-offset-8">Go Back</button>
              {state.user?.role === 'superadmin' && (
                <button onClick={() => setShowPasswordModal(true)} className="px-10 py-3.5 bg-slate-900 text-white rounded-xl font-bold text-xs uppercase tracking-widest shadow-lg hover:bg-indigo-600 transition-all active:scale-95 group relative overflow-hidden">
                  <span className="relative z-10 flex items-center gap-2">🔑 Update Credentials</span>
                </button>
              )}
            </div>
          }
        />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 font-sans">
          <div className="lg:col-span-4 space-y-8 text-center md:text-left">
            <div className="bg-white p-10 rounded-[2.5rem] border border-slate-200 shadow-sm relative overflow-hidden group">
              <div className="relative z-10 flex flex-col items-center">
                <div className="w-40 h-40 rounded-[2.5rem] bg-slate-900 border-4 border-white shadow-xl overflow-hidden mb-8 group-hover:scale-105 transition-all duration-700">
                  {profile.profilePicture ? (
                    <img src={getImageUrl(profile.profilePicture)} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-white text-5xl font-bold bg-indigo-600">{user.name.charAt(0)}</div>
                  )}
                </div>
                <h2 className="text-2xl font-bold text-slate-900 uppercase tracking-tight mb-2 italic">{user.name}</h2>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-8">{user.email}</p>
                <div className="flex flex-wrap gap-2 justify-center">
                  <span className={`px-6 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest shadow-sm ${user.role === 'superadmin' ? 'bg-rose-600 text-white' : 'bg-indigo-600 text-white'}`}>{user.role}</span>
                  {profile.title && <span className="px-6 py-2 rounded-xl bg-slate-900 text-white text-[10px] font-bold uppercase tracking-widest italic">{profile.title}</span>}
                </div>
              </div>
            </div>

            <div className="bg-slate-900 p-8 rounded-[2.5rem] text-white shadow-xl space-y-8 italic">
              <h4 className="text-[10px] font-bold uppercase tracking-widest text-indigo-400 opacity-80">Metadata Summary</h4>
              <div className="space-y-6">
                <div className="flex items-center gap-6">
                  <div className="text-3xl opacity-40 grayscale group-hover:grayscale-0 transition-all">📅</div>
                  <div>
                    <div className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-1">Account Created</div>
                    <div className="text-sm font-bold uppercase tracking-tight">{new Date(user.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}</div>
                  </div>
                </div>
                {profile.location && (
                  <div className="flex items-center gap-6">
                    <div className="text-3xl opacity-40 grayscale group-hover:grayscale-0 transition-all">📍</div>
                    <div>
                      <div className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-1">Base Location</div>
                      <div className="text-sm font-bold uppercase tracking-tight">{profile.location}</div>
                    </div>
                  </div>
                )}
                {profile.phone && (
                  <div className="flex items-center gap-6">
                    <div className="text-3xl opacity-40 grayscale group-hover:grayscale-0 transition-all">📡</div>
                    <div>
                      <div className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-1">Contact Link</div>
                      <div className="text-sm font-bold uppercase tracking-tight">{profile.phone}</div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="lg:col-span-8 space-y-10">
            {profile.summary && (
              <div className="bg-white p-12 rounded-[2.5rem] border border-slate-200 shadow-sm relative overflow-hidden group">
                <h4 className="text-[10px] font-bold uppercase tracking-widest text-slate-400 italic mb-8 border-b border-slate-100 pb-4">Professional Overview</h4>
                <p className="text-base font-medium text-slate-600 leading-relaxed italic border-l-4 border-indigo-200 pl-10">
                  "{profile.summary}"
                </p>
              </div>
            )}

            {profile.skills && profile.skills.length > 0 && (
              <div className="space-y-6">
                <h4 className="text-[10px] font-bold uppercase tracking-widest text-slate-400 italic ml-4">Core Capacities & Skills</h4>
                <div className="flex flex-wrap gap-3">
                  {profile.skills.map((s, i) => (
                    <div key={i} className="px-6 py-3 bg-white border border-slate-200 rounded-2xl shadow-sm text-[10px] font-bold uppercase tracking-widest text-slate-600 hover:border-indigo-400 hover:text-indigo-600 transition-all italic">{s}</div>
                  ))}
                </div>
              </div>
            )}

            {profile.experience && profile.experience.length > 0 && (
              <div className="space-y-6">
                <h4 className="text-[10px] font-bold uppercase tracking-widest text-slate-400 italic ml-4">Career Operational History</h4>
                <div className="space-y-6">
                  {profile.experience.map((exp, i) => (
                    <div key={i} className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm hover:border-indigo-100 transition-all">
                      <div className="flex flex-col md:flex-row justify-between mb-4 gap-4">
                        <div>
                          <h5 className="text-lg font-bold text-slate-900 uppercase italic leading-tight mb-1">{exp.position}</h5>
                          <div className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest">{exp.company}</div>
                        </div>
                        <div className="text-right">
                          <div className="text-[9px] font-bold text-slate-400 uppercase tracking-widest italic">{exp.startDate?.split('-')[0]} - {exp.current ? 'PRESENT' : exp.endDate?.split('-')[0]}</div>
                        </div>
                      </div>
                      <p className="text-sm font-medium text-slate-600 italic leading-relaxed">{exp.description}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {!profile.summary && (!profile.skills || profile.skills.length === 0) && (!profile.experience || profile.experience.length === 0) && (
              <div className="p-32 bg-white rounded-3xl border-2 border-dashed border-slate-100 text-center opacity-30 grayscale">
                <div className="text-8xl mb-6">🧬</div>
                <h3 className="text-xl font-bold text-slate-400 uppercase tracking-widest">Profile Record Empty</h3>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-2">No granular identity metadata has been logged yet.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {showPasswordModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-[2000] p-6 animate-in fade-in duration-300">
          <div className="bg-white rounded-[2.5rem] w-full max-w-lg shadow-2xl overflow-hidden animate-in zoom-in-95 duration-500 font-sans">
            <div className="p-8 bg-slate-900 text-white relative">
              <div className="relative z-10 flex justify-between items-center">
                <div>
                  <h3 className="text-xl font-bold uppercase italic tracking-tight mb-1">Update Security Credentials</h3>
                  <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest italic">Modify system password for user: {user.name}</p>
                </div>
                <button onClick={() => setShowPasswordModal(false)} className="w-10 h-10 rounded-xl bg-white/10 text-white flex items-center justify-center text-xl hover:bg-rose-600 transition-all font-bold">×</button>
              </div>
            </div>

            <form onSubmit={handlePasswordUpdate} className="p-8 lg:p-10 space-y-8">
              {passwordError && <div className="p-4 bg-rose-50 border border-rose-100 text-rose-600 rounded-xl text-xs font-bold flex items-center gap-3">⚠️ {passwordError}</div>}
              {passwordSuccess && <div className="p-4 bg-emerald-50 border border-emerald-100 text-emerald-600 rounded-xl text-xs font-bold flex items-center gap-3">✅ {passwordSuccess}</div>}

              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">New System Password</label>
                <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder="Minimum 6 characters" className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-indigo-600 outline-none focus:bg-white focus:border-indigo-400 transition-all uppercase tracking-widest" disabled={updatingPassword} />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Confirm Update Directive</label>
                <input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} placeholder="Repeat password to verify" className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-indigo-600 outline-none focus:bg-white focus:border-indigo-400 transition-all uppercase tracking-widest" disabled={updatingPassword} />
              </div>

              <div className="flex gap-4 pt-4 border-t border-slate-100 italic">
                <button type="button" onClick={() => setShowPasswordModal(false)} className="px-6 py-4 text-[11px] font-bold uppercase tracking-widest text-slate-400 hover:text-slate-900 transition-all">Abort</button>
                <button type="submit" disabled={updatingPassword} className="flex-1 py-4 bg-indigo-600 text-white rounded-xl font-bold text-[11px] uppercase tracking-widest shadow-lg hover:bg-slate-950 transition-all active:scale-95">
                  {updatingPassword ? 'transmitting...' : 'Commit Credential Shift'}
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