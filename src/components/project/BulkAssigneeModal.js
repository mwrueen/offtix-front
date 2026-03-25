import React, { useState } from 'react';
import { taskAPI } from '../../services/api';
import { useToast } from '../../context/ToastContext';

const BulkAssigneeModal = ({ projectId, users = [], taskRoles = [], onClose, onUpdate, tasksCount }) => {
    const { showToast } = useToast();
    const [selectedUserId, setSelectedUserId] = useState('');
    const [selectedRoleIds, setSelectedRoleIds] = useState(taskRoles.map(r => r._id));
    const [isSaving, setIsSaving] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    const handleToggleRole = (roleId) => {
        setSelectedRoleIds(prev =>
            prev.includes(roleId) ? prev.filter(id => id !== roleId) : [...prev, roleId]
        );
    };

    const handleSelectAllRoles = () => {
        if (selectedRoleIds.length === taskRoles.length) {
            setSelectedRoleIds([]);
        } else {
            setSelectedRoleIds(taskRoles.map(r => r._id));
        }
    };

    const handleSave = async () => {
        if (!selectedUserId) {
            showToast('Please select a member to assign', 'error');
            return;
        }
        if (selectedRoleIds.length === 0) {
            showToast('Please select at least one role', 'error');
            return;
        }

        try {
            setIsSaving(true);
            await taskAPI.bulkAssignMember(projectId, selectedUserId, selectedRoleIds);
            showToast(`Member assigned to ${tasksCount} tasks successfully`, 'success');
            if (onUpdate) onUpdate();
            onClose();
        } catch (error) {
            console.error('Error in bulk assignment:', error);
            showToast(error.response?.data?.error || 'Failed to perform bulk assignment', 'error');
        } finally {
            setIsSaving(false);
        }
    };

    const filteredUsers = users.filter(user =>
        (user.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (user.email || '').toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center z-[2000]" onClick={onClose}>
            <div className="bg-white rounded-xl w-[90%] max-w-[600px] shadow-2xl overflow-hidden" onClick={(e) => e.stopPropagation()}>

                {/* Header */}
                <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-blue-600 to-blue-700 text-white">
                    <div className="flex justify-between items-start">
                        <div>
                            <h3 className="m-0 text-xl font-bold">Bulk Member Assignment</h3>
                            <p className="mt-1.5 mb-0 text-sm opacity-90">Assign one member to all {tasksCount} tasks in this project</p>
                        </div>
                        <button onClick={onClose} className="bg-transparent border-0 text-2xl cursor-pointer text-white p-1 leading-none hover:bg-white/10 rounded">×</button>
                    </div>
                </div>

                <div className="p-6">
                    {/* Step 1: Select Member */}
                    <div className="mb-6">
                        <label className="block text-xs font-bold text-gray-500 mb-2 uppercase">1. Select Member</label>
                        <div className="relative">
                            <input
                                type="text"
                                placeholder="Search team members..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full py-2.5 px-3 rounded-md border border-gray-200 mb-2"
                            />
                            <div className="max-h-[150px] overflow-y-auto border border-gray-200 rounded-md">
                                {filteredUsers.map(user => (
                                    <div
                                        key={user._id}
                                        onClick={() => setSelectedUserId(user._id)}
                                        className={`py-2.5 px-3 cursor-pointer flex items-center gap-2.5 transition-colors ${
                                            selectedUserId === user._id ? 'bg-blue-50' : 'bg-white hover:bg-gray-50'
                                        }`}
                                    >
                                        <div className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs">
                                            {user.name?.[0].toUpperCase()}
                                        </div>
                                        <span className={`text-sm ${selectedUserId === user._id ? 'font-semibold' : 'font-normal'}`}>{user.name}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Step 2: Select Roles */}
                    <div>
                        <div className="flex justify-between items-center mb-2">
                            <label className="text-xs font-bold text-gray-500 uppercase">2. Select Roles to Assign</label>
                            <button onClick={handleSelectAllRoles} className="bg-transparent border-0 text-blue-600 text-xs cursor-pointer p-0 hover:underline">
                                {selectedRoleIds.length === taskRoles.length ? 'Deselect All' : 'Select All'}
                            </button>
                        </div>
                        <div className="grid grid-cols-2 gap-2.5">
                            {taskRoles.map(role => (
                                <div
                                    key={role._id}
                                    onClick={() => handleToggleRole(role._id)}
                                    className={`p-2.5 rounded-md border border-gray-200 cursor-pointer flex items-center gap-2 ${
                                        selectedRoleIds.includes(role._id) ? 'bg-gray-50' : 'bg-white'
                                    }`}
                                >
                                    <input type="checkbox" checked={selectedRoleIds.includes(role._id)} readOnly className="cursor-pointer" />
                                    <span className="text-xs">{role.name}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="mt-6 p-4 bg-amber-50 rounded-md border border-amber-200">
                        <p className="m-0 text-xs text-amber-800 leading-relaxed">
                            <strong>Caution:</strong> This will add the selected member to every task in this project for the selected roles. Current assignments will not be removed.
                        </p>
                    </div>
                </div>

                {/* Footer */}
                <div className="px-6 py-5 border-t border-gray-200 flex justify-end gap-3 bg-gray-50">
                    <button onClick={onClose} disabled={isSaving} className="py-2.5 px-5 bg-white border border-gray-200 rounded cursor-pointer hover:bg-gray-50">Cancel</button>
                    <button
                        onClick={handleSave}
                        disabled={isSaving || !selectedUserId || selectedRoleIds.length === 0}
                        className={`py-2.5 px-6 bg-emerald-600 text-white border-0 rounded cursor-pointer font-semibold hover:bg-emerald-700 ${
                            (isSaving || !selectedUserId || selectedRoleIds.length === 0) ? 'opacity-60' : 'opacity-100'
                        }`}
                    >
                        {isSaving ? 'Assigning...' : 'Confirm Assignments'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default BulkAssigneeModal;
