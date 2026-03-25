import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../context/ToastContext';
import { useSocket } from '../context/SocketContext';
import { getCookie } from '../utils/cookies';
import Layout from './Layout';
import PageHeader from './PageHeader';

const currencySymbols = { USD: '$', EUR: '€', GBP: '£', JPY: '¥', INR: '₹', BDT: '৳' };

const typeConfig = {
  task_ready: { icon: '✅', color: 'indigo-500', label: 'DIRECTIVE_READY' },
  task_send_back: { icon: '↩️', color: 'rose-500', label: 'LOG_REVERTED' },
  task_role_handoff: { icon: '🔄', color: 'emerald-500', label: 'PROTOCOL_HANDOFF' },
  task_role_assignment: { icon: '🎯', color: 'indigo-600', label: 'ROLE_ASSIGNED' },
  task_role_completed: { icon: '🏁', color: 'emerald-600', label: 'UNIT_COMPLETED' },
  project_assignment: { icon: '📁', color: 'slate-950', label: 'SECTOR_PROJECT' },
  salary_update: { icon: '💰', color: 'emerald-500', label: 'COMP_UPDATE' },
  role_change: { icon: '👤', color: 'indigo-500', label: 'AUTH_SHIFT' },
  general: { icon: '🔔', color: 'slate-400', label: 'SYSTEM_LOG' },
  invitation: { icon: '✉️', color: 'indigo-600', label: 'NEXUS_INVITE' },
};

const getConfig = (type) => typeConfig[type] || typeConfig.general;

function timeAgo(dateStr) {
  if (!dateStr) return '';
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'REAL_TIME';
  if (mins < 60) return `${mins}M_AGO`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}H_AGO`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}D_AGO`;
  return new Date(dateStr).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }).toUpperCase();
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
    } catch (err) { console.error('Core_Log_Query_Error', err); }
    finally { setLoading(false); }
  };

  const handleAcceptInvitation = async (id) => {
    setProcessingInvitation(id);
    try {
      const res = await fetch(`/api/invitations/${id}/accept`, { method: 'POST', headers: authHeaders() });
      if (res.ok) { toast?.success?.('Invitation protocol verified!'); setTimeout(() => window.location.reload(), 1500); }
      else { toast?.error?.((await res.json()).message || 'Auth failure'); }
    } catch { toast?.error?.('Auth failure during nexus handshake'); }
    finally { setProcessingInvitation(null); }
  };

  const handleRejectInvitation = async (id) => {
    setProcessingInvitation(id);
    try {
      const res = await fetch(`/api/invitations/${id}/reject`, { method: 'POST', headers: authHeaders() });
      if (res.ok) { toast?.success?.('Invitation purged'); fetchAll(); }
      else toast?.error?.('Purge failed');
    } catch { toast?.error?.('Expunge directive failed'); }
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
      toast?.success?.('All nodes synchronized');
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
    const taskId = notif.metadata?.taskId || notif.relatedId;
    if (taskId && (notif.relatedModel === 'Task' || notif.type?.startsWith('task_'))) {
      navigate(`/my-tasks/${taskId}`);
    }
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;

  if (loading) return (
    <Layout>
      <div className="max-w-6xl mx-auto px-10 py-16 animate-pulse space-y-16">
        <div className="h-48 bg-slate-950 rounded-[4rem] w-full" />
        <div className="space-y-8">
          {[1, 2, 3, 4].map(i => <div key={i} className="h-32 bg-white rounded-[3rem] border border-slate-50" />)}
        </div>
      </div>
    </Layout>
  );

  return (
    <Layout>
      <div className="max-w-[1400px] mx-auto px-10 py-16 space-y-16 animate-in fade-in duration-1000">
        <PageHeader
          title="ALERT_LOG_REGISTRY"
          subtitle="System-wide operational updates and personnel nexus invitations."
          icon={<div className="w-16 h-16 bg-slate-950 text-white rounded-full flex items-center justify-center text-3xl shadow-24 border-4 border-white/10 italic">🔔</div>}
          stats={[{ label: 'UNOBSERVED_NODES', value: unreadCount }, { label: 'NEXUS_PROPOSALS', value: invitations.length }]}
          actions={unreadCount > 0 && (
            <button onClick={markAllAsRead} className="px-12 py-5 bg-slate-950 text-white rounded-[2.5rem] font-black text-[10px] uppercase tracking-[0.4em] shadow-24 hover:bg-black transition-all active:scale-95 italic">FLUSH_BUFFER_REGISTRY</button>
          )}
        />

        <div className="space-y-20">
          {/* Invitations Section */}
          {invitations.length > 0 && (
            <section className="space-y-10">
              <div className="flex items-center gap-6 px-4">
                <span className="text-[10px] font-black text-indigo-600 uppercase tracking-[0.5em] italic">CRITICAL_AMBASSADOR_SIGNALS</span>
                <div className="flex-1 h-px bg-indigo-100" />
              </div>

              <div className="grid grid-cols-1 gap-8">
                {invitations.map(inv => (
                  <div key={inv._id} className="group/inv bg-white p-12 rounded-[4.5rem] border border-indigo-100 shadow-24 shadow-indigo-600/5 hover:shadow-indigo-600/10 transition-all duration-700 relative overflow-hidden flex flex-col xl:flex-row items-center gap-12">
                    <div className="w-28 h-28 rounded-[3rem] bg-slate-950 text-white flex items-center justify-center text-4xl font-black italic shadow-24 group-hover/inv:rotate-6 transition-all duration-1000 shrink-0 border-4 border-white">
                      {inv.company?.name?.charAt(0)}
                    </div>

                    <div className="flex-1 min-w-0 text-center xl:text-left space-y-6">
                      <div>
                        <h3 className="text-3xl font-black text-slate-950 uppercase italic tracking-tighter group-hover/inv:text-indigo-600 transition-colors">{inv.company?.name} <span className="text-[10px] font-black text-slate-400 opacity-40 ml-4 tracking-[0.2em]">#{inv.company?._id?.slice(-8).toUpperCase()}</span></h3>
                        <p className="text-xs font-semibold text-slate-500 italic mt-3 uppercase tracking-widest opacity-60 leading-relaxed max-w-2xl">{inv.company?.description || 'MISSION_DIRECTIVES_PENDING_HANDSHAKE'}</p>
                      </div>

                      <div className="flex flex-wrap justify-center xl:justify-start gap-4">
                        {[
                          { label: 'AUTH_ROLE', val: inv.designation, color: 'indigo' },
                          { label: 'ALLOC_COMP', val: inv.salary > 0 ? `${currencySymbols[inv.company?.currency || 'USD']}${inv.salary.toLocaleString()}` : 'N/A', color: 'emerald' },
                          { label: 'AGENT_ID', val: inv.invitedBy?.name?.toUpperCase(), color: 'slate' }
                        ].map((stat, i) => (
                          <div key={i} className={`px-6 py-3 bg-${stat.color}-50/50 border border-${stat.color}-100 rounded-2xl flex items-center gap-4`}>
                            <span className={`text-[9px] font-black text-${stat.color}-400 uppercase tracking-widest italic`}>{stat.label}:</span>
                            <span className={`text-[11px] font-black text-${stat.color}-600 uppercase italic`}>{stat.val}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="flex flex-col gap-4 w-full xl:w-60">
                      <button onClick={() => handleAcceptInvitation(inv._id)} disabled={processingInvitation === inv._id} className="w-full py-5 bg-indigo-600 text-white rounded-[2rem] font-black text-[10px] uppercase tracking-[0.3em] shadow-24 hover:bg-indigo-700 active:scale-95 transition-all disabled:opacity-50 italic">ACCEPT_NEXUS</button>
                      <button onClick={() => handleRejectInvitation(inv._id)} disabled={processingInvitation === inv._id} className="w-full py-5 bg-white text-rose-500 border-2 border-rose-100 rounded-[2rem] font-black text-[10px] uppercase tracking-[0.3em] hover:bg-rose-50 hover:border-rose-200 active:scale-95 transition-all italic">ABORT_SIGNAL</button>
                    </div>
                    <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/5 rounded-full blur-[100px] pointer-events-none" />
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Operational Logs */}
          <section className="space-y-10">
            <div className="flex items-center gap-6 px-4">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.5em] italic">TERMINAL_ACTIVITY_STREAM</span>
              <div className="flex-1 h-px bg-slate-100" />
            </div>

            <div className="space-y-6">
              {notifications.length > 0 ? (
                notifications.map(notif => {
                  const cfg = getConfig(notif.type);
                  const isTask = notif.relatedModel === 'Task' || notif.type?.startsWith('task_');
                  return (
                    <div key={notif._id} onClick={() => handleNotifClick(notif)} className={`group relative p-10 rounded-[3.5rem] border transition-all duration-700 flex items-center gap-10 overflow-hidden ${notif.isRead ? 'bg-white border-slate-100 shadow-sm opacity-60 grayscale hover:grayscale-0 hover:opacity-100' : `bg-white border-${cfg.color}/20 shadow-24 shadow-${cfg.color}/5 hover:border-${cfg.color}/40`}`}>
                      {!notif.isRead && <div className="absolute left-0 top-0 w-2.5 h-full bg-indigo-600 shadow-[0_0_20px_rgba(79,70,229,0.5)] animate-pulse" />}
                      <div className={`w-20 h-20 rounded-[2rem] bg-slate-50 border border-slate-100 flex items-center justify-center text-4xl shadow-inner shrink-0 group-hover:scale-110 group-hover:-rotate-6 transition-all duration-1000 ${notif.isRead ? '' : 'bg-white group-hover:shadow-24'}`}>
                        {cfg.icon}
                      </div>

                      <div className="flex-1 min-w-0 space-y-4">
                        <div className="flex items-center gap-6 flex-wrap">
                          <span className={`text-[9px] font-black uppercase tracking-[0.4em] italic px-5 py-1.5 rounded-xl border border-current/10 bg-slate-50 text-${cfg.color}`}> {cfg.label} </span>
                          <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest bg-slate-100/50 px-4 py-1.5 rounded-xl italic"> {timeAgo(notif.createdAt)} </span>
                        </div>
                        <h3 className={`text-xl font-black uppercase italic tracking-tighter ${notif.isRead ? 'text-slate-500' : 'text-slate-950'}`}> {notif.title} </h3>
                        <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] italic opacity-60 line-clamp-1 max-w-4xl"> {notif.message} </p>
                      </div>

                      <div className="flex gap-4 shrink-0 opacity-0 group-hover:opacity-100 transition-all duration-700 translate-x-10 group-hover:translate-x-0" onClick={e => e.stopPropagation()}>
                        {!notif.isRead && <button onClick={e => { e.stopPropagation(); markAsRead(notif._id); }} className="w-14 h-14 rounded-2xl bg-indigo-600 text-white flex items-center justify-center text-2xl shadow-24 hover:bg-black transition-all">✓</button>}
                        <button onClick={e => { e.stopPropagation(); deleteNotification(notif._id); }} disabled={deletingId === notif._id} className="w-14 h-14 rounded-2xl bg-white border-2 border-rose-100 text-rose-500 flex items-center justify-center text-2xl shadow-sm hover:bg-rose-500 hover:text-white transition-all">🗑</button>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="p-40 bg-white rounded-[5rem] border-4 border-dashed border-slate-100 text-center space-y-12 animate-in zoom-in-95 group">
                  <div className="text-9xl grayscale opacity-10 group-hover:scale-110 transition-transform duration-1000 inline-block">🛰️</div>
                  <div>
                    <h3 className="text-4xl font-black text-slate-950 uppercase italic tracking-tighter">QUIESCENT_VOID_STABLE</h3>
                    <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.6em] italic mt-6">PERIMETER_CLEAR // BACKGROUND_SURVEILLANCE_ACTIVE</p>
                  </div>
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
