import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams, useNavigate, Link } from 'react-router-dom';

const JobDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();
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
                // Initialize answers array
                const initialAnswers = res.data.questions.map(q => ({
                    questionId: q._id,
                    questionText: q.question,
                    answer: ''
                }));
                setFormData(prev => ({ ...prev, answers: initialAnswers }));
            } catch (error) {
                console.error('Error fetching circular:', error);
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
            alert('Application submitted successfully!');
            navigate('/careers');
        } catch (error) {
            console.error('Error applying:', error);
            alert(error.response?.data?.message || 'Failed to submit application');
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) return (
        <div className="min-h-screen bg-slate-950 flex items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div>
        </div>
    );

    if (!circular) return (
        <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-400">
            Job not found.
        </div>
    );

    return (
        <div className="min-h-screen bg-slate-900 text-slate-100 font-sans">
            <nav className="h-20 border-b border-white/5 flex items-center px-10 sticky top-0 bg-slate-900/80 backdrop-blur-md z-50">
                <Link to="/careers" className="text-slate-400 hover:text-white flex items-center space-x-2 transition-all">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
                    <span className="font-medium text-sm">Back to Careers</span>
                </Link>
            </nav>

            <div className="max-w-6xl mx-auto px-10 py-20 grid grid-cols-1 lg:grid-cols-3 gap-16">
                {/* Job Info */}
                <div className="lg:col-span-2 space-y-12">
                    <div>
                        <div className="flex items-center space-x-3 mb-6">
                            <span className="px-3 py-1 bg-indigo-500/10 text-indigo-400 text-xs font-bold uppercase tracking-widest rounded-lg border border-indigo-400/20">
                                {circular.role}
                            </span>
                            <span className="text-slate-600 text-xs font-bold uppercase tracking-widest">• Engineering Team</span>
                        </div>
                        <h1 className="text-6xl font-black tracking-tight leading-tight mb-8">{circular.title}</h1>
                        <div className="flex flex-wrap gap-8 text-slate-400 font-medium border-y border-white/5 py-8">
                            <div className="flex flex-col">
                                <span className="text-[10px] uppercase tracking-widest text-slate-600 mb-1">Salary Range</span>
                                <span className="text-slate-200">${circular.salaryRange.min.toLocaleString()} - {circular.salaryRange.max.toLocaleString()}</span>
                            </div>
                            <div className="flex flex-col">
                                <span className="text-[10px] uppercase tracking-widest text-slate-600 mb-1">Experience</span>
                                <span className="text-slate-200">{circular.experience}+ Years</span>
                            </div>
                            <div className="flex flex-col">
                                <span className="text-[10px] uppercase tracking-widest text-slate-600 mb-1">Location</span>
                                <span className="text-slate-200">Remote / Bangladesh</span>
                            </div>
                        </div>
                    </div>

                    <div className="prose prose-invert prose-indigo max-w-none">
                        <h2 className="text-3xl font-bold mb-6 text-slate-200">Role Overview</h2>
                        <div dangerouslySetInnerHTML={{ __html: circular.description }} className="text-slate-400 leading-relaxed text-lg" />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                        <div>
                            <h3 className="text-xl font-bold bg-indigo-500/10 text-indigo-400 p-3 mb-6 rounded-xl border border-indigo-500/20 shadow-lg shadow-indigo-500/10">Mandatory Skills</h3>
                            <ul className="space-y-4">
                                {circular.mandatorySkills.map((skill, i) => (
                                    <li key={i} className="flex items-center text-slate-400 text-lg font-medium group">
                                        <div className="w-2 h-2 bg-indigo-500 rounded-full mr-4 group-hover:scale-150 transition-transform"></div>
                                        {skill}
                                    </li>
                                ))}
                            </ul>
                        </div>
                        <div>
                            <h3 className="text-xl font-bold bg-slate-800/10 text-slate-300 p-3 mb-6 rounded-xl border border-slate-700/50">Nice to Have</h3>
                            <ul className="space-y-4">
                                {circular.niceToHaveSkills.map((skill, i) => (
                                    <li key={i} className="flex items-center text-slate-500 text-lg font-medium group">
                                        <div className="w-2 h-2 bg-slate-700 rounded-full mr-4 group-hover:bg-indigo-400/50 transition-colors"></div>
                                        {skill}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>
                </div>

                {/* Apply Form */}
                <div className="lg:col-span-1">
                    <div className="sticky top-32">
                        <div className="bg-slate-800/50 p-8 rounded-[2rem] border border-slate-700/50 backdrop-blur-xl shadow-2xl overflow-hidden relative group">
                            <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-indigo-500 to-transparent"></div>
                            <h2 className="text-2xl font-black mb-8 tracking-tight">Apply for this role</h2>
                            <form onSubmit={handleApply} className="space-y-6 relative">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Full Name</label>
                                    <input
                                        type="text" required
                                        className="w-full bg-slate-900/50 border border-slate-700 p-3.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all font-medium placeholder:text-slate-700"
                                        placeholder="Enter your name"
                                        value={formData.applicant.name}
                                        onChange={(e) => setFormData({ ...formData, applicant: { ...formData.applicant, name: e.target.value } })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Email Address</label>
                                    <input
                                        type="email" required
                                        className="w-full bg-slate-900/50 border border-slate-700 p-3.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all font-medium placeholder:text-slate-700"
                                        placeholder="name@example.com"
                                        value={formData.applicant.email}
                                        onChange={(e) => setFormData({ ...formData, applicant: { ...formData.applicant, email: e.target.value } })}
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Phone</label>
                                        <input
                                            type="text" required
                                            className="w-full bg-slate-900/50 border border-slate-700 p-3.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all font-medium placeholder:text-slate-700"
                                            placeholder="+880..."
                                            value={formData.applicant.phone}
                                            onChange={(e) => setFormData({ ...formData, applicant: { ...formData.applicant, phone: e.target.value } })}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Years Exp.</label>
                                        <input
                                            type="number" required
                                            className="w-full bg-slate-900/50 border border-slate-700 p-3.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all font-medium placeholder:text-slate-700"
                                            placeholder="0"
                                            value={formData.applicant.experience}
                                            onChange={(e) => setFormData({ ...formData, applicant: { ...formData.applicant, experience: e.target.value } })}
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Your Skills (comma separated)</label>
                                    <textarea
                                        required
                                        className="w-full bg-slate-900/50 border border-slate-700 p-3.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all font-medium placeholder:text-slate-700 min-h-[80px]"
                                        placeholder="React, Node.js..."
                                        value={formData.applicant.skills}
                                        onChange={(e) => setFormData({ ...formData, applicant: { ...formData.applicant, skills: e.target.value } })}
                                    />
                                </div>

                                {/* Custom Questions */}
                                {circular.questions.length > 0 && (
                                    <div className="pt-8 border-t border-white/5 space-y-6">
                                        <h3 className="text-sm font-bold uppercase tracking-widest text-indigo-400">Additional Questions</h3>
                                        {circular.questions.map((q, qIndex) => (
                                            <div key={qIndex} className="space-y-3">
                                                <label className="text-sm font-medium text-slate-300">{q.question}</label>
                                                {['text', 'long-text'].includes(q.type) ? (
                                                    <textarea
                                                        required={q.required}
                                                        className="w-full bg-slate-900/50 border border-slate-700 p-3.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all font-medium min-h-[100px]"
                                                        value={formData.answers[qIndex]?.answer}
                                                        onChange={(e) => handleAnswerChange(qIndex, e.target.value)}
                                                    />
                                                ) : (
                                                    <select
                                                        required={q.required}
                                                        className="w-full bg-slate-900/50 border border-slate-700 p-3.5 rounded-xl focus:outline-none"
                                                        value={formData.answers[qIndex]?.answer}
                                                        onChange={(e) => handleAnswerChange(qIndex, e.target.value)}
                                                    >
                                                        <option value="">Select an option</option>
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
                                    className="w-full bg-gradient-to-r from-indigo-600 to-violet-600 hover:scale-[1.02] active:scale-[0.98] text-white font-black py-4 rounded-2xl shadow-2xl shadow-indigo-600/30 transition-all flex items-center justify-center space-x-3 text-lg mt-10 disabled:opacity-50"
                                >
                                    {submitting ? (
                                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
                                    ) : (
                                        <>
                                            <span>Submit Application</span>
                                            <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
                                        </>
                                    )}
                                </button>
                                <div className="text-center">
                                    <p className="text-[10px] text-slate-600 font-bold uppercase tracking-[0.2em]">By applying, you agree to our recruitment terms</p>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default JobDetails;
