import { Task, TaskPriority } from '@/types/kanban';
import { compareTasksByPriorityAndCreatedAtDesc, sortTasksByPriorityAndCreatedAtDesc } from './taskSorting';

export type TaskSortBy = 'default' | 'time' | 'duration' | 'priority' | 'due_date' | 'title' | 'tag';
export type TaskGroupBy = 'none' | 'time' | 'duration' | 'priority' | 'tag';

export interface TaskGroup {
  id: string;
  label: string;
  tasks: Task[];
}

export const TASK_SORT_OPTIONS: Array<{ value: TaskSortBy; label: string }> = [
  { value: 'default', label: 'Smart (Time + Priority)' },
  { value: 'time', label: 'Time (Latest First)' },
  { value: 'duration', label: 'Duration (Longest First)' },
  { value: 'priority', label: 'Priority (Highest First)' },
  { value: 'due_date', label: 'Due Date (Soonest First)' },
  { value: 'title', label: 'Title (A-Z)' },
  { value: 'tag', label: 'Tag (A-Z)' },
];

export const TASK_GROUP_OPTIONS: Array<{ value: TaskGroupBy; label: string }> = [
  { value: 'none', label: 'No Grouping' },
  { value: 'time', label: 'Time' },
  { value: 'duration', label: 'Duration' },
  { value: 'priority', label: 'Priority' },
  { value: 'tag', label: 'Tag' },
];

const PRIORITY_ORDER: TaskPriority[] = ['urgent', 'high', 'medium', 'low'];
const PRIORITY_RANK: Record<TaskPriority, number> = {
  urgent: 4,
  high: 3,
  medium: 2,
  low: 1,
};

const normalizeText = (value: string) => value.trim().toLowerCase();

const parseTimestamp = (value: string | null): number | null => {
  if (!value) return null;
  const parsed = new Date(value).getTime();
  return Number.isNaN(parsed) ? null : parsed;
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

const parseDuration = (value: number | null | undefined): number | null => {
  if (typeof value !== 'number' || Number.isNaN(value) || value <= 0) return null;
  return value;
};

const compareByTimeDesc = (a: Task, b: Task): number => {
  const aTime = parseScheduledTime(a.scheduled_time);
  const bTime = parseScheduledTime(b.scheduled_time);

  if (aTime !== null && bTime !== null) {
    const delta = bTime - aTime;
    if (delta !== 0) return delta;
  } else if (aTime !== null || bTime !== null) {
    return aTime === null ? 1 : -1;
  }

  return compareTasksByPriorityAndCreatedAtDesc(a, b);
};

const compareByDurationDesc = (a: Task, b: Task): number => {
  const aDuration = parseDuration(a.estimated_minutes);
  const bDuration = parseDuration(b.estimated_minutes);

  if (aDuration !== null && bDuration !== null) {
    const delta = bDuration - aDuration;
    if (delta !== 0) return delta;
  } else if (aDuration !== null || bDuration !== null) {
    return aDuration === null ? 1 : -1;
  }

  return compareTasksByPriorityAndCreatedAtDesc(a, b);
};

const compareByPriorityDesc = (a: Task, b: Task): number => {
  const delta = PRIORITY_RANK[b.priority] - PRIORITY_RANK[a.priority];
  if (delta !== 0) return delta;
  return compareTasksByPriorityAndCreatedAtDesc(a, b);
};

const compareByDueDateAsc = (a: Task, b: Task): number => {
  const aDue = parseTimestamp(a.due_date);
  const bDue = parseTimestamp(b.due_date);

  if (aDue !== null && bDue !== null) {
    const delta = aDue - bDue;
    if (delta !== 0) return delta;
  } else if (aDue !== null || bDue !== null) {
    return aDue === null ? 1 : -1;
  }

  return compareTasksByPriorityAndCreatedAtDesc(a, b);
};

const compareByTitleAsc = (a: Task, b: Task): number => {
  const delta = a.title.localeCompare(b.title, undefined, { sensitivity: 'base' });
  if (delta !== 0) return delta;
  return compareTasksByPriorityAndCreatedAtDesc(a, b);
};

const compareByTagAsc = (a: Task, b: Task): number => {
  const aFirstTag = a.tags[0] ? normalizeText(a.tags[0]) : '';
  const bFirstTag = b.tags[0] ? normalizeText(b.tags[0]) : '';

  if (aFirstTag && bFirstTag) {
    const delta = aFirstTag.localeCompare(bFirstTag);
    if (delta !== 0) return delta;
  } else if (aFirstTag || bFirstTag) {
    return aFirstTag ? -1 : 1;
  }

  return compareTasksByPriorityAndCreatedAtDesc(a, b);
};

export const getDistinctTags = (tasks: Task[]): string[] => {
  const unique = new Map<string, string>();

  tasks.forEach(task => {
    task.tags.forEach(tag => {
      const trimmed = tag.trim();
      if (!trimmed) return;
      const key = normalizeText(trimmed);
      if (!unique.has(key)) {
        unique.set(key, trimmed);
      }
    });
  });

  return Array.from(unique.values()).sort((a, b) => a.localeCompare(b, undefined, { sensitivity: 'base' }));
};

export const filterTasks = (
  tasks: Task[],
  options: { query: string; selectedTags: string[] },
): Task[] => {
  const normalizedQuery = normalizeText(options.query);
  const selectedTagSet = new Set(options.selectedTags.map(tag => normalizeText(tag)).filter(Boolean));

  return tasks.filter(task => {
    if (normalizedQuery) {
      const searchableValues = [task.title, task.description, ...task.tags]
        .filter((value): value is string => typeof value === 'string' && value.length > 0)
        .map(value => value.toLowerCase());
      const queryMatched = searchableValues.some(value => value.includes(normalizedQuery));
      if (!queryMatched) return false;
    }

    if (selectedTagSet.size > 0) {
      const matchesTag = task.tags.some(tag => selectedTagSet.has(normalizeText(tag)));
      if (!matchesTag) return false;
    }

    return true;
  });
};

export const sortTasks = (tasks: Task[], sortBy: TaskSortBy): Task[] => {
  switch (sortBy) {
    case 'time':
      return [...tasks].sort(compareByTimeDesc);
    case 'duration':
      return [...tasks].sort(compareByDurationDesc);
    case 'priority':
      return [...tasks].sort(compareByPriorityDesc);
    case 'due_date':
      return [...tasks].sort(compareByDueDateAsc);
    case 'title':
      return [...tasks].sort(compareByTitleAsc);
    case 'tag':
      return [...tasks].sort(compareByTagAsc);
    case 'default':
    default:
      return sortTasksByPriorityAndCreatedAtDesc(tasks);
  }
};

const getTimeGroupId = (task: Task): string => {
  const time = parseScheduledTime(task.scheduled_time);
  if (time === null) return 'no-time';
  if (time < 12 * 60) return 'morning';
  if (time < 17 * 60) return 'afternoon';
  return 'evening';
};

const TIME_GROUP_LABELS: Record<string, string> = {
  morning: 'Morning',
  afternoon: 'Afternoon',
  evening: 'Evening',
  'no-time': 'No Time',
};

const DURATION_GROUP_LABELS: Record<string, string> = {
  short: 'Short (<30m)',
  medium: 'Medium (30-60m)',
  long: 'Long (60m+)',
  'no-duration': 'No Duration',
};

const getDurationGroupId = (task: Task): string => {
  const duration = parseDuration(task.estimated_minutes);
  if (duration === null) return 'no-duration';
  if (duration < 30) return 'short';
  if (duration <= 60) return 'medium';
  return 'long';
};

const TAG_NONE_ID = 'no-tag';

const groupByFixedOrder = (
  tasks: Task[],
  idsInOrder: string[],
  labelById: Record<string, string>,
  getGroupId: (task: Task) => string,
  sortBy: TaskSortBy,
): TaskGroup[] => {
  const grouped = new Map<string, Task[]>();

  tasks.forEach(task => {
    const groupId = getGroupId(task);
    if (!grouped.has(groupId)) grouped.set(groupId, []);
    grouped.get(groupId)?.push(task);
  });

  return idsInOrder
    .filter(groupId => (grouped.get(groupId)?.length || 0) > 0)
    .map(groupId => ({
      id: groupId,
      label: labelById[groupId] || groupId,
      tasks: sortTasks(grouped.get(groupId) || [], sortBy),
    }));
};

export const groupTasks = (tasks: Task[], groupBy: TaskGroupBy, sortBy: TaskSortBy): TaskGroup[] => {
  if (groupBy === 'none') {
    return [
      {
        id: 'all',
        label: 'All Tasks',
        tasks: sortTasks(tasks, sortBy),
      },
    ];
  }

  if (groupBy === 'time') {
    return groupByFixedOrder(
      tasks,
      ['morning', 'afternoon', 'evening', 'no-time'],
      TIME_GROUP_LABELS,
      getTimeGroupId,
      sortBy,
    );
  }

  if (groupBy === 'duration') {
    return groupByFixedOrder(
      tasks,
      ['short', 'medium', 'long', 'no-duration'],
      DURATION_GROUP_LABELS,
      getDurationGroupId,
      sortBy,
    );
  }

  if (groupBy === 'priority') {
    return PRIORITY_ORDER
      .map(priority => {
        const priorityTasks = tasks.filter(task => task.priority === priority);
        return {
          id: priority,
          label: priority[0].toUpperCase() + priority.slice(1),
          tasks: sortTasks(priorityTasks, sortBy),
        };
      })
      .filter(group => group.tasks.length > 0);
  }

  const groupedTags = new Map<string, Task[]>();
  const tagLabels = new Map<string, string>();

  tasks.forEach(task => {
    if (!task.tags.length) {
      if (!groupedTags.has(TAG_NONE_ID)) groupedTags.set(TAG_NONE_ID, []);
      groupedTags.get(TAG_NONE_ID)?.push(task);
      tagLabels.set(TAG_NONE_ID, 'No Tag');
      return;
    }

    task.tags.forEach(tag => {
      const trimmed = tag.trim();
      if (!trimmed) return;
      const id = normalizeText(trimmed).replace(/\s+/g, '-');
      if (!groupedTags.has(id)) groupedTags.set(id, []);
      groupedTags.get(id)?.push(task);
      if (!tagLabels.has(id)) tagLabels.set(id, trimmed);
    });
  });

  return Array.from(groupedTags.entries())
    .sort(([aId, ], [bId, ]) => {
      if (aId === TAG_NONE_ID) return 1;
      if (bId === TAG_NONE_ID) return -1;
      const aLabel = tagLabels.get(aId) || '';
      const bLabel = tagLabels.get(bId) || '';
      return aLabel.localeCompare(bLabel, undefined, { sensitivity: 'base' });
    })
    .map(([groupId, groupTasksList]) => ({
      id: groupId,
      label: tagLabels.get(groupId) || groupId,
      tasks: sortTasks(groupTasksList, sortBy),
    }));
};
