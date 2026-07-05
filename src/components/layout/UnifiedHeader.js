import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useCompany } from '../../context/CompanyContext';
import { useSocket } from '../../context/SocketContext';
import { useChat } from '../../context/ChatContext';
import { getCookie } from '../../utils/cookies';
import { getAssetUrl } from '../../services/api';
import { getTypeLabel, timeAgo } from '../../utils/notifications';

const UnifiedHeader = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { state, dispatch } = useAuth();
    const { state: companyState, selectCompany } = useCompany();
    const { totalUnreadCount } = useSocket();
    const { unreadCounts, toggleGlobalChat } = useChat();

    const [isCompanyOpen, setIsCompanyOpen] = useState(false);
    const [isNotifOpen, setIsNotifOpen] = useState(false);
    const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
    const [recentNotifs, setRecentNotifs] = useState([]);
    const [notifLoading, setNotifLoading] = useState(false);

    const compRef = useRef(null);
    const notifRef = useRef(null);
    const userRef = useRef(null);

    const { isAuthenticated, user } = state;
    const selectedCompany = companyState.selectedCompany;
    const isPersonal = selectedCompany?.id === 'personal';

    const getLogoUrl = getAssetUrl;

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (compRef.current && !compRef.current.contains(event.target)) setIsCompanyOpen(false);
            if (notifRef.current && !notifRef.current.contains(event.target)) setIsNotifOpen(false);
            if (userRef.current && !userRef.current.contains(event.target)) setIsUserMenuOpen(false);
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const fetchNotifs = async () => {
        setNotifLoading(true);
        try {
            const token = getCookie('authToken');
            const headers = { Authorization: `Bearer ${token}` };
            const [nr, ir] = await Promise.all([
                fetch('/api/notifications', { headers }),
                fetch('/api/invitations/my-invitations', { headers })
            ]);
            let combined = [];
            let dbNotifs = [];
            if (nr.ok) dbNotifs = (await nr.json()).notifications || [];

            // Import utility inside component or use it if available
            // Since I'll add imports at the top later, I'll just use it here.
            
            if (ir.ok) {
                const invs = await ir.json();
                const ins = (Array.isArray(invs) ? invs : []).map(i => ({
                    _id: `inv_${i._id}`,
                    type: 'invitation',
                    title: `Invitation: ${i.company?.name}`,
                    message: `Invited as ${i.designation}`,
                    isRead: false,
                    createdAt: i.createdAt,
                    _invitationId: i._id
                }));
                combined = [...ins, ...dbNotifs].slice(0, 10);
            } else {
                combined = dbNotifs.slice(0, 10);
            }
            setRecentNotifs(combined);
        } catch (err) { console.error(err); }
        finally { setNotifLoading(false); }
    };

    const handleLogout = () => {
        dispatch({ type: 'LOGOUT' });
        navigate('/');
    };

    const initials = user?.name ? user.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() : 'U';

    return (
        <header className="fixed top-0 left-0 right-0 h-20 bg-white/80 backdrop-blur-md border-b border-slate-200 z-[1000] flex items-center px-10">
            <div className="max-w-7xl mx-auto w-full flex items-center justify-between">
                {/* Logo & Main Nav */}
                <div className="flex items-center gap-10">
                    <Link to="/" className="flex items-center group">
                        <img
                            src="/offtix-logo.png"
                            alt="Offtix Logo"
                            className="h-9 w-auto object-contain transition-transform group-hover:scale-105"
                        />
                    </Link>

                    <nav className="hidden md:flex items-center gap-8">
                        <Link to="/" className={`text-sm font-semibold ${location.pathname === '/' ? 'text-indigo-600' : 'text-slate-500 hover:text-slate-800'} transition-all`}>Home</Link>
                        <Link to="/careers" className={`text-sm font-semibold ${location.pathname.startsWith('/careers') ? 'text-indigo-600' : 'text-slate-500 hover:text-slate-800'} transition-all`}>Careers</Link>
                    </nav>
                </div>

                {/* Right Actions */}
                <div className="flex items-center gap-4">
                    {isAuthenticated ? (
                        <>
                            {/* Company Selector */}
                            <div className="relative" ref={compRef}>
                                <button
                                    onClick={() => setIsCompanyOpen(!isCompanyOpen)}
                                    className="flex items-center gap-3 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl hover:bg-slate-100 transition-all text-left group"
                                >
                                    <div className="w-6 h-6 rounded-md bg-indigo-100 flex items-center justify-center text-[10px] font-bold text-indigo-700 overflow-hidden">
                                        {isPersonal ? '👤' : (selectedCompany?.logo ? (
                                            <img src={getLogoUrl(selectedCompany.logo)} alt="" className="w-full h-full object-cover" />
                                        ) : selectedCompany?.name?.charAt(0))}
                                    </div>
                                    <div className="hidden sm:block">
                                        <p className="text-[10px] font-bold text-slate-500 leading-none">Workspace</p>
                                        <p className="text-[11px] font-bold text-slate-700 leading-tight truncate max-w-[120px]">{selectedCompany?.name || 'Personal'}</p>
                                    </div>
                                    <svg className={`w-3 h-3 text-slate-400 transition-transform ${isCompanyOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7" /></svg>
                                </button>

                                {isCompanyOpen && (
                                    <div className="absolute top-full right-0 mt-2 w-64 bg-white border border-slate-200 rounded-2xl shadow-2xl p-2 space-y-1 animate-in fade-in slide-in-from-top-2">
                                        <div className="px-3 py-2 text-[10px] font-bold text-slate-400">Select Workspace</div>
                                        {companyState.companies.map(c => (
                                            <button
                                                key={c.id}
                                                onClick={() => { selectCompany(c); setIsCompanyOpen(false); }}
                                                className={`w-full flex items-center gap-3 p-2 rounded-xl text-left transition-all ${selectedCompany?.id === c.id ? 'bg-indigo-50 text-indigo-700' : 'hover:bg-slate-50 text-slate-600'}`}
                                            >
                                                <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-xs font-bold overflow-hidden">
                                                    {c.logo ? (
                                                        <img src={getLogoUrl(c.logo)} alt="" className="w-full h-full object-cover" />
                                                    ) : c.name.charAt(0)}
                                                </div>
                                                <span className="text-xs font-bold">{c.name}</span>
                                            </button>
                                        ))}
                                        <button
                                            onClick={() => { selectCompany({ id: 'personal', name: 'Personal' }); setIsCompanyOpen(false); }}
                                            className={`w-full flex items-center gap-3 p-2 rounded-xl text-left transition-all ${isPersonal ? 'bg-indigo-50 text-indigo-700' : 'hover:bg-slate-50 text-slate-600'}`}
                                        >
                                            <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-xs">👤</div>
                                            <span className="text-xs font-bold">Personal Account</span>
                                        </button>
                                    </div>
                                )}
                            </div>

                            {/* Messages */}
                            <button
                                type="button"
                                onClick={() => toggleGlobalChat()}
                                className="relative w-10 h-10 flex items-center justify-center text-slate-400 hover:text-indigo-600 hover:bg-slate-50 rounded-xl transition-all border border-slate-100"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
                                {unreadCounts.total > 0 && <span className="absolute -top-1 -right-1 w-4 h-4 bg-rose-500 text-white text-[9px] font-black rounded-full flex items-center justify-center border-2 border-white">{unreadCounts.total > 9 ? '9+' : unreadCounts.total}</span>}
                            </button>

                            {/* Notifications */}
                            <div className="relative" ref={notifRef}>
                                <button
                                    onClick={() => { setIsNotifOpen(!isNotifOpen); if (!isNotifOpen) fetchNotifs(); }}
                                    className="relative w-10 h-10 flex items-center justify-center text-slate-400 hover:text-indigo-600 hover:bg-slate-50 rounded-xl transition-all border border-slate-100"
                                >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>
                                    {totalUnreadCount > 0 && <span className="absolute -top-1 -right-1 w-4 h-4 bg-rose-500 text-white text-[9px] font-black rounded-full flex items-center justify-center border-2 border-white">{totalUnreadCount > 9 ? '9+' : totalUnreadCount}</span>}
                                </button>

                                {isNotifOpen && (
                                    <div className="absolute top-full right-0 mt-2 w-80 bg-white border border-slate-200 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-2 origin-top-right">
                                        <div className="px-5 py-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
                                            <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">Recent Activity</span>
                                            <Link to="/notifications" onClick={() => setIsNotifOpen(false)} className="text-[11px] font-bold text-indigo-600 hover:text-indigo-700">View All</Link>
                                        </div>
                                        <div className="max-h-80 overflow-y-auto divide-y divide-slate-50">
                                            {notifLoading ? (
                                                <div className="p-10 text-center text-[10px] font-bold text-slate-400 uppercase animate-pulse tracking-widest">Synchronizing...</div>
                                            ) : recentNotifs.length === 0 ? (
                                                <div className="p-10 text-center space-y-1">
                                                    <p className="text-sm font-bold text-slate-300">No new alerts</p>
                                                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">Everything caught up</p>
                                                </div>
                                            ) : (
                                                recentNotifs.map(n => {
                                                    const label = getTypeLabel(n.type);
                                                    return (
                                                        <button
                                                            key={n._id}
                                                            type="button"
                                                            onClick={() => {
                                                                setIsNotifOpen(false);
                                                                if (n.type === 'invitation' && n.relatedId &&
                                                                    (n.relatedModel === 'Invitation' || !n.relatedModel)) {
                                                                    navigate(`/invitations/${n.relatedId}`);
                                                                    return;
                                                                }
                                                                if (n.type === 'job_offer' && n.relatedId) {
                                                                    navigate(`/recruitment/offer/${n.relatedId}`);
                                                                    return;
                                                                }
                                                                navigate('/notifications');
                                                            }}
                                                            className={`w-full text-left p-4 hover:bg-slate-50 transition-colors cursor-pointer relative ${!n.isRead ? 'bg-indigo-50/40' : ''}`}
                                                        >
                                                            {!n.isRead && (
                                                                <span className="absolute left-2 top-5 w-1.5 h-1.5 bg-indigo-600 rounded-full shadow-sm shadow-indigo-200" />
                                                            )}
                                                            <div className="flex items-center gap-2 mb-1">
                                                                <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 px-1.5 py-0.5 bg-white rounded border border-slate-200/50">{label}</span>
                                                                <span className="text-[10px] font-bold text-slate-400">{timeAgo(n.createdAt)}</span>
                                                            </div>
                                                            <p className={`text-[13px] font-bold truncate ${!n.isRead ? 'text-slate-900' : 'text-slate-600'}`}>{n.title}</p>
                                                            <p className="text-xs text-slate-500 line-clamp-1 mt-0.5">{n.message}</p>
                                                        </button>
                                                    );
                                                })
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="w-px h-6 bg-slate-200 mx-2" />

                            {/* User Menu */}
                            <div className="relative" ref={userRef}>
                                <button
                                    onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                                    className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-black text-xs hover:ring-4 hover:ring-indigo-50 transition-all border-2 border-white shadow-sm overflow-hidden"
                                >
                                    {(user?.profilePicture || user?.profile?.profilePicture) ? (
                                        <img src={getLogoUrl(user.profilePicture || user.profile?.profilePicture)} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                                    ) : initials}
                                </button>

                                {isUserMenuOpen && (
                                    <div className="absolute top-full right-0 mt-2 w-56 bg-white border border-slate-200 rounded-2xl shadow-2xl p-2 animate-in fade-in slide-in-from-top-2">
                                        <div className="px-4 py-3 border-b border-slate-50 mb-1">
                                            <p className="text-xs font-black text-slate-800 truncate">{user?.name}</p>
                                            <p className="text-[10px] font-bold text-slate-400 truncate mt-0.5">{user?.role}</p>
                                        </div>
                                        <Link to="/dashboard" onClick={() => setIsUserMenuOpen(false)} className="flex items-center gap-3 w-full p-2.5 rounded-xl hover:bg-slate-50 transition-all text-slate-600">
                                            <span className="text-xs">🏠</span>
                                            <span className="text-sm font-semibold">Dashboard</span>
                                        </Link>
                                        <Link to="/profile" onClick={() => setIsUserMenuOpen(false)} className="flex items-center gap-3 w-full p-2.5 rounded-xl hover:bg-slate-50 transition-all text-slate-600">
                                            <span className="text-xs">👤</span>
                                            <span className="text-sm font-semibold">My Profile</span>
                                        </Link>
                                        <button onClick={handleLogout} className="flex items-center gap-3 w-full p-2.5 rounded-xl hover:bg-rose-50 transition-all text-rose-500 mt-1">
                                            <span className="text-xs">🔒</span>
                                            <span className="text-sm font-semibold">Sign Out</span>
                                        </button>
                                    </div>
                                )}
                            </div>
                        </>
                    ) : (
                        <div className="flex items-center gap-2">
                            <Link to="/signin" className="px-5 py-2.5 text-sm font-semibold text-slate-500 hover:text-indigo-600 transition-all">Sign In</Link>
                            <Link to="/signup" className="px-6 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-500 transition-all shadow-xl shadow-indigo-600/10">Get Started</Link>
                        </div>
                    )}
                </div>
            </div>
        </header>
    );
};

export default UnifiedHeader;
