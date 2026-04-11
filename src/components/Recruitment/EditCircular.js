import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate, useParams } from 'react-router-dom';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import Layout from '../Layout';
import SkillsSelector from './SkillsSelector';
import { useCompanyFilter } from '../../hooks/useCompanyFilter';
import { useToast } from '../../context/ToastContext';
import { usePermissions, PERMISSIONS } from '../../context/PermissionsContext';
import { getCookie } from '../../utils/cookies';

const EditCircular = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { selectedCompany } = useCompanyFilter();
    const toast = useToast();
    const { hasPermission } = usePermissions();
    const [step, setStep] = useState(1);
    const [designations, setDesignations] = useState([]);
    const [loading, setLoading] = useState(true);

    const canManageRecruitment = hasPermission(PERMISSIONS.MANAGE_RECRUITMENT);

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
        questions: [],
        status: 'active'
    });

    useEffect(() => {
        if (!canManageRecruitment && selectedCompany?.id !== 'personal') {
            toast.showToast('You do not have permission to manage recruitment', 'error');
            navigate('/recruitment');
        }
    }, [canManageRecruitment, navigate, selectedCompany]);

    useEffect(() => {
        const fetchDetails = async () => {
            try {
                const res = await axios.get(`/api/recruitment/public/circulars/${id}`);
                const data = res.data;
                setFormData({
                    title: data.title || '',
                    role: data.role || '',
                    salaryRange: data.salaryRange || { min: '', max: '' },
                    experience: data.experience || 0,
                    description: data.description || '',
                    jobNature: data.jobNature || 'on-site',
                    location: data.location || '',
                    benefits: data.benefits || '',
                    mandatorySkills: data.mandatorySkills || [],
                    niceToHaveSkills: data.niceToHaveSkills || [],
                    questions: data.questions || [],
                    status: data.status || 'active'
                });
                if (selectedCompany?.id && selectedCompany.id !== 'personal') {
                    fetchDesignations();
                }
            } catch (error) {
                toast.showToast('Failed to load circular data', 'error');
                navigate('/recruitment');
            } finally {
                setLoading(false);
            }
        };
        fetchDetails();
    }, [id]);

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

    const handleSubmit = async () => {
        try {
            const token = getCookie('authToken');
            // Clean up empty options before submission
            const cleanedFormData = {
                ...formData,
                questions: formData.questions.map(q => ({
                    ...q,
                    options: [...new Set(q.options.filter(o => o.trim() !== ''))]
                }))
            };
            await axios.put(`/api/recruitment/circulars/${id}`, cleanedFormData, {
                headers: { Authorization: `Bearer ${token}` }
            });
            toast.showToast('Job circular updated successfully', 'success');
            navigate('/recruitment');
        } catch (error) {
            toast.showToast(error.response?.data?.message || 'Failed to update circular', 'error');
        }
    };

    const addQuestion = () => {
        setFormData({
            ...formData,
            questions: [...formData.questions, { question: '', type: 'text', required: true, options: [] }]
        });
    };

    const handleDelete = async () => {
        if (!window.confirm('Are you sure you want to delete this job circular?')) return;
        try {
            const token = getCookie('authToken');
            await axios.delete(`/api/recruitment/circulars/${id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            toast.showToast('Circular deleted', 'success');
            navigate('/recruitment');
        } catch (error) {
            toast.showToast('Failed to delete', 'error');
        }
    };

    if (loading) return (
        <Layout>
            <div className="flex h-screen items-center justify-center">
                <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
            </div>
        </Layout>
    );

    const steps = [
        { id: 1, label: 'Job Info' },
        { id: 2, label: 'Content' },
        { id: 3, label: 'Assessment' }
    ];

    return (
        <Layout>
            <div className="space-y-8 animate-in fade-in pb-20">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm transition-all">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Edit Job Circular</h1>
                        <p className="text-slate-500 text-sm font-medium mt-1">Modifying {formData.title}</p>
                    </div>

                    <div className="flex items-center gap-4 shrink-0">
                        <div className="flex bg-slate-50 p-1 rounded-xl border border-slate-200">
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
                        <button onClick={handleDelete} className="p-2.5 bg-white text-rose-500 border border-slate-200 rounded-xl hover:bg-rose-50 hover:border-rose-100 transition-all shadow-sm">
                            🗑️
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    <div className="lg:col-span-8 bg-white border border-slate-200 rounded-2xl shadow-sm p-8 space-y-8">
                        {step === 1 && (
                            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
                                <div className="grid grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-[9px] font-black uppercase text-slate-400 tracking-widest ml-1">Job Title</label>
                                        <input
                                            type="text"
                                            className="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl focus:ring-4 focus:ring-indigo-100 outline-none transition-all font-bold text-slate-700 shadow-inner text-sm"
                                            value={formData.title}
                                            onChange={e => setFormData({ ...formData, title: e.target.value })}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[9px] font-black uppercase text-slate-400 tracking-widest ml-1">Status</label>
                                        <select
                                            className="w-full bg-slate-100/50 border border-slate-200 p-3 rounded-xl outline-none font-black text-[9px] uppercase tracking-widest text-indigo-600 shadow-inner"
                                            value={formData.status}
                                            onChange={e => setFormData({ ...formData, status: e.target.value })}
                                        >
                                            <option value="active">Active Listing</option>
                                            <option value="closed">Closed / Ended</option>
                                            <option value="paused">Paused / Hidden</option>
                                            <option value="draft">Internal Draft</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-[9px] font-black uppercase text-slate-400 tracking-widest ml-1">Position Level</label>
                                        <select
                                            className="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl outline-none font-bold text-slate-700 text-sm"
                                            value={formData.role}
                                            onChange={e => setFormData({ ...formData, role: e.target.value })}
                                        >
                                            <option value="">Select Level</option>
                                            {designations.map(d => <option key={d._id} value={d.name}>{d.name}</option>)}
                                        </select>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[9px] font-black uppercase text-slate-400 tracking-widest ml-1">Required Exp (Years)</label>
                                        <input
                                            type="number"
                                            className="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl outline-none font-bold text-sm shadow-inner"
                                            value={formData.experience}
                                            onChange={e => setFormData({ ...formData, experience: Number(e.target.value) })}
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-[9px] font-black uppercase text-slate-400 tracking-widest ml-1">Job Nature</label>
                                        <select
                                            className="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl outline-none font-bold text-slate-700 text-sm"
                                            value={formData.jobNature}
                                            onChange={e => setFormData({ ...formData, jobNature: e.target.value })}
                                        >
                                            <option value="on-site">On-Site</option>
                                            <option value="remote">Remote</option>
                                            <option value="hybrid">Hybrid</option>
                                        </select>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[9px] font-black uppercase text-slate-400 tracking-widest ml-1">Workplace Address</label>
                                        <textarea
                                            className="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl outline-none font-bold text-slate-700 shadow-inner min-h-[80px] resize-none text-sm"
                                            placeholder="Full Address / Venue Details..."
                                            value={formData.location}
                                            onChange={e => setFormData({ ...formData, location: e.target.value })}
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[9px] font-black uppercase text-slate-400 tracking-widest ml-1">Salary Range</label>
                                    <div className="grid grid-cols-2 gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                        <input
                                            type="number"
                                            className="w-full bg-white border border-slate-200 p-3 rounded-xl outline-none font-bold shadow-sm text-sm"
                                            placeholder="Min"
                                            value={formData.salaryRange.min}
                                            onChange={e => setFormData({ ...formData, salaryRange: { ...formData.salaryRange, min: e.target.value } })}
                                        />
                                        <input
                                            type="number"
                                            className="w-full bg-white border border-slate-200 p-3 rounded-xl outline-none font-bold shadow-sm text-sm"
                                            placeholder="Max"
                                            value={formData.salaryRange.max}
                                            onChange={e => setFormData({ ...formData, salaryRange: { ...formData.salaryRange, max: e.target.value } })}
                                        />
                                    </div>
                                </div>

                                <div className="flex gap-4 pt-6 border-t border-slate-50">
                                    <button onClick={() => setStep(2)} className="w-full bg-slate-900 text-white font-black py-4 rounded-xl text-[10px] uppercase tracking-[0.2em] shadow-xl hover:bg-slate-800 transition-all">Next: Content & Perks</button>
                                </div>
                            </div>
                        )}

                        {step === 2 && (
                            <div className="space-y-10 animate-in fade-in">
                                <div className="grid grid-cols-1 gap-12">
                                    <div className="space-y-4">
                                        <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Job Description</label>
                                        <div className="h-64 mb-12">
                                            <ReactQuill theme="snow" value={formData.description} onChange={val => setFormData({ ...formData, description: val })} className="h-48" />
                                        </div>
                                    </div>
                                    <div className="space-y-4">
                                        <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Benefits & Compensation</label>
                                        <div className="h-64 mb-12">
                                            <ReactQuill theme="snow" value={formData.benefits} onChange={val => setFormData({ ...formData, benefits: val })} className="h-48" />
                                        </div>
                                    </div>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-10 pt-16 border-t border-slate-100">
                                    <SkillsSelector label="Mandatory Skills" selectedSkills={formData.mandatorySkills} setSelectedSkills={skills => setFormData({ ...formData, mandatorySkills: skills })} />
                                    <SkillsSelector label="Nice to Have" selectedSkills={formData.niceToHaveSkills} setSelectedSkills={skills => setFormData({ ...formData, niceToHaveSkills: skills })} />
                                </div>
                                <div className="flex gap-4 pt-10">
                                    <button onClick={() => setStep(1)} className="px-10 py-4 bg-slate-50 text-slate-500 rounded-2xl font-black text-[10px] uppercase tracking-widest border border-slate-100">Back</button>
                                    <button onClick={() => setStep(3)} className="flex-1 bg-slate-900 text-white py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-indigo-600 transition-all shadow-xl">Assessment & Screening</button>
                                </div>
                            </div>
                        )}

                        {step === 3 && (
                            <div className="space-y-10 animate-in fade-in">
                                <div className="flex items-center justify-between border-b border-slate-100 pb-6">
                                    <div className="space-y-1">
                                        <h3 className="font-bold text-slate-900">Custom Screening</h3>
                                        <p className="text-xs text-slate-400 font-medium italic">Define required information from candidates</p>
                                    </div>
                                    <button onClick={addQuestion} className="px-4 py-2 bg-indigo-50 text-indigo-600 rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-indigo-600 hover:text-white transition-all border border-indigo-100 font-bold">+ New Question</button>
                                </div>

                                <div className="grid gap-6">
                                    {formData.questions.map((q, i) => (
                                        <div key={i} className="p-8 bg-slate-50/50 rounded-3xl border border-slate-100 space-y-6 relative group border-l-[6px] border-l-slate-300 hover:border-l-indigo-500 transition-all">
                                            <button
                                                onClick={() => setFormData({ ...formData, questions: formData.questions.filter((_, idx) => idx !== i) })}
                                                className="absolute top-6 right-6 w-8 h-8 flex items-center justify-center bg-white border border-slate-200 text-rose-500 rounded-lg hover:bg-rose-50 opacity-0 group-hover:opacity-100 transition-all"
                                            >×</button>

                                            <div className="space-y-3">
                                                <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Question Text</label>
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
                                                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Selection Type</label>
                                                    <select
                                                        className="w-full bg-white border border-slate-200 p-3 rounded-xl font-bold text-[10px] uppercase text-slate-500 outline-none"
                                                        value={q.type}
                                                        onChange={e => {
                                                            const qs = [...formData.questions];
                                                            qs[i].type = e.target.value;
                                                            setFormData({ ...formData, questions: qs });
                                                        }}
                                                    >
                                                        <option value="text">Text Input</option>
                                                        <option value="long-text">Long Answer</option>
                                                        <option value="selection">Dropdown List</option>
                                                        <option value="radio">Radio Buttons</option>
                                                        <option value="checkbox">Checkboxes</option>
                                                    </select>
                                                </div>
                                                <div className="space-y-3">
                                                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Requirement</label>
                                                    <div className="flex items-center gap-3 px-4 py-3 bg-white border border-slate-200 rounded-xl">
                                                        <input type="checkbox" className="w-4 h-4 rounded-md text-indigo-600" checked={q.required} onChange={e => {
                                                            const qs = [...formData.questions];
                                                            qs[i].required = e.target.checked;
                                                            setFormData({ ...formData, questions: qs });
                                                        }} />
                                                        <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Mandatory</span>
                                                    </div>
                                                </div>
                                            </div>

                                            {['radio', 'checkbox', 'selection'].includes(q.type) && (
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
                                    <button onClick={() => setStep(2)} className="px-10 py-4 bg-slate-50 text-slate-400 font-bold rounded-2xl text-[10px] uppercase tracking-widest">Back</button>
                                    <button onClick={handleSubmit} className="flex-1 bg-indigo-600 text-white py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-2xl shadow-indigo-100 hover:bg-indigo-500 transition-all">Update Circular</button>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="lg:col-span-4 space-y-8">
                        <div className="bg-slate-900 rounded-[2.5rem] p-10 text-white space-y-8 shadow-2xl relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/20 rounded-full blur-3xl -mr-16 -mt-16" />
                            <div className="space-y-2">
                                <span className={`px-3 py-1 text-[9px] font-black uppercase tracking-widest rounded-lg ${formData.status === 'active' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-700 text-slate-400'}`}>
                                    {formData.status}
                                </span>
                                <h2 className="text-2xl font-bold leading-tight">{formData.title || 'Untitled Job'}</h2>
                                <p className="text-indigo-400 font-bold uppercase text-[10px] tracking-[0.2em]">{formData.role || 'Designation'}</p>
                            </div>
                            <div className="grid grid-cols-2 gap-6 pt-6 border-t border-white/10">
                                <div className="space-y-1">
                                    <p className="text-[9px] font-black uppercase text-white/30 tracking-widest">Experience</p>
                                    <p className="font-bold text-sm tracking-tight">{formData.experience}y+</p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-[9px] font-black uppercase text-white/30 tracking-widest">Salary</p>
                                    <p className="font-bold text-sm tracking-tight">${Number(formData.salaryRange.min).toLocaleString()} - ${Number(formData.salaryRange.max).toLocaleString()}</p>
                                </div>
                            </div>
                            <div className="space-y-4">
                                <p className="text-[9px] font-black uppercase text-white/30 tracking-widest">Skills Overview</p>
                                <div className="flex flex-wrap gap-2">
                                    {formData.mandatorySkills.slice(0, 4).map((s, i) => (
                                        <span key={i} className="px-2 py-1 bg-white/5 rounded-md text-[9px] font-bold border border-white/10">#{s}</span>
                                    ))}
                                    {formData.mandatorySkills.length > 4 && <span className="text-[9px] font-bold text-white/30">+{formData.mandatorySkills.length - 4} more</span>}
                                </div>
                            </div>
                        </div>

                        <div className="bg-emerald-50 border border-emerald-100 p-8 rounded-3xl space-y-4">
                            <div className="flex items-center gap-3">
                                <span className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center font-bold">✓</span>
                                <h4 className="text-xs font-black text-emerald-900 uppercase tracking-widest">Up-to-Date</h4>
                            </div>
                            <p className="text-xs text-emerald-700 leading-relaxed font-medium">Updating this circular will immediately reflect on the careers page. Check recruitment stats to see how changes affect your applicant flow.</p>
                        </div>
                    </div>
                </div>
            </div>
        </Layout>
    );
};

export default EditCircular;
