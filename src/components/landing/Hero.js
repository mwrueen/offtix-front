import React from 'react';
import { useNavigate } from 'react-router-dom';

const Hero = () => {
  const navigate = useNavigate();

  return (
    <section className="relative min-h-screen flex items-center bg-white pt-32 overflow-hidden text-slate-900">
      {/* Dynamic Background Elements */}
      <div className="absolute top-[10%] -right-20 w-[600px] h-[600px] bg-indigo-50 rounded-full blur-[120px] opacity-60"></div>
      <div className="absolute -bottom-[10%] -left-20 w-[500px] h-[500px] bg-purple-50 rounded-full blur-[100px] opacity-60"></div>

      {/* Grid Pattern */}
      <div className="absolute inset-0 opacity-[0.05] pointer-events-none bg-[radial-gradient(#6366f1_1px,transparent_1px)] bg-[length:40px_40px]"></div>

      <div className="max-w-7xl mx-auto px-10 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-24 items-center">

          {/* Left Content Column */}
          <div className="animate-in fade-in slide-in-from-left-10 duration-1000">
            <div className="inline-flex items-center gap-3 px-4 py-2 rounded-full bg-indigo-50 border border-indigo-100 mb-10">
              <span className="flex h-2 w-2 rounded-full bg-indigo-600 animate-ping"></span>
              <span className="text-[10px] font-black uppercase tracking-[0.3em] text-indigo-600">Enterprise Orchestration</span>
            </div>

            <h1 className="text-6xl lg:text-8xl font-black leading-[0.9] tracking-tighter mb-10 text-slate-950">
              Architecting <br />
              <span className="text-indigo-600">Performance.</span>
            </h1>

            <p className="text-xl text-slate-500 leading-relaxed mb-12 max-w-xl font-medium">
              The high-fidelity infrastructure for mission-critical project management. Standardize workflows, analyze velocity, and scale operations with surgical precision.
            </p>

            <div className="flex flex-wrap gap-6 items-center">
              <button
                onClick={() => navigate('/signup')}
                className="group px-10 py-5 bg-slate-900 text-white rounded-[2rem] font-black text-[11px] uppercase tracking-[0.2em] shadow-2xl shadow-indigo-200 hover:bg-indigo-600 transition-all active:scale-95"
              >
                Start Deployment
              </button>

              <button
                onClick={() => navigate('/signin')}
                className="px-10 py-5 bg-white border-2 border-slate-100 hover:border-indigo-600 text-slate-900 rounded-[2rem] font-black text-[11px] uppercase tracking-[0.2em] transition-all active:scale-95 shadow-sm"
              >
                Access Hub
              </button>
            </div>

            <div className="mt-20 pt-10 border-t border-slate-100 flex flex-wrap gap-12 opacity-40">
              <div className="flex items-center gap-3">
                <span className="text-sm font-bold border-b-2 border-slate-900">ISO</span>
                <span className="text-[10px] font-black uppercase tracking-widest leading-none">Compliant<br />Infrastructure</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-sm font-bold border-b-2 border-slate-900">E2E</span>
                <span className="text-[10px] font-black uppercase tracking-widest leading-none">Encrypted<br />Node Sync</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-sm font-bold border-b-2 border-slate-900">24/7</span>
                <span className="text-[10px] font-black uppercase tracking-widest leading-none">Uptime<br />Monitoring</span>
              </div>
            </div>
          </div>

          {/* Right Visual Column */}
          <div className="relative animate-in fade-in zoom-in duration-1000 delay-200">
            {/* Dashboard Mockup */}
            <div className="bg-slate-50 p-3 rounded-[3rem] border border-slate-200 shadow-2xl relative">
              <div className="absolute -top-6 -right-6 w-32 h-32 bg-indigo-100 rounded-full blur-[60px] opacity-50" />

              <div className="bg-white rounded-[2.5rem] overflow-hidden border border-slate-100 shadow-inner">
                {/* Mockup Header */}
                <div className="px-8 py-5 flex justify-between items-center border-b border-slate-50">
                  <div className="flex gap-2">
                    <div className="w-2.5 h-2.5 rounded-full bg-slate-200" />
                    <div className="w-2.5 h-2.5 rounded-full bg-slate-200" />
                    <div className="w-2.5 h-2.5 rounded-full bg-slate-200" />
                  </div>
                  <div className="text-[9px] font-black text-slate-300 uppercase tracking-widest">Protocol-Level Intelligence</div>
                </div>

                <div className="p-10 space-y-10">
                  <div className="grid grid-cols-2 gap-6">
                    <div className="p-6 bg-slate-50 rounded-3xl border-l-[6px] border-indigo-600">
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Operational Health</p>
                      <p className="text-3xl font-black text-slate-900 tracking-tight">99.8%</p>
                    </div>
                    <div className="p-6 bg-slate-50 rounded-3xl border-l-[6px] border-emerald-500">
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Team Velocity</p>
                      <p className="text-3xl font-black text-slate-900 tracking-tight">High</p>
                    </div>
                  </div>

                  <div className="space-y-6 pt-4">
                    <div className="flex items-center gap-6">
                      <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center text-xl font-bold border border-indigo-100 italic">P</div>
                      <div className="flex-1">
                        <div className="flex justify-between items-end mb-2">
                          <span className="text-[10px] font-black uppercase text-slate-600 tracking-widest">Nexus Development</span>
                          <span className="text-[10px] font-black text-indigo-600">84%</span>
                        </div>
                        <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                          <div className="h-full bg-indigo-600 rounded-full w-[84%] shadow-lg shadow-indigo-100" />
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-6">
                      <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center text-xl font-bold border border-amber-100 italic">M</div>
                      <div className="flex-1">
                        <div className="flex justify-between items-end mb-2">
                          <span className="text-[10px] font-black uppercase text-slate-600 tracking-widest">Growth Analytics</span>
                          <span className="text-[10px] font-black text-amber-600">32%</span>
                        </div>
                        <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                          <div className="h-full bg-amber-500 rounded-full w-[32%] shadow-lg shadow-amber-100" />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 p-6 bg-slate-900 rounded-[2rem] text-white flex items-center justify-between shadow-2xl transition-transform hover:scale-[1.02] cursor-pointer">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center">📡</div>
                      <div>
                        <p className="text-[9px] font-black text-indigo-400 uppercase tracking-widest">Sync Active</p>
                        <p className="text-xs font-bold leading-none">Engineering Hub</p>
                      </div>
                    </div>
                    <span className="px-3 py-1 bg-white/10 rounded-lg text-[9px] font-black uppercase tracking-widest border border-white/5">0.1ms Lag</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Floaties */}
            <div className="absolute -bottom-10 -left-10 p-6 bg-white border border-slate-100 rounded-3xl shadow-2xl animate-float">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-indigo-50 border-2 border-indigo-100 flex items-center justify-center text-indigo-600 font-black">AD</div>
                <div>
                  <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Session</p>
                  <p className="text-xs font-bold text-slate-900 italic">Lead Designer</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;