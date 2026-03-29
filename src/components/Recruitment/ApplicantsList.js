import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';
import Layout from '../Layout';
import { useToast } from '../../context/ToastContext';
import { getCookie } from '../../utils/cookies';

const ApplicantsList = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const toast = useToast();
    const [applicants, setApplicants] = useState([]);
    const [loading, setLoading] = useState(true);
    const [circular, setCircular] = useState(null);
    const [statusUpdating, setStatusUpdating] = useState(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const token = getCookie('authToken');
                const headers = { Authorization: `Bearer ${token}` };
                const [appRes, circRes] = await Promise.all([
                    axios.get(`/api/recruitment/circulars/${id}/applicants`, { headers }),
                    axios.get(`/api/recruitment/public/circulars/${id}`, { headers })
                ]);
                setApplicants(appRes.data);
                setCircular(circRes.data);
            } catch (error) {
                console.error('Error fetching data:', error);
                toast.showToast('Failed to load recruitment data', 'error');
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [id]);

    const updateStatus = async (appId, status, notes = '', interviewDate = null) => {
        setStatusUpdating(appId);
        try {
            const token = getCookie('authToken');
            await axios.patch(`/api/recruitment/applications/${appId}/status`,
                { status, notes, interviewDate },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            setApplicants(applicants.map(a => a._id === appId ? { ...a, status } : a));
            toast.showToast(`Status updated: ${status}`, 'success');
        } catch (error) {
            console.error('Error updating status:', error);
            toast.showToast('Update failed', 'error');
        } finally {
            setStatusUpdating(null);
        }
    };

    const hireCandidate = async (appId) => {
        const salary = prompt('Enter starting monthly salary ($):');
        if (!salary) return;

        setStatusUpdating(appId);
        try {
            const token = getCookie('authToken');
            await axios.post(`/api/recruitment/applications/${appId}/hire`,
                { salary: Number(salary) },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            setApplicants(applicants.map(a => a._id === appId ? { ...a, status: 'hired' } : a));
            toast.showToast('Candidate hired successfully', 'success');
        } catch (error) {
            console.error('Error hiring candidate:', error);
            toast.showToast('Hiring failed', 'error');
        } finally {
            setStatusUpdating(null);
        }
    };

    return (
        <Layout>
            <div className="max-w-[1240px] mx-auto py-12 px-6 space-y-8 animate-in fade-in pb-40">
                <div className="flex items-center gap-6">
                    <button
                        onClick={() => navigate('/recruitment')}
                        className="w-10 h-10 bg-white border border-slate-200 rounded-xl flex items-center justify-center text-slate-400 hover:text-indigo-600 transition-all shadow-sm"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
                    </button>
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">{circular?.title || 'Loading...'}</h1>
                        <div className="flex items-center gap-3 mt-1">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{applicants.length} Applicants Received</span>
                            <span className="w-1 h-1 bg-slate-300 rounded-full" />
                            <span className="text-[10px] font-bold text-indigo-500 uppercase tracking-widest">{circular?.role}</span>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden relative">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-50 border-b border-slate-100">
                                    <th className="px-8 py-5 text-[10px] font-bold uppercase tracking-widest text-slate-400">Candidate Information</th>
                                    <th className="px-8 py-5 text-[10px] font-bold uppercase tracking-widest text-slate-400 text-center">Experience</th>
                                    <th className="px-8 py-5 text-[10px] font-bold uppercase tracking-widest text-slate-400">Technical Skills</th>
                                    <th className="px-8 py-5 text-[10px] font-bold uppercase tracking-widest text-slate-400 text-center">Status</th>
                                    <th className="px-8 py-5 text-[10px] font-bold uppercase tracking-widest text-slate-400 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {loading ? (
                                    <tr>
                                        <td colSpan="5" className="px-8 py-20 text-center">
                                            <div className="flex flex-col items-center gap-3">
                                                <div className="w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                                                <p className="text-[10px] font-bold text-slate-400 uppercase">Loading Data...</p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : applicants.length === 0 ? (
                                    <tr>
                                        <td colSpan="5" className="px-8 py-20 text-center">
                                            <p className="text-sm font-bold text-slate-400 italic">No applications detected yet.</p>
                                        </td>
                                    </tr>
                                ) : applicants.map((app) => (
                                    <tr key={app._id} className="hover:bg-slate-50 transition-all duration-200 group">
                                        <td className="px-8 py-6">
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 bg-slate-100 text-slate-500 rounded-xl flex items-center justify-center font-bold text-lg group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-colors">
                                                    {app.applicant.name.charAt(0)}
                                                </div>
                                                <div>
                                                    <div className="font-bold text-slate-900 text-sm group-hover:text-indigo-600 transition-colors tracking-tight">{app.applicant.name}</div>
                                                    <div className="text-[10px] text-slate-400 font-bold uppercase tracking-tight">{app.applicant.email}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6 text-center text-xs font-bold text-slate-600">
                                            {app.applicant.experience} Years
                                        </td>
                                        <td className="px-8 py-6">
                                            <div className="flex flex-wrap gap-1.5 max-w-[280px]">
                                                {app.applicant.skills.slice(0, 4).map((s, i) => (
                                                    <span key={i} className="px-2 py-0.5 bg-slate-100 border border-slate-200 text-[9px] font-bold text-slate-500 rounded uppercase tracking-wider">#{s}</span>
                                                ))}
                                                {app.applicant.skills.length > 4 && <span className="text-[9px] font-bold text-slate-300">+{app.applicant.skills.length - 4}</span>}
                                            </div>
                                        </td>
                                        <td className="px-8 py-6 text-center">
                                            <span className={`px-4 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest border transition-all inline-block min-w-[120px] ${app.status === 'hired' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                                                app.status === 'shortlisted' ? 'bg-indigo-50 text-indigo-600 border-indigo-100' :
                                                    app.status === 'rejected' ? 'bg-rose-50 text-rose-600 border-rose-100' :
                                                        'bg-slate-50 text-slate-500 border-slate-200'
                                                }`}>
                                                {app.status}
                                            </span>
                                        </td>
                                        <td className="px-8 py-6 text-right">
                                            <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-x-2 group-hover:translate-x-0">
                                                {app._id === statusUpdating ? (
                                                    <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                                                ) : (
                                                    <>
                                                        {app.status === 'pending' && (
                                                            <button
                                                                onClick={() => updateStatus(app._id, 'shortlisted')}
                                                                className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold text-[10px] uppercase tracking-widest shadow-md transition-all"
                                                            >
                                                                Shortlist
                                                            </button>
                                                        )}
                                                        {app.status === 'shortlisted' && (
                                                            <button
                                                                onClick={() => {
                                                                    const date = prompt('Enter interview date (YYYY-MM-DD):');
                                                                    if (date) updateStatus(app._id, 'interviewed', 'Regular Interview', date);
                                                                }}
                                                                className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold text-[10px] uppercase tracking-widest shadow-md transition-all"
                                                            >
                                                                Schedule
                                                            </button>
                                                        )}
                                                        {app.status === 'interviewed' && (
                                                            <button
                                                                onClick={() => hireCandidate(app._id)}
                                                                className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-[10px] uppercase tracking-widest shadow-md transition-all"
                                                            >
                                                                Hire
                                                            </button>
                                                        )}
                                                        {app.status !== 'rejected' && app.status !== 'hired' && (
                                                            <button
                                                                onClick={() => updateStatus(app._id, 'rejected')}
                                                                className="px-4 py-1.5 bg-white border border-slate-200 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200 text-slate-400 rounded-lg font-bold text-[10px] uppercase tracking-widest transition-all"
                                                            >
                                                                Reject
                                                            </button>
                                                        )}
                                                    </>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </Layout>
    );
};

export default ApplicantsList;
