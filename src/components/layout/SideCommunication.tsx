import { useState, useEffect, useRef } from 'react';
import { Send, X, Sparkles, Brain, Trash2 } from 'lucide-react';
import { Button } from '../ui/Button';
import { generateAIResponse } from '../../utils/ai';

interface SideCommunicationProps {
  isOpen: boolean;
  onClose: () => void;
}

interface ChatMessage {
  id: string;
  sender: 'user' | 'ai';
  content: string;
  timestamp: string;
}

export function SideCommunication({ isOpen, onClose }: SideCommunicationProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [content, setContent] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Load chat history from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('transitops_ai_chat_history');
    if (saved) {
      try {
        setMessages(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to parse chat history", e);
      }
    } else {
      // Default welcome message
      setMessages([
        {
          id: 'welcome',
          sender: 'ai',
          content: 'Hello! I am your TransitOps AI Assistant. I have full access to your real-time vehicles, drivers, and trips database. Ask me anything about your fleet!',
          timestamp: new Date().toISOString()
        }
      ]);
    }
  }, []);

  // Save history when messages change
  const saveHistory = (newMsgs: ChatMessage[]) => {
    localStorage.setItem('transitops_ai_chat_history', JSON.stringify(newMsgs));
  };

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() || isTyping) return;

    const userMessage: ChatMessage = {
      id: Math.random().toString(36).substring(7),
      sender: 'user',
      content: content.trim(),
      timestamp: new Date().toISOString()
    };

    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    saveHistory(updatedMessages);
    setContent('');
    setIsTyping(true);

    try {
      const response = await generateAIResponse(userMessage.content, {});
      const aiMessage: ChatMessage = {
        id: Math.random().toString(36).substring(7),
        sender: 'ai',
        content: response,
        timestamp: new Date().toISOString()
      };
      const finalMessages = [...updatedMessages, aiMessage];
      setMessages(finalMessages);
      saveHistory(finalMessages);
    } catch (err) {
      const aiErrorMessage: ChatMessage = {
        id: Math.random().toString(36).substring(7),
        sender: 'ai',
        content: "Sorry, I ran into an error connecting to the AI service. Please verify your connection.",
        timestamp: new Date().toISOString()
      };
      setMessages([...updatedMessages, aiErrorMessage]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleClearChat = () => {
    const defaultMsgs: ChatMessage[] = [
      {
        id: 'welcome',
        sender: 'ai',
        content: 'Hello! I am your TransitOps AI Assistant. I have full access to your real-time vehicles, drivers, and trips database. Ask me anything about your fleet!',
        timestamp: new Date().toISOString()
      }
    ];
    setMessages(defaultMsgs);
    localStorage.setItem('transitops_ai_chat_history', JSON.stringify(defaultMsgs));
  };

  return (
    <div 
      className={`fixed bottom-24 right-6 w-80 md:w-[380px] h-[500px] bg-[var(--card)] text-[var(--text)] shadow-[0_20px_50px_rgba(0,0,0,0.3)] z-50 rounded-2xl border border-[var(--border)] flex flex-col overflow-hidden transition-all duration-300 origin-bottom-right transform ${
        isOpen ? 'scale-100 translate-y-0 opacity-100 pointer-events-auto' : 'scale-75 translate-y-10 opacity-0 pointer-events-none'
      }`}
    >
      {/* Header */}
      <div className="p-4 border-b border-[var(--border)] flex items-center justify-between bg-gradient-to-r from-orange-500/5 to-amber-500/5">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-orange-500 text-white flex items-center justify-center shadow-md">
            <Brain size={16} />
          </div>
          <div>
            <h3 className="font-bold text-sm text-[var(--text)] leading-tight">AI Assistant</h3>
            <p className="text-[10px] text-[var(--text-muted)] flex items-center gap-1">
              <Sparkles size={10} className="text-amber-500" /> Powered by Groq
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button 
            onClick={handleClearChat} 
            title="Clear Chat"
            className="p-2 hover:bg-red-500/10 text-red-500 rounded-lg transition-colors"
          >
            <Trash2 size={16} />
          </button>
          <button onClick={onClose} className="p-2 hover:bg-[var(--border)]/50 rounded-lg transition-colors">
            <X size={18} />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div 
        ref={scrollRef} 
        className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar bg-[var(--bg)]/30"
      >
        {messages.map((m) => {
          const isMe = m.sender === 'user';
          return (
            <div key={m.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'} animate-fade-in`}>
              <div className={`max-w-[85%] flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                {!isMe && (
                  <span className="text-[10px] font-bold text-[var(--text-muted)] mb-1 px-1 flex items-center gap-1">
                    <Brain size={10} className="text-orange-500" />
                    TransitOps AI
                  </span>
                )}
                <div className={`p-3 rounded-2xl text-sm shadow-sm whitespace-pre-line ${
                  !isMe ? 'bg-orange-500 text-white rounded-tl-none border border-white/20' :
                  'bg-[var(--border)]/25 text-[var(--text)] rounded-tr-none border border-[var(--border)]'
                }`}>
                  {m.content}
                </div>
                <span className="text-[9px] text-[var(--text-muted)] mt-1 px-1 opacity-60">
                  {new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            </div>
          );
        })}
        {isTyping && (
          <div className="flex justify-start animate-fade-in">
            <div className="flex flex-col items-start">
              <span className="text-[10px] font-bold text-[var(--text-muted)] mb-1 px-1 flex items-center gap-1">
                <Brain size={10} className="text-orange-500" />
                TransitOps AI
              </span>
              <div className="bg-orange-500 p-3 rounded-2xl rounded-tl-none border border-white/20 flex gap-1 items-center h-9">
                <span className="w-1.5 h-1.5 bg-white rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                <span className="w-1.5 h-1.5 bg-white rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                <span className="w-1.5 h-1.5 bg-white rounded-full animate-bounce"></span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Suggested Prompts */}
      <div className="px-4 py-2 border-t border-[var(--border)] bg-[var(--bg)]">
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
          {["Which vehicles are available?", "Are any driver licenses expiring?", "Show recent trips"].map((promptText) => (
            <button 
              key={promptText}
              onClick={() => setContent(promptText)}
              className="whitespace-nowrap px-2.5 py-1 rounded-full bg-orange-500/10 text-orange-600 dark:text-orange-500 text-[10px] font-bold hover:bg-orange-500/20 transition-colors border border-orange-500/20"
            >
              {promptText}
            </button>
          ))}
        </div>
      </div>

      {/* Input Form */}
      <form onSubmit={handleSend} className="p-4 border-t border-[var(--border)] flex gap-2 bg-[var(--card)]">
        <input 
          type="text"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder={isTyping ? "AI is thinking..." : "Ask me anything..."}
          disabled={isTyping}
          className="flex-1 bg-[var(--bg)] border border-[var(--border)] text-[var(--text)] rounded-xl px-4 py-2 text-sm outline-none focus:border-orange-500 transition-all disabled:opacity-50"
        />
        <Button type="submit" size="sm" className="glow-primary shrink-0" disabled={!content.trim() || isTyping}>
          <Send size={16} />
        </Button>
      </form>
    </div>
  );
}
