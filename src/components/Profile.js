import React, { useState, useEffect } from 'react';
import Layout from './Layout';
import api, { BASE_SERVER_URL } from '../services/api';
import { useToast } from '../context/ToastContext';
import { useCompany } from '../context/CompanyContext';
import PageHeader from './PageHeader';

const Profile = () => {
  const { state: companyState } = useCompany();
  const toast = useToast();

  const getImageUrl = (url) => {
    if (!url) return '';
    if (url.startsWith('data:')) return url;
    if (url.startsWith('http')) return url;
    return `${BASE_SERVER_URL}${url}`;
  };

  const [profile, setProfile] = useState({
    name: '',
    email: '',
    role: '',
    createdAt: '',
    profile: {
      profilePicture: '',
      coverPhoto: '',
      phone: '',
      location: '',
      title: '',
      summary: '',
      experience: [],
      education: [],
      projects: [],
      skills: [],
      languages: []
    }
  });

  const [localImages, setLocalImages] = useState({ profilePicture: '', coverPhoto: '' });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeSection, setActiveSection] = useState('basic');
  const [skillInput, setSkillInput] = useState('');

  useEffect(() => { fetchProfile(); }, []);

  const fetchProfile = async () => {
    try {
      const response = await api.get('/users/profile');
      const profileData = response.data.profile || {};
      setProfile({
        name: response.data.name,
        email: response.data.email,
        role: response.data.role,
        createdAt: response.data.createdAt,
        profile: {
          profilePicture: profileData.profilePicture || '',
          coverPhoto: profileData.coverPhoto || '',
          phone: profileData.phone || '',
          location: profileData.location || '',
          title: profileData.title || '',
          summary: profileData.summary || '',
          experience: profileData.experience || [],
          education: profileData.education || [],
          projects: profileData.projects || [],
          skills: profileData.skills || [],
          languages: profileData.languages || []
        }
      });
      setLocalImages({ profilePicture: profileData.profilePicture || '', coverPhoto: profileData.coverPhoto || '' });
    } catch (error) {
      console.error('Core_Profile_Identity_Error', error);
      toast?.showToast?.('IDENTITY_SYNC_FAILURE_LINK_UNSTABLE', 'error');
    } finally { setLoading(false); }
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    setSaving(true);
    try {
      const cleanProfile = {
        ...profile,
        profile: {
          ...profile.profile,
          profilePicture: profile.profile.profilePicture?.startsWith('data:') ? '' : profile.profile.profilePicture,
          coverPhoto: profile.profile.coverPhoto?.startsWith('data:') ? '' : profile.profile.coverPhoto
        }
      };
      await api.put('/users/profile', cleanProfile);
      toast?.showToast?.('IDENTITY_REGISTRY_LOCKED_AND_VERIFIED', 'success');
    } catch (error) { toast?.showToast?.('REGISTRY_UPDATE_NEGATED: ' + (error.response?.data?.error || 'UNKNOWN_ERROR'), 'error'); }
    finally { setSaving(false); }
  };

  const handleFileUpload = async (e, type = 'profile') => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast?.showToast?.('FILE_VOLUME_EXCEEDS_5MB_THRESHOLD', 'error');
        return;
      }
      try {
        const reader = new FileReader();
        reader.onload = (event) => {
          const fieldName = type === 'cover' ? 'coverPhoto' : 'profilePicture';
          setLocalImages(prev => ({ ...prev, [fieldName]: event.target.result }));
        };
        reader.readAsDataURL(file);

        const formData = new FormData();
        formData.append(type === 'cover' ? 'coverPhoto' : 'profilePicture', file);

        const response = await api.post('/users/upload-photo', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
        const fieldName = type === 'cover' ? 'coverPhoto' : 'profilePicture';
        const serverUrl = response.data.profile[fieldName];

        setProfile(prev => ({ ...prev, profile: { ...prev.profile, [fieldName]: serverUrl } }));
        setLocalImages(prev => ({ ...prev, [fieldName]: serverUrl }));
        toast?.showToast?.('VISUAL_IDENT_SYNC_COMPLETE', 'success');
      } catch (error) { toast?.showToast?.('VISUAL_DECRYPTION_FAILED', 'error'); }
    }
  };

  const addExperience = () => setProfile(p => ({ ...p, profile: { ...p.profile, experience: [...p.profile.experience, { company: '', position: '', startDate: '', endDate: '', description: '', current: false }] } }));
  const addEducation = () => setProfile(p => ({ ...p, profile: { ...p.profile, education: [...p.profile.education, { institution: '', degree: '', field: '', startDate: '', endDate: '', current: false }] } }));
  const addProject = () => setProfile(p => ({ ...p, profile: { ...p.profile, projects: [...p.profile.projects, { name: '', description: '', technologies: [], url: '', startDate: '', endDate: '' }] } }));
  const addSkill = (skill = skillInput) => {
    if (skill && skill.trim() && !profile.profile.skills.includes(skill.trim())) {
      setProfile(p => ({ ...p, profile: { ...p.profile, skills: [...p.profile.skills, skill.trim()] } }));
      setSkillInput('');
    }
  };

  const removeItem = (section, index) => setProfile(p => ({ ...p, profile: { ...p.profile, [section]: p.profile[section].filter((_, i) => i !== index) } }));
  const updateItem = (section, index, field, value) => {
    const updatedItems = [...profile.profile[section]];
    updatedItems[index] = { ...updatedItems[index], [field]: value };
    setProfile(p => ({ ...p, profile: { ...p.profile, [section]: updatedItems } }));
  };

  if (loading) return (
    <Layout>
      <div className="max-w-7xl mx-auto px-6 py-40 text-center animate-pulse space-y-16 italic">
        <div className="w-40 h-40 border-[16px] border-slate-50 border-t-indigo-600 rounded-[4rem] animate-spin mx-auto shadow-24" />
        <p className="text-[12px] font-black uppercase tracking-[0.8em] text-slate-400 italic underline underline-offset-[16px] decoration-indigo-200">DECRYPTING_GLOBAL_IDENTITY_MODULE_...</p>
      </div>
    </Layout>
  );

  const sections = [
    { id: 'basic', label: 'IDENTITY_CORE', icon: '👤' },
    { id: 'experience', label: 'OPERATIONAL_TRAJECTORY', icon: '📂' },
    { id: 'education', label: 'ACADEMIC_FOUNDATIONS', icon: '🎓' },
    { id: 'projects', label: 'DELTA_DIRECTIVES', icon: '⚛️' },
    { id: 'skills', label: 'CAPABILITY_MATRIX', icon: '⚡' }
  ];

  return (
    <Layout>
      <div className="max-w-[1700px] mx-auto px-6 py-20 animate-in fade-in duration-1500 italic pb-60">
        <PageHeader
          title="IDENTITY_SECTOR_CONTROLS"
          subtitle="Management of personal mission artifacts and neural authority profile."
          icon={<div className="w-20 h-20 rounded-[2.5rem] bg-slate-950 text-white flex items-center justify-center text-4xl shadow-24 border-8 border-white group-hover:rotate-12 transition-transform duration-1000 italic shrink-0">👤</div>}
          stats={[{ label: 'ACCESS_AUTH_TIER', value: profile.role.toUpperCase() }, { label: 'SYNCHRONOUS_LVL', value: '100%' }]}
          actions={
            <button
              onClick={handleSubmit}
              disabled={saving}
              className="px-16 py-7 bg-slate-950 text-white rounded-[3rem] font-black text-[12px] uppercase tracking-[0.6em] shadow-24 hover:bg-indigo-600 hover:scale-110 active:scale-95 transition-all italic border-8 border-white group relative overflow-hidden shrink-0"
            >
              <span className="relative z-10 flex items-center gap-6">{saving ? 'SYNCHRONIZING...' : 'AUTHORIZE_IDENTITY_PUSH'} <span className="text-2xl group-hover:translate-x-4 transition-transform duration-700">➜</span></span>
              <div className="absolute top-0 left-0 w-full h-full bg-white/10 -translate-x-full group-hover:animate-[shimmer_3s_infinite]" />
            </button>
          }
        />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 mt-20">
          {/* Tactical Nav Stream Zeta */}
          <div className="lg:col-span-3 space-y-10">
            <div className="bg-white p-6 rounded-[4.5rem] border-8 border-slate-50 shadow-sm flex flex-col gap-4">
              {sections.map(s => (
                <button
                  key={s.id}
                  onClick={() => setActiveSection(s.id)}
                  className={`flex items-center gap-6 px-10 py-6 rounded-[2.5rem] text-[11px] font-black uppercase tracking-[0.4em] transition-all duration-700 relative group/nav ${activeSection === s.id ? 'bg-slate-950 text-white shadow-24 scale-105 border-4 border-white' : 'text-slate-400 hover:text-slate-950 hover:bg-slate-50'}`}
                >
                  <span className={`text-2xl transition-all duration-700 grayscale ${activeSection === s.id ? 'grayscale-0 rotate-12' : 'group-hover/nav:grayscale-0 group-hover/nav:rotate-12'}`}>{s.icon}</span>
                  <span className="truncate">{s.label}</span>
                  {activeSection === s.id && <div className="absolute right-6 w-2 h-2 bg-indigo-500 rounded-full shadow-[0_0_10px_indigo] animate-pulse" />}
                </button>
              ))}
            </div>
            <div className="bg-slate-950 p-12 rounded-[4.5rem] text-white shadow-24 border-8 border-slate-900 relative overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 to-transparent pointer-events-none" />
              <div className="relative z-10">
                <h3 className="text-[10px] font-black uppercase tracking-[0.8em] mb-6 italic text-indigo-400 underline underline-offset-8 decoration-white/5">SECURITY_RANK: ROOT</h3>
                <p className="text-2xl font-black italic tracking-tighter leading-none"> IDENTITY_REGISTRY_LOCK: ACTIVE </p>
              </div>
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2 group-hover:scale-150 transition-transform duration-[3s]" />
            </div>
          </div>

          {/* Neural Content Surface Delta */}
          <div className="lg:col-span-9 space-y-16">
            <div className="bg-white rounded-[6rem] p-12 lg:p-20 shadow-24 border-8 border-slate-50 relative overflow-hidden group/content min-h-[1000px]">
              <div className="absolute top-0 right-0 p-32 text-[280px] font-black italic opacity-[0.015] grayscale pointer-events-none select-none text-slate-950 leading-none uppercase">{activeSection}</div>

              <div className="relative z-10">
                {activeSection === 'basic' && (
                  <div className="space-y-16 animate-in slide-in-from-bottom-12 duration-1200">
                    {/* Atmospheric Identity Visualization */}
                    <div className="relative group/cover">
                      <div
                        className="w-full h-96 rounded-[5rem] bg-slate-950 border-8 border-white shadow-24 overflow-hidden relative group-hover/cover:shadow-indigo-500/20 transition-all duration-1000"
                        style={{
                          backgroundImage: (localImages.coverPhoto || profile.profile.coverPhoto)
                            ? `url(${getImageUrl(localImages.coverPhoto || profile.profile.coverPhoto)})`
                            : 'linear-gradient(135deg, #4f46e5 0%, #1e1b4b 100%)',
                          backgroundSize: 'cover', backgroundPosition: 'center'
                        }}
                      >
                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover/cover:opacity-100 transition-all duration-1000 flex items-center justify-center backdrop-blur-xl">
                          <label htmlFor="cover-up" className="px-12 py-5 bg-white text-slate-950 rounded-[2.5rem] font-black text-[12px] uppercase tracking-[0.6em] cursor-pointer shadow-24 hover:scale-110 active:scale-95 transition-all italic border-8 border-slate-100">REFACTOR_ENVIRONMENT_VISUALS</label>
                        </div>
                        <input type="file" id="cover-up" accept="image/*" onChange={e => handleFileUpload(e, 'cover')} className="hidden" />
                      </div>

                      <div className="absolute -bottom-24 left-16 group/avatar">
                        <div className="relative">
                          <div
                            className="w-56 h-56 rounded-[4.5rem] border-[12px] border-white shadow-24 overflow-hidden bg-slate-950 group-hover/avatar:rotate-6 transition-all duration-1000 relative"
                            style={{
                              backgroundImage: (localImages.profilePicture || profile.profile.profilePicture)
                                ? `url(${getImageUrl(localImages.profilePicture || profile.profile.profilePicture)})`
                                : 'linear-gradient(135deg, #6366f1 0%, #312e81 100%)',
                              backgroundSize: 'cover', backgroundPosition: 'center'
                            }}
                          >
                            {!(localImages.profilePicture || profile.profile.profilePicture) && <div className="w-full h-full flex items-center justify-center text-white text-8xl font-black italic drop-shadow-2xl">{profile.name.charAt(0)}</div>}
                            <div className="absolute inset-x-0 bottom-0 h-1/3 bg-black/40 backdrop-blur-md flex items-center justify-center opacity-0 group-hover/avatar:opacity-100 transition-all">
                              <span className="text-white text-[8px] font-black uppercase tracking-[0.4em]">UPDATE_AVATAR</span>
                            </div>
                          </div>
                          <label htmlFor="pf-up" className="absolute -bottom-4 -right-4 w-20 h-20 bg-white border-8 border-slate-50 text-indigo-600 rounded-[2rem] flex items-center justify-center shadow-24 cursor-pointer hover:scale-125 hover:rotate-12 transition-all text-4xl group-hover/avatar:scale-110 duration-700 italic">📷</label>
                          <input type="file" id="pf-up" accept="image/*" onChange={e => handleFileUpload(e, 'profile')} className="hidden" />
                        </div>
                      </div>
                    </div>

                    <div className="pt-32 grid grid-cols-1 md:grid-cols-2 gap-12">
                      <div className="bg-slate-50/50 p-10 rounded-[4rem] border-4 border-slate-50 shadow-inner space-y-6 hover:bg-white hover:border-indigo-100 hover:shadow-24 transition-all duration-1000 group/field">
                        <label className="text-[11px] font-black text-slate-400 uppercase tracking-[0.5em] italic ml-4 flex justify-between"> FULL_ENTITY_LABEL_TAG <span className="text-indigo-600 opacity-0 group-hover/field:opacity-100 transition-opacity">SEQ_01</span></label>
                        <input type="text" value={profile.name} onChange={e => setProfile({ ...profile, name: e.target.value })} className="w-full px-10 py-6 bg-white border-4 border-white rounded-[2.5rem] text-3xl font-black uppercase tracking-tighter outline-none focus:border-indigo-600 transition-all italic shadow-sm" />
                      </div>
                      <div className="bg-slate-50/50 p-10 rounded-[4rem] border-4 border-slate-50 shadow-inner space-y-6 hover:bg-white hover:border-indigo-100 hover:shadow-24 transition-all duration-1000 group/field">
                        <label className="text-[11px] font-black text-slate-400 uppercase tracking-[0.5em] italic ml-4"> DESIGNATORY_RANK_MODULE </label>
                        <input type="text" value={profile.profile.title} onChange={e => setProfile({ ...profile, profile: { ...profile.profile, title: e.target.value } })} placeholder="OPERATIONS_DIRECTOR" className="w-full px-10 py-6 bg-white border-4 border-white rounded-[2.5rem] text-3xl font-black uppercase tracking-tighter outline-none focus:border-indigo-600 transition-all italic shadow-sm" />
                      </div>
                      <div className="bg-slate-50/50 p-10 rounded-[4rem] border-4 border-slate-50 shadow-inner space-y-6 hover:bg-white hover:border-indigo-100 hover:shadow-24 transition-all duration-1000 group/field">
                        <label className="text-[11px] font-black text-slate-400 uppercase tracking-[0.5em] italic ml-4"> GEOSPATIAL_SECTOR_LOC </label>
                        <input type="text" value={profile.profile.location} onChange={e => setProfile({ ...profile, profile: { ...profile.profile, location: e.target.value } })} placeholder="NEO_CITY_S7" className="w-full px-10 py-6 bg-white border-4 border-white rounded-[2.5rem] text-2xl font-black uppercase tracking-tighter outline-none focus:border-indigo-600 transition-all italic shadow-sm" />
                      </div>
                      <div className="bg-slate-50/50 p-10 rounded-[4rem] border-4 border-slate-50 shadow-inner space-y-6 hover:bg-white hover:border-indigo-100 hover:shadow-24 transition-all duration-1000 group/field">
                        <label className="text-[11px] font-black text-slate-400 uppercase tracking-[0.5em] italic ml-4"> NEURAL_VOICE_LINK_ID </label>
                        <input type="tel" value={profile.profile.phone} onChange={e => setProfile({ ...profile, profile: { ...profile.profile, phone: e.target.value } })} placeholder="+0_CHANNEL_SIG" className="w-full px-10 py-6 bg-white border-4 border-white rounded-[2.5rem] text-2xl font-black uppercase tracking-tighter outline-none focus:border-indigo-600 transition-all italic shadow-sm" />
                      </div>
                      <div className="md:col-span-2 bg-slate-50/50 p-12 rounded-[5rem] border-4 border-slate-50 shadow-inner space-y-8 hover:bg-white hover:border-indigo-100 hover:shadow-24 transition-all duration-[1.5s] group/summary">
                        <label className="text-[12px] font-black text-slate-400 uppercase tracking-[0.6em] italic ml-8 underline underline-offset-[12px] decoration-slate-100"> IDENTITY_DIRECTIVE_SYNOPSIS </label>
                        <textarea rows="6" value={profile.profile.summary} onChange={e => setProfile({ ...profile, profile: { ...profile.profile, summary: e.target.value } })} placeholder="INITIALIZE_MISSION_PARAMETERS_AND_SECTOR_SUMMARY_..." className="w-full px-12 py-10 bg-white border-4 border-white rounded-[4rem] text-lg font-black text-slate-950 uppercase tracking-tight outline-none focus:border-indigo-600 transition-all resize-none italic leading-relaxed shadow-sm scrollbar-none" />
                      </div>
                    </div>
                  </div>
                )}

                {activeSection === 'experience' && (
                  <div className="space-y-12 animate-in slide-in-from-bottom-12 duration-1200">
                    <div className="flex flex-col md:flex-row justify-between items-end gap-8 px-8">
                      <div>
                        <h2 className="text-5xl font-black text-slate-950 uppercase tracking-tighter italic leading-none"> OPERATIONAL_TRAJECTORY </h2>
                        <p className="text-[12px] font-black text-slate-400 uppercase tracking-[0.6em] mt-6 italic underline underline-offset-[16px] decoration-slate-100"> Cumulative_Mission_Archive_and_Command_Timeline_Sync </p>
                      </div>
                      <button onClick={addExperience} className="px-12 py-6 bg-slate-950 text-white rounded-[3rem] font-black text-[12px] uppercase tracking-[0.4em] shadow-24 hover:bg-emerald-600 hover:scale-110 active:scale-95 transition-all border-8 border-white italic group relative overflow-hidden shrink-0">
                        <span className="relative z-10 flex items-center gap-6"> ➕ INJECT_NEW_LOG <div className="w-px h-6 bg-white/20 mx-2" /> DATA </span>
                        <div className="absolute top-0 left-0 w-full h-full bg-white/10 -translate-x-full group-hover:animate-[shimmer_3s_infinite]" />
                      </button>
                    </div>

                    <div className="space-y-10">
                      {profile.profile.experience.map((exp, idx) => (
                        <div key={idx} className="group/item bg-white p-12 rounded-[5rem] border-8 border-slate-50 shadow-sm hover:shadow-24 transition-all duration-1200 relative overflow-hidden hover:-translate-y-4">
                          <button onClick={() => removeItem('experience', idx)} className="absolute top-10 right-10 w-16 h-16 bg-rose-50 text-rose-500 rounded-[2rem] flex items-center justify-center text-3xl opacity-0 group-hover/item:opacity-100 hover:bg-rose-600 hover:text-white transition-all hover:rotate-90 shadow-sm border-4 border-transparent hover:border-white">✕</button>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mb-12">
                            <div className="space-y-4">
                              <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.5em] italic ml-6"> SECTOR_ORGANIZATION </label>
                              <input type="text" value={exp.company} onChange={e => updateItem('experience', idx, 'company', e.target.value)} placeholder="ACME_NEURAL_CORP" className="w-full px-10 py-6 bg-slate-50 border-4 border-slate-50 rounded-[2.5rem] text-2xl font-black uppercase tracking-tighter outline-none focus:bg-white focus:border-indigo-600 focus:shadow-sm transition-all italic tracking-widest" />
                            </div>
                            <div className="space-y-4">
                              <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.5em] italic ml-6"> ASSIGNED_DESIGNATION </label>
                              <input type="text" value={exp.position} onChange={e => updateItem('experience', idx, 'position', e.target.value)} placeholder="LEAD_ARCHITECT_S7" className="w-full px-10 py-6 bg-slate-50 border-4 border-slate-50 rounded-[2.5rem] text-2xl font-black uppercase tracking-tighter outline-none focus:bg-white focus:border-indigo-600 focus:shadow-sm transition-all italic tracking-widest" />
                            </div>
                          </div>
                          <div className="flex flex-wrap gap-10 items-center mb-12 bg-slate-50 p-6 rounded-[3rem] border-4 border-white shadow-inner">
                            <div className="flex-1 min-w-[300px] flex gap-8">
                              <div className="flex-1 space-y-3">
                                <label className="text-[9px] font-black text-slate-300 uppercase tracking-[0.6em] italic text-center block">GENESIS_CYCLE</label>
                                <input type="date" value={exp.startDate} onChange={e => updateItem('experience', idx, 'startDate', e.target.value)} className="w-full px-8 py-4 bg-white border-4 border-indigo-50 rounded-[1.5rem] text-center text-xs font-black uppercase outline-none focus:border-indigo-600 transition-all italic" />
                              </div>
                              <div className="flex-1 space-y-3">
                                <label className="text-[9px] font-black text-slate-300 uppercase tracking-[0.6em] italic text-center block">TERMINUS_EXPECTANCY</label>
                                <input type="date" value={exp.endDate} disabled={exp.current} onChange={e => updateItem('experience', idx, 'endDate', e.target.value)} className="w-full px-8 py-4 bg-white border-4 border-white rounded-[1.5rem] text-center text-xs font-black uppercase outline-none disabled:opacity-30 focus:border-indigo-600 transition-all italic" />
                              </div>
                            </div>
                            <button onClick={() => updateItem('experience', idx, 'current', !exp.current)} className={`px-12 py-5 rounded-[2.5rem] text-[11px] font-black uppercase tracking-[0.6em] transition-all border-4 shadow-sm hover:scale-110 active:scale-90 italic flex items-center gap-4 ${exp.current ? 'bg-indigo-600 text-white border-white animate-pulse shadow-indigo-500/30' : 'bg-white text-slate-400 border-white hover:text-indigo-600'}`}>
                              <span className={`w-3 h-3 rounded-full bg-current ${exp.current ? 'animate-ping' : ''}`} />
                              {exp.current ? 'ACTIVE_NODAL_STREAM' : 'SET_AS_LIVE_SYNC'}
                            </button>
                          </div>
                          <div className="space-y-4">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.5em] italic ml-10"> DIRECTIVE_SUCCESS_LOGS </label>
                            <textarea rows="5" value={exp.description} onChange={e => updateItem('experience', idx, 'description', e.target.value)} placeholder="MISSION_SPEC_ARCHIVE_INITIALIZING_..." className="w-full px-12 py-10 bg-slate-50 border-4 border-slate-50 rounded-[4rem] text-base font-black text-slate-950 uppercase tracking-tighter outline-none focus:bg-white focus:border-indigo-600 transition-all resize-none italic leading-loose scrollbar-none" />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {activeSection === 'skills' && (
                  <div className="space-y-16 animate-in slide-in-from-bottom-12 duration-1200">
                    <div className="bg-slate-950 p-16 rounded-[6rem] text-white shadow-24 relative overflow-hidden border-8 border-slate-900 group/mx">
                      <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-indigo-500/10 to-transparent pointer-events-none" />
                      <div className="relative z-10 space-y-10 text-center md:text-left">
                        <div className="flex flex-col md:flex-row items-center gap-10 border-b border-white/10 pb-10">
                          <div className="w-24 h-24 rounded-[3rem] bg-indigo-600 border-8 border-white/10 flex items-center justify-center text-5xl shadow-24 animate-pulse italic transform group-hover/mx:rotate-12 transition-transform duration-1000 shrink-0">⚡</div>
                          <div className="space-y-4">
                            <h2 className="text-4xl lg:text-5xl font-black uppercase tracking-tighter italic leading-none drop-shadow-sm"> CAPABILITY_MATRIX_INJECTION </h2>
                            <p className="text-[12px] font-black text-indigo-400 uppercase tracking-[0.8em] italic underline underline-offset-8 decoration-white/5 opacity-80"> Systematic_Neural_Optimization_Sequence </p>
                          </div>
                        </div>
                        <div className="flex flex-col sm:flex-row gap-8 pt-6">
                          <input type="text" value={skillInput} onChange={e => setSkillInput(e.target.value)} onKeyPress={e => e.key === 'Enter' && addSkill()} placeholder="NEW_CAPABILITY_PROFILE_SIG_..." className="flex-1 bg-white/5 border-4 border-white/5 rounded-[3rem] px-12 py-8 text-2xl font-black uppercase tracking-tighter outline-none focus:border-indigo-600 focus:bg-black transition-all italic placeholder:text-slate-800 shadow-inner" />
                          <button onClick={() => addSkill()} className="px-16 bg-white text-slate-950 rounded-[3rem] font-black text-[13px] uppercase tracking-[0.8em] transition-all hover:scale-110 hover:bg-indigo-400 hover:text-white active:scale-95 shadow-24 border-8 border-white/10 italic group/in-btn relative overflow-hidden shrink-0">
                            <span className="relative z-10">INJECT_PROTOCOL</span>
                            <div className="absolute top-0 left-0 w-full h-full bg-indigo-500/10 -translate-x-full group-hover/in-btn:animate-[shimmer_3s_infinite]" />
                          </button>
                        </div>
                      </div>
                      <div className="absolute top-0 right-0 p-32 text-[260px] font-black italic opacity-[0.03] grayscale pointer-events-none select-none text-white leading-none">MATRIX</div>
                      <div className="absolute -bottom-48 -right-48 w-[800px] h-[800px] bg-indigo-500/10 rounded-full blur-[200px] group-hover/mx:scale-125 transition-transform duration-[3s]" />
                    </div>

                    <div className="bg-slate-50 p-16 rounded-[7rem] border-8 border-white shadow-inner flex flex-wrap gap-8 min-h-[500px] content-start relative group/tags overflow-hidden">
                      <div className="absolute top-0 right-0 p-32 text-[280px] font-black italic opacity-[0.03] grayscale pointer-events-none select-none text-slate-900 leading-none">NODES</div>
                      {profile.profile.skills.map((s, idx) => (
                        <div key={idx} className="group/tag flex items-center gap-6 bg-slate-950 text-white pl-12 pr-6 py-8 rounded-[4rem] shadow-24 hover:shadow-indigo-500/40 hover:-translate-y-6 lg:hover:-translate-y-12 transition-all duration-1000 cursor-default animate-in zoom-in duration-700 italic border-8 border-slate-900 hover:border-indigo-600 relative overflow-hidden">
                          <div className="flex flex-col items-start min-w-[120px]">
                            <span className="text-[8px] font-black uppercase tracking-[0.5em] opacity-40 mb-2 underline underline-offset-4 decoration-white/10">CAP_NODE_{idx.toString().padStart(3, '0')}</span>
                            <span className="text-xl font-black uppercase tracking-tighter leading-none">{s}</span>
                          </div>
                          <button onClick={() => removeItem('skills', idx)} className="w-14 h-14 rounded-[1.5rem] bg-white/5 hover:bg-rose-600/20 text-white/20 hover:text-rose-500 flex items-center justify-center transition-all opacity-40 hover:opacity-100 hover:rotate-90 border-2 border-transparent hover:border-white text-2xl font-black">✕</button>
                          <div className="absolute top-0 left-0 w-full h-full bg-indigo-600/10 -translate-x-full group-hover/tag:animate-[shimmer_2s_infinite] pointer-events-none" />
                        </div>
                      ))}
                      {profile.profile.skills.length === 0 && <div className="w-full h-full flex flex-col items-center justify-center opacity-10 py-32 grayscale animate-pulse">
                        <span className="text-[200px] mb-8 select-none">🧬</span>
                        <span className="text-3xl font-black uppercase tracking-[1em] italic text-slate-950">IDENTITY_REGISTRY_NULL_SEQUENCE</span>
                      </div>}
                    </div>
                  </div>
                )}

                {['education', 'projects'].includes(activeSection) && (
                  <div className="space-y-12 animate-in slide-in-from-bottom-12 duration-1200">
                    <div className="flex flex-col md:flex-row justify-between items-end gap-10 px-8">
                      <div className="space-y-4">
                        <h2 className="text-5xl font-black text-slate-950 uppercase tracking-tighter italic leading-none">{activeSection === 'education' ? 'ACADEMIC_FOUNDATIONS' : 'DELTA_MISSION_DIRECTIVES'}</h2>
                        <p className="text-[12px] font-black text-slate-400 uppercase tracking-[0.6em] italic underline underline-offset-[16px] decoration-slate-100">{activeSection === 'education' ? 'Foundational_knowledge_kernels_and_neural_milestones_log.' : 'High-impact_operational_delta_success_registry_archives.'}</p>
                      </div>
                      <button onClick={activeSection === 'education' ? addEducation : addProject} className="px-14 py-7 bg-slate-950 text-white rounded-[3.5rem] font-black text-[12px] uppercase tracking-[0.6em] shadow-24 hover:bg-indigo-600 hover:scale-110 active:scale-95 transition-all border-8 border-white italic group relative overflow-hidden shrink-0">
                        <span className="relative z-10 flex items-center gap-6"> ➕ INITIALIZE_ARTIFACT_NODE <div className="w-px h-6 bg-white/20 mx-2" /> DATA </span>
                        <div className="absolute top-0 left-0 w-full h-full bg-white/10 -translate-x-full group-hover:animate-[shimmer_3s_infinite]" />
                      </button>
                    </div>

                    <div className="space-y-10">
                      {profile.profile[activeSection].map((item, idx) => (
                        <div key={idx} className="group/item bg-white p-12 rounded-[6rem] border-8 border-slate-50 shadow-sm hover:shadow-24 transition-all duration-1200 relative overflow-hidden hover:-translate-y-4">
                          <button onClick={() => removeItem(activeSection, idx)} className="absolute top-12 right-12 w-16 h-16 bg-rose-50 text-rose-500 rounded-[2rem] flex items-center justify-center text-3xl opacity-0 group-hover/item:opacity-100 hover:bg-rose-600 hover:text-white transition-all hover:rotate-90 shadow-sm border-4 border-transparent hover:border-white">✕</button>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mb-12">
                            <div className="space-y-4">
                              <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.5em] italic ml-10"> {activeSection === 'education' ? 'NODAL_INSTITUTION' : 'LOG_IDENTITY_SIG'} </label>
                              <input type="text" value={activeSection === 'education' ? item.institution : item.name} onChange={e => updateItem(activeSection, idx, activeSection === 'education' ? 'institution' : 'name', e.target.value)} placeholder={activeSection === 'education' ? 'INSTITUTE_CORE_ALPHA' : 'PROJECT_NEBULA_DELTA'} className="w-full px-12 py-8 bg-slate-50 border-4 border-slate-50 rounded-[3.5rem] text-3xl font-black uppercase tracking-tighter outline-none focus:bg-white focus:border-indigo-600 transition-all italic tracking-widest" />
                            </div>
                            <div className="space-y-4">
                              <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.5em] italic ml-10"> {activeSection === 'education' ? 'DEGREE_SPECIFICATION' : 'ACCESS_URL_UPLINK'} </label>
                              <input type={activeSection === 'education' ? 'text' : 'url'} value={activeSection === 'education' ? item.degree : (item.url || '')} onChange={e => updateItem(activeSection, idx, activeSection === 'education' ? 'degree' : 'url', e.target.value)} placeholder={activeSection === 'education' ? 'CYBER_STRAT_ROOT_SPEC' : 'HTTPS://MISSION-LOG.SIG'} className="w-full px-12 py-8 bg-slate-50 border-4 border-slate-50 rounded-[3.5rem] text-3xl font-black uppercase tracking-tighter outline-none focus:bg-white focus:border-indigo-600 transition-all italic tracking-widest" />
                            </div>
                          </div>
                          <div className="space-y-4">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.5em] italic ml-16"> DOCUMENTARY_FIELD_DATA_SUMMARY </label>
                            <textarea rows="5" value={item.description || item.field || ''} onChange={e => updateItem(activeSection, idx, activeSection === 'education' ? 'field' : 'description', e.target.value)} placeholder="ARTIFACT_DOCUMENTATION_INITIALIZING_SURVEILLANCE_LOGS_..." className="w-full px-16 py-12 bg-slate-50 border-4 border-slate-50 rounded-[5rem] text-xl font-black text-slate-950 uppercase tracking-tighter outline-none focus:bg-white focus:border-indigo-600 transition-all resize-none italic leading-loose scrollbar-none" />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="fixed bottom-0 left-0 w-full h-2 bg-gradient-to-r from-transparent via-indigo-600 to-transparent opacity-20 pointer-events-none blur-sm shadow-[0_0_20px_indigo]" />
    </Layout>
  );
};

export default Profile;