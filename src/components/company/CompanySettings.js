import React, { useState, useEffect } from 'react';
import { companyAPI } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { currencies } from '../../utils/currency';
import DeleteConfirmModal from '../common/DeleteConfirmModal';

const CompanySettings = ({ company, isOwner, onRefresh }) => {
  const toast = useToast();
  const [settings, setSettings] = useState({
    timeTracking: {
      defaultDurationUnit: 'hours',
      hoursPerDay: 8,
      daysPerWeek: 5,
      workingHoursStart: '09:00',
      workingHoursEnd: '17:00'
    },
    workingDays: [1, 2, 3, 4, 5], // Monday to Friday
    weekends: [0, 6], // Sunday and Saturday
    holidays: []
  });

  const [currency, setCurrency] = useState('USD');

  const [holidayForm, setHolidayForm] = useState({
    date: '',
    name: '',
    description: ''
  });

  const [showHolidayForm, setShowHolidayForm] = useState(false);
  const [deleteModal, setDeleteModal] = useState({ isOpen: false, id: null, name: '' });
  const [saving, setSaving] = useState(false);


  useEffect(() => {
    if (company?.settings) {
      setSettings({
        timeTracking: company.settings.timeTracking || {
          defaultDurationUnit: 'hours',
          hoursPerDay: 8,
          daysPerWeek: 5,
          workingHoursStart: '09:00',
          workingHoursEnd: '17:00'
        },
        workingDays: company.settings.workingDays || [1, 2, 3, 4, 5],
        weekends: company.settings.weekends || [0, 6],
        holidays: company.settings.holidays || []
      });
    }
    if (company?.currency) {
      setCurrency(company.currency);
    }
  }, [company]);

  const handleTimeTrackingChange = (field, value) => {
    setSettings(prev => ({
      ...prev,
      timeTracking: {
        ...prev.timeTracking,
        [field]: value
      }
    }));
  };

  const handleWorkingDayToggle = (day) => {
    setSettings(prev => {
      const workingDays = prev.workingDays.includes(day)
        ? prev.workingDays.filter(d => d !== day)
        : [...prev.workingDays, day].sort();

      return {
        ...prev,
        workingDays
      };
    });
  };

  const handleWeekendToggle = (day) => {
    setSettings(prev => {
      const weekends = prev.weekends.includes(day)
        ? prev.weekends.filter(d => d !== day)
        : [...prev.weekends, day].sort();

      return {
        ...prev,
        weekends
      };
    });
  };

  const handleSaveSettings = async () => {
    setSaving(true);
    try {
      // Save settings
      await companyAPI.updateSettings(company._id, settings);

      // Save currency (via profile update)
      await companyAPI.updateProfile(company._id, { currency });

      await onRefresh();
      toast.success('Company settings saved successfully!');
    } catch (error) {
      console.error('Error saving settings:', error);
      toast.error('Failed to save settings. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleAddHoliday = async (e) => {
    e.preventDefault();
    if (!holidayForm.date || !holidayForm.name) return;

    try {
      await companyAPI.addHoliday(company._id, holidayForm);
      await onRefresh();
      setHolidayForm({ date: '', name: '', description: '' });
      setShowHolidayForm(false);
      toast.success('Holiday added successfully!');
    } catch (error) {
      console.error('Error adding holiday:', error);
      toast.error('Failed to add holiday. Please try again.');
    }
  };

  const handleRemoveHoliday = (holidayId) => {
    const holiday = settings.holidays.find(h => h._id === holidayId);
    setDeleteModal({
      isOpen: true,
      id: holidayId,
      name: holiday?.name || 'this holiday'
    });
  };

  const confirmRemoveHoliday = async () => {
    try {
      await companyAPI.removeHoliday(company._id, deleteModal.id);
      await onRefresh();
      setDeleteModal({ isOpen: false, id: null, name: '' });
      toast.success('Holiday removed successfully!');
    } catch (error) {
      console.error('Error removing holiday:', error);
      toast.error('Failed to remove holiday. Please try again.');
    }
  };

  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  return (
    <div className="p-8 space-y-12 animate-in fade-in duration-700 font-sans">
      <div className="space-y-2 pb-8 border-b border-slate-100">
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-slate-100 rounded-full mb-2">
          <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest italic">Core Protocol</span>
        </div>
        <h2 className="text-3xl font-black text-slate-950 uppercase italic tracking-tighter">
          Organizational Parameters
        </h2>
        <p className="text-sm font-medium text-slate-400 italic">
          Configure global orchestration settings for the entity.
        </p>
      </div>

      {/* Currency Settings */}
      <div className="bg-white rounded-[2.5rem] p-10 border-2 border-slate-50 shadow-sm transition-all hover:shadow-md">
        <div className="flex items-center gap-4 mb-8">
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center text-xl shadow-inner italic font-black text-indigo-600">
            $
          </div>
          <h3 className="text-xl font-black text-slate-950 uppercase italic tracking-tight">
            Fiscal Standard
          </h3>
        </div>

        <div className="space-y-6 max-w-xl">
          <div className="space-y-3">
            <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1 italic">
              Default Ledger Currency
            </label>
            <div className="relative group">
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                disabled={!isOwner}
                className={`w-full px-6 py-4 rounded-2xl text-[13px] font-bold transition-all outline-none appearance-none cursor-pointer uppercase italic border-2 
                  ${isOwner
                    ? 'bg-slate-50 border-slate-100 text-slate-950 focus:border-indigo-400 focus:bg-white'
                    : 'bg-slate-100 border-transparent text-slate-400 cursor-not-allowed'}`}
              >
                {currencies.map((curr) => (
                  <option key={curr.code} value={curr.code}>
                    {curr.symbol} {curr.code} — {curr.name}
                  </option>
                ))}
              </select>
              {isOwner && <div className="absolute right-6 top-1/2 -translate-y-1/2 pointer-events-none text-indigo-400 opacity-40 group-hover:opacity-100 transition-opacity italic font-black text-xs">▼</div>}
            </div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest italic ml-1 opacity-60">
              System-wide denominator for all financial metrics.
            </p>
          </div>
        </div>
      </div>

      {/* Time Tracking Settings */}
      <div className="bg-white rounded-[2.5rem] p-10 border-2 border-slate-50 shadow-sm transition-all hover:shadow-md">
        <div className="flex items-center gap-4 mb-10">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 flex items-center justify-center text-xl shadow-inner italic font-black text-emerald-600">
            T
          </div>
          <h3 className="text-xl font-black text-slate-950 uppercase italic tracking-tight">
            Temporal Metadata
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-10 pb-10 border-b border-slate-50">
          <div className="space-y-3">
            <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1 italic">Reporting Unit</label>
            <select
              value={settings.timeTracking.defaultDurationUnit}
              onChange={(e) => handleTimeTrackingChange('defaultDurationUnit', e.target.value)}
              disabled={!isOwner}
              className="w-full px-6 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl text-[13px] font-bold text-slate-950 focus:border-indigo-400 focus:bg-white transition-all outline-none appearance-none cursor-pointer uppercase italic"
            >
              <option value="minutes">Minutes</option>
              <option value="hours">Hours</option>
              <option value="days">Days</option>
              <option value="weeks">Weeks</option>
            </select>
          </div>

          <div className="space-y-3">
            <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1 italic">Hours Per Cycle</label>
            <input
              type="number"
              min="1"
              max="24"
              value={settings.timeTracking.hoursPerDay}
              onChange={(e) => handleTimeTrackingChange('hoursPerDay', parseInt(e.target.value))}
              disabled={!isOwner}
              className="w-full px-6 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl text-[13px] font-black text-indigo-600 focus:border-indigo-400 focus:bg-white transition-all outline-none italic"
            />
          </div>

          <div className="space-y-3">
            <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1 italic">Workdays Per Cycle</label>
            <input
              type="number"
              min="1"
              max="7"
              value={settings.timeTracking.daysPerWeek}
              onChange={(e) => handleTimeTrackingChange('daysPerWeek', parseInt(e.target.value))}
              disabled={!isOwner}
              className="w-full px-6 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl text-[13px] font-black text-indigo-600 focus:border-indigo-400 focus:bg-white transition-all outline-none italic"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="space-y-3">
            <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1 italic">Shift Start Protocol</label>
            <input
              type="time"
              value={settings.timeTracking.workingHoursStart}
              onChange={(e) => handleTimeTrackingChange('workingHoursStart', e.target.value)}
              disabled={!isOwner}
              className="w-full px-6 py-4 bg-slate-100 border-2 border-transparent rounded-2xl text-sm font-bold text-slate-950 focus:border-indigo-400 focus:bg-white transition-all outline-none italic"
            />
          </div>

          <div className="space-y-3">
            <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1 italic">Shift Terminus Protocol</label>
            <input
              type="time"
              value={settings.timeTracking.workingHoursEnd}
              onChange={(e) => handleTimeTrackingChange('workingHoursEnd', e.target.value)}
              disabled={!isOwner}
              className="w-full px-6 py-4 bg-slate-100 border-2 border-transparent rounded-2xl text-sm font-bold text-slate-950 focus:border-indigo-400 focus:bg-white transition-all outline-none italic"
            />
          </div>

          <div className="p-6 bg-slate-950 rounded-[2rem] border border-white/10 shadow-xl flex items-center justify-between group overflow-hidden relative">
            <div className="absolute inset-0 bg-indigo-500 opacity-0 group-hover:opacity-10 transition-opacity duration-700"></div>
            <div className="relative z-10">
              <div className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.2em] mb-1 italic">Effective Quotient</div>
              <div className="text-2xl font-black text-white italic tracking-tighter">
                {(() => {
                  const start = settings.timeTracking.workingHoursStart.split(':');
                  const end = settings.timeTracking.workingHoursEnd.split(':');
                  const startMinutes = parseInt(start[0]) * 60 + parseInt(start[1]);
                  const endMinutes = parseInt(end[0]) * 60 + parseInt(end[1]);
                  const totalMinutes = endMinutes - startMinutes;
                  const hours = Math.floor(totalMinutes / 60);
                  const minutes = totalMinutes % 60;
                  return `${hours}H ${minutes > 0 ? `${minutes}M` : ''}`;
                })()}
              </div>
            </div>
            <div className="text-4xl opacity-20 group-hover:scale-110 transition-transform duration-700 italic font-black text-white shrink-0">∑</div>
          </div>
        </div>
      </div>

      {/* Operational Matrix (Working Days & Weekends) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white rounded-[2.5rem] p-10 border-2 border-slate-50 shadow-sm transition-all hover:shadow-md">
          <h3 className="text-lg font-black text-slate-950 uppercase italic tracking-tight mb-8">
            Operational Uptime
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {dayNames.map((day, index) => (
              <button
                key={index}
                onClick={() => isOwner && handleWorkingDayToggle(index)}
                disabled={!isOwner}
                className={`py-4 rounded-xl text-[10px] font-black uppercase tracking-widest italic transition-all border-2
                  ${settings.workingDays.includes(index)
                    ? 'bg-slate-950 border-slate-950 text-white shadow-lg'
                    : 'bg-slate-50 border-slate-100 text-slate-400 hover:border-indigo-200 hover:bg-white hover:text-indigo-600'}`}
              >
                {day.slice(0, 3)}
              </button>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-[2.5rem] p-10 border-2 border-slate-50 shadow-sm transition-all hover:shadow-md">
          <h3 className="text-lg font-black text-slate-950 uppercase italic tracking-tight mb-8">
            Terminal Idle States
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {dayNames.map((day, index) => (
              <button
                key={index}
                onClick={() => isOwner && handleWeekendToggle(index)}
                disabled={!isOwner}
                className={`py-4 rounded-xl text-[10px] font-black uppercase tracking-widest italic transition-all border-2
                  ${settings.weekends.includes(index)
                    ? 'bg-rose-600 border-rose-600 text-white shadow-lg shadow-rose-100'
                    : 'bg-slate-50 border-slate-100 text-slate-400 hover:border-rose-200 hover:bg-white hover:text-rose-600'}`}
              >
                {day.slice(0, 3)}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Holidays */}
      <div className="bg-white rounded-[2.5rem] p-10 border-2 border-slate-50 shadow-sm transition-all hover:shadow-md">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-10">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-amber-50 flex items-center justify-center text-xl shadow-inner italic font-black text-amber-600">
              H
            </div>
            <h3 className="text-xl font-black text-slate-950 uppercase italic tracking-tight">
              Protocol Exceptions
            </h3>
          </div>
          {isOwner && !showHolidayForm && (
            <button
              onClick={() => setShowHolidayForm(true)}
              className="px-6 py-3 bg-indigo-600 text-white rounded-xl font-black text-[10px] uppercase tracking-widest shadow-lg hover:bg-slate-950 hover:scale-[1.02] active:scale-95 transition-all italic flex items-center gap-3 w-fit"
            >
              <span className="text-lg leading-none">+</span> New Exception
            </button>
          )}
        </div>

        {showHolidayForm && (
          <form onSubmit={handleAddHoliday} className="p-8 bg-slate-50 rounded-[2rem] border-2 border-slate-100 mb-8 animate-in zoom-in-95 duration-500">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="space-y-3">
                <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1 italic">Temporal Coordinate</label>
                <input
                  type="date"
                  required
                  value={holidayForm.date}
                  onChange={(e) => setHolidayForm({ ...holidayForm, date: e.target.value })}
                  className="w-full px-6 py-4 bg-white border-2 border-slate-200 rounded-2xl text-[13px] font-bold text-slate-950 focus:border-indigo-400 transition-all outline-none"
                />
              </div>

              <div className="space-y-3">
                <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1 italic">Event Nomenclature</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. NATIONAL_PROTOCOL_REST"
                  value={holidayForm.name}
                  onChange={(e) => setHolidayForm({ ...holidayForm, name: e.target.value })}
                  className="w-full px-6 py-4 bg-white border-2 border-slate-200 rounded-2xl text-[13px] font-bold text-slate-950 focus:border-indigo-400 transition-all outline-none uppercase italic"
                />
              </div>

              <div className="space-y-3">
                <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1 italic">Directive Context</label>
                <input
                  type="text"
                  placeholder="Operational bypass reason..."
                  value={holidayForm.description}
                  onChange={(e) => setHolidayForm({ ...holidayForm, description: e.target.value })}
                  className="w-full px-6 py-4 bg-white border-2 border-slate-200 rounded-2xl text-[13px] font-bold text-slate-950 focus:border-indigo-400 transition-all outline-none italic"
                />
              </div>
            </div>

            <div className="flex gap-4">
              <button
                type="submit"
                className="flex-1 py-4 bg-indigo-600 text-white rounded-xl font-black text-[11px] uppercase tracking-[0.2em] shadow-lg hover:bg-slate-950 transition-all active:scale-95 italic"
              >
                Append Protocol
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowHolidayForm(false);
                  setHolidayForm({ date: '', name: '', description: '' });
                }}
                className="px-8 py-4 bg-white border-2 border-slate-200 text-slate-400 rounded-xl font-black text-[11px] uppercase tracking-widest hover:text-slate-900 transition-all italic"
              >
                Abort
              </button>
            </div>
          </form>
        )}

        <div className="space-y-3">
          {settings.holidays && settings.holidays.length > 0 ? (
            settings.holidays.map((holiday) => (
              <div
                key={holiday._id}
                className="group flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 bg-slate-50 border border-slate-100 rounded-[2rem] hover:bg-white hover:border-indigo-100 hover:shadow-lg transition-all duration-300"
              >
                <div className="flex items-center gap-6">
                  <div className="px-4 py-2 bg-white border border-slate-100 rounded-xl text-center shadow-sm">
                    <div className="text-[9px] font-black text-slate-400 uppercase tracking-tighter">
                      {new Date(holiday.date).toLocaleDateString('en-US', { month: 'short' })}
                    </div>
                    <div className="text-lg font-black text-slate-950 italic">
                      {new Date(holiday.date).getDate()}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm font-black text-slate-900 uppercase italic tracking-tight mb-1">
                      {holiday.name}
                    </div>
                    {holiday.description && (
                      <div className="text-[10px] font-medium text-slate-400 italic">
                        {holiday.description}
                      </div>
                    )}
                  </div>
                </div>
                {isOwner && (
                  <button
                    onClick={() => handleRemoveHoliday(holiday._id)}
                    className="px-4 py-2 opacity-0 group-hover:opacity-100 bg-rose-50 text-rose-600 rounded-lg text-[10px] font-black uppercase tracking-widest italic hover:bg-rose-600 hover:text-white transition-all scale-95 group-hover:scale-100 border border-rose-100"
                  >
                    Purge
                  </button>
                )}
              </div>
            ))
          ) : (
            <div className="p-20 text-center space-y-4 bg-slate-50/50 rounded-[3rem] border-2 border-dashed border-slate-100">
              <div className="text-4xl opacity-20 italic font-black text-slate-400">NULL</div>
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.3em] italic">
                Zero temporal exceptions detected in matrix.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Persistence Controls */}
      {isOwner && (
        <div className="flex justify-end pt-12">
          <button
            onClick={handleSaveSettings}
            disabled={saving}
            className={`px-12 py-5 rounded-2xl font-black text-[13px] uppercase tracking-[0.25em] shadow-2xl transition-all active:scale-95 italic flex items-center gap-4
              ${saving
                ? 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'
                : 'bg-indigo-600 text-white hover:bg-slate-950 hover:-translate-y-1'}`}
          >
            {saving ? (
              <>
                <div className="w-2 h-2 rounded-full bg-slate-400 animate-ping"></div>
                Committing Data...
              </>
            ) : (
              'Synchronize Matrix'
            )}
          </button>
        </div>
      )}

      <DeleteConfirmModal
        isOpen={deleteModal.isOpen}
        onClose={() => setDeleteModal({ isOpen: false, id: null, name: '' })}
        onConfirm={confirmRemoveHoliday}
        title="Exception Purge"
        message="Are you certain about removing this temporal exception from the core matrix?"
        itemName={deleteModal.name}
      />
    </div>
  );
};

export default CompanySettings;

