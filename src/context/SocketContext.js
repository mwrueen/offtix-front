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
    const lastFetchRef = useRef({ companyId: null, time: 0 });

    const fetchUnreadCount = useCallback(async (companyId) => {
        if (!companyId) return;

        // Prevent rapid duplicate fetches within 2 seconds
        const now = Date.now();
        if (lastFetchRef.current.companyId === companyId && (now - lastFetchRef.current.time < 2000)) {
            return;
        }
        lastFetchRef.current = { companyId, time: now };

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
            if (socketRef.current) {
                socketRef.current.disconnect();
                socketRef.current = null;
                setIsConnected(false);
            }
            return;
        }

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
        });

        socket.on('disconnect', () => {
            console.log('[Socket] Disconnected');
            setIsConnected(false);
        });

        socket.on('connect_error', (err) => {
            console.error('[Socket] Connection error:', err.message);
        });

        return () => {
            socket.disconnect();
            socketRef.current = null;
        };
    }, [state.isAuthenticated]);

    // Fetch unread count when company changes or socket connects
    useEffect(() => {
        if (isConnected) {
            fetchUnreadCount(selectedCompanyId);
        }
    }, [isConnected, selectedCompanyId, fetchUnreadCount]);

    // Setup socket event listeners separately so they can access fresh state
    useEffect(() => {
        const socket = socketRef.current;
        if (!socket || !isConnected) return;

        // ─── TASK NOTIFICATIONS ───────────────────────────────────────────────
        const handleTaskNotification = (data) => {
            setNotifications(prev => [data, ...prev].slice(0, 20));
            const cid = data?.companyId || data?.company?.id || selectedCompanyId;
            setUnreadCountsByCompany(prev => ({ ...prev, [cid]: (prev[cid] || 0) + 1 }));
        };

        socket.on('task:ready', handleTaskNotification);
        socket.on('task:sent_back', handleTaskNotification);
        socket.on('task:role_handoff', handleTaskNotification);
        socket.on('task:assigned', handleTaskNotification);

        socket.on('chat-notification', () => {
            setUnreadCountsByCompany(prev => ({ ...prev, [selectedCompanyId]: (prev[selectedCompanyId] || 0) + 1 }));
        });

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
                        taskId: data.relatedModel === 'Task' && data.relatedId ? data.relatedId : data.taskId,
                        applicationId: data.relatedModel === 'Application' && data.relatedId ? data.relatedId : undefined,
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
            socket.off('task:ready', handleTaskNotification);
            socket.off('task:sent_back', handleTaskNotification);
            socket.off('task:role_handoff', handleTaskNotification);
            socket.off('task:assigned', handleTaskNotification);
            socket.off('chat-notification');
            socket.off('notification:new', handleNewNotification);
        };
    }, [isConnected, selectedCompanyId, fetchUnreadCount]);

    const dismissNotification = useCallback((index) => {
        setNotifications(prev => prev.filter((_, i) => i !== index));
    }, []);

    const clearUnreadCount = useCallback(() => {
        setUnreadCountsByCompany(prev => ({ ...prev, [selectedCompanyId]: 0 }));
    }, [selectedCompanyId]);

    const resetAllUnreadCounts = useCallback(() => {
        setUnreadCountsByCompany({});
    }, []);

    const decrementUnread = useCallback((by = 1) => {
        setUnreadCountsByCompany(prev => ({
            ...prev,
            [selectedCompanyId]: Math.max(0, (prev[selectedCompanyId] || 0) - by)
        }));
    }, [selectedCompanyId]);

    const unreadCount = unreadCountsByCompany[selectedCompanyId] || 0;
    const totalUnreadCount = useMemo(() => {
        return Object.values(unreadCountsByCompany).reduce((acc, count) => acc + count, 0);
    }, [unreadCountsByCompany]);

    const value = useMemo(() => ({
        socket: socketRef.current,
        isConnected,
        notifications,
        unreadCount,
        totalUnreadCount,
        unreadCountsByCompany,
        dismissNotification,
        clearUnreadCount,
        resetAllUnreadCounts,
        decrementUnread,
        fetchUnreadCount
    }), [isConnected, notifications, unreadCount, totalUnreadCount, unreadCountsByCompany, dismissNotification, clearUnreadCount, resetAllUnreadCounts, decrementUnread, fetchUnreadCount]);

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
