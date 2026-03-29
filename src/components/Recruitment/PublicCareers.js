import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const PublicCareers = () => {
    const { state } = useAuth();
    const { isAuthenticated } = state;
    const [circulars, setCirculars] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchCirculars = async () => {
            try {
                const res = await axios.get('/api/recruitment/public/circulars');
                setCirculars(res.data);
            } catch (error) {
                console.error('Error fetching circulars:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchCirculars();
    }, []);

    return (
        <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col font-sans selection:bg-indigo-500/30">
            {/* Header */}
            <nav className="h-20 border-b border-white/5 flex items-center px-10 sticky top-0 bg-slate-900/80 backdrop-blur-md z-50">
                <div className="flex-1 flex items-center space-x-2">
                    <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center font-black italic shadow-lg shadow-indigo-600/20">O</div>
                    <span className="text-xl font-bold tracking-tighter">Offtix <span className="text-indigo-400">Careers</span></span>
                </div>
                <div className="flex space-x-8 text-sm font-medium text-slate-400 items-center">
                    <Link to="/" className="hover:text-white transition-colors">Home</Link>
                    {isAuthenticated ? (
                        <Link to="/dashboard" className="px-5 py-2.5 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-500 transition-all shadow-lg shadow-indigo-600/20">Go to Dashboard</Link>
                    ) : (
                        <>
                            <Link to="/signin" className="hover:text-white transition-colors">Sign In</Link>
                            <Link to="/signup" className="px-4 py-2 bg-indigo-600/10 text-indigo-400 border border-indigo-400/20 rounded-lg hover:bg-indigo-600/20 transition-all">Create Account</Link>
                        </>
                    )}
                </div>
            </nav>

            {/* Hero Section */}
            <section className="py-24 px-10 max-w-7xl mx-auto flex flex-col items-center text-center">
                <span className="inline-block px-3 py-1 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 rounded-full text-xs font-bold uppercase tracking-widest mb-6">WE ARE HIRING</span>
                <h1 className="text-6xl md:text-7xl font-black tracking-tight leading-none mb-6">
                    Help us build the <br />
                    <span className="bg-gradient-to-r from-indigo-400 to-violet-400 bg-clip-text text-transparent">future of collaboration.</span>
                </h1>
                <p className="max-w-xl text-slate-400 text-lg md:text-xl font-medium leading-relaxed mb-10">
                    Join a team of visionaries and builders. We're looking for talented individuals who are passionate about scaling the next generation of enterprise tools.
                </p>
                <div className="w-full max-w-md h-[1px] bg-gradient-to-r from-transparent via-slate-700 to-transparent"></div>
            </section>

            {/* Job Board */}
            <main className="flex-grow px-10 pb-32 max-w-7xl mx-auto w-full">
                <div className="flex items-center justify-between mb-12">
                    <h2 className="text-3xl font-bold text-slate-200">Open Positions</h2>
                    <div className="flex space-x-2">
                        <span className="text-slate-500 text-sm font-bold">{circulars.length} Positions available</span>
                    </div>
                </div>

                {loading ? (
                    <div className="flex justify-center p-20">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div>
                    </div>
                ) : circulars.length === 0 ? (
                    <div className="p-32 text-center bg-slate-800/20 border-2 border-dashed border-slate-700 rounded-3xl">
                        <p className="text-slate-500 text-lg font-medium">No open positions at the moment.</p>
                        <p className="text-slate-600 mt-2">Check back later or follow us for updates!</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 gap-4">
                        {circulars.map(circular => (
                            <Link
                                key={circular._id}
                                to={`/careers/${circular._id}`}
                                className="group p-8 bg-slate-800/40 border border-slate-700/50 hover:border-indigo-500/40 hover:bg-slate-800/60 rounded-3xl transition-all duration-300 flex flex-col md:flex-row md:items-center justify-between shadow-2xl shadow-black/20"
                            >
                                <div className="flex-grow">
                                    <div className="flex items-center space-x-3 mb-3">
                                        <span className="px-2 py-0.5 bg-indigo-500/10 text-indigo-400 text-[10px] font-bold uppercase tracking-widest rounded border border-indigo-400/20">
                                            {circular.role}
                                        </span>
                                        <span className="text-slate-600 text-[10px] font-bold uppercase tracking-widest">• Full-Time</span>
                                    </div>
                                    <h3 className="text-2xl font-bold text-slate-100 group-hover:text-indigo-400 transition-colors mb-2">{circular.title}</h3>
                                    <div className="flex flex-wrap gap-4 text-sm text-slate-500 font-medium">
                                        <div className="flex items-center">
                                            <svg className="w-4 h-4 mr-1.5 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                            ${circular.salaryRange.min.toLocaleString()} - ${circular.salaryRange.max.toLocaleString()}
                                        </div>
                                        <div className="flex items-center border-l border-slate-700/50 pl-4">
                                            <svg className="w-4 h-4 mr-1.5 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                                            {circular.experience}+ Years
                                        </div>
                                        <div className="flex items-center border-l border-slate-700/50 pl-4">
                                            <svg className="w-4 h-4 mr-1.5 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                                            <span className="capitalize">{circular.jobNature}</span> {circular.location && `• ${circular.location}`}
                                        </div>
                                    </div>
                                </div>
                                <div className="mt-8 md:mt-0 flex items-center">
                                    <div className="hidden md:flex flex-wrap gap-2 mr-10 justify-end max-w-[300px]">
                                        {circular.mandatorySkills.slice(0, 3).map((s, i) => (
                                            <span key={i} className="px-3 py-1 bg-slate-900 border border-slate-700/50 rounded-lg text-xs font-bold text-slate-500 group-hover:text-indigo-400 group-hover:border-indigo-400/20 transition-all uppercase tracking-widest">{s}</span>
                                        ))}
                                    </div>
                                    <div className="h-14 w-14 bg-indigo-600 rounded-2xl flex items-center justify-center transform group-hover:rotate-12 transition-all shadow-xl shadow-indigo-600/20 overflow-hidden relative border border-indigo-400/50">
                                        <svg className="w-6 h-6 text-white stroke-[2.5]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
                                        <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                )}
            </main>

            {/* Footer */}
            <footer className="py-20 border-t border-white/5 bg-slate-950 px-10">
                <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center text-slate-500 text-sm">
                    <div className="mb-8 md:mb-0">
                        © 2026 Offtix Inc. All rights reserved.
                    </div>
                    <div className="flex space-x-10 font-bold uppercase tracking-widest text-[10px]">
                        <a href="#" className="hover:text-white transition-colors">Privacy</a>
                        <a href="#" className="hover:text-white transition-colors">Terms</a>
                        <a href="#" className="hover:text-white transition-colors">Twitter</a>
                        <a href="#" className="hover:text-white transition-colors">LinkedIn</a>
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default PublicCareers;
