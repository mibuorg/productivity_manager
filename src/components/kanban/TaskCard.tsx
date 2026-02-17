import { useState } from 'react';
import { Calendar, Tag, User, MoreHorizontal, Trash2, Edit3, ArrowRight } from 'lucide-react';
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
  isDragging?: boolean;
}

export function TaskCard({ task, customFields, onEdit, onDelete, onMove, isDragging }: TaskCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const priority = PRIORITY_CONFIG[task.priority];
  const otherColumns = COLUMNS.filter(c => c.id !== task.status);

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return null;
    const date = new Date(dateStr);
    const now = new Date();
    const isOverdue = date < now;
    const formatted = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    return { formatted, isOverdue };
  };

  const dateInfo = formatDate(task.due_date);

  return (
    <div
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={`
        glass-card card-shadow rounded-xl p-4 cursor-grab active:cursor-grabbing
        transition-all duration-200 group
        ${isDragging ? 'opacity-50 scale-95 rotate-1' : ''}
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
          {/* Tags */}
          {task.tags?.slice(0, 2).map(tag => (
            <span key={tag} className="text-[10px] px-2 py-0.5 rounded-full bg-secondary text-muted-foreground">
              {tag}
            </span>
          ))}
          {(task.tags?.length || 0) > 2 && (
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-secondary text-muted-foreground">
              +{task.tags.length - 2}
            </span>
          )}
        </div>

        <div className={`transition-opacity duration-150 ${isHovered ? 'opacity-100' : 'opacity-0'}`}>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0 text-muted-foreground hover:text-foreground">
                <MoreHorizontal className="h-3.5 w-3.5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-card border-border w-44">
              <DropdownMenuItem onClick={() => onEdit(task)} className="gap-2 text-sm">
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
                      onClick={() => onMove(task.id, col.id)}
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
                onClick={() => onDelete(task.id)}
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
    </div>
  );
}
