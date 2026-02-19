export type TaskStatus = 'todo' | 'in_progress' | 'completed';
export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';
export type CustomFieldType = 'text' | 'number' | 'dropdown';

export interface CustomFieldDefinition {
  id: string;
  board_id: string;
  name: string;
  field_type: CustomFieldType;
  options: string[];
  position: number;
  created_at: string;
}

export interface Task {
  id: string;
  board_id: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  due_date: string | null;
  scheduled_time?: string | null;
  estimated_minutes?: number | null;
  tags: string[];
  assignee: string;
  position: number;
  custom_field_values: Record<string, string | number>;
  pomodoros_completed: number;
  created_at: string;
  updated_at: string;
}

export interface Board {
  id: string;
  name: string;
  created_at: string;
  updated_at: string;
}

export interface AiMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  created_at: string;
}

export interface Column {
  id: TaskStatus;
  title: string;
  color: string;
  glowColor: string;
}

export const COLUMNS: Column[] = [
  { id: 'todo', title: 'To Do', color: 'hsl(220, 70%, 58%)', glowColor: 'hsl(220 70% 58% / 0.2)' },
  { id: 'in_progress', title: 'In Progress', color: 'hsl(38, 92%, 58%)', glowColor: 'hsl(38 92% 58% / 0.2)' },
  { id: 'completed', title: 'Completed', color: 'hsl(142, 65%, 50%)', glowColor: 'hsl(142 65% 50% / 0.2)' },
];

export const PRIORITY_CONFIG: Record<TaskPriority, { label: string; color: string; bg: string }> = {
  low: { label: 'Low', color: 'hsl(142, 65%, 50%)', bg: 'hsl(142 65% 50% / 0.15)' },
  medium: { label: 'Medium', color: 'hsl(38, 92%, 58%)', bg: 'hsl(38 92% 58% / 0.15)' },
  high: { label: 'High', color: 'hsl(24, 90%, 58%)', bg: 'hsl(24 90% 58% / 0.15)' },
  urgent: { label: 'Urgent', color: 'hsl(0, 72%, 58%)', bg: 'hsl(0 72% 58% / 0.15)' },
};
