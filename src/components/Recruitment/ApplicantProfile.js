import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import Layout from '../Layout';
import PageHeader from '../PageHeader';
import { Button, Badge } from '../ui';
import { useToast } from '../../context/ToastContext';
import { getCookie } from '../../utils/cookies';
import { BASE_SERVER_URL } from '../../services/api';
import HireCandidateModal from './HireCandidateModal';

const ApplicantProfile = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const toast = useToast();
    const location = useLocation();

    const [application, setApplication] = useState(location.state?.application || null);
    const [fullProfile, setFullProfile] = useState(null);
    const [loading, setLoading] = useState(!location.state?.application);
    const [statusUpdating, setStatusUpdating] = useState(false);

    // Hiring & Interview Modals (Simplified or ported)
    // To keep this page clean, we will use basic prompts or simplified handlers
    // as requested by the image, it just shows 'Decline' and 'Hire Candidate' buttons.
    
    // We will port the exact modal states we need
    const [hiringApplicant, setHiringApplicant] = useState(null);

    useEffect(() => {
        if (!application) {
            fetchApplication();
        } else {
            loadUserProfile(application);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [id]);

    const fetchApplication = async () => {
        setLoading(true);
        try {
            const token = getCookie('authToken');
            const res = await axios.get(`/api/recruitment/applications/${id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setApplication(res.data);
            loadUserProfile(res.data);
        } catch (error) {
            console.error('Failed to fetch application:', error);
            toast.showToast('Failed to load application details', 'error');
            navigate('/recruitment');
        } finally {
            setLoading(false);
        }
    };

    const loadUserProfile = async (app) => {
        const u = app?.user;
        let userId = null;
        if (u) {
            userId = typeof u === 'object' && u._id ? String(u._id) : String(u);
        }
        
        if (userId) {
            try {
                const token = getCookie('authToken');
                const res = await axios.get(`/api/users/${userId}`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setFullProfile(res.data);
            } catch (err) {
                console.error("Failed to load full profile", err);
            }
        }
    };

    const updateStatus = async (status, notes = '', interviewDate = null) => {
        setStatusUpdating(true);
        try {
            const token = getCookie('authToken');
            const payload = { status, notes };
            if (interviewDate) payload.interviewDate = interviewDate;

            const res = await axios.patch(`/api/recruitment/applications/${application._id}/status`, payload, {
                headers: { Authorization: `Bearer ${token}` }
            });
            toast.showToast('Status updated successfully', 'success');
            setApplication({ ...application, ...res.data, jobCircular: application.jobCircular });
        } catch (error) {
            console.error('Error updating status:', error);
            toast.showToast('Failed to update status', 'error');
        } finally {
            setStatusUpdating(false);
        }
    };



    const getImageUrl = (url) => {
        if (!url) return '';
        if (url.startsWith('http')) return url;
        return `${BASE_SERVER_URL}${url}`;
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

    if (loading || !application) {
        return (
            <Layout>
                <div className="flex h-64 items-center justify-center">
                    <div className="w-8 h-8 border-4 border-indigo-600 border-t-white rounded-full animate-spin"></div>
                </div>
            </Layout>
        );
    }

    const viewingApplicant = application;
    const profileObj = fullProfile?.profile || {};
    const dName = fullProfile?.name || viewingApplicant.applicant?.name || 'Unknown';
    const dEmail = fullProfile?.email || viewingApplicant.applicant?.email || '';
    const coverPhotoUrl = profileObj.coverPhoto ? getImageUrl(profileObj.coverPhoto) : null;
    const profilePicUrl = profileObj.profilePicture ? getImageUrl(profileObj.profilePicture) : null;
    
    const profileRoleCount = profileObj.experience?.length;
    const appYearsRaw = Number(viewingApplicant.applicant?.experience);
    const appYears = Number.isFinite(appYearsRaw) ? appYearsRaw : null;
    const expSummary = profileRoleCount
        ? `${profileRoleCount} role${profileRoleCount === 1 ? '' : 's'} (profile)`
        : (appYears !== null ? `${appYears} yr${appYears === 1 ? '' : 's'} (application)` : '—');
    
    const dSkills = profileObj.skills?.length ? profileObj.skills : (viewingApplicant.applicant?.skills || []);
    const rawResume = viewingApplicant.applicant?.resumeUrl || viewingApplicant.applicant?.resume;
    const resumeHref = rawResume
        ? (String(rawResume).startsWith('http') ? rawResume : getImageUrl(rawResume))
        : '';

    return (
        <Layout>
            <PageHeader 
                title="Applicant Profile"
                subtitle={`Application for ${application.jobCircular?.title || 'Job Position'}`}
                actions={
                    <div className="flex gap-3">
                        <Button variant="outline" onClick={() => navigate(-1)}>
                            Back
                        </Button>
                        {['pending', 'shortlisted', 'interviewed'].includes(viewingApplicant.status) && (
                            <Button
                                variant="danger"
                                disabled={statusUpdating}
                                className="!bg-[#dc2626] hover:!bg-[#b91c1c] !text-white !border-0 flex items-center gap-2 px-6 shadow-sm font-semibold"
                                onClick={() => updateStatus('rejected')}
                            >
                                Decline
                            </Button>
                        )}
                        {['shortlisted', 'interviewed'].includes(viewingApplicant.status) && (
                            <Button
                                variant="primary"
                                disabled={statusUpdating}
                                className="!bg-[#10b981] hover:!bg-[#059669] !text-white !border-0 flex items-center gap-2 px-6 shadow-sm font-semibold"
                                onClick={() => setHiringApplicant(viewingApplicant)}
                            >
                                <span>🎉</span> Hire Candidate
                            </Button>
                        )}
                    </div>
                }
            />

            <div className="max-w-5xl mx-auto space-y-8 pb-32">
                <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
                    <div
                        className={`h-48 bg-gradient-to-r ${coverPhotoUrl ? '' : 'from-slate-800 to-indigo-900'}`}
                        style={coverPhotoUrl ? { backgroundImage: `url(${coverPhotoUrl})`, backgroundSize: 'cover', backgroundPosition: 'center' } : {}}
                    />
                    <div className="px-10 pb-10 relative">
                        <div className="flex flex-col sm:flex-row gap-6 sm:items-end mb-8 relative">
                            <div className="w-32 h-32 rounded-3xl border-4 border-white shadow-lg bg-slate-100 flex items-center justify-center text-5xl font-bold text-indigo-600 overflow-hidden z-10 shrink-0 -mt-20">
                                {profilePicUrl ? <img src={profilePicUrl} alt="" className="w-full h-full object-cover" /> : dName.charAt(0)}
                            </div>
                            <div className="pb-1 flex-1 flex flex-col sm:flex-row justify-between sm:items-end gap-4 mt-4 sm:mt-0">
                                <div>
                                    <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">{dName}</h1>
                                    <p className="text-base font-medium text-slate-500 mt-1">{profileObj.title || 'Professional Applicant'}</p>
                                    <div className="mt-4 flex flex-wrap items-center gap-3">
                                        <Badge variant={viewingApplicant.status === 'hired' ? 'success' : viewingApplicant.status === 'rejected' ? 'danger' : 'primary'}>
                                            {viewingApplicant.status === 'hired' && viewingApplicant.offerLetterStatus === 'pending'
                                                ? 'hired · awaiting offer'
                                                : viewingApplicant.status === 'hired' && viewingApplicant.offerLetterStatus === 'accepted'
                                                    ? 'hired · joined'
                                                    : viewingApplicant.status}
                                        </Badge>
                                        {(profileObj.location || viewingApplicant.applicant?.location) && (
                                            <span className="flex items-center text-xs font-medium text-slate-600 bg-slate-50 px-2.5 py-1 rounded-md border border-slate-200">
                                                <svg className="w-3 h-3 mr-1.5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.242-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                                                {profileObj.location || viewingApplicant.applicant?.location}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {profileObj.summary && (
                            <div className="mb-8 pb-8 border-b border-slate-100">
                                <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Professional Summary</h4>
                                <div className="text-sm text-slate-700 leading-relaxed max-w-4xl" dangerouslySetInnerHTML={{ __html: profileObj.summary }} />
                            </div>
                        )}

                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8 py-6 border-y border-slate-100 mb-8 bg-slate-50/50 rounded-xl px-6">
                            <div>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Experience</p>
                                <p className="text-sm font-semibold text-slate-900 mt-1">{expSummary}</p>
                            </div>
                            <div className="md:col-span-3">
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Resume Document</p>
                                {resumeHref ? (
                                    <a href={resumeHref} target="_blank" rel="noreferrer" className="text-sm font-semibold text-indigo-600 hover:text-indigo-700 hover:underline mt-1 flex items-center gap-2">
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                                        View Attached Application Resume
                                    </a>
                                ) : (
                                    <p className="text-sm font-medium text-slate-500 mt-1 italic">Not Provided in Application</p>
                                )}
                            </div>
                        </div>

                        {(profileObj.phone || profileObj.linkedin || viewingApplicant.applicant?.phone) && (
                            <div className="mb-8 pb-8 border-b border-slate-100">
                                <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4">Contact & Links</h4>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm text-slate-700">
                                    {(profileObj.phone || viewingApplicant.applicant?.phone) && (
                                        <div>
                                            <span className="text-slate-400 font-bold text-[10px] uppercase tracking-widest block mb-1">Phone</span>
                                            <span className="font-medium text-slate-900">{profileObj.phone || viewingApplicant.applicant.phone}</span>
                                        </div>
                                    )}
                                    {profileObj.linkedin && (
                                        <div className="md:col-span-2">
                                            <span className="text-slate-400 font-bold text-[10px] uppercase tracking-widest block mb-1">LinkedIn</span>
                                            <a href={profileObj.linkedin} target="_blank" rel="noreferrer" className="text-indigo-600 font-medium hover:underline break-all">{profileObj.linkedin}</a>
                                        </div>
                                    )}
                                    {dEmail && (
                                        <div className="md:col-span-3">
                                            <span className="text-slate-400 font-bold text-[10px] uppercase tracking-widest block mb-1">Email</span>
                                            <a href={`mailto:${dEmail}`} className="text-slate-900 font-medium hover:underline break-all">{dEmail}</a>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {dSkills && dSkills.length > 0 && (
                            <div className="mb-8">
                                <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4">Technical Skills</h4>
                                <div className="flex flex-wrap gap-2">
                                    {dSkills.map((s, i) => (
                                        <span key={i} className="px-3 py-1.5 bg-indigo-50/50 border border-indigo-100 text-indigo-700 rounded-lg text-xs font-semibold tracking-wide">{s}</span>
                                    ))}
                                </div>
                            </div>
                        )}

                        {profileObj.experience && profileObj.experience.length > 0 && (
                            <div className="space-y-4 mb-8">
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
                            <div className="space-y-4 mb-8">
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

            <HireCandidateModal
                isOpen={!!hiringApplicant}
                onClose={() => setHiringApplicant(null)}
                application={hiringApplicant}
                onSuccess={(updatedApp) => {
                    setApplication({ ...application, ...updatedApp, jobCircular: application.jobCircular });
                }}
            />
        </Layout>
    );
};

export default ApplicantProfile;
