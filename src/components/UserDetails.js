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
      console.error('Identity_Retrieval_Failure', error);
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
      setPasswordError('Keyphrase insufficient length [MIN: 6]');
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError('Directives mismatch: confirm keyphrase');
      return;
    }

    setUpdatingPassword(true);

    try {
      await userAPI.updatePassword(id, newPassword);
      setPasswordSuccess('Identity keyphrase updated successfully!');
      setNewPassword('');
      setConfirmPassword('');

      setTimeout(() => {
        setShowPasswordModal(false);
        setPasswordSuccess('');
      }, 2000);
    } catch (error) {
      setPasswordError(error.response?.data?.error || 'Registry update failed');
    } finally {
      setUpdatingPassword(false);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="max-w-7xl mx-auto px-6 py-24 text-center animate-pulse space-y-8">
          <div className="w-24 h-24 bg-slate-100 rounded-full mx-auto" />
          <div className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-400 italic">Decrypting_Entity_Profile...</div>
        </div>
      </Layout>
    );
  }

  if (!user) {
    return (
      <Layout>
        <div className="max-w-7xl mx-auto px-6 py-24 text-center space-y-12">
          <div className="text-8xl grayscale opacity-20">🚫</div>
          <h2 className="text-4xl font-black text-slate-900 uppercase tracking-tighter italic">Identity_Not_Found</h2>
          <button onClick={() => navigate('/users')} className="px-10 py-5 bg-indigo-600 text-white rounded-[2rem] font-black text-[10px] uppercase tracking-widest shadow-24 shadow-indigo-100 transition-all">Back_to_Sector</button>
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
      <div className="max-w-6xl mx-auto px-6 py-12 space-y-12 animate-in fade-in slide-in-from-bottom-8 duration-1000">
        <PageHeader
          title="Identity_Deep_Dive"
          subtitle={`Full granular metadata exploration for node: ${user.name}`}
          icon={<span>🔍</span>}
          stats={[
            { label: 'Access_Auth', value: user.role.toUpperCase() },
            { label: 'Sync_Ref', value: user._id.slice(-6).toUpperCase() }
          ]}
          actions={
            <div className="flex gap-4">
              <button onClick={() => navigate(-1)} className="px-8 py-4 bg-white text-slate-400 border border-slate-100 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:text-slate-900 transition-all italic">← Return</button>
              {state.user?.role === 'superadmin' && (
                <button onClick={() => setShowPasswordModal(true)} className="px-8 py-4 bg-slate-950 text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] shadow-24 hover:bg-black transition-all group overflow-hidden relative">
                  <span className="relative z-10 flex items-center gap-3">🔑 Recalibrate_Key</span>
                  <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-r from-amber-500/0 via-white/10 to-amber-500/0 -translate-x-full group-hover:animate-[shimmer_2s_infinite] -z-0" />
                </button>
              )}
            </div>
          }
        />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          {/* Sidebar Info */}
          <div className="lg:col-span-4 space-y-8">
            <div className="bg-white p-10 rounded-[4rem] border border-slate-100 shadow-sm relative overflow-hidden group">
              <div className="relative z-10 flex flex-col items-center text-center">
                <div className="w-40 h-40 rounded-[3rem] bg-slate-950 border-4 border-indigo-50 shadow-24 overflow-hidden mb-8 group-hover:rotate-6 transition-all duration-700">
                  {profile.profilePicture ? (
                    <img src={getImageUrl(profile.profilePicture)} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-white text-5xl font-black italic">{user.name.charAt(0)}</div>
                  )}
                </div>
                <h2 className="text-2xl font-black text-slate-950 uppercase tracking-tighter mb-2">{user.name}</h2>
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.2em] italic mb-6">{user.email}</p>
                <div className="flex flex-wrap gap-2 justify-center">
                  <span className={`px-5 py-2 rounded-2xl text-[9px] font-black uppercase tracking-widest shadow-lg ${user.role === 'superadmin' ? 'bg-rose-600 text-white' : 'bg-indigo-600 text-white'}`}>{user.role}</span>
                  {profile.title && <span className="px-5 py-2 rounded-2xl bg-slate-900 text-white text-[9px] font-black uppercase tracking-widest italic">{profile.title}</span>}
                </div>
              </div>
              <div className="absolute -bottom-12 -left-12 w-48 h-48 bg-indigo-500/5 rounded-full blur-3xl" />
            </div>

            <div className="bg-slate-950 p-10 rounded-[3rem] text-white shadow-24 space-y-8">
              <h4 className="text-[10px] font-black uppercase tracking-[0.4em] text-indigo-400 italic">Temporal_Metadata</h4>
              <div className="space-y-6">
                <div className="flex items-center gap-6">
                  <div className="text-3xl grayscale opacity-50">📅</div>
                  <div>
                    <div className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Genesis_Date</div>
                    <div className="text-sm font-black italic">{new Date(user.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}</div>
                  </div>
                </div>
                {profile.location && (
                  <div className="flex items-center gap-6">
                    <div className="text-3xl grayscale opacity-50">📍</div>
                    <div>
                      <div className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Node_Coordinates</div>
                      <div className="text-sm font-black italic uppercase">{profile.location}</div>
                    </div>
                  </div>
                )}
                {profile.phone && (
                  <div className="flex items-center gap-6">
                    <div className="text-3xl grayscale opacity-50">📡</div>
                    <div>
                      <div className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Signal_Link</div>
                      <div className="text-sm font-black italic">{profile.phone}</div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Main Content Info */}
          <div className="lg:col-span-8 space-y-10">
            {profile.summary && (
              <div className="bg-white p-12 rounded-[4rem] border border-slate-50 shadow-sm relative overflow-hidden group">
                <h4 className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-300 italic mb-8">Executive_Summary_Directive</h4>
                <p className="text-base font-medium text-slate-600 leading-relaxed italic border-l-4 border-indigo-100 pl-10">
                  "{profile.summary}"
                </p>
              </div>
            )}

            {profile.skills && profile.skills.length > 0 && (
              <div className="space-y-6">
                <h4 className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-400 italic ml-4">Capability_Matrix_Optimization</h4>
                <div className="flex flex-wrap gap-3">
                  {profile.skills.map((s, i) => (
                    <div key={i} className="px-6 py-3 bg-white border border-slate-100 rounded-2xl shadow-sm text-[10px] font-black uppercase tracking-widest text-slate-600 hover:border-indigo-400 hover:text-indigo-600 transition-all">{s}</div>
                  ))}
                </div>
              </div>
            )}

            {profile.experience && profile.experience.length > 0 && (
              <div className="space-y-8">
                <h4 className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-400 italic ml-4">Operational_Trajectory_Log</h4>
                <div className="space-y-6">
                  {profile.experience.map((exp, i) => (
                    <div key={i} className="bg-white p-10 rounded-[3rem] border border-slate-50 shadow-sm group/item">
                      <div className="flex flex-col md:flex-row justify-between mb-6 gap-4">
                        <div>
                          <h5 className="text-lg font-black text-slate-900 uppercase italic leading-none mb-1">{exp.position}</h5>
                          <div className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">{exp.company}</div>
                        </div>
                        <div className="text-right">
                          <div className="text-[9px] font-bold text-slate-400 uppercase tracking-widest italic">{exp.startDate?.split('-')[0]} - {exp.current ? 'PRESENT' : exp.endDate?.split('-')[0]}</div>
                          {exp.current && <span className="px-3 py-1 bg-emerald-500 text-white text-[8px] font-black uppercase tracking-widest rounded-lg animate-pulse ml-2">ACTIVE</span>}
                        </div>
                      </div>
                      <p className="text-sm font-medium text-slate-500 italic leading-relaxed">{exp.description}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* If empty */}
            {!profile.summary && (!profile.skills || profile.skills.length === 0) && (!profile.experience || profile.experience.length === 0) && (
              <div className="p-32 bg-white rounded-[4rem] border-4 border-dashed border-slate-50 text-center opacity-30 grayscale italic group hover:opacity-100 hover:grayscale-0 transition-all">
                <div className="text-8xl mb-8 group-hover:scale-110 transition-transform">🧬</div>
                <h3 className="text-xl font-black text-slate-300 uppercase tracking-[0.4em]">Profile_Artifact_Void</h3>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-4">Node has not finalized identity metadata logs.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Password Modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-md flex items-center justify-center z-[1000] p-6 animate-in fade-in duration-300">
          <div className="bg-white rounded-[3rem] w-full max-w-lg shadow-24 overflow-hidden animate-in zoom-in-95 slide-in-from-bottom-12 duration-500">
            <div className="p-10 bg-slate-900 text-white relative overflow-hidden">
              <div className="relative z-10 flex justify-between items-center">
                <div>
                  <h3 className="text-2xl font-black uppercase tracking-[0.15em] mb-1">Recalibrate_Access</h3>
                  <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest italic opacity-60">Auth_Injection // System_Privilege // {user.name}</p>
                </div>
                <button onClick={() => setShowPasswordModal(false)} className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 text-white flex items-center justify-center text-xl hover:bg-white/10 transition-all">×</button>
              </div>
              <div className="absolute top-0 right-0 w-48 h-48 bg-indigo-500/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
            </div>

            <form onSubmit={handlePasswordUpdate} className="p-10 space-y-8">
              {passwordError && <div className="p-6 bg-red-500/10 border border-red-500/20 text-red-500 rounded-2xl text-[10px] font-black uppercase tracking-widest italic animate-bounce">{passwordError}</div>}
              {passwordSuccess && <div className="p-6 bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 rounded-2xl text-[10px] font-black uppercase tracking-widest italic animate-pulse">{passwordSuccess}</div>}

              <div className="space-y-4">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic ml-2">New_Secret_Keyphrase</label>
                <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder="Minimum 6 Chars" className="w-full px-8 py-5 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-black text-indigo-600 outline-none focus:bg-white focus:border-indigo-400 transition-all uppercase tracking-widest" disabled={updatingPassword} />
              </div>
              <div className="space-y-4">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic ml-2">Confirm_Update_Directive</label>
                <input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} placeholder="Repeat Keyphrase" className="w-full px-8 py-5 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-black text-indigo-600 outline-none focus:bg-white focus:border-indigo-400 transition-all uppercase tracking-widest" disabled={updatingPassword} />
              </div>

              <div className="flex gap-4 pt-4">
                <button type="button" onClick={() => setShowPasswordModal(false)} className="flex-1 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-900 transition-all">Abort_Injection</button>
                <button type="submit" disabled={updatingPassword} className={`flex-[2] py-5 bg-indigo-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-24 shadow-indigo-100 hover:bg-indigo-700 transition-all ${updatingPassword ? 'opacity-50 grayscale' : ''}`}>
                  {updatingPassword ? 'transmitting...' : 'Commit_Protocol_Shift'}
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