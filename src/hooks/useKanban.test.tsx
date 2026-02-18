import { renderHook, waitFor } from '@testing-library/react';
import { act } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useKanban } from './useKanban';
import type { Task } from '@/types/kanban';

type LocalStateResponse = {
  board: {
    id: string;
    name: string;
    created_at: string;
    updated_at: string;
  };
  tasks: Task[];
  customFields: Array<{
    id: string;
    board_id: string;
    name: string;
    field_type: 'text' | 'number' | 'dropdown';
    options: string[];
    position: number;
    created_at: string;
  }>;
};

describe('useKanban', () => {
  const fetchMock = vi.fn();

  const initialState: LocalStateResponse = {
    board: {
      id: 'board-1',
      name: 'Tasks to Complete',
      created_at: '2026-02-17T00:00:00.000Z',
      updated_at: '2026-02-17T00:00:00.000Z',
    },
    tasks: [
      {
        id: 'task-1',
        board_id: 'board-1',
        title: 'Task from local api',
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
      },
    ],
    customFields: [],
  };

  beforeEach(() => {
    fetchMock.mockReset();
    vi.stubGlobal('fetch', fetchMock);

    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => initialState,
    });
  });

  it('loads board/tasks/custom fields from local API on mount', async () => {
    const { result } = renderHook(() => useKanban());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.board?.id).toBe('board-1');
    expect(result.current.tasks).toHaveLength(1);
    expect(result.current.customFields).toEqual([]);
    expect(fetchMock).toHaveBeenCalledWith('/api/local-state', expect.any(Object));
  });

  it('persists state to local API when creating a task', async () => {
    const { result } = renderHook(() => useKanban());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    await act(async () => {
      await result.current.createTask({
        title: 'New local task',
        description: 'no cloud',
        status: 'todo',
      });
    });

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledTimes(2);
    });

    const putCall = fetchMock.mock.calls[1];
    expect(putCall[0]).toBe('/api/local-state');
    expect((putCall[1] as RequestInit).method).toBe('PUT');

    const body = JSON.parse((putCall[1] as RequestInit).body as string) as LocalStateResponse;
    expect(body.tasks.some(task => task.title === 'New local task')).toBe(true);
  });

  it('normalizes legacy string tags into arrays when loading tasks', async () => {
    const legacyTask = {
      ...initialState.tasks[0],
      tags: 'docs',
    } as unknown as Task;

    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        ...initialState,
        tasks: [legacyTask],
      }),
    });

    const { result } = renderHook(() => useKanban());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.tasks[0]?.tags).toEqual(['docs']);
  });

  it('normalizes missing created_at on legacy tasks using updated_at', async () => {
    const legacyTask = {
      ...initialState.tasks[0],
      created_at: undefined,
      updated_at: '2026-02-16T08:30:00.000Z',
    } as unknown as Task;

    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        ...initialState,
        tasks: [legacyTask],
      }),
    });

    const { result } = renderHook(() => useKanban());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.tasks[0]?.created_at).toBe('2026-02-16T08:30:00.000Z');
  });

  it('preserves completion day metadata when editing an already completed task', async () => {
    const completedState: LocalStateResponse = {
      ...initialState,
      tasks: [
        {
          id: 'completed-1',
          board_id: 'board-1',
          title: 'Completed task',
          description: '',
          status: 'completed',
          priority: 'medium',
          due_date: null,
          tags: ['old'],
          assignee: '',
          position: 0,
          custom_field_values: {},
          pomodoros_completed: 0,
          created_at: '2026-02-15T00:00:00.000Z',
          updated_at: '2026-02-16T09:00:00.000Z',
        },
      ],
    };

    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => completedState,
    });

    const { result } = renderHook(() => useKanban());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    await act(async () => {
      await result.current.updateTask('completed-1', { tags: ['updated-tag'] });
    });

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledTimes(2);
    });

    const putCall = fetchMock.mock.calls[1];
    const body = JSON.parse((putCall[1] as RequestInit).body as string) as LocalStateResponse;
    const persistedTask = body.tasks.find(task => task.id === 'completed-1');

    expect(persistedTask?.status).toBe('completed');
    expect((persistedTask?.custom_field_values as Record<string, string>)?.__completed_at).toBe(
      '2026-02-16T09:00:00.000Z'
    );
  });

  it('reindexes destination column positions by priority and created_at when moving a task', async () => {
    const moveState: LocalStateResponse = {
      ...initialState,
      tasks: [
        {
          id: 'todo-urgent',
          board_id: 'board-1',
          title: 'Urgent todo',
          description: '',
          status: 'todo',
          priority: 'urgent',
          due_date: null,
          tags: [],
          assignee: '',
          position: 0,
          custom_field_values: {},
          pomodoros_completed: 0,
          created_at: '2026-02-18T12:00:00.000Z',
          updated_at: '2026-02-18T12:00:00.000Z',
        },
        {
          id: 'inprogress-high-newer',
          board_id: 'board-1',
          title: 'High newer',
          description: '',
          status: 'in_progress',
          priority: 'high',
          due_date: null,
          tags: [],
          assignee: '',
          position: 0,
          custom_field_values: {},
          pomodoros_completed: 0,
          created_at: '2026-02-18T11:00:00.000Z',
          updated_at: '2026-02-18T11:00:00.000Z',
        },
        {
          id: 'inprogress-high-older',
          board_id: 'board-1',
          title: 'High older',
          description: '',
          status: 'in_progress',
          priority: 'high',
          due_date: null,
          tags: [],
          assignee: '',
          position: 1,
          custom_field_values: {},
          pomodoros_completed: 0,
          created_at: '2026-02-18T09:00:00.000Z',
          updated_at: '2026-02-18T09:00:00.000Z',
        },
        {
          id: 'inprogress-medium',
          board_id: 'board-1',
          title: 'Medium',
          description: '',
          status: 'in_progress',
          priority: 'medium',
          due_date: null,
          tags: [],
          assignee: '',
          position: 2,
          custom_field_values: {},
          pomodoros_completed: 0,
          created_at: '2026-02-18T13:00:00.000Z',
          updated_at: '2026-02-18T13:00:00.000Z',
        },
      ],
    };

    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => moveState,
    });

    const { result } = renderHook(() => useKanban());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    await act(async () => {
      await result.current.moveTask('todo-urgent', 'in_progress');
    });

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledTimes(2);
    });

    const putCall = fetchMock.mock.calls[1];
    const body = JSON.parse((putCall[1] as RequestInit).body as string) as LocalStateResponse;
    const inProgressByPosition = body.tasks
      .filter(task => task.status === 'in_progress')
      .sort((a, b) => a.position - b.position)
      .map(task => task.id);

    expect(inProgressByPosition).toEqual([
      'todo-urgent',
      'inprogress-high-newer',
      'inprogress-high-older',
      'inprogress-medium',
    ]);
  });
});
