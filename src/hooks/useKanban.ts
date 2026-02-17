import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Task, Board, CustomFieldDefinition, TaskStatus } from '@/types/kanban';
import { toast } from 'sonner';

const ESTIMATED_MINUTES_KEY = '__estimated_minutes';

const getEstimatedMinutes = (customFieldValues: Task['custom_field_values'] | null | undefined): number | null => {
  const rawValue = customFieldValues?.[ESTIMATED_MINUTES_KEY];
  return typeof rawValue === 'number' && Number.isFinite(rawValue) && rawValue > 0 ? rawValue : null;
};

const withEstimatedMinutes = (task: Task): Task => ({
  ...task,
  estimated_minutes: getEstimatedMinutes(task.custom_field_values),
});

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

export function useKanban() {
  const [board, setBoard] = useState<Board | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [customFields, setCustomFields] = useState<CustomFieldDefinition[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchBoard = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('boards')
        .select('*')
        .order('created_at', { ascending: true })
        .limit(1)
        .single();

      if (error) throw error;
      setBoard(data);
      return data;
    } catch (err) {
      console.error('Error fetching board:', err);
      return null;
    }
  }, []);

  const fetchTasks = useCallback(async (boardId: string) => {
    try {
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('board_id', boardId)
        .order('position', { ascending: true });

      if (error) throw error;
      const mappedTasks = ((data || []) as Task[]).map(withEstimatedMinutes);
      setTasks(mappedTasks);
    } catch (err) {
      console.error('Error fetching tasks:', err);
    }
  }, []);

  const fetchCustomFields = useCallback(async (boardId: string) => {
    try {
      const { data, error } = await supabase
        .from('custom_field_definitions')
        .select('*')
        .eq('board_id', boardId)
        .order('position', { ascending: true });

      if (error) throw error;
      // Cast and transform the data
      const fields = (data || []).map(f => ({
        ...f,
        options: Array.isArray(f.options) ? f.options as string[] : [],
      })) as CustomFieldDefinition[];
      setCustomFields(fields);
    } catch (err) {
      console.error('Error fetching custom fields:', err);
    }
  }, []);

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      const b = await fetchBoard();
      if (b) {
        await Promise.all([fetchTasks(b.id), fetchCustomFields(b.id)]);
      }
      setLoading(false);
    };
    init();
  }, [fetchBoard, fetchTasks, fetchCustomFields]);

  const createTask = useCallback(async (taskData: Partial<Task>) => {
    if (!board) return;
    const statusTasks = tasks.filter(t => t.status === (taskData.status || 'todo'));
    const position = statusTasks.length;
    const estimatedMinutes =
      typeof taskData.estimated_minutes === 'number' && taskData.estimated_minutes > 0
        ? taskData.estimated_minutes
        : null;
    const customFieldValues = buildCustomFieldValues(taskData.custom_field_values, estimatedMinutes);

    try {
      const { data, error } = await supabase
        .from('tasks')
        .insert({
          board_id: board.id,
          title: taskData.title || 'New Task',
          description: taskData.description || '',
          status: taskData.status || 'todo',
          priority: taskData.priority || 'medium',
          due_date: taskData.due_date || null,
          tags: taskData.tags || [],
          assignee: taskData.assignee || '',
          position,
          custom_field_values: customFieldValues,
        })
        .select()
        .single();

      if (error) throw error;
      const taskWithEstimate = withEstimatedMinutes(data as Task);
      setTasks(prev => [...prev, taskWithEstimate]);
      toast.success('Task created');
      return taskWithEstimate;
    } catch (err) {
      console.error('Error creating task:', err);
      toast.error('Failed to create task');
    }
  }, [board, tasks]);

  const updateTask = useCallback(async (taskId: string, updates: Partial<Task>) => {
    const existingTask = tasks.find(t => t.id === taskId);
    const estimatedMinutes =
      typeof updates.estimated_minutes === 'number' && updates.estimated_minutes > 0
        ? updates.estimated_minutes
        : updates.estimated_minutes === null
          ? null
          : undefined;

    const updatePayload: Partial<Task> = { ...updates };
    if (estimatedMinutes !== undefined || updates.custom_field_values !== undefined) {
      updatePayload.custom_field_values = buildCustomFieldValues(
        updates.custom_field_values ?? existingTask?.custom_field_values,
        estimatedMinutes
      );
    }
    delete updatePayload.estimated_minutes;

    try {
      const { data, error } = await supabase
        .from('tasks')
        .update(updatePayload)
        .eq('id', taskId)
        .select()
        .single();

      if (error) throw error;
      const taskWithEstimate = withEstimatedMinutes(data as Task);
      setTasks(prev => prev.map(t => t.id === taskId ? { ...t, ...taskWithEstimate } as Task : t));
      return taskWithEstimate;
    } catch (err) {
      console.error('Error updating task:', err);
      toast.error('Failed to update task');
    }
  }, [tasks]);

  const deleteTask = useCallback(async (taskId: string) => {
    try {
      const { error } = await supabase.from('tasks').delete().eq('id', taskId);
      if (error) throw error;
      setTasks(prev => prev.filter(t => t.id !== taskId));
      toast.success('Task deleted');
    } catch (err) {
      console.error('Error deleting task:', err);
      toast.error('Failed to delete task');
    }
  }, []);

  const moveTask = useCallback(async (taskId: string, newStatus: TaskStatus) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;
    const targetTasks = tasks.filter(t => t.status === newStatus && t.id !== taskId);
    
    // Optimistic update
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: newStatus, position: targetTasks.length } : t));
    
    try {
      const { error } = await supabase
        .from('tasks')
        .update({ status: newStatus, position: targetTasks.length })
        .eq('id', taskId);
      if (error) throw error;
    } catch (err) {
      // Revert on error
      setTasks(prev => prev.map(t => t.id === taskId ? task : t));
      toast.error('Failed to move task');
    }
  }, [tasks]);

  const createCustomField = useCallback(async (field: Omit<CustomFieldDefinition, 'id' | 'created_at'>) => {
    if (!board) return;
    try {
      const { data, error } = await supabase
        .from('custom_field_definitions')
        .insert({ ...field, board_id: board.id })
        .select()
        .single();

      if (error) throw error;
      const newField = { ...data, options: Array.isArray(data.options) ? data.options as string[] : [] } as CustomFieldDefinition;
      setCustomFields(prev => [...prev, newField]);
      toast.success('Custom field created');
      return newField;
    } catch (err) {
      console.error('Error creating custom field:', err);
      toast.error('Failed to create custom field');
    }
  }, [board]);

  const deleteCustomField = useCallback(async (fieldId: string) => {
    try {
      const { error } = await supabase.from('custom_field_definitions').delete().eq('id', fieldId);
      if (error) throw error;
      setCustomFields(prev => prev.filter(f => f.id !== fieldId));
      toast.success('Field deleted');
    } catch (err) {
      console.error('Error deleting custom field:', err);
    }
  }, []);

  const reorderTasks = useCallback(async (reorderedTasks: Task[]) => {
    setTasks(prev => {
      const others = prev.filter(t => !reorderedTasks.find(r => r.id === t.id));
      return [...others, ...reorderedTasks].sort((a, b) => {
        if (a.status !== b.status) return 0;
        return a.position - b.position;
      });
    });

    // Update positions in DB
    const updates = reorderedTasks.map(t =>
      supabase.from('tasks').update({ position: t.position, status: t.status }).eq('id', t.id)
    );
    await Promise.all(updates);
  }, []);

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
    refreshTasks: () => board && fetchTasks(board.id),
  };
}
