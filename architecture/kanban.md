# Kanban Architecture SOP

## Goal
Provide a local-first Kanban board with stable ordering, drag-and-drop transitions, and server-backed persistence.

## Data Shape
- `Board`: `id`, `name`, `created_at`, `updated_at`
- `Task`: `id`, `board_id`, `title`, `description`, `status`, `priority`, `created_at`, `updated_at`, `position`, plus optional metadata fields
  - Completion metadata: `custom_field_values.__completed_at`
  - Estimated time metadata: `custom_field_values.__estimated_minutes`
  - Scheduled time metadata: `scheduled_time` (HH:MM)
- `CustomFieldDefinition`: `id`, `board_id`, `name`, `field_type`, `options`, `position`, `created_at`

## Persistence Model
1. Client reads/writes via `/api/local-state` (`GET`/`PUT`).
2. Server persists state in `local-data/kanban-state.json`.
3. Loaded payloads are normalized in `useKanban` (tags, custom fields, scheduled time, estimated minutes).

## Ordering Rules
- Board column display order is computed by:
  1. Timed tasks first, sorted by `scheduled_time` descending
  2. Priority descending for equal/no times: `urgent > high > medium > low`
  3. `created_at` descending for ties
- A board-level `Organize` menu applies view-level transforms within each status column:
  - Sort by: `smart`, `time`, `duration`, `priority`, `due_date`, `title`, `tag`
  - Group by: `none`, `time`, `duration`, `priority`, `tag`
  - Tag filter: multi-select, tasks match if any selected tag is present
  - Live search across `title`, `description`, and `tags`
- Grouping by tag intentionally duplicates tasks into each matching tag group for visibility.
- `position` values are reindexed from that same ordering after create/update/move/delete/reorder so persisted metadata matches rendered order.
- Completed Calendar grouping uses stable completion day metadata (`__completed_at`) for day buckets, with fallback to legacy `updated_at`.
- Within a day, completed cards are ordered by completion timestamp; board-column display still follows priority/time ordering.

## Interaction Flow
1. `KanbanBoard` loads tasks from `useKanban`.
2. Board view applies search/tag filters, then sort/group transforms per column via `taskOrganization.ts`.
3. Drag/drop updates task status through `moveTask`.
4. `useKanban` persists updated state and reapplies normalized, reindexed data.

## Task Modal Fields
- Create/edit currently exposes: title, description, status, priority, due date, time, duration, tags, and custom fields.
- `Assignee` remains in the persisted task schema but is intentionally hidden from the modal UI.
- Time uses a calendar-style typed field with 15-minute suggestions and normalization to `HH:MM`.

## Notes
- Completed column in board view only shows tasks completed on the current day.
- Historical completed tasks remain visible in Completed Calendar view.
- Completed Calendar renders a 7-day window with week-by-week `Previous` / `Next` navigation (including future week windows).
- Task cards expose creation metadata in DOM attributes (`data-task-created-at`, `data-task-created-at-ts`) to support future chronological UI logic.
- Task cards show `scheduled_time` as a visible time badge when set.
