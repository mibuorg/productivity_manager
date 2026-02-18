import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { KanbanColumn } from './KanbanColumn';
import { Column, Task } from '@/types/kanban';

const todoColumn: Column = {
  id: 'todo',
  title: 'To Do',
  color: 'hsl(220, 70%, 58%)',
  glowColor: 'hsl(220 70% 58% / 0.2)',
};

const sampleTask: Task = {
  id: 'task-1',
  board_id: 'board-1',
  title: 'Sample task',
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

describe('KanbanColumn', () => {
  beforeEach(() => {
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: vi.fn().mockImplementation(() => ({
        matches: false,
        media: '',
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
    });
  });

  it('clears drop indicator when drag ends globally without a drop', () => {
    const { container } = render(
      <KanbanColumn
        column={todoColumn}
        tasks={[sampleTask]}
        activeTimersByTaskId={{}}
        customFields={[]}
        onAddTask={vi.fn()}
        onTaskClick={vi.fn()}
        onEditTask={vi.fn()}
        onDeleteTask={vi.fn()}
        onMoveTask={vi.fn()}
        onDrop={vi.fn()}
      />
    );

    const dropZone = container.querySelector('.flex-1.rounded-xl') as HTMLElement;
    expect(dropZone).toBeTruthy();

    fireEvent.dragEnter(dropZone);
    expect(screen.getByText('Drop here')).toBeInTheDocument();

    fireEvent.dragEnd(window);
    expect(screen.queryByText('Drop here')).not.toBeInTheDocument();
  });
});
