import { Task } from '@/types/kanban';
import { sortTasksByPriorityAndCreatedAtDesc } from './taskSorting';

const pad2 = (value: number): string => String(value).padStart(2, '0');
const COMPLETED_AT_KEY = '__completed_at';

const getCompletionTimestamp = (task: Task): number | null => {
  const completedAtCandidate = task.custom_field_values?.[COMPLETED_AT_KEY];
  const completedAt =
    typeof completedAtCandidate === 'string' && !Number.isNaN(new Date(completedAtCandidate).getTime())
      ? completedAtCandidate
      : task.updated_at;

  const parsed = new Date(completedAt).getTime();
  return Number.isNaN(parsed) ? null : parsed;
};

export const toDayKey = (date: Date): string => (
  `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`
);

const getCompletionDayKey = (task: Task): string | null => {
  if (task.status !== 'completed') return null;

  const completionTimestamp = getCompletionTimestamp(task);
  if (completionTimestamp === null) return null;
  return toDayKey(new Date(completionTimestamp));
};

export const buildDayKeys = (now: Date, days: number): string[] => {
  return Array.from({ length: days }, (_, index) => {
    const day = new Date(now);
    day.setHours(0, 0, 0, 0);
    day.setDate(day.getDate() - index);
    return toDayKey(day);
  });
};

export const groupCompletedTasksByDay = (
  tasks: Task[],
  dayKeys: string[]
): Record<string, Task[]> => {
  const grouped = dayKeys.reduce<Record<string, Task[]>>((acc, key) => {
    acc[key] = [];
    return acc;
  }, {});

  tasks.forEach(task => {
    const dayKey = getCompletionDayKey(task);
    if (!dayKey) return;
    if (!grouped[dayKey]) return;

    grouped[dayKey].push(task);
  });

  Object.values(grouped).forEach(dayTasks => {
    dayTasks.sort((a, b) => {
      const left = getCompletionTimestamp(a) ?? 0;
      const right = getCompletionTimestamp(b) ?? 0;
      return right - left;
    });
  });

  return grouped;
};

export const getCompletedTasksForDay = (tasks: Task[], dayKey: string): Task[] => {
  return sortTasksByPriorityAndCreatedAtDesc(
    tasks.filter(task => getCompletionDayKey(task) === dayKey)
  );
};
