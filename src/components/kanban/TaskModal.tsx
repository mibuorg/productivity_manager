import { useState, useEffect } from 'react';
import { X, Calendar, Tag, User, Plus, Trash2 } from 'lucide-react';
import { Task, TaskStatus, TaskPriority, CustomFieldDefinition, PRIORITY_CONFIG, COLUMNS } from '@/types/kanban';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface TaskModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (taskData: Partial<Task>) => void;
  task?: Task | null;
  defaultStatus?: TaskStatus;
  customFields: CustomFieldDefinition[];
}

export function TaskModal({ open, onClose, onSave, task, defaultStatus = 'todo', customFields }: TaskModalProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<TaskStatus>(defaultStatus);
  const [priority, setPriority] = useState<TaskPriority>('medium');
  const [dueDate, setDueDate] = useState('');
  const [assignee, setAssignee] = useState('');
  const [tagInput, setTagInput] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [customValues, setCustomValues] = useState<Record<string, string | number>>({});

  useEffect(() => {
    if (task) {
      setTitle(task.title);
      setDescription(task.description || '');
      setStatus(task.status);
      setPriority(task.priority);
      setDueDate(task.due_date || '');
      setAssignee(task.assignee || '');
      setTags(task.tags || []);
      setCustomValues(task.custom_field_values || {});
    } else {
      setTitle('');
      setDescription('');
      setStatus(defaultStatus);
      setPriority('medium');
      setDueDate('');
      setAssignee('');
      setTags([]);
      setCustomValues({});
    }
  }, [task, defaultStatus, open]);

  const addTag = () => {
    const trimmed = tagInput.trim();
    if (trimmed && !tags.includes(trimmed)) {
      setTags([...tags, trimmed]);
      setTagInput('');
    }
  };

  const handleSave = () => {
    if (!title.trim()) return;
    onSave({
      title: title.trim(),
      description,
      status,
      priority,
      due_date: dueDate || null,
      assignee,
      tags,
      custom_field_values: customValues,
    });
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="bg-card border-border max-w-lg max-h-[90vh] overflow-y-auto scrollbar-thin">
        <DialogHeader>
          <DialogTitle className="text-foreground font-display">
            {task ? 'Edit Task' : 'New Task'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Title */}
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1.5 block uppercase tracking-wide">Title *</label>
            <Input
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="What needs to be done?"
              className="bg-muted border-border focus:border-primary text-foreground"
              onKeyDown={e => e.key === 'Enter' && handleSave()}
              autoFocus
            />
          </div>

          {/* Description */}
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1.5 block uppercase tracking-wide">Description</label>
            <Textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Add more context..."
              className="bg-muted border-border focus:border-primary text-foreground resize-none min-h-[80px]"
            />
          </div>

          {/* Status + Priority row */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block uppercase tracking-wide">Status</label>
              <Select value={status} onValueChange={v => setStatus(v as TaskStatus)}>
                <SelectTrigger className="bg-muted border-border text-foreground">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-card border-border">
                  {COLUMNS.map(col => (
                    <SelectItem key={col.id} value={col.id}>
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full" style={{ background: col.color }} />
                        {col.title}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block uppercase tracking-wide">Priority</label>
              <Select value={priority} onValueChange={v => setPriority(v as TaskPriority)}>
                <SelectTrigger className="bg-muted border-border text-foreground">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-card border-border">
                  {(Object.entries(PRIORITY_CONFIG) as [TaskPriority, typeof PRIORITY_CONFIG[TaskPriority]][]).map(([key, cfg]) => (
                    <SelectItem key={key} value={key}>
                      <span style={{ color: cfg.color }}>{cfg.label}</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Due Date + Assignee */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1.5 flex items-center gap-1 uppercase tracking-wide">
                <Calendar className="h-3 w-3" /> Due Date
              </label>
              <Input
                type="date"
                value={dueDate}
                onChange={e => setDueDate(e.target.value)}
                className="bg-muted border-border text-foreground [color-scheme:dark]"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1.5 flex items-center gap-1 uppercase tracking-wide">
                <User className="h-3 w-3" /> Assignee
              </label>
              <Input
                value={assignee}
                onChange={e => setAssignee(e.target.value)}
                placeholder="Name or email"
                className="bg-muted border-border text-foreground"
              />
            </div>
          </div>

          {/* Tags */}
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1.5 flex items-center gap-1 uppercase tracking-wide">
              <Tag className="h-3 w-3" /> Tags
            </label>
            <div className="flex gap-2">
              <Input
                value={tagInput}
                onChange={e => setTagInput(e.target.value)}
                placeholder="Add a tag..."
                className="bg-muted border-border text-foreground"
                onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addTag())}
              />
              <Button variant="outline" size="sm" onClick={addTag} className="border-border">
                <Plus className="h-3.5 w-3.5" />
              </Button>
            </div>
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-2">
                {tags.map(tag => (
                  <span key={tag} className="flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-secondary text-secondary-foreground">
                    {tag}
                    <button onClick={() => setTags(tags.filter(t => t !== tag))} className="hover:text-destructive">
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Custom Fields */}
          {customFields.length > 0 && (
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-2 block uppercase tracking-wide">Custom Fields</label>
              <div className="space-y-3">
                {customFields.map(field => (
                  <div key={field.id}>
                    <label className="text-xs text-muted-foreground mb-1 block">{field.name}</label>
                    {field.field_type === 'text' && (
                      <Input
                        value={(customValues[field.id] as string) || ''}
                        onChange={e => setCustomValues({ ...customValues, [field.id]: e.target.value })}
                        className="bg-muted border-border text-foreground"
                        placeholder={`Enter ${field.name}...`}
                      />
                    )}
                    {field.field_type === 'number' && (
                      <Input
                        type="number"
                        value={(customValues[field.id] as number) ?? ''}
                        onChange={e => setCustomValues({ ...customValues, [field.id]: parseFloat(e.target.value) || 0 })}
                        className="bg-muted border-border text-foreground"
                        placeholder="0"
                      />
                    )}
                    {field.field_type === 'dropdown' && (
                      <Select
                        value={(customValues[field.id] as string) || ''}
                        onValueChange={v => setCustomValues({ ...customValues, [field.id]: v })}
                      >
                        <SelectTrigger className="bg-muted border-border text-foreground">
                          <SelectValue placeholder="Select..." />
                        </SelectTrigger>
                        <SelectContent className="bg-card border-border">
                          {field.options.map(opt => (
                            <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-2 pt-2 border-t border-border">
          <Button variant="ghost" onClick={onClose} className="text-muted-foreground">
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={!title.trim()}
            className="bg-primary text-primary-foreground hover:bg-primary/90 glow-primary"
          >
            {task ? 'Save Changes' : 'Create Task'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
