import { useMemo } from 'react';
import { Task, CustomFieldDefinition, TaskStatus } from '@/types/kanban';
import { TaskCard } from './TaskCard';
import { buildDayKeys, groupCompletedTasksByDay } from './completedCalendar';

interface CompletedCalendarViewProps {
  tasks: Task[];
  customFields: CustomFieldDefinition[];
  activeTimersByTaskId: Record<string, number>;
  onTaskClick: (task: Task) => void;
  onEditTask: (task: Task) => void;
  onDeleteTask: (taskId: string) => void;
  onMoveTask: (taskId: string, status: TaskStatus) => void;
  now?: Date;
}

const formatDayLabel = (dayKey: string): string => {
  const [year, month, day] = dayKey.split('-').map(Number);
  const localDate = new Date(year, month - 1, day, 12, 0, 0);
  return localDate.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
};

export function CompletedCalendarView({
  tasks,
  customFields,
  activeTimersByTaskId,
  onTaskClick,
  onEditTask,
  onDeleteTask,
  onMoveTask,
  now,
}: CompletedCalendarViewProps) {
  const nowTimestamp = now ? now.getTime() : Date.now();

  const dayKeys = useMemo(() => buildDayKeys(new Date(nowTimestamp), 7), [nowTimestamp]);
  const groupedTasks = useMemo(() => groupCompletedTasksByDay(tasks, dayKeys), [tasks, dayKeys]);

  return (
    <div className="flex gap-6 min-w-max pb-6">
      {dayKeys.map(dayKey => {
        const dayTasks = groupedTasks[dayKey] || [];

        return (
          <section
            key={dayKey}
            data-testid={`completed-calendar-day-${dayKey}`}
            className="flex flex-col min-w-[85vw] sm:min-w-[300px] max-w-[92vw] sm:max-w-[340px] flex-1"
            aria-label={`Completed tasks for ${formatDayLabel(dayKey)}`}
          >
            <div className="flex items-center justify-between mb-4 px-1">
              <h2 className="text-sm font-semibold text-foreground">{formatDayLabel(dayKey)}</h2>
              <span className="text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center bg-primary/15 text-primary">
                {dayTasks.length}
              </span>
            </div>

            <div className="flex-1 rounded-xl p-2 min-h-[200px] max-h-[58vh] sm:max-h-[calc(100dvh-220px)] overflow-y-auto border border-border/40 bg-transparent">
              <div className="flex flex-col gap-3">
                {dayTasks.map(task => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    activeTimerSeconds={activeTimersByTaskId[task.id]}
                    customFields={customFields}
                    onCardClick={onTaskClick}
                    onEdit={onEditTask}
                    onDelete={onDeleteTask}
                    onMove={onMoveTask}
                  />
                ))}

                {dayTasks.length === 0 && (
                  <div className="flex items-center justify-center py-12 text-center">
                    <p className="text-xs text-muted-foreground">No completed tasks</p>
                  </div>
                )}
              </div>
            </div>
          </section>
        );
      })}
    </div>
  );
}
