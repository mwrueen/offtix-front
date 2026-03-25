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

const configFor = (type) => {
    const map = {
        task_ready: { bg: 'bg-emerald-50', border: 'border-emerald-200', title: 'text-emerald-900', iconBg: 'bg-emerald-100', progress: 'bg-emerald-500' },
        task_send_back: { bg: 'bg-amber-50', border: 'border-amber-200', title: 'text-amber-900', iconBg: 'bg-amber-100', progress: 'bg-amber-500' },
        task_role_handoff: { bg: 'bg-indigo-50', border: 'border-indigo-200', title: 'text-indigo-900', iconBg: 'bg-indigo-100', progress: 'bg-indigo-500' },
        task_assigned: { bg: 'bg-purple-50', border: 'border-purple-200', title: 'text-purple-900', iconBg: 'bg-purple-100', progress: 'bg-purple-500' },
        task_role_assignment: { bg: 'bg-violet-50', border: 'border-violet-200', title: 'text-violet-900', iconBg: 'bg-violet-100', progress: 'bg-violet-500' },
    };
    return map[type] || { bg: 'bg-slate-50', border: 'border-slate-200', title: 'text-slate-900', iconBg: 'bg-slate-100', progress: 'bg-slate-500' };
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

    const cfg = configFor(notification.type);

    return (
        <div
            className={`flex items-start gap-4 p-4 ${cfg.bg} border ${cfg.border} rounded-2xl shadow-xl shadow-slate-200/50 cursor-pointer max-w-sm w-full transition-all duration-300 relative overflow-hidden group
                ${visible ? 'opacity-100 translate-x-0 outline outline-2 outline-white' : 'opacity-0 translate-x-full'}`}
            onClick={handleClick}
        >
            {/* icon */}
            <div className={`w-12 h-12 rounded-xl ${cfg.iconBg} flex items-center justify-center text-2xl flex-shrink-0 group-hover:scale-110 transition-transform duration-300`}>
                {iconFor(notification.type)}
            </div>

            {/* body */}
            <div className="flex-1 min-w-0 py-1">
                <div className={`text-sm font-black tracking-tight ${cfg.title} mb-1 truncate uppercase tracking-widest`}>
                    {notification.title}
                </div>
                <div className="text-xs font-bold text-slate-500 leading-relaxed line-clamp-2 italic">
                    {notification.message}
                </div>
                <div className="text-[10px] font-black text-slate-400 mt-2 uppercase tracking-[0.2em] opacity-60 flex items-center gap-2">
                    Access Intel <span className="text-lg leading-none">→</span>
                </div>
            </div>

            {/* close button */}
            <button
                onClick={(e) => { e.stopPropagation(); handleDismiss(); }}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:bg-black/5 hover:text-slate-900 transition-all flex-shrink-0"
            >
                ✕
            </button>

            {/* progress bar */}
            <div
                className={`absolute bottom-0 left-0 h-1 ${cfg.progress} rounded-full animate-[shrink_6s_linear_forwards] shadow-[0_0_8px_rgba(0,0,0,0.1)]`}
            />
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
            <div className="fixed bottom-8 right-8 z-[9999] flex flex-col-reverse gap-4 pointer-events-none">
                {notifications.map((n, i) => (
                    <div key={i} className="pointer-events-auto">
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

