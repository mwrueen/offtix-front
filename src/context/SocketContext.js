import React, { createContext, useContext, useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';
import { getCookie } from '../utils/cookies';
import { useCompany } from './CompanyContext';
import { invitationIdsCoveredByNotifications } from '../utils/invitationNotificationDedupe';

const SocketContext = createContext(null);

export const SocketProvider = ({ children }) => {
    const { state } = useAuth();
    const { state: companyState } = useCompany();
    const selectedCompanyId = companyState.selectedCompany?.id || 'personal';
    const socketRef = useRef(null);
    const [isConnected, setIsConnected] = useState(false);
    const [notifications, setNotifications] = useState([]);  // in-app real-time toast queue
    const [unreadCountsByCompany, setUnreadCountsByCompany] = useState({});

    // Fetch initial unread count from DB (notifications + pending invitations)
    const fetchUnreadCount = useCallback(async (companyId) => {
        if (!companyId) return;
        try {
            const token = getCookie('authToken');
            if (!token) return;

            const headers = { Authorization: `Bearer ${token}` };
            if (companyId !== 'personal') headers['X-Company-Id'] = companyId;

            const [notifRes, invRes] = await Promise.all([
                fetch('/api/notifications', { headers }),
                fetch('/api/invitations/my-invitations', { headers })
            ]);

            let count = 0;
            let notifications = [];
            if (notifRes.ok) {
                const data = await notifRes.json();
                notifications = data.notifications || [];
                count += data.unreadCount || 0;
            }
            if (invRes.ok) {
                const invData = await invRes.json();
                const invs = Array.isArray(invData) ? invData : [];
                const covered = invitationIdsCoveredByNotifications(notifications);
                const orphanInvites = invs.filter((i) => !covered.has(String(i._id)));
                count += orphanInvites.length;
            }
            setUnreadCountsByCompany(prev => ({ ...prev, [companyId]: count }));
        } catch (_) { }
    }, []);

    useEffect(() => {
        const token = getCookie('authToken');
        if (!state.isAuthenticated || !token) {
            // Disconnect if not authenticated
            if (socketRef.current) {
                socketRef.current.disconnect();
                socketRef.current = null;
                setIsConnected(false);
            }
            return;
        }

        // Connect socket
        const socket = io(process.env.REACT_APP_SOCKET_URL || 'http://localhost:5000', {
            auth: { token },
            transports: ['websocket', 'polling'],
            reconnection: true,
            reconnectionAttempts: 5,
            reconnectionDelay: 2000,
        });

        socketRef.current = socket;

        socket.on('connect', () => {
            console.log('[Socket] Connected:', socket.id);
            setIsConnected(true);
            fetchUnreadCount(selectedCompanyId);
        });

        socket.on('disconnect', () => {
            console.log('[Socket] Disconnected');
            setIsConnected(false);
        });

        socket.on('connect_error', (err) => {
            console.error('[Socket] Connection error:', err.message);
        });

        // ─── TASK NOTIFICATIONS ───────────────────────────────────────────────
        const handleTaskNotification = (data) => {
            setNotifications(prev => [data, ...prev].slice(0, 20));
            const cid = data?.companyId || data?.company?.id || selectedCompanyId;
            setUnreadCountsByCompany(prev => ({ ...prev, [cid]: (prev[cid] || 0) + 1 }));
        };

        // Sequential workflow — task passed to next assignee
        socket.on('task:ready', handleTaskNotification);

        // Task sent back to a previous assignee for fixes
        socket.on('task:sent_back', handleTaskNotification);

        // Role-based workflow handoff to next role
        socket.on('task:role_handoff', handleTaskNotification);

        // Task newly assigned to user
        socket.on('task:assigned', handleTaskNotification);

        // Chat notifications (already existed, just re-emit count bump)
        socket.on('chat-notification', () => {
            setUnreadCountsByCompany(prev => ({ ...prev, [selectedCompanyId]: (prev[selectedCompanyId] || 0) + 1 }));
        });

        // DB notifications (job offer, job application, invitations, etc.)
        const handleNewNotification = (data) => {
            if (!data) return;
            setNotifications((prev) =>
                [
                    {
                        type: data.type,
                        title: data.title,
                        message: data.message,
                        relatedId: data.relatedId,
                        relatedModel: data.relatedModel,
                        taskId:
                            data.relatedModel === 'Task' && data.relatedId
                                ? data.relatedId
                                : data.taskId,
                        applicationId:
                            data.relatedModel === 'Application' && data.relatedId
                                ? data.relatedId
                                : undefined,
                    },
                    ...prev,
                ].slice(0, 20)
            );
            fetchUnreadCount(selectedCompanyId);
            if (data.companyId && String(data.companyId) !== String(selectedCompanyId)) {
                fetchUnreadCount(String(data.companyId));
            }
        };
        socket.on('notification:new', handleNewNotification);

        return () => {
            socket.off('task:ready');
            socket.off('task:sent_back');
            socket.off('task:role_handoff');
            socket.off('task:assigned');
            socket.off('chat-notification');
            socket.off('notification:new', handleNewNotification);
            socket.disconnect();
            socketRef.current = null;
        };
    }, [state.isAuthenticated, fetchUnreadCount, selectedCompanyId]);

    const dismissNotification = useCallback((index) => {
        setNotifications(prev => prev.filter((_, i) => i !== index));
    }, []);

    const clearUnreadCount = useCallback(() => {
        setUnreadCountsByCompany(prev => ({ ...prev, [selectedCompanyId]: 0 }));
    }, [selectedCompanyId]);

    const decrementUnread = useCallback((by = 1) => {
        setUnreadCountsByCompany(prev => ({
            ...prev,
            [selectedCompanyId]: Math.max(0, (prev[selectedCompanyId] || 0) - by)
        }));
    }, [selectedCompanyId]);

    const unreadCount = unreadCountsByCompany[selectedCompanyId] || 0;

    const value = useMemo(() => ({
        socket: socketRef.current,
        isConnected,
        notifications,
        unreadCount,
        unreadCountsByCompany,
        dismissNotification,
        clearUnreadCount,
        decrementUnread,
        fetchUnreadCount
    }), [isConnected, notifications, unreadCount, unreadCountsByCompany, dismissNotification, clearUnreadCount, decrementUnread, fetchUnreadCount]);

    return (
        <SocketContext.Provider value={value}>
            {children}
        </SocketContext.Provider>
    );
};

export const useSocket = () => {
    const ctx = useContext(SocketContext);
    if (!ctx) throw new Error('useSocket must be used within SocketProvider');
    return ctx;
};
