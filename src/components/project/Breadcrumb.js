import React from 'react';

const Breadcrumb = ({ onNavigateToProjects, projectTitle, currentPage, onNavigateToProject }) => {
  return (
    <div style={{ marginBottom: '20px' }}>
      <nav style={{
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        fontSize: '13px',
        fontWeight: '500',
        color: '#64748b'
      }}>
        <div
          onClick={onNavigateToProjects}
          style={{
            cursor: 'pointer',
            color: '#3b82f6',
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            transition: 'color 0.2s'
          }}
          onMouseEnter={(e) => e.currentTarget.style.color = '#2563eb'}
          onMouseLeave={(e) => e.currentTarget.style.color = '#3b82f6'}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
            <polyline points="9 22 9 12 15 12 15 22"></polyline>
          </svg>
          Projects
        </div>

        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#cbd5e1" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="9 18 15 12 9 6"></polyline>
        </svg>

        {currentPage ? (
          <>
            <span
              onClick={onNavigateToProject}
              style={{
                cursor: 'pointer',
                color: '#3b82f6'
              }}
              onMouseEnter={(e) => e.currentTarget.style.color = '#2563eb'}
              onMouseLeave={(e) => e.currentTarget.style.color = '#3b82f6'}
            >
              {projectTitle}
            </span>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#cbd5e1" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="9 18 15 12 9 6"></polyline>
            </svg>
            <span style={{ color: '#1e293b', fontWeight: '700' }}>{currentPage}</span>
          </>
        ) : (
          <span style={{ color: '#1e293b', fontWeight: '700' }}>{projectTitle}</span>
        )}
      </nav>
    </div>
  );
};

export default Breadcrumb;