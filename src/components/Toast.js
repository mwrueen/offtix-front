import React, { useState, useEffect } from 'react';

const Toast = ({ message, type = 'success', duration = 3000, onClose }) => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Animate in
    requestAnimationFrame(() => setVisible(true));

    const timer = setTimeout(() => {
      setVisible(false);
      setTimeout(onClose, 300);
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  const config = {
    success: { bg: 'bg-emerald-600', border: 'border-emerald-500/50', icon: '✅', label: 'SUCCESS' },
    error: { bg: 'bg-red-600', border: 'border-red-500/50', icon: '❌', label: 'CRITICAL_ERROR' },
    warning: { bg: 'bg-amber-500', border: 'border-amber-400/50', icon: '⚠️', label: 'WARNING' },
    info: { bg: 'bg-indigo-600', border: 'border-indigo-500/50', icon: 'ℹ️', label: 'SYSTEM_INFO' }
  };

  const cfg = config[type] || config.success;

  return (
    <div
      className={`fixed top-8 right-8 z-[1000] min-w-[340px] max-w-md p-5 rounded-2xl shadow-24 border ${cfg.border} ${cfg.bg} text-white transition-all duration-300 flex items-center gap-4 group overflow-hidden
        ${visible ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-full'}`}
    >
      <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-xl shrink-0 group-hover:scale-110 transition-transform">
        {cfg.icon}
      </div>

      <div className="flex-1 min-w-0">
        <div className="text-[10px] font-black opacity-60 uppercase tracking-[0.2em] mb-0.5">
          {cfg.label}
        </div>
        <div className="text-sm font-black tracking-tight">
          {message}
        </div>
      </div>

      <button
        onClick={() => {
          setVisible(false);
          setTimeout(onClose, 300);
        }}
        className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-white/10 text-white transition-all shrink-0 text-xl font-bold"
      >
        ✕
      </button>

      {/* Progress bar */}
      <div
        className="absolute bottom-0 left-0 h-1 bg-white/20 animate-[shrink_linear_forwards]"
        style={{ animationDuration: `${duration}ms` }}
      />

      <style>{`
        @keyframes shrink {
          from { width: 100%; }
          to   { width: 0%; }
        }
      `}</style>
    </div>
  );
};

export default Toast;