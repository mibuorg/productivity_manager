import { describe, expect, it } from 'vitest';
import { Task } from '@/types/kanban';
import { buildDayKeys, groupCompletedTasksByDay } from './completedCalendar';

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

  it('groups only completed tasks by updated_at day key and sorts descending', () => {
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
});
