import { useCallback, useEffect, useRef, useState } from 'react';
import { Plus } from 'lucide-react';
import { Task, Column, CustomFieldDefinition, TaskStatus } from '@/types/kanban';
import { TaskCard } from './TaskCard';
import { Button } from '@/components/ui/button';

interface KanbanColumnProps {
  column: Column;
  tasks: Task[];
  activeTimersByTaskId: Record<string, number>;
  customFields: CustomFieldDefinition[];
  onAddTask: (status: TaskStatus) => void;
  onTaskClick: (task: Task) => void;
  onEditTask: (task: Task) => void;
  onDeleteTask: (taskId: string) => void;
  onMoveTask: (taskId: string, status: TaskStatus) => void;
  onDrop: (taskId: string, newStatus: TaskStatus) => void;
}

export function KanbanColumn({
  column,
  tasks,
  activeTimersByTaskId,
  customFields,
  onAddTask,
  onTaskClick,
  onEditTask,
  onDeleteTask,
  onMoveTask,
  onDrop,
}: KanbanColumnProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [isTouchDevice, setIsTouchDevice] = useState(false);
  const dragCountRef = useRef(0);

  const resetDragState = useCallback(() => {
    dragCountRef.current = 0;
    setIsDragOver(false);
    setDraggingId(null);
  }, []);

  useEffect(() => {
    setIsTouchDevice(window.matchMedia('(pointer: coarse)').matches);
  }, []);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        resetDragState();
      }
    };

    window.addEventListener('dragend', resetDragState);
    window.addEventListener('drop', resetDragState);
    window.addEventListener('blur', resetDragState);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('dragend', resetDragState);
      window.removeEventListener('drop', resetDragState);
      window.removeEventListener('blur', resetDragState);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [resetDragState]);

  const handleDragStart = (e: React.DragEvent, taskId: string) => {
    e.dataTransfer.setData('taskId', taskId);
    e.dataTransfer.effectAllowed = 'move';
    setDraggingId(taskId);
  };

  const handleDragEnd = () => {
    resetDragState();
  };

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    dragCountRef.current++;
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    dragCountRef.current--;
    if (dragCountRef.current === 0) setIsDragOver(false);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    resetDragState();
    const taskId = e.dataTransfer.getData('taskId');
    if (taskId) onDrop(taskId, column.id);
  };

  return (
    <div className="flex flex-col min-w-[85vw] sm:min-w-[300px] max-w-[92vw] sm:max-w-[340px] flex-1">
      {/* Column Header */}
      <div
        className="flex items-center justify-between mb-4 px-1"
      >
        <div className="flex items-center gap-3">
          <div
            className="flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-semibold"
            style={{
              background: `${column.glowColor}`,
              border: `1px solid ${column.color}40`,
            }}
          >
            <span className="w-2 h-2 rounded-full" style={{ background: column.color }} />
            <span style={{ color: column.color }}>{column.title}</span>
          </div>
          <span
            className="text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center"
            style={{ background: `${column.color}20`, color: column.color }}
          >
            {tasks.length}
          </span>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onAddTask(column.id)}
          className="h-7 w-7 rounded-full hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>

      {/* Drop Zone */}
      <div
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        className={`
          flex-1 rounded-xl p-2 min-h-[200px] max-h-[58vh] sm:max-h-[calc(100dvh-220px)] touch-pan-y
          transition-all duration-200 scrollbar-thin overflow-y-auto
          ${isDragOver
            ? 'bg-secondary/60 border border-dashed'
            : 'bg-transparent border border-transparent'
          }
        `}
        style={{
          borderColor: isDragOver ? column.color + '60' : undefined,
          boxShadow: isDragOver ? `inset 0 0 20px ${column.glowColor}` : undefined,
        }}
      >
        <div className="flex flex-col gap-3">
          {tasks.map(task => (
            <div
              key={task.id}
              draggable={!isTouchDevice}
              onDragStart={e => handleDragStart(e, task.id)}
              onDragEnd={handleDragEnd}
            >
              <TaskCard
                task={task}
                activeTimerSeconds={activeTimersByTaskId[task.id]}
                customFields={customFields}
                onCardClick={onTaskClick}
                onEdit={onEditTask}
                onDelete={onDeleteTask}
                onMove={onMoveTask}
                isDragging={draggingId === task.id}
              />
            </div>
          ))}

          {/* Empty state */}
          {tasks.length === 0 && !isDragOver && (
            <div
              className="flex flex-col items-center justify-center py-12 text-center cursor-pointer group"
              onClick={() => onAddTask(column.id)}
            >
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center mb-3 group-hover:scale-110 transition-transform"
                style={{ background: column.glowColor, border: `1px dashed ${column.color}40` }}
              >
                <Plus className="h-5 w-5" style={{ color: column.color }} />
              </div>
              <p className="text-xs text-muted-foreground">Drop a card or click to add</p>
            </div>
          )}

          {/* Drop indicator */}
          {isDragOver && (
            <div
              className="h-16 rounded-lg border-2 border-dashed flex items-center justify-center"
              style={{ borderColor: column.color + '60', background: column.glowColor }}
            >
              <p className="text-xs font-medium" style={{ color: column.color }}>Drop here</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
