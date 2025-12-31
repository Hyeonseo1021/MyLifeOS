import { useState, useEffect } from 'react'
import type { KeyboardEvent } from 'react'
import AICore from './components/AICore'

type TabType = 'HOME' | 'MLO' | 'MEMORY' | 'SETTINGS';

interface TodoItem {
  id: number;
  text: string;
  done: boolean;
}

interface ChatMessage {
  id: number;
  text: string;
  sender: 'user' | 'ai';
}

export default function App() {
  const [activeTab, setActiveTab] = useState<TabType>('HOME');
  const [input, setInput] = useState('');
  const [aiState, setAiState] = useState<'idle' | 'processing' | 'speaking'>('idle');
  const [currentTime, setCurrentTime] = useState(new Date());

  const [todos, setTodos] = useState<TodoItem[]>([
    { id: 1, text: '캡스톤 디자인 보고서 작성', done: false },
    { id: 2, text: '클라우드 비용 결제 확인', done: true },
    { id: 3, text: '부모님 생신 선물 주문', done: false },
    { id: 4, text: '알고리즘 1문제 풀기', done: false },
  ]);

  const [messages, setMessages] = useState<ChatMessage[]>([
    { id: 1, text: '오늘 날씨랑 이슈 좀 알려줘.', sender: 'user' },
    { id: 2, text: '현재 서울 맑음, 3도입니다. IT 분야에서는 새로운 AI 모델 발표가 이슈입니다.', sender: 'ai' },
  ]);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const handleInputEnter = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && input.trim()) {
      const newMsg: ChatMessage = { id: Date.now(), text: input, sender: 'user' };
      setMessages([...messages, newMsg]);
      
      setAiState('processing');
      setTimeout(() => {
          setAiState('speaking');
          if (activeTab === 'HOME') {
            setMessages(prev => [...prev, { id: Date.now() + 1, text: '확인했습니다.', sender: 'ai' }]);
          }
          setTimeout(() => setAiState('idle'), 2000);
      }, 1000);
      setInput('');
    }
  };

  const toggleTodo = (id: number) => {
    setTodos(todos.map(todo => todo.id === id ? { ...todo, done: !todo.done } : todo));
  };

  const formatTime = (date: Date) => date.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' });
  const formatDate = (date: Date) => date.toLocaleDateString('ko-KR', { month: 'long', day: 'numeric', weekday: 'long' });

  return (
    <div className="flex h-screen bg-black text-gray-200 overflow-hidden font-sans rounded-2xl tracking-tight border border-neutral-900 selection:bg-white selection:text-black draggable-area">
      
      <div className="w-24 flex flex-col border-r border-neutral-800 bg-neutral-950">
        <div className="h-32 flex flex-col items-center justify-center border-b border-neutral-800 py-4">
            <div className="scale-75 cursor-pointer non-draggable">
                <AICore state={aiState} />
            </div>
        </div>
        
        <div className="flex-1 flex flex-col py-4 space-y-4">
          {(['HOME', 'MLO', 'MEMORY', 'SETTINGS'] as TabType[]).map((tab) => (
            <button 
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`w-full py-3 text-[12px] font-bold transition-all duration-200 relative group flex justify-center items-center non-draggable ${
                activeTab === tab 
                ? 'text-white' 
                : 'text-neutral-600 hover:text-neutral-400'
              }`}
            >
              {activeTab === tab && <div className="absolute left-0 top-2 bottom-2 w-0.5 bg-white shadow-[0_0_10px_white]"></div>}
              <span className="uppercase tracking-widest">{tab}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 flex flex-col bg-black relative">
        
        <div className="absolute top-2 right-1.5 z-50 flex gap-2">
           <div className="w-3 h-3 bg-neutral-400 hover:bg-neutral-600 transition-colors cursor-pointer non-draggable"></div>
        </div>

        {activeTab === 'HOME' && (
            <div className="flex-1 p-6 grid grid-rows-[auto_1fr_1fr] gap-4 overflow-hidden non-draggable">
                
                <div className="grid grid-cols-2 gap-4 h-32">
                    <div className="bg-neutral-900/50 border border-neutral-800 p-6 flex flex-col justify-center">
                        <h1 className="text-4xl font-light text-white tracking-tighter tabular-nums">
                            {formatTime(currentTime)}
                            <span className="text-2xl text-neutral-300 ml-2 font-normal animate-pulse"> : {currentTime.getSeconds().toString().padStart(2, '0')}</span>
                        </h1>
                        <p className="text-lg text-neutral-500 mt-1 uppercase tracking-widest">{formatDate(currentTime)}</p>
                    </div>

                    <div className="bg-neutral-900/50 border border-neutral-800 p-6 flex flex-col justify-center items-end text-right">
                         <div className="text-3xl font-light text-white flex items-center gap-3">
                            <span>Sunny</span>
                            <span className="text-4xl">3°C</span>
                         </div>
                         <div className="text-lg text-neutral-500 mt-2 uppercase tracking-widest flex gap-3">
                            <span>H: 8° L: -2°</span>
                            <span>Hum: 45%</span>
                            <span>Seoul</span>
                         </div>
                    </div>
                </div>

                <div className="bg-neutral-900/20 border border-neutral-800 p-6 relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-1 h-full bg-white"></div>
                    <h3 className="text-[12px] text-neutral-500 font-bold uppercase tracking-widest mb-3 flex justify-between">
                        <span>Executive Briefing</span>
                        <span className="text-green-500">● LIVE</span>
                    </h3>
                    <div className="prose prose-invert max-w-none">
                        <p className="text-lg text-gray-200 font-light leading-relaxed">
                            "현서님, <span className="text-white font-medium border-b border-neutral-600">오후 업무 집중 시간</span>입니다. 
                            예정된 캡스톤 회의가 2시간 남았습니다."
                        </p>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4 min-h-0">
                    <div className="bg-neutral-900/20 border border-neutral-800 p-5 flex flex-col min-h-0">
                        <h3 className="text-[12px] text-neutral-500 font-bold uppercase tracking-widest mb-4">Daily Issues</h3>
                        <ul className="space-y-3 overflow-y-auto scrollbar-hide">
                            <li className="text-xs text-gray-400 flex justify-between cursor-pointer hover:text-white transition-colors">
                                <span className="truncate w-3/4">1. React 19 정식 릴리즈 소식</span>
                                <span className="text-neutral-600">IT</span>
                            </li>
                            <li className="text-xs text-gray-400 flex justify-between cursor-pointer hover:text-white transition-colors">
                                <span className="truncate w-3/4">2. 엔비디아 주가 사상 최고치</span>
                                <span className="text-neutral-600">Eco</span>
                            </li>
                        </ul>
                    </div>

                    <div className="bg-neutral-900/20 border border-neutral-800 p-5 flex flex-col min-h-0">
                        <h3 className="text-[12px] text-neutral-500 font-bold uppercase tracking-widest mb-4 flex justify-between items-center">
                            <span>Action Items</span>
                            <span className="text-white">{todos.filter(t=>!t.done).length} Remaining</span>
                        </h3>
                        <div className="flex-1 overflow-y-auto space-y-2 pr-1 scrollbar-thin scrollbar-thumb-neutral-800">
                             {todos.map(todo => (
                                <div 
                                    key={todo.id} 
                                    onClick={() => toggleTodo(todo.id)}
                                    className="flex items-center gap-3 p-2 hover:bg-neutral-800/50 cursor-pointer group rounded"
                                >
                                    <div className={`w-3 h-3 border border-neutral-600 flex items-center justify-center transition-colors ${
                                        todo.done ? 'bg-neutral-700 border-neutral-700' : 'bg-transparent'
                                    }`}>
                                        {todo.done && <div className="w-1.5 h-1.5 bg-black"></div>}
                                    </div>
                                    <span className={`text-xs truncate ${todo.done ? 'line-through text-neutral-600' : 'text-gray-300'}`}>
                                        {todo.text}
                                    </span>
                                </div>
                             ))}
                        </div>
                         <div className="mt-2 border-t border-neutral-800 pt-2">
                            <input 
                                className="w-full bg-transparent text-xs text-white placeholder-neutral-700 outline-none"
                                placeholder="+ New Task"
                                onKeyDown={(e) => {
                                    if(e.key === 'Enter' && e.currentTarget.value.trim()) {
                                        setTodos([...todos, {id: Date.now(), text: e.currentTarget.value, done: false}]);
                                        e.currentTarget.value = '';
                                    }
                                }}
                            />
                        </div>
                    </div>
                </div>
            </div>
        )}

        {activeTab === 'MLO' && (
            <div className="flex-1 flex flex-col non-draggable">
                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                    {messages.map(msg => (
                        <div key={msg.id} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                            <div className={`max-w-[80%] p-4 text-sm border ${
                                msg.sender === 'user' ? 'bg-white text-black border-white' : 'bg-black text-gray-300 border-neutral-800'
                            }`}>
                                {msg.text}
                            </div>
                        </div>
                    ))}
                </div>
                <div className="p-6 border-t border-neutral-900 bg-black">
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={handleInputEnter}
                        placeholder="Type a message..."
                        className="w-full bg-neutral-900 text-white px-4 py-3 text-sm outline-none border border-neutral-800 focus:border-neutral-600 transition-colors"
                    />
                </div>
            </div>
        )}

        {(activeTab === 'MEMORY' || activeTab === 'SETTINGS') && (
             <div className="flex-1 flex items-center justify-center text-neutral-700 text-xs tracking-widest uppercase non-draggable">
                Module Under Construction
             </div>
        )}

      </div>
    </div>
  )
}