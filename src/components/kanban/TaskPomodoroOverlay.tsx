import { useEffect, useMemo, useState } from 'react';
import { Pause, Play, RotateCcw, X } from 'lucide-react';
import { Task } from '@/types/kanban';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface TaskPomodoroOverlayProps {
  open: boolean;
  task: Task | null;
  onClose: () => void;
  onStart: (taskId: string) => Promise<void> | void;
  onAppendNote: (taskId: string, note: string) => Promise<void> | void;
  onCompleteDecision: (taskId: string, completed: boolean) => Promise<void> | void;
  onTimerElapsed?: (taskId: string) => void;
  onActiveTimersChange?: (activeTimersByTaskId: Record<string, number>) => void;
}

const SCENIC_BACKGROUNDS = [
  'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=1800&q=80',
  'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1800&q=80',
  'https://images.unsplash.com/photo-1472396961693-142e6e269027?auto=format&fit=crop&w=1800&q=80',
];

const hashString = (value: string) => {
  let hash = 0;
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash << 5) - hash + value.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
};

const TIMER_STORAGE_KEY = 'task_pomodoro_timers';
const DEFAULT_TIMER_MINUTES = 25;

interface TaskTimerState {
  initialSeconds: number;
  timeLeft: number;
  isRunning: boolean;
  hasStarted: boolean;
  expectedEndTime: number | null;
  isCompletionPromptOpen: boolean;
}

type TaskTimersMap = Record<string, TaskTimerState>;

const getTaskInitialSeconds = (task: Task | null) => {
  const minutes = task?.estimated_minutes && task.estimated_minutes > 0 ? task.estimated_minutes : DEFAULT_TIMER_MINUTES;
  return minutes * 60;
};

const createDefaultTaskTimer = (initialSeconds: number): TaskTimerState => ({
  initialSeconds,
  timeLeft: initialSeconds,
  isRunning: false,
  hasStarted: false,
  expectedEndTime: null,
  isCompletionPromptOpen: false,
});

const getBrowserStorage = () => {
  if (typeof window === 'undefined') return null;
  const storage = window.localStorage as Partial<Storage> | undefined;
  if (!storage || typeof storage.getItem !== 'function' || typeof storage.setItem !== 'function') {
    return null;
  }
  return storage as Storage;
};

const loadTimersFromStorage = (): TaskTimersMap => {
  const storage = getBrowserStorage();
  if (!storage) return {};

  try {
    const raw = storage.getItem(TIMER_STORAGE_KEY);
    if (!raw) return {};

    const parsed = JSON.parse(raw) as TaskTimersMap;
    if (!parsed || typeof parsed !== 'object') return {};

    const now = Date.now();
    const loaded: TaskTimersMap = {};

    Object.entries(parsed).forEach(([taskId, timer]) => {
      if (!timer || typeof timer !== 'object') return;

      const initialSeconds =
        typeof timer.initialSeconds === 'number' && timer.initialSeconds > 0
          ? timer.initialSeconds
          : DEFAULT_TIMER_MINUTES * 60;

      const parsedTimeLeft =
        typeof timer.timeLeft === 'number' && Number.isFinite(timer.timeLeft) && timer.timeLeft >= 0
          ? timer.timeLeft
          : initialSeconds;

      const isRunning = Boolean(timer.isRunning);
      const hasStarted = Boolean(timer.hasStarted);
      const expectedEndTime =
        typeof timer.expectedEndTime === 'number' && Number.isFinite(timer.expectedEndTime)
          ? timer.expectedEndTime
          : null;

      if (isRunning && expectedEndTime) {
        const remaining = Math.max(0, Math.floor((expectedEndTime - now) / 1000));
        loaded[taskId] = {
          initialSeconds,
          timeLeft: remaining,
          isRunning: remaining > 0,
          hasStarted: hasStarted || remaining > 0,
          expectedEndTime: remaining > 0 ? expectedEndTime : null,
          isCompletionPromptOpen: remaining === 0 ? true : Boolean(timer.isCompletionPromptOpen),
        };
        return;
      }

      loaded[taskId] = {
        initialSeconds,
        timeLeft: Math.max(0, parsedTimeLeft),
        isRunning: false,
        hasStarted,
        expectedEndTime: null,
        isCompletionPromptOpen: Boolean(timer.isCompletionPromptOpen),
      };
    });

    return loaded;
  } catch (error) {
    console.error('Failed to load pomodoro timers from storage', error);
    return {};
  }
};

const formatTime = (seconds: number, showHours: boolean) => {
  if (showHours) {
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }

  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

export function TaskPomodoroOverlay({
  open,
  task,
  onClose,
  onStart,
  onAppendNote,
  onCompleteDecision,
  onTimerElapsed,
  onActiveTimersChange,
}: TaskPomodoroOverlayProps) {
  const initialSeconds = useMemo(() => getTaskInitialSeconds(task), [task?.estimated_minutes]);

  const scenicBackground = useMemo(() => {
    if (!task) return SCENIC_BACKGROUNDS[0];
    return SCENIC_BACKGROUNDS[hashString(task.id) % SCENIC_BACKGROUNDS.length];
  }, [task]);
  const [timersByTaskId, setTimersByTaskId] = useState<TaskTimersMap>(() => loadTimersFromStorage());
  const [noteInput, setNoteInput] = useState('');

  const activeTaskTimer = task ? timersByTaskId[task.id] : null;
  const resolvedTimer = activeTaskTimer || createDefaultTaskTimer(initialSeconds);
  const showHours = resolvedTimer.initialSeconds > 3600;

  useEffect(() => {
    if (!task) return;

    setTimersByTaskId(prev => {
      const existing = prev[task.id];
      if (!existing) {
        return { ...prev, [task.id]: createDefaultTaskTimer(initialSeconds) };
      }

      if (existing.initialSeconds === initialSeconds) {
        return prev;
      }

      if (!existing.hasStarted) {
        return {
          ...prev,
          [task.id]: {
            ...existing,
            initialSeconds,
            timeLeft: initialSeconds,
          },
        };
      }

      return {
        ...prev,
        [task.id]: {
          ...existing,
          initialSeconds,
        },
      };
    });
  }, [task?.id, task?.estimated_minutes, initialSeconds]);

  useEffect(() => {
    const timer = window.setInterval(() => {
      const now = Date.now();
      const elapsedTaskIds: string[] = [];

      setTimersByTaskId(prev => {
        let changed = false;
        const next: TaskTimersMap = { ...prev };

        Object.entries(prev).forEach(([taskId, timerState]) => {
          if (!timerState.isRunning) return;

          const expectedEndTime = timerState.expectedEndTime ?? now + timerState.timeLeft * 1000;
          const remaining = Math.max(0, Math.floor((expectedEndTime - now) / 1000));

          if (remaining === 0) {
            changed = true;
            next[taskId] = {
              ...timerState,
              timeLeft: 0,
              isRunning: false,
              expectedEndTime: null,
              hasStarted: true,
              isCompletionPromptOpen: true,
            };
            if (!timerState.isCompletionPromptOpen) {
              elapsedTaskIds.push(taskId);
            }
            return;
          }

          if (remaining !== timerState.timeLeft || expectedEndTime !== timerState.expectedEndTime) {
            changed = true;
            next[taskId] = {
              ...timerState,
              timeLeft: remaining,
              expectedEndTime,
            };
          }
        });

        return changed ? next : prev;
      });

      if (elapsedTaskIds.length > 0 && onTimerElapsed) {
        onTimerElapsed(elapsedTaskIds[0]);
      }
    }, 1000);

    return () => window.clearInterval(timer);
  }, [onTimerElapsed]);

  useEffect(() => {
    const storage = getBrowserStorage();
    if (!storage) return;

    try {
      storage.setItem(TIMER_STORAGE_KEY, JSON.stringify(timersByTaskId));
    } catch (error) {
      console.error('Failed to persist pomodoro timers', error);
    }
  }, [timersByTaskId]);

  useEffect(() => {
    if (!onActiveTimersChange) return;
    const activeTimers = Object.entries(timersByTaskId).reduce<Record<string, number>>((acc, [taskId, timer]) => {
      if (timer.isRunning && timer.timeLeft > 0) {
        acc[taskId] = timer.timeLeft;
      }
      return acc;
    }, {});
    onActiveTimersChange(activeTimers);
  }, [timersByTaskId, onActiveTimersChange]);

  useEffect(() => {
    if (!open) return;
    setNoteInput('');
  }, [open, task?.id]);

  if (!task) return null;

  const handleToggleTimer = () => {
    let isFirstStart = false;

    setTimersByTaskId(prev => {
      const existing = prev[task.id] || createDefaultTaskTimer(initialSeconds);

      if (!existing.hasStarted) {
        isFirstStart = true;
        return {
          ...prev,
          [task.id]: {
            ...existing,
            hasStarted: true,
            isRunning: true,
            expectedEndTime: Date.now() + existing.timeLeft * 1000,
            isCompletionPromptOpen: false,
          },
        };
      }

      if (existing.isRunning) {
        const remaining = existing.expectedEndTime
          ? Math.max(0, Math.floor((existing.expectedEndTime - Date.now()) / 1000))
          : existing.timeLeft;

        return {
          ...prev,
          [task.id]: {
            ...existing,
            timeLeft: remaining,
            isRunning: false,
            expectedEndTime: null,
          },
        };
      }

      return {
        ...prev,
        [task.id]: {
          ...existing,
          isRunning: true,
          expectedEndTime: Date.now() + existing.timeLeft * 1000,
        },
      };
    });

    if (isFirstStart) {
      void onStart(task.id);
    }
  };

  const handleReset = () => {
    setTimersByTaskId(prev => {
      const existing = prev[task.id] || createDefaultTaskTimer(initialSeconds);
      return {
        ...prev,
        [task.id]: {
          ...existing,
          initialSeconds,
          timeLeft: initialSeconds,
          isRunning: false,
          hasStarted: false,
          expectedEndTime: null,
          isCompletionPromptOpen: false,
        },
      };
    });
  };

  const handleAddNote = async () => {
    const trimmed = noteInput.trim();
    if (!trimmed) return;
    await onAppendNote(task.id, trimmed);
    setNoteInput('');
  };

  const handleCompletionChoice = async (completed: boolean) => {
    await onCompleteDecision(task.id, completed);

    setTimersByTaskId(prev => {
      const existing = prev[task.id] || createDefaultTaskTimer(initialSeconds);
      return {
        ...prev,
        [task.id]: {
          ...existing,
          timeLeft: existing.initialSeconds,
          isRunning: false,
          hasStarted: false,
          expectedEndTime: null,
          isCompletionPromptOpen: false,
        },
      };
    });

    if (completed) {
      onClose();
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={nextOpen => !nextOpen && onClose()}>
        <DialogContent className="max-w-[min(95vw,1100px)] p-0 border-white/20 bg-transparent shadow-2xl overflow-hidden">
          <DialogHeader className="sr-only">
            <DialogTitle>Task Pomodoro</DialogTitle>
            <DialogDescription>Focused timer for the selected task.</DialogDescription>
          </DialogHeader>

          <div className="relative min-h-[75vh] w-full rounded-xl overflow-hidden">
            <div
              className="absolute inset-0 bg-cover bg-center"
              style={{
                backgroundImage: `linear-gradient(hsl(222 30% 6% / 0.34), hsl(222 30% 6% / 0.58)), url(${scenicBackground})`,
              }}
            />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,hsl(0_0%_100%_/_0.22)_0%,transparent_65%)]" />

            <div className="relative z-10 flex min-h-[75vh] flex-col text-white">
              <div className="flex items-center justify-between px-8 py-6">
                <div>
                  <p className="text-xs uppercase tracking-[0.24em] text-white/70">Task Focus</p>
                  <h2 className="text-2xl font-semibold mt-2">{task.title}</h2>
                </div>
                <Button
                  variant="ghost"
                  className="text-white hover:bg-white/15 hover:text-white"
                  onClick={onClose}
                  aria-label="Close timer"
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>

              <div className="flex-1 flex items-center justify-center px-6">
                <div className="w-[min(72vw,540px)] aspect-square rounded-full border border-white/45 flex flex-col items-center justify-center bg-black/10 backdrop-blur-[1px]">
                  <p className="text-xs uppercase tracking-[0.3em] text-white/70">Focus</p>
                  <p className="text-[clamp(4rem,14vw,10rem)] leading-none font-light tabular-nums mt-2">
                    {formatTime(resolvedTimer.timeLeft, showHours)}
                  </p>
                  <p className="text-3xl mt-3 font-semibold text-white/95">Time to focus.</p>
                  <div className="mt-8 flex items-center gap-3">
                    <Button
                      className="rounded-full px-10 bg-white/12 border border-white/50 text-white hover:bg-white/20"
                      onClick={handleToggleTimer}
                    >
                      {resolvedTimer.isRunning ? (
                        <>
                          <Pause className="h-4 w-4 mr-2" />
                          Pause
                        </>
                      ) : (
                        <>
                          <Play className="h-4 w-4 mr-2" />
                          Start
                        </>
                      )}
                    </Button>
                    <Button
                      className="rounded-full border border-emerald-300/60 bg-emerald-500/20 text-white hover:bg-emerald-500/30"
                      onClick={() => void handleCompletionChoice(true)}
                    >
                      Task Completed
                    </Button>
                    <Button
                      variant="ghost"
                      className="rounded-full border border-white/40 text-white hover:bg-white/15"
                      onClick={handleReset}
                    >
                      <RotateCcw className="h-4 w-4 mr-2" />
                      Reset
                    </Button>
                  </div>
                </div>
              </div>

              <div className="pb-10 px-8 flex justify-center">
                <div className="w-full max-w-2xl text-center">
                  <p className="text-xs uppercase tracking-[0.28em] text-white/75">Today</p>
                  <p className="text-4xl font-medium mt-2">Add a quick task note</p>
                  <div className="mt-5 flex gap-3">
                    <Input
                      value={noteInput}
                      onChange={e => setNoteInput(e.target.value)}
                      placeholder="Add a note to this task..."
                      className="bg-black/25 border-white/40 text-white placeholder:text-white/70"
                      onKeyDown={e => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          void handleAddNote();
                        }
                      }}
                    />
                    <Button
                      onClick={handleAddNote}
                      className="bg-white/20 border border-white/50 text-white hover:bg-white/30"
                    >
                      Add Note
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog
        open={resolvedTimer.isCompletionPromptOpen}
        onOpenChange={nextOpen => {
          if (nextOpen) return;
          setTimersByTaskId(prev => {
            const existing = prev[task.id];
            if (!existing || !existing.isCompletionPromptOpen) return prev;
            return {
              ...prev,
              [task.id]: {
                ...existing,
                isCompletionPromptOpen: false,
              },
            };
          });
        }}
      >
        <DialogContent className="bg-card border-border max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-foreground font-display">Did you complete this task?</DialogTitle>
            <DialogDescription>
              Choose what to do with <span className="font-medium text-foreground">{task.title}</span>.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2 pt-2 border-t border-border">
            <Button
              variant="ghost"
              onClick={() => void handleCompletionChoice(false)}
              className="text-muted-foreground"
            >
              Not yet
            </Button>
            <Button
              onClick={() => void handleCompletionChoice(true)}
              className="bg-primary text-primary-foreground hover:bg-primary/90 glow-primary"
            >
              Completed
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
