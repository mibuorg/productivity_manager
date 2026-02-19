import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { TaskModal } from './TaskModal';
import { Task } from '@/types/kanban';

const existingTask: Task = {
  id: '1',
  board_id: 'local',
  title: 'Existing Task',
  description: '',
  status: 'todo',
  priority: 'medium',
  due_date: null,
  estimated_minutes: 30,
  tags: ['docs'],
  assignee: '',
  position: 0,
  custom_field_values: {},
  pomodoros_completed: 0,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

describe('TaskModal', () => {
  it('saves assigned time and duration when creating a task', () => {
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
    fireEvent.change(screen.getByLabelText('Time'), {
      target: { value: '16:45' },
    });
    fireEvent.change(screen.getByLabelText('Duration (minutes)'), {
      target: { value: '45' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Create Task' }));

    expect(onSave).toHaveBeenCalledTimes(1);
    expect(onSave).toHaveBeenCalledWith(
      expect.objectContaining({
        scheduled_time: '16:45',
        estimated_minutes: 45,
      })
    );
  });

  it('does not render quick preset time chips', () => {
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

    expect(screen.queryByRole('button', { name: '9:00 AM' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: '1:00 PM' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: '6:00 PM' })).not.toBeInTheDocument();
  });

  it('accepts typed time input without segmented hour/minute/am-pm controls', () => {
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
      target: { value: 'Typed time task' },
    });
    fireEvent.change(screen.getByLabelText('Time'), {
      target: { value: '9:30 pm' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Create Task' }));

    expect(onSave).toHaveBeenCalledWith(
      expect.objectContaining({
        scheduled_time: '21:30',
      })
    );
  });

  it('prefills and clears duration when editing a task', () => {
    const onSave = vi.fn();
    const onClose = vi.fn();

    render(
      <TaskModal
        open
        onClose={onClose}
        onSave={onSave}
        task={existingTask}
        defaultStatus="todo"
        customFields={[]}
      />
    );

    const durationInput = screen.getByLabelText('Duration (minutes)');
    expect(durationInput).toHaveValue(30);
    expect(screen.getByLabelText('Time')).toHaveValue('');

    fireEvent.change(durationInput, { target: { value: '' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save Changes' }));

    expect(onSave).toHaveBeenCalledTimes(1);
    expect(onSave).toHaveBeenCalledWith(
      expect.objectContaining({
        estimated_minutes: null,
      })
    );
  });

  it('does not render assignee input in the modal', () => {
    const onSave = vi.fn();
    const onClose = vi.fn();

    render(
      <TaskModal
        open
        onClose={onClose}
        onSave={onSave}
        task={{ ...existingTask, assignee: 'Alex' }}
        defaultStatus="todo"
        customFields={[]}
      />
    );

    expect(screen.queryByPlaceholderText('Name or email')).not.toBeInTheDocument();
  });

  it('clears the tag input when switching from editing to a new task', () => {
    const onSave = vi.fn();
    const onClose = vi.fn();

    const { rerender } = render(
      <TaskModal
        open
        onClose={onClose}
        onSave={onSave}
        task={existingTask}
        defaultStatus="todo"
        customFields={[]}
      />
    );

    const tagInput = screen.getByPlaceholderText('Add a tag...');
    fireEvent.change(tagInput, { target: { value: 'carryover' } });
    expect(tagInput).toHaveValue('carryover');

    rerender(
      <TaskModal
        open
        onClose={onClose}
        onSave={onSave}
        task={null}
        defaultStatus="todo"
        customFields={[]}
      />
    );

    expect(screen.getByPlaceholderText('Add a tag...')).toHaveValue('');
  });

  it('saves a typed tag on create even when add is not clicked', () => {
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
      target: { value: 'Tagged task' },
    });
    fireEvent.change(screen.getByPlaceholderText('Add a tag...'), {
      target: { value: 'docs' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Create Task' }));

    expect(onSave).toHaveBeenCalledTimes(1);
    expect(onSave).toHaveBeenCalledWith(
      expect.objectContaining({
        tags: ['docs'],
      })
    );
  });
});
