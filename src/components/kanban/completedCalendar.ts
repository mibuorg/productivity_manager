import { Task } from '@/types/kanban';

const pad2 = (value: number): string => String(value).padStart(2, '0');

const toDayKey = (date: Date): string => (
  `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`
);

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
    if (task.status !== 'completed') return;

    const parsedDate = new Date(task.updated_at);
    if (Number.isNaN(parsedDate.getTime())) return;

    const dayKey = toDayKey(parsedDate);
    if (!grouped[dayKey]) return;

    grouped[dayKey].push(task);
  });

  Object.values(grouped).forEach(dayTasks => {
    dayTasks.sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime());
  });

  return grouped;
};
