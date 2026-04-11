import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import Layout from '../Layout';
import { useToast } from '../../context/ToastContext';
import { getCookie } from '../../utils/cookies';
import { BASE_SERVER_URL } from '../../services/api';

const ApplicantsList = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const toast = useToast();
    const [applicants, setApplicants] = useState([]);
    const [loading, setLoading] = useState(true);
    const [circular, setCircular] = useState(null);
    const [statusUpdating, setStatusUpdating] = useState(null);

    // UI States
    const [filterStatus, setFilterStatus] = useState('all');
    const [filterExperience, setFilterExperience] = useState('all');
    const [viewingApplicant, setViewingApplicant] = useState(null);
    const [fullProfile, setFullProfile] = useState(null);
    const [loadingProfile, setLoadingProfile] = useState(false);
    const [hiringApplicant, setHiringApplicant] = useState(null);
    const [hireSalary, setHireSalary] = useState('');
    const [hireJobDescription, setHireJobDescription] = useState('');

    useEffect(() => {
        if (!hiringApplicant) {
            setHireJobDescription('');
            return;
        }
        setHireJobDescription(circular?.description || '');
    }, [hiringApplicant, circular?.description]);

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
            const res = await axios.patch(`/api/recruitment/applications/${appId}/status`,
                { status, notes, interviewDate },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            const next = res.data;
            setApplicants(applicants.map(a => (a._id === appId ? { ...a, ...next } : a)));
            if (viewingApplicant && viewingApplicant._id === appId) {
                setViewingApplicant({ ...viewingApplicant, ...next });
            }
            toast.showToast(`Status updated: ${status}`, 'success');
        } catch (error) {
            console.error('Error updating status:', error);
            toast.showToast(error.response?.data?.message || 'Update failed', 'error');
        } finally {
            setStatusUpdating(null);
        }
    };

    const handleHireSubmit = async () => {
        if (!hireSalary) {
            toast.showToast('Please enter a starting salary.', 'error');
            return;
        }

        const appId = hiringApplicant._id;
        setStatusUpdating(appId);
        try {
            const token = getCookie('authToken');
            const res = await axios.post(`/api/recruitment/applications/${appId}/hire`,
                { salary: Number(hireSalary), roleDescription: hireJobDescription.trim() || '' },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            const updated = res.data.application || {};
            setApplicants(applicants.map(a => (a._id === appId ? { ...a, ...updated } : a)));
            toast.showToast(
                'Offer sent. The candidate was notified; they appear in Employees after they accept the offer letter.',
                'success'
            );
            setHiringApplicant(null);
            setHireSalary('');
            setHireJobDescription('');
            if (viewingApplicant && viewingApplicant._id === appId) {
                setViewingApplicant({ ...viewingApplicant, ...updated, status: updated.status || 'hired' });
            }
        } catch (error) {
            console.error('Error hiring candidate:', error);
            toast.showToast('Hiring failed', 'error');
        } finally {
            setStatusUpdating(null);
        }
    };

    const applicantUserId = (app) => {
        const u = app?.user;
        if (!u) return null;
        if (typeof u === 'object' && u._id != null) return String(u._id);
        return String(u);
    };

    const handleViewProfile = async (app) => {
        setViewingApplicant(app);
        setFullProfile(null);
        const userId = applicantUserId(app);
        if (userId) {
            setLoadingProfile(true);
            try {
                const token = getCookie('authToken');
                const res = await axios.get(`/api/users/${userId}`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setFullProfile(res.data);
            } catch (err) {
                console.error("Failed to load full profile", err);
            } finally {
                setLoadingProfile(false);
            }
        }
    };

    const formatDate = (dateStr) => {
        if (!dateStr) return '';
        try {
            const date = new Date(dateStr);
            if (isNaN(date.getTime())) return dateStr;
            return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
        } catch (e) {
            return dateStr;
        }
    };

    const getImageUrl = (url) => {
        if (!url) return '';
        if (url.startsWith('http')) return url;
        return `${BASE_SERVER_URL}${url.startsWith('/') ? '' : '/'}${url}`;
    };

    const filteredApplicants = applicants.filter(app => {
        if (filterStatus !== 'all' && app.status !== filterStatus) return false;

        if (filterExperience !== 'all') {
            const raw = Number(app.applicant?.experience);
            const exp = Number.isFinite(raw) ? raw : 0;
            if (filterExperience === '0-2' && exp > 2) return false;
            if (filterExperience === '3-5' && (exp < 3 || exp > 5)) return false;
            if (filterExperience === '5+' && exp < 6) return false;
        }
        return true;
    });

    return (
        <Layout>
            <div className="space-y-8 animate-in fade-in pb-20">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                    <div className="flex items-center gap-6">
                        <button
                            onClick={() => navigate('/recruitment')}
                            className="w-10 h-10 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-center text-slate-400 hover:text-indigo-600 transition-all shrink-0"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
                        </button>
                        <div>
                            <h1 className="text-xl font-bold text-slate-900 tracking-tight">{circular?.title || 'Loading...'}</h1>
                            <div className="flex items-center gap-3 mt-1">
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{filteredApplicants.length} Applicants</span>
                                <span className="w-1 h-1 bg-slate-300 rounded-full" />
                                <span className="text-[10px] font-bold text-indigo-500 uppercase tracking-widest">{circular?.role}</span>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-4 shrink-0">
                        <select
                            value={filterStatus}
                            onChange={e => setFilterStatus(e.target.value)}
                            className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-xs font-bold text-slate-600 outline-none hover:border-indigo-200 focus:border-indigo-500 transition-all"
                        >
                            <option value="all">Every Status</option>
                            <option value="pending">Pending</option>
                            <option value="shortlisted">Shortlisted</option>
                            <option value="interviewed">Interviewed</option>
                            <option value="hired">Hired</option>
                            <option value="rejected">Rejected</option>
                        </select>
                        <select
                            value={filterExperience}
                            onChange={e => setFilterExperience(e.target.value)}
                            className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-xs font-bold text-slate-600 outline-none hover:border-indigo-200 focus:border-indigo-500 transition-all"
                        >
                            <option value="all">Any Experience</option>
                            <option value="0-2">Entry (0-2 Yrs)</option>
                            <option value="3-5">Mid (3-5 Yrs)</option>
                            <option value="5+">Senior (5+ Yrs)</option>
                        </select>
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
                                                <div className="text-[10px] font-bold text-slate-400 uppercase">Loading Data...</div>
                                            </div>
                                        </td>
                                    </tr>
                                ) : filteredApplicants.length === 0 ? (
                                    <tr>
                                        <td colSpan="5" className="px-8 py-20 text-center">
                                            <div className="text-sm font-bold text-slate-400 italic">No applications match your criteria yet.</div>
                                        </td>
                                    </tr>
                                ) : filteredApplicants.map((app) => (
                                    <tr key={app._id} className="hover:bg-slate-50 transition-all duration-200 group border-b border-slate-50 last:border-0">
                                        <td className="px-8 py-6">
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 bg-slate-100 text-slate-500 rounded-xl flex items-center justify-center font-bold text-lg group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-colors">
                                                    {app.applicant.name.charAt(0)}
                                                </div>
                                                <div>
                                                    <div
                                                        className="font-bold text-slate-900 text-sm group-hover:text-indigo-600 transition-colors tracking-tight cursor-pointer"
                                                        onClick={() => handleViewProfile(app)}
                                                    >
                                                        {app.applicant.name}
                                                    </div>
                                                    <div className="text-[10px] text-slate-400 font-bold uppercase tracking-tight">{app.applicant.email}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6 text-center text-xs font-bold text-slate-600">
                                            {app.applicant.experience} Years
                                        </td>
                                        <td className="px-8 py-6">
                                            <div className="flex flex-wrap gap-1.5 max-w-[280px]">
                                                {(app.applicant.skills || []).slice(0, 4).map((s, i) => (
                                                    <span key={i} className="px-2 py-0.5 bg-slate-100 border border-slate-200 text-[9px] font-bold text-slate-500 rounded uppercase tracking-wider">#{s}</span>
                                                ))}
                                                {(app.applicant.skills || []).length > 4 && <span className="text-[9px] font-bold text-slate-300">+{(app.applicant.skills || []).length - 4}</span>}
                                            </div>
                                        </td>
                                        <td className="px-8 py-6 text-center">
                                            <span className={`px-4 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest border transition-all inline-block min-w-[120px] ${app.status === 'hired' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                                                app.status === 'shortlisted' ? 'bg-indigo-50 text-indigo-600 border-indigo-100' :
                                                    app.status === 'rejected' ? 'bg-rose-50 text-rose-600 border-rose-100' :
                                                        'bg-slate-50 text-slate-500 border-slate-200'
                                                }`}>
                                                {app.status === 'hired' && app.offerLetterStatus === 'pending'
                                                    ? 'Hired · offer pending'
                                                    : app.status === 'hired' && app.offerLetterStatus === 'accepted'
                                                        ? 'Hired · joined'
                                                        : app.status}
                                            </span>
                                        </td>
                                        <td className="px-8 py-6 text-right">
                                            <div className="flex justify-end gap-2 transition-all duration-300">
                                                {app._id === statusUpdating ? (
                                                    <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                                                ) : (
                                                    <>
                                                        <button
                                                            onClick={() => handleViewProfile(app)}
                                                            className="w-8 h-8 bg-white border border-slate-200 rounded-lg flex items-center justify-center text-slate-400 hover:text-indigo-600 hover:border-indigo-200 transition-all shadow-sm"
                                                            title="View Profile"
                                                        >
                                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                                                        </button>
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
                                                                onClick={() => setHiringApplicant(app)}
                                                                className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-[10px] uppercase tracking-widest shadow-md transition-all"
                                                            >
                                                                Hire
                                                            </button>
                                                        )}
                                                        {app.status === 'hired' && (
                                                            <button
                                                                onClick={() => {
                                                                    const extra = app.offerLetterStatus === 'accepted'
                                                                        ? ' If they already joined, they will be removed from the company employee list.'
                                                                        : '';
                                                                    if (window.confirm(`Move this candidate back to Shortlisted? You can send a new hire offer afterward.${extra}`)) {
                                                                        updateStatus(app._id, 'shortlisted');
                                                                    }
                                                                }}
                                                                className="px-4 py-1.5 bg-white border border-indigo-200 text-indigo-600 hover:bg-indigo-50 rounded-lg font-bold text-[10px] uppercase tracking-widest transition-all shadow-sm"
                                                            >
                                                                Back to shortlist
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

            {/* Profile View Modal */}
            {viewingApplicant && (() => {
                const profileObj = fullProfile?.profile || {};
                const dName = fullProfile?.name || viewingApplicant.applicant.name;
                const dEmail = fullProfile?.email || viewingApplicant.applicant.email;
                const coverPhotoUrl = profileObj.coverPhoto ? getImageUrl(profileObj.coverPhoto) : null;
                const profilePicUrl = profileObj.profilePicture ? getImageUrl(profileObj.profilePicture) : null;
                const profileRoleCount = profileObj.experience?.length;
                const appYearsRaw = Number(viewingApplicant.applicant?.experience);
                const appYears = Number.isFinite(appYearsRaw) ? appYearsRaw : null;
                const expSummary = profileRoleCount
                    ? `${profileRoleCount} role${profileRoleCount === 1 ? '' : 's'} (profile)`
                    : (appYears !== null ? `${appYears} yr${appYears === 1 ? '' : 's'} (application)` : '—');
                const dSkills = profileObj.skills?.length ? profileObj.skills : (viewingApplicant.applicant.skills || []);
                const rawResume = viewingApplicant.applicant.resumeUrl || viewingApplicant.applicant.resume;
                const resumeHref = rawResume
                    ? (String(rawResume).startsWith('http') ? rawResume : getImageUrl(rawResume))
                    : '';

                return (
                    <div className="fixed inset-0 z-50 flex flex-col bg-[#F8FAFC] animate-in fade-in slide-in-from-bottom-8">
                        <div className="h-[72px] bg-white border-b border-slate-200 px-8 flex items-center justify-between shrink-0 shadow-sm">
                            <div className="flex items-center gap-6">
                                <button onClick={() => { setViewingApplicant(null); setFullProfile(null); }} className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-200 hover:bg-slate-100 flex items-center justify-center text-slate-500 transition-colors shrink-0">
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7" /></svg>
                                </button>
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 font-bold flex items-center justify-center text-xl shadow-inner border border-indigo-100/50 overflow-hidden">
                                        {profilePicUrl ? <img src={profilePicUrl} alt="" className="w-full h-full object-cover" /> : dName.charAt(0)}
                                    </div>
                                    <div>
                                        <h2 className="text-base font-bold text-slate-900 leading-tight tracking-tight">{dName}</h2>
                                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{dEmail}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center gap-3">
                                {viewingApplicant.status === 'pending' && (
                                    <button onClick={() => { updateStatus(viewingApplicant._id, 'shortlisted'); setViewingApplicant({ ...viewingApplicant, status: 'shortlisted' }); }} className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all shadow-md">
                                        Make Shortlist
                                    </button>
                                )}
                                {['pending', 'shortlisted', 'interviewed'].includes(viewingApplicant.status) && (
                                    <button onClick={() => { updateStatus(viewingApplicant._id, 'rejected'); setViewingApplicant({ ...viewingApplicant, status: 'rejected' }); }} className="px-6 py-2.5 bg-white border border-slate-200 text-rose-500 rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-rose-50 hover:border-rose-200 transition-all">
                                        Decline
                                    </button>
                                )}
                                {['shortlisted', 'interviewed'].includes(viewingApplicant.status) && (
                                    <button onClick={() => setHiringApplicant(viewingApplicant)} className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all shadow-md flex items-center gap-2">
                                        <span className="text-sm">🎉</span> Hire Candidate
                                    </button>
                                )}
                                {viewingApplicant.status === 'hired' && (
                                    <button
                                        onClick={() => {
                                            const extra = viewingApplicant.offerLetterStatus === 'accepted'
                                                ? ' If they already joined, they will be removed from the company employee list.'
                                                : '';
                                            if (window.confirm(`Move back to Shortlisted? You can hire again afterward.${extra}`)) {
                                                updateStatus(viewingApplicant._id, 'shortlisted');
                                            }
                                        }}
                                        className="px-6 py-2.5 bg-white border border-indigo-200 text-indigo-600 hover:bg-indigo-50 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all shadow-sm"
                                    >
                                        Back to shortlist
                                    </button>
                                )}
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto p-8 relative">
                            {loadingProfile && (
                                <div className="absolute inset-0 z-10 bg-white/50 backdrop-blur-sm flex items-center justify-center">
                                    <div className="w-10 h-10 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                                </div>
                            )}
                            <div className="max-w-4xl mx-auto space-y-8 pb-32">
                                <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
                                    <div
                                        className={`h-40 bg-gradient-to-r ${coverPhotoUrl ? '' : 'from-slate-900 to-indigo-900'}`}
                                        style={coverPhotoUrl ? { backgroundImage: `url(${coverPhotoUrl})`, backgroundSize: 'cover', backgroundPosition: 'center' } : {}}
                                    />
                                    <div className="px-10 pb-10 relative">
                                        <div className="flex gap-6 items-end -mt-12 mb-8">
                                            <div className="w-32 h-32 rounded-3xl border-4 border-white shadow-lg bg-slate-100 flex items-center justify-center text-5xl font-bold text-indigo-600 overflow-hidden z-10">
                                                {profilePicUrl ? <img src={profilePicUrl} alt="" className="w-full h-full object-cover" /> : dName.charAt(0)}
                                            </div>
                                            <div className="pb-3 flex-1 flex justify-between items-end">
                                                <div>
                                                    <h1 className="text-3xl font-bold text-slate-900 tracking-tight">{dName}</h1>
                                                    <p className="text-sm font-bold text-indigo-600 mt-1">{profileObj.title || 'Professional Applicant'}</p>
                                                    <p className="text-xs font-bold text-slate-400 mt-2 uppercase tracking-widest border border-slate-200 rounded-lg inline-block px-3 py-1 bg-slate-50">Status: <span className={viewingApplicant.status === 'hired' ? 'text-emerald-500' : 'text-indigo-500'}>
                                                        {viewingApplicant.status === 'hired' && viewingApplicant.offerLetterStatus === 'pending'
                                                            ? 'hired · awaiting offer acceptance'
                                                            : viewingApplicant.status === 'hired' && viewingApplicant.offerLetterStatus === 'accepted'
                                                                ? 'hired · employee joined'
                                                                : viewingApplicant.status}
                                                    </span></p>
                                                </div>
                                            </div>
                                        </div>

                                        {profileObj.summary && (
                                            <div className="mb-6 pb-6 border-b border-slate-100">
                                                <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Professional Summary</h4>
                                                <div className="text-sm text-slate-600 leading-relaxed font-medium" dangerouslySetInnerHTML={{ __html: profileObj.summary }} />
                                            </div>
                                        )}

                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 py-6 border-y border-slate-100 mb-6">
                                            <div>
                                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Experience</p>
                                                <p className="text-sm font-bold text-slate-900 mt-1">{expSummary}</p>
                                            </div>
                                            <div className="col-span-3">
                                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Resume Document</p>
                                                {resumeHref ? (
                                                    <a href={resumeHref} target="_blank" rel="noreferrer" className="text-sm font-bold text-indigo-600 hover:text-indigo-700 hover:underline mt-1 flex items-center gap-2">
                                                        📄 View Attached Application Resume
                                                    </a>
                                                ) : (
                                                    <p className="text-sm font-bold text-slate-500 mt-1 italic">Not Provided in Application</p>
                                                )}
                                            </div>
                                        </div>

                                        {(profileObj.phone || profileObj.location || profileObj.linkedin || viewingApplicant.applicant?.phone) && (
                                            <div className="mb-8 pb-8 border-b border-slate-100">
                                                <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Contact & links</h4>
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-slate-700 font-medium">
                                                    {(profileObj.phone || viewingApplicant.applicant?.phone) && (
                                                        <p><span className="text-slate-400 font-bold text-[10px] uppercase tracking-widest block mb-1">Phone</span>{profileObj.phone || viewingApplicant.applicant.phone}</p>
                                                    )}
                                                    {profileObj.location && (
                                                        <p><span className="text-slate-400 font-bold text-[10px] uppercase tracking-widest block mb-1">Location</span>{profileObj.location}</p>
                                                    )}
                                                    {profileObj.linkedin && (
                                                        <p className="md:col-span-2">
                                                            <span className="text-slate-400 font-bold text-[10px] uppercase tracking-widest block mb-1">LinkedIn</span>
                                                            <a href={profileObj.linkedin} target="_blank" rel="noreferrer" className="text-indigo-600 font-bold hover:underline break-all">{profileObj.linkedin}</a>
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                        )}

                                        {dSkills && dSkills.length > 0 && (
                                            <div className="mt-8">
                                                <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4">Technical Skills</h4>
                                                <div className="flex flex-wrap gap-2">
                                                    {dSkills.map((s, i) => (
                                                        <span key={i} className="px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 tracking-wide">{s}</span>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {profileObj.experience && profileObj.experience.length > 0 && (
                                    <div className="space-y-4">
                                        <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest px-2">Work Experience</h2>
                                        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                                            {profileObj.experience.map((exp, i) => (
                                                <div key={i} className="p-8 border-b border-slate-100 last:border-0 hover:bg-slate-50 transition-colors">
                                                    <div className="flex flex-col md:flex-row justify-between items-start mb-4">
                                                        <div>
                                                            <h3 className="text-lg font-bold text-slate-900">{exp.position}</h3>
                                                            <p className="text-sm font-bold text-indigo-600 mt-1">{exp.company}</p>
                                                        </div>
                                                        <div className="px-4 py-1.5 bg-slate-100 border border-slate-200 rounded-lg text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-2 md:mt-0">
                                                            {formatDate(exp.startDate)} — {exp.current ? 'Present' : formatDate(exp.endDate)}
                                                        </div>
                                                    </div>
                                                    <div className="text-sm text-slate-600 leading-relaxed font-medium" dangerouslySetInnerHTML={{ __html: exp.description }} />
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {profileObj.education && profileObj.education.length > 0 && (
                                    <div className="space-y-4">
                                        <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest px-2">Education</h2>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            {profileObj.education.map((edu, i) => (
                                                <div key={i} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                                                    <h3 className="text-sm font-bold text-slate-900">{edu.degree}</h3>
                                                    <p className="text-xs font-bold text-indigo-600 mt-1 mb-2">{edu.institution}</p>
                                                    <p className="text-[11px] text-slate-500 font-medium mb-3">{[edu.level, edu.stream, edu.field].filter(Boolean).join(' · ')}</p>
                                                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                                        {formatDate(edu.startDate)} — {edu.current ? 'Present' : formatDate(edu.endDate)}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {profileObj.projects && profileObj.projects.length > 0 && (
                                    <div className="space-y-4">
                                        <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest px-2">Projects</h2>
                                        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                                            {profileObj.projects.map((proj, i) => (
                                                <div key={proj._id || i} className="p-8 border-b border-slate-100 last:border-0 hover:bg-slate-50 transition-colors">
                                                    <div className="flex flex-col md:flex-row justify-between items-start gap-4 mb-3">
                                                        <h3 className="text-lg font-bold text-slate-900">{proj.name}</h3>
                                                        {proj.url && (
                                                            <a href={proj.url} target="_blank" rel="noreferrer" className="text-xs font-bold text-indigo-600 hover:underline break-all shrink-0">Open link</a>
                                                        )}
                                                    </div>
                                                    {proj.description && (
                                                        <div className="text-sm text-slate-600 leading-relaxed font-medium" dangerouslySetInnerHTML={{ __html: proj.description }} />
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                );
            })()}

            {/* Hire Action Modal */}
            {hiringApplicant && (
                <div className="fixed inset-0 z-[60] bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh] border border-slate-200 animate-in zoom-in-95">
                        <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                            <div>
                                <h3 className="text-xl font-bold text-slate-900 tracking-tight">Hire {hiringApplicant.applicant.name}</h3>
                                <p className="text-xs font-bold text-slate-400 tracking-widest uppercase mt-1">Determine final offer details</p>
                            </div>
                            <button onClick={() => setHiringApplicant(null)} className="w-10 h-10 bg-white border border-slate-200 rounded-xl flex items-center justify-center text-slate-400 hover:text-slate-900 transition-all shadow-sm">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                        </div>

                        <div className="p-8 overflow-y-auto flex-1 space-y-8">
                            <div className="space-y-4">
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest inline-flex items-center gap-2">
                                    <span className="w-5 h-5 rounded bg-indigo-50 text-indigo-600 flex items-center justify-center">1</span>
                                    Starting Monthly Salary (USD)
                                </label>
                                <input
                                    type="number"
                                    value={hireSalary}
                                    onChange={e => setHireSalary(e.target.value)}
                                    className="w-full bg-white border-2 border-slate-200 p-4 rounded-xl font-bold text-lg text-slate-900 outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 transition-all placeholder:text-slate-300"
                                    placeholder="Enter proposed salary e.g. 5000"
                                    autoFocus
                                />
                                <div className="px-4 py-3 bg-emerald-50 border border-emerald-100 rounded-lg text-xs font-bold text-emerald-700">
                                    Budgeted Range: ${circular?.salaryRange?.min?.toLocaleString() || 0} — ${circular?.salaryRange?.max?.toLocaleString() || 0}
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div className="text-xs font-bold text-slate-500 uppercase tracking-widest inline-flex items-center gap-2">
                                    <span className="w-5 h-5 rounded bg-indigo-50 text-indigo-600 flex items-center justify-center">2</span>
                                    Role description (to be attached)
                                </div>
                                <div className="rounded-xl border-2 border-slate-200 overflow-hidden bg-white focus-within:border-emerald-500 focus-within:ring-4 focus-within:ring-emerald-500/10 transition-all [&_.ql-toolbar]:border-slate-200 [&_.ql-toolbar]:bg-slate-50 [&_.ql-container]:border-slate-200 [&_.ql-editor]:text-sm [&_.ql-editor]:text-slate-800">
                                    <div className="h-64">
                                        <ReactQuill
                                            theme="snow"
                                            value={hireJobDescription}
                                            onChange={setHireJobDescription}
                                            className="h-48"
                                            placeholder="Edit the job description for this offer (pre-filled from the circular)."
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="p-6 border-t border-slate-100 flex justify-end gap-4 bg-slate-50">
                            <button onClick={() => setHiringApplicant(null)} className="px-6 py-3 bg-white text-slate-500 border border-slate-200 rounded-xl font-bold text-xs uppercase tracking-widest hover:text-slate-900 hover:border-slate-300 transition-all">Cancel</button>
                            <button
                                onClick={handleHireSubmit}
                                className="px-8 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs uppercase tracking-widest shadow-lg shadow-emerald-600/30 transition-all flex items-center gap-3"
                            >
                                <span>🎉</span> Confirm Offer
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </Layout>
    );
};

export default ApplicantsList;
