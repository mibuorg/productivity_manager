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
});
