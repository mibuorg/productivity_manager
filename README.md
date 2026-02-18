# Ethan's Productivity Manager

Single-user, local-first productivity app with a Kanban board and task-level focus timers.

## Core Functionality

- Three-column Kanban flow: `To Do`, `In Progress`, `Completed`
- Create/edit/delete/drag tasks
- Task metadata: priority, due date, tags, assignee, and `TIME`
- Column task ordering: priority desc (`Urgent > High > Medium > Low`), then created time desc for ties
- Timer-enabled tasks open a floating Pomodoro overlay
- One-click timer start:
  - Starts countdown immediately
  - Moves task from `To Do` to `In Progress`
- Focus timer supports per-mode editable durations (`Focus`, `Short Break`, `Long Break`)
- Focus timer mode durations persist per user in browser localStorage
- Persistent per-task timers (multiple active at once)
- Active timer remaining time shown directly on task cards
- Timer note entry appends bullet points to task description
- `Task Completed` action inside timer UI
- Completion prompt at timer end to move task to `Completed` or keep `In Progress`
- Completed Calendar view
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
