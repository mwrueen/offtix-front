import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import UnifiedHeader from '../layout/UnifiedHeader';

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
        <div className="min-h-screen bg-white text-slate-800 flex flex-col font-sans selection:bg-indigo-50">
            <UnifiedHeader />

            {/* Hero Section */}
            <section className="pt-40 pb-24 px-10 max-w-7xl mx-auto flex flex-col items-center text-center">
                <span className="inline-block px-3 py-1 bg-indigo-50 text-indigo-600 border border-indigo-100 rounded-full text-[10px] font-black uppercase tracking-[0.2em] mb-6">Join the workforce</span>
                <h1 className="text-6xl md:text-7xl font-black tracking-tight text-slate-950 leading-none mb-6">
                    Help us build the <br />
                    <span className="text-indigo-600">future of collaboration.</span>
                </h1>
                <p className="max-w-xl text-slate-500 text-lg md:text-xl font-medium leading-relaxed mb-10">
                    Join a team of visionaries and builders. We're looking for talented individuals who are passionate about scaling the next generation of enterprise tools.
                </p>
                <div className="w-32 h-1 bg-indigo-600 rounded-full"></div>
            </section>

            {/* Job Board */}
            <main className="flex-grow px-10 pb-32 max-w-5xl mx-auto w-full">
                <div className="flex items-center justify-between mb-12 border-b border-slate-100 pb-8">
                    <div>
                        <h2 className="text-3xl font-black text-slate-900 tracking-tight">Open Positions</h2>
                        <p className="text-slate-400 text-xs font-bold mt-1 uppercase tracking-widest">Available Opportunities ({circulars.length})</p>
                    </div>
                </div>

                {loading ? (
                    <div className="flex justify-center p-20">
                        <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                    </div>
                ) : circulars.length === 0 ? (
                    <div className="p-32 text-center bg-slate-50 border-2 border-dashed border-slate-200 rounded-[2.5rem]">
                        <p className="text-slate-400 text-lg font-bold italic">No open positions at the moment.</p>
                        <p className="text-slate-400 text-xs font-black uppercase tracking-widest mt-2">Check back later for updates</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 gap-6">
                        {circulars.map(circular => (
                            <Link
                                key={circular._id}
                                to={`/careers/${circular._id}`}
                                className="group p-10 bg-white border border-slate-200 hover:border-indigo-600 hover:shadow-2xl hover:shadow-indigo-100/50 rounded-[2.5rem] transition-all duration-500 flex flex-col md:flex-row md:items-center justify-between relative overflow-hidden"
                            >
                                <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50 rounded-full blur-3xl -mr-16 -mt-16 opacity-0 group-hover:opacity-100 transition-opacity" />

                                <div className="relative z-10 flex-grow">
                                    <div className="flex items-center gap-3 mb-4">
                                        <span className="px-3 py-1 bg-indigo-50 text-indigo-600 text-[10px] font-black uppercase tracking-widest rounded-lg border border-indigo-100">
                                            {circular.role}
                                        </span>
                                        <span className="text-slate-300 text-[9px] font-black uppercase tracking-[0.2em]">• Full-Time</span>
                                    </div>
                                    <h3 className="text-3xl font-black text-slate-900 group-hover:text-indigo-600 transition-colors mb-4 tracking-tight">{circular.title}</h3>
                                    <div className="flex flex-wrap gap-8 text-[11px] text-slate-400 font-black uppercase tracking-widest">
                                        <div className="flex items-center gap-2">
                                            <span className="text-lg">💰</span>
                                            ${circular.salaryRange.min.toLocaleString()} - ${circular.salaryRange.max.toLocaleString()}
                                        </div>
                                        <div className="flex items-center gap-2 border-l border-slate-100 pl-8">
                                            <span className="text-lg">⏳</span>
                                            {circular.experience}+ Years
                                        </div>
                                        <div className="flex items-center gap-2 border-l border-slate-100 pl-8">
                                            <span className="text-lg">📍</span>
                                            <span className="capitalize">{circular.jobNature}</span> {circular.location && `• ${circular.location}`}
                                        </div>
                                    </div>
                                </div>
                                <div className="relative z-10 mt-8 md:mt-0 flex items-center gap-6">
                                    <div className="hidden lg:flex flex-wrap gap-2 justify-end max-w-[300px]">
                                        {circular.mandatorySkills.slice(0, 3).map((s, i) => (
                                            <span key={i} className="px-3 py-1.5 bg-slate-50 border border-slate-100 rounded-xl text-[9px] font-black text-slate-400 group-hover:text-indigo-600 group-hover:border-indigo-600/30 transition-all uppercase tracking-widest">{s}</span>
                                        ))}
                                    </div>
                                    <div className="h-16 w-16 bg-slate-900 rounded-[1.5rem] flex items-center justify-center group-hover:bg-indigo-600 group-hover:rotate-12 transition-all shadow-xl shadow-slate-200">
                                        <svg className="w-6 h-6 text-white stroke-[3]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                )}
            </main>

            {/* Footer */}
            <footer className="py-20 border-t border-slate-100 bg-white px-10">
                <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center text-slate-400 text-[10px] font-black uppercase tracking-widest">
                    <div className="mb-8 md:mb-0">
                        © 2026 Offtix Analytics. All rights reserved.
                    </div>
                    <div className="flex space-x-10">
                        <a href="#" className="hover:text-indigo-600 transition-colors">Privacy Infrastructure</a>
                        <a href="#" className="hover:text-indigo-600 transition-colors">Service Terms</a>
                        <a href="#" className="hover:text-indigo-600 transition-colors">Protocol Updates</a>
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default PublicCareers;
