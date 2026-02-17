import { useState, useRef, useEffect } from 'react';
import { X, Send, Bot, User, Loader2, Sparkles, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Task, Board } from '@/types/kanban';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
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

export function AiChatPanel({ open, onClose, board, tasks, onTaskCreate }: AiChatPanelProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
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
    if (!messageText.trim() || isLoading) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: messageText.trim(),
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    let assistantText = '';
    const assistantId = (Date.now() + 1).toString();

    try {
      const resp = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/kanban-ai`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({
            messages: [...messages, userMsg].map(m => ({ role: m.role, content: m.content })),
            boardContext: buildBoardContext(),
          }),
        }
      );

      if (!resp.ok) {
        const errData = await resp.json().catch(() => ({ error: 'Unknown error' }));
        if (resp.status === 429 || resp.status === 402) {
          toast.error(errData.error);
        } else {
          toast.error('AI service unavailable. Please try again.');
        }
        setIsLoading(false);
        return;
      }

      if (!resp.body) throw new Error('No response body');

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let textBuffer = '';
      let streamDone = false;

      setMessages(prev => [...prev, { id: assistantId, role: 'assistant', content: '' }]);

      while (!streamDone) {
        const { done, value } = await reader.read();
        if (done) break;
        textBuffer += decoder.decode(value, { stream: true });

        let newlineIndex: number;
        while ((newlineIndex = textBuffer.indexOf('\n')) !== -1) {
          let line = textBuffer.slice(0, newlineIndex);
          textBuffer = textBuffer.slice(newlineIndex + 1);
          if (line.endsWith('\r')) line = line.slice(0, -1);
          if (line.startsWith(':') || line.trim() === '') continue;
          if (!line.startsWith('data: ')) continue;

          const jsonStr = line.slice(6).trim();
          if (jsonStr === '[DONE]') { streamDone = true; break; }

          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content as string | undefined;
            if (content) {
              assistantText += content;
              setMessages(prev =>
                prev.map(m => m.id === assistantId ? { ...m, content: assistantText } : m)
              );
            }
          } catch {
            textBuffer = line + '\n' + textBuffer;
            break;
          }
        }
      }

      // Parse action blocks from response
      const actionMatch = assistantText.match(/```action\n([\s\S]*?)```/);
      if (actionMatch && onTaskCreate) {
        try {
          const action = JSON.parse(actionMatch[1]);
          if (action.type === 'create_task' && action.data) {
            onTaskCreate(action.data);
          }
        } catch {}
      }

      // Save to DB if board exists
      if (board) {
        await supabase.from('ai_conversations').insert([
          { board_id: board.id, role: 'user', content: userMsg.content },
          { board_id: board.id, role: 'assistant', content: assistantText },
        ]);
      }
    } catch (e) {
      console.error('AI chat error:', e);
      toast.error('Failed to get AI response. Please try again.');
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
                  <p className="text-xs text-muted-foreground">I can help you manage tasks, analyze your board, and more.</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-2 uppercase tracking-wide font-medium">Suggestions</p>
                  <div className="space-y-1.5">
                    {SUGGESTIONS.map(s => (
                      <button
                        key={s}
                        onClick={() => send(s)}
                        className="w-full text-left text-xs px-3 py-2.5 rounded-lg bg-secondary hover:bg-muted border border-border hover:border-primary/30 text-muted-foreground hover:text-foreground transition-all flex items-center justify-between group"
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
                className="bg-muted border-border text-foreground text-xs resize-none min-h-[40px] max-h-[120px] flex-1 focus:border-primary/50"
                rows={1}
              />
              <Button
                size="icon"
                onClick={() => send(input)}
                disabled={!input.trim() || isLoading}
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
