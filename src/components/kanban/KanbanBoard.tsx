import { useState } from 'react';
import { Plus, Settings2, Sparkles, Save, LayoutGrid, Loader2 } from 'lucide-react';
import { useKanban } from '@/hooks/useKanban';
import { KanbanColumn } from './KanbanColumn';
import { TaskModal } from './TaskModal';
import { CustomFieldsModal } from './CustomFieldsModal';
import { AiChatPanel } from './AiChatPanel';
import { Task, TaskStatus, COLUMNS } from '@/types/kanban';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

export function KanbanBoard() {
  const {
    board,
    tasks,
    customFields,
    loading,
    createTask,
    updateTask,
    deleteTask,
    moveTask,
    createCustomField,
    deleteCustomField,
  } = useKanban();

  const [taskModalOpen, setTaskModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [defaultStatus, setDefaultStatus] = useState<TaskStatus>('todo');
  const [customFieldsModalOpen, setCustomFieldsModalOpen] = useState(false);
  const [aiPanelOpen, setAiPanelOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const handleAddTask = (status: TaskStatus) => {
    setEditingTask(null);
    setDefaultStatus(status);
    setTaskModalOpen(true);
  };

  const handleEditTask = (task: Task) => {
    setEditingTask(task);
    setTaskModalOpen(true);
  };

  const handleSaveTask = async (taskData: Partial<Task>) => {
    if (editingTask) {
      await updateTask(editingTask.id, taskData);
    } else {
      await createTask({ ...taskData, status: defaultStatus });
    }
  };

  const handleDrop = async (taskId: string, newStatus: TaskStatus) => {
    const task = tasks.find(t => t.id === taskId);
    if (task && task.status !== newStatus) {
      await moveTask(taskId, newStatus);
    }
  };

  const handleSaveAll = async () => {
    setIsSaving(true);
    await new Promise(r => setTimeout(r, 500));
    setIsSaving(false);
    toast.success('All changes saved to database ✓');
  };

  const todoTasks = tasks.filter(t => t.status === 'todo').sort((a, b) => a.position - b.position);
  const inProgressTasks = tasks.filter(t => t.status === 'in_progress').sort((a, b) => a.position - b.position);
  const completedTasks = tasks.filter(t => t.status === 'completed').sort((a, b) => a.position - b.position);
  const tasksByColumn = { todo: todoTasks, in_progress: inProgressTasks, completed: completedTasks };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
            <Loader2 className="h-6 w-6 text-primary animate-spin" />
          </div>
          <p className="text-muted-foreground text-sm">Loading your board...</p>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`flex flex-col min-h-screen transition-all duration-300 ${aiPanelOpen ? 'mr-[380px]' : ''}`}
    >
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-4 border-b border-border/50 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
            <LayoutGrid className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-foreground tracking-tight">
              {board?.name || 'Kanban Board'}
            </h1>
            <p className="text-xs text-muted-foreground">
              {tasks.length} task{tasks.length !== 1 ? 's' : ''} · {completedTasks.length} completed
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCustomFieldsModalOpen(true)}
            className="border-border text-muted-foreground hover:text-foreground gap-2 h-8"
          >
            <Settings2 className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Fields</span>
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={handleSaveAll}
            disabled={isSaving}
            className="border-border text-muted-foreground hover:text-foreground gap-2 h-8"
          >
            {isSaving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
            <span className="hidden sm:inline">Save</span>
          </Button>

          <Button
            size="sm"
            onClick={() => handleAddTask('todo')}
            className="bg-primary text-primary-foreground hover:bg-primary/90 gap-2 h-8"
          >
            <Plus className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Add Task</span>
          </Button>

          <Button
            size="sm"
            onClick={() => setAiPanelOpen(!aiPanelOpen)}
            className={`gap-2 h-8 transition-all ${
              aiPanelOpen
                ? 'bg-primary/20 text-primary border border-primary/30 hover:bg-primary/30'
                : 'bg-secondary text-secondary-foreground hover:bg-muted border border-border'
            }`}
          >
            <Sparkles className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">AI</span>
          </Button>
        </div>
      </header>

      {/* Board */}
      <main className="flex-1 overflow-x-auto px-6 py-6">
        <div className="flex gap-6 min-w-max pb-6">
          {COLUMNS.map(column => (
            <KanbanColumn
              key={column.id}
              column={column}
              tasks={tasksByColumn[column.id]}
              customFields={customFields}
              onAddTask={handleAddTask}
              onEditTask={handleEditTask}
              onDeleteTask={deleteTask}
              onMoveTask={moveTask}
              onDrop={handleDrop}
            />
          ))}
        </div>
      </main>

      {/* Modals */}
      <TaskModal
        open={taskModalOpen}
        onClose={() => { setTaskModalOpen(false); setEditingTask(null); }}
        onSave={handleSaveTask}
        task={editingTask}
        defaultStatus={defaultStatus}
        customFields={customFields}
      />

      <CustomFieldsModal
        open={customFieldsModalOpen}
        onClose={() => setCustomFieldsModalOpen(false)}
        customFields={customFields}
        onCreateField={createCustomField}
        onDeleteField={deleteCustomField}
        boardId={board?.id || ''}
      />

      {/* AI Panel */}
      <AiChatPanel
        open={aiPanelOpen}
        onClose={() => setAiPanelOpen(false)}
        board={board}
        tasks={tasks}
        onTaskCreate={(taskData) => createTask({ ...taskData, status: taskData.status || 'todo' })}
      />
    </div>
  );
}
