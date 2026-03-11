import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSocket } from '../context/SocketContext';

const iconFor = (type) => {
    const map = {
        task_ready: '✅',
        task_send_back: '↩️',
        task_role_handoff: '🔄',
        task_assigned: '📋',
        task_role_assignment: '🎯',
        'chat-notification': '💬',
        mention: '📣',
    };
    return map[type] || '🔔';
};

const colorFor = (type) => {
    const map = {
        task_ready: { bg: '#f0fdf4', border: '#86efac', title: '#15803d' },
        task_send_back: { bg: '#fff7ed', border: '#fdba74', title: '#c2410c' },
        task_role_handoff: { bg: '#eff6ff', border: '#93c5fd', title: '#1d4ed8' },
        task_assigned: { bg: '#faf5ff', border: '#c4b5fd', title: '#6d28d9' },
        task_role_assignment: { bg: '#faf5ff', border: '#c4b5fd', title: '#6d28d9' },
    };
    return map[type] || { bg: '#f8fafc', border: '#94a3b8', title: '#334155' };
};

// Single toast item
const ToastItem = ({ notification, index, onDismiss }) => {
    const navigate = useNavigate();
    const [visible, setVisible] = useState(false);
    const timerRef = useRef(null);

    useEffect(() => {
        // Animate in
        requestAnimationFrame(() => setVisible(true));
        // Auto-dismiss after 6 seconds
        timerRef.current = setTimeout(() => handleDismiss(), 6000);
        return () => clearTimeout(timerRef.current);
    }, []);

    const handleDismiss = () => {
        setVisible(false);
        setTimeout(() => onDismiss(index), 300);
    };

    const handleClick = () => {
        if (notification.taskId) {
            navigate(`/my-tasks/${notification.taskId}`);
        } else {
            navigate('/notifications');
        }
        handleDismiss();
    };

    const colors = colorFor(notification.type);

    return (
        <div
            style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '12px',
                padding: '14px 16px',
                background: colors.bg,
                border: `1px solid ${colors.border}`,
                borderRadius: '12px',
                boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
                cursor: 'pointer',
                maxWidth: '360px',
                width: '100%',
                transition: 'all 0.3s ease',
                opacity: visible ? 1 : 0,
                transform: visible ? 'translateX(0)' : 'translateX(100%)',
                position: 'relative',
            }}
            onClick={handleClick}
        >
            {/* icon */}
            <div style={{
                fontSize: '22px',
                flexShrink: 0,
                marginTop: '2px',
                lineHeight: 1
            }}>
                {iconFor(notification.type)}
            </div>

            {/* body */}
            <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{
                    fontSize: '13px',
                    fontWeight: '700',
                    color: colors.title,
                    marginBottom: '2px',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis'
                }}>
                    {notification.title}
                </div>
                <div style={{
                    fontSize: '12px',
                    color: '#475569',
                    lineHeight: 1.4,
                    overflow: 'hidden',
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                }}>
                    {notification.message}
                </div>
                <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '4px' }}>
                    Tap to view →
                </div>
            </div>

            {/* close button */}
            <button
                onClick={(e) => { e.stopPropagation(); handleDismiss(); }}
                style={{
                    background: 'none',
                    border: 'none',
                    fontSize: '16px',
                    color: '#94a3b8',
                    cursor: 'pointer',
                    padding: '0',
                    flexShrink: 0,
                    lineHeight: 1,
                    marginTop: '1px',
                }}
            >
                ×
            </button>

            {/* progress bar */}
            <div style={{
                position: 'absolute',
                bottom: 0,
                left: 0,
                height: '3px',
                borderRadius: '0 0 0 12px',
                background: colors.border,
                animation: 'shrink 6s linear forwards',
            }} />
        </div>
    );
};

// Container that positions all toasts
const RealTimeNotifications = () => {
    const { notifications, dismissNotification } = useSocket();

    return (
        <>
            <style>{`
        @keyframes shrink {
          from { width: 100%; }
          to   { width: 0%; }
        }
      `}</style>
            <div style={{
                position: 'fixed',
                bottom: '24px',
                right: '24px',
                zIndex: 9999,
                display: 'flex',
                flexDirection: 'column-reverse',
                gap: '10px',
                pointerEvents: 'none',
            }}>
                {notifications.map((n, i) => (
                    <div key={i} style={{ pointerEvents: 'all' }}>
                        <ToastItem
                            notification={n}
                            index={i}
                            onDismiss={dismissNotification}
                        />
                    </div>
                ))}
            </div>
        </>
    );
};

export default RealTimeNotifications;
