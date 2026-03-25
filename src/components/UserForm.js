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
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const submitData = { ...formData };
      if (!submitData.password) delete submitData.password;
      if (user) await userAPI.update(user._id, submitData);
      else await userAPI.create(submitData);
      onSave();
    } catch (error) {
      setError(error.response?.data?.error || 'Failed to process user registration.');
    } finally { setLoading(false); }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-[2000] p-6 animate-in fade-in duration-300">
      <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl border border-white/20 overflow-hidden font-sans animate-in zoom-in-95 duration-500">
        <div className="px-8 py-6 bg-slate-900 text-white flex justify-between items-center">
          <div>
            <h3 className="text-xl font-bold uppercase italic tracking-tight">{user ? 'Edit User Profile' : 'Register New User'}</h3>
            <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest mt-1 opacity-70">Configure system access and authentication.</p>
          </div>
          <button onClick={onClose} className="w-10 h-10 rounded-xl bg-white/10 text-white hover:bg-rose-600 transition-all font-bold text-2xl">×</button>
        </div>

        <div className="p-8 lg:p-10 italic">
          {error && (
            <div className="bg-rose-50 border border-rose-100 text-rose-600 p-4 rounded-xl mb-8 text-xs font-bold flex items-center gap-3">
              <span className="text-xl">!</span> {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest ml-1">Full Name</label>
              <input type="text" name="name" value={formData.name} onChange={handleChange} required className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-900 focus:bg-white focus:border-indigo-400 outline-none transition-all uppercase tracking-tight" />
            </div>

            <div className="space-y-2">
              <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest ml-1">Email Address</label>
              <input type="email" name="email" value={formData.email} onChange={handleChange} required className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-900 focus:bg-white focus:border-indigo-400 outline-none transition-all lowercase" />
            </div>

            <div className="space-y-2">
              <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest ml-1">Account Password {user && <span className="text-[9px] lowercase font-medium opacity-50">(Leave blank to keep current)</span>}</label>
              <input type="password" name="password" value={formData.password} onChange={handleChange} required={!user} className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-900 focus:bg-white focus:border-indigo-400 outline-none transition-all" />
            </div>

            <div className="space-y-2">
              <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest ml-1">System Role / Permissions</label>
              <select name="role" value={formData.role} onChange={handleChange} className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-xl text-[10px] font-bold text-slate-900 uppercase tracking-widest focus:bg-white focus:border-indigo-400 outline-none transition-all cursor-pointer">
                <option value="user">Standard User</option>
                <option value="admin">System Administrator</option>
                <option value="superadmin">Organization Lead</option>
              </select>
            </div>

            <div className="flex gap-4 pt-10 border-t border-slate-100">
              <button type="button" onClick={onClose} className="px-6 py-4 text-[11px] font-bold uppercase tracking-widest text-slate-400 hover:text-rose-600 transition-all underline underline-offset-8">Cancel</button>
              <button type="submit" disabled={loading} className="flex-1 py-4 bg-indigo-600 text-white rounded-xl font-bold text-[11px] uppercase tracking-widest shadow-lg hover:bg-slate-950 transition-all disabled:opacity-50">
                {loading ? 'Processing...' : (user ? 'Update Account' : 'Create User Account')}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default UserForm;