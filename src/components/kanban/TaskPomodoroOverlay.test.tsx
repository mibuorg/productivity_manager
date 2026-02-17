import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { TaskPomodoroOverlay } from './TaskPomodoroOverlay';
import { Task } from '@/types/kanban';

const task: Task = {
  id: 'task-1',
  board_id: 'board-1',
  title: 'Deep work session',
  description: 'Initial description',
  status: 'todo',
  priority: 'medium',
  due_date: null,
  estimated_minutes: 1,
  tags: [],
  assignee: '',
  position: 0,
  custom_field_values: {},
  pomodoros_completed: 0,
  created_at: '2026-02-17T00:00:00.000Z',
  updated_at: '2026-02-17T00:00:00.000Z',
};

describe('TaskPomodoroOverlay', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('calls onStart when timer is started', async () => {
    const onStart = vi.fn();

    render(
      <TaskPomodoroOverlay
        open
        task={task}
        onClose={vi.fn()}
        onStart={onStart}
        onAppendNote={vi.fn()}
        onCompleteDecision={vi.fn()}
      />
    );

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Start' }));
    });
    expect(onStart).toHaveBeenCalledWith(task.id);
  });

  it('calls onAppendNote with typed text', async () => {
    const onAppendNote = vi.fn();

    render(
      <TaskPomodoroOverlay
        open
        task={task}
        onClose={vi.fn()}
        onStart={vi.fn()}
        onAppendNote={onAppendNote}
        onCompleteDecision={vi.fn()}
      />
    );

    fireEvent.change(screen.getByPlaceholderText('Add a note to this task...'), {
      target: { value: 'Investigate timeout edge case' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Add Note' }));

    expect(onAppendNote).toHaveBeenCalledWith(task.id, 'Investigate timeout edge case');
  });

  it('opens completion prompt when timer elapses and handles completed decision', async () => {
    const onCompleteDecision = vi.fn();

    render(
      <TaskPomodoroOverlay
        open
        task={task}
        onClose={vi.fn()}
        onStart={vi.fn()}
        onAppendNote={vi.fn()}
        onCompleteDecision={onCompleteDecision}
      />
    );

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Start' }));
    });

    act(() => {
      vi.advanceTimersByTime(60_000);
    });

    await act(async () => {
      vi.runOnlyPendingTimers();
    });
    expect(screen.getByText('Did you complete this task?')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Completed' }));

    expect(onCompleteDecision).toHaveBeenCalledWith(task.id, true);
  });

  it('shows h:mm:ss when estimated time exceeds 60 minutes', () => {
    render(
      <TaskPomodoroOverlay
        open
        task={{ ...task, estimated_minutes: 61 }}
        onClose={vi.fn()}
        onStart={vi.fn()}
        onAppendNote={vi.fn()}
        onCompleteDecision={vi.fn()}
      />
    );

    expect(screen.getByText('1:01:00')).toBeInTheDocument();
  });

  it('keeps mm:ss format when estimated time is exactly 60 minutes', () => {
    render(
      <TaskPomodoroOverlay
        open
        task={{ ...task, estimated_minutes: 60 }}
        onClose={vi.fn()}
        onStart={vi.fn()}
        onAppendNote={vi.fn()}
        onCompleteDecision={vi.fn()}
      />
    );

    expect(screen.getByText('60:00')).toBeInTheDocument();
  });

  it('does not pad single-digit hours with a leading zero', () => {
    render(
      <TaskPomodoroOverlay
        open
        task={{ ...task, estimated_minutes: 120 }}
        onClose={vi.fn()}
        onStart={vi.fn()}
        onAppendNote={vi.fn()}
        onCompleteDecision={vi.fn()}
      />
    );

    expect(screen.getByText('2:00:00')).toBeInTheDocument();
    expect(screen.queryByText('02:00:00')).not.toBeInTheDocument();
  });
});
