import { Task, TaskPriority } from '@/types/kanban';

const PRIORITY_RANK: Record<TaskPriority, number> = {
  urgent: 4,
  high: 3,
  medium: 2,
  low: 1,
};

const parseTimestamp = (value: string): number => {
  const parsed = new Date(value).getTime();
  return Number.isNaN(parsed) ? 0 : parsed;
};

export const compareTasksByPriorityAndCreatedAtDesc = (a: Task, b: Task): number => {
  const priorityDelta = PRIORITY_RANK[b.priority] - PRIORITY_RANK[a.priority];
  if (priorityDelta !== 0) return priorityDelta;

  const createdAtDelta = parseTimestamp(b.created_at) - parseTimestamp(a.created_at);
  if (createdAtDelta !== 0) return createdAtDelta;

  return parseTimestamp(b.updated_at) - parseTimestamp(a.updated_at);
};

export const sortTasksByPriorityAndCreatedAtDesc = (tasks: Task[]): Task[] => {
  return [...tasks].sort(compareTasksByPriorityAndCreatedAtDesc);
};
