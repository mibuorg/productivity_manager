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
}: TaskPomodoroOverlayProps) {
  const initialSeconds = useMemo(() => {
    const minutes = task?.estimated_minutes && task.estimated_minutes > 0 ? task.estimated_minutes : 25;
    return minutes * 60;
  }, [task?.estimated_minutes]);

  const scenicBackground = useMemo(() => {
    if (!task) return SCENIC_BACKGROUNDS[0];
    return SCENIC_BACKGROUNDS[hashString(task.id) % SCENIC_BACKGROUNDS.length];
  }, [task]);
  const showHours = initialSeconds > 3600;

  const [timeLeft, setTimeLeft] = useState(initialSeconds);
  const [isRunning, setIsRunning] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);
  const [noteInput, setNoteInput] = useState('');
  const [isCompletionPromptOpen, setIsCompletionPromptOpen] = useState(false);

  useEffect(() => {
    if (!open || !task) return;
    setTimeLeft(initialSeconds);
    setIsRunning(false);
    setHasStarted(false);
    setNoteInput('');
    setIsCompletionPromptOpen(false);
  }, [open, task?.id, initialSeconds, task]);

  useEffect(() => {
    if (!open || !isRunning) return;
    if (timeLeft <= 0) return;

    const timer = window.setInterval(() => {
      setTimeLeft(prev => Math.max(0, prev - 1));
    }, 1000);

    return () => window.clearInterval(timer);
  }, [open, isRunning, timeLeft]);

  useEffect(() => {
    if (!open || !isRunning || timeLeft > 0) return;
    setIsRunning(false);
    setIsCompletionPromptOpen(true);
  }, [open, isRunning, timeLeft]);

  if (!task) return null;

  const handleToggleTimer = () => {
    if (!isRunning && !hasStarted) {
      setHasStarted(true);
      setIsRunning(true);
      void onStart(task.id);
      return;
    }
    setIsRunning(prev => !prev);
  };

  const handleReset = () => {
    setIsRunning(false);
    setHasStarted(false);
    setTimeLeft(initialSeconds);
  };

  const handleAddNote = async () => {
    const trimmed = noteInput.trim();
    if (!trimmed) return;
    await onAppendNote(task.id, trimmed);
    setNoteInput('');
  };

  const handleCompletionChoice = async (completed: boolean) => {
    await onCompleteDecision(task.id, completed);
    setIsCompletionPromptOpen(false);
    setTimeLeft(initialSeconds);
    setHasStarted(false);
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
                    {formatTime(timeLeft, showHours)}
                  </p>
                  <p className="text-3xl mt-3 font-semibold text-white/95">Time to focus.</p>
                  <div className="mt-8 flex items-center gap-3">
                    <Button
                      className="rounded-full px-10 bg-white/12 border border-white/50 text-white hover:bg-white/20"
                      onClick={handleToggleTimer}
                    >
                      {isRunning ? (
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

      <Dialog open={isCompletionPromptOpen} onOpenChange={setIsCompletionPromptOpen}>
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
