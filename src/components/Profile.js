import React, { useState, useEffect } from 'react';
import Layout from './Layout';
import api from '../services/api';
import { useToast } from '../context/ToastContext';

const Profile = () => {
  const [profile, setProfile] = useState({
    name: '',
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
  const toast = useToast();

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const response = await api.get('/users/profile');
      const profileData = response.data.profile || {};
      setProfile({
        name: response.data.name,
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

  const handleFileUpload = (e, type = 'profile') => {
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
      
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          
          const maxSize = type === 'cover' ? 800 : 400;
          let { width, height } = img;
          
          if (type === 'cover') {
            if (width > maxSize) {
              height = (height * maxSize) / width;
              width = maxSize;
            }
          } else {
            if (width > height) {
              if (width > maxSize) {
                height = (height * maxSize) / width;
                width = maxSize;
              }
            } else {
              if (height > maxSize) {
                width = (width * maxSize) / height;
                height = maxSize;
              }
            }
          }
          
          canvas.width = width;
          canvas.height = height;
          ctx.drawImage(img, 0, 0, width, height);
          
          const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.8);
          const fieldName = type === 'cover' ? 'coverPhoto' : 'profilePicture';
          
          // Store base64 locally for immediate display
          setLocalImages(prev => ({
            ...prev,
            [fieldName]: compressedDataUrl
          }));
          
          toast.success(`${type === 'cover' ? 'Cover photo' : 'Profile picture'} updated! Remember to save your profile.`);
        };
        img.src = e.target.result;
      };
      reader.readAsDataURL(file);
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
    padding: '12px 16px',
    border: '1px solid #d1d5db',
    borderRadius: '8px',
    fontSize: '14px',
    boxSizing: 'border-box'
  };

  const sections = [
    { id: 'basic', label: 'Basic Info', icon: '👤' },
    { id: 'experience', label: 'Experience', icon: '💼' },
    { id: 'education', label: 'Education', icon: '🎓' },
    { id: 'projects', label: 'Projects', icon: '🚀' },
    { id: 'skills', label: 'Skills', icon: '⚡' }
  ];

  const renderBasicInfo = () => (
    <div>
      <div style={{ position: 'relative', marginBottom: '60px' }}>
        <div style={{
          width: '100%',
          height: '240px',
          borderRadius: '16px',
          backgroundColor: '#f8fafc',
          backgroundImage: (localImages.coverPhoto || profile.profile.coverPhoto) ? `url(${localImages.coverPhoto || profile.profile.coverPhoto})` : 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          position: 'relative',
          overflow: 'hidden',
          border: '1px solid #e2e8f0'
        }}>
          {!(localImages.coverPhoto || profile.profile.coverPhoto) && (
            <div style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'rgba(255,255,255,0.7)',
              fontSize: '16px',
              fontWeight: '500'
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
              backgroundColor: 'rgba(0,0,0,0.7)',
              color: 'white',
              borderRadius: '8px',
              padding: '8px 12px',
              fontSize: '12px',
              fontWeight: '500',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}>
              📷 Change Cover
            </div>
          </label>
        </div>
        
        <div style={{
          position: 'absolute',
          bottom: '-30px',
          left: '32px',
          zIndex: 2
        }}>
          <div style={{ position: 'relative' }}>
            <div style={{
              width: '120px',
              height: '120px',
              borderRadius: '50%',
              backgroundColor: '#ffffff',
              backgroundImage: (localImages.profilePicture || profile.profile.profilePicture) ? `url(${localImages.profilePicture || profile.profile.profilePicture})` : 'none',
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              border: '4px solid white',
              boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '36px',
              color: '#64748b',
              fontWeight: '600'
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
                bottom: '4px',
                right: '4px',
                backgroundColor: '#3b82f6',
                color: 'white',
                borderRadius: '50%',
                width: '32px',
                height: '32px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                border: '2px solid white',
                boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                fontSize: '14px'
              }}
            >
              📷
            </label>
          </div>
        </div>
      </div>
      
      <div style={{ display: 'grid', gap: '20px', marginTop: '20px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '600', color: '#374151' }}>Full Name</label>
            <input
              type="text"
              placeholder="Enter your full name"
              value={profile.name}
              onChange={(e) => setProfile({...profile, name: e.target.value})}
              style={inputStyle}
            />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '600', color: '#374151' }}>Phone</label>
            <input
              type="tel"
              placeholder="+1 (555) 123-4567"
              value={profile.profile.phone}
              onChange={(e) => setProfile({...profile, profile: {...profile.profile, phone: e.target.value}})}
              style={inputStyle}
            />
          </div>
        </div>
        
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '600', color: '#374151' }}>Location</label>
            <input
              type="text"
              placeholder="City, Country"
              value={profile.profile.location}
              onChange={(e) => setProfile({...profile, profile: {...profile.profile, location: e.target.value}})}
              style={inputStyle}
            />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '600', color: '#374151' }}>Job Title</label>
            <input
              type="text"
              placeholder="Software Engineer, Designer, etc."
              value={profile.profile.title}
              onChange={(e) => setProfile({...profile, profile: {...profile.profile, title: e.target.value}})}
              style={inputStyle}
            />
          </div>
        </div>
        
        <div>
          <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '600', color: '#374151' }}>Professional Summary</label>
          <textarea
            placeholder="Tell us about yourself, your experience, and what makes you unique..."
            value={profile.profile.summary}
            onChange={(e) => setProfile({...profile, profile: {...profile.profile, summary: e.target.value}})}
            rows="4"
            style={{
              width: '100%',
              padding: '12px 16px',
              border: '1px solid #d1d5db',
              borderRadius: '8px',
              fontSize: '14px',
              boxSizing: 'border-box',
              resize: 'vertical',
              fontFamily: 'inherit'
            }}
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
      <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '30px'
        }}>
          <div>
            <h2 style={{ margin: '0 0 5px 0', color: '#1e293b', fontSize: '24px' }}>My Profile</h2>
            <p style={{ margin: 0, color: '#64748b' }}>Build your professional profile and showcase your experience</p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '24px' }}>
          <div style={{
            width: '240px',
            backgroundColor: 'white',
            borderRadius: '12px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
            border: '1px solid #e2e8f0',
            padding: '20px',
            height: 'fit-content'
          }}>
            <h3 style={{ margin: '0 0 16px 0', fontSize: '16px', fontWeight: '600', color: '#1e293b' }}>Sections</h3>
            {sections.map((section) => (
              <div
                key={section.id}
                onClick={() => setActiveSection(section.id)}
                style={{
                  padding: '12px 16px',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  marginBottom: '4px',
                  backgroundColor: activeSection === section.id ? '#3b82f6' : 'transparent',
                  color: activeSection === section.id ? 'white' : '#374151',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  fontSize: '14px',
                  fontWeight: '500',
                  transition: 'all 0.2s'
                }}
              >
                <span style={{ fontSize: '16px' }}>{section.icon}</span>
                {section.label}
              </div>
            ))}
          </div>

          <div style={{ flex: 1 }}>
            <form onSubmit={handleSubmit}>
              <div style={{
                backgroundColor: 'white',
                borderRadius: '12px',
                boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                border: '1px solid #e2e8f0',
                padding: '32px',
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
                    padding: '12px 24px',
                    backgroundColor: saving ? '#9ca3af' : '#3b82f6',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: saving ? 'not-allowed' : 'pointer',
                    fontWeight: '500',
                    fontSize: '14px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}
                >
                  {saving && <span>⏳</span>}
                  {saving ? 'Saving...' : 'Save Profile'}
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