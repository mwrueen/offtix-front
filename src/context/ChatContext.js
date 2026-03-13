import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { io } from 'socket.io-client';
import { chatAPI } from '../services/api';
import { useAuth } from './AuthContext';
import { getCookie } from '../utils/cookies';

const ChatContext = createContext();

export const ChatProvider = ({ children }) => {
    const { state: authState } = useAuth();
    const [unreadCounts, setUnreadCounts] = useState({ direct: {}, projects: {}, total: 0 });
    const [socket, setSocket] = useState(null);

    const fetchUnreadCounts = useCallback(async () => {
        if (!authState.isAuthenticated) return;
        try {
            const res = await chatAPI.getUnreadCounts();
            setUnreadCounts(res.data);
        } catch (err) {
            console.error('Error fetching unread counts:', err);
        }
    }, [authState.isAuthenticated]);

    useEffect(() => {
        if (authState.isAuthenticated) {
            fetchUnreadCounts();

            const token = getCookie('authToken');
            const newSocket = io('http://localhost:5000', {
                auth: { token },
                transports: ['websocket', 'polling']
            });

            newSocket.on('chat-notification', () => {
                fetchUnreadCounts();
            });

            newSocket.on('new-message', () => {
                fetchUnreadCounts();
            });

            setSocket(newSocket);

            return () => {
                newSocket.disconnect();
            };
        }
    }, [authState.isAuthenticated, fetchUnreadCounts]);

    const markAsRead = useCallback(async (params) => {
        try {
            await chatAPI.markRead(params);
            fetchUnreadCounts();
        } catch (err) {
            console.error('Error marking as read:', err);
        }
    }, [fetchUnreadCounts]);

    return (
        <ChatContext.Provider value={{ unreadCounts, fetchUnreadCounts, markAsRead, socket }}>
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
