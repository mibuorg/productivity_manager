import { useState } from 'react';
import { Calendar, User, MoreHorizontal, Trash2, Edit3, ArrowRight, ChevronLeft, ChevronRight, Clock } from 'lucide-react';
import { Task, PRIORITY_CONFIG, TaskStatus, CustomFieldDefinition, COLUMNS } from '@/types/kanban';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
} from '@/components/ui/dropdown-menu';

interface TaskCardProps {
  task: Task;
  customFields: CustomFieldDefinition[];
  onEdit: (task: Task) => void;
  onDelete: (taskId: string) => void;
  onMove: (taskId: string, status: TaskStatus) => void;
  onCardClick?: (task: Task) => void;
  isDragging?: boolean;
  activeTimerSeconds?: number;
}

const formatActiveTimer = (seconds: number) => {
  if (seconds > 3600) {
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }

  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

const pad2 = (value: number) => value.toString().padStart(2, '0');

const toDayKey = (year: number, month: number, day: number) => (
  `${year}-${pad2(month)}-${pad2(day)}`
);

const parseDueDateParts = (dateStr: string | null) => {
  if (!dateStr) return null;

  const dateOnlyMatch = dateStr.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (dateOnlyMatch) {
    return {
      year: Number.parseInt(dateOnlyMatch[1], 10),
      month: Number.parseInt(dateOnlyMatch[2], 10),
      day: Number.parseInt(dateOnlyMatch[3], 10),
    };
  }

  const parsed = new Date(dateStr);
  if (Number.isNaN(parsed.getTime())) return null;

  return {
    year: parsed.getFullYear(),
    month: parsed.getMonth() + 1,
    day: parsed.getDate(),
  };
};

const formatScheduledTime = (value: string | null | undefined): string | null => {
  if (typeof value !== 'string') return null;
  const normalized = value.trim();
  if (!normalized) return null;

  const timeMatch = normalized.match(/^([01]\d|2[0-3]):([0-5]\d)(?::[0-5]\d)?$/);
  if (timeMatch) {
    const hours = Number.parseInt(timeMatch[1], 10);
    const mins = timeMatch[2];
    const suffix = hours >= 12 ? 'PM' : 'AM';
    const displayHours = ((hours + 11) % 12) + 1;
    return `${displayHours}:${mins} ${suffix}`;
  }

  const parsed = new Date(normalized);
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
};

export function TaskCard({
  task,
  customFields,
  onEdit,
  onDelete,
  onMove,
  onCardClick,
  isDragging,
  activeTimerSeconds,
}: TaskCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const priority = PRIORITY_CONFIG[task.priority];
  const scheduledTimeLabel = formatScheduledTime(task.scheduled_time);
  const hasEstimatedMinutes = typeof task.estimated_minutes === 'number' && task.estimated_minutes > 0;
  const hasActiveTimer = typeof activeTimerSeconds === 'number' && activeTimerSeconds > 0;
  const otherColumns = COLUMNS.filter(c => c.id !== task.status);
  const currentColumnIndex = COLUMNS.findIndex(column => column.id === task.status);
  const previousColumn = currentColumnIndex > 0 ? COLUMNS[currentColumnIndex - 1] : null;
  const nextColumn = currentColumnIndex >= 0 && currentColumnIndex < COLUMNS.length - 1
    ? COLUMNS[currentColumnIndex + 1]
    : null;

  const formatDate = (dateStr: string | null) => {
    const dueParts = parseDueDateParts(dateStr);
    if (!dueParts) return null;

    const displayDate = new Date(dueParts.year, dueParts.month - 1, dueParts.day, 12, 0, 0);
    const now = new Date();
    const todayKey = toDayKey(now.getFullYear(), now.getMonth() + 1, now.getDate());
    const dueKey = toDayKey(dueParts.year, dueParts.month, dueParts.day);
    const isOverdue = dueKey < todayKey;
    const formatted = displayDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    return { formatted, isOverdue };
  };

  const dateInfo = formatDate(task.due_date);
  const createdAtTimestamp = new Date(task.created_at).getTime();
  const createdAtEpoch = Number.isNaN(createdAtTimestamp) ? undefined : String(createdAtTimestamp);

  return (
    <div
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={() => onCardClick?.(task)}
      data-task-id={task.id}
      data-task-created-at={task.created_at}
      data-task-created-at-ts={createdAtEpoch}
      className={`
        glass-card card-shadow rounded-xl p-4 cursor-grab active:cursor-grabbing
        transition-all duration-200 group
        ${isHovered ? 'border-[hsl(var(--primary)/0.4)] translate-y-[-2px]' : 'border-[hsl(var(--glass-border))]'}
      `}
      style={{
        boxShadow: isHovered
          ? '0 8px 32px hsl(224 20% 4% / 0.6), 0 0 0 1px hsl(185 75% 52% / 0.15)'
          : '0 4px 24px hsl(224 20% 4% / 0.6)',
      }}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex flex-wrap gap-1.5 flex-1">
          {/* Priority badge */}
          <span
            className="text-[10px] font-semibold px-2 py-0.5 rounded-full uppercase tracking-wide"
            style={{ color: priority.color, background: priority.bg }}
          >
            {priority.label}
          </span>
          {hasActiveTimer && (
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full tracking-wide bg-primary/20 text-primary border border-primary/30">
              {formatActiveTimer(activeTimerSeconds)} left
            </span>
          )}
          {scheduledTimeLabel && (
            <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full tracking-wide bg-accent text-accent-foreground border border-border/70">
              <Clock className="h-3 w-3" />
              {scheduledTimeLabel}
            </span>
          )}
          {hasEstimatedMinutes && (
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full uppercase tracking-wide bg-secondary text-secondary-foreground">
              {task.estimated_minutes} min
            </span>
          )}
        </div>

        <div className={`transition-opacity duration-150 ${isHovered ? 'opacity-100' : 'opacity-0'}`}>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 shrink-0 text-muted-foreground hover:text-foreground"
                onClick={e => e.stopPropagation()}
              >
                <MoreHorizontal className="h-3.5 w-3.5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-card border-border w-44">
              <DropdownMenuItem
                onClick={e => {
                  e.stopPropagation();
                  onEdit(task);
                }}
                className="gap-2 text-sm"
              >
                <Edit3 className="h-3.5 w-3.5" /> Edit Task
              </DropdownMenuItem>
              <DropdownMenuSub>
                <DropdownMenuSubTrigger className="gap-2 text-sm">
                  <ArrowRight className="h-3.5 w-3.5" /> Move to
                </DropdownMenuSubTrigger>
                <DropdownMenuSubContent className="bg-card border-border">
                  {otherColumns.map(col => (
                    <DropdownMenuItem
                      key={col.id}
                      onClick={e => {
                        e.stopPropagation();
                        onMove(task.id, col.id);
                      }}
                      className="gap-2 text-sm"
                    >
                      <span className="w-2 h-2 rounded-full" style={{ background: col.color }} />
                      {col.title}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuSubContent>
              </DropdownMenuSub>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={e => {
                  e.stopPropagation();
                  onDelete(task.id);
                }}
                className="gap-2 text-sm text-destructive focus:text-destructive"
              >
                <Trash2 className="h-3.5 w-3.5" /> Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Title */}
      <h3 className="text-sm font-semibold text-foreground leading-snug mb-1.5 line-clamp-2">
        {task.title}
      </h3>

      {(task.tags?.length || 0) > 0 && (
        <div className="mb-3 flex flex-wrap gap-1.5">
          {task.tags.slice(0, 2).map(tag => (
            <span key={tag} className="text-[10px] font-semibold px-2 py-0.5 rounded-full tracking-wide bg-secondary text-secondary-foreground">
              {tag}
            </span>
          ))}
          {task.tags.length > 2 && (
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full tracking-wide bg-secondary text-secondary-foreground">
              +{task.tags.length - 2}
            </span>
          )}
        </div>
      )}

      {/* Description */}
      {task.description && (
        <p className="text-xs text-muted-foreground leading-relaxed mb-3 line-clamp-2">
          {task.description}
        </p>
      )}

      {/* Custom fields preview */}
      {customFields.length > 0 && Object.keys(task.custom_field_values || {}).length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-3">
          {customFields.slice(0, 2).map(field => {
            const val = task.custom_field_values?.[field.id];
            if (!val && val !== 0) return null;
            return (
              <span key={field.id} className="text-[10px] px-2 py-0.5 rounded bg-muted text-muted-foreground">
                {field.name}: {String(val)}
              </span>
            );
          })}
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between mt-2 pt-2 border-t border-border/50">
        <div className="flex items-center gap-2">
          {task.assignee && (
            <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
              <User className="h-3 w-3" />
              <span className="max-w-[70px] truncate">{task.assignee}</span>
            </div>
          )}
        </div>
        {dateInfo && (
          <div className={`flex items-center gap-1 text-[11px] font-medium ${dateInfo.isOverdue ? 'text-destructive' : 'text-muted-foreground'}`}>
            <Calendar className="h-3 w-3" />
            {dateInfo.formatted}
          </div>
        )}
      </div>

      <div className="mt-2 flex items-center gap-2 sm:hidden">
        {previousColumn && (
          <Button
            variant="secondary"
            size="sm"
            className="h-8 flex-1"
            aria-label="Move to previous column"
            onClick={e => {
              e.stopPropagation();
              onMove(task.id, previousColumn.id);
            }}
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            {previousColumn.title}
          </Button>
        )}
        {nextColumn && (
          <Button
            variant="secondary"
            size="sm"
            className="h-8 flex-1"
            aria-label="Move to next column"
            onClick={e => {
              e.stopPropagation();
              onMove(task.id, nextColumn.id);
            }}
          >
            {nextColumn.title}
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        )}
      </div>
    </div>
  );
}
