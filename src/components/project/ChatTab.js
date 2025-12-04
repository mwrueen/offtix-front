import React, { useState, useEffect, useRef, useCallback } from 'react';
import { io } from 'socket.io-client';
import { chatAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { getCookie } from '../../utils/cookies';

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
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  // Initialize socket connection
  useEffect(() => {
    const token = getCookie('authToken');
    if (!token) return;

    const newSocket = io('http://localhost:5000', {
      auth: { token },
      transports: ['websocket', 'polling']
    });

    newSocket.on('connect', () => {
      console.log('Socket connected');
      setConnected(true);
      newSocket.emit('join-project', projectId);
    });

    newSocket.on('disconnect', () => {
      console.log('Socket disconnected');
      setConnected(false);
    });

    newSocket.on('new-message', (message) => {
      setMessages(prev => [...prev, message]);
      scrollToBottom();
    });

    newSocket.on('message-deleted', ({ messageId }) => {
      setMessages(prev => prev.filter(m => m._id !== messageId));
    });

    newSocket.on('message-edited', (updatedMessage) => {
      setMessages(prev => prev.map(m => 
        m._id === updatedMessage._id ? updatedMessage : m
      ));
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

    newSocket.on('error', (error) => {
      console.error('Socket error:', error);
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
          chatAPI.getMessages(projectId),
          chatAPI.getMembers(projectId)
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

  const handleDeleteMessage = async (messageId) => {
    if (!window.confirm('Delete this message?')) return;
    try {
      await chatAPI.deleteMessage(projectId, messageId);
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
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const renderMessageContent = (content) => {
    // Highlight @mentions
    const parts = content.split(/(@\w+(?:\s\w+)?)/g);
    return parts.map((part, i) => {
      if (part.startsWith('@')) {
        const mentionedMember = members.find(m => `@${m.name}` === part);
        return (
          <span
            key={i}
            style={{
              backgroundColor: mentionedMember ? '#e3f2fd' : 'transparent',
              color: mentionedMember ? '#1976d2' : 'inherit',
              padding: mentionedMember ? '2px 4px' : '0',
              borderRadius: '4px',
              fontWeight: mentionedMember ? '500' : 'normal'
            }}
          >
            {part}
          </span>
        );
      }
      return part;
    });
  };

  // Group messages by date
  const groupedMessages = messages.reduce((groups, message) => {
    const date = formatDate(message.createdAt);
    if (!groups[date]) groups[date] = [];
    groups[date].push(message);
    return groups;
  }, {});

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '40px' }}>
        <div style={{ textAlign: 'center' }}>
          <div className="spinner" style={{
            width: '40px',
            height: '40px',
            border: '3px solid #f3f3f3',
            borderTop: '3px solid #3498db',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 16px'
          }} />
          <p style={{ color: '#666' }}>Loading chat...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '600px' }}>
      {/* Connection Status */}
      <div style={{
        padding: '8px 16px',
        backgroundColor: connected ? '#e8f5e9' : '#ffebee',
        borderRadius: '8px',
        marginBottom: '16px',
        display: 'flex',
        alignItems: 'center',
        gap: '8px'
      }}>
        <div style={{
          width: '8px',
          height: '8px',
          borderRadius: '50%',
          backgroundColor: connected ? '#4caf50' : '#f44336'
        }} />
        <span style={{ fontSize: '13px', color: connected ? '#2e7d32' : '#c62828' }}>
          {connected ? 'Connected to chat' : 'Connecting...'}
        </span>
        <span style={{ marginLeft: 'auto', fontSize: '12px', color: '#666' }}>
          {members.length} members
        </span>
      </div>

      {/* Messages Container */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        padding: '16px',
        backgroundColor: '#f8f9fa',
        borderRadius: '12px',
        marginBottom: '16px'
      }}>
        {messages.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>💬</div>
            <h3 style={{ marginBottom: '8px' }}>No messages yet</h3>
            <p>Start the conversation with your team!</p>
          </div>
        ) : (
          Object.entries(groupedMessages).map(([date, dateMessages]) => (
            <div key={date}>
              {/* Date Separator */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                margin: '20px 0',
                gap: '12px'
              }}>
                <div style={{ flex: 1, height: '1px', backgroundColor: '#ddd' }} />
                <span style={{ fontSize: '12px', color: '#888', fontWeight: '500' }}>{date}</span>
                <div style={{ flex: 1, height: '1px', backgroundColor: '#ddd' }} />
              </div>

              {/* Messages for this date */}
              {dateMessages.map((message, index) => {
                const isOwn = message.sender?._id === authState.user?._id;
                const showAvatar = index === 0 ||
                  dateMessages[index - 1]?.sender?._id !== message.sender?._id;

                return (
                  <div
                    key={message._id}
                    style={{
                      display: 'flex',
                      flexDirection: isOwn ? 'row-reverse' : 'row',
                      marginBottom: '8px',
                      gap: '8px'
                    }}
                  >
                    {/* Avatar */}
                    {showAvatar ? (
                      <div style={{
                        width: '36px',
                        height: '36px',
                        borderRadius: '50%',
                        backgroundColor: isOwn ? '#1976d2' : '#e0e0e0',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: isOwn ? '#fff' : '#666',
                        fontSize: '14px',
                        fontWeight: '600',
                        flexShrink: 0,
                        backgroundImage: message.sender?.profile?.profilePicture
                          ? `url(${message.sender.profile.profilePicture})`
                          : 'none',
                        backgroundSize: 'cover'
                      }}>
                        {!message.sender?.profile?.profilePicture &&
                          message.sender?.name?.charAt(0).toUpperCase()}
                      </div>
                    ) : (
                      <div style={{ width: '36px' }} />
                    )}

                    {/* Message Bubble */}
                    <div style={{
                      maxWidth: '70%',
                      position: 'relative'
                    }}>
                      {showAvatar && !isOwn && (
                        <div style={{
                          fontSize: '12px',
                          color: '#666',
                          marginBottom: '4px',
                          fontWeight: '500'
                        }}>
                          {message.sender?.name}
                        </div>
                      )}
                      <div
                        style={{
                          padding: '10px 14px',
                          backgroundColor: isOwn ? '#1976d2' : '#fff',
                          color: isOwn ? '#fff' : '#333',
                          borderRadius: isOwn ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                          boxShadow: '0 1px 2px rgba(0,0,0,0.1)',
                          wordBreak: 'break-word'
                        }}
                      >
                        <div style={{ fontSize: '14px', lineHeight: '1.5' }}>
                          {renderMessageContent(message.content)}
                        </div>
                        <div style={{
                          fontSize: '11px',
                          color: isOwn ? 'rgba(255,255,255,0.7)' : '#999',
                          marginTop: '4px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px'
                        }}>
                          {formatTime(message.createdAt)}
                          {message.isEdited && <span>(edited)</span>}
                        </div>
                      </div>

                      {/* Delete button for own messages */}
                      {isOwn && (
                        <button
                          onClick={() => handleDeleteMessage(message._id)}
                          style={{
                            position: 'absolute',
                            top: showAvatar ? '20px' : '0',
                            right: '-30px',
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            opacity: 0.5,
                            fontSize: '12px'
                          }}
                          title="Delete message"
                        >
                          🗑️
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Typing Indicator */}
      {typingUsers.length > 0 && (
        <div style={{
          fontSize: '12px',
          color: '#666',
          marginBottom: '8px',
          fontStyle: 'italic'
        }}>
          {typingUsers.map(u => u.userName).join(', ')} {typingUsers.length === 1 ? 'is' : 'are'} typing...
        </div>
      )}

      {/* Message Input */}
      <div style={{ position: 'relative' }}>
        {/* Mentions Dropdown */}
        {showMentions && filteredMembers.length > 0 && (
          <div style={{
            position: 'absolute',
            bottom: '100%',
            left: 0,
            right: 0,
            backgroundColor: '#fff',
            border: '1px solid #ddd',
            borderRadius: '8px',
            boxShadow: '0 -4px 12px rgba(0,0,0,0.15)',
            maxHeight: '200px',
            overflowY: 'auto',
            marginBottom: '8px',
            zIndex: 10
          }}>
            {filteredMembers.map((member, index) => (
              <div
                key={member._id}
                onClick={() => insertMention(member)}
                style={{
                  padding: '10px 14px',
                  cursor: 'pointer',
                  backgroundColor: index === mentionIndex ? '#e3f2fd' : 'transparent',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  borderBottom: index < filteredMembers.length - 1 ? '1px solid #f0f0f0' : 'none'
                }}
              >
                <div style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  backgroundColor: '#e0e0e0',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '14px',
                  fontWeight: '600',
                  backgroundImage: member.avatar ? `url(${member.avatar})` : 'none',
                  backgroundSize: 'cover'
                }}>
                  {!member.avatar && member.name?.charAt(0).toUpperCase()}
                </div>
                <div>
                  <div style={{ fontWeight: '500', fontSize: '14px' }}>{member.name}</div>
                  <div style={{ fontSize: '12px', color: '#666' }}>{member.role}</div>
                </div>
              </div>
            ))}
          </div>
        )}

        <div style={{
          display: 'flex',
          gap: '12px',
          alignItems: 'flex-end'
        }}>
          <textarea
            ref={inputRef}
            value={newMessage}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder="Type a message... Use @ to mention someone"
            disabled={!connected || sending}
            style={{
              flex: 1,
              padding: '12px 16px',
              border: '2px solid #e0e0e0',
              borderRadius: '24px',
              fontSize: '14px',
              resize: 'none',
              minHeight: '48px',
              maxHeight: '120px',
              outline: 'none',
              transition: 'border-color 0.2s',
              fontFamily: 'inherit'
            }}
            onFocus={(e) => e.target.style.borderColor = '#1976d2'}
            onBlur={(e) => e.target.style.borderColor = '#e0e0e0'}
            rows={1}
          />
          <button
            onClick={handleSendMessage}
            disabled={!newMessage.trim() || !connected || sending}
            style={{
              width: '48px',
              height: '48px',
              borderRadius: '50%',
              backgroundColor: newMessage.trim() && connected ? '#1976d2' : '#e0e0e0',
              border: 'none',
              cursor: newMessage.trim() && connected ? 'pointer' : 'not-allowed',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.2s',
              flexShrink: 0
            }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2">
              <line x1="22" y1="2" x2="11" y2="13"></line>
              <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
            </svg>
          </button>
        </div>
      </div>

      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default ChatTab;

