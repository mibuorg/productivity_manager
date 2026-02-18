import { describe, expect, it } from 'vitest';
import { Task } from '@/types/kanban';
import { buildDayKeys, getCompletedTasksForDay, groupCompletedTasksByDay } from './completedCalendar';

const baseTask: Task = {
  id: 'task-1',
  board_id: 'board-1',
  title: 'Task',
  description: '',
  status: 'completed',
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

describe('completedCalendar utilities', () => {
  it('builds exactly 7 day keys including today', () => {
    const keys = buildDayKeys(new Date(2026, 1, 18, 12, 0, 0), 7);

    expect(keys).toHaveLength(7);
    expect(keys[0]).toBe('2026-02-18');
    expect(keys[6]).toBe('2026-02-12');
  });

  it('groups only completed tasks by completion day key and sorts descending', () => {
    const dayKeys = buildDayKeys(new Date(2026, 1, 18, 12, 0, 0), 7);

    const completedTodayOlder: Task = {
      ...baseTask,
      id: 'completed-today-older',
      title: 'Completed today older',
      status: 'completed',
      updated_at: new Date(2026, 1, 18, 10, 0, 0).toISOString(),
    };

    const completedTodayNewer: Task = {
      ...baseTask,
      id: 'completed-today-newer',
      title: 'Completed today newer',
      status: 'completed',
      updated_at: new Date(2026, 1, 18, 16, 0, 0).toISOString(),
    };

    const completedYesterday: Task = {
      ...baseTask,
      id: 'completed-yesterday',
      title: 'Completed yesterday',
      status: 'completed',
      updated_at: new Date(2026, 1, 17, 14, 0, 0).toISOString(),
    };

    const notCompleted: Task = {
      ...baseTask,
      id: 'todo-task',
      title: 'Todo task',
      status: 'todo',
      updated_at: new Date(2026, 1, 18, 9, 0, 0).toISOString(),
    };

    const invalidUpdatedAt: Task = {
      ...baseTask,
      id: 'invalid-updated-at',
      title: 'Invalid updated_at',
      status: 'completed',
      updated_at: 'not-a-date',
    };

    const grouped = groupCompletedTasksByDay(
      [completedTodayOlder, completedTodayNewer, completedYesterday, notCompleted, invalidUpdatedAt],
      dayKeys
    );

    expect(grouped['2026-02-18'].map(task => task.id)).toEqual([
      'completed-today-newer',
      'completed-today-older',
    ]);
    expect(grouped['2026-02-17'].map(task => task.id)).toEqual(['completed-yesterday']);
    expect(grouped['2026-02-16']).toEqual([]);
  });

  it('uses stored completion timestamp when present instead of updated_at', () => {
    const dayKeys = buildDayKeys(new Date(2026, 1, 18, 12, 0, 0), 7);
    const completedYesterdayEditedToday: Task = {
      ...baseTask,
      id: 'completed-yesterday-edited-today',
      status: 'completed',
      custom_field_values: {
        __completed_at: new Date(2026, 1, 17, 9, 0, 0).toISOString(),
      },
      updated_at: new Date(2026, 1, 18, 10, 0, 0).toISOString(),
    };

    const grouped = groupCompletedTasksByDay([completedYesterdayEditedToday], dayKeys);

    expect(grouped['2026-02-17'].map(task => task.id)).toEqual(['completed-yesterday-edited-today']);
    expect(grouped['2026-02-18']).toEqual([]);
  });

  it('sorts within a completion day by completion timestamp, not updated_at', () => {
    const dayKeys = buildDayKeys(new Date(2026, 1, 18, 12, 0, 0), 7);
    const completedLaterButEditedEarlier: Task = {
      ...baseTask,
      id: 'completed-later-edited-earlier',
      custom_field_values: {
        __completed_at: new Date(2026, 1, 17, 20, 0, 0).toISOString(),
      },
      updated_at: new Date(2026, 1, 17, 21, 0, 0).toISOString(),
    };
    const completedEarlierButEditedLater: Task = {
      ...baseTask,
      id: 'completed-earlier-edited-later',
      custom_field_values: {
        __completed_at: new Date(2026, 1, 17, 9, 0, 0).toISOString(),
      },
      updated_at: new Date(2026, 1, 18, 8, 0, 0).toISOString(),
    };

    const grouped = groupCompletedTasksByDay(
      [completedEarlierButEditedLater, completedLaterButEditedEarlier],
      dayKeys
    );

    expect(grouped['2026-02-17'].map(task => task.id)).toEqual([
      'completed-later-edited-earlier',
      'completed-earlier-edited-later',
    ]);
  });

  it('returns completed tasks for the day sorted by priority, then created_at descending', () => {
    const completedUrgentOlder: Task = {
      ...baseTask,
      id: 'completed-urgent-older',
      priority: 'urgent',
      created_at: new Date(2026, 1, 18, 9, 0, 0).toISOString(),
      updated_at: new Date(2026, 1, 18, 16, 0, 0).toISOString(),
      position: 5,
    };

    const completedUrgentNewer: Task = {
      ...baseTask,
      id: 'completed-urgent-newer',
      priority: 'urgent',
      created_at: new Date(2026, 1, 18, 10, 0, 0).toISOString(),
      updated_at: new Date(2026, 1, 18, 12, 0, 0).toISOString(),
      position: 0,
    };

    const completedHigh: Task = {
      ...baseTask,
      id: 'completed-high',
      priority: 'high',
      created_at: new Date(2026, 1, 18, 11, 0, 0).toISOString(),
      updated_at: new Date(2026, 1, 18, 11, 30, 0).toISOString(),
      position: 1,
    };

    const completedYesterday: Task = {
      ...baseTask,
      id: 'completed-yesterday',
      priority: 'urgent',
      created_at: new Date(2026, 1, 17, 12, 0, 0).toISOString(),
      updated_at: new Date(2026, 1, 17, 12, 0, 0).toISOString(),
      position: 2,
    };

    const result = getCompletedTasksForDay(
      [completedUrgentOlder, completedHigh, completedYesterday, completedUrgentNewer],
      '2026-02-18'
    );

    expect(result.map(task => task.id)).toEqual([
      'completed-urgent-newer',
      'completed-urgent-older',
      'completed-high',
    ]);
  });
});
