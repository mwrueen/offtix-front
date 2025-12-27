import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { io } from 'socket.io-client';

const SIDEBAR_COLLAPSED_WIDTH = 56;
const SIDEBAR_EXPANDED_WIDTH = 200;
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
  const isTasksPage = location.pathname.includes('/tasks');
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

  // Notify parent of width changes
  useEffect(() => {
    if (onWidthChange) {
      onWidthChange(currentWidth);
    }
  }, [currentWidth, onWidthChange]);

  // Socket connection for chat notifications
  useEffect(() => {
    const token = getCookie('authToken');
    if (!token || !projectId) return;

    const socket = io('http://localhost:5000', {
      auth: { token },
      transports: ['websocket', 'polling']
    });

    socket.on('connect', () => {
      console.log('ProjectSidebar: Socket connected for notifications');
    });

    // Listen for chat notifications
    socket.on('chat-notification', (notification) => {
      // Only count notifications for this project
      if (notification.projectId === projectId) {
        setUnreadChatCount(prev => prev + 1);
        setLatestNotification(notification);
        setShowChatNotification(true);

        // Hide notification popup after 5 seconds
        if (notificationTimeoutRef.current) {
          clearTimeout(notificationTimeoutRef.current);
        }
        notificationTimeoutRef.current = setTimeout(() => {
          setShowChatNotification(false);
        }, 5000);
      }
    });

    socketRef.current = socket;

    return () => {
      if (notificationTimeoutRef.current) {
        clearTimeout(notificationTimeoutRef.current);
      }
      socket.disconnect();
    };
  }, [projectId]);

  // Clear unread count when navigating to chat
  useEffect(() => {
    if (isChatPage) {
      setUnreadChatCount(0);
      setShowChatNotification(false);
    }
  }, [isChatPage]);

  const handleTabClick = useCallback((tab) => {
    // Clear chat notifications when clicking on chat
    if (tab.path === 'chat') {
      setUnreadChatCount(0);
      setShowChatNotification(false);
    }

    if (tab.path === 'tasks') {
      navigate(`/projects/${projectId}/tasks`);
    } else if (tab.path === 'overview') {
      navigate(`/projects/${projectId}`);
    } else {
      navigate(`/projects/${projectId}?tab=${tab.path}`);
    }
  }, [navigate, projectId]);

  const getCurrentTab = () => {
    if (isTasksPage) return 'tasks';
    const params = new URLSearchParams(location.search);
    return params.get('tab') || 'overview';
  };

  const currentTab = getCurrentTab();

  return (
    <div style={{
      position: 'fixed',
      right: 0,
      top: `${HEADER_HEIGHT}px`,
      width: `${currentWidth}px`,
      height: `calc(100vh - ${HEADER_HEIGHT}px)`,
      backgroundColor: '#fff',
      boxShadow: '-2px 0 10px rgba(0,0,0,0.08)',
      zIndex: 100,
      transition: 'width 0.3s ease',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
      borderLeft: '1px solid #e5e7eb'
    }}>
      {/* Header */}
      <div style={{
        padding: isExpanded ? '16px' : '12px 8px',
        borderBottom: '1px solid #e5e7eb',
        background: 'linear-gradient(135deg, #1e40af 0%, #3b82f6 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: isExpanded ? 'space-between' : 'center',
        minHeight: '60px'
      }}>
        {isExpanded ? (
          <>
            <div>
              <h3 style={{
                margin: 0,
                color: '#fff',
                fontSize: '14px',
                fontWeight: '600',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
                  <polyline points="9 22 9 12 15 12 15 22"></polyline>
                </svg>
                Project Menu
              </h3>
              {project && (
                <p style={{ margin: '4px 0 0', color: 'rgba(255,255,255,0.8)', fontSize: '11px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '120px' }}>
                  {project.title}
                </p>
              )}
            </div>
            <button
              onClick={() => setIsExpanded(false)}
              style={{
                background: 'rgba(255,255,255,0.2)',
                border: 'none',
                borderRadius: '6px',
                padding: '6px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
              title="Collapse menu"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                <polyline points="9 18 15 12 9 6"></polyline>
              </svg>
            </button>
          </>
        ) : (
          <button
            onClick={() => setIsExpanded(true)}
            style={{
              background: 'rgba(255,255,255,0.2)',
              border: 'none',
              borderRadius: '6px',
              padding: '8px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
            title="Expand menu"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
              <polyline points="15 18 9 12 15 6"></polyline>
            </svg>
          </button>
        )}
      </div>

      {/* Chat Notification Popup */}
      {showChatNotification && latestNotification && (
        <div style={{
          position: 'absolute',
          top: '80px',
          left: isExpanded ? '-260px' : '-210px',
          width: '240px',
          backgroundColor: '#ffffff',
          borderRadius: '12px',
          boxShadow: '0 10px 40px rgba(0, 0, 0, 0.15)',
          border: '1px solid #e5e7eb',
          padding: '12px',
          zIndex: 1000,
          animation: 'slideIn 0.3s ease'
        }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: '50%',
              backgroundColor: '#3b82f6',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              fontSize: '14px',
              fontWeight: '600',
              flexShrink: 0
            }}>
              {latestNotification.senderName?.charAt(0)?.toUpperCase() || '?'}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: '12px', fontWeight: '600', color: '#1f2937', marginBottom: '2px' }}>
                {latestNotification.senderName}
              </div>
              <div style={{ fontSize: '11px', color: '#6b7280', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {latestNotification.content}
              </div>
              <div style={{ fontSize: '10px', color: '#9ca3af', marginTop: '4px' }}>
                New message in chat
              </div>
            </div>
            <button
              onClick={() => setShowChatNotification(false)}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: '4px',
                color: '#9ca3af',
                fontSize: '16px'
              }}
            >
              ×
            </button>
          </div>
        </div>
      )}

      {/* Menu Items */}
      <div style={{ flex: 1, overflowY: 'auto', padding: isExpanded ? '8px' : '8px 4px' }}>
        {tabs.map((tab) => {
          const isActive = currentTab === tab.id;
          const hasBadge = tab.id === 'chat' && unreadChatCount > 0;

          return (
            <button
              key={tab.id}
              onClick={() => handleTabClick(tab)}
              title={!isExpanded ? (hasBadge ? `${tab.label} (${unreadChatCount} new)` : tab.label) : undefined}
              style={{
                width: '100%',
                padding: isExpanded ? '10px 12px' : '10px',
                marginBottom: '2px',
                backgroundColor: isActive ? '#eff6ff' : (hasBadge ? '#fef3c7' : 'transparent'),
                border: isActive ? '1px solid #bfdbfe' : (hasBadge ? '1px solid #fcd34d' : '1px solid transparent'),
                borderRadius: '8px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: isExpanded ? 'flex-start' : 'center',
                gap: '10px',
                color: isActive ? '#1e40af' : (hasBadge ? '#92400e' : '#4b5563'),
                fontSize: '13px',
                fontWeight: isActive || hasBadge ? '600' : '500',
                transition: 'all 0.2s ease',
                textAlign: 'left',
                position: 'relative'
              }}
              onMouseEnter={(e) => {
                if (!isActive && !hasBadge) {
                  e.currentTarget.style.backgroundColor = '#f3f4f6';
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive) {
                  e.currentTarget.style.backgroundColor = hasBadge ? '#fef3c7' : 'transparent';
                }
              }}
            >
              <div style={{ position: 'relative', flexShrink: 0 }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d={tab.icon}></path>
                </svg>
                {/* Badge for collapsed view */}
                {hasBadge && !isExpanded && (
                  <div style={{
                    position: 'absolute',
                    top: '-6px',
                    right: '-6px',
                    backgroundColor: '#ef4444',
                    color: 'white',
                    fontSize: '10px',
                    fontWeight: '700',
                    minWidth: '16px',
                    height: '16px',
                    borderRadius: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '0 4px',
                    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2)'
                  }}>
                    {unreadChatCount > 99 ? '99+' : unreadChatCount}
                  </div>
                )}
              </div>
              {isExpanded && (
                <>
                  <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', flex: 1 }}>{tab.label}</span>
                  {/* Badge for expanded view */}
                  {hasBadge && (
                    <div style={{
                      backgroundColor: '#ef4444',
                      color: 'white',
                      fontSize: '11px',
                      fontWeight: '700',
                      minWidth: '20px',
                      height: '20px',
                      borderRadius: '10px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      padding: '0 6px',
                      boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2)',
                      animation: 'pulse 2s infinite'
                    }}>
                      {unreadChatCount > 99 ? '99+' : unreadChatCount}
                    </div>
                  )}
                </>
              )}
            </button>
          );
        })}
      </div>

      {/* Animation styles */}
      <style>
        {`
          @keyframes slideIn {
            from {
              opacity: 0;
              transform: translateX(20px);
            }
            to {
              opacity: 1;
              transform: translateX(0);
            }
          }
          @keyframes pulse {
            0%, 100% {
              transform: scale(1);
            }
            50% {
              transform: scale(1.1);
            }
          }
        `}
      </style>
    </div>
  );
};

// Export constants for parent components
export { SIDEBAR_COLLAPSED_WIDTH, SIDEBAR_EXPANDED_WIDTH };
export default ProjectSidebar;

