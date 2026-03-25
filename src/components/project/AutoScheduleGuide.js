import React from 'react';

const AutoScheduleGuide = ({ onClose }) => {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[1000] p-5">
      <div className="bg-white rounded-xl max-w-[800px] w-full max-h-[90vh] overflow-auto shadow-2xl">
        {/* Header */}
        <div className="p-6 border-b border-gray-200 flex justify-between items-center sticky top-0 bg-white z-10">
          <h2 className="m-0 text-2xl font-bold text-gray-800">
            🚀 Auto-Schedule Guide
          </h2>
          <button
            onClick={onClose}
            className="bg-transparent border-0 text-2xl cursor-pointer text-gray-500 px-2 py-1 hover:text-gray-700"
          >
            ×
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* What it does */}
          <section className="mb-8">
            <h3 className="text-lg font-semibold text-gray-800 mb-3">
              What is Auto-Schedule?
            </h3>
            <p className="text-sm text-gray-600 leading-relaxed m-0">
              Auto-Schedule automatically calculates start and end dates for all your tasks based on their duration,
              considering working days, holidays, and employee leaves. It saves hours of manual planning!
            </p>
          </section>

          {/* How it works */}
          <section className="mb-8">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
              How It Works
            </h3>
            
            <div className="flex flex-col gap-4">
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
          <section className="mb-8">
            <h3 className="text-lg font-semibold text-gray-800 mb-3">
              Example Calculation
            </h3>
            <div className="bg-gray-50 rounded-lg p-4 text-xs font-mono leading-loose">
              <div><strong>Task:</strong> "Design Homepage" - 3 working days</div>
              <div><strong>Start:</strong> Monday, Jan 1</div>
              <div><strong>Working Days:</strong> Mon-Fri</div>
              <div><strong>Holiday:</strong> Jan 3 (Wednesday)</div>
              <div className="mt-3 pt-3 border-t border-gray-300">
                <div>✅ Jan 1 (Mon) - Day 1</div>
                <div>✅ Jan 2 (Tue) - Day 2</div>
                <div>❌ Jan 3 (Wed) - Holiday</div>
                <div>✅ Jan 4 (Thu) - Day 3</div>
              </div>
              <div className="mt-3 pt-3 border-t border-gray-300 text-blue-600 font-bold">
                <strong>End Date:</strong> Thursday, Jan 4
              </div>
            </div>
          </section>

          {/* Tips */}
          <section>
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
              💡 Pro Tips
            </h3>
            <ul className="m-0 pl-5 text-sm text-gray-600 leading-loose">
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
    <div className="flex gap-4 items-start">
      <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-lg font-bold shrink-0">
        {number}
      </div>
      <div className="flex-1">
        <div className="text-base font-semibold text-gray-800 mb-1 flex items-center gap-2">
          <span>{icon}</span>
          {title}
        </div>
        <div className="text-sm text-gray-600 leading-normal">
          {description}
        </div>
      </div>
    </div>
  );
};

export default AutoScheduleGuide;

