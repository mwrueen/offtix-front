import React, { useState, useEffect } from 'react';
import { useCompany } from '../context/CompanyContext';
import { useToast } from '../context/ToastContext';
import { holidayAPI, companyAPI } from '../services/api';
import Layout from './Layout';
import PageHeader from './PageHeader';
import DeleteConfirmModal from './common/DeleteConfirmModal';

const HolidayCalendar = () => {
  const { state } = useCompany();
  const selectedCompany = state.selectedCompany;
  const toast = useToast();
  const [holidays, setHolidays] = useState([]);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null);
  const [editingHoliday, setEditingHoliday] = useState(null);
  const [formData, setFormData] = useState({
    date: '',
    startDate: '',
    endDate: '',
    name: '',
    description: '',
    isRange: false
  });
  const [loading, setLoading] = useState(true);
  const [companySettings, setCompanySettings] = useState({
    workingDays: [1, 2, 3, 4, 5],
    weekends: [0, 6]
  });
  const [deleteModal, setDeleteModal] = useState({ isOpen: false });
  const [savingSettings, setSavingSettings] = useState(false);

  // Drag selection state
  const [isDragging, setIsDragging] = useState(false);
  const [dragStartDate, setDragStartDate] = useState(null);
  const [dragEndDate, setDragEndDate] = useState(null);
  const [hoveredDate, setHoveredDate] = useState(null);

  useEffect(() => {
    if (selectedCompany && selectedCompany.id !== 'personal') {
      fetchHolidays();
      fetchCompanySettings();
    }
  }, [selectedCompany]);

  useEffect(() => {
    const handleGlobalMouseUp = () => {
      if (isDragging) {
        handleMouseUp();
      }
    };

    document.addEventListener('mouseup', handleGlobalMouseUp);
    return () => {
      document.removeEventListener('mouseup', handleGlobalMouseUp);
    };
  }, [isDragging, dragStartDate, dragEndDate]);

  const fetchHolidays = async () => {
    try {
      setLoading(true);
      const response = await holidayAPI.getAll(selectedCompany.id);
      setHolidays(response.data.holidays || []);
    } catch (error) {
      console.error('Error fetching holidays:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCompanySettings = async () => {
    try {
      const response = await companyAPI.getById(selectedCompany.id);
      const company = response.data;
      setCompanySettings({
        workingDays: company.settings?.workingDays || [1, 2, 3, 4, 5],
        weekends: company.settings?.weekends || [0, 6]
      });
    } catch (error) {
      console.error('Error fetching company settings:', error);
    }
  };

  const handleWeekendToggle = (day) => {
    setCompanySettings(prev => {
      const weekends = prev.weekends.includes(day)
        ? prev.weekends.filter(d => d !== day)
        : [...prev.weekends, day].sort();

      return {
        ...prev,
        weekends
      };
    });
  };

  const handleWorkingDayToggle = (day) => {
    setCompanySettings(prev => {
      const workingDays = prev.workingDays.includes(day)
        ? prev.workingDays.filter(d => d !== day)
        : [...prev.workingDays, day].sort();

      return {
        ...prev,
        workingDays
      };
    });
  };

  const saveWeekendSettings = async () => {
    try {
      setSavingSettings(true);
      await companyAPI.updateSettings(selectedCompany.id, {
        workingDays: companySettings.workingDays,
        weekends: companySettings.weekends
      });
      toast.success('Weekend settings saved successfully!');
    } catch (error) {
      console.error('Error saving weekend settings:', error);
      const errorMessage = error.response?.data?.message || 'Failed to save weekend settings';
      toast.error(errorMessage);
    } finally {
      setSavingSettings(false);
    }
  };

  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    return { daysInMonth, startingDayOfWeek, year, month };
  };

  const getHolidaysForDate = (date) => {
    return holidays.filter(holiday => {
      if (holiday.isRange) {
        const start = new Date(holiday.startDate);
        const end = new Date(holiday.endDate);
        const checkDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
        const startCheck = new Date(start.getUTCFullYear(), start.getUTCMonth(), start.getUTCDate());
        const endCheck = new Date(end.getUTCFullYear(), end.getUTCMonth(), end.getUTCDate());
        return checkDate >= startCheck && checkDate <= endCheck;
      } else {
        if (!holiday.date) return false;
        const holidayDate = new Date(holiday.date);
        return holidayDate.getUTCDate() === date.getDate() &&
          holidayDate.getUTCMonth() === date.getMonth() &&
          holidayDate.getUTCFullYear() === date.getFullYear();
      }
    });
  };

  const handleMouseDown = (day) => {
    const clickedDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
    const dayHolidays = getHolidaysForDate(clickedDate);

    if (dayHolidays.length > 0) {
      const holiday = dayHolidays[0];
      setEditingHoliday(holiday);
      if (holiday.isRange) {
        setFormData({
          date: '',
          startDate: holiday.startDate.split('T')[0],
          endDate: holiday.endDate.split('T')[0],
          name: holiday.name,
          description: holiday.description || '',
          isRange: true
        });
      } else {
        setFormData({
          date: holiday.date.split('T')[0],
          startDate: '',
          endDate: '',
          name: holiday.name,
          description: holiday.description || '',
          isRange: false
        });
      }
      setShowEditModal(true);
    } else {
      setIsDragging(true);
      setDragStartDate(clickedDate);
      setDragEndDate(clickedDate);
    }
  };

  const handleMouseEnter = (day) => {
    if (isDragging) {
      const hoveredDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
      setDragEndDate(hoveredDate);
    }
    setHoveredDate(day);
  };

  const handleMouseUp = () => {
    if (isDragging && dragStartDate && dragEndDate) {
      const start = dragStartDate < dragEndDate ? dragStartDate : dragEndDate;
      const end = dragStartDate < dragEndDate ? dragEndDate : dragStartDate;

      const formatYMD = (date) => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
      };

      const isSameDay = start.getDate() === end.getDate() &&
        start.getMonth() === end.getMonth() &&
        start.getFullYear() === end.getFullYear();

      if (isSameDay) {
        setFormData({
          date: formatYMD(start),
          startDate: '',
          endDate: '',
          name: '',
          description: '',
          isRange: false
        });
      } else {
        setFormData({
          date: '',
          startDate: formatYMD(start),
          endDate: formatYMD(end),
          name: '',
          description: '',
          isRange: true
        });
      }
      setShowAddModal(true);
    }
    setIsDragging(false);
    setDragStartDate(null);
    setDragEndDate(null);
  };

  const handleMouseLeave = () => {
    setHoveredDate(null);
  };

  const isInDragRange = (day) => {
    if (!isDragging || !dragStartDate || !dragEndDate) return false;
    const checkDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
    const start = dragStartDate < dragEndDate ? dragStartDate : dragEndDate;
    const end = dragStartDate < dragEndDate ? dragEndDate : dragStartDate;
    return checkDate >= start && checkDate <= end;
  };

  const handleAddHoliday = async (e) => {
    e.preventDefault();
    try {
      await holidayAPI.create(selectedCompany.id, formData);
      setShowAddModal(false);
      setFormData({ date: '', startDate: '', endDate: '', name: '', description: '', isRange: false });
      fetchHolidays();
      toast.success('Holiday added successfully!');
    } catch (error) {
      console.error('Error adding holiday:', error);
      toast.error(error.response?.data?.error || 'Failed to add holiday');
    }
  };

  const handleUpdateHoliday = async (e) => {
    e.preventDefault();
    try {
      await holidayAPI.update(selectedCompany.id, editingHoliday._id, formData);
      setShowEditModal(false);
      setEditingHoliday(null);
      setFormData({ date: '', startDate: '', endDate: '', name: '', description: '', isRange: false });
      fetchHolidays();
      toast.success('Holiday updated successfully!');
    } catch (error) {
      console.error('Error updating holiday:', error);
      toast.error(error.response?.data?.error || 'Failed to update holiday');
    }
  };

  const handleDeleteHoliday = () => {
    setDeleteModal({ isOpen: true });
  };

  const confirmDeleteHoliday = async () => {
    try {
      await holidayAPI.delete(selectedCompany.id, editingHoliday._id);
      setShowEditModal(false);
      setEditingHoliday(null);
      setDeleteModal({ isOpen: false });
      fetchHolidays();
      toast.success('Holiday deleted successfully!');
    } catch (error) {
      console.error('Error deleting holiday:', error);
      toast.error(error.response?.data?.error || 'Failed to delete holiday');
    }
  };

  const renderCalendar = () => {
    const { daysInMonth, startingDayOfWeek } = getDaysInMonth(currentDate);
    const days = [];
    const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(<div key={`empty-${i}`} className="p-2"></div>);
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
      const dayHolidays = getHolidaysForDate(date);
      const isToday = new Date().toDateString() === date.toDateString();
      const isWeekend = companySettings.weekends.includes(date.getDay());
      const inDragRange = isInDragRange(day);

      days.push(
        <div
          key={day}
          onMouseDown={() => handleMouseDown(day)}
          onMouseEnter={() => handleMouseEnter(day)}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseLeave}
          className={`p-2 min-h-20 rounded-lg cursor-pointer relative select-none ${
            inDragRange 
              ? 'border-2 border-blue-500 bg-blue-50' 
              : 'border border-slate-200'
          } ${
            isToday 
              ? 'bg-blue-50' 
              : isWeekend 
                ? 'bg-slate-50' 
                : 'bg-white'
          }`}
        >
          <div className={`text-sm ${isToday ? 'font-bold text-blue-500' : 'font-semibold text-slate-800'}`}>
            {day}
          </div>
          {dayHolidays.map((holiday, idx) => (
            <div
              key={idx}
              className="text-xs px-1.5 py-1 bg-gradient-to-br from-amber-500 to-amber-600 text-white rounded mt-1 font-semibold overflow-hidden text-ellipsis whitespace-nowrap"
              title={holiday.name}
            >
              🎉 {holiday.name}
            </div>
          ))}
        </div>
      );
    }

    return (
      <div>
        <div className="grid grid-cols-7 gap-2 mb-2">
          {weekDays.map((day, index) => (
            <div key={day} className={`py-3 px-2 text-center font-bold text-xs ${companySettings.weekends.includes(index) ? 'text-red-600' : 'text-slate-500'}`}>
              {day}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-2">
          {days}
        </div>
      </div>
    );
  };

  const changeMonth = (delta) => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + delta, 1));
  };

  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

  if (loading) {
    return (
      <Layout>
        <div className="p-10 text-center">
          <div className="text-lg text-slate-500">Loading calendar...</div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <PageHeader
        title="Holiday Calendar"
        subtitle="Plan your holidays and manage company non-working days"
        icon={
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
            <line x1="16" y1="2" x2="16" y2="6"></line>
            <line x1="8" y1="2" x2="8" y2="6"></line>
            <line x1="3" y1="10" x2="21" y2="10"></line>
          </svg>
        }
      />

      <div className="bg-white rounded-xl p-6 shadow-sm mb-6">
        <h3 className="m-0 mb-5 text-lg font-bold">🏖️ Weekend & Working Days Configuration</h3>
        <div className="mb-5">
          <div className="grid grid-cols-7 gap-2">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day, index) => (
              <div 
                key={index} 
                onClick={() => handleWeekendToggle(index)} 
                className={`py-3 px-2 border-2 rounded-lg text-center cursor-pointer text-xs font-semibold ${
                  companySettings.weekends.includes(index) 
                    ? 'border-red-500 bg-red-50 text-red-600' 
                    : 'border-slate-200 bg-white text-slate-500'
                }`}
              >
                {day}
              </div>
            ))}
          </div>
        </div>
        <button 
          onClick={saveWeekendSettings} 
          disabled={savingSettings} 
          className={`px-5 py-2.5 border-0 rounded-lg cursor-pointer text-white ${
            savingSettings 
              ? 'bg-slate-400' 
              : 'bg-gradient-to-br from-blue-500 to-blue-600'
          }`}
        >
          {savingSettings ? 'Saving...' : 'Save Settings'}
        </button>
      </div>

      <div className="bg-white rounded-xl p-6 shadow-sm">
        <div className="flex justify-between items-center mb-6">
          <button onClick={() => changeMonth(-1)} className="px-5 py-2.5 bg-slate-100 border-0 rounded-lg cursor-pointer hover:bg-slate-200">← Previous</button>
          <h3 className="m-0 text-2xl font-bold">{monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}</h3>
          <button onClick={() => changeMonth(1)} className="px-5 py-2.5 bg-slate-100 border-0 rounded-lg cursor-pointer hover:bg-slate-200">Next →</button>
        </div>
        {renderCalendar()}
      </div>

      {showAddModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0, 0, 0, 0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: 'white', borderRadius: '12px', padding: '32px', width: '90%', maxWidth: '500px' }}>
            <h3 style={{ margin: '0 0 24px 0', fontSize: '24px', fontWeight: '700' }}>Add Holiday</h3>
            <form onSubmit={handleAddHoliday}>
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                  <input type="checkbox" checked={formData.isRange} onChange={(e) => setFormData({ ...formData, isRange: e.target.checked })} />
                  <span>Range Holiday</span>
                </label>
              </div>
              {formData.isRange ? (
                <>
                  <input type="date" value={formData.startDate} onChange={(e) => setFormData({ ...formData, startDate: e.target.value })} required style={{ width: '100%', padding: '12px', marginBottom: '16px' }} />
                  <input type="date" value={formData.endDate} onChange={(e) => setFormData({ ...formData, endDate: e.target.value })} required style={{ width: '100%', padding: '12px', marginBottom: '16px' }} />
                </>
              ) : (
                <input type="date" value={formData.date} onChange={(e) => setFormData({ ...formData, date: e.target.value })} required style={{ width: '100%', padding: '12px', marginBottom: '16px' }} />
              )}
              <input type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required placeholder="Holiday Name" style={{ width: '100%', padding: '12px', marginBottom: '16px' }} />
              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                <button type="button" onClick={() => setShowAddModal(false)} style={{ padding: '12px 24px' }}>Cancel</button>
                <button type="submit" style={{ padding: '12px 24px', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '8px' }}>Add</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showEditModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0, 0, 0, 0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: 'white', borderRadius: '12px', padding: '32px', width: '90%', maxWidth: '500px' }}>
            <h3 style={{ margin: '0 0 24px 0', fontSize: '24px', fontWeight: '700' }}>Edit Holiday</h3>
            <form onSubmit={handleUpdateHoliday}>
              <input type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required style={{ width: '100%', padding: '12px', marginBottom: '16px' }} />
              <div style={{ display: 'flex', gap: '12px', justifyContent: 'space-between' }}>
                <button type="button" onClick={handleDeleteHoliday} style={{ color: '#ef4444' }}>Delete</button>
                <div style={{ display: 'flex', gap: '12px' }}>
                  <button type="button" onClick={() => setShowEditModal(false)}>Cancel</button>
                  <button type="submit" style={{ padding: '12px 24px', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '8px' }}>Update</button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
      <DeleteConfirmModal
        isOpen={deleteModal.isOpen}
        onClose={() => setDeleteModal({ isOpen: false })}
        onConfirm={confirmDeleteHoliday}
        title="Delete Holiday"
        message="Are you sure you want to delete this holiday?"
        itemName={editingHoliday?.name}
      />
    </Layout>
  );
};

export default HolidayCalendar;
