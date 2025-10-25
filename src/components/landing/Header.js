import React from 'react';
import { useNavigate } from 'react-router-dom';

const Header = () => {
  const navigate = useNavigate();

  return (
    <header style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      backgroundColor: 'rgba(255, 255, 255, 0.95)',
      backdropFilter: 'blur(10px)',
      borderBottom: '1px solid rgba(0, 0, 0, 0.1)',
      zIndex: 1000
    }}>
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto',
        padding: '0 24px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        height: '70px'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px'
        }}>
          <div style={{
            width: '32px',
            height: '32px',
            backgroundColor: '#667eea',
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            fontWeight: 'bold'
          }}>
            T
          </div>
          <span style={{
            fontSize: '1.5rem',
            fontWeight: '700',
            color: '#1e293b'
          }}>
            Tabredon
          </span>
        </div>
        
        <nav style={{
          display: 'flex',
          alignItems: 'center',
          gap: '32px'
        }}>
          <a href="#features" style={{
            color: '#64748b',
            textDecoration: 'none',
            fontWeight: '500',
            transition: 'color 0.2s ease'
          }}>
            Features
          </a>
          <a href="#pricing" style={{
            color: '#64748b',
            textDecoration: 'none',
            fontWeight: '500',
            transition: 'color 0.2s ease'
          }}>
            Pricing
          </a>
          <a href="#about" style={{
            color: '#64748b',
            textDecoration: 'none',
            fontWeight: '500',
            transition: 'color 0.2s ease'
          }}>
            About
          </a>
        </nav>
        
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px'
        }}>
          <button
            onClick={() => navigate('/signin')}
            style={{
              padding: '8px 16px',
              backgroundColor: 'transparent',
              color: '#64748b',
              border: 'none',
              borderRadius: '6px',
              fontSize: '14px',
              fontWeight: '500',
              cursor: 'pointer'
            }}
          >
            Sign In
          </button>
          <button
            onClick={() => navigate('/signup')}
            style={{
              padding: '8px 16px',
              backgroundColor: '#667eea',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              fontSize: '14px',
              fontWeight: '500',
              cursor: 'pointer'
            }}
          >
            Get Started
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;