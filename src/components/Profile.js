import React, { useState, useEffect } from 'react';
import Layout from './Layout';
import api, { API_BASE_URL, BASE_SERVER_URL } from '../services/api';
import { useToast } from '../context/ToastContext';
import { useCompany } from '../context/CompanyContext';
import PageHeader from './PageHeader';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';

const Profile = () => {
  const { state: companyState } = useCompany();
  const toast = useToast();

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    try {
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) return dateStr;
      return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
    } catch (e) {
      return dateStr;
    }
  };

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
      languages: [],
      linkedin: '',
      achievements: []
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
          languages: profileData.languages || [],
          linkedin: profileData.linkedin || '',
          achievements: profileData.achievements || []
        },
        id: response.data._id
      });
      setLocalImages({ profilePicture: profileData.profilePicture || '', coverPhoto: profileData.coverPhoto || '' });
    } catch (error) {
      console.error('Error fetching profile', error);
      toast?.showToast?.('Failed to load profile data.', 'error');
    } finally { setLoading(false); }
  };

  const exportResume = async () => {
    try {
      toast?.showToast?.('Generating resume PDF...', 'info');
      const response = await api.get(`/users/${profile.id}/export-pdf`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${profile.name.replace(/\s+/g, '_')}_Resume.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast?.showToast?.('Resume downloaded successfully.', 'success');
    } catch (error) {
      console.error('Export failed:', error);
      toast?.showToast?.('Could not generate PDF. Please try again.', 'error');
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
      await api.put('/users/profile', cleanProfile);
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
        toast?.showToast?.('Photo uploaded.', 'success');
      } catch (error) { toast?.showToast?.('Upload failed.', 'error'); }
    }
  };

  const addExperience = () => setProfile(p => ({ ...p, profile: { ...p.profile, experience: [{ company: '', position: '', startDate: '', endDate: '', description: '', current: false }, ...p.profile.experience] } }));
  const addEducation = () => setProfile(p => ({ ...p, profile: { ...p.profile, education: [{ institution: '', degree: '', field: '', startDate: '', endDate: '', current: false }, ...p.profile.education] } }));
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
    const updatedItems = [...profile.profile[section]];
    updatedItems[index] = { ...updatedItems[index], [field]: value };
    setProfile(p => ({ ...p, profile: { ...p.profile, [section]: updatedItems } }));
  };

  if (loading) return (
    <Layout>
      <div className="p-40 text-center space-y-8">
        <div className="w-12 h-12 border-4 border-slate-100 border-t-indigo-600 rounded-full animate-spin mx-auto shadow-sm" />
        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Loading profile...</p>
      </div>
    </Layout>
  );

  const sections = [
    { id: 'basic', label: 'Basic Info', icon: '👤' },
    { id: 'experience', label: 'Work Experience', icon: '📂' },
    { id: 'education', label: 'Education', icon: '🎓' },
    { id: 'projects', label: 'Projects', icon: '⚛️' },
    { id: 'achievements', label: 'Achievements', icon: '🏆' },
    { id: 'skills', label: 'Skills & Tools', icon: '⚡' }
  ];

  return (
    <Layout>
      <div className="space-y-12 pb-40">
        <PageHeader
          title="User Profile"
          subtitle="Manage your personal information, career history, and professional skills."
          icon="👤"
          stats={[
            { label: 'Platform Role', value: profile.role.toUpperCase() },
            { label: 'Profile Completion', value: '100%' }
          ]}
          actions={
            <div className="flex gap-4">
              <button
                onClick={() => window.open(`/profile/view/${profile.id}`, '_blank')}
                className="px-6 py-3.5 bg-white text-slate-900 border border-slate-200 rounded-xl font-bold text-xs uppercase tracking-wider shadow-sm hover:border-indigo-600 transition-all active:scale-95 flex items-center gap-2"
              >
                <span>👁️</span> Preview CV
              </button>
              <button
                onClick={exportResume}
                className="px-6 py-3.5 bg-slate-900 text-white rounded-xl font-bold text-xs uppercase tracking-wider shadow-lg hover:bg-slate-800 transition-all active:scale-95 flex items-center gap-2"
              >
                <span>📥</span> Export Resume (PDF)
              </button>
              <button
                onClick={handleSubmit}
                disabled={saving}
                className="px-6 py-3.5 bg-indigo-600 text-white rounded-xl font-bold text-xs uppercase tracking-wider shadow-lg hover:bg-indigo-700 transition-all active:scale-95 disabled:opacity-50"
              >
                {saving ? 'Saving...' : 'Save Profile Changes'}
              </button>
            </div>
          }
        />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 font-sans">
          <div className="lg:col-span-3 space-y-6">
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col gap-2">
              {sections.map(s => (
                <button
                  key={s.id}
                  onClick={() => setActiveSection(s.id)}
                  className={`flex items-center gap-4 px-6 py-3.5 rounded-xl text-[11px] font-bold uppercase tracking-widest transition-all ${activeSection === s.id ? 'bg-slate-900 text-white shadow-md' : 'text-slate-500 hover:text-slate-950 hover:bg-slate-50'}`}
                >
                  <span className="text-xl">{s.icon}</span>
                  <span className="truncate">{s.label}</span>
                </button>
              ))}
            </div>
            <div className="bg-slate-900 p-8 rounded-2xl text-white shadow-xl relative overflow-hidden group border border-slate-800">
              <div className="relative z-10">
                <h3 className="text-[10px] font-bold uppercase tracking-widest mb-4 text-indigo-400 opacity-80">Account Status</h3>
                <p className="text-lg font-bold">Verified Professional</p>
              </div>
              <div className="absolute top-0 right-0 w-24 h-24 bg-white/5 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2" />
            </div>
          </div>

          <div className="lg:col-span-9">
            <div className="bg-white rounded-3xl p-8 lg:p-10 shadow-sm border border-slate-200 min-h-[800px] relative font-sans">
              <div className="relative z-10">
                {activeSection === 'basic' && (
                  <div className="space-y-12">
                    <div className="relative group">
                      <div
                        className={`w-full h-64 rounded-3xl bg-slate-100 border border-slate-200 shadow-inner overflow-hidden relative group-hover:border-indigo-300 transition-colors bg-cover bg-center ${!(localImages.coverPhoto || profile.profile.coverPhoto) ? 'bg-gradient-to-br from-indigo-500 to-slate-900' : ''
                          }`}
                        style={
                          (localImages.coverPhoto || profile.profile.coverPhoto)
                            ? {
                              backgroundImage: `url(${getImageUrl(localImages.coverPhoto || profile.profile.coverPhoto)})`
                            }
                            : {}
                        }
                      >
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center backdrop-blur-sm">
                          <label htmlFor="cover-up" className="px-8 py-3 bg-white text-slate-950 rounded-xl font-bold text-[11px] uppercase tracking-widest cursor-pointer shadow-lg hover:bg-indigo-50 transition-all">Change Cover Photo</label>
                        </div>
                        <input type="file" id="cover-up" accept="image/*" onChange={e => handleFileUpload(e, 'cover')} className="hidden" />
                      </div>

                      <div className="absolute -bottom-16 left-10">
                        <div className="relative group/avatar">
                          <div
                            className={`w-40 h-40 rounded-[2.5rem] border-8 border-white shadow-xl overflow-hidden bg-slate-200 relative bg-cover bg-center ${!(localImages.profilePicture || profile.profile.profilePicture) ? 'bg-indigo-600' : ''
                              }`}
                            style={
                              (localImages.profilePicture || profile.profile.profilePicture)
                                ? {
                                  backgroundImage: `url(${getImageUrl(localImages.profilePicture || profile.profile.profilePicture)})`
                                }
                                : {}
                            }
                          >
                            {!(localImages.profilePicture || profile.profile.profilePicture) && <div className="w-full h-full flex items-center justify-center text-white text-5xl font-bold bg-indigo-600">{profile.name.charAt(0)}</div>}
                            <div className="absolute inset-0 bg-black/20 opacity-0 group-hover/avatar:opacity-100 transition-all flex items-center justify-center">
                              <label htmlFor="pf-up" className="p-3 bg-white text-indigo-600 rounded-xl cursor-pointer shadow-lg hover:scale-110 transition-transform">📷</label>
                            </div>
                          </div>
                          <input type="file" id="pf-up" accept="image/*" onChange={e => handleFileUpload(e, 'profile')} className="hidden" />
                        </div>
                      </div>
                    </div>

                    <div className="pt-20 grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div className="space-y-3">
                        <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest ml-1">Full Name</label>
                        <input type="text" value={profile.name} onChange={e => setProfile({ ...profile, name: e.target.value })} className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-xl font-bold text-slate-900 outline-none focus:bg-white focus:border-indigo-400 transition-all" />
                      </div>
                      <div className="space-y-3">
                        <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest ml-1">Professional Title</label>
                        <input type="text" value={profile.profile.title} onChange={e => setProfile({ ...profile, profile: { ...profile.profile, title: e.target.value } })} placeholder="e.g. Senior Software Engineer" className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-xl font-bold text-slate-900 outline-none focus:bg-white focus:border-indigo-400 transition-all" />
                      </div>
                      <div className="space-y-3">
                        <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest ml-1">Location</label>
                        <input type="text" value={profile.profile.location} onChange={e => setProfile({ ...profile, profile: { ...profile.profile, location: e.target.value } })} placeholder="e.g. San Francisco, CA" className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-lg font-bold text-slate-900 outline-none focus:bg-white focus:border-indigo-400 transition-all" />
                      </div>
                      <div className="space-y-3">
                        <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest ml-1">Phone Number</label>
                        <input type="tel" value={profile.profile.phone} onChange={e => setProfile({ ...profile, profile: { ...profile.profile, phone: e.target.value } })} placeholder="+1 (555) 000-0000" className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-lg font-bold text-slate-900 outline-none focus:bg-white focus:border-indigo-400 transition-all" />
                      </div>
                      <div className="space-y-3">
                        <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest ml-1">LinkedIn Profile Link</label>
                        <input type="url" value={profile.profile.linkedin} onChange={e => setProfile({ ...profile, profile: { ...profile.profile, linkedin: e.target.value } })} placeholder="https://linkedin.com/in/username" className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-lg font-bold text-slate-900 outline-none focus:bg-white focus:border-indigo-400 transition-all" />
                      </div>
                      <div className="md:col-span-2 space-y-3">
                        <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest ml-1">Professional Summary</label>
                        <div className="rounded-2xl overflow-hidden border border-slate-200 shadow-inner">
                          <ReactQuill
                            theme="snow"
                            value={profile.profile.summary}
                            onChange={val => setProfile({ ...profile, profile: { ...profile.profile, summary: val } })}
                            placeholder="Briefly describe your professional background and goals..."
                            className="bg-white"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {activeSection === 'experience' && (
                  <div className="space-y-12">
                    <div className="flex justify-between items-center gap-4">
                      <h2 className="text-3xl font-bold text-slate-900 uppercase tracking-tight">Employment History</h2>
                      <button onClick={addExperience} className="px-6 py-2.5 bg-slate-900 text-white rounded-xl font-bold text-[10px] uppercase tracking-wider hover:bg-slate-800 transition-all shadow-md">+ Add Record</button>
                    </div>

                    <div className="space-y-8">
                      {profile.profile.experience.map((exp, idx) => (
                        <div key={idx} className="group/item bg-white p-8 rounded-3xl border border-slate-200 shadow-sm hover:shadow-lg transition-all relative overflow-hidden">
                          <button onClick={() => removeItem('experience', idx)} className="absolute top-4 right-4 w-10 h-10 bg-slate-50 text-slate-400 rounded-xl flex items-center justify-center text-xl hover:bg-rose-600 hover:text-white transition-all shadow-sm">✕</button>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                            <div className="space-y-2">
                              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Company Name</label>
                              <input type="text" value={exp.company} onChange={e => updateItem('experience', idx, 'company', e.target.value)} placeholder="Organization Name" className="w-full px-5 py-3 bg-slate-50 border border-slate-100 rounded-xl text-lg font-bold text-slate-900 outline-none focus:bg-white focus:border-indigo-400 transition-all" />
                            </div>
                            <div className="space-y-2">
                              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Role / Position</label>
                              <input type="text" value={exp.position} onChange={e => updateItem('experience', idx, 'position', e.target.value)} placeholder="e.g. Lead Developer" className="w-full px-5 py-3 bg-slate-50 border border-slate-100 rounded-xl text-lg font-bold text-slate-900 outline-none focus:bg-white focus:border-indigo-400 transition-all" />
                            </div>
                          </div>
                          <div className="flex flex-wrap gap-6 items-center mb-8 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                            <div className="flex gap-4">
                              <input type="date" value={exp.startDate ? exp.startDate.split('T')[0] : ''} onChange={e => updateItem('experience', idx, 'startDate', e.target.value)} className="px-4 py-2 bg-white border border-slate-200 rounded-lg text-xs font-bold outline-none" />
                              <span className="text-slate-300 self-center">to</span>
                              {!exp.current && <input type="date" value={exp.endDate ? exp.endDate.split('T')[0] : ''} onChange={e => updateItem('experience', idx, 'endDate', e.target.value)} className="px-4 py-2 bg-white border border-slate-200 rounded-lg text-xs font-bold outline-none" />}
                            </div>
                            <div className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-lg cursor-pointer" onClick={() => updateItem('experience', idx, 'current', !exp.current)}>
                              <div className={`w-8 h-4 rounded-full p-1 transition-all flex ${exp.current ? 'bg-indigo-600' : 'bg-slate-200'}`}>
                                <div className={`w-2 h-2 rounded-full bg-white transition-all ${exp.current ? 'translate-x-4' : ''}`} />
                              </div>
                              <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Current Role</span>
                            </div>
                          </div>
                          <div className="space-y-2">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Responsibilities & Achievements</label>
                            <div className="rounded-xl overflow-hidden border border-slate-100">
                              <ReactQuill
                                theme="snow"
                                value={exp.description}
                                onChange={val => updateItem('experience', idx, 'description', val)}
                                placeholder="Detail your contributions and key results..."
                                className="bg-white"
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                      {profile.profile.experience.length === 0 && (
                        <div className="py-20 text-center opacity-20 grayscale scale-150">💼</div>
                      )}
                    </div>
                  </div>
                )}

                {activeSection === 'education' && (
                  <div className="space-y-12">
                    <div className="flex justify-between items-center gap-4">
                      <h2 className="text-3xl font-bold text-slate-900 uppercase tracking-tight">Academic History</h2>
                      <button onClick={addEducation} className="px-6 py-2.5 bg-slate-900 text-white rounded-xl font-bold text-[10px] uppercase tracking-wider hover:bg-slate-800 transition-all shadow-md">+ Add Record</button>
                    </div>

                    <div className="space-y-8">
                      {profile.profile.education.map((edu, idx) => (
                        <div key={idx} className="group/item bg-white p-8 rounded-3xl border border-slate-200 shadow-sm hover:shadow-lg transition-all relative overflow-hidden">
                          <button onClick={() => removeItem('education', idx)} className="absolute top-4 right-4 w-10 h-10 bg-slate-50 text-slate-400 rounded-xl flex items-center justify-center text-xl hover:bg-rose-600 hover:text-white transition-all shadow-sm">✕</button>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                            <div className="space-y-2">
                              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Institution</label>
                              <input type="text" value={edu.institution} onChange={e => updateItem('education', idx, 'institution', e.target.value)} placeholder="University / School Name" className="w-full px-5 py-3 bg-slate-50 border border-slate-100 rounded-xl text-lg font-bold text-slate-900 outline-none focus:bg-white focus:border-indigo-400 transition-all" />
                            </div>
                            <div className="space-y-2">
                              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Degree / Certification</label>
                              <input type="text" value={edu.degree} onChange={e => updateItem('education', idx, 'degree', e.target.value)} placeholder="e.g. Bachelor of Science" className="w-full px-5 py-3 bg-slate-50 border border-slate-100 rounded-xl text-lg font-bold text-slate-900 outline-none focus:bg-white focus:border-indigo-400 transition-all" />
                            </div>
                            <div className="space-y-2">
                              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Field of Study</label>
                              <input type="text" value={edu.field} onChange={e => updateItem('education', idx, 'field', e.target.value)} placeholder="e.g. Computer Science" className="w-full px-5 py-3 bg-slate-50 border border-slate-100 rounded-xl text-lg font-bold text-slate-900 outline-none focus:bg-white focus:border-indigo-400 transition-all" />
                            </div>
                          </div>
                          <div className="flex flex-wrap gap-6 items-center bg-slate-50 p-4 rounded-2xl border border-slate-100">
                            <div className="flex gap-4">
                              <input type="date" value={edu.startDate ? edu.startDate.split('T')[0] : ''} onChange={e => updateItem('education', idx, 'startDate', e.target.value)} className="px-4 py-2 bg-white border border-slate-200 rounded-lg text-xs font-bold outline-none" />
                              <span className="text-slate-300 self-center">to</span>
                              {!edu.current && <input type="date" value={edu.endDate ? edu.endDate.split('T')[0] : ''} onChange={e => updateItem('education', idx, 'endDate', e.target.value)} className="px-4 py-2 bg-white border border-slate-200 rounded-lg text-xs font-bold outline-none" />}
                            </div>
                            <div className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-lg cursor-pointer" onClick={() => updateItem('education', idx, 'current', !edu.current)}>
                              <div className={`w-8 h-4 rounded-full p-1 transition-all flex ${edu.current ? 'bg-indigo-600' : 'bg-slate-200'}`}>
                                <div className={`w-2 h-2 rounded-full bg-white transition-all ${edu.current ? 'translate-x-4' : ''}`} />
                              </div>
                              <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Currently Enrolled</span>
                            </div>
                          </div>
                        </div>
                      ))}
                      {profile.profile.education.length === 0 && (
                        <div className="py-20 text-center opacity-20 grayscale scale-150">🎓</div>
                      )}
                    </div>
                  </div>
                )}

                {activeSection === 'projects' && (
                  <div className="space-y-12">
                    <div className="flex justify-between items-center gap-4">
                      <h2 className="text-3xl font-bold text-slate-900 uppercase tracking-tight">Key Projects</h2>
                      <button onClick={addProject} className="px-6 py-2.5 bg-slate-900 text-white rounded-xl font-bold text-[10px] uppercase tracking-wider hover:bg-slate-800 transition-all shadow-md">+ Add Record</button>
                    </div>

                    <div className="space-y-8">
                      {profile.profile.projects.map((proj, idx) => (
                        <div key={idx} className="group/item bg-white p-8 rounded-3xl border border-slate-200 shadow-sm hover:shadow-lg transition-all relative overflow-hidden">
                          <button onClick={() => removeItem('projects', idx)} className="absolute top-4 right-4 w-10 h-10 bg-slate-50 text-slate-400 rounded-xl flex items-center justify-center text-xl hover:bg-rose-600 hover:text-white transition-all shadow-sm">✕</button>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                            <div className="space-y-2">
                              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Project Name</label>
                              <input type="text" value={proj.name} onChange={e => updateItem('projects', idx, 'name', e.target.value)} placeholder="Project Title" className="w-full px-5 py-3 bg-slate-50 border border-slate-100 rounded-xl text-lg font-bold text-slate-900 outline-none focus:bg-white focus:border-indigo-400 transition-all" />
                            </div>
                            <div className="space-y-2">
                              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Project URL</label>
                              <input type="text" value={proj.url} onChange={e => updateItem('projects', idx, 'url', e.target.value)} placeholder="https://github.com/..." className="w-full px-5 py-3 bg-slate-50 border border-slate-100 rounded-xl text-lg font-bold text-slate-900 outline-none focus:bg-white focus:border-indigo-400 transition-all" />
                            </div>
                          </div>
                          <div className="flex flex-wrap gap-4 mb-8 bg-slate-50 p-4 rounded-2xl border border-slate-100 items-center">
                            <input type="date" value={proj.startDate ? proj.startDate.split('T')[0] : ''} onChange={e => updateItem('projects', idx, 'startDate', e.target.value)} className="px-4 py-2 bg-white border border-slate-200 rounded-lg text-xs font-bold outline-none" />
                            <span className="text-slate-300">to</span>
                            <input type="date" value={proj.endDate ? proj.endDate.split('T')[0] : ''} onChange={e => updateItem('projects', idx, 'endDate', e.target.value)} className="px-4 py-2 bg-white border border-slate-200 rounded-lg text-xs font-bold outline-none" />
                          </div>
                          <div className="space-y-2">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Project Description</label>
                            <div className="rounded-xl overflow-hidden border border-slate-100">
                              <ReactQuill
                                theme="snow"
                                value={proj.description}
                                onChange={val => updateItem('projects', idx, 'description', val)}
                                placeholder="Summarize your work and the project's impact..."
                                className="bg-white"
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                      {profile.profile.projects.length === 0 && (
                        <div className="py-20 text-center opacity-20 grayscale scale-150">⚛️</div>
                      )}
                    </div>
                  </div>
                )}

                {activeSection === 'skills' && (
                  <div className="space-y-12">
                    <div className="bg-slate-900 p-10 rounded-3xl text-white shadow-xl relative overflow-hidden">
                      <div className="relative z-10 space-y-8">
                        <h2 className="text-3xl font-bold uppercase tracking-tight">Capacities & Skills</h2>
                        <div className="flex gap-4">
                          <input type="text" value={skillInput} onChange={e => setSkillInput(e.target.value)} onKeyPress={e => e.key === 'Enter' && addSkill()} placeholder="e.g. React.js, Strategic Planning..." className="flex-1 bg-white/10 border border-white/10 rounded-xl px-6 py-3.5 text-lg font-bold outline-none focus:bg-white/20 focus:border-indigo-400 transition-all" />
                          <button onClick={() => addSkill()} className="px-8 bg-indigo-600 text-white rounded-xl font-bold text-[11px] uppercase tracking-wider hover:bg-white hover:text-slate-900 transition-all shadow-lg">Add Skill</button>
                        </div>
                      </div>
                      <div className="absolute top-0 right-0 w-48 h-48 bg-indigo-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
                    </div>

                    <div className="bg-slate-50 p-8 rounded-[2rem] border border-slate-200 shadow-inner flex flex-wrap gap-4 min-h-[300px] content-start">
                      {profile.profile.skills.map((s, idx) => (
                        <div key={idx} className="group/tag flex items-center gap-3 bg-white px-5 py-3 rounded-2xl shadow-sm border border-slate-300 hover:border-indigo-600 hover:-translate-y-1 transition-all">
                          <span className="text-sm font-bold text-slate-900 uppercase tracking-tight">{s}</span>
                          <button onClick={() => removeItem('skills', idx)} className="w-6 h-6 rounded-lg bg-slate-100 text-slate-400 hover:bg-rose-600 hover:text-white transition-all text-sm font-bold">×</button>
                        </div>
                      ))}
                      {profile.profile.skills.length === 0 && <div className="w-full flex flex-col items-center justify-center opacity-20 py-20 grayscale">
                        <span className="text-8xl mb-4">🧬</span>
                        <span className="text-lg font-bold uppercase tracking-wider">No skills added yet.</span>
                      </div>}
                    </div>
                  </div>
                )}

                {activeSection === 'achievements' && (
                  <div className="space-y-12">
                    <div className="flex justify-between items-center gap-4">
                      <h2 className="text-3xl font-bold text-slate-900 uppercase tracking-tight">Achievements & Certifications</h2>
                      <button onClick={addAchievement} className="px-6 py-2.5 bg-slate-900 text-white rounded-xl font-bold text-[10px] uppercase tracking-wider hover:bg-slate-800 transition-all shadow-md">+ Add Record</button>
                    </div>

                    <div className="space-y-8">
                      {profile.profile.achievements.map((ach, idx) => (
                        <div key={idx} className="group/item bg-white p-8 rounded-3xl border border-slate-200 shadow-sm hover:shadow-lg transition-all relative">
                          <button onClick={() => removeItem('achievements', idx)} className="absolute top-4 right-4 w-10 h-10 bg-slate-50 text-slate-400 rounded-xl flex items-center justify-center text-xl hover:bg-rose-600 hover:text-white transition-all shadow-sm">✕</button>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                            <div className="space-y-2">
                              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Title</label>
                              <input type="text" value={ach.title} onChange={e => updateItem('achievements', idx, 'title', e.target.value)} placeholder="e.g. AWS Certified Solutions Architect" className="w-full px-5 py-3 bg-slate-50 border border-slate-100 rounded-xl text-lg font-bold text-slate-900 outline-none focus:bg-white focus:border-indigo-400 transition-all" />
                            </div>
                            <div className="space-y-2">
                              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Issuer / Organization</label>
                              <input type="text" value={ach.issuer} onChange={e => updateItem('achievements', idx, 'issuer', e.target.value)} placeholder="e.g. Amazon Web Services" className="w-full px-5 py-3 bg-slate-50 border border-slate-100 rounded-xl text-lg font-bold text-slate-900 outline-none focus:bg-white focus:border-indigo-400 transition-all" />
                            </div>
                            <div className="space-y-2">
                              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Date</label>
                              <input type="date" value={ach.date} onChange={e => updateItem('achievements', idx, 'date', e.target.value)} className="w-full px-5 py-3 bg-slate-50 border border-slate-100 rounded-xl text-sm font-bold text-slate-900 outline-none focus:bg-white focus:border-indigo-400 transition-all" />
                            </div>
                          </div>
                          <div className="space-y-2">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1"> Description </label>
                            <div className="rounded-xl overflow-hidden border border-slate-100">
                              <ReactQuill
                                theme="snow"
                                value={ach.description}
                                onChange={val => updateItem('achievements', idx, 'description', val)}
                                placeholder="Describe the achievement or certification significance..."
                                className="bg-white"
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                      {profile.profile.achievements.length === 0 && (
                        <div className="py-20 text-center opacity-20 grayscale scale-150">🏆</div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

    </Layout>
  );
};

export default Profile;