import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Header from './landing/Header';
import Hero from './landing/Hero';
import Features from './landing/Features';
import Footer from './landing/Footer';

const LandingPage = () => {
  const navigate = useNavigate();
  const { state } = useAuth();

  // Redirect to dashboard if user is already logged in
  useEffect(() => {
    if (state.isAuthenticated && !state.loading) {
      navigate('/dashboard');
    }
  }, [state.isAuthenticated, state.loading, navigate]);

  // Show loading state while checking authentication
  if (state.loading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        backgroundColor: '#f8fafc'
      }}>
        <div style={{
          padding: '20px',
          textAlign: 'center'
        }}>
          <div style={{
            width: '40px',
            height: '40px',
            border: '4px solid #e2e8f0',
            borderTop: '4px solid #667eea',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 16px'
          }}></div>
          <p style={{ color: '#64748b', margin: 0 }}>Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh' }}>
      <Header />
      <Hero />
      <Features />
      <Footer />
    </div>
  );
};

export default LandingPage;