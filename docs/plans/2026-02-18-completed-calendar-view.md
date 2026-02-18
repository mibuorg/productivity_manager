# Completed Calendar View Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add a separate `Completed Calendar` view that shows completed tasks in 7 fixed daily columns (including empty days) using `updated_at`, while preserving current board behavior and keeping runtime overhead low.

**Architecture:** Keep `useKanban()` as the single data source and derive calendar buckets client-side. Add a new calendar utility module for deterministic day-key generation and grouping logic, then render a dedicated `CompletedCalendarView` component. Integrate it into `KanbanBoard` behind a two-state view toggle where only the active view is mounted.

**Tech Stack:** React, TypeScript, Vitest, Testing Library, Tailwind CSS, existing Kanban UI components.

---

### Task 1: Calendar Grouping Utilities

**Files:**
- Create: `src/components/kanban/completedCalendar.ts`
- Create: `src/components/kanban/completedCalendar.test.ts`

**Step 1: Write the failing test**

```ts
import { describe, expect, it } from 'vitest';
import { buildDayKeys, groupCompletedTasksByDay } from './completedCalendar';

it('builds exactly 7 day keys including today', () => {
  const keys = buildDayKeys(new Date('2026-02-18T12:00:00Z'), 7);
  expect(keys).toHaveLength(7);
});

it('groups only completed tasks by updated_at day key', () => {
  // include todo/in_progress and invalid updated_at; assert exclusion
});
```

**Step 2: Run test to verify it fails**

Run: `npm test -- src/components/kanban/completedCalendar.test.ts`
Expected: FAIL with missing module/functions.

**Step 3: Write minimal implementation**

```ts
export const buildDayKeys = (now: Date, days: number): string[] => { /* local yyyy-mm-dd keys */ };
export const groupCompletedTasksByDay = (tasks: Task[], dayKeys: string[]) => { /* completed only, sorted desc */ };
```

**Step 4: Run test to verify it passes**

Run: `npm test -- src/components/kanban/completedCalendar.test.ts`
Expected: PASS.

**Step 5: Commit**

```bash
git add src/components/kanban/completedCalendar.ts src/components/kanban/completedCalendar.test.ts
git commit -m "test+feat: add completed-task calendar grouping utilities"
```

### Task 2: Completed Calendar View Component

**Files:**
- Create: `src/components/kanban/CompletedCalendarView.tsx`
- Create: `src/components/kanban/CompletedCalendarView.test.tsx`
- Modify: `src/components/kanban/TaskCard.tsx` (only if testability/accessibility hooks are needed)

**Step 1: Write the failing test**

```tsx
it('renders 7 date columns even when no completed tasks exist', () => {
  // render with empty tasks and assert 7 day headers + empty placeholders
});

it('renders completed tasks in their updated_at day column', () => {
  // pass mixed tasks and assert only completed cards render in expected column
});
```

**Step 2: Run test to verify it fails**

Run: `npm test -- src/components/kanban/CompletedCalendarView.test.tsx`
Expected: FAIL because component does not exist yet.

**Step 3: Write minimal implementation**

```tsx
export function CompletedCalendarView(props: CompletedCalendarViewProps) {
  const dayKeys = useMemo(() => buildDayKeys(new Date(), 7), []);
  const grouped = useMemo(() => groupCompletedTasksByDay(props.tasks, dayKeys), [props.tasks, dayKeys]);
  // render 7 fixed columns + TaskCard list per day + empty placeholder
}
```

**Step 4: Run test to verify it passes**

Run: `npm test -- src/components/kanban/CompletedCalendarView.test.tsx`
Expected: PASS.

**Step 5: Commit**

```bash
git add src/components/kanban/CompletedCalendarView.tsx src/components/kanban/CompletedCalendarView.test.tsx src/components/kanban/TaskCard.tsx
git commit -m "test+feat: add completed calendar view component"
```

### Task 3: Integrate View Toggle in KanbanBoard

**Files:**
- Modify: `src/components/kanban/KanbanBoard.tsx`
- Create: `src/components/kanban/KanbanBoard.calendar-toggle.test.tsx`

**Step 1: Write the failing test**

```tsx
it('shows board view by default and switches to completed calendar view', async () => {
  // mock useKanban; assert board columns visible by default
  // click Completed Calendar toggle; assert calendar view visible and board columns absent
});
```

**Step 2: Run test to verify it fails**

Run: `npm test -- src/components/kanban/KanbanBoard.calendar-toggle.test.tsx`
Expected: FAIL because toggle/view switching is missing.

**Step 3: Write minimal implementation**

```tsx
const [viewMode, setViewMode] = useState<'board' | 'completed_calendar'>('board');

{viewMode === 'board' ? (
  <ExistingKanbanColumns />
) : (
  <CompletedCalendarView ... />
)}
```

**Step 4: Run test to verify it passes**

Run: `npm test -- src/components/kanban/KanbanBoard.calendar-toggle.test.tsx`
Expected: PASS.

**Step 5: Commit**

```bash
git add src/components/kanban/KanbanBoard.tsx src/components/kanban/KanbanBoard.calendar-toggle.test.tsx
git commit -m "test+feat: add kanban/completed-calendar view toggle"
```

### Task 4: Documentation Update

**Files:**
- Modify: `README.md`

**Step 1: Write the failing doc check (manual assertion list)**

```md
- Missing mention of Completed Calendar view
- Missing 7-day fixed window behavior
- Missing updated_at grouping rule/trade-off
```

**Step 2: Run verification for docs scope**

Run: `rg -n "Completed Calendar|updated_at|7-day" README.md`
Expected: no matches before update.

**Step 3: Write minimal documentation update**

```md
- Add Completed Calendar view to core functionality
- Note fixed 7-day columns including empty days
- Note grouping uses tasks.updated_at for completed tasks
```

**Step 4: Run verification for docs scope**

Run: `rg -n "Completed Calendar|updated_at|7-day" README.md`
Expected: matches for all three topics.

**Step 5: Commit**

```bash
git add README.md
git commit -m "docs: document completed calendar view behavior"
```

### Task 5: Final Verification Before Completion

**Files:**
- Modify if needed from fixes discovered by verification

**Step 1: Run targeted tests**

Run:
- `npm test -- src/components/kanban/completedCalendar.test.ts`
- `npm test -- src/components/kanban/CompletedCalendarView.test.tsx`
- `npm test -- src/components/kanban/KanbanBoard.calendar-toggle.test.tsx`

Expected: all PASS.

**Step 2: Run full test suite**

Run: `npm test`
Expected: PASS for all suites (existing warnings acceptable unless new failures appear).

**Step 3: Run lint**

Run: `npm run lint`
Expected: no errors.

**Step 4: Review diff for scope control**

Run:
- `git status --short`
- `git diff --stat`

Expected: only files related to completed-calendar feature and docs updates.

**Step 5: Final commit for any verification fixes**

```bash
git add -A
git commit -m "chore: finalize completed calendar view verification fixes"
```

