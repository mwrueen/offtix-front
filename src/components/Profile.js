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

  if (loading) return <Layout><div style={{ textAlign: 'center', padding: '50px' }}>Loading profile...</div></Layout>;

  const inputStyle = {
    width: '100%',
    padding: '14px 16px',
    border: '2px solid #e2e8f0',
    borderRadius: '10px',
    fontSize: '14px',
    boxSizing: 'border-box',
    transition: 'all 0.2s',
    fontFamily: 'inherit'
  };

  const labelStyle = {
    marginBottom: '10px',
    fontSize: '14px',
    fontWeight: '700',
    color: '#1e293b',
    display: 'flex',
    alignItems: 'center',
    gap: '6px'
  };

  const sections = [
    {
      id: 'basic',
      label: 'Basic Info',
      icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
    },
    {
      id: 'experience',
      label: 'Experience',
      icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path></svg>
    },
    {
      id: 'education',
      label: 'Education',
      icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 10v6M2 10l10-5 10 5-10 5z"></path><path d="M6 12v5c3 3 9 3 12 0v-5"></path></svg>
    },
    {
      id: 'projects',
      label: 'Projects',
      icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2v20M2 12h20"></path><circle cx="12" cy="12" r="10"></circle></svg>
    },
    {
      id: 'skills',
      label: 'Skills',
      icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon></svg>
    }
  ];

  const renderBasicInfo = () => (
    <div>
      {/* Account Information Card */}
      <div style={{
        background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
        borderRadius: '12px',
        padding: '20px',
        marginBottom: '24px',
        border: '1px solid #cbd5e1'
      }}>
        <h3 style={{
          margin: '0 0 16px 0',
          fontSize: '16px',
          fontWeight: '700',
          color: '#1e293b',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2z"></path>
            <path d="M12 6v6l4 2"></path>
          </svg>
          Account Information
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          <div>
            <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '4px', fontWeight: '600' }}>Email Address</div>
            <div style={{ fontSize: '14px', color: '#1e293b', fontWeight: '500' }}>{profile.email}</div>
          </div>
          <div>
            <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '4px', fontWeight: '600' }}>Account Type</div>
            <div style={{
              fontSize: '14px',
              color: '#1e293b',
              fontWeight: '500',
              textTransform: 'capitalize'
            }}>
              {profile.role}
            </div>
          </div>
          <div>
            <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '4px', fontWeight: '600' }}>Member Since</div>
            <div style={{ fontSize: '14px', color: '#1e293b', fontWeight: '500' }}>
              {profile.createdAt ? new Date(profile.createdAt).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              }) : 'N/A'}
            </div>
          </div>
          {companyState.companies.length > 0 && (
            <div>
              <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '4px', fontWeight: '600' }}>Companies</div>
              <div style={{ fontSize: '14px', color: '#1e293b', fontWeight: '500' }}>
                {companyState.companies.map(c => c.name).join(', ')}
              </div>
            </div>
          )}
        </div>
      </div>

      <div style={{ position: 'relative', marginBottom: '60px' }}>
        <div style={{
          width: '100%',
          height: '240px',
          borderRadius: '16px',
          backgroundColor: '#f8fafc',
          backgroundImage: (localImages.coverPhoto || profile.profile.coverPhoto) ? `url(${getImageUrl(localImages.coverPhoto || profile.profile.coverPhoto)})` : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          position: 'relative',
          overflow: 'hidden',
          border: '1px solid #e2e8f0',
          boxShadow: '0 4px 12px rgba(0,0,0,0.08)'
        }}>
          {!(localImages.coverPhoto || profile.profile.coverPhoto) && (
            <div style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'rgba(255,255,255,0.9)',
              fontSize: '16px',
              fontWeight: '600'
            }}>
              Click to add cover photo
            </div>
          )}
          <input
            type="file"
            accept="image/*"
            onChange={(e) => handleFileUpload(e, 'cover')}
            style={{ display: 'none' }}
            id="cover-upload"
          />
          <label
            htmlFor="cover-upload"
            style={{
              position: 'absolute',
              inset: 0,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'flex-end',
              justifyContent: 'flex-end',
              padding: '16px'
            }}
          >
            <div style={{
              backgroundColor: 'rgba(0,0,0,0.75)',
              color: 'white',
              borderRadius: '10px',
              padding: '10px 16px',
              fontSize: '13px',
              fontWeight: '600',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255,255,255,0.1)'
            }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path>
                <circle cx="12" cy="13" r="4"></circle>
              </svg>
              Change Cover
            </div>
          </label>
        </div>
        
        <div style={{
          position: 'absolute',
          bottom: '-40px',
          left: '32px',
          zIndex: 2
        }}>
          <div style={{ position: 'relative' }}>
            <div style={{
              width: '140px',
              height: '140px',
              borderRadius: '50%',
              backgroundColor: '#ffffff',
              backgroundImage: (localImages.profilePicture || profile.profile.profilePicture) ? `url(${getImageUrl(localImages.profilePicture || profile.profile.profilePicture)})` : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              border: '5px solid white',
              boxShadow: '0 10px 30px rgba(0,0,0,0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '48px',
              color: 'white',
              fontWeight: '700'
            }}>
              {!(localImages.profilePicture || profile.profile.profilePicture) && (profile.name.charAt(0).toUpperCase() || 'U')}
            </div>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => handleFileUpload(e, 'profile')}
              style={{ display: 'none' }}
              id="profile-upload"
            />
            <label
              htmlFor="profile-upload"
              style={{
                position: 'absolute',
                bottom: '8px',
                right: '8px',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                color: 'white',
                borderRadius: '50%',
                width: '40px',
                height: '40px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                border: '3px solid white',
                boxShadow: '0 4px 12px rgba(102, 126, 234, 0.4)',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'scale(1.1)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'scale(1)';
              }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path>
                <circle cx="12" cy="13" r="4"></circle>
              </svg>
            </label>
          </div>
        </div>
      </div>
      
      <div style={{ display: 'grid', gap: '24px', marginTop: '20px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
          <div>
            <label style={labelStyle}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                <circle cx="12" cy="7" r="4"></circle>
              </svg>
              Full Name
            </label>
            <input
              type="text"
              placeholder="Enter your full name"
              value={profile.name}
              onChange={(e) => setProfile({...profile, name: e.target.value})}
              style={inputStyle}
              onFocus={(e) => e.target.style.borderColor = '#667eea'}
              onBlur={(e) => e.target.style.borderColor = '#e2e8f0'}
            />
          </div>
          <div>
            <label style={labelStyle}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
              </svg>
              Phone
            </label>
            <input
              type="tel"
              placeholder="+1 (555) 123-4567"
              value={profile.profile.phone}
              onChange={(e) => setProfile({...profile, profile: {...profile.profile, phone: e.target.value}})}
              style={inputStyle}
              onFocus={(e) => e.target.style.borderColor = '#667eea'}
              onBlur={(e) => e.target.style.borderColor = '#e2e8f0'}
            />
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
          <div>
            <label style={labelStyle}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                <circle cx="12" cy="10" r="3"></circle>
              </svg>
              Location
            </label>
            <input
              type="text"
              placeholder="City, Country"
              value={profile.profile.location}
              onChange={(e) => setProfile({...profile, profile: {...profile.profile, location: e.target.value}})}
              style={inputStyle}
              onFocus={(e) => e.target.style.borderColor = '#667eea'}
              onBlur={(e) => e.target.style.borderColor = '#e2e8f0'}
            />
          </div>
          <div>
            <label style={labelStyle}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect>
                <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path>
              </svg>
              Job Title
            </label>
            <input
              type="text"
              placeholder="Software Engineer, Designer, etc."
              value={profile.profile.title}
              onChange={(e) => setProfile({...profile, profile: {...profile.profile, title: e.target.value}})}
              style={inputStyle}
              onFocus={(e) => e.target.style.borderColor = '#667eea'}
              onBlur={(e) => e.target.style.borderColor = '#e2e8f0'}
            />
          </div>
        </div>

        <div>
          <label style={labelStyle}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
              <polyline points="14 2 14 8 20 8"></polyline>
              <line x1="16" y1="13" x2="8" y2="13"></line>
              <line x1="16" y1="17" x2="8" y2="17"></line>
              <polyline points="10 9 9 9 8 9"></polyline>
            </svg>
            Professional Summary
          </label>
          <textarea
            placeholder="Tell us about yourself, your experience, and what makes you unique..."
            value={profile.profile.summary}
            onChange={(e) => setProfile({...profile, profile: {...profile.profile, summary: e.target.value}})}
            rows="5"
            style={{
              ...inputStyle,
              resize: 'vertical',
              minHeight: '120px'
            }}
            onFocus={(e) => e.target.style.borderColor = '#667eea'}
            onBlur={(e) => e.target.style.borderColor = '#e2e8f0'}
          />
        </div>
      </div>
    </div>
  );

  const renderExperience = () => (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '600', color: '#1e293b' }}>Work Experience</h3>
        <button
          type="button"
          onClick={addExperience}
          style={{
            padding: '8px 16px',
            backgroundColor: '#3b82f6',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '14px'
          }}
        >
          + Add Experience
        </button>
      </div>
      
      {profile.profile.experience.map((exp, index) => (
        <div key={index} style={{
          padding: '20px',
          backgroundColor: '#f8fafc',
          borderRadius: '8px',
          marginBottom: '16px',
          border: '1px solid #e2e8f0'
        }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
            <input
              type="text"
              placeholder="Company Name"
              value={exp.company}
              onChange={(e) => updateItem('experience', index, 'company', e.target.value)}
              style={{
                padding: '10px 12px',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                fontSize: '14px'
              }}
            />
            <input
              type="text"
              placeholder="Job Title"
              value={exp.position}
              onChange={(e) => updateItem('experience', index, 'position', e.target.value)}
              style={{
                padding: '10px 12px',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                fontSize: '14px'
              }}
            />
          </div>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto auto', gap: '16px', marginBottom: '16px' }}>
            <input
              type="date"
              value={exp.startDate}
              onChange={(e) => updateItem('experience', index, 'startDate', e.target.value)}
              style={{
                padding: '10px 12px',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                fontSize: '14px'
              }}
            />
            <input
              type="date"
              value={exp.endDate}
              onChange={(e) => updateItem('experience', index, 'endDate', e.target.value)}
              disabled={exp.current}
              style={{
                padding: '10px 12px',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                fontSize: '14px',
                opacity: exp.current ? 0.5 : 1
              }}
            />
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px' }}>
              <input
                type="checkbox"
                checked={exp.current}
                onChange={(e) => updateItem('experience', index, 'current', e.target.checked)}
              />
              Current
            </label>
            <button
              type="button"
              onClick={() => removeItem('experience', index)}
              style={{
                padding: '8px',
                backgroundColor: '#ef4444',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '12px'
              }}
            >
              Remove
            </button>
          </div>
          
          <textarea
            placeholder="Describe your responsibilities and achievements..."
            value={exp.description}
            onChange={(e) => updateItem('experience', index, 'description', e.target.value)}
            rows="3"
            style={{
              width: '100%',
              padding: '10px 12px',
              border: '1px solid #d1d5db',
              borderRadius: '6px',
              fontSize: '14px',
              boxSizing: 'border-box',
              resize: 'vertical',
              fontFamily: 'inherit'
            }}
          />
        </div>
      ))}
      
      {profile.profile.experience.length === 0 && (
        <div style={{
          textAlign: 'center',
          padding: '40px',
          color: '#64748b',
          backgroundColor: '#f8fafc',
          borderRadius: '8px',
          border: '2px dashed #cbd5e1'
        }}>
          No work experience added yet. Click "Add Experience" to get started.
        </div>
      )}
    </div>
  );

  const renderEducation = () => (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '600', color: '#1e293b' }}>Education</h3>
        <button
          type="button"
          onClick={addEducation}
          style={{
            padding: '8px 16px',
            backgroundColor: '#3b82f6',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '14px'
          }}
        >
          + Add Education
        </button>
      </div>
      
      {profile.profile.education.map((edu, index) => (
        <div key={index} style={{
          padding: '20px',
          backgroundColor: '#f8fafc',
          borderRadius: '8px',
          marginBottom: '16px',
          border: '1px solid #e2e8f0'
        }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
            <input
              type="text"
              placeholder="Institution Name"
              value={edu.institution}
              onChange={(e) => updateItem('education', index, 'institution', e.target.value)}
              style={{
                padding: '10px 12px',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                fontSize: '14px'
              }}
            />
            <input
              type="text"
              placeholder="Degree"
              value={edu.degree}
              onChange={(e) => updateItem('education', index, 'degree', e.target.value)}
              style={{
                padding: '10px 12px',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                fontSize: '14px'
              }}
            />
          </div>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr auto auto', gap: '16px' }}>
            <input
              type="text"
              placeholder="Field of Study"
              value={edu.field}
              onChange={(e) => updateItem('education', index, 'field', e.target.value)}
              style={{
                padding: '10px 12px',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                fontSize: '14px'
              }}
            />
            <input
              type="date"
              value={edu.startDate}
              onChange={(e) => updateItem('education', index, 'startDate', e.target.value)}
              style={{
                padding: '10px 12px',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                fontSize: '14px'
              }}
            />
            <input
              type="date"
              value={edu.endDate}
              onChange={(e) => updateItem('education', index, 'endDate', e.target.value)}
              disabled={edu.current}
              style={{
                padding: '10px 12px',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                fontSize: '14px',
                opacity: edu.current ? 0.5 : 1
              }}
            />
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px' }}>
              <input
                type="checkbox"
                checked={edu.current}
                onChange={(e) => updateItem('education', index, 'current', e.target.checked)}
              />
              Current
            </label>
            <button
              type="button"
              onClick={() => removeItem('education', index)}
              style={{
                padding: '8px',
                backgroundColor: '#ef4444',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '12px'
              }}
            >
              Remove
            </button>
          </div>
        </div>
      ))}
      
      {profile.profile.education.length === 0 && (
        <div style={{
          textAlign: 'center',
          padding: '40px',
          color: '#64748b',
          backgroundColor: '#f8fafc',
          borderRadius: '8px',
          border: '2px dashed #cbd5e1'
        }}>
          No education added yet. Click "Add Education" to get started.
        </div>
      )}
    </div>
  );

  const renderProjects = () => (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '600', color: '#1e293b' }}>Projects</h3>
        <button
          type="button"
          onClick={addProject}
          style={{
            padding: '8px 16px',
            backgroundColor: '#3b82f6',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '14px'
          }}
        >
          + Add Project
        </button>
      </div>
      
      {profile.profile.projects.map((project, index) => (
        <div key={index} style={{
          padding: '20px',
          backgroundColor: '#f8fafc',
          borderRadius: '8px',
          marginBottom: '16px',
          border: '1px solid #e2e8f0'
        }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
            <input
              type="text"
              placeholder="Project Name"
              value={project.name}
              onChange={(e) => updateItem('projects', index, 'name', e.target.value)}
              style={{
                padding: '10px 12px',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                fontSize: '14px'
              }}
            />
            <input
              type="url"
              placeholder="Project URL (optional)"
              value={project.url}
              onChange={(e) => updateItem('projects', index, 'url', e.target.value)}
              style={{
                padding: '10px 12px',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                fontSize: '14px'
              }}
            />
          </div>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: '16px', marginBottom: '16px' }}>
            <input
              type="date"
              value={project.startDate}
              onChange={(e) => updateItem('projects', index, 'startDate', e.target.value)}
              style={{
                padding: '10px 12px',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                fontSize: '14px'
              }}
            />
            <input
              type="date"
              value={project.endDate}
              onChange={(e) => updateItem('projects', index, 'endDate', e.target.value)}
              style={{
                padding: '10px 12px',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                fontSize: '14px'
              }}
            />
            <button
              type="button"
              onClick={() => removeItem('projects', index)}
              style={{
                padding: '8px',
                backgroundColor: '#ef4444',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '12px'
              }}
            >
              Remove
            </button>
          </div>
          
          <textarea
            placeholder="Describe the project, your role, and key achievements..."
            value={project.description}
            onChange={(e) => updateItem('projects', index, 'description', e.target.value)}
            rows="3"
            style={{
              width: '100%',
              padding: '10px 12px',
              border: '1px solid #d1d5db',
              borderRadius: '6px',
              fontSize: '14px',
              boxSizing: 'border-box',
              resize: 'vertical',
              fontFamily: 'inherit',
              marginBottom: '12px'
            }}
          />
          
          <input
            type="text"
            placeholder="Technologies used (comma separated)"
            value={project.technologies.join(', ')}
            onChange={(e) => updateItem('projects', index, 'technologies', e.target.value.split(',').map(t => t.trim()).filter(t => t))}
            style={{
              width: '100%',
              padding: '10px 12px',
              border: '1px solid #d1d5db',
              borderRadius: '6px',
              fontSize: '14px',
              boxSizing: 'border-box'
            }}
          />
        </div>
      ))}
      
      {profile.profile.projects.length === 0 && (
        <div style={{
          textAlign: 'center',
          padding: '40px',
          color: '#64748b',
          backgroundColor: '#f8fafc',
          borderRadius: '8px',
          border: '2px dashed #cbd5e1'
        }}>
          No projects added yet. Click "Add Project" to showcase your work.
        </div>
      )}
    </div>
  );

  const renderSkills = () => (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '600', color: '#1e293b' }}>Skills & Technologies</h3>
        <div style={{ fontSize: '14px', color: '#64748b' }}>
          Press Enter or click Add to include a skill
        </div>
      </div>
      
      <div style={{
        padding: '20px',
        backgroundColor: '#f8fafc',
        borderRadius: '8px',
        border: '1px solid #e2e8f0'
      }}>
        <div style={{
          display: 'flex',
          gap: '8px',
          marginBottom: '16px'
        }}>
          <input
            type="text"
            placeholder="Enter a skill (e.g., JavaScript, React)"
            value={skillInput}
            onChange={(e) => setSkillInput(e.target.value)}
            onKeyPress={handleSkillKeyPress}
            style={{
              flex: 1,
              padding: '8px 12px',
              border: '1px solid #d1d5db',
              borderRadius: '6px',
              fontSize: '14px'
            }}
          />
          <button
            type="button"
            onClick={() => addSkill()}
            disabled={!skillInput.trim()}
            style={{
              padding: '8px 16px',
              backgroundColor: skillInput.trim() ? '#3b82f6' : '#9ca3af',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: skillInput.trim() ? 'pointer' : 'not-allowed',
              fontSize: '14px'
            }}
          >
            Add
          </button>
        </div>
        
        <div style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '8px',
          minHeight: '60px'
        }}>
        {profile.profile.skills.length === 0 ? (
          <div style={{
            width: '100%',
            textAlign: 'center',
            color: '#64748b',
            fontSize: '14px',
            padding: '20px 0'
          }}>
            No skills added yet. Use the input above to add your technical expertise.
          </div>
        ) : (
          profile.profile.skills.map((skill, index) => (
            <span
              key={index}
              style={{
                backgroundColor: '#3b82f6',
                color: 'white',
                padding: '8px 16px',
                borderRadius: '20px',
                fontSize: '14px',
                fontWeight: '500',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              {skill}
              <button
                type="button"
                onClick={() => removeItem('skills', index)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'white',
                  cursor: 'pointer',
                  fontSize: '16px',
                  padding: '0',
                  lineHeight: 1
                }}
              >
                ×
              </button>
            </span>
          ))
        )}
        </div>
      </div>
    </div>
  );

  const renderActiveSection = () => {
    switch (activeSection) {
      case 'basic': return renderBasicInfo();
      case 'experience': return renderExperience();
      case 'education': return renderEducation();
      case 'projects': return renderProjects();
      case 'skills': return renderSkills();
      default: return renderBasicInfo();
    }
  };

  return (
    <Layout>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        {/* Professional Header */}
        <div style={{
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          borderRadius: '16px',
          padding: '32px',
          marginBottom: '24px',
          boxShadow: '0 10px 40px rgba(102, 126, 234, 0.2)',
          color: 'white'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '24px' }}>
            <div style={{
              width: '80px',
              height: '80px',
              borderRadius: '50%',
              backgroundColor: 'rgba(255, 255, 255, 0.2)',
              backgroundImage: (localImages.profilePicture || profile.profile.profilePicture) ? `url(${getImageUrl(localImages.profilePicture || profile.profile.profilePicture)})` : 'none',
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              border: '3px solid rgba(255, 255, 255, 0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '32px',
              fontWeight: '700',
              backdropFilter: 'blur(10px)'
            }}>
              {!(localImages.profilePicture || profile.profile.profilePicture) && (profile.name.charAt(0).toUpperCase() || 'U')}
            </div>
            <div style={{ flex: 1 }}>
              <h1 style={{ margin: '0 0 8px 0', fontSize: '32px', fontWeight: '700' }}>
                {profile.name || 'Your Name'}
              </h1>
              <div style={{ display: 'flex', alignItems: 'center', gap: '20px', fontSize: '15px', opacity: 0.95 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                    <polyline points="22,6 12,13 2,6"></polyline>
                  </svg>
                  {profile.email}
                </div>
                {profile.profile.title && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect>
                      <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path>
                    </svg>
                    {profile.profile.title}
                  </div>
                )}
                {profile.profile.location && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                      <circle cx="12" cy="10" r="3"></circle>
                    </svg>
                    {profile.profile.location}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Statistics Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
            <div style={{
              background: 'rgba(255, 255, 255, 0.15)',
              backdropFilter: 'blur(10px)',
              borderRadius: '12px',
              padding: '16px',
              border: '1px solid rgba(255, 255, 255, 0.2)'
            }}>
              <div style={{ fontSize: '13px', opacity: 0.9, marginBottom: '4px' }}>Experience</div>
              <div style={{ fontSize: '28px', fontWeight: '700' }}>{profile.profile.experience.length}</div>
              <div style={{ fontSize: '12px', opacity: 0.8 }}>Positions</div>
            </div>
            <div style={{
              background: 'rgba(255, 255, 255, 0.15)',
              backdropFilter: 'blur(10px)',
              borderRadius: '12px',
              padding: '16px',
              border: '1px solid rgba(255, 255, 255, 0.2)'
            }}>
              <div style={{ fontSize: '13px', opacity: 0.9, marginBottom: '4px' }}>Education</div>
              <div style={{ fontSize: '28px', fontWeight: '700' }}>{profile.profile.education.length}</div>
              <div style={{ fontSize: '12px', opacity: 0.8 }}>Degrees</div>
            </div>
            <div style={{
              background: 'rgba(255, 255, 255, 0.15)',
              backdropFilter: 'blur(10px)',
              borderRadius: '12px',
              padding: '16px',
              border: '1px solid rgba(255, 255, 255, 0.2)'
            }}>
              <div style={{ fontSize: '13px', opacity: 0.9, marginBottom: '4px' }}>Projects</div>
              <div style={{ fontSize: '28px', fontWeight: '700' }}>{profile.profile.projects.length}</div>
              <div style={{ fontSize: '12px', opacity: 0.8 }}>Completed</div>
            </div>
            <div style={{
              background: 'rgba(255, 255, 255, 0.15)',
              backdropFilter: 'blur(10px)',
              borderRadius: '12px',
              padding: '16px',
              border: '1px solid rgba(255, 255, 255, 0.2)'
            }}>
              <div style={{ fontSize: '13px', opacity: 0.9, marginBottom: '4px' }}>Skills</div>
              <div style={{ fontSize: '28px', fontWeight: '700' }}>{profile.profile.skills.length}</div>
              <div style={{ fontSize: '12px', opacity: 0.8 }}>Technologies</div>
            </div>
            {companyState.companies.length > 0 && (
              <div style={{
                background: 'rgba(255, 255, 255, 0.15)',
                backdropFilter: 'blur(10px)',
                borderRadius: '12px',
                padding: '16px',
                border: '1px solid rgba(255, 255, 255, 0.2)'
              }}>
                <div style={{ fontSize: '13px', opacity: 0.9, marginBottom: '4px' }}>Companies</div>
                <div style={{ fontSize: '28px', fontWeight: '700' }}>{companyState.companies.length}</div>
                <div style={{ fontSize: '12px', opacity: 0.8 }}>Affiliated</div>
              </div>
            )}
          </div>
        </div>

        <div style={{ display: 'flex', gap: '24px' }}>
          <div style={{
            width: '260px',
            backgroundColor: 'white',
            borderRadius: '16px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
            border: '1px solid #e2e8f0',
            padding: '24px',
            height: 'fit-content'
          }}>
            <h3 style={{
              margin: '0 0 20px 0',
              fontSize: '18px',
              fontWeight: '700',
              color: '#1e293b',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="8" y1="6" x2="21" y2="6"></line>
                <line x1="8" y1="12" x2="21" y2="12"></line>
                <line x1="8" y1="18" x2="21" y2="18"></line>
                <line x1="3" y1="6" x2="3.01" y2="6"></line>
                <line x1="3" y1="12" x2="3.01" y2="12"></line>
                <line x1="3" y1="18" x2="3.01" y2="18"></line>
              </svg>
              Profile Sections
            </h3>
            {sections.map((section) => (
              <div
                key={section.id}
                onClick={() => setActiveSection(section.id)}
                style={{
                  padding: '14px 16px',
                  borderRadius: '10px',
                  cursor: 'pointer',
                  marginBottom: '6px',
                  background: activeSection === section.id
                    ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
                    : 'transparent',
                  color: activeSection === section.id ? 'white' : '#475569',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  fontSize: '15px',
                  fontWeight: activeSection === section.id ? '600' : '500',
                  transition: 'all 0.2s',
                  boxShadow: activeSection === section.id ? '0 4px 12px rgba(102, 126, 234, 0.3)' : 'none'
                }}
                onMouseEnter={(e) => {
                  if (activeSection !== section.id) {
                    e.currentTarget.style.backgroundColor = '#f8fafc';
                  }
                }}
                onMouseLeave={(e) => {
                  if (activeSection !== section.id) {
                    e.currentTarget.style.backgroundColor = 'transparent';
                  }
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  {section.icon}
                </div>
                {section.label}
              </div>
            ))}
          </div>

          <div style={{ flex: 1 }}>
            <style>
              {`
                @keyframes spin {
                  from { transform: rotate(0deg); }
                  to { transform: rotate(360deg); }
                }
              `}
            </style>
            <form onSubmit={handleSubmit}>
              <div style={{
                backgroundColor: 'white',
                borderRadius: '16px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                border: '1px solid #e2e8f0',
                padding: '36px',
                marginBottom: '24px'
              }}>
                {renderActiveSection()}
              </div>

              <div style={{
                display: 'flex',
                justifyContent: 'flex-end',
                gap: '12px'
              }}>
                <button
                  type="submit"
                  disabled={saving}
                  style={{
                    padding: '14px 32px',
                    background: saving ? '#9ca3af' : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '12px',
                    cursor: saving ? 'not-allowed' : 'pointer',
                    fontWeight: '700',
                    fontSize: '15px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    boxShadow: saving ? 'none' : '0 4px 12px rgba(102, 126, 234, 0.4)',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => {
                    if (!saving) {
                      e.currentTarget.style.transform = 'translateY(-2px)';
                      e.currentTarget.style.boxShadow = '0 6px 16px rgba(102, 126, 234, 0.5)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!saving) {
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = '0 4px 12px rgba(102, 126, 234, 0.4)';
                    }
                  }}
                >
                  {saving ? (
                    <>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ animation: 'spin 1s linear infinite' }}>
                        <line x1="12" y1="2" x2="12" y2="6"></line>
                        <line x1="12" y1="18" x2="12" y2="22"></line>
                        <line x1="4.93" y1="4.93" x2="7.76" y2="7.76"></line>
                        <line x1="16.24" y1="16.24" x2="19.07" y2="19.07"></line>
                        <line x1="2" y1="12" x2="6" y2="12"></line>
                        <line x1="18" y1="12" x2="22" y2="12"></line>
                        <line x1="4.93" y1="19.07" x2="7.76" y2="16.24"></line>
                        <line x1="16.24" y1="7.76" x2="19.07" y2="4.93"></line>
                      </svg>
                      Saving...
                    </>
                  ) : (
                    <>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path>
                        <polyline points="17 21 17 13 7 13 7 21"></polyline>
                        <polyline points="7 3 7 8 15 8"></polyline>
                      </svg>
                      Save Profile
                    </>
                  )}
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