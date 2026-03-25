import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { io } from 'socket.io-client';

const SIDEBAR_COLLAPSED_WIDTH = 64;
const SIDEBAR_EXPANDED_WIDTH = 240;
const HEADER_HEIGHT = 81; // Height of the main header in Layout.js

// Helper function to get cookie value
const getCookie = (name) => {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop().split(';').shift();
  return null;
};

const ProjectSidebar = ({ projectId, project, onWidthChange }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isExpanded, setIsExpanded] = useState(true);
  const [unreadChatCount, setUnreadChatCount] = useState(0);
  const [showChatNotification, setShowChatNotification] = useState(false);
  const [latestNotification, setLatestNotification] = useState(null);
  const socketRef = useRef(null);
  const notificationTimeoutRef = useRef(null);

  // Determine current page based on URL
  const isChatPage = location.search.includes('tab=chat');

  const tabs = [
    { id: 'overview', label: 'Overview', icon: 'M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z', path: 'overview' },
    { id: 'tasks', label: 'Tasks', icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4', path: 'tasks' },
    { id: 'team', label: 'Team', icon: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z', path: 'team' },
    { id: 'chat', label: 'Chat', icon: 'M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z', path: 'chat' },
    { id: 'analytics', label: 'Analytics', icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z', path: 'analytics' },
    { id: 'files', label: 'Files', icon: 'M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z', path: 'files' },
    { id: 'requirements', label: 'Requirements', icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z', path: 'requirements' },
    { id: 'meetings', label: 'Meetings', icon: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z', path: 'meetings' },
    { id: 'phases', label: 'Phases', icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z', path: 'phases' },
    { id: 'sprints', label: 'Sprints', icon: 'M13 10V3L4 14h7v7l9-11h-7z', path: 'sprints' },
    { id: 'risks', label: 'Risks', icon: 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z', path: 'risks' },
    { id: 'dependencies', label: 'Dependencies', icon: 'M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1', path: 'dependencies' },
    { id: 'history', label: 'History', icon: 'M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253', path: 'history' },
  ];

  const currentWidth = isExpanded ? SIDEBAR_EXPANDED_WIDTH : SIDEBAR_COLLAPSED_WIDTH;

  useEffect(() => {
    if (onWidthChange) onWidthChange(currentWidth);
  }, [currentWidth, onWidthChange]);

  useEffect(() => {
    const token = getCookie('authToken');
    if (!token || !projectId) return;

    const socket = io('http://localhost:5000', {
      auth: { token },
      transports: ['websocket', 'polling']
    });

    socket.on('chat-notification', (notification) => {
      if (notification.projectId === projectId) {
        setUnreadChatCount(prev => prev + 1);
        setLatestNotification(notification);
        setShowChatNotification(true);

        if (notificationTimeoutRef.current) clearTimeout(notificationTimeoutRef.current);
        notificationTimeoutRef.current = setTimeout(() => {
          setShowChatNotification(false);
        }, 5000);
      }
    });

    socketRef.current = socket;

    return () => {
      if (notificationTimeoutRef.current) clearTimeout(notificationTimeoutRef.current);
      socket.disconnect();
    };
  }, [projectId]);

  useEffect(() => {
    if (isChatPage) {
      setUnreadChatCount(0);
      setShowChatNotification(false);
    }
  }, [isChatPage]);

  const handleTabClick = useCallback((tab) => {
    if (tab.path === 'chat') {
      setUnreadChatCount(0);
      setShowChatNotification(false);
    }
    if (tab.path === 'overview') navigate(`/projects/${projectId}`);
    else navigate(`/projects/${projectId}?tab=${tab.path}`);
  }, [navigate, projectId]);

  const params = new URLSearchParams(location.search);
  const currentTab = params.get('tab') || 'overview';

  return (
    <div
      className={`fixed right-0 bg-white border-l border-slate-200 z-[100] transition-all duration-300 flex flex-col overflow-hidden shadow-[-4px_0_20px_rgba(0,0,0,0.03)]`}
      style={{
        top: `${HEADER_HEIGHT}px`,
        width: `${currentWidth}px`,
        height: `calc(100vh - ${HEADER_HEIGHT}px)`,
      }}
    >
      {/* Header Area */}
      <div className={`p-4 flex items-center bg-slate-900 justify-between min-h-[64px] ${!isExpanded ? 'justify-center' : ''}`}>
        {isExpanded ? (
          <>
            <div className="flex flex-col min-w-0">
              <h3 className="text-white text-xs font-bold uppercase tracking-widest flex items-center gap-2">
                <span>☰</span> Project Menu
              </h3>
              {project && <p className="text-slate-400 text-[10px] truncate mt-1 font-medium">{project.title}</p>}
            </div>
            <button
              onClick={() => setIsExpanded(false)}
              className="p-1 px-2.5 bg-white/10 text-white rounded-lg hover:bg-white/20 transition-all font-bold text-xs"
            >
              ⮕
            </button>
          </>
        ) : (
          <button
            onClick={() => setIsExpanded(true)}
            className="p-1.5 px-3 bg-white/10 text-white rounded-lg hover:bg-white/20 transition-all font-bold text-xs"
          >
            ⬅
          </button>
        )}
      </div>

      {/* Notification Popup */}
      {showChatNotification && latestNotification && (
        <div className={`absolute top-20 ${isExpanded ? 'right-64' : 'right-20'} w-64 bg-white rounded-2xl shadow-xl border border-slate-200 p-4 z-[1000] animate-in slide-in-from-right-10`}>
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 bg-indigo-600 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0 shadow-lg">
              {latestNotification.senderName?.charAt(0) || '?'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-slate-900">{latestNotification.senderName}</p>
              <p className="text-[10px] text-slate-500 truncate mt-0.5">{latestNotification.content}</p>
              <span className="text-[8px] text-indigo-500 font-bold uppercase tracking-widest mt-2 block">New Message</span>
            </div>
            <button onClick={() => setShowChatNotification(false)} className="text-slate-300 hover:text-rose-500">×</button>
          </div>
        </div>
      )}

      {/* Scrollable Menu Items */}
      <div className="flex-1 overflow-y-auto p-4 py-6 scrollbar-none space-y-1">
        {tabs.map((tab) => {
          const isActive = currentTab === tab.id;
          const hasBadge = tab.id === 'chat' && unreadChatCount > 0;

          return (
            <button
              key={tab.id}
              onClick={() => handleTabClick(tab)}
              title={!isExpanded ? tab.label : undefined}
              className={`w-full flex items-center gap-4 p-3 rounded-xl transition-all duration-200 ${isActive ? 'bg-indigo-50 text-indigo-700 font-bold shadow-sm' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'} ${!isExpanded ? 'justify-center' : ''}`}
            >
              <div className="relative shrink-0">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d={tab.icon}></path>
                </svg>
                {hasBadge && (
                  <div className={`absolute -top-2 -right-2 bg-rose-500 text-white text-[9px] font-black h-4 w-4 rounded-full flex items-center justify-center shadow-md animate-bounce`}>
                    {unreadChatCount > 9 ? '9+' : unreadChatCount}
                  </div>
                )}
              </div>
              {isExpanded && (
                <span className="text-xs uppercase tracking-widest truncate">{tab.label}</span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export { SIDEBAR_COLLAPSED_WIDTH, SIDEBAR_EXPANDED_WIDTH };
export default ProjectSidebar;
