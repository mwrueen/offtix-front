import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useToast } from '../../context/ToastContext';

const JobDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const toast = useToast();
    const [circular, setCircular] = useState(null);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    const [formData, setFormData] = useState({
        applicant: {
            name: '', email: '', phone: '', experience: '', skills: ''
        },
        answers: []
    });

    useEffect(() => {
        const fetchCircular = async () => {
            try {
                const res = await axios.get(`/api/recruitment/public/circulars/${id}`);
                setCircular(res.data);
                const initialAnswers = res.data.questions.map(q => ({
                    questionId: q._id,
                    questionText: q.question,
                    answer: ''
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

    const handleAnswerChange = (index, value) => {
        const newAnswers = [...formData.answers];
        newAnswers[index].answer = value;
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
                answers: formData.answers
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
        <div className="min-h-screen bg-slate-50 text-slate-800 font-sans">
            <nav className="h-20 border-b border-slate-200 flex items-center px-10 bg-white sticky top-0 z-50">
                <Link to="/careers" className="text-slate-500 hover:text-indigo-600 flex items-center gap-2 transition-all group font-bold text-sm">
                    <span>←</span>
                    <span className="uppercase tracking-widest text-xs">Back to Careers</span>
                </Link>
            </nav>

            <div className="max-w-[1100px] mx-auto px-6 py-16 grid grid-cols-1 lg:grid-cols-12 gap-12">
                {/* Content */}
                <div className="lg:col-span-7 space-y-12">
                    <div className="space-y-4">
                        <span className="px-3 py-1 bg-indigo-50 text-indigo-600 text-[10px] font-black uppercase tracking-widest rounded-md border border-indigo-100/50">
                            {circular.role}
                        </span>
                        <h1 className="text-4xl font-bold tracking-tight text-slate-900 leading-tight">
                            {circular.title}
                        </h1>
                        <div className="flex gap-6 pt-2">
                            <div className="flex items-center gap-2 text-slate-400 text-xs font-bold uppercase tracking-widest">
                                <span>$</span>
                                {circular.salaryRange.min.toLocaleString()} — {circular.salaryRange.max.toLocaleString()}
                            </div>
                            <div className="flex items-center gap-2 text-slate-400 text-xs font-bold uppercase tracking-widest">
                                <span>⚡</span>
                                {circular.experience}+ Years
                            </div>
                        </div>
                    </div>

                    <div className="prose prose-slate max-w-none">
                        <h2 className="text-xl font-bold text-slate-900 border-b border-slate-100 pb-2 mb-6">About the Role</h2>
                        <div dangerouslySetInnerHTML={{ __html: circular.description }} className="text-slate-600 leading-relaxed text-lg" />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-8">
                        <div className="bg-white rounded-2xl p-8 border border-slate-200">
                            <h3 className="text-xs font-black text-indigo-500 mb-6 uppercase tracking-widest">Required Skills</h3>
                            <div className="flex flex-wrap gap-2">
                                {circular.mandatorySkills.map((s, i) => (
                                    <span key={i} className="px-3 py-1 bg-indigo-50 text-indigo-600 rounded-lg text-xs font-bold border border-indigo-100">#{s}</span>
                                ))}
                            </div>
                        </div>
                        <div className="bg-white rounded-2xl p-8 border border-slate-200">
                            <h3 className="text-xs font-black text-slate-400 mb-6 uppercase tracking-widest">Optional Skills</h3>
                            <div className="flex flex-wrap gap-2">
                                {circular.niceToHaveSkills.map((s, i) => (
                                    <span key={i} className="px-3 py-1 bg-slate-50 text-slate-500 rounded-lg text-xs font-bold border border-slate-100">#{s}</span>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Apply Form */}
                <div className="lg:col-span-5">
                    <div className="sticky top-32">
                        <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-xl shadow-slate-200/50">
                            <h2 className="text-2xl font-bold tracking-tight mb-8">Apply for this position</h2>
                            <form onSubmit={handleApply} className="space-y-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold uppercase text-slate-400 tracking-widest ml-1">Full Name</label>
                                    <input
                                        type="text" required
                                        className="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl focus:border-indigo-600 focus:bg-white outline-none font-medium transition-all"
                                        placeholder="Your Name"
                                        value={formData.applicant.name}
                                        onChange={(e) => setFormData({ ...formData, applicant: { ...formData.applicant, name: e.target.value } })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold uppercase text-slate-400 tracking-widest ml-1">Email Address</label>
                                    <input
                                        type="email" required
                                        className="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl focus:border-indigo-600 focus:bg-white outline-none font-medium transition-all"
                                        placeholder="email@example.com"
                                        value={formData.applicant.email}
                                        onChange={(e) => setFormData({ ...formData, applicant: { ...formData.applicant, email: e.target.value } })}
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-bold uppercase text-slate-400 tracking-widest ml-1">Phone</label>
                                        <input
                                            type="text" required
                                            className="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl outline-none font-medium"
                                            value={formData.applicant.phone}
                                            onChange={(e) => setFormData({ ...formData, applicant: { ...formData.applicant, phone: e.target.value } })}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-bold uppercase text-slate-400 tracking-widest ml-1">Years of Exp</label>
                                        <input
                                            type="number" required
                                            className="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl outline-none font-medium text-center"
                                            value={formData.applicant.experience}
                                            onChange={(e) => setFormData({ ...formData, applicant: { ...formData.applicant, experience: e.target.value } })}
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold uppercase text-slate-400 tracking-widest ml-1">Skills (Comma separated)</label>
                                    <textarea
                                        required
                                        className="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl focus:border-indigo-600 outline-none font-medium min-h-[80px] resize-none"
                                        placeholder="React, Node, etc."
                                        value={formData.applicant.skills}
                                        onChange={(e) => setFormData({ ...formData, applicant: { ...formData.applicant, skills: e.target.value } })}
                                    />
                                </div>

                                {circular.questions.length > 0 && (
                                    <div className="pt-4 space-y-6">
                                        <h3 className="text-xs font-bold uppercase tracking-widest text-indigo-600">Additional Questions</h3>
                                        {circular.questions.map((q, qIndex) => (
                                            <div key={qIndex} className="space-y-2">
                                                <label className="text-sm font-bold text-slate-700 leading-snug">{q.question}</label>
                                                {['text', 'long-text'].includes(q.type) ? (
                                                    <textarea
                                                        required={q.required}
                                                        className="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl outline-none font-medium min-h-[100px]"
                                                        value={formData.answers[qIndex]?.answer}
                                                        onChange={(e) => handleAnswerChange(qIndex, e.target.value)}
                                                    />
                                                ) : (
                                                    <select
                                                        required={q.required}
                                                        className="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl outline-none font-bold text-xs"
                                                        value={formData.answers[qIndex]?.answer}
                                                        onChange={(e) => handleAnswerChange(qIndex, e.target.value)}
                                                    >
                                                        <option value="">Select Option</option>
                                                        {q.options.map((opt, i) => <option key={i} value={opt}>{opt}</option>)}
                                                    </select>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                )}

                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-4 rounded-xl shadow-lg shadow-indigo-100 transition-all flex items-center justify-center gap-2 text-xs uppercase tracking-widest"
                                >
                                    {submitting ? 'Submitting...' : 'Submit Application'}
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
