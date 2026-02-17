import { renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useKanban } from './useKanban';

const { fromMock } = vi.hoisted(() => ({
  fromMock: vi.fn(),
}));

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: fromMock,
  },
}));

describe('useKanban', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    fromMock.mockImplementation((table: string) => {
      if (table === 'boards') {
        return {
          select: () => ({
            order: () => ({
              limit: () => ({
                single: async () => ({
                  data: {
                    id: 'board-1',
                    name: 'Main Board',
                    created_at: '2026-02-17T00:00:00.000Z',
                    updated_at: '2026-02-17T00:00:00.000Z',
                  },
                  error: null,
                }),
              }),
            }),
          }),
        };
      }

      if (table === 'tasks') {
        return {
          select: () => ({
            eq: () => ({
              order: async () => ({
                data: [
                  {
                    id: 'task-1',
                    board_id: 'board-1',
                    title: 'Task from db',
                    description: '',
                    status: 'todo',
                    priority: 'medium',
                    due_date: null,
                    tags: [],
                    assignee: '',
                    position: 0,
                    custom_field_values: {},
                    created_at: '2026-02-17T00:00:00.000Z',
                    updated_at: '2026-02-17T00:00:00.000Z',
                  },
                ],
                error: null,
              }),
            }),
          }),
        };
      }

      if (table === 'custom_field_definitions') {
        return {
          select: () => ({
            eq: () => ({
              order: async () => ({
                data: [],
                error: null,
              }),
            }),
          }),
        };
      }

      return {};
    });
  });

  it('loads board/tasks/custom fields from supabase on mount', async () => {
    const { result } = renderHook(() => useKanban());

    await waitFor(() => {
      expect(fromMock).toHaveBeenCalledWith('boards');
    });

    const current = result.current as unknown as {
      board?: { id: string };
      tasks?: unknown[];
      customFields?: unknown[];
    };

    expect(current.board?.id).toBe('board-1');
    expect(current.tasks).toHaveLength(1);
    expect(current.customFields).toEqual([]);
    expect(fromMock).toHaveBeenCalledWith('tasks');
    expect(fromMock).toHaveBeenCalledWith('custom_field_definitions');
  });
});
