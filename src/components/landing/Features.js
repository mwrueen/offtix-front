import React from 'react';
import './landing.css';

const Features = () => {
  const features = [
    {
      icon: '🎯',
      title: 'Project Management',
      description: 'Create and manage projects with detailed tracking and professional dashboards.'
    },
    {
      icon: '📋',
      title: 'Task Organization',
      description: 'Hierarchical task structure with subtasks, dependencies, and custom statuses.'
    },
    {
      icon: '👥',
      title: 'Team Collaboration',
      description: 'Assign tasks to team members and track progress in real-time.'
    },
    {
      icon: '📊',
      title: 'Analytics & Reports',
      description: 'Get insights into project progress with comprehensive reporting tools.'
    },
    {
      icon: '🔄',
      title: 'Agile Workflows',
      description: 'Support for sprints, phases, and agile project management methodologies.'
    },
    {
      icon: '🔐',
      title: 'Secure & Reliable',
      description: 'Enterprise-grade security with role-based access control and data protection.'
    }
  ];

  return (
    <section id="features" style={{
      padding: '100px 24px',
      backgroundColor: '#ffffff',
      position: 'relative'
    }}>
      {/* Background decoration */}
      <div style={{
        position: 'absolute',
        top: '10%',
        left: '0',
        width: '300px',
        height: '300px',
        background: 'linear-gradient(135deg, #667eea, #764ba2)',
        borderRadius: '50%',
        filter: 'blur(100px)',
        opacity: 0.1,
        zIndex: 0
      }} />

      <div style={{
        maxWidth: '1200px',
        margin: '0 auto',
        position: 'relative',
        zIndex: 1
      }}>
        <div style={{ textAlign: 'center', marginBottom: '80px' }}>
          <div style={{
            display: 'inline-block',
            padding: '8px 20px',
            backgroundColor: '#ede9fe',
            borderRadius: '20px',
            marginBottom: '20px',
            fontSize: '14px',
            fontWeight: '600',
            color: '#667eea'
          }}>
            FEATURES
          </div>

          <h2 className="section-title" style={{
            fontSize: '2.75rem',
            fontWeight: '800',
            color: '#1e293b',
            marginBottom: '20px',
            lineHeight: '1.2'
          }}>
            Everything you need to
            <span style={{ display: 'block', color: '#667eea' }}>manage projects</span>
          </h2>
          <p style={{
            fontSize: '1.25rem',
            color: '#64748b',
            maxWidth: '700px',
            margin: '0 auto',
            lineHeight: '1.8'
          }}>
            Powerful features designed to help teams collaborate effectively and deliver projects on time.
          </p>
        </div>

        <div className="features-grid" style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: '32px'
        }}>
          {features.map((feature, index) => (
            <div
              key={index}
              style={{
                backgroundColor: 'white',
                padding: '36px',
                borderRadius: '16px',
                boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
                border: '1px solid #e2e8f0',
                transition: 'all 0.3s ease',
                cursor: 'pointer',
                position: 'relative',
                overflow: 'hidden'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-8px)';
                e.currentTarget.style.boxShadow = '0 12px 40px rgba(102, 126, 234, 0.15)';
                e.currentTarget.style.borderColor = '#667eea';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 4px 20px rgba(0, 0, 0, 0.08)';
                e.currentTarget.style.borderColor = '#e2e8f0';
              }}
            >
              {/* Gradient overlay on hover */}
              <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                height: '4px',
                background: 'linear-gradient(90deg, #667eea, #764ba2)',
                opacity: 0,
                transition: 'opacity 0.3s ease'
              }}
              onMouseEnter={(e) => e.currentTarget.style.opacity = '1'}
              />

              <div style={{
                width: '64px',
                height: '64px',
                backgroundColor: '#ede9fe',
                borderRadius: '16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '2rem',
                marginBottom: '20px',
                boxShadow: '0 4px 12px rgba(102, 126, 234, 0.1)'
              }}>
                {feature.icon}
              </div>

              <h3 style={{
                fontSize: '1.375rem',
                fontWeight: '700',
                color: '#1e293b',
                marginBottom: '12px'
              }}>
                {feature.title}
              </h3>
              <p style={{
                color: '#64748b',
                lineHeight: '1.7',
                fontSize: '15px'
              }}>
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Features;