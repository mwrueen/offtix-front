import React, { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import { chatAPI, getSocketUrl } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { getCookie } from '../../utils/cookies';
import DeleteConfirmModal from '../common/DeleteConfirmModal';

const ChatTab = ({ projectId, project }) => {
  const { state: authState } = useAuth();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [socket, setSocket] = useState(null);
  const [connected, setConnected] = useState(false);
  const [typingUsers, setTypingUsers] = useState([]);
  const [showMentions, setShowMentions] = useState(false);
  const [mentionSearch, setMentionSearch] = useState('');
  const [mentionIndex, setMentionIndex] = useState(0);
  const [cursorPosition, setCursorPosition] = useState(0);
  const [deleteModal, setDeleteModal] = useState({ isOpen: false, id: null });
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  // Initialize socket connection
  useEffect(() => {
    const token = getCookie('authToken');
    if (!token) return;

    const newSocket = io(getSocketUrl(), {
      auth: { token },
      transports: ['websocket', 'polling']
    });

    newSocket.on('connect', () => {
      setConnected(true);
      newSocket.emit('join-project', projectId);
    });

    newSocket.on('disconnect', () => {
      setConnected(false);
    });

    newSocket.on('new-message', (message) => {
      setMessages(prev => [...prev, message]);
      scrollToBottom();
    });

    newSocket.on('message-deleted', ({ messageId }) => {
      setMessages(prev => prev.filter(m => m._id !== messageId));
    });

    newSocket.on('user-typing', ({ userId, userName, isTyping }) => {
      setTypingUsers(prev => {
        if (isTyping) {
          if (!prev.find(u => u.userId === userId)) {
            return [...prev, { userId, userName }];
          }
        } else {
          return prev.filter(u => u.userId !== userId);
        }
        return prev;
      });
    });

    setSocket(newSocket);

    return () => {
      newSocket.emit('leave-project', projectId);
      newSocket.disconnect();
    };
  }, [projectId]);

  // Fetch initial data
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [messagesRes, membersRes] = await Promise.all([
          chatAPI.getProjectMessages(projectId),
          chatAPI.getProjectMembers(projectId)
        ]);
        setMessages(messagesRes.data.messages || []);
        setMembers(membersRes.data || []);
        scrollToBottom();
      } catch (error) {
        console.error('Error fetching chat data:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [projectId]);

  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  const handleInputChange = (e) => {
    const value = e.target.value;
    const position = e.target.selectionStart;
    setNewMessage(value);
    setCursorPosition(position);

    // Check for @ mentions
    const textBeforeCursor = value.substring(0, position);
    const atIndex = textBeforeCursor.lastIndexOf('@');

    if (atIndex !== -1) {
      const textAfterAt = textBeforeCursor.substring(atIndex + 1);
      if (!textAfterAt.includes(' ')) {
        setMentionSearch(textAfterAt.toLowerCase());
        setShowMentions(true);
        setMentionIndex(0);
        return;
      }
    }
    setShowMentions(false);

    // Emit typing indicator
    if (socket && connected) {
      socket.emit('typing', { projectId, isTyping: true });
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(() => {
        socket.emit('typing', { projectId, isTyping: false });
      }, 2000);
    }
  };

  const filteredMembers = members.filter(m =>
    m.name.toLowerCase().includes(mentionSearch) ||
    m.email.toLowerCase().includes(mentionSearch)
  );

  const insertMention = (member) => {
    const textBeforeCursor = newMessage.substring(0, cursorPosition);
    const atIndex = textBeforeCursor.lastIndexOf('@');
    const textAfterCursor = newMessage.substring(cursorPosition);

    const newText = textBeforeCursor.substring(0, atIndex) +
      `@${member.name} ` + textAfterCursor;

    setNewMessage(newText);
    setShowMentions(false);
    inputRef.current?.focus();
  };

  const handleKeyDown = (e) => {
    if (showMentions && filteredMembers.length > 0) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setMentionIndex(prev => (prev + 1) % filteredMembers.length);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setMentionIndex(prev => prev === 0 ? filteredMembers.length - 1 : prev - 1);
      } else if (e.key === 'Enter' || e.key === 'Tab') {
        e.preventDefault();
        insertMention(filteredMembers[mentionIndex]);
        return;
      } else if (e.key === 'Escape') {
        setShowMentions(false);
      }
    } else if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const extractMentions = (text) => {
    const mentionedUsers = [];
    members.forEach(member => {
      if (text.includes(`@${member.name}`)) {
        mentionedUsers.push(member._id);
      }
    });
    return mentionedUsers;
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !socket || !connected) return;

    setSending(true);
    try {
      const mentions = extractMentions(newMessage);
      socket.emit('send-message', {
        projectId,
        content: newMessage.trim(),
        mentions
      });
      setNewMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setSending(false);
    }
  };

  const handleDeleteMessage = (messageId) => {
    setDeleteModal({ isOpen: true, id: messageId });
  };

  const confirmDeleteMessage = async () => {
    try {
      await chatAPI.deleteMessage(deleteModal.id);
      setDeleteModal({ isOpen: false, id: null });
    } catch (error) {
      console.error('Error deleting message:', error);
    }
  };

  const formatTime = (date) => {
    return new Date(date).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatDate = (date) => {
    const d = new Date(date);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (d.toDateString() === today.toDateString()) return 'Today';
    if (d.toDateString() === yesterday.toDateString()) return 'Yesterday';
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const renderMessageContent = (content) => {
    const parts = content.split(/(@\w+(?:\s\w+)?)/g);
    return parts.map((part, i) => {
      if (part.startsWith('@')) {
        const mentionedMember = members.find(m => `@${m.name}` === part);
        if (mentionedMember) {
          return (
            <span key={i} className="text-indigo-600 font-bold bg-indigo-50 px-1 rounded">
              {part}
            </span>
          );
        }
      }
      return part;
    });
  };

  const groupedMessages = messages.reduce((groups, message) => {
    const date = formatDate(message.createdAt);
    if (!groups[date]) groups[date] = [];
    groups[date].push(message);
    return groups;
  }, {});

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 animate-pulse">
        <div className="w-10 h-10 border-4 border-slate-200 border-t-indigo-600 rounded-full animate-spin mb-4" />
        <p className="text-slate-400 font-bold text-[10px] uppercase tracking-widest">Initialising Comms...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[700px] bg-slate-50 rounded-3xl border border-slate-200 overflow-hidden shadow-inner font-sans">
      {/* Header Stat Area */}
      <div className="px-6 py-3 bg-white border-b border-slate-200 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${connected ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]' : 'bg-rose-500'}`} />
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
            {connected ? 'Channel Active' : 'Offline'}
          </span>
        </div>
        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
          {members.length} team members synchronized
        </div>
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto p-6 space-y-8 scrollbar-thin scroll-smooth bg-slate-50/30">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center opacity-40">
            <div className="text-6xl mb-4">💬</div>
            <h3 className="text-lg font-bold text-slate-900 capitalize">Secure Channel Established</h3>
            <p className="text-xs text-slate-500 max-w-[200px] mx-auto mt-2 italic font-medium">Commence team synchronization. All signals are encrypted.</p>
          </div>
        ) : (
          Object.entries(groupedMessages).map(([date, dateMessages]) => (
            <div key={date}>
              <div className="flex items-center gap-4 my-8">
                <div className="flex-1 h-px bg-slate-200" />
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-[0.2em]">{date}</span>
                <div className="flex-1 h-px bg-slate-200" />
              </div>

              <div className="space-y-4">
                {dateMessages.map((message, index) => {
                  const currentUserId = authState.user?.id || authState.user?._id;
                  const isOwn = message.sender?._id === currentUserId;
                  const showHeader = index === 0 || dateMessages[index - 1]?.sender?._id !== message.sender?._id;

                  return (
                    <div key={message._id} className={`flex ${isOwn ? 'justify-end' : 'justify-start'} group transition-all`}>
                      <div className={`flex flex-col max-w-[80%] ${isOwn ? 'items-end' : 'items-start'}`}>
                        {showHeader && !isOwn && (
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1 mb-1">{message.sender?.name}</span>
                        )}

                        <div className="relative group">
                          <div className={`px-4 py-3 rounded-2xl text-sm leading-relaxed shadow-sm font-medium ${isOwn ? 'bg-indigo-600 text-white rounded-tr-none' : 'bg-white border border-slate-200 text-slate-800 rounded-tl-none'}`}>
                            {renderMessageContent(message.content)}
                            <div className={`text-[9px] mt-2 font-bold uppercase tracking-tight ${isOwn ? 'text-indigo-200' : 'text-slate-400'}`}>
                              {formatTime(message.createdAt)}
                            </div>
                          </div>

                          {isOwn && (
                            <button
                              onClick={() => handleDeleteMessage(message._id)}
                              className="absolute -left-8 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity p-2 text-slate-300 hover:text-rose-500"
                            >
                              🗑️
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Bottom Area: Typing & Input */}
      <div className="p-6 bg-white border-t border-slate-200">
        {typingUsers.length > 0 && (
          <div className="text-[10px] font-bold text-indigo-500 uppercase tracking-widest mb-3 animate-pulse italic">
            {typingUsers.map(u => u.userName).join(', ')} typing...
          </div>
        )}

        <div className="relative">
          {showMentions && filteredMembers.length > 0 && (
            <div className="absolute bottom-full left-0 right-0 bg-white border border-slate-200 rounded-2xl shadow-xl mb-3 overflow-hidden z-20 max-h-48 overflow-y-auto">
              {filteredMembers.map((member, idx) => (
                <div
                  key={member._id}
                  onClick={() => insertMention(member)}
                  className={`px-4 py-3 flex items-center gap-3 cursor-pointer transition-colors ${idx === mentionIndex ? 'bg-indigo-50 text-indigo-700' : 'hover:bg-slate-50 text-slate-600'}`}
                >
                  <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-[10px] font-bold uppercase ring-1 ring-slate-200 italic">
                    {member.name.charAt(0)}
                  </div>
                  <span className="text-xs font-bold">{member.name}</span>
                </div>
              ))}
            </div>
          )}

          <div className="flex items-end gap-3">
            <textarea
              ref={inputRef}
              value={newMessage}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              placeholder="Shift tactical data points..."
              disabled={!connected || sending}
              rows={1}
              className="flex-1 bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3 text-sm focus:bg-white focus:border-indigo-400 outline-none transition-all resize-none min-h-[48px] max-h-32 font-medium"
            />
            <button
              onClick={handleSendMessage}
              disabled={!newMessage.trim() || !connected || sending}
              className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-lg active:scale-90 transition-all disabled:opacity-30 disabled:grayscale disabled:scale-100"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                <line x1="22" y1="2" x2="11" y2="13"></line>
                <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
              </svg>
            </button>
          </div>
        </div>
      </div>

      <DeleteConfirmModal
        isOpen={deleteModal.isOpen}
        onClose={() => setDeleteModal({ isOpen: false, id: null })}
        onConfirm={confirmDeleteMessage}
        title="Expunge Message"
        message="Are you sure you want to permanently delete this signal? This action cannot be reversed."
      />
    </div>
  );
};

export default ChatTab;
