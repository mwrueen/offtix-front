import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import Layout from '../Layout';
import PageHeader from '../PageHeader';
import SkillsSelector from './SkillsSelector';
import { useCompanyFilter } from '../../hooks/useCompanyFilter';
import { useToast } from '../../context/ToastContext';
import { usePermissions, PERMISSIONS } from '../../context/PermissionsContext';
import { getCookie } from '../../utils/cookies';

const CreateCircular = () => {
    const navigate = useNavigate();
    const { selectedCompany } = useCompanyFilter();
    const toast = useToast();
    const { hasPermission } = usePermissions();
    const [step, setStep] = useState(1);
    const [designations, setDesignations] = useState([]);

    const canManageRecruitment = hasPermission(PERMISSIONS.MANAGE_RECRUITMENT);

    useEffect(() => {
        if (!canManageRecruitment && selectedCompany?.id !== 'personal') {
            toast.showToast('You do not have permission to manage recruitment', 'error');
            navigate('/recruitment');
        }
    }, [canManageRecruitment, navigate, selectedCompany]);

    const [formData, setFormData] = useState({
        title: '',
        role: '',
        salaryRange: { min: '', max: '' },
        experience: 0,
        description: '',
        mandatorySkills: [],
        niceToHaveSkills: [],
        questions: []
    });

    useEffect(() => {
        if (selectedCompany?.id && selectedCompany.id !== 'personal') {
            fetchDesignations();
        }
    }, [selectedCompany]);

    const fetchDesignations = async () => {
        try {
            const token = getCookie('authToken');
            const res = await axios.get(`/api/companies/${selectedCompany.id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setDesignations(res.data.designations || []);
        } catch (error) {
            console.error('Error fetching designations:', error);
        }
    };

    const addQuestion = () => {
        setFormData({
            ...formData,
            questions: [...formData.questions, { question: '', type: 'text', required: true, options: [] }]
        });
    };

    const handleSubmit = async () => {
        try {
            const token = getCookie('authToken');
            await axios.post('/api/recruitment/circulars', formData, {
                headers: { Authorization: `Bearer ${token}` }
            });
            toast.showToast('Job circular published successfully', 'success');
            navigate('/recruitment');
        } catch (error) {
            toast.showToast(error.response?.data?.message || 'Failed to publish circular', 'error');
        }
    };

    const steps = [
        { id: 1, label: 'Job Info' },
        { id: 2, label: 'Description' },
        { id: 3, label: 'Assessment' }
    ];

    return (
        <Layout>
            <div className="max-w-[1200px] mx-auto py-10 px-4 space-y-8 pb-32">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Create Job Circular</h1>
                        <p className="text-slate-500 text-sm">Post a new opening for {selectedCompany?.name}</p>
                    </div>

                    <div className="flex bg-slate-100 p-1 rounded-xl">
                        {steps.map(s => (
                            <button
                                key={s.id}
                                onClick={() => setStep(s.id)}
                                className={`px-6 py-2 rounded-lg text-xs font-bold transition-all ${step === s.id ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                            >
                                {s.label}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                    {/* Form Section */}
                    <div className="lg:col-span-8 bg-white border border-slate-200 rounded-2xl shadow-sm p-8">
                        {step === 1 && (
                            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2">
                                <div className="grid grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-[11px] font-bold uppercase text-slate-400">Internal Job Title</label>
                                        <input
                                            type="text"
                                            className="w-full bg-slate-50 border border-slate-200 p-2.5 rounded-xl focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all font-medium"
                                            placeholder="e.g. Senior Frontend Engineer"
                                            value={formData.title}
                                            onChange={e => setFormData({ ...formData, title: e.target.value })}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[11px] font-bold uppercase text-slate-400">Designation Level</label>
                                        <select
                                            className="w-full bg-slate-50 border border-slate-200 p-2.5 rounded-xl focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all font-medium"
                                            value={formData.role}
                                            onChange={e => setFormData({ ...formData, role: e.target.value })}
                                        >
                                            <option value="">Select Level</option>
                                            {designations.map(d => <option key={d._id} value={d.name}>{d.name}</option>)}
                                        </select>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <label className="text-[11px] font-bold uppercase text-slate-400">Salary Range (Monthly)</label>
                                    <div className="grid grid-cols-2 gap-6">
                                        <div className="relative">
                                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-sm">$</span>
                                            <input
                                                type="number"
                                                className="w-full bg-slate-50 border border-slate-200 p-2.5 pl-8 rounded-xl outline-none"
                                                placeholder="Min"
                                                value={formData.salaryRange.min}
                                                onChange={e => setFormData({ ...formData, salaryRange: { ...formData.salaryRange, min: e.target.value } })}
                                            />
                                        </div>
                                        <div className="relative">
                                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-sm">$</span>
                                            <input
                                                type="number"
                                                className="w-full bg-slate-50 border border-slate-200 p-2.5 pl-8 rounded-xl outline-none"
                                                placeholder="Max"
                                                value={formData.salaryRange.max}
                                                onChange={e => setFormData({ ...formData, salaryRange: { ...formData.salaryRange, max: e.target.value } })}
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <label className="text-[11px] font-bold uppercase text-slate-400">Min Experience (Years)</label>
                                    <input
                                        type="number"
                                        className="w-full bg-slate-50 border border-slate-200 p-2.5 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all font-medium"
                                        placeholder="Enter years of experience"
                                        value={formData.experience}
                                        onChange={e => setFormData({ ...formData, experience: Number(e.target.value) })}
                                    />
                                </div>

                                <div className="flex gap-4 pt-4">
                                    <button onClick={() => setStep(2)} className="flex-1 bg-slate-900 text-white py-3 rounded-xl font-bold text-sm hover:bg-indigo-600 transition-all">Continue to Description</button>
                                </div>
                            </div>
                        )}

                        {step === 2 && (
                            <div className="space-y-8 animate-in fade-in">
                                <div className="space-y-4">
                                    <label className="text-[11px] font-bold uppercase text-slate-400">Job Description</label>
                                    <div className="h-64 mb-8">
                                        <ReactQuill theme="snow" value={formData.description} onChange={val => setFormData({ ...formData, description: val })} className="h-48" />
                                    </div>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-12">
                                    <SkillsSelector label="Mandatory Skills" selectedSkills={formData.mandatorySkills} setSelectedSkills={skills => setFormData({ ...formData, mandatorySkills: skills })} />
                                    <SkillsSelector label="Nice to Have" selectedSkills={formData.niceToHaveSkills} setSelectedSkills={skills => setFormData({ ...formData, niceToHaveSkills: skills })} />
                                </div>
                                <div className="flex gap-4 pt-6">
                                    <button onClick={() => setStep(1)} className="px-6 py-3 bg-slate-100 text-slate-600 rounded-xl font-bold text-sm">Back</button>
                                    <button onClick={() => setStep(3)} className="flex-1 bg-slate-900 text-white py-3 rounded-xl font-bold text-sm">Review & Screening</button>
                                </div>
                            </div>
                        )}

                        {step === 3 && (
                            <div className="space-y-8 animate-in fade-in">
                                <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                                    <h3 className="font-bold text-slate-700">Custom Screening Questions</h3>
                                    <button onClick={addQuestion} className="text-indigo-600 text-xs font-bold hover:underline">+ Add Question</button>
                                </div>
                                <div className="space-y-4">
                                    {formData.questions.map((q, i) => (
                                        <div key={i} className="p-6 bg-slate-50 rounded-2xl border border-slate-100 space-y-4 relative">
                                            <button
                                                onClick={() => setFormData({ ...formData, questions: formData.questions.filter((_, idx) => idx !== i) })}
                                                className="absolute top-4 right-4 text-slate-300 hover:text-rose-500"
                                            >×</button>
                                            <input
                                                type="text"
                                                className="w-full bg-white border border-slate-200 p-3 rounded-xl outline-none text-sm font-medium"
                                                placeholder="Ask something..."
                                                value={q.question}
                                                onChange={e => {
                                                    const qs = [...formData.questions];
                                                    qs[i].question = e.target.value;
                                                    setFormData({ ...formData, questions: qs });
                                                }}
                                            />
                                            <div className="flex gap-4">
                                                <select
                                                    className="flex-1 bg-white border border-slate-200 p-2 text-xs rounded-lg font-bold text-slate-500 outline-none"
                                                    value={q.type}
                                                    onChange={e => {
                                                        const qs = [...formData.questions];
                                                        qs[i].type = e.target.value;
                                                        setFormData({ ...formData, questions: qs });
                                                    }}
                                                >
                                                    <option value="text">Short Text</option>
                                                    <option value="long-text">Extended Text</option>
                                                    <option value="selection">Selection List</option>
                                                </select>
                                                <label className="flex items-center gap-2 cursor-pointer">
                                                    <input type="checkbox" checked={q.required} onChange={e => {
                                                        const qs = [...formData.questions];
                                                        qs[i].required = e.target.checked;
                                                        setFormData({ ...formData, questions: qs });
                                                    }} />
                                                    <span className="text-xs font-bold text-slate-400 uppercase">Required</span>
                                                </label>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                <div className="flex gap-4 pt-6">
                                    <button onClick={() => setStep(2)} className="px-6 py-3 bg-slate-100 text-slate-600 rounded-xl font-bold text-sm">Back</button>
                                    <button onClick={handleSubmit} className="flex-1 bg-indigo-600 text-white py-3 rounded-xl font-bold text-sm shadow-lg shadow-indigo-100">Publish Circular</button>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Simple Preview Card */}
                    <div className="lg:col-span-4">
                        <div className="sticky top-10 space-y-6">
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-2">Live Preview</p>
                            <div className="bg-white border border-slate-200 rounded-3xl p-8 shadow-sm">
                                <div className="space-y-6">
                                    <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center text-xl font-bold text-indigo-600">
                                        {formData.title ? formData.title.charAt(0) : '?'}
                                    </div>
                                    <div className="space-y-1">
                                        <h2 className="text-xl font-bold text-slate-900 leading-tight">{formData.title || 'Untitled Role'}</h2>
                                        <p className="text-sm font-bold text-indigo-500 uppercase tracking-wide">{formData.role || 'Designation'}</p>
                                    </div>
                                    <div className="flex flex-wrap gap-2">
                                        <span className="px-2.5 py-1 bg-slate-50 text-slate-500 text-[9px] font-black uppercase rounded-md border border-slate-100">Full Time</span>
                                        {formData.experience > 0 && <span className="px-2.5 py-1 bg-slate-50 text-slate-500 text-[9px] font-black uppercase rounded-md border border-slate-100">{formData.experience}y+ exp</span>}
                                    </div>
                                    <div className="pt-4 border-t border-slate-50">
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Salary Range</p>
                                        <p className="text-lg font-bold text-slate-700">
                                            {formData.salaryRange.min && formData.salaryRange.max
                                                ? `$${Number(formData.salaryRange.min).toLocaleString()} - $${Number(formData.salaryRange.max).toLocaleString()}`
                                                : 'Competitive Salary'}
                                        </p>
                                    </div>
                                    <button className="w-full py-4 bg-slate-900 text-white rounded-xl font-bold text-xs uppercase tracking-widest mt-4">Apply Now</button>
                                </div>
                            </div>
                            <div className="bg-amber-50 border border-amber-100 p-6 rounded-2xl space-y-2">
                                <h4 className="text-xs font-bold text-amber-900 uppercase">Reviewer Note</h4>
                                <p className="text-xs text-amber-700 leading-relaxed font-medium">This is how your job posting will appear on the public careers page. Ensure all details are accurate before publishing.</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </Layout>
    );
};

export default CreateCircular;
