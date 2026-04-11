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
                className={`flex items-center gap-4 px-5 py-3 cursor-pointer transition-all duration-200
                   ${isSelected ? 'bg-indigo-50 border-r-2 border-indigo-600' : 'hover:bg-slate-100'}`}
            >
                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold shrink-0 overflow-hidden
                   ${isSelected ? 'bg-indigo-600 text-white' : 'bg-slate-200 text-slate-500'}`}>
                    {item.profile?.profilePicture ? (
                        <img src={item.profile.profilePicture} alt="" className="w-full h-full object-cover" />
                    ) : (
                        displayName?.charAt(0).toUpperCase()
                    )}
                </div>
                <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 overflow-hidden">
                        <span className={`text-sm font-semibold truncate flex-1 ${isSelected ? 'text-indigo-900' : 'text-slate-900'}`}>
                            {displayName}
                        </span>
                        {unreadCount > 0 && (
                            <span className="bg-indigo-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                                {unreadCount}
                            </span>
                        )}
                    </div>
                    <div className="text-[11px] font-medium text-slate-500 truncate">
                        {type === 'direct' ? (item.role || 'Member') : (item.status ? `Project Status: ${item.status}` : 'Project Team')}
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="fixed bottom-0 right-4 md:right-8 z-[1000] flex flex-col items-end pointer-events-none">
            {/* Docked Chat Widget */}
            <div className="pointer-events-auto w-full max-w-[700px] h-[550px] bg-white rounded-t-2xl shadow-[0_-8px_30px_rgb(0,0,0,0.12)] border border-slate-200 flex overflow-hidden animate-in slide-in-from-bottom-6 duration-300">

                {/* Main Chat Area (Left) */}
                <div className="flex-1 flex flex-col bg-white min-w-0">
                    {selectedChat ? (
                        <>
                            <div className="px-5 py-3 border-b border-slate-100 flex items-center justify-between bg-white flex-shrink-0">
                                <div className="min-w-0">
                                    <h3 className="text-sm font-bold text-slate-900 truncate">{selectedChat.name}</h3>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{selectedChat.type === 'project' ? 'Team Channel' : 'Direct Message'}</p>
                                </div>
                            </div>

                            <div className="flex-1 overflow-y-auto px-4 py-4 bg-slate-50 flex flex-col gap-3">
                                {chatLoading ? (
                                    <div className="h-full flex items-center justify-center text-[10px] font-bold text-slate-400 uppercase tracking-widest">Syning Messages...</div>
                                ) : (
                                    <>
                                        {messages.map((msg) => {
                                            const currentUserId = currentUser?.id || currentUser?._id;
                                            const senderId = msg.sender?._id || msg.sender?.id || (typeof msg.sender === 'string' ? msg.sender : null);
                                            const isOwn = senderId?.toString() === currentUserId?.toString();
                                            return (
                                                <div key={msg._id} className={`flex flex-col ${isOwn ? 'items-end' : 'items-start'}`}>
                                                    <div className={`max-w-[85%] px-3 py-2 rounded-xl text-xs transition-all shadow-sm
                                                        ${isOwn ? 'bg-indigo-600 text-white rounded-br-none' : 'bg-white text-slate-800 border border-slate-200 rounded-bl-none'}`}
                                                    >
                                                        <div className="whitespace-pre-wrap break-words">{msg.content}</div>
                                                        <div className={`mt-1 text-[8px] font-bold ${isOwn ? 'text-white/60' : 'text-slate-400 text-right'}`}>
                                                            {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                        <div ref={messagesEndRef} className="h-1" />
                                    </>
                                )}
                            </div>

                            <div className="p-3 bg-white border-t border-slate-100 flex-shrink-0">
                                {typingUsers.length > 0 && (
                                    <div className="mb-2 text-[9px] font-bold text-indigo-500">
                                        {typingUsers[0].userName} is typing…
                                    </div>
                                )}
                                <div className="flex items-end gap-2 bg-slate-50 border border-slate-200 rounded-xl p-1.5 focus-within:border-indigo-400 transition-all">
                                    <textarea
                                        ref={inputRef}
                                        value={newMessage}
                                        onChange={(e) => setNewMessage(e.target.value)}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter' && !e.shiftKey) {
                                                e.preventDefault();
                                                handleSendMessage();
                                            }
                                        }}
                                        placeholder="Write a message..."
                                        rows={1}
                                        className="flex-1 resize-none bg-transparent border-none px-2 py-1 text-xs text-slate-800 outline-none placeholder:text-slate-400"
                                    />
                                    <button
                                        onClick={handleSendMessage}
                                        className="h-7 px-3 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-[10px] font-bold transition-all disabled:opacity-20 shadow-sm"
                                        disabled={!newMessage.trim()}
                                    >
                                        Send
                                    </button>
                                </div>
                            </div>
                        </>
                    ) : (
                        <div className="flex-1 flex items-center justify-center bg-slate-50 text-center p-6">
                            <div className="space-y-1">
                                <div className="text-3xl opacity-10">💬</div>
                                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-tighter">Secure Communication</h3>
                            </div>
                        </div>
                    )}
                </div>

                {/* Sidebar / Conversation List (Right) */}
                <div className="w-[260px] bg-slate-50 border-l border-slate-200 flex flex-col shrink-0">
                    <div className="p-4 border-b border-slate-200 bg-white flex items-center justify-between">
                        <h2 className="text-sm font-bold text-slate-900">Messaging</h2>
                        <button
                            onClick={onClose}
                            className="text-slate-400 hover:text-slate-900 transition-colors"
                        >
                            ✕
                        </button>
                    </div>

                    <div className="flex p-1.5 gap-1 border-b border-slate-100 bg-white">
                        {[
                            { id: 'direct', label: 'Direct' },
                            { id: 'projects', label: 'Teams' }
                        ].map(t => (
                            <button
                                key={t.id}
                                onClick={() => setActiveTab(t.id)}
                                className={`flex-1 py-1 rounded-md text-[10px] font-bold transition-all
                                  ${activeTab === t.id ? 'bg-indigo-600 text-white' : 'text-slate-500 hover:bg-slate-50'}`}
                            >
                                {t.label}
                            </button>
                        ))}
                    </div>

                    <div className="flex-1 overflow-y-auto">
                        {loading ? (
                            <div className="p-8 text-center text-[10px] font-bold text-slate-300 uppercase tracking-widest">Loading...</div>
                        ) : (
                            <div className="divide-y divide-slate-100">
                                {activeTab === 'direct' ? (
                                    employees.length > 0 ? employees.map(e => renderSidebarItem(e, 'direct')) : (
                                        <div className="p-6 text-center text-[10px] text-slate-400 font-bold uppercase">No Contacts</div>
                                    )
                                ) : (
                                    projects.length > 0 ? projects.map(p => renderSidebarItem(p, 'project')) : (
                                        <div className="p-6 text-center text-[10px] text-slate-400 font-bold uppercase">No Teams</div>
                                    )
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default GlobalChat;
