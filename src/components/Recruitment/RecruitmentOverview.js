import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import Layout from '../Layout';
import PageHeader from '../PageHeader';
import { useCompanyFilter } from '../../hooks/useCompanyFilter';
import { getCookie } from '../../utils/cookies';
import { BASE_SERVER_URL } from '../../services/api';

const RecruitmentOverview = () => {
    const { selectedCompany } = useCompanyFilter();

    const getLogoUrl = (path) => {
        if (!path) return null;
        if (path.startsWith('http')) return path;
        return `${BASE_SERVER_URL}${path.startsWith('/') ? '' : '/'}${path}`;
    };

    const [circulars, setCirculars] = useState([]);
    const [stats, setStats] = useState({
        totalCirculars: 0,
        totalApplicants: 0,
        shortlisted: 0,
        interviewed: 0,
        hired: 0
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            if (!selectedCompany?.id || selectedCompany.id === 'personal') {
                setLoading(false);
                return;
            }

            setLoading(true);
            try {
                const token = getCookie('authToken');
                const headers = { Authorization: `Bearer ${token}` };

                const [circRes, statsRes] = await Promise.all([
                    axios.get('/api/recruitment/public/circulars', { headers }),
                    axios.get('/api/recruitment/stats', { headers })
                ]);

                setCirculars(circRes.data);
                setStats(statsRes.data);
            } catch (error) {
                console.error('Error fetching recruitment data:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [selectedCompany?.id]);

    const statsConfig = [
        { label: 'Active Jobs', value: stats.totalCirculars },
        { label: 'Applicants', value: stats.totalApplicants },
        { label: 'Shortlisted', value: stats.shortlisted },
        { label: 'Hiring Rate', value: stats.totalApplicants > 0 ? `${Math.round((stats.hired / stats.totalApplicants) * 100)}%` : '0%' }
    ];

    if (!selectedCompany || selectedCompany.id === 'personal') {
        return (
            <Layout>
                <div className="max-w-xl mx-auto my-20 bg-white rounded-2xl p-12 py-20 border border-slate-200 text-center space-y-8 animate-in fade-in slide-in-from-bottom-4 shadow-sm">
                    <div className="w-20 h-20 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto text-4xl shadow-inner border border-slate-100">🏢</div>
                    <div className="space-y-3">
                        <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Organization Required</h2>
                        <p className="text-slate-500 max-w-sm mx-auto leading-relaxed font-medium text-sm">Please select a company from the sidebar to manage recruitment operations.</p>
                    </div>
                </div>
            </Layout>
        );
    }

    return (
        <Layout>
            <div className="space-y-10 animate-in fade-in pb-20">
                <PageHeader
                    title="Recruitment"
                    subtitle={`Hiring operations for ${selectedCompany.name}`}
                    icon={selectedCompany.logo ? (
                        <img src={getLogoUrl(selectedCompany.logo)} alt="" className="w-full h-full object-cover" />
                    ) : "🎯"}
                    stats={statsConfig}
                    actions={
                        <Link
                            to="/recruitment/create"
                            className="inline-flex px-6 py-3 bg-slate-900 text-white rounded-xl font-bold text-[11px] uppercase tracking-widest hover:bg-slate-800 transition-all shadow-lg group items-center gap-3"
                        >
                            + Post New Job
                        </Link>
                    }
                />

                <div className="space-y-6">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-1 h-6 bg-indigo-600 rounded-full" />
                            <h2 className="text-lg font-bold text-slate-900 tracking-tight">Active Circulars</h2>
                        </div>
                        <div className="flex gap-2">
                            {['All Roles', 'Recent'].map(t => (
                                <button key={t} className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-[9px] font-bold uppercase tracking-widest text-slate-500 hover:bg-slate-50 hover:text-indigo-600 transition-all">{t}</button>
                            ))}
                        </div>
                    </div>

                    {loading ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {[1, 2, 3].map(i => <div key={i} className="h-64 bg-white rounded-2xl border border-slate-100 animate-pulse shadow-sm" />)}
                        </div>
                    ) : circulars.length === 0 ? (
                        <div className="py-20 text-center bg-white border border-slate-100 rounded-2xl space-y-4">
                            <div className="text-5xl grayscale opacity-20">📂</div>
                            <div className="space-y-1">
                                <h3 className="text-lg font-bold text-slate-900 tracking-tight">No active circulars</h3>
                                <p className="text-slate-400 font-medium max-w-xs mx-auto text-sm">Post a job to start receiving applications.</p>
                            </div>
                            <Link to="/recruitment/create" className="inline-flex px-6 py-2.5 bg-indigo-50 text-indigo-600 rounded-xl font-bold text-[10px] uppercase tracking-widest hover:bg-indigo-600 hover:text-white transition-all">
                                Post Job
                            </Link>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {circulars.map(circular => (
                                <div key={circular._id} className="bg-white border border-slate-200 p-6 rounded-2xl hover:shadow-lg transition-all duration-300 flex flex-col group relative shadow-sm">
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="space-y-2">
                                            <span className="px-2 py-0.5 text-[8px] font-black uppercase tracking-[0.1em] bg-indigo-50 text-indigo-600 rounded-md border border-indigo-100/50">
                                                {circular.role}
                                            </span>
                                            <h3 className="text-lg font-bold text-slate-900 leading-snug group-hover:text-indigo-600 transition-colors line-clamp-2 min-h-[50px]">
                                                {circular.title}
                                            </h3>
                                        </div>
                                    </div>

                                    <div className="space-y-2 py-4 border-y border-slate-50 my-1">
                                        <div className="flex items-center text-slate-500 font-bold text-[9px] uppercase tracking-widest gap-3">
                                            <span className="w-6 h-6 rounded bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold border border-emerald-100 italic shrink-0">P</span>
                                            ${circular.salaryRange.min.toLocaleString()} — ${circular.salaryRange.max.toLocaleString()}
                                        </div>
                                        <div className="flex items-center text-slate-500 font-bold text-[9px] uppercase tracking-widest gap-3">
                                            <span className="w-6 h-6 rounded bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold border border-indigo-100 italic shrink-0">E</span>
                                            {circular.experience} years minimum
                                        </div>
                                    </div>

                                    <div className="mt-6 flex items-center justify-between gap-2">
                                        <Link
                                            to={`/recruitment/circulars/${circular._id}/applicants`}
                                            className="grow py-2.5 bg-slate-900 text-white text-center rounded-xl font-bold text-[10px] uppercase tracking-widest hover:bg-indigo-600 transition-all shadow-md flex items-center justify-center gap-2 group/link"
                                        >
                                            View Applicants
                                            <svg className="w-3 h-3 group-hover/link:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
                                        </Link>
                                        <Link
                                            to={`/careers/${circular._id}`}
                                            target="_blank"
                                            className="p-2.5 bg-slate-50 border border-slate-100 text-slate-400 hover:text-indigo-600 rounded-xl transition-all"
                                            title="View Public Listing"
                                        >
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                                        </Link>
                                        <Link
                                            to={`/recruitment/circulars/${circular._id}/edit`}
                                            className="p-2.5 bg-white border border-slate-100 text-slate-400 hover:text-indigo-600 rounded-xl transition-all"
                                        >
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M11 5H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-5M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z" /></svg>
                                        </Link>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </Layout>
    );
};

export default RecruitmentOverview;
