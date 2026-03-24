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
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(9, 30, 66, 0.54)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000 }} onClick={onClose}>
            <div style={{ backgroundColor: 'white', borderRadius: '12px', width: '90%', maxWidth: '600px', boxShadow: '0 20px 40px rgba(0,0,0,0.2)', overflow: 'hidden' }} onClick={(e) => e.stopPropagation()}>

                {/* Header */}
                <div style={{ padding: '24px', borderBottom: '1px solid #dfe1e6', background: 'linear-gradient(to right, #0052cc, #0747a6)', color: 'white' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div>
                            <h3 style={{ margin: 0, fontSize: '20px', fontWeight: '700' }}>Bulk Member Assignment</h3>
                            <p style={{ margin: '6px 0 0 0', fontSize: '14px', opacity: 0.9 }}>Assign one member to all {tasksCount} tasks in this project</p>
                        </div>
                        <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer', color: 'white', padding: '4px', lineHeight: 1 }}>×</button>
                    </div>
                </div>

                <div style={{ padding: '24px' }}>
                    {/* Step 1: Select Member */}
                    <div style={{ marginBottom: '24px' }}>
                        <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#5e6c84', marginBottom: '8px', textTransform: 'uppercase' }}>1. Select Member</label>
                        <div style={{ position: 'relative' }}>
                            <input
                                type="text"
                                placeholder="Search team members..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                style={{ width: '100%', padding: '10px 12px', borderRadius: '6px', border: '1px solid #dfe1e6', marginBottom: '8px' }}
                            />
                            <div style={{ maxHeight: '150px', overflowY: 'auto', border: '1px solid #dfe1e6', borderRadius: '6px' }}>
                                {filteredUsers.map(user => (
                                    <div
                                        key={user._id}
                                        onClick={() => setSelectedUserId(user._id)}
                                        style={{
                                            padding: '10px 12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px',
                                            backgroundColor: selectedUserId === user._id ? '#deebff' : 'white',
                                            transition: 'background-color 0.2s'
                                        }}
                                    >
                                        <div style={{ width: '24px', height: '24px', borderRadius: '50%', backgroundColor: '#0052cc', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px' }}>
                                            {user.name?.[0].toUpperCase()}
                                        </div>
                                        <span style={{ fontSize: '14px', fontWeight: selectedUserId === user._id ? '600' : '400' }}>{user.name}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Step 2: Select Roles */}
                    <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                            <label style={{ fontSize: '12px', fontWeight: '700', color: '#5e6c84', textTransform: 'uppercase' }}>2. Select Roles to Assign</label>
                            <button onClick={handleSelectAllRoles} style={{ background: 'none', border: 'none', color: '#0052cc', fontSize: '12px', cursor: 'pointer', padding: 0 }}>
                                {selectedRoleIds.length === taskRoles.length ? 'Deselect All' : 'Select All'}
                            </button>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                            {taskRoles.map(role => (
                                <div
                                    key={role._id}
                                    onClick={() => handleToggleRole(role._id)}
                                    style={{
                                        padding: '10px', borderRadius: '6px', border: '1px solid #dfe1e6', cursor: 'pointer',
                                        display: 'flex', alignItems: 'center', gap: '8px',
                                        backgroundColor: selectedRoleIds.includes(role._id) ? '#f4f5f7' : 'white'
                                    }}
                                >
                                    <input type="checkbox" checked={selectedRoleIds.includes(role._id)} readOnly style={{ cursor: 'pointer' }} />
                                    <span style={{ fontSize: '13px' }}>{role.name}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div style={{ marginTop: '24px', padding: '16px', backgroundColor: '#fff7e6', borderRadius: '6px', border: '1px solid #ffe7ba' }}>
                        <p style={{ margin: 0, fontSize: '13px', color: '#874d00', lineHeight: 1.5 }}>
                            <strong>Caution:</strong> This will add the selected member to every task in this project for the selected roles. Current assignments will not be removed.
                        </p>
                    </div>
                </div>

                {/* Footer */}
                <div style={{ padding: '20px 24px', borderTop: '1px solid #dfe1e6', display: 'flex', justifyContent: 'flex-end', gap: '12px', backgroundColor: '#f9f9f9' }}>
                    <button onClick={onClose} disabled={isSaving} style={{ padding: '10px 20px', backgroundColor: 'white', border: '1px solid #dfe1e6', borderRadius: '4px', cursor: 'pointer' }}>Cancel</button>
                    <button
                        onClick={handleSave}
                        disabled={isSaving || !selectedUserId || selectedRoleIds.length === 0}
                        style={{
                            padding: '10px 24px', backgroundColor: '#36b37e', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer',
                            fontWeight: '600', opacity: (isSaving || !selectedUserId || selectedRoleIds.length === 0) ? 0.6 : 1
                        }}
                    >
                        {isSaving ? 'Assigning...' : 'Confirm Assignments'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default BulkAssigneeModal;
