import React, { useState, useEffect } from 'react';

const Icons = {
  success: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
      <polyline points="22 4 12 14.01 9 11.01"/>
    </svg>
  ),
  error: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/>
      <line x1="15" y1="9" x2="9" y2="15"/>
      <line x1="9" y1="9" x2="15" y2="15"/>
    </svg>
  ),
  warning: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
      <line x1="12" y1="9" x2="12" y2="13"/>
      <line x1="12" y1="17" x2="12.01" y2="17"/>
    </svg>
  ),
  info: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/>
      <line x1="12" y1="16" x2="12" y2="12"/>
      <line x1="12" y1="8" x2="12.01" y2="8"/>
    </svg>
  )
};

const CloseIcon = (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18"/>
    <line x1="6" y1="6" x2="18" y2="18"/>
  </svg>
);

const Toast = ({ message, type = 'success', duration = 3000, onClose }) => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    requestAnimationFrame(() => setVisible(true));
    const timer = setTimeout(() => {
      setVisible(false);
      setTimeout(onClose, 300);
    }, duration);
    return () => clearTimeout(timer);
  }, [duration, onClose]);

  const config = {
    success: { icon: Icons.success, color: 'text-emerald-600', bg: 'bg-emerald-50', progress: 'bg-emerald-500', label: 'Success' },
    error: { icon: Icons.error, color: 'text-red-600', bg: 'bg-red-50', progress: 'bg-red-500', label: 'Error' },
    warning: { icon: Icons.warning, color: 'text-amber-500', bg: 'bg-amber-50', progress: 'bg-amber-500', label: 'Warning' },
    info: { icon: Icons.info, color: 'text-indigo-600', bg: 'bg-indigo-50', progress: 'bg-indigo-500', label: 'Info' }
  };

  const cfg = config[type] || config.success;

  return (
    <div
      className={`bg-white rounded-xl border border-slate-200 shadow-lg shadow-slate-200/50 overflow-hidden min-w-[320px] max-w-[420px] relative transition-all duration-300
        ${visible ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-6'}`}
    >
      <div className="flex items-start gap-3.5 p-4">
        <div className={`w-8 h-8 rounded-lg ${cfg.bg} flex items-center justify-center shrink-0 ${cfg.color}`}>
          {cfg.icon}
        </div>
        <div className="flex-1 min-w-0 pt-0.5">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-0.5">{cfg.label}</p>
          <p className="text-sm font-medium text-slate-700 leading-snug">{message}</p>
        </div>
        <button
          onClick={() => {
            setVisible(false);
            setTimeout(onClose, 300);
          }}
          className="text-slate-400 hover:text-slate-600 transition-colors p-1 -mr-1 -mt-1 shrink-0"
          aria-label="Close"
        >
          {CloseIcon}
        </button>
      </div>

      {/* Progress bar */}
      <div
        className={`absolute bottom-0 left-0 h-[2px] ${cfg.progress} animate-[shrink_linear_forwards]`}
        style={{ '--duration': `${duration}ms` }}
      />

      <style>{`
        @keyframes shrink {
          from { width: 100%; }
          to   { width: 0%; }
        }
        .animate-\\[shrink_linear_forwards\\] {
          animation: shrink var(--duration) linear forwards;
        }
      `}</style>
    </div>
  );
};

export default Toast;
