import React, { useState, useEffect } from 'react';
import { taskRoleAPI } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import DeleteConfirmModal from '../common/DeleteConfirmModal';

const WorkflowRolesManager = ({ projectId, isProjectOwner, users = [] }) => {
  const { showToast } = useToast();
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingRole, setEditingRole] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    color: '#6366f1',
    icon: '👤',
    defaultAssignees: []
  });
  const [deleteModal, setDeleteModal] = useState({ isOpen: false, id: null, name: '' });

  useEffect(() => {
    fetchRoles();
  }, [projectId]);

  const fetchRoles = async () => {
    try {
      setLoading(true);
      const response = await taskRoleAPI.getAll(projectId);
      setRoles(response.data);
    } catch (error) {
      console.error('Error fetching roles:', error);
      showToast('Failed to load workflow roles', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleInitializeDefaults = async () => {
    try {
      await taskRoleAPI.initializeDefaults(projectId);
      showToast('Default workflow roles created', 'success');
      fetchRoles();
    } catch (error) {
      showToast(error.response?.data?.error || 'Failed to initialize roles', 'error');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingRole) {
        await taskRoleAPI.update(projectId, editingRole._id, formData);
        showToast('Role updated successfully', 'success');
      } else {
        await taskRoleAPI.create(projectId, formData);
        showToast('Role created successfully', 'success');
      }
      resetForm();
      fetchRoles();
    } catch (error) {
      showToast(error.response?.data?.error || 'Failed to save role', 'error');
    }
  };

  const handleDelete = (roleId) => {
    const role = roles.find(r => r._id === roleId);
    setDeleteModal({
      isOpen: true,
      id: roleId,
      name: role?.name || 'this role'
    });
  };

  const confirmDelete = async () => {
    try {
      await taskRoleAPI.delete(projectId, deleteModal.id);
      showToast('Role deleted successfully', 'success');
      setDeleteModal({ isOpen: false, id: null, name: '' });
      fetchRoles();
    } catch (error) {
      showToast(error.response?.data?.error || 'Failed to delete role', 'error');
    }
  };

  const resetForm = () => {
    setFormData({ name: '', description: '', color: '#6366f1', icon: '👤', defaultAssignees: [] });
    setEditingRole(null);
    setShowAddForm(false);
  };

  const startEdit = (role) => {
    setFormData({
      name: role.name,
      description: role.description || '',
      color: role.color || '#6366f1',
      icon: role.icon || '👤',
      defaultAssignees: role.defaultAssignees?.map(u => u._id) || []
    });
    setEditingRole(role);
    setShowAddForm(true);
  };

  const iconOptions = ['👤', '🎨', '🗄️', '⚙️', '💻', '🧪', '🚀', '📝', '🔧', '📊', '🎯', '🔐'];

  if (loading) {
    return <div className="p-5 text-center">Loading workflow roles...</div>;
  }

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-4">
        <h3 className="m-0 text-base font-semibold text-gray-800">
          Workflow Roles
        </h3>
        {isProjectOwner && (
          <div className="flex gap-2">
            {roles.length === 0 && (
              <button
                onClick={handleInitializeDefaults}
                className="py-2 px-3 bg-emerald-500 text-white border-0 rounded cursor-pointer text-xs hover:bg-emerald-600"
              >
                Initialize Default Roles
              </button>
            )}
            <button
              onClick={() => setShowAddForm(true)}
              className="py-2 px-3 bg-blue-600 text-white border-0 rounded cursor-pointer text-xs hover:bg-blue-700"
            >
              + Add Role
            </button>
          </div>
        )}
      </div>

      <p className="text-xs text-gray-500 mb-4">
        Define the sequential roles for task workflows. When a task is started, employees assigned to the first role
        will be notified. Upon completion, they can hand off to the next role with comments, files, and URLs.
      </p>

      {roles.length === 0 ? (
        <div className="text-center py-8 text-gray-500 bg-gray-50 rounded">
          <div className="text-3xl mb-2">📋</div>
          <p className="m-0">No workflow roles defined. {isProjectOwner && 'Click "Initialize Default Roles" to get started.'}</p>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {roles.map((role, index) => (
            <div
              key={role._id}
              className="flex items-center gap-3 p-3 bg-white border border-gray-200 rounded"
            >
              <div className="w-7 h-7 rounded flex items-center justify-center text-sm" style={{ backgroundColor: role.color || '#6366f1' }}>
                {role.icon || '👤'}
              </div>
              <div className="flex-1">
                <div className="font-medium text-sm text-gray-800">
                  {index + 1}. {role.name}
                </div>
                {role.description && (
                  <div className="text-xs text-gray-500">{role.description}</div>
                )}
              </div>
              {isProjectOwner && (
                <div className="flex gap-1">
                  <button onClick={() => startEdit(role)} className="py-1 px-2 text-xs cursor-pointer border border-gray-200 rounded bg-white hover:bg-gray-50">Edit</button>
                  <button onClick={() => handleDelete(role._id)} className="py-1 px-2 text-xs cursor-pointer border border-gray-200 rounded bg-white text-red-600 hover:bg-red-50">Delete</button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Add/Edit Role Modal */}
      {showAddForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[1000]">
          <div className="bg-white rounded-lg p-6 w-[480px] max-h-[90vh] overflow-auto">
            <h3 className="m-0 mb-4 text-lg text-gray-800">
              {editingRole ? 'Edit Workflow Role' : 'Add Workflow Role'}
            </h3>
            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label className="block mb-1 text-xs font-medium">Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  className="w-full py-2 px-2 border border-gray-200 rounded text-sm"
                  placeholder="e.g., UI/UX Design"
                />
              </div>
              <div className="mb-4">
                <label className="block mb-1 text-xs font-medium">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full py-2 px-2 border border-gray-200 rounded text-sm min-h-[60px]"
                  placeholder="Describe what this role involves"
                />
              </div>
              <div className="flex gap-4 mb-4">
                <div className="flex-1">
                  <label className="block mb-1 text-xs font-medium">Color</label>
                  <input
                    type="color"
                    value={formData.color}
                    onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                    className="w-full h-9 border border-gray-200 rounded cursor-pointer"
                  />
                </div>
                <div className="flex-1">
                  <label className="block mb-1 text-xs font-medium">Icon</label>
                  <div className="flex flex-wrap gap-1">
                    {iconOptions.map(icon => (
                      <button
                        key={icon}
                        type="button"
                        onClick={() => setFormData({ ...formData, icon })}
                        className={`w-8 h-8 rounded cursor-pointer text-base bg-white ${
                          formData.icon === icon ? 'border-2 border-blue-600' : 'border border-gray-200'
                        }`}
                      >
                        {icon}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              <div className="mb-4">
                <label className="block mb-1 text-xs font-medium">Default Assignees</label>
                <select
                  multiple
                  value={formData.defaultAssignees}
                  onChange={(e) => setFormData({ ...formData, defaultAssignees: Array.from(e.target.selectedOptions, o => o.value) })}
                  className="w-full py-2 px-2 border border-gray-200 rounded text-sm min-h-[80px]"
                >
                  {users.map(user => (
                    <option key={user._id} value={user._id}>{user.name} ({user.email})</option>
                  ))}
                </select>
                <p className="text-xs text-gray-500 mt-1">Hold Ctrl/Cmd to select multiple. These will be pre-selected when assigning this role to tasks.</p>
              </div>
              <div className="flex justify-end gap-2">
                <button type="button" onClick={resetForm} className="py-2 px-4 border border-gray-200 rounded cursor-pointer bg-white hover:bg-gray-50">
                  Cancel
                </button>
                <button type="submit" className="py-2 px-4 bg-blue-600 text-white border-0 rounded cursor-pointer hover:bg-blue-700">
                  {editingRole ? 'Update Role' : 'Create Role'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={deleteModal.isOpen}
        onClose={() => setDeleteModal({ isOpen: false, id: null, name: '' })}
        onConfirm={confirmDelete}
        title="Delete Workflow Role"
        message="Are you sure you want to delete this role? This may affect existing tasks that use this workflow."
        itemName={deleteModal.name}
      />
    </div>
  );
};

export default WorkflowRolesManager;

