import React, { useState } from 'react';
import { generateProjectTasks } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useCompany } from '../../context/CompanyContext';

const GenerateAITasksModal = ({ isOpen, onClose, onGenerate, projectTitle, projectDescription, modalTitle = "Generate Tasks with AI", modalSubtitle = "Auto-generate essential tasks based on project details" }) => {
    const { state: authState } = useAuth();
    const { state: companyState } = useCompany();

    const isPremiumUser = authState?.user?.role === 'superadmin' ||
                          authState?.user?.subscription?.plan === 'premium' ||
                          companyState?.selectedCompany?.subscription?.plan === 'premium';

    const [loading, setLoading] = useState(false);
    const [generatedTasks, setGeneratedTasks] = useState([]);
    const [submitting, setSubmitting] = useState(false);

    if (!isOpen) return null;

    const handleGenerate = async (isAppending = false) => {
        if (!isPremiumUser) {
            onClose();
            window.dispatchEvent(new CustomEvent('open-upgrade-modal', { detail: { featureKey: 'ai' } }));
            return;
        }

        setLoading(true);
        if (!isAppending) setGeneratedTasks([]);
        
        try {
            const existingTitles = isAppending ? generatedTasks.map(t => t.title) : [];
            const res = await generateProjectTasks(projectTitle, projectDescription || '', existingTitles);
            
            if (isAppending) {
                setGeneratedTasks([...generatedTasks, ...(res.data.tasks || [])]);
            } else {
                setGeneratedTasks(res.data.tasks || []);
            }
        } catch (error) {
            console.error('Failed to generate tasks:', error);
            if (error.response?.status === 403 || error.response?.data?.error === 'PREMIUM_FEATURE_RESTRICTED') {
                onClose();
                window.dispatchEvent(new CustomEvent('open-upgrade-modal', { detail: { featureKey: 'ai' } }));
            }
        } finally {
            setLoading(false);
        }
    };


    const handleSubmitAll = async () => {
        setSubmitting(true);
        try {
            await onGenerate(generatedTasks);
            setGeneratedTasks([]);
            onClose();
        } catch (error) {
            console.error('Submit all error:', error);
        } finally {
            setSubmitting(false);
        }
    };

    const handleRemoveTask = (index) => {
        const newTasks = [...generatedTasks];
        newTasks.splice(index, 1);
        setGeneratedTasks(newTasks);
    };

    const handleTaskChange = (index, field, value) => {
        const newTasks = [...generatedTasks];
        newTasks[index][field] = value;
        setGeneratedTasks(newTasks);
    };

    const handleAddManualTask = () => {
        setGeneratedTasks([...generatedTasks, { title: '', description: '' }]);
    };

    return (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[2000] flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95">
                <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-indigo-50">
                    <div className="flex items-center gap-3">
                        <span className="text-2xl">✨</span>
                        <div>
                            <h3 className="text-lg font-bold text-slate-800">{modalTitle}</h3>
                            <p className="text-xs text-slate-500">{modalSubtitle}</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="w-8 h-8 flex items-center justify-center text-slate-400 hover:bg-slate-200 hover:text-slate-600 rounded-full transition-colors">
                        ✕
                    </button>
                </div>

                <div className="p-6 flex-1 overflow-y-auto bg-slate-50">
                    {generatedTasks.length === 0 ? (
                        <div className="text-center py-12 space-y-4">
                            <div className="text-5xl opacity-50">🤖</div>
                            <p className="text-sm text-slate-600 max-w-md mx-auto">
                                Click the button below to analyze your details and automatically generate a logical list of items to get you started.
                            </p>
                            <button
                                onClick={handleGenerate}
                                disabled={loading}
                                className="px-6 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-bold shadow-sm hover:bg-indigo-700 transition-all disabled:opacity-50"
                            >
                                {loading ? 'Generating...' : 'Generate AI Tasks'}
                            </button>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <div className="flex justify-between items-center mb-4">
                                <h4 className="text-sm font-bold text-slate-700">Review & Edit Generated Tasks ({generatedTasks.length})</h4>
                                <button
                                    onClick={handleGenerate}
                                    disabled={loading}
                                    className="text-xs font-bold text-indigo-600 hover:text-indigo-800 transition-colors"
                                >
                                    {loading ? 'Regenerating...' : '↻ Regenerate'}
                                </button>
                            </div>
                            
                            <div className="space-y-3">
                                {generatedTasks.map((task, index) => (
                                    <div key={index} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm relative group">
                                        <button 
                                            onClick={() => handleRemoveTask(index)}
                                            className="absolute top-2 right-2 w-6 h-6 flex items-center justify-center bg-rose-50 text-rose-500 rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-rose-100"
                                        >
                                            ✕
                                        </button>
                                        <div className="space-y-3 pr-8">
                                            <div>
                                                <label className="text-[10px] font-bold text-slate-400 uppercase">Title</label>
                                                <input 
                                                    value={task.title} 
                                                    onChange={e => handleTaskChange(index, 'title', e.target.value)}
                                                    className="w-full text-sm font-bold text-slate-800 outline-none border-b border-transparent focus:border-indigo-200 bg-transparent py-1"
                                                />
                                            </div>
                                            <div>
                                                <label className="text-[10px] font-bold text-slate-400 uppercase">Description</label>
                                                <textarea 
                                                    value={task.description} 
                                                    onChange={e => handleTaskChange(index, 'description', e.target.value)}
                                                    className="w-full text-xs text-slate-600 outline-none border border-transparent focus:border-indigo-200 bg-transparent rounded-lg py-1 resize-none h-16"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            
                            <div className="pt-2 flex flex-col sm:flex-row gap-3">
                                <button
                                    onClick={handleAddManualTask}
                                    className="flex-1 py-3 border-2 border-dashed border-slate-200 text-slate-500 rounded-xl text-xs font-bold hover:bg-slate-100 hover:text-slate-700 hover:border-slate-300 transition-all flex items-center justify-center gap-2"
                                >
                                    <span>+</span> Add Task Manually
                                </button>
                                <button
                                    onClick={() => handleGenerate(true)}
                                    disabled={loading}
                                    className="flex-1 py-3 border-2 border-dashed border-indigo-200 text-indigo-500 rounded-xl text-xs font-bold hover:bg-indigo-50 hover:text-indigo-700 hover:border-indigo-300 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                                >
                                    <span>✨</span> {loading ? 'Generating...' : 'Add more tasks with AI'}
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                <div className="px-6 py-4 border-t border-slate-100 flex justify-end gap-3 bg-white">
                    <button onClick={onClose} className="px-5 py-2 text-sm font-bold text-slate-500 hover:bg-slate-50 rounded-xl transition-colors">
                        Cancel
                    </button>
                    <button 
                        onClick={handleSubmitAll}
                        disabled={generatedTasks.length === 0 || submitting}
                        className="px-6 py-2 bg-indigo-600 text-white rounded-xl text-sm font-bold shadow-sm hover:bg-indigo-700 transition-all disabled:opacity-50"
                    >
                        {submitting ? 'Submitting...' : `Submit ${generatedTasks.length} Task${generatedTasks.length !== 1 ? 's' : ''}`}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default GenerateAITasksModal;
