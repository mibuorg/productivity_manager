# Pomodoro Architecture SOP

## Goal
Provide two timer experiences:
- A board-level single-mode break timer with editable duration.
- Task-level Pomodoro overlays that can run independently per task.

## Focus Timer (`usePomodoro` + `PomodoroTimer`)
### State
- `timeLeft`: seconds
- `isActive`: running flag
- `durationSeconds`: preferred break duration (seconds)
- `expectedEndTime`: wall-clock end timestamp for drift-safe ticking

### Persistence
- Runtime state keys:
  - `pomodoro_timeLeft`
  - `pomodoro_isActive`
  - `pomodoro_expectedEndTime`
- Break duration settings key:
  - `pomodoro_settings`

### Behavior
1. Header is static (`Break`) with no mode switching.
2. Timer display is clickable; user can input break minutes.
3. Enter/blur saves break duration preference.
4. Saved duration persists across reloads and is used by reset.
4. Tick logic uses wall-clock deltas from `expectedEndTime` to avoid interval drift.

## Task Overlay Timer (`TaskPomodoroOverlay`)
- Timer state is stored per task in `task_pomodoro_timers`.
- Multiple task timers can run in parallel.
- End-of-timer prompt lets user mark task complete or keep it in progress.

## UI Notes
- Focus timer uses a static break header in the sidebar.
- Editable timer input remains keyboard-accessible.
