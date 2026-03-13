import { useState, useRef, useEffect, type KeyboardEvent, type ChangeEvent } from 'react';
import { aiApi } from '../api/ai'; 
import type { ChatMessage } from '../types';

interface ChatInterfaceProps {
  sessionId: string; 
  onActivity?: (type: 'send' | 'receive') => void;
  onLogs?: (logs: any[]) => void;
  onTitleUpdate?: (title: string) => void; 
  onContextUpdate?: (sources: any[]) => void;
}

export default function ChatInterface({ sessionId, onActivity, onLogs, onTitleUpdate, onContextUpdate }: ChatInterfaceProps) {
  const [input, setInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);

  useEffect(() => {
    setIsProcessing(false);
    setInput('');
    
    const grabFocus = () => {
      window.focus(); 
      if (inputRef.current) {
        inputRef.current.disabled = false;
        inputRef.current.focus();
      }
    };

    grabFocus();
    requestAnimationFrame(grabFocus); 
    setTimeout(grabFocus, 100); 

    const fetchHistory = async () => {
      try {
        const history = await aiApi.getHistory(sessionId); 
        if (history && Array.isArray(history) && history.length > 0) {
          setMessages(history);
        } else {
          setMessages([{ id: Date.now(), role: 'ai', text: '안녕하세요! 무엇을 도와드릴까요?' }]);
        }
      } catch (e) { console.error(e); }
    };
    fetchHistory();
  }, [sessionId]);

  useEffect(() => {
    requestAnimationFrame(() => {
        scrollRef.current?.scrollIntoView({ behavior: 'auto' });
    });
  }, [messages]);

  const handleFileSelect = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleSend = async () => {
    if ((!input.trim() && !selectedFile) || isProcessing) return; 
    
    const userText = input;
    const currentFile = selectedFile;

    setInput('');
    setSelectedFile(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
    
    setIsProcessing(true);
    if (onActivity) onActivity('send');

    const displayMsg = currentFile 
      ? `${userText}\n[FILE] ${currentFile.name}`.trim() 
      : userText;

    setMessages(prev => [...prev, { id: Date.now(), role: 'user', text: displayMsg }]);

    requestAnimationFrame(() => {
        window.focus();
        inputRef.current?.focus();
    });

    try {
      const formData = new FormData();
      formData.append('message', userText);
      formData.append('sessionId', sessionId);
      if (currentFile) {
        formData.append('file', currentFile);
      }

      const data = await aiApi.chatWithFile(formData); 
      
      setMessages(prev => [...prev, { id: Date.now() + 1, role: 'ai', text: data.reply }]);
      
      if (data.logs && onLogs) onLogs(data.logs);
      if (onActivity) onActivity('receive');
      if (data.title && onTitleUpdate) onTitleUpdate(data.title);

      if (data.sources && onContextUpdate) {
        onContextUpdate(data.sources);
      } else if (onContextUpdate) {
        onContextUpdate([]); 
      }

    } catch (error) {
      console.error(error);
      setMessages(prev => [...prev, { id: Date.now() + 1, role: 'system', text: 'Error: Data transmission failed.' }]);
    } finally {
      setIsProcessing(false);
      requestAnimationFrame(() => {
          window.focus();
          inputRef.current?.focus();
      });
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.nativeEvent.isComposing) return;
    if (e.key === 'Enter') handleSend();
  };

  return (
    <div className="flex flex-col h-full min-h-0 bg-[var(--bg-card)] rounded-xl overflow-hidden relative font-sans">
      <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-thin">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] px-5 py-3.5 rounded-2xl text-sm leading-7 whitespace-pre-wrap shadow-sm break-all
              ${msg.role === 'user' 
                ? 'bg-[var(--text-main)] text-[var(--bg-main)] rounded-tr-sm font-medium' 
                : msg.role === 'system'
                    ? 'text-xs text-[var(--text-muted)] w-full text-center bg-transparent shadow-none'
                    : 'bg-[var(--bg-main)] text-[var(--text-main)] rounded-tl-sm border border-[var(--border-main)]'
              }`}>
              {msg.text}
            </div>
          </div>
        ))}
        {isProcessing && (
           <div className="flex justify-start">
             <div className="bg-[var(--bg-main)] px-5 py-4 rounded-2xl rounded-tl-sm border border-[var(--border-main)] flex gap-1.5 items-center h-[52px] shadow-sm">
               <div className="w-1.5 h-1.5 bg-[var(--text-muted)] rounded-full animate-bounce"></div>
               <div className="w-1.5 h-1.5 bg-[var(--text-muted)] rounded-full animate-bounce delay-100"></div>
               <div className="w-1.5 h-1.5 bg-[var(--text-muted)] rounded-full animate-bounce delay-200"></div>
             </div>
           </div>
        )}
        <div ref={scrollRef} />
      </div>

      <div className="p-4 border-t border-[var(--border-main)] bg-[var(--bg-card)] shrink-0">
        {selectedFile && (
            <div className="flex items-center gap-2 mb-3 px-3 py-1.5 bg-[var(--bg-main)] border border-[var(--border-main)] rounded-lg text-xs font-medium text-[var(--text-main)] w-fit shadow-sm">
                <svg className="w-3.5 h-3.5 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
                {selectedFile.name}
                <button onClick={() => { setSelectedFile(null); if(fileInputRef.current) fileInputRef.current.value=''; }} className="ml-2 text-[var(--text-muted)] hover:text-red-500">✕</button>
            </div>
        )}

        <div className="flex gap-2 items-center bg-[var(--bg-main)] border border-[var(--border-main)] rounded-full px-3 py-2.5 focus-within:border-[var(--text-main)] transition-all shadow-sm">
            <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileSelect} 
                className="hidden" 
                id="file-upload"
            />
            <label 
                htmlFor="file-upload" 
                className="p-2 text-[var(--text-muted)] hover:text-[var(--text-main)] cursor-pointer hover:bg-[var(--bg-card)] rounded-full transition-colors"
                title="Attach file"
            >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"></path></svg>
            </label>

            <input 
                ref={inputRef}
                autoFocus={true} 
                className="flex-1 bg-transparent outline-none text-[var(--text-main)] text-sm placeholder-[var(--text-muted)] px-2 min-w-0"
                placeholder="Message Jarvis..." 
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={isProcessing}
            />
            <button 
                onClick={handleSend} 
                disabled={(!input.trim() && !selectedFile) || isProcessing} 
                className={`p-2.5 rounded-full shrink-0 transition-all shadow-sm ${(!input.trim() && !selectedFile) ? 'bg-[var(--bg-card)] text-[var(--text-muted)]' : 'bg-[var(--text-main)] text-[var(--bg-main)] hover:scale-105 active:scale-95'}`}
            >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 12h14M12 5l7 7-7 7"></path></svg>
            </button>
        </div>
      </div>
    </div>
  );
}