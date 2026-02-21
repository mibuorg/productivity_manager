import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { Task } from '@/types/kanban';
import { KanbanBoard } from './KanbanBoard';

const tasks: Task[] = [
  {
    id: 'todo-time',
    board_id: 'board-1',
    title: 'Prepare calendar notes',
    description: 'draft docs',
    status: 'todo',
    priority: 'high',
    due_date: null,
    scheduled_time: '16:30',
    estimated_minutes: 60,
    tags: ['Ops'],
    assignee: '',
    position: 0,
    custom_field_values: {},
    pomodoros_completed: 0,
    created_at: '2026-02-20T10:00:00.000Z',
    updated_at: '2026-02-20T10:00:00.000Z',
  },
  {
    id: 'todo-docs',
    board_id: 'board-1',
    title: 'Write docs',
    description: 'search indexing',
    status: 'todo',
    priority: 'medium',
    due_date: null,
    scheduled_time: '09:00',
    estimated_minutes: 20,
    tags: ['Docs', 'Ops'],
    assignee: '',
    position: 1,
    custom_field_values: {},
    pomodoros_completed: 0,
    created_at: '2026-02-20T11:00:00.000Z',
    updated_at: '2026-02-20T11:00:00.000Z',
  },
  {
    id: 'in-progress',
    board_id: 'board-1',
    title: 'Build feature',
    description: '',
    status: 'in_progress',
    priority: 'urgent',
    due_date: null,
    scheduled_time: null,
    estimated_minutes: null,
    tags: ['Engineering'],
    assignee: '',
    position: 0,
    custom_field_values: {},
    pomodoros_completed: 0,
    created_at: '2026-02-20T09:00:00.000Z',
    updated_at: '2026-02-20T09:00:00.000Z',
  },
];

vi.mock('@/hooks/useKanban', () => ({
  useKanban: () => ({
    board: { id: 'board-1', name: 'Tasks to Complete', created_at: '', updated_at: '' },
    tasks,
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
  KanbanColumn: ({ column, tasks, taskGroups }: { column: { id: string; title: string }; tasks: Task[]; taskGroups?: Array<{ id: string; label: string; tasks: Task[] }> }) => (
    <div data-testid={`column-${column.id}`}>
      <div data-testid={`column-${column.id}-tasks`}>{tasks.map(task => task.id).join(',')}</div>
      {taskGroups?.map(group => (
        <div key={group.id} data-testid={`group-${column.id}-${group.id}`}>
          {group.label}:{group.tasks.map(task => task.id).join(',')}
        </div>
      ))}
    </div>
  ),
}));

vi.mock('./CompletedCalendarView', () => ({
  CompletedCalendarView: () => <div data-testid="completed-calendar-view">calendar</div>,
}));

vi.mock('./TaskModal', () => ({ TaskModal: () => null }));
vi.mock('./AiChatPanel', () => ({ AiChatPanel: () => null }));
vi.mock('./TaskPomodoroOverlay', () => ({ TaskPomodoroOverlay: () => null }));

describe('KanbanBoard organize/search', () => {
  it('filters tasks live from the search input', () => {
    render(<KanbanBoard />);

    expect(screen.getByPlaceholderText('Search tasks...')).toBeInTheDocument();

    fireEvent.change(screen.getByPlaceholderText('Search tasks...'), { target: { value: 'indexing' } });

    expect(screen.getByTestId('column-todo-tasks')).toHaveTextContent('todo-docs');
    expect(screen.getByTestId('column-todo-tasks')).not.toHaveTextContent('todo-time');
  });

  it('renders the organize control in board view', () => {
    render(<KanbanBoard />);
    expect(screen.getByRole('button', { name: 'Organize' })).toBeInTheDocument();
  });
});
