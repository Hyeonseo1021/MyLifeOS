import { useState, useRef, useEffect, type KeyboardEvent } from 'react';

interface Message {
  id: number;
  role: 'user' | 'ai' | 'system';
  text: string;
}

interface ChatInterfaceProps {
  onActivity?: (type: 'send' | 'receive') => void;
}

export default function ChatInterface({ onActivity }: ChatInterfaceProps) {
  const [input, setInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  
  const [messages, setMessages] = useState<Message[]>([
    { id: 2, role: 'ai', text: '안녕하세요, 현서님. 무엇을 도와드릴까요?\n일정 추가, 문서 검색, 일상 대화가 가능합니다.' }
  ]);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isProcessing) return;

    const userText = input;
    setInput('');
    setIsProcessing(true);

    if (onActivity) onActivity('send');

    setMessages(prev => [...prev, { id: Date.now(), role: 'user', text: userText }]);

    setTimeout(() => {
      let responseText = "명령을 확인했습니다.";
      
      if (userText.includes("일정") || userText.includes("추가")) {
        responseText = "📅 To-Do List에 해당 일정을 추가할까요? (백엔드 연결 대기 중)";
      } else if (userText.includes("리액트") || userText.includes("찾아")) {
        responseText = "🔍 RAG 시스템을 통해 문서를 검색하고 있습니다... (구현 예정)";
      }

      setMessages(prev => [...prev, { id: Date.now() + 1, role: 'ai', text: responseText }]);
      setIsProcessing(false);

      if (onActivity) onActivity('receive');
    }, 1000);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.nativeEvent.isComposing) return;
    if (e.key === 'Enter') handleSend();
  };

  return (
    <div className="flex flex-col h-full bg-neutral-900/20 border border-neutral-800 rounded-lg overflow-hidden relative">
      
      <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin scrollbar-thumb-neutral-800">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[75%] px-4 py-3 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap shadow-sm
              ${msg.role === 'user' 
                ? 'bg-white text-black rounded-tr-none' 
                : msg.role === 'system'
                    ? 'text-xs text-neutral-500 w-full text-center my-2 font-mono uppercase tracking-widest'
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

      <div className="p-4 border-t border-neutral-800 bg-neutral-950/80 backdrop-blur-md">
        <div className="flex gap-2 items-center bg-neutral-900 border border-neutral-800 rounded-full px-2 py-2 focus-within:border-neutral-600 transition-colors">
            
            <button className="p-2 text-neutral-500 hover:text-white transition-colors rounded-full hover:bg-neutral-800" title="문서 업로드 (RAG)">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"></path></svg>
            </button>

            <input 
                className="flex-1 bg-transparent outline-none text-white text-sm placeholder-neutral-500 px-2"
                placeholder="AI에게 무엇이든 물어보세요..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={isProcessing}
            />
            
            <button 
                onClick={handleSend}
                disabled={!input.trim() || isProcessing}
                className={`p-2 rounded-full transition-all flex-shrink-0 ${input.trim() ? 'bg-white text-black hover:bg-gray-200' : 'bg-neutral-800 text-neutral-600'}`}
            >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 12h14M12 5l7 7-7 7"></path></svg>
            </button>
        </div>
        <p className="text-[10px] text-neutral-600 text-center mt-2 font-mono">
            MyLifeOS AI Agent v1.0 • Powered by LLM
        </p>
      </div>
    </div>
  );
}