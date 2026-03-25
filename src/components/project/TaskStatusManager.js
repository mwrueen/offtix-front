import React, { useState } from 'react';
import { useToast } from '../../context/ToastContext';
import { taskStatusAPI } from '../../services/api';
import DeleteConfirmModal from '../common/DeleteConfirmModal';

const TaskStatusManager = ({ projectId, taskStatuses, onStatusesUpdate, selectedStatus, onStatusChange, isProjectOwner = false, ...props }) => {
  const toast = useToast();
  const [showForm, setShowForm] = useState(false);
  const [editingStatus, setEditingStatus] = useState(null);
  const [newStatus, setNewStatus] = useState({ name: '', color: '#6b7280' });
  const [deleteModal, setDeleteModal] = useState({ isOpen: false, id: null, name: '' });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingStatus) {
        await taskStatusAPI.update(projectId, editingStatus._id, newStatus);
      } else {
        await taskStatusAPI.create(projectId, newStatus);
      }
      await onStatusesUpdate();
      setNewStatus({ name: '', color: '#6b7280' });
      setShowForm(false);
      setEditingStatus(null);
    } catch (error) {
      console.error('Error saving status:', error);
    }
  };

  const handleEdit = (status) => {
    setNewStatus({ name: status.name, color: status.color });
    setEditingStatus(status);
    setShowForm(true);
  };

  const handleDelete = (statusId) => {
    const status = taskStatuses.find(s => s._id === statusId);
    setDeleteModal({
      isOpen: true,
      id: statusId,
      name: status?.name || 'this status'
    });
  };

  const confirmDelete = async () => {
    try {
      await taskStatusAPI.delete(projectId, deleteModal.id);
      await onStatusesUpdate();
      setDeleteModal({ isOpen: false, id: null, name: '' });
    } catch (error) {
      console.error('Error deleting status:', error);
      toast.error(error.response?.data?.error || 'Failed to delete status');
    }
  };

  const cancelForm = () => {
    setShowForm(false);
    setEditingStatus(null);
    setNewStatus({ name: '', color: '#6b7280' });
  };

  const colors = [
    '#6b7280', '#ef4444', '#f97316', '#eab308', '#22c55e',
    '#06b6d4', '#3b82f6', '#8b5cf6', '#ec4899', '#f43f5e'
  ];

  return (
    <div className="mb-4">
      <div className="flex justify-between items-center mb-3">
        <span className="text-sm font-semibold text-slate-800">Status</span>
        <button
          type="button"
          onClick={() => setShowForm(!showForm)}
          className="py-1 px-2 bg-transparent text-blue-500 border border-blue-500 rounded cursor-pointer text-xs hover:bg-blue-50"
        >
          {showForm ? 'Cancel' : '+ Add Status'}
        </button>
      </div>

      {showForm && (
        <div className="p-3 bg-slate-50 border border-gray-200 rounded-md mb-3">
          <form onSubmit={handleSubmit}>
            <div className="flex gap-2 items-end">
              <div className="flex-1">
                <input
                  type="text"
                  placeholder="Status name"
                  value={newStatus.name}
                  onChange={(e) => setNewStatus({ ...newStatus, name: e.target.value })}
                  required
                  className="w-full py-1.5 px-2 border border-gray-300 rounded text-xs"
                />
              </div>
              <div>
                <select
                  value={newStatus.color}
                  onChange={(e) => setNewStatus({ ...newStatus, color: e.target.value })}
                  className="py-1.5 px-2 border border-gray-300 rounded text-xs text-white"
                  style={{ backgroundColor: newStatus.color }}
                >
                  {colors.map(color => (
                    <option key={color} value={color} style={{ backgroundColor: color }}>
                      ●
                    </option>
                  ))}
                </select>
              </div>
              <button
                type="submit"
                className="py-1.5 px-3 bg-blue-500 text-white border-0 rounded cursor-pointer text-xs hover:bg-blue-600"
              >
                {editingStatus ? 'Update' : 'Add'}
              </button>
              {editingStatus && (
                <button
                  type="button"
                  onClick={cancelForm}
                  className="py-1.5 px-3 bg-transparent text-slate-500 border border-gray-300 rounded cursor-pointer text-xs hover:bg-gray-50"
                >
                  Cancel
                </button>
              )}
            </div>
          </form>
        </div>
      )}

      <select
        value={selectedStatus || ''}
        onChange={(e) => onStatusChange && onStatusChange(e.target.value)}
        className="w-full py-2 px-3 border-2 border-gray-300 rounded text-sm bg-white"
      >
        <option value="">None</option>
        {taskStatuses.map(status => (
          <option key={status._id} value={status._id}>
            {status.name}
          </option>
        ))}
      </select>

      {isProjectOwner && taskStatuses.length > 0 && (
        <div className="mt-3">
          <div className="text-xs font-semibold text-slate-500 mb-2">
            Manage Statuses
          </div>
          <div className="flex flex-col gap-1">
            {taskStatuses.map(status => (
              <div key={status._id} className="flex items-center justify-between py-1.5 px-2 bg-slate-50 rounded border border-gray-200">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: status.color }}></div>
                  <span className="text-xs text-slate-800">{status.name}</span>
                </div>
                <div className="flex gap-1">
                  <button
                    type="button"
                    onClick={() => handleEdit(status)}
                    className="py-0.5 px-1.5 bg-transparent text-slate-500 border border-gray-300 rounded cursor-pointer text-xs hover:bg-gray-100"
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(status._id)}
                    className="py-0.5 px-1.5 bg-transparent text-red-500 border border-gray-300 rounded cursor-pointer text-xs hover:bg-red-50"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      <DeleteConfirmModal
        isOpen={deleteModal.isOpen}
        onClose={() => setDeleteModal({ isOpen: false, id: null, name: '' })}
        onConfirm={confirmDelete}
        title="Delete Status"
        message="Are you sure you want to delete this status? Tasks with this status may need to be reassigned."
        itemName={deleteModal.name}
      />
    </div>
  );
};

export default TaskStatusManager;