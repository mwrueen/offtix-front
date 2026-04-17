import React, { useState } from 'react';
import { projectAPI } from '../../services/api';
import { useCompany } from '../../context/CompanyContext';
import { useToast } from '../../context/ToastContext';
import { usePermissions, PERMISSIONS } from '../../context/PermissionsContext';
import { getCurrencySymbol } from '../../utils/currency';
import { Button, Badge, Modal } from '../ui';

const ProjectHeader = ({ project, onNavigateToTasks, isProjectOwner, onRefresh }) => {
  const { state: companyState } = useCompany();
  const toast = useToast();
  const { hasPermission, isSuperAdmin } = usePermissions();
  const companyCurrency = companyState?.selectedCompany?.currency || 'USD';

  const canEditStatus = isProjectOwner || isSuperAdmin || hasPermission(PERMISSIONS.EDIT_PROJECT);

  const [showStatusModal, setShowStatusModal] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  const getStatusConfig = (status) => {
    const configs = {
      'not_started': { dot: 'bg-slate-400', accent: 'bg-slate-300', badgeCls: 'bg-slate-100 text-slate-600 border-slate-200', label: 'Not Started' },
      'running': { dot: 'bg-emerald-500', accent: 'bg-emerald-500', badgeCls: 'bg-emerald-50 text-emerald-700 border-emerald-200', label: 'Active' },
      'paused': { dot: 'bg-amber-500', accent: 'bg-amber-500', badgeCls: 'bg-amber-50 text-amber-700 border-amber-200', label: 'Paused' },
      'cancelled': { dot: 'bg-rose-500', accent: 'bg-rose-500', badgeCls: 'bg-rose-50 text-rose-700 border-rose-200', label: 'Cancelled' },
      'closed': { dot: 'bg-indigo-500', accent: 'bg-indigo-500', badgeCls: 'bg-indigo-50 text-indigo-700 border-indigo-200', label: 'Completed' },
      'planning': { dot: 'bg-slate-400', accent: 'bg-slate-300', badgeCls: 'bg-slate-100 text-slate-600 border-slate-200', label: 'Planning' },
      'active': { dot: 'bg-emerald-500', accent: 'bg-emerald-500', badgeCls: 'bg-emerald-50 text-emerald-700 border-emerald-200', label: 'Active' },
      'completed': { dot: 'bg-indigo-500', accent: 'bg-indigo-500', badgeCls: 'bg-indigo-50 text-indigo-700 border-indigo-200', label: 'Completed' },
      'on-hold': { dot: 'bg-amber-500', accent: 'bg-amber-500', badgeCls: 'bg-amber-50 text-amber-700 border-amber-200', label: 'On Hold' },
    };
    return configs[status] || configs.not_started;
  };

  const getPriorityVariant = (priority) => {
    const map = { low: 'default', medium: 'info', high: 'warning', urgent: 'danger' };
    return map[priority] || 'info';
  };

  const handleStatusChange = async (newStatus) => {
    if (!canEditStatus) return;
    setIsUpdating(true);
    try {
      await projectAPI.updateStatus(project._id, newStatus, null);
      if (onRefresh) await onRefresh();
      setShowStatusModal(false);
      toast.success('Project status updated.');
    } catch (error) {
      toast.error('Failed to update status.');
    } finally {
      setIsUpdating(false);
    }
  };

  const statusConfig = getStatusConfig(project.status);
  const progress = project.progress?.percentage || 0;
  const teamSize = (project.members?.length || 0) + 1;

  const statItems = [
    {
      label: 'Owner',
      value: project.owner?.name || 'Unassigned',
      icon: <svg className="w-3.5 h-3.5 text-slate-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
    },
    {
      label: 'Team',
      value: `${teamSize} Member${teamSize !== 1 ? 's' : ''}`,
      icon: <svg className="w-3.5 h-3.5 text-slate-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
    },
    {
      label: 'Timeline',
      value: (() => {
        const start = project.startDate ? new Date(project.startDate) : null;
        const end = project.endDate ? new Date(project.endDate) : null;
        const isValid = (d) => d instanceof Date && !isNaN(d);
        
        if (isValid(start) && isValid(end)) {
          return `${start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} – ${end.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
        } else if (isValid(start)) {
          return `Started ${start.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
        }
        return 'Dates Not Set';
      })(),
      icon: <svg className="w-3.5 h-3.5 text-slate-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="18" rx="2" ry="2" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" /><line x1="16" y1="2" x2="16" y2="6" strokeWidth={2} strokeLinecap="round" /><line x1="8" y1="2" x2="8" y2="6" strokeWidth={2} strokeLinecap="round" /><line x1="3" y1="10" x2="21" y2="10" strokeWidth={2} strokeLinecap="round" /></svg>
    },
    {
      label: 'Budget',
      value: project.budget?.amount ? `${getCurrencySymbol(companyCurrency)} ${project.budget.amount.toLocaleString()}` : 'Not Set',
      icon: <svg className="w-3.5 h-3.5 text-slate-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><line x1="12" y1="1" x2="12" y2="23" strokeWidth={2} strokeLinecap="round" /><path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" /></svg>
    },
    {
      label: 'Milestones',
      value: `${project.milestones?.length || 0} Total`,
      icon: <svg className="w-3.5 h-3.5 text-slate-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9" /></svg>
    },
  ];

  const statusOptions = [
    { id: 'not_started', label: 'Not Started', desc: 'Project is in setup phase.' },
    { id: 'active', label: 'Active', desc: 'Work is currently in progress.' },
    { id: 'on-hold', label: 'On Hold', desc: 'Project is temporarily suspended.' },
    { id: 'cancelled', label: 'Cancelled', desc: 'Project has been terminated.' },
    { id: 'completed', label: 'Completed', desc: 'All objectives have been met.' },
  ];

  return (
    <>
      {/* Card */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm mb-6 overflow-hidden">
        <div className="h-1 w-full bg-slate-50 border-b border-slate-100" />

        <div className="p-6 lg:p-8">
          {/* Top row: title + badges + actions */}
          <div className="flex flex-col lg:flex-row lg:items-start gap-6">
            {/* Left: name, description, badges */}
            <div className="flex-1 min-w-0 flex gap-4 lg:gap-6">
              {project.logo && (
                <div className="w-16 h-16 lg:w-24 lg:h-24 rounded-2xl border-2 border-slate-100 overflow-hidden shrink-0 shadow-sm">
                  <img 
                    src={project.logo.startsWith('http') ? project.logo : `${process.env.REACT_APP_API_URL?.replace('/api', '') || 'http://localhost:5000'}${project.logo}`} 
                    alt={project.title} 
                    className="w-full h-full object-cover" 
                  />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-3 mb-2">
                  <h1 className="text-2xl font-bold text-slate-900 tracking-tight">{project.title}</h1>
                  <div className="flex items-center gap-2 flex-wrap">
                    <button
                      onClick={() => canEditStatus && setShowStatusModal(true)}
                      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-xs font-semibold ${statusConfig.badgeCls} ${canEditStatus ? 'cursor-pointer hover:opacity-80 transition-opacity' : 'cursor-default'}`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${statusConfig.dot}`} />
                      {statusConfig.label}
                      {canEditStatus && (
                        <svg className="w-3 h-3 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      )}
                    </button>
                    <Badge variant={getPriorityVariant(project.priority)} size="sm">
                      {project.priority ? project.priority.charAt(0).toUpperCase() + project.priority.slice(1) : 'Medium'} Priority
                    </Badge>
                  </div>
                </div>
                {project.description ? (
                  <div
                    className="text-slate-500 text-sm leading-relaxed max-w-2xl prose prose-slate prose-sm"
                    dangerouslySetInnerHTML={{ __html: project.description }}
                  />
                ) : (
                  <p className="text-slate-500 text-sm leading-relaxed max-w-2xl italic">
                    No description provided for this project.
                  </p>
                )}
              </div>
            </div>

            {/* Right: progress ring + action */}
            <div className="flex items-center gap-5 shrink-0">
              <div className="flex flex-col items-center gap-1">
                <div className="relative w-16 h-16 flex items-center justify-center">
                  <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                    <circle cx="50" cy="50" r="40" fill="none" stroke="#f1f5f9" strokeWidth="10" />
                    <circle cx="50" cy="50" r="40" fill="none" stroke="#6366f1" strokeWidth="10"
                      strokeDasharray="251.33"
                      strokeDashoffset={251.33 * (1 - progress / 100)}
                      strokeLinecap="round"
                      className="transition-all duration-700 ease-out"
                    />
                  </svg>
                  <div className="absolute text-center">
                    <div className="text-sm font-bold text-slate-800">{progress}%</div>
                  </div>
                </div>
                <span className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">Progress</span>
              </div>

              <Button variant="outline" size="md" onClick={onNavigateToTasks}>
                <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                </svg>
                View Tasks
              </Button>
            </div>
          </div>

          {/* Stats row */}
          <div className="mt-6 pt-5 border-t border-slate-100 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {statItems.map((stat, i) => (
              <div key={i} className="flex items-start gap-2">
                <div className="mt-0.5">{stat.icon}</div>
                <div className="min-w-0">
                  <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-0.5">{stat.label}</div>
                  <div className="text-xs font-semibold text-slate-700 truncate">{stat.value}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Status Modal */}
      <Modal
        isOpen={showStatusModal}
        onClose={() => setShowStatusModal(false)}
        title="Update Project Status"
        size="sm"
      >
        <p className="text-sm text-slate-500 mb-4">{project.title}</p>
        <div className="space-y-2">
          {statusOptions.map(opt => {
            const cfg = getStatusConfig(opt.id);
            const isCurrent = project.status === opt.id;
            return (
              <button
                key={opt.id}
                onClick={() => handleStatusChange(opt.id)}
                disabled={isUpdating || isCurrent}
                className={`w-full p-3.5 rounded-xl border text-left flex items-center gap-3 transition-all ${isCurrent ? 'bg-slate-50 border-indigo-300' : 'border-slate-200 hover:bg-slate-50 hover:border-slate-300'} disabled:opacity-60`}
              >
                <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${cfg.dot}`} />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold text-slate-800">{opt.label}</div>
                  <div className="text-xs text-slate-400 mt-0.5">{opt.desc}</div>
                </div>
                {isCurrent && (
                  <svg className="w-4 h-4 text-indigo-600 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </button>
            );
          })}
        </div>
        <div className="mt-4 flex justify-end">
          <Button variant="ghost" size="sm" onClick={() => setShowStatusModal(false)}>Cancel</Button>
        </div>
      </Modal>
    </>
  );
};

export default ProjectHeader;