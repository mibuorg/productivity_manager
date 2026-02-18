# Completed Calendar View Design

**Date:** 2026-02-18
**Feature:** Separate Completed Calendar view for completed tasks

## Goals

- Keep the existing Kanban board behavior unchanged.
- Add a separate `Completed Calendar` view.
- Show a fixed 7-day window with one column per day, including empty days.
- Use existing `tasks.updated_at` as the date source for completed task grouping.
- Keep runtime overhead low for older hardware.

## Non-Goals

- No schema migration (`completed_at` is out of scope for this phase).
- No additional server polling or background refresh loops.
- No drag-and-drop behavior in calendar view.

## Architecture

The board keeps a single data source through `useKanban()`. A new `CompletedCalendarView` component receives the already-loaded task list and renders a 7-day grouped layout derived client-side. The board container toggles between the existing Kanban columns and the new calendar view; only one is mounted at a time to reduce memory and event overhead.

## UI Design

- Add a view switch in the Kanban header:
  - `Board`
  - `Completed Calendar`
- `Board` remains default on load.
- Calendar renders 7 fixed day columns (today through 6 days back).
- Column header shows weekday/date and task count.
- Empty columns always render a placeholder state.

## Data Flow

1. Read tasks from `useKanban()`.
2. Filter `status === 'completed'`.
3. Map each task to a local day key based on `updated_at`.
4. Build 7-day key list once.
5. Group completed tasks by key and sort each day descending by `updated_at`.
6. Render columns by day-key order, including empty arrays.

## Performance Strategy

- Reuse existing in-memory tasks instead of adding another query path.
- Memoize 7-day key generation, completed-task filtering, and grouped mapping.
- Disable drag/drop interactions in calendar view.
- Avoid timers/polling/expensive effects.
- Unmount inactive view to reduce render and listeners.

## Error Handling

- Invalid/missing `updated_at` values are excluded from day buckets.
- If no completed tasks exist in the 7-day range, show all empty columns.
- Existing edit/delete flows remain unchanged by reusing task card callbacks.

## Testing Strategy

- Unit tests for bucketing logic:
  - always creates 7 day columns
  - includes empty columns
  - excludes non-completed tasks
  - assigns completed tasks to correct local-day bucket from `updated_at`
- Integration test for view toggle:
  - only active view is mounted
  - switching preserves expected task visibility

## Open Trade-off (Accepted)

Using `updated_at` can move a completed task to a newer day when later edits occur. This is accepted for v1 to avoid schema changes and keep implementation lightweight.
