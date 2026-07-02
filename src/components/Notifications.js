import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../context/ToastContext';
import { useSocket } from '../context/SocketContext';
import { getCookie } from '../utils/cookies';
import Layout from './Layout';
import { getCurrencySymbol } from '../utils/currency';

import { getTypeLabel, timeAgo } from '../utils/notifications';

const Notifications = () => {
  const toast = useToast();
  const navigate = useNavigate();
  const { clearUnreadCount, resetAllUnreadCounts } = useSocket();

  const [invitations, setInvitations] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState(null);

  useEffect(() => {
    fetchAll();
    clearUnreadCount();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clearUnreadCount]);

  const authHeaders = () => ({ Authorization: `Bearer ${getCookie('authToken')}`, 'Content-Type': 'application/json' });

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [invRes, notifRes] = await Promise.all([
        fetch('/api/invitations/my-invitations', { headers: authHeaders() }),
        fetch('/api/notifications', { headers: authHeaders() }),
      ]);
      let invs = [];
      if (invRes.ok) invs = await invRes.json();
      setInvitations(Array.isArray(invs) ? invs : []);

      if (notifRes.ok) {
        const data = await notifRes.json();
        const notifs = data.notifications || [];
        const pendingIds = new Set((Array.isArray(invs) ? invs : []).map((i) => String(i._id)));
        const filtered = notifs.filter(
          (n) =>
            !(
              n.type === 'invitation' &&
              n.relatedId &&
              pendingIds.has(String(n.relatedId))
            )
        );
        setNotifications(filtered);
      }
    } catch (err) {
      console.error('Error fetching notifications', err);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (id) => {
    try {
      await fetch(`/api/notifications/${id}/read`, { method: 'PUT', headers: authHeaders() });
      setNotifications((prev) => prev.map((n) => (n._id === id ? { ...n, isRead: true } : n)));
    } catch { /* ignore */ }
  };

  const markAllAsRead = async () => {
    try {
      await fetch('/api/notifications/mark-all-read', { method: 'PUT', headers: authHeaders() });
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      resetAllUnreadCounts();
      toast?.success?.('All marked as read.');
    } catch { /* ignore */ }
  };

  const deleteNotification = async (id) => {
    setDeletingId(id);
    try {
      const res = await fetch(`/api/notifications/${id}`, { method: 'DELETE', headers: authHeaders() });
      if (res.ok) setNotifications((prev) => prev.filter((n) => n._id !== id));
    } catch { /* ignore */ } finally {
      setDeletingId(null);
    }
  };

  const handleNotifClick = (notif) => {
    if (!notif.isRead) markAsRead(notif._id);

    if (notif.type === 'invitation' && notif.relatedId &&
      (notif.relatedModel === 'Invitation' || !notif.relatedModel)) {
      navigate(`/invitations/${notif.relatedId}`);
      return;
    }

    if (notif.type === 'job_offer' && notif.relatedId) {
      navigate(`/recruitment/offer/${notif.relatedId}`);
      return;
    }

    if (notif.type === 'job_application' && notif.relatedId) {
      navigate(`/recruitment/applications/${notif.relatedId}`);
      return;
    }

    const taskId = notif.metadata?.taskId || notif.relatedId;
    if (taskId && (notif.relatedModel === 'Task' || notif.type?.startsWith('task_'))) {
      navigate(`/my-tasks/${taskId}`);
    }
  };

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  if (loading) {
    return (
      <Layout>
        <div className="mx-auto max-w-3xl px-4 py-20 flex flex-col items-center text-slate-600">
          <div className="h-9 w-9 rounded-full border-2 border-slate-200 border-t-indigo-600 animate-spin" />
          <p className="mt-4 text-sm">Loading notifications…</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="mx-auto max-w-3xl px-4 py-10 pb-20">
        <header className="mb-10 flex flex-col gap-4 border-b border-slate-200 pb-8 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Notifications</h1>
            <p className="mt-1 text-sm text-slate-600">
              Invitations and updates for your account.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            {(unreadCount > 0 || invitations.length > 0) && (
              <span className="text-xs text-slate-500">
                {invitations.length > 0 && `${invitations.length} pending invite${invitations.length === 1 ? '' : 's'}`}
                {invitations.length > 0 && unreadCount > 0 && ' · '}
                {unreadCount > 0 && `${unreadCount} unread`}
              </span>
            )}
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={markAllAsRead}
                className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                Mark all read
              </button>
            )}
          </div>
        </header>

        {invitations.length > 0 && (
          <section className="mb-12">
            <h2 className="mb-4 text-sm font-medium text-slate-900">Pending invitations</h2>
            <ul className="space-y-3">
              {invitations.map((inv) => {
                const sym = getCurrencySymbol(inv.company?.currency || 'USD');
                const salaryLine = inv.salary > 0
                  ? `${sym}${Number(inv.salary).toLocaleString()} per year`
                  : 'Salary negotiable';
                return (
                  <li
                    key={inv._id}
                    className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm"
                  >
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Company</p>
                        <p className="mt-0.5 truncate text-base font-semibold text-slate-900">
                          {inv.company?.name || 'Organization'}
                        </p>
                        <p className="mt-2 text-sm text-slate-600 line-clamp-2">
                          {inv.company?.description?.trim() || 'No company summary on file.'}
                        </p>
                        <dl className="mt-3 flex flex-wrap gap-x-6 gap-y-1 text-sm text-slate-600">
                          <div>
                            <dt className="inline text-slate-500">Role: </dt>
                            <dd className="inline font-medium text-slate-800">{inv.designation}</dd>
                          </div>
                          <div>
                            <dt className="inline text-slate-500">Compensation: </dt>
                            <dd className="inline font-medium text-slate-800">{salaryLine}</dd>
                          </div>
                          {inv.invitedBy?.name && (
                            <div>
                              <dt className="inline text-slate-500">Invited by: </dt>
                              <dd className="inline font-medium text-slate-800">{inv.invitedBy.name}</dd>
                            </div>
                          )}
                        </dl>
                      </div>
                      <button
                        type="button"
                        onClick={() => navigate(`/invitations/${inv._id}`)}
                        className="shrink-0 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 sm:min-w-[160px]"
                      >
                        View offer details
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>
          </section>
        )}

        <section>
          <h2 className="mb-4 text-sm font-medium text-slate-900">Activity</h2>
          {notifications.length > 0 ? (
            <ul className="divide-y divide-slate-100 rounded-lg border border-slate-200 bg-white shadow-sm">
              {notifications.map((notif) => {
                const label = getTypeLabel(notif.type);
                return (
                  <li key={notif._id}>
                    <div
                      role="button"
                      tabIndex={0}
                      onClick={() => handleNotifClick(notif)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          handleNotifClick(notif);
                        }
                      }}
                      className={`flex cursor-pointer items-start gap-4 px-4 py-4 text-left transition-colors hover:bg-slate-50 ${
                        !notif.isRead ? 'bg-indigo-50/40' : ''
                      }`}
                    >
                      {!notif.isRead && (
                        <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-indigo-600" aria-hidden />
                      )}
                      {notif.isRead && <span className="mt-1.5 w-2 shrink-0" aria-hidden />}
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="rounded bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">
                            {label}
                          </span>
                          <span className="text-xs text-slate-400">{timeAgo(notif.createdAt)}</span>
                        </div>
                        <p className="mt-1 font-medium text-slate-900">{notif.title}</p>
                        <p className="mt-0.5 text-sm text-slate-600 line-clamp-2">{notif.message}</p>
                      </div>
                      <div className="flex shrink-0 gap-2 pt-0.5" onClick={(e) => e.stopPropagation()}>
                        {!notif.isRead && (
                          <button
                            type="button"
                            onClick={() => markAsRead(notif._id)}
                            className="rounded px-2 py-1 text-xs font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                          >
                            Mark read
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => deleteNotification(notif._id)}
                          disabled={deletingId === notif._id}
                          className="rounded px-2 py-1 text-xs font-medium text-slate-500 hover:bg-rose-50 hover:text-rose-700 disabled:opacity-50"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          ) : (
            <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50/50 px-6 py-14 text-center">
              <p className="text-sm font-medium text-slate-700">No other notifications</p>
              <p className="mt-1 text-sm text-slate-500">
                Task updates, offers, and alerts will appear here.
              </p>
            </div>
          )}
        </section>
      </div>
    </Layout>
  );
};

export default Notifications;
