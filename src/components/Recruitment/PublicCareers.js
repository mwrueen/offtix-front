import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import UnifiedHeader from '../layout/UnifiedHeader';

const PublicCareers = () => {
    const { state } = useAuth();
    const [circulars, setCirculars] = useState([]);
    const [filteredCirculars, setFilteredCirculars] = useState([]);
    const [loading, setLoading] = useState(true);

    const [searchTerm, setSearchTerm] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [filterNature, setFilterNature] = useState('all');

    useEffect(() => {
        const fetchCirculars = async () => {
            try {
                const res = await axios.get('/api/recruitment/public/circulars');
                setCirculars(res.data);
                setFilteredCirculars(res.data);
            } catch (error) {
                console.error('Error fetching circulars:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchCirculars();
    }, []);

    useEffect(() => {
        const timer = setTimeout(() => setDebouncedSearch(searchTerm), 300);
        return () => clearTimeout(timer);
    }, [searchTerm]);

    useEffect(() => {
        let result = circulars;
        if (debouncedSearch) {
            const lowSearch = debouncedSearch.toLowerCase();
            result = result.filter(c =>
                c.title.toLowerCase().includes(lowSearch) ||
                c.role.toLowerCase().includes(lowSearch) ||
                c.location?.toLowerCase().includes(lowSearch) ||
                c.mandatorySkills.some(s => s.toLowerCase().includes(lowSearch))
            );
        }
        if (filterNature !== 'all') {
            result = result.filter(c => c.jobNature === filterNature);
        }
        setFilteredCirculars(result);
    }, [debouncedSearch, filterNature, circulars]);

    const getTimeAge = (dateString) => {
        if (!dateString) return 'recently';
        const now = new Date();
        const past = new Date(dateString);
        const diffInMs = now - past;
        const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));

        if (diffInHours < 1) {
            const diffInMins = Math.floor(diffInMs / (1000 * 60));
            return `${diffInMins}m ago`;
        }
        if (diffInHours < 24) {
            return `${diffInHours}h ago`;
        }
        const diffInDays = Math.floor(diffInHours / 24);
        return `${diffInDays}d ago`;
    };

    return (
        <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col font-sans selection:bg-indigo-50">
            <UnifiedHeader />

            <div className="pt-24 pb-20 max-w-7xl mx-auto w-full px-4 lg:px-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

                {/* Left Sidebar: Filters */}
                <aside className="lg:col-span-3 sticky top-28 space-y-6 hidden lg:block">
                    <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
                        <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-6">Filter Protocol</h3>
                        <div className="space-y-2">
                            {['all', 'on-site', 'remote', 'hybrid'].map((nature) => (
                                <button
                                    key={nature}
                                    onClick={() => setFilterNature(nature)}
                                    className={`w-full text-left px-4 py-3 rounded-xl text-xs font-bold uppercase tracking-widest transition-all ${filterNature === nature
                                            ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100'
                                            : 'text-slate-500 hover:bg-slate-50'
                                        }`}
                                >
                                    {nature}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="bg-indigo-600 rounded-3xl p-8 text-white relative overflow-hidden group shadow-2xl shadow-indigo-200">
                        <div className="relative z-10">
                            <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-60 mb-2 text-indigo-100">Growth Protocol</p>
                            <h4 className="text-2xl font-black leading-tight mb-4 tracking-tighter">Ready to scale your career?</h4>
                            <button className="bg-white text-indigo-600 px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:scale-105 transition-transform shadow-xl">Join the Node</button>
                        </div>
                        <div className="absolute -bottom-10 -right-10 w-32 h-32 bg-white/10 rounded-full blur-2xl group-hover:scale-150 transition-transform" />
                    </div>
                </aside>

                {/* Main Feed: Jobs */}
                <main className="lg:col-span-6 space-y-6">
                    {/* Feed Header/Search */}
                    <div className="bg-white border border-slate-200 rounded-[2rem] p-4 shadow-sm flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-xl shadow-inner border border-slate-50 cursor-pointer hover:bg-slate-200 transition-colors">👤</div>
                        <div className="flex-1 relative">
                            <input
                                type="text"
                                placeholder="Search the mission feed..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full bg-slate-50 border-none rounded-2xl py-3 px-5 text-sm font-bold placeholder:text-slate-400 focus:ring-0 focus:bg-slate-100 transition-all"
                            />
                        </div>
                    </div>

                    {loading ? (
                        <div className="bg-white border border-slate-200 rounded-[2.5rem] p-20 flex flex-col items-center justify-center gap-6">
                            <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-300">Synchronizing Feed...</p>
                        </div>
                    ) : filteredCirculars.length === 0 ? (
                        <div className="bg-white border border-slate-200 rounded-[2.5rem] p-20 text-center space-y-4">
                            <p className="text-3xl font-black text-slate-200 tracking-tighter">End of Node</p>
                            <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">No matching mission parameters found.</p>
                        </div>
                    ) : (
                        filteredCirculars.map(circular => (
                            <Link
                                key={circular._id}
                                to={`/careers/${circular._id}`}
                                className="block bg-white border border-slate-200 rounded-[2.5rem] hover:border-indigo-600 hover:shadow-2xl hover:shadow-indigo-100/30 transition-all duration-500 overflow-hidden group mb-8"
                            >
                                {/* Card Header */}
                                <div className="p-8 border-b border-slate-50 flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-2xl bg-indigo-600 flex items-center justify-center text-white font-black italic shadow-lg shadow-indigo-600/20 transform -rotate-3 group-hover:rotate-0 transition-all overflow-hidden bg-center bg-cover">
                                            {circular.company?.logo ? (
                                                <img src={circular.company.logo} alt={circular.company.name} className="w-full h-full object-cover" />
                                            ) : (
                                                circular.company?.name?.charAt(0) || 'O'
                                            )}
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-black uppercase text-indigo-600 tracking-widest">
                                                {circular.company?.name || 'Offtix Protocol'}
                                            </p>
                                            <p className="text-xs font-bold text-slate-400 font-mono">posted {getTimeAge(circular.createdAt)}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <div className="hidden sm:flex -space-x-3 items-center">
                                            {[1, 2, 3].map(i => <div key={i} className="w-8 h-8 rounded-full border-2 border-white bg-slate-200 flex items-center justify-center text-[10px] font-bold">👤</div>)}
                                            <span className="pl-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Active applicants</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Card Content */}
                                <div className="p-8 pb-4">
                                    <div className="flex items-center gap-3 mb-4">
                                        <span className="px-3 py-1 bg-indigo-50 text-indigo-600 text-[10px] font-black uppercase tracking-widest rounded-lg border border-indigo-100">
                                            {circular.role}
                                        </span>
                                        <span className="px-3 py-1 bg-emerald-50 text-emerald-600 text-[10px] font-black uppercase tracking-widest rounded-lg border border-emerald-100 capitalize">
                                            {circular.jobNature}
                                        </span>
                                    </div>
                                    <h3 className="text-3xl font-black text-slate-900 group-hover:text-indigo-600 transition-colors mb-4 tracking-tight leading-tight">{circular.title}</h3>

                                    <div className="flex flex-wrap gap-4 mt-6">
                                        {circular.mandatorySkills.slice(0, 4).map((s, i) => (
                                            <span key={i} className="px-4 py-2 bg-slate-50 border border-slate-100 rounded-2xl text-[10px] font-black text-slate-400 group-hover:text-indigo-600 group-hover:border-indigo-600/30 transition-all uppercase tracking-widest lowercase">#{s.replace(/\s+/g, '')}</span>
                                        ))}
                                    </div>
                                </div>

                                {/* Card Footer Interaction */}
                                <div className="p-8 pt-4 flex items-center justify-between border-t border-slate-50 mt-4 bg-slate-50/30">
                                    <div className="flex items-center gap-6">
                                        <div className="flex items-center gap-2 text-slate-400 group-hover:text-indigo-600 transition-colors">
                                            <span className="text-lg">💰</span>
                                            <span className="text-[11px] font-black uppercase tracking-widest">${circular.salaryRange.min.toLocaleString()} - ${circular.salaryRange.max.toLocaleString()}</span>
                                        </div>
                                        <div className="hidden sm:flex items-center gap-2 text-slate-400">
                                            <span className="text-lg">📍</span>
                                            <span className="text-[11px] font-black uppercase tracking-widest">{circular.location || 'Global Protocol'}</span>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <div className="w-12 h-12 rounded-full border border-slate-100 bg-white flex items-center justify-center group-hover:scale-110 transition-transform shadow-sm">
                                            <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" /></svg>
                                        </div>
                                        <div className="h-12 px-6 bg-slate-900 text-white rounded-full flex items-center justify-center text-[10px] font-black uppercase tracking-widest group-hover:bg-indigo-600 transition-colors shadow-xl shadow-slate-200">View Node</div>
                                    </div>
                                </div>
                            </Link>
                        ))
                    )}
                </main>

                {/* Right Sidebar: Trends/Activity */}
                <aside className="lg:col-span-3 sticky top-28 space-y-6 hidden xl:block">
                    <div className="bg-white border border-slate-200 rounded-3xl p-8 shadow-sm">
                        <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-6">Trending Missions</h3>
                        <div className="space-y-6">
                            {[
                                { title: 'Lead Architect', count: '124 matches' },
                                { title: 'Product Strategist', count: '89 matches' },
                                { title: 'Node Engineer', count: '210 matches' }
                            ].map((trend, i) => (
                                <div key={i} className="group cursor-pointer">
                                    <p className="text-[11px] font-black text-slate-900 group-hover:text-indigo-600 transition-colors mb-1">{trend.title}</p>
                                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{trend.count}</p>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="bg-white border border-slate-200 rounded-3xl p-8 shadow-sm">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-xs font-black uppercase tracking-widest text-slate-400">Protocol Stats</h3>
                            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="p-4 bg-slate-50 rounded-2xl">
                                <p className="text-lg font-black tracking-tight text-slate-900 leading-none mb-1">{circulars.length}</p>
                                <p className="text-[8px] font-black uppercase text-slate-400 tracking-widest">Active nodes</p>
                            </div>
                            <div className="p-4 bg-slate-50 rounded-2xl">
                                <p className="text-lg font-black tracking-tight text-slate-900 leading-none mb-1">942</p>
                                <p className="text-[8px] font-black uppercase text-slate-400 tracking-widest">Sync events</p>
                            </div>
                        </div>
                    </div>
                </aside>

            </div>

            {/* Simple Footer Bar */}
            <footer className="py-12 border-t border-slate-200 bg-white px-10">
                <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center text-slate-400 text-[10px] font-black uppercase tracking-widest">
                    <div className="mb-4 md:mb-0 opacity-50">© 2026 Offtix Analytics Protocol</div>
                    <div className="flex space-x-8">
                        <a href="#" className="hover:text-indigo-600 transition-colors">Privacy Node</a>
                        <a href="#" className="hover:text-indigo-600 transition-colors">Terms of Protocol</a>
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default PublicCareers;
