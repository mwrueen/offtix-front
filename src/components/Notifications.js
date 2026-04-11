import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../context/ToastContext';
import { useSocket } from '../context/SocketContext';
import { getCookie } from '../utils/cookies';
import Layout from './Layout';
import PageHeader from './PageHeader';

const currencySymbols = { USD: '$', EUR: '€', GBP: '£', JPY: '¥', INR: '₹', BDT: '৳' };

const typeConfig = {
  task_ready: { icon: '✅', color: 'indigo', label: 'Task Ready' },
  task_send_back: { icon: '↩️', color: 'rose', label: 'Returned' },
  task_role_handoff: { icon: '🔄', color: 'emerald', label: 'Handoff' },
  task_role_assignment: { icon: '🎯', color: 'indigo', label: 'Assigned' },
  task_role_completed: { icon: '🏁', color: 'emerald', label: 'Completed' },
  project_assignment: { icon: '📁', color: 'slate', label: 'Project' },
  salary_update: { icon: '💰', color: 'emerald', label: 'Payroll' },
  role_change: { icon: '👤', color: 'indigo', label: 'Role Shift' },
  general: { icon: '🔔', color: 'slate', label: 'Update' },
  invitation: { icon: '✉️', color: 'indigo', label: 'Invitation' },
  job_offer: { icon: '📋', color: 'emerald', label: 'Job offer' },
  job_application: { icon: '📥', color: 'slate', label: 'Application' },
};

const getConfig = (type) => typeConfig[type] || typeConfig.general;

function timeAgo(dateStr) {
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

const Notifications = () => {
  const toast = useToast();
  const navigate = useNavigate();
  const { clearUnreadCount } = useSocket();

  const [invitations, setInvitations] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processingInvitation, setProcessingInvitation] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  useEffect(() => {
    fetchAll();
    clearUnreadCount();
  }, [clearUnreadCount]);

  const authHeaders = () => ({ Authorization: `Bearer ${getCookie('authToken')}`, 'Content-Type': 'application/json' });

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [invRes, notifRes] = await Promise.all([
        fetch('/api/invitations/my-invitations', { headers: authHeaders() }),
        fetch('/api/notifications', { headers: authHeaders() }),
      ]);
      if (invRes.ok) setInvitations(await invRes.json());
      if (notifRes.ok) {
        const data = await notifRes.json();
        setNotifications(data.notifications || []);
      }
    } catch (err) { console.error('Error fetching notifications', err); }
    finally { setLoading(false); }
  };

  const handleAcceptInvitation = async (id) => {
    setProcessingInvitation(id);
    try {
      const res = await fetch(`/api/invitations/${id}/accept`, { method: 'POST', headers: authHeaders() });
      if (res.ok) { toast?.success?.('Invitation accepted successfully.'); setTimeout(() => window.location.reload(), 1500); }
      else { toast?.error?.((await res.json()).message || 'Failed to accept invitation.'); }
    } catch { toast?.error?.('Communication error.'); }
    finally { setProcessingInvitation(null); }
  };

  const handleRejectInvitation = async (id) => {
    setProcessingInvitation(id);
    try {
      const res = await fetch(`/api/invitations/${id}/reject`, { method: 'POST', headers: authHeaders() });
      if (res.ok) { toast?.success?.('Invitation rejected.'); fetchAll(); }
      else toast?.error?.('Action failed.');
    } catch { toast?.error?.('Action failed.'); }
    finally { setProcessingInvitation(null); }
  };

  const markAsRead = async (id) => {
    try {
      await fetch(`/api/notifications/${id}/read`, { method: 'PUT', headers: authHeaders() });
      setNotifications(prev => prev.map(n => n._id === id ? { ...n, isRead: true } : n));
    } catch { }
  };

  const markAllAsRead = async () => {
    try {
      await fetch('/api/notifications/mark-all-read', { method: 'PUT', headers: authHeaders() });
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      toast?.success?.('All notifications marked as read.');
    } catch { }
  };

  const deleteNotification = async (id) => {
    setDeletingId(id);
    try {
      const res = await fetch(`/api/notifications/${id}`, { method: 'DELETE', headers: authHeaders() });
      if (res.ok) setNotifications(prev => prev.filter(n => n._id !== id));
    } catch { } finally { setDeletingId(null); }
  };

  const handleNotifClick = (notif) => {
    if (!notif.isRead) markAsRead(notif._id);
    if (notif.type === 'job_offer' && notif.relatedId) {
      navigate(`/recruitment/offer/${notif.relatedId}`);
      return;
    }
    const taskId = notif.metadata?.taskId || notif.relatedId;
    if (taskId && (notif.relatedModel === 'Task' || notif.type?.startsWith('task_'))) {
      navigate(`/my-tasks/${taskId}`);
    }
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;

  if (loading) return (
    <Layout>
      <div className="max-w-[1200px] mx-auto px-6 py-12 animate-in fade-in space-y-8">
        <div className="w-12 h-12 border-4 border-slate-100 border-t-indigo-600 rounded-full animate-spin mx-auto shadow-sm" />
        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest italic text-center">Loading updates...</p>
      </div>
    </Layout>
  );

  return (
    <Layout>
      <div className="max-w-[1200px] mx-auto px-6 py-12 space-y-12 animate-in fade-in duration-700">
        <PageHeader
          title="Notifications"
          subtitle="Track project updates, company assignments, and system communications."
          icon="🔔"
          stats={[
            { label: 'Unread', value: unreadCount },
            { label: 'Invitations', value: invitations.length }
          ]}
          actions={unreadCount > 0 && (
            <button onClick={markAllAsRead} className="px-6 py-2.5 bg-indigo-600 text-white rounded-xl font-bold text-[10px] uppercase tracking-widest shadow-lg hover:bg-slate-900 transition-all active:scale-95">Mark all as Read</button>
          )}
        />

        <div className="space-y-16">
          {/* Invitations Section */}
          {invitations.length > 0 && (
            <section className="space-y-6">
              <div className="flex items-center gap-4 px-2">
                <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest">Active Invitations</span>
                <div className="flex-1 h-px bg-indigo-100" />
              </div>

              <div className="grid grid-cols-1 gap-6">
                {invitations.map(inv => (
                  <div key={inv._id} className="group bg-white p-8 rounded-3xl border border-indigo-100 shadow-sm hover:shadow-xl transition-all duration-300 relative overflow-hidden flex flex-col md:flex-row items-center gap-8">
                    <div className="w-20 h-20 rounded-2xl bg-slate-900 text-white flex items-center justify-center text-3xl font-bold italic shadow-lg shrink-0 border-4 border-white">
                      {inv.company?.name?.charAt(0)}
                    </div>

                    <div className="flex-1 min-w-0 text-center md:text-left space-y-4">
                      <div>
                        <h3 className="text-2xl font-bold text-slate-950 truncate group-hover:text-indigo-600 transition-colors uppercase italic">{inv.company?.name}</h3>
                        <p className="text-sm font-medium text-slate-500 mt-1 line-clamp-2 max-w-2xl">{inv.company?.description || 'Awaiting synchronization.'}</p>
                      </div>

                      <div className="flex flex-wrap justify-center md:justify-start gap-3">
                        {[
                          { label: 'Role', val: inv.designation, color: 'indigo' },
                          { label: 'Compensation', val: inv.salary > 0 ? `${currencySymbols[inv.company?.currency || 'USD']}${inv.salary.toLocaleString()}` : 'Negotiable', color: 'emerald' },
                          { label: 'Invited By', val: inv.invitedBy?.name, color: 'slate' }
                        ].map((stat, i) => (
                          <div key={i} className={`px-4 py-1.5 bg-${stat.color}-50 border border-${stat.color}-100 rounded-full flex items-center gap-2`}>
                            <span className={`text-[9px] font-bold text-${stat.color}-400 uppercase tracking-widest`}>{stat.label}:</span>
                            <span className={`text-[10px] font-bold text-${stat.color}-600 uppercase`}>{stat.val}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="flex flex-col gap-3 w-full md:w-48 shrink-0">
                      <button onClick={() => handleAcceptInvitation(inv._id)} disabled={processingInvitation === inv._id} className="w-full py-3 bg-indigo-600 text-white rounded-xl font-bold text-[10px] uppercase tracking-widest shadow-md hover:bg-slate-900 active:scale-95 transition-all disabled:opacity-50">Accept Join</button>
                      <button onClick={() => handleRejectInvitation(inv._id)} disabled={processingInvitation === inv._id} className="w-full py-3 bg-white text-rose-500 border border-rose-100 rounded-xl font-bold text-[10px] uppercase tracking-widest hover:bg-rose-50 transition-all">Decline</button>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Activity Stream */}
          <section className="space-y-6">
            <div className="flex items-center gap-4 px-2">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Recent Activity</span>
              <div className="flex-1 h-px bg-slate-100" />
            </div>

            <div className="space-y-4">
              {notifications.length > 0 ? (
                notifications.map(notif => {
                  const cfg = getConfig(notif.type);
                  return (
                    <div key={notif._id} onClick={() => handleNotifClick(notif)} className={`group relative p-6 rounded-3xl border transition-all duration-300 flex items-center gap-6 overflow-hidden cursor-pointer ${notif.isRead ? 'bg-white border-slate-100 opacity-60' : `bg-white border-indigo-100 shadow-sm hover:shadow-md hover:border-indigo-200`}`}>
                      {!notif.isRead && <div className="absolute left-0 top-0 w-1.5 h-full bg-indigo-600 shadow-md" />}
                      <div className={`w-14 h-14 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center text-2xl shadow-inner shrink-0 group-hover:scale-105 transition-all`}>
                        {cfg.icon}
                      </div>

                      <div className="flex-1 min-w-0 space-y-2 font-sans">
                        <div className="flex items-center gap-4 flex-wrap">
                          <span className={`text-[9px] font-bold uppercase tracking-widest px-3 py-1 rounded-full border border-current/10 bg-${cfg.color}-50 text-${cfg.color}-600`}> {cfg.label} </span>
                          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest bg-slate-100/50 px-3 py-1 rounded-full"> {timeAgo(notif.createdAt)} </span>
                        </div>
                        <h3 className={`text-lg font-bold tracking-tight ${notif.isRead ? 'text-slate-500' : 'text-slate-900'}`}> {notif.title} </h3>
                        <p className="text-[11px] font-medium text-slate-500 line-clamp-1 opacity-70"> {notif.message} </p>
                      </div>

                      <div className="flex gap-2 shrink-0 md:opacity-0 group-hover:opacity-100 transition-all translate-x-4 group-hover:translate-x-0" onClick={e => e.stopPropagation()}>
                        {!notif.isRead && <button onClick={e => { e.stopPropagation(); markAsRead(notif._id); }} className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center text-lg hover:bg-indigo-600 hover:text-white transition-all shadow-sm">✓</button>}
                        <button onClick={e => { e.stopPropagation(); deleteNotification(notif._id); }} disabled={deletingId === notif._id} className="w-10 h-10 rounded-xl bg-white border border-rose-100 text-rose-500 flex items-center justify-center text-lg hover:bg-rose-600 hover:text-white transition-all shadow-sm font-bold">🗑</button>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="p-20 bg-white rounded-3xl border border-dashed border-slate-200 text-center space-y-4">
                  <div className="text-6xl grayscale opacity-20">📭</div>
                  <h3 className="text-xl font-bold text-slate-400 uppercase tracking-widest">No New Notifications</h3>
                  <p className="text-[10px] font-bold text-slate-300 uppercase tracking-widest italic mt-2">All updates have been synchronized.</p>
                </div>
              )}
            </div>
          </section>
        </div>
      </div>
    </Layout>
  );
};

export default Notifications;
