import React from 'react';

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
    <section style={{
      padding: '100px 24px',
      backgroundColor: '#f8fafc'
    }}>
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto'
      }}>
        <div style={{ textAlign: 'center', marginBottom: '80px' }}>
          <h2 style={{
            fontSize: '2.5rem',
            fontWeight: '700',
            color: '#1e293b',
            marginBottom: '16px'
          }}>
            Everything you need to manage projects
          </h2>
          <p style={{
            fontSize: '1.125rem',
            color: '#64748b',
            maxWidth: '600px',
            margin: '0 auto'
          }}>
            Powerful features designed to help teams collaborate effectively and deliver projects on time.
          </p>
        </div>
        
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))',
          gap: '40px'
        }}>
          {features.map((feature, index) => (
            <div
              key={index}
              style={{
                backgroundColor: 'white',
                padding: '32px',
                borderRadius: '12px',
                boxShadow: '0 4px 6px rgba(0, 0, 0, 0.05)',
                border: '1px solid #e2e8f0'
              }}
            >
              <div style={{
                fontSize: '2.5rem',
                marginBottom: '16px'
              }}>
                {feature.icon}
              </div>
              <h3 style={{
                fontSize: '1.25rem',
                fontWeight: '600',
                color: '#1e293b',
                marginBottom: '12px'
              }}>
                {feature.title}
              </h3>
              <p style={{
                color: '#64748b',
                lineHeight: '1.6'
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