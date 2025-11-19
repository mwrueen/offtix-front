import React, { useState } from 'react';

const InlineTaskCreator = ({ onCreateTask, onCancel, defaultDurationUnit = 'hours' }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [duration, setDuration] = useState('');
  const [durationUnit, setDurationUnit] = useState(defaultDurationUnit);
  const [showDescription, setShowDescription] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim()) return;

    const taskData = {
      title: title.trim(),
      description: description.trim() || undefined
    };

    // Add duration if provided
    if (duration && parseFloat(duration) > 0) {
      taskData.duration = {
        value: parseFloat(duration),
        unit: durationUnit
      };
    }

    await onCreateTask(taskData);

    // Reset form
    setTitle('');
    setDescription('');
    setDuration('');
    setDurationUnit(defaultDurationUnit);
    setShowDescription(false);
  };

  const handleCancel = () => {
    setTitle('');
    setDescription('');
    setDuration('');
    setDurationUnit(defaultDurationUnit);
    setShowDescription(false);
    if (onCancel) onCancel();
  };

  return (
    <div style={{
      padding: '16px',
      backgroundColor: 'white',
      border: '1px solid #dfe1e6',
      borderRadius: '3px',
      marginTop: '8px'
    }}>
      <form onSubmit={handleSubmit}>
        {/* Title Input */}
        <input
          type="text"
          placeholder="What needs to be done?"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          autoFocus
          style={{
            width: '100%',
            padding: '10px 12px',
            border: '2px solid #dfe1e6',
            borderRadius: '3px',
            fontSize: '14px',
            fontFamily: 'inherit',
            marginBottom: '8px',
            outline: 'none',
            transition: 'border-color 0.2s'
          }}
          onFocus={(e) => {
            e.target.style.borderColor = '#0052cc';
            setShowDescription(true);
          }}
          onBlur={(e) => {
            e.target.style.borderColor = '#dfe1e6';
          }}
        />

        {/* Description and Duration - Only show when focused */}
        {showDescription && (
          <>
            <textarea
              placeholder="Add a description (optional)"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 12px',
                border: '2px solid #dfe1e6',
                borderRadius: '3px',
                fontSize: '14px',
                fontFamily: 'inherit',
                marginBottom: '12px',
                minHeight: '80px',
                resize: 'vertical',
                outline: 'none',
                transition: 'border-color 0.2s'
              }}
              onFocus={(e) => {
                e.target.style.borderColor = '#0052cc';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = '#dfe1e6';
              }}
            />

            {/* Duration Input */}
            <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
              <input
                type="number"
                placeholder="Duration (optional)"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                min="0"
                step="0.5"
                style={{
                  flex: 1,
                  padding: '10px 12px',
                  border: '2px solid #dfe1e6',
                  borderRadius: '3px',
                  fontSize: '14px',
                  fontFamily: 'inherit',
                  outline: 'none',
                  transition: 'border-color 0.2s'
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = '#0052cc';
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = '#dfe1e6';
                }}
              />
              <select
                value={durationUnit}
                onChange={(e) => setDurationUnit(e.target.value)}
                style={{
                  padding: '10px 12px',
                  border: '2px solid #dfe1e6',
                  borderRadius: '3px',
                  fontSize: '14px',
                  fontFamily: 'inherit',
                  backgroundColor: 'white',
                  cursor: 'pointer',
                  outline: 'none',
                  minWidth: '120px'
                }}
              >
                <option value="minutes">Minutes</option>
                <option value="hours">Hours</option>
                <option value="days">Days</option>
                <option value="weeks">Weeks</option>
              </select>
            </div>
          </>
        )}

        {/* Action Buttons */}
        {showDescription && (
          <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
            <button
              type="button"
              onClick={handleCancel}
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
            <button
              type="submit"
              disabled={!title.trim()}
              style={{
                padding: '8px 16px',
                backgroundColor: title.trim() ? '#0052cc' : '#dfe1e6',
                color: 'white',
                border: 'none',
                borderRadius: '3px',
                cursor: title.trim() ? 'pointer' : 'not-allowed',
                fontSize: '14px',
                fontWeight: '500'
              }}
            >
              Create
            </button>
          </div>
        )}
      </form>
    </div>
  );
};

export default InlineTaskCreator;

