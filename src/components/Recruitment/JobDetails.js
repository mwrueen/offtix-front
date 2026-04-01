import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';
import UnifiedHeader from '../layout/UnifiedHeader';

const JobDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const toast = useToast();
    const { state: authState } = useAuth();
    const { isAuthenticated, user } = authState;

    const [circular, setCircular] = useState(null);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);

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
                }
            }));
        }
    }, [user]);

    useEffect(() => {
        const fetchCircular = async () => {
            try {
                const res = await axios.get(`/api/recruitment/public/circulars/${id}`);
                setCircular(res.data);
                const initialAnswers = res.data.questions.map(q => ({
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
    }, [id]);

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
        setSubmitting(true);
        try {
            const payload = {
                applicant: {
                    ...formData.applicant,
                    experience: Number(formData.applicant.experience),
                    skills: formData.applicant.skills.split(',').map(s => s.trim())
                },
                answers: formData.answers.map(a => ({
                    ...a,
                    answer: Array.isArray(a.answer) ? a.answer.join(', ') : a.answer
                }))
            };

            await axios.post(`/api/recruitment/public/apply/${id}`, payload);
            toast.showToast('Application submitted successfully!', 'success');
            navigate('/careers');
        } catch (error) {
            toast.showToast(error.response?.data?.message || 'Submission failed', 'error');
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
        <div className="min-h-screen bg-white text-slate-800 font-sans pb-32">
            <UnifiedHeader />

            <div className="max-w-[1200px] mx-auto px-6 pt-32 pb-16 grid grid-cols-1 lg:grid-cols-12 gap-12">
                {/* Content */}
                <div className="lg:col-span-7 space-y-16">
                    <div className="space-y-6">
                        <div className="flex flex-wrap gap-3">
                            <span className="px-3 py-1 bg-indigo-50 text-indigo-600 text-[9px] font-bold uppercase tracking-widest rounded-lg border border-indigo-100 italic">
                                {circular.role}
                            </span>
                            <span className="px-3 py-1 bg-slate-100/50 text-slate-500 text-[9px] font-bold uppercase tracking-widest rounded-lg border border-slate-200">
                                {circular.jobNature}
                            </span>
                            <span className="px-3 py-1 bg-emerald-50 text-emerald-600 text-[9px] font-bold uppercase tracking-widest rounded-lg border border-emerald-100">
                                Active
                            </span>
                        </div>
                        <h1 className="text-5xl font-bold tracking-tight text-slate-900 leading-tight">
                            {circular.title}
                        </h1>
                        <div className="flex flex-wrap gap-10 pt-4">
                            <div className="space-y-1">
                                <p className="text-[10px] font-bold uppercase text-slate-400 tracking-widest">Expected Salary</p>
                                <p className="text-lg font-bold text-slate-900 tracking-tight">${Number(circular.salaryRange.min).toLocaleString()} — ${Number(circular.salaryRange.max).toLocaleString()}</p>
                            </div>
                            <div className="space-y-1 sm:border-l border-slate-100 sm:pl-10">
                                <p className="text-[10px] font-bold uppercase text-slate-400 tracking-widest">Location</p>
                                <p className="text-lg font-bold text-slate-900 tracking-tight">{circular.location || 'Remote'}</p>
                            </div>
                            <div className="space-y-1 sm:border-l border-slate-100 sm:pl-10">
                                <p className="text-[10px] font-bold uppercase text-slate-400 tracking-widest">Experience</p>
                                <p className="text-lg font-bold text-slate-900 tracking-tight">{circular.experience}+ Years</p>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
                        <div className="max-w-none">
                            <h2 className="text-[11px] font-bold text-slate-900 uppercase tracking-[0.2em] mb-10 flex items-center gap-4">
                                <span className="w-8 h-[2px] bg-indigo-600"></span>
                                Role Overview
                            </h2>
                            <div dangerouslySetInnerHTML={{ __html: circular.description }} className="text-slate-600 leading-relaxed text-lg font-medium space-y-4" />
                        </div>

                        {circular.benefits && (
                            <div className="pt-10">
                                <h3 className="text-[11px] font-bold text-slate-900 uppercase tracking-[0.2em] mb-10 flex items-center gap-4">
                                    <span className="w-8 h-[2px] bg-emerald-500"></span>
                                    Perks & Benefits
                                </h3>
                                <div dangerouslySetInnerHTML={{ __html: circular.benefits }} className="text-slate-600 leading-relaxed text-lg font-medium space-y-4" />
                            </div>
                        )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-8">
                        <div className="bg-slate-50/50 rounded-3xl p-10 border border-slate-100 shadow-sm">
                            <h3 className="text-[11px] font-bold text-indigo-600 mb-8 uppercase tracking-[0.2em]">Mandatory Competencies</h3>
                            <div className="flex flex-wrap gap-2">
                                {circular.mandatorySkills.map((s, i) => (
                                    <span key={i} className="px-4 py-2 bg-white text-slate-600 rounded-xl text-[10px] font-bold uppercase tracking-widest border border-slate-200">#{s}</span>
                                ))}
                            </div>
                        </div>
                        <div className="bg-white rounded-3xl p-10 border border-slate-100 shadow-sm">
                            <h3 className="text-[11px] font-bold text-slate-400 mb-8 uppercase tracking-[0.2em]">Bonus Competencies</h3>
                            <div className="flex flex-wrap gap-2">
                                {circular.niceToHaveSkills.map((s, i) => (
                                    <span key={i} className="px-4 py-2 bg-slate-50 text-slate-400 rounded-xl text-[10px] font-bold uppercase tracking-widest border border-slate-200">#{s}</span>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Apply Form */}
                <div className="lg:col-span-5">
                    <div className="sticky top-36">
                        <div className="bg-white rounded-[2.5rem] p-10 border border-slate-200 shadow-2xl shadow-slate-100 space-y-10">
                            <div>
                                <h2 className="text-3xl font-bold tracking-tight text-slate-900">Application Intent</h2>
                                <p className="text-slate-400 text-[10px] font-bold mt-1 uppercase tracking-widest">Initialize recruitment protocol</p>
                            </div>

                            <form onSubmit={handleApply} className="space-y-8">
                                <div className="space-y-6">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Full Name</label>
                                        <input
                                            type="text" required
                                            className="w-full bg-slate-50 border border-slate-200 p-4 rounded-2xl focus:ring-4 focus:ring-indigo-100 outline-none font-bold transition-all text-slate-700 shadow-inner"
                                            placeholder="Your Name"
                                            value={formData.applicant.name}
                                            onChange={(e) => setFormData({ ...formData, applicant: { ...formData.applicant, name: e.target.value } })}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-bold uppercase text-slate-400 tracking-widest ml-1">Email Connection</label>
                                        <input
                                            type="email" required
                                            className="w-full bg-slate-50 border border-slate-200 p-4 rounded-2xl focus:ring-4 focus:ring-indigo-100 outline-none font-bold transition-all text-slate-700 shadow-inner"
                                            placeholder="email@example.com"
                                            value={formData.applicant.email}
                                            onChange={(e) => setFormData({ ...formData, applicant: { ...formData.applicant, email: e.target.value } })}
                                        />
                                    </div>
                                    <div className="grid grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-bold uppercase text-slate-400 tracking-widest ml-1">Contact No</label>
                                            <input
                                                type="text" required
                                                className="w-full bg-slate-50 border border-slate-200 p-4 rounded-2xl outline-none font-bold text-slate-700 shadow-inner"
                                                value={formData.applicant.phone}
                                                onChange={(e) => setFormData({ ...formData, applicant: { ...formData.applicant, phone: e.target.value } })}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-bold uppercase text-slate-400 tracking-widest ml-1">Total Exp</label>
                                            <input
                                                type="number" required
                                                className="w-full bg-slate-50 border border-slate-200 p-4 rounded-2xl outline-none font-bold text-slate-700 shadow-inner"
                                                value={formData.applicant.experience}
                                                onChange={(e) => setFormData({ ...formData, applicant: { ...formData.applicant, experience: e.target.value } })}
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-bold uppercase text-slate-400 tracking-widest ml-1">Key Proficiencies (Comma split)</label>
                                        <textarea
                                            required
                                            className="w-full bg-slate-50 border border-slate-200 p-4 rounded-2xl focus:ring-4 focus:ring-indigo-100 outline-none font-bold min-h-[100px] resize-none text-slate-700 shadow-inner"
                                            placeholder="React, Node, etc."
                                            value={formData.applicant.skills}
                                            onChange={(e) => setFormData({ ...formData, applicant: { ...formData.applicant, skills: e.target.value } })}
                                        />
                                    </div>
                                </div>

                                {circular.questions.length > 0 && (
                                    <div className="pt-8 border-t border-slate-100 space-y-8">
                                        <h3 className="text-[10px] font-bold uppercase tracking-widest text-indigo-600">Prescreening Assessment</h3>
                                        {circular.questions.map((q, qIndex) => (
                                            <div key={qIndex} className="space-y-4">
                                                <label className="text-xs font-bold text-slate-700 leading-snug uppercase tracking-tight">{q.question}</label>

                                                {q.type === 'text' && (
                                                    <input
                                                        type="text" required={q.required}
                                                        className="w-full bg-slate-50 border border-slate-200 p-4 rounded-2xl outline-none font-bold text-slate-700 shadow-inner"
                                                        value={formData.answers[qIndex]?.answer}
                                                        onChange={(e) => handleAnswerChange(qIndex, e.target.value)}
                                                    />
                                                )}

                                                {q.type === 'long-text' && (
                                                    <textarea
                                                        required={q.required}
                                                        className="w-full bg-slate-50 border border-slate-200 p-4 rounded-2xl outline-none font-bold min-h-[120px] text-slate-700 shadow-inner"
                                                        value={formData.answers[qIndex]?.answer}
                                                        onChange={(e) => handleAnswerChange(qIndex, e.target.value)}
                                                    />
                                                )}

                                                {q.type === 'selection' && (
                                                    <select
                                                        required={q.required}
                                                        className="w-full bg-slate-50 border border-slate-200 p-4 rounded-2xl outline-none font-bold text-slate-700 shadow-inner"
                                                        value={formData.answers[qIndex]?.answer}
                                                        onChange={(e) => handleAnswerChange(qIndex, e.target.value)}
                                                    >
                                                        <option value="">Select Response...</option>
                                                        {q.options.map((opt, i) => <option key={i} value={opt}>{opt}</option>)}
                                                    </select>
                                                )}

                                                {q.type === 'radio' && (
                                                    <div className="space-y-2">
                                                        {q.options.map((opt, i) => (
                                                            <label key={i} className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl cursor-pointer hover:bg-slate-100 transition-all border border-slate-200">
                                                                <input type="radio" name={`q-${qIndex}`} required={q.required} value={opt} checked={formData.answers[qIndex]?.answer === opt} onChange={(e) => handleAnswerChange(qIndex, e.target.value)} className="w-4 h-4 text-indigo-600" />
                                                                <span className="text-xs font-bold text-slate-600">{opt}</span>
                                                            </label>
                                                        ))}
                                                    </div>
                                                )}

                                                {q.type === 'checkbox' && (
                                                    <div className="space-y-2">
                                                        {q.options.map((opt, i) => (
                                                            <label key={i} className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl cursor-pointer hover:bg-slate-100 transition-all border border-slate-200">
                                                                <input type="checkbox" checked={formData.answers[qIndex]?.answer?.includes(opt)} onChange={() => handleAnswerChange(qIndex, opt, 'checkbox')} className="w-4 h-4 rounded text-indigo-600" />
                                                                <span className="text-xs font-bold text-slate-600">{opt}</span>
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
                                    className="w-full bg-slate-900 hover:bg-indigo-600 text-white font-bold py-5 rounded-[2rem] shadow-2xl shadow-slate-300 transition-all flex items-center justify-center gap-3 text-[10px] uppercase tracking-[0.2em]"
                                >
                                    {submitting ? 'Transmitting Data...' : 'Submit Final Application'}
                                </button>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default JobDetails;
