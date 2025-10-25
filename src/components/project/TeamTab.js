import React, { useState } from 'react';
import { projectAPI } from '../../services/api';
import DeleteConfirmModal from '../common/DeleteConfirmModal';

const TeamTab = ({ projectId, project, users, isProjectOwner, onRefresh }) => {
  const [showAddMember, setShowAddMember] = useState(false);
  const [selectedUser, setSelectedUser] = useState('');
  const [selectedRole, setSelectedRole] = useState('');
  const [memberToRemove, setMemberToRemove] = useState(null);
  const [loading, setLoading] = useState(false);

  // Predefined roles with option for custom input
  const predefinedRoles = [
    'System Architect',
    'UI/UX Designer', 
    'Backend Developer',
    'Frontend Developer',
    'Full Stack Developer',
    'QA Engineer',
    'DevOps Engineer',
    'Product Manager',
    'Business Analyst',
    'Data Analyst'
  ];

  // Get available users (not already in the project)
  const availableUsers = users.filter(user => {
    const isAlreadyMember = project.members?.some(member => 
      (member.user?._id === user._id) || (member._id === user._id) || (member === user._id)
    );
    const isOwner = project.owner?._id === user._id || project.owner === user._id;
    return !isAlreadyMember && !isOwner;
  });

  // Enhanced debug logging
  console.log('TeamTab Debug Info:', {
    isProjectOwner,
    totalUsers: users.length,
    availableUsers: availableUsers.length,
    projectOwner: project.owner,
    projectMembers: project.members,
    allUsers: users.map(u => ({ 
      id: u._id, 
      name: u.name, 
      email: u.email,
      company: u.company 
    })),
    availableUsersList: availableUsers.map(u => ({ 
      id: u._id, 
      name: u.name, 
      email: u.email,
      company: u.company 
    })),
    companyContext: 'Check company filter in ProjectDetails'
  });

  const handleAddMember = async () => {
    if (!selectedUser || !selectedRole.trim()) return;
    
    setLoading(true);
    try {
      await projectAPI.addTeamMember(projectId, selectedUser, selectedRole.trim());
      
      setSelectedUser('');
      setSelectedRole('');
      setShowAddMember(false);
      await onRefresh();
    } catch (error) {
      console.error('Error adding team member:', error);
      const errorMessage = error.response?.data?.error || 'Failed to add team member. Please try again.';
      alert(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveMember = async () => {
    if (!memberToRemove) return;
    
    setLoading(true);
    try {
      const memberToRemoveId = memberToRemove.user?._id || memberToRemove._id;
      await projectAPI.removeTeamMember(projectId, memberToRemoveId);
      
      setMemberToRemove(null);
      await onRefresh();
    } catch (error) {
      console.error('Error removing team member:', error);
      const errorMessage = error.response?.data?.error || 'Failed to remove team member. Please try again.';
      alert(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      {/* Header */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        marginBottom: '24px' 
      }}>
        <div>
          <h2 style={{ 
            margin: '0 0 8px 0', 
            fontSize: '20px', 
            fontWeight: '600', 
            color: '#172b4d' 
          }}>
            Team Members
          </h2>
          <p style={{ 
            margin: 0, 
            color: '#5e6c84', 
            fontSize: '14px' 
          }}>
            Manage project team members and their access
          </p>
        </div>
        
        {isProjectOwner && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '8px' }}>
            {availableUsers.length > 0 ? (
              <button
                onClick={() => setShowAddMember(true)}
                disabled={loading}
                style={{
                  padding: '8px 16px',
                  backgroundColor: '#0052cc',
                  color: 'white',
                  border: 'none',
                  borderRadius: '3px',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  fontSize: '14px',
                  fontWeight: '500',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  opacity: loading ? 0.6 : 1
                }}
              >
                <span>👥</span>
                Add Member
              </button>
            ) : (
              <div style={{ 
                fontSize: '12px', 
                color: '#5e6c84', 
                textAlign: 'right',
                fontStyle: 'italic'
              }}>
                No available users to add
                <br />
                (All users are already members or owner)
              </div>
            )}
            <div style={{ 
              fontSize: '11px', 
              color: '#8993a4',
              textAlign: 'right'
            }}>
              Available users: {availableUsers.length} | Total users: {users.length}
            </div>
          </div>
        )}
        
        {!isProjectOwner && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '8px' }}>
            <div style={{ 
              fontSize: '12px', 
              color: '#5e6c84',
              fontStyle: 'italic'
            }}>
              Only project owners can manage team members
            </div>
            {/* Temporary override for testing */}
            {availableUsers.length > 0 && (
              <button
                onClick={() => setShowAddMember(true)}
                disabled={loading}
                style={{
                  padding: '6px 12px',
                  backgroundColor: '#ff8b00',
                  color: 'white',
                  border: 'none',
                  borderRadius: '3px',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  fontSize: '12px',
                  fontWeight: '500',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  opacity: loading ? 0.6 : 1
                }}
              >
                <span>⚠️</span>
                Add Member (Override)
              </button>
            )}
            <div style={{ 
              fontSize: '11px', 
              color: '#8993a4',
              textAlign: 'right'
            }}>
              Available users: {availableUsers.length} | Total users: {users.length}
            </div>
          </div>
        )}
      </div>

      {/* Add Member Form */}
      {showAddMember && (
        <div style={{
          backgroundColor: '#f4f5f7',
          border: '1px solid #dfe1e6',
          borderRadius: '3px',
          padding: '20px',
          marginBottom: '24px'
        }}>
          <h3 style={{ 
            margin: '0 0 16px 0', 
            fontSize: '16px', 
            fontWeight: '600', 
            color: '#172b4d' 
          }}>
            Add Team Member
          </h3>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
            <div>
              <label style={{ 
                display: 'block', 
                marginBottom: '6px', 
                fontSize: '12px', 
                fontWeight: '600', 
                color: '#5e6c84' 
              }}>
                SELECT USER
              </label>
              <select
                value={selectedUser}
                onChange={(e) => setSelectedUser(e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  border: '1px solid #dfe1e6',
                  borderRadius: '3px',
                  fontSize: '14px',
                  backgroundColor: 'white'
                }}
              >
                <option value="">Choose a user...</option>
                {availableUsers.map(user => (
                  <option key={user._id} value={user._id}>
                    {user.name} ({user.email})
                  </option>
                ))}
              </select>
            </div>
            
            <div>
              <label style={{ 
                display: 'block', 
                marginBottom: '6px', 
                fontSize: '12px', 
                fontWeight: '600', 
                color: '#5e6c84' 
              }}>
                ROLE
              </label>
              <input
                type="text"
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value)}
                placeholder="Enter role (e.g., Frontend Developer)"
                list="role-suggestions"
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  border: '1px solid #dfe1e6',
                  borderRadius: '3px',
                  fontSize: '14px',
                  backgroundColor: 'white'
                }}
              />
              <datalist id="role-suggestions">
                {predefinedRoles.map(role => (
                  <option key={role} value={role} />
                ))}
              </datalist>
            </div>
          </div>
          
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
            
            <button
              onClick={handleAddMember}
              disabled={!selectedUser || !selectedRole.trim() || loading}
              style={{
                padding: '8px 16px',
                backgroundColor: selectedUser && selectedRole.trim() && !loading ? '#36b37e' : '#f4f5f7',
                color: selectedUser && selectedRole.trim() && !loading ? 'white' : '#5e6c84',
                border: '1px solid #dfe1e6',
                borderRadius: '3px',
                cursor: selectedUser && selectedRole.trim() && !loading ? 'pointer' : 'not-allowed',
                fontSize: '14px',
                fontWeight: '500'
              }}
            >
              {loading ? 'Adding...' : 'Add Member'}
            </button>
            
            <button
              onClick={() => {
                setShowAddMember(false);
                setSelectedUser('');
                setSelectedRole('');
              }}
              disabled={loading}
              style={{
                padding: '8px 16px',
                backgroundColor: 'white',
                color: '#5e6c84',
                border: '1px solid #dfe1e6',
                borderRadius: '3px',
                cursor: loading ? 'not-allowed' : 'pointer',
                fontSize: '14px',
                fontWeight: '500'
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Project Owner */}
      <div style={{
        backgroundColor: '#ffffff',
        border: '1px solid #dfe1e6',
        borderRadius: '3px',
        padding: '20px',
        marginBottom: '16px'
      }}>
        <h3 style={{ 
          margin: '0 0 16px 0', 
          fontSize: '16px', 
          fontWeight: '600', 
          color: '#172b4d' 
        }}>
          Project Owner
        </h3>
        
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          padding: '12px',
          backgroundColor: '#e3fcef',
          borderRadius: '3px',
          border: '1px solid #36b37e'
        }}>
          <div style={{
            width: '40px',
            height: '40px',
            borderRadius: '50%',
            backgroundColor: '#36b37e',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            fontSize: '16px',
            fontWeight: '600'
          }}>
            {project.owner?.name?.charAt(0).toUpperCase()}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '14px', fontWeight: '600', color: '#172b4d' }}>
              {project.owner?.name}
            </div>
            <div style={{ fontSize: '12px', color: '#5e6c84' }}>
              {project.owner?.email}
            </div>
          </div>
          <div style={{
            padding: '4px 8px',
            backgroundColor: '#36b37e',
            color: 'white',
            borderRadius: '3px',
            fontSize: '11px',
            fontWeight: '600'
          }}>
            OWNER
          </div>
        </div>
      </div>

      {/* Team Members */}
      <div style={{
        backgroundColor: '#ffffff',
        border: '1px solid #dfe1e6',
        borderRadius: '3px',
        padding: '20px'
      }}>
        <h3 style={{ 
          margin: '0 0 16px 0', 
          fontSize: '16px', 
          fontWeight: '600', 
          color: '#172b4d' 
        }}>
          Team Members ({project.members?.length || 0})
        </h3>
        
        {project.members && project.members.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {project.members.map((member, index) => {
              // Handle both old and new member structure
              const memberUser = member.user || member;
              const memberRole = member.role || 'Team Member';
              const memberId = member._id || member.user?._id || index;
              
              return (
                <div key={memberId} style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '12px',
                  backgroundColor: '#f4f5f7',
                  borderRadius: '3px',
                  border: '1px solid #dfe1e6'
                }}>
                  <div style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '50%',
                    backgroundColor: '#0052cc',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                    fontSize: '16px',
                    fontWeight: '600'
                  }}>
                    {memberUser?.name?.charAt(0).toUpperCase() || 'U'}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '14px', fontWeight: '500', color: '#172b4d' }}>
                      {memberUser?.name || 'Unknown User'}
                    </div>
                    <div style={{ fontSize: '12px', color: '#5e6c84', marginBottom: '2px' }}>
                      {memberUser?.email || 'No email'}
                    </div>
                    <div style={{ fontSize: '11px', color: '#8993a4', fontStyle: 'italic' }}>
                      Role: {memberRole}
                    </div>
                  </div>
                  <div style={{
                    padding: '4px 8px',
                    backgroundColor: '#0052cc',
                    color: 'white',
                    borderRadius: '3px',
                    fontSize: '11px',
                    fontWeight: '600'
                  }}>
                    {memberRole.toUpperCase()}
                  </div>
                  {isProjectOwner && (
                    <button
                      onClick={() => setMemberToRemove(member)}
                      disabled={loading}
                      style={{
                        padding: '6px 8px',
                        backgroundColor: 'transparent',
                        color: '#de350b',
                        border: '1px solid #de350b',
                        borderRadius: '3px',
                        cursor: loading ? 'not-allowed' : 'pointer',
                        fontSize: '12px',
                        fontWeight: '500',
                        opacity: loading ? 0.6 : 1
                      }}
                    >
                      Remove
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div style={{ 
            textAlign: 'center', 
            padding: '32px', 
            color: '#5e6c84',
            fontSize: '14px'
          }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>👥</div>
            <div style={{ marginBottom: '8px', fontWeight: '500' }}>No team members yet</div>
            <div>Add team members to collaborate on this project</div>
          </div>
        )}
      </div>

      {/* Remove Member Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={!!memberToRemove}
        onClose={() => setMemberToRemove(null)}
        onConfirm={handleRemoveMember}
        title="Remove Team Member"
        message="This will remove the user from the project team. They will lose access to project data."
        itemName={memberToRemove?.user?.name || memberToRemove?.name}
        itemDescription={`${memberToRemove?.user?.email || memberToRemove?.email} • Role: ${memberToRemove?.role || 'Team Member'}`}
        confirmButtonText="Remove Member"
        icon="👥"
      />
    </div>
  );
};

export default TeamTab;