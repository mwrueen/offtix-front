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
        jobNature: 'on-site',
        location: '',
        benefits: '',
        mandatorySkills: [],
        niceToHaveSkills: [],
        questions: []
    });

    useEffect(() => {
        if (selectedCompany?.id && selectedCompany.id !== 'personal') {
            fetchDesignations();
            // Pre-fill location if company address exists
            if (selectedCompany.address) {
                setFormData(prev => ({ ...prev, location: selectedCompany.address }));
            }
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
            // Clean up empty options before submission
            const cleanedFormData = {
                ...formData,
                questions: formData.questions.map(q => ({
                    ...q,
                    options: q.options.filter(o => o.trim() !== '')
                }))
            };
            await axios.post('/api/recruitment/circulars', cleanedFormData, {
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
        { id: 2, label: 'Content' },
        { id: 3, label: 'Assessment' }
    ];

    return (
        <Layout>
            <div className="max-w-[1200px] mx-auto py-10 px-4 space-y-8 pb-32">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Create Job Circular</h1>
                        <p className="text-slate-400 text-sm font-medium">Hiring for {selectedCompany?.name || 'Offtix Organization'}</p>
                    </div>

                    <div className="flex bg-slate-100/50 p-1 rounded-xl border border-slate-200">
                        {steps.map(s => (
                            <button
                                key={s.id}
                                onClick={() => setStep(s.id)}
                                className={`px-6 py-2 rounded-lg text-xs font-bold transition-all ${step === s.id ? 'bg-white text-indigo-600 shadow-sm border border-slate-200' : 'text-slate-400 hover:text-slate-600'}`}
                            >
                                {s.label}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                    {/* Form Section */}
                    <div className="lg:col-span-8 bg-white border border-slate-200 rounded-3xl shadow-sm p-10 space-y-10">
                        {step === 1 && (
                            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
                                <div className="grid grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-[9px] font-bold uppercase text-slate-400 tracking-widest ml-1">Internal Job Title</label>
                                        <input
                                            type="text"
                                            className="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl focus:ring-4 focus:ring-indigo-100 outline-none transition-all font-bold text-slate-700 shadow-inner text-sm"
                                            placeholder="e.g. Senior Frontend Engineer"
                                            value={formData.title}
                                            onChange={e => setFormData({ ...formData, title: e.target.value })}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[9px] font-bold uppercase text-slate-400 tracking-widest ml-1">Designation Level</label>
                                        <select
                                            className="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl outline-none font-bold text-slate-700 text-sm"
                                            value={formData.role}
                                            onChange={e => setFormData({ ...formData, role: e.target.value })}
                                        >
                                            <option value="">Select Level</option>
                                            {designations.map(d => <option key={d._id} value={d.name}>{d.name}</option>)}
                                        </select>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-[9px] font-bold uppercase text-slate-400 tracking-widest ml-1">Job Nature</label>
                                        <select
                                            className="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl outline-none font-bold text-slate-700 text-sm"
                                            value={formData.jobNature}
                                            onChange={e => setFormData({ ...formData, jobNature: e.target.value })}
                                        >
                                            <option value="remote">Remote</option>
                                            <option value="on-site">On-Site</option>
                                            <option value="hybrid">Hybrid</option>
                                        </select>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[9px] font-bold uppercase text-slate-400 tracking-widest ml-1">Workplace Address</label>
                                        <textarea
                                            className="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl outline-none font-bold text-slate-700 shadow-inner min-h-[80px] resize-none text-sm"
                                            placeholder="Full Address / Venue Details..."
                                            value={formData.location}
                                            onChange={e => setFormData({ ...formData, location: e.target.value })}
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-[9px] font-bold uppercase text-slate-400 tracking-widest ml-1">Salary Range (Monthly)</label>
                                        <div className="grid grid-cols-2 gap-3">
                                            <input
                                                type="number"
                                                className="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl outline-none font-bold shadow-inner text-sm"
                                                placeholder="Min"
                                                value={formData.salaryRange.min}
                                                onChange={e => setFormData({ ...formData, salaryRange: { ...formData.salaryRange, min: e.target.value } })}
                                            />
                                            <input
                                                type="number"
                                                className="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl outline-none font-bold shadow-inner text-sm"
                                                placeholder="Max"
                                                value={formData.salaryRange.max}
                                                onChange={e => setFormData({ ...formData, salaryRange: { ...formData.salaryRange, max: e.target.value } })}
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[9px] font-bold uppercase text-slate-400 tracking-widest ml-1">Min Experience (Years)</label>
                                        <input
                                            type="number"
                                            className="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl outline-none font-bold shadow-inner text-sm"
                                            value={formData.experience}
                                            onChange={e => setFormData({ ...formData, experience: Number(e.target.value) })}
                                        />
                                    </div>
                                </div>

                                <div className="flex gap-4 pt-6 border-t border-slate-50">
                                    <button onClick={() => setStep(2)} className="w-full bg-slate-900 text-white font-bold py-4 rounded-xl text-[10px] uppercase tracking-[0.2em] shadow-xl hover:bg-slate-800 transition-all">Continue to Content</button>
                                </div>
                            </div>
                        )}

                        {step === 2 && (
                            <div className="space-y-8 animate-in fade-in">
                                <div className="grid grid-cols-1 gap-12">
                                    <div className="space-y-4">
                                        <label className="text-[10px] font-bold uppercase text-slate-400 tracking-widest ml-1">Job Description</label>
                                        <div className="h-64 mb-12">
                                            <ReactQuill theme="snow" value={formData.description} onChange={val => setFormData({ ...formData, description: val })} className="h-48" />
                                        </div>
                                    </div>
                                    <div className="space-y-4">
                                        <label className="text-[10px] font-bold uppercase text-slate-400 tracking-widest ml-1">Perks & Benefits</label>
                                        <div className="h-64 mb-12">
                                            <ReactQuill theme="snow" placeholder="Healthcare, Bonuses, Flexible hours..." value={formData.benefits} onChange={val => setFormData({ ...formData, benefits: val })} className="h-48" />
                                        </div>
                                    </div>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-10 pt-16 border-t border-slate-50">
                                    <SkillsSelector label="Mandatory Skills" selectedSkills={formData.mandatorySkills} setSelectedSkills={skills => setFormData({ ...formData, mandatorySkills: skills })} />
                                    <SkillsSelector label="Nice to Have" selectedSkills={formData.niceToHaveSkills} setSelectedSkills={skills => setFormData({ ...formData, niceToHaveSkills: skills })} />
                                </div>
                                <div className="flex gap-4 pt-10">
                                    <button onClick={() => setStep(1)} className="px-10 py-4 bg-slate-50 text-slate-500 rounded-2xl font-bold text-[10px] uppercase tracking-widest border border-slate-100">Back</button>
                                    <button onClick={() => setStep(3)} className="flex-1 bg-slate-900 text-white py-4 rounded-2xl font-bold text-[10px] uppercase tracking-widest hover:bg-indigo-600 transition-all shadow-xl">Review & Screening</button>
                                </div>
                            </div>
                        )}

                        {step === 3 && (
                            <div className="space-y-10 animate-in fade-in">
                                <div className="flex items-center justify-between border-b border-slate-100 pb-6">
                                    <div className="space-y-1">
                                        <h3 className="font-bold text-slate-900">Screening Questions</h3>
                                        <p className="text-xs text-slate-400 font-medium italic">Add questions to pre-filter candidates</p>
                                    </div>
                                    <button
                                        onClick={addQuestion}
                                        className="px-4 py-2 bg-indigo-50 text-indigo-600 rounded-lg text-[10px] font-bold uppercase tracking-widest hover:bg-indigo-600 hover:text-white transition-all border border-indigo-100"
                                    >+ New</button>
                                </div>
                                <div className="grid gap-6">
                                    {formData.questions.map((q, i) => (
                                        <div key={i} className="p-8 bg-slate-50 rounded-3xl border border-slate-100 space-y-6 relative group border-l-[6px] border-l-indigo-400 hover:border-l-indigo-600 transition-all">
                                            <button
                                                onClick={() => setFormData({ ...formData, questions: formData.questions.filter((_, idx) => idx !== i) })}
                                                className="absolute top-6 right-6 w-8 h-8 flex items-center justify-center bg-white border border-slate-200 text-rose-500 rounded-lg hover:bg-rose-50 shadow-sm opacity-0 group-hover:opacity-100 transition-all"
                                            >×</button>

                                            <div className="space-y-3">
                                                <label className="text-[10px] font-bold uppercase text-slate-400 tracking-widest">Question Text</label>
                                                <input
                                                    type="text"
                                                    className="w-full bg-white border border-slate-200 p-4 rounded-2xl outline-none font-bold text-slate-700 shadow-inner"
                                                    placeholder="Ask something..."
                                                    value={q.question}
                                                    onChange={e => {
                                                        const qs = [...formData.questions];
                                                        qs[i].question = e.target.value;
                                                        setFormData({ ...formData, questions: qs });
                                                    }}
                                                />
                                            </div>

                                            <div className="grid grid-cols-2 gap-6">
                                                <div className="space-y-3">
                                                    <label className="text-[10px] font-bold uppercase text-slate-400 tracking-widest">Answer Type</label>
                                                    <select
                                                        className="w-full bg-white border border-slate-200 p-3 rounded-xl font-bold text-[10px] uppercase text-slate-500 outline-none"
                                                        value={q.type}
                                                        onChange={e => {
                                                            const qs = [...formData.questions];
                                                            qs[i].type = e.target.value;
                                                            setFormData({ ...formData, questions: qs });
                                                        }}
                                                    >
                                                        <option value="text">Short Input</option>
                                                        <option value="long-text">Long Answer</option>
                                                        <option value="selection">Selection List</option>
                                                        <option value="radio">Radio Buttons</option>
                                                        <option value="checkbox">Checkboxes</option>
                                                    </select>
                                                </div>
                                                <div className="space-y-3">
                                                    <label className="text-[10px] font-bold uppercase text-slate-400 tracking-widest">Requirement</label>
                                                    <div className="flex items-center gap-3 px-4 py-3 bg-white border border-slate-200 rounded-xl">
                                                        <input type="checkbox" className="w-4 h-4 rounded-md text-indigo-600" checked={q.required} onChange={e => {
                                                            const qs = [...formData.questions];
                                                            qs[i].required = e.target.checked;
                                                            setFormData({ ...formData, questions: qs });
                                                        }} />
                                                        <span className="text-[10px] font-bold uppercase text-slate-400 tracking-widest">Mandatory</span>
                                                    </div>
                                                </div>
                                            </div>

                                            {['selection', 'radio', 'checkbox'].includes(q.type) && (
                                                <div className="space-y-4 animate-in slide-in-from-top-2">
                                                    <div className="flex items-center justify-between">
                                                        <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Options</label>
                                                        <button
                                                            onClick={() => {
                                                                const qs = [...formData.questions];
                                                                qs[i].options = [...qs[i].options, ''];
                                                                setFormData({ ...formData, questions: qs });
                                                            }}
                                                            className="text-[9px] font-black uppercase text-indigo-600 hover:text-indigo-700 underline tracking-widest"
                                                        >+ Add Option</button>
                                                    </div>
                                                    <div className="grid gap-3">
                                                        {q.options.map((opt, optIdx) => (
                                                            <div key={optIdx} className="flex gap-2">
                                                                <input
                                                                    type="text"
                                                                    className="flex-1 bg-white border border-slate-200 p-3 rounded-xl outline-none font-bold text-slate-700 shadow-inner text-sm"
                                                                    placeholder={`Option ${optIdx + 1}`}
                                                                    value={opt}
                                                                    onChange={e => {
                                                                        const qs = [...formData.questions];
                                                                        qs[i].options[optIdx] = e.target.value;
                                                                        setFormData({ ...formData, questions: qs });
                                                                    }}
                                                                />
                                                                <button
                                                                    onClick={() => {
                                                                        const qs = [...formData.questions];
                                                                        qs[i].options = qs[i].options.filter((_, idx) => idx !== optIdx);
                                                                        setFormData({ ...formData, questions: qs });
                                                                    }}
                                                                    className="w-10 h-10 flex items-center justify-center text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all"
                                                                >🗑️</button>
                                                            </div>
                                                        ))}
                                                        {q.options.length === 0 && (
                                                            <p className="text-[10px] text-slate-400 italic">No options added. Click 'Add Option' to begin.</p>
                                                        )}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                                <div className="flex gap-4 pt-10 border-t border-slate-100">
                                    <button onClick={() => setStep(2)} className="px-10 py-4 bg-slate-50 text-slate-500 rounded-xl font-bold text-xs">Back</button>
                                    <button onClick={handleSubmit} className="flex-1 bg-indigo-600 text-white py-4 rounded-xl font-bold text-xs shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all">Publish Circular</button>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Simple Preview Card */}
                    <div className="lg:col-span-4 space-y-6">
                        <div className="sticky top-10 space-y-6">
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest pl-1">Live Preview</p>
                            <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-4">
                                <div className="flex gap-4">
                                    <div className="w-12 h-12 bg-indigo-600 rounded-lg flex items-center justify-center text-xl font-bold text-white shadow-md">
                                        {formData.title ? formData.title.charAt(0) : '?'}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h2 className="text-lg font-bold text-indigo-600 line-clamp-1">{formData.title || 'Job Title'}</h2>
                                        <p className="text-sm font-medium text-slate-900">{selectedCompany?.name || 'Offtix Organization'}</p>
                                        <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium mt-0.5">
                                            <span>{formData.location || 'Remote'}</span>
                                            <span className="text-slate-300">•</span>
                                            <span className="capitalize">{formData.jobNature}</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex flex-wrap gap-2 pt-2">
                                    {formData.mandatorySkills.slice(0, 2).map((s, i) => (
                                        <span key={i} className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100 italic">#{s}</span>
                                    ))}
                                    <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-100">
                                        💰 {formData.salaryRange.min ? `$${Number(formData.salaryRange.min).toLocaleString()}` : '—'}
                                    </span>
                                </div>

                                <div className="pt-4 border-t border-slate-50">
                                    <button className="w-full py-3 bg-slate-900 text-white rounded-full text-xs font-bold shadow-lg hover:bg-slate-800 transition-all">Preview Full Detail</button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </Layout>
    );
};

export default CreateCircular;
