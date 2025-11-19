import React from 'react';

const ProjectHeader = ({ project, onNavigateToTasks, isProjectOwner }) => {
  const getStatusConfig = (status) => {
    const configs = {
      'planning': { bg: '#fef3c7', text: '#92400e', border: '#fcd34d', icon: '📋' },
      'active': { bg: '#dbeafe', text: '#1e40af', border: '#93c5fd', icon: '🚀' },
      'completed': { bg: '#dcfce7', text: '#166534', border: '#86efac', icon: '✅' },
      'on-hold': { bg: '#fee2e2', text: '#991b1b', border: '#fca5a5', icon: '⏸️' }
    };
    return configs[status] || configs.planning;
  };

  const getPriorityConfig = (priority) => {
    const configs = {
      'low': { bg: '#dcfce7', text: '#166534', border: '#86efac', icon: '🟢' },
      'medium': { bg: '#fef3c7', text: '#92400e', border: '#fcd34d', icon: '🟡' },
      'high': { bg: '#fed7aa', text: '#9a3412', border: '#fdba74', icon: '🟠' },
      'urgent': { bg: '#fee2e2', text: '#991b1b', border: '#fca5a5', icon: '🔴' }
    };
    return configs[priority] || configs.medium;
  };

  const statusConfig = getStatusConfig(project.status);
  const priorityConfig = getPriorityConfig(project.priority);
  const progress = project.progress?.percentage || 0;
  const teamSize = (project.members?.length || 0) + 1; // +1 for owner

  return (
    <div style={{
      background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
      borderRadius: '16px',
      marginBottom: '24px',
      boxShadow: '0 10px 40px rgba(59, 130, 246, 0.2)',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Background Pattern */}
      <div style={{
        position: 'absolute',
        top: 0,
        right: 0,
        width: '400px',
        height: '400px',
        background: 'radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%)',
        borderRadius: '50%',
        transform: 'translate(30%, -30%)'
      }}></div>

      {/* Header Content */}
      <div style={{ padding: '32px', position: 'relative', zIndex: 1 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px', flexWrap: 'wrap', gap: '16px' }}>
          <div style={{ flex: 1, minWidth: '300px' }}>
            <h1 style={{ margin: '0 0 12px 0', fontSize: '32px', fontWeight: '700', color: '#ffffff' }}>
              {project.title}
            </h1>
            <p style={{ margin: '0 0 16px 0', color: 'rgba(255, 255, 255, 0.9)', lineHeight: '1.6', fontSize: '15px' }}>
              {project.description}
            </p>
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
              <span style={{
                padding: '8px 16px',
                borderRadius: '10px',
                fontSize: '13px',
                fontWeight: '600',
                textTransform: 'capitalize',
                backgroundColor: statusConfig.bg,
                color: statusConfig.text,
                border: `2px solid ${statusConfig.border}`,
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}>
                <span>{statusConfig.icon}</span>
                {project.status.replace('-', ' ')}
              </span>
              <span style={{
                padding: '8px 16px',
                borderRadius: '10px',
                fontSize: '13px',
                fontWeight: '600',
                textTransform: 'capitalize',
                backgroundColor: priorityConfig.bg,
                color: priorityConfig.text,
                border: `2px solid ${priorityConfig.border}`,
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}>
                <span>{priorityConfig.icon}</span>
                {project.priority} Priority
              </span>
              {project.company && (
                <span style={{
                  padding: '8px 16px',
                  borderRadius: '10px',
                  fontSize: '13px',
                  fontWeight: '600',
                  backgroundColor: 'rgba(255, 255, 255, 0.2)',
                  color: '#ffffff',
                  border: '2px solid rgba(255, 255, 255, 0.3)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect>
                    <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path>
                  </svg>
                  {project.company.name}
                </span>
              )}
            </div>
          </div>

          <button
            onClick={onNavigateToTasks}
            style={{
              padding: '14px 28px',
              background: 'rgba(255, 255, 255, 0.2)',
              backdropFilter: 'blur(10px)',
              color: '#ffffff',
              border: '2px solid rgba(255, 255, 255, 0.3)',
              borderRadius: '12px',
              cursor: 'pointer',
              fontSize: '15px',
              fontWeight: '600',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              transition: 'all 0.2s ease',
              whiteSpace: 'nowrap'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.3)';
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 8px 20px rgba(0, 0, 0, 0.2)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)';
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = 'none';
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 11l3 3L22 4"></path>
              <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"></path>
            </svg>
            Manage Tasks
          </button>
        </div>

        {/* Progress Bar */}
        <div style={{ marginBottom: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ fontSize: '14px', color: 'rgba(255, 255, 255, 0.9)', fontWeight: '600' }}>
              Overall Progress
            </span>
            <span style={{ fontSize: '14px', color: '#ffffff', fontWeight: '700' }}>
              {progress}%
            </span>
          </div>
          <div style={{
            width: '100%',
            height: '14px',
            backgroundColor: 'rgba(255, 255, 255, 0.2)',
            borderRadius: '7px',
            overflow: 'hidden',
            border: '1px solid rgba(255, 255, 255, 0.3)'
          }}>
            <div style={{
              width: `${progress}%`,
              height: '100%',
              background: 'linear-gradient(90deg, #10b981 0%, #059669 100%)',
              transition: 'width 0.3s ease',
              boxShadow: '0 0 10px rgba(16, 185, 129, 0.5)'
            }}></div>
          </div>
        </div>

        {/* Statistics Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '16px' }}>
          <div style={{
            backgroundColor: 'rgba(255, 255, 255, 0.15)',
            backdropFilter: 'blur(10px)',
            borderRadius: '12px',
            padding: '16px',
            border: '1px solid rgba(255, 255, 255, 0.2)'
          }}>
            <div style={{ fontSize: '12px', color: 'rgba(255, 255, 255, 0.8)', marginBottom: '6px', fontWeight: '500' }}>
              OWNER
            </div>
            <div style={{ fontSize: '15px', fontWeight: '600', color: '#ffffff' }}>
              {project.owner?.name || 'Unknown'}
            </div>
          </div>

          <div style={{
            backgroundColor: 'rgba(255, 255, 255, 0.15)',
            backdropFilter: 'blur(10px)',
            borderRadius: '12px',
            padding: '16px',
            border: '1px solid rgba(255, 255, 255, 0.2)'
          }}>
            <div style={{ fontSize: '12px', color: 'rgba(255, 255, 255, 0.8)', marginBottom: '6px', fontWeight: '500' }}>
              TEAM SIZE
            </div>
            <div style={{ fontSize: '15px', fontWeight: '600', color: '#ffffff' }}>
              {teamSize} {teamSize === 1 ? 'Member' : 'Members'}
            </div>
          </div>

          <div style={{
            backgroundColor: 'rgba(255, 255, 255, 0.15)',
            backdropFilter: 'blur(10px)',
            borderRadius: '12px',
            padding: '16px',
            border: '1px solid rgba(255, 255, 255, 0.2)'
          }}>
            <div style={{ fontSize: '12px', color: 'rgba(255, 255, 255, 0.8)', marginBottom: '6px', fontWeight: '500' }}>
              START DATE
            </div>
            <div style={{ fontSize: '15px', fontWeight: '600', color: '#ffffff' }}>
              {new Date(project.startDate).toLocaleDateString()}
            </div>
          </div>

          <div style={{
            backgroundColor: 'rgba(255, 255, 255, 0.15)',
            backdropFilter: 'blur(10px)',
            borderRadius: '12px',
            padding: '16px',
            border: '1px solid rgba(255, 255, 255, 0.2)'
          }}>
            <div style={{ fontSize: '12px', color: 'rgba(255, 255, 255, 0.8)', marginBottom: '6px', fontWeight: '500' }}>
              DUE DATE
            </div>
            <div style={{ fontSize: '15px', fontWeight: '600', color: '#ffffff' }}>
              {project.endDate ? new Date(project.endDate).toLocaleDateString() : 'Not set'}
            </div>
          </div>

          <div style={{
            backgroundColor: 'rgba(255, 255, 255, 0.15)',
            backdropFilter: 'blur(10px)',
            borderRadius: '12px',
            padding: '16px',
            border: '1px solid rgba(255, 255, 255, 0.2)'
          }}>
            <div style={{ fontSize: '12px', color: 'rgba(255, 255, 255, 0.8)', marginBottom: '6px', fontWeight: '500' }}>
              MILESTONES
            </div>
            <div style={{ fontSize: '15px', fontWeight: '600', color: '#ffffff' }}>
              {project.milestones?.length || 0}
            </div>
          </div>

          <div style={{
            backgroundColor: 'rgba(255, 255, 255, 0.15)',
            backdropFilter: 'blur(10px)',
            borderRadius: '12px',
            padding: '16px',
            border: '1px solid rgba(255, 255, 255, 0.2)'
          }}>
            <div style={{ fontSize: '12px', color: 'rgba(255, 255, 255, 0.8)', marginBottom: '6px', fontWeight: '500' }}>
              BUDGET
            </div>
            <div style={{ fontSize: '15px', fontWeight: '600', color: '#ffffff' }}>
              {project.budget?.amount ? `${project.budget.currency} ${project.budget.amount.toLocaleString()}` : 'Not set'}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProjectHeader;