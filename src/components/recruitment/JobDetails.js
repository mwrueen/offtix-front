import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';
import UnifiedHeader from '../layout/UnifiedHeader';
import { getCookie } from '../../utils/cookies';

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

    useEffect(() => {
        if (user) {
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
    }, [user]);

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

    return (
        <div className="min-h-screen bg-slate-50/30 text-slate-800 font-sans pb-32">
            <UnifiedHeader />

            <div className="max-w-[1100px] mx-auto px-6 pt-32 pb-16 grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Content */}
                <div className="lg:col-span-8 space-y-8">
                    <div className="bg-white p-8 rounded-xl border border-slate-200 shadow-sm space-y-6">
                        <div className="flex flex-wrap gap-2">
                            <span className="px-2 py-0.5 bg-indigo-50 text-indigo-600 text-[10px] font-bold uppercase tracking-wider rounded border border-indigo-100">
                                {circular.role}
                            </span>
                            <span className="px-2 py-0.5 bg-slate-100 text-slate-500 text-[10px] font-bold uppercase tracking-wider rounded border border-slate-200">
                                {circular.jobNature}
                            </span>
                        </div>

                        <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 leading-tight">
                            {circular.title}
                        </h1>

                        <div className="grid grid-cols-3 gap-6 pt-2 border-t border-slate-100 mt-6">
                            <div className="pt-4">
                                <p className="text-[10px] font-bold uppercase text-slate-400 tracking-wider mb-1">Salary Range</p>
                                <p className="text-sm font-bold text-slate-900">${Number(circular.salaryRange.min).toLocaleString()} — ${Number(circular.salaryRange.max).toLocaleString()}</p>
                            </div>
                            <div className="pt-4 border-l border-slate-100 pl-6">
                                <p className="text-[10px] font-bold uppercase text-slate-400 tracking-wider mb-1">Work Location</p>
                                <p className="text-sm font-bold text-slate-900">{circular.location || 'Remote'}</p>
                            </div>
                            <div className="pt-4 border-l border-slate-100 pl-6">
                                <p className="text-[10px] font-bold uppercase text-slate-400 tracking-wider mb-1">Experience Required</p>
                                <p className="text-sm font-bold text-slate-900">{circular.experience}+ Years</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white p-8 rounded-xl border border-slate-200 shadow-sm space-y-10">
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
                                                    <p className="text-xs font-bold text-slate-700">{user?.phone || 'N/A'}</p>
                                                </div>
                                                <div className="space-y-1">
                                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Experience</p>
                                                    <p className="text-xs font-bold text-slate-700">{formData.applicant.experience || 0} Years</p>
                                                </div>
                                            </div>

                                            <div className="pt-4 border-t border-slate-100">
                                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2 text-center">Identity confirmed from profile</p>
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
        </div>
    );
};

export default JobDetails;
