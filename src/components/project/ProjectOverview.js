import React from 'react';

const ProjectOverview = ({ project, users, isProjectOwner }) => {
  const getStatusColor = (status) => {
    const colors = {
      'planning': { bg: '#fff4e6', text: '#974f0c', border: '#ffcc95' },
      'active': { bg: '#e6f7ff', text: '#0052cc', border: '#91d5ff' },
      'completed': { bg: '#f6ffed', text: '#389e0d', border: '#b7eb8f' },
      'on-hold': { bg: '#fff1f0', text: '#cf1322', border: '#ffa39e' }
    };
    return colors[status] || colors.planning;
  };

  const getPriorityColor = (priority) => {
    const colors = {
      'low': { bg: '#f6ffed', text: '#389e0d', border: '#b7eb8f' },
      'medium': { bg: '#fff4e6', text: '#d46b08', border: '#ffcc95' },
      'high': { bg: '#fff1f0', text: '#cf1322', border: '#ffa39e' },
      'urgent': { bg: '#f9f0ff', text: '#722ed1', border: '#d3adf7' }
    };
    return colors[priority] || colors.medium;
  };

  const statusColor = getStatusColor(project.status);
  const priorityColor = getPriorityColor(project.priority);

  return (
    <div>
      {/* Project Summary Cards */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', 
        gap: '16px', 
        marginBottom: '32px' 
      }}>
        <div style={{
          backgroundColor: '#f4f5f7',
          border: '1px solid #dfe1e6',
          borderRadius: '3px',
          padding: '16px'
        }}>
          <div style={{ fontSize: '12px', color: '#5e6c84', marginBottom: '8px', fontWeight: '600' }}>
            PROJECT STATUS
          </div>
          <div style={{
            display: 'inline-block',
            padding: '4px 12px',
            borderRadius: '11px',
            fontSize: '12px',
            fontWeight: '600',
            backgroundColor: statusColor.bg,
            color: statusColor.text,
            border: `1px solid ${statusColor.border}`,
            textTransform: 'capitalize'
          }}>
            {project.status}
          </div>
        </div>

        <div style={{
          backgroundColor: '#f4f5f7',
          border: '1px solid #dfe1e6',
          borderRadius: '3px',
          padding: '16px'
        }}>
          <div style={{ fontSize: '12px', color: '#5e6c84', marginBottom: '8px', fontWeight: '600' }}>
            PRIORITY
          </div>
          <div style={{
            display: 'inline-block',
            padding: '4px 12px',
            borderRadius: '11px',
            fontSize: '12px',
            fontWeight: '600',
            backgroundColor: priorityColor.bg,
            color: priorityColor.text,
            border: `1px solid ${priorityColor.border}`,
            textTransform: 'capitalize'
          }}>
            {project.priority}
          </div>
        </div>

        <div style={{
          backgroundColor: '#f4f5f7',
          border: '1px solid #dfe1e6',
          borderRadius: '3px',
          padding: '16px'
        }}>
          <div style={{ fontSize: '12px', color: '#5e6c84', marginBottom: '8px', fontWeight: '600' }}>
            PROJECT OWNER
          </div>
          <div style={{ fontSize: '14px', color: '#172b4d', fontWeight: '500' }}>
            {project.owner?.name || 'Not assigned'}
          </div>
        </div>

        <div style={{
          backgroundColor: '#f4f5f7',
          border: '1px solid #dfe1e6',
          borderRadius: '3px',
          padding: '16px'
        }}>
          <div style={{ fontSize: '12px', color: '#5e6c84', marginBottom: '8px', fontWeight: '600' }}>
            CREATED DATE
          </div>
          <div style={{ fontSize: '14px', color: '#172b4d', fontWeight: '500' }}>
            {new Date(project.createdAt).toLocaleDateString()}
          </div>
        </div>
      </div>

      {/* Project Description */}
      <div style={{
        backgroundColor: '#ffffff',
        border: '1px solid #dfe1e6',
        borderRadius: '3px',
        padding: '20px',
        marginBottom: '24px'
      }}>
        <h3 style={{ 
          margin: '0 0 16px 0', 
          fontSize: '16px', 
          fontWeight: '600', 
          color: '#172b4d' 
        }}>
          Project Description
        </h3>
        <p style={{ 
          margin: 0, 
          color: '#5e6c84', 
          lineHeight: '1.6', 
          fontSize: '14px',
          whiteSpace: 'pre-wrap'
        }}>
          {project.description || 'No description provided.'}
        </p>
      </div>

      {/* Project Timeline */}
      {(project.startDate || project.endDate) && (
        <div style={{
          backgroundColor: '#ffffff',
          border: '1px solid #dfe1e6',
          borderRadius: '3px',
          padding: '20px',
          marginBottom: '24px'
        }}>
          <h3 style={{ 
            margin: '0 0 16px 0', 
            fontSize: '16px', 
            fontWeight: '600', 
            color: '#172b4d' 
          }}>
            Timeline
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            {project.startDate && (
              <div>
                <div style={{ fontSize: '12px', color: '#5e6c84', marginBottom: '4px', fontWeight: '600' }}>
                  START DATE
                </div>
                <div style={{ fontSize: '14px', color: '#172b4d' }}>
                  {new Date(project.startDate).toLocaleDateString()}
                </div>
              </div>
            )}
            {project.endDate && (
              <div>
                <div style={{ fontSize: '12px', color: '#5e6c84', marginBottom: '4px', fontWeight: '600' }}>
                  END DATE
                </div>
                <div style={{ fontSize: '14px', color: '#172b4d' }}>
                  {new Date(project.endDate).toLocaleDateString()}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Team Members */}
      <div style={{
        backgroundColor: '#ffffff',
        border: '1px solid #dfe1e6',
        borderRadius: '3px',
        padding: '20px'
      }}>
        <h3 style={{ 
          margin: '0 0 16px 0', 
          fontSize: '16px', 
          fontWeight: '600', 
          color: '#172b4d' 
        }}>
          Team Members
        </h3>
        {project.members && project.members.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {project.members.map(member => (
              <div key={member._id} style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '8px 12px',
                backgroundColor: '#f4f5f7',
                borderRadius: '3px',
                border: '1px solid #dfe1e6'
              }}>
                <div style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  backgroundColor: '#0052cc',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                  fontSize: '12px',
                  fontWeight: '600'
                }}>
                  {member.name?.charAt(0).toUpperCase()}
                </div>
                <div>
                  <div style={{ fontSize: '14px', fontWeight: '500', color: '#172b4d' }}>
                    {member.name}
                  </div>
                  <div style={{ fontSize: '12px', color: '#5e6c84' }}>
                    {member.email}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ 
            textAlign: 'center', 
            padding: '32px', 
            color: '#5e6c84',
            fontSize: '14px'
          }}>
            No team members assigned yet.
          </div>
        )}
      </div>
    </div>
  );
};

export default ProjectOverview;