import React, { useState, useEffect } from 'react';
import { projectAPI } from '../../services/api';

const SettingsTab = ({ projectId, project, isProjectOwner, onRefresh }) => {
  const [settings, setSettings] = useState({
    timeTracking: {
      defaultDurationUnit: 'hours',
      hoursPerDay: 8,
      daysPerWeek: 5,
      workingHoursStart: '09:00',
      workingHoursEnd: '17:00'
    },
    workingDays: [1, 2, 3, 4, 5], // Monday to Friday
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

  const handleSaveSettings = async () => {
    setSaving(true);
    try {
      await projectAPI.updateSettings(projectId, settings);
      await onRefresh();
      alert('Settings saved successfully!');
    } catch (error) {
      console.error('Error saving settings:', error);
      alert('Failed to save settings. Please try again.');
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
      alert('Failed to add holiday. Please try again.');
    }
  };

  const handleRemoveHoliday = async (holidayId) => {
    if (!window.confirm('Are you sure you want to remove this holiday?')) return;

    try {
      await projectAPI.removeHoliday(projectId, holidayId);
      await onRefresh();
    } catch (error) {
      console.error('Error removing holiday:', error);
      alert('Failed to remove holiday. Please try again.');
    }
  };

  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  return (
    <div style={{ maxWidth: '900px' }}>
      {/* Time Tracking Settings */}
      <div style={{
        backgroundColor: 'white',
        borderRadius: '8px',
        padding: '24px',
        marginBottom: '24px',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
      }}>
        <h3 style={{ margin: '0 0 20px 0', fontSize: '18px', fontWeight: '600', color: '#172b4d' }}>
          ⏱️ Time Tracking Settings
        </h3>

        <div style={{ display: 'grid', gap: '20px' }}>
          {/* Default Duration Unit */}
          <div>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: '#5e6c84', marginBottom: '8px' }}>
              Default Duration Unit
            </label>
            <select
              value={settings.timeTracking.defaultDurationUnit}
              onChange={(e) => handleTimeTrackingChange('defaultDurationUnit', e.target.value)}
              disabled={!isProjectOwner}
              style={{
                width: '100%',
                padding: '10px 12px',
                border: '1px solid #dfe1e6',
                borderRadius: '3px',
                fontSize: '14px',
                backgroundColor: 'white',
                cursor: isProjectOwner ? 'pointer' : 'not-allowed'
              }}
            >
              <option value="minutes">Minutes</option>
              <option value="hours">Hours</option>
              <option value="days">Days</option>
              <option value="weeks">Weeks</option>
            </select>
          </div>

          {/* Hours Per Day */}
          <div>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: '#5e6c84', marginBottom: '8px' }}>
              Hours Per Day
            </label>
            <input
              type="number"
              min="1"
              max="24"
              value={settings.timeTracking.hoursPerDay}
              onChange={(e) => handleTimeTrackingChange('hoursPerDay', parseInt(e.target.value))}
              disabled={!isProjectOwner}
              style={{
                width: '100%',
                padding: '10px 12px',
                border: '1px solid #dfe1e6',
                borderRadius: '3px',
                fontSize: '14px',
                cursor: isProjectOwner ? 'text' : 'not-allowed'
              }}
            />
          </div>

          {/* Days Per Week */}
          <div>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: '#5e6c84', marginBottom: '8px' }}>
              Days Per Week
            </label>
            <input
              type="number"
              min="1"
              max="7"
              value={settings.timeTracking.daysPerWeek}
              onChange={(e) => handleTimeTrackingChange('daysPerWeek', parseInt(e.target.value))}
              disabled={!isProjectOwner}
              style={{
                width: '100%',
                padding: '10px 12px',
                border: '1px solid #dfe1e6',
                borderRadius: '3px',
                fontSize: '14px',
                cursor: isProjectOwner ? 'text' : 'not-allowed'
              }}
            />
          </div>

          {/* Working Hours Start */}
          <div>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: '#5e6c84', marginBottom: '8px' }}>
              Working Hours Start
            </label>
            <input
              type="time"
              value={settings.timeTracking.workingHoursStart}
              onChange={(e) => handleTimeTrackingChange('workingHoursStart', e.target.value)}
              disabled={!isProjectOwner}
              style={{
                width: '100%',
                padding: '10px 12px',
                border: '1px solid #dfe1e6',
                borderRadius: '3px',
                fontSize: '14px',
                cursor: isProjectOwner ? 'text' : 'not-allowed'
              }}
            />
            <div style={{ fontSize: '12px', color: '#5e6c84', marginTop: '4px' }}>
              Daily work start time (e.g., 09:00)
            </div>
          </div>

          {/* Working Hours End */}
          <div>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: '#5e6c84', marginBottom: '8px' }}>
              Working Hours End
            </label>
            <input
              type="time"
              value={settings.timeTracking.workingHoursEnd}
              onChange={(e) => handleTimeTrackingChange('workingHoursEnd', e.target.value)}
              disabled={!isProjectOwner}
              style={{
                width: '100%',
                padding: '10px 12px',
                border: '1px solid #dfe1e6',
                borderRadius: '3px',
                fontSize: '14px',
                cursor: isProjectOwner ? 'text' : 'not-allowed'
              }}
            />
            <div style={{ fontSize: '12px', color: '#5e6c84', marginTop: '4px' }}>
              Daily work end time (e.g., 17:00)
            </div>
          </div>
        </div>

        {/* Total Working Hours Display */}
        <div style={{
          marginTop: '16px',
          padding: '16px',
          backgroundColor: '#f4f5f7',
          borderRadius: '3px',
          border: '1px solid #dfe1e6'
        }}>
          <div style={{ fontSize: '14px', fontWeight: '600', color: '#5e6c84', marginBottom: '8px' }}>
            Total Working Hours per Day
          </div>
          <div style={{ fontSize: '24px', fontWeight: '700', color: '#0052cc' }}>
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
              onClick={() => isProjectOwner && handleWorkingDayToggle(index)}
              style={{
                padding: '12px',
                border: `2px solid ${settings.workingDays.includes(index) ? '#0052cc' : '#dfe1e6'}`,
                borderRadius: '3px',
                textAlign: 'center',
                cursor: isProjectOwner ? 'pointer' : 'not-allowed',
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
            🎉 Holidays
          </h3>
          {isProjectOwner && !showHolidayForm && (
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

        {/* Holiday Form */}
        {showHolidayForm && (
          <form onSubmit={handleAddHoliday} style={{ marginBottom: '20px', padding: '16px', backgroundColor: '#f4f5f7', borderRadius: '3px' }}>
            <div style={{ display: 'grid', gap: '12px' }}>
              <input
                type="date"
                value={holidayForm.date}
                onChange={(e) => setHolidayForm({ ...holidayForm, date: e.target.value })}
                required
                style={{
                  padding: '10px 12px',
                  border: '1px solid #dfe1e6',
                  borderRadius: '3px',
                  fontSize: '14px'
                }}
              />
              <input
                type="text"
                placeholder="Holiday name *"
                value={holidayForm.name}
                onChange={(e) => setHolidayForm({ ...holidayForm, name: e.target.value })}
                required
                style={{
                  padding: '10px 12px',
                  border: '1px solid #dfe1e6',
                  borderRadius: '3px',
                  fontSize: '14px'
                }}
              />
              <input
                type="text"
                placeholder="Description (optional)"
                value={holidayForm.description}
                onChange={(e) => setHolidayForm({ ...holidayForm, description: e.target.value })}
                style={{
                  padding: '10px 12px',
                  border: '1px solid #dfe1e6',
                  borderRadius: '3px',
                  fontSize: '14px'
                }}
              />
            </div>
            <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
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
                  backgroundColor: 'transparent',
                  color: '#5e6c84',
                  border: 'none',
                  borderRadius: '3px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '500'
                }}
              >
                Cancel
              </button>
            </div>
          </form>
        )}

        {/* Holidays List */}
        {settings.holidays && settings.holidays.length > 0 ? (
          <div style={{ display: 'grid', gap: '12px' }}>
            {settings.holidays.map((holiday, index) => (
              <div
                key={holiday._id || index}
                style={{
                  padding: '16px',
                  border: '1px solid #dfe1e6',
                  borderRadius: '3px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}
              >
                <div>
                  <div style={{ fontSize: '14px', fontWeight: '600', color: '#172b4d', marginBottom: '4px' }}>
                    {holiday.name}
                  </div>
                  <div style={{ fontSize: '13px', color: '#5e6c84' }}>
                    {new Date(holiday.date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                  </div>
                  {holiday.description && (
                    <div style={{ fontSize: '13px', color: '#5e6c84', marginTop: '4px' }}>
                      {holiday.description}
                    </div>
                  )}
                </div>
                {isProjectOwner && (
                  <button
                    onClick={() => handleRemoveHoliday(holiday._id)}
                    style={{
                      padding: '6px 12px',
                      backgroundColor: '#de350b',
                      color: 'white',
                      border: 'none',
                      borderRadius: '3px',
                      cursor: 'pointer',
                      fontSize: '13px'
                    }}
                  >
                    Remove
                  </button>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '40px', color: '#5e6c84', fontSize: '14px' }}>
            No holidays added yet
          </div>
        )}
      </div>

      {/* Save Button */}
      {isProjectOwner && (
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <button
            onClick={handleSaveSettings}
            disabled={saving}
            style={{
              padding: '12px 24px',
              backgroundColor: saving ? '#dfe1e6' : '#0052cc',
              color: 'white',
              border: 'none',
              borderRadius: '3px',
              cursor: saving ? 'not-allowed' : 'pointer',
              fontSize: '14px',
              fontWeight: '600'
            }}
          >
            {saving ? 'Saving...' : 'Save Settings'}
          </button>
        </div>
      )}
    </div>
  );
};

export default SettingsTab;

