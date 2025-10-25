import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Layout from './Layout';
import { userAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';

const UserDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { state } = useAuth();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (state.user?.role !== 'admin' && state.user?.role !== 'superadmin') {
      navigate('/dashboard');
      return;
    }
    fetchUser();
  }, [id, state.user, navigate]);

  const fetchUser = async () => {
    try {
      const response = await userAPI.getById(id);
      setUser(response.data);
    } catch (error) {
      console.error('Error fetching user:', error);
      navigate('/users');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div style={{ textAlign: 'center', padding: '50px' }}>
          <div style={{ fontSize: '24px', marginBottom: '16px' }}>⏳</div>
          <p>Loading user details...</p>
        </div>
      </Layout>
    );
  }

  if (!user) {
    return (
      <Layout>
        <div style={{ textAlign: 'center', padding: '50px' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>❌</div>
          <h2>User Not Found</h2>
          <button 
            onClick={() => navigate('/users')}
            style={{
              padding: '12px 24px',
              backgroundColor: '#3b82f6',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              marginTop: '16px'
            }}
          >
            Back to Users
          </button>
        </div>
      </Layout>
    );
  }

  const profile = user.profile || {};

  return (
    <Layout>
      <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '30px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <button
              onClick={() => navigate('/users')}
              style={{
                padding: '8px 12px',
                backgroundColor: '#f1f5f9',
                color: '#475569',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '14px'
              }}
            >
              ← Back
            </button>
            <div>
              <h2 style={{ margin: '0 0 5px 0', color: '#1e293b', fontSize: '24px' }}>User Profile</h2>
              <p style={{ margin: 0, color: '#64748b' }}>Detailed view of user information</p>
            </div>
          </div>
        </div>

        {/* Profile Card */}
        <div style={{
          backgroundColor: 'white',
          borderRadius: '12px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
          border: '1px solid #e2e8f0',
          overflow: 'hidden',
          marginBottom: '24px'
        }}>
          {/* Profile Header */}
          <div style={{
            background: profile.coverPhoto ? `url(${profile.coverPhoto})` : 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            padding: '40px 32px',
            color: 'white',
            textAlign: 'center',
            position: 'relative'
          }}>
            {profile.coverPhoto && (
              <div style={{
                position: 'absolute',
                inset: 0,
                backgroundColor: 'rgba(0,0,0,0.4)',
                borderRadius: '12px 12px 0 0'
              }} />
            )}
            <div style={{ position: 'relative', zIndex: 1 }}>
            <div style={{
              width: '120px',
              height: '120px',
              borderRadius: '50%',
              backgroundColor: 'rgba(255,255,255,0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '48px',
              margin: '0 auto 20px',
              backgroundImage: profile.profilePicture ? `url(${profile.profilePicture})` : 'none',
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              border: '4px solid rgba(255,255,255,0.3)'
            }}>
              {!profile.profilePicture && (user.name.charAt(0).toUpperCase() || '👤')}
            </div>
            <h1 style={{ margin: '0 0 8px 0', fontSize: '28px', fontWeight: 'bold' }}>{user.name}</h1>
            <p style={{ margin: '0 0 16px 0', fontSize: '16px', opacity: 0.9 }}>{user.email}</p>
            <div style={{ display: 'flex', justifyContent: 'center', gap: '12px' }}>
              <span style={{
                backgroundColor: user.role === 'superadmin' ? '#ef4444' : 
                               user.role === 'admin' ? '#06b6d4' : '#10b981',
                color: 'white',
                padding: '6px 16px',
                borderRadius: '20px',
                fontSize: '14px',
                fontWeight: 'bold',
                textTransform: 'uppercase'
              }}>
                {user.role}
              </span>
              {profile.title && (
                <span style={{
                  backgroundColor: 'rgba(255,255,255,0.2)',
                  color: 'white',
                  padding: '6px 16px',
                  borderRadius: '20px',
                  fontSize: '14px',
                  fontWeight: '500'
                }}>
                  {profile.title}
                </span>
              )}
            </div>
            </div>
          </div>

          {/* Profile Content */}
          <div style={{ padding: '32px' }}>
            {/* Basic Information */}
            <div style={{ marginBottom: '32px' }}>
              <h3 style={{ margin: '0 0 20px 0', fontSize: '18px', fontWeight: '600', color: '#1e293b', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span>👤</span> Basic Information
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px' }}>
                {profile.phone && (
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#64748b', textTransform: 'uppercase', marginBottom: '4px' }}>Phone</label>
                    <p style={{ margin: 0, fontSize: '14px', color: '#1e293b' }}>{profile.phone}</p>
                  </div>
                )}
                {profile.location && (
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#64748b', textTransform: 'uppercase', marginBottom: '4px' }}>Location</label>
                    <p style={{ margin: 0, fontSize: '14px', color: '#1e293b' }}>{profile.location}</p>
                  </div>
                )}
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#64748b', textTransform: 'uppercase', marginBottom: '4px' }}>Member Since</label>
                  <p style={{ margin: 0, fontSize: '14px', color: '#1e293b' }}>
                    {new Date(user.createdAt).toLocaleDateString('en-US', { 
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric' 
                    })}
                  </p>
                </div>
              </div>
            </div>

            {/* Professional Summary */}
            {profile.summary && (
              <div style={{ marginBottom: '32px' }}>
                <h3 style={{ margin: '0 0 16px 0', fontSize: '18px', fontWeight: '600', color: '#1e293b', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span>📝</span> Professional Summary
                </h3>
                <div style={{
                  padding: '20px',
                  backgroundColor: '#f8fafc',
                  borderRadius: '8px',
                  border: '1px solid #e2e8f0'
                }}>
                  <p style={{ margin: 0, fontSize: '14px', lineHeight: '1.6', color: '#374151' }}>{profile.summary}</p>
                </div>
              </div>
            )}

            {/* Skills */}
            {profile.skills && profile.skills.length > 0 && (
              <div style={{ marginBottom: '32px' }}>
                <h3 style={{ margin: '0 0 16px 0', fontSize: '18px', fontWeight: '600', color: '#1e293b', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span>⚡</span> Skills & Technologies
                </h3>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {profile.skills.map((skill, index) => (
                    <span
                      key={index}
                      style={{
                        backgroundColor: '#3b82f6',
                        color: 'white',
                        padding: '6px 12px',
                        borderRadius: '16px',
                        fontSize: '12px',
                        fontWeight: '500'
                      }}
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Experience */}
            {profile.experience && profile.experience.length > 0 && (
              <div style={{ marginBottom: '32px' }}>
                <h3 style={{ margin: '0 0 20px 0', fontSize: '18px', fontWeight: '600', color: '#1e293b', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span>💼</span> Work Experience
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {profile.experience.map((exp, index) => (
                    <div key={index} style={{
                      padding: '20px',
                      backgroundColor: '#f8fafc',
                      borderRadius: '8px',
                      border: '1px solid #e2e8f0'
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '12px' }}>
                        <div>
                          <h4 style={{ margin: '0 0 4px 0', fontSize: '16px', fontWeight: '600', color: '#1e293b' }}>{exp.position}</h4>
                          <p style={{ margin: '0 0 8px 0', fontSize: '14px', fontWeight: '500', color: '#3b82f6' }}>{exp.company}</p>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <p style={{ margin: 0, fontSize: '12px', color: '#64748b' }}>
                            {exp.startDate && new Date(exp.startDate).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                            {' - '}
                            {exp.current ? 'Present' : (exp.endDate && new Date(exp.endDate).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }))}
                          </p>
                          {exp.current && (
                            <span style={{
                              backgroundColor: '#10b981',
                              color: 'white',
                              padding: '2px 8px',
                              borderRadius: '10px',
                              fontSize: '10px',
                              fontWeight: 'bold'
                            }}>
                              CURRENT
                            </span>
                          )}
                        </div>
                      </div>
                      {exp.description && (
                        <p style={{ margin: 0, fontSize: '14px', lineHeight: '1.5', color: '#374151' }}>{exp.description}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Education */}
            {profile.education && profile.education.length > 0 && (
              <div style={{ marginBottom: '32px' }}>
                <h3 style={{ margin: '0 0 20px 0', fontSize: '18px', fontWeight: '600', color: '#1e293b', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span>🎓</span> Education
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {profile.education.map((edu, index) => (
                    <div key={index} style={{
                      padding: '20px',
                      backgroundColor: '#f8fafc',
                      borderRadius: '8px',
                      border: '1px solid #e2e8f0'
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '8px' }}>
                        <div>
                          <h4 style={{ margin: '0 0 4px 0', fontSize: '16px', fontWeight: '600', color: '#1e293b' }}>{edu.degree}</h4>
                          <p style={{ margin: '0 0 4px 0', fontSize: '14px', fontWeight: '500', color: '#3b82f6' }}>{edu.institution}</p>
                          {edu.field && <p style={{ margin: 0, fontSize: '14px', color: '#64748b' }}>{edu.field}</p>}
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <p style={{ margin: 0, fontSize: '12px', color: '#64748b' }}>
                            {edu.startDate && new Date(edu.startDate).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                            {' - '}
                            {edu.current ? 'Present' : (edu.endDate && new Date(edu.endDate).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }))}
                          </p>
                          {edu.current && (
                            <span style={{
                              backgroundColor: '#10b981',
                              color: 'white',
                              padding: '2px 8px',
                              borderRadius: '10px',
                              fontSize: '10px',
                              fontWeight: 'bold'
                            }}>
                              CURRENT
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Projects */}
            {profile.projects && profile.projects.length > 0 && (
              <div>
                <h3 style={{ margin: '0 0 20px 0', fontSize: '18px', fontWeight: '600', color: '#1e293b', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span>🚀</span> Projects
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '16px' }}>
                  {profile.projects.map((project, index) => (
                    <div key={index} style={{
                      padding: '20px',
                      backgroundColor: '#f8fafc',
                      borderRadius: '8px',
                      border: '1px solid #e2e8f0'
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '12px' }}>
                        <h4 style={{ margin: 0, fontSize: '16px', fontWeight: '600', color: '#1e293b' }}>{project.name}</h4>
                        {project.url && (
                          <a
                            href={project.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{
                              color: '#3b82f6',
                              textDecoration: 'none',
                              fontSize: '14px'
                            }}
                          >
                            🔗
                          </a>
                        )}
                      </div>
                      {project.description && (
                        <p style={{ margin: '0 0 12px 0', fontSize: '14px', lineHeight: '1.5', color: '#374151' }}>{project.description}</p>
                      )}
                      {project.technologies && project.technologies.length > 0 && (
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginBottom: '8px' }}>
                          {project.technologies.map((tech, techIndex) => (
                            <span
                              key={techIndex}
                              style={{
                                backgroundColor: '#e2e8f0',
                                color: '#475569',
                                padding: '2px 8px',
                                borderRadius: '12px',
                                fontSize: '11px',
                                fontWeight: '500'
                              }}
                            >
                              {tech}
                            </span>
                          ))}
                        </div>
                      )}
                      <p style={{ margin: 0, fontSize: '12px', color: '#64748b' }}>
                        {project.startDate && new Date(project.startDate).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                        {project.endDate && ` - ${new Date(project.endDate).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}`}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Empty State */}
            {!profile.summary && (!profile.skills || profile.skills.length === 0) && 
             (!profile.experience || profile.experience.length === 0) && 
             (!profile.education || profile.education.length === 0) && 
             (!profile.projects || profile.projects.length === 0) && (
              <div style={{
                textAlign: 'center',
                padding: '60px 20px',
                color: '#64748b'
              }}>
                <div style={{ fontSize: '48px', marginBottom: '16px' }}>📝</div>
                <h3 style={{ margin: '0 0 8px 0', fontSize: '18px', color: '#374151' }}>Profile Not Complete</h3>
                <p style={{ margin: 0, fontSize: '14px' }}>This user hasn't filled out their profile information yet.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default UserDetails;