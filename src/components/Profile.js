import React, { useState, useEffect } from 'react';
import Layout from './Layout';
import api from '../services/api';
import { useToast } from '../context/ToastContext';
import { useCompany } from '../context/CompanyContext';

const Profile = () => {
  const { state: companyState } = useCompany();
  const toast = useToast();

  // Helper function to get full image URL
  const getImageUrl = (url) => {
    if (!url) return '';
    if (url.startsWith('data:')) return url; // Base64 image
    if (url.startsWith('http')) return url; // Absolute URL
    return `http://localhost:5000${url}`; // Relative URL from server
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
  const [localImages, setLocalImages] = useState({
    profilePicture: '',
    coverPhoto: ''
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeSection, setActiveSection] = useState('basic');
  const [skillInput, setSkillInput] = useState('');

  useEffect(() => {
    fetchProfile();
  }, []);

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
      // Set local images for display
      setLocalImages({
        profilePicture: profileData.profilePicture || '',
        coverPhoto: profileData.coverPhoto || ''
      });
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      // Create a clean profile without base64 images
      const cleanProfile = {
        ...profile,
        profile: {
          ...profile.profile,
          profilePicture: profile.profile.profilePicture?.startsWith('data:') ? '' : profile.profile.profilePicture,
          coverPhoto: profile.profile.coverPhoto?.startsWith('data:') ? '' : profile.profile.coverPhoto
        }
      };
      await api.put('/users/profile', cleanProfile);
      toast.success('Profile updated successfully!');
    } catch (error) {
      toast.error('Error updating profile: ' + (error.response?.data?.error || 'Please try again'));
    } finally {
      setSaving(false);
    }
  };

  const addExperience = () => {
    setProfile({
      ...profile,
      profile: {
        ...profile.profile,
        experience: [...profile.profile.experience, {
          company: '',
          position: '',
          startDate: '',
          endDate: '',
          description: '',
          current: false
        }]
      }
    });
  };

  const addEducation = () => {
    setProfile({
      ...profile,
      profile: {
        ...profile.profile,
        education: [...profile.profile.education, {
          institution: '',
          degree: '',
          field: '',
          startDate: '',
          endDate: '',
          current: false
        }]
      }
    });
  };

  const addProject = () => {
    setProfile({
      ...profile,
      profile: {
        ...profile.profile,
        projects: [...profile.profile.projects, {
          name: '',
          description: '',
          technologies: [],
          url: '',
          startDate: '',
          endDate: ''
        }]
      }
    });
  };

  const addSkill = (skill = skillInput) => {
    if (skill && skill.trim() && !profile.profile.skills.includes(skill.trim())) {
      setProfile({
        ...profile,
        profile: {
          ...profile.profile,
          skills: [...profile.profile.skills, skill.trim()]
        }
      });
      setSkillInput('');
    }
  };

  const handleSkillKeyPress = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addSkill();
    }
  };

  const handleFileUpload = async (e, type = 'profile') => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('File size must be less than 5MB');
        return;
      }

      if (!file.type.startsWith('image/')) {
        toast.error('Please select an image file');
        return;
      }

      try {
        // Show preview immediately
        const reader = new FileReader();
        reader.onload = (event) => {
          const fieldName = type === 'cover' ? 'coverPhoto' : 'profilePicture';
          setLocalImages(prev => ({
            ...prev,
            [fieldName]: event.target.result
          }));
        };
        reader.readAsDataURL(file);

        // Upload to server
        const formData = new FormData();
        formData.append(type === 'cover' ? 'coverPhoto' : 'profilePicture', file);

        toast.info(`Uploading ${type === 'cover' ? 'cover photo' : 'profile picture'}...`);

        const response = await api.post('/users/upload-photo', formData, {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        });

        // Update profile with the server URL
        const fieldName = type === 'cover' ? 'coverPhoto' : 'profilePicture';
        const serverUrl = response.data.profile[fieldName];

        setProfile(prev => ({
          ...prev,
          profile: {
            ...prev.profile,
            [fieldName]: serverUrl
          }
        }));

        // Update local images with server URL
        setLocalImages(prev => ({
          ...prev,
          [fieldName]: serverUrl
        }));

        toast.success(`${type === 'cover' ? 'Cover photo' : 'Profile picture'} uploaded successfully!`);
      } catch (error) {
        console.error('Error uploading photo:', error);
        toast.error('Error uploading photo: ' + (error.response?.data?.error || 'Please try again'));
        // Reset the preview on error
        const fieldName = type === 'cover' ? 'coverPhoto' : 'profilePicture';
        setLocalImages(prev => ({
          ...prev,
          [fieldName]: profile.profile[fieldName] || ''
        }));
      }
    }
  };

  const removeItem = (section, index) => {
    setProfile({
      ...profile,
      profile: {
        ...profile.profile,
        [section]: profile.profile[section].filter((_, i) => i !== index)
      }
    });
  };

  const updateItem = (section, index, field, value) => {
    const updatedItems = [...profile.profile[section]];
    updatedItems[index] = { ...updatedItems[index], [field]: value };
    setProfile({
      ...profile,
      profile: {
        ...profile.profile,
        [section]: updatedItems
      }
    });
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center p-24 text-center">
          <div className="w-12 h-12 border-4 border-slate-100 border-t-indigo-600 rounded-full animate-spin mb-4"></div>
          <p className="text-slate-500 text-base font-semibold tracking-tight italic">Gathering your digital footprint...</p>
        </div>
      </Layout>
    );
  }

  const sections = [
    {
      id: 'basic',
      label: 'Core Specs',
      icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
    },
    {
      id: 'experience',
      label: 'Trajectory',
      icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path></svg>
    },
    {
      id: 'education',
      label: 'Foundations',
      icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M22 10v6M2 10l10-5 10 5-10 5z"></path><path d="M6 12v5c3 3 9 3 12 0v-5"></path></svg>
    },
    {
      id: 'projects',
      label: 'Directives',
      icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 2v20M2 12h20"></path><circle cx="12" cy="12" r="10"></circle></svg>
    },
    {
      id: 'skills',
      label: 'Capabilities',
      icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon></svg>
    }
  ];

  const renderBasicInfo = () => (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
      {/* Account Info Stats Card */}
      <div className="bg-slate-900 rounded-[32px] p-8 text-white relative overflow-hidden shadow-2xl shadow-slate-200">
        <div className="absolute top-0 right-0 p-12 opacity-10 scale-150 rotate-12">
          <svg width="120" height="120" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
            <path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2z"></path>
            <circle cx="12" cy="12" r="3"></circle>
          </svg>
        </div>
        <h3 className="text-sm font-black uppercase tracking-[0.2em] text-indigo-400 mb-8 flex items-center gap-3">
          <span className="w-8 h-[2px] bg-indigo-500"></span> System Credentials
        </h3>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 relative z-10">
          <div className="space-y-1">
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Interface ID</p>
            <p className="text-sm font-bold truncate pr-4">{profile.email}</p>
          </div>
          <div className="space-y-1">
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Access Tier</p>
            <p className="text-sm font-bold capitalize text-indigo-300">{profile.role}</p>
          </div>
          <div className="space-y-1">
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Enrolled Since</p>
            <p className="text-sm font-bold">
              {profile.createdAt ? new Date(profile.createdAt).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric'
              }) : 'N/A'}
            </p>
          </div>
          <div className="space-y-1">
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Affiliations</p>
            <p className="text-sm font-bold truncate">
              {companyState.companies.length > 0 ? companyState.companies.map(c => c.name).join(', ') : 'Independent'}
            </p>
          </div>
        </div>
      </div>

      {/* Visual Identity Area */}
      <div className="relative group/cover">
        <div
          className="w-full h-72 rounded-[40px] bg-slate-100 border-4 border-white shadow-xl overflow-hidden relative transition-transform duration-700 hover:scale-[1.01]"
          style={{
            backgroundImage: (localImages.coverPhoto || profile.profile.coverPhoto)
              ? `url(${getImageUrl(localImages.coverPhoto || profile.profile.coverPhoto)})`
              : 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
            backgroundSize: 'cover',
            backgroundPosition: 'center'
          }}
        >
          <div className="absolute inset-0 bg-black/20 opacity-0 group-hover/cover:opacity-100 transition-opacity duration-500 flex items-center justify-center backdrop-blur-[2px]">
            <label htmlFor="cover-upload" className="bg-white/90 text-slate-900 px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest cursor-pointer hover:bg-white transition-all shadow-2xl active:scale-95">
              Refactor Cover Environment
            </label>
          </div>
          <input type="file" accept="image/*" onChange={(e) => handleFileUpload(e, 'cover')} className="hidden" id="cover-upload" />
        </div>

        {/* Avatar Position */}
        <div className="absolute -bottom-16 left-12 group/avatar">
          <div className="relative">
            <div
              className="w-44 h-44 rounded-full border-8 border-white shadow-2xl overflow-hidden bg-slate-200 transition-transform duration-500 group-hover/avatar:rotate-3"
              style={{
                backgroundImage: (localImages.profilePicture || profile.profile.profilePicture)
                  ? `url(${getImageUrl(localImages.profilePicture || profile.profile.profilePicture)})`
                  : 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)',
                backgroundSize: 'cover',
                backgroundPosition: 'center'
              }}
            >
              {!(localImages.profilePicture || profile.profile.profilePicture) && (
                <div className="w-full h-full flex items-center justify-center text-white text-5xl font-black">
                  {profile.name.charAt(0).toUpperCase() || 'U'}
                </div>
              )}
            </div>
            <label htmlFor="profile-upload" className="absolute bottom-2 right-2 bg-indigo-600 border-4 border-white text-white p-3 rounded-full shadow-lg cursor-pointer hover:bg-indigo-700 hover:scale-110 active:scale-90 transition-all">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path>
                <circle cx="12" cy="13" r="4"></circle>
              </svg>
            </label>
            <input type="file" accept="image/*" onChange={(e) => handleFileUpload(e, 'profile')} className="hidden" id="profile-upload" />
          </div>
        </div>
      </div>

      <div className="mt-20 grid grid-cols-1 md:grid-cols-2 gap-8 pt-4">
        <div className="space-y-2">
          <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-2">
            Full Identity Name
          </label>
          <input
            type="text"
            placeholder="Identity Label"
            value={profile.name}
            onChange={(e) => setProfile({ ...profile, name: e.target.value })}
            className="w-full px-6 py-4 bg-white border border-slate-200 rounded-3xl text-sm font-bold text-slate-800 focus:ring-4 focus:ring-indigo-50 focus:border-indigo-500 outline-none transition-all shadow-sm"
          />
        </div>
        <div className="space-y-2">
          <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-2">
            Secure Contact Link
          </label>
          <input
            type="tel"
            placeholder="+0 (000) 000-0000"
            value={profile.profile.phone}
            onChange={(e) => setProfile({ ...profile, profile: { ...profile.profile, phone: e.target.value } })}
            className="w-full px-6 py-4 bg-white border border-slate-200 rounded-3xl text-sm font-bold text-slate-800 focus:ring-4 focus:ring-indigo-50 focus:border-indigo-500 outline-none transition-all shadow-sm"
          />
        </div>
        <div className="space-y-2">
          <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-2">
            Geographic Coordinates
          </label>
          <input
            type="text"
            placeholder="City, System"
            value={profile.profile.location}
            onChange={(e) => setProfile({ ...profile, profile: { ...profile.profile, location: e.target.value } })}
            className="w-full px-6 py-4 bg-white border border-slate-200 rounded-3xl text-sm font-bold text-slate-800 focus:ring-4 focus:ring-indigo-50 focus:border-indigo-500 outline-none transition-all shadow-sm"
          />
        </div>
        <div className="space-y-2">
          <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-2">
            Designatory Role
          </label>
          <input
            type="text"
            placeholder="Operation Title"
            value={profile.profile.title}
            onChange={(e) => setProfile({ ...profile, profile: { ...profile.profile, title: e.target.value } })}
            className="w-full px-6 py-4 bg-white border border-slate-200 rounded-3xl text-sm font-bold text-slate-800 focus:ring-4 focus:ring-indigo-50 focus:border-indigo-500 outline-none transition-all shadow-sm"
          />
        </div>
        <div className="md:col-span-2 space-y-2">
          <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-2">
            Operational Summary & Objectives
          </label>
          <textarea
            placeholder="Tell us about your primary directives..."
            value={profile.profile.summary}
            onChange={(e) => setProfile({ ...profile, profile: { ...profile.profile, summary: e.target.value } })}
            rows="6"
            className="w-full px-6 py-4 bg-white border border-slate-200 rounded-3xl text-sm font-bold text-slate-800 focus:ring-4 focus:ring-indigo-50 focus:border-indigo-500 outline-none transition-all shadow-sm resize-none min-h-[160px]"
          />
        </div>
      </div>
    </div>
  );

  const renderExperience = () => (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h3 className="text-lg font-black text-slate-800">Operational History</h3>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Timeline of engagements</p>
        </div>
        <button
          type="button"
          onClick={addExperience}
          className="px-6 py-3 bg-indigo-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-lg active:scale-95 flex items-center gap-2"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M12 5v14M5 12h14"></path></svg>
          New Engagement
        </button>
      </div>

      <div className="space-y-6">
        {profile.profile.experience.map((exp, index) => (
          <div key={index} className="group bg-white p-8 rounded-[32px] border border-slate-200 shadow-sm hover:shadow-xl hover:border-indigo-100 transition-all relative">
            <button
              type="button"
              onClick={() => removeItem('experience', index)}
              className="absolute top-6 right-6 p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all opacity-0 group-hover:opacity-100"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
            </button>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Company / Organization</label>
                <input
                  type="text"
                  placeholder="Acme Corp"
                  value={exp.company}
                  onChange={(e) => updateItem('experience', index, 'company', e.target.value)}
                  className="w-full px-5 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold text-slate-700 outline-none focus:bg-white focus:border-indigo-400 focus:ring-4 focus:ring-indigo-50 transition-all"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Rank / Position</label>
                <input
                  type="text"
                  placeholder="Lead Specialist"
                  value={exp.position}
                  onChange={(e) => updateItem('experience', index, 'position', e.target.value)}
                  className="w-full px-5 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold text-slate-700 outline-none focus:bg-white focus:border-indigo-400 focus:ring-4 focus:ring-indigo-50 transition-all"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 items-center mb-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Genesis</label>
                <input
                  type="date"
                  value={exp.startDate}
                  onChange={(e) => updateItem('experience', index, 'startDate', e.target.value)}
                  className="w-full px-5 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold text-slate-700 outline-none focus:bg-white focus:border-indigo-400 transition-all"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Terminus</label>
                <input
                  type="date"
                  value={exp.endDate}
                  onChange={(e) => updateItem('experience', index, 'endDate', e.target.value)}
                  disabled={exp.current}
                  className={`w-full px-5 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold text-slate-700 outline-none focus:bg-white focus:border-indigo-400 transition-all ${exp.current ? 'opacity-30 cursor-not-allowed' : ''}`}
                />
              </div>
              <div className="pt-6 flex items-center">
                <label className="flex items-center gap-3 cursor-pointer group/check">
                  <div className="relative">
                    <input
                      type="checkbox"
                      checked={exp.current}
                      onChange={(e) => updateItem('experience', index, 'current', e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-12 h-6 bg-slate-200 rounded-full peer peer-checked:bg-emerald-500 transition-all duration-300"></div>
                    <div className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full peer-checked:translate-x-6 transition-transform duration-300 shadow-sm"></div>
                  </div>
                  <span className="text-xs font-black text-slate-500 uppercase tracking-widest">Active</span>
                </label>
              </div>
            </div>

            <textarea
              placeholder="Primary responsibilities and key deliverables..."
              value={exp.description}
              onChange={(e) => updateItem('experience', index, 'description', e.target.value)}
              rows="4"
              className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold text-slate-600 outline-none focus:bg-white focus:border-indigo-400 transition-all resize-none"
            />
          </div>
        ))}
      </div>

      {profile.profile.experience.length === 0 && (
        <div className="bg-slate-50 rounded-[40px] border-4 border-dashed border-slate-200 p-20 text-center group hover:border-indigo-200 transition-all">
          <div className="text-6xl mb-6 opacity-20 grayscale group-hover:grayscale-0 group-hover:opacity-100 transition-all duration-500">🚀</div>
          <h4 className="text-xl font-black text-slate-400 group-hover:text-slate-600 transition-colors">Orbit Inactive</h4>
          <p className="text-slate-400 font-medium max-w-xs mx-auto mt-2">Initialize your trajectory data to improve your profile authority.</p>
        </div>
      )}
    </div>
  );

  const renderEducation = () => (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h3 className="text-lg font-black text-slate-800">Academic Foundations</h3>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Foundational roots</p>
        </div>
        <button
          type="button"
          onClick={addEducation}
          className="px-6 py-3 bg-indigo-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-lg active:scale-95 flex items-center gap-2"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M12 5v14M5 12h14"></path></svg>
          New Root
        </button>
      </div>

      <div className="space-y-6">
        {profile.profile.education.map((edu, index) => (
          <div key={index} className="group bg-white p-8 rounded-[32px] border border-slate-200 shadow-sm hover:shadow-xl hover:border-indigo-100 transition-all relative">
            <button
              type="button"
              onClick={() => removeItem('education', index)}
              className="absolute top-6 right-6 p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all opacity-0 group-hover:opacity-100"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
            </button>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Institution</label>
                <input
                  type="text"
                  placeholder="Education Center"
                  value={edu.institution}
                  onChange={(e) => updateItem('education', index, 'institution', e.target.value)}
                  className="w-full px-5 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold text-slate-700 outline-none focus:bg-white focus:border-indigo-400 transition-all"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Degree / Certification</label>
                <input
                  type="text"
                  placeholder="Master's in Structural Logic"
                  value={edu.degree}
                  onChange={(e) => updateItem('education', index, 'degree', e.target.value)}
                  className="w-full px-5 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold text-slate-700 outline-none focus:bg-white focus:border-indigo-400 transition-all"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Field of Synthesis</label>
                <input
                  type="text"
                  placeholder="Computational Engineering"
                  value={edu.field}
                  onChange={(e) => updateItem('education', index, 'field', e.target.value)}
                  className="w-full px-5 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold text-slate-700 outline-none focus:bg-white focus:border-indigo-400 transition-all"
                />
              </div>
              <div className="grid grid-cols-2 gap-4 pt-6">
                <div className="space-y-1">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Start Cycle</label>
                  <input
                    type="date"
                    value={edu.startDate}
                    onChange={(e) => updateItem('education', index, 'startDate', e.target.value)}
                    className="w-full px-4 py-2 text-xs bg-slate-50 border border-slate-100 rounded-xl font-bold text-slate-600 outline-none focus:bg-white"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">End Cycle</label>
                  <input
                    type="date"
                    value={edu.endDate}
                    onChange={(e) => updateItem('education', index, 'endDate', e.target.value)}
                    disabled={edu.current}
                    className={`w-full px-4 py-2 text-xs bg-slate-50 border border-slate-100 rounded-xl font-bold text-slate-600 outline-none focus:bg-white ${edu.current ? 'opacity-30' : ''}`}
                  />
                </div>
              </div>
            </div>
            <div className="flex items-center">
              <label className="flex items-center gap-3 cursor-pointer">
                <div className="relative">
                  <input
                    type="checkbox"
                    checked={edu.current}
                    onChange={(e) => updateItem('education', index, 'current', e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-10 h-5 bg-slate-200 rounded-full peer peer-checked:bg-purple-500 transition-all duration-300"></div>
                  <div className="absolute left-[2px] top-[2px] w-4 h-4 bg-white rounded-full peer-checked:translate-x-5 transition-transform duration-300 shadow-sm"></div>
                </div>
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">In Progress</span>
              </label>
            </div>
          </div>
        ))}
      </div>

      {profile.profile.education.length === 0 && (
        <div className="bg-slate-50 rounded-[40px] border-4 border-dashed border-slate-200 p-20 text-center group hover:border-purple-200 transition-all">
          <div className="text-6xl mb-6 opacity-20 grayscale group-hover:grayscale-0 group-hover:opacity-100 transition-all duration-500">🎓</div>
          <h4 className="text-xl font-black text-slate-400 group-hover:text-slate-600 transition-colors">No Education Data</h4>
          <p className="text-slate-400 font-medium max-w-xs mx-auto mt-2">Log your academic milestones to showcase your fundamental expertise.</p>
        </div>
      )}
    </div>
  );

  const renderProjects = () => (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h3 className="text-lg font-black text-slate-800">Operational Directives</h3>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Specific execution artifacts</p>
        </div>
        <button
          type="button"
          onClick={addProject}
          className="px-6 py-3 bg-indigo-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-lg active:scale-95 flex items-center gap-2"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M12 5v14M5 12h14"></path></svg>
          New Directive
        </button>
      </div>

      <div className="space-y-6">
        {profile.profile.projects.map((proj, index) => (
          <div key={index} className="group bg-white p-8 rounded-[32px] border border-slate-200 shadow-sm hover:shadow-xl hover:border-indigo-100 transition-all relative overflow-hidden">
            <div className="absolute top-0 left-0 w-2 h-full bg-indigo-500 opacity-20 group-hover:opacity-100 transition-opacity"></div>
            <button
              type="button"
              onClick={() => removeItem('projects', index)}
              className="absolute top-6 right-6 p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all opacity-0 group-hover:opacity-100"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
            </button>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Directive Label</label>
                <input
                  type="text"
                  placeholder="Project Identity"
                  value={proj.name}
                  onChange={(e) => updateItem('projects', index, 'name', e.target.value)}
                  className="w-full px-5 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold text-slate-700 outline-none focus:bg-white focus:border-indigo-400 transition-all"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Resource Link / Domain</label>
                <div className="relative">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-bold">URL</div>
                  <input
                    type="url"
                    placeholder="https://opus.sh"
                    value={proj.url}
                    onChange={(e) => updateItem('projects', index, 'url', e.target.value)}
                    className="w-full pl-12 pr-5 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold text-slate-700 outline-none focus:bg-white focus:border-indigo-400 transition-all"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-2 mb-6">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Technical Stack Spec</label>
              <input
                type="text"
                placeholder="React, Tailwind, Node (comma separated)"
                value={Array.isArray(proj.technologies) ? proj.technologies.join(', ') : ''}
                onChange={(e) => updateItem('projects', index, 'technologies', e.target.value.split(',').map(s => s.trim()))}
                className="w-full px-5 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold text-indigo-600 outline-none focus:bg-white focus:border-indigo-400 transition-all"
              />
            </div>

            <textarea
              placeholder="Primary objectives, execution strategy, and final outcome..."
              value={proj.description}
              onChange={(e) => updateItem('projects', index, 'description', e.target.value)}
              rows="4"
              className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold text-slate-600 outline-none focus:bg-white focus:border-indigo-400 transition-all resize-none shadow-inner"
            />
          </div>
        ))}
      </div>

      {profile.profile.projects.length === 0 && (
        <div className="bg-slate-50 rounded-[40px] border-4 border-dashed border-slate-200 p-20 text-center group hover:border-indigo-200 transition-all">
          <div className="text-6xl mb-6 opacity-20 grayscale group-hover:grayscale-0 group-hover:opacity-100 transition-all duration-500">⚛️</div>
          <h4 className="text-xl font-black text-slate-400 group-hover:text-slate-600 transition-colors">No Projects</h4>
          <p className="text-slate-400 font-medium max-w-xs mx-auto mt-2">Demonstrate your execution prowess by adding your most impactful project directives.</p>
        </div>
      )}
    </div>
  );

  const renderSkills = () => (
    <div className="space-y-12 animate-in fade-in slide-in-from-bottom-2 duration-500">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h3 className="text-lg font-black text-slate-800">Capability Matrix</h3>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">High-frequency skill nodes</p>
        </div>
      </div>

      <div className="bg-white p-10 rounded-[40px] border border-slate-200 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50 rounded-bl-[100px] opacity-50 -z-10"></div>

        <div className="flex flex-wrap gap-4 mb-10 min-h-[100px] items-center justify-center p-4 border-2 border-dashed border-slate-100 rounded-[32px] bg-slate-50/30">
          {profile.profile.skills.map((skill, index) => (
            <div key={index} className="group bg-white pl-5 pr-3 py-3 rounded-2xl flex items-center gap-3 border border-slate-200 shadow-sm hover:border-indigo-300 hover:shadow-md transition-all animate-in zoom-in duration-300">
              <span className="text-sm font-black text-slate-700">{skill}</span>
              <button
                type="button"
                onClick={() => removeItem('skills', index)}
                className="w-6 h-6 rounded-lg flex items-center justify-center text-slate-300 hover:bg-red-50 hover:text-red-500 transition-all font-bold"
              >
                &times;
              </button>
            </div>
          ))}
          {profile.profile.skills.length === 0 && (
            <p className="text-slate-400 font-bold text-sm italic py-4">Capability matrix offline. Add nodes below.</p>
          )}
        </div>

        <div className="max-w-md mx-auto relative group/input">
          <div className="absolute inset-x-0 -bottom-2 h-1 bg-indigo-600/10 rounded-full blur-lg opacity-0 group-focus-within/input:opacity-100 transition-all"></div>
          <div className="flex gap-3">
            <input
              type="text"
              placeholder="Input new capability node..."
              value={skillInput}
              onChange={(e) => setSkillInput(e.target.value)}
              onKeyPress={handleSkillKeyPress}
              className="flex-1 px-8 py-4 bg-slate-50 border border-slate-200 rounded-[24px] text-sm font-black text-slate-800 outline-none focus:bg-white focus:border-indigo-500 focus:ring-8 focus:ring-indigo-50 transition-all"
            />
            <button
              type="button"
              onClick={() => addSkill()}
              className="px-8 py-3 bg-slate-900 text-white rounded-[24px] font-black text-xs uppercase tracking-widest hover:bg-slate-800 transition-all active:scale-95 shadow-xl"
            >
              Inject
            </button>
          </div>
          <p className="text-center mt-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] leading-relaxed">
            Press ENTER to rapidly inject multiple nodes <br /> into the capability matrix
          </p>
        </div>
      </div>
    </div>
  );

  return (
    <Layout>
      <div className="max-w-[1240px] mx-auto px-6 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          {/* Sidebar Navigation */}
          <div className="lg:col-span-3">
            <div className="sticky top-28 space-y-4 bg-white/50 backdrop-blur-md p-4 rounded-[40px] border border-slate-100 shadow-sm">
              <h2 className="px-6 py-4 text-xs font-black text-slate-400 uppercase tracking-[0.3em] mb-2 leading-tight">
                Identity <br /> Protocol
              </h2>
              {sections.map((section) => (
                <button
                  key={section.id}
                  onClick={() => setActiveSection(section.id)}
                  className={`w-full flex items-center gap-4 px-6 py-4 rounded-[28px] text-sm font-black transition-all duration-300 relative group overflow-hidden ${activeSection === section.id
                      ? 'bg-slate-900 text-white shadow-2xl shadow-slate-300 scale-[1.05] z-10'
                      : 'text-slate-500 hover:bg-white hover:text-slate-900 hover:translate-x-1'
                    }`}
                >
                  <span className={`transition-transform duration-500 ${activeSection === section.id ? 'scale-110 rotate-3' : 'group-hover:rotate-12'}`}>
                    {section.icon}
                  </span>
                  <span className="relative z-10">{section.label}</span>
                  {activeSection === section.id && (
                    <div className="absolute right-4 w-2 h-2 rounded-full bg-indigo-400 animate-pulse"></div>
                  )}
                </button>
              ))}

              <div className="pt-12 px-6">
                <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest leading-relaxed">
                  Privacy Protected <br /> v.2024.0.1
                </p>
              </div>
            </div>
          </div>

          {/* Main Content Area */}
          <div className="lg:col-span-9">
            <form onSubmit={handleSubmit} className="space-y-12">
              <div className="bg-slate-50/50 backdrop-blur-xl p-6 lg:p-12 rounded-[56px] min-h-[800px] border border-white shadow-inner relative overflow-hidden">
                <div className="absolute -top-24 -right-24 w-96 h-96 bg-indigo-100/30 rounded-full blur-[100px] -z-10"></div>
                <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-purple-100/30 rounded-full blur-[100px] -z-10"></div>

                {/* Active Section Content */}
                <div className="relative z-10">
                  {activeSection === 'basic' && renderBasicInfo()}
                  {activeSection === 'experience' && renderExperience()}
                  {activeSection === 'education' && renderEducation()}
                  {activeSection === 'projects' && renderProjects()}
                  {activeSection === 'skills' && renderSkills()}
                </div>
              </div>

              {/* Deployment Action Bar */}
              <div className="flex items-center justify-between bg-white/80 backdrop-blur-md p-6 rounded-[40px] border border-slate-200 shadow-2xl sticky bottom-8 z-50 animate-in slide-in-from-bottom-10 duration-700">
                <div className="flex items-center gap-4 px-4 overflow-hidden">
                  <div className="w-10 h-10 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600 animate-pulse">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-indigo-600 uppercase tracking-widest leading-none">Security: Enabled</p>
                    <p className="text-xs font-bold text-slate-500 mt-1">Updates require deployment sync</p>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={saving}
                  className={`relative group px-12 py-5 rounded-[28px] font-black text-xs uppercase tracking-[0.2em] text-white shadow-2xl transition-all active:scale-95 disabled:grayscale disabled:cursor-wait overflow-hidden ${saving ? 'bg-slate-400' : 'bg-slate-900 hover:bg-indigo-600 hover:shadow-indigo-200'
                    }`}
                >
                  <span className="relative z-10 flex items-center gap-4">
                    {saving ? (
                      <>
                        <div className="w-5 h-5 border-4 border-white/20 border-t-white rounded-full animate-spin"></div>
                        Syncing...
                      </>
                    ) : (
                      <>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path><polyline points="17 21 17 13 7 13 7 21"></polyline><polyline points="7 3 7 8 15 8"></polyline></svg>
                        Commit Updates
                      </>
                    )}
                  </span>
                  <div className="absolute inset-0 bg-gradient-to-r from-indigo-600 to-purple-600 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Profile;