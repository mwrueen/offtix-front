import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../context/ToastContext';
import Layout from './Layout';
import api from '../services/api';
import { useCompanyFilter } from '../hooks/useCompanyFilter';

const TeamActivity = () => {
  const [teamMembers, setTeamMembers] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedProject, setSelectedProject] = useState('');
  const getLocalToday = () => {
    const date = new Date();
    const offset = date.getTimezoneOffset();
    const localDate = new Date(date.getTime() - (offset * 60 * 1000));
    return localDate.toISOString().split('T')[0];
  };

  const [selectedDate, setSelectedDate] = useState(getLocalToday());
  const { state: companyState, companyFilter } = useCompanyFilter();
  const [isInitializing, setIsInitializing] = useState(true);

  const navigate = useNavigate();
  const toast = useToast();

  // Fetch projects - depend on companyId
  useEffect(() => {
    if (companyState.loading) return;

    let isMounted = true;
    const controller = new AbortController();

    const fetchProjects = async () => {
      try {
        const config = { signal: controller.signal };
        if (companyFilter.companyId && companyFilter.companyId !== 'personal') {
          config.headers = { 'X-Company-Id': companyFilter.companyId };
          config.params = { companyId: companyFilter.companyId };
        }
        const response = await api.get('/projects', config);
        if (isMounted) setProjects(response.data || []);
      } catch (err) {
        if (err.name !== 'CanceledError') {
          console.error('Failed to fetch projects:', err);
        }
      }
    };

    fetchProjects();
    return () => {
      isMounted = false;
      controller.abort();
    };
  }, [companyFilter.companyId, companyState.loading]);

  // Fetch team activity - depend on filters and companyId
  useEffect(() => {
    if (companyState.loading) return;

    let isMounted = true;
    const controller = new AbortController();

    const fetchActivity = async () => {
      try {
        setLoading(true);
        const config = {
          params: {},
          signal: controller.signal
        };

        if (companyFilter.companyId && companyFilter.companyId !== 'personal') {
          config.headers = { 'X-Company-Id': companyFilter.companyId };
          config.params.companyId = companyFilter.companyId;
        }

        if (selectedProject) config.params.projectId = selectedProject;
        if (selectedDate) config.params.date = selectedDate;

        // Ensure we don't fetch if company is still loading
        if (companyState.loading) return;

        const response = await api.get('/team-activity', config);
        if (isMounted) {
          setTeamMembers(response.data);
          setError(null);
          setIsInitializing(false);
        }
      } catch (err) {
        if (err.name !== 'CanceledError') {
          if (isMounted) {
            setError(err.response?.data?.error || 'Failed to fetch team activity');
            toast?.showToast?.('Failed to load team activity', 'error');
          }
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchActivity();
    return () => {
      isMounted = false;
      controller.abort();
    };
  }, [companyFilter.companyId, selectedProject, selectedDate, companyState.loading]);

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} min${diffMins > 1 ? 's' : ''} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;

    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
    });
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      in_progress: {
        label: 'Working',
        color: '#059669',
        bgColor: '#ecfdf5',
        icon: (
          <span style={{ display: 'flex', position: 'relative', width: '8px', height: '8px' }}>
            <span style={{ position: 'absolute', display: 'inline-flex', width: '100%', height: '100%', borderRadius: '50%', backgroundColor: '#10b981', opacity: 0.75, animation: 'ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite' }}></span>
            <span style={{ position: 'relative', display: 'inline-flex', borderRadius: '50%', height: '8px', width: '8px', backgroundColor: '#10b981' }}></span>
          </span>
        )
      },
      paused: {
        label: 'Paused',
        color: '#d97706',
        bgColor: '#fffbeb',
        icon: <span style={{ fontSize: '10px' }}>⏸️</span>
      },
      idle: {
        label: 'Idle',
        color: '#64748b',
        bgColor: '#f8fafc',
        icon: <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#cbd5e1' }}></span>
      }
    };

    const config = statusConfig[status] || statusConfig.idle;

    return (
      <span style={{
        padding: '6px 14px',
        borderRadius: '20px',
        fontSize: '12px',
        fontWeight: '600',
        backgroundColor: config.bgColor,
        color: config.color,
        display: 'inline-flex',
        alignItems: 'center',
        gap: '8px',
        border: `1px solid ${config.color}20`
      }}>
        {config.icon}
        {config.label}
      </span>
    );
  };

  const clearFilters = () => {
    setSelectedProject('');
    setSelectedDate(new Date().toISOString().split('T')[0]);
  };

  const workingMembers = teamMembers.filter(m => m.status === 'in_progress');
  const pausedMembers = teamMembers.filter(m => m.status === 'paused');
  const idleMembers = teamMembers.filter(m => m.status === 'idle');

  return (
    <Layout>
      <div style={{ maxWidth: '1200px', margin: '0 auto', paddingBottom: '40px' }}>
        {/* Header Section */}
        <div style={{
          background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
          borderRadius: '24px',
          padding: '40px',
          marginBottom: '32px',
          color: 'white',
          position: 'relative',
          overflow: 'hidden',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
        }}>
          {/* Decorative Circles */}
          <div style={{ position: 'absolute', top: '-20px', right: '-20px', width: '150px', height: '150px', borderRadius: '50%', background: 'rgba(255, 255, 255, 0.1)' }}></div>
          <div style={{ position: 'absolute', bottom: '-40px', left: '10%', width: '100px', height: '100px', borderRadius: '50%', background: 'rgba(255, 255, 255, 0.05)' }}></div>

          <div style={{ position: 'relative', zIndex: 1 }}>
            <h1 style={{ fontSize: '32px', fontWeight: '800', margin: '0 0 8px 0', letterSpacing: '-0.025em' }}>
              Team Vitality
            </h1>
            <p style={{ fontSize: '16px', color: 'rgba(255, 255, 255, 0.8)', margin: 0, maxWidth: '500px' }}>
              Real-time synchronization of your creative force. Monitor progress and maintain momentum.
            </p>
          </div>

          {/* Stats Bar */}
          <div style={{
            display: 'flex',
            gap: '24px',
            marginTop: '32px',
            flexWrap: 'wrap'
          }}>
            <div style={{ background: 'rgba(255, 255, 255, 0.1)', backdropFilter: 'blur(10px)', padding: '12px 20px', borderRadius: '16px', border: '1px solid rgba(255, 255, 255, 0.2)' }}>
              <div style={{ fontSize: '24px', fontWeight: '700' }}>{workingMembers.length}</div>
              <div style={{ fontSize: '11px', textTransform: 'uppercase', opacity: 0.8, letterSpacing: '0.05em' }}>Active Now</div>
            </div>
            <div style={{ background: 'rgba(255, 255, 255, 0.1)', backdropFilter: 'blur(10px)', padding: '12px 20px', borderRadius: '16px', border: '1px solid rgba(255, 255, 255, 0.2)' }}>
              <div style={{ fontSize: '24px', fontWeight: '700' }}>{pausedMembers.length}</div>
              <div style={{ fontSize: '11px', textTransform: 'uppercase', opacity: 0.8, letterSpacing: '0.05em' }}>On Break</div>
            </div>
            <div style={{ background: 'rgba(255, 255, 255, 0.1)', backdropFilter: 'blur(10px)', padding: '12px 20px', borderRadius: '16px', border: '1px solid rgba(255, 255, 255, 0.2)' }}>
              <div style={{ fontSize: '24px', fontWeight: '700' }}>{idleMembers.length}</div>
              <div style={{ fontSize: '11px', textTransform: 'uppercase', opacity: 0.8, letterSpacing: '0.05em' }}>Idle</div>
            </div>
          </div>
        </div>

        {/* Filters Bar */}
        <div style={{
          backgroundColor: 'white',
          borderRadius: '20px',
          padding: '20px 24px',
          marginBottom: '32px',
          display: 'flex',
          alignItems: 'center',
          gap: '20px',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
          flexWrap: 'wrap',
          border: '1px solid #f1f5f9'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '14px', fontWeight: '600', color: '#64748b' }}>Project:</span>
            <select
              value={selectedProject}
              onChange={(e) => setSelectedProject(e.target.value)}
              style={{
                padding: '8px 16px',
                borderRadius: '12px',
                border: '1px solid #e2e8f0',
                backgroundColor: '#f8fafc',
                fontSize: '14px',
                color: '#1e293b',
                outline: 'none',
                minWidth: '200px'
              }}
            >
              <option value="">All Projects</option>
              {projects.map(p => (
                <option key={p._id} value={p._id}>{p.title}</option>
              ))}
            </select>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '14px', fontWeight: '600', color: '#64748b' }}>Date:</span>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              style={{
                padding: '8px 16px',
                borderRadius: '12px',
                border: '1px solid #e2e8f0',
                backgroundColor: '#f8fafc',
                fontSize: '14px',
                color: '#1e293b',
                outline: 'none'
              }}
            />
          </div>

          {(selectedProject || selectedDate) && (
            <button
              onClick={clearFilters}
              style={{
                marginLeft: 'auto',
                padding: '8px 16px',
                background: '#f1f5f9',
                border: 'none',
                borderRadius: '10px',
                fontSize: '13px',
                fontWeight: '600',
                color: '#ef4444',
                cursor: 'pointer'
              }}
            >
              Clear Filters
            </button>
          )}
        </div>

        {/* Content Section */}
        {(loading || companyState.loading || isInitializing) ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '100px' }}>
            <div className="spinning" style={{ width: '40px', height: '40px', border: '3px solid #f3f3f3', borderTop: '3px solid #4f46e5', borderRadius: '50%', marginBottom: '16px' }}></div>
            <p style={{ color: '#64748b', fontSize: '14px', fontWeight: '500' }}>Synchronizing team state...</p>
          </div>
        ) : error ? (
          <div style={{ background: '#fef2f2', border: '1px solid #fee2e2', padding: '24px', borderRadius: '16px', textAlign: 'center', color: '#991b1b' }}>
            <p style={{ margin: 0 }}>{error}</p>
          </div>
        ) : teamMembers.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '80px 40px', background: 'white', borderRadius: '24px', border: '1px dashed #e2e8f0' }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>🔍</div>
            <h3 style={{ fontSize: '20px', fontWeight: '600', color: '#1e293b', margin: '0 0 8px 0' }}>No Activity Found</h3>
            <p style={{ color: '#64748b', margin: 0 }}>
              {selectedProject || selectedDate
                ? `No recorded activity for ${selectedProject ? projects.find(p => p._id === selectedProject)?.title : 'this project'} on ${selectedDate === getLocalToday() ? 'Today' : selectedDate}.`
                : 'No activity found for your team.'}
            </p>
            <p style={{ color: '#94a3b8', fontSize: '13px', marginTop: '12px' }}>Try adjusting your filters or checking back later.</p>
            {(selectedProject || selectedDate) && (
              <button
                onClick={clearFilters}
                style={{ marginTop: '24px', background: '#4f46e5', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '12px', fontWeight: '600', cursor: 'pointer' }}
              >
                Reset All Filters
              </button>
            )}
          </div>
        ) : (
          <div style={{
            backgroundColor: 'white',
            borderRadius: '20px',
            overflow: 'hidden',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
            border: '1px solid #f1f5f9'
          }}>
            {/* List Header */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: '80px 1.5fr 1fr 2fr 1.2fr 100px',
              padding: '16px 24px',
              backgroundColor: '#f8fafc',
              borderBottom: '1px solid #f1f5f9',
              fontSize: '12px',
              fontWeight: '700',
              color: '#64748b',
              textTransform: 'uppercase',
              letterSpacing: '0.05em'
            }}>
              <div>Avatar</div>
              <div>Team Member</div>
              <div>Status</div>
              <div>Current / Last Task</div>
              <div>Project & Time</div>
              <div style={{ textAlign: 'right' }}>Action</div>
            </div>

            {teamMembers.map((member, index) => (
              <div
                key={member.user._id}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '80px 1.5fr 1fr 2fr 1.2fr 100px',
                  alignItems: 'center',
                  padding: '12px 24px',
                  borderBottom: index < teamMembers.length - 1 ? '1px solid #f8fafc' : 'none',
                  transition: 'background-color 0.2s ease',
                  cursor: 'default'
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f1f5f9'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
              >
                {/* Avatar */}
                <div>
                  <div style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '10px',
                    background: 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '14px',
                    fontWeight: '700',
                    color: '#0369a1',
                    boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.05)'
                  }}>
                    {member.user.name.charAt(0).toUpperCase()}
                  </div>
                </div>

                {/* User Info */}
                <div style={{ minWidth: 0, paddingRight: '12px' }}>
                  <div style={{ fontSize: '14px', fontWeight: '600', color: '#1e293b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {member.user.name}
                  </div>
                  <div style={{ fontSize: '11px', color: '#94a3b8', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {member.user.email}
                  </div>
                </div>

                {/* Status */}
                <div>
                  {getStatusBadge(member.status)}
                </div>

                {/* Task Info */}
                <div style={{ minWidth: 0, paddingRight: '16px' }}>
                  {(member.currentTask || member.lastTask) ? (
                    <div>
                      <div
                        style={{
                          fontSize: '13px',
                          fontWeight: '500',
                          color: '#334155',
                          cursor: 'pointer',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis'
                        }}
                        onClick={() => navigate(`/my-tasks/${(member.currentTask || member.lastTask)._id}`)}
                      >
                        {(member.currentTask || member.lastTask).title}
                      </div>
                      <div style={{ fontSize: '10px', color: '#94a3b8', fontWeight: '600', textTransform: 'uppercase' }}>
                        {member.currentTask ? 'Active Task' : (member.status === 'paused' ? 'Paused' : 'Recent')}
                      </div>
                    </div>
                  ) : (
                    <span style={{ fontSize: '12px', color: '#cbd5e1', fontStyle: 'italic' }}>No activity</span>
                  )}
                </div>

                {/* Project & Time */}
                <div style={{ minWidth: 0 }}>
                  {(member.currentTask || member.lastTask) ? (
                    <>
                      <div style={{ fontSize: '13px', color: '#64748b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <span style={{ fontSize: '12px' }}>📁</span>
                        {(member.currentTask || member.lastTask).project?.title || 'Personal'}
                      </div>
                      <div style={{ fontSize: '11px', color: member.currentTask ? '#10b981' : '#94a3b8', marginTop: '2px' }}>
                        {member.currentTask
                          ? `Since ${formatDate(member.currentTask.startedAt)}`
                          : member.status === 'paused'
                            ? `Paused ${formatDate(member.lastTask.pausedAt)}`
                            : `Done ${formatDate(member.lastTask.completedAt)}`
                        }
                      </div>
                    </>
                  ) : null}
                </div>

                {/* Action */}
                <div style={{ textAlign: 'right' }}>
                  <button
                    onClick={() => navigate(`/employees/${member.user._id}`)}
                    style={{
                      background: '#f8fafc',
                      border: '1px solid #e2e8f0',
                      color: '#4f46e5',
                      fontSize: '11px',
                      fontWeight: '700',
                      cursor: 'pointer',
                      padding: '6px 10px',
                      borderRadius: '8px',
                      transition: 'all 0.2s',
                      textTransform: 'uppercase'
                    }}
                    onMouseEnter={(e) => {
                      e.target.style.background = '#4f46e5';
                      e.target.style.color = 'white';
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.background = '#f8fafc';
                      e.target.style.color = '#4f46e5';
                    }}
                  >
                    Profile
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <style dangerouslySetInnerHTML={{
        __html: `
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        @keyframes ping {
          75%, 100% {
            transform: scale(2);
            opacity: 0;
          }
        }
        .spinning {
          animation: spin 1s linear infinite;
        }
      `}} />
    </Layout>
  );
};

export default TeamActivity;
