import { 
  useGetCareerCoachMessages, 
  useSendCareerCoachMessage, 
  useClearCareerCoachMessages 
} from '@workspace/api-client-react';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Bot, Send, User, Sparkles, Trash2, Code2, Briefcase, FileText } from 'lucide-react';
import { SimpleMarkdown } from '@/lib/simple-markdown';
import { useState, useRef, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { getGetCareerCoachMessagesQueryKey } from '@workspace/api-client-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

const QUICK_PROMPTS = [
  { icon: FileText, text: "Review my resume score and suggest improvements" },
  { icon: Briefcase, text: "What roles am I most qualified for right now?" },
  { icon: Code2, text: "Suggest an open-source project to boost my ranking" },
];

export default function CareerCoachPage() {
  const { data: messages, isLoading } = useGetCareerCoachMessages();
  const sendMessage = useSendCareerCoachMessage();
  const clearMessages = useClearCareerCoachMessages();
  const queryClient = useQueryClient();
  
  const [input, setInput] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, sendMessage.isPending]);

  const handleSend = (e?: React.FormEvent, presetMsg?: string) => {
    e?.preventDefault();
    const content = presetMsg || input;
    if (!content.trim()) return;
    setInput('');
    sendMessage.mutate({ data: { content } }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetCareerCoachMessagesQueryKey() });
      }
    });
  };

  const handleClear = () => {
    clearMessages.mutate(undefined, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetCareerCoachMessagesQueryKey() });
      }
    });
  };

  return (
    <div className="space-y-6 h-[calc(100vh-6rem)] flex flex-col">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 shrink-0">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">AI Career Coach</h1>
          <p className="text-muted-foreground">
            Get personalized advice based on your developer profile.
          </p>
        </div>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button 
              variant="outline" 
              size="sm" 
              disabled={!messages || messages.length === 0 || clearMessages.isPending}
            >
              <Trash2 className="mr-2 h-4 w-4" /> Clear History
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Clear conversation history?</AlertDialogTitle>
              <AlertDialogDescription>
                This will permanently delete all messages in this conversation. This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleClear} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                Clear History
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>

      <Card className="flex-1 flex flex-col overflow-hidden border-border/50 shadow-sm">
        <CardContent className="flex-1 p-0 flex flex-col overflow-hidden relative">
          <ScrollArea className="flex-1 p-4" ref={scrollRef}>
            {isLoading ? (
              <div className="space-y-4 p-4">
                <Skeleton className="h-16 w-[80%] rounded-2xl rounded-tl-sm" />
                <Skeleton className="h-16 w-[80%] rounded-2xl rounded-tr-sm ml-auto" />
                <Skeleton className="h-24 w-[80%] rounded-2xl rounded-tl-sm" />
              </div>
            ) : messages && messages.length > 0 ? (
              <div className="space-y-6 p-4">
                {messages.map((msg) => (
                  <div key={msg.id} className={`flex gap-4 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                    <div className={`h-8 w-8 shrink-0 rounded-full flex items-center justify-center ${
                      msg.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-400'
                    }`}>
                      {msg.role === 'user' ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
                    </div>
                    <div className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm ${
                      msg.role === 'user' 
                        ? 'bg-primary text-primary-foreground rounded-tr-sm' 
                        : 'bg-muted rounded-tl-sm'
                    }`}>
                      {msg.role === 'assistant' 
                        ? <SimpleMarkdown content={msg.content} />
                        : <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                      }
                    </div>
                  </div>
                ))}
                {sendMessage.isPending && (
                  <div className="flex gap-4">
                    <div className="h-8 w-8 shrink-0 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-400 flex items-center justify-center">
                      <Bot className="h-4 w-4" />
                    </div>
                    <div className="max-w-[80%] rounded-2xl px-4 py-3 bg-muted rounded-tl-sm">
                      <div className="flex space-x-1 items-center h-5">
                        <div className="w-2 h-2 bg-muted-foreground/40 rounded-full animate-bounce" />
                        <div className="w-2 h-2 bg-muted-foreground/40 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                        <div className="w-2 h-2 bg-muted-foreground/40 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }} />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full p-8 text-center">
                <div className="h-16 w-16 bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 rounded-full flex items-center justify-center mb-6">
                  <Sparkles className="h-8 w-8" />
                </div>
                <h3 className="text-xl font-bold mb-2">How can I help your career today?</h3>
                <p className="text-muted-foreground max-w-md mb-8">
                  I have full access to your GitHub stats, coding profiles, skills, and readiness scores. Ask me anything about improving your profile or preparing for roles.
                </p>
                <div className="grid gap-3 w-full max-w-lg">
                  {QUICK_PROMPTS.map((prompt, i) => (
                    <button 
                      key={i}
                      onClick={() => handleSend(undefined, prompt.text)}
                      className="flex items-center gap-3 p-3 rounded-xl border bg-card hover:bg-muted/50 transition-colors text-left text-sm"
                    >
                      <prompt.icon className="h-4 w-4 text-muted-foreground shrink-0" />
                      <span>{prompt.text}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </ScrollArea>
          
          <div className="p-4 border-t bg-background shrink-0 mt-auto">
            <form onSubmit={handleSend} className="flex gap-2">
              <Input 
                placeholder="Ask your AI coach anything about your career..." 
                value={input}
                onChange={(e) => setInput(e.target.value)}
                disabled={sendMessage.isPending || isLoading}
                className="flex-1"
                autoFocus
                aria-label="Message to career coach"
              />
              <Button type="submit" disabled={sendMessage.isPending || isLoading || !input.trim()} aria-label="Send message">
                <Send className="h-4 w-4" />
              </Button>
            </form>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
