import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { getCookie } from '../../utils/cookies';

const SkillsSelector = ({ selectedSkills, setSelectedSkills, label, placeholder }) => {
    const [allSkills, setAllSkills] = useState([]);
    const [filteredSkills, setFilteredSkills] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [isOpen, setIsOpen] = useState(false);
    const [activeCategory, setActiveCategory] = useState('All');
    const wrapperRef = useRef(null);

    const categories = ['All', 'Programming Language', 'Database', 'Design', 'Framework', 'Cloud/DevOps', 'Other'];

    useEffect(() => {
        fetchSkills();

        const handleClickOutside = (event) => {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const fetchSkills = async () => {
        try {
            const token = getCookie('authToken');
            const response = await axios.get('/api/skills', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setAllSkills(response.data);
            setFilteredSkills(response.data);
        } catch (error) {
            console.error('Error fetching skills:', error);
        }
    };

    useEffect(() => {
        let filtered = allSkills.filter(skill =>
            skill.name.toLowerCase().includes(searchTerm.toLowerCase())
        );

        if (activeCategory !== 'All') {
            filtered = filtered.filter(skill => skill.category === activeCategory);
        }

        setFilteredSkills(filtered);
    }, [searchTerm, allSkills, activeCategory]);

    const toggleSkill = (skill) => {
        const skillName = typeof skill === 'string' ? skill : skill.name;
        if (selectedSkills.includes(skillName)) {
            setSelectedSkills(selectedSkills.filter(s => s !== skillName));
        } else {
            setSelectedSkills([...selectedSkills, skillName]);
        }
        setSearchTerm('');
    };

    const handleAddNewSkill = async () => {
        if (!searchTerm.trim()) return;

        // Optimistically add to UI if it doesn't exist
        if (!selectedSkills.includes(searchTerm.trim())) {
            const newSkillName = searchTerm.trim();

            try {
                const token = getCookie('authToken');
                const response = await axios.post('/api/skills', {
                    name: newSkillName,
                    category: activeCategory === 'All' ? 'Other' : activeCategory
                }, {
                    headers: { Authorization: `Bearer ${token}` }
                });

                setAllSkills([...allSkills, response.data]);
                setSelectedSkills([...selectedSkills, response.data.name]);
            } catch (error) {
                if (error.response?.status === 400 && error.response?.data?.skill) {
                    const existingSkill = error.response.data.skill;
                    if (!allSkills.find(s => s._id === existingSkill._id)) {
                        setAllSkills([...allSkills, existingSkill]);
                    }
                    setSelectedSkills([...selectedSkills, existingSkill.name]);
                } else {
                    console.error('Error saving new skill:', error);
                    setSelectedSkills([...selectedSkills, newSkillName]);
                }
            }
        }
        setSearchTerm('');
    };

    const removeSkill = (skillName) => {
        setSelectedSkills(selectedSkills.filter(s => s !== skillName));
    };

    return (
        <div className="space-y-2 relative" ref={wrapperRef}>
            <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 px-1">{label}</label>
            <div
                className={`min-h-[40px] w-full bg-slate-50 border ${isOpen ? 'border-indigo-500 ring-2 ring-indigo-500/5' : 'border-slate-200'} rounded-xl p-2 flex flex-wrap gap-2 transition-all duration-200 relative cursor-text pr-10`}
                onClick={() => wrapperRef.current.querySelector('input').focus()}
            >
                {selectedSkills.map(skill => (
                    <span key={skill} className="inline-flex items-center gap-1.5 bg-white text-indigo-700 px-2.5 py-1 rounded-lg text-sm font-semibold border border-indigo-100 shadow-sm group hover:border-indigo-300 transition-all cursor-default">
                        {skill}
                        <button
                            type="button"
                            onClick={(e) => {
                                e.stopPropagation();
                                removeSkill(skill);
                            }}
                            className="text-slate-300 hover:text-rose-500 transition-colors"
                        >
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" /></svg>
                        </button>
                    </span>
                ))}
                <input
                    type="text"
                    className="flex-1 bg-transparent border-none outline-none ring-0 focus:ring-0 p-1.5 text-sm font-medium text-slate-700 placeholder:text-slate-300 min-w-[120px]"
                    placeholder={selectedSkills.length === 0 ? placeholder : "Add more..."}
                    value={searchTerm}
                    onChange={(e) => {
                        setSearchTerm(e.target.value);
                        setIsOpen(true);
                    }}
                    onFocus={() => setIsOpen(true)}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter' && searchTerm) {
                            e.preventDefault();
                            handleAddNewSkill();
                        }
                    }}
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-300 pointer-events-none">
                    <svg className={`w-4 h-4 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
                </div>
            </div>

            {isOpen && (
                <div className="absolute z-[100] w-full mt-2 bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden animate-in fade-in duration-200 flex flex-col max-h-[400px]">
                    {/* Category Tabs */}
                    <div className="px-3 pt-3 pb-1 border-b border-slate-50 flex gap-1 overflow-x-auto scrollbar-hide">
                        <style>{`.scrollbar-hide::-webkit-scrollbar { display: none; } .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }`}</style>
                        {categories.map(cat => (
                            <button
                                key={cat}
                                type="button"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setActiveCategory(cat);
                                }}
                                className={`whitespace-nowrap px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all border ${activeCategory === cat
                                    ? 'bg-indigo-600 text-white border-indigo-600'
                                    : 'bg-white text-slate-400 border-transparent hover:text-slate-600 hover:bg-slate-50'
                                    }`}
                            >
                                {cat}
                            </button>
                        ))}
                    </div>

                    {/* Results Area */}
                    <div className="overflow-y-auto px-2 pb-2 space-y-1 custom-scrollbar max-h-[300px]">
                        <style>{`
                            .custom-scrollbar::-webkit-scrollbar { width: 4px; }
                            .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                            .custom-scrollbar::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 4px; }
                        `}</style>

                        {filteredSkills.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-1 p-1">
                                {filteredSkills.map(skill => (
                                    <button
                                        key={skill._id}
                                        type="button"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            toggleSkill(skill);
                                        }}
                                        className={`text-left px-3 py-2.5 rounded-lg flex items-center justify-between transition-all group border ${selectedSkills.includes(skill.name)
                                            ? 'bg-indigo-50 text-indigo-700 border-indigo-100'
                                            : 'hover:bg-slate-50 text-slate-600 border-transparent'
                                            }`}
                                    >
                                        <div className="flex flex-col flex-1 overflow-hidden">
                                            <span className="font-semibold text-sm whitespace-nowrap overflow-hidden text-ellipsis">{skill.name}</span>
                                            <span className="text-[9px] uppercase tracking-wider font-bold text-slate-300">{skill.category}</span>
                                        </div>
                                        {selectedSkills.includes(skill.name) && (
                                            <svg className="w-4 h-4 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" /></svg>
                                        )}
                                    </button>
                                ))}
                            </div>
                        ) : (
                            searchTerm && (
                                <button
                                    type="button"
                                    onClick={handleAddNewSkill}
                                    className="w-full text-left px-4 py-8 rounded-xl bg-indigo-50/20 border-2 border-dashed border-indigo-100 text-indigo-600 group hover:bg-indigo-50 hover:border-indigo-200 transition-all text-center"
                                >
                                    <p className="font-bold text-base mb-1">Add "{searchTerm}"</p>
                                    <p className="text-[10px] uppercase font-bold text-indigo-400 tracking-wider">Register as new {activeCategory === 'All' ? 'skill' : activeCategory}</p>
                                </button>
                            )
                        )}

                        {!searchTerm && filteredSkills.length === 0 && (
                            <div className="py-12 text-center text-slate-300">
                                <p className="text-sm font-bold tracking-tight">No skills found</p>
                            </div>
                        )}
                    </div>

                    <div className="bg-slate-50 p-2.5 text-center border-t border-slate-100 flex items-center justify-between">
                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest pl-2">Select skills for your recruitment</p>
                        <button
                            type="button"
                            onClick={() => setIsOpen(false)}
                            className="bg-white px-3 py-1 rounded border border-slate-200 text-[9px] font-bold uppercase text-slate-500 hover:bg-slate-50 transition-all shadow-sm"
                        >Close List</button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SkillsSelector;
