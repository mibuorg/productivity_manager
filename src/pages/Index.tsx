import { KanbanBoard } from '@/components/kanban/KanbanBoard';
import { PomodoroTimer } from '@/components/pomodoro/PomodoroTimer';
import { Toaster } from '@/components/ui/sonner';

const Index = () => {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="border-b">
        <div className="container mx-auto py-4 px-4 flex items-center justify-between">
          <h1 className="text-xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            Ethan's Productivity Manager
          </h1>
          <div className="flex items-center gap-4">
            {/* User auth status could go here */}
          </div>
        </div>
      </header>

      <main className="flex-1 flex flex-col lg:flex-row h-[calc(100vh-65px)] overflow-hidden">
        {/* Sidebar / Pomodoro Area */}
        <div className="w-full lg:w-80 border-r p-6 bg-card/50 overflow-y-auto">
          <div className="mb-8">
            <h2 className="text-lg font-semibold mb-4">Focus Timer</h2>
            <PomodoroTimer />
          </div>

          <div className="text-sm text-muted-foreground">
            <p>Welcome to your productivity hub.</p>
            <p className="mt-2">Drag tasks to update status.</p>
          </div>
        </div>

        {/* Main Kanban Area */}
        <div className="flex-1 overflow-hidden bg-secondary/10 relative">
          <KanbanBoard />
        </div>
      </main>
      <Toaster />
    </div>
  );
};

export default Index;
