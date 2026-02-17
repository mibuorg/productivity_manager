import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { TaskCard } from './TaskCard';
import { Task } from '@/types/kanban';

const baseTask: Task = {
  id: 'task-1',
  board_id: 'board-1',
  title: 'Write API docs',
  description: 'Draft endpoint docs',
  status: 'todo',
  priority: 'high',
  due_date: null,
  tags: ['docs'],
  assignee: 'alex@example.com',
  position: 0,
  custom_field_values: {},
  pomodoros_completed: 0,
  created_at: '2026-02-17T00:00:00.000Z',
  updated_at: '2026-02-17T00:00:00.000Z',
};

describe('TaskCard', () => {
  it('shows the task time estimate badge when estimated minutes are set', () => {
    render(
      <TaskCard
        task={{ ...baseTask, estimated_minutes: 45 }}
        customFields={[]}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
        onMove={vi.fn()}
      />
    );

    expect(screen.getByText('High')).toBeInTheDocument();
    expect(screen.getByText('45 min')).toBeInTheDocument();
  });

  it('does not show a task time estimate badge when estimated minutes are missing', () => {
    render(
      <TaskCard
        task={baseTask}
        customFields={[]}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
        onMove={vi.fn()}
      />
    );

    expect(screen.queryByText('45 min')).not.toBeInTheDocument();
  });

  it('does not apply faded or tilted styling while dragging', () => {
    const { container } = render(
      <TaskCard
        task={baseTask}
        customFields={[]}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
        onMove={vi.fn()}
        isDragging
      />
    );

    const card = container.querySelector('.glass-card');
    expect(card).not.toHaveClass('opacity-50');
    expect(card).not.toHaveClass('scale-95');
    expect(card).not.toHaveClass('rotate-1');
  });

  it('provides a next-column touch control for todo tasks', () => {
    const onMove = vi.fn();

    render(
      <TaskCard
        task={baseTask}
        customFields={[]}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
        onMove={onMove}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: 'Move to next column' }));
    expect(onMove).toHaveBeenCalledWith(baseTask.id, 'in_progress');
    expect(screen.queryByRole('button', { name: 'Move to previous column' })).not.toBeInTheDocument();
  });

  it('provides previous and next touch controls for in-progress tasks', () => {
    const onMove = vi.fn();
    const inProgressTask = { ...baseTask, status: 'in_progress' as const };

    render(
      <TaskCard
        task={inProgressTask}
        customFields={[]}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
        onMove={onMove}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: 'Move to previous column' }));
    fireEvent.click(screen.getByRole('button', { name: 'Move to next column' }));

    expect(onMove).toHaveBeenNthCalledWith(1, inProgressTask.id, 'todo');
    expect(onMove).toHaveBeenNthCalledWith(2, inProgressTask.id, 'completed');
  });
});
