import React, { useState, useEffect, useRef, useMemo } from 'react';
import { chatAPI, projectAPI, userAPI, getAssetUrl } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useCompany } from '../../context/CompanyContext';
import { useChat } from '../../context/ChatContext';

const getAvatarUrl = getAssetUrl;

const formatUserRole = (role) => {
    if (!role) return 'Team Member';
    const r = role.toString().toLowerCase().trim();
    if (r === 'admin' || r === 'company_admin') return 'Administrator';
    if (r === 'user' || r === 'employee') return 'Team Member';
    if (r === 'manager') return 'Team Manager';
    if (r === 'owner') return 'Company Owner';
    return role.charAt(0).toUpperCase() + role.slice(1);
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
    const [editingMessageId, setEditingMessageId] = useState(null);
    const [editText, setEditText] = useState('');
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const [showScrollButton, setShowScrollButton] = useState(false);
    
    const messagesEndRef = useRef(null);
    const scrollContainerRef = useRef(null);
    const inputRef = useRef(null);
    const typingTimeoutRef = useRef(null);

    const currentUser = authState.user;
    const companyId = companyState.selectedCompany?.id === 'personal' ? null : companyState.selectedCompany?.id;

    // Selected Employee Object for Direct Messaging
    const selectedEmployee = useMemo(() => {
        if (!selectedChat || selectedChat.type !== 'direct') return null;
        return employees.find(e => (e._id || e.id)?.toString() === selectedChat.id?.toString());
    }, [selectedChat, employees]);

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
        setEditingMessageId(null);
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
        setShowEmojiPicker(false);
        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
        emitTyping(false);
        if (inputRef.current) inputRef.current.style.height = 'auto';
    };

    const handleStartEdit = (msg) => {
        setEditingMessageId(msg._id);
        setEditText(msg.content);
    };

    const handleSaveEdit = (msgId) => {
        if (!socket || !editText.trim()) return;
        socket.emit('edit-message', { messageId: msgId, content: editText.trim() });
        setEditingMessageId(null);
        setEditText('');
    };

    const handleDeleteMsg = (msgId) => {
        if (!socket) return;
        if (window.confirm('Are you sure you want to delete this message?')) {
            socket.emit('delete-message', { messageId: msgId });
        }
    };

    const handleCopyText = (content) => {
        if (!content) return;
        navigator.clipboard?.writeText(content);
    };

    const addEmoji = (emoji) => {
        setNewMessage(prev => prev + emoji);
        inputRef.current?.focus();
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

    const visibleEmployees = filterBySearch(employees, ['name', 'role', 'email']);
    const visibleProjects = filterBySearch(projects, ['title', 'name', 'status']);

    const selectedAvatar = selectedChat && selectedChat.type === 'direct'
        ? getAvatarUrl(selectedEmployee?.profile?.profilePicture)
        : null;

    const renderSidebarItem = (item, type) => {
        const itemId = (item._id || item.id)?.toString().trim().toLowerCase();
        const rawId = item._id || item.id;
        const isSelected = selectedChat?.id?.toString().trim().toLowerCase() === itemId;
        const displayName = item.name || item.title;
        const avatarUrl = getAvatarUrl(item.profile?.profilePicture);
        const roleLabel = type === 'direct' ? formatUserRole(item.role) : (item.status ? `Status: ${item.status}` : 'Team Workspace');

        // Find unread count for this item with robust ID lookup
        const counts = type === 'projects' || type === 'project' ? (unreadCounts.projects || {}) : (unreadCounts.direct || {});
        const matchingKey = Object.keys(counts).find(k => k.toString().trim().toLowerCase() === itemId);
        const unreadCount = matchingKey ? counts[matchingKey] : 0;

        return (
            <div
                key={itemId}
                onClick={() => setSelectedChat({ type: type === 'projects' ? 'project' : type, id: rawId, name: displayName })}
                className={`flex items-center gap-3 px-4 py-3 cursor-pointer transition-all duration-150 border-l-2
                   ${isSelected ? 'bg-indigo-50/80 border-indigo-600' : 'border-transparent hover:bg-slate-100/80'}`}
            >
                <div className="relative shrink-0">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold shrink-0 overflow-hidden shadow-2xs
                       ${type === 'project' || type === 'projects' ? 'bg-indigo-100 text-indigo-600' : 'bg-gradient-to-tr from-slate-200 to-slate-300 text-slate-700'}`}>
                        {avatarUrl ? (
                            <img src={avatarUrl} alt="" className="w-full h-full object-cover" />
                        ) : (
                            displayName?.charAt(0).toUpperCase()
                        )}
                    </div>
                    {type === 'direct' && (
                        <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-white"></span>
                    )}
                </div>

                <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                        <span className={`text-xs font-bold truncate flex-1 ${isSelected ? 'text-indigo-950' : 'text-slate-900'}`}>
                            {displayName}
                        </span>
                        {unreadCount > 0 && (
                            <span className="bg-indigo-600 text-white text-[10px] font-bold min-w-[18px] h-[18px] px-1 flex items-center justify-center rounded-full shadow-xs">
                                {unreadCount > 99 ? '99+' : unreadCount}
                            </span>
                        )}
                    </div>
                    <div className="text-[11px] font-medium text-slate-500 truncate mt-0.5">
                        {roleLabel}
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="fixed bottom-0 right-4 md:right-8 z-[1000] flex flex-col items-end pointer-events-none">
            {/* Docked Chat Widget */}
            <div className="pointer-events-auto w-[95vw] max-w-[800px] h-[620px] max-h-[85vh] bg-white rounded-t-2xl shadow-[0_-8px_40px_rgba(0,0,0,0.12)] border border-slate-200 flex overflow-hidden animate-in slide-in-from-bottom-6 duration-300">

                {/* Main Chat Area (Left) */}
                <div className="flex-1 flex flex-col bg-white min-w-0 border-r border-slate-100">
                    {selectedChat ? (
                        <>
                            {/* Chat Header */}
                            <div className="px-4 py-3 border-b border-slate-200/80 flex items-center justify-between bg-white flex-shrink-0">
                                <div className="flex items-center gap-3 min-w-0">
                                    <div className="relative shrink-0">
                                        <div className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold overflow-hidden shadow-2xs
                                           ${selectedChat.type === 'project' ? 'bg-indigo-100 text-indigo-600' : 'bg-gradient-to-tr from-slate-200 to-slate-300 text-slate-700'}`}>
                                            {selectedAvatar ? (
                                                <img src={selectedAvatar} alt="" className="w-full h-full object-cover" />
                                            ) : (
                                                selectedChat.name?.charAt(0).toUpperCase()
                                            )}
                                        </div>
                                        {selectedChat.type === 'direct' && (
                                            <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-white"></span>
                                        )}
                                    </div>

                                    <div className="min-w-0 flex-1">
                                        <h3 className="text-xs font-bold text-slate-900 truncate leading-tight">{selectedChat.name}</h3>
                                        <div className="flex items-center gap-1.5 text-[11px] font-medium text-slate-500 mt-0.5">
                                            {selectedChat.type === 'project' ? (
                                                <span className="text-indigo-600 font-semibold flex items-center gap-1">
                                                    👥 Team Channel
                                                </span>
                                            ) : (
                                                <>
                                                    <span className="text-slate-600 font-semibold">
                                                        {formatUserRole(selectedEmployee?.role)}
                                                    </span>
                                                    <span className="text-slate-300">•</span>
                                                    <span className="text-emerald-600 font-bold flex items-center gap-1">
                                                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                                                        Active Now
                                                    </span>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Chat Messages Body */}
                            <div className="relative flex-1 min-h-0">
                                <div
                                    ref={scrollContainerRef}
                                    onScroll={handleScroll}
                                    className="absolute inset-0 overflow-y-auto px-4 py-4 bg-slate-50/60 flex flex-col"
                                >
                                    {chatLoading ? (
                                        <div className="h-full flex items-center justify-center text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                            Syncing Messages...
                                        </div>
                                    ) : messages.length === 0 ? (
                                        <div className="h-full flex flex-col items-center justify-center text-center gap-2 p-6">
                                            <div className="w-12 h-12 rounded-full bg-indigo-50 flex items-center justify-center text-xl text-indigo-500">💬</div>
                                            <p className="text-xs font-bold text-slate-800">No messages yet</p>
                                            <p className="text-[11px] text-slate-400 max-w-xs">
                                                Start the conversation with {selectedChat.name}!
                                            </p>
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
                                                const isEditing = editingMessageId === msg._id;

                                                return (
                                                    <React.Fragment key={msg._id}>
                                                        {showDateSep && (
                                                            <div className="flex items-center justify-center my-3">
                                                                <span className="px-3 py-1 rounded-full bg-slate-200/80 text-[10px] font-bold text-slate-600 shadow-2xs">
                                                                    {formatDateLabel(msg.createdAt)}
                                                                </span>
                                                            </div>
                                                        )}
                                                        <div className={`flex gap-2 ${isOwn ? 'justify-end' : 'justify-start'} ${grouped ? 'mt-0.5' : 'mt-2.5'}`}>
                                                            {showAvatar && (
                                                                <div className="w-7 shrink-0 self-end">
                                                                    {!grouped && (
                                                                        <div className="w-7 h-7 rounded-full bg-slate-200 text-slate-500 text-[10px] font-bold flex items-center justify-center overflow-hidden shadow-2xs">
                                                                            {avatarUrl ? <img src={avatarUrl} alt="" className="w-full h-full object-cover" /> : senderName.charAt(0).toUpperCase()}
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            )}
                                                            <div className={`group flex flex-col max-w-[80%] ${isOwn ? 'items-end' : 'items-start'}`}>
                                                                {showSenderMeta && <span className="text-[10px] font-bold text-slate-500 mb-0.5 px-1">{senderName}</span>}
                                                                
                                                                <div className="relative flex items-center gap-1 group/bubble">
                                                                    
                                                                    {/* Quick Action Hover Bar */}
                                                                    {!msg.isDeleted && !isEditing && (
                                                                        <div className={`absolute top-1/2 -translate-y-1/2 opacity-0 group-hover/bubble:opacity-100 transition-opacity bg-white border border-slate-200 rounded-lg shadow-sm px-1 py-0.5 flex items-center gap-1 z-10 ${isOwn ? '-left-20' : '-right-20'}`}>
                                                                            <button
                                                                                onClick={() => { setReplyTo(msg); inputRef.current?.focus(); }}
                                                                                className="p-1 text-slate-400 hover:text-indigo-600 rounded text-[10px] font-bold"
                                                                                title="Reply"
                                                                            >
                                                                                💬
                                                                            </button>                                                                            <button
                                                                                onClick={() => handleCopyText(msg.content)}
                                                                                className="p-1 text-slate-400 hover:text-indigo-600 rounded text-[10px] font-bold"
                                                                                title="Copy text"
                                                                            >
                                                                                📋
                                                                            </button>
                                                                            {isOwn && (
                                                                                <>
                                                                                    <button
                                                                                        onClick={() => handleStartEdit(msg)}
                                                                                        className="p-1 text-slate-400 hover:text-indigo-600 rounded text-[10px] font-bold"
                                                                                        title="Edit"
                                                                                    >
                                                                                        ✏️
                                                                                    </button>
                                                                                    <button
                                                                                        onClick={() => handleDeleteMsg(msg._id)}
                                                                                        className="p-1 text-slate-400 hover:text-rose-600 rounded text-[10px] font-bold"
                                                                                        title="Delete"
                                                                                    >
                                                                                        🗑️
                                                                                    </button>
                                                                                </>
                                                                            )}
                                                                        </div>
                                                                    )}

                                                                    {/* Message Bubble Content */}
                                                                    <div className={`relative px-3.5 py-2.5 rounded-2xl text-xs shadow-2xs leading-relaxed
                                                                        ${isOwn ? 'bg-gradient-to-r from-indigo-600 to-indigo-700 text-white rounded-br-xs' : 'bg-white text-slate-800 border border-slate-200/80 rounded-bl-xs'}`}
                                                                    >
                                                                        {repliedTo && (
                                                                            <div className={`mb-1.5 px-2.5 py-1 rounded-lg border-l-2 text-[10px]
                                                                                ${isOwn ? 'bg-white/15 border-white/60 text-white/90' : 'bg-slate-100 border-indigo-500 text-slate-600'}`}
                                                                            >
                                                                                <div className="font-bold truncate">{repliedTo.sender?.name || 'Reply'}</div>
                                                                                <div className="truncate opacity-80">{repliedTo.content}</div>
                                                                            </div>
                                                                        )}

                                                                        {isEditing ? (
                                                                            <div className="flex flex-col gap-2 min-w-[200px]">
                                                                                <input
                                                                                    type="text"
                                                                                    value={editText}
                                                                                    onChange={(e) => setEditText(e.target.value)}
                                                                                    onKeyDown={(e) => e.key === 'Enter' && handleSaveEdit(msg._id)}
                                                                                    className="w-full px-2 py-1 bg-white text-slate-900 rounded border border-indigo-300 text-xs outline-none"
                                                                                    autoFocus
                                                                                />
                                                                                <div className="flex justify-end gap-1.5">
                                                                                    <button
                                                                                        onClick={() => setEditingMessageId(null)}
                                                                                        className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-200 text-slate-700"
                                                                                    >
                                                                                        Cancel
                                                                                    </button>
                                                                                    <button
                                                                                        onClick={() => handleSaveEdit(msg._id)}
                                                                                        className="text-[10px] font-bold px-2 py-0.5 rounded bg-indigo-600 text-white"
                                                                                    >
                                                                                        Save
                                                                                    </button>
                                                                                </div>
                                                                            </div>
                                                                        ) : msg.isDeleted ? (
                                                                            <span className="italic opacity-60">This message was deleted</span>
                                                                        ) : (
                                                                            <div className="whitespace-pre-wrap break-words">{msg.content}</div>
                                                                        )}

                                                                        <div className={`mt-1 flex items-center gap-1 text-[9px] font-semibold ${isOwn ? 'text-white/70 justify-end' : 'text-slate-400'}`}>
                                                                            {msg.isEdited && !msg.isDeleted && <span>edited •</span>}
                                                                            <span>{new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                                                        </div>
                                                                    </div>
                                                                </div>
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

                            {/* Chat Footer / Input Controls */}
                            <div className="p-3 bg-white border-t border-slate-100 flex-shrink-0 relative">
                                
                                {/* Quick Emoji Bar */}
                                {showEmojiPicker && (
                                    <div className="absolute bottom-16 left-3 bg-white border border-slate-200 rounded-xl p-2 shadow-lg flex gap-2 z-20 animate-in fade-in slide-in-from-bottom-2">
                                        {['👍', '❤️', '🎉', '🚀', '🔥', '💡', '😊', '🙌'].map((emoji) => (
                                            <button
                                                key={emoji}
                                                onClick={() => addEmoji(emoji)}
                                                className="hover:scale-125 transition-transform text-base p-1"
                                            >
                                                {emoji}
                                            </button>
                                        ))}
                                    </div>
                                )}

                                {typingUsers.length > 0 && (
                                    <div className="mb-1.5 flex items-center gap-1.5 text-[10px] font-semibold text-indigo-600">
                                        <span className="flex gap-0.5">
                                            <span className="w-1 h-1 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                                            <span className="w-1 h-1 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                                            <span className="w-1 h-1 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                                        </span>
                                        {typingUsers[0].userName} is typing...
                                    </div>
                                )}

                                {replyTo && (
                                    <div className="mb-2 flex items-start justify-between gap-2 px-3 py-1.5 bg-indigo-50/70 border-l-2 border-indigo-600 rounded-lg">
                                        <div className="min-w-0">
                                            <div className="text-[10px] font-bold text-indigo-700">Replying to {replyTo.sender?.name || 'message'}</div>
                                            <div className="text-[11px] text-slate-600 truncate">{replyTo.content}</div>
                                        </div>
                                        <button onClick={() => setReplyTo(null)} className="text-slate-400 hover:text-slate-700 text-xs shrink-0 font-bold">✕</button>
                                    </div>
                                )}

                                <div className="flex items-end gap-2 bg-slate-50 border border-slate-200 rounded-2xl p-1.5 focus-within:bg-white focus-within:border-indigo-500 focus-within:ring-2 focus-within:ring-indigo-100 transition-all">
                                    
                                    {/* Emoji Toggle Button */}
                                    <button
                                        type="button"
                                        onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                                        className="p-1.5 text-slate-400 hover:text-indigo-600 transition-colors text-sm shrink-0"
                                        title="Quick Emojis"
                                    >
                                        😊
                                    </button>

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
                                        className="w-8 h-8 flex items-center justify-center rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white transition-all disabled:opacity-30 disabled:cursor-not-allowed shadow-xs shrink-0"
                                        disabled={!newMessage.trim()}
                                        title="Send message"
                                    >
                                        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" /></svg>
                                    </button>
                                </div>
                            </div>
                        </>
                    ) : (
                        <div className="flex-1 flex items-center justify-center bg-slate-50/50 text-center p-6">
                            <div className="space-y-2">
                                <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-2xl mx-auto text-slate-400">💬</div>
                                <h3 className="text-sm font-bold text-slate-700">Select a Conversation</h3>
                                <p className="text-xs text-slate-400 max-w-[220px]">Choose a team member or channel to start chatting</p>
                            </div>
                        </div>
                    )}
                </div>

                {/* Sidebar / Conversation List (Right) */}
                <div className="w-[280px] bg-slate-50/80 flex flex-col shrink-0">
                    <div className="p-4 pb-3 border-b border-slate-200 bg-white">
                        <div className="flex items-center justify-between mb-3">
                            <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Messaging</h2>
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
                                className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition-all placeholder:text-slate-400"
                            />
                        </div>
                    </div>

                    <div className="flex p-1.5 gap-1 border-b border-slate-200/80 bg-white">
                        {[
                            { id: 'direct', label: 'Direct' },
                            { id: 'projects', label: 'Teams' }
                        ].map(t => (
                            <button
                                key={t.id}
                                onClick={() => setActiveTab(t.id)}
                                className={`flex-1 py-1.5 rounded-md text-xs font-bold transition-all
                                  ${activeTab === t.id ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-500 hover:bg-slate-50'}`}
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
