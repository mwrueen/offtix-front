import React from 'react';
import { useNavigate } from 'react-router-dom';

const Hero = () => {
  const navigate = useNavigate();

  return (
    <section style={{
      backgroundColor: '#ffffff',
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      color: '#1e293b',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Gantt Chart Representation */}
      <div style={{
        position: 'absolute',
        top: '15%',
        right: '8%',
        width: '180px',
        height: '120px',
        backgroundColor: '#f8fafc',
        border: '1px solid #e2e8f0',
        borderRadius: '8px',
        opacity: 0.7,
        zIndex: 1,
        padding: '12px'
      }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{ width: '80%', height: '8px', backgroundColor: '#667eea', borderRadius: '4px' }} />
          <div style={{ width: '60%', height: '8px', backgroundColor: '#10b981', borderRadius: '4px' }} />
          <div style={{ width: '90%', height: '8px', backgroundColor: '#f59e0b', borderRadius: '4px' }} />
          <div style={{ width: '45%', height: '8px', backgroundColor: '#ef4444', borderRadius: '4px' }} />
        </div>
      </div>
      
      {/* Board View Representation */}
      <div style={{
        position: 'absolute',
        top: '55%',
        left: '5%',
        width: '140px',
        height: '160px',
        backgroundColor: '#f8fafc',
        border: '1px solid #e2e8f0',
        borderRadius: '8px',
        opacity: 0.7,
        zIndex: 1,
        padding: '12px'
      }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '6px', height: '100%' }}>
          <div style={{ backgroundColor: '#fef3c7', borderRadius: '4px', padding: '4px' }}>
            <div style={{ width: '100%', height: '12px', backgroundColor: '#f59e0b', borderRadius: '2px', marginBottom: '4px' }} />
            <div style={{ width: '80%', height: '8px', backgroundColor: '#f59e0b', borderRadius: '2px', opacity: 0.6 }} />
          </div>
          <div style={{ backgroundColor: '#dbeafe', borderRadius: '4px', padding: '4px' }}>
            <div style={{ width: '100%', height: '12px', backgroundColor: '#3b82f6', borderRadius: '2px', marginBottom: '4px' }} />
            <div style={{ width: '90%', height: '8px', backgroundColor: '#3b82f6', borderRadius: '2px', opacity: 0.6 }} />
          </div>
          <div style={{ backgroundColor: '#d1fae5', borderRadius: '4px', padding: '4px' }}>
            <div style={{ width: '100%', height: '12px', backgroundColor: '#10b981', borderRadius: '2px', marginBottom: '4px' }} />
          </div>
        </div>
      </div>
      
      {/* List View Representation */}
      <div style={{
        position: 'absolute',
        bottom: '25%',
        right: '15%',
        width: '160px',
        height: '100px',
        backgroundColor: '#f8fafc',
        border: '1px solid #e2e8f0',
        borderRadius: '8px',
        opacity: 0.7,
        zIndex: 1,
        padding: '12px'
      }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ width: '12px', height: '12px', backgroundColor: '#667eea', borderRadius: '50%' }} />
            <div style={{ width: '80%', height: '6px', backgroundColor: '#e2e8f0', borderRadius: '3px' }} />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ width: '12px', height: '12px', backgroundColor: '#10b981', borderRadius: '50%' }} />
            <div style={{ width: '70%', height: '6px', backgroundColor: '#e2e8f0', borderRadius: '3px' }} />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ width: '12px', height: '12px', backgroundColor: '#f59e0b', borderRadius: '50%' }} />
            <div style={{ width: '85%', height: '6px', backgroundColor: '#e2e8f0', borderRadius: '3px' }} />
          </div>
        </div>
      </div>
      
      {/* Analytics/Calculation Representation */}
      <div style={{
        position: 'absolute',
        bottom: '15%',
        left: '35%',
        width: '120px',
        height: '80px',
        backgroundColor: '#f8fafc',
        border: '1px solid #e2e8f0',
        borderRadius: '8px',
        opacity: 0.7,
        zIndex: 1,
        padding: '12px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '24px', color: '#667eea', marginBottom: '4px' }}>📊</div>
          <div style={{ display: 'flex', gap: '4px', justifyContent: 'center' }}>
            <div style={{ width: '8px', height: '16px', backgroundColor: '#667eea', borderRadius: '2px' }} />
            <div style={{ width: '8px', height: '12px', backgroundColor: '#10b981', borderRadius: '2px' }} />
            <div style={{ width: '8px', height: '20px', backgroundColor: '#f59e0b', borderRadius: '2px' }} />
          </div>
        </div>
      </div>
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto',
        padding: '0 24px',
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '60px',
        alignItems: 'center',
        position: 'relative',
        zIndex: 2
      }}>
        <div>
          <h1 style={{
            fontSize: '3.5rem',
            fontWeight: '700',
            marginBottom: '24px',
            lineHeight: '1.1',
            color: '#1e293b'
          }}>
            Project Management
            <span style={{ display: 'block', color: '#667eea' }}>Made Simple</span>
          </h1>
          
          <p style={{
            fontSize: '1.25rem',
            marginBottom: '40px',
            lineHeight: '1.6',
            color: '#64748b'
          }}>
            Streamline your workflow with Tabredon's professional project management platform. 
            Track tasks, manage teams, and deliver projects on time.
          </p>
          
          <div style={{ display: 'flex', gap: '16px' }}>
            <button
              onClick={() => navigate('/signup')}
              style={{
                padding: '16px 32px',
                backgroundColor: '#667eea',
                color: '#ffffff',
                border: 'none',
                borderRadius: '8px',
                fontSize: '16px',
                fontWeight: '600',
                cursor: 'pointer',
                boxShadow: '0 4px 14px rgba(102, 126, 234, 0.3)',
                transition: 'transform 0.2s ease'
              }}
            >
              Get Started Free
            </button>
            
            <button
              onClick={() => navigate('/signin')}
              style={{
                padding: '16px 32px',
                backgroundColor: 'transparent',
                color: '#667eea',
                border: '2px solid #667eea',
                borderRadius: '8px',
                fontSize: '16px',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
            >
              Sign In
            </button>
          </div>
        </div>
        
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          position: 'relative'
        }}>
          <div style={{
            width: '400px',
            height: '300px',
            backgroundColor: '#f8fafc',
            borderRadius: '16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '4rem',
            border: '1px solid #e2e8f0',
            boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)'
          }}>
            📊
          </div>
          
          {/* Floating elements around the main visual */}
          <div style={{
            position: 'absolute',
            top: '20px',
            right: '20px',
            width: '60px',
            height: '60px',
            backgroundColor: '#667eea',
            borderRadius: '50%',
            opacity: 0.2
          }} />
          
          <div style={{
            position: 'absolute',
            bottom: '30px',
            left: '30px',
            width: '40px',
            height: '40px',
            backgroundColor: '#10b981',
            borderRadius: '8px',
            opacity: 0.2,
            transform: 'rotate(45deg)'
          }} />
        </div>
      </div>
    </section>
  );
};

export default Hero;