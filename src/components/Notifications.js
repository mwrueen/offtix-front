import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../context/ToastContext';
import { useSocket } from '../context/SocketContext';
import { getCookie } from '../utils/cookies';
import Layout from './Layout';

// ─── helpers ─────────────────────────────────────────────────────────────────

const currencySymbols = {
  USD: '$', EUR: '€', GBP: '£', JPY: '¥', AUD: 'A$', CAD: 'C$',
  CHF: 'CHF', CNY: '¥', INR: '₹', SGD: 'S$', HKD: 'HK$', NZD: 'NZ$',
  SEK: 'kr', NOK: 'kr', DKK: 'kr', MXN: 'MX$', BRL: 'R$', ZAR: 'R',
  AED: 'د.إ', SAR: '﷼'
};

const typeConfig = {
  task_ready: { icon: '✅', color: 'text-emerald-500', bg: 'bg-emerald-50', label: 'Task Ready' },
  task_send_back: { icon: '↩️', color: 'text-amber-500', bg: 'bg-amber-50', label: 'Sent Back' },
  task_role_handoff: { icon: '🔄', color: 'text-blue-500', bg: 'bg-blue-50', label: 'Role Handoff' },
  task_role_assignment: { icon: '🎯', color: 'text-violet-500', bg: 'bg-violet-50', label: 'Role Assigned' },
  task_role_completed: { icon: '🏁', color: 'text-emerald-500', bg: 'bg-emerald-50', label: 'Role Completed' },
  project_assignment: { icon: '📁', color: 'text-cyan-500', bg: 'bg-cyan-50', label: 'Project' },
  salary_update: { icon: '💰', color: 'text-green-500', bg: 'bg-green-50', label: 'Salary Update' },
  role_change: { icon: '👤', color: 'text-indigo-500', bg: 'bg-indigo-50', label: 'Role Change' },
  general: { icon: '🔔', color: 'text-slate-500', bg: 'bg-slate-50', label: 'General' },
  invitation: { icon: '✉️', color: 'text-blue-500', bg: 'bg-blue-50', label: 'Invitation' },
};

const getConfig = (type) => typeConfig[type] || typeConfig.general;

function timeAgo(dateStr) {
  if (!dateStr) return '';
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString();
}

// ─── component ───────────────────────────────────────────────────────────────

const Notifications = () => {
  const toast = useToast();
  const navigate = useNavigate();
  const { clearUnreadCount } = useSocket();

  const [invitations, setInvitations] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processingInvitation, setProcessingInvitation] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  // On mount: fetch data and clear badge
  useEffect(() => {
    fetchAll();
    clearUnreadCount();
  }, [clearUnreadCount]);

  const authHeaders = () => ({
    Authorization: `Bearer ${getCookie('authToken')}`,
    'Content-Type': 'application/json',
  });

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
    } catch (err) {
      console.error('Error fetching notifications:', err);
    } finally {
      setLoading(false);
    }
  };

  // ── Invitation actions ────────────────────────────────────────────────────
  const handleAcceptInvitation = async (id) => {
    setProcessingInvitation(id);
    try {
      const res = await fetch(`/api/invitations/${id}/accept`, { method: 'POST', headers: authHeaders() });
      if (res.ok) {
        toast?.showToast?.('Invitation accepted!', 'success');
        setTimeout(() => window.location.reload(), 1500);
      } else {
        toast?.showToast?.((await res.json()).message || 'Failed to accept', 'error');
      }
    } catch {
      toast?.showToast?.('Failed to accept invitation', 'error');
    } finally {
      setProcessingInvitation(null);
    }
  };

  const handleRejectInvitation = async (id) => {
    setProcessingInvitation(id);
    try {
      const res = await fetch(`/api/invitations/${id}/reject`, { method: 'POST', headers: authHeaders() });
      if (res.ok) { toast?.showToast?.('Invitation declined', 'success'); fetchAll(); }
      else toast?.showToast?.('Failed to decline', 'error');
    } catch {
      toast?.showToast?.('Failed to decline invitation', 'error');
    } finally {
      setProcessingInvitation(null);
    }
  };

  // ── Notification actions ──────────────────────────────────────────────────
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
      toast?.showToast?.('All marked as read', 'success');
    } catch { }
  };

  const deleteNotification = async (id) => {
    setDeletingId(id);
    try {
      const res = await fetch(`/api/notifications/${id}`, { method: 'DELETE', headers: authHeaders() });
      if (res.ok) setNotifications(prev => prev.filter(n => n._id !== id));
    } catch { } finally {
      setDeletingId(null);
    }
  };

  const handleNotifClick = (notif) => {
    if (!notif.isRead) markAsRead(notif._id);
    const taskId = notif.metadata?.taskId || notif.relatedId;
    if (taskId && (notif.relatedModel === 'Task' || notif.type?.startsWith('task_'))) {
      navigate(`/my-tasks/${taskId}`);
    }
  };

  const unreadNotifications = notifications.filter(n => !n.isRead).length;

  if (loading) {
    return (
      <Layout>
        <div className="max-w-4xl mx-auto px-4 py-8">
          {/* Skeleton header */}
          <div className="bg-gradient-to-br from-indigo-500 to-purple-600 p-10 rounded-2xl mb-8 animate-pulse">
            <div className="w-48 h-8 bg-white/20 rounded-lg mb-2" />
            <div className="w-32 h-4 bg-white/10 rounded-md" />
          </div>
          {[1, 2, 3].map(i => (
            <div key={i} className="bg-white rounded-xl p-6 mb-4 shadow-sm border border-slate-100 animate-pulse">
              <div className="flex gap-4 items-center">
                <div className="w-12 h-12 rounded-xl bg-slate-50" />
                <div className="flex-1">
                  <div className="w-3/5 h-4 bg-slate-50 rounded mb-2" />
                  <div className="w-4/5 h-3 bg-slate-50 rounded" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </Layout>
    );
  }

  const totalItems = invitations.length + notifications.length;

  return (
    <Layout>
      <div className="max-w-4xl mx-auto px-4 py-8">

        {/* ── Header ── */}
        <div className="bg-gradient-to-br from-indigo-500 to-purple-600 p-10 rounded-2xl mb-8 shadow-xl shadow-indigo-200/50 text-white">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center border-2 border-white/30">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                  <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                </svg>
              </div>
              <div>
                <h1 className="m-0 text-3xl font-bold">Notifications</h1>
                <p className="m-0 text-indigo-50/80">
                  {totalItems === 0 ? 'All caught up!' : `${totalItems} item${totalItems !== 1 ? 's' : ''}`}
                  {unreadNotifications > 0 && ` · ${unreadNotifications} unread`}
                </p>
              </div>
            </div>

            {unreadNotifications > 0 && (
              <button
                onClick={markAllAsRead}
                className="bg-white/20 border border-white/30 text-white rounded-xl px-5 py-2.5 cursor-pointer text-sm font-semibold backdrop-blur-md hover:bg-white/30 transition-all active:scale-95"
              >
                ✓ Mark all as read
              </button>
            )}
          </div>
        </div>

        {/* ── Company Invitations ── */}
        {invitations.length > 0 && (
          <div className="mb-8">
            <h2 className="m-0 mb-4 text-xl font-bold text-slate-800 flex items-center gap-2.5">
              ✉️ Company Invitations
              <span className="bg-blue-500 text-white rounded-full px-2.5 py-0.5 text-xs font-bold">
                {invitations.length}
              </span>
            </h2>
            <div className="flex flex-col gap-4">
              {invitations.map(inv => (
                <div key={inv._id} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                  <div className="flex justify-between items-start mb-4 flex-wrap gap-3">
                    <div className="flex-1">
                      <h3 className="m-0 mb-1.5 text-xl font-bold text-slate-800">
                        {inv.company?.name}
                      </h3>
                      {inv.company?.description && (
                        <p className="m-0 mb-3 text-sm text-slate-500 leading-relaxed">
                          {inv.company.description}
                        </p>
                      )}
                      <div className="flex gap-4 flex-wrap text-sm text-slate-500">
                        <span>
                          🎭 Role: <strong className="text-slate-800">{inv.designation}</strong>
                        </span>
                        {inv.salary > 0 && (
                          <span>
                            💰 Salary: <strong className="text-emerald-500">
                              {currencySymbols[inv.company?.currency || 'USD']}{inv.salary.toLocaleString()}
                            </strong>
                          </span>
                        )}
                        <span>
                          👤 Invited by: <strong className="text-slate-800">{inv.invitedBy?.name}</strong>
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-3 pt-4 border-t border-slate-100">
                    <button
                      onClick={() => handleAcceptInvitation(inv._id)}
                      disabled={processingInvitation === inv._id}
                      className={`flex-1 py-3 bg-gradient-to-br from-emerald-400 to-emerald-600 text-white border-none rounded-xl font-semibold text-sm shadow-lg shadow-emerald-100 transition-all ${processingInvitation === inv._id ? 'opacity-50 cursor-not-allowed grayscale' : 'hover:shadow-emerald-200 cursor-pointer active:scale-95'}`}
                    >
                      {processingInvitation === inv._id ? 'Processing...' : 'Accept Invitation'}
                    </button>
                    <button
                      onClick={() => handleRejectInvitation(inv._id)}
                      disabled={processingInvitation === inv._id}
                      className={`flex-1 py-3 bg-white text-slate-600 border border-slate-200 rounded-xl font-semibold text-sm shadow-sm transition-all ${processingInvitation === inv._id ? 'opacity-50 cursor-not-allowed' : 'hover:bg-slate-50 hover:border-slate-300 cursor-pointer active:scale-95'}`}
                    >
                      Decline
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Task & System Notifications ── */}
        {notifications.length > 0 && (
          <div className="mb-8">
            <h2 className="m-0 mb-4 text-xl font-bold text-slate-800 flex items-center gap-2.5">
              🔔 Notifications
              {unreadNotifications > 0 && (
                <span className="bg-red-500 text-white rounded-full px-2.5 py-0.5 text-xs font-bold">
                  {unreadNotifications} new
                </span>
              )}
            </h2>

            <div className="flex flex-col gap-2.5">
              {notifications.map(notif => {
                const cfg = getConfig(notif.type);
                const isTask = notif.relatedModel === 'Task' || notif.type?.startsWith('task_');
                return (
                  <div
                    key={notif._id}
                    onClick={() => handleNotifClick(notif)}
                    className={`${notif.isRead ? 'bg-white border-slate-200' : `${cfg.bg} border-current/20 shadow-sm`} p-5 rounded-2xl shadow-sm border flex items-start gap-4 transition-all relative ${isTask ? 'cursor-pointer hover:shadow-md hover:border-slate-300' : 'cursor-default'}`}
                  >
                    {/* Unread dot */}
                    {!notif.isRead && (
                      <div className={`absolute top-5 right-5 w-2 h-2 rounded-full ${cfg.bg.replace('bg-', 'bg-') || 'bg-blue-500'} ${cfg.color} shadow-lg`} style={{ boxShadow: `0 0 10px currentColor` }} />
                    )}

                    {/* Icon */}
                    <div className={`${cfg.bg} border border-current/10 w-12 h-12 rounded-xl flex items-center justify-center text-2xl shrink-0 transition-transform group-hover:scale-110`}>
                      {cfg.icon}
                    </div>

                    {/* Body */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className={`text-[10px] font-bold uppercase tracking-wider ${cfg.color}`}>
                          {cfg.label}
                        </span>
                        <span className="text-xs text-slate-400">
                          {timeAgo(notif.createdAt)}
                        </span>
                      </div>
                      <div className={`text-base font-bold text-slate-800 mb-1 ${notif.isRead ? 'font-semibold' : 'font-bold'}`}>
                        {notif.title}
                      </div>
                      <div className="text-sm text-slate-500 leading-relaxed">
                        {notif.message}
                      </div>
                      {isTask && (
                        <div className={`text-xs ${cfg.color} font-bold mt-2 hover:underline inline-flex items-center gap-1`}>
                          View task details <span className="text-[14px]">→</span>
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col gap-1.5 shrink-0" onClick={e => e.stopPropagation()}>
                      {!notif.isRead && (
                        <button
                          onClick={() => markAsRead(notif._id)}
                          title="Mark as read"
                          className={`bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 cursor-pointer text-[10px] text-slate-500 font-bold transition-all hover:bg-slate-50 hover:border-slate-300 hover:${cfg.color} active:scale-95 whitespace-nowrap`}
                        >
                          ✓ Read
                        </button>
                      )}
                      <button
                        onClick={() => deleteNotification(notif._id)}
                        disabled={deletingId === notif._id}
                        title="Delete"
                        className={`bg-white border border-red-100 rounded-lg px-2.5 py-1.5 cursor-pointer text-xs text-red-500 font-bold transition-all hover:bg-red-50 hover:border-red-200 active:scale-95 ${deletingId === notif._id ? 'opacity-50 cursor-not-allowed' : ''}`}
                      >
                        {deletingId === notif._id ? '…' : '🗑'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ── Empty State ── */}
        {totalItems === 0 && (
          <div className="bg-white p-16 rounded-3xl text-center shadow-sm border border-slate-100">
            <div className="text-7xl mb-6 grayscale opacity-80">🎉</div>
            <h3 className="m-0 mb-3 text-2xl font-bold text-slate-800">
              All Caught Up!
            </h3>
            <p className="m-0 text-base text-slate-500">
              You have no new notifications at this time.
            </p>
          </div>
        )}

      </div>
    </Layout>
  );
};

export default Notifications;
