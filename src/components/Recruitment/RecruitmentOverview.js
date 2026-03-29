import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';
import Layout from '../Layout';
import PageHeader from '../PageHeader';
import { useCompanyFilter } from '../../hooks/useCompanyFilter';
import { getCookie } from '../../utils/cookies';

const RecruitmentOverview = () => {
    const navigate = useNavigate();
    const { selectedCompany } = useCompanyFilter();
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
                <div className="max-w-4xl mx-auto my-32 bg-white rounded-3xl p-32 shadow-2xl border border-slate-100 text-center space-y-10">
                    <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center mx-auto text-5xl shadow-inner border border-slate-100">🏢</div>
                    <div className="space-y-4">
                        <h2 className="text-3xl font-bold text-slate-900 tracking-tight">Organization Required</h2>
                        <p className="text-slate-500 max-w-sm mx-auto leading-relaxed font-medium">Please select a company to manage recruitment.</p>
                    </div>
                </div>
            </Layout>
        );
    }

    return (
        <Layout>
            <div className="max-w-[1240px] mx-auto py-12 px-6 space-y-12 animate-in fade-in pb-40">
                <PageHeader
                    title="Recruitment"
                    subtitle={`Hiring operations for ${selectedCompany.name}`}
                    icon="🎯"
                    stats={statsConfig}
                    actions={
                        <Link
                            to="/recruitment/create"
                            className="inline-flex px-8 py-4 bg-slate-900 text-white rounded-2xl font-bold text-[11px] uppercase tracking-widest hover:bg-slate-800 transition-all shadow-xl group items-center gap-3"
                        >
                            + Post New Job
                        </Link>
                    }
                />

                <div className="space-y-8">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="w-1.5 h-6 bg-indigo-500 rounded-full" />
                            <h2 className="text-xl font-bold text-slate-900 tracking-tight">Active Circulars</h2>
                        </div>
                        <div className="flex gap-2">
                            {['All Roles', 'Recent'].map(t => (
                                <button key={t} className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-[10px] font-bold uppercase tracking-widest text-slate-500 hover:bg-slate-50 transition-all">{t}</button>
                            ))}
                        </div>
                    </div>

                    {loading ? (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                            {[1, 2, 3].map(i => <div key={i} className="h-80 bg-white rounded-2xl border border-slate-100 animate-pulse shadow-sm" />)}
                        </div>
                    ) : circulars.length === 0 ? (
                        <div className="py-24 text-center bg-white border border-slate-200 rounded-3xl space-y-6">
                            <div className="text-6xl opacity-20">📂</div>
                            <div className="space-y-2">
                                <h3 className="text-xl font-bold text-slate-900 tracking-tight">No active circulars</h3>
                                <p className="text-slate-400 font-medium max-w-xs mx-auto text-sm">Post a new job to start receiving applications.</p>
                            </div>
                            <Link to="/recruitment/create" className="inline-flex px-8 py-3 bg-indigo-50 text-indigo-600 rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-indigo-600 hover:text-white transition-all">
                                Post Job
                            </Link>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                            {circulars.map(circular => (
                                <div key={circular._id} className="bg-white border border-slate-200 p-8 rounded-3xl hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col group relative overflow-hidden backdrop-blur-sm shadow-sm">
                                    <div className="flex justify-between items-start mb-6">
                                        <div className="space-y-3">
                                            <span className="px-3 py-1 text-[9px] font-black uppercase tracking-[0.1em] bg-indigo-50 text-indigo-600 rounded-lg border border-indigo-100/50">
                                                {circular.role}
                                            </span>
                                            <h3 className="text-xl font-bold text-slate-900 leading-tight group-hover:text-indigo-600 transition-colors h-[50px] flex items-center">
                                                {circular.title}
                                            </h3>
                                        </div>
                                    </div>

                                    <div className="space-y-3 py-6 border-y border-slate-50 my-2">
                                        <div className="flex items-center text-slate-500 font-bold text-[10px] uppercase tracking-widest gap-4">
                                            <span className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold border border-emerald-100 italic">P</span>
                                            ${circular.salaryRange.min.toLocaleString()} — ${circular.salaryRange.max.toLocaleString()}
                                        </div>
                                        <div className="flex items-center text-slate-500 font-bold text-[10px] uppercase tracking-widest gap-4">
                                            <span className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold border border-indigo-100 italic">E</span>
                                            Min {circular.experience} years exp
                                        </div>
                                    </div>

                                    <div className="mt-6 flex items-center justify-between gap-3">
                                        <Link
                                            to={`/recruitment/circulars/${circular._id}/applicants`}
                                            className="grow py-3 bg-slate-900 text-white text-center rounded-xl font-bold text-[10px] uppercase tracking-widest hover:bg-indigo-600 transition-all shadow-lg flex items-center justify-center gap-2 group/link"
                                        >
                                            View Applicants
                                            <svg className="w-3.5 h-3.5 group-hover/link:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
                                        </Link>
                                        <Link
                                            to={`/careers/${circular._id}`}
                                            target="_blank"
                                            className="p-3 bg-slate-50 border border-slate-100 text-slate-400 hover:text-indigo-600 rounded-xl transition-all"
                                            title="View Public Listing"
                                        >
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                                        </Link>
                                        <Link
                                            to={`/recruitment/circulars/${circular._id}/edit`}
                                            className="p-3 bg-white border border-slate-100 text-slate-400 hover:text-indigo-600 hover:shadow-xl rounded-xl transition-all"
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
