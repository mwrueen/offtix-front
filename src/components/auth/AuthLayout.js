import React from 'react';
import { useNavigate } from 'react-router-dom';

const AuthLayout = ({ children, title, subtitle }) => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex font-sans">
      {/* Left branded panel */}
      <div className="hidden lg:flex lg:w-[45%] bg-gradient-to-br from-indigo-600 via-indigo-700 to-slate-900 flex-col justify-between p-12 relative overflow-hidden">
        {/* Background orbs */}
        <div className="absolute top-[-10%] right-[-10%] w-72 h-72 bg-white/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-[-5%] left-[-5%] w-96 h-96 bg-indigo-400/10 rounded-full blur-3xl pointer-events-none" />

        {/* Logo */}
        <div
          onClick={() => navigate('/')}
          className="cursor-pointer flex items-center gap-3 relative z-10 w-fit"
        >
          <div className="w-10 h-10 bg-white/15 backdrop-blur rounded-xl flex items-center justify-center text-white text-lg font-black border border-white/20">
            O
          </div>
          <span className="text-white text-xl font-bold tracking-wide">Offtix</span>
        </div>

        {/* Center quote */}
        <div className="relative z-10 space-y-6">
          <div className="w-10 h-1 bg-white/40 rounded-full" />
          <blockquote className="text-white/90 text-2xl font-semibold leading-snug">
            Manage your team,<br />events, and operations<br />all in one place.
          </blockquote>
          <p className="text-white/50 text-sm">Trusted by teams worldwide.</p>
        </div>

        {/* Bottom dots */}
        <div className="flex gap-2 relative z-10">
          <div className="w-2 h-2 rounded-full bg-white/60" />
          <div className="w-2 h-2 rounded-full bg-white/20" />
          <div className="w-2 h-2 rounded-full bg-white/20" />
        </div>
      </div>

      {/* Right form panel */}
      <div className="flex-1 bg-white flex items-center justify-center p-8">
        <div className="w-full max-w-sm">
          {/* Mobile logo */}
          <div
            onClick={() => navigate('/')}
            className="lg:hidden cursor-pointer flex items-center gap-3 mb-10"
          >
            <div className="w-9 h-9 bg-indigo-600 rounded-xl flex items-center justify-center text-white text-base font-black">
              O
            </div>
            <span className="text-slate-900 text-lg font-bold">Offtix</span>
          </div>

          {/* Heading */}
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-slate-900 mb-1">{title}</h1>
            <p className="text-slate-500 text-sm">{subtitle}</p>
          </div>

          {children}

          {/* Footer */}
          <div className="mt-10 flex items-center justify-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            <span className="text-xs text-slate-400">Secured with end-to-end encryption</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthLayout;
