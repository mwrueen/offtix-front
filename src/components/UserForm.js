import React, { useState } from 'react';
import { userAPI } from '../services/api';

const UserForm = ({ user, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    password: '',
    role: user?.role || 'user'
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      const submitData = { ...formData };
      if (!submitData.password) {
        delete submitData.password;
      }
      
      if (user) {
        await userAPI.update(user._id, submitData);
      } else {
        await userAPI.create(submitData);
      }
      
      onSave();
    } catch (error) {
      setError(error.response?.data?.error || 'Failed to save user');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[1000]">
      <div className="bg-white p-8 rounded-xl w-96 max-w-[90vw]">
        <h3 className="m-0 mb-5 text-slate-800">
          {user ? 'Edit User' : 'Add New User'}
        </h3>
        
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 p-3 rounded-lg mb-5 text-sm">
            {error}
          </div>
        )}
        
        <form onSubmit={handleSubmit}>
          <div className="mb-5">
            <label className="block mb-1.5 text-sm font-semibold text-gray-700">
              Name
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              className="w-full p-3 border border-gray-300 rounded-lg text-sm"
            />
          </div>
          
          <div className="mb-5">
            <label className="block mb-1.5 text-sm font-semibold text-gray-700">
              Email
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              className="w-full p-3 border border-gray-300 rounded-lg text-sm"
            />
          </div>
          
          <div className="mb-5">
            <label className="block mb-1.5 text-sm font-semibold text-gray-700">
              Password {user && '(leave empty to keep current)'}
            </label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required={!user}
              className="w-full p-3 border border-gray-300 rounded-lg text-sm"
            />
          </div>
          
          <div className="mb-8">
            <label className="block mb-1.5 text-sm font-semibold text-gray-700">
              Role
            </label>
            <select
              name="role"
              value={formData.role}
              onChange={handleChange}
              className="w-full p-3 border border-gray-300 rounded-lg text-sm"
            >
              <option value="user">User</option>
              <option value="admin">Admin</option>
              <option value="superadmin">Super Admin</option>
            </select>
          </div>
          
          <div className="flex gap-3 justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-3 bg-gray-500 text-white border-0 rounded-lg cursor-pointer text-sm"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className={`px-5 py-3 text-white border-0 rounded-lg text-sm ${
                loading 
                  ? 'bg-gray-400 cursor-not-allowed' 
                  : 'bg-blue-500 cursor-pointer hover:bg-blue-600'
              }`}
            >
              {loading ? 'Saving...' : (user ? 'Update' : 'Create')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default UserForm;