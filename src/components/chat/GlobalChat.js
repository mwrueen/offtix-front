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
        <div className="fixed bottom-8 right-8 w-[1000px] h-[700px] bg-white rounded-[3rem] shadow-24 border border-slate-200/60 flex overflow-hidden z-[1000] animate-in slide-in-from-bottom-12 zoom-in-95 duration-500">
            {/* Sidebar */}
            <div className="w-[320px] bg-slate-50/50 border-r border-slate-100 flex flex-col shrink-0">
                <div className="p-10 border-b border-slate-100 bg-white/50">
                    <h2 className="text-xl font-black text-slate-900 uppercase tracking-[0.2em] italic">Sub_Comm_Core</h2>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Personnel_Sync_Module</p>
                </div>

                <div className="flex p-4 gap-2 border-b border-slate-50 bg-white/20">
                    {[
                        { id: 'direct', label: 'Nodes', icon: '👤', count: Object.values(unreadCounts.direct).reduce((a, b) => a + b, 0) },
                        { id: 'projects', label: 'Entities', icon: '📁', count: Object.values(unreadCounts.projects).reduce((a, b) => a + b, 0) }
                    ].map(t => (
                        <button
                            key={t.id}
                            onClick={() => setActiveTab(t.id)}
                            className={`flex items-center justify-center gap-3 flex-1 py-4 px-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all
                               ${activeTab === t.id ? 'bg-slate-900 text-white shadow-xl translate-y-[-2px]' : 'text-slate-400 hover:bg-white hover:text-slate-900'}`}
                        >
                            <span>{t.icon}</span>
                            {t.label}
                            {t.count > 0 && (
                                <span className={`ml-1 w-2 h-2 rounded-full bg-red-500 animate-pulse`} />
                            )}
                        </button>
                    ))}
                </div>

                <div className="flex-1 overflow-y-auto custom-scrollbar-sidebar pb-10">
                    {loading ? (
                        <div className="p-10 text-center animate-pulse space-y-4">
                            <div className="w-10 h-10 bg-slate-200 rounded-full mx-auto" />
                            <div className="text-[10px] font-black text-slate-300 uppercase italic">Parsing_Nodes...</div>
                        </div>
                    ) : (
                        <div className="divide-y divide-slate-50/50">
                            {activeTab === 'direct' ? (
                                employees.length > 0 ? employees.map(e => renderSidebarItem(e, 'direct')) : (
                                    <div className="p-20 text-center opacity-30 grayscale italic text-[10px] font-black uppercase tracking-widest">No_Active_Nodes</div>
                                )
                            ) : (
                                projects.length > 0 ? projects.map(p => renderSidebarItem(p, 'project')) : (
                                    <div className="p-20 text-center opacity-30 grayscale italic text-[10px] font-black uppercase tracking-widest">No_Defined_Entities</div>
                                )
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Main Chat Area */}
            <div className="flex-1 flex flex-col bg-white relative">
                {selectedChat ? (
                    <>
                        <div className="px-10 py-8 border-b border-slate-100 flex items-center justify-between bg-white/80 backdrop-blur-md sticky top-0 z-10 shadow-sm shadow-slate-200/20">
                            <div>
                                <h3 className="text-xl font-black text-slate-950 uppercase tracking-tight italic flex items-center gap-3">
                                    {selectedChat.name}
                                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.8)]" />
                                </h3>
                                <div className="text-[9px] font-bold text-slate-400 uppercase tracking-[0.3em] font-mono">SEC_LINK_ESTABLISHED // LEVEL_4</div>
                            </div>
                            <button onClick={onClose} className="w-12 h-12 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-900 hover:rotate-90 transition-all font-black">✕</button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-10 space-y-6 bg-slate-50/30 custom-scrollbar relative">
                            {chatLoading ? (
                                <div className="flex flex-col items-center justify-center h-full space-y-4 animate-pulse">
                                    <div className="w-12 h-12 border-4 border-slate-100 border-t-indigo-500 rounded-full animate-spin" />
                                    <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic">Fetching_Directives...</div>
                                </div>
                            ) : (
                                <>
                                    <div className="flex flex-col gap-6">
                                        {messages.map((msg, i) => {
                                            const currentUserId = currentUser?.id || currentUser?._id;
                                            const senderId = msg.sender?._id || msg.sender?.id || (typeof msg.sender === 'string' ? msg.sender : null);
                                            const isOwn = senderId?.toString() === currentUserId?.toString();
                                            return (
                                                <div key={msg._id} className={`flex items-end gap-4 max-w-[85%] ${isOwn ? 'flex-row-reverse self-end' : 'self-start'}`}>
                                                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-[10px] font-black shadow-inner overflow-hidden shrink-0 border-2 border-white
                                                   ${isOwn ? 'bg-indigo-600 text-white' : 'bg-slate-200 text-slate-500'}`}>
                                                        {msg.sender?.profile?.profilePicture ? (
                                                            <img src={msg.sender.profile.profilePicture} alt="" className="w-full h-full object-cover" />
                                                        ) : (
                                                            (msg.sender?.name || 'U').charAt(0).toUpperCase()
                                                        )}
                                                    </div>
                                                    <div className="space-y-1">
                                                        {!isOwn && <div className="text-[8px] font-bold text-slate-400 uppercase tracking-widest italic ml-4">{msg.sender?.name}</div>}
                                                        <div className={`p-6 rounded-[2rem] shadow-sm relative overflow-hidden transition-all
                                                      ${isOwn
                                                                ? 'bg-slate-950 text-white rounded-br-none'
                                                                : 'bg-white text-slate-800 border border-slate-100 rounded-bl-none shadow-slate-200/50'}`}>
                                                            <div className="text-[13px] leading-relaxed font-medium">{msg.content}</div>
                                                            <div className={`text-[8px] font-bold mt-3 opacity-30 select-none ${isOwn ? 'text-right' : 'text-left'}`}>
                                                                {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                            </div>
                                                            {isOwn && <div className="absolute top-0 right-0 w-12 h-12 bg-indigo-500/10 rounded-full blur-xl -translate-y-1/2 translate-x-1/2" />}
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
                            <div className="px-10 py-3 bg-white/50 backdrop-blur-sm border-t border-slate-50 flex items-center gap-3">
                                <div className="flex gap-1">
                                    <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce [animation-delay:-0.3s]" />
                                    <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce [animation-delay:-0.15s]" />
                                    <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce" />
                                </div>
                                <span className="text-[10px] font-black text-indigo-600 uppercase italic tracking-widest">{typingUsers[0].userName} typing_packet...</span>
                            </div>
                        )}

                        <div className="p-8 bg-white border-t border-slate-100">
                            <div className="flex gap-4 bg-slate-50 p-3 rounded-[2.5rem] border border-slate-200 focus-within:border-indigo-400 focus-within:ring-4 focus-within:ring-indigo-50 transition-all group">
                                <input
                                    ref={inputRef}
                                    value={newMessage}
                                    onChange={(e) => setNewMessage(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                                    placeholder="Enter authorization packet content..."
                                    className="flex-1 bg-transparent px-6 py-3 text-sm font-medium text-slate-800 outline-none placeholder:text-slate-400 placeholder:italic italic"
                                />
                                <button
                                    onClick={handleSendMessage}
                                    className="px-10 py-4 bg-slate-900 hover:bg-black text-white rounded-[2.2rem] font-black text-[10px] uppercase tracking-[0.2em] shadow-24 transition-all hover:scale-105 active:scale-95 group relative overflow-hidden"
                                >
                                    <span className="relative z-10">Push_Comm</span>
                                    <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-r from-indigo-500/0 via-white/10 to-indigo-500/0 -translate-x-full group-hover:animate-[shimmer_2s_infinite] -z-0" />
                                </button>
                            </div>
                        </div>
                    </>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center p-20 text-center animate-in fade-in zoom-in duration-1000">
                        <div className="relative mb-12">
                            <div className="text-[120px] grayscale opacity-10 animate-pulse">💬</div>
                            <div className="absolute inset-0 flex items-center justify-center">
                                <span className="text-4xl animate-bounce">📡</span>
                            </div>
                        </div>
                        <h3 className="text-2xl font-black text-slate-900 uppercase tracking-[0.3em] italic mb-4">No_Sync_Target</h3>
                        <p className="max-w-xs text-xs font-bold text-slate-400 uppercase tracking-widest leading-relaxed italic">Select a nodal entry from the registry to initiate encrypted communication protocols.</p>

                        <div className="mt-12 grid grid-cols-2 gap-4 w-full max-w-sm">
                            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                <div className="text-lg mb-1">🛡️</div>
                                <div className="text-[8px] font-black uppercase text-slate-400 tracking-widest italic">128-bit Encryption</div>
                            </div>
                            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                <div className="text-lg mb-1">⚡</div>
                                <div className="text-[8px] font-black uppercase text-slate-400 tracking-widest italic">NRT Synchronization</div>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            <style dangerouslySetInnerHTML={{
                __html: `
                .custom-scrollbar-sidebar::-webkit-scrollbar { width: 4px; }
                .custom-scrollbar-sidebar::-webkit-scrollbar-track { background: transparent; }
                .custom-scrollbar-sidebar::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 10px; }
            `}} />
        </div>
    );
};

export default GlobalChat;
