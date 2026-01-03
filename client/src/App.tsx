import { useState, useEffect, type KeyboardEvent } from 'react';
import AICore from './components/AICore';
import { api } from './api'; 
import type { WeatherData } from './api/weather';
import type { TabType, AiState, TodoItem, ChatMessage } from './types'; 

export default function App() {
  const [activeTab, setActiveTab] = useState<TabType>('HOME');
  const [input, setInput] = useState('');
  const [aiState, setAiState] = useState<AiState>('idle');
  const [currentTime, setCurrentTime] = useState(new Date());
  
  const [todos, setTodos] = useState<TodoItem[]>([]);
  const [weather, setWeather] = useState<WeatherData | null>(null);
  
  const [messages, setMessages] = useState<ChatMessage[]>([
    { id: 1, text: '시스템이 데이터베이스에 연결되었습니다.', sender: 'ai' },
  ]);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        try {
          const data = await api.weather.get(latitude, longitude);
          setWeather(data);
        } catch (e) {
          console.error("날씨 로드 실패");
        }
      },
      (error) => {
        api.weather.get(37.5665, 126.9780).then(setWeather).catch(console.error);
      }
    );
  }, []);

  const getWeatherKo = (condition: string) => {
    const map: Record<string, string> = {
      'Clear': '맑음',
      'Clouds': '흐림',
      'Rain': '비',
      'Snow': '눈',
      'Drizzle': '이슬비',
      'Thunderstorm': '뇌우',
      'Mist': '안개',
      'Haze': '연무'
    };
    return map[condition] || condition;
  };

  useEffect(() => {
    loadTodos();
  }, []);

  const loadTodos = async () => {
    try {
      const data = await api.todo.getAll();
      setTodos(data);
    } catch (error) {
        console.error('할 일 목록 로드 실패', error);
    }
  };

  const handleAddTodo = async (e: KeyboardEvent<HTMLInputElement>) => {
    if(e.key === 'Enter' && e.currentTarget.value.trim()) {
        const text = e.currentTarget.value;
        try {
            const newTodo = await api.todo.create({ text, done: false });
            setTodos([...todos, newTodo]);    
            e.currentTarget.value = '';       
        } catch (error) {
            console.error('Todo 추가 실패');
        }
    }
  };

  const toggleTodo = async (id: string, currentDone: boolean) => {
    const originalTodos = [...todos];
    setTodos(todos.map(todo => todo._id === id ? { ...todo, done: !currentDone } : todo));

    try {
        await api.todo.update(id, !currentDone);
    } catch (error) {
        setTodos(originalTodos);
    }
  };

  const handleInputEnter = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && input.trim()) {
      const newMsg: ChatMessage = { id: Date.now(), text: input, sender: 'user' };
      setMessages([...messages, newMsg]);
      
      setAiState('processing');
      setTimeout(() => {
        setAiState('speaking');
        setMessages(prev => [...prev, { id: Date.now() + 1, text: '메시지를 확인했습니다.', sender: 'ai' }]);
        setTimeout(() => setAiState('idle'), 2000);
      }, 1000);
      setInput('');
    }
  };

  const formatTime = (date: Date) => date.toLocaleTimeString('ko-KR', { hour12: false, hour: '2-digit', minute: '2-digit' });
  const formatDate = (date: Date) => date.toLocaleDateString('ko-KR', { month: 'long', day: 'numeric', weekday: 'long' });

  return (
    <div className="flex h-screen bg-black text-gray-200 overflow-hidden font-sans rounded-2xl tracking-tight border border-neutral-900 selection:bg-white selection:text-black draggable-area">
      
      {/* sidebar */}
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
                activeTab === tab ? 'text-white' : 'text-neutral-600 hover:text-neutral-400'
              }`}
            >
              {activeTab === tab && <div className="absolute left-0 top-2 bottom-2 w-0.5 bg-white shadow-[0_0_10px_white]"></div>}
              <span className="uppercase tracking-widest">{tab}</span>
            </button>
          ))}
        </div>
      </div>

      {/* main content */}
      <div className="flex-1 flex flex-col bg-black relative">
        <div className="absolute top-2 right-1.5 z-50 flex gap-2">
           <div className="w-3 h-3 bg-neutral-400 hover:bg-neutral-600 transition-colors cursor-pointer non-draggable"></div>
        </div>

        {activeTab === 'HOME' && (
            <div className="flex-1 p-6 grid grid-rows-[auto_1fr_1fr] gap-4 overflow-hidden non-draggable">
                <div className="grid grid-cols-2 gap-4 h-32">
                    {/* watch */}
                    <div className="bg-neutral-900/50 border border-neutral-800 p-6 flex flex-col justify-center">
                        <h1 className="text-4xl font-light text-white tracking-tighter tabular-nums">
                            {formatTime(currentTime)}
                            <span className="text-2xl text-neutral-300 ml-2 font-normal animate-pulse"> 
                                : {currentTime.getSeconds().toString().padStart(2, '0')}
                            </span>
                        </h1>
                        <p className="text-lg text-neutral-500 mt-1 uppercase tracking-widest">{formatDate(currentTime)}</p>
                    </div>
                    {/* weather */}
                    <div className="bg-neutral-900/50 border border-neutral-800 p-6 flex flex-col justify-center items-end text-right">
                        {weather ? (
                            <>
                                <div className="text-3xl font-light text-white flex items-center gap-3">
                                    <span className="text-lg uppercase tracking-widest text-neutral-400">
                                        {weather.location === 'Seoul' ? '서울' : weather.location}
                                    </span>
                                    <span>{getWeatherKo(weather.condition)}</span>
                                    <span className="text-4xl font-normal">{weather.temp}°C</span>
                                </div>
                                <div className="text-sm text-neutral-500 mt-2 uppercase tracking-widest flex gap-3">
                                    <span>최고: {weather.max}° 최저: {weather.min}°</span>
                                    <span>습도: {weather.humidity}%</span>
                                </div>
                            </>
                        ) : (
                            /* 로딩 상태 */
                            <div className="flex flex-col items-end gap-2 animate-pulse">
                                <div className="h-8 w-32 bg-neutral-800 rounded"></div>
                                <div className="h-4 w-24 bg-neutral-800 rounded"></div>
                            </div>
                        )}
                    </div>
                </div>

                {/* briping */}
                <div className="bg-neutral-900/20 border border-neutral-800 p-6 relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-1 h-full bg-white"></div>
                    <h3 className="text-[14px] text-neutral-500 font-bold uppercase tracking-widest mb-3 flex justify-between">
                        <span>주요 브리핑</span>
                        <span className="text-green-500 animate-pulse">실시간</span>
                    </h3>
                    <div className="prose prose-invert max-w-none">
                        <p className="text-lg text-gray-200 font-light leading-relaxed">
                            "현서님, <span className="text-white font-medium border-b border-neutral-600">MongoDB</span> 연결에 성공했습니다. 
                            모든 작업 내역이 실시간으로 동기화되고 있습니다."
                        </p>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4 min-h-0">
                    {/* issue */}
                    <div className="bg-neutral-900/20 border border-neutral-800 p-5 flex flex-col min-h-0">
                        <h3 className="text-[12px] text-neutral-500 font-bold uppercase tracking-widest mb-4">오늘의 이슈</h3>
                        <ul className="space-y-3 overflow-y-auto scrollbar-hide">
                            <li className="text-xs text-gray-400 flex justify-between cursor-pointer hover:text-white transition-colors">
                                <span className="truncate w-3/4">1. React 19 정식 출시</span>
                                <span className="text-neutral-600">개발</span>
                            </li>
                        </ul>
                    </div>

                    {/* Todo list */}
                    <div className="bg-neutral-900/20 border border-neutral-800 p-5 flex flex-col min-h-0">
                        <h3 className="text-[12px] text-neutral-500 font-bold uppercase tracking-widest mb-4 flex justify-between items-center">
                            <span>할 일 목록 (DB)</span>
                            <span className="text-white">{todos.filter(t => !t.done).length}건 남음</span>
                        </h3>
                        
                        <div className="flex-1 overflow-y-auto space-y-2 pr-1 scrollbar-thin scrollbar-thumb-neutral-800">
                             {todos.length === 0 ? (
                                <div className="text-neutral-600 text-xs text-center mt-10">데이터베이스에 할 일이 없습니다.</div>
                             ) : (
                                 todos.map(todo => (
                                    <div 
                                        key={todo._id} 
                                        onClick={() => toggleTodo(todo._id, todo.done)}
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
                                 ))
                             )}
                        </div>
                        
                         <div className="mt-2 border-t border-neutral-800 pt-2">
                            <input 
                                className="w-full bg-transparent text-xs text-white placeholder-neutral-700 outline-none"
                                placeholder="+ 할 일 추가 (DB 저장)"
                                onKeyDown={handleAddTodo}
                            />
                        </div>
                    </div>
                </div>
            </div>
        )}

        {activeTab !== 'HOME' && <div className="text-neutral-600 p-10">{activeTab} 모듈 준비 중입니다.</div>}

      </div>
    </div>
  )
}