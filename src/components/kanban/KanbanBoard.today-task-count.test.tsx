import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { Task } from '@/types/kanban';
import { KanbanBoard } from './KanbanBoard';

const now = new Date();
const todayCreatedAt = now.toISOString();
const yesterdayCreatedAt = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();

const mockedTasks: Task[] = [
  {
    id: 'task-old',
    board_id: 'board-1',
    title: 'Old task',
    description: '',
    status: 'todo',
    priority: 'medium',
    due_date: null,
    tags: [],
    assignee: '',
    position: 0,
    custom_field_values: {},
    pomodoros_completed: 0,
    created_at: yesterdayCreatedAt,
    updated_at: yesterdayCreatedAt,
  } as Task,
  {
    id: 'task-old-2',
    board_id: 'board-1',
    title: 'Second old task',
    description: '',
    status: 'todo',
    priority: 'low',
    due_date: null,
    tags: [],
    assignee: '',
    position: 2,
    custom_field_values: {},
    pomodoros_completed: 0,
    created_at: yesterdayCreatedAt,
    updated_at: yesterdayCreatedAt,
  } as Task,
  {
    id: 'task-today',
    board_id: 'board-1',
    title: 'Today task',
    description: '',
    status: 'in_progress',
    priority: 'high',
    due_date: null,
    tags: [],
    assignee: '',
    position: 1,
    custom_field_values: {},
    pomodoros_completed: 0,
    created_at: todayCreatedAt,
    updated_at: todayCreatedAt,
  } as Task,
];

vi.mock('@/hooks/useKanban', () => ({
  useKanban: () => ({
    board: { id: 'board-1', name: 'Tasks to Complete', created_at: '', updated_at: '' },
    tasks: mockedTasks,
    customFields: [],
    loading: false,
    createTask: vi.fn(),
    updateTask: vi.fn(),
    deleteTask: vi.fn(),
    moveTask: vi.fn(),
    createCustomField: vi.fn(),
    deleteCustomField: vi.fn(),
  }),
}));

vi.mock('./KanbanColumn', () => ({
  KanbanColumn: () => <div data-testid="board-column" />,
}));

vi.mock('./CompletedCalendarView', () => ({
  CompletedCalendarView: () => <div data-testid="completed-calendar-view" />,
}));

vi.mock('./TaskModal', () => ({
  TaskModal: () => null,
}));

vi.mock('./AiChatPanel', () => ({
  AiChatPanel: () => null,
}));

vi.mock('./TaskPomodoroOverlay', () => ({
  TaskPomodoroOverlay: () => null,
}));

describe('KanbanBoard header task count', () => {
  it('shows the exact number of tasks in the To Do list', () => {
    render(<KanbanBoard />);

    expect(screen.getByText('2 tasks · 0 completed')).toBeInTheDocument();
  });
});
