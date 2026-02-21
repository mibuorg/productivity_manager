import { describe, expect, it } from 'vitest';
import { Task } from '@/types/kanban';
import {
  filterTasks,
  getDistinctTags,
  groupTasks,
  sortTasks,
} from './taskOrganization';

const makeTask = (overrides: Partial<Task>): Task => ({
  id: overrides.id || 'task-1',
  board_id: 'board-1',
  title: 'Untitled',
  description: '',
  status: 'todo',
  priority: 'medium',
  due_date: null,
  scheduled_time: null,
  estimated_minutes: null,
  tags: [],
  assignee: '',
  position: 0,
  custom_field_values: {},
  pomodoros_completed: 0,
  created_at: '2026-02-20T10:00:00.000Z',
  updated_at: '2026-02-20T10:00:00.000Z',
  ...overrides,
});

describe('task organization', () => {
  const tasks: Task[] = [
    makeTask({ id: 'alpha', title: 'Calendar planning', description: 'Prep roadmap', tags: ['Ops'], scheduled_time: '16:45', estimated_minutes: 90, priority: 'high' }),
    makeTask({ id: 'beta', title: 'Write docs', description: 'Search indexing notes', tags: ['Docs', 'Ops'], scheduled_time: '09:15', estimated_minutes: 20, priority: 'medium' }),
    makeTask({ id: 'gamma', title: 'Inbox cleanup', description: 'No tags task', tags: [], estimated_minutes: null, priority: 'low' }),
    makeTask({ id: 'delta', title: 'Tag taxonomy', description: 'Define tagging scheme', tags: ['Planning'], scheduled_time: '12:30', estimated_minutes: 45, priority: 'urgent' }),
  ];

  it('filters by live search across title, description, and tags', () => {
    expect(filterTasks(tasks, { query: 'calendar', selectedTags: [] }).map(task => task.id)).toEqual(['alpha']);
    expect(filterTasks(tasks, { query: 'indexing', selectedTags: [] }).map(task => task.id)).toEqual(['beta']);
    expect(filterTasks(tasks, { query: 'tagging', selectedTags: [] }).map(task => task.id)).toEqual(['delta']);
  });

  it('filters by selected tags and keeps tasks that match any selected tag', () => {
    const filtered = filterTasks(tasks, { query: '', selectedTags: ['Ops', 'Planning'] });
    expect(filtered.map(task => task.id)).toEqual(['alpha', 'beta', 'delta']);
  });

  it('sorts by time descending with untimed tasks last', () => {
    const sorted = sortTasks(tasks, 'time');
    expect(sorted.map(task => task.id)).toEqual(['alpha', 'delta', 'beta', 'gamma']);
  });

  it('sorts by duration descending with no-duration tasks last', () => {
    const sorted = sortTasks(tasks, 'duration');
    expect(sorted.map(task => task.id)).toEqual(['alpha', 'delta', 'beta', 'gamma']);
  });

  it('groups by tag and duplicates tasks in each matching tag group', () => {
    const groups = groupTasks(tasks, 'tag', 'default');
    const labels = groups.map(group => group.label);

    expect(labels).toEqual(['Docs', 'Ops', 'Planning', 'No Tag']);
    expect(groups.find(group => group.label === 'Ops')?.tasks.map(task => task.id)).toEqual(['alpha', 'beta']);
    expect(groups.find(group => group.label === 'Docs')?.tasks.map(task => task.id)).toEqual(['beta']);
    expect(groups.find(group => group.label === 'No Tag')?.tasks.map(task => task.id)).toEqual(['gamma']);
  });

  it('returns distinct tag options sorted alphabetically', () => {
    expect(getDistinctTags(tasks)).toEqual(['Docs', 'Ops', 'Planning']);
  });
});
