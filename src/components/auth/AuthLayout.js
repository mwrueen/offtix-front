import React from 'react';
import { useNavigate } from 'react-router-dom';

const AuthLayout = ({ children, title, subtitle }) => {
  const navigate = useNavigate();

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#f8fafc',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px'
    }}>
      {/* Background Decorations */}
      <div style={{
        position: 'absolute',
        top: '10%',
        left: '10%',
        width: '100px',
        height: '100px',
        backgroundColor: '#667eea',
        borderRadius: '50%',
        opacity: 0.1
      }} />
      
      <div style={{
        position: 'absolute',
        bottom: '15%',
        right: '15%',
        width: '80px',
        height: '80px',
        backgroundColor: '#10b981',
        borderRadius: '12px',
        opacity: 0.1,
        transform: 'rotate(45deg)'
      }} />

      <div style={{
        backgroundColor: 'white',
        borderRadius: '16px',
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
        padding: '48px',
        width: '100%',
        maxWidth: '400px',
        position: 'relative',
        zIndex: 10
      }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div
            onClick={() => navigate('/')}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '12px',
              marginBottom: '24px',
              cursor: 'pointer'
            }}
          >
            <div style={{
              width: '40px',
              height: '40px',
              backgroundColor: '#667eea',
              borderRadius: '10px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              fontWeight: 'bold',
              fontSize: '18px'
            }}>
              T
            </div>
            <span style={{
              fontSize: '24px',
              fontWeight: '700',
              color: '#1e293b'
            }}>
              Tabredon
            </span>
          </div>
          
          <h1 style={{
            fontSize: '28px',
            fontWeight: '700',
            color: '#1e293b',
            marginBottom: '8px'
          }}>
            {title}
          </h1>
          
          <p style={{
            color: '#64748b',
            fontSize: '16px'
          }}>
            {subtitle}
          </p>
        </div>

        {children}
      </div>
    </div>
  );
};

export default AuthLayout;