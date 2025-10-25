import React from 'react';

const ProjectHeader = ({ project, onNavigateToTasks, isProjectOwner }) => {
  return (
    <div style={{
      backgroundColor: 'white',
      border: '1px solid #e5e7eb',
      borderRadius: '8px',
      marginBottom: '24px'
    }}>
      <div style={{ padding: '24px', borderBottom: '1px solid #f3f4f6' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
          <div>
            <h1 style={{ margin: '0 0 8px 0', fontSize: '24px', fontWeight: '600', color: '#1e293b' }}>
              {project.title}
            </h1>
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
              <span style={{
                padding: '4px 8px',
                borderRadius: '12px',
                fontSize: '11px',
                fontWeight: '600',
                textTransform: 'uppercase',
                backgroundColor: '#dbeafe',
                color: '#1e40af'
              }}>
                {project.status}
              </span>
              <span style={{
                padding: '4px 8px',
                borderRadius: '12px',
                fontSize: '11px',
                fontWeight: '600',
                textTransform: 'uppercase',
                backgroundColor: '#fef3c7',
                color: '#92400e'
              }}>
                {project.priority}
              </span>
            </div>
          </div>
          <button
            onClick={onNavigateToTasks}
            style={{
              padding: '8px 16px',
              backgroundColor: '#0052cc',
              color: 'white',
              border: 'none',
              borderRadius: '3px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '500',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <span>📋</span>
            Manage Tasks
          </button>
        </div>
        <p style={{ margin: 0, color: '#64748b', lineHeight: '1.5', fontSize: '14px' }}>
          {project.description}
        </p>
      </div>
      
      <div style={{ padding: '16px 24px', backgroundColor: '#f8fafc' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '24px' }}>
          <div>
            <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '4px' }}>OWNER</div>
            <div style={{ fontSize: '14px', fontWeight: '500', color: '#1e293b' }}>{project.owner?.name}</div>
          </div>
          <div>
            <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '4px' }}>CREATED</div>
            <div style={{ fontSize: '14px', fontWeight: '500', color: '#1e293b' }}>
              {new Date(project.createdAt).toLocaleDateString()}
            </div>
          </div>
          <div>
            <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '4px' }}>TASKS</div>
            <div style={{ fontSize: '14px', fontWeight: '500', color: '#1e293b' }}>
              {project.taskCount || 0}
            </div>
          </div>
          <div>
            <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '4px' }}>PROGRESS</div>
            <div style={{ fontSize: '14px', fontWeight: '500', color: '#1e293b' }}>In Progress</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProjectHeader;