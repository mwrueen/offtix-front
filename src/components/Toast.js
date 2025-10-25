import React, { useState, useEffect } from 'react';

const Toast = ({ message, type = 'success', duration = 3000, onClose }) => {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(false);
      setTimeout(onClose, 300);
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  const getToastStyle = () => {
    const baseStyle = {
      position: 'fixed',
      top: '20px',
      right: '20px',
      padding: '16px 20px',
      borderRadius: '8px',
      color: 'white',
      fontSize: '14px',
      fontWeight: '500',
      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
      zIndex: 1000,
      transform: visible ? 'translateX(0)' : 'translateX(100%)',
      transition: 'transform 0.3s ease-in-out',
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      minWidth: '300px'
    };

    const typeStyles = {
      success: { backgroundColor: '#10b981' },
      error: { backgroundColor: '#ef4444' },
      warning: { backgroundColor: '#f59e0b' },
      info: { backgroundColor: '#3b82f6' }
    };

    return { ...baseStyle, ...typeStyles[type] };
  };

  const getIcon = () => {
    const icons = {
      success: '✅',
      error: '❌',
      warning: '⚠️',
      info: 'ℹ️'
    };
    return icons[type];
  };

  return (
    <div style={getToastStyle()}>
      <span>{getIcon()}</span>
      <span>{message}</span>
      <button
        onClick={() => {
          setVisible(false);
          setTimeout(onClose, 300);
        }}
        style={{
          background: 'none',
          border: 'none',
          color: 'white',
          cursor: 'pointer',
          fontSize: '16px',
          marginLeft: 'auto',
          padding: '0'
        }}
      >
        ×
      </button>
    </div>
  );
};

export default Toast;