import React from 'react';
import { useNavigate } from 'react-router-dom';

const AuthLayout = ({ children, title, subtitle }) => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-8 relative overflow-hidden font-sans selection:bg-indigo-500 selection:text-white">
      {/* Cinematic Background Layer */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-indigo-600/10 rounded-full blur-[150px] animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-emerald-500/5 rounded-full blur-[150px] animate-pulse [animation-delay:3s]" />

        {/* Decorative Grid */}
        <div className="absolute inset-0 opacity-[0.03] bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:40px_40px]" />
      </div>

      <div className="w-full max-w-2xl relative z-10 shrink-0 animate-in fade-in zoom-in-95 duration-1000">
        {/* Mission-Critical Container */}
        <div className="bg-white/[0.02] backdrop-blur-3xl border border-white/10 rounded-[5rem] shadow-24 overflow-hidden relative group">
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-1000 pointer-events-none" />

          <div className="p-20 relative z-10">
            {/* Command Header */}
            <div className="flex flex-col items-center mb-16">
              <div
                onClick={() => navigate('/')}
                className="group/logo cursor-pointer flex flex-col items-center gap-6 mb-4 hover:scale-105 transition-all duration-700"
              >
                <div className="w-24 h-24 bg-slate-950 border-4 border-white/10 rounded-[3rem] flex items-center justify-center text-white text-5xl font-black shadow-24 relative overflow-hidden italic group-hover/logo:rotate-6 transition-transform">
                  <span className="relative z-10">O</span>
                  <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-tr from-indigo-600/40 to-transparent" />
                </div>
                <div className="text-center space-y-2">
                  <span className="block text-4xl font-black text-white tracking-[0.6em] uppercase italic group-hover/logo:tracking-[0.8em] transition-all duration-1000">
                    Offtix
                  </span>
                  <div className="h-0.5 w-16 bg-indigo-600 mx-auto rounded-full group-hover/logo:w-full transition-all duration-1000" />
                </div>
              </div>
            </div>

            {/* Directive Intel */}
            <div className="text-center mb-16">
              <h1 className="text-5xl font-black text-white uppercase italic tracking-tighter mb-4 animate-in slide-in-from-top-6 duration-700">
                {title}
              </h1>
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.6em] italic animate-pulse">
                {subtitle} // SECURE_SYNC_REQ
              </p>
            </div>

            {/* Core Interaction Node */}
            <div className="space-y-10">
              {children}
            </div>

            {/* Terminal Validation Footer */}
            <div className="mt-20 pt-12 border-t border-white/5 flex justify-center gap-12">
              <div className="flex items-center gap-4 opacity-30 hover:opacity-100 transition-opacity">
                <div className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.8)]" />
                <span className="text-[9px] font-black text-white uppercase tracking-[0.3em] italic">Encryption_Active</span>
              </div>
              <div className="flex items-center gap-4 opacity-30 hover:opacity-100 transition-opacity">
                <div className="w-2 h-2 rounded-full bg-indigo-500 shadow-[0_0_10px_rgba(99,102,241,0.8)]" />
                <span className="text-[9px] font-black text-white uppercase tracking-[0.3em] italic">Node_Verified</span>
              </div>
            </div>
          </div>
        </div>

        {/* Global Surveillance Overlay */}
        <div className="absolute -bottom-16 left-0 w-full flex justify-between px-16 text-[9px] font-black text-slate-700 uppercase tracking-[0.4em] italic opacity-50">
          <span className="hover:text-indigo-400 transition-colors cursor-default">PROTO_OS_V4.8.22_STABLE</span>
          <span>SYSTEM_TIME: {new Date().toLocaleTimeString('en-US', { hour12: false })}_UTC</span>
        </div>
      </div>
    </div>
  );
};

export default AuthLayout;