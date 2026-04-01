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
                <aside className="lg:col-span-3 sticky top-32 space-y-4 hidden lg:block">
                    <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
                        <h3 className="text-xs font-bold text-slate-800 mb-4">Workplace nature</h3>
                        <div className="space-y-px">
                            {['all', 'on-site', 'remote', 'hybrid'].map((nature) => (
                                <button
                                    key={nature}
                                    onClick={() => setFilterNature(nature)}
                                    className={`w-full text-left px-3 py-2 rounded-lg text-sm font-semibold transition-all flex items-center justify-between group ${filterNature === nature ? 'bg-indigo-50 text-indigo-700 ring-1 ring-indigo-200' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'}`}
                                >
                                    <span className="capitalize">{nature}</span>
                                    {filterNature === nature && <div className="w-1.5 h-1.5 rounded-full bg-indigo-600 shadow-[0_0_8px_rgba(79,70,229,0.6)]"></div>}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="bg-slate-900 text-white rounded-xl p-6 shadow-xl relative overflow-hidden group">
                        <div className="absolute -right-8 -bottom-8 w-32 h-32 bg-indigo-600/20 rounded-full blur-3xl group-hover:bg-indigo-600/40 transition-all"></div>
                        <h3 className="text-lg font-bold leading-tight relative z-10">Expand your career with Offtix.</h3>
                        <p className="text-slate-400 text-xs mt-2 relative z-10 font-medium">Get matched with roles that fit your expertise.</p>
                        <button className="mt-6 w-full py-2.5 bg-white text-slate-900 rounded-full text-xs font-bold hover:bg-indigo-50 transition-all relative z-10 active:scale-95 shadow-lg shadow-black/20">Explore Hub</button>
                    </div>
                </aside>

                {/* Main Feed: Jobs */}
                <main className="lg:col-span-6 space-y-4">
                    {/* Feed Header/Search */}
                    <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-sm flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 border border-slate-100 italic transition-all group-hover:border-indigo-200 group-hover:text-indigo-600">
                            🔍
                        </div>
                        <input
                            type="text"
                            placeholder="Search opportunities (e.g. Designer, London)"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="flex-1 bg-transparent border-none text-sm font-semibold text-slate-900 placeholder:text-slate-400 focus:ring-0"
                        />
                    </div>

                    {loading ? (
                        <div className="bg-white border border-slate-200 rounded-2xl p-32 flex flex-col items-center justify-center gap-6">
                            <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-300">Synchronizing Global Feed...</p>
                        </div>
                    ) : filteredCirculars.length === 0 ? (
                        <div className="bg-white border border-slate-200 rounded-2xl p-32 text-center space-y-4">
                            <div className="text-6xl grayscale opacity-20 mb-8 select-none">📂</div>
                            <p className="text-3xl font-bold text-slate-800 tracking-tight">No Results Found</p>
                            <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mt-2 px-20 text-center">We couldn't find any positions matching your search criteria.</p>
                        </div>
                    ) : (
                        filteredCirculars.map(circular => (
                            <Link
                                key={circular._id}
                                to={`/careers/${circular._id}`}
                                className="block bg-white border border-slate-200 rounded-2xl p-6 hover:shadow-lg transition-all duration-300 group mb-4"
                            >
                                <div className="flex gap-4">
                                    {/* Company Logo */}
                                    <div className="w-14 h-14 rounded border border-slate-100 flex-shrink-0 overflow-hidden bg-slate-50 flex items-center justify-center">
                                        {circular.company?.logo ? (
                                            <img src={getLogoUrl(circular.company.logo)} alt={circular.company.name} className="w-full h-full object-contain" />
                                        ) : (
                                            <span className="text-xl font-bold text-slate-300 italic">{circular.company?.name?.charAt(0) || 'O'}</span>
                                        )}
                                    </div>

                                    {/* Job Content */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <h3 className="text-lg font-bold text-indigo-600 hover:underline decoration-2 underline-offset-4 line-clamp-1">
                                                    {circular.title}
                                                </h3>
                                                <div className="mt-1">
                                                    <p className="text-sm font-medium text-slate-900">{circular.company?.name || 'Offtix Organization'}</p>
                                                    <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium mt-0.5">
                                                        <span>{circular.location || 'Remote'}</span>
                                                        <span className="text-slate-300">•</span>
                                                        <span className="capitalize">{circular.jobNature}</span>
                                                    </div>
                                                </div>
                                            </div>
                                            <button className="text-slate-400 hover:text-indigo-600 p-1 rounded-full hover:bg-slate-50 transition-colors">
                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" /></svg>
                                            </button>
                                        </div>

                                        {/* Tags/Skills integrated like LinkedIn */}
                                        <div className="flex flex-wrap gap-2 mt-3">
                                            {circular.mandatorySkills.slice(0, 3).map((s, i) => (
                                                <span key={i} className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-100 italic">#{s.replace(/\s+/g, '')}</span>
                                            ))}
                                            <span className="text-[11px] font-bold text-amber-700 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-100">
                                                💰 ${circular.salaryRange.min.toLocaleString()} - ${circular.salaryRange.max.toLocaleString()}
                                            </span>
                                        </div>

                                        {/* Description Snippets (optional like LinkedIn) */}
                                        <div
                                            dangerouslySetInnerHTML={{ __html: circular.description }}
                                            className="mt-3 text-sm text-slate-600 line-clamp-2 leading-relaxed opacity-70"
                                        />

                                        <div className="mt-4 flex items-center gap-3">
                                            <div className="flex -space-x-1">
                                                <div className="w-6 h-6 rounded-full border border-white bg-slate-200"></div>
                                                <div className="w-6 h-6 rounded-full border border-white bg-slate-300"></div>
                                            </div>
                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                                {getTimeAge(circular.createdAt)} • Activly recruiting
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </Link>
                        ))
                    )}
                </main>

                {/* Right Sidebar: Trends/Activity */}
                <aside className="lg:col-span-3 sticky top-32 space-y-4 hidden lg:block">
                    <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
                        <h3 className="text-sm font-bold text-slate-800 mb-4 flex items-center justify-between">
                            Recommended for you
                            <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse"></span>
                        </h3>
                        <div className="space-y-4">
                            {[
                                { title: 'Product Strategist', match: '98% match' },
                                { title: 'Lead Architect', match: '94% match' },
                                { title: 'Node Engineer', match: '91% match' }
                            ].map((job, i) => (
                                <div key={i} className="group cursor-pointer">
                                    <p className="text-[13px] font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">{job.title}</p>
                                    <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest mt-0.5">{job.match}</p>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
                        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-6">Job seeker guidance</h4>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="p-4 bg-slate-50 rounded-lg border border-slate-100 flex flex-col items-center text-center">
                                <span className="text-sm font-bold text-slate-800">{circulars.length}</span>
                                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">Active Roles</span>
                            </div>
                            <div className="p-4 bg-emerald-50 rounded-lg border border-emerald-100 flex flex-col items-center text-center">
                                <span className="text-sm font-bold text-emerald-700">12</span>
                                <span className="text-[9px] font-bold text-emerald-600 uppercase tracking-widest mt-1">Placements</span>
                            </div>
                        </div>
                    </div>

                    <div className="px-6 flex flex-wrap gap-x-4 gap-y-2 opacity-50">
                        {['About', 'Accessibility', 'Help Center', 'Privacy & Terms', 'Ad Choices'].map(item => (
                            <button key={item} className="text-[10px] font-bold text-slate-400 hover:text-indigo-600 transition-colors uppercase tracking-widest">
                                {item}
                            </button>
                        ))}
                    </div>
                </aside>

            </div>

            {/* Simple Footer Bar */}
            <footer className="py-12 border-t border-slate-200 bg-white px-10">
                <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center text-slate-400 text-[10px] font-bold uppercase tracking-widest">
                    <div className="mb-4 md:mb-0 opacity-50">© 2026 Offtix Organization</div>
                    <div className="flex space-x-8">
                        <a href="#" className="hover:text-indigo-600 transition-colors">Privacy Policy</a>
                        <a href="#" className="hover:text-indigo-600 transition-colors">Terms of Service</a>
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default PublicCareers;
