import React, { useState, useEffect } from 'react';
import { useCompany } from '../context/CompanyContext';
import { useToast } from '../context/ToastContext';
import { holidayAPI, companyAPI } from '../services/api';
import Layout from './Layout';

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
    name: '',
    description: ''
  });
  const [loading, setLoading] = useState(true);
  const [companySettings, setCompanySettings] = useState({
    workingDays: [1, 2, 3, 4, 5],
    weekends: [0, 6]
  });
  const [savingSettings, setSavingSettings] = useState(false);

  useEffect(() => {
    if (selectedCompany && selectedCompany.id !== 'personal') {
      fetchHolidays();
      fetchCompanySettings();
    }
  }, [selectedCompany]);

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
      const holidayDate = new Date(holiday.date);
      return holidayDate.getDate() === date.getDate() &&
             holidayDate.getMonth() === date.getMonth() &&
             holidayDate.getFullYear() === date.getFullYear();
    });
  };

  const handleDateClick = (day) => {
    const clickedDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
    const dayHolidays = getHolidaysForDate(clickedDate);
    
    if (dayHolidays.length > 0) {
      // Edit existing holiday
      setEditingHoliday(dayHolidays[0]);
      setFormData({
        date: dayHolidays[0].date.split('T')[0],
        name: dayHolidays[0].name,
        description: dayHolidays[0].description || ''
      });
      setShowEditModal(true);
    } else {
      // Add new holiday
      setSelectedDate(clickedDate);
      setFormData({
        date: clickedDate.toISOString().split('T')[0],
        name: '',
        description: ''
      });
      setShowAddModal(true);
    }
  };

  const handleAddHoliday = async (e) => {
    e.preventDefault();
    try {
      await holidayAPI.create(selectedCompany.id, formData);
      setShowAddModal(false);
      setFormData({ date: '', name: '', description: '' });
      fetchHolidays();
      toast.success('Holiday added successfully!');
    } catch (error) {
      console.error('Error adding holiday:', error);
      const errorMessage = error.response?.data?.error || 'Failed to add holiday';
      toast.error(errorMessage);
    }
  };

  const handleUpdateHoliday = async (e) => {
    e.preventDefault();
    try {
      await holidayAPI.update(selectedCompany.id, editingHoliday._id, formData);
      setShowEditModal(false);
      setEditingHoliday(null);
      setFormData({ date: '', name: '', description: '' });
      fetchHolidays();
      toast.success('Holiday updated successfully!');
    } catch (error) {
      console.error('Error updating holiday:', error);
      const errorMessage = error.response?.data?.error || 'Failed to update holiday';
      toast.error(errorMessage);
    }
  };

  const handleDeleteHoliday = async () => {
    if (window.confirm('Are you sure you want to delete this holiday?')) {
      try {
        await holidayAPI.delete(selectedCompany.id, editingHoliday._id);
        setShowEditModal(false);
        setEditingHoliday(null);
        fetchHolidays();
        toast.success('Holiday deleted successfully!');
      } catch (error) {
        console.error('Error deleting holiday:', error);
        const errorMessage = error.response?.data?.error || 'Failed to delete holiday';
        toast.error(errorMessage);
      }
    }
  };

  const renderCalendar = () => {
    const { daysInMonth, startingDayOfWeek } = getDaysInMonth(currentDate);
    const days = [];
    const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(<div key={`empty-${i}`} style={{ padding: '8px' }}></div>);
    }

    // Add cells for each day of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
      const dayHolidays = getHolidaysForDate(date);
      const isToday = new Date().toDateString() === date.toDateString();
      const isWeekend = companySettings.weekends.includes(date.getDay());

      days.push(
        <div
          key={day}
          onClick={() => handleDateClick(day)}
          style={{
            padding: '8px',
            minHeight: '80px',
            border: '1px solid #e2e8f0',
            borderRadius: '8px',
            cursor: 'pointer',
            background: isToday ? '#eff6ff' : isWeekend ? '#f8fafc' : 'white',
            transition: 'all 0.2s',
            position: 'relative'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = isToday ? '#dbeafe' : '#f1f5f9';
            e.currentTarget.style.transform = 'translateY(-2px)';
            e.currentTarget.style.boxShadow = '0 4px 6px rgba(0, 0, 0, 0.1)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = isToday ? '#eff6ff' : isWeekend ? '#f8fafc' : 'white';
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = 'none';
          }}
        >
          <div style={{
            fontSize: '14px',
            fontWeight: isToday ? '700' : '600',
            color: isToday ? '#3b82f6' : '#1e293b',
            marginBottom: '4px'
          }}>
            {day}
          </div>
          {dayHolidays.map((holiday, idx) => (
            <div
              key={idx}
              style={{
                fontSize: '11px',
                padding: '4px 6px',
                background: 'linear-gradient(135deg, #f59e0b, #d97706)',
                color: 'white',
                borderRadius: '4px',
                marginTop: '4px',
                fontWeight: '600',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap'
              }}
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
        {/* Week day headers */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(7, 1fr)',
          gap: '8px',
          marginBottom: '8px'
        }}>
          {weekDays.map((day, index) => {
            const isWeekendDay = companySettings.weekends.includes(index);
            return (
              <div
                key={day}
                style={{
                  padding: '12px 8px',
                  textAlign: 'center',
                  fontWeight: '700',
                  fontSize: '13px',
                  color: isWeekendDay ? '#dc2626' : '#64748b',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                  background: isWeekendDay ? '#fee2e2' : 'transparent',
                  borderRadius: '6px'
                }}
              >
                {day}
              </div>
            );
          })}
        </div>

        {/* Calendar grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(7, 1fr)',
          gap: '8px'
        }}>
          {days}
        </div>
      </div>
    );
  };

  const changeMonth = (delta) => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + delta, 1));
  };

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  if (loading) {
    return (
      <Layout>
        <div style={{ padding: '40px', textAlign: 'center' }}>
          <div style={{ fontSize: '18px', color: '#64748b' }}>Loading calendar...</div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div style={{ padding: '24px', maxWidth: '1400px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '24px'
      }}>
        <h2 style={{
          margin: 0,
          fontSize: '28px',
          fontWeight: '700',
          color: '#1e293b'
        }}>
          Holiday Calendar
        </h2>
      </div>

      {/* Weekend & Working Days Management */}
      <div style={{
        background: 'white',
        borderRadius: '12px',
        padding: '24px',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
        marginBottom: '24px'
      }}>
        <h3 style={{ margin: '0 0 20px 0', fontSize: '18px', fontWeight: '700', color: '#1e293b' }}>
          🏖️ Weekend & Working Days Configuration
        </h3>

        <div style={{ marginBottom: '24px' }}>
          <div style={{ fontSize: '14px', fontWeight: '600', color: '#475569', marginBottom: '12px' }}>
            Weekends
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '8px' }}>
            {['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].map((day, index) => (
              <div
                key={index}
                onClick={() => handleWeekendToggle(index)}
                style={{
                  padding: '12px 8px',
                  border: `2px solid ${companySettings.weekends.includes(index) ? '#ef4444' : '#e2e8f0'}`,
                  borderRadius: '8px',
                  textAlign: 'center',
                  cursor: 'pointer',
                  background: companySettings.weekends.includes(index) ? '#fee2e2' : 'white',
                  transition: 'all 0.2s',
                  fontSize: '13px',
                  fontWeight: '600',
                  color: companySettings.weekends.includes(index) ? '#dc2626' : '#64748b'
                }}
              >
                {day.substring(0, 3)}
              </div>
            ))}
          </div>
        </div>

        <div style={{ marginBottom: '20px' }}>
          <div style={{ fontSize: '14px', fontWeight: '600', color: '#475569', marginBottom: '12px' }}>
            Working Days
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '8px' }}>
            {['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].map((day, index) => (
              <div
                key={index}
                onClick={() => handleWorkingDayToggle(index)}
                style={{
                  padding: '12px 8px',
                  border: `2px solid ${companySettings.workingDays.includes(index) ? '#3b82f6' : '#e2e8f0'}`,
                  borderRadius: '8px',
                  textAlign: 'center',
                  cursor: 'pointer',
                  background: companySettings.workingDays.includes(index) ? '#dbeafe' : 'white',
                  transition: 'all 0.2s',
                  fontSize: '13px',
                  fontWeight: '600',
                  color: companySettings.workingDays.includes(index) ? '#2563eb' : '#64748b'
                }}
              >
                {day.substring(0, 3)}
              </div>
            ))}
          </div>
        </div>

        <button
          onClick={saveWeekendSettings}
          disabled={savingSettings}
          style={{
            padding: '10px 20px',
            background: savingSettings ? '#94a3b8' : 'linear-gradient(135deg, #3b82f6, #2563eb)',
            border: 'none',
            borderRadius: '8px',
            cursor: savingSettings ? 'not-allowed' : 'pointer',
            fontSize: '14px',
            fontWeight: '600',
            color: 'white',
            boxShadow: '0 2px 4px rgba(59, 130, 246, 0.3)'
          }}
        >
          {savingSettings ? 'Saving...' : 'Save Weekend Settings'}
        </button>
      </div>

      {/* Calendar Navigation */}
      <div style={{
        background: 'white',
        borderRadius: '12px',
        padding: '24px',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '24px'
        }}>
          <button
            onClick={() => changeMonth(-1)}
            style={{
              padding: '10px 20px',
              background: '#f1f5f9',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '16px',
              fontWeight: '600',
              color: '#475569',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => {
              e.target.style.background = '#e2e8f0';
            }}
            onMouseLeave={(e) => {
              e.target.style.background = '#f1f5f9';
            }}
          >
            ← Previous
          </button>

          <h3 style={{
            margin: 0,
            fontSize: '24px',
            fontWeight: '700',
            color: '#1e293b'
          }}>
            {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
          </h3>

          <button
            onClick={() => changeMonth(1)}
            style={{
              padding: '10px 20px',
              background: '#f1f5f9',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '16px',
              fontWeight: '600',
              color: '#475569',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => {
              e.target.style.background = '#e2e8f0';
            }}
            onMouseLeave={(e) => {
              e.target.style.background = '#f1f5f9';
            }}
          >
            Next →
          </button>
        </div>

        {renderCalendar()}
      </div>

      {/* Add Holiday Modal */}
      {showAddModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            background: 'white',
            borderRadius: '12px',
            padding: '32px',
            width: '90%',
            maxWidth: '500px',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)'
          }}>
            <h3 style={{ margin: '0 0 24px 0', fontSize: '24px', fontWeight: '700', color: '#1e293b' }}>
              Add Holiday
            </h3>
            <form onSubmit={handleAddHoliday}>
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#475569' }}>
                  Date
                </label>
                <input
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  required
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px',
                    fontSize: '14px'
                  }}
                />
              </div>
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#475569' }}>
                  Holiday Name
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  placeholder="e.g., New Year's Day"
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px',
                    fontSize: '14px'
                  }}
                />
              </div>
              <div style={{ marginBottom: '24px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#475569' }}>
                  Description (Optional)
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Add a description..."
                  rows="3"
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px',
                    fontSize: '14px',
                    resize: 'vertical'
                  }}
                />
              </div>
              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  onClick={() => {
                    setShowAddModal(false);
                    setFormData({ date: '', name: '', description: '' });
                  }}
                  style={{
                    padding: '12px 24px',
                    background: '#f1f5f9',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: '600',
                    color: '#475569'
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{
                    padding: '12px 24px',
                    background: 'linear-gradient(135deg, #3b82f6, #2563eb)',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: '600',
                    color: 'white'
                  }}
                >
                  Add Holiday
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Holiday Modal */}
      {showEditModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            background: 'white',
            borderRadius: '12px',
            padding: '32px',
            width: '90%',
            maxWidth: '500px',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)'
          }}>
            <h3 style={{ margin: '0 0 24px 0', fontSize: '24px', fontWeight: '700', color: '#1e293b' }}>
              Edit Holiday
            </h3>
            <form onSubmit={handleUpdateHoliday}>
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#475569' }}>
                  Date
                </label>
                <input
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  required
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px',
                    fontSize: '14px'
                  }}
                />
              </div>
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#475569' }}>
                  Holiday Name
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px',
                    fontSize: '14px'
                  }}
                />
              </div>
              <div style={{ marginBottom: '24px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#475569' }}>
                  Description (Optional)
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows="3"
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px',
                    fontSize: '14px',
                    resize: 'vertical'
                  }}
                />
              </div>
              <div style={{ display: 'flex', gap: '12px', justifyContent: 'space-between' }}>
                <button
                  type="button"
                  onClick={handleDeleteHoliday}
                  style={{
                    padding: '12px 24px',
                    background: '#fee2e2',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: '600',
                    color: '#dc2626'
                  }}
                >
                  Delete
                </button>
                <div style={{ display: 'flex', gap: '12px' }}>
                  <button
                    type="button"
                    onClick={() => {
                      setShowEditModal(false);
                      setEditingHoliday(null);
                      setFormData({ date: '', name: '', description: '' });
                    }}
                    style={{
                      padding: '12px 24px',
                      background: '#f1f5f9',
                      border: 'none',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      fontSize: '14px',
                      fontWeight: '600',
                      color: '#475569'
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    style={{
                      padding: '12px 24px',
                      background: 'linear-gradient(135deg, #3b82f6, #2563eb)',
                      border: 'none',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      fontSize: '14px',
                      fontWeight: '600',
                      color: 'white'
                    }}
                  >
                    Update
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
      </div>
    </Layout>
  );
};

export default HolidayCalendar;

