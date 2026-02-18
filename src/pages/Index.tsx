import { KanbanBoard } from '@/components/kanban/KanbanBoard';
import { PomodoroTimer } from '@/components/pomodoro/PomodoroTimer';
import { Toaster } from '@/components/ui/sonner';
import { Loader2, LockKeyhole } from 'lucide-react';
import { AccountMenu } from '@/components/auth/AccountMenu';
import { useAuth } from '@/hooks/useAuth';

const Index = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-[100dvh] bg-background flex items-center justify-center">
        <div className="flex items-center gap-3 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span>Loading session...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] bg-background flex flex-col">
      <header className="border-b">
        <div className="container mx-auto py-4 px-4 flex items-center justify-between">
          <h1 className="text-xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            Ethan's Productivity Manager
          </h1>
          <AccountMenu />
        </div>
      </header>

      {user ? (
        <main className="flex-1 flex min-h-0 flex-col lg:flex-row lg:h-[calc(100dvh-65px)] overflow-hidden">
          <div className="w-full lg:w-80 border-b lg:border-b-0 lg:border-r p-4 sm:p-6 bg-card/50 overflow-y-auto">
            <div className="mb-8">
              <h2 className="text-lg font-semibold mb-4">Focus Timer</h2>
              <PomodoroTimer />
            </div>

            <div className="text-sm text-muted-foreground">
              <p>Welcome to your productivity hub.</p>
              <p className="mt-2">Drag tasks to update status.</p>
            </div>
          </div>

          <div className="flex-1 min-h-0 overflow-hidden bg-secondary/10 relative">
            <KanbanBoard />
          </div>
        </main>
      ) : (
        <main className="flex-1 flex items-center justify-center px-4">
          <div className="max-w-md w-full rounded-xl border border-border/60 bg-card/60 backdrop-blur-sm p-6 text-center">
            <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
              <LockKeyhole className="h-6 w-6 text-primary" />
            </div>
            <h2 className="text-lg font-semibold">Sign in to access your tasks</h2>
            <p className="text-sm text-muted-foreground mt-2">
              Use the <span className="font-medium text-foreground">Account</span> menu in the top-right corner to
              log in or create an account.
            </p>
          </div>
        </main>
      )}
      <Toaster />
    </div>
  );
};

export default Index;
