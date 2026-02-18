import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { KanbanBoard } from './KanbanBoard';
import { Task } from '@/types/kanban';

vi.mock('@/hooks/useKanban', () => ({
  useKanban: () => ({
    board: { id: 'board-1', name: 'Tasks to Complete', created_at: '', updated_at: '' },
    tasks: [
      {
        id: 'task-1',
        board_id: 'board-1',
        title: 'Completed task',
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
        updated_at: '2026-02-18T00:00:00.000Z',
      } as Task,
    ],
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
  KanbanColumn: ({ column }: { column: { title: string } }) => (
    <div data-testid="board-column">{column.title}</div>
  ),
}));

vi.mock('./CompletedCalendarView', () => ({
  CompletedCalendarView: () => <div data-testid="completed-calendar-view">Calendar View</div>,
}));

vi.mock('./TaskModal', () => ({
  TaskModal: () => null,
}));

vi.mock('./CustomFieldsModal', () => ({
  CustomFieldsModal: () => null,
}));

vi.mock('./AiChatPanel', () => ({
  AiChatPanel: () => null,
}));

vi.mock('./TaskPomodoroOverlay', () => ({
  TaskPomodoroOverlay: () => null,
}));

describe('KanbanBoard calendar toggle', () => {
  it('shows board view by default and switches to completed calendar view', () => {
    render(<KanbanBoard />);

    expect(screen.getAllByTestId('board-column')).toHaveLength(3);
    expect(screen.queryByTestId('completed-calendar-view')).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Completed Calendar' }));

    expect(screen.getByTestId('completed-calendar-view')).toBeInTheDocument();
    expect(screen.queryAllByTestId('board-column')).toHaveLength(0);

    fireEvent.click(screen.getByRole('button', { name: 'Board' }));

    expect(screen.getAllByTestId('board-column')).toHaveLength(3);
    expect(screen.queryByTestId('completed-calendar-view')).not.toBeInTheDocument();
  });
});
