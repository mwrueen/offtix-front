import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import UnifiedHeader from '../layout/UnifiedHeader';
import { getAssetUrl } from '../../services/api';

const PublicCareers = () => {
    const { state: authState } = useAuth();
    const { isAuthenticated, user } = authState || {};
    const [circulars, setCirculars] = useState([]);
    const [filteredCirculars, setFilteredCirculars] = useState([]);
    const [loading, setLoading] = useState(true);

    // Filter and Search States
    const [searchTerm, setSearchTerm] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [locationSearch, setLocationSearch] = useState('');
    const [filterNature, setFilterNature] = useState('all');
    const [minSalary, setMinSalary] = useState('');
    const [maxExperience, setMaxExperience] = useState('');
    const [sortBy, setSortBy] = useState('newest');
    const [showMobileFilters, setShowMobileFilters] = useState(false);

    // Saved Jobs Local State
    const [savedJobIds, setSavedJobIds] = useState(() => {
        try {
            const local = localStorage.getItem('offtix_saved_jobs');
            return local ? JSON.parse(local) : [];
        } catch {
            return [];
        }
    });

    useEffect(() => {
        const fetchCirculars = async () => {
            try {
                const res = await axios.get('/api/recruitment/public/circulars');
                const raw = res.data;
                const data = Array.isArray(raw)
                    ? raw
                    : (Array.isArray(raw?.data) ? raw.data : (Array.isArray(raw?.circulars) ? raw.circulars : []));
                setCirculars(data);
                setFilteredCirculars(data);
            } catch (error) {
                console.error('Error fetching circulars:', error);
                setCirculars([]);
                setFilteredCirculars([]);
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
        const safeList = Array.isArray(circulars) ? circulars : [];
        let result = [...safeList];

        if (debouncedSearch) {
            const lowSearch = debouncedSearch.toLowerCase();
            result = result.filter(c =>
                c.title?.toLowerCase().includes(lowSearch) ||
                c.role?.toLowerCase().includes(lowSearch) ||
                c.mandatorySkills?.some(s => s.toLowerCase().includes(lowSearch)) ||
                c.niceToHaveSkills?.some(s => s.toLowerCase().includes(lowSearch)) ||
                c.description?.toLowerCase().includes(lowSearch)
            );
        }

        if (locationSearch) {
            const lowLoc = locationSearch.toLowerCase();
            result = result.filter(c => c.location?.toLowerCase().includes(lowLoc));
        }

        if (filterNature !== 'all') {
            result = result.filter(c => c.jobNature === filterNature);
        }

        if (minSalary) {
            result = result.filter(c => (c.salaryRange?.max || 0) >= Number(minSalary) || (c.salaryRange?.min || 0) >= Number(minSalary));
        }

        if (maxExperience) {
            result = result.filter(c => (c.experience || 0) <= Number(maxExperience));
        }

        // Sorting
        if (sortBy === 'salary-high') {
            result.sort((a, b) => (b.salaryRange?.max || 0) - (a.salaryRange?.max || 0));
        } else if (sortBy === 'experience-low') {
            result.sort((a, b) => (a.experience || 0) - (b.experience || 0));
        } else {
            // Newest first default
            result.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
        }

        setFilteredCirculars(result);
    }, [debouncedSearch, locationSearch, filterNature, minSalary, maxExperience, sortBy, circulars]);

    const natureCounts = useMemo(() => {
        const safeList = Array.isArray(circulars) ? circulars : [];
        const counts = { all: safeList.length, 'on-site': 0, remote: 0, hybrid: 0 };
        safeList.forEach(c => {
            const nat = (c.jobNature || '').toLowerCase();
            if (counts[nat] !== undefined) {
                counts[nat]++;
            }
        });
        return counts;
    }, [circulars]);

    const topSkills = useMemo(() => {
        const safeList = Array.isArray(circulars) ? circulars : [];
        const counts = {};
        safeList.forEach(c => {
            [...(c.mandatorySkills || []), ...(c.niceToHaveSkills || [])].forEach(s => {
                if (s && typeof s === 'string') {
                    const normalized = s.trim();
                    counts[normalized] = (counts[normalized] || 0) + 1;
                }
            });
        });
        return Object.entries(counts)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 8);
    }, [circulars]);

    const metrics = useMemo(() => {
        const safeList = Array.isArray(circulars) ? circulars : [];
        if (!safeList.length) return { remotePct: 0, avgExp: 0, maxSalary: 0 };
        const remoteCount = safeList.filter(c => c.jobNature === 'remote' || c.jobNature === 'hybrid').length;
        const remotePct = Math.round((remoteCount / safeList.length) * 100);
        const totalExp = safeList.reduce((acc, c) => acc + (Number(c.experience) || 0), 0);
        const avgExp = (totalExp / safeList.length).toFixed(1);
        const maxSalary = Math.max(...safeList.map(c => c.salaryRange?.max || 0));
        return { remotePct, avgExp, maxSalary };
    }, [circulars]);

    const recommendedJobs = useMemo(() => {
        const safeList = Array.isArray(circulars) ? circulars : [];
        if (!safeList.length) return [];
        return [...safeList]
            .sort((a, b) => (b.salaryRange?.max || 0) - (a.salaryRange?.max || 0))
            .slice(0, 3);
    }, [circulars]);

    const toggleSaveJob = (e, jobId) => {
        e.preventDefault();
        e.stopPropagation();
        setSavedJobIds(prev => {
            const updated = prev.includes(jobId) ? prev.filter(id => id !== jobId) : [...prev, jobId];
            try { localStorage.setItem('offtix_saved_jobs', JSON.stringify(updated)); } catch {}
            return updated;
        });
    };

    const handleResetFilters = () => {
        setSearchTerm('');
        setLocationSearch('');
        setFilterNature('all');
        setMinSalary('');
        setMaxExperience('');
        setSortBy('newest');
    };

    const hasActiveFilters = Boolean(
        searchTerm || locationSearch || filterNature !== 'all' || minSalary || maxExperience || sortBy !== 'newest'
    );

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

    const stripHtml = (html) => {
        if (!html) return '';
        return html
            .replace(/></g, '> <')
            .replace(/<[^>]*>?/gm, '')
            .replace(/\s+/g, ' ')
            .trim();
    };

    const getLogoUrl = getAssetUrl;

    return (
        <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col selection:bg-indigo-50 font-sans">
            <UnifiedHeader />

            {/* Container aligned with consistent pt-24 (96px) to match fixed header height */}
            <div className="pt-24 pb-20 max-w-7xl mx-auto w-full px-4 lg:px-8 grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">

                {/* Left Sidebar: Filters */}
                <aside className={`lg:col-span-3 sticky top-24 space-y-4 ${showMobileFilters ? 'block' : 'hidden lg:block'}`}>
                    
                    {/* Filter Card Header */}
                    <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                                <span>Filter Positions</span>
                            </h3>
                            {hasActiveFilters && (
                                <button
                                    onClick={handleResetFilters}
                                    className="text-[11px] font-bold text-indigo-600 hover:text-indigo-800 transition-colors"
                                >
                                    Reset All
                                </button>
                            )}
                        </div>

                        {/* Workplace Nature Filter */}
                        <div className="space-y-1">
                            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
                                Workplace Nature
                            </label>
                            {[
                                { key: 'all', label: 'All Types', icon: '🌐' },
                                { key: 'remote', label: 'Remote', icon: '🏠' },
                                { key: 'hybrid', label: 'Hybrid', icon: '🔀' },
                                { key: 'on-site', label: 'On-site', icon: '🏢' }
                            ].map(({ key, label, icon }) => {
                                const isSelected = filterNature === key;
                                const count = natureCounts[key] || 0;
                                return (
                                    <button
                                        key={key}
                                        onClick={() => setFilterNature(key)}
                                        className={`w-full text-left px-3 py-2 rounded-lg text-xs font-semibold transition-all flex items-center justify-between ${
                                            isSelected
                                                ? 'bg-indigo-50 text-indigo-700 ring-1 ring-indigo-200'
                                                : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                                        }`}
                                    >
                                        <div className="flex items-center gap-2">
                                            <span>{icon}</span>
                                            <span>{label}</span>
                                        </div>
                                        <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                                            isSelected ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-500'
                                        }`}>
                                            {count}
                                        </span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Salary Filter Card */}
                    <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
                        <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-3">
                            Min Expected Salary
                        </h3>
                        <div className="relative mb-3">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs">$</span>
                            <input
                                type="number"
                                placeholder="e.g. 60000"
                                value={minSalary}
                                onChange={(e) => setMinSalary(e.target.value)}
                                className="w-full bg-slate-50 border border-slate-200 p-2.5 pl-7 rounded-lg text-xs font-semibold text-slate-900 focus:ring-2 focus:ring-indigo-100 outline-none transition-all"
                            />
                        </div>
                        {/* Quick Presets */}
                        <div className="flex flex-wrap gap-1.5">
                            {['30000', '60000', '90000', '120000'].map((preset) => (
                                <button
                                    key={preset}
                                    onClick={() => setMinSalary(minSalary === preset ? '' : preset)}
                                    className={`text-[10px] font-bold px-2 py-1 rounded border transition-colors ${
                                        minSalary === preset
                                            ? 'bg-indigo-600 text-white border-indigo-600'
                                            : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                                    }`}
                                >
                                    ${(Number(preset)/1000)}k+
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Experience Filter Card */}
                    <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
                        <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-3">
                            Max Required Experience
                        </h3>
                        <div className="relative mb-3">
                            <input
                                type="number"
                                placeholder="e.g. 3 years"
                                value={maxExperience}
                                onChange={(e) => setMaxExperience(e.target.value)}
                                className="w-full bg-slate-50 border border-slate-200 p-2.5 rounded-lg text-xs font-semibold text-slate-900 focus:ring-2 focus:ring-indigo-100 outline-none transition-all"
                            />
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                            {[
                                { exp: '1', label: 'Entry (≤1yr)' },
                                { exp: '3', label: 'Mid (≤3yrs)' },
                                { exp: '5', label: 'Senior (≤5yrs)' }
                            ].map(({ exp, label }) => (
                                <button
                                    key={exp}
                                    onClick={() => setMaxExperience(maxExperience === exp ? '' : exp)}
                                    className={`text-[10px] font-bold px-2 py-1 rounded border transition-colors ${
                                        maxExperience === exp
                                            ? 'bg-indigo-600 text-white border-indigo-600'
                                            : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                                    }`}
                                >
                                    {label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Offtix Career Pro Banner */}
                    <div className="bg-slate-900 text-white rounded-xl p-5 shadow-lg relative overflow-hidden group">
                        <div className="absolute -right-8 -bottom-8 w-32 h-32 bg-indigo-600/20 rounded-full blur-3xl group-hover:bg-indigo-600/40 transition-all"></div>
                        <h3 className="text-sm font-bold leading-snug relative z-10">Expand your career with Offtix.</h3>
                        <p className="text-slate-400 text-xs mt-1.5 relative z-10 leading-relaxed">
                            Direct recruiter matches & instant job alert notifications.
                        </p>
                        <Link
                            to="/signup"
                            className="mt-4 block w-full text-center py-2 bg-white text-slate-900 rounded-lg text-xs font-bold hover:bg-indigo-50 transition-all relative z-10 shadow-xs"
                        >
                            Get Matched
                        </Link>
                    </div>

                </aside>

                {/* Main Feed: Job Search & Feed */}
                <main className="lg:col-span-6 space-y-4">
                    
                    {/* Search & Sorting Controls Box */}
                    <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs space-y-3">
                        
                        {/* Search inputs row */}
                        <div className="flex flex-col sm:flex-row gap-2.5">
                            {/* Primary Keyword Search */}
                            <div className="flex-1 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 flex items-center gap-2 focus-within:bg-white focus-within:border-indigo-500 focus-within:ring-2 focus-within:ring-indigo-100 transition-all">
                                <span className="text-slate-400 text-xs">🔍</span>
                                <input
                                    type="text"
                                    placeholder="Search job title, skill, or keyword..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full bg-transparent border-none outline-none text-xs font-semibold text-slate-900 placeholder:text-slate-400"
                                />
                                {searchTerm && (
                                    <button onClick={() => setSearchTerm('')} className="text-slate-400 hover:text-slate-600 text-xs">✕</button>
                                )}
                            </div>

                            {/* Location Filter Input */}
                            <div className="w-full sm:w-44 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 flex items-center gap-2 focus-within:bg-white focus-within:border-indigo-500 focus-within:ring-2 focus-within:ring-indigo-100 transition-all">
                                <span className="text-slate-400 text-xs">📍</span>
                                <input
                                    type="text"
                                    placeholder="Location..."
                                    value={locationSearch}
                                    onChange={(e) => setLocationSearch(e.target.value)}
                                    className="w-full bg-transparent border-none outline-none text-xs font-semibold text-slate-900 placeholder:text-slate-400"
                                />
                                {locationSearch && (
                                    <button onClick={() => setLocationSearch('')} className="text-slate-400 hover:text-slate-600 text-xs">✕</button>
                                )}
                            </div>
                        </div>

                        {/* Filter Bar Sub-Header: Active count, Sort dropdown, Mobile filter button */}
                        <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
                            <div className="flex items-center gap-2 text-slate-500 font-semibold text-[11px]">
                                <span>Showing <strong className="text-slate-900">{filteredCirculars.length}</strong> {filteredCirculars.length === 1 ? 'position' : 'positions'}</span>
                                {hasActiveFilters && (
                                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-500"></span>
                                )}
                            </div>

                            <div className="flex items-center gap-3">
                                {/* Sort Dropdown */}
                                <div className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-500">
                                    <span>Sort:</span>
                                    <select
                                        value={sortBy}
                                        onChange={(e) => setSortBy(e.target.value)}
                                        className="bg-slate-50 border border-slate-200 text-slate-800 text-[11px] font-bold rounded-md px-2 py-1 outline-none focus:border-indigo-500 transition-colors cursor-pointer"
                                    >
                                        <option value="newest">Newest First</option>
                                        <option value="salary-high">Highest Salary</option>
                                        <option value="experience-low">Experience: Low to High</option>
                                    </select>
                                </div>

                                {/* Mobile Filter Toggle */}
                                <button
                                    onClick={() => setShowMobileFilters(!showMobileFilters)}
                                    className="lg:hidden text-xs font-bold text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded border border-indigo-100"
                                >
                                    {showMobileFilters ? 'Hide Filters' : 'Filters'}
                                </button>
                            </div>
                        </div>

                    </div>

                    {/* Feed Content */}
                    {loading ? (
                        /* Skeleton Loading Cards */
                        <div className="space-y-4">
                            {[1, 2, 3].map((n) => (
                                <div key={n} className="bg-white border border-slate-200 rounded-xl p-5 space-y-4 animate-pulse">
                                    <div className="flex gap-4 items-center">
                                        <div className="w-12 h-12 rounded bg-slate-200"></div>
                                        <div className="flex-1 space-y-2">
                                            <div className="h-4 bg-slate-200 rounded w-1/3"></div>
                                            <div className="h-3 bg-slate-100 rounded w-1/4"></div>
                                        </div>
                                    </div>
                                    <div className="h-3 bg-slate-100 rounded w-full"></div>
                                    <div className="h-3 bg-slate-100 rounded w-2/3"></div>
                                </div>
                            ))}
                        </div>
                    ) : filteredCirculars.length === 0 ? (
                        /* No Results State */
                        <div className="bg-white border border-slate-200 rounded-xl p-16 text-center space-y-4 shadow-xs">
                            <div className="w-16 h-16 bg-slate-50 rounded-full border border-slate-100 flex items-center justify-center mx-auto text-2xl">
                                🔎
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-slate-800">No Positions Match Your Criteria</h3>
                                <p className="text-slate-400 text-xs font-medium mt-1 max-w-sm mx-auto">
                                    Try clearing your keyword search or adjusting workplace filters to explore more opportunities.
                                </p>
                            </div>
                            {hasActiveFilters && (
                                <button
                                    onClick={handleResetFilters}
                                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-xs font-bold hover:bg-indigo-700 transition-all shadow-xs"
                                >
                                    Reset All Filters
                                </button>
                            )}
                        </div>
                    ) : (
                        /* Job Cards List */
                        filteredCirculars.map(circular => {
                            const isSaved = savedJobIds.includes(circular._id);
                            const cleanDesc = stripHtml(circular.description);

                            return (
                                <Link
                                    key={circular._id}
                                    to={`/careers/${circular._id}`}
                                    className="block bg-white border border-slate-200 rounded-xl p-5 hover:shadow-md hover:border-indigo-200 transition-all duration-200 group relative"
                                >
                                    <div className="flex gap-4 items-start">
                                        
                                        {/* Company Logo / Gradient Avatar */}
                                        <div className="w-12 h-12 rounded-lg border border-slate-200 flex-shrink-0 overflow-hidden bg-gradient-to-tr from-slate-50 to-slate-100 flex items-center justify-center shadow-2xs">
                                            {circular.company?.logo ? (
                                                <img src={getLogoUrl(circular.company.logo)} alt={circular.company.name} className="w-full h-full object-contain p-1" />
                                            ) : (
                                                <span className="text-lg font-bold text-slate-400 italic">
                                                    {circular.company?.name?.charAt(0) || 'O'}
                                                </span>
                                            )}
                                        </div>

                                        {/* Job Body */}
                                        <div className="flex-1 min-w-0">
                                            
                                            {/* Header Title & Bookmark Button */}
                                            <div className="flex justify-between items-start gap-2">
                                                <div>
                                                    <h3 className="text-base font-bold text-slate-900 group-hover:text-indigo-600 transition-colors line-clamp-1">
                                                        {circular.title}
                                                    </h3>
                                                    <div className="flex flex-wrap items-center gap-2 mt-1 text-xs text-slate-500 font-medium">
                                                        <span className="font-semibold text-slate-800">{circular.company?.name || 'Offtix Organization'}</span>
                                                        <span className="text-slate-300">•</span>
                                                        <span className="flex items-center gap-1">📍 {circular.location || 'Remote'}</span>
                                                        <span className="text-slate-300">•</span>
                                                        <span className="capitalize px-2 py-0.5 rounded bg-slate-100 text-slate-600 font-bold text-[10px]">
                                                            {circular.jobNature}
                                                        </span>
                                                    </div>
                                                </div>

                                                {/* Bookmark / Save Button */}
                                                <button
                                                    onClick={(e) => toggleSaveJob(e, circular._id)}
                                                    title={isSaved ? "Remove bookmark" : "Save job"}
                                                    className={`p-1.5 rounded-lg border transition-colors flex-shrink-0 ${
                                                        isSaved
                                                            ? 'bg-amber-50 text-amber-500 border-amber-200'
                                                            : 'bg-slate-50 text-slate-400 border-slate-200 hover:text-indigo-600 hover:bg-indigo-50'
                                                    }`}
                                                >
                                                    <svg className="w-4 h-4" fill={isSaved ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                                                    </svg>
                                                </button>
                                            </div>

                                            {/* Skill Pills & Compensation Badges */}
                                            <div className="flex flex-wrap items-center gap-2 mt-3">
                                                {circular.salaryRange?.max > 0 && (
                                                    <span className="text-[11px] font-bold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-100 flex items-center gap-1">
                                                        💰 {(() => {
                                                            const symbolMap = { USD: '$', BDT: '৳', EUR: '€', GBP: '£', CAD: 'CA$', AUD: 'A$' };
                                                            const symbol = symbolMap[circular.salaryRange.currency] || circular.salaryRange.currency || '$';
                                                            const periodMap = { yearly: '/ yr', monthly: '/ mo', hourly: '/ hr' };
                                                            const period = periodMap[circular.salaryRange.period] || '/ yr';
                                                            return `${symbol}${Number(circular.salaryRange.min || 0).toLocaleString()} – ${symbol}${Number(circular.salaryRange.max || 0).toLocaleString()} ${period}`;
                                                        })()}
                                                    </span>
                                                )}
                                                {circular.experience !== undefined && (
                                                    <span className="text-[11px] font-semibold text-slate-700 bg-slate-100 px-2.5 py-1 rounded-md border border-slate-200 flex items-center gap-1">
                                                        ⚡ {circular.experience} {circular.experience === 1 ? 'yr' : 'yrs'} exp
                                                    </span>
                                                )}
                                                {circular.mandatorySkills?.slice(0, 3).map((skill, i) => (
                                                    <span key={i} className="text-[11px] font-semibold text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-md border border-indigo-100">
                                                        #{skill}
                                                    </span>
                                                ))}
                                            </div>

                                            {/* Short Description Preview */}
                                            {cleanDesc && (
                                                <p className="mt-2.5 text-xs text-slate-600 line-clamp-2 leading-relaxed font-normal">
                                                    {cleanDesc}
                                                </p>
                                            )}

                                            {/* Footer metadata */}
                                            <div className="mt-3.5 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 font-medium">
                                                <span>Posted {getTimeAge(circular.createdAt)} • Actively Recruiting</span>
                                                <span className="text-indigo-600 font-bold group-hover:translate-x-1 transition-transform flex items-center gap-1">
                                                    View Role →
                                                </span>
                                            </div>

                                        </div>
                                    </div>
                                </Link>
                            );
                        })
                    )}
                </main>

                {/* Right Sidebar: Realistic & Dynamic Career Hub */}
                <aside className="lg:col-span-3 sticky top-24 space-y-4 hidden lg:block">

                    {/* 1. Candidate / User Quick Status Card */}
                    <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs hover:shadow-sm transition-shadow">
                        {isAuthenticated && user ? (
                            <div className="flex items-center gap-3.5">
                                <div className="w-11 h-11 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-600 text-white font-bold flex items-center justify-center text-sm shadow-xs flex-shrink-0">
                                    {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
                                </div>
                                <div className="min-w-0 flex-1">
                                    <h4 className="text-sm font-bold text-slate-900 truncate">{user.name || 'Candidate'}</h4>
                                    <p className="text-xs text-slate-500 truncate">{user.email || 'Open for opportunities'}</p>
                                    <div className="mt-1.5 flex items-center gap-1.5">
                                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                                        <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider">Actively Job Seeking</span>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div>
                                <div className="flex items-center gap-2.5 mb-2">
                                    <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-sm">
                                        🚀
                                    </div>
                                    <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Offtix Talent Hub</h4>
                                </div>
                                <p className="text-xs text-slate-500 leading-relaxed mb-3">
                                    Connect directly with top tech companies and fast-track your applications.
                                </p>
                                <div className="grid grid-cols-2 gap-2">
                                    <Link
                                        to="/signin"
                                        className="w-full text-center py-2 bg-indigo-600 text-white rounded-lg text-xs font-bold hover:bg-indigo-700 transition-colors shadow-xs"
                                    >
                                        Sign In
                                    </Link>
                                    <Link
                                        to="/signup"
                                        className="w-full text-center py-2 bg-slate-100 text-slate-700 rounded-lg text-xs font-bold hover:bg-slate-200 transition-colors"
                                    >
                                        Join Now
                                    </Link>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* 2. Recommended / Featured Openings */}
                    <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                                <span>Featured Openings</span>
                            </h3>
                            <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-bold border border-emerald-100">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                                Verified
                            </span>
                        </div>

                        {recommendedJobs.length > 0 ? (
                            <div className="space-y-3">
                                {recommendedJobs.map((job) => (
                                    <Link
                                        key={job._id}
                                        to={`/careers/${job._id}`}
                                        className="group block p-3 rounded-lg border border-slate-100 bg-slate-50/50 hover:bg-indigo-50/50 hover:border-indigo-200 transition-all duration-200"
                                    >
                                        <div className="flex items-start gap-3">
                                            <div className="w-9 h-9 rounded-md border border-slate-200 bg-white flex items-center justify-center flex-shrink-0 text-slate-700 font-bold text-xs overflow-hidden">
                                                {job.company?.logo ? (
                                                    <img src={getLogoUrl(job.company.logo)} alt={job.company.name} className="w-full h-full object-contain" />
                                                ) : (
                                                    <span>{job.company?.name?.charAt(0) || 'O'}</span>
                                                )}
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <h4 className="text-xs font-bold text-slate-900 group-hover:text-indigo-600 truncate transition-colors">
                                                    {job.title}
                                                </h4>
                                                <p className="text-[11px] text-slate-500 font-medium truncate mt-0.5">
                                                    {job.company?.name || 'Offtix Organization'} • {job.location || 'Remote'}
                                                </p>
                                                <div className="flex items-center gap-2 mt-1.5">
                                                    {job.salaryRange?.max > 0 && (
                                                        <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100">
                                                            {(() => {
                                                                const symbolMap = { USD: '$', BDT: '৳', EUR: '€', GBP: '£', CAD: 'CA$', AUD: 'A$' };
                                                                const symbol = symbolMap[job.salaryRange.currency] || job.salaryRange.currency || '$';
                                                                const periodMap = { yearly: '/yr', monthly: '/mo', hourly: '/hr' };
                                                                const period = periodMap[job.salaryRange.period] || '/yr';
                                                                const minVal = job.salaryRange.min >= 1000 ? `${(job.salaryRange.min / 1000).toFixed(0)}k` : job.salaryRange.min;
                                                                const maxVal = job.salaryRange.max >= 1000 ? `${(job.salaryRange.max / 1000).toFixed(0)}k` : job.salaryRange.max;
                                                                return `${symbol}${minVal} - ${symbol}${maxVal} ${period}`;
                                                            })()}
                                                        </span>
                                                    )}
                                                    <span className="text-[10px] font-semibold text-slate-400 capitalize">
                                                        {job.jobNature}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-6 text-slate-400 text-xs font-medium">
                                No featured positions available right now.
                            </div>
                        )}
                    </div>

                    {/* 3. In-Demand Skill Tags (Interactive Search Filter) */}
                    <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
                        <div className="flex items-center justify-between mb-3">
                            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                                Trending Skills
                            </h3>
                            {searchTerm && (
                                <button
                                    onClick={() => setSearchTerm('')}
                                    className="text-[10px] font-bold text-indigo-600 hover:text-indigo-800"
                                >
                                    Clear Filter
                                </button>
                            )}
                        </div>
                        <p className="text-[11px] text-slate-400 mb-3 font-medium">Click a skill to filter active roles:</p>
                        
                        <div className="flex flex-wrap gap-1.5">
                            {topSkills.length > 0 ? (
                                topSkills.map(([skill, count]) => {
                                    const isSelected = searchTerm.toLowerCase() === skill.toLowerCase();
                                    return (
                                        <button
                                            key={skill}
                                            onClick={() => setSearchTerm(isSelected ? '' : skill)}
                                            className={`text-[11px] font-semibold px-2.5 py-1 rounded-full transition-all flex items-center gap-1.5 border ${
                                                isSelected
                                                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                                                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-200'
                                            }`}
                                        >
                                            <span>#{skill}</span>
                                            <span className={`text-[9px] px-1.5 py-0.2 rounded-full font-bold ${
                                                isSelected ? 'bg-indigo-700 text-indigo-100' : 'bg-slate-200 text-slate-600'
                                            }`}>
                                                {count}
                                            </span>
                                        </button>
                                    );
                                })
                            ) : (
                                ['React', 'Node.js', 'Python', 'TypeScript', 'Tailwind', 'UI/UX', 'DevOps'].map((skill) => (
                                    <button
                                        key={skill}
                                        onClick={() => setSearchTerm(searchTerm === skill ? '' : skill)}
                                        className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-slate-50 text-slate-600 border border-slate-200 hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-200 transition-colors"
                                    >
                                        #{skill}
                                    </button>
                                ))
                            )}
                        </div>
                    </div>

                    {/* 4. Live Market Metrics & Insights */}
                    <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
                        <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-4 flex items-center gap-2">
                            <span>Market Insights</span>
                            <span className="text-[10px] font-normal text-slate-400 normal-case">(Live)</span>
                        </h4>
                        
                        <div className="grid grid-cols-2 gap-3">
                            <div className="p-3 bg-slate-50 rounded-lg border border-slate-100 text-center">
                                <span className="text-lg font-bold text-slate-900">{(Array.isArray(circulars) ? circulars : []).length}</span>
                                <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-0.5">Active Roles</span>
                            </div>
                            <div className="p-3 bg-indigo-50/60 rounded-lg border border-indigo-100 text-center">
                                <span className="text-lg font-bold text-indigo-700">{metrics.remotePct}%</span>
                                <span className="block text-[10px] font-bold text-indigo-600 uppercase tracking-wider mt-0.5">Remote / Hybrid</span>
                            </div>
                            <div className="p-3 bg-emerald-50/60 rounded-lg border border-emerald-100 text-center col-span-2">
                                <div className="flex items-center justify-between text-xs font-bold text-emerald-800 px-1">
                                    <span>Peak Salary Range</span>
                                    <span>${metrics.maxSalary ? (metrics.maxSalary / 1000).toFixed(0) + 'k' : '150k'}/yr</span>
                                </div>
                                <div className="w-full bg-emerald-200 rounded-full h-1.5 mt-2 overflow-hidden">
                                    <div className="bg-emerald-600 h-1.5 rounded-full" style={{ width: '80%' }}></div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* 5. Footer links */}
                    <div className="px-3 pt-2 flex flex-wrap gap-x-3 gap-y-1.5 opacity-60">
                        {['About', 'Accessibility', 'Help Center', 'Privacy & Terms', 'Ad Choices'].map(item => (
                            <button key={item} className="text-[10px] font-semibold text-slate-500 hover:text-indigo-600 transition-colors tracking-wide">
                                {item}
                            </button>
                        ))}
                        <p className="w-full text-[10px] font-medium text-slate-400 mt-2">© 2026 Offtix Inc. All rights reserved.</p>
                    </div>

                </aside>

            </div>

            {/* Simple Footer Bar */}
            <footer className="py-12 border-t border-slate-200 bg-white px-10">
                <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center text-slate-400 text-[10px] font-bold uppercase tracking-widest">
                    <div className="mb-4 md:mb-0 opacity-50">© 2026 Offtix Organization</div>
                    <div className="flex space-x-8">
                        <a href="#privacy" className="hover:text-indigo-600 transition-colors">Privacy Policy</a>
                        <a href="#terms" className="hover:text-indigo-600 transition-colors">Terms of Service</a>
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default PublicCareers;
