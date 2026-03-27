import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';
import Layout from '../Layout';

const RecruitmentOverview = () => {
    const [circulars, setCirculars] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchCirculars = async () => {
            try {
                const token = localStorage.getItem('token');
                const res = await axios.get('/api/recruitment/public/circulars', {
                    headers: { Authorization: `Bearer ${token}` }
                });
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
        <Layout>
            <div className="space-y-8 pb-12">
                {/* Header Section */}
                <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                    <div className="flex items-center gap-6">
                        <div className="w-16 h-16 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center text-3xl shadow-inner border border-indigo-100">🎯</div>
                        <div>
                            <h1 className="text-3xl font-bold text-slate-800 tracking-tight">Recruitment Center</h1>
                            <p className="text-slate-500 font-medium">Manage your job circulars and streamline your hiring process.</p>
                        </div>
                    </div>
                    <Link
                        to="/recruitment/create"
                        className="px-8 py-3 bg-indigo-600 text-white rounded-xl font-bold text-sm hover:bg-indigo-700 transition-all shadow-md shadow-indigo-200 flex items-center gap-2"
                    >
                        <span className="text-xl">+</span> Create New Circular
                    </Link>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow group">
                        <div className="flex justify-between items-start">
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Active</p>
                            <span className="text-xl group-hover:scale-125 transition-transform duration-300">💼</span>
                        </div>
                        <p className="text-4xl font-bold text-slate-800 mt-2 tracking-tighter">
                            {loading ? <span className="text-slate-200 animate-pulse">---</span> : circulars.filter(c => c.status === 'active').length}
                        </p>
                    </div>
                    <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow group">
                        <div className="flex justify-between items-start">
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Applicants</p>
                            <span className="text-xl group-hover:scale-125 transition-transform duration-300">👥</span>
                        </div>
                        <p className="text-4xl font-bold text-slate-800 mt-2 tracking-tighter">--</p>
                    </div>
                    <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow group">
                        <div className="flex justify-between items-start">
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Interviews</p>
                            <span className="text-xl group-hover:scale-125 transition-transform duration-300">🗓️</span>
                        </div>
                        <p className="text-4xl font-bold text-slate-800 mt-2 tracking-tighter">--</p>
                    </div>
                </div>

                {/* Main Section */}
                <div className="space-y-6">
                    <h2 className="text-lg font-bold text-slate-800 px-1 flex items-center gap-2">
                        <span className="w-1.5 h-6 bg-indigo-500 rounded-full" />
                        Active Circulars
                    </h2>

                    {loading ? (
                        <div className="flex justify-center p-20 bg-white rounded-3xl border border-slate-200 shadow-sm">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div>
                        </div>
                    ) : circulars.length === 0 ? (
                        <div className="p-20 text-center bg-white border-2 border-dashed border-slate-200 rounded-3xl">
                            <div className="text-5xl mb-4 opacity-20">📁</div>
                            <p className="text-slate-400 text-lg font-medium mb-4">No active job circulars found.</p>
                            <Link to="/recruitment/create" className="px-6 py-2 bg-slate-100 text-slate-600 rounded-lg font-bold text-sm hover:bg-slate-200 transition-colors">
                                Create your first one
                            </Link>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {circulars.map(circular => (
                                <div key={circular._id} className="bg-white border border-slate-200 p-6 rounded-3xl hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col shadow-sm group">
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="min-w-0">
                                            <span className="inline-block px-2 py-1 text-[10px] font-bold uppercase tracking-wider bg-indigo-50 text-indigo-600 rounded-md border border-indigo-100 mb-2">
                                                {circular.role}
                                            </span>
                                            <h3 className="text-xl font-bold text-slate-800 group-hover:text-indigo-600 transition-colors truncate">{circular.title}</h3>
                                        </div>
                                    </div>

                                    <div className="space-y-4 flex-grow py-4 border-y border-slate-50 mt-2">
                                        <div className="flex items-center text-slate-500 text-sm font-medium">
                                            <span className="mr-3 opacity-60">💰</span>
                                            <span>${circular.salaryRange.min.toLocaleString()} - {circular.salaryRange.max.toLocaleString()}</span>
                                        </div>
                                        <div className="flex items-center text-slate-500 text-sm font-medium">
                                            <span className="mr-3 opacity-60">⏳</span>
                                            <span>Min {circular.experience} Years Exp.</span>
                                        </div>
                                    </div>

                                    <div className="mt-6 flex justify-between items-center bg-slate-50/50 -mx-6 -mb-6 p-4 rounded-b-3xl border-t border-slate-100">
                                        <Link to={`/recruitment/circulars/${circular._id}/applicants`} className="text-xs font-bold text-indigo-600 hover:text-indigo-800 transition-colors flex items-center gap-1">
                                            View Applicants
                                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
                                        </Link>
                                        <div className="flex gap-2">
                                            <button className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-white rounded-lg transition-all border border-transparent hover:border-slate-200 shadow-sm hover:shadow">
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-5M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z" /></svg>
                                            </button>
                                        </div>
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
