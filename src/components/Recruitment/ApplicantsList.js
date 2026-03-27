import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';
import Layout from '../Layout';

const ApplicantsList = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [applicants, setApplicants] = useState([]);
    const [loading, setLoading] = useState(true);
    const [circular, setCircular] = useState(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const token = localStorage.getItem('token');
                const [appRes, circRes] = await Promise.all([
                    axios.get(`/api/recruitment/circulars/${id}/applicants`, {
                        headers: { Authorization: `Bearer ${token}` }
                    }),
                    axios.get(`/api/recruitment/public/circulars/${id}`)
                ]);
                setApplicants(appRes.data);
                setCircular(circRes.data);
            } catch (error) {
                console.error('Error fetching data:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [id]);

    const updateStatus = async (appId, status, notes = '', interviewDate = null) => {
        try {
            const token = localStorage.getItem('token');
            await axios.patch(`/api/recruitment/applications/${appId}/status`,
                { status, notes, interviewDate },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            setApplicants(applicants.map(a => a._id === appId ? { ...a, status } : a));
            alert(`Application ${status} successfully!`);
        } catch (error) {
            console.error('Error updating status:', error);
        }
    };

    const hireCandidate = async (appId) => {
        const salary = prompt('Enter starting salary for this candidate:');
        if (!salary) return;

        try {
            const token = localStorage.getItem('token');
            await axios.post(`/api/recruitment/applications/${appId}/hire`,
                { salary: Number(salary) },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            setApplicants(applicants.map(a => a._id === appId ? { ...a, status: 'hired' } : a));
            alert('Candidate hired successfully!');
        } catch (error) {
            console.error('Error hiring candidate:', error);
        }
    };

    return (
        <Layout>
            <div className="space-y-8 pb-12">
                {/* Header Section */}
                <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => navigate('/recruitment')}
                            className="p-2 hover:bg-slate-50 text-slate-400 hover:text-indigo-600 rounded-xl transition-all border border-slate-100"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
                        </button>
                        <div>
                            <h1 className="text-2xl font-bold text-slate-800 tracking-tight">{circular?.title}</h1>
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{applicants.length} Applicants Received</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="px-4 py-2 bg-indigo-50 text-indigo-600 rounded-xl text-xs font-bold border border-indigo-100 italic">
                            {circular?.role}
                        </div>
                    </div>
                </div>

                {/* Applicants Table */}
                <div className="bg-white rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50 border-b border-slate-100">
                                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Candidate Information</th>
                                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Experience</th>
                                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Technical Skills</th>
                                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Status</th>
                                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {loading ? (
                                <tr>
                                    <td colSpan="5" className="px-8 py-20 text-center">
                                        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600 mx-auto"></div>
                                    </td>
                                </tr>
                            ) : applicants.length === 0 ? (
                                <tr>
                                    <td colSpan="5" className="px-8 py-20 text-center text-slate-400 font-bold italic">No candidates have applied yet.</td>
                                </tr>
                            ) : applicants.map((app) => (
                                <tr key={app._id} className="hover:bg-indigo-50/20 transition-all group">
                                    <td className="px-8 py-6">
                                        <div className="font-bold text-slate-800 text-sm">{app.applicant.name}</div>
                                        <div className="text-[10px] text-slate-400 font-bold uppercase mt-0.5 tracking-tight">{app.applicant.email}</div>
                                    </td>
                                    <td className="px-8 py-6">
                                        <div className="flex items-center gap-2">
                                            <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-pulse"></span>
                                            <span className="text-sm font-bold text-slate-700">{app.applicant.experience} Years</span>
                                        </div>
                                    </td>
                                    <td className="px-8 py-6">
                                        <div className="flex flex-wrap gap-2">
                                            {app.applicant.skills.slice(0, 3).map((s, i) => (
                                                <span key={i} className="px-2 py-0.5 bg-indigo-50/30 border border-indigo-100 text-[9px] font-black text-indigo-500 rounded uppercase tracking-wider">{s}</span>
                                            ))}
                                            {app.applicant.skills.length > 3 && <span className="text-[10px] font-bold text-slate-300">+{app.applicant.skills.length - 3}</span>}
                                        </div>
                                    </td>
                                    <td className="px-8 py-6">
                                        <span className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border shadow-sm transition-all ${app.status === 'hired' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                                                app.status === 'shortlisted' ? 'bg-indigo-50 text-indigo-600 border-indigo-100' :
                                                    app.status === 'rejected' ? 'bg-rose-50 text-rose-600 border-rose-100' :
                                                        'bg-slate-50 text-slate-500 border-slate-200'
                                            }`}>
                                            {app.status}
                                        </span>
                                    </td>
                                    <td className="px-8 py-6 text-right">
                                        <div className="flex justify-end gap-3 opacity-0 group-hover:opacity-100 transition-opacity translate-x-2 group-hover:translate-x-0">
                                            {app.status === 'pending' && (
                                                <button
                                                    onClick={() => updateStatus(app._id, 'shortlisted')}
                                                    className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-black text-[10px] uppercase tracking-widest shadow-lg shadow-indigo-600/20"
                                                >
                                                    Shortlist
                                                </button>
                                            )}
                                            {app.status === 'shortlisted' && (
                                                <button
                                                    onClick={() => {
                                                        const date = prompt('Enter interview date (YYYY-MM-DD):');
                                                        if (date) updateStatus(app._id, 'interviewed', 'Scheduled interview', date);
                                                    }}
                                                    className="px-4 py-1.5 bg-violet-600 hover:bg-violet-700 text-white rounded-lg font-black text-[10px] uppercase tracking-widest shadow-lg shadow-violet-600/20"
                                                >
                                                    Schedule
                                                </button>
                                            )}
                                            {app.status === 'interviewed' && (
                                                <button
                                                    onClick={() => hireCandidate(app._id)}
                                                    className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-black text-[10px] uppercase tracking-widest shadow-lg shadow-emerald-600/20"
                                                >
                                                    Hire Candidate
                                                </button>
                                            )}
                                            {app.status !== 'rejected' && app.status !== 'hired' && (
                                                <button
                                                    onClick={() => updateStatus(app._id, 'rejected')}
                                                    className="px-4 py-1.5 bg-white hover:bg-rose-50 text-rose-500 border border-slate-200 hover:border-rose-200 rounded-lg font-black text-[10px] uppercase tracking-widest"
                                                >
                                                    Reject
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </Layout>
    );
};

export default ApplicantsList;
