import React, { useState, useEffect } from 'react';
import { companyAPI } from '../../services/api';
import { useToast } from '../../context/ToastContext';

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

  const [holidayForm, setHolidayForm] = useState({
    date: '',
    name: '',
    description: ''
  });

  const [showHolidayForm, setShowHolidayForm] = useState(false);
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
      await companyAPI.updateSettings(company._id, settings);
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

  const handleRemoveHoliday = async (holidayId) => {
    if (!window.confirm('Are you sure you want to remove this holiday?')) return;

    try {
      await companyAPI.removeHoliday(company._id, holidayId);
      await onRefresh();
      toast.success('Holiday removed successfully!');
    } catch (error) {
      console.error('Error removing holiday:', error);
      toast.error('Failed to remove holiday. Please try again.');
    }
  };

  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  return (
    <div style={{ padding: '24px' }}>
      <div style={{ marginBottom: '32px' }}>
        <h2 style={{ margin: '0 0 8px 0', fontSize: '24px', fontWeight: '600', color: '#172b4d' }}>
          ⚙️ Company Settings
        </h2>
        <p style={{ margin: 0, fontSize: '14px', color: '#5e6c84' }}>
          Configure company-wide settings that apply to all projects
        </p>
      </div>

      {/* Time Tracking Settings */}
      <div style={{
        backgroundColor: 'white',
        borderRadius: '8px',
        padding: '24px',
        marginBottom: '24px',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
      }}>
        <h3 style={{ margin: '0 0 20px 0', fontSize: '18px', fontWeight: '600', color: '#172b4d' }}>
          ⏱️ Time Tracking
        </h3>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#5e6c84', marginBottom: '8px' }}>
              DEFAULT DURATION UNIT
            </label>
            <select
              value={settings.timeTracking.defaultDurationUnit}
              onChange={(e) => handleTimeTrackingChange('defaultDurationUnit', e.target.value)}
              disabled={!isOwner}
              style={{
                width: '100%',
                padding: '8px',
                border: '1px solid #dfe1e6',
                borderRadius: '3px',
                fontSize: '14px',
                backgroundColor: isOwner ? 'white' : '#f4f5f7',
                cursor: isOwner ? 'pointer' : 'not-allowed'
              }}
            >
              <option value="minutes">Minutes</option>
              <option value="hours">Hours</option>
              <option value="days">Days</option>
              <option value="weeks">Weeks</option>
            </select>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#5e6c84', marginBottom: '8px' }}>
              HOURS PER DAY
            </label>
            <input
              type="number"
              min="1"
              max="24"
              value={settings.timeTracking.hoursPerDay}
              onChange={(e) => handleTimeTrackingChange('hoursPerDay', parseInt(e.target.value))}
              disabled={!isOwner}
              style={{
                width: '100%',
                padding: '8px',
                border: '1px solid #dfe1e6',
                borderRadius: '3px',
                fontSize: '14px',
                backgroundColor: isOwner ? 'white' : '#f4f5f7'
              }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#5e6c84', marginBottom: '8px' }}>
              DAYS PER WEEK
            </label>
            <input
              type="number"
              min="1"
              max="7"
              value={settings.timeTracking.daysPerWeek}
              onChange={(e) => handleTimeTrackingChange('daysPerWeek', parseInt(e.target.value))}
              disabled={!isOwner}
              style={{
                width: '100%',
                padding: '8px',
                border: '1px solid #dfe1e6',
                borderRadius: '3px',
                fontSize: '14px',
                backgroundColor: isOwner ? 'white' : '#f4f5f7'
              }}
            />
          </div>
        </div>

        <div style={{
          marginTop: '24px',
          paddingTop: '24px',
          borderTop: '1px solid #dfe1e6',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '20px'
        }}>
          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#5e6c84', marginBottom: '8px' }}>
              WORKING HOURS START
            </label>
            <input
              type="time"
              value={settings.timeTracking.workingHoursStart}
              onChange={(e) => handleTimeTrackingChange('workingHoursStart', e.target.value)}
              disabled={!isOwner}
              style={{
                width: '100%',
                padding: '8px',
                border: '1px solid #dfe1e6',
                borderRadius: '3px',
                fontSize: '14px',
                backgroundColor: isOwner ? 'white' : '#f4f5f7'
              }}
            />
            <div style={{ fontSize: '11px', color: '#5e6c84', marginTop: '4px' }}>
              Daily work start time (e.g., 09:00)
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#5e6c84', marginBottom: '8px' }}>
              WORKING HOURS END
            </label>
            <input
              type="time"
              value={settings.timeTracking.workingHoursEnd}
              onChange={(e) => handleTimeTrackingChange('workingHoursEnd', e.target.value)}
              disabled={!isOwner}
              style={{
                width: '100%',
                padding: '8px',
                border: '1px solid #dfe1e6',
                borderRadius: '3px',
                fontSize: '14px',
                backgroundColor: isOwner ? 'white' : '#f4f5f7'
              }}
            />
            <div style={{ fontSize: '11px', color: '#5e6c84', marginTop: '4px' }}>
              Daily work end time (e.g., 17:00)
            </div>
          </div>

          <div style={{
            display: 'flex',
            alignItems: 'center',
            padding: '12px',
            backgroundColor: '#f4f5f7',
            borderRadius: '3px',
            border: '1px solid #dfe1e6'
          }}>
            <div>
              <div style={{ fontSize: '12px', fontWeight: '600', color: '#5e6c84', marginBottom: '4px' }}>
                TOTAL HOURS
              </div>
              <div style={{ fontSize: '20px', fontWeight: '700', color: '#0052cc' }}>
                {(() => {
                  const start = settings.timeTracking.workingHoursStart.split(':');
                  const end = settings.timeTracking.workingHoursEnd.split(':');
                  const startMinutes = parseInt(start[0]) * 60 + parseInt(start[1]);
                  const endMinutes = parseInt(end[0]) * 60 + parseInt(end[1]);
                  const totalMinutes = endMinutes - startMinutes;
                  const hours = Math.floor(totalMinutes / 60);
                  const minutes = totalMinutes % 60;
                  return `${hours}h ${minutes}m`;
                })()}
              </div>
              <div style={{ fontSize: '11px', color: '#5e6c84', marginTop: '2px' }}>
                per working day
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Working Days */}
      <div style={{
        backgroundColor: 'white',
        borderRadius: '8px',
        padding: '24px',
        marginBottom: '24px',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
      }}>
        <h3 style={{ margin: '0 0 20px 0', fontSize: '18px', fontWeight: '600', color: '#172b4d' }}>
          📅 Working Days
        </h3>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '12px' }}>
          {dayNames.map((day, index) => (
            <div
              key={index}
              onClick={() => isOwner && handleWorkingDayToggle(index)}
              style={{
                padding: '12px',
                border: `2px solid ${settings.workingDays.includes(index) ? '#0052cc' : '#dfe1e6'}`,
                borderRadius: '3px',
                textAlign: 'center',
                cursor: isOwner ? 'pointer' : 'not-allowed',
                backgroundColor: settings.workingDays.includes(index) ? '#deebff' : 'white',
                transition: 'all 0.2s',
                fontSize: '14px',
                fontWeight: '500',
                color: settings.workingDays.includes(index) ? '#0052cc' : '#5e6c84'
              }}
            >
              {day}
            </div>
          ))}
        </div>
      </div>

      {/* Weekends */}
      <div style={{
        backgroundColor: 'white',
        borderRadius: '8px',
        padding: '24px',
        marginBottom: '24px',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
      }}>
        <h3 style={{ margin: '0 0 20px 0', fontSize: '18px', fontWeight: '600', color: '#172b4d' }}>
          🏖️ Weekends
        </h3>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '12px' }}>
          {dayNames.map((day, index) => (
            <div
              key={index}
              onClick={() => isOwner && handleWeekendToggle(index)}
              style={{
                padding: '12px',
                border: `2px solid ${settings.weekends.includes(index) ? '#de350b' : '#dfe1e6'}`,
                borderRadius: '3px',
                textAlign: 'center',
                cursor: isOwner ? 'pointer' : 'not-allowed',
                backgroundColor: settings.weekends.includes(index) ? '#ffebe6' : 'white',
                transition: 'all 0.2s',
                fontSize: '14px',
                fontWeight: '500',
                color: settings.weekends.includes(index) ? '#de350b' : '#5e6c84'
              }}
            >
              {day}
            </div>
          ))}
        </div>
      </div>

      {/* Holidays */}
      <div style={{
        backgroundColor: 'white',
        borderRadius: '8px',
        padding: '24px',
        marginBottom: '24px',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '600', color: '#172b4d' }}>
            🎉 Company Holidays
          </h3>
          {isOwner && !showHolidayForm && (
            <button
              onClick={() => setShowHolidayForm(true)}
              style={{
                padding: '8px 16px',
                backgroundColor: '#0052cc',
                color: 'white',
                border: 'none',
                borderRadius: '3px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '500'
              }}
            >
              + Add Holiday
            </button>
          )}
        </div>

        {showHolidayForm && (
          <form onSubmit={handleAddHoliday} style={{
            padding: '16px',
            backgroundColor: '#f4f5f7',
            borderRadius: '3px',
            marginBottom: '16px'
          }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr 3fr auto', gap: '12px', alignItems: 'end' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#5e6c84', marginBottom: '4px' }}>
                  Date *
                </label>
                <input
                  type="date"
                  required
                  value={holidayForm.date}
                  onChange={(e) => setHolidayForm({ ...holidayForm, date: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '8px',
                    border: '1px solid #dfe1e6',
                    borderRadius: '3px',
                    fontSize: '14px'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#5e6c84', marginBottom: '4px' }}>
                  Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g., New Year's Day"
                  value={holidayForm.name}
                  onChange={(e) => setHolidayForm({ ...holidayForm, name: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '8px',
                    border: '1px solid #dfe1e6',
                    borderRadius: '3px',
                    fontSize: '14px'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#5e6c84', marginBottom: '4px' }}>
                  Description (Optional)
                </label>
                <input
                  type="text"
                  placeholder="Additional details..."
                  value={holidayForm.description}
                  onChange={(e) => setHolidayForm({ ...holidayForm, description: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '8px',
                    border: '1px solid #dfe1e6',
                    borderRadius: '3px',
                    fontSize: '14px'
                  }}
                />
              </div>

              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  type="submit"
                  style={{
                    padding: '8px 16px',
                    backgroundColor: '#0052cc',
                    color: 'white',
                    border: 'none',
                    borderRadius: '3px',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: '500'
                  }}
                >
                  Add
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowHolidayForm(false);
                    setHolidayForm({ date: '', name: '', description: '' });
                  }}
                  style={{
                    padding: '8px 16px',
                    backgroundColor: '#f4f5f7',
                    color: '#5e6c84',
                    border: '1px solid #dfe1e6',
                    borderRadius: '3px',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: '500'
                  }}
                >
                  Cancel
                </button>
              </div>
            </div>
          </form>
        )}

        {settings.holidays && settings.holidays.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {settings.holidays.map((holiday) => (
              <div
                key={holiday._id}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '12px',
                  backgroundColor: '#f4f5f7',
                  borderRadius: '3px',
                  border: '1px solid #dfe1e6'
                }}
              >
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '14px', fontWeight: '600', color: '#172b4d', marginBottom: '4px' }}>
                    {holiday.name}
                  </div>
                  <div style={{ fontSize: '12px', color: '#5e6c84' }}>
                    {new Date(holiday.date).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                    {holiday.description && ` • ${holiday.description}`}
                  </div>
                </div>
                {isOwner && (
                  <button
                    onClick={() => handleRemoveHoliday(holiday._id)}
                    style={{
                      padding: '6px 12px',
                      backgroundColor: '#de350b',
                      color: 'white',
                      border: 'none',
                      borderRadius: '3px',
                      cursor: 'pointer',
                      fontSize: '12px',
                      fontWeight: '500'
                    }}
                  >
                    Remove
                  </button>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div style={{
            padding: '32px',
            textAlign: 'center',
            color: '#5e6c84',
            fontSize: '14px'
          }}>
            No holidays configured yet. {isOwner && 'Click "Add Holiday" to get started.'}
          </div>
        )}
      </div>

      {/* Save Button */}
      {isOwner && (
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '24px' }}>
          <button
            onClick={handleSaveSettings}
            disabled={saving}
            style={{
              padding: '12px 24px',
              backgroundColor: saving ? '#ccc' : '#0052cc',
              color: 'white',
              border: 'none',
              borderRadius: '3px',
              cursor: saving ? 'not-allowed' : 'pointer',
              fontSize: '14px',
              fontWeight: '500'
            }}
          >
            {saving ? 'Saving...' : 'Save Settings'}
          </button>
        </div>
      )}
    </div>
  );
};

export default CompanySettings;

