import React from 'react';
import { useNavigate } from 'react-router-dom';
import './landing.css';

const Hero = () => {
  const navigate = useNavigate();

  return (
    <section className="relative min-h-screen flex items-center bg-gradient-to-br from-indigo-700 via-indigo-800 to-purple-900 pt-20 overflow-hidden text-white">
      {/* Dynamic Background Elements */}
      <div className="absolute top-[10%] -right-20 w-[600px] h-[600px] bg-indigo-500/10 rounded-full blur-[120px] animate-pulse"></div>
      <div className="absolute -bottom-[10%] -left-20 w-[500px] h-[500px] bg-purple-500/10 rounded-full blur-[100px] animate-pulse delay-1000"></div>

      {/* Decorative Floating Mesh */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[radial-gradient(#fff_1px,transparent_1px)] bg-[length:40px_40px]"></div>

      <div className="container mx-auto px-6 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">

          {/* Left Content Column */}
          <div className="animate-in fade-in slide-in-from-left-10 duration-1000">
            <div className="inline-flex items-center gap-3 px-5 py-2 rounded-full bg-white/10 backdrop-blur-xl border border-white/10 mb-8 border-l-4 border-l-amber-400">
              <span className="flex h-2 w-2 rounded-full bg-amber-400 animate-ping"></span>
              <span className="text-xs font-black uppercase tracking-[0.2em]">Next-Gen Orchestration</span>
            </div>

            <h1 className="text-5xl lg:text-7xl font-black leading-[1.05] tracking-tight mb-8">
              Engineer <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-amber-200 to-amber-400">
                Peak Output
              </span>
            </h1>

            <p className="text-lg lg:text-xl text-indigo-100/80 leading-relaxed mb-12 max-w-xl font-medium">
              Offtix redefines project management with a high-fidelity interface designed for architectural precision. Track, analyze, and deploy objectives with surgical accuracy.
            </p>

            <div className="flex flex-wrap gap-6 items-center">
              <button
                onClick={() => navigate('/signup')}
                className="group relative px-10 py-5 bg-white text-indigo-900 rounded-2xl font-black text-sm uppercase tracking-widest shadow-24 hover:hover:shadow-indigo-500/20 active:scale-95 transition-all overflow-hidden"
              >
                <span className="relative z-10 flex items-center gap-3">
                  Initiate Deployment
                  <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5"><path d="M5 12h14M12 5l7 7-7 7"></path></svg>
                </span>
                <div className="absolute inset-0 bg-gradient-to-r from-amber-100 to-white opacity-0 group-hover:opacity-100 transition-opacity"></div>
              </button>

              <button
                onClick={() => navigate('/signin')}
                className="px-10 py-5 bg-indigo-900/30 backdrop-blur-md border-2 border-white/10 hover:border-white/30 text-white rounded-2xl font-black text-sm uppercase tracking-widest transition-all active:scale-95"
              >
                Access Portal
              </button>
            </div>

            <div className="mt-16 flex flex-wrap gap-8 opacity-60 grayscale hover:grayscale-0 transition-all duration-700">
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 rounded-md bg-white/20 flex items-center justify-center"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M20 6L9 17l-5-5"></path></svg></div>
                <span className="text-[10px] font-black uppercase tracking-widest">Enterprise Encrypted</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 rounded-md bg-white/20 flex items-center justify-center"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M20 6L9 17l-5-5"></path></svg></div>
                <span className="text-[10px] font-black uppercase tracking-widest">Multi-Node Sync</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 rounded-md bg-white/20 flex items-center justify-center"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M20 6L9 17l-5-5"></path></svg></div>
                <span className="text-[10px] font-black uppercase tracking-widest">Zero Latency</span>
              </div>
            </div>
          </div>

          {/* Right Visual Column */}
          <div className="relative group animate-in fade-in zoom-in duration-1000 delay-200">
            {/* Background Glows */}
            <div className="absolute -inset-10 bg-gradient-to-br from-indigo-500/20 to-purple-500/20 blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-1000"></div>

            {/* Dashboard Mockup Container */}
            <div className="relative bg-slate-900/40 backdrop-blur-3xl border border-white/10 p-2 rounded-[40px] shadow-2xl scale-110 lg:scale-100 origin-center transition-transform duration-700 group-hover:scale-105">
              <div className="bg-white rounded-[38px] overflow-hidden shadow-inner">
                {/* Mockup Top Bar */}
                <div className="px-8 py-5 border-b-4 border-slate-50 flex justify-between items-center bg-slate-50/50">
                  <div className="flex gap-2">
                    <div className="w-3 h-3 rounded-full bg-red-400"></div>
                    <div className="w-3 h-3 rounded-full bg-amber-400"></div>
                    <div className="w-3 h-3 rounded-full bg-emerald-400"></div>
                  </div>
                  <div className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 italic">Project_Architecture_v1.0</div>
                </div>

                {/* Mockup Content Grid */}
                <div className="p-8">
                  <div className="grid grid-cols-3 gap-6 mb-10">
                    <div className="p-5 bg-indigo-50 rounded-[28px] border-b-4 border-indigo-100">
                      <div className="text-[9px] font-black text-indigo-400 uppercase tracking-widest mb-1">Velocity</div>
                      <div className="text-2xl font-black text-indigo-600 tracking-tighter">142%</div>
                    </div>
                    <div className="p-5 bg-emerald-50 rounded-[28px] border-b-4 border-emerald-100">
                      <div className="text-[9px] font-black text-emerald-400 uppercase tracking-widest mb-1">Uptime</div>
                      <div className="text-2xl font-black text-emerald-600 tracking-tighter">99.9</div>
                    </div>
                    <div className="p-5 bg-amber-50 rounded-[28px] border-b-4 border-amber-100">
                      <div className="text-[9px] font-black text-amber-400 uppercase tracking-widest mb-1">Health</div>
                      <div className="text-2xl font-black text-amber-600 tracking-tighter">Optimal</div>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div className="animate-in slide-in-from-right duration-500 delay-300">
                      <div className="flex justify-between text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">
                        <span>Core Engine Refactor</span>
                        <span className="text-indigo-600 font-black">88%</span>
                      </div>
                      <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-indigo-500 to-indigo-600 rounded-full w-[88%] shadow-lg shadow-indigo-100"></div>
                      </div>
                    </div>
                    <div className="animate-in slide-in-from-right duration-500 delay-500">
                      <div className="flex justify-between text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">
                        <span>Market Intel Sync</span>
                        <span className="text-amber-600 font-black">42%</span>
                      </div>
                      <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-amber-400 to-amber-500 rounded-full w-[42%] shadow-lg shadow-amber-100"></div>
                      </div>
                    </div>
                  </div>

                  <div className="mt-12 p-6 bg-slate-900 rounded-[32px] text-white flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-indigo-600 flex items-center justify-center shadow-xl shadow-indigo-900/50">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 2v20M2 12h20"></path></svg>
                      </div>
                      <div>
                        <div className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-0.5">Active Project</div>
                        <div className="text-sm font-black tracking-tight">Nexus Prime</div>
                      </div>
                    </div>
                    <div className="px-4 py-2 bg-indigo-500/20 text-indigo-300 rounded-xl text-[10px] font-black uppercase tracking-widest border border-indigo-500/30">
                      Deploying
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Floating Satellite Cards */}
            <div className="absolute -top-12 -left-12 p-6 bg-white/95 backdrop-blur-xl rounded-[32px] shadow-2xl shadow-indigo-500/20 border border-white animate-bounce-slow max-w-[180px]">
              <div className="text-[10px] font-black text-indigo-600 uppercase tracking-widest mb-3 flex items-center gap-2">
                <span className="w-4 h-[2px] bg-indigo-600"></span> Alert Flux
              </div>
              <div className="text-xs font-bold text-slate-600 leading-relaxed">System bottleneck detected in node 04-A. Auto-rerouting...</div>
            </div>

            <div className="absolute -bottom-8 -right-8 p-6 bg-slate-900 rounded-[32px] shadow-2xl border border-white/10 animate-float">
              <div className="flex items-center gap-4">
                <div className="relative">
                  <div className="w-12 h-12 rounded-full border-2 border-indigo-500 p-0.5">
                    <div className="w-full h-full bg-slate-800 rounded-full flex items-center justify-center text-xl">👤</div>
                  </div>
                  <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 border-2 border-slate-900 rounded-full"></div>
                </div>
                <div>
                  <div className="text-xs font-bold">Protocol Lead</div>
                  <div className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.2em] mt-0.5">Connected</div>
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