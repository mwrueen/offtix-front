import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import Layout from './Layout';
import PageHeader from './PageHeader';
import Card from './ui/Card';
import Badge from './ui/Badge';
import Button from './ui/Button';
import LoadingSpinner from './ui/LoadingSpinner';
import { BASE_SERVER_URL } from '../services/api';

const CompanyList = () => {
    const { state } = useAuth();
    const navigate = useNavigate();
    const [companies, setCompanies] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterIndustry, setFilterIndustry] = useState('all');

    const getLogoUrl = (path) => {
        if (!path) return null;
        if (path.startsWith('http')) return path;
        return `${BASE_SERVER_URL}${path.startsWith('/') ? '' : '/'}${path}`;
    };

    useEffect(() => {
        // Check if user is admin or superadmin
        if (state.user?.role !== 'admin' && state.user?.role !== 'superadmin') {
            navigate('/dashboard');
            return;
        }

        fetchCompanies();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [state.user, navigate, state.token]);

    const fetchCompanies = async () => {
        if (!state.token) return;

        setLoading(true);
        try {
            const response = await fetch(`${BASE_SERVER_URL}/api/admin/companies`, {
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
                <div className="min-h-[60vh] flex flex-col items-center justify-center">
                    <LoadingSpinner size="lg" />
                    <p className="mt-4 text-slate-500 font-medium">Loading organization directory...</p>
                </div>
            </Layout>
        );
    }

    return (
        <Layout>
            <PageHeader
                title="Organizations"
                subtitle="Directory of all registered companies and entities."
                icon="🏢"
                stats={[
                    { label: 'Total Organizations', value: companies.length },
                    { label: 'Showing Results', value: filteredCompanies.length }
                ]}
                actions={
                    <Button onClick={() => navigate('/create-company')} variant="primary">
                        Add Organization
                    </Button>
                }
            />

            {/* Filters Section */}
            <div className="flex flex-col md:flex-row gap-4 mb-8 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                <div className="relative flex-1 group">
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
                    </div>
                    <input
                        type="text"
                        placeholder="Search by name or description..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg text-sm bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 outline-none transition-all"
                    />
                </div>

                <div className="w-full md:w-64">
                    <select
                        value={filterIndustry}
                        onChange={(e) => setFilterIndustry(e.target.value)}
                        className="w-full px-4 py-2 border border-slate-200 rounded-lg text-sm bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 outline-none transition-all appearance-none cursor-pointer"
                    >
                        <option value="all">All Industries</option>
                        {industries.filter(i => i !== 'all').map(industry => (
                            <option key={industry} value={industry}>{industry}</option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Companies Grid */}
            {filteredCompanies.length === 0 ? (
                <div className="bg-white border border-slate-200 p-16 rounded-2xl text-center shadow-sm">
                    <div className="text-5xl mb-4">🔍</div>
                    <h3 className="text-xl font-bold text-slate-900">No organizations found</h3>
                    <p className="text-slate-500 mt-2 max-w-sm mx-auto">
                        {searchTerm || filterIndustry !== 'all'
                            ? 'Try adjusting your search filters or search terms.'
                            : 'There are no entities registered in the system yet.'}
                    </p>
                    {(searchTerm || filterIndustry !== 'all') && (
                        <Button
                            variant="ghost"
                            className="mt-6 text-indigo-600 font-bold"
                            onClick={() => { setSearchTerm(''); setFilterIndustry('all'); }}
                        >
                            Clear Filters
                        </Button>
                    )}
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredCompanies.map((company) => (
                        <Card
                            key={company.id}
                            onClick={() => navigate(`/companies/${company.id}`)}
                            className="group hover:border-indigo-300 hover:shadow-md transition-all duration-300 cursor-pointer overflow-hidden p-0"
                            padding={false}
                        >
                            <div className="p-6">
                                {/* Header Section */}
                                <div className="flex items-center gap-4 mb-4">
                                    <div className="w-14 h-14 rounded-xl bg-indigo-50 flex items-center justify-center text-xl font-bold text-indigo-600 shadow-sm group-hover:bg-indigo-600 group-hover:text-white transition-colors duration-300 overflow-hidden shrink-0">
                                        {company.logo ? (
                                            <img src={getLogoUrl(company.logo)} alt="" className="w-full h-full object-cover" />
                                        ) : company.name?.charAt(0)?.toUpperCase() || 'C'}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h3 className="text-lg font-bold text-slate-900 truncate group-hover:text-indigo-600 transition-colors">
                                            {company.name}
                                        </h3>
                                        {company.industry && (
                                            <Badge variant="primary" size="sm" className="mt-1">
                                                {company.industry}
                                            </Badge>
                                        )}
                                    </div>
                                </div>

                                {/* Description */}
                                {company.description && (
                                    <p className="text-slate-500 text-sm leading-relaxed mb-6 line-clamp-2">
                                        {company.description}
                                    </p>
                                )}

                                {/* Simple Stats Row */}
                                <div className="grid grid-cols-2 gap-3 mb-6">
                                    <div className="px-3 py-2 bg-slate-50 rounded-lg group-hover:bg-indigo-50/50 transition-colors">
                                        <div className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-0.5">Personnel</div>
                                        <div className="text-base font-bold text-slate-800">{company.memberCount || 0}</div>
                                    </div>
                                    <div className="px-3 py-2 bg-slate-50 rounded-lg group-hover:bg-indigo-50/50 transition-colors">
                                        <div className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-0.5">Founded</div>
                                        <div className="text-base font-bold text-slate-800 text-right">{company.foundedYear || '––'}</div>
                                    </div>
                                </div>

                                {/* Footer meta info */}
                                <div className="space-y-2 pt-4 border-t border-slate-100">
                                    <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
                                        <svg className="w-4 h-4 text-slate-300 group-hover:text-indigo-500 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.828a2 2 0 01-2.828 0L6.757 16.657a8 8 0 1111.314 0z" />
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                        </svg>
                                        {company.city && company.country ? `${company.city}, ${company.country}` : 'Location Hidden'}
                                    </div>
                                    <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
                                        <svg className="w-4 h-4 text-slate-300 group-hover:text-indigo-500 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                        </svg>
                                        Managed by {company.owner?.name || 'Administrator'}
                                    </div>
                                </div>
                            </div>
                        </Card>
                    ))}
                </div>
            )}
        </Layout>
    );
};

export default CompanyList;

