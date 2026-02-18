# Kanban Architecture SOP

## Goal
Provide a local-first Kanban board with stable ordering, drag-and-drop transitions, and server-backed persistence.

## Data Shape
- `Board`: `id`, `name`, `created_at`, `updated_at`
- `Task`: `id`, `board_id`, `title`, `description`, `status`, `priority`, `created_at`, `updated_at`, `position`, plus optional metadata fields
- `CustomFieldDefinition`: `id`, `board_id`, `name`, `field_type`, `options`, `position`, `created_at`

## Persistence Model
1. Client reads/writes via `/api/local-state` (`GET`/`PUT`).
2. Server persists state in `local-data/kanban-state.json`.
3. Loaded payloads are normalized in `useKanban` (tags, custom fields, estimated minutes).

## Ordering Rules
- Board column display order is computed by:
  1. Priority descending: `urgent > high > medium > low`
  2. `created_at` descending for ties
- `position` values are reindexed from that same ordering after create/update/move/delete/reorder so persisted metadata matches rendered order.
- Completed Calendar grouping still uses completion day (`updated_at`) for day buckets; within a day, tasks use the same priority/time ordering.

## Interaction Flow
1. `KanbanBoard` loads tasks from `useKanban`.
2. Tasks are filtered by status and sorted by the shared comparator.
3. Drag/drop updates task status through `moveTask`.
4. `useKanban` persists updated state and reapplies normalized, reindexed data.

## Notes
- Completed column in board view only shows tasks completed on the current day.
- Historical completed tasks remain visible in Completed Calendar view.
