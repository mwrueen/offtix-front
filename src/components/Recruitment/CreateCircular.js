import React, { useState } from 'react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import Layout from '../Layout';

const CreateCircular = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        title: '',
        role: '',
        minSalary: '',
        maxSalary: '',
        experience: '',
        mandatorySkills: '',
        niceToHaveSkills: '',
        questions: []
    });
    const [description, setDescription] = useState('');

    const [question, setQuestion] = useState({ question: '', type: 'text', options: '', required: true });

    const handleAddQuestion = () => {
        if (!question.question) return;
        setFormData({
            ...formData,
            questions: [...formData.questions, {
                ...question,
                options: question.options ? question.options.split(',').map(o => o.trim()) : []
            }]
        });
        setQuestion({ question: '', type: 'text', options: '', required: true });
    };

    const removeQuestion = (index) => {
        const newQuestions = formData.questions.filter((_, i) => i !== index);
        setFormData({ ...formData, questions: newQuestions });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const data = {
                ...formData,
                description,
                salaryRange: { min: Number(formData.minSalary), max: Number(formData.maxSalary) },
                mandatorySkills: formData.mandatorySkills.split(',').map(s => s.trim()),
                niceToHaveSkills: formData.niceToHaveSkills.split(',').map(s => s.trim())
            };

            const token = localStorage.getItem('token');
            await axios.post('/api/recruitment/circulars', data, {
                headers: { Authorization: `Bearer ${token}` }
            });
            alert('Job Circular Created Successfully!');
            navigate('/recruitment');
        } catch (error) {
            console.error('Error creating circular:', error);
            alert(error.response?.data?.message || 'Failed to create circular');
        } finally {
            setLoading(false);
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
                        <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Create Job Circular</h1>
                    </div>
                    <button
                        type="button"
                        onClick={() => navigate('/recruitment')}
                        className="px-6 py-2 bg-slate-50 hover:bg-slate-100 text-slate-500 rounded-xl font-bold text-sm transition-all border border-slate-200"
                    >
                        Cancel
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-8 bg-white p-10 rounded-[2.5rem] border border-slate-200 shadow-sm relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 to-violet-500 opacity-60"></div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-2">
                            <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 px-1">Job Title</label>
                            <input
                                type="text"
                                required
                                className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all font-medium placeholder:text-slate-300"
                                placeholder="Senior Frontend Developer"
                                value={formData.title}
                                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 px-1">Position Level</label>
                            <input
                                type="text"
                                required
                                className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all font-medium placeholder:text-slate-300"
                                placeholder="e.g. Lead Engineer"
                                value={formData.role}
                                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        <div className="space-y-2">
                            <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 px-1">Min Salary</label>
                            <input
                                type="number"
                                required
                                className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all font-medium"
                                value={formData.minSalary}
                                onChange={(e) => setFormData({ ...formData, minSalary: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 px-1">Max Salary</label>
                            <input
                                type="number"
                                required
                                className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all font-medium"
                                value={formData.maxSalary}
                                onChange={(e) => setFormData({ ...formData, maxSalary: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 px-1">Years of Experience</label>
                            <input
                                type="number"
                                required
                                className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all font-medium"
                                value={formData.experience}
                                onChange={(e) => setFormData({ ...formData, experience: e.target.value })}
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 px-1">Job Description</label>
                        <div className="bg-slate-50 rounded-2xl border border-slate-200 overflow-hidden shadow-inner min-h-[250px]">
                            <ReactQuill
                                theme="snow"
                                value={description}
                                onChange={setDescription}
                                className="h-[200px]"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4">
                        <div className="space-y-2">
                            <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 px-1">Mandatory Skills</label>
                            <textarea
                                required
                                className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all font-medium min-h-[120px]"
                                placeholder="React, Node.js, Next.js..."
                                value={formData.mandatorySkills}
                                onChange={(e) => setFormData({ ...formData, mandatorySkills: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 px-1">Nice to Have</label>
                            <textarea
                                className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all font-medium min-h-[120px]"
                                placeholder="Docker, Kubernetes, AWS..."
                                value={formData.niceToHaveSkills}
                                onChange={(e) => setFormData({ ...formData, niceToHaveSkills: e.target.value })}
                            />
                        </div>
                    </div>

                    <div className="space-y-6 pt-10 border-t border-slate-100">
                        <div className="flex items-center gap-2">
                            <span className="w-8 h-8 bg-indigo-50 text-indigo-600 rounded-lg flex items-center justify-center font-bold shadow-sm border border-indigo-100 italic">?</span>
                            <h3 className="text-xl font-black text-slate-800 tracking-tight">Custom Application Questions</h3>
                        </div>

                        <div className="bg-indigo-50/30 p-8 rounded-3xl border border-indigo-100/50 flex flex-col md:flex-row gap-6 items-end">
                            <div className="flex-1 space-y-2">
                                <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-indigo-400 px-1">The Question</label>
                                <input
                                    type="text"
                                    className="w-full bg-white border border-indigo-100 rounded-xl p-3.5 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all font-medium"
                                    placeholder="e.g. Tell us about your most complex project"
                                    value={question.question}
                                    onChange={(e) => setQuestion({ ...question, question: e.target.value })}
                                />
                            </div>
                            <div className="w-full md:w-48 space-y-2">
                                <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-indigo-400 px-1">Response Type</label>
                                <select
                                    className="w-full bg-white border border-indigo-100 rounded-xl p-3.5 focus:outline-none font-bold text-sm text-slate-700 shadow-sm"
                                    value={question.type}
                                    onChange={(e) => setQuestion({ ...question, type: e.target.value })}
                                >
                                    <option value="text">Short Text</option>
                                    <option value="long-text">Long Text</option>
                                    <option value="selection">Single Choice</option>
                                    <option value="multiple-choice">Multi Choice</option>
                                </select>
                            </div>
                            <button
                                type="button"
                                onClick={handleAddQuestion}
                                className="px-8 py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-black rounded-xl transition-all shadow-lg shadow-indigo-600/30"
                            >
                                Add Question
                            </button>
                        </div>

                        <div className="space-y-3">
                            {formData.questions.map((q, index) => (
                                <div key={index} className="flex items-center justify-between bg-white px-6 py-4 rounded-2xl border border-slate-100 shadow-sm group">
                                    <div className="flex items-center gap-4">
                                        <span className="w-6 h-6 bg-slate-50 text-slate-400 rounded flex items-center justify-center text-[10px] font-bold italic">{index + 1}</span>
                                        <div>
                                            <p className="font-bold text-slate-700">{q.question}</p>
                                            <p className="text-[10px] uppercase font-black text-indigo-400 tracking-widest">{q.type}</p>
                                        </div>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => removeQuestion(index)}
                                        className="p-2 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-all"
                                    >
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-4v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="pt-12 border-t border-slate-100">
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-gradient-to-r from-indigo-600 to-violet-600 hover:scale-[1.01] active:scale-[0.99] transform text-white font-black py-5 rounded-[2rem] shadow-2xl shadow-indigo-600/30 transition-all flex items-center justify-center space-x-3 text-lg disabled:opacity-50"
                        >
                            {loading ? (
                                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
                            ) : (
                                <>
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" /></svg>
                                    <span>Publish Job Circular</span>
                                </>
                            )}
                        </button>
                        <div className="text-center mt-6">
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.2em]">Once published, candidates will see it in the Careers portal</p>
                        </div>
                    </div>
                </form>
            </div>
        </Layout>
    );
};

export default CreateCircular;
