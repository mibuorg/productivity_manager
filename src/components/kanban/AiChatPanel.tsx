import { useState, useRef, useEffect } from 'react';
import { X, Send, Bot, User, Loader2, Sparkles, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Task, Board } from '@/types/kanban';
import ReactMarkdown from 'react-markdown';

interface AiChatPanelProps {
  open: boolean;
  onClose: () => void;
  board: Board | null;
  tasks: Task[];
  onTaskCreate?: (taskData: Partial<Task>) => void;
}

type ChatMessage = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
};

const SUGGESTIONS = [
  'What tasks are overdue?',
  'Create a task to review designs',
  'Summarize my board',
  'What should I focus on today?',
];

const summarizeTaskCounts = (tasks: Task[]) => {
  const todo = tasks.filter(task => task.status === 'todo').length;
  const inProgress = tasks.filter(task => task.status === 'in_progress').length;
  const completed = tasks.filter(task => task.status === 'completed').length;
  return `You currently have ${todo} in To Do, ${inProgress} in progress, and ${completed} completed.`;
};

const parseCreateTaskPrompt = (message: string) => {
  const match = message.match(/create (?:a )?task(?: to)?\s+(.+)/i);
  return match?.[1]?.trim() || '';
};

const overdueTasks = (tasks: Task[]) => {
  const now = new Date();
  return tasks.filter(task => {
    if (!task.due_date || task.status === 'completed') return false;
    const due = new Date(task.due_date);
    return Number.isFinite(due.getTime()) && due < now;
  });
};

const getFocusSuggestion = (tasks: Task[]) => {
  const active = tasks
    .filter(task => task.status !== 'completed')
    .sort((a, b) => {
      const priorityRank = { urgent: 4, high: 3, medium: 2, low: 1 };
      return priorityRank[b.priority] - priorityRank[a.priority];
    });
  return active[0] ?? null;
};

const buildLocalReply = (message: string, tasks: Task[], boardName: string, onTaskCreate?: (taskData: Partial<Task>) => void) => {
  const text = message.trim().toLowerCase();

  const newTaskTitle = parseCreateTaskPrompt(message);
  if (newTaskTitle && onTaskCreate) {
    onTaskCreate({ title: newTaskTitle, status: 'todo', priority: 'medium' });
    return `Added "${newTaskTitle}" to To Do on ${boardName}.`;
  }

  if (text.includes('overdue')) {
    const overdue = overdueTasks(tasks);
    if (!overdue.length) {
      return 'You currently have no overdue tasks.';
    }
    return `Overdue tasks:\n${overdue.map(task => `- ${task.title}`).join('\n')}`;
  }

  if (text.includes('summarize') || text.includes('summary')) {
    return `${summarizeTaskCounts(tasks)} Total tasks: ${tasks.length}.`;
  }

  if (text.includes('focus')) {
    const suggestion = getFocusSuggestion(tasks);
    if (!suggestion) {
      return 'Everything is complete. Add a new task to keep momentum.';
    }
    return `Focus suggestion: "${suggestion.title}" (${suggestion.priority} priority, ${suggestion.status.replace('_', ' ')}).`;
  }

  return `${summarizeTaskCounts(tasks)} I can also help with overdue checks, summaries, and creating tasks locally.`;
};

export function AiChatPanel({ open, onClose, board, tasks, onTaskCreate }: AiChatPanelProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isCheckingConnectivity, setIsCheckingConnectivity] = useState(false);
  const [isServerOnline, setIsServerOnline] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (open && textareaRef.current) {
      setTimeout(() => textareaRef.current?.focus(), 100);
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;

    let mounted = true;
    const checkConnectivity = async () => {
      setIsCheckingConnectivity(true);
      try {
        const response = await fetch('/api/internet-status', {
          method: 'GET',
          headers: { Accept: 'application/json' },
          cache: 'no-store',
        });
        if (!response.ok) {
          if (mounted) setIsServerOnline(false);
          return;
        }
        const payload = await response.json() as { online?: boolean };
        if (mounted) {
          setIsServerOnline(Boolean(payload.online));
        }
      } catch {
        if (mounted) setIsServerOnline(false);
      } finally {
        if (mounted) setIsCheckingConnectivity(false);
      }
    };

    void checkConnectivity();
    const intervalId = window.setInterval(() => {
      void checkConnectivity();
    }, 30000);

    return () => {
      mounted = false;
      window.clearInterval(intervalId);
    };
  }, [open]);

  const buildBoardContext = () => ({
    boardName: board?.name || 'Kanban Board',
    totalTasks: tasks.length,
    tasksByStatus: {
      todo: tasks.filter(t => t.status === 'todo').map(t => ({ title: t.title, priority: t.priority, due_date: t.due_date })),
      in_progress: tasks.filter(t => t.status === 'in_progress').map(t => ({ title: t.title, priority: t.priority, due_date: t.due_date })),
      completed: tasks.filter(t => t.status === 'completed').map(t => ({ title: t.title, priority: t.priority, due_date: t.due_date })),
    },
  });

  const send = async (messageText: string) => {
    if (!messageText.trim() || isLoading || !isServerOnline) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: messageText.trim(),
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      await new Promise(resolve => setTimeout(resolve, 250));
      const boardContext = buildBoardContext();
      const assistantText = buildLocalReply(userMsg.content, tasks, boardContext.boardName, onTaskCreate);
      const assistantMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: assistantText,
      };
      setMessages(prev => [...prev, assistantMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      send(input);
    }
  };

  return (
    <div
      className={`
        fixed right-0 top-0 h-full z-50 flex flex-col
        transition-all duration-300 ease-in-out
        ${open ? 'w-[380px]' : 'w-0 overflow-hidden'}
      `}
      style={{
        background: 'hsl(224, 22%, 7%)',
        borderLeft: open ? '1px solid hsl(var(--border))' : 'none',
        boxShadow: open ? '-8px 0 32px hsl(224 20% 4% / 0.5)' : 'none',
      }}
    >
      {open && (
        <>
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-4 border-b border-border shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                <Sparkles className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">AI Assistant</p>
                <p className="text-[11px] text-muted-foreground">Powered by Gemini</p>
              </div>
            </div>
            <Button variant="ghost" size="icon" onClick={onClose} className="h-7 w-7 text-muted-foreground">
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto scrollbar-thin px-4 py-4 space-y-4">
            {messages.length === 0 && (
              <div className="space-y-4">
                <div className="text-center py-6">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
                    <Bot className="h-6 w-6 text-primary" />
                  </div>
                  <p className="text-sm font-medium text-foreground mb-1">Hello! I'm your Kanban AI</p>
                  <p className="text-xs text-muted-foreground">
                    {isCheckingConnectivity
                      ? 'Checking server internet connection...'
                      : isServerOnline
                        ? 'I can help you manage tasks, analyze your board, and more.'
                        : 'AI assistant requires internet connection from the server.'}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-2 uppercase tracking-wide font-medium">Suggestions</p>
                  <div className="space-y-1.5">
                    {SUGGESTIONS.map(s => (
                      <button
                        key={s}
                        onClick={() => send(s)}
                        disabled={!isServerOnline || isCheckingConnectivity || isLoading}
                        className="w-full text-left text-xs px-3 py-2.5 rounded-lg bg-secondary hover:bg-muted border border-border hover:border-primary/30 text-muted-foreground hover:text-foreground transition-all flex items-center justify-between group disabled:opacity-50 disabled:hover:bg-secondary disabled:hover:border-border"
                      >
                        {s}
                        <ChevronRight className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {messages.map(msg => (
              <div key={msg.id} className={`flex gap-2.5 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 mt-0.5
                  ${msg.role === 'user' ? 'bg-primary/20' : 'bg-secondary'}`}>
                  {msg.role === 'user'
                    ? <User className="h-3 w-3 text-primary" />
                    : <Bot className="h-3 w-3 text-muted-foreground" />
                  }
                </div>
                <div className={`max-w-[85%] text-xs leading-relaxed rounded-xl px-3 py-2.5
                  ${msg.role === 'user'
                    ? 'bg-primary/15 text-foreground rounded-tr-sm border border-primary/20'
                    : 'bg-secondary text-foreground rounded-tl-sm border border-border'
                  }`}>
                  {msg.role === 'assistant' ? (
                    <div className="prose prose-xs prose-invert max-w-none [&>*:first-child]:mt-0 [&>*:last-child]:mb-0">
                      <ReactMarkdown>{msg.content || '...'}</ReactMarkdown>
                    </div>
                  ) : (
                    msg.content
                  )}
                </div>
              </div>
            ))}

            {isLoading && messages[messages.length - 1]?.role === 'user' && (
              <div className="flex gap-2.5">
                <div className="w-6 h-6 rounded-full bg-secondary flex items-center justify-center shrink-0">
                  <Bot className="h-3 w-3 text-muted-foreground" />
                </div>
                <div className="bg-secondary rounded-xl rounded-tl-sm px-3 py-2.5 border border-border">
                  <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />
                </div>
              </div>
            )}

            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div className="px-4 py-4 border-t border-border shrink-0">
            <div className="flex gap-2 items-end">
              <Textarea
                ref={textareaRef}
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask about your tasks..."
                disabled={!isServerOnline || isCheckingConnectivity}
                className="bg-muted border-border text-foreground text-xs resize-none min-h-[40px] max-h-[120px] flex-1 focus:border-primary/50"
                rows={1}
              />
              <Button
                size="icon"
                onClick={() => send(input)}
                disabled={!input.trim() || isLoading || !isServerOnline || isCheckingConnectivity}
                className="h-9 w-9 bg-primary text-primary-foreground hover:bg-primary/90 shrink-0"
              >
                {isLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
              </Button>
            </div>
            <p className="text-[10px] text-muted-foreground mt-1.5">Press Enter to send, Shift+Enter for new line</p>
          </div>
        </>
      )}
    </div>
  );
}
