import React from 'react';
import { Link } from 'react-router-dom';

const Footer = () => {
  return (
    <footer className="bg-slate-950 text-white pt-32 pb-16 px-10">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-16 mb-24">
          <div className="lg:col-span-1">
            <Link to="/" className="flex items-center mb-8 group">
              <img
                src="/offtix-logo.png"
                alt="Offtix Logo"
                className="h-10 w-auto object-contain transition-opacity group-hover:opacity-80 brightness-0 invert"
              />
            </Link>
            <p className="text-slate-500 leading-relaxed text-sm font-medium pr-10">
              The high-fidelity infrastructure for mission-critical project management and workforce orchestration.
            </p>
          </div>

          <div>
            <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-indigo-500 mb-8">
              Protocol
            </h4>
            <ul className="space-y-4">
              <li>
                <a href="#features" className="text-slate-400 text-xs font-bold uppercase tracking-widest hover:text-white transition-colors">Architecture</a>
              </li>
              <li>
                <Link to="/careers" className="text-slate-400 text-xs font-bold uppercase tracking-widest hover:text-white transition-colors">Career Node</Link>
              </li>
              <li>
                <a href="#" className="text-slate-400 text-xs font-bold uppercase tracking-widest hover:text-white transition-colors">Deployment Log</a>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-indigo-500 mb-8">
              Company
            </h4>
            <ul className="space-y-4">
              <li>
                <a href="#" className="text-slate-400 text-xs font-bold uppercase tracking-widest hover:text-white transition-colors">The Lab</a>
              </li>
              <li>
                <a href="#" className="text-slate-400 text-xs font-bold uppercase tracking-widest hover:text-white transition-colors">Security protocol</a>
              </li>
              <li>
                <a href="#" className="text-slate-400 text-xs font-bold uppercase tracking-widest hover:text-white transition-colors">Support sync</a>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-indigo-500 mb-8">
              System Status
            </h4>
            <div className="p-6 bg-white/5 border border-white/10 rounded-3xl">
              <div className="flex items-center gap-3 mb-3">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[10px] font-black uppercase tracking-widest">Mainframe Online</span>
              </div>
              <p className="text-[10px] font-bold text-slate-500 leading-relaxed">
                All global nodes operating at optimal velocity. (0.0ms delay)
              </p>
            </div>
          </div>
        </div>

        <div className="pt-12 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-8 text-slate-500 text-[10px] font-black uppercase tracking-[0.2em]">
          <p>
            © 2026 Offtix Analytics Protocol. Built for architectural precision.
          </p>
          <div className="flex gap-10">
            <a href="#" className="hover:text-white transition-colors">Privacy Infrastructure</a>
            <a href="#" className="hover:text-white transition-colors">Service Terms</a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;