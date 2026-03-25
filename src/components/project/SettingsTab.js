import React, { useState, useEffect } from 'react';
import { projectAPI } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import DeleteConfirmModal from '../common/DeleteConfirmModal';

const SettingsTab = ({ projectId, project, isProjectOwner, onRefresh }) => {
  const toast = useToast();
  const [settings, setSettings] = useState({
    timeTracking: {
      defaultDurationUnit: 'hours',
      hoursPerDay: 8,
      daysPerWeek: 5,
      workingHoursStart: '09:00',
      workingHoursEnd: '17:00'
    },
    workingDays: [1, 2, 3, 4, 5],
    holidays: []
  });

  const [holidayForm, setHolidayForm] = useState({ date: '', name: '', description: '' });
  const [showHolidayForm, setShowHolidayForm] = useState(false);
  const [deleteModal, setDeleteModal] = useState({ isOpen: false, id: null, name: '' });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (project?.settings) {
      setSettings({
        timeTracking: project.settings.timeTracking || {
          defaultDurationUnit: 'hours',
          hoursPerDay: 8,
          daysPerWeek: 5,
          workingHoursStart: '09:00',
          workingHoursEnd: '17:00'
        },
        workingDays: project.settings.workingDays || [1, 2, 3, 4, 5],
        holidays: project.settings.holidays || []
      });
    }
  }, [project]);

  const handleTimeTrackingChange = (field, value) => {
    setSettings(prev => ({
      ...prev,
      timeTracking: { ...prev.timeTracking, [field]: value }
    }));
  };

  const handleWorkingDayToggle = (day) => {
    setSettings(prev => {
      const workingDays = prev.workingDays.includes(day)
        ? prev.workingDays.filter(d => d !== day)
        : [...prev.workingDays, day].sort();
      return { ...prev, workingDays };
    });
  };

  const handleSaveSettings = async () => {
    setSaving(true);
    try {
      await projectAPI.updateSettings(projectId, settings);
      await onRefresh();
      toast.success('Settings saved successfully!');
    } catch (error) {
      console.error('Error saving settings:', error);
      toast.error('Failed to save settings.');
    } finally {
      setSaving(false);
    }
  };

  const handleAddHoliday = async (e) => {
    e.preventDefault();
    if (!holidayForm.date || !holidayForm.name) return;
    try {
      await projectAPI.addHoliday(projectId, holidayForm);
      await onRefresh();
      setHolidayForm({ date: '', name: '', description: '' });
      setShowHolidayForm(false);
    } catch (error) {
      console.error('Error adding holiday:', error);
      toast.error('Failed to add holiday.');
    }
  };

  const handleRemoveHoliday = (holidayId) => {
    const holiday = settings.holidays.find(h => h._id === holidayId);
    setDeleteModal({ isOpen: true, id: holidayId, name: holiday?.name || 'this holiday' });
  };

  const confirmRemoveHoliday = async () => {
    try {
      await projectAPI.removeHoliday(projectId, deleteModal.id);
      await onRefresh();
      setDeleteModal({ isOpen: false, id: null, name: '' });
    } catch (error) {
      console.error('Error removing holiday:', error);
    }
  };

  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  return (
    <div className="max-w-4xl space-y-8 p-1 animate-in fade-in duration-500 pb-20 font-sans">
      {/* Time Tracking Section */}
      <section className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-8 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-xl shadow-sm border border-slate-100">⏱️</div>
            <div>
              <h3 className="text-lg font-bold text-slate-900 uppercase tracking-tight">Time Tracking Configuration</h3>
              <p className="text-xs text-slate-500 font-medium">Define project defaults for duration and capacity planning.</p>
            </div>
          </div>
          {isProjectOwner && (
            <button
              onClick={handleSaveSettings}
              disabled={saving}
              className="px-6 py-2.5 bg-indigo-600 text-white rounded-xl text-xs font-bold shadow-md hover:bg-indigo-700 transition-all disabled:opacity-50"
            >
              {saving ? 'Updating...' : 'Save Changes'}
            </button>
          )}
        </div>

        <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Default Duration Unit</label>
              <select
                value={settings.timeTracking.defaultDurationUnit}
                onChange={(e) => handleTimeTrackingChange('defaultDurationUnit', e.target.value)}
                disabled={!isProjectOwner}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold outline-none focus:bg-white focus:border-indigo-400 transition-all cursor-pointer disabled:opacity-50"
              >
                <option value="minutes">Minutes</option>
                <option value="hours">Hours</option>
                <option value="days">Days</option>
                <option value="weeks">Weeks</option>
              </select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Hours / Day</label>
                <input
                  type="number" min="1" max="24"
                  value={settings.timeTracking.hoursPerDay}
                  onChange={(e) => handleTimeTrackingChange('hoursPerDay', parseInt(e.target.value))}
                  disabled={!isProjectOwner}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold outline-none focus:bg-white focus:border-indigo-400"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Days / Week</label>
                <input
                  type="number" min="1" max="7"
                  value={settings.timeTracking.daysPerWeek}
                  onChange={(e) => handleTimeTrackingChange('daysPerWeek', parseInt(e.target.value))}
                  disabled={!isProjectOwner}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold outline-none focus:bg-white focus:border-indigo-400"
                />
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sans">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Working Hours Start</label>
                <input
                  type="time"
                  value={settings.timeTracking.workingHoursStart}
                  onChange={(e) => handleTimeTrackingChange('workingHoursStart', e.target.value)}
                  disabled={!isProjectOwner}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold outline-none focus:bg-white focus:border-indigo-400"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Working Hours End</label>
                <input
                  type="time"
                  value={settings.timeTracking.workingHoursEnd}
                  onChange={(e) => handleTimeTrackingChange('workingHoursEnd', e.target.value)}
                  disabled={!isProjectOwner}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold outline-none focus:bg-white focus:border-indigo-400"
                />
              </div>
            </div>

            <div className="bg-indigo-600 rounded-2xl p-6 text-white shadow-lg overflow-hidden relative">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16" />
              <span className="text-[9px] font-bold uppercase tracking-widest opacity-60">Calculated Effective Capacity</span>
              <div className="text-3xl font-bold mt-2 font-sans tracking-tight">
                {(() => {
                  const start = settings.timeTracking.workingHoursStart.split(':');
                  const end = settings.timeTracking.workingHoursEnd.split(':');
                  const totalMinutes = (parseInt(end[0]) * 60 + parseInt(end[1])) - (parseInt(start[0]) * 60 + parseInt(start[1]));
                  return `${Math.floor(totalMinutes / 60)}h ${totalMinutes % 60}m`;
                })()}
              </div>
              <p className="text-[10px] opacity-60 mt-1 uppercase font-bold tracking-tighter">Per Standard Business Day</p>
            </div>
          </div>
        </div>
      </section>

      {/* Working Days Selection */}
      <section className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden text-sans">
        <div className="p-8 border-b border-slate-100">
          <h3 className="text-lg font-bold text-slate-900 uppercase tracking-tight">Working Calendar</h3>
          <p className="text-xs text-slate-500 font-medium mt-1">Select the operational days for this project.</p>
        </div>
        <div className="p-8">
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
            {dayNames.map((day, index) => {
              const isActive = settings.workingDays.includes(index);
              return (
                <button
                  key={index}
                  onClick={() => isProjectOwner && handleWorkingDayToggle(index)}
                  disabled={!isProjectOwner}
                  className={`py-3 px-4 rounded-xl text-xs font-bold transition-all border-2 ${isActive ? 'bg-indigo-50 border-indigo-600 text-indigo-700' : 'bg-slate-50 border-transparent text-slate-500 hover:border-slate-200'}`}
                >
                  {day.substring(0, 3).toUpperCase()}
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* Holidays List */}
      <section className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden font-sans">
        <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div>
            <h3 className="text-lg font-bold text-slate-900 uppercase tracking-tight">Project Holidays</h3>
            <p className="text-xs text-slate-500 font-medium">Define non-working dates for deadline calculation.</p>
          </div>
          {isProjectOwner && !showHolidayForm && (
            <button
              onClick={() => setShowHolidayForm(true)}
              className="px-5 py-2.5 bg-white border border-slate-200 text-slate-600 rounded-xl text-xs font-bold shadow-sm hover:bg-slate-100 transition-all font-sans"
            >
              + Add Holiday
            </button>
          )}
        </div>

        <div className="p-8 space-y-6">
          {showHolidayForm && (
            <form onSubmit={handleAddHoliday} className="p-6 bg-slate-50 rounded-2xl border border-slate-200 space-y-4 animate-in zoom-in-95">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Date</label>
                  <input type="date" value={holidayForm.date} onChange={e => setHolidayForm({ ...holidayForm, date: e.target.value })} required className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-bold shadow-inner" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Event Name</label>
                  <input type="text" placeholder="e.g. National Holiday" value={holidayForm.name} onChange={e => setHolidayForm({ ...holidayForm, name: e.target.value })} required className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-bold shadow-inner" />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Description (Optional)</label>
                <input type="text" placeholder="Details..." value={holidayForm.description} onChange={e => setHolidayForm({ ...holidayForm, description: e.target.value })} className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-medium" />
              </div>
              <div className="flex gap-2 pt-2">
                <button type="submit" className="px-6 py-2 bg-indigo-600 text-white rounded-lg text-xs font-bold hover:bg-indigo-700 transition-all">Add Event</button>
                <button type="button" onClick={() => setShowHolidayForm(false)} className="px-6 py-2 text-slate-500 font-bold text-xs hover:bg-slate-100 rounded-lg">Cancel</button>
              </div>
            </form>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sans">
            {settings.holidays.length > 0 ? settings.holidays.map((holiday) => (
              <div key={holiday._id} className="p-5 bg-white border border-slate-100 rounded-2xl flex justify-between items-center group shadow-sm hover:border-indigo-100 transition-all">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-slate-50 rounded-xl flex items-center justify-center text-xl shadow-inner italic border border-slate-50">🎉</div>
                  <div>
                    <h4 className="font-bold text-slate-900 group-hover:text-indigo-600 transition-colors uppercase tracking-tight text-xs">{holiday.name}</h4>
                    <p className="text-[10px] text-slate-400 font-bold mt-1 uppercase tracking-tighter">{new Date(holiday.date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>
                  </div>
                </div>
                {isProjectOwner && (
                  <button onClick={() => handleRemoveHoliday(holiday._id)} className="w-8 h-8 rounded-lg text-slate-300 hover:text-rose-500 transition-colors">🗑️</button>
                )}
              </div>
            )) : (
              <div className="col-span-full py-12 text-center border-2 border-dashed border-slate-100 rounded-3xl">
                <p className="text-sm text-slate-400 font-medium italic">No project-specific holidays registered.</p>
              </div>
            )}
          </div>
        </div>
      </section>

      <DeleteConfirmModal
        isOpen={deleteModal.isOpen}
        onClose={() => setDeleteModal({ isOpen: false, id: null, name: '' })}
        onConfirm={confirmRemoveHoliday}
        title="Remove Holiday"
        message={`Remove "${deleteModal.name}" from the project calendar?`}
      />
    </div>
  );
};

export default SettingsTab;
