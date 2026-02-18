import { useState, useEffect, useCallback } from 'react';
import { Task, Board, CustomFieldDefinition, TaskStatus } from '@/types/kanban';
import { compareTasksByPriorityAndCreatedAtDesc } from '@/components/kanban/taskSorting';
import { toast } from 'sonner';

const ESTIMATED_MINUTES_KEY = '__estimated_minutes';
const LOCAL_STATE_ENDPOINT = '/api/local-state';

type LocalStatePayload = {
  board: Board;
  tasks: Task[];
  customFields: CustomFieldDefinition[];
};

const TASK_STATUSES: TaskStatus[] = ['todo', 'in_progress', 'completed'];

const createId = () => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `id-${Date.now()}-${Math.random().toString(16).slice(2)}`;
};

const createDefaultBoard = (): Board => {
  const timestamp = new Date().toISOString();
  return {
    id: createId(),
    name: 'Tasks to Complete',
    created_at: timestamp,
    updated_at: timestamp,
  };
};

const getEstimatedMinutes = (customFieldValues: Task['custom_field_values'] | null | undefined): number | null => {
  const rawValue = customFieldValues?.[ESTIMATED_MINUTES_KEY];
  return typeof rawValue === 'number' && Number.isFinite(rawValue) && rawValue > 0 ? rawValue : null;
};

const normalizeTags = (tags: unknown): string[] => {
  if (Array.isArray(tags)) {
    return tags
      .filter((tag): tag is string => typeof tag === 'string')
      .map(tag => tag.trim())
      .filter(Boolean);
  }

  if (typeof tags === 'string') {
    return tags
      .split(',')
      .map(tag => tag.trim())
      .filter(Boolean);
  }

  return [];
};

const withEstimatedMinutes = (task: Task): Task => ({
  ...task,
  tags: normalizeTags(task.tags),
  custom_field_values: task.custom_field_values || {},
  estimated_minutes: getEstimatedMinutes(task.custom_field_values),
});

const normalizeCustomField = (field: CustomFieldDefinition): CustomFieldDefinition => ({
  ...field,
  options: Array.isArray(field.options) ? field.options : [],
});

const reindexTaskPositions = (tasks: Task[]): Task[] => {
  const positionByTaskId = new Map<string, number>();

  TASK_STATUSES.forEach((status) => {
    tasks
      .filter(task => task.status === status)
      .sort(compareTasksByPriorityAndCreatedAtDesc)
      .forEach((task, index) => {
        positionByTaskId.set(task.id, index);
      });
  });

  return tasks.map((task) => {
    const nextPosition = positionByTaskId.get(task.id);
    if (nextPosition === undefined || task.position === nextPosition) {
      return task;
    }
    return { ...task, position: nextPosition };
  });
};

const normalizePayload = (payload: unknown): LocalStatePayload => {
  const fallbackBoard = createDefaultBoard();
  if (!payload || typeof payload !== 'object') {
    return { board: fallbackBoard, tasks: [], customFields: [] };
  }

  const candidate = payload as Partial<LocalStatePayload>;
  const board =
    candidate.board && typeof candidate.board === 'object' && typeof candidate.board.id === 'string'
      ? (candidate.board as Board)
      : fallbackBoard;

  const tasks = Array.isArray(candidate.tasks)
    ? reindexTaskPositions((candidate.tasks as Task[]).map(withEstimatedMinutes))
    : [];
  const customFields = Array.isArray(candidate.customFields)
    ? (candidate.customFields as CustomFieldDefinition[]).map(normalizeCustomField)
    : [];

  return { board, tasks, customFields };
};

const buildCustomFieldValues = (
  baseValues: Task['custom_field_values'] | null | undefined,
  estimatedMinutes: number | null | undefined
) => {
  const values = { ...(baseValues || {}) };
  if (typeof estimatedMinutes === 'number' && estimatedMinutes > 0) {
    values[ESTIMATED_MINUTES_KEY] = estimatedMinutes;
  } else {
    delete values[ESTIMATED_MINUTES_KEY];
  }
  return values;
};

const loadLocalState = async (): Promise<LocalStatePayload> => {
  const response = await fetch(LOCAL_STATE_ENDPOINT, {
    method: 'GET',
    headers: { Accept: 'application/json' },
    cache: 'no-store',
  });

  if (!response.ok) {
    throw new Error(`Failed to load local state (${response.status})`);
  }

  const payload = await response.json();
  return normalizePayload(payload);
};

const saveLocalState = async (payload: LocalStatePayload): Promise<LocalStatePayload> => {
  const response = await fetch(LOCAL_STATE_ENDPOINT, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(`Failed to persist local state (${response.status})`);
  }

  const savedPayload = await response.json();
  return normalizePayload(savedPayload);
};

export function useKanban() {
  const [board, setBoard] = useState<Board | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [customFields, setCustomFields] = useState<CustomFieldDefinition[]>([]);
  const [loading, setLoading] = useState(true);

  const applyState = useCallback((state: LocalStatePayload) => {
    setBoard(state.board);
    setTasks(state.tasks);
    setCustomFields(state.customFields);
  }, []);

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      try {
        const state = await loadLocalState();
        applyState(state);
      } catch (error) {
        console.error('Error loading local kanban state:', error);
        toast.error('Failed to load local board data');
      } finally {
        setLoading(false);
      }
    };

    void init();
  }, [applyState]);

  const persistState = useCallback(
    async (nextState: LocalStatePayload) => {
      const persistedState = await saveLocalState(nextState);
      applyState(persistedState);
      return persistedState;
    },
    [applyState]
  );

  const createTask = useCallback(
    async (taskData: Partial<Task>) => {
      if (!board) return;

      const status = taskData.status || 'todo';
      const statusTasks = tasks.filter(t => t.status === status);
      const position = statusTasks.length;
      const estimatedMinutes =
        typeof taskData.estimated_minutes === 'number' && taskData.estimated_minutes > 0
          ? taskData.estimated_minutes
          : null;
      const timestamp = new Date().toISOString();

      const newTask: Task = {
        id: createId(),
        board_id: board.id,
        title: taskData.title || 'New Task',
        description: taskData.description || '',
        status,
        priority: taskData.priority || 'medium',
        due_date: taskData.due_date || null,
        estimated_minutes: estimatedMinutes,
        tags: normalizeTags(taskData.tags),
        assignee: taskData.assignee || '',
        position,
        custom_field_values: buildCustomFieldValues(taskData.custom_field_values, estimatedMinutes),
        pomodoros_completed: taskData.pomodoros_completed || 0,
        created_at: timestamp,
        updated_at: timestamp,
      };

      try {
        await persistState({
          board,
          tasks: reindexTaskPositions([...tasks, withEstimatedMinutes(newTask)]),
          customFields,
        });
        toast.success('Task created');
        return newTask;
      } catch (error) {
        console.error('Error creating task:', error);
        toast.error('Failed to create task');
      }
    },
    [board, customFields, persistState, tasks]
  );

  const updateTask = useCallback(
    async (taskId: string, updates: Partial<Task>) => {
      const existingTask = tasks.find(task => task.id === taskId);
      if (!existingTask || !board) return;

      const estimatedMinutes =
        typeof updates.estimated_minutes === 'number' && updates.estimated_minutes > 0
          ? updates.estimated_minutes
          : updates.estimated_minutes === null
            ? null
            : updates.custom_field_values
              ? getEstimatedMinutes(updates.custom_field_values)
              : existingTask.estimated_minutes ?? getEstimatedMinutes(existingTask.custom_field_values);

      const updatedTask: Task = withEstimatedMinutes({
        ...existingTask,
        ...updates,
        custom_field_values: buildCustomFieldValues(
          updates.custom_field_values ?? existingTask.custom_field_values,
          estimatedMinutes
        ),
        estimated_minutes: estimatedMinutes ?? null,
        updated_at: new Date().toISOString(),
      } as Task);

      const nextTasks = reindexTaskPositions(tasks.map(task => (task.id === taskId ? updatedTask : task)));

      try {
        await persistState({
          board,
          tasks: nextTasks,
          customFields,
        });
        return updatedTask;
      } catch (error) {
        console.error('Error updating task:', error);
        toast.error('Failed to update task');
      }
    },
    [board, customFields, persistState, tasks]
  );

  const deleteTask = useCallback(
    async (taskId: string) => {
      if (!board) return;
      const nextTasks = reindexTaskPositions(tasks.filter(task => task.id !== taskId));

      try {
        await persistState({
          board,
          tasks: nextTasks,
          customFields,
        });
        toast.success('Task deleted');
      } catch (error) {
        console.error('Error deleting task:', error);
        toast.error('Failed to delete task');
      }
    },
    [board, customFields, persistState, tasks]
  );

  const moveTask = useCallback(
    async (taskId: string, newStatus: TaskStatus) => {
      if (!board) return;
      const task = tasks.find(t => t.id === taskId);
      if (!task) return;

      const targetTasks = tasks.filter(t => t.status === newStatus && t.id !== taskId);
      const movedTask: Task = {
        ...task,
        status: newStatus,
        position: targetTasks.length,
        updated_at: new Date().toISOString(),
      };

      const nextTasks = reindexTaskPositions(tasks.map(t => (t.id === taskId ? movedTask : t)));

      try {
        await persistState({
          board,
          tasks: nextTasks,
          customFields,
        });
      } catch (error) {
        console.error('Error moving task:', error);
        toast.error('Failed to move task');
      }
    },
    [board, customFields, persistState, tasks]
  );

  const createCustomField = useCallback(
    async (field: Omit<CustomFieldDefinition, 'id' | 'created_at'>) => {
      if (!board) return;

      const newField: CustomFieldDefinition = {
        ...field,
        id: createId(),
        board_id: board.id,
        options: Array.isArray(field.options) ? field.options : [],
        created_at: new Date().toISOString(),
      };

      try {
        await persistState({
          board,
          tasks,
          customFields: [...customFields, newField],
        });
        toast.success('Custom field created');
        return newField;
      } catch (error) {
        console.error('Error creating custom field:', error);
        toast.error('Failed to create custom field');
      }
    },
    [board, customFields, persistState, tasks]
  );

  const deleteCustomField = useCallback(
    async (fieldId: string) => {
      if (!board) return;
      const nextFields = customFields.filter(field => field.id !== fieldId);

      try {
        await persistState({
          board,
          tasks,
          customFields: nextFields,
        });
        toast.success('Field deleted');
      } catch (error) {
        console.error('Error deleting custom field:', error);
      }
    },
    [board, customFields, persistState, tasks]
  );

  const reorderTasks = useCallback(
    async (reorderedTasks: Task[]) => {
      if (!board) return;

      const reorderedById = new Map(reorderedTasks.map(task => [task.id, task]));
      const nextTasks = reindexTaskPositions(tasks.map(task => reorderedById.get(task.id) ?? task));

      try {
        await persistState({
          board,
          tasks: nextTasks,
          customFields,
        });
      } catch (error) {
        console.error('Error reordering tasks:', error);
      }
    },
    [board, customFields, persistState, tasks]
  );

  const refreshTasks = useCallback(async () => {
    try {
      const state = await loadLocalState();
      applyState(state);
      return state.tasks;
    } catch (error) {
      console.error('Error refreshing tasks:', error);
      return [];
    }
  }, [applyState]);

  return {
    board,
    tasks,
    customFields,
    loading,
    createTask,
    updateTask,
    deleteTask,
    moveTask,
    createCustomField,
    deleteCustomField,
    reorderTasks,
    refreshTasks,
  };
}
