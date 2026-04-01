import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import './landing.css';

const Header = () => {
  const navigate = useNavigate();
  const { state } = useAuth();

  return (
    <header className="fixed top-0 left-0 right-0 bg-white/95 backdrop-blur-sm border-b border-black/10 z-[1000]">
      <div className="max-w-6xl mx-auto px-6 flex justify-between items-center h-[70px]">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-indigo-500 rounded-lg flex items-center justify-center text-white font-bold">
            T
          </div>
          <span className="text-2xl font-bold text-slate-800">
            Offtix
          </span>
        </div>

        <nav className="header-nav flex items-center gap-8">

          <a href="#pricing" className="text-slate-500 no-underline font-medium transition-colors duration-200 hover:text-slate-800">
            Pricing
          </a>
          <a href="#about" className="text-slate-500 no-underline font-medium transition-colors duration-200 hover:text-slate-800">
            About
          </a>
        </nav>

        <div className="flex items-center gap-3">
          {state.isAuthenticated ? (
            <button
              onClick={() => navigate('/dashboard')}
              className="px-5 py-2.5 bg-indigo-500 text-white border-0 rounded-md text-sm font-semibold cursor-pointer shadow-lg shadow-indigo-500/30 transition-all duration-200 hover:bg-indigo-600 hover:-translate-y-0.5"
            >
              Go to Dashboard
            </button>
          ) : (
            <>
              <button
                onClick={() => navigate('/signin')}
                className="px-4 py-2 bg-transparent text-slate-500 border-0 rounded-md text-sm font-medium cursor-pointer transition-colors duration-200 hover:text-slate-800"
              >
                Sign In
              </button>
              <button
                onClick={() => navigate('/signup')}
                className="px-4 py-2 bg-indigo-500 text-white border-0 rounded-md text-sm font-medium cursor-pointer transition-all duration-200 hover:bg-indigo-600 hover:-translate-y-0.5"
              >
                Get Started
              </button>
            </>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;