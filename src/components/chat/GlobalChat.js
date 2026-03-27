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
                className={`flex items-center gap-4 px-6 py-4 cursor-pointer border-l-4 transition-all duration-300 relative group
                   ${isSelected ? 'bg-indigo-50 border-indigo-600' : 'border-transparent hover:bg-slate-50'}`}
            >
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-xs shadow-inner overflow-hidden flex-shrink-0 transition-transform group-hover:scale-110
                   ${isSelected ? 'bg-indigo-600 text-white' : 'bg-slate-200 text-slate-500'}`}>
                    {item.profile?.profilePicture ? (
                        <img src={item.profile.profilePicture} alt="" className="w-full h-full object-cover" />
                    ) : (
                        displayName?.charAt(0).toUpperCase()
                    )}
                </div>
                <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 overflow-hidden">
                        <span className={`text-[11px] font-black uppercase tracking-tight truncate flex-1 ${isSelected ? 'text-indigo-900' : 'text-slate-800'}`}>
                            {displayName}
                        </span>
                        {unreadCount > 0 && (
                            <span className="bg-red-500 text-white text-[9px] font-black px-2 py-0.5 rounded-lg shadow-lg shadow-red-500/20 animate-pulse">
                                {unreadCount}
                            </span>
                        )}
                    </div>
                    <div className="text-[9px] font-bold text-slate-400 uppercase italic truncate">
                        {type === 'direct' ? (item.role || 'User') : (item.status ? `Status: ${item.status}` : 'Entity_Node')}
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="fixed inset-0 z-[1000]">
            {/* Backdrop */}
            <div
                onClick={onClose}
                className="absolute inset-0 bg-slate-900/30 backdrop-blur-[1px]"
            />

            {/* Modal */}
            <div className="absolute inset-x-4 bottom-4 top-4 md:inset-x-8 md:bottom-8 md:top-8 lg:inset-x-auto lg:right-8 lg:bottom-8 lg:top-8 lg:w-[980px] bg-white rounded-2xl shadow-2xl border border-slate-200 flex overflow-hidden animate-in slide-in-from-bottom-6 duration-300">
                {/* Sidebar */}
                <div className="w-[320px] bg-slate-50 border-r border-slate-200 flex flex-col shrink-0">
                    <div className="p-5 border-b border-slate-200 bg-white flex items-center justify-between">
                        <div className="min-w-0">
                            <h2 className="text-base font-semibold text-slate-900 truncate">Chat</h2>
                            <p className="text-xs text-slate-500 truncate">Direct messages & project chat</p>
                        </div>
                        <button
                            onClick={onClose}
                            className="w-9 h-9 rounded-lg border border-slate-200 bg-white text-slate-500 hover:bg-slate-50 hover:text-slate-900 transition-colors"
                            aria-label="Close chat"
                        >
                            ✕
                        </button>
                    </div>

                    <div className="flex p-3 gap-2 border-b border-slate-200 bg-white">
                        {[
                            { id: 'direct', label: 'People', count: Object.values(unreadCounts.direct || {}).reduce((a, b) => a + b, 0) },
                            { id: 'projects', label: 'Projects', count: Object.values(unreadCounts.projects || {}).reduce((a, b) => a + b, 0) }
                        ].map(t => (
                            <button
                                key={t.id}
                                onClick={() => setActiveTab(t.id)}
                                className={`flex-1 h-9 px-3 rounded-lg text-xs font-medium transition-colors border
                                  ${activeTab === t.id ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'}`}
                            >
                                <span className="flex items-center justify-center gap-2">
                                    {t.label}
                                    {t.count > 0 && (
                                        <span className={`${activeTab === t.id ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-700'} px-2 py-0.5 rounded-full text-[10px] font-bold`}>
                                            {t.count > 99 ? '99+' : t.count}
                                        </span>
                                    )}
                                </span>
                            </button>
                        ))}
                    </div>

                    <div className="flex-1 overflow-y-auto custom-scrollbar-sidebar">
                        {loading ? (
                            <div className="p-6 text-center text-sm text-slate-500">Loading…</div>
                        ) : (
                            <div className="divide-y divide-slate-200">
                                {activeTab === 'direct' ? (
                                    employees.length > 0 ? employees.map(e => renderSidebarItem(e, 'direct')) : (
                                        <div className="p-10 text-center text-sm text-slate-500">No people found</div>
                                    )
                                ) : (
                                    projects.length > 0 ? projects.map(p => renderSidebarItem(p, 'project')) : (
                                        <div className="p-10 text-center text-sm text-slate-500">No projects found</div>
                                    )
                                )}
                            </div>
                        )}
                    </div>
                </div>

                {/* Main Chat Area */}
                <div className="flex-1 flex flex-col bg-white">
                    {selectedChat ? (
                        <>
                            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-white">
                                <div className="min-w-0">
                                    <h3 className="text-sm font-semibold text-slate-900 truncate">{selectedChat.name}</h3>
                                    <p className="text-xs text-slate-500">{selectedChat.type === 'project' ? 'Project chat' : 'Direct message'}</p>
                                </div>
                            </div>

                            <div className="flex-1 overflow-y-auto px-6 py-4 bg-slate-50">
                                {chatLoading ? (
                                    <div className="h-full flex items-center justify-center text-sm text-slate-500">Loading messages…</div>
                                ) : (
                                    <>
                                        <div className="flex flex-col gap-3">
                                            {messages.map((msg) => {
                                                const currentUserId = currentUser?.id || currentUser?._id;
                                                const senderId = msg.sender?._id || msg.sender?.id || (typeof msg.sender === 'string' ? msg.sender : null);
                                                const isOwn = senderId?.toString() === currentUserId?.toString();
                                                return (
                                                    <div key={msg._id} className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
                                                        <div className={`max-w-[75%] rounded-2xl px-4 py-2 shadow-sm border text-sm leading-relaxed
                                                            ${isOwn ? 'bg-indigo-600 text-white border-indigo-600 rounded-br-md' : 'bg-white text-slate-800 border-slate-200 rounded-bl-md'}`}
                                                        >
                                                            {!isOwn && (
                                                                <div className="text-[11px] font-medium text-slate-500 mb-1">
                                                                    {msg.sender?.name || 'User'}
                                                                </div>
                                                            )}
                                                            <div className="whitespace-pre-wrap break-words">{msg.content}</div>
                                                            <div className={`mt-1 text-[10px] ${isOwn ? 'text-white/70' : 'text-slate-400'}`}>
                                                                {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                            </div>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                        <div ref={messagesEndRef} className="h-4" />
                                    </>
                                )}
                            </div>

                            {typingUsers.length > 0 && (
                                <div className="px-6 py-2 border-t border-slate-200 bg-white text-xs text-slate-500">
                                    {typingUsers[0].userName} is typing…
                                </div>
                            )}

                            <div className="p-4 bg-white border-t border-slate-200">
                                <div className="flex items-end gap-3">
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
                                        placeholder="Type a message…"
                                        rows={1}
                                        className="flex-1 resize-none max-h-32 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 outline-none focus:ring-4 focus:ring-indigo-50 focus:border-indigo-300"
                                    />
                                    <button
                                        onClick={handleSendMessage}
                                        className="h-11 px-5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                        disabled={!newMessage.trim()}
                                    >
                                        Send
                                    </button>
                                </div>
                                <div className="mt-2 text-[11px] text-slate-400">
                                    Press Enter to send, Shift+Enter for a new line.
                                </div>
                            </div>
                        </>
                    ) : (
                        <div className="flex-1 flex items-center justify-center p-10 bg-slate-50">
                            <div className="text-center">
                                <div className="text-base font-semibold text-slate-900">Select a conversation</div>
                                <div className="mt-1 text-sm text-slate-500">Choose a person or project from the left.</div>
                            </div>
                        </div>
                    )}
                </div>

                <style dangerouslySetInnerHTML={{
                    __html: `
                    .custom-scrollbar-sidebar::-webkit-scrollbar { width: 6px; }
                    .custom-scrollbar-sidebar::-webkit-scrollbar-track { background: transparent; }
                    .custom-scrollbar-sidebar::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 10px; }
                    `
                }} />
            </div>
        </div>
    );
};

export default GlobalChat;
