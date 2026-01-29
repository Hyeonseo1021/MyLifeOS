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
          setMessages([{ id: Date.now(), role: 'ai', text: '안녕하세요!' }]);
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
        {selectedFile && (
            <div className="flex items-center gap-2 mb-2 px-3 py-1.5 bg-neutral-900 border border-neutral-800 rounded text-xs text-green-400 w-fit">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
                {selectedFile.name}
                <button onClick={() => { setSelectedFile(null); if(fileInputRef.current) fileInputRef.current.value=''; }} className="ml-2 hover:text-red-400">✕</button>
            </div>
        )}

        <div className="flex gap-2 items-center bg-neutral-900 border border-neutral-800 rounded-full px-2 py-2 focus-within:border-neutral-600 transition-colors">
            <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileSelect} 
                className="hidden" 
                id="file-upload"
            />
            <label 
                htmlFor="file-upload" 
                className="p-2 text-neutral-400 hover:text-white cursor-pointer hover:bg-neutral-800 rounded-full transition-colors"
                title="Attach file to Context"
            >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"></path></svg>
            </label>

            <input 
                ref={inputRef}
                autoFocus={true} 
                className="flex-1 bg-transparent outline-none text-white text-sm placeholder-neutral-500 px-1 min-w-0"
                placeholder="메시지 입력 또는 파일 업로드..." 
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={isProcessing}
            />
            <button 
                onClick={handleSend} 
                disabled={(!input.trim() && !selectedFile) || isProcessing} 
                className={`p-2 rounded-full shrink-0 transition-all ${(!input.trim() && !selectedFile) ? 'bg-neutral-800 text-neutral-600' : 'bg-white text-black'}`}
            >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 12h14M12 5l7 7-7 7"></path></svg>
            </button>
        </div>
      </div>
    </div>
  );
}