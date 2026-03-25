import React, { useState } from 'react';
import { projectAPI } from '../../services/api';
import { useCompany } from '../../context/CompanyContext';
import { useToast } from '../../context/ToastContext';
import { usePermissions, PERMISSIONS } from '../../context/PermissionsContext';
import { getCurrencySymbol } from '../../utils/currency';

const ProjectHeader = ({ project, onNavigateToTasks, isProjectOwner, onRefresh }) => {
  const { state: companyState } = useCompany();
  const toast = useToast();
  const { hasPermission, isSuperAdmin } = usePermissions();
  const companyCurrency = companyState?.selectedCompany?.currency || 'USD';

  const canEditStatus = isProjectOwner || isSuperAdmin || hasPermission(PERMISSIONS.EDIT_PROJECT);

  const [showStatusModal, setShowStatusModal] = useState(false);
  const [scheduledStartDate, setScheduledStartDate] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);

  const getStatusConfig = (status) => {
    const configs = {
      'not_started': { bg: 'bg-slate-100', text: 'text-slate-600', border: 'border-slate-200', icon: '⏳', label: 'Not Started' },
      'running': { bg: 'bg-emerald-500', text: 'text-white', border: 'border-emerald-600', icon: '🚀', label: 'Active' },
      'paused': { bg: 'bg-amber-500', text: 'text-white', border: 'border-amber-600', icon: '⏸️', label: 'Paused' },
      'cancelled': { bg: 'bg-rose-500', text: 'text-white', border: 'border-rose-600', icon: '✕', label: 'Cancelled' },
      'closed': { bg: 'bg-indigo-600', text: 'text-white', border: 'border-indigo-700', icon: '✓', label: 'Completed' },
      'planning': { bg: 'bg-slate-100', text: 'text-slate-600', border: 'border-slate-200', icon: '⏳', label: 'Planning' },
      'active': { bg: 'bg-emerald-500', text: 'text-white', border: 'border-emerald-600', icon: '🚀', label: 'Active' },
      'completed': { bg: 'bg-indigo-600', text: 'text-white', border: 'border-indigo-700', icon: '✓', label: 'Completed' },
      'on-hold': { bg: 'bg-amber-500', text: 'text-white', border: 'border-amber-600', icon: '⏸️', label: 'On Hold' }
    };
    return configs[status] || configs.not_started;
  };

  const handleStatusChange = async (newStatus) => {
    if (!canEditStatus) return;
    setIsUpdating(true);
    try {
      await projectAPI.updateStatus(project._id, newStatus, scheduledStartDate || null);
      if (onRefresh) await onRefresh();
      setShowStatusModal(false);
      setScheduledStartDate('');
      toast.success('Project status updated.');
    } catch (error) {
      toast.error('Failed to update status.');
    } finally {
      setIsUpdating(false);
    }
  };

  const getPriorityConfig = (priority) => {
    const configs = {
      'low': { bg: 'bg-slate-100', text: 'text-slate-500', icon: '⚪' },
      'medium': { bg: 'bg-blue-50', text: 'text-blue-600', icon: '🔵' },
      'high': { bg: 'bg-orange-50', text: 'text-orange-600', icon: '🟠' },
      'urgent': { bg: 'bg-rose-50', text: 'text-rose-600', icon: '🔴' }
    };
    return configs[priority] || configs.medium;
  };

  const statusConfig = getStatusConfig(project.status);
  const priorityConfig = getPriorityConfig(project.priority);
  const progress = project.progress?.percentage || 0;
  const teamSize = (project.members?.length || 0) + 1;

  return (
    <div className="bg-slate-900 p-8 lg:p-12 rounded-3xl text-white shadow-xl mb-8 relative overflow-hidden group border border-slate-800 animate-in fade-in duration-700 font-sans">
      {/* Background Accents */}
      <div className="absolute top-0 right-0 w-1/2 h-full bg-indigo-600/5 blur-[120px] rounded-full pointer-events-none" />

      <div className="relative z-10">
        <div className="flex flex-col lg:flex-row justify-between items-start gap-10">
          <div className="flex-1">
            <div className="flex flex-wrap items-center gap-4 mb-4">
              <h1 className="text-3xl lg:text-5xl font-bold tracking-tight text-white">{project.title}</h1>
              <div className="flex gap-2">
                <button
                  onClick={() => canEditStatus && setShowStatusModal(true)}
                  className={`px-4 py-1.5 rounded-full ${statusConfig.bg} ${statusConfig.text} text-[10px] font-bold uppercase tracking-widest flex items-center gap-2 border ${statusConfig.border} transition-all active:scale-95`}
                >
                  <span>{statusConfig.icon}</span>
                  {statusConfig.label}
                  {canEditStatus && <span className="opacity-50 text-[10px]">▼</span>}
                </button>
                <div className={`px-4 py-1.5 rounded-full ${priorityConfig.bg} ${priorityConfig.text} text-[10px] font-bold uppercase tracking-widest flex items-center gap-2 border border-slate-100/10`}>
                  <span>{priorityConfig.icon}</span>
                  {project.priority || 'Medium'}
                </div>
              </div>
            </div>
            <p className="text-slate-400 text-sm italic font-medium max-w-2xl leading-relaxed">
              {project.description || 'No description provided for this project.'}
            </p>
          </div>

          <div className="flex items-center gap-8 shrink-0">
            <div className="relative w-24 h-24 flex items-center justify-center">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="42" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="8" />
                <circle cx="50" cy="50" r="42" fill="none" stroke="currentColor" strokeWidth="8"
                  className="text-indigo-500 transition-all duration-1000 ease-out"
                  strokeDasharray="263.89"
                  strokeDashoffset={263.89 * (1 - progress / 100)}
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute text-center">
                <div className="text-xl font-bold">{progress}%</div>
                <div className="text-[8px] font-bold text-slate-500 uppercase tracking-widest">Complete</div>
              </div>
            </div>

            <button
              onClick={onNavigateToTasks}
              className="px-8 py-4 bg-white text-slate-950 rounded-2xl font-bold text-xs uppercase tracking-widest shadow-lg hover:bg-slate-50 hover:scale-105 active:scale-95 transition-all flex items-center gap-3"
            >
              <span>📋</span>
              View Tasks
            </button>
          </div>
        </div>

        {/* Info Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 bg-white/5 rounded-2xl border border-white/5 mt-10 overflow-hidden backdrop-blur-sm">
          {[
            { label: 'Project Owner', value: project.owner?.name || 'Unassigned', icon: '👤' },
            { label: 'Team Size', value: `${teamSize} Members`, icon: '👥' },
            { label: 'Timeline', value: project.endDate ? `${new Date(project.startDate).toLocaleDateString()} - ${new Date(project.endDate).toLocaleDateString()}` : `Started ${new Date(project.startDate).toLocaleDateString()}`, icon: '📅' },
            { label: 'Budget', value: project.budget?.amount ? `${getCurrencySymbol(companyCurrency)} ${project.budget.amount.toLocaleString()}` : 'Not Set', icon: '💰' },
            { label: 'Milestones', value: `${project.milestones?.length || 0} Total`, icon: '🎯' }
          ].map((stat, i) => (
            <div key={i} className="p-6 border-r border-white/5 last:border-0 hover:bg-white/5 transition-colors group/stat">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-sm opacity-60">{stat.icon}</span>
                <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest group-hover/stat:text-indigo-400 transition-colors">{stat.label}</span>
              </div>
              <div className="text-[11px] font-bold truncate uppercase tracking-tight">{stat.value}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Status Modal */}
      {showStatusModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-[2000] p-4 cursor-default animate-in fade-in" onClick={() => setShowStatusModal(false)}>
          <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl border border-slate-200 overflow-hidden animate-in zoom-in-95" onClick={e => e.stopPropagation()}>
            <div className="p-8 bg-slate-900 text-white">
              <h3 className="text-xl font-bold uppercase tracking-tight">Update Project Status</h3>
              <p className="text-xs text-slate-400 mt-1 uppercase tracking-widest font-bold">Project: {project.title}</p>
            </div>

            <div className="p-8 space-y-3">
              {[
                { id: 'not_started', label: 'Not Started', icon: '⏳', desc: 'Project is in setup phase.' },
                { id: 'active', label: 'Active', icon: '🚀', desc: 'Work is currently in progress.' },
                { id: 'on-hold', label: 'On Hold', icon: '⏸️', desc: 'Project is temporarily suspended.' },
                { id: 'cancelled', label: 'Cancelled', icon: '✕', desc: 'Project has been terminated.' },
                { id: 'completed', label: 'Completed', icon: '✓', desc: 'All objectives have been met.' }
              ].map(opt => (
                <button
                  key={opt.id}
                  onClick={() => handleStatusChange(opt.id)}
                  disabled={isUpdating || project.status === opt.id}
                  className={`w-full p-4 rounded-2xl border-2 text-left flex items-center gap-4 transition-all ${project.status === opt.id ? 'bg-indigo-50 border-indigo-600' : 'bg-slate-50 border-transparent hover:bg-slate-100 hover:border-slate-200'}`}
                >
                  <span className="text-2xl">{opt.icon}</span>
                  <div>
                    <div className="text-xs font-bold text-slate-900 uppercase tracking-tight">{opt.label}</div>
                    <div className="text-[10px] text-slate-500 font-medium mt-0.5">{opt.desc}</div>
                  </div>
                  {project.status === opt.id && <div className="ml-auto w-2 h-2 rounded-full bg-indigo-600" />}
                </button>
              ))}

              <button onClick={() => setShowStatusModal(false)} className="w-full py-4 mt-4 text-[10px] font-bold uppercase tracking-widest text-slate-400 hover:text-slate-900 transition-colors">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProjectHeader;