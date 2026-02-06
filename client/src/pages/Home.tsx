import { useState, useEffect, useRef, type KeyboardEvent, type MouseEvent } from 'react';
import { api } from '../api'; 
import InteractiveCalendar from '../components/InteractiveCalendar';
import { useAiSystem } from '../hooks/useAiSystem';
import { useNotification } from '../hooks/useNotification';
import { getYMD, formatTime, formatDate } from '../utils/date';
import type { WeatherData } from '../api/weather';
import type { TodoItem, AiState, IssueItem } from '../types';

interface HomeProps {
  setAiState: (state: AiState) => void;
}

export default function Home({ setAiState }: HomeProps) {
  const [input, setInput] = useState('');
  const [currentTime, setCurrentTime] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [todos, setTodos] = useState<TodoItem[]>([]);
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [issues, setIssues] = useState<IssueItem[]>([]);

  const { displayedText, aiStatus } = useAiSystem(weather, todos);
  const { requestPermission, sendNotification } = useNotification();
  const lastNotifiedHour = useRef<number | null>(null);

  useEffect(() => {
    requestPermission();

    const syncData = async () => {
      try {
        const data = await api.todo.getAll();
        setTodos(data);
      } catch(e) {}
    };

    syncData();
    const syncTimer = setInterval(syncData, 1000 * 60 * 5);

    return () => clearInterval(syncTimer);
  }, []);

  useEffect(() => {
    const checkScheduler = setInterval(() => {
      const now = new Date();
      const hour = now.getHours();
      const minute = now.getMinutes();
      const pendingCount = todos.filter(t => !t.done).length;

      if (minute === 0 && pendingCount > 0 && lastNotifiedHour.current !== hour) {
        sendNotification(`[Check-in] 할 일이 ${pendingCount}개 남았습니다!`, {
          body: "지금 확인하세요!",
          tag: 'hourly-briefing'
        });

        setAiState('speaking');
        setTimeout(() => setAiState('idle'), 4000);

        lastNotifiedHour.current = hour;
      }
    }, 1000 * 10);

    return () => clearInterval(checkScheduler);
  }, [todos, sendNotification, setAiState]);

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

  useEffect(() => {
    const fetchIssues = async () => {
      try {
        const data = await api.ai.getIssues();
        setIssues(data);
      } catch (error) { console.error(error); }
    };
    fetchIssues();
  }, []);

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
    } catch (error) { setTodos(prev => prev.filter(t => t._id !== tempId)); }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.nativeEvent.isComposing) return; 
    if (e.key === 'Enter') addTodo();
  };

  const handleDeleteTodo = async (id: string, e: MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation(); 
    const originalTodos = [...todos];
    setTodos(todos.filter(t => t._id !== id));
    try { await api.todo.delete(id); } catch (error) { setTodos(originalTodos); }
  };

  const toggleTodo = async (id: string, currentDone: boolean) => {
    const original = [...todos];
    setTodos(todos.map(t => t._id === id ? { ...t, done: !currentDone } : t));
    try { await api.todo.update(id, !currentDone); } catch { setTodos(original); }
  };

  const filteredTodos = todos.filter(todo => todo.date === getYMD(selectedDate));
  const statusInfo = (status: string) => {
    switch(status) {
        case 'ANALYZING': return { text: 'ANALYZING', color: 'text-blue-500' };
        case 'GENERATING': return { text: 'GENERATING', color: 'text-purple-500' }; 
        case 'COMPLETED': return { text: 'ONLINE', color: 'text-emerald-500' };
        default: return { text: 'STANDBY', color: 'text-[var(--text-muted)]' };
    }
  };

  return (
    <div className="flex-1 p-8 grid grid-rows-[auto_auto_1fr] gap-8 overflow-hidden transition-all duration-500 ease-in-out">
        <div className="flex justify-between items-end">
            <div className="group cursor-default">
                <div className="text-5xl font-bold tracking-tighter text-[var(--text-main)] tabular-nums leading-none">
                    {formatTime(currentTime).split(' ')[0]}
                    <span className="text-3xl opacity-20 ml-1">:{currentTime.getSeconds().toString().padStart(2, '0')}</span>
                </div>
                <div className="text-[16px] font-black uppercase tracking-[0.1em] text-[var(--text-muted)] mt-3 opacity-60 group-hover:opacity-100 transition-opacity">
                    {formatDate(currentTime)}
                </div>
            </div>

            {weather && (
                <div className="text-right space-y-1">
                    <div className="flex items-center gap-4 justify-end">
                        <span className="text-[16px] font-black px-2 py-0.5 rounded-full border border-[var(--border-main)] text-[var(--text-muted)] uppercase tracking-widest">
                            {weather.location}
                        </span>
                        <span className="text-4xl font-light text-[var(--text-main)] tracking-tight">{weather.temp}°C</span>
                    </div>
                    <div className="text-[16px] font-bold text-[var(--text-muted)] uppercase tracking-[0.2em] opacity-50">
                        {weather.condition} / 습도 {weather.humidity}%
                    </div>
                </div>
            )}
        </div>

        <div className="grid grid-cols-12 gap-8 h-[400px]">
            <div className="col-span-7 bg-[var(--bg-card)] border border-[var(--border-main)] rounded-2xl p-8 relative flex flex-col shadow-[0_4px_16px_-5px_rgba(0,0,0,0.05)] group">
                <div className="flex justify-between items-start mb-8">
                    <div className="flex items-center gap-3">
                        <div className={`w-2 h-2 rounded-full ${aiStatus === 'COMPLETED' ? 'bg-emerald-500' : 'bg-amber-500 animate-pulse'}`} />
                        <span className="text-[16px] font-black uppercase tracking-[0.1em] text-[var(--text-muted)]">Brief</span>
                    </div>
                    <span className={`text-[16px] font-bold px-2 py-1 rounded border border-[var(--border-main)] ${statusInfo(aiStatus).color}`}>
                        {statusInfo(aiStatus).text}
                    </span>
                </div>

                <div className="flex-1 overflow-y-auto pr-4 custom-scrollbar">
                    {displayedText ? (
                        <p className="text-xl text-[var(--text-main)] leading-[1.6] font-medium tracking-tight">
                            {displayedText}
                            <span className="inline-block w-1.5 h-6 ml-2 bg-[var(--accent)] animate-caret align-middle" />
                        </p>
                    ) : (
                        <div className="space-y-4 opacity-10">
                            <div className="h-4 bg-[var(--text-main)] rounded-full w-full" />
                            <div className="h-4 bg-[var(--text-main)] rounded-full w-2/3" />
                        </div>
                    )}
                </div>
            </div>

            <div className="col-span-5 bg-[var(--bg-card)] border border-[var(--border-main)] rounded-2xl p-6 shadow-[0_4px_16px_-5px_rgba(0,0,0,0.05)]">
                 <InteractiveCalendar selectedDate={selectedDate} onSelectDate={setSelectedDate} todos={todos} />
            </div>
        </div>

        <div className="grid grid-cols-12 gap-8 min-h-0">
            <div className="col-span-5 bg-[var(--bg-card)] border border-[var(--border-main)] rounded-2xl p-6 flex flex-col min-h-0 shadow-[0_4px_16px_-5px_rgba(0,0,0,0.05)]">
                <h3 className="text-[16px] font-black uppercase tracking-[0.3em] text-[var(--text-muted)] mb-6">Issue</h3>
                <div className="flex-1 overflow-y-auto space-y-4 pr-2 custom-scrollbar">
                    {issues.map((item, idx) => (
                        <div key={idx} onClick={() => window.open(item.url, '_blank')}
                            className="group cursor-pointer flex flex-col gap-1 transition-transform active:scale-[0.98]">
                            <div className="text-[14px] font-bold text-[var(--text-main)] leading-snug group-hover:text-blue-500 transition-colors line-clamp-2">
                                {item.title}
                            </div>
                            <div className="text-[12px] font-black text-[var(--text-muted)] opacity-40 uppercase tracking-widest">
                                {item.category} / 0{idx + 1}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <div className="col-span-7 bg-[var(--bg-card)] border border-[var(--border-main)] rounded-2xl p-6 flex flex-col min-h-0 shadow-[0_2px_15px_-5px_rgba(0,0,0,0.05)]">
                <div className="flex justify-between items-center mb-6">
                    <div className="flex items-center gap-3">
                        <div className="px-2 py-1 bg-[var(--text-main)] text-[var(--bg-main)] text-[16px] font-black uppercase tracking-widest rounded">Tasking</div>
                        <span className="text-[16px] font-bold text-[var(--text-muted)] opacity-50 uppercase tracking-tighter">{getYMD(selectedDate)}</span>
                    </div>
                    <span className="text-[16px] font-black text-[var(--text-main)] tabular-nums">{filteredTodos.filter(t => t.done).length}/{filteredTodos.length}</span>
                </div>
                
                <div className="flex-1 overflow-y-auto space-y-2 pr-2 custom-scrollbar">
                     {filteredTodos.length === 0 ? (
                        <div className="h-full flex items-center justify-center text-[16px] font-black text-[var(--text-muted)] uppercase tracking-[0.4em] opacity-20">Standby</div>
                     ) : (
                         filteredTodos.map(todo => (
                            <div key={todo._id} onClick={() => toggleTodo(todo._id, todo.done)}
                                className="group flex items-center gap-4 p-4 rounded-xl border border-transparent hover:border-[var(--border-main)] hover:bg-[var(--bg-main)] transition-all cursor-pointer">
                                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                                    todo.done ? 'bg-emerald-500 border-emerald-500' : 'border-[var(--border-main)]'}`}>
                                    {todo.done && <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="4" d="M5 13l4 4L19 7"></path></svg>}
                                </div>
                                <span className={`text-lg font-medium flex-1 ${todo.done ? 'line-through opacity-30 text-[var(--text-muted)]' : 'text-[var(--text-main)]'}`}>
                                    {todo.text}
                                </span>
                                <button onClick={(e) => handleDeleteTodo(todo._id, e)} className="text-[var(--text-muted)] hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity">✕</button>
                            </div>
                         ))
                     )}
                </div>
                
                <div className="mt-6 flex gap-3 items-center bg-[var(--bg-main)] p-1 rounded-full border border-[var(--border-main)] focus-within:border-[var(--text-main)] transition-all">
                    <input className="flex-1 bg-transparent px-4 py-2 text-lg text-[var(--text-main)] outline-none placeholder-[var(--text-muted)] opacity-70"
                           placeholder="할 일을 입력하세요..." value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={handleKeyDown} />
                    <button onClick={addTodo} className="bg-[var(--text-main)] text-[var(--bg-main)] text-[12px] font-black px-5 py-2.5 rounded-full uppercase tracking-widest hover:scale-[1.02] active:scale-95 transition-all">Push</button>
                </div>
            </div>
        </div>
    </div>
  );
}