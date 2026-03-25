import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import Layout from './Layout';

const CompanyList = () => {
    const { state } = useAuth();
    const navigate = useNavigate();
    const [companies, setCompanies] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterIndustry, setFilterIndustry] = useState('all');

    useEffect(() => {
        // Check if user is admin or superadmin
        if (state.user?.role !== 'admin' && state.user?.role !== 'superadmin') {
            navigate('/dashboard');
            return;
        }

        fetchCompanies();
    }, [state.user, navigate]);

    const fetchCompanies = async () => {
        if (!state.token) return;

        setLoading(true);
        try {
            const response = await fetch('http://localhost:5000/api/admin/companies', {
                headers: {
                    'Authorization': `Bearer ${state.token}`
                }
            });

            if (response.ok) {
                const data = await response.json();
                setCompanies(data);
            } else {
                console.error('Failed to fetch companies:', response.statusText);
            }
        } catch (error) {
            console.error('Error fetching companies:', error);
        } finally {
            setLoading(false);
        }
    };

    // Get unique industries for filter
    const industries = ['all', ...new Set(companies.map(c => c.industry).filter(Boolean))];

    // Filter companies based on search and industry
    const filteredCompanies = companies.filter(company => {
        const matchesSearch = company.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            company.description?.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesIndustry = filterIndustry === 'all' || company.industry === filterIndustry;
        return matchesSearch && matchesIndustry;
    });

    if (loading) {
        return (
            <Layout>
                <div className="flex flex-col items-center justify-center p-24 text-center">
                    <div className="text-6xl mb-6 animate-bounce">⏳</div>
                    <div className="text-xl font-bold text-slate-500 animate-pulse tracking-tight">Gathering organization data...</div>
                </div>
            </Layout>
        );
    }

    return (
        <Layout>
            {/* Page Header */}
            <div className="bg-white p-10 rounded-[32px] shadow-sm border border-slate-100 mb-10 transition-all hover:shadow-md">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8">
                    <div>
                        <h1 className="text-4xl font-black text-slate-800 tracking-tight flex items-center gap-4">
                            <span className="p-3 bg-indigo-50 rounded-2xl text-2xl">🏢</span> Organizations
                        </h1>
                        <p className="text-slate-500 font-medium mt-2 max-w-md">
                            Comprehensive directory of all managed entities and ecosystem partners.
                        </p>
                    </div>
                    <div className="px-6 py-3 bg-slate-900 text-white rounded-2xl text-sm font-black uppercase tracking-widest shadow-xl shadow-slate-200">
                        Registry Count: {companies.length}
                    </div>
                </div>

                {/* Search and Filter */}
                <div className="flex flex-col sm:flex-row gap-4">
                    <div className="relative flex-1 group">
                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
                        </div>
                        <input
                            type="text"
                            placeholder="Search organizations by name or profile..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-12 pr-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold text-slate-700 outline-none focus:bg-white focus:border-indigo-400 focus:ring-4 focus:ring-indigo-50 transition-all shadow-inner"
                        />
                    </div>
                    <div className="relative">
                        <select
                            value={filterIndustry}
                            onChange={(e) => setFilterIndustry(e.target.value)}
                            className="appearance-none pl-6 pr-12 py-4 bg-white border border-slate-200 rounded-2xl text-sm font-black text-slate-600 outline-none hover:border-slate-300 focus:border-indigo-400 focus:ring-4 focus:ring-indigo-50 transition-all cursor-pointer shadow-sm"
                        >
                            <option value="all">Global Sectors</option>
                            {industries.filter(i => i !== 'all').map(industry => (
                                <option key={industry} value={industry}>{industry}</option>
                            ))}
                        </select>
                        <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M6 9l6 6 6-6"></path></svg>
                        </div>
                    </div>
                </div>
            </div>

            {/* Companies Grid */}
            {filteredCompanies.length === 0 ? (
                <div className="bg-slate-50/50 backdrop-blur-sm p-24 rounded-[48px] border-4 border-dashed border-slate-100 text-center animate-in fade-in zoom-in duration-500">
                    <div className="text-8xl mb-8 opacity-20 grayscale">🔍</div>
                    <h3 className="text-2xl font-black text-slate-400 tracking-tight">Zero Matches Found</h3>
                    <p className="text-slate-400 font-bold mt-2 max-w-sm mx-auto uppercase text-xs tracking-[0.2em]">
                        {searchTerm || filterIndustry !== 'all'
                            ? 'The current search parameters do not intersect with any registered nodes.'
                            : 'The central registry is currently devoid of organizational entities.'}
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
                    {filteredCompanies.map((company) => (
                        <div
                            key={company.id}
                            onClick={() => navigate(`/companies/${company.id}`)}
                            className="group bg-white p-8 rounded-[40px] border border-slate-100 shadow-sm hover:shadow-2xl hover:shadow-slate-200 hover:-translate-y-2 hover:border-indigo-100 transition-all duration-500 cursor-pointer relative overflow-hidden"
                        >
                            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50 rounded-bl-[80px] -mr-16 -mt-16 group-hover:bg-indigo-600 transition-colors duration-500 -z-0"></div>

                            {/* Company Header */}
                            <div className="flex items-center gap-5 mb-8 relative z-10">
                                <div className="w-16 h-16 rounded-[24px] bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center text-2xl font-black text-white shadow-xl shadow-indigo-100 group-hover:scale-110 group-hover:rotate-3 transition-transform duration-500">
                                    {company.name?.charAt(0)?.toUpperCase() || 'C'}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h3 className="text-xl font-black text-slate-800 tracking-tight truncate group-hover:text-indigo-600 transition-colors">
                                        {company.name}
                                    </h3>
                                    {company.industry && (
                                        <span className="inline-block mt-1 text-[10px] font-black text-indigo-500 uppercase tracking-widest bg-indigo-50 px-3 py-1 rounded-full group-hover:bg-white transition-colors">
                                            {company.industry}
                                        </span>
                                    )}
                                </div>
                            </div>

                            {/* Company Description */}
                            {company.description && (
                                <p className="text-slate-500 text-sm font-medium leading-relaxed mb-8 line-clamp-3 group-hover:text-slate-600 transition-colors">
                                    {company.description}
                                </p>
                            )}

                            {/* Company Stats */}
                            <div className="grid grid-cols-2 gap-4 mb-8">
                                <div className="p-4 bg-slate-50 rounded-3xl group-hover:bg-indigo-50/50 transition-colors">
                                    <div className="text-2xl font-black text-indigo-600 tracking-tight">
                                        {company.memberCount || 0}
                                    </div>
                                    <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">
                                        Personnel
                                    </div>
                                </div>
                                <div className="p-4 bg-slate-50 rounded-3xl group-hover:bg-purple-50/50 transition-colors">
                                    <div className="text-2xl font-black text-purple-600 tracking-tight">
                                        {company.foundedYear || '––'}
                                    </div>
                                    <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">
                                        Genesis
                                    </div>
                                </div>
                            </div>

                            {/* Company Details */}
                            <div className="space-y-3 pt-6 border-t border-slate-100 relative z-10">
                                {company.owner && (
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 group-hover:bg-white group-hover:text-indigo-500 transition-all">
                                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
                                        </div>
                                        <span className="text-xs font-bold text-slate-500">
                                            Managed by <span className="text-slate-800 font-black">{company.owner.name}</span>
                                        </span>
                                    </div>
                                )}
                                {company.companySize && (
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 group-hover:bg-white group-hover:text-indigo-500 transition-all">
                                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path></svg>
                                        </div>
                                        <span className="text-xs font-bold text-slate-500">
                                            Scale: <span className="text-slate-800 font-black">{company.companySize}</span>
                                        </span>
                                    </div>
                                )}
                                {company.city && company.country && (
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 group-hover:bg-white group-hover:text-indigo-500 transition-all">
                                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
                                        </div>
                                        <span className="text-xs font-bold text-slate-500">
                                            {company.city}, {company.country}
                                        </span>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </Layout>
    );
};

export default CompanyList;
