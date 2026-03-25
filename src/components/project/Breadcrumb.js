import React from 'react';

const Breadcrumb = ({ onNavigateToProjects, projectTitle, currentPage, onNavigateToProject }) => {
  return (
    <div className="mb-5">
      <nav className="flex items-center gap-1.5 text-xs font-medium text-slate-500">
        <div
          onClick={onNavigateToProjects}
          className="cursor-pointer text-blue-500 flex items-center gap-1 transition-colors hover:text-blue-600"
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
              className="cursor-pointer text-blue-500 hover:text-blue-600 transition-colors"
            >
              {projectTitle}
            </span>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#cbd5e1" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="9 18 15 12 9 6"></polyline>
            </svg>
            <span className="text-slate-800 font-bold">{currentPage}</span>
          </>
        ) : (
          <span className="text-slate-800 font-bold">{projectTitle}</span>
        )}
      </nav>
    </div>
  );
};

export default Breadcrumb;