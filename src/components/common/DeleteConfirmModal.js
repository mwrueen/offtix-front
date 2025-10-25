import React from 'react';

const DeleteConfirmModal = ({ 
  isOpen, 
  onClose, 
  onConfirm, 
  title = "Delete Item",
  message = "This action cannot be undone.",
  itemName,
  itemDescription,
  confirmButtonText = "Delete",
  icon = "⚠️"
}) => {
  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      backgroundColor: 'rgba(0,0,0,0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      backdropFilter: 'blur(4px)'
    }}>
      <div style={{
        backgroundColor: 'white',
        borderRadius: '16px',
        padding: '32px',
        width: '100%',
        maxWidth: '420px',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
        border: '1px solid #f1f5f9',
        margin: '20px'
      }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <div style={{ 
            fontSize: '48px', 
            marginBottom: '16px',
            filter: 'drop-shadow(0 4px 6px rgba(0, 0, 0, 0.1))'
          }}>
            {icon}
          </div>
          <h3 style={{ 
            margin: '0 0 8px 0', 
            fontSize: '20px', 
            fontWeight: '700', 
            color: '#0f172a',
            letterSpacing: '-0.025em'
          }}>
            {title}
          </h3>
          <p style={{ 
            margin: 0, 
            color: '#64748b', 
            fontSize: '14px',
            lineHeight: '1.5'
          }}>
            {message}
          </p>
        </div>
        
        {/* Item Details */}
        {itemName && (
          <div style={{
            padding: '20px',
            backgroundColor: '#fef2f2',
            borderRadius: '12px',
            marginBottom: '24px',
            border: '1px solid #fecaca'
          }}>
            <p style={{ 
              margin: '0 0 8px 0', 
              fontSize: '14px', 
              color: '#374151',
              fontWeight: '500'
            }}>
              Are you sure you want to delete:
            </p>
            <div style={{ 
              fontWeight: '600', 
              color: '#0f172a',
              fontSize: '16px',
              marginBottom: itemDescription ? '4px' : '0'
            }}>
              {itemName}
            </div>
            {itemDescription && (
              <div style={{ 
                fontSize: '13px', 
                color: '#64748b',
                lineHeight: '1.4'
              }}>
                {itemDescription}
              </div>
            )}
          </div>
        )}
        
        {/* Action Buttons */}
        <div style={{ 
          display: 'flex', 
          justifyContent: 'flex-end', 
          gap: '12px' 
        }}>
          <button
            onClick={onClose}
            style={{
              padding: '12px 24px',
              backgroundColor: 'white',
              color: '#374151',
              border: '1px solid #d1d5db',
              borderRadius: '10px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '600',
              transition: 'all 0.15s ease',
              minWidth: '80px'
            }}
            onMouseEnter={(e) => {
              e.target.style.backgroundColor = '#f9fafb';
              e.target.style.borderColor = '#9ca3af';
            }}
            onMouseLeave={(e) => {
              e.target.style.backgroundColor = 'white';
              e.target.style.borderColor = '#d1d5db';
            }}
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            style={{
              padding: '12px 24px',
              backgroundColor: '#ef4444',
              color: 'white',
              border: 'none',
              borderRadius: '10px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '600',
              transition: 'all 0.15s ease',
              minWidth: '100px',
              boxShadow: '0 2px 4px rgba(239, 68, 68, 0.3)'
            }}
            onMouseEnter={(e) => {
              e.target.style.backgroundColor = '#dc2626';
              e.target.style.transform = 'translateY(-1px)';
              e.target.style.boxShadow = '0 4px 8px rgba(239, 68, 68, 0.4)';
            }}
            onMouseLeave={(e) => {
              e.target.style.backgroundColor = '#ef4444';
              e.target.style.transform = 'translateY(0)';
              e.target.style.boxShadow = '0 2px 4px rgba(239, 68, 68, 0.3)';
            }}
          >
            {confirmButtonText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeleteConfirmModal;