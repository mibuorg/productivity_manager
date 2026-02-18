import { renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useKanban } from './useKanban';

const { fromMock, useAuthMock } = vi.hoisted(() => ({
  fromMock: vi.fn(),
  useAuthMock: vi.fn(),
}));

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: fromMock,
  },
}));

vi.mock('@/hooks/useAuth', () => ({
  useAuth: useAuthMock,
}));

describe('useKanban', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    useAuthMock.mockReturnValue({
      user: { id: 'user-1' },
    });

    fromMock.mockImplementation((table: string) => {
      if (table === 'boards') {
        const maybeSingle = vi.fn(async () => ({
          data: {
            id: 'board-1',
            name: 'Main Board',
            owner_id: 'user-1',
            created_at: '2026-02-17T00:00:00.000Z',
            updated_at: '2026-02-17T00:00:00.000Z',
          },
          error: null,
        }));

        const insert = () => ({
          select: () => ({
            single: async () => ({
              data: {
                id: 'board-created',
                name: 'Tasks to Complete',
                owner_id: 'user-1',
                created_at: '2026-02-17T00:00:00.000Z',
                updated_at: '2026-02-17T00:00:00.000Z',
              },
              error: null,
            }),
          }),
        });

        return {
          select: () => ({
            eq: (column: string, value: string) => {
              expect(column).toBe('owner_id');
              expect(value).toBe('user-1');
              return {
                order: () => ({
                  limit: () => ({
                    maybeSingle,
                  }),
                }),
              };
            },
          }),
          insert,
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

  it('loads user-scoped board/tasks/custom fields from supabase on mount', async () => {
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

  it('does not query supabase when there is no authenticated user', async () => {
    useAuthMock.mockReturnValue({
      user: null,
    });

    const { result } = renderHook(() => useKanban());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(fromMock).not.toHaveBeenCalled();
    expect(result.current.board).toBeNull();
    expect(result.current.tasks).toEqual([]);
    expect(result.current.customFields).toEqual([]);
  });
});
