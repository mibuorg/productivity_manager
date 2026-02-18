# Local Root/Home Artifacts

This document explains project-related files that can appear outside the repository directory and how to handle them safely.

## What was checked

- `~/.config/superpowers/worktrees/productivity_manager/`
- `~/Downloads/productivity_manager-main.zip`
- tool state under `~/.gemini` and `~/.codex`

## Findings

1. `~/.config/superpowers/worktrees/productivity_manager/` was **not present**.
2. `~/Downloads/productivity_manager-main.zip` existed and was project-related. It was moved into repo-private storage and then deleted at user request.
3. Project references also exist under global tool state folders:
   - `~/.gemini/antigravity/code_tracker/active/...`
   - `~/.codex/sessions/...`

## Why those global files are there

- `~/.gemini/...` holds Gemini/Antigravity code-tracker and workspace memory data.
- `~/.codex/...` holds Codex session/history artifacts.

These are tool-managed global stores by design and are not part of this repository.

## Should these global files be moved into the repo?

No. Moving them would likely break tool behavior because those tools resolve fixed global paths.

## Repo policy

- Keep tool-managed global state in home directories.
- Keep project-local private artifacts in `.private-data/` (gitignored).
- `.gitignore` explicitly covers `.private-data/home-root-artifacts/` for manual relocations when needed.
