import React from 'react';
import { useNavigate } from 'react-router-dom';
import './landing.css';

const Hero = () => {
  const navigate = useNavigate();

  return (
    <section style={{
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      color: '#ffffff',
      position: 'relative',
      overflow: 'hidden',
      paddingTop: '70px'
    }}>
      {/* Animated background elements */}
      <div style={{
        position: 'absolute',
        top: '10%',
        right: '5%',
        width: '300px',
        height: '300px',
        background: 'rgba(255, 255, 255, 0.1)',
        borderRadius: '50%',
        filter: 'blur(60px)',
        animation: 'float 6s ease-in-out infinite',
        zIndex: 0
      }} />

      <div style={{
        position: 'absolute',
        bottom: '10%',
        left: '5%',
        width: '250px',
        height: '250px',
        background: 'rgba(255, 255, 255, 0.1)',
        borderRadius: '50%',
        filter: 'blur(60px)',
        animation: 'float 8s ease-in-out infinite',
        animationDelay: '2s',
        zIndex: 0
      }} />

      {/* Gantt Chart Representation - Enhanced */}
      <div className="floating-card" style={{
        position: 'absolute',
        top: '15%',
        right: '8%',
        width: '200px',
        height: '140px',
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        border: '1px solid rgba(255, 255, 255, 0.3)',
        borderRadius: '12px',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
        backdropFilter: 'blur(10px)',
        zIndex: 1,
        padding: '16px',
        animation: 'slideInRight 1s ease-out'
      }}>
        <div style={{ fontSize: '12px', fontWeight: '600', color: '#667eea', marginBottom: '12px' }}>Project Timeline</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <div style={{ width: '85%', height: '10px', backgroundColor: '#667eea', borderRadius: '5px', boxShadow: '0 2px 4px rgba(102, 126, 234, 0.3)' }} />
          <div style={{ width: '65%', height: '10px', backgroundColor: '#10b981', borderRadius: '5px', boxShadow: '0 2px 4px rgba(16, 185, 129, 0.3)' }} />
          <div style={{ width: '95%', height: '10px', backgroundColor: '#f59e0b', borderRadius: '5px', boxShadow: '0 2px 4px rgba(245, 158, 11, 0.3)' }} />
          <div style={{ width: '50%', height: '10px', backgroundColor: '#ef4444', borderRadius: '5px', boxShadow: '0 2px 4px rgba(239, 68, 68, 0.3)' }} />
        </div>
      </div>

      {/* Board View Representation - Enhanced */}
      <div className="floating-card" style={{
        position: 'absolute',
        top: '55%',
        left: '5%',
        width: '160px',
        height: '180px',
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        border: '1px solid rgba(255, 255, 255, 0.3)',
        borderRadius: '12px',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
        backdropFilter: 'blur(10px)',
        zIndex: 1,
        padding: '14px',
        animation: 'slideInLeft 1s ease-out'
      }}>
        <div style={{ fontSize: '12px', fontWeight: '600', color: '#667eea', marginBottom: '10px' }}>Task Board</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px', height: 'calc(100% - 30px)' }}>
          <div style={{ backgroundColor: '#fef3c7', borderRadius: '6px', padding: '6px', boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)' }}>
            <div style={{ width: '100%', height: '14px', backgroundColor: '#f59e0b', borderRadius: '3px', marginBottom: '4px' }} />
            <div style={{ width: '80%', height: '10px', backgroundColor: '#f59e0b', borderRadius: '3px', opacity: 0.6 }} />
          </div>
          <div style={{ backgroundColor: '#dbeafe', borderRadius: '6px', padding: '6px', boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)' }}>
            <div style={{ width: '100%', height: '14px', backgroundColor: '#3b82f6', borderRadius: '3px', marginBottom: '4px' }} />
            <div style={{ width: '90%', height: '10px', backgroundColor: '#3b82f6', borderRadius: '3px', opacity: 0.6 }} />
          </div>
          <div style={{ backgroundColor: '#d1fae5', borderRadius: '6px', padding: '6px', boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)' }}>
            <div style={{ width: '100%', height: '14px', backgroundColor: '#10b981', borderRadius: '3px', marginBottom: '4px' }} />
          </div>
        </div>
      </div>

      {/* List View Representation - Enhanced */}
      <div className="floating-card" style={{
        position: 'absolute',
        bottom: '25%',
        right: '15%',
        width: '180px',
        height: '120px',
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        border: '1px solid rgba(255, 255, 255, 0.3)',
        borderRadius: '12px',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
        backdropFilter: 'blur(10px)',
        zIndex: 1,
        padding: '14px',
        animation: 'fadeIn 1.5s ease-out'
      }}>
        <div style={{ fontSize: '12px', fontWeight: '600', color: '#667eea', marginBottom: '10px' }}>Task List</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '14px', height: '14px', backgroundColor: '#667eea', borderRadius: '50%', boxShadow: '0 2px 4px rgba(102, 126, 234, 0.3)' }} />
            <div style={{ width: '80%', height: '8px', backgroundColor: '#e2e8f0', borderRadius: '4px' }} />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '14px', height: '14px', backgroundColor: '#10b981', borderRadius: '50%', boxShadow: '0 2px 4px rgba(16, 185, 129, 0.3)' }} />
            <div style={{ width: '70%', height: '8px', backgroundColor: '#e2e8f0', borderRadius: '4px' }} />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '14px', height: '14px', backgroundColor: '#f59e0b', borderRadius: '50%', boxShadow: '0 2px 4px rgba(245, 158, 11, 0.3)' }} />
            <div style={{ width: '85%', height: '8px', backgroundColor: '#e2e8f0', borderRadius: '4px' }} />
          </div>
        </div>
      </div>

      {/* Analytics/Calculation Representation - Enhanced */}
      <div className="floating-card" style={{
        position: 'absolute',
        bottom: '15%',
        left: '35%',
        width: '140px',
        height: '100px',
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        border: '1px solid rgba(255, 255, 255, 0.3)',
        borderRadius: '12px',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
        backdropFilter: 'blur(10px)',
        zIndex: 1,
        padding: '14px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        animation: 'fadeIn 2s ease-out'
      }}>
        <div style={{ fontSize: '12px', fontWeight: '600', color: '#667eea', marginBottom: '8px' }}>Analytics</div>
        <div style={{ display: 'flex', gap: '6px', justifyContent: 'center', alignItems: 'flex-end' }}>
          <div style={{ width: '12px', height: '24px', backgroundColor: '#667eea', borderRadius: '3px', boxShadow: '0 2px 4px rgba(102, 126, 234, 0.3)' }} />
          <div style={{ width: '12px', height: '18px', backgroundColor: '#10b981', borderRadius: '3px', boxShadow: '0 2px 4px rgba(16, 185, 129, 0.3)' }} />
          <div style={{ width: '12px', height: '30px', backgroundColor: '#f59e0b', borderRadius: '3px', boxShadow: '0 2px 4px rgba(245, 158, 11, 0.3)' }} />
        </div>
      </div>
      <div className="hero-grid" style={{
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
        <div style={{ animation: 'fadeInUp 1s ease-out' }}>
          <div className="hero-badge" style={{
            display: 'inline-block',
            padding: '8px 16px',
            backgroundColor: 'rgba(255, 255, 255, 0.2)',
            borderRadius: '20px',
            marginBottom: '20px',
            fontSize: '14px',
            fontWeight: '500',
            backdropFilter: 'blur(10px)'
          }}>
            ✨ Professional Project Management
          </div>

          <h1 className="hero-title" style={{
            fontSize: '3.5rem',
            fontWeight: '800',
            marginBottom: '24px',
            lineHeight: '1.1',
            color: '#ffffff',
            textShadow: '0 2px 10px rgba(0, 0, 0, 0.1)'
          }}>
            Manage Projects
            <span style={{ display: 'block', color: '#fbbf24' }}>Like a Pro</span>
          </h1>

          <p className="hero-description" style={{
            fontSize: '1.25rem',
            marginBottom: '40px',
            lineHeight: '1.8',
            color: 'rgba(255, 255, 255, 0.9)'
          }}>
            Streamline your workflow with Tabredon's professional project management platform.
            Track tasks, manage teams, and deliver projects on time with powerful tools and insights.
          </p>

          <div className="hero-buttons" style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
            <button
              onClick={() => navigate('/signup')}
              style={{
                padding: '18px 36px',
                backgroundColor: '#ffffff',
                color: '#667eea',
                border: 'none',
                borderRadius: '12px',
                fontSize: '16px',
                fontWeight: '700',
                cursor: 'pointer',
                boxShadow: '0 8px 20px rgba(0, 0, 0, 0.15)',
                transition: 'all 0.3s ease',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
              onMouseEnter={(e) => {
                e.target.style.transform = 'translateY(-2px)';
                e.target.style.boxShadow = '0 12px 28px rgba(0, 0, 0, 0.2)';
              }}
              onMouseLeave={(e) => {
                e.target.style.transform = 'translateY(0)';
                e.target.style.boxShadow = '0 8px 20px rgba(0, 0, 0, 0.15)';
              }}
            >
              Get Started Free
              <span style={{ fontSize: '18px' }}>→</span>
            </button>

            <button
              onClick={() => navigate('/signin')}
              style={{
                padding: '18px 36px',
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                color: '#ffffff',
                border: '2px solid rgba(255, 255, 255, 0.3)',
                borderRadius: '12px',
                fontSize: '16px',
                fontWeight: '600',
                cursor: 'pointer',
                backdropFilter: 'blur(10px)',
                transition: 'all 0.3s ease'
              }}
              onMouseEnter={(e) => {
                e.target.style.backgroundColor = 'rgba(255, 255, 255, 0.2)';
                e.target.style.borderColor = 'rgba(255, 255, 255, 0.5)';
                e.target.style.transform = 'translateY(-2px)';
              }}
              onMouseLeave={(e) => {
                e.target.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
                e.target.style.borderColor = 'rgba(255, 255, 255, 0.3)';
                e.target.style.transform = 'translateY(0)';
              }}
            >
              Sign In
            </button>
          </div>

          <div style={{
            marginTop: '40px',
            display: 'flex',
            alignItems: 'center',
            gap: '24px',
            flexWrap: 'wrap'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '20px' }}>✓</span>
              <span style={{ fontSize: '14px', color: 'rgba(255, 255, 255, 0.9)' }}>Free forever plan</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '20px' }}>✓</span>
              <span style={{ fontSize: '14px', color: 'rgba(255, 255, 255, 0.9)' }}>No credit card required</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '20px' }}>✓</span>
              <span style={{ fontSize: '14px', color: 'rgba(255, 255, 255, 0.9)' }}>Setup in minutes</span>
            </div>
          </div>
        </div>

        <div style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          position: 'relative',
          animation: 'fadeInRight 1s ease-out'
        }}>
          {/* Main Dashboard Mockup */}
          <div className="hero-mockup" style={{
            width: '500px',
            height: '350px',
            backgroundColor: 'rgba(255, 255, 255, 0.95)',
            borderRadius: '20px',
            padding: '20px',
            border: '1px solid rgba(255, 255, 255, 0.3)',
            boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
            backdropFilter: 'blur(10px)',
            position: 'relative',
            overflow: 'hidden'
          }}>
            {/* Mockup Header */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '20px',
              paddingBottom: '15px',
              borderBottom: '2px solid #e2e8f0'
            }}>
              <div style={{ display: 'flex', gap: '6px' }}>
                <div style={{ width: '12px', height: '12px', backgroundColor: '#ef4444', borderRadius: '50%' }} />
                <div style={{ width: '12px', height: '12px', backgroundColor: '#f59e0b', borderRadius: '50%' }} />
                <div style={{ width: '12px', height: '12px', backgroundColor: '#10b981', borderRadius: '50%' }} />
              </div>
              <div style={{ fontSize: '14px', fontWeight: '600', color: '#667eea' }}>Dashboard</div>
            </div>

            {/* Mockup Content */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              {/* Stats Cards */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
                <div style={{
                  backgroundColor: '#ede9fe',
                  padding: '12px',
                  borderRadius: '10px',
                  border: '1px solid #c4b5fd'
                }}>
                  <div style={{ fontSize: '10px', color: '#667eea', marginBottom: '4px' }}>Projects</div>
                  <div style={{ fontSize: '20px', fontWeight: '700', color: '#667eea' }}>24</div>
                </div>
                <div style={{
                  backgroundColor: '#d1fae5',
                  padding: '12px',
                  borderRadius: '10px',
                  border: '1px solid #6ee7b7'
                }}>
                  <div style={{ fontSize: '10px', color: '#10b981', marginBottom: '4px' }}>Tasks</div>
                  <div style={{ fontSize: '20px', fontWeight: '700', color: '#10b981' }}>156</div>
                </div>
                <div style={{
                  backgroundColor: '#fef3c7',
                  padding: '12px',
                  borderRadius: '10px',
                  border: '1px solid #fcd34d'
                }}>
                  <div style={{ fontSize: '10px', color: '#f59e0b', marginBottom: '4px' }}>Team</div>
                  <div style={{ fontSize: '20px', fontWeight: '700', color: '#f59e0b' }}>12</div>
                </div>
              </div>

              {/* Progress Bars */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '10px' }}>
                <div>
                  <div style={{ fontSize: '11px', color: '#64748b', marginBottom: '6px', fontWeight: '500' }}>Website Redesign</div>
                  <div style={{ width: '100%', height: '8px', backgroundColor: '#e2e8f0', borderRadius: '4px', overflow: 'hidden' }}>
                    <div style={{ width: '75%', height: '100%', backgroundColor: '#667eea', borderRadius: '4px' }} />
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '11px', color: '#64748b', marginBottom: '6px', fontWeight: '500' }}>Mobile App</div>
                  <div style={{ width: '100%', height: '8px', backgroundColor: '#e2e8f0', borderRadius: '4px', overflow: 'hidden' }}>
                    <div style={{ width: '45%', height: '100%', backgroundColor: '#10b981', borderRadius: '4px' }} />
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '11px', color: '#64748b', marginBottom: '6px', fontWeight: '500' }}>Marketing Campaign</div>
                  <div style={{ width: '100%', height: '8px', backgroundColor: '#e2e8f0', borderRadius: '4px', overflow: 'hidden' }}>
                    <div style={{ width: '90%', height: '100%', backgroundColor: '#f59e0b', borderRadius: '4px' }} />
                  </div>
                </div>
              </div>
            </div>

            {/* Decorative gradient overlay */}
            <div style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              height: '60px',
              background: 'linear-gradient(to top, rgba(102, 126, 234, 0.1), transparent)',
              pointerEvents: 'none'
            }} />
          </div>

          {/* Floating elements around the main visual */}
          <div style={{
            position: 'absolute',
            top: '-20px',
            right: '-20px',
            width: '80px',
            height: '80px',
            background: 'linear-gradient(135deg, #fbbf24, #f59e0b)',
            borderRadius: '50%',
            opacity: 0.3,
            filter: 'blur(20px)',
            animation: 'pulse 3s ease-in-out infinite'
          }} />

          <div style={{
            position: 'absolute',
            bottom: '-30px',
            left: '-30px',
            width: '100px',
            height: '100px',
            background: 'linear-gradient(135deg, #10b981, #059669)',
            borderRadius: '50%',
            opacity: 0.3,
            filter: 'blur(20px)',
            animation: 'pulse 4s ease-in-out infinite'
          }} />
        </div>
      </div>
    </section>
  );
};

export default Hero;