import React, { useState, useEffect } from 'react';
import axios from 'axios';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import { Button } from '../ui';
import { useToast } from '../../context/ToastContext';
import { getCookie } from '../../utils/cookies';

const HireCandidateModal = ({ isOpen, onClose, application, onSuccess }) => {
    const toast = useToast();
    
    const [hireSalary, setHireSalary] = useState('');
    const [hireJobDescription, setHireJobDescription] = useState('');
    const [hireFacilities, setHireFacilities] = useState('');
    const [hirePolicies, setHirePolicies] = useState('');
    const [statusUpdating, setStatusUpdating] = useState(false);

    useEffect(() => {
        if (isOpen && application) {
            setHireSalary('');
            setHireFacilities('');
            setHirePolicies('');
            // Extract job description carefully, whether jobCircular is an object or an ID
            const jobDesc = application.jobCircular?.description || '';
            setHireJobDescription(jobDesc);
        }
    }, [isOpen, application]);

    if (!isOpen || !application) return null;

    const dName = application.applicant?.name || 'Unknown';

    const handleHireSubmit = async () => {
        if (!hireSalary) {
            toast.showToast('Please enter the proposed salary', 'error');
            return;
        }
        setStatusUpdating(true);
        try {
            const token = getCookie('authToken');
            await axios.post(`/api/recruitment/applications/${application._id}/hire`, {
                salary: Number(hireSalary),
                roleDescription: hireJobDescription,
                facilities: hireFacilities,
                policies: hirePolicies
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            toast.showToast('Offer sent. Candidate was notified.', 'success');
            if (onSuccess) {
                onSuccess({ ...application, status: 'hired', offerLetterStatus: 'pending' });
            }
            onClose();
        } catch (error) {
            console.error('Error hiring candidate:', error);
            toast.showToast('Hiring failed', 'error');
        } finally {
            setStatusUpdating(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[60] bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl overflow-hidden flex flex-col max-h-[90vh] border border-slate-200 animate-in zoom-in-95">
                <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-white shrink-0">
                    <div>
                        <h3 className="text-xl font-bold text-slate-900 tracking-tight">Hire Candidate</h3>
                        <p className="text-[11px] font-bold text-slate-400 tracking-widest uppercase mt-1">Configure offer for {dName}</p>
                    </div>
                    <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg bg-slate-50 text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                </div>

                <div className="p-8 overflow-y-auto flex-1 space-y-10 relative bg-slate-50/50">
                    <div className="space-y-3 bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-widest inline-flex items-center gap-2">
                            <span className="w-5 h-5 rounded bg-indigo-50 text-indigo-600 flex items-center justify-center">1</span>
                            Proposed Monthly Salary
                        </label>
                        <input
                            type="number"
                            value={hireSalary}
                            onChange={e => setHireSalary(e.target.value)}
                            className="w-full bg-white border-2 border-slate-200 p-4 rounded-xl font-bold text-lg text-slate-900 outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 transition-all placeholder:text-slate-400"
                            placeholder="Enter proposed salary e.g. 5000"
                            autoFocus
                        />
                    </div>

                    <div className="space-y-6 bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                        <div>
                            <h3 className="text-sm font-bold text-slate-900">Offer details</h3>
                            <p className="text-xs font-medium text-slate-500 mt-1">Shown on the recipient's invitation page with company summary and salary.</p>
                        </div>

                        <div className="space-y-3">
                            <label className="text-xs font-bold text-slate-700">Job description</label>
                            <div className="rounded-xl border-2 border-slate-200 overflow-hidden bg-white focus-within:border-emerald-500 focus-within:ring-4 focus-within:ring-emerald-500/10 transition-all [&_.ql-toolbar]:border-b-slate-200 [&_.ql-toolbar]:bg-slate-50 [&_.ql-container]:border-0 [&_.ql-editor]:min-h-[120px] [&_.ql-editor]:text-sm [&_.ql-editor]:text-slate-800">
                                <ReactQuill
                                    theme="snow"
                                    value={hireJobDescription}
                                    onChange={setHireJobDescription}
                                    placeholder="Responsibilities, reporting line, working hours, location, etc."
                                />
                            </div>
                        </div>

                        <div className="space-y-3">
                            <label className="text-xs font-bold text-slate-700">Facilities & benefits</label>
                            <div className="rounded-xl border-2 border-slate-200 overflow-hidden bg-white focus-within:border-emerald-500 focus-within:ring-4 focus-within:ring-emerald-500/10 transition-all [&_.ql-toolbar]:border-b-slate-200 [&_.ql-toolbar]:bg-slate-50 [&_.ql-container]:border-0 [&_.ql-editor]:min-h-[120px] [&_.ql-editor]:text-sm [&_.ql-editor]:text-slate-800">
                                <ReactQuill
                                    theme="snow"
                                    value={hireFacilities}
                                    onChange={setHireFacilities}
                                    placeholder="Health cover, leave, equipment, remote policy, meals, transport..."
                                />
                            </div>
                        </div>

                        <div className="space-y-3">
                            <label className="text-xs font-bold text-slate-700">Terms & policies</label>
                            <div className="rounded-xl border-2 border-slate-200 overflow-hidden bg-white focus-within:border-emerald-500 focus-within:ring-4 focus-within:ring-emerald-500/10 transition-all [&_.ql-toolbar]:border-b-slate-200 [&_.ql-toolbar]:bg-slate-50 [&_.ql-container]:border-0 [&_.ql-editor]:min-h-[120px] [&_.ql-editor]:text-sm [&_.ql-editor]:text-slate-800">
                                <ReactQuill
                                    theme="snow"
                                    value={hirePolicies}
                                    onChange={setHirePolicies}
                                    placeholder="Probation, confidentiality, code of conduct, notice period, etc."
                                />
                            </div>
                        </div>
                    </div>
                </div>

                <div className="p-6 border-t border-slate-100 flex justify-end gap-4 bg-white shrink-0">
                    <Button variant="outline" onClick={onClose}>Cancel</Button>
                    <Button
                        variant="primary"
                        disabled={statusUpdating}
                        className="!bg-[#10b981] hover:!bg-[#059669] !text-white !border-0 flex items-center gap-2 px-6 shadow-sm font-semibold transition-all hover:-translate-y-0.5"
                        onClick={handleHireSubmit}
                    >
                        <span>🎉</span> Confirm Offer
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default HireCandidateModal;
