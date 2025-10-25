import React, { useState, useEffect } from 'react';
import { requirementAPI, meetingNoteAPI, sprintAPI, phaseAPI, taskAPI } from '../../services/api';

const ProjectHistoryTab = ({ projectId, project }) => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    fetchProjectHistory();
  }, [projectId]);

  const fetchProjectHistory = async () => {
    try {
      setLoading(true);
      
      // Fetch all project-related data
      const [
        requirementsRes,
        meetingNotesRes,
        sprintsRes,
        phasesRes,
        tasksRes
      ] = await Promise.all([
        requirementAPI.getAll(projectId).catch(() => ({ data: [] })),
        meetingNoteAPI.getAll(projectId).catch(() => ({ data: [] })),
        sprintAPI.getAll(projectId).catch(() => ({ data: [] })),
        phaseAPI.getAll(projectId).catch(() => ({ data: [] })),
        taskAPI.getAll(projectId).catch(() => ({ data: [] }))
      ]);

      // Combine all activities into a single timeline
      const activities = [];

      // Project creation
      activities.push({
        id: `project-${project._id}`,
        type: 'project',
        action: 'created',
        title: 'Project Created',
        description: `Project "${project.title}" was created`,
        date: project.createdAt,
        user: project.owner,
        icon: '🚀',
        color: '#36b37e'
      });

      // Requirements
      requirementsRes.data.forEach(req => {
        activities.push({
          id: `requirement-${req._id}`,
          type: 'requirement',
          action: 'created',
          title: 'Requirement Added',
          description: `"${req.title}" requirement was added`,
          date: req.createdAt,
          user: req.createdBy,
          icon: '📋',
          color: '#0052cc',
          details: {
            type: req.type,
            priority: req.priority,
            status: req.status
          }
        });
      });

      // Meeting Notes
      meetingNotesRes.data.forEach(meeting => {
        activities.push({
          id: `meeting-${meeting._id}`,
          type: 'meeting',
          action: 'created',
          title: 'Meeting Conducted',
          description: `"${meeting.title}" meeting was held`,
          date: meeting.meetingDate,
          user: meeting.organizer,
          icon: '📝',
          color: '#ff8b00',
          details: {
            type: meeting.meetingType,
            duration: meeting.duration,
            attendees: meeting.attendees?.length || 0
          }
        });
      });

      // Sprints
      sprintsRes.data.forEach(sprint => {
        activities.push({
          id: `sprint-${sprint._id}`,
          type: 'sprint',
          action: 'created',
          title: 'Sprint Created',
          description: `Sprint "${sprint.name}" was created`,
          date: sprint.createdAt,
          user: sprint.createdBy,
          icon: '🏃‍♂️',
          color: '#6554c0',
          details: {
            status: sprint.status,
            duration: Math.ceil((new Date(sprint.endDate) - new Date(sprint.startDate)) / (1000 * 60 * 60 * 24)),
            capacity: sprint.capacity
          }
        });
      });

      // Phases
      phasesRes.data.forEach(phase => {
        activities.push({
          id: `phase-${phase._id}`,
          type: 'phase',
          action: 'created',
          title: 'Phase Created',
          description: `Phase "${phase.name}" was created`,
          date: phase.createdAt,
          user: phase.createdBy,
          icon: '🎯',
          color: '#00875a',
          details: {
            status: phase.status,
            budget: phase.budget
          }
        });
      });

      // Tasks (flatten subtasks)
      const flattenTasks = (tasks) => {
        let result = [];
        tasks.forEach(task => {
          result.push(task);
          if (task.subtasks && task.subtasks.length > 0) {
            result = result.concat(flattenTasks(task.subtasks));
          }
        });
        return result;
      };

      const allTasks = flattenTasks(tasksRes.data);
      allTasks.forEach(task => {
        activities.push({
          id: `task-${task._id}`,
          type: 'task',
          action: 'created',
          title: 'Task Created',
          description: `Task "${task.title}" was created`,
          date: task.createdAt,
          user: task.createdBy,
          icon: '✅',
          color: '#de350b',
          details: {
            status: task.status?.name,
            priority: task.priority,
            assignees: task.assignees?.length || 0
          }
        });
      });

      // Sort by date (newest first)
      activities.sort((a, b) => new Date(b.date) - new Date(a.date));
      
      setHistory(activities);
    } catch (error) {
      console.error('Error fetching project history:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredHistory = filter === 'all' 
    ? history 
    : history.filter(item => item.type === filter);

  const getFilterCounts = () => {
    const counts = {
      all: history.length,
      project: 0,
      requirement: 0,
      meeting: 0,
      sprint: 0,
      phase: 0,
      task: 0
    };

    history.forEach(item => {
      counts[item.type]++;
    });

    return counts;
  };

  const counts = getFilterCounts();

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '48px', color: '#5e6c84' }}>
        Loading project history...
      </div>
    );
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h2 style={{ margin: 0, fontSize: '20px', fontWeight: '600', color: '#172b4d' }}>
          Project History ({filteredHistory.length} activities)
        </h2>
      </div>

      {/* Filter Tabs */}
      <div style={{
        display: 'flex',
        gap: '8px',
        marginBottom: '24px',
        borderBottom: '1px solid #dfe1e6',
        paddingBottom: '12px'
      }}>
        {[
          { key: 'all', label: 'All', icon: '📊' },
          { key: 'project', label: 'Project', icon: '🚀' },
          { key: 'requirement', label: 'Requirements', icon: '📋' },
          { key: 'meeting', label: 'Meetings', icon: '📝' },
          { key: 'phase', label: 'Phases', icon: '🎯' },
          { key: 'sprint', label: 'Sprints', icon: '🏃‍♂️' },
          { key: 'task', label: 'Tasks', icon: '✅' }
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setFilter(tab.key)}
            style={{
              padding: '8px 12px',
              backgroundColor: filter === tab.key ? '#e6f7ff' : 'transparent',
              color: filter === tab.key ? '#0052cc' : '#5e6c84',
              border: filter === tab.key ? '1px solid #91d5ff' : '1px solid #dfe1e6',
              borderRadius: '3px',
              cursor: 'pointer',
              fontSize: '12px',
              fontWeight: filter === tab.key ? '600' : '400',
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}
          >
            <span>{tab.icon}</span>
            {tab.label} ({counts[tab.key]})
          </button>
        ))}
      </div>

      {/* Timeline */}
      <div style={{ position: 'relative' }}>
        {filteredHistory.length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: '48px',
            color: '#5e6c84',
            backgroundColor: '#ffffff',
            border: '1px solid #dfe1e6',
            borderRadius: '3px'
          }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>📚</div>
            <h4 style={{ margin: '0 0 8px 0', fontSize: '16px', color: '#172b4d' }}>No activities yet</h4>
            <p style={{ margin: 0, fontSize: '14px' }}>
              {filter === 'all' 
                ? 'Project activities will appear here as they happen.'
                : `No ${filter} activities found.`
              }
            </p>
          </div>
        ) : (
          <div style={{ position: 'relative' }}>
            {/* Timeline line */}
            <div style={{
              position: 'absolute',
              left: '20px',
              top: '0',
              bottom: '0',
              width: '2px',
              backgroundColor: '#dfe1e6'
            }} />

            {filteredHistory.map((activity, index) => (
              <div key={activity.id} style={{
                position: 'relative',
                paddingLeft: '60px',
                paddingBottom: '24px'
              }}>
                {/* Timeline dot */}
                <div style={{
                  position: 'absolute',
                  left: '12px',
                  top: '8px',
                  width: '16px',
                  height: '16px',
                  borderRadius: '50%',
                  backgroundColor: activity.color,
                  border: '2px solid #ffffff',
                  boxShadow: '0 0 0 2px #dfe1e6',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '8px'
                }}>
                  {activity.icon}
                </div>

                {/* Activity card */}
                <div style={{
                  backgroundColor: '#ffffff',
                  border: '1px solid #dfe1e6',
                  borderRadius: '3px',
                  padding: '16px'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                    <div>
                      <h4 style={{ margin: '0 0 4px 0', fontSize: '14px', fontWeight: '600', color: '#172b4d' }}>
                        {activity.title}
                      </h4>
                      <p style={{ margin: 0, fontSize: '13px', color: '#5e6c84' }}>
                        {activity.description}
                      </p>
                    </div>
                    <div style={{ fontSize: '11px', color: '#5e6c84', textAlign: 'right' }}>
                      <div>{new Date(activity.date).toLocaleDateString()}</div>
                      <div>{new Date(activity.date).toLocaleTimeString()}</div>
                    </div>
                  </div>

                  {activity.details && (
                    <div style={{ display: 'flex', gap: '8px', marginBottom: '8px', flexWrap: 'wrap' }}>
                      {Object.entries(activity.details).map(([key, value]) => (
                        value && (
                          <span key={key} style={{
                            padding: '2px 6px',
                            borderRadius: '11px',
                            fontSize: '10px',
                            fontWeight: '600',
                            backgroundColor: '#f4f5f7',
                            color: '#5e6c84',
                            border: '1px solid #dfe1e6',
                            textTransform: 'capitalize'
                          }}>
                            {key}: {value}
                          </span>
                        )
                      ))}
                    </div>
                  )}

                  <div style={{ fontSize: '11px', color: '#5e6c84' }}>
                    by {activity.user?.name || 'Unknown User'}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ProjectHistoryTab;