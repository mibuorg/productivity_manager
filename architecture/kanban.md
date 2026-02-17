# Kanban Architecture SOP

## Goal
Implement a drag-and-drop Kanban board backed by Supabase.

## Data Structure
- **Columns**: `id`, `board_id`, `title`, `position`.
- **Tasks**: `id`, `column_id`, `title`, `description`, `position`, `user_id`, `status`.

## Logic Flow (Local Mode)
1.  **Load**: Check `localStorage` for `kanban-storage` key.
2.  **Init**: If empty, seed with default columns (Todo, In Progress, Done).
3.  **Render**: Render columns/tasks from local state.
4.  **Drag End**:
    -   Update local state array using `arrayMove` (for reorder) or filter/push (for move columns).
    -   Save updated state to `localStorage`.
5.  **Persistence**: Sync to `localStorage` on every change.

## Edge Cases
- **Race conditions**: Two users move the same task. Last write wins (standard Supabase/Postgres behavior).
- **Offline**: Optimistic updates persist in memory. If refresh happens while offline, changes lost (unless local storage backup implemented - *Future Scope*).
