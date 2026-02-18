# Pomodoro Architecture SOP

## Goal
Provide two timer experiences:
- A board-level focus timer with editable per-mode durations.
- Task-level Pomodoro overlays that can run independently per task.

## Focus Timer (`usePomodoro` + `PomodoroTimer`)
### State
- `mode`: `'work' | 'shortBreak' | 'longBreak'`
- `timeLeft`: seconds
- `isActive`: running flag
- `settings`: per-mode durations (seconds)
- `expectedEndTime`: wall-clock end timestamp for drift-safe ticking

### Persistence
- Runtime state keys:
  - `pomodoro_mode`
  - `pomodoro_timeLeft`
  - `pomodoro_isActive`
  - `pomodoro_expectedEndTime`
- Mode duration settings key:
  - `pomodoro_settings`

### Behavior
1. Timer display is clickable for the active mode; user can input minutes.
2. Enter/blur saves new duration for the active mode.
3. Saved durations persist across reloads and are used by mode switch/reset.
4. Tick logic uses wall-clock deltas from `expectedEndTime` to avoid interval drift.

## Task Overlay Timer (`TaskPomodoroOverlay`)
- Timer state is stored per task in `task_pomodoro_timers`.
- Multiple task timers can run in parallel.
- End-of-timer prompt lets user mark task complete or keep it in progress.

## UI Notes
- Focus timer mode switcher is constrained to sidebar width via a responsive segmented control.
- Compact labels are used on narrow widths; full labels are shown on wider widths.
