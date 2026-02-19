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

const parseScheduledTime = (value: string | null | undefined): number | null => {
  if (typeof value !== 'string') return null;
  const normalized = value.trim();
  if (!normalized) return null;

  const timeMatch = normalized.match(/^([01]\d|2[0-3]):([0-5]\d)(?::[0-5]\d)?$/);
  if (timeMatch) {
    const hours = Number.parseInt(timeMatch[1], 10);
    const minutes = Number.parseInt(timeMatch[2], 10);
    return hours * 60 + minutes;
  }

  const parsedDate = new Date(normalized);
  if (Number.isNaN(parsedDate.getTime())) return null;
  return parsedDate.getHours() * 60 + parsedDate.getMinutes();
};

export const compareTasksByPriorityAndCreatedAtDesc = (a: Task, b: Task): number => {
  const aTime = parseScheduledTime(a.scheduled_time);
  const bTime = parseScheduledTime(b.scheduled_time);

  if (aTime !== null && bTime !== null) {
    const timeDelta = bTime - aTime;
    if (timeDelta !== 0) return timeDelta;
  } else if (aTime !== null || bTime !== null) {
    return aTime === null ? 1 : -1;
  }

  const priorityDelta = PRIORITY_RANK[b.priority] - PRIORITY_RANK[a.priority];
  if (priorityDelta !== 0) return priorityDelta;

  const createdAtDelta = parseTimestamp(b.created_at) - parseTimestamp(a.created_at);
  if (createdAtDelta !== 0) return createdAtDelta;

  return parseTimestamp(b.updated_at) - parseTimestamp(a.updated_at);
};

export const sortTasksByPriorityAndCreatedAtDesc = (tasks: Task[]): Task[] => {
  return [...tasks].sort(compareTasksByPriorityAndCreatedAtDesc);
};
