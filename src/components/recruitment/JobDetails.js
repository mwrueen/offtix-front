import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';
import UnifiedHeader from '../layout/UnifiedHeader';
import { getCookie } from '../../utils/cookies';
import { getAssetUrl } from '../../services/api';

const APPLIED_JOBS_KEY = 'offtix_careers_applied_jobs';

const JobDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const toast = useToast();
    const { state: authState } = useAuth();
    const { isAuthenticated, user } = authState;

    const [circular, setCircular] = useState(null);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [alreadyApplied, setAlreadyApplied] = useState(false);
    const [showCompanyModal, setShowCompanyModal] = useState(false);

    const authHeaders = useCallback(() => {
        const token = getCookie('authToken');
        return token ? { Authorization: `Bearer ${token}` } : {};
    }, []);

    const hasAppliedInBrowser = useCallback((jobId) => {
        try {
            const raw = localStorage.getItem(APPLIED_JOBS_KEY);
            const ids = raw ? JSON.parse(raw) : [];
            return Array.isArray(ids) && ids.includes(jobId);
        } catch {
            return false;
        }
    }, []);

    const markAppliedInBrowser = useCallback((jobId) => {
        try {
            const raw = localStorage.getItem(APPLIED_JOBS_KEY);
            const ids = raw ? JSON.parse(raw) : [];
            const list = Array.isArray(ids) ? ids : [];
            if (!list.includes(jobId)) {
                list.push(jobId);
                localStorage.setItem(APPLIED_JOBS_KEY, JSON.stringify(list));
            }
        } catch {
            /* ignore */
        }
    }, []);

    const [formData, setFormData] = useState({
        applicant: {
            name: user?.name || '',
            email: user?.email || '',
            phone: user?.phone || '',
            experience: '',
            skills: ''
        },
        answers: []
    });

    const [userProfile, setUserProfile] = useState(null);
    const [profileLoading, setProfileLoading] = useState(false);

    const checkProfileCompleteness = useCallback((data) => {
        if (!data) return { isComplete: false, checks: { fatherName: false, motherName: false, address: false, education: false, skills: false } };
        const p = data.profile || {};

        const hasFatherName = Boolean((p.fatherName || '').trim());
        const hasMotherName = Boolean((p.motherName || '').trim());
        const hasAddress = Boolean((p.address || p.location || '').trim());
        
        const hasEducation = Array.isArray(p.education) && p.education.length > 0 && p.education.some(e => Boolean((e.institution || e.degree || '').trim()));
        const hasSkills = (Array.isArray(p.skills) && p.skills.length > 0) || (typeof p.skills === 'string' && p.skills.trim().length > 0);

        const isComplete = hasFatherName && hasMotherName && hasAddress && hasEducation && hasSkills;

        return {
            isComplete,
            checks: {
                fatherName: hasFatherName,
                motherName: hasMotherName,
                address: hasAddress,
                education: hasEducation,
                skills: hasSkills
            }
        };
    }, []);

    useEffect(() => {
        if (!isAuthenticated) return;
        let isMounted = true;
        const fetchProfile = async () => {
            setProfileLoading(true);
            try {
                const res = await axios.get('/api/users/profile', { headers: authHeaders() });
                if (!isMounted) return;
                setUserProfile(res.data);
                const prof = res.data?.profile || {};
                setFormData(prev => ({
                    ...prev,
                    applicant: {
                        ...prev.applicant,
                        name: res.data.name || user?.name || '',
                        email: res.data.email || user?.email || '',
                        phone: prof.phone || user?.phone || '',
                        experience: Array.isArray(prof.experience) ? prof.experience.length : (user?.experience || 0),
                        skills: Array.isArray(prof.skills) ? prof.skills.join(', ') : (prof.skills || '')
                    }
                }));
            } catch (err) {
                console.error('Error fetching profile in JobDetails:', err);
            } finally {
                if (isMounted) setProfileLoading(false);
            }
        };
        fetchProfile();
        return () => { isMounted = false; };
    }, [isAuthenticated, authHeaders, user]);

    useEffect(() => {
        if (user && !userProfile) {
            setFormData(prev => ({
                ...prev,
                applicant: {
                    ...prev.applicant,
                    name: user.name || '',
                    email: user.email || '',
                    phone: user.phone || '',
                    experience: user.experience || '',
                    skills: Array.isArray(user.skills) ? user.skills.join(', ') : (user.skills || '')
                }
            }));
        }
    }, [user, userProfile]);

    useEffect(() => {
        const fetchCircular = async () => {
            try {
                const res = await axios.get(`/api/recruitment/public/circulars/${id}`, {
                    headers: authHeaders()
                });
                const { alreadyApplied: appliedFromApi, ...job } = res.data;
                setCircular(job);
                setAlreadyApplied(!!appliedFromApi || hasAppliedInBrowser(id));
                const initialAnswers = job.questions.map(q => ({
                    questionId: q._id,
                    questionText: q.question,
                    answer: q.type === 'checkbox' ? [] : ''
                }));
                setFormData(prev => ({ ...prev, answers: initialAnswers }));
            } catch (error) {
                console.error('Error fetching circular:', error);
                toast.showToast('Job details not found.', 'error');
            } finally {
                setLoading(false);
            }
        };
        fetchCircular();
    }, [id, isAuthenticated, authHeaders, hasAppliedInBrowser, toast]);

    const handleAnswerChange = (index, value, type) => {
        const newAnswers = [...formData.answers];
        if (type === 'checkbox') {
            const currentAnswers = Array.isArray(newAnswers[index].answer) ? newAnswers[index].answer : [];
            if (currentAnswers.includes(value)) {
                newAnswers[index].answer = currentAnswers.filter(a => a !== value);
            } else {
                newAnswers[index].answer = [...currentAnswers, value];
            }
        } else {
            newAnswers[index].answer = value;
        }
        setFormData({ ...formData, answers: newAnswers });
    };

    const handleApply = async (e) => {
        e.preventDefault();
        if (!isAuthenticated) {
            toast.showToast('Sign in to apply for this role.', 'info');
            navigate('/signin', { state: { from: { pathname: `/careers/${id}` } } });
            return;
        }

        const profileStatus = checkProfileCompleteness(userProfile);
        if (!profileStatus.isComplete) {
            toast.showToast('Please complete your profile details (Basic Info, Education, and Skills) before applying.', 'warning');
            navigate('/profile', { state: { from: { pathname: `/careers/${id}` } } });
            return;
        }

        setSubmitting(true);
        try {
            const payload = {
                applicant: {
                    ...formData.applicant,
                    experience: Number(formData.applicant.experience) || 0,
                    skills: typeof formData.applicant.skills === 'string'
                        ? formData.applicant.skills.split(',').map(s => s.trim())
                        : (formData.applicant.skills || [])
                },
                answers: formData.answers.map(a => ({
                    ...a,
                    answer: Array.isArray(a.answer) ? a.answer.join(', ') : a.answer
                }))
            };

            await axios.post(`/api/recruitment/public/apply/${id}`, payload, {
                headers: { ...authHeaders(), 'Content-Type': 'application/json' }
            });
            markAppliedInBrowser(id);
            setAlreadyApplied(true);
            toast.showToast('Application submitted successfully!', 'success');
            navigate('/');
        } catch (error) {
            if (error.response?.status === 409) {
                markAppliedInBrowser(id);
                setAlreadyApplied(true);
                toast.showToast(error.response?.data?.message || 'You have already applied for this position.', 'info');
            } else {
                toast.showToast(error.response?.data?.message || 'Submission failed', 'error');
            }
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) return (
        <div className="min-h-screen bg-white flex items-center justify-center">
            <div className="w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
        </div>
    );

    if (!circular) return (
        <div className="min-h-screen bg-white flex items-center justify-center text-slate-400 font-bold uppercase tracking-widest italic">
            Job Not Found
        </div>
    );

    const profileCompleteness = checkProfileCompleteness(userProfile);

    return (
        <div className="min-h-screen bg-slate-50/30 text-slate-800 font-sans pb-32">
            <UnifiedHeader />

            <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 pt-16 sm:pt-24 pb-12 sm:pb-20 grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8">
                {/* Content */}
                <div className="lg:col-span-8 space-y-6 sm:space-y-8">
                    <div className="bg-white p-4 sm:p-8 rounded-2xl border border-slate-200 shadow-xs space-y-6">
                        {/* Hiring Company Header Bar */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-100">
                            <div
                                onClick={() => navigate(`/careers/company/${circular.company?._id || circular.company}`)}
                                className="flex items-center gap-3.5 cursor-pointer group"
                                title="Click to view company profile"
                            >
                                <div className="w-12 h-12 rounded-xl bg-slate-100 border border-slate-200/80 group-hover:border-indigo-400 group-hover:shadow-md transition-all flex items-center justify-center overflow-hidden shrink-0 shadow-2xs">
                                    {circular.company?.logo ? (
                                        <img src={getAssetUrl(circular.company.logo)} alt={circular.company.name} className="w-full h-full object-cover" />
                                    ) : (
                                        <span className="text-xl font-black text-indigo-600">
                                            {(circular.company?.name || 'O').charAt(0).toUpperCase()}
                                        </span>
                                    )}
                                </div>
                                <div>
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <h3 className="text-base font-bold text-slate-900 group-hover:text-indigo-600 transition-colors leading-tight flex items-center gap-1.5">
                                            <span>{circular.company?.name || 'Hiring Organization'}</span>
                                            <svg className="w-3.5 h-3.5 text-slate-400 group-hover:text-indigo-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                            </svg>
                                        </h3>
                                        <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-100 text-[10px] font-bold flex items-center gap-1">
                                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                                            Verified Employer
                                        </span>
                                    </div>
                                    {circular.company?.industries && (
                                        <p className="text-xs text-slate-500 font-medium mt-0.5">
                                            {Array.isArray(circular.company.industries) ? circular.company.industries.join(' • ') : circular.company.industries}
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="flex flex-wrap gap-2">
                            <span className="px-2 py-0.5 bg-indigo-50 text-indigo-600 text-[10px] font-bold uppercase tracking-wider rounded border border-indigo-100">
                                {circular.role}
                            </span>
                            <span className="px-2 py-0.5 bg-slate-100 text-slate-500 text-[10px] font-bold uppercase tracking-wider rounded border border-slate-200">
                                {circular.jobNature}
                            </span>
                        </div>

                        <h1 className="text-xl sm:text-2xl lg:text-3xl font-extrabold tracking-tight text-slate-900 leading-tight">
                            {circular.title}
                        </h1>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 pt-4 border-t border-slate-100 mt-6 divide-y sm:divide-y-0 sm:divide-x divide-slate-100">
                            <div className="pt-2 sm:pt-0">
                                <p className="text-[10px] font-bold uppercase text-slate-400 tracking-wider mb-1">Salary Range</p>
                                <p className="text-sm font-bold text-slate-900 leading-snug">
                                    {(() => {
                                        const symbolMap = { USD: '$', BDT: '৳', EUR: '€', GBP: '£', CAD: 'CA$', AUD: 'A$' };
                                        const symbol = symbolMap[circular.salaryRange.currency] || circular.salaryRange.currency || '$';
                                        const periodMap = { yearly: 'Per Year', monthly: 'Per Month', hourly: 'Per Hour' };
                                        const period = periodMap[circular.salaryRange.period] || 'Per Year';
                                        return `${symbol}${Number(circular.salaryRange.min || 0).toLocaleString()} — ${symbol}${Number(circular.salaryRange.max || 0).toLocaleString()} (${period})`;
                                    })()}
                                </p>
                            </div>
                            <div className="pt-3 sm:pt-0 sm:pl-6">
                                <p className="text-[10px] font-bold uppercase text-slate-400 tracking-wider mb-1">Work Location</p>
                                <p className="text-sm font-bold text-slate-900">{circular.location || 'Remote'}</p>
                            </div>
                            <div className="pt-3 sm:pt-0 sm:pl-6">
                                <p className="text-[10px] font-bold uppercase text-slate-400 tracking-wider mb-1">Experience Required</p>
                                <p className="text-sm font-bold text-slate-900">{circular.experience}+ Years</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white p-4 sm:p-8 rounded-2xl border border-slate-200 shadow-xs space-y-8 sm:space-y-10">
                        <div className="max-w-none">
                            <h2 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-3">
                                <div className="w-1.5 h-6 bg-indigo-600 rounded-full" />
                                Role Overview
                            </h2>
                            <div dangerouslySetInnerHTML={{ __html: circular.description }} className="text-slate-600 leading-relaxed text-base space-y-4" />
                        </div>

                        {circular.benefits && (
                            <div className="pt-6 border-t border-slate-50">
                                <h3 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-3">
                                    <div className="w-1.5 h-6 bg-emerald-500 rounded-full" />
                                    Perks & Benefits
                                </h3>
                                <div dangerouslySetInnerHTML={{ __html: circular.benefits }} className="text-slate-600 leading-relaxed text-base space-y-4" />
                            </div>
                        )}

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-8 border-t border-slate-100">
                            <div className="space-y-4">
                                <h3 className="text-[11px] font-bold text-indigo-600 uppercase tracking-wider">Mandatory Competencies</h3>
                                <div className="flex flex-wrap gap-2">
                                    {circular.mandatorySkills.map((s, i) => (
                                        <span key={i} className="px-3 py-1 bg-slate-50 text-slate-600 rounded text-[11px] font-medium border border-slate-200">#{s}</span>
                                    ))}
                                </div>
                            </div>
                            <div className="space-y-4">
                                <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Bonus Competencies</h3>
                                <div className="flex flex-wrap gap-2">
                                    {circular.niceToHaveSkills.map((s, i) => (
                                        <span key={i} className="px-3 py-1 bg-white text-slate-400 rounded text-[11px] font-medium border border-slate-200">#{s}</span>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Apply Form */}
                <div className="lg:col-span-4">
                    <div className="sticky top-32">
                        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                            <div className="bg-slate-50 p-6 border-b border-slate-200">
                                <h2 className="text-xl font-bold tracking-tight text-slate-900">Application Formalities</h2>
                                <p className="text-slate-500 text-[11px] mt-1 font-medium italic">Complete the assessment to finalize your interest.</p>
                            </div>

                            <div className="p-6">
                                {alreadyApplied ? (
                                    <div className="space-y-4 text-center py-4">
                                        <div className="w-12 h-12 mx-auto bg-emerald-100 rounded-full flex items-center justify-center">
                                            <svg className="w-6 h-6 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                                        </div>
                                        <p className="text-sm font-bold text-slate-800">You have already applied for this role.</p>
                                        <p className="text-xs text-slate-500 leading-relaxed">We have your application on file. You will hear from the team if there is a fit.</p>
                                        <Link
                                            to="/"
                                            className="inline-block w-full text-center bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold py-3 rounded-lg text-sm transition-all"
                                        >
                                            Back to openings
                                        </Link>
                                    </div>
                                ) : !isAuthenticated ? (
                                    <div className="space-y-5 py-2 text-center">
                                        <div className="w-12 h-12 mx-auto bg-indigo-100 rounded-full flex items-center justify-center">
                                            <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                                        </div>
                                        <p className="text-sm font-bold text-slate-800">Sign in to apply</p>
                                        <p className="text-xs text-slate-500 leading-relaxed">Create an account or sign in so we can attach your application to your profile.</p>
                                        <Link
                                            to="/signin"
                                            state={{ from: { pathname: `/careers/${id}` } }}
                                            className="inline-block w-full text-center bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-lg text-sm transition-all"
                                        >
                                            Sign in
                                        </Link>
                                        <p className="text-xs text-slate-500">
                                            New here?{' '}
                                            <Link to="/signup" state={{ from: { pathname: `/careers/${id}` } }} className="font-bold text-indigo-600 hover:text-indigo-700">
                                                Create an account
                                            </Link>
                                        </p>
                                    </div>
                                ) : profileLoading ? (
                                    <div className="py-12 text-center space-y-3">
                                        <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
                                        <p className="text-xs font-semibold text-slate-400">Verifying candidate profile...</p>
                                    </div>
                                ) : !profileCompleteness.isComplete ? (
                                    <div className="space-y-5 py-2">
                                        <div className="bg-amber-50/90 border border-amber-200/80 rounded-xl p-4 flex gap-3 items-start shadow-2xs">
                                            <span className="text-xl">⚠️</span>
                                            <div>
                                                <h4 className="text-xs font-bold text-amber-900 uppercase tracking-wider">Complete Profile Required</h4>
                                                <p className="text-xs text-amber-700 mt-1 leading-relaxed">
                                                    Before applying for <strong className="text-amber-950">{circular.title}</strong>, please complete your profile information.
                                                </p>
                                            </div>
                                        </div>

                                        {/* Requirements Checklist */}
                                        <div className="space-y-3 bg-slate-50 p-4 rounded-xl border border-slate-200/90 text-xs">
                                            <h5 className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2">Required Qualifications</h5>
                                            
                                            {/* Basic Information */}
                                            <div className="space-y-1.5 pb-3 border-b border-slate-200/70">
                                                <div className="font-bold text-slate-800 flex items-center gap-1.5">
                                                    <span>👤</span> Basic Information
                                                </div>
                                                <div className="pl-6 space-y-1">
                                                    <div className="flex items-center justify-between">
                                                        <span className="text-slate-600">Address</span>
                                                        {profileCompleteness.checks.address ? (
                                                            <span className="text-emerald-600 font-bold text-[11px]">✓ Complete</span>
                                                        ) : (
                                                            <span className="text-rose-600 font-bold text-[11px]">✕ Missing</span>
                                                        )}
                                                    </div>
                                                    <div className="flex items-center justify-between">
                                                        <span className="text-slate-600">Father's Name</span>
                                                        {profileCompleteness.checks.fatherName ? (
                                                            <span className="text-emerald-600 font-bold text-[11px]">✓ Complete</span>
                                                        ) : (
                                                            <span className="text-rose-600 font-bold text-[11px]">✕ Missing</span>
                                                        )}
                                                    </div>
                                                    <div className="flex items-center justify-between">
                                                        <span className="text-slate-600">Mother's Name</span>
                                                        {profileCompleteness.checks.motherName ? (
                                                            <span className="text-emerald-600 font-bold text-[11px]">✓ Complete</span>
                                                        ) : (
                                                            <span className="text-rose-600 font-bold text-[11px]">✕ Missing</span>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Education */}
                                            <div className="flex items-center justify-between py-2 border-b border-slate-200/70">
                                                <div className="flex items-center gap-1.5 font-bold text-slate-800">
                                                    <span>🎓</span> Education History
                                                </div>
                                                {profileCompleteness.checks.education ? (
                                                    <span className="text-emerald-600 font-bold text-[11px]">✓ Complete</span>
                                                ) : (
                                                    <span className="text-rose-600 font-bold text-[11px]">✕ Missing</span>
                                                )}
                                            </div>

                                            {/* Skills */}
                                            <div className="flex items-center justify-between py-2 border-b border-slate-200/70">
                                                <div className="flex items-center gap-1.5 font-bold text-slate-800">
                                                    <span>⚡</span> Skills & Competencies
                                                </div>
                                                {profileCompleteness.checks.skills ? (
                                                    <span className="text-emerald-600 font-bold text-[11px]">✓ Complete</span>
                                                ) : (
                                                    <span className="text-rose-600 font-bold text-[11px]">✕ Missing</span>
                                                )}
                                            </div>

                                            {/* Experience (Optional) */}
                                            <div className="flex items-center justify-between pt-1">
                                                <div className="flex items-center gap-1.5 font-bold text-slate-800">
                                                    <span>📂</span> Professional Experience
                                                </div>
                                                <span className="text-slate-400 font-bold text-[10px] uppercase">Optional</span>
                                            </div>
                                        </div>

                                        <button
                                            onClick={() => navigate('/profile', { state: { from: { pathname: `/careers/${id}` } } })}
                                            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3.5 rounded-xl shadow-md transition-all flex items-center justify-center gap-2 text-xs uppercase tracking-wider"
                                        >
                                            Complete Profile Now ➔
                                        </button>
                                    </div>
                                ) : (
                                <form onSubmit={handleApply} className="space-y-6">
                                    <div className="space-y-5">
                                        <div className="space-y-5">
                                            <div className="flex items-center gap-4 bg-indigo-50/50 p-4 rounded-xl border border-indigo-100">
                                                <div className="w-10 h-10 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-bold text-lg uppercase shadow-sm">
                                                    {user?.name?.[0]}
                                                </div>
                                                <div>
                                                    <div className="flex items-center gap-1.5">
                                                        <h4 className="text-sm font-bold text-slate-800">{user?.name}</h4>
                                                        <svg className="w-3.5 h-3.5 text-emerald-500" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
                                                    </div>
                                                    <p className="text-[10px] font-medium text-slate-500 tracking-wider truncate max-w-[150px]">{user?.email}</p>
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="space-y-1">
                                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Contact</p>
                                                    <p className="text-xs font-bold text-slate-700">{userProfile?.profile?.phone || user?.phone || 'N/A'}</p>
                                                </div>
                                                <div className="space-y-1">
                                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Experience</p>
                                                    <p className="text-xs font-bold text-slate-700">{userProfile?.profile?.experience?.length || 0} Records</p>
                                                </div>
                                            </div>

                                            <div className="pt-4 border-t border-slate-100">
                                                <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider mb-2 text-center flex items-center justify-center gap-1">
                                                    <span>✓</span> Profile verified & complete
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    {circular.questions.length > 0 && (
                                        <div className="pt-6 border-t border-slate-100 space-y-6">
                                            <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400">Questions from Recruiter</h3>
                                            {circular.questions.map((q, qIndex) => (
                                                <div key={qIndex} className="space-y-3">
                                                    <label className="text-xs font-bold text-slate-700 leading-tight">{q.question}</label>

                                                    {q.type === 'text' && (
                                                        <input
                                                            type="text" required={q.required}
                                                            className="w-full bg-slate-50 border border-slate-300 p-3 rounded-lg outline-none font-medium text-sm text-slate-700 focus:border-indigo-500 focus:bg-white transition-all"
                                                            value={formData.answers[qIndex]?.answer}
                                                            onChange={(e) => handleAnswerChange(qIndex, e.target.value)}
                                                        />
                                                    )}

                                                    {q.type === 'long-text' && (
                                                        <textarea
                                                            required={q.required}
                                                            className="w-full bg-slate-50 border border-slate-300 p-3 rounded-lg outline-none font-medium text-sm text-slate-700 focus:border-indigo-500 focus:bg-white transition-all min-h-[100px] text-slate-700"
                                                            value={formData.answers[qIndex]?.answer}
                                                            onChange={(e) => handleAnswerChange(qIndex, e.target.value)}
                                                        />
                                                    )}

                                                    {/* Other question types simplified as well */}
                                                    {q.type === 'selection' && (
                                                        <select
                                                            required={q.required}
                                                            className="w-full bg-slate-50 border border-slate-300 p-3 rounded-lg outline-none font-medium text-sm text-slate-700 focus:border-indigo-500 focus:bg-white transition-all"
                                                            value={formData.answers[qIndex]?.answer}
                                                            onChange={(e) => handleAnswerChange(qIndex, e.target.value)}
                                                        >
                                                            <option value="">Select Option</option>
                                                            {q.options.map((opt, i) => <option key={i} value={opt}>{opt}</option>)}
                                                        </select>
                                                    )}

                                                    {q.type === 'radio' && (
                                                        <div className="space-y-2">
                                                            {q.options.map((opt, i) => (
                                                                <label key={i} className="flex items-center gap-2.5 p-2 bg-slate-50 rounded-lg cursor-pointer hover:bg-slate-100 transition-all border border-slate-200">
                                                                    <input type="radio" name={`q-${qIndex}`} required={q.required} value={opt} checked={formData.answers[qIndex]?.answer === opt} onChange={(e) => handleAnswerChange(qIndex, e.target.value)} className="w-3.5 h-3.5 text-indigo-600" />
                                                                    <span className="text-xs font-medium text-slate-600">{opt}</span>
                                                                </label>
                                                            ))}
                                                        </div>
                                                    )}

                                                    {q.type === 'checkbox' && (
                                                        <div className="space-y-2">
                                                            {q.options.map((opt, i) => (
                                                                <label key={i} className="flex items-center gap-2.5 p-2 bg-slate-50 rounded-lg cursor-pointer hover:bg-slate-100 transition-all border border-slate-200">
                                                                    <input type="checkbox" checked={formData.answers[qIndex]?.answer?.includes(opt)} onChange={() => handleAnswerChange(qIndex, opt, 'checkbox')} className="w-3.5 h-3.5 rounded text-indigo-600 border-slate-300" />
                                                                    <span className="text-xs font-medium text-slate-600">{opt}</span>
                                                                </label>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    <button
                                        type="submit"
                                        disabled={submitting}
                                        className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-4 rounded-lg shadow shadow-indigo-200/50 transition-all flex items-center justify-center gap-2 text-sm uppercase tracking-wide"
                                    >
                                        {submitting ? 'Submitting...' : 'Apply Now'}
                                    </button>
                                </form>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Hiring Company Profile Modal */}
            {showCompanyModal && (
                <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
                    <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-xl w-full p-6 space-y-6 max-h-[90vh] flex flex-col relative overflow-hidden">
                        <button
                            onClick={() => setShowCompanyModal(false)}
                            className="absolute top-5 right-5 w-8 h-8 rounded-full bg-slate-100 text-slate-500 hover:text-slate-900 flex items-center justify-center text-lg font-bold transition-colors"
                        >
                            ✕
                        </button>

                        <div className="flex items-start gap-4 pr-8">
                            <div className="w-16 h-16 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-2xl font-black text-indigo-600 shrink-0 overflow-hidden shadow-sm">
                                {circular.company?.logo ? (
                                    <img src={getAssetUrl(circular.company.logo)} alt={circular.company?.name} className="w-full h-full object-cover" />
                                ) : (
                                    (circular.company?.name || 'C').charAt(0).toUpperCase()
                                )}
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-slate-900 tracking-tight leading-snug">{circular.company?.name || 'Offtix Organization'}</h2>
                                <div className="flex flex-wrap items-center gap-2 mt-1">
                                    <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-100 text-[10px] font-bold">
                                        ✓ Verified Employer
                                    </span>
                                    {circular.company?.address && (
                                        <span className="text-xs font-medium text-slate-500 flex items-center gap-1">
                                            📍 {circular.company.address}
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="space-y-4 flex-1 overflow-y-auto pr-1">
                            {circular.company?.description ? (
                                <div className="space-y-2">
                                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">About Organization</h4>
                                    <p className="text-sm text-slate-600 leading-relaxed bg-slate-50 p-4 rounded-xl border border-slate-200/80">
                                        {circular.company.description}
                                    </p>
                                </div>
                            ) : (
                                <p className="text-xs text-slate-400 italic bg-slate-50 p-4 rounded-xl border border-slate-200/80">
                                    No additional company overview provided.
                                </p>
                            )}

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                                {circular.company?.industries && (
                                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/80">
                                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Industry</span>
                                        <span className="text-xs font-bold text-slate-800">
                                            {Array.isArray(circular.company.industries) ? circular.company.industries.join(', ') : circular.company.industries}
                                        </span>
                                    </div>
                                )}
                                {circular.company?.email && (
                                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/80">
                                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Contact Email</span>
                                        <span className="text-xs font-bold text-slate-800 truncate block">{circular.company.email}</span>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="flex items-center justify-between border-t border-slate-100 pt-4">
                            {circular.company?.website ? (
                                <a
                                    href={circular.company.website.startsWith('http') ? circular.company.website : `https://${circular.company.website}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-2"
                                >
                                    <span>🌐 Visit Official Website</span>
                                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
                                </a>
                            ) : (
                                <div></div>
                            )}
                            <button
                                onClick={() => setShowCompanyModal(false)}
                                className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default JobDetails;
