import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import UnifiedHeader from '../layout/UnifiedHeader';
import { getAssetUrl } from '../../services/api';

const PublicCompanyDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();

    const [company, setCompany] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [activeTab, setActiveTab] = useState('overview');

    useEffect(() => {
        const fetchCompany = async () => {
            setLoading(true);
            setError('');
            try {
                const res = await axios.get(`/api/companies/public/${id}`);
                setCompany(res.data);
            } catch (err) {
                console.error('Error loading public company:', err);
                setError(err.response?.data?.message || 'Failed to load company details.');
            } finally {
                setLoading(false);
            }
        };

        if (id) {
            fetchCompany();
        }
    }, [id]);

    const formatCurrency = (val, currency = 'USD') => {
        const symbolMap = { USD: '$', BDT: '৳', EUR: '€', GBP: '£', CAD: 'CA$', AUD: 'A$' };
        const sym = symbolMap[currency] || '$';
        return `${sym}${Number(val || 0).toLocaleString()}`;
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-50/50 flex flex-col font-sans">
                <UnifiedHeader />
                <div className="flex-1 flex items-center justify-center pt-28 pb-16">
                    <div className="text-center space-y-4">
                        <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto" />
                        <p className="text-sm font-semibold text-slate-500">Loading verified company profile...</p>
                    </div>
                </div>
            </div>
        );
    }

    if (error || !company) {
        return (
            <div className="min-h-screen bg-slate-50/50 flex flex-col font-sans">
                <UnifiedHeader />
                <div className="flex-1 max-w-4xl mx-auto w-full px-4 pt-32 pb-16 text-center space-y-6">
                    <div className="w-16 h-16 bg-rose-100 text-rose-600 rounded-2xl flex items-center justify-center mx-auto text-2xl font-bold">
                        🏢
                    </div>
                    <h2 className="text-2xl font-bold text-slate-900">{error || 'Organization profile not found'}</h2>
                    <p className="text-sm text-slate-500 max-w-md mx-auto">
                        The requested company profile may have been updated, renamed, or is currently private.
                    </p>
                    <button
                        onClick={() => navigate('/')}
                        className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-sm transition-all"
                    >
                        Browse All Openings
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50/40 text-slate-800 font-sans pb-28">
            <UnifiedHeader />

            {/* Top Breadcrumb & Hero Section */}
            <div className="bg-slate-950 text-white pt-24 sm:pt-28 pb-16 sm:pb-20 relative overflow-hidden">
                {/* Background lighting & gradients */}
                <div className="absolute top-0 right-1/4 w-[500px] h-[500px] bg-indigo-600/15 rounded-full blur-3xl pointer-events-none" />
                <div className="absolute bottom-0 left-10 w-[400px] h-[400px] bg-violet-600/10 rounded-full blur-3xl pointer-events-none" />

                <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 relative z-10 space-y-8">
                    
                    {/* Company Profile Header Info */}
                    <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6 w-full md:w-auto">
                            {/* Logo */}
                            <div className="w-16 h-16 sm:w-24 sm:h-24 rounded-2xl bg-white border-2 border-slate-800 shadow-xl flex items-center justify-center overflow-hidden shrink-0">
                                {company.logo ? (
                                    <img src={getAssetUrl(company.logo)} alt={company.name} className="w-full h-full object-cover" />
                                ) : (
                                    <span className="text-2xl sm:text-4xl font-black text-indigo-600">
                                        {(company.name || 'C').charAt(0).toUpperCase()}
                                    </span>
                                )}
                            </div>

                            <div className="space-y-1.5 min-w-0 w-full">
                                <div className="flex items-center gap-2.5 flex-wrap">
                                    <h1 className="text-xl sm:text-3xl lg:text-4xl font-black text-white tracking-tight break-words">
                                        {company.name}
                                    </h1>
                                    <span className="px-2.5 py-0.5 sm:py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[11px] sm:text-xs font-bold flex items-center gap-1.5 backdrop-blur-md shrink-0">
                                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                                        Verified Employer
                                    </span>
                                </div>

                                <p className="text-xs sm:text-sm font-medium text-slate-300 flex flex-wrap items-center gap-2 sm:gap-3 leading-relaxed">
                                    <span className="flex items-center gap-1">
                                        <span className="text-indigo-400">🏢</span> {company.industry || 'Technology & Software'}
                                    </span>
                                    {company.foundedYear && (
                                        <span className="flex items-center gap-1">
                                            <span className="text-slate-500">•</span> Est. {company.foundedYear}
                                        </span>
                                    )}
                                    {(company.city || company.country) && (
                                        <span className="flex items-center gap-1">
                                            <span className="text-slate-500">•</span> 📍 {[company.city, company.state, company.country].filter(Boolean).join(', ')}
                                        </span>
                                    )}
                                </p>
                            </div>
                        </div>

                        {/* Quick Header Actions */}
                        <div className="flex items-center gap-2.5 flex-col sm:flex-row shrink-0 w-full md:w-auto">
                            {company.website && (
                                <a
                                    href={company.website.startsWith('http') ? company.website : `https://${company.website}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="w-full sm:w-auto px-5 py-2.5 sm:py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition-all shadow-lg flex items-center justify-center gap-2"
                                >
                                    <span>🌐 Visit Official Website</span>
                                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
                                </a>
                            )}
                            {company.email && (
                                <a
                                    href={`mailto:${company.email}`}
                                    className="w-full sm:w-auto px-4 py-2.5 sm:py-3 bg-slate-900 hover:bg-slate-800 text-slate-200 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 border border-slate-800"
                                >
                                    <span>✉️ Contact Email</span>
                                </a>
                            )}
                        </div>
                    </div>

                    {/* Key Performance Indicators Row */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4 pt-6 border-t border-slate-800/80">
                        <div className="bg-slate-900/80 backdrop-blur-md p-3.5 sm:p-5 rounded-2xl border border-slate-800 space-y-1">
                            <span className="text-[9px] sm:text-[10px] font-extrabold uppercase text-slate-400 tracking-wider">Total Workforce</span>
                            <div className="flex items-baseline gap-1.5">
                                <span className="text-xl sm:text-3xl font-black text-white">{company.totalEmployees}</span>
                                <span className="text-[11px] sm:text-xs font-semibold text-slate-400">Members</span>
                            </div>
                        </div>

                        <div className="bg-indigo-950/50 backdrop-blur-md p-3.5 sm:p-5 rounded-2xl border border-indigo-900/60 space-y-1">
                            <span className="text-[9px] sm:text-[10px] font-extrabold uppercase text-indigo-300 tracking-wider">Active Openings</span>
                            <div className="flex items-baseline gap-1.5">
                                <span className="text-xl sm:text-3xl font-black text-indigo-400">{company.activeJobsCount}</span>
                                <span className="text-[11px] sm:text-xs font-semibold text-indigo-300">Positions</span>
                            </div>
                        </div>

                        <div className="bg-emerald-950/40 backdrop-blur-md p-3.5 sm:p-5 rounded-2xl border border-emerald-900/60 space-y-1">
                            <span className="text-[9px] sm:text-[10px] font-extrabold uppercase text-emerald-400 tracking-wider">Successful Hires</span>
                            <div className="flex items-baseline gap-1.5">
                                <span className="text-xl sm:text-3xl font-black text-emerald-400">{company.hiredCount}</span>
                                <span className="text-[11px] sm:text-xs font-semibold text-emerald-300">Placed</span>
                            </div>
                        </div>

                        <div className="bg-amber-950/40 backdrop-blur-md p-3.5 sm:p-5 rounded-2xl border border-amber-900/60 space-y-1">
                            <span className="text-[9px] sm:text-[10px] font-extrabold uppercase text-amber-400 tracking-wider">Employer Rating</span>
                            <div className="flex items-center gap-1.5">
                                <span className="text-xl sm:text-3xl font-black text-amber-400">{company.rating}</span>
                                <div className="text-amber-400 text-[10px] sm:text-xs font-bold">
                                    ★ ★ ★ ★ ★
                                </div>
                            </div>
                        </div>
                    </div>

                </div>
            </div>

            {/* Main Content Area */}
            <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 -mt-6 relative z-20 space-y-6 sm:space-y-8">
                
                {/* Navigation Tabs Bar */}
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-1 sm:p-1.5 flex items-center gap-1.5 sm:gap-2 overflow-x-auto no-scrollbar">
                    <button
                        onClick={() => setActiveTab('overview')}
                        className={`px-4 sm:px-5 py-2.5 sm:py-3 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-2 ${
                            activeTab === 'overview'
                                ? 'bg-indigo-600 text-white shadow-sm'
                                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                        }`}
                    >
                        <span>🏢 Overview & Openings</span>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] ${activeTab === 'overview' ? 'bg-indigo-500 text-white' : 'bg-slate-100 text-slate-600'}`}>
                            {company.openCirculars?.length || 0}
                        </span>
                    </button>

                    <button
                        onClick={() => setActiveTab('holidays')}
                        className={`px-4 sm:px-5 py-2.5 sm:py-3 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-2 ${
                            activeTab === 'holidays'
                                ? 'bg-indigo-600 text-white shadow-sm'
                                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                        }`}
                    >
                        <span>🎉 Public Holidays</span>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] ${activeTab === 'holidays' ? 'bg-indigo-500 text-white' : 'bg-slate-100 text-slate-600'}`}>
                            {company.holidays?.length || 0}
                        </span>
                    </button>

                    <button
                        onClick={() => setActiveTab('location')}
                        className={`px-4 sm:px-5 py-2.5 sm:py-3 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-2 ${
                            activeTab === 'location'
                                ? 'bg-indigo-600 text-white shadow-sm'
                                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                        }`}
                    >
                        <span>📍 Office & Contact</span>
                    </button>
                </div>

                {/* ── Tab 1: Overview & Openings ── */}
                {activeTab === 'overview' && (
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 animate-in fade-in duration-300">
                        {/* Main Left Section */}
                        <div className="lg:col-span-8 space-y-6 sm:space-y-8">
                            
                            {/* About Section */}
                            <div className="bg-white p-4 sm:p-8 rounded-3xl border border-slate-200 shadow-xs space-y-4">
                                <h2 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-3">
                                    <div className="w-1.5 h-6 bg-indigo-600 rounded-full" />
                                    About {company.name}
                                </h2>
                                <div className="text-slate-600 leading-relaxed text-sm sm:text-base whitespace-pre-line space-y-4">
                                    {company.description}
                                </div>
                            </div>

                            {/* Active Open Positions */}
                            <div className="bg-white p-4 sm:p-8 rounded-3xl border border-slate-200 shadow-xs space-y-5 sm:space-y-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <h2 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-3">
                                            <div className="w-1.5 h-6 bg-indigo-600 rounded-full" />
                                            Active Career Opportunities
                                        </h2>
                                        <p className="text-xs text-slate-500 mt-1">Explore current job openings posted by {company.name}.</p>
                                    </div>
                                    <span className="px-3 py-1 bg-indigo-50 text-indigo-700 text-xs font-bold rounded-full border border-indigo-100 hidden sm:inline-block">
                                        {company.openCirculars?.length || 0} Open Positions
                                    </span>
                                </div>

                                {company.openCirculars && company.openCirculars.length > 0 ? (
                                    <div className="space-y-3 sm:space-y-4">
                                        {company.openCirculars.map((job) => (
                                            <div
                                                key={job._id}
                                                onClick={() => navigate(`/careers/${job._id}`)}
                                                className="p-4 sm:p-6 bg-slate-50/70 hover:bg-indigo-50/50 border border-slate-200/90 hover:border-indigo-300 rounded-2xl transition-all cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-4 group shadow-2xs hover:shadow-md"
                                            >
                                                <div className="space-y-2">
                                                    <div className="flex items-center gap-2 flex-wrap">
                                                        <span className="px-2.5 py-0.5 bg-indigo-100 text-indigo-700 text-[10px] font-extrabold rounded-md uppercase tracking-wider">
                                                            {job.role}
                                                        </span>
                                                        <span className="px-2.5 py-0.5 bg-slate-200 text-slate-700 text-[10px] font-extrabold rounded-md uppercase tracking-wider">
                                                            {job.jobNature}
                                                        </span>
                                                    </div>
                                                    <h3 className="text-base sm:text-lg font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
                                                        {job.title}
                                                    </h3>
                                                    <p className="text-xs font-medium text-slate-500 flex items-center gap-2 sm:gap-3 flex-wrap">
                                                        <span>📍 {job.location || 'Remote'}</span>
                                                        <span className="hidden sm:inline">•</span>
                                                        <span>💼 {job.experience}+ Years Experience</span>
                                                    </p>
                                                </div>

                                                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between sm:justify-end gap-3 shrink-0 pt-3 sm:pt-0 border-t sm:border-t-0 border-slate-200/80 w-full sm:w-auto">
                                                    {job.salaryRange && (
                                                        <div className="text-left sm:text-right">
                                                            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Compensation</span>
                                                            <span className="text-xs font-extrabold text-slate-900">
                                                                {formatCurrency(job.salaryRange.min, job.salaryRange.currency)} — {formatCurrency(job.salaryRange.max, job.salaryRange.currency)}
                                                            </span>
                                                        </div>
                                                    )}
                                                    <button className="w-full sm:w-auto px-5 py-2.5 bg-indigo-600 group-hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center justify-center gap-1.5">
                                                        <span>Apply Now</span>
                                                        <span>➔</span>
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center py-12 bg-slate-50 rounded-2xl border border-dashed border-slate-200 space-y-3">
                                        <span className="text-4xl">💼</span>
                                        <p className="text-base font-bold text-slate-700">No active job circulars</p>
                                        <p className="text-xs text-slate-400 max-w-sm mx-auto">
                                            There are no open positions currently available. Please check back regularly for updates.
                                        </p>
                                    </div>
                                )}
                            </div>

                        </div>

                        {/* Sidebar Information */}
                        <div className="lg:col-span-4 space-y-8">
                            
                            {/* Company Summary Snapshot */}
                            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-5">
                                <h3 className="text-base font-bold text-slate-900 pb-3 border-b border-slate-100 flex items-center gap-2">
                                    <span>📊</span> Snapshot Overview
                                </h3>

                                <div className="space-y-4 text-xs">
                                    <div className="flex items-center justify-between py-1 border-b border-slate-100">
                                        <span className="text-slate-500 font-medium">Primary Industry</span>
                                        <span className="font-bold text-slate-800">{company.industry || 'Technology'}</span>
                                    </div>

                                    <div className="flex items-center justify-between py-1 border-b border-slate-100">
                                        <span className="text-slate-500 font-medium">Workforce Size</span>
                                        <span className="font-bold text-slate-800">{company.companySize}</span>
                                    </div>

                                    <div className="flex items-center justify-between py-1 border-b border-slate-100">
                                        <span className="text-slate-500 font-medium">Headquarters</span>
                                        <span className="font-bold text-slate-800">{company.city || company.country || 'Global'}</span>
                                    </div>

                                    <div className="flex items-center justify-between py-1 border-b border-slate-100">
                                        <span className="text-slate-500 font-medium">Founded</span>
                                        <span className="font-bold text-slate-800">{company.foundedYear}</span>
                                    </div>

                                    <div className="flex items-center justify-between py-1">
                                        <span className="text-slate-500 font-medium">Employer Status</span>
                                        <span className="font-bold text-emerald-600 flex items-center gap-1">
                                            ✓ Verified Partner
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Upcoming Holidays Widget */}
                            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-5">
                                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                                    <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                                        <span>🎉</span> Public Holidays
                                    </h3>
                                    <button
                                        onClick={() => setActiveTab('holidays')}
                                        className="text-xs font-bold text-indigo-600 hover:text-indigo-700"
                                    >
                                        View All ({company.holidays?.length || 0})
                                    </button>
                                </div>

                                {company.holidays && company.holidays.length > 0 ? (
                                    <div className="space-y-3">
                                        {company.holidays.slice(0, 3).map((h, i) => (
                                            <div key={h._id || i} className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/70 space-y-1">
                                                <div className="flex items-center justify-between">
                                                    <h4 className="text-xs font-bold text-slate-800">{h.name}</h4>
                                                    <span className="px-2 py-0.5 bg-amber-50 text-amber-700 text-[9px] font-extrabold rounded">
                                                        {h.type || 'Holiday'}
                                                    </span>
                                                </div>
                                                <p className="text-[11px] font-semibold text-indigo-600">
                                                    📅 {new Date(h.date).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
                                                </p>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-xs text-slate-400 italic text-center py-4">No public holidays published.</p>
                                )}
                            </div>

                        </div>
                    </div>
                )}

                {/* ── Tab 2: Public Holidays Calendar ── */}
                {activeTab === 'holidays' && (
                    <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-xs space-y-6 animate-in fade-in duration-300">
                        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                            <div>
                                <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                                    <span>🎉</span> Public Holidays & Work Schedule
                                </h2>
                                <p className="text-xs text-slate-500 mt-1">
                                    Official organization holiday calendar observed at {company.name}.
                                </p>
                            </div>
                            <span className="px-3 py-1 bg-amber-50 text-amber-700 text-xs font-bold rounded-full border border-amber-200">
                                {company.holidays?.length || 0} Official Holidays
                            </span>
                        </div>

                        {company.holidays && company.holidays.length > 0 ? (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                {company.holidays.map((h, i) => (
                                    <div key={h._id || i} className="p-5 bg-slate-50/80 border border-slate-200/80 rounded-2xl space-y-2 hover:border-indigo-200 transition-all">
                                        <div className="flex items-center justify-between">
                                            <span className="px-2.5 py-0.5 bg-amber-100 text-amber-800 text-[10px] font-extrabold rounded uppercase tracking-wider">
                                                {h.type || 'Public Holiday'}
                                            </span>
                                            <span className="text-xs font-bold text-slate-400">#{i + 1}</span>
                                        </div>
                                        <h3 className="text-base font-bold text-slate-900">{h.name}</h3>
                                        <p className="text-xs font-bold text-indigo-600 flex items-center gap-1.5">
                                            <span>📅</span> {new Date(h.date).toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
                                        </p>
                                        {h.description && (
                                            <p className="text-xs text-slate-500 pt-1 border-t border-slate-200/60 leading-relaxed">{h.description}</p>
                                        )}
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-16 bg-slate-50 rounded-2xl border border-dashed border-slate-200 space-y-2">
                                <span className="text-4xl">🗓️</span>
                                <h3 className="text-base font-bold text-slate-700">No public holidays listed</h3>
                                <p className="text-xs text-slate-400">Organization holidays schedule will appear here when published.</p>
                            </div>
                        )}
                    </div>
                )}

                {/* ── Tab 3: Office & Contact Details ── */}
                {activeTab === 'location' && (
                    <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-xs space-y-6 animate-in fade-in duration-300">
                        <div className="pb-4 border-b border-slate-100">
                            <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                                <span>📍</span> Office Headquarters & Contact Information
                            </h2>
                            <p className="text-xs text-slate-500 mt-1">
                                Verified office address and public contact details for {company.name}.
                            </p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            
                            {/* Address Card */}
                            <div className="p-6 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                                <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center text-lg font-bold">
                                    🏢
                                </div>
                                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider text-[11px] text-slate-400">Headquarters Address</h3>
                                <p className="text-sm font-bold text-slate-800 leading-relaxed">
                                    {company.address || 'Address not specified'}
                                </p>
                                <p className="text-xs text-slate-500 font-medium">
                                    {[company.city, company.state, company.country, company.zipCode].filter(Boolean).join(', ')}
                                </p>
                            </div>

                            {/* Email Card */}
                            <div className="p-6 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                                <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center text-lg font-bold">
                                    ✉️
                                </div>
                                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider text-[11px] text-slate-400">Public Contact Email</h3>
                                {company.email ? (
                                    <a href={`mailto:${company.email}`} className="text-sm font-bold text-indigo-600 hover:underline block truncate">
                                        {company.email}
                                    </a>
                                ) : (
                                    <p className="text-xs text-slate-400 italic">Not available</p>
                                )}
                            </div>

                            {/* Website Card */}
                            <div className="p-6 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                                <div className="w-10 h-10 rounded-xl bg-sky-100 text-sky-700 flex items-center justify-center text-lg font-bold">
                                    🌐
                                </div>
                                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider text-[11px] text-slate-400">Official Website</h3>
                                {company.website ? (
                                    <a
                                        href={company.website.startsWith('http') ? company.website : `https://${company.website}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-sm font-bold text-indigo-600 hover:underline block truncate"
                                    >
                                        {company.website}
                                    </a>
                                ) : (
                                    <p className="text-xs text-slate-400 italic">Not available</p>
                                )}
                            </div>

                        </div>
                    </div>
                )}

            </div>
        </div>
    );
};

export default PublicCompanyDetails;
