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
  task_ready: { icon: '✅', color: '#10b981', bg: '#f0fdf4', label: 'Task Ready' },
  task_send_back: { icon: '↩️', color: '#f59e0b', bg: '#fffbeb', label: 'Sent Back' },
  task_role_handoff: { icon: '🔄', color: '#3b82f6', bg: '#eff6ff', label: 'Role Handoff' },
  task_role_assignment: { icon: '🎯', color: '#8b5cf6', bg: '#faf5ff', label: 'Role Assigned' },
  task_role_completed: { icon: '🏁', color: '#10b981', bg: '#f0fdf4', label: 'Role Completed' },
  project_assignment: { icon: '📁', color: '#06b6d4', bg: '#ecfeff', label: 'Project' },
  salary_update: { icon: '💰', color: '#22c55e', bg: '#f0fdf4', label: 'Salary Update' },
  role_change: { icon: '👤', color: '#6366f1', bg: '#eef2ff', label: 'Role Change' },
  general: { icon: '🔔', color: '#64748b', bg: '#f8fafc', label: 'General' },
  invitation: { icon: '✉️', color: '#3b82f6', bg: '#eff6ff', label: 'Invitation' },
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
        <div style={{ maxWidth: '900px', margin: '0 auto' }}>
          {/* Skeleton header */}
          <div style={{ background: 'linear-gradient(135deg, #667eea, #764ba2)', padding: '40px', borderRadius: '16px', marginBottom: '30px' }}>
            <div style={{ width: '200px', height: '32px', background: 'rgba(255,255,255,0.2)', borderRadius: '8px', marginBottom: '8px' }} />
            <div style={{ width: '120px', height: '18px', background: 'rgba(255,255,255,0.15)', borderRadius: '6px' }} />
          </div>
          {[1, 2, 3].map(i => (
            <div key={i} style={{ background: 'white', borderRadius: '12px', padding: '24px', marginBottom: '16px', boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
              <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: '#f1f5f9' }} />
                <div style={{ flex: 1 }}>
                  <div style={{ width: '60%', height: '16px', background: '#f1f5f9', borderRadius: '4px', marginBottom: '8px' }} />
                  <div style={{ width: '85%', height: '13px', background: '#f1f5f9', borderRadius: '4px' }} />
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
      <div style={{ maxWidth: '900px', margin: '0 auto' }}>

        {/* ── Header ── */}
        <div style={{
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          padding: '40px',
          borderRadius: '16px',
          marginBottom: '30px',
          boxShadow: '0 10px 40px rgba(102, 126, 234, 0.2)',
          color: 'white'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{
                width: '56px', height: '56px', borderRadius: '14px',
                background: 'rgba(255,255,255,0.2)', backdropFilter: 'blur(10px)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                border: '2px solid rgba(255,255,255,0.3)'
              }}>
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                  <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                </svg>
              </div>
              <div>
                <h1 style={{ margin: '0 0 4px 0', fontSize: '28px', fontWeight: '700' }}>Notifications</h1>
                <p style={{ margin: 0, fontSize: '15px', opacity: 0.9 }}>
                  {totalItems === 0 ? 'All caught up!' : `${totalItems} item${totalItems !== 1 ? 's' : ''}`}
                  {unreadNotifications > 0 && ` · ${unreadNotifications} unread`}
                </p>
              </div>
            </div>

            {unreadNotifications > 0 && (
              <button
                onClick={markAllAsRead}
                style={{
                  background: 'rgba(255,255,255,0.2)', border: '1px solid rgba(255,255,255,0.3)',
                  color: 'white', borderRadius: '10px', padding: '10px 20px',
                  cursor: 'pointer', fontSize: '14px', fontWeight: '600', backdropFilter: 'blur(10px)',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.3)'}
                onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.2)'}
              >
                ✓ Mark all as read
              </button>
            )}
          </div>
        </div>

        {/* ── Company Invitations ── */}
        {invitations.length > 0 && (
          <div style={{ marginBottom: '30px' }}>
            <h2 style={{ margin: '0 0 16px 0', fontSize: '18px', fontWeight: '700', color: '#1e293b', display: 'flex', alignItems: 'center', gap: '10px' }}>
              ✉️ Company Invitations
              <span style={{ background: '#3b82f6', color: 'white', borderRadius: '20px', padding: '2px 10px', fontSize: '12px', fontWeight: '700' }}>
                {invitations.length}
              </span>
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {invitations.map(inv => (
                <div key={inv._id} style={{
                  background: 'white', padding: '24px', borderRadius: '12px',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.08)', border: '1px solid #e2e8f0'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
                    <div style={{ flex: 1 }}>
                      <h3 style={{ margin: '0 0 6px 0', fontSize: '18px', fontWeight: '700', color: '#1e293b' }}>
                        {inv.company?.name}
                      </h3>
                      {inv.company?.description && (
                        <p style={{ margin: '0 0 12px 0', fontSize: '14px', color: '#64748b', lineHeight: '1.5' }}>
                          {inv.company.description}
                        </p>
                      )}
                      <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                        <span style={{ fontSize: '13px', color: '#64748b' }}>
                          🎭 Role: <strong style={{ color: '#1e293b' }}>{inv.designation}</strong>
                        </span>
                        {inv.salary > 0 && (
                          <span style={{ fontSize: '13px', color: '#64748b' }}>
                            💰 Salary: <strong style={{ color: '#10b981' }}>
                              {currencySymbols[inv.company?.currency || 'USD']}{inv.salary.toLocaleString()}
                            </strong>
                          </span>
                        )}
                        <span style={{ fontSize: '13px', color: '#64748b' }}>
                          👤 Invited by: <strong style={{ color: '#1e293b' }}>{inv.invitedBy?.name}</strong>
                        </span>
                      </div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '12px', paddingTop: '16px', borderTop: '1px solid #e2e8f0' }}>
                    <button
                      onClick={() => handleAcceptInvitation(inv._id)}
                      disabled={processingInvitation === inv._id}
                      style={{
                        flex: 1, padding: '12px',
                        background: processingInvitation === inv._id ? '#94a3b8' : 'linear-gradient(135deg, #10b981, #059669)',
                        color: 'white', border: 'none', borderRadius: '10px',
                        cursor: processingInvitation === inv._id ? 'not-allowed' : 'pointer',
                        fontWeight: '600', fontSize: '14px',
                        boxShadow: processingInvitation === inv._id ? 'none' : '0 4px 12px rgba(16,185,129,0.3)',
                        transition: 'all 0.2s'
                      }}
                    >
                      {processingInvitation === inv._id ? 'Processing...' : 'Accept Invitation'}
                    </button>
                    <button
                      onClick={() => handleRejectInvitation(inv._id)}
                      disabled={processingInvitation === inv._id}
                      style={{
                        flex: 1, padding: '12px', background: 'white', color: '#64748b',
                        border: '1px solid #e2e8f0', borderRadius: '10px',
                        cursor: processingInvitation === inv._id ? 'not-allowed' : 'pointer',
                        fontWeight: '600', fontSize: '14px', transition: 'all 0.2s',
                        opacity: processingInvitation === inv._id ? 0.5 : 1
                      }}
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
          <div style={{ marginBottom: '30px' }}>
            <h2 style={{ margin: '0 0 16px 0', fontSize: '18px', fontWeight: '700', color: '#1e293b', display: 'flex', alignItems: 'center', gap: '10px' }}>
              🔔 Notifications
              {unreadNotifications > 0 && (
                <span style={{ background: '#ef4444', color: 'white', borderRadius: '20px', padding: '2px 10px', fontSize: '12px', fontWeight: '700' }}>
                  {unreadNotifications} new
                </span>
              )}
            </h2>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {notifications.map(notif => {
                const cfg = getConfig(notif.type);
                const isTask = notif.relatedModel === 'Task' || notif.type?.startsWith('task_');
                return (
                  <div
                    key={notif._id}
                    onClick={() => handleNotifClick(notif)}
                    style={{
                      background: notif.isRead ? 'white' : cfg.bg,
                      padding: '18px 20px',
                      borderRadius: '12px',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
                      border: notif.isRead ? '1px solid #e2e8f0' : `1px solid ${cfg.color}30`,
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '14px',
                      cursor: isTask ? 'pointer' : 'default',
                      transition: 'all 0.2s',
                      position: 'relative'
                    }}
                    onMouseEnter={e => { if (isTask) e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.12)'; }}
                    onMouseLeave={e => e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.08)'}
                  >
                    {/* Unread dot */}
                    {!notif.isRead && (
                      <div style={{
                        position: 'absolute', top: '18px', right: '18px',
                        width: '8px', height: '8px', borderRadius: '50%',
                        background: cfg.color, boxShadow: `0 0 6px ${cfg.color}`
                      }} />
                    )}

                    {/* Icon */}
                    <div style={{
                      width: '46px', height: '46px', borderRadius: '12px',
                      background: cfg.bg, border: `1px solid ${cfg.color}30`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '22px', flexShrink: 0
                    }}>
                      {cfg.icon}
                    </div>

                    {/* Body */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px', flexWrap: 'wrap' }}>
                        <span style={{
                          fontSize: '11px', fontWeight: '700', textTransform: 'uppercase',
                          letterSpacing: '0.5px', color: cfg.color
                        }}>
                          {cfg.label}
                        </span>
                        <span style={{ fontSize: '12px', color: '#94a3b8' }}>
                          {timeAgo(notif.createdAt)}
                        </span>
                      </div>
                      <div style={{
                        fontSize: '15px', fontWeight: notif.isRead ? '500' : '700',
                        color: '#1e293b', marginBottom: '4px'
                      }}>
                        {notif.title}
                      </div>
                      <div style={{ fontSize: '13px', color: '#64748b', lineHeight: '1.5' }}>
                        {notif.message}
                      </div>
                      {isTask && (
                        <div style={{ fontSize: '12px', color: cfg.color, fontWeight: '600', marginTop: '6px' }}>
                          Click to view task →
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', flexShrink: 0 }} onClick={e => e.stopPropagation()}>
                      {!notif.isRead && (
                        <button
                          onClick={() => markAsRead(notif._id)}
                          title="Mark as read"
                          style={{
                            background: 'none', border: '1px solid #e2e8f0', borderRadius: '6px',
                            padding: '4px 8px', cursor: 'pointer', fontSize: '11px',
                            color: '#64748b', fontWeight: '500', transition: 'all 0.2s', whiteSpace: 'nowrap'
                          }}
                          onMouseEnter={e => { e.currentTarget.style.borderColor = cfg.color; e.currentTarget.style.color = cfg.color; }}
                          onMouseLeave={e => { e.currentTarget.style.borderColor = '#e2e8f0'; e.currentTarget.style.color = '#64748b'; }}
                        >
                          ✓ Read
                        </button>
                      )}
                      <button
                        onClick={() => deleteNotification(notif._id)}
                        disabled={deletingId === notif._id}
                        title="Delete"
                        style={{
                          background: 'none', border: '1px solid #fecaca', borderRadius: '6px',
                          padding: '4px 8px', cursor: deletingId === notif._id ? 'not-allowed' : 'pointer',
                          fontSize: '11px', color: '#ef4444', fontWeight: '500',
                          transition: 'all 0.2s', opacity: deletingId === notif._id ? 0.5 : 1
                        }}
                        onMouseEnter={e => { e.currentTarget.style.background = '#fee2e2'; }}
                        onMouseLeave={e => { e.currentTarget.style.background = 'none'; }}
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
          <div style={{
            background: 'white', padding: '60px', borderRadius: '16px',
            textAlign: 'center', boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
            border: '1px solid #e2e8f0'
          }}>
            <div style={{ fontSize: '64px', marginBottom: '20px' }}>🎉</div>
            <h3 style={{ margin: '0 0 12px 0', fontSize: '20px', fontWeight: '600', color: '#1e293b' }}>
              All Caught Up!
            </h3>
            <p style={{ margin: 0, fontSize: '15px', color: '#64748b' }}>
              You have no new notifications at this time.
            </p>
          </div>
        )}

      </div>
    </Layout>
  );
};

export default Notifications;
