# Ethan's Productivity Manager

A Supabase-backed productivity app that combines a Kanban board with task-level focus timers.

## Core Functionality

- Kanban workflow with three columns: `To Do`, `In Progress`, `Completed`
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
- Account authentication:
  - Top-right `Account` menu
  - `Log in / Sign up` and `Log out` actions
  - Per-user board isolation via Supabase auth + RLS
- Optional AI assistant panel for task suggestions and board analysis

## Tech Stack

- React + TypeScript + Vite
- Tailwind CSS + shadcn/ui (Radix primitives)
- `@dnd-kit` for drag-and-drop
- Supabase (database/auth/client)
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
- `supabase/migrations/20260218173500_auth_per_user_rls.sql` (owner-based auth + RLS migration)

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
- `npm run data:backup-public` - export currently public board data to `.private-data/`
- `npm run data:import-user` - import a backup file into a signed-in user's board

## Migrating Existing Public Data to a User Account

1. Back up current public board data before applying auth RLS:

```bash
npm run data:backup-public
```

2. Apply Supabase migrations including:

- `supabase/migrations/20260218173500_auth_per_user_rls.sql`

3. Sign up/log in with your target account in the app.

4. Import the saved backup into that account:

```bash
npm run data:import-user -- --file .private-data/<your-backup-file>.json --email you@example.com --password 'your-password'
```

Backup files are ignored by git via `.gitignore` (`.private-data/` and backup JSON patterns).

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
