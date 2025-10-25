import React from 'react';

const Breadcrumb = ({ onNavigateToProjects, projectTitle, currentPage, onNavigateToProject }) => {
  return (
    <div style={{ marginBottom: '24px' }}>
      <nav style={{ 
        display: 'flex', 
        alignItems: 'center', 
        gap: '8px', 
        fontSize: '14px', 
        color: '#5e6c84',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", sans-serif'
      }}>
        <span 
          onClick={onNavigateToProjects}
          style={{ 
            cursor: 'pointer', 
            color: '#0052cc',
            textDecoration: 'none'
          }}
          onMouseEnter={(e) => e.target.style.textDecoration = 'underline'}
          onMouseLeave={(e) => e.target.style.textDecoration = 'none'}
        >
          Projects
        </span>
        <span>/</span>
        
        {currentPage ? (
          <>
            <span 
              onClick={onNavigateToProject}
              style={{ 
                cursor: 'pointer', 
                color: '#0052cc',
                textDecoration: 'none'
              }}
              onMouseEnter={(e) => e.target.style.textDecoration = 'underline'}
              onMouseLeave={(e) => e.target.style.textDecoration = 'none'}
            >
              {projectTitle}
            </span>
            <span>/</span>
            <span style={{ color: '#172b4d', fontWeight: '500' }}>{currentPage}</span>
          </>
        ) : (
          <span style={{ color: '#172b4d', fontWeight: '500' }}>{projectTitle}</span>
        )}
      </nav>
    </div>
  );
};

export default Breadcrumb;