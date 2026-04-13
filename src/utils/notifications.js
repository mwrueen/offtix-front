export const NOTIFICATION_TYPES = {
  task_ready: { label: 'Task' },
  task_send_back: { label: 'Task' },
  task_role_handoff: { label: 'Task' },
  task_role_assignment: { label: 'Task' },
  task_role_completed: { label: 'Task' },
  project_assignment: { label: 'Project' },
  salary_update: { label: 'Payroll' },
  role_change: { label: 'Role' },
  general: { label: 'Update' },
  invitation: { label: 'Invitation' },
  job_offer: { label: 'Job offer' },
  job_application: { label: 'Application' },
};

export const getTypeLabel = (type) => NOTIFICATION_TYPES[type]?.label || 'Notification';

export function timeAgo(dateStr) {
  if (!dateStr) return '';
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}
