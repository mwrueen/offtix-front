import React from 'react';

const AutoScheduleGuide = ({ onClose }) => {
  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: '20px'
    }}>
      <div style={{
        backgroundColor: 'white',
        borderRadius: '12px',
        maxWidth: '800px',
        width: '100%',
        maxHeight: '90vh',
        overflow: 'auto',
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)'
      }}>
        {/* Header */}
        <div style={{
          padding: '24px',
          borderBottom: '1px solid #dfe1e6',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          position: 'sticky',
          top: 0,
          backgroundColor: 'white',
          zIndex: 1
        }}>
          <h2 style={{ margin: 0, fontSize: '24px', fontWeight: '700', color: '#172b4d' }}>
            🚀 Auto-Schedule Guide
          </h2>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '24px',
              cursor: 'pointer',
              color: '#5e6c84',
              padding: '4px 8px'
            }}
          >
            ×
          </button>
        </div>

        {/* Content */}
        <div style={{ padding: '24px' }}>
          {/* What it does */}
          <section style={{ marginBottom: '32px' }}>
            <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#172b4d', marginBottom: '12px' }}>
              What is Auto-Schedule?
            </h3>
            <p style={{ fontSize: '14px', color: '#5e6c84', lineHeight: '1.6', margin: 0 }}>
              Auto-Schedule automatically calculates start and end dates for all your tasks based on their duration,
              considering working days, holidays, and employee leaves. It saves hours of manual planning!
            </p>
          </section>

          {/* How it works */}
          <section style={{ marginBottom: '32px' }}>
            <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#172b4d', marginBottom: '16px' }}>
              How It Works
            </h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <ScheduleStep
                number="1"
                title="Set Task Duration"
                description="Add duration to your tasks (e.g., 8 hours, 2 days, 1 week)"
                icon="⏱️"
              />
              <ScheduleStep
                number="2"
                title="Configure Working Days"
                description="Set your company's working days in Company Settings (default: Mon-Fri)"
                icon="📅"
              />
              <ScheduleStep
                number="3"
                title="Add Holidays"
                description="Add company holidays that should be excluded from scheduling"
                icon="🎉"
              />
              <ScheduleStep
                number="4"
                title="Click Auto-Schedule"
                description="Tasks are scheduled sequentially, skipping weekends, holidays, and leaves"
                icon="⚡"
              />
            </div>
          </section>

          {/* Example */}
          <section style={{ marginBottom: '32px' }}>
            <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#172b4d', marginBottom: '12px' }}>
              Example Calculation
            </h3>
            <div style={{
              backgroundColor: '#f4f5f7',
              borderRadius: '8px',
              padding: '16px',
              fontSize: '13px',
              fontFamily: 'monospace',
              lineHeight: '1.8'
            }}>
              <div><strong>Task:</strong> "Design Homepage" - 3 working days</div>
              <div><strong>Start:</strong> Monday, Jan 1</div>
              <div><strong>Working Days:</strong> Mon-Fri</div>
              <div><strong>Holiday:</strong> Jan 3 (Wednesday)</div>
              <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: '1px solid #dfe1e6' }}>
                <div>✅ Jan 1 (Mon) - Day 1</div>
                <div>✅ Jan 2 (Tue) - Day 2</div>
                <div>❌ Jan 3 (Wed) - Holiday</div>
                <div>✅ Jan 4 (Thu) - Day 3</div>
              </div>
              <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: '1px solid #dfe1e6', color: '#0052cc', fontWeight: 'bold' }}>
                <strong>End Date:</strong> Thursday, Jan 4
              </div>
            </div>
          </section>

          {/* Tips */}
          <section>
            <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#172b4d', marginBottom: '16px' }}>
              💡 Pro Tips
            </h3>
            <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '14px', color: '#5e6c84', lineHeight: '1.8' }}>
              <li>Set realistic task durations for accurate scheduling</li>
              <li>Keep company holidays updated for better accuracy</li>
              <li>Assign tasks to employees to consider their leaves</li>
              <li>Review the schedule after auto-scheduling and adjust if needed</li>
              <li>Re-run auto-schedule anytime to reset all dates</li>
            </ul>
          </section>
        </div>
      </div>
    </div>
  );
};

const ScheduleStep = ({ number, title, description, icon }) => {
  return (
    <div style={{
      display: 'flex',
      gap: '16px',
      alignItems: 'flex-start'
    }}>
      <div style={{
        width: '40px',
        height: '40px',
        borderRadius: '50%',
        backgroundColor: '#deebff',
        color: '#0052cc',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '18px',
        fontWeight: '700',
        flexShrink: 0
      }}>
        {number}
      </div>
      <div style={{ flex: 1 }}>
        <div style={{
          fontSize: '16px',
          fontWeight: '600',
          color: '#172b4d',
          marginBottom: '4px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <span>{icon}</span>
          {title}
        </div>
        <div style={{ fontSize: '14px', color: '#5e6c84', lineHeight: '1.5' }}>
          {description}
        </div>
      </div>
    </div>
  );
};

export default AutoScheduleGuide;

