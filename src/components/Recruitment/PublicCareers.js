import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import UnifiedHeader from '../layout/UnifiedHeader';
import { BASE_SERVER_URL } from '../../services/api';

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

    const getLogoUrl = (path) => {
        if (!path) return null;
        if (path.startsWith('http')) return path;
        return `${BASE_SERVER_URL}${path.startsWith('/') ? '' : '/'}${path}`;
    };

    return (
        <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col selection:bg-indigo-50 font-sans">
            <UnifiedHeader />

            <div className="pt-28 pb-20 max-w-7xl mx-auto w-full px-4 lg:px-10 grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">

                {/* Left Sidebar: Filters */}
                <aside className="lg:col-span-3 sticky top-28 space-y-8 hidden lg:block">
                    <div className="bg-white border border-slate-200 rounded-2xl p-8 shadow-sm">
                        <h3 className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-6 px-1">Job Nature</h3>
                        <div className="space-y-1.5">
                            {['all', 'on-site', 'remote', 'hybrid'].map((nature) => (
                                <button
                                    key={nature}
                                    onClick={() => setFilterNature(nature)}
                                    className={`w-full text-left px-5 py-3 rounded-xl text-xs font-bold uppercase tracking-widest transition-all ${filterNature === nature
                                        ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-100'
                                        : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900 border border-transparent'
                                        }`}
                                >
                                    {nature}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="bg-slate-900 rounded-3xl p-10 text-white relative overflow-hidden group shadow-2xl">
                        <div className="relative z-10">
                            <h4 className="text-2xl font-bold leading-tight mb-6 tracking-tight">Expand your horizon with Offtix.</h4>
                            <button className="bg-indigo-600 text-white px-8 py-3.5 rounded-2xl text-[10px] font-bold uppercase tracking-widest hover:bg-indigo-500 transition-all shadow-xl active:scale-95">Career Hub</button>
                        </div>
                        <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/20 rounded-full blur-3xl -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-700" />
                    </div>
                </aside>

                {/* Main Feed: Jobs */}
                <main className="lg:col-span-6 space-y-8">
                    {/* Feed Header/Search */}
                    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-sm flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-lg shadow-inner border border-slate-700 cursor-pointer hover:bg-slate-700 transition-colors tracking-tighter">🔍</div>
                        <div className="flex-1 relative">
                            <input
                                type="text"
                                placeholder="Search for opportunities..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full bg-transparent border-none rounded-2xl py-3 px-1 text-sm font-bold text-white placeholder:text-slate-500 focus:ring-0 transition-all"
                            />
                        </div>
                    </div>

                    {loading ? (
                        <div className="bg-white border border-slate-200 rounded-[2.5rem] p-32 flex flex-col items-center justify-center gap-6">
                            <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-300">Synchronizing Global Feed...</p>
                        </div>
                    ) : filteredCirculars.length === 0 ? (
                        <div className="bg-white border border-slate-200 rounded-[2.5rem] p-32 text-center space-y-4">
                            <div className="text-6xl grayscale opacity-20 mb-8 select-none">📂</div>
                            <p className="text-3xl font-bold text-slate-800 tracking-tight">No Active Results</p>
                            <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mt-2 px-20">We couldn't find any circulars matching your current filter criteria.</p>
                        </div>
                    ) : (
                        filteredCirculars.map(circular => (
                            <Link
                                key={circular._id}
                                to={`/careers/${circular._id}`}
                                className="block bg-white border border-slate-200 rounded-[2.5rem] hover:border-indigo-200 hover:shadow-2xl hover:shadow-slate-200/50 transition-all duration-500 overflow-hidden group mb-8 active:scale-[0.99]"
                            >
                                {/* Card Header */}
                                <div className="p-10 border-b border-slate-50 flex items-center justify-between bg-slate-50/20">
                                    <div className="flex items-center gap-5">
                                        <div className="w-14 h-14 rounded-2xl bg-white border border-slate-100 flex items-center justify-center text-indigo-600 font-bold shadow-sm group-hover:scale-105 transition-all overflow-hidden relative">
                                            <div className="absolute inset-0 bg-indigo-50 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                            {circular.company?.logo ? (
                                                <img src={getLogoUrl(circular.company.logo)} alt={circular.company.name} className="w-full h-full object-cover relative z-10" />
                                            ) : (
                                                <span className="relative z-10 text-xl font-black italic">{circular.company?.name?.charAt(0) || 'O'}</span>
                                            )}
                                        </div>
                                        <div>
                                            <p className="text-[11px] font-bold uppercase text-slate-400 tracking-widest group-hover:text-indigo-600 transition-colors">
                                                {circular.company?.name || 'Offtix Organization'}
                                            </p>
                                            <p className="text-xs font-bold text-slate-400 mt-0.5">posted {getTimeAge(circular.createdAt)}</p>
                                        </div>
                                    </div>
                                    <div className="hidden sm:block">
                                        <div className="px-4 py-1.5 bg-white border border-slate-100 rounded-full text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                            {circular.location || 'Remote'}
                                        </div>
                                    </div>
                                </div>

                                {/* Card Content */}
                                <div className="p-10 pb-4">
                                    <div className="flex items-center gap-3 mb-6">
                                        <span className="px-3 py-1 bg-indigo-50 text-indigo-600 text-[9px] font-black uppercase tracking-widest rounded-lg border border-indigo-100 italic">
                                            {circular.role}
                                        </span>
                                        <span className="px-3 py-1 bg-slate-100 text-slate-600 text-[9px] font-black uppercase tracking-widest rounded-lg border border-slate-200 capitalize">
                                            {circular.jobNature}
                                        </span>
                                    </div>
                                    <h3 className="text-3xl font-bold text-slate-900 group-hover:text-indigo-600 transition-colors mb-4 tracking-tight leading-tight">{circular.title}</h3>

                                    {/* Job Responsibilities (2 lines) */}
                                    <p className="text-slate-500 text-sm font-medium leading-relaxed mb-8 line-clamp-2 mt-4">
                                        {circular.description}
                                    </p>

                                    <div className="flex flex-wrap gap-3 mt-4">
                                        {circular.mandatorySkills.slice(0, 4).map((s, i) => (
                                            <span key={i} className="px-4 py-2 bg-slate-50 border border-slate-100 rounded-xl text-[10px] font-bold text-slate-400 group-hover:text-indigo-600 group-hover:bg-indigo-50 group-hover:border-indigo-100 transition-all uppercase tracking-widest lowercase">#{s.replace(/\s+/g, '')}</span>
                                        ))}
                                    </div>
                                </div>

                                {/* Card Footer Interaction */}
                                <div className="p-10 pt-4 flex items-center justify-between border-t border-slate-50 mt-4 bg-slate-50/10">
                                    <div className="flex items-center gap-8">
                                        <div className="flex items-center gap-3 text-slate-400 group-hover:text-indigo-600 transition-colors">
                                            <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center text-xs shadow-inner">💰</div>
                                            <span className="text-[11px] font-bold uppercase tracking-widest leading-none">${circular.salaryRange.min.toLocaleString()} - ${circular.salaryRange.max.toLocaleString()}</span>
                                        </div>
                                        <div className="hidden sm:flex items-center gap-3 text-slate-400 group-hover:text-indigo-600 transition-colors">
                                            <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center text-xs shadow-inner">🎓</div>
                                            <span className="text-[11px] font-bold uppercase tracking-widest leading-none">Min {circular.experience}Yrs Exp</span>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <div className="h-14 px-10 bg-indigo-600 text-white rounded-[2rem] flex items-center justify-center text-[11px] font-bold uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-100 active:scale-95">Explore Role</div>
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
