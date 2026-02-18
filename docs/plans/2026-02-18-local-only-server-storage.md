# Local-Only Server Storage Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Remove Supabase/auth runtime dependencies and persist Kanban data locally on the host server so each deployment is isolated and offline-capable.

**Architecture:** Add a Vite middleware API that reads/writes a local JSON state file (`local-data/kanban-state.json`) on the server. Refactor `useKanban` to consume this API and update local React state optimistically, then persist to server-file state. Keep timer persistence logic unchanged.

**Tech Stack:** React, TypeScript, Vite middleware, Node `fs/promises`, Vitest.

---

### Task 1: Add Failing Hook Tests For Local API State

**Files:**
- Modify: `src/hooks/useKanban.test.tsx`

1. Replace Supabase mocks with `fetch` mocks for `GET /api/local-state` and `PUT /api/local-state`.
2. Add test that initial load reads board/tasks/custom fields from API response.
3. Add test that creating a task triggers persistence via `PUT /api/local-state`.
4. Run failing tests first.

### Task 2: Implement Local Server API Middleware

**Files:**
- Create: `server/localApiPlugin.ts`
- Modify: `vite.config.ts`

1. Implement `GET /api/local-state` and `PUT /api/local-state`.
2. Persist state to `local-data/kanban-state.json` (server-local file, gitignored).
3. Register middleware for both `configureServer` and `configurePreviewServer`.

### Task 3: Refactor Hook To Local API Persistence

**Files:**
- Modify: `src/hooks/useKanban.ts`

1. Remove Supabase import/queries from runtime hook path.
2. Load initial board/tasks/custom fields from `/api/local-state`.
3. Persist all changes (create/update/delete/move/custom-fields/reorder) through local API.
4. Preserve task `estimated_minutes` mapping and existing timer compatibility.

### Task 4: Remove Runtime Supabase Dependency In Local Mode UI

**Files:**
- Modify: `src/components/kanban/AiChatPanel.tsx`

1. Remove Supabase writes and Supabase function calls in local mode.
2. Keep panel UI functional with local responses/no network dependency.

### Task 5: Docs + Verification

**Files:**
- Modify: `README.md`

1. Document local-only storage model and file path.
2. Remove Supabase requirement from local branch runtime instructions.
3. Run `npm run test` and `npm run build`.
