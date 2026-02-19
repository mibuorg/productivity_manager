import { describe, expect, it } from 'vitest';
import { Task } from '@/types/kanban';
import { sortTasksByPriorityAndCreatedAtDesc } from './taskSorting';

const baseTask: Task = {
  id: 'task-1',
  board_id: 'board-1',
  title: 'Task',
  description: '',
  status: 'todo',
  priority: 'medium',
  due_date: null,
  tags: [],
  assignee: '',
  position: 0,
  custom_field_values: {},
  pomodoros_completed: 0,
  created_at: '2026-02-17T00:00:00.000Z',
  updated_at: '2026-02-17T00:00:00.000Z',
};

describe('task sorting', () => {
  it('sorts by priority descending and created_at descending for equal priorities', () => {
    const lowNewest: Task = {
      ...baseTask,
      id: 'low-newest',
      priority: 'low',
      created_at: '2026-02-18T12:00:00.000Z',
    };
    const urgentOlder: Task = {
      ...baseTask,
      id: 'urgent-older',
      priority: 'urgent',
      created_at: '2026-02-18T09:00:00.000Z',
    };
    const high: Task = {
      ...baseTask,
      id: 'high',
      priority: 'high',
      created_at: '2026-02-18T11:00:00.000Z',
    };
    const urgentNewer: Task = {
      ...baseTask,
      id: 'urgent-newer',
      priority: 'urgent',
      created_at: '2026-02-18T10:00:00.000Z',
    };

    const result = sortTasksByPriorityAndCreatedAtDesc([
      lowNewest,
      urgentOlder,
      high,
      urgentNewer,
    ]);

    expect(result.map(task => task.id)).toEqual([
      'urgent-newer',
      'urgent-older',
      'high',
      'low-newest',
    ]);
  });

  it('sorts timed tasks by time descending, then priority descending', () => {
    const noTimeUrgent: Task = {
      ...baseTask,
      id: 'no-time-urgent',
      priority: 'urgent',
      created_at: '2026-02-18T14:00:00.000Z',
    };
    const laterTimeLow: Task = {
      ...baseTask,
      id: 'later-time-low',
      priority: 'low',
      scheduled_time: '17:00',
    };
    const earlierTimeUrgent: Task = {
      ...baseTask,
      id: 'earlier-time-urgent',
      priority: 'urgent',
      scheduled_time: '15:30',
    };
    const sameTimeHigh: Task = {
      ...baseTask,
      id: 'same-time-high',
      priority: 'high',
      scheduled_time: '15:30',
    };

    const result = sortTasksByPriorityAndCreatedAtDesc([
      noTimeUrgent,
      sameTimeHigh,
      laterTimeLow,
      earlierTimeUrgent,
    ]);

    expect(result.map(task => task.id)).toEqual([
      'later-time-low',
      'earlier-time-urgent',
      'same-time-high',
      'no-time-urgent',
    ]);
  });
});
