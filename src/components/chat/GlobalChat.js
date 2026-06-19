import React, { useState, useEffect, useRef } from 'react';
import { chatAPI, projectAPI, userAPI, BASE_SERVER_URL } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useCompany } from '../../context/CompanyContext';
import { useChat } from '../../context/ChatContext';

const getAvatarUrl = (path) => {
    if (!path) return null;
    if (path.startsWith('http') || path.startsWith('data:')) return path;
    return `${BASE_SERVER_URL}${path.startsWith('/') ? '' : '/'}${path}`;
};

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
    const [searchQuery, setSearchQuery] = useState('');
    const [replyTo, setReplyTo] = useState(null);
    const [showScrollButton, setShowScrollButton] = useState(false);
    const messagesEndRef = useRef(null);
    const scrollContainerRef = useRef(null);
    const inputRef = useRef(null);
    const typingTimeoutRef = useRef(null);

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

        const handleMessageEdited = (edited) => {
            setMessages(prev => prev.map(m => (m._id === edited._id ? edited : m)));
        };

        const handleMessageDeleted = ({ messageId }) => {
            setMessages(prev => prev.map(m => (m._id === messageId ? { ...m, isDeleted: true } : m)));
        };

        socket.on('new-message', handleNewMessage);
        socket.on('user-typing', handleUserTyping);
        socket.on('message-edited', handleMessageEdited);
        socket.on('message-deleted', handleMessageDeleted);

        return () => {
            socket.off('new-message', handleNewMessage);
            socket.off('user-typing', handleUserTyping);
            socket.off('message-edited', handleMessageEdited);
            socket.off('message-deleted', handleMessageDeleted);
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
    }, [companyId, currentUser?.id, currentUser?._id]);

    // Join/Leave rooms and fetch messages when selectedChat changes
    useEffect(() => {
        if (!selectedChat) return;

        setReplyTo(null);
        setTypingUsers([]);

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

    const scrollToBottom = (smooth = true) => {
        setTimeout(() => {
            messagesEndRef.current?.scrollIntoView({ behavior: smooth ? 'smooth' : 'auto' });
        }, 80);
    };

    const handleScroll = (e) => {
        const el = e.target;
        const nearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 80;
        setShowScrollButton(!nearBottom);
    };

    const emitTyping = (isTyping) => {
        if (!socket || !selectedChat) return;
        const payload = { isTyping };
        if (selectedChat.type === 'project') payload.projectId = selectedChat.id;
        else payload.recipientId = selectedChat.id;
        socket.emit('typing', payload);
    };

    const handleInputChange = (e) => {
        setNewMessage(e.target.value);
        const el = inputRef.current;
        if (el) {
            el.style.height = 'auto';
            el.style.height = `${Math.min(el.scrollHeight, 120)}px`;
        }
        emitTyping(true);
        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = setTimeout(() => emitTyping(false), 1500);
    };

    const handleSendMessage = () => {
        if (!newMessage.trim() || !socket || !selectedChat) return;

        const payload = { content: newMessage.trim() };
        if (selectedChat.type === 'project') payload.projectId = selectedChat.id;
        else if (selectedChat.type === 'direct') payload.recipientId = selectedChat.id;
        if (replyTo?._id) payload.replyTo = replyTo._id;

        socket.emit('send-message', payload);
        setNewMessage('');
        setReplyTo(null);
        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
        emitTyping(false);
        if (inputRef.current) inputRef.current.style.height = 'auto';
    };

    const resolveReply = (ref) => {
        if (!ref) return null;
        if (typeof ref === 'object') return ref;
        return messages.find(m => m._id?.toString() === ref?.toString()) || null;
    };

    const formatDateLabel = (date) => {
        const d = new Date(date);
        const today = new Date();
        const yesterday = new Date();
        yesterday.setDate(today.getDate() - 1);
        if (d.toDateString() === today.toDateString()) return 'Today';
        if (d.toDateString() === yesterday.toDateString()) return 'Yesterday';
        return d.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });
    };

    const currentUserId = (currentUser?.id || currentUser?._id)?.toString();

    const filterBySearch = (list, keys) => {
        const q = searchQuery.trim().toLowerCase();
        if (!q) return list;
        return list.filter(item => keys.some(k => (item[k] || '').toString().toLowerCase().includes(q)));
    };

    const visibleEmployees = filterBySearch(employees, ['name', 'role']);
    const visibleProjects = filterBySearch(projects, ['title', 'name', 'status']);

    const selectedAvatar = selectedChat && selectedChat.type === 'direct'
        ? getAvatarUrl(employees.find(e => (e._id || e.id)?.toString() === selectedChat.id?.toString())?.profile?.profilePicture)
        : null;

    const renderSidebarItem = (item, type) => {
        const itemId = (item._id || item.id)?.toString().trim().toLowerCase();
        const rawId = item._id || item.id;
        const isSelected = selectedChat?.id?.toString().trim().toLowerCase() === itemId;
        const displayName = item.name || item.title;
        const avatarUrl = getAvatarUrl(item.profile?.profilePicture);

        // Find unread count for this item with robust ID lookup
        const counts = type === 'projects' || type === 'project' ? (unreadCounts.projects || {}) : (unreadCounts.direct || {});
        const matchingKey = Object.keys(counts).find(k => k.toString().trim().toLowerCase() === itemId);
        const unreadCount = matchingKey ? counts[matchingKey] : 0;

        return (
            <div
                key={itemId}
                onClick={() => setSelectedChat({ type, id: rawId, name: displayName })}
                className={`flex items-center gap-3 px-4 py-2.5 cursor-pointer transition-all duration-200 border-l-2
                   ${isSelected ? 'bg-indigo-50 border-indigo-600' : 'border-transparent hover:bg-slate-100'}`}
            >
                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold shrink-0 overflow-hidden
                   ${type === 'project' ? 'bg-indigo-100 text-indigo-600' : 'bg-slate-200 text-slate-500'}`}>
                    {avatarUrl ? (
                        <img src={avatarUrl} alt="" className="w-full h-full object-cover" />
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
                            <span className="bg-indigo-600 text-white text-[10px] font-bold min-w-[18px] h-[18px] px-1 flex items-center justify-center rounded-full">
                                {unreadCount > 99 ? '99+' : unreadCount}
                            </span>
                        )}
                    </div>
                    <div className="text-[11px] font-medium text-slate-500 truncate">
                        {type === 'direct' ? (item.role || 'Member') : (item.status ? `Status: ${item.status}` : 'Project Team')}
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="fixed bottom-0 right-4 md:right-8 z-[1000] flex flex-col items-end pointer-events-none">
            {/* Docked Chat Widget */}
            <div className="pointer-events-auto w-[95vw] max-w-[760px] h-[600px] max-h-[85vh] bg-white rounded-t-2xl shadow-[0_-8px_40px_rgb(0,0,0,0.15)] border border-slate-200 flex overflow-hidden animate-in slide-in-from-bottom-6 duration-300">

                {/* Main Chat Area (Left) */}
                <div className="flex-1 flex flex-col bg-white min-w-0">
                    {selectedChat ? (
                        <>
                            <div className="px-4 py-3 border-b border-slate-100 flex items-center gap-3 bg-white flex-shrink-0">
                                <div className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold overflow-hidden shrink-0
                                   ${selectedChat.type === 'project' ? 'bg-indigo-100 text-indigo-600' : 'bg-slate-200 text-slate-500'}`}>
                                    {selectedAvatar ? (
                                        <img src={selectedAvatar} alt="" className="w-full h-full object-cover" />
                                    ) : (
                                        selectedChat.name?.charAt(0).toUpperCase()
                                    )}
                                </div>
                                <div className="min-w-0 flex-1">
                                    <h3 className="text-sm font-bold text-slate-900 truncate leading-tight">{selectedChat.name}</h3>
                                    <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">{selectedChat.type === 'project' ? 'Team Channel' : 'Direct Message'}</p>
                                </div>
                            </div>

                            <div className="relative flex-1 min-h-0">
                                <div
                                    ref={scrollContainerRef}
                                    onScroll={handleScroll}
                                    className="absolute inset-0 overflow-y-auto px-4 py-4 bg-slate-50 flex flex-col"
                                >
                                    {chatLoading ? (
                                        <div className="h-full flex items-center justify-center text-[10px] font-bold text-slate-400 uppercase tracking-widest">Syncing Messages...</div>
                                    ) : messages.length === 0 ? (
                                        <div className="h-full flex flex-col items-center justify-center text-center gap-1">
                                            <div className="text-2xl opacity-20">💬</div>
                                            <p className="text-[11px] font-semibold text-slate-400">No messages yet</p>
                                            <p className="text-[10px] text-slate-400">Say hello to start the conversation</p>
                                        </div>
                                    ) : (
                                        <>
                                            {messages.filter(Boolean).map((msg, idx) => {
                                                const senderId = msg.sender?._id || msg.sender?.id || (typeof msg.sender === 'string' ? msg.sender : null);
                                                const isOwn = senderId?.toString() === currentUserId;
                                                const prev = messages[idx - 1];
                                                const prevSenderId = prev ? (prev.sender?._id || prev.sender?.id || (typeof prev.sender === 'string' ? prev.sender : null)) : null;
                                                const showDateSep = !prev || new Date(prev.createdAt).toDateString() !== new Date(msg.createdAt).toDateString();
                                                const grouped = prev && !showDateSep && prevSenderId?.toString() === senderId?.toString()
                                                    && (new Date(msg.createdAt) - new Date(prev.createdAt) < 5 * 60 * 1000);
                                                const senderName = msg.sender?.name || 'Member';
                                                const avatarUrl = getAvatarUrl(msg.sender?.profile?.profilePicture);
                                                const repliedTo = resolveReply(msg.replyTo);
                                                const showSenderMeta = selectedChat.type === 'project' && !isOwn && !grouped;
                                                const showAvatar = selectedChat.type === 'project' && !isOwn;
                                                return (
                                                    <React.Fragment key={msg._id}>
                                                        {showDateSep && (
                                                            <div className="flex items-center justify-center my-3">
                                                                <span className="px-3 py-1 rounded-full bg-slate-200/70 text-[10px] font-semibold text-slate-500">{formatDateLabel(msg.createdAt)}</span>
                                                            </div>
                                                        )}
                                                        <div className={`flex gap-2 ${isOwn ? 'justify-end' : 'justify-start'} ${grouped ? 'mt-0.5' : 'mt-2'}`}>
                                                            {showAvatar && (
                                                                <div className="w-7 shrink-0 self-end">
                                                                    {!grouped && (
                                                                        <div className="w-7 h-7 rounded-full bg-slate-200 text-slate-500 text-[10px] font-bold flex items-center justify-center overflow-hidden">
                                                                            {avatarUrl ? <img src={avatarUrl} alt="" className="w-full h-full object-cover" /> : senderName.charAt(0).toUpperCase()}
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            )}
                                                            <div className={`group flex flex-col max-w-[78%] ${isOwn ? 'items-end' : 'items-start'}`}>
                                                                {showSenderMeta && <span className="text-[10px] font-bold text-slate-500 mb-0.5 px-1">{senderName}</span>}
                                                                <div className={`relative px-3 py-2 rounded-2xl text-xs shadow-sm
                                                                    ${isOwn ? 'bg-indigo-600 text-white rounded-br-md' : 'bg-white text-slate-800 border border-slate-200 rounded-bl-md'}`}
                                                                >
                                                                    {repliedTo && (
                                                                        <div className={`mb-1.5 px-2 py-1 rounded-lg border-l-2 text-[10px]
                                                                            ${isOwn ? 'bg-white/15 border-white/50 text-white/80' : 'bg-slate-100 border-indigo-400 text-slate-500'}`}
                                                                        >
                                                                            <div className="font-bold truncate">{repliedTo.sender?.name || 'Reply'}</div>
                                                                            <div className="truncate opacity-80">{repliedTo.content}</div>
                                                                        </div>
                                                                    )}
                                                                    {msg.isDeleted ? (
                                                                        <span className="italic opacity-60">This message was deleted</span>
                                                                    ) : (
                                                                        <div className="whitespace-pre-wrap break-words">{msg.content}</div>
                                                                    )}
                                                                    <div className={`mt-1 flex items-center gap-1 text-[9px] font-semibold ${isOwn ? 'text-white/60 justify-end' : 'text-slate-400'}`}>
                                                                        {msg.isEdited && !msg.isDeleted && <span>edited</span>}
                                                                        <span>{new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                                                    </div>
                                                                </div>
                                                                {!msg.isDeleted && (
                                                                    <button
                                                                        onClick={() => { setReplyTo(msg); inputRef.current?.focus(); }}
                                                                        className="opacity-0 group-hover:opacity-100 transition-opacity text-[9px] font-bold text-slate-400 hover:text-indigo-600 mt-0.5 px-1"
                                                                    >
                                                                        Reply
                                                                    </button>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </React.Fragment>
                                                );
                                            })}
                                            <div ref={messagesEndRef} className="h-1" />
                                        </>
                                    )}
                                </div>

                                {showScrollButton && (
                                    <button
                                        onClick={() => scrollToBottom(true)}
                                        className="absolute bottom-3 right-3 w-8 h-8 rounded-full bg-white border border-slate-200 shadow-md flex items-center justify-center text-slate-500 hover:text-indigo-600 hover:border-indigo-300 transition-all"
                                        title="Scroll to latest"
                                    >
                                        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M19 14l-7 7m0 0l-7-7m7 7V3" /></svg>
                                    </button>
                                )}
                            </div>

                            <div className="p-3 bg-white border-t border-slate-100 flex-shrink-0">
                                {typingUsers.length > 0 && (
                                    <div className="mb-1.5 flex items-center gap-1.5 text-[10px] font-semibold text-indigo-500">
                                        <span className="flex gap-0.5">
                                            <span className="w-1 h-1 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                                            <span className="w-1 h-1 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                                            <span className="w-1 h-1 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                                        </span>
                                        {typingUsers[0].userName} is typing
                                    </div>
                                )}
                                {replyTo && (
                                    <div className="mb-2 flex items-start justify-between gap-2 px-3 py-1.5 bg-slate-50 border-l-2 border-indigo-500 rounded-lg">
                                        <div className="min-w-0">
                                            <div className="text-[10px] font-bold text-indigo-600">Replying to {replyTo.sender?.name || 'message'}</div>
                                            <div className="text-[11px] text-slate-500 truncate">{replyTo.content}</div>
                                        </div>
                                        <button onClick={() => setReplyTo(null)} className="text-slate-400 hover:text-slate-700 text-xs shrink-0">✕</button>
                                    </div>
                                )}
                                <div className="flex items-end gap-2 bg-slate-50 border border-slate-200 rounded-2xl p-1.5 focus-within:border-indigo-400 focus-within:ring-2 focus-within:ring-indigo-100 transition-all">
                                    <textarea
                                        ref={inputRef}
                                        value={newMessage}
                                        onChange={handleInputChange}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter' && !e.shiftKey) {
                                                e.preventDefault();
                                                handleSendMessage();
                                            }
                                        }}
                                        placeholder="Write a message..."
                                        rows={1}
                                        className="flex-1 resize-none bg-transparent border-none px-2 py-1.5 text-xs text-slate-800 outline-none placeholder:text-slate-400 max-h-[120px]"
                                    />
                                    <button
                                        onClick={handleSendMessage}
                                        className="w-8 h-8 flex items-center justify-center rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white transition-all disabled:opacity-30 disabled:cursor-not-allowed shadow-sm shrink-0"
                                        disabled={!newMessage.trim()}
                                        title="Send"
                                    >
                                        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" /></svg>
                                    </button>
                                </div>
                            </div>
                        </>
                    ) : (
                        <div className="flex-1 flex items-center justify-center bg-slate-50 text-center p-6">
                            <div className="space-y-2">
                                <div className="text-4xl opacity-15">💬</div>
                                <h3 className="text-sm font-bold text-slate-500">Select a conversation</h3>
                                <p className="text-[11px] text-slate-400 max-w-[200px]">Pick a contact or team channel to start messaging</p>
                            </div>
                        </div>
                    )}
                </div>

                {/* Sidebar / Conversation List (Right) */}
                <div className="w-[280px] bg-slate-50 border-l border-slate-200 flex flex-col shrink-0">
                    <div className="p-4 pb-3 border-b border-slate-200 bg-white">
                        <div className="flex items-center justify-between mb-3">
                            <h2 className="text-sm font-bold text-slate-900">Messaging</h2>
                            <button
                                onClick={onClose}
                                className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-900 hover:bg-slate-100 transition-all"
                                title="Close"
                            >
                                ✕
                            </button>
                        </div>
                        <div className="relative">
                            <svg className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8" /><path strokeLinecap="round" d="M21 21l-4.35-4.35" /></svg>
                            <input
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder={`Search ${activeTab === 'direct' ? 'contacts' : 'teams'}...`}
                                className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-[11px] text-slate-700 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition-all placeholder:text-slate-400"
                            />
                        </div>
                    </div>

                    <div className="flex p-1.5 gap-1 border-b border-slate-100 bg-white">
                        {[
                            { id: 'direct', label: 'Direct' },
                            { id: 'projects', label: 'Teams' }
                        ].map(t => (
                            <button
                                key={t.id}
                                onClick={() => setActiveTab(t.id)}
                                className={`flex-1 py-1.5 rounded-md text-[11px] font-bold transition-all
                                  ${activeTab === t.id ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-500 hover:bg-slate-50'}`}
                            >
                                {t.label}
                            </button>
                        ))}
                    </div>

                    <div className="flex-1 overflow-y-auto">
                        {loading ? (
                            <div className="p-8 text-center text-[10px] font-bold text-slate-300 uppercase tracking-widest">Loading...</div>
                        ) : (
                            <div>
                                {activeTab === 'direct' ? (
                                    visibleEmployees.length > 0 ? visibleEmployees.map(e => renderSidebarItem(e, 'direct')) : (
                                        <div className="p-6 text-center text-[10px] text-slate-400 font-bold uppercase">{searchQuery ? 'No Matches' : 'No Contacts'}</div>
                                    )
                                ) : (
                                    visibleProjects.length > 0 ? visibleProjects.map(p => renderSidebarItem(p, 'project')) : (
                                        <div className="p-6 text-center text-[10px] text-slate-400 font-bold uppercase">{searchQuery ? 'No Matches' : 'No Teams'}</div>
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
