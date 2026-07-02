import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import UnifiedHeader from '../layout/UnifiedHeader';
import Hero from '../landing/Hero';
import Features from '../landing/Features';
import Footer from '../landing/Footer';

const LandingPage = () => {
  const navigate = useNavigate();
  const { state } = useAuth();

  // Allow page even if user is logged in
  useEffect(() => {
    // No redirect anymore
  }, [state.isAuthenticated, state.loading, navigate]);

  // Show loading state while checking authentication
  if (state.loading) {
    return (
      <div className="flex flex-col min-h-screen bg-slate-900 items-center justify-center p-6 relative overflow-hidden">
        {/* Abstract Background Element */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-indigo-600/10 rounded-full blur-[100px] animate-pulse"></div>

        <div className="relative z-10 text-center animate-in fade-in zoom-in duration-1000">
          <div className="relative w-20 h-20 mx-auto mb-10">
            <div className="absolute inset-0 rounded-[28px] border-4 border-indigo-500/20"></div>
            <div className="absolute inset-0 rounded-[28px] border-t-4 border-indigo-400 animate-spin"></div>
            <div className="absolute inset-4 rounded-[16px] bg-gradient-to-br from-indigo-500/20 to-purple-500/20 backdrop-blur-sm flex items-center justify-center">
              <div className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-ping"></div>
            </div>
          </div>
          <h2 className="text-white font-black text-xs uppercase tracking-[0.3em] opacity-40 animate-pulse">
            System Preloading
          </h2>
          <div className="mt-8 flex justify-center gap-1.5">
            <div className="w-1 h-1 rounded-full bg-indigo-500/50 animate-bounce"></div>
            <div className="w-1 h-1 rounded-full bg-indigo-500/70 animate-bounce delay-150"></div>
            <div className="w-1 h-1 rounded-full bg-indigo-500/90 animate-bounce delay-300"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white text-slate-900 selection:bg-indigo-50 selection:text-indigo-900">
      <UnifiedHeader />
      <main className="pt-20">
        <Hero />
        <Features />
      </main>
      <Footer />
    </div>
  );
};

export default LandingPage;
