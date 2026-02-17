import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { TaskModal } from './TaskModal';
import { Task } from '@/types/kanban';

describe('TaskModal', () => {
  it('saves estimated time in minutes when creating a task', () => {
    const onSave = vi.fn();
    const onClose = vi.fn();

    render(
      <TaskModal
        open
        onClose={onClose}
        onSave={onSave}
        task={null}
        defaultStatus="todo"
        customFields={[]}
      />
    );

    fireEvent.change(screen.getByPlaceholderText('What needs to be done?'), {
      target: { value: 'Write docs' },
    });
    fireEvent.change(screen.getByLabelText('Time (minutes)'), {
      target: { value: '45' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Create Task' }));

    expect(onSave).toHaveBeenCalledTimes(1);
    expect(onSave).toHaveBeenCalledWith(
      expect.objectContaining({
        estimated_minutes: 45,
      })
    );
  });

  it('prefills and clears estimated time when editing a task', () => {
    const onSave = vi.fn();
    const onClose = vi.fn();
    const task: Task = {
      id: '1',
      board_id: 'local',
      title: 'Existing Task',
      description: '',
      status: 'todo',
      priority: 'medium',
      due_date: null,
      estimated_minutes: 30,
      tags: [],
      assignee: '',
      position: 0,
      custom_field_values: {},
      pomodoros_completed: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    render(
      <TaskModal
        open
        onClose={onClose}
        onSave={onSave}
        task={task}
        defaultStatus="todo"
        customFields={[]}
      />
    );

    const timeInput = screen.getByLabelText('Time (minutes)');
    expect(timeInput).toHaveValue(30);

    fireEvent.change(timeInput, { target: { value: '' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save Changes' }));

    expect(onSave).toHaveBeenCalledTimes(1);
    expect(onSave).toHaveBeenCalledWith(
      expect.objectContaining({
        estimated_minutes: null,
      })
    );
  });
});
