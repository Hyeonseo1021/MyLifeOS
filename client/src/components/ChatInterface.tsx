import { useState, useRef, useEffect, type KeyboardEvent } from 'react';
import { aiApi } from '../api/ai'; 
import type { ChatMessage } from '../types';

interface ChatInterfaceProps {
  sessionId: string; 
  onActivity?: (type: 'send' | 'receive') => void;
  onLogs?: (logs: any[]) => void;
  onTitleUpdate?: (title: string) => void; 
}

export default function ChatInterface({ sessionId, onActivity, onLogs, onTitleUpdate }: ChatInterfaceProps) {
  const [input, setInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);

  useEffect(() => {
    setIsProcessing(false);
    setInput('');
    setTimeout(() => {
      inputRef.current?.focus();
    }, 100);

    const fetchHistory = async () => {
      try {
        const history = await aiApi.getHistory(sessionId); 
        if (history && Array.isArray(history) && history.length > 0) {
          setMessages(history);
        } else {
          setMessages([{ id: Date.now(), role: 'ai', text: '안녕하세요!' }]);
        }
      } catch (e) { console.error(e); }
    };
    fetchHistory();
  }, [sessionId]);

  useEffect(() => {
    setTimeout(() => {
        scrollRef.current?.scrollIntoView({ behavior: 'auto' });
    }, 100);
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isProcessing) return;
    const userText = input;
    setInput('');
    setIsProcessing(true);
    if (onActivity) onActivity('send');

    setMessages(prev => [...prev, { id: Date.now(), role: 'user', text: userText }]);

    try {
      const data = await aiApi.chat(userText, sessionId); 
      
      setMessages(prev => [...prev, { id: Date.now() + 1, role: 'ai', text: data.reply }]);
      
      if (data.logs && onLogs) onLogs(data.logs);
      if (onActivity) onActivity('receive');

      if (data.title && onTitleUpdate) {
        onTitleUpdate(data.title);
      }

    } catch (error) {
      console.error(error);
      setMessages(prev => [...prev, { id: Date.now() + 1, role: 'system', text: 'Error: Connection failed.' }]);
    } finally {
      setIsProcessing(false);
      inputRef.current?.focus();
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.nativeEvent.isComposing) return;
    if (e.key === 'Enter') handleSend();
  };

  return (
    <div className="flex flex-col h-full min-h-0 bg-neutral-900/20 border border-neutral-800 rounded-lg overflow-hidden relative">
      <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin scrollbar-thumb-neutral-800">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] px-4 py-3 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap shadow-sm break-all
              ${msg.role === 'user' 
                ? 'bg-white text-black rounded-tr-none' 
                : msg.role === 'system'
                    ? 'text-xs text-neutral-500 w-full text-center'
                    : 'bg-neutral-800 text-gray-200 rounded-tl-none border border-neutral-700'
              }`}>
              {msg.text}
            </div>
          </div>
        ))}
        {isProcessing && (
           <div className="flex justify-start">
             <div className="bg-neutral-800 px-4 py-3 rounded-2xl rounded-tl-none border border-neutral-700 flex gap-1.5 items-center h-[46px]">
               <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce"></div>
               <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce delay-100"></div>
               <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce delay-200"></div>
             </div>
           </div>
        )}
        <div ref={scrollRef} />
      </div>

      <div className="p-3 border-t border-neutral-800 bg-neutral-950/80 backdrop-blur-md shrink-0">
        <div className="flex gap-2 items-center bg-neutral-900 border border-neutral-800 rounded-full px-2 py-2 focus-within:border-neutral-600 transition-colors">
            <input 
                ref={inputRef}
                className="flex-1 bg-transparent outline-none text-white text-sm placeholder-neutral-500 px-3 min-w-0"
                placeholder={`메시지를 입력하세요...`} 
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={isProcessing}
            />
            <button onClick={handleSend} disabled={!input.trim() || isProcessing} className="p-2 bg-white text-black rounded-full shrink-0">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 12h14M12 5l7 7-7 7"></path></svg>
            </button>
        </div>
      </div>
    </div>
  );
}