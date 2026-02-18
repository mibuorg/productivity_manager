# Ethan's Productivity Manager

A Supabase-backed productivity app that combines a Kanban board with task-level focus timers.

## Core Functionality

- Kanban workflow with three columns: `To Do`, `In Progress`, `Completed`
- Separate `Completed Calendar` view with fixed 7-day columns (today + 6 previous days)
- Calendar columns always render, including empty days with no completed tasks
- Drag-and-drop task movement between columns
- Create, edit, delete, and reorder tasks
- Task metadata support:
  - Priority
  - Due date
  - Assignee
  - Tags
  - Estimated time (`TIME`, in minutes)
- Time badge on task cards (displayed as `min`)
- Task-level Pomodoro overlay:
  - Click a timed task to open a full-screen focus timer overlay
  - If a timer starts on a `To Do` task, it auto-moves to `In Progress`
  - Add notes during focus sessions (appended to task description as bullet points)
  - Completion prompt when timer ends:
    - `Completed` moves task to `Completed`
    - `Not yet` keeps task in `In Progress`
- Sidebar focus timer widget
- No user authentication in this local branch
- Data is stored in your local/self-hosted Supabase instance (server-side local database)
- Optional AI assistant panel for task suggestions and board analysis

## Tech Stack

- React + TypeScript + Vite
- Tailwind CSS + shadcn/ui (Radix primitives)
- `@dnd-kit` for drag-and-drop
- Supabase (database/client)
- Vitest + Testing Library

## Getting Started

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment variables

Create a `.env` file in the project root (you can copy from `.env.example`):

```bash
VITE_SUPABASE_PROJECT_ID=your_supabase_project_id
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_PUBLISHABLE_KEY=your_supabase_anon_key
```

For a local server setup, point these values to your local Supabase stack (`supabase start`).

### 3. Run the app

```bash
npm run dev
```

Default Vite URL is usually `http://localhost:5173`.

## Supabase Notes

This app expects Supabase tables for boards, tasks, and custom fields.

Useful SQL files in this repo:

- `src/integrations/supabase/schema.sql` (baseline schema)
- `src/integrations/supabase/migrations/01_fix_tasks_columns.sql` (repair migration for missing task columns)
- `supabase/migrations/20260217200147_d736fe70-38e7-4588-8afc-f8087d758c58.sql` (project migration)

Edge function config is in:

- `supabase/functions/kanban-ai/index.ts`

If you use the AI panel, configure the required edge function secret(s) in Supabase.

## Scripts

- `npm run dev` - start dev server
- `npm run build` - production build
- `npm run build:dev` - development-mode build
- `npm run preview` - preview production build
- `npm run lint` - run ESLint
- `npm run test` - run test suite once
- `npm run test:watch` - run tests in watch mode
- `npm run data:backup-local` - export current board data to `.private-data/`
- `npm run data:backup-public` - alias of `data:backup-local`

## Local Data Backup

Back up current board data to a gitignored file:

```bash
npm run data:backup-local
```

Local user-data paths are ignored by git via `.gitignore` (`.private-data/`, `local-data/`, `supabase/backups/`, and backup JSON patterns).

## Project Structure

- `src/pages` - route-level pages
- `src/components/kanban` - board, columns, cards, modals, timer overlay, AI panel
- `src/components/pomodoro` - sidebar focus timer
- `src/hooks` - app state/data hooks (`useKanban`, `usePomodoro`)
- `src/integrations/supabase` - Supabase client/types/schema helpers
- `supabase` - Supabase local config, migrations, edge functions
- `architecture` - implementation notes/SOP docs

## Testing

Run all tests:

```bash
npm test
```

Run one test file:

```bash
npm test -- src/components/kanban/TaskPomodoroOverlay.test.tsx
```

## Current Behavior Details

- Timer formatting:
  - `MM:SS` for 60 minutes or less
  - `H:MM:SS` for times over 60 minutes (no leading zero for single-digit hours, e.g. `2:00:00`)
- Estimated task time is persisted in `tasks.custom_field_values.__estimated_minutes` and mapped to `estimated_minutes` in UI.
- Completed Calendar grouping uses `tasks.updated_at` for completed tasks (editing a completed task can move it to a newer day bucket).
