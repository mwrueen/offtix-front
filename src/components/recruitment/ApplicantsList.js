import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';
import HireCandidateModal from './HireCandidateModal';
import Layout from '../layout/Layout';
import PageHeader from '../layout/PageHeader';
import { Card, Button, Badge } from '../ui';
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

    // UI States
    const [filterStatus, setFilterStatus] = useState('all');
    const [filterExperience, setFilterExperience] = useState('all');
    const [viewingApplicant, setViewingApplicant] = useState(null);
    const [hiringApplicant, setHiringApplicant] = useState(null);
    const [openScreeningId, setOpenScreeningId] = useState(null);

    // Interview states
    const [interviewingApplicant, setInterviewingApplicant] = useState(null);
    const [interviewDate, setInterviewDate] = useState('');
    const [interviewTime, setInterviewTime] = useState('');
    const [interviewDetails, setInterviewDetails] = useState('');

    const handleInterviewSubmit = async () => {
        if (!interviewDate || !interviewTime) {
            toast.showToast('Please select a date and time.', 'error');
            return;
        }
        const dt = `${interviewDate}T${interviewTime}`;
        await updateStatus(interviewingApplicant._id, 'interviewed', interviewDetails, dt);
        setInterviewingApplicant(null);
        setInterviewDate('');
        setInterviewTime('');
        setInterviewDetails('');
    };

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

    const handleViewProfile = (app) => {
        navigate(`/recruitment/applications/${app._id}`, { state: { application: app } });
    };

    const hasCircularQuestions = Array.isArray(circular?.questions) && circular.questions.length > 0;

    const formatScreeningAnswer = (val) => {
        if (val === null || val === undefined || val === '') return '—';
        if (Array.isArray(val)) return val.filter(Boolean).join(', ') || '—';
        if (typeof val === 'object') return JSON.stringify(val);
        return String(val);
    };

    const getScreeningAnswer = (app, q, index) => {
        const answers = app.answers || [];
        const qid = q._id != null ? String(q._id) : '';
        let match = answers.find((a) => a.questionId && String(a.questionId) === qid);
        if (!match) {
            match = answers.find(
                (a) => (a.questionText || '').trim() === (q.question || '').trim()
            );
        }
        if (!match && answers[index] != null) match = answers[index];
        if (!match) return '—';
        return formatScreeningAnswer(match.answer);
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

    const questionTypeLabel = (t) => {
        const m = { text: 'Short text', 'long-text': 'Long text', selection: 'Dropdown', radio: 'Single choice', checkbox: 'Multiple choice' };
        return m[t] || t || 'Text';
    };

    return (
        <Layout wide>
            <div className="w-full px-0 py-2 pb-24 sm:px-2 lg:px-4">
                <PageHeader
                    title={circular?.title || 'Applicants'}
                    subtitle={circular?.role ? `${circular.role} · ${circular.location}` : circular?.location}
                    icon={
                        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                    }
                    stats={[
                        { label: 'Total Applicants', value: applicants.length },
                        { label: 'Filtered', value: filteredApplicants.length }
                    ]}
                    actions={
                        <Button variant="outline" onClick={() => navigate('/recruitment')}>
                            Back to Recruitment
                        </Button>
                    }
                />

                <Card padding={false} className="overflow-hidden">
                    <div className="p-4 border-b border-gray-200 bg-gray-50 flex flex-col sm:flex-row justify-between items-center gap-4">
                        {hasCircularQuestions ? (
                            <p className="text-sm text-slate-600">
                                Use <span className="font-medium text-slate-800">View screening answers</span> under each applicant.
                            </p>
                        ) : (
                            <p className="text-sm text-slate-600">Manage candidates and view their profiles.</p>
                        )}
                        <div className="flex flex-shrink-0 flex-wrap items-center gap-3">
                            <label className="sr-only" htmlFor="flt-status">Status</label>
                            <select
                                id="flt-status"
                                value={filterStatus}
                                onChange={(e) => setFilterStatus(e.target.value)}
                                className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 shadow-sm outline-none transition-[border-color,box-shadow] duration-150 hover:border-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                            >
                                <option value="all">All statuses</option>
                                <option value="pending">Pending</option>
                                <option value="shortlisted">Shortlisted</option>
                                <option value="interviewed">Interviewed</option>
                                <option value="hired">Hired</option>
                                <option value="rejected">Rejected</option>
                            </select>
                            <label className="sr-only" htmlFor="flt-exp">Experience</label>
                            <select
                                id="flt-exp"
                                value={filterExperience}
                                onChange={(e) => setFilterExperience(e.target.value)}
                                className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 shadow-sm outline-none transition-[border-color,box-shadow] duration-150 hover:border-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                            >
                                <option value="all">Any experience</option>
                                <option value="0-2">0–2 years</option>
                                <option value="3-5">3–5 years</option>
                                <option value="5+">5+ years</option>
                            </select>
                        </div>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[720px] text-left text-sm">
                            <thead>
                                <tr className="border-b border-slate-200 bg-slate-50">
                                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 sm:px-6">Candidate</th>
                                    <th className="whitespace-nowrap px-4 py-3 text-center text-xs font-semibold uppercase tracking-wide text-slate-500 sm:px-6">Exp.</th>
                                    <th className="min-w-[12rem] px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 sm:px-6">Skills</th>
                                    <th className="whitespace-nowrap px-4 py-3 text-center text-xs font-semibold uppercase tracking-wide text-slate-500 sm:px-6">Status</th>
                                    <th className="whitespace-nowrap px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500 sm:px-6">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    <tr>
                                        <td colSpan="5" className="px-4 py-16 text-center text-slate-500 sm:px-6">
                                            <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-slate-200 border-t-indigo-600" />
                                            <p className="mt-3 text-sm">Loading applicants…</p>
                                        </td>
                                    </tr>
                                ) : filteredApplicants.length === 0 ? (
                                    <tr>
                                        <td colSpan="5" className="px-4 py-16 text-center text-slate-600 sm:px-6">
                                            No applications match these filters.
                                        </td>
                                    </tr>
                                ) : (
                                    filteredApplicants.map((app) => (
                                        <React.Fragment key={app._id}>
                                            <tr className="group border-b border-slate-100 transition-colors duration-150 hover:bg-slate-50">
                                                <td className="px-4 py-4 align-top sm:px-6">
                                                    <div className="flex items-start gap-3">
                                                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-slate-100 text-sm font-semibold text-slate-600 transition-colors duration-150 group-hover:bg-slate-200/90">
                                                            {app.applicant.name.charAt(0)}
                                                        </div>
                                                        <div className="min-w-0">
                                                            <button
                                                                type="button"
                                                                onClick={() => handleViewProfile(app)}
                                                                className="text-left font-medium text-slate-900 transition-colors duration-150 hover:text-indigo-600"
                                                            >
                                                                {app.applicant.name}
                                                            </button>
                                                            <div className="truncate text-xs text-slate-500">{app.applicant.email}</div>
                                                            {hasCircularQuestions && (
                                                                <button
                                                                    type="button"
                                                                    onClick={() => setOpenScreeningId((id) => (id === app._id ? null : app._id))}
                                                                    className="mt-2 text-xs font-medium text-indigo-600 transition-colors duration-150 hover:text-indigo-800"
                                                                >
                                                                    {openScreeningId === app._id ? 'Hide answers' : 'View screening answers'}
                                                                </button>
                                                            )}
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-4 text-center text-slate-700 align-top sm:px-6">
                                                    {app.applicant.experience != null ? `${app.applicant.experience} yrs` : '—'}
                                                </td>
                                                <td className="px-4 py-4 align-top sm:px-6">
                                                    <div className="flex flex-wrap gap-1.5">
                                                        {(app.applicant.skills || []).slice(0, 8).map((s, i) => (
                                                            <span key={i} className="rounded border border-slate-200 bg-slate-50 px-2 py-0.5 text-xs text-slate-700 transition-colors duration-150">{s}</span>
                                                        ))}
                                                        {(app.applicant.skills || []).length > 8 && (
                                                            <span className="self-center text-xs text-slate-400">+{(app.applicant.skills || []).length - 8}</span>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="px-4 py-4 text-center align-top sm:px-6">
                                                    <Badge
                                                        variant={
                                                            app.status === 'hired'
                                                                ? 'success'
                                                                : app.status === 'shortlisted'
                                                                    ? 'primary'
                                                                    : app.status === 'rejected'
                                                                        ? 'danger'
                                                                        : 'default'
                                                        }
                                                    >
                                                        {app.status === 'hired' && app.offerLetterStatus === 'pending'
                                                            ? 'Offer pending'
                                                            : app.status === 'hired' && app.offerLetterStatus === 'accepted'
                                                                ? 'Joined'
                                                                : app.status}
                                                    </Badge>
                                                </td>
                                                <td className="px-4 py-4 text-right align-top sm:px-6">
                                                    <div className="flex flex-wrap justify-end gap-2">
                                                        {app._id === statusUpdating ? (
                                                            <div className="h-6 w-6 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent" />
                                                        ) : (
                                                            <>
                                                                <Button
                                                                    variant="outline"
                                                                    size="sm"
                                                                    onClick={() => handleViewProfile(app)}
                                                                    title="Profile"
                                                                >
                                                                    Profile
                                                                </Button>
                                                                {app.status === 'pending' && (
                                                                    <Button
                                                                        variant="primary"
                                                                        size="sm"
                                                                        onClick={() => updateStatus(app._id, 'shortlisted')}
                                                                    >
                                                                        Shortlist
                                                                    </Button>
                                                                )}
                                                                {app.status === 'shortlisted' && (
                                                                    <Button
                                                                        variant="primary"
                                                                        size="sm"
                                                                        onClick={() => setInterviewingApplicant(app)}
                                                                    >
                                                                        Interview
                                                                    </Button>
                                                                )}
                                                                {app.status === 'interviewed' && (
                                                                    <Button
                                                                        variant="primary"
                                                                        size="sm"
                                                                        className="!bg-emerald-600 hover:!bg-emerald-700 !border-0"
                                                                        onClick={() => setHiringApplicant(app)}
                                                                    >
                                                                        Hire
                                                                    </Button>
                                                                )}
                                                                {app.status === 'hired' && (
                                                                    <Button
                                                                        variant="outline"
                                                                        size="sm"
                                                                        onClick={() => {
                                                                            const extra =
                                                                                app.offerLetterStatus === 'accepted'
                                                                                    ? ' If they already joined, they will be removed from the employee list.'
                                                                                    : '';
                                                                            if (
                                                                                window.confirm(
                                                                                    `Move back to shortlisted? You can send a new offer later.${extra}`
                                                                                )
                                                                            ) {
                                                                                updateStatus(app._id, 'shortlisted');
                                                                            }
                                                                        }}
                                                                    >
                                                                        Un-hire
                                                                    </Button>
                                                                )}
                                                                {app.status !== 'rejected' && app.status !== 'hired' && (
                                                                    <Button
                                                                        variant="danger"
                                                                        size="sm"
                                                                        onClick={() => updateStatus(app._id, 'rejected')}
                                                                    >
                                                                        Reject
                                                                    </Button>
                                                                )}
                                                            </>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                            {hasCircularQuestions && openScreeningId === app._id && (
                                                <tr className="border-b border-slate-100 bg-slate-50 animate-in fade-in slide-in-from-top-1 duration-200">
                                                    <td colSpan="5" className="px-4 py-4 sm:px-6">
                                                        <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                                                            Screening responses
                                                        </p>
                                                        <div className="space-y-3">
                                                            {circular.questions.map((q, idx) => (
                                                                <div
                                                                    key={q._id || idx}
                                                                    className="rounded-md border border-slate-200 bg-white px-3 py-2.5 shadow-sm transition-shadow duration-150 hover:shadow"
                                                                >
                                                                    <p className="text-xs text-slate-500">
                                                                        Q{idx + 1} · {questionTypeLabel(q.type)}
                                                                    </p>
                                                                    <p className="mt-0.5 text-sm font-medium text-slate-900">{q.question}</p>
                                                                    <p className="mt-2 whitespace-pre-wrap text-sm text-slate-700">
                                                                        {getScreeningAnswer(app, q, idx)}
                                                                    </p>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </td>
                                                </tr>
                                            )}
                                        </React.Fragment>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </Card>
            </div>

            {/* Interview Modal */}
            {interviewingApplicant && (
                <div className="fixed inset-0 z-[60] bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col border border-slate-200 animate-in zoom-in-95">
                        <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                            <div>
                                <h3 className="text-xl font-bold text-slate-900 tracking-tight">Schedule Interview</h3>
                                <p className="text-xs font-bold text-slate-400 tracking-widest uppercase mt-1">For {interviewingApplicant.applicant?.name || 'Candidate'}</p>
                            </div>
                            <button onClick={() => setInterviewingApplicant(null)} className="w-10 h-10 bg-white border border-slate-200 rounded-xl flex items-center justify-center text-slate-400 hover:text-slate-900 transition-all shadow-sm">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                        </div>
                        <div className="p-8 overflow-y-auto space-y-6">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Date</label>
                                    <input 
                                        type="date"
                                        value={interviewDate}
                                        onChange={e => setInterviewDate(e.target.value)}
                                        className="w-full bg-white border-2 border-slate-200 px-4 py-3 rounded-xl font-medium text-slate-900 outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Time</label>
                                    <input 
                                        type="time"
                                        value={interviewTime}
                                        onChange={e => setInterviewTime(e.target.value)}
                                        className="w-full bg-white border-2 border-slate-200 px-4 py-3 rounded-xl font-medium text-slate-900 outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all"
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">Meeting Link / Location / Notes</label>
                                <textarea
                                    value={interviewDetails}
                                    onChange={e => setInterviewDetails(e.target.value)}
                                    placeholder="e.g. Google Meet link or office address"
                                    className="w-full bg-white border-2 border-slate-200 px-4 py-3 rounded-xl font-medium text-slate-900 outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all resize-y min-h-[100px]"
                                />
                            </div>
                        </div>
                        <div className="p-6 border-t border-slate-100 flex justify-end gap-4 bg-slate-50">
                            <Button variant="outline" onClick={() => setInterviewingApplicant(null)}>Cancel</Button>
                            <Button variant="primary" onClick={handleInterviewSubmit}>Send Invitation</Button>
                        </div>
                    </div>
                </div>
            )}

            {/* Hire Candidate Form Modal */}
            <HireCandidateModal
                isOpen={!!hiringApplicant}
                onClose={() => setHiringApplicant(null)}
                application={{ ...hiringApplicant, jobCircular: circular }}
                onSuccess={(updatedApp) => {
                    const appId = updatedApp._id;
                    setApplicants(applicants.map(a => (a._id === appId ? { ...a, ...updatedApp } : a)));
                    if (viewingApplicant && viewingApplicant._id === appId) {
                        setViewingApplicant({ ...viewingApplicant, ...updatedApp });
                    }
                }}
            />
        </Layout>
    );
};

export default ApplicantsList;
