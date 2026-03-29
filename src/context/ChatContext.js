import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { io } from 'socket.io-client';
import { chatAPI } from '../services/api';
import { useAuth } from './AuthContext';
import { getCookie } from '../utils/cookies';
import { useCompany } from './CompanyContext';

const ChatContext = createContext();

export const ChatProvider = ({ children }) => {
    const { state: authState } = useAuth();
    const { state: companyState } = useCompany();
    const selectedCompanyId = companyState.selectedCompany?.id || 'personal';

    // legacy shape: { direct: {}, projects: {}, total }
    // new shape: { byCompany: { [companyId]: { direct: {}, projects: {}, total } } }
    const [unreadCounts, setUnreadCounts] = useState({ byCompany: {} });
    const [socket, setSocket] = useState(null);

    const fetchUnreadCounts = useCallback(async (companyId) => {
        if (!companyId) return;
        try {
            const res = await chatAPI.getUnreadCounts(companyId);
            const payload = res.data || { direct: {}, projects: {}, total: 0 };
            setUnreadCounts(prev => ({
                ...prev,
                byCompany: {
                    ...(prev.byCompany || {}),
                    [companyId]: payload
                }
            }));
        } catch (err) {
            console.error('Error fetching unread counts:', err);
        }
    }, []);

    const selectedUnread = useMemo(() => {
        return (unreadCounts.byCompany && unreadCounts.byCompany[selectedCompanyId]) || { direct: {}, projects: {}, total: 0 };
    }, [unreadCounts.byCompany, selectedCompanyId]);

    useEffect(() => {
        if (authState.isAuthenticated) {
            fetchUnreadCounts(selectedCompanyId);

            const token = getCookie('authToken');
            const newSocket = io('http://localhost:5000', {
                auth: { token },
                transports: ['websocket', 'polling']
            });

            newSocket.on('chat-notification', () => {
                fetchUnreadCounts(selectedCompanyId);
            });

            newSocket.on('new-message', () => {
                fetchUnreadCounts(selectedCompanyId);
            });

            setSocket(newSocket);

            return () => {
                newSocket.disconnect();
            };
        }
    }, [authState.isAuthenticated, fetchUnreadCounts, selectedCompanyId]);

    const markAsRead = useCallback(async (params) => {
        try {
            await chatAPI.markRead(params);
            fetchUnreadCounts(selectedCompanyId);
        } catch (err) {
            console.error('Error marking as read:', err);
        }
    }, [fetchUnreadCounts, selectedCompanyId]);

    return (
        <ChatContext.Provider value={{
            // Back-compat: components like GlobalChat expect unreadCounts.direct/projects
            unreadCounts: selectedUnread,
            // New: full map for per-company rendering
            unreadCountsByCompany: unreadCounts.byCompany || {},
            selectedUnread,
            selectedCompanyId,
            fetchUnreadCounts,
            markAsRead,
            socket
        }}>
            {children}
        </ChatContext.Provider>
    );
};

export const useChat = () => {
    const context = useContext(ChatContext);
    if (!context) {
        throw new Error('useChat must be used within ChatProvider');
    }
    return context;
};
