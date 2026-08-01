import React, { useState, useEffect } from 'react';
import api, { companyAPI } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { currencies } from '../../utils/currency';
import DeleteConfirmModal from '../common/DeleteConfirmModal';

const CompanySettings = ({ company, isOwner, onRefresh }) => {
  const toast = useToast();
  const [activeTab, setActiveTab] = useState('currency'); // currency | time | calendar | holidays
  const [settings, setSettings] = useState({
    timeTracking: {
      defaultDurationUnit: 'hours',
      hoursPerDay: 8,
      daysPerWeek: 5,
      workingHoursStart: '09:00',
      workingHoursEnd: '17:00'
    },
    workingDays: [1, 2, 3, 4, 5],
    weekends: [0, 6],
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

  // AI Country Holidays Generator State
  const [showAiHolidayModal, setShowAiHolidayModal] = useState(false);
  const [aiCountry, setAiCountry] = useState('Bangladesh');
  const [aiYear, setAiYear] = useState(2026);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiHolidays, setAiHolidays] = useState([]);
  const [selectedAiHolidayIndexes, setSelectedAiHolidayIndexes] = useState([]);

  const handleFetchAiHolidays = async () => {
    setAiLoading(true);
    try {
      const res = await api.post('/ai/fetch-country-holidays', { country: aiCountry, year: aiYear });
      const fetched = res.data?.holidays || [];
      setAiHolidays(fetched);
      setSelectedAiHolidayIndexes(fetched.map((_, i) => i)); // Select all by default
      if (fetched.length === 0) {
        toast.error('No holidays found for selected country.');
      } else {
        toast.success(`Found ${fetched.length} official holidays for ${aiCountry}!`);
      }
    } catch (err) {
      console.error('Error fetching AI holidays:', err);
      toast.error('Failed to fetch holidays with AI.');
    } finally {
      setAiLoading(false);
    }
  };

  const handleImportSelectedHolidays = async () => {
    if (selectedAiHolidayIndexes.length === 0) {
      toast.error('Please select at least one holiday to import.');
      return;
    }
    const toImport = selectedAiHolidayIndexes.map(i => aiHolidays[i]);
    const updatedHolidays = [...settings.holidays];

    let addedCount = 0;
    toImport.forEach(h => {
      const exists = updatedHolidays.some(existing => 
        existing.date === h.date || existing.name.toLowerCase() === h.name.toLowerCase()
      );
      if (!exists) {
        updatedHolidays.push({
          date: h.date,
          name: h.name,
          description: h.description || ''
        });
        addedCount++;
      }
    });

    const newSettings = { ...settings, holidays: updatedHolidays };
    setSettings(newSettings);

    try {
      setSaving(true);
      await companyAPI.updateSettings(company._id, newSettings);
      await onRefresh();
      toast.success(`✨ Successfully registered & saved ${addedCount} national holidays for ${aiCountry}!`);
      setShowAiHolidayModal(false);
      setAiHolidays([]);
    } catch (err) {
      console.error('Error saving holidays:', err);
      toast.error('Failed to save imported holidays.');
    } finally {
      setSaving(false);
    }
  };

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
      return { ...prev, workingDays };
    });
  };

  const handleWeekendToggle = (day) => {
    setSettings(prev => {
      const weekends = prev.weekends.includes(day)
        ? prev.weekends.filter(d => d !== day)
        : [...prev.weekends, day].sort();
      return { ...prev, weekends };
    });
  };

  const handleSaveSettings = async () => {
    setSaving(true);
    try {
      await companyAPI.updateSettings(company._id, settings);
      await companyAPI.updateProfile(company._id, { currency });
      await onRefresh();
      toast.success('Configuration saved successfully.');
    } catch (error) {
      console.error('Error saving settings:', error);
      toast.error('Failed to update settings.');
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
      toast.success('Holiday successfully registered.');
    } catch (error) {
      console.error('Error adding holiday:', error);
      toast.error('Failed to add holiday.');
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
      toast.success('Holiday record removed.');
    } catch (error) {
      console.error('Error removing holiday:', error);
      toast.error('Failed to remove holiday record.');
    }
  };

  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  return (
    <div className="flex flex-col lg:flex-row divide-y lg:divide-y-0 lg:divide-x divide-slate-100 min-h-screen bg-white">
      {/* Sidebar Navigation - Simulation */}
      <div className="w-full lg:w-72 p-6 space-y-1 bg-slate-50/50">
        <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-6 px-4">Configuration Map</h3>
        {[
          { id: 'currency', label: 'Currency', icon: '💰' },
          { id: 'time', label: 'Time & Attendance', icon: '🕒' },
          { id: 'calendar', label: 'Working Calendar', icon: '📅' },
          { id: 'holidays', label: 'Public Holidays', icon: '🎊' }
        ].map((item, i) => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${activeTab === item.id ? 'bg-white text-indigo-600 shadow-sm border border-slate-200' : 'text-slate-500 hover:bg-white hover:text-slate-900 focus:bg-white'}`}
          >
            <span className="opacity-70">{item.icon}</span>
            {item.label}
          </button>
        ))}
      </div>

      <div className="flex-1 p-8 lg:p-12 space-y-16 max-w-5xl">
        {/* Currency Settings */}
        {activeTab === 'currency' && (
          <section className="space-y-8">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white text-lg shadow-sm">💰</div>
              <div>
                <h3 className="text-xl font-bold text-slate-900 tracking-tight">Currency Configuration</h3>
                <p className="text-xs text-slate-400 font-medium">Define the primary currency for organizational accounting.</p>
              </div>
            </div>

            <div className="max-w-md space-y-4">
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Default System Currency</label>
                <select
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  disabled={!isOwner}
                  className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-900 outline-none focus:border-indigo-500 focus:bg-white transition-all cursor-pointer"
                >
                  {currencies.map((curr) => (
                    <option key={curr.code} value={curr.code}>{curr.symbol} {curr.code} — {curr.name}</option>
                  ))}
                </select>
              </div>
            </div>
          </section>
        )}

        {/* Time Tracking */}
        {activeTab === 'time' && (
          <section className="space-y-8">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-emerald-500 flex items-center justify-center text-white text-lg shadow-sm">🕒</div>
              <div>
                <h3 className="text-xl font-bold text-slate-900 tracking-tight">Time & Attendance</h3>
                <p className="text-xs text-slate-400 font-medium">Standardize labor units and working cycle parameters.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Default Time Unit</label>
                <select
                  value={settings.timeTracking.defaultDurationUnit}
                  onChange={(e) => handleTimeTrackingChange('defaultDurationUnit', e.target.value)}
                  disabled={!isOwner}
                  className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-900 outline-none focus:border-indigo-500 transition-all"
                >
                  <option value="minutes">Minutes</option>
                  <option value="hours">Hours</option>
                  <option value="days">Days</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Working Hours / Day</label>
                <input
                  type="number"
                  min="1" max="24"
                  value={settings.timeTracking.hoursPerDay}
                  onChange={(e) => handleTimeTrackingChange('hoursPerDay', parseInt(e.target.value))}
                  disabled={!isOwner}
                  className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-900 outline-none focus:border-indigo-500 transition-all font-mono"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Days / Week</label>
                <input
                  type="number"
                  min="1" max="7"
                  value={settings.timeTracking.daysPerWeek}
                  onChange={(e) => handleTimeTrackingChange('daysPerWeek', parseInt(e.target.value))}
                  disabled={!isOwner}
                  className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-900 outline-none focus:border-indigo-500 transition-all font-mono"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Business Hours Start</label>
                <input
                  type="time"
                  value={settings.timeTracking.workingHoursStart}
                  onChange={(e) => handleTimeTrackingChange('workingHoursStart', e.target.value)}
                  disabled={!isOwner}
                  className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-900 outline-none focus:border-indigo-500 transition-all"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Business Hours End</label>
                <input
                  type="time"
                  value={settings.timeTracking.workingHoursEnd}
                  onChange={(e) => handleTimeTrackingChange('workingHoursEnd', e.target.value)}
                  disabled={!isOwner}
                  className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-900 outline-none focus:border-indigo-500 transition-all"
                />
              </div>
              <div className="bg-slate-900 p-5 rounded-xl flex items-center justify-between shadow-md">
                <div>
                  <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest block mb-1">Shift Duration</span>
                  <span className="text-xl font-bold text-white tracking-tight">
                    {(() => {
                      const start = settings.timeTracking.workingHoursStart.split(':');
                      const end = settings.timeTracking.workingHoursEnd.split(':');
                      const startMin = parseInt(start[0]) * 60 + parseInt(start[1]);
                      const endMin = parseInt(end[0]) * 60 + parseInt(end[1]);
                      const total = endMin - startMin;
                      return `${Math.floor(total / 60)}h ${total % 60 > 0 ? `${total % 60}m` : ''}`;
                    })()}
                  </span>
                </div>
                <div className="text-2xl opacity-50">⏱️</div>
              </div>
            </div>
          </section>
        )}

        {/* Operational Days */}
        {activeTab === 'calendar' && (
          <section className="space-y-8">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-amber-500 flex items-center justify-center text-white text-lg shadow-sm">📅</div>
              <div>
                <h3 className="text-xl font-bold text-slate-900 tracking-tight">Working Calendar</h3>
                <p className="text-xs text-slate-400 font-medium">Define active operational days and weekend protocols.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-4">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1 block">Active Working Days</label>
                <div className="flex flex-wrap gap-2">
                  {dayNames.map((day, index) => (
                    <button
                      key={index}
                      onClick={() => isOwner && handleWorkingDayToggle(index)}
                      disabled={!isOwner}
                      className={`px-4 py-2.5 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all border ${settings.workingDays.includes(index) ? 'bg-indigo-600 border-indigo-600 text-white shadow-md' : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'}`}
                    >
                      {day.slice(0, 3)}
                    </button>
                  ))}
                </div>
              </div>
              <div className="space-y-4">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1 block">Weekend Definition</label>
                <div className="flex flex-wrap gap-2">
                  {dayNames.map((day, index) => (
                    <button
                      key={index}
                      onClick={() => isOwner && handleWeekendToggle(index)}
                      disabled={!isOwner}
                      className={`px-4 py-2.5 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all border ${settings.weekends.includes(index) ? 'bg-rose-600 border-rose-600 text-white shadow-md' : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'}`}
                    >
                      {day.slice(0, 3)}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Holidays */}
        {activeTab === 'holidays' && (
          <section className="space-y-8 pb-20">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-purple-600 flex items-center justify-center text-white text-lg shadow-sm">🎊</div>
                <div>
                  <h3 className="text-xl font-bold text-slate-900 tracking-tight">Public Holidays</h3>
                  <p className="text-xs text-slate-400 font-medium">Manage annual observed holidays and office closures.</p>
                </div>
              </div>
              {isOwner && !showHolidayForm && (
                <div className="flex flex-wrap items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setShowAiHolidayModal(true)}
                    className="px-5 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl font-bold text-[10px] uppercase tracking-widest shadow-md hover:from-purple-700 hover:to-indigo-700 transition-all flex items-center gap-2 active:scale-95"
                  >
                    <span>✨ Auto-Fetch Holidays with AI</span>
                  </button>
                  <button
                    onClick={() => setShowHolidayForm(true)}
                    className="px-5 py-2.5 bg-slate-900 text-white rounded-xl font-bold text-[10px] uppercase tracking-widest shadow-md hover:bg-slate-800 transition-all active:scale-95"
                  >
                    + Register Single Holiday
                  </button>
                </div>
              )}
            </div>

            {showHolidayForm && (
              <form onSubmit={handleAddHoliday} className="p-8 bg-slate-50 rounded-2xl border border-slate-200 space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Observance Date</label>
                    <input
                      type="date" required
                      value={holidayForm.date}
                      onChange={(e) => setHolidayForm({ ...holidayForm, date: e.target.value })}
                      className="w-full px-5 py-3.5 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-900 outline-none focus:border-indigo-500 transition-all font-mono"
                    />
                  </div>
                  <div className="space-y-2 lg:col-span-2">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Holiday Name</label>
                    <input
                      type="text" required
                      placeholder="e.g. Independence Day"
                      value={holidayForm.name}
                      onChange={(e) => setHolidayForm({ ...holidayForm, name: e.target.value })}
                      className="w-full px-5 py-3.5 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-900 outline-none focus:border-indigo-500 transition-all"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Notes / Description</label>
                  <input
                    type="text"
                    placeholder="Optional context for this closure..."
                    value={holidayForm.description}
                    onChange={(e) => setHolidayForm({ ...holidayForm, description: e.target.value })}
                    className="w-full px-5 py-3.5 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-900 outline-none focus:border-indigo-500 transition-all"
                  />
                </div>
                <div className="flex justify-end gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowHolidayForm(false)}
                    className="px-6 py-2.5 text-[10px] font-bold uppercase tracking-widest text-slate-500 hover:text-slate-900"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-8 py-2.5 bg-indigo-600 text-white rounded-xl text-[10px] font-bold uppercase tracking-widest shadow-md hover:bg-slate-900 transition-all"
                  >
                    Save Holiday
                  </button>
                </div>
              </form>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {settings.holidays?.length > 0 ? (
                settings.holidays.map((holiday) => (
                  <div key={holiday._id} className="group p-5 bg-white border border-slate-100 rounded-xl hover:border-indigo-100 hover:shadow-md transition-all flex items-center gap-5 relative overflow-hidden">
                    <div className="w-12 h-12 bg-slate-50 rounded-xl flex flex-col items-center justify-center border border-slate-100 shrink-0">
                      <span className="text-[9px] font-bold text-slate-400 uppercase leading-none mb-1">{new Date(holiday.date).toLocaleDateString('en-US', { month: 'short' })}</span>
                      <span className="text-xl font-bold text-slate-900 leading-none">{new Date(holiday.date).getDate()}</span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <h4 className="text-sm font-bold text-slate-900 truncate leading-none mb-1.5">{holiday.name}</h4>
                      <p className="text-[10px] text-slate-400 truncate italic">{holiday.description || 'Global observed holiday'}</p>
                    </div>
                    {isOwner && (
                      <button
                        onClick={() => handleRemoveHoliday(holiday._id)}
                        className="w-8 h-8 rounded-lg bg-rose-50 text-rose-500 opacity-0 group-hover:opacity-100 flex items-center justify-center hover:bg-rose-500 hover:text-white transition-all shadow-sm"
                      >
                        <span className="text-lg">×</span>
                      </button>
                    )}
                  </div>
                ))
              ) : (
                <div className="col-span-full py-20 text-center bg-slate-50/50 rounded-2xl border-2 border-dashed border-slate-100">
                  <p className="text-xs font-bold text-slate-300 uppercase tracking-widest">No holidays registered</p>
                </div>
              )}
            </div>
          </section>
        )}

        {/* Action Bar */}
        {isOwner && (
          <div className="fixed bottom-8 right-8 z-40 bg-white/80 backdrop-blur-sm p-2 rounded-xl border border-slate-200 shadow-xl">
            <button
              onClick={handleSaveSettings}
              disabled={saving}
              className={`px-10 py-3.5 rounded-lg font-bold text-[10px] uppercase tracking-widest shadow-md transition-all active:scale-95 flex items-center gap-3 ${saving ? 'bg-slate-200 text-slate-400' : 'bg-indigo-600 text-white hover:bg-slate-900 font-black'}`}
            >
              {saving ? 'Synchronizing...' : 'Save Configuration'}
            </button>
          </div>
        )}
      </div>

      {showAiHolidayModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-2xl w-full p-6 space-y-6 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center text-lg font-bold">✨</div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">Auto-Fetch Country Holidays with AI</h3>
                  <p className="text-xs text-slate-500 font-medium">Search official national holidays for any country and import all at once.</p>
                </div>
              </div>
              <button onClick={() => setShowAiHolidayModal(false)} className="text-slate-400 hover:text-slate-600 text-xl font-bold">✕</button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200/80">
              <div className="sm:col-span-2 space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Select Country</label>
                <select
                  value={aiCountry}
                  onChange={e => setAiCountry(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-none focus:border-purple-500"
                >
                  <option value="Bangladesh">Bangladesh 🇧🇩</option>
                  <option value="United States">United States 🇺🇸</option>
                  <option value="United Kingdom">United Kingdom 🇬🇧</option>
                  <option value="India">India 🇮🇳</option>
                  <option value="United Arab Emirates">United Arab Emirates 🇦🇪</option>
                  <option value="Canada">Canada 🇨🇦</option>
                  <option value="Australia">Australia 🇦🇺</option>
                  <option value="Germany">Germany 🇩🇪</option>
                  <option value="Singapore">Singapore 🇸🇬</option>
                  <option value="Japan">Japan 🇯🇵</option>
                  <option value="Saudi Arabia">Saudi Arabia 🇸🇦</option>
                  <option value="Malaysia">Malaysia 🇲🇾</option>
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Year</label>
                <select
                  value={aiYear}
                  onChange={e => setAiYear(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-none focus:border-purple-500"
                >
                  <option value={2026}>2026</option>
                  <option value={2027}>2027</option>
                  <option value={2025}>2025</option>
                </select>
              </div>
            </div>

            <button
              onClick={handleFetchAiHolidays}
              disabled={aiLoading}
              className="w-full py-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white rounded-xl font-bold text-xs uppercase tracking-widest shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {aiLoading ? (
                <>
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                  <span>Searching Official Holidays with AI...</span>
                </>
              ) : (
                <span>✨ Search Holidays with AI</span>
              )}
            </button>

            {aiHolidays.length > 0 && (
              <div className="flex-1 overflow-y-auto space-y-3 min-h-[180px] max-h-[320px] pr-1">
                <div className="flex items-center justify-between px-1">
                  <span className="text-xs font-bold text-slate-700">{aiHolidays.length} Holidays Found for {aiCountry} ({aiYear})</span>
                  <button
                    onClick={() => {
                      if (selectedAiHolidayIndexes.length === aiHolidays.length) {
                        setSelectedAiHolidayIndexes([]);
                      } else {
                        setSelectedAiHolidayIndexes(aiHolidays.map((_, i) => i));
                      }
                    }}
                    className="text-[10px] font-bold text-purple-600 uppercase hover:underline"
                  >
                    {selectedAiHolidayIndexes.length === aiHolidays.length ? 'Deselect All' : 'Select All'}
                  </button>
                </div>

                <div className="space-y-2">
                  {aiHolidays.map((h, i) => {
                    const isChecked = selectedAiHolidayIndexes.includes(i);
                    return (
                      <div
                        key={i}
                        onClick={() => {
                          setSelectedAiHolidayIndexes(prev =>
                            prev.includes(i) ? prev.filter(x => x !== i) : [...prev, i]
                          );
                        }}
                        className={`p-3.5 rounded-xl border flex items-center gap-3 cursor-pointer transition-all ${isChecked ? 'bg-purple-50/50 border-purple-200' : 'bg-slate-50 border-slate-200/80 opacity-60'}`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => {}}
                          className="w-4 h-4 text-purple-600 rounded"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <h4 className="text-xs font-bold text-slate-900 truncate">{h.name}</h4>
                            <span className="text-[10px] font-bold text-purple-700 bg-purple-100 px-2 py-0.5 rounded font-mono">{h.date}</span>
                          </div>
                          <p className="text-[10px] text-slate-500 truncate mt-0.5">{h.description}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="flex items-center justify-between border-t border-slate-100 pt-4">
              <button onClick={() => setShowAiHolidayModal(false)} className="px-4 py-2 text-xs font-bold text-slate-500 hover:text-slate-900">Close</button>
              {aiHolidays.length > 0 && (
                <button
                  onClick={handleImportSelectedHolidays}
                  disabled={saving || selectedAiHolidayIndexes.length === 0}
                  className="px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold shadow-md transition-all disabled:opacity-50"
                >
                  {saving ? 'Importing & Saving...' : `✨ Import & Save (${selectedAiHolidayIndexes.length}) Holidays`}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      <DeleteConfirmModal
        isOpen={deleteModal.isOpen}
        onClose={() => setDeleteModal({ isOpen: false, id: null, name: '' })}
        onConfirm={confirmRemoveHoliday}
        title="Remove Holiday"
        message="Are you sure you want to remove this public holiday from the organization calendar?"
        itemName={deleteModal.name}
      />
    </div>
  );
};

export default CompanySettings;


