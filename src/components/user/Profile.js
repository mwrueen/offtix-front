import React, { useState, useEffect } from 'react';
import Layout from '../layout/Layout';
import api, { getAssetUrl } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useCompany } from '../../context/CompanyContext';
import { useToast } from '../../context/ToastContext';

import PageHeader from '../layout/PageHeader';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';

const EDUCATION_LEVEL_OPTIONS = [
  { value: '', label: 'Qualification level' },
  { value: 'Secondary school', label: 'Secondary school (e.g. SSC, O Level)' },
  { value: 'Higher secondary', label: 'Higher secondary (e.g. HSC, A Level)' },
  { value: 'Undergraduate / Graduation', label: "Undergraduate / Graduation (e.g. Bachelor's)" },
  { value: 'Postgraduate', label: "Postgraduate (e.g. Master's, MPhil)" },
  { value: 'Doctorate', label: 'Doctorate (e.g. PhD)' },
  { value: 'Diploma / technical', label: 'Diploma / technical program' },
  { value: 'Certificate', label: 'Certificate / short course' },
  { value: 'Other', label: 'Other' }
];

const EDUCATION_STREAM_OPTIONS = [
  { value: '', label: 'Academic stream' },
  { value: 'Science', label: 'Science' },
  { value: 'Arts / Humanities', label: 'Arts / Humanities' },
  { value: 'Commerce / Business', label: 'Commerce / Business studies' },
  { value: 'General / ungrouped', label: 'General / not grouped' },
  { value: 'Vocational', label: 'Vocational / skills track' },
  { value: 'Other', label: 'Other' }
];

/** Maps GET/PUT user JSON from the API into Profile component state. */
const mapApiUserToState = (data) => {
  if (!data) return null;
  const profileData = data.profile || {};
  return {
    name: data.name || '',
    email: data.email || '',
    role: data.role || '',
    createdAt: data.createdAt || '',
    profile: {
      profilePicture: profileData.profilePicture || '',
      coverPhoto: profileData.coverPhoto || '',
      coverPosition: typeof profileData.coverPosition === 'number' ? profileData.coverPosition : 50,
      phone: profileData.phone || '',
      location: profileData.location || '',
      address: profileData.address || profileData.location || '',
      fatherName: profileData.fatherName || '',
      motherName: profileData.motherName || '',
      title: profileData.title || '',
      summary: profileData.summary || '',
      experience: Array.isArray(profileData.experience) ? profileData.experience : [],
      education: Array.isArray(profileData.education) ? profileData.education : [],
      projects: Array.isArray(profileData.projects) ? profileData.projects : [],
      skills: profileData.skills || [],
      languages: profileData.languages || [],
      linkedin: profileData.linkedin || '',
      achievements: Array.isArray(profileData.achievements) ? profileData.achievements : []
    },
    id: data._id
  };
};

const Profile = () => {
  const { state: authState, dispatch: authDispatch } = useAuth();
  const { state: companyState } = useCompany();
  const toast = useToast();

  const getImageUrl = getAssetUrl;

  const [profile, setProfile] = useState({
    name: '',
    email: '',
    role: '',
    createdAt: '',
    profile: {
      profilePicture: '',
      coverPhoto: '',
      coverPosition: 50,
      phone: '',
      location: '',
      address: '',
      fatherName: '',
      motherName: '',
      title: '',
      summary: '',
      experience: [],
      education: [],
      projects: [],
      skills: [],
      languages: [],
      linkedin: '',
      achievements: []
    }
  });

  const [localImages, setLocalImages] = useState({ profilePicture: '', coverPhoto: '' });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [generatingAiKey, setGeneratingAiKey] = useState(null);
  const [activeSection, setActiveSection] = useState('basic');
  const [skillInput, setSkillInput] = useState('');

  const isPremiumUser = authState?.user?.role === 'superadmin' ||
                        authState?.user?.subscription?.plan === 'premium' ||
                        companyState?.selectedCompany?.subscription?.plan === 'premium';

  const handleWriteWithAi = async (type, index = null) => {
    if (!isPremiumUser) {
      window.dispatchEvent(new CustomEvent('open-upgrade-modal', { detail: { featureKey: 'ai' } }));
      return;
    }


    const key = index !== null ? `${type}-${index}` : type;
    setGeneratingAiKey(key);
    try {
      let payload = { type, name: profile.name, title: profile.profile.title };

      if (type === 'summary') {
        payload.currentText = profile.profile.summary || '';
      } else if (type === 'experience' && index !== null) {
        const exp = profile.profile.experience[index] || {};
        payload.company = exp.company;
        payload.position = exp.position;
        payload.currentText = exp.description || '';
      } else if (type === 'project' && index !== null) {
        const proj = profile.profile.projects[index] || {};
        payload.title = proj.name;
        payload.currentText = proj.description || '';
      } else if (type === 'achievement' && index !== null) {
        const ach = profile.profile.achievements[index] || {};
        payload.title = ach.title;
        payload.currentText = ach.description || '';
      }

      const res = await api.post('/ai/generate-profile-text', payload);
      const generatedText = res.data?.text || '';

      if (type === 'summary') {
        setProfile(p => ({ ...p, profile: { ...p.profile, summary: generatedText } }));
      } else if (type === 'experience' && index !== null) {
        updateItem('experience', index, 'description', generatedText);
      } else if (type === 'project' && index !== null) {
        updateItem('projects', index, 'description', generatedText);
      } else if (type === 'achievement' && index !== null) {
        updateItem('achievements', index, 'description', generatedText);
      }

      toast?.showToast?.('✨ Content enhanced with AI!', 'success');
    } catch (err) {
      console.error('Error generating AI text:', err);
      if (err.response?.status === 403 || err.response?.data?.error === 'PREMIUM_FEATURE_RESTRICTED') {
        window.dispatchEvent(new CustomEvent('open-upgrade-modal', { detail: { featureKey: 'ai' } }));
      } else {
        toast?.showToast?.('Failed to generate AI text.', 'error');
      }
    } finally {
      setGeneratingAiKey(null);
    }
  };


  const [isRepositioning, setIsRepositioning] = useState(false);
  const [dragStart, setDragStart] = useState(null);
  const [tempPosition, setTempPosition] = useState(50);

  const handleCoverMouseDown = (e) => {
    if (!isRepositioning) return;
    e.preventDefault();
    setDragStart({
      y: e.clientY,
      pos: tempPosition
    });
  };

  const handleCoverMouseMove = (e) => {
    if (!isRepositioning || !dragStart) return;
    const deltaY = e.clientY - dragStart.y;
    const containerHeight = e.currentTarget.clientHeight || 192;
    const pctChange = (deltaY / containerHeight) * 100;
    const newPos = Math.max(0, Math.min(100, dragStart.pos - pctChange));
    setTempPosition(newPos);
  };

  const handleCoverMouseUp = () => {
    setDragStart(null);
  };

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      try {
        const response = await api.get('/users/profile');
        if (cancelled) return;
        const mapped = mapApiUserToState(response.data);
        if (mapped) setProfile(mapped);
        const profileData = response.data.profile || {};
        setLocalImages({
          profilePicture: profileData.profilePicture || '',
          coverPhoto: profileData.coverPhoto || ''
        });
      } catch (error) {
        if (!cancelled) {
          console.error('Error fetching profile', error);
          toast?.showToast?.('Failed to load profile data.', 'error');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const exportResume = async () => {
    try {
      toast?.showToast?.('Generating resume PDF...', 'info');
      const response = await api.get(`/users/${profile.id}/export-pdf`, { responseType: 'blob' });

      if (response.data.type === 'application/json' || response.data.type.includes('json')) {
        const text = await response.data.text();
        let errMsg = 'Export failed';
        try {
          const parsed = JSON.parse(text);
          errMsg = parsed.message || parsed.error || errMsg;
        } catch (e) {}
        throw new Error(errMsg);
      }

      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${(profile?.name || 'User').replace(/\s+/g, '_')}_Resume.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      toast?.showToast?.('Resume downloaded successfully.', 'success');
    } catch (error) {
      console.error('Export failed:', error);
      toast?.showToast?.(error.message || 'Could not generate PDF. Please try again.', 'error');
    }
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
      const response = await api.put('/users/profile', cleanProfile);
      const mapped = mapApiUserToState(response.data);
      if (mapped) {
        setProfile(mapped);
        authDispatch({ type: 'UPDATE_USER', payload: response.data });
        const profileData = response.data.profile || {};
        setLocalImages({
          profilePicture: profileData.profilePicture || '',
          coverPhoto: profileData.coverPhoto || ''
        });
      }
      toast?.showToast?.('Profile updated successfully.', 'success');
    } catch (error) { toast?.showToast?.('Update failed: ' + (error.response?.data?.error || 'Unknown error'), 'error'); }
    finally { setSaving(false); }
  };

  const handleFileUpload = async (e, type = 'profile') => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast?.showToast?.('File size exceeds 5MB limit.', 'error');
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

        // Refresh full user data to sync with AuthContext
        const userRes = await api.get('/users/profile');
        authDispatch({ type: 'UPDATE_USER', payload: userRes.data });

        toast?.showToast?.('Photo uploaded.', 'success');
      } catch (error) { toast?.showToast?.('Upload failed.', 'error'); }
    }
  };

  const addExperience = () => setProfile(p => ({ ...p, profile: { ...p.profile, experience: [{ company: '', position: '', startDate: '', endDate: '', description: '', current: false }, ...p.profile.experience] } }));
  const addEducation = () => setProfile(p => ({
    ...p,
    profile: {
      ...p.profile,
      education: [{
        institution: '',
        degree: '',
        field: '',
        stream: '',
        level: '',
        result: '',
        startDate: '',
        endDate: '',
        current: false
      }, ...p.profile.education]
    }
  }));
  const addProject = () => setProfile(p => ({ ...p, profile: { ...p.profile, projects: [{ name: '', description: '', technologies: [], url: '', startDate: '', endDate: '' }, ...p.profile.projects] } }));
  const addAchievement = () => setProfile(p => ({ ...p, profile: { ...p.profile, achievements: [{ title: '', issuer: '', date: '', description: '' }, ...p.profile.achievements] } }));
  const addSkill = (skill = skillInput) => {
    if (skill && skill.trim() && !profile.profile.skills.includes(skill.trim())) {
      setProfile(p => ({ ...p, profile: { ...p.profile, skills: [...p.profile.skills, skill.trim()] } }));
      setSkillInput('');
    }
  };

  const removeItem = (section, index) => setProfile(p => ({ ...p, profile: { ...p.profile, [section]: p.profile[section].filter((_, i) => i !== index) } }));
  const updateItem = (section, index, field, value) => {
    setProfile(p => {
      const updatedItems = [...p.profile[section]];
      updatedItems[index] = { ...updatedItems[index], [field]: value };
      return { ...p, profile: { ...p.profile, [section]: updatedItems } };
    });
  };

  if (loading) return (
    <Layout>
      <div className="p-40 text-center space-y-6">
        <div className="w-10 h-10 border-2 border-slate-200 border-t-indigo-600 rounded-full animate-spin mx-auto" />
        <p className="text-sm font-medium text-slate-500">Loading your profile...</p>
      </div>
    </Layout>
  );

  const sections = [
    { id: 'basic', label: 'Basic Info', icon: '👤' },
    { id: 'experience', label: 'Experience', icon: '📂' },
    { id: 'education', label: 'Education', icon: '🎓' },
    { id: 'projects', label: 'Projects', icon: '⚛️' },
    { id: 'achievements', label: 'Achievements', icon: '🏆' },
    { id: 'skills', label: 'Skills', icon: '⚡' }
  ];

  return (
    <Layout>
      <div className="space-y-8 pb-32 fade-in">
        <PageHeader
          title="Edit Profile"
          subtitle="Manage your professional identity, career history, and credentials."
          icon="👤"
          stats={[
            { label: 'Email', value: profile.email || '—' },
            { label: 'Role', value: profile.role ? profile.role.charAt(0).toUpperCase() + profile.role.slice(1) : '—' },
            { label: 'Profile Version', value: 'Standard' }
          ]}
          actions={
            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => window.open(`/profile/view/${profile.id}`, '_blank')}
                className="px-4 py-2 bg-white text-slate-900 border border-slate-200 rounded-xl font-bold text-xs hover:border-indigo-600 transition-all flex items-center gap-2"
              >
                Preview Profile
              </button>
              <button
                onClick={exportResume}
                className="px-4 py-2 bg-slate-900 text-white rounded-xl font-bold text-xs transition-all flex items-center gap-2"
              >
                Export PDF
              </button>
              <button
                onClick={handleSubmit}
                disabled={saving}
                className="px-6 py-2.5 bg-indigo-600 text-white rounded-xl font-bold text-sm shadow-md hover:bg-indigo-700 transition-all disabled:opacity-50"
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          }
        />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 font-sans">
          <div className="lg:col-span-3 space-y-6">
            <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-sm flex flex-col gap-1">
              {sections.map(s => (
                <button
                  key={s.id}
                  onClick={() => setActiveSection(s.id)}
                  className={`flex items-center gap-3 px-5 py-3 rounded-xl text-xs font-bold transition-all ${activeSection === s.id ? 'bg-slate-900 text-white' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'}`}
                >
                  <span className="text-lg">{s.icon}</span>
                  <span className="truncate">{s.label}</span>
                </button>
              ))}
            </div>
            <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 text-left space-y-4">
              <div>
                <div className="text-[10px] font-bold uppercase tracking-widest mb-1 text-slate-400">Sign-in email</div>
                <div className="text-sm font-semibold text-slate-900 break-all" title={profile.email || undefined}>
                  {profile.email || 'Not available'}
                </div>
              </div>
              <div className="pt-3 border-t border-slate-200">
                <div className="text-[10px] font-bold uppercase tracking-widest mb-1 text-slate-400">Account</div>
                <div className="text-sm font-bold text-slate-900">Active</div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-9">
            <div className="bg-white rounded-2xl p-8 lg:p-10 border border-slate-200 min-h-[600px]">
              {activeSection === 'basic' && (
                <div className="space-y-10">
                  <div className="relative">
                    <div
                      className={`w-full h-48 rounded-2xl border border-slate-200 overflow-hidden relative group transition-colors bg-cover ${!(localImages.coverPhoto || profile.profile.coverPhoto) ? 'bg-gradient-to-r from-slate-900 to-indigo-900' : ''}`}
                      style={(localImages.coverPhoto || profile.profile.coverPhoto) ? {
                        backgroundImage: `url(${getImageUrl(localImages.coverPhoto || profile.profile.coverPhoto)})`,
                        backgroundPosition: `center ${isRepositioning ? tempPosition : (profile.profile.coverPosition ?? 50)}%`,
                        cursor: isRepositioning ? (dragStart ? 'grabbing' : 'grab') : 'default'
                      } : {}}
                      onMouseDown={handleCoverMouseDown}
                      onMouseMove={handleCoverMouseMove}
                      onMouseUp={handleCoverMouseUp}
                      onMouseLeave={handleCoverMouseUp}
                    >
                      {/* Reposition Mode Controls */}
                      {isRepositioning ? (
                        <div className="absolute inset-0 bg-black/30 flex flex-col items-center justify-between p-4 backdrop-blur-[1px] select-none">
                          <div className="bg-slate-900/80 px-4 py-1.5 rounded-full text-white text-xs font-semibold shadow-lg backdrop-blur-sm">
                            ↕️ Drag up or down to adjust cover position
                          </div>
                          <div className="flex gap-2">
                            <button
                              type="button"
                              onClick={() => {
                                setProfile(p => ({
                                  ...p,
                                  profile: {
                                    ...p.profile,
                                    coverPosition: tempPosition
                                  }
                                }));
                                setIsRepositioning(false);
                              }}
                              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-xs shadow-lg transition-all"
                            >
                              Save Position
                            </button>
                            <button
                              type="button"
                              onClick={() => setIsRepositioning(false)}
                              className="px-4 py-2 bg-white hover:bg-slate-50 text-slate-900 rounded-xl font-bold text-xs shadow-lg transition-all"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        (localImages.coverPhoto || profile.profile.coverPhoto) && (
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center gap-3 backdrop-blur-sm">
                            <label htmlFor="cover-up" className="px-4 py-2 bg-white text-slate-900 rounded-lg font-bold text-xs cursor-pointer shadow-lg hover:scale-105 transition-all">Change Cover</label>
                            <button
                              type="button"
                              onClick={() => {
                                setIsRepositioning(true);
                                setTempPosition(profile.profile.coverPosition ?? 50);
                              }}
                              className="px-4 py-2 bg-white text-slate-900 rounded-lg font-bold text-xs cursor-pointer shadow-lg hover:scale-105 transition-all"
                            >
                              Reposition
                            </button>
                          </div>
                        )
                      )}
                      
                      {/* When no cover photo exists, just show change cover button */}
                      {!(localImages.coverPhoto || profile.profile.coverPhoto) && (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <label htmlFor="cover-up" className="px-5 py-2 bg-white text-slate-900 rounded-lg font-bold text-xs cursor-pointer shadow-lg hover:scale-105 transition-all">Upload Cover Photo</label>
                        </div>
                      )}
                      <input type="file" id="cover-up" accept="image/*" onChange={e => handleFileUpload(e, 'cover')} className="hidden" />
                    </div>

                    <div className="absolute -bottom-12 left-8">
                      <div className="relative group/avatar">
                        <div
                          className={`w-32 h-32 rounded-3xl border-4 border-white shadow-lg overflow-hidden relative bg-cover bg-center ${!(localImages.profilePicture || profile.profile.profilePicture) ? 'bg-indigo-600' : 'bg-slate-100'}`}
                          style={(localImages.profilePicture || profile.profile.profilePicture) ? { backgroundImage: `url(${getImageUrl(localImages.profilePicture || profile.profile.profilePicture)})` } : {}}
                        >
                          {!(localImages.profilePicture || profile.profile.profilePicture) && <div className="w-full h-full flex items-center justify-center text-white text-4xl font-bold">{profile.name.charAt(0)}</div>}
                          <div className="absolute inset-0 bg-black/20 opacity-0 group-hover/avatar:opacity-100 transition-all flex items-center justify-center">
                            <label htmlFor="pf-up" className="p-2 bg-white text-indigo-600 rounded-lg cursor-pointer shadow-lg hover:scale-110 transition-transform">📷</label>
                          </div>
                        </div>
                        <input type="file" id="pf-up" accept="image/*" onChange={e => handleFileUpload(e, 'profile')} className="hidden" />
                      </div>
                    </div>
                  </div>

                  <div className="pt-16 grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="md:col-span-2 space-y-1.5">
                      <label htmlFor="profile-email-readonly" className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Email</label>
                      <input
                        id="profile-email-readonly"
                        type="email"
                        value={profile.email}
                        readOnly
                        aria-readonly="true"
                        className="w-full px-4 py-2.5 bg-slate-100 border border-slate-200 rounded-xl text-base font-semibold text-slate-700 outline-none cursor-default"
                      />
                      <p className="text-xs text-slate-500 ml-1">This is the address you use to sign in. It cannot be edited on this page.</p>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Full Name</label>
                      <input type="text" value={profile.name} onChange={e => setProfile({ ...profile, name: e.target.value })} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-base font-semibold outline-none focus:bg-white focus:border-indigo-400 transition-all" />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Headline</label>
                      <input type="text" value={profile.profile.title} onChange={e => setProfile({ ...profile, profile: { ...profile.profile, title: e.target.value } })} placeholder="e.g. Senior Product Designer" className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-base font-semibold outline-none focus:bg-white focus:border-indigo-400 transition-all" />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Father's Name <span className="text-rose-500">*</span></label>
                      <input type="text" value={profile.profile.fatherName || ''} onChange={e => setProfile({ ...profile, profile: { ...profile.profile, fatherName: e.target.value } })} placeholder="Father's full name" className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-base font-semibold outline-none focus:bg-white focus:border-indigo-400 transition-all" />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Mother's Name <span className="text-rose-500">*</span></label>
                      <input type="text" value={profile.profile.motherName || ''} onChange={e => setProfile({ ...profile, profile: { ...profile.profile, motherName: e.target.value } })} placeholder="Mother's full name" className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-base font-semibold outline-none focus:bg-white focus:border-indigo-400 transition-all" />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Full Address <span className="text-rose-500">*</span></label>
                      <input type="text" value={profile.profile.address || profile.profile.location || ''} onChange={e => setProfile({ ...profile, profile: { ...profile.profile, address: e.target.value, location: e.target.value } })} placeholder="House/Street, City, Postal Code, Country" className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-base font-semibold outline-none focus:bg-white focus:border-indigo-400 transition-all" />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Phone</label>
                      <input type="tel" value={profile.profile.phone} onChange={e => setProfile({ ...profile, profile: { ...profile.profile, phone: e.target.value } })} placeholder="+1 (234) 567-890" className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-base font-semibold outline-none focus:bg-white focus:border-indigo-400 transition-all" />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">LinkedIn URL</label>
                      <input type="url" value={profile.profile.linkedin} onChange={e => setProfile({ ...profile, profile: { ...profile.profile, linkedin: e.target.value } })} placeholder="linkedin.com/in/username" className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-base font-semibold outline-none focus:bg-white focus:border-indigo-400 transition-all" />
                    </div>
                    <div className="md:col-span-2 space-y-1.5">
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Summary</label>
                        <button
                          type="button"
                          onClick={() => handleWriteWithAi('summary')}
                          disabled={generatingAiKey === 'summary'}
                          className="px-3 py-1 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white rounded-lg font-bold text-[11px] flex items-center gap-1.5 shadow-2xs transition-all disabled:opacity-50"
                        >
                          {generatingAiKey === 'summary' ? (
                            <>
                              <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                              <span>Writing with AI...</span>
                            </>
                          ) : (
                            <>
                              <span>✨ Write with AI</span>
                            </>
                          )}
                        </button>
                      </div>
                      <div className="rounded-xl overflow-hidden border border-slate-200">
                        <ReactQuill
                          theme="snow"
                          value={profile.profile.summary ?? ''}
                          onChange={(val, _delta, source) => {
                            if (source !== 'user') return;
                            setProfile(p => ({ ...p, profile: { ...p.profile, summary: val } }));
                          }}
                          placeholder="A brief overview of your background..."
                          className="bg-white"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeSection === 'experience' && (
                <div className="space-y-8">
                  <div className="flex justify-between items-center gap-4">
                    <h3 className="text-xl font-bold text-slate-900">Experience</h3>
                    <button onClick={addExperience} className="px-4 py-2 bg-slate-900 text-white rounded-xl font-bold text-xs">+ Add Record</button>
                  </div>
                  <div className="space-y-4">
                    {profile.profile.experience.map((exp, idx) => (
                      <div key={idx} className="group bg-white p-6 rounded-2xl border border-slate-200 hover:border-indigo-200 transition-all relative">
                        <button onClick={() => removeItem('experience', idx)} className="absolute top-4 right-4 text-slate-400 hover:text-rose-600 transition-colors">✕</button>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                          <input type="text" value={exp.company} onChange={e => updateItem('experience', idx, 'company', e.target.value)} placeholder="Company" className="px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold outline-none focus:bg-white focus:border-indigo-400" />
                          <input type="text" value={exp.position} onChange={e => updateItem('experience', idx, 'position', e.target.value)} placeholder="Position" className="px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold outline-none focus:bg-white focus:border-indigo-400" />
                        </div>
                        <div className="flex flex-wrap gap-4 items-center mb-4 pb-4 border-b border-slate-100">
                          <div className="flex gap-2 text-xs font-bold text-slate-500">
                            <input type="date" value={exp.startDate ? exp.startDate.split('T')[0] : ''} onChange={e => updateItem('experience', idx, 'startDate', e.target.value)} className="bg-transparent" />
                            <span>—</span>
                            {!exp.current ? <input type="date" value={exp.endDate ? exp.endDate.split('T')[0] : ''} onChange={e => updateItem('experience', idx, 'endDate', e.target.value)} className="bg-transparent" /> : <span>Present</span>}
                          </div>
                          <div className="flex items-center gap-2 cursor-pointer" onClick={() => updateItem('experience', idx, 'current', !exp.current)}>
                            <div className={`w-3.5 h-3.5 rounded border flex items-center justify-center transition-colors ${exp.current ? 'bg-indigo-600 border-indigo-600' : 'border-slate-300'}`}>
                              {exp.current && <span className="text-white text-[10px]">✓</span>}
                            </div>
                            <span className="text-[10px] font-bold text-slate-500 uppercase">I currently work here</span>
                          </div>
                        </div>
                        <div className="flex items-center justify-between mb-1.5">
                          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Responsibilities & Accomplishments</label>
                          <button
                            type="button"
                            onClick={() => handleWriteWithAi('experience', idx)}
                            disabled={generatingAiKey === `experience-${idx}`}
                            className="px-3 py-1 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white rounded-lg font-bold text-[11px] flex items-center gap-1.5 shadow-2xs transition-all disabled:opacity-50"
                          >
                            {generatingAiKey === `experience-${idx}` ? (
                              <>
                                <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                <span>Writing with AI...</span>
                              </>
                            ) : (
                              <>
                                <span>✨ Write Responsibilities with AI</span>
                              </>
                            )}
                          </button>
                        </div>
                        <ReactQuill
                          theme="snow"
                          value={exp.description ?? ''}
                          onChange={(val, _delta, source) => {
                            if (source !== 'user') return;
                            updateItem('experience', idx, 'description', val);
                          }}
                          placeholder="Responsibilities & accomplishments..."
                          className="bg-white rounded-xl overflow-hidden border border-slate-200"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {activeSection === 'education' && (
                <div className="space-y-8">
                  <div className="flex justify-between items-center gap-4">
                    <h3 className="text-xl font-bold text-slate-900">Education</h3>
                    <button onClick={addEducation} className="px-4 py-2 bg-slate-900 text-white rounded-xl font-bold text-xs">+ Add Record</button>
                  </div>
                  <div className="space-y-4">
                    {profile.profile.education.map((edu, idx) => (
                      <div key={idx} className="group bg-white p-6 rounded-2xl border border-slate-200 hover:border-indigo-200 transition-all relative">
                        <button type="button" onClick={() => removeItem('education', idx)} className="absolute top-4 right-4 text-slate-400 hover:text-rose-600 transition-colors">✕</button>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                          <div className="space-y-1.5">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Institution</label>
                            <input type="text" value={edu.institution ?? ''} onChange={e => updateItem('education', idx, 'institution', e.target.value)} placeholder="School or university name" className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold outline-none focus:bg-white focus:border-indigo-400" />
                          </div>
                          <div className="space-y-1.5">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Degree / certification</label>
                            <input type="text" value={edu.degree ?? ''} onChange={e => updateItem('education', idx, 'degree', e.target.value)} placeholder="e.g. SSC, BSc, MBA" className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold outline-none focus:bg-white focus:border-indigo-400" />
                          </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                          <div className="space-y-1.5">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Qualification level</label>
                            <select
                              value={edu.level ?? ''}
                              onChange={e => updateItem('education', idx, 'level', e.target.value)}
                              className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold outline-none focus:bg-white focus:border-indigo-400"
                            >
                              {EDUCATION_LEVEL_OPTIONS.map(opt => (
                                <option key={opt.value || 'empty'} value={opt.value}>{opt.label}</option>
                              ))}
                            </select>
                          </div>
                          <div className="space-y-1.5">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Academic stream</label>
                            <select
                              value={edu.stream ?? ''}
                              onChange={e => updateItem('education', idx, 'stream', e.target.value)}
                              className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold outline-none focus:bg-white focus:border-indigo-400"
                            >
                              {EDUCATION_STREAM_OPTIONS.map(opt => (
                                <option key={opt.value || 'empty-stream'} value={opt.value}>{opt.label}</option>
                              ))}
                            </select>
                            <p className="text-[10px] text-slate-400 font-medium ml-1">e.g. Science, Arts, Commerce where applicable</p>
                          </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                          <div className="space-y-1.5">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Major / discipline (optional)</label>
                            <input type="text" value={edu.field ?? ''} onChange={e => updateItem('education', idx, 'field', e.target.value)} placeholder="e.g. Computer Science, Accounting" className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold outline-none focus:bg-white focus:border-indigo-400" />
                          </div>
                          <div className="space-y-1.5">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Result (optional)</label>
                            <input type="text" value={edu.result ?? ''} onChange={e => updateItem('education', idx, 'result', e.target.value)} placeholder="GPA, grade, division, class…" className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold outline-none focus:bg-white focus:border-indigo-400" />
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-4 items-center pt-2 border-t border-slate-100">
                          <div className="flex gap-2 text-xs font-bold text-slate-500">
                            <input type="date" value={edu.startDate ? edu.startDate.split('T')[0] : ''} onChange={e => updateItem('education', idx, 'startDate', e.target.value)} className="bg-transparent" />
                            <span>—</span>
                            {!edu.current ? <input type="date" value={edu.endDate ? edu.endDate.split('T')[0] : ''} onChange={e => updateItem('education', idx, 'endDate', e.target.value)} className="bg-transparent" /> : <span>Present</span>}
                          </div>
                          <button type="button" className="flex items-center gap-2 cursor-pointer bg-transparent border-0 p-0" onClick={() => updateItem('education', idx, 'current', !edu.current)}>
                            <div className={`w-3.5 h-3.5 rounded border flex items-center justify-center transition-colors ${edu.current ? 'bg-indigo-600 border-indigo-600' : 'border-slate-300'}`}>
                              {edu.current && <span className="text-white text-[10px]">✓</span>}
                            </div>
                            <span className="text-[10px] font-bold text-slate-500 uppercase">Currently enrolled</span>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {activeSection === 'projects' && (
                <div className="space-y-8">
                  <div className="flex justify-between items-center gap-4">
                    <h3 className="text-xl font-bold text-slate-900">Projects</h3>
                    <button onClick={addProject} className="px-4 py-2 bg-slate-900 text-white rounded-xl font-bold text-xs">+ Add Project</button>
                  </div>
                  <div className="space-y-4">
                    {profile.profile.projects.map((proj, idx) => (
                      <div key={idx} className="group bg-white p-6 rounded-2xl border border-slate-200 hover:border-indigo-200 transition-all relative">
                        <button onClick={() => removeItem('projects', idx)} className="absolute top-4 right-4 text-slate-400 hover:text-rose-600 transition-colors">✕</button>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                          <input type="text" value={proj.name} onChange={e => updateItem('projects', idx, 'name', e.target.value)} placeholder="Project Title" className="px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold outline-none focus:bg-white focus:border-indigo-400" />
                          <input type="text" value={proj.url} onChange={e => updateItem('projects', idx, 'url', e.target.value)} placeholder="Link / URL" className="px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold outline-none focus:bg-white focus:border-indigo-400" />
                        </div>
                        <div className="flex items-center justify-between mb-1.5">
                          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Project Description</label>
                          <button
                            type="button"
                            onClick={() => handleWriteWithAi('project', idx)}
                            disabled={generatingAiKey === `project-${idx}`}
                            className="px-3 py-1 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white rounded-lg font-bold text-[11px] flex items-center gap-1.5 shadow-2xs transition-all disabled:opacity-50"
                          >
                            {generatingAiKey === `project-${idx}` ? (
                              <>
                                <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                <span>Writing with AI...</span>
                              </>
                            ) : (
                              <>
                                <span>✨ Write Description with AI</span>
                              </>
                            )}
                          </button>
                        </div>
                        <ReactQuill
                          theme="snow"
                          value={proj.description ?? ''}
                          onChange={(val, _delta, source) => {
                            if (source !== 'user') return;
                            updateItem('projects', idx, 'description', val);
                          }}
                          placeholder="Project overview..."
                          className="bg-white rounded-xl overflow-hidden border border-slate-200"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {activeSection === 'skills' && (
                <div className="space-y-8">
                  <h3 className="text-xl font-bold text-slate-900">Skills</h3>
                  <div className="flex gap-2">
                    <input type="text" value={skillInput} onChange={e => setSkillInput(e.target.value)} onKeyPress={e => e.key === 'Enter' && addSkill()} placeholder="Add a skill..." className="flex-1 px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold outline-none focus:bg-white focus:border-indigo-400" />
                    <button onClick={() => addSkill()} className="px-6 py-2 bg-indigo-600 text-white rounded-xl font-bold text-xs hover:bg-indigo-700 transition-all shadow-sm">Add</button>
                  </div>
                  <div className="flex flex-wrap gap-2 pt-2">
                    {profile.profile.skills.map((s, idx) => (
                      <div key={idx} className="flex items-center gap-2 bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-bold text-slate-700 group/tag hover:border-indigo-300 transition-all">
                        {s}
                        <button onClick={() => removeItem('skills', idx)} className="text-slate-400 hover:text-rose-600">✕</button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {activeSection === 'achievements' && (
                <div className="space-y-8">
                  <div className="flex justify-between items-center gap-4">
                    <h3 className="text-xl font-bold text-slate-900">Achievements</h3>
                    <button onClick={addAchievement} className="px-4 py-2 bg-slate-900 text-white rounded-xl font-bold text-xs">+ Add Record</button>
                  </div>
                  <div className="space-y-4">
                    {profile.profile.achievements.map((ach, idx) => (
                      <div key={idx} className="group bg-white p-6 rounded-2xl border border-slate-200 hover:border-indigo-200 transition-all relative">
                        <button onClick={() => removeItem('achievements', idx)} className="absolute top-4 right-4 text-slate-400 hover:text-rose-600 transition-colors">✕</button>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                          <input type="text" value={ach.title} onChange={e => updateItem('achievements', idx, 'title', e.target.value)} placeholder="Title" className="px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold outline-none focus:bg-white focus:border-indigo-400" />
                          <input type="text" value={ach.issuer} onChange={e => updateItem('achievements', idx, 'issuer', e.target.value)} placeholder="Issuer" className="px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold outline-none focus:bg-white focus:border-indigo-400" />
                        </div>
                        <div className="flex items-center justify-between mb-1.5">
                          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Achievement Description</label>
                          <button
                            type="button"
                            onClick={() => handleWriteWithAi('achievement', idx)}
                            disabled={generatingAiKey === `achievement-${idx}`}
                            className="px-3 py-1 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white rounded-lg font-bold text-[11px] flex items-center gap-1.5 shadow-2xs transition-all disabled:opacity-50"
                          >
                            {generatingAiKey === `achievement-${idx}` ? (
                              <>
                                <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                <span>Writing with AI...</span>
                              </>
                            ) : (
                              <>
                                <span>✨ Write Description with AI</span>
                              </>
                            )}
                          </button>
                        </div>
                        <ReactQuill
                          theme="snow"
                          value={ach.description ?? ''}
                          onChange={(val, _delta, source) => {
                            if (source !== 'user') return;
                            updateItem('achievements', idx, 'description', val);
                          }}
                          placeholder="Description..."
                          className="bg-white rounded-xl overflow-hidden border border-slate-200"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Profile;
