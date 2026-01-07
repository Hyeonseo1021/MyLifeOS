import { useState, useEffect, type KeyboardEvent, type MouseEvent } from 'react';
import { api } from '../api'; 
import InteractiveCalendar from '../components/InteractiveCalendar';
import { useAiSystem } from '../hooks/useAiSystem'; // 에이전트 훅 import
import { getYMD, formatTime, formatDate } from '../utils/date';
import type { WeatherData } from '../api/weather';
import type { TodoItem, AiState } from '../types';

interface HomeProps {
  setAiState: (state: AiState) => void;
}

export default function Home({ setAiState }: HomeProps) {
  const [input, setInput] = useState('');
  const [currentTime, setCurrentTime] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [todos, setTodos] = useState<TodoItem[]>([]);
  const [weather, setWeather] = useState<WeatherData | null>(null);

  const { displayedText, aiStatus } = useAiSystem(weather, todos);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    navigator.geolocation.getCurrentPosition(
      async (p) => {
        try {
          const data = await api.weather.get(p.coords.latitude, p.coords.longitude);
          setWeather(data);
        } catch(e) {}
      },
      () => api.weather.get(37.5665, 126.9780).then(setWeather).catch()
    );
  }, []);

  useEffect(() => { loadTodos(); }, []);

  const loadTodos = async () => {
    try {
      const data = await api.todo.getAll();
      setTodos(data);
    } catch (error) { console.error(error); }
  };

  const addTodo = async () => {
    if (!input.trim()) return;
    const text = input;
    const dateStr = getYMD(selectedDate);
    const tempId = Date.now().toString(); 
    
    const optimisticTodo: TodoItem = { _id: tempId, text, done: false, date: dateStr };
    setTodos(prev => [...prev, optimisticTodo]);
    setInput('');

    try {
        const newTodo = await api.todo.create({ text, done: false, date: dateStr });
        setTodos(prev => prev.map(t => t._id === tempId ? newTodo : t));
    } catch (error) {
        console.error(error);
        setTodos(prev => prev.filter(t => t._id !== tempId));
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.nativeEvent.isComposing) return; 
    if (e.key === 'Enter') addTodo();
  };

  const handleDeleteTodo = async (id: string, e: MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation(); 
    const originalTodos = [...todos];
    setTodos(todos.filter(t => t._id !== id));

    if (id.length < 24) return; 

    try { await api.todo.delete(id); } 
    catch (error) { setTodos(originalTodos); }
  };

  const toggleTodo = async (id: string, currentDone: boolean) => {
    const original = [...todos];
    setTodos(todos.map(t => t._id === id ? { ...t, done: !currentDone } : t));
    try { await api.todo.update(id, !currentDone); } catch { setTodos(original); }
  };

  const getWeatherKo = (c: string) => {
    const map: any = { 'Clear':'맑음','Clouds':'흐림','Rain':'비','Snow':'눈','Mist':'안개' };
    return map[c] || c;
  };

  const filteredTodos = todos.filter(todo => todo.date === getYMD(selectedDate));

  const getStatusLabel = (status: string) => {
    switch(status) {
        case 'ANALYZING': return { text: 'ANALYZING DATA...', color: 'text-blue-500' };
        case 'GENERATING': return { text: 'GENERATING BRIEF...', color: 'text-purple-500' }; // 변경됨
        case 'COMPLETED': return { text: 'SYSTEM ONLINE', color: 'text-green-500' };
        case 'ERROR': return { text: 'CONNECTION LOST', color: 'text-red-500' }; // 추가됨
        default: return { text: 'STANDBY', color: 'text-neutral-600' };
    }
  };
  const statusInfo = getStatusLabel(aiStatus);

  return (
    <div className="flex-1 p-6 grid grid-rows-[auto_auto_1fr] gap-4 overflow-hidden non-draggable">
        
        {/* 1. Header Row  */}
        <div className="grid grid-cols-2 gap-4 h-32">
            <div className="bg-neutral-900/50 border border-neutral-800 p-6 flex flex-col justify-center">
                <h1 className="text-4xl font-light text-white tracking-tighter tabular-nums">
                    {formatTime(currentTime)}
                    <span className="text-2xl text-neutral-500 ml-2 font-normal animate-pulse"> 
                        : {currentTime.getSeconds().toString().padStart(2, '0')}
                    </span>
                </h1>
                <p className="text-lg text-neutral-500 mt-1 uppercase tracking-widest">{formatDate(currentTime)}</p>
            </div>
            <div className="bg-neutral-900/50 border border-neutral-800 p-6 flex flex-col justify-center items-end text-right">
                {weather ? (
                    <>
                        <div className="text-3xl font-light text-white flex items-center gap-3">
                            <span className="text-lg uppercase tracking-widest text-neutral-500">
                                {weather.location === 'Seoul' ? '서울' : weather.location}
                            </span>
                            <span className="text-neutral-300">{getWeatherKo(weather.condition)}</span>
                            <span className="text-4xl font-normal">{weather.temp}°C</span>
                        </div>
                        <div className="text-sm text-neutral-500 mt-2 uppercase tracking-widest flex gap-3">
                            <span>최고: {weather.max}° 최저: {weather.min}°</span>
                            <span>습도: {weather.humidity}%</span>
                        </div>
                    </>
                ) : (
                    <div className="flex flex-col items-end gap-2 animate-pulse">
                        <div className="h-8 w-32 bg-neutral-800 rounded"></div>
                        <div className="h-4 w-24 bg-neutral-800 rounded"></div>
                    </div>
                )}
            </div>
        </div>

        {/* 2. Middle Row */}
        <div className="grid grid-cols-2 gap-4 h-[500px] shrink-0">
            
            <div className="bg-neutral-900/20 border border-neutral-800 p-6 relative overflow-hidden flex flex-col group transition-colors hover:border-neutral-700">
                <div className="absolute top-0 left-0 w-1 h-full bg-white transition-all duration-500 group-hover:bg-blue-500"></div>
                
                {/* Agent Status Indicator */}
                <h3 className="text-[14px] font-bold uppercase tracking-widest mb-4 flex justify-between shrink-0 items-center">
                    <span className="text-neutral-500">Daily BRIEFING</span>
                    <span className={`text-[12px] border border-neutral-800 px-2 py-0.5 rounded flex items-center gap-2 ${statusInfo.color} animate-pulse`}>
                        {aiStatus !== 'COMPLETED' && aiStatus !== 'IDLE' && (
                             <svg className="animate-spin h-2 w-2" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path></svg>
                        )}
                        {statusInfo.text}
                    </span>
                </h3>

                {/* Typing Text Area */}
                <div className="prose prose-invert max-w-none flex-1 overflow-y-auto scrollbar-hide">
                    {displayedText ? (
                        <p className="text-lg text-gray-300 leading-relaxed">
                            {displayedText}
                            <span className="inline-block w-2 h-5 ml-1 bg-white animate-pulse align-middle"></span>
                        </p>
                    ) : (
                        <div className="flex flex-col gap-2 mt-4 opacity-50">
                            <div className="h-2 bg-neutral-800 rounded w-3/4 animate-pulse"></div>
                            <div className="h-2 bg-neutral-800 rounded w-1/2 animate-pulse delay-75"></div>
                            <div className="h-2 bg-neutral-800 rounded w-5/6 animate-pulse delay-150"></div>
                        </div>
                    )}
                </div>

                {/* Agent Signature */}
                <div className="mt-4 pt-4 border-t border-neutral-800/50 flex gap-4 text-[10px] text-neutral-600 font-mono uppercase">
                    <div className="flex items-center gap-1">
                        <div className={`w-1.5 h-1.5 rounded-full ${aiStatus === 'COMPLETED' ? 'bg-green-500' : 'bg-neutral-600'}`}></div>
                        System Intelligence
                    </div>
                    <div className="flex items-center gap-1">
                        <span className="text-neutral-700">|</span>
                    </div>
                    <div className="flex items-center gap-1">
                        Powered by LangChain
                    </div>
                </div>
            </div>

            {/* Calendar */}
            <div className="bg-neutral-900/20 border border-neutral-800 p-5 flex flex-col justify-center overflow-hidden">
                 <InteractiveCalendar 
                    selectedDate={selectedDate} 
                    onSelectDate={setSelectedDate}
                    todos={todos}
                />
            </div>
        </div>

        {/* 3. Bottom Row */}
        <div className="grid grid-cols-2 gap-4 min-h-0">
            {/* Issues */}
            <div className="bg-neutral-900/20 border border-neutral-800 p-5 flex flex-col min-h-0">
                <h3 className="text-[12px] text-neutral-500 font-bold uppercase tracking-widest mb-4">오늘의 이슈</h3>
                <ul className="space-y-3 overflow-y-auto scrollbar-hide">
                    <li className="text-xs text-neutral-400 flex justify-between cursor-pointer hover:text-white transition-colors">
                        <span className="truncate w-3/4">1. React 19 정식 출시</span>
                        <span className="text-neutral-600">개발</span>
                    </li>
                    <li className="text-xs text-neutral-400 flex justify-between cursor-pointer hover:text-white transition-colors">
                        <span className="truncate w-3/4">2. Apple M4 칩 성능 유출</span>
                        <span className="text-neutral-600">테크</span>
                    </li>
                </ul>
            </div>

            {/* Todo List */}
            <div className="bg-neutral-900/20 border border-neutral-800 p-5 flex flex-col min-h-0">
                <div className="flex justify-between items-center mb-4 shrink-0">
                    <h3 className="text-[10px] text-neutral-300 font-bold uppercase tracking-widest bg-neutral-800 px-2 py-1 rounded">
                        Tasks ({getYMD(selectedDate)})
                    </h3>
                    <span className="text-[10px] text-white">{filteredTodos.filter(t => !t.done).length} Remaining</span>
                </div>
                
                <div className="flex-1 overflow-y-auto space-y-2 pr-1 scrollbar-thin scrollbar-thumb-neutral-800">
                     {filteredTodos.length === 0 ? (
                        <div className="text-neutral-600 text-[10px] text-center mt-10">
                            {selectedDate.getDate()}일에 할 일이 없습니다.<br/>
                            Enter를 눌러 새로운 작업을 추가하세요.
                        </div>
                     ) : (
                         filteredTodos.map(todo => (
                            <div key={todo._id} onClick={() => toggleTodo(todo._id, todo.done)}
                                className="flex items-center gap-3 p-3 hover:bg-neutral-800/50 cursor-pointer group rounded bg-neutral-900/30 border border-transparent hover:border-neutral-800 transition-all">
                                <div className={`w-4 h-4 border flex items-center justify-center transition-all duration-200 ${
                                    todo.done ? 'bg-white border-white' : 'border-neutral-600 bg-transparent'}`}>
                                    {todo.done && <svg className="w-3 h-3 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path></svg>}
                                </div>
                                <span className={`text-sm truncate flex-1 ${todo.done ? 'line-through text-neutral-600' : 'text-gray-200'}`}>
                                    {todo.text}
                                </span>
                                <button onClick={(e) => handleDeleteTodo(todo._id, e)}
                                    className="text-neutral-500 hover:text-white opacity-0 group-hover:opacity-100 transition-all text-xs px-2"
                                    title="삭제">✕</button>
                            </div>
                         ))
                     )}
                </div>
                
                <div className="mt-4 border-t border-neutral-800 pt-3 shrink-0 flex gap-2">
                    <input 
                        className="flex-1 bg-transparent text-sm text-white placeholder-neutral-600 outline-none"
                        placeholder={`+ ${selectedDate.getDate()}일 할 일 입력`}
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={handleKeyDown}
                    />
                    <button onClick={addTodo} className="bg-white text-black text-xs font-bold px-3 py-1 rounded hover:bg-gray-200 transition-colors">추가</button>
                </div>
            </div>
        </div>
    </div>
  );
}