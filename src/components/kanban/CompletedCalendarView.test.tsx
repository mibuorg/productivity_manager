import { render, screen, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { CompletedCalendarView } from './CompletedCalendarView';
import { Task } from '@/types/kanban';

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

describe('CompletedCalendarView', () => {
  it('renders 7 date columns even when no completed tasks exist', () => {
    render(
      <CompletedCalendarView
        tasks={[]}
        customFields={[]}
        activeTimersByTaskId={{}}
        onTaskClick={vi.fn()}
        onEditTask={vi.fn()}
        onDeleteTask={vi.fn()}
        onMoveTask={vi.fn()}
        now={new Date(2026, 1, 18, 12, 0, 0)}
      />
    );

    const columns = screen.getAllByTestId(/^completed-calendar-day-/);
    expect(columns).toHaveLength(7);
    expect(screen.getAllByText('No completed tasks')).toHaveLength(7);
  });

  it('renders completed tasks in their updated_at day column only', () => {
    const completedToday: Task = {
      ...baseTask,
      id: 'completed-today',
      title: 'Completed today',
      status: 'completed',
      updated_at: new Date(2026, 1, 18, 16, 0, 0).toISOString(),
    };

    const completedYesterday: Task = {
      ...baseTask,
      id: 'completed-yesterday',
      title: 'Completed yesterday',
      status: 'completed',
      updated_at: new Date(2026, 1, 17, 11, 0, 0).toISOString(),
    };

    const notCompleted: Task = {
      ...baseTask,
      id: 'todo-task',
      title: 'Todo task should be hidden',
      status: 'todo',
      updated_at: new Date(2026, 1, 18, 10, 0, 0).toISOString(),
    };

    render(
      <CompletedCalendarView
        tasks={[completedToday, completedYesterday, notCompleted]}
        customFields={[]}
        activeTimersByTaskId={{}}
        onTaskClick={vi.fn()}
        onEditTask={vi.fn()}
        onDeleteTask={vi.fn()}
        onMoveTask={vi.fn()}
        now={new Date(2026, 1, 18, 12, 0, 0)}
      />
    );

    const todayColumn = screen.getByTestId('completed-calendar-day-2026-02-18');
    const yesterdayColumn = screen.getByTestId('completed-calendar-day-2026-02-17');

    expect(within(todayColumn).getByText('Completed today')).toBeInTheDocument();
    expect(within(yesterdayColumn).getByText('Completed yesterday')).toBeInTheDocument();
    expect(screen.queryByText('Todo task should be hidden')).not.toBeInTheDocument();
  });
});
