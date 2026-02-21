import { useEffect, useMemo, useState } from 'react';
import { Plus, Sparkles, LayoutGrid, Loader2, Search, SlidersHorizontal } from 'lucide-react';
import { useKanban } from '@/hooks/useKanban';
import { KanbanColumn } from './KanbanColumn';
import { CompletedCalendarView } from './CompletedCalendarView';
import { TaskModal } from './TaskModal';
import { AiChatPanel } from './AiChatPanel';
import { TaskPomodoroOverlay } from './TaskPomodoroOverlay';
import { getCompletedTasksForDay, toDayKey } from './completedCalendar';
import { Task, TaskStatus, COLUMNS } from '@/types/kanban';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  TASK_GROUP_OPTIONS,
  TASK_SORT_OPTIONS,
  TaskGroup,
  TaskGroupBy,
  TaskSortBy,
  filterTasks,
  getDistinctTags,
  groupTasks,
  sortTasks,
} from './taskOrganization';

export function KanbanBoard() {
  const {
    board,
    tasks,
    loading,
    createTask,
    updateTask,
    deleteTask,
    moveTask,
  } = useKanban();

  const [taskModalOpen, setTaskModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [defaultStatus, setDefaultStatus] = useState<TaskStatus>('todo');
  const [aiPanelOpen, setAiPanelOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'board' | 'completed_calendar'>('board');
  const [activeTimerTaskId, setActiveTimerTaskId] = useState<string | null>(null);
  const [activeTimersByTaskId, setActiveTimersByTaskId] = useState<Record<string, number>>({});
  const [currentTimestamp, setCurrentTimestamp] = useState(() => Date.now());
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<TaskSortBy>('default');
  const [groupBy, setGroupBy] = useState<TaskGroupBy>('none');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      setCurrentTimestamp(Date.now());
    }, 60_000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, []);

  const handleAddTask = (status: TaskStatus) => {
    setEditingTask(null);
    setDefaultStatus(status);
    setTaskModalOpen(true);
  };

  const handleEditTask = (task: Task) => {
    setEditingTask(task);
    setTaskModalOpen(true);
  };

  const handleTaskClick = (task: Task) => {
    if (typeof task.estimated_minutes === 'number' && task.estimated_minutes > 0) {
      setActiveTimerTaskId(task.id);
      return;
    }
    handleEditTask(task);
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

  const todayDayKey = useMemo(() => toDayKey(new Date(currentTimestamp)), [currentTimestamp]);
  const completedTasks = useMemo(() => getCompletedTasksForDay(tasks, todayDayKey), [tasks, todayDayKey]);

  const baseTasksByColumn = useMemo<Record<TaskStatus, Task[]>>(() => ({
    todo: tasks.filter(task => task.status === 'todo'),
    in_progress: tasks.filter(task => task.status === 'in_progress'),
    completed: completedTasks,
  }), [completedTasks, tasks]);

  const availableTags = useMemo(
    () => getDistinctTags(Object.values(baseTasksByColumn).flat()),
    [baseTasksByColumn],
  );

  useEffect(() => {
    setSelectedTags(previous =>
      previous.filter(tag => availableTags.some(availableTag => availableTag === tag)),
    );
  }, [availableTags]);

  const organizedByColumn = useMemo<Record<TaskStatus, { tasks: Task[]; taskGroups?: TaskGroup[] }>>(() => {
    const organizeColumn = (columnTasks: Task[]) => {
      const filteredTasks = filterTasks(columnTasks, { query: searchQuery, selectedTags });
      const sortedTasks = sortTasks(filteredTasks, sortBy);

      if (groupBy === 'none') {
        return { tasks: sortedTasks };
      }

      return {
        tasks: sortedTasks,
        taskGroups: groupTasks(filteredTasks, groupBy, sortBy),
      };
    };

    return {
      todo: organizeColumn(baseTasksByColumn.todo),
      in_progress: organizeColumn(baseTasksByColumn.in_progress),
      completed: organizeColumn(baseTasksByColumn.completed),
    };
  }, [baseTasksByColumn, groupBy, searchQuery, selectedTags, sortBy]);

  const activeTimerTask = activeTimerTaskId ? tasks.find(t => t.id === activeTimerTaskId) || null : null;

  const toggleTagFilter = (tag: string, checked: boolean) => {
    setSelectedTags(previous => {
      if (checked) {
        return previous.includes(tag) ? previous : [...previous, tag];
      }
      return previous.filter(existingTag => existingTag !== tag);
    });
  };

  const appendNoteBullet = (description: string | null | undefined, note: string) => {
    const trimmedNote = note.trim();
    if (!trimmedNote) return description || '';

    const bulletLine = `• ${trimmedNote}`;
    if (!description?.trim()) {
      return bulletLine;
    }
    return `${description.trim()}\n${bulletLine}`;
  };

  const handleTimerStart = async (taskId: string) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task || task.status !== 'todo') return;
    await moveTask(taskId, 'in_progress');
  };

  const handleTimerAddNote = async (taskId: string, note: string) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;
    const nextDescription = appendNoteBullet(task.description, note);
    await updateTask(taskId, { description: nextDescription });
  };

  const handleTimerCompletionDecision = async (taskId: string, completed: boolean) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    if (completed) {
      if (task.status !== 'completed') {
        await moveTask(taskId, 'completed');
      }
      return;
    }

    if (task.status !== 'in_progress') {
      await moveTask(taskId, 'in_progress');
    }
  };

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
      className={`flex h-full min-h-0 flex-col transition-all duration-300 ${aiPanelOpen ? 'mr-[380px]' : ''}`}
    >
      {/* Header */}
      <header className="flex flex-col gap-3 px-4 sm:px-6 py-4 border-b border-border/50 shrink-0 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
            <LayoutGrid className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-foreground tracking-tight">
              Tasks to Complete
            </h1>
            <p className="text-xs text-muted-foreground">
              {tasks.length} task{tasks.length !== 1 ? 's' : ''} · {completedTasks.length} completed
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 sm:justify-end">
          {viewMode === 'board' && (
            <>
              <div className="relative w-[180px] sm:w-[240px]">
                <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={searchQuery}
                  onChange={event => setSearchQuery(event.target.value)}
                  placeholder="Search tasks..."
                  className="h-8 pl-8 text-xs"
                />
              </div>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 gap-2 border-border/70 bg-background text-xs"
                  >
                    <SlidersHorizontal className="h-3.5 w-3.5" />
                    Organize
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-64">
                  <DropdownMenuLabel>Sort by</DropdownMenuLabel>
                  <DropdownMenuRadioGroup value={sortBy} onValueChange={value => setSortBy(value as TaskSortBy)}>
                    {TASK_SORT_OPTIONS.map(option => (
                      <DropdownMenuRadioItem key={option.value} value={option.value}>
                        {option.label}
                      </DropdownMenuRadioItem>
                    ))}
                  </DropdownMenuRadioGroup>

                  <DropdownMenuSeparator />

                  <DropdownMenuLabel>Group by</DropdownMenuLabel>
                  <DropdownMenuRadioGroup value={groupBy} onValueChange={value => setGroupBy(value as TaskGroupBy)}>
                    {TASK_GROUP_OPTIONS.map(option => (
                      <DropdownMenuRadioItem key={option.value} value={option.value}>
                        {option.label}
                      </DropdownMenuRadioItem>
                    ))}
                  </DropdownMenuRadioGroup>

                  <DropdownMenuSeparator />

                  <DropdownMenuLabel>Tag filter</DropdownMenuLabel>
                  {availableTags.length > 0 ? (
                    availableTags.map(tag => (
                      <DropdownMenuCheckboxItem
                        key={tag}
                        checked={selectedTags.includes(tag)}
                        onCheckedChange={checked => toggleTagFilter(tag, checked === true)}
                        onSelect={event => event.preventDefault()}
                      >
                        {tag}
                      </DropdownMenuCheckboxItem>
                    ))
                  ) : (
                    <DropdownMenuItem disabled>No tags available</DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    disabled={selectedTags.length === 0}
                    onSelect={event => {
                      event.preventDefault();
                      setSelectedTags([]);
                    }}
                  >
                    Clear tag filters
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          )}

          <div className="inline-flex rounded-md border border-border/70 p-0.5 bg-background">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setViewMode('board')}
              className={`h-7 px-2.5 text-xs ${viewMode === 'board' ? 'bg-secondary text-foreground' : 'text-muted-foreground'}`}
            >
              Board
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setViewMode('completed_calendar')}
              className={`h-7 px-2.5 text-xs ${viewMode === 'completed_calendar' ? 'bg-secondary text-foreground' : 'text-muted-foreground'}`}
            >
              Completed Calendar
            </Button>
          </div>

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
      <main className="flex-1 overflow-x-auto px-4 sm:px-6 py-4 sm:py-6">
        {viewMode === 'board' ? (
          <div className="flex gap-6 min-w-max pb-6">
            {COLUMNS.map(column => (
              <KanbanColumn
                key={column.id}
                column={column}
                tasks={organizedByColumn[column.id].tasks}
                taskGroups={organizedByColumn[column.id].taskGroups}
                activeTimersByTaskId={activeTimersByTaskId}
                customFields={[]}
                onAddTask={handleAddTask}
                onTaskClick={handleTaskClick}
                onEditTask={handleEditTask}
                onDeleteTask={deleteTask}
                onMoveTask={moveTask}
                onDrop={handleDrop}
              />
            ))}
          </div>
        ) : (
          <CompletedCalendarView
            tasks={tasks}
            customFields={[]}
            activeTimersByTaskId={activeTimersByTaskId}
            onTaskClick={handleTaskClick}
            onEditTask={handleEditTask}
            onDeleteTask={deleteTask}
            onMoveTask={moveTask}
          />
        )}
      </main>

      {/* Modals */}
      <TaskModal
        open={taskModalOpen}
        onClose={() => { setTaskModalOpen(false); setEditingTask(null); }}
        onSave={handleSaveTask}
        task={editingTask}
        defaultStatus={defaultStatus}
        customFields={[]}
      />

      <TaskPomodoroOverlay
        open={!!activeTimerTask}
        task={activeTimerTask}
        onClose={() => setActiveTimerTaskId(null)}
        onStart={handleTimerStart}
        onAppendNote={handleTimerAddNote}
        onCompleteDecision={handleTimerCompletionDecision}
        onTimerElapsed={taskId => setActiveTimerTaskId(taskId)}
        onActiveTimersChange={setActiveTimersByTaskId}
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
