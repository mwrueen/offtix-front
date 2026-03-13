import React, { useState, useEffect, useRef } from 'react';
import { chatAPI, projectAPI, userAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useCompany } from '../../context/CompanyContext';
import { useChat } from '../../context/ChatContext';

const GlobalChat = ({ onClose }) => {
    const { state: authState } = useAuth();
    const { state: companyState } = useCompany();
    const { unreadCounts, markAsRead, socket } = useChat();
    const [activeTab, setActiveTab] = useState('direct'); // 'direct', 'projects'
    const [selectedChat, setSelectedChat] = useState(null); // { type, id, name }
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [loading, setLoading] = useState(false);
    const [chatLoading, setChatLoading] = useState(false);
    const [projects, setProjects] = useState([]);
    const [employees, setEmployees] = useState([]);
    const [typingUsers, setTypingUsers] = useState([]);
    const messagesEndRef = useRef(null);
    const inputRef = useRef(null);

    const currentUser = authState.user;
    const companyId = companyState.selectedCompany?.id === 'personal' ? null : companyState.selectedCompany?.id;

    // Socket message listener
    useEffect(() => {
        if (!socket) return;

        const handleNewMessage = (message) => {
            const currentUserId = currentUser?.id || currentUser?._id;
            const targetId = selectedChat?.id;

            const isCurrentProject = selectedChat?.type === 'project' && message.project === targetId;

            // For DM, check if the message is between current user and target user
            const senderId = message.sender?._id || message.sender?.id || (typeof message.sender === 'string' ? message.sender : null);
            const recipientId = message.recipient?._id || message.recipient?.id || (typeof message.recipient === 'string' ? message.recipient : null);

            const isFromCurrentToTarget = senderId?.toString() === currentUserId?.toString() && recipientId?.toString() === targetId?.toString();
            const isFromTargetToCurrent = senderId?.toString() === targetId?.toString() && recipientId?.toString() === currentUserId?.toString();

            const isCurrentDM = selectedChat?.type === 'direct' && (isFromCurrentToTarget || isFromTargetToCurrent);

            if (isCurrentProject || isCurrentDM) {
                setMessages(prev => [...prev, message]);
                scrollToBottom();

                // If this is the active chat, mark as read
                if (isFromTargetToCurrent || (isCurrentProject && senderId?.toString() !== currentUserId?.toString())) {
                    const params = {};
                    if (isCurrentProject) params.projectId = targetId;
                    else params.dmWithId = targetId;
                    markAsRead(params);
                }
            }
        };

        const handleUserTyping = ({ userId, userName, isTyping }) => {
            setTypingUsers(prev => {
                if (isTyping) {
                    if (!prev.find(u => u.userId === userId)) return [...prev, { userId, userName }];
                } else {
                    return prev.filter(u => u.userId !== userId);
                }
                return prev;
            });
        };

        socket.on('new-message', handleNewMessage);
        socket.on('user-typing', handleUserTyping);

        return () => {
            socket.off('new-message', handleNewMessage);
            socket.off('user-typing', handleUserTyping);
        };
    }, [selectedChat, currentUser, socket, markAsRead]);

    // Fetch navigation data
    useEffect(() => {
        const fetchNav = async () => {
            try {
                setLoading(true);
                const [projectsRes, employeesRes] = await Promise.all([
                    projectAPI.getAll(companyId),
                    userAPI.getAll(companyId)
                ]);

                const projectsList = Array.isArray(projectsRes.data) ? projectsRes.data : [];
                const employeesList = Array.isArray(employeesRes.data) ? employeesRes.data : [];

                setProjects(projectsList);
                setEmployees(employeesList.filter(e => {
                    const currentUserId = currentUser?.id || currentUser?._id;
                    const employeeId = e.id || e._id;
                    return employeeId?.toString() !== currentUserId?.toString();
                }));
            } catch (err) {
                console.error('Error fetching chat nav data:', err);
            } finally {
                setLoading(false);
            }
        };
        fetchNav();
    }, [companyId, currentUser?._id]);

    // Join/Leave rooms and fetch messages when selectedChat changes
    useEffect(() => {
        if (!selectedChat) return;

        const fetchMessagesAndMarkRead = async () => {
            setChatLoading(true);
            try {
                const chatId = selectedChat.id?.toString().trim().toLowerCase();
                if (!chatId) return;

                const chatType = selectedChat.type;

                // Sync counts and check for unread
                const counts = chatType === 'project' ? unreadCounts.projects : unreadCounts.direct;

                // Find matching key with case-insensitive string comparison
                const matchingKey = Object.keys(counts).find(k => k.toString().trim().toLowerCase() === chatId);
                const unreadCount = matchingKey ? counts[matchingKey] : 0;

                if (unreadCount > 0) {
                    const markParams = {};
                    if (chatType === 'project') markParams.projectId = selectedChat.id;
                    else markParams.dmWithId = selectedChat.id;
                    markAsRead(markParams);
                }

                const fetchParams = {};
                if (chatType === 'project') fetchParams.projectId = selectedChat.id;
                else if (chatType === 'direct') fetchParams.dmWithId = selectedChat.id;

                const res = await chatAPI.getMessages(fetchParams);
                setMessages(res.data.messages || []);
                scrollToBottom();
            } catch (err) {
                console.error('Error fetching messages:', err);
            } finally {
                setChatLoading(false);
            }
        };

        if (socket && selectedChat.type === 'project') {
            socket.emit('join-room', { type: selectedChat.type, id: selectedChat.id });
        }

        fetchMessagesAndMarkRead();

        return () => {
            if (socket && selectedChat.type === 'project') {
                socket.emit('leave-room', { type: selectedChat.type, id: selectedChat.id });
            }
        };
        // Explicitly exclude unreadCounts from dependencies to prevent loop
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedChat?.id, selectedChat?.type, socket, markAsRead]);

    const scrollToBottom = () => {
        setTimeout(() => {
            messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }, 100);
    };

    const handleSendMessage = () => {
        if (!newMessage.trim() || !socket || !selectedChat) return;

        const payload = { content: newMessage.trim() };
        if (selectedChat.type === 'project') payload.projectId = selectedChat.id;
        else if (selectedChat.type === 'direct') payload.recipientId = selectedChat.id;

        socket.emit('send-message', payload);
        setNewMessage('');
    };

    const renderSidebarItem = (item, type) => {
        const itemId = (item._id || item.id)?.toString().trim().toLowerCase();
        const rawId = item._id || item.id;
        const isSelected = selectedChat?.id?.toString().trim().toLowerCase() === itemId;
        const displayName = item.name || item.title;

        // Find unread count for this item with robust ID lookup
        const counts = type === 'projects' || type === 'project' ? (unreadCounts.projects || {}) : (unreadCounts.direct || {});
        const matchingKey = Object.keys(counts).find(k => k.toString().trim().toLowerCase() === itemId);
        const unreadCount = matchingKey ? counts[matchingKey] : 0;

        return (
            <div
                key={itemId}
                onClick={() => setSelectedChat({ type, id: rawId, name: displayName })}
                style={{
                    padding: '12px 16px',
                    cursor: 'pointer',
                    backgroundColor: isSelected ? '#eff6ff' : 'transparent',
                    borderLeft: isSelected ? '4px solid #3b82f6' : '4px solid transparent',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    transition: 'all 0.2s'
                }}
            >
                <div style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: type === 'direct' ? '50%' : '8px',
                    backgroundColor: isSelected ? '#3b82f6' : '#e2e8f0',
                    color: isSelected ? 'white' : '#64748b',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '14px',
                    fontWeight: '700',
                    flexShrink: 0,
                    overflow: 'hidden'
                }}>
                    {item.profile?.profilePicture ? (
                        <img src={item.profile.profilePicture} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                        displayName?.charAt(0).toUpperCase()
                    )}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{
                        fontSize: '14px',
                        fontWeight: isSelected ? '700' : '500',
                        color: isSelected ? '#1e40af' : '#1e293b',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: '8px'
                    }}>
                        <span style={{
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            flex: 1,
                            minWidth: 0
                        }}>
                            {displayName}
                        </span>
                        {unreadCount > 0 && (
                            <span style={{
                                backgroundColor: '#ef4444',
                                color: 'white',
                                fontSize: '10px',
                                padding: '2px 6px',
                                borderRadius: '10px',
                                minWidth: '18px',
                                textAlign: 'center'
                            }}>
                                {unreadCount}
                            </span>
                        )}
                    </div>
                    <div style={{ fontSize: '12px', color: '#64748b' }}>
                        {type === 'direct' ? (item.role || 'User') : (item.status ? `Status: ${item.status}` : 'Project')}
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div style={{
            position: 'fixed',
            bottom: '24px',
            right: '24px',
            width: '900px',
            height: '600px',
            backgroundColor: 'white',
            borderRadius: '24px',
            boxShadow: '0 20px 50px rgba(0,0,0,0.15)',
            display: 'flex',
            overflow: 'hidden',
            zIndex: 1000,
            border: '1px solid #e2e8f0'
        }}>
            {/* Sidebar */}
            <div style={{
                width: '280px',
                borderRight: '1px solid #f1f5f9',
                display: 'flex',
                flexDirection: 'column',
                backgroundColor: '#f8fafc'
            }}>
                <div style={{ padding: '24px', borderBottom: '1px solid #f1f5f9' }}>
                    <h2 style={{ fontSize: '20px', fontWeight: '800', margin: 0, color: '#0f172a' }}>Messaging</h2>
                </div>

                <div style={{ display: 'flex', padding: '12px', gap: '4px' }}>
                    {[
                        { id: 'direct', label: 'All Users', count: Object.values(unreadCounts.direct).reduce((a, b) => a + b, 0) },
                        { id: 'projects', label: 'Projects', count: Object.values(unreadCounts.projects).reduce((a, b) => a + b, 0) }
                    ].map(t => (
                        <button
                            key={t.id}
                            onClick={() => setActiveTab(t.id)}
                            style={{
                                flex: 1,
                                padding: '8px 4px',
                                borderRadius: '8px',
                                border: 'none',
                                backgroundColor: activeTab === t.id ? '#3b82f6' : 'transparent',
                                color: activeTab === t.id ? 'white' : '#64748b',
                                fontSize: '11px',
                                fontWeight: '700',
                                textTransform: 'uppercase',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '6px'
                            }}
                        >
                            {t.label}
                            {t.count > 0 && (
                                <span style={{
                                    backgroundColor: activeTab === t.id ? 'rgba(255,255,255,0.2)' : '#ef4444',
                                    color: 'white',
                                    padding: '1px 6px',
                                    borderRadius: '10px',
                                    fontSize: '10px'
                                }}>
                                    {t.count}
                                </span>
                            )}
                        </button>
                    ))}
                </div>

                <div style={{ flex: 1, overflowY: 'auto', paddingBottom: '20px' }}>
                    {loading ? (
                        <div style={{ padding: '20px', textAlign: 'center', color: '#64748b' }}>Loading...</div>
                    ) : (
                        <>
                            {activeTab === 'direct' && (
                                employees.length > 0 ? (
                                    employees.map(e => renderSidebarItem(e, 'direct'))
                                ) : (
                                    <div style={{ padding: '40px 20px', textAlign: 'center', color: '#64748b' }}>
                                        <div style={{ fontSize: '32px', marginBottom: '8px' }}>👥</div>
                                        <div style={{ fontSize: '13px' }}>No users found</div>
                                    </div>
                                )
                            )}
                            {activeTab === 'projects' && (
                                projects.length > 0 ? (
                                    projects.map(p => renderSidebarItem(p, 'project'))
                                ) : (
                                    <div style={{ padding: '40px 20px', textAlign: 'center', color: '#64748b' }}>
                                        <div style={{ fontSize: '32px', marginBottom: '8px' }}>📁</div>
                                        <div style={{ fontSize: '13px' }}>No projects found</div>
                                    </div>
                                )
                            )}
                        </>
                    )}
                </div>
            </div>

            {/* Main Chat Area */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                {selectedChat ? (
                    <>
                        <div style={{
                            padding: '16px 24px',
                            borderBottom: '1px solid #f1f5f9',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between'
                        }}>
                            <div>
                                <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '700' }}>{selectedChat.name}</h3>
                                <div style={{ fontSize: '12px', color: '#22c55e' }}>Online</div>
                            </div>
                            <button onClick={onClose} style={{ border: 'none', background: 'none', cursor: 'pointer', fontSize: '20px' }}>✕</button>
                        </div>

                        <div style={{ flex: 1, overflowY: 'auto', padding: '24px', backgroundColor: '#fdfdfd' }}>
                            {chatLoading ? (
                                <div style={{ textAlign: 'center', marginTop: '40px' }}>Loading messages...</div>
                            ) : messages.map((msg, i) => {
                                const currentUserId = currentUser?.id || currentUser?._id;
                                const senderId = msg.sender?._id || msg.sender?.id || (typeof msg.sender === 'string' ? msg.sender : null);
                                const isOwn = senderId?.toString() === currentUserId?.toString();
                                return (
                                    <div key={msg._id} style={{
                                        display: 'flex',
                                        flexDirection: isOwn ? 'row-reverse' : 'row',
                                        marginBottom: '16px',
                                        gap: '12px'
                                    }}>
                                        <div style={{
                                            width: '32px',
                                            height: '32px',
                                            borderRadius: '50%',
                                            backgroundColor: '#e2e8f0',
                                            color: '#64748b',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            fontSize: '12px',
                                            fontWeight: '700',
                                            flexShrink: 0,
                                            overflow: 'hidden'
                                        }}>
                                            {msg.sender?.profile?.profilePicture ? (
                                                <img src={msg.sender.profile.profilePicture} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                            ) : (
                                                (msg.sender?.name || 'U').charAt(0).toUpperCase()
                                            )}
                                        </div>
                                        <div style={{
                                            maxWidth: '70%',
                                            padding: '12px 16px',
                                            borderRadius: isOwn ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                                            backgroundColor: isOwn ? '#3b82f6' : 'white',
                                            border: isOwn ? 'none' : '1px solid #e2e8f0',
                                            color: isOwn ? 'white' : '#1e293b',
                                            boxShadow: '0 2px 4px rgba(0,0,0,0.02)'
                                        }}>
                                            {!isOwn && <div style={{ fontSize: '11px', fontWeight: '700', marginBottom: '4px', opacity: 0.8 }}>{msg.sender?.name}</div>}
                                            <div style={{ fontSize: '14px', lineHeight: '1.5' }}>{msg.content}</div>
                                            <div style={{ fontSize: '10px', marginTop: '4px', textAlign: 'right', opacity: 0.6 }}>
                                                {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                            <div ref={messagesEndRef} />
                        </div>

                        {typingUsers.length > 0 && (
                            <div style={{ padding: '0 24px 8px', fontSize: '12px', color: '#64748b', fontStyle: 'italic' }}>
                                {typingUsers[0].userName} is typing...
                            </div>
                        )}

                        <div style={{ padding: '24px', borderTop: '1px solid #f1f5f9' }}>
                            <div style={{ display: 'flex', gap: '12px' }}>
                                <input
                                    ref={inputRef}
                                    value={newMessage}
                                    onChange={(e) => setNewMessage(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                                    placeholder="Type a message..."
                                    style={{
                                        flex: 1,
                                        padding: '12px 20px',
                                        borderRadius: '12px',
                                        border: '1px solid #e2e8f0',
                                        outline: 'none',
                                        fontSize: '14px'
                                    }}
                                />
                                <button
                                    onClick={handleSendMessage}
                                    style={{
                                        padding: '12px 24px',
                                        backgroundColor: '#3b82f6',
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: '12px',
                                        fontWeight: '700',
                                        cursor: 'pointer'
                                    }}
                                >
                                    Send
                                </button>
                            </div>
                        </div>
                    </>
                ) : (
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#64748b' }}>
                        <div style={{ fontSize: '64px', marginBottom: '16px' }}>💬</div>
                        <h3>Select a conversation to start chatting</h3>
                        <p>Direct messages or project channels</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default GlobalChat;
