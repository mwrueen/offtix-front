import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../context/ToastContext';
import Layout from './Layout';
import PageHeader from './PageHeader';
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
        color: 'text-emerald-600',
        bgColor: 'bg-emerald-50',
        icon: (
          <span className="flex relative w-2 h-2">
            <span className="absolute inline-flex w-full h-full rounded-full bg-emerald-400 opacity-75 animate-ping"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
        )
      },
      paused: {
        label: 'Paused',
        color: 'text-amber-600',
        bgColor: 'bg-amber-50',
        icon: <span className="text-[10px]">⏸️</span>
      },
      idle: {
        label: 'Idle',
        color: 'text-slate-500',
        bgColor: 'bg-slate-50',
        icon: <span className="w-2 h-2 rounded-full bg-slate-300"></span>
      }
    };

    const config = statusConfig[status] || statusConfig.idle;

    return (
      <span className={`px-3.5 py-1.5 rounded-full text-xs font-bold ${config.bgColor} ${config.color} inline-flex items-center gap-2 border border-current/10 whitespace-nowrap`}>
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
      <PageHeader
        title="Team Vitality"
        subtitle="Real-time synchronization of your creative force. Monitor progress and maintain momentum."
        icon={
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
            <circle cx="9" cy="7" r="4"></circle>
            <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
            <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
          </svg>
        }
        stats={[
          { label: 'Active Now', value: workingMembers.length, color: 'emerald' },
          { label: 'On Break', value: pausedMembers.length, color: 'amber' },
          { label: 'Idle', value: idleMembers.length, color: 'slate' }
        ]}
      />

      {/* Filters Bar */}
      <div className="bg-white rounded-2xl p-6 mb-8 flex items-center gap-6 shadow-sm flex-wrap border border-slate-200">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-slate-500">Project:</span>
          <select
            value={selectedProject}
            onChange={(e) => setSelectedProject(e.target.value)}
            className="px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 min-w-[200px] transition-all"
          >
            <option value="">All Projects</option>
            {projects.map(p => (
              <option key={p._id} value={p._id}>{p.title}</option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-slate-500">Date:</span>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 transition-all"
          />
        </div>

        {(selectedProject || selectedDate) && (
          <button
            onClick={clearFilters}
            className="ml-auto px-4 py-2 bg-red-50 text-red-600 rounded-xl text-sm font-bold hover:bg-red-100 transition-all active:scale-95 whitespace-nowrap"
          >
            Clear Filters
          </button>
        )}
      </div>

      {/* Content Section */}
      {(loading || companyState.loading || isInitializing) ? (
        <div className="flex flex-col items-center justify-center p-24 text-center">
          <div className="w-12 h-12 border-4 border-slate-100 border-t-indigo-600 rounded-full animate-spin mb-4"></div>
          <p className="text-slate-500 text-base font-semibold">Synchronizing team state...</p>
        </div>
      ) : error ? (
        <div className="bg-red-50 border border-red-100 p-8 rounded-2xl text-center text-red-800">
          <p className="m-0 font-bold">{error}</p>
        </div>
      ) : teamMembers.length === 0 ? (
        <div className="text-center px-10 py-24 bg-white rounded-3xl border border-dashed border-slate-200">
          <div className="text-7xl mb-6">🔍</div>
          <h3 className="text-2xl font-bold text-slate-800 mb-3">No Activity Found</h3>
          <p className="text-slate-500 max-w-md mx-auto mb-4 leading-relaxed">
            {selectedProject || selectedDate
              ? `No recorded activity for ${selectedProject ? projects.find(p => p._id === selectedProject)?.title : 'this project'} on ${selectedDate === getLocalToday() ? 'Today' : selectedDate}.`
              : 'No activity found for your team.'}
          </p>
          <p className="text-slate-400 text-sm mb-10 italic">Try adjusting your filters or checking back later.</p>
          {(selectedProject || selectedDate) && (
            <button
              onClick={clearFilters}
              className="px-8 py-3 bg-gradient-to-br from-indigo-500 to-purple-600 text-white rounded-xl font-bold shadow-lg shadow-indigo-200 hover:shadow-indigo-300 transition-all active:scale-95"
            >
              Reset All Filters
            </button>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-2xl overflow-hidden shadow-sm border border-slate-200">
          {/* List Header */}
          <div className="grid grid-cols-[80px_1.5fr_1fr_2fr_1.2fr_100px] gap-4 px-6 py-4 bg-slate-50 border-b border-slate-200 text-[10px] font-black text-slate-400 uppercase tracking-widest">
            <div>Avatar</div>
            <div>Team Member</div>
            <div>Status</div>
            <div>Current / Last Task</div>
            <div>Project & Time</div>
            <div className="text-right">Action</div>
          </div>

          {teamMembers.map((member, index) => (
            <div
              key={member.user._id}
              className={`grid grid-cols-[80px_1.5fr_1fr_2fr_1.2fr_100px] gap-4 items-center px-6 py-4 border-b ${index === teamMembers.length - 1 ? 'border-none' : 'border-slate-50'} hover:bg-slate-50 transition-colors group cursor-default`}
            >
              {/* Avatar */}
              <div>
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-50 to-indigo-100 flex items-center justify-center text-sm font-bold text-indigo-700 shadow-inner group-hover:scale-110 transition-transform">
                  {member.user.name.charAt(0).toUpperCase()}
                </div>
              </div>

              {/* User Info */}
              <div className="min-w-0 pr-3">
                <div className="text-sm font-bold text-slate-800 truncate group-hover:text-indigo-600 transition-colors">
                  {member.user.name}
                </div>
                <div className="text-[11px] text-slate-400 truncate font-medium">
                  {member.user.email}
                </div>
              </div>

              {/* Status */}
              <div>
                {getStatusBadge(member.status)}
              </div>

              {/* Task Info */}
              <div className="min-w-0 pr-4">
                {(member.currentTask || member.lastTask) ? (
                  <div>
                    <div
                      className="text-sm font-semibold text-slate-700 truncate hover:text-indigo-600 transition-colors cursor-pointer"
                      onClick={() => navigate(`/my-tasks/${(member.currentTask || member.lastTask)._id}`)}
                    >
                      {(member.currentTask || member.lastTask).title}
                    </div>
                    <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">
                      {member.currentTask ? 'Active Task' : (member.status === 'paused' ? 'Paused' : 'Recent')}
                    </div>
                  </div>
                ) : (
                  <span className="text-xs text-slate-300 italic">No activity</span>
                )}
              </div>

              {/* Project & Time */}
              <div className="min-w-0">
                {(member.currentTask || member.lastTask) ? (
                  <>
                    <div className="text-xs text-slate-500 truncate flex items-center gap-1.5 font-medium">
                      <span className="text-slate-400 opacity-70">📁</span>
                      {(member.currentTask || member.lastTask).project?.title || 'Personal'}
                    </div>
                    <div className={`text-[10px] mt-1 font-bold ${member.currentTask ? 'text-emerald-500' : 'text-slate-400'}`}>
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
              <div className="text-right">
                <button
                  onClick={() => navigate(`/employees/${member.user._id}`)}
                  className="bg-slate-50 border border-slate-200 text-indigo-600 text-[10px] font-black uppercase px-3 py-1.5 rounded-lg transition-all hover:bg-indigo-600 hover:text-white hover:border-indigo-600 shadow-sm active:scale-95 tracking-wider"
                >
                  Profile
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </Layout>
  );
};

export default TeamActivity;
