# Pomodoro Architecture SOP

## Goal
Implement a Pomodoro timer that persists across reloads and syncs completions to tasks.

## State Management
- `timeLeft`: integer (seconds)
- `isActive`: boolean
- `mode`: string ('work' | 'shortBreak' | 'longBreak')
- `taskId`: uuid (optional, if tracking time for a specific task)

## Persistence Logic
1.  **Start**: Save `startTime` and `expectedEndTime` to `localStorage`.
2.  **Tick**: `timeLeft = expectedEndTime - now()`.
3.  **Pause**: Save `timeLeft` to `localStorage`. Clear `startTime`.
4.  **Resume**: Calculate new `expectedEndTime = now() + timeLeft` from storage.
5.  **Complete**:
    -   Play sound.
    -   If `taskId` exists, increment `pomodoros_completed` in Supabase.
    -   Update `mode` (auto-switch to break?).

## Edge Cases
- **Tab Close**: Timer continues running "in background" via `expectedEndTime` check on reopen.
- **Multiple Tabs**: `localStorage` event listener ensures sync.
