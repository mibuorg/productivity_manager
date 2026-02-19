# Ethan's Productivity Manager

Single-user, local-first productivity app with a Kanban board and task-level focus timers.

## Core Functionality

- Three-column Kanban flow: `To Do`, `In Progress`, `Completed`
- Create/edit/delete/drag tasks
- Task metadata in the create/edit modal: priority, due date, time, duration, and tags
- Assignee data remains in the task model for compatibility, but is currently hidden from the create/edit UI
- Time selection supports direct typing (`9:30 pm`, `21:30`) with 15-minute suggestions for calendar-style scheduling
- Column task ordering: timed tasks first by time desc, then priority desc (`Urgent > High > Medium > Low`), then created time desc for ties
- Scheduled task time is shown directly on task cards as a visible badge
- Timer-enabled tasks open a floating Pomodoro overlay
- One-click timer start:
  - Starts countdown immediately
  - Moves task from `To Do` to `In Progress`
- Focus timer is a single editable `Break` timer (default 10 minutes)
- Break duration preference persists per user in browser localStorage
- Persistent per-task timers (multiple active at once)
- Active timer remaining time shown directly on task cards
- Timer note entry appends bullet points to task description
- `Task Completed` action inside timer UI
- Completion prompt at timer end to move task to `Completed` or keep `In Progress`
- Completed Calendar view
- Completed-day history uses stable completion metadata so editing a completed task does not move it to a new day
- Task cards expose creation metadata attributes (`data-task-created-at`, `data-task-created-at-ts`) for chronological features
- AI panel is enabled only when the server has internet access (`/api/internet-status`)

## Local-Only Data Model

- No user authentication in this local branch.
- No Supabase dependency in runtime board storage.
- Board/task/custom-field data is stored on the host server in:
  - `local-data/kanban-state.json`
- Timer state is persisted in browser localStorage so timers continue when overlay is closed.
- Local data paths are gitignored (`local-data/`, `.private-data/`, backups, etc.).

## Tech Stack

- React + TypeScript + Vite
- Tailwind CSS + shadcn/ui
- dnd-kit for drag-and-drop
- Vitest + Testing Library

## Getting Started

### 1. Install

```bash
npm install
```

### 2. Run locally

```bash
npm run dev
```

### 3. Optional data file override

If you want the server-side JSON file in a custom location:

```bash
KANBAN_LOCAL_STATE_FILE=/absolute/path/kanban-state.json npm run dev
```

## Scripts

- `npm run dev` - Vite dev server (includes local API middleware)
- `npm run build` - production build
- `npm run preview` - preview build (includes local API middleware)
- `npm run lint` - lint
- `npm run test` - test suite

## Project Structure

- `src/components/kanban` - board, cards, timer overlay, AI panel
- `src/hooks/useKanban.ts` - local data API integration
- `server/localApiPlugin.ts` - server-local JSON persistence API
- `local-data/` - runtime data file location (gitignored)

## Testing

```bash
npm test
```
