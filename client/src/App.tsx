import { useState, useEffect, type KeyboardEvent, type MouseEvent } from 'react';
import AICore from './components/AICore';
import { api } from './api'; 
import type { WeatherData } from './api/weather';
import type { TabType, AiState, TodoItem, ChatMessage } from './types'; 

// 날짜 포맷 헬퍼 (YYYY-MM-DD)
const getYMD = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// ▼ 캘린더 컴포넌트
const InteractiveCalendar = ({ 
  selectedDate, 
  onSelectDate,
  todos 
}: { 
  selectedDate: Date; 
  onSelectDate: (date: Date) => void;
  todos: TodoItem[];
}) => {
  const year = selectedDate.getFullYear();
  const month = selectedDate.getMonth();
  
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOfMonth = new Date(year, month, 1).getDay();
  
  const days = [];
  for (let i = 0; i < firstDayOfMonth; i++) {
    days.push(<div key={`empty-${i}`}></div>);
  }

  for (let i = 1; i <= daysInMonth; i++) {
    const currentDate = new Date(year, month, i);
    const dateStr = getYMD(currentDate);
    
    const isSelected = getYMD(selectedDate) === dateStr;
    const isToday = getYMD(new Date()) === dateStr;
    const hasTodo = todos.some(t => t.date === dateStr && !t.done);

    const dayOfWeek = (firstDayOfMonth + i - 1) % 7;
    const isSunday = dayOfWeek === 0;

    days.push(
      <div key={i} className="flex flex-col items-center justify-center h-12 cursor-pointer"
           onClick={() => onSelectDate(currentDate)}>
        
        <div className={`w-8 h-8 flex items-center justify-center text-[11px] rounded-full transition-all duration-200 relative
          ${isSelected 
            ? 'bg-white text-black font-bold scale-110 shadow-lg' 
            : isToday
                ? 'border border-neutral-600 text-white' 
                : isSunday 
                    ? 'text-red-600 hover:bg-neutral-800' 
                    : 'text-neutral-400 hover:bg-neutral-800 hover:text-white'
          }`}>
          {i}
          {hasTodo && !isSelected && (
             <div className="absolute bottom-1 w-0.5 h-0.5 bg-neutral-500 rounded-full"></div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col w-full h-full justify-center">
      <div className="flex justify-between items-end mb-4 px-2">
        <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest">
            {selectedDate.toLocaleDateString('en-US', { month: 'long' })}
        </span>
        <span className="text-xs font-medium text-white tracking-widest">{year}</span>
      </div>
      
      <div className="grid grid-cols-7 mb-2">
        {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
            <div key={i} className={`text-[9px] text-center font-bold ${i === 0 ? 'text-red-700' : 'text-neutral-600'}`}>
                {d}
            </div>
        ))}
      </div>
      <div className="grid grid-cols-7 row-gap-1">
        {days}
      </div>
    </div>
  );
};

export default function App() {
  const [activeTab, setActiveTab] = useState<TabType>('HOME');
  const [input, setInput] = useState('');
  const [aiState, setAiState] = useState<AiState>('idle');
  const [currentTime, setCurrentTime] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());

  const [todos, setTodos] = useState<TodoItem[]>([]);
  const [weather, setWeather] = useState<WeatherData | null>(null);
  
  const [messages, setMessages] = useState<ChatMessage[]>([
    { id: 1, text: 'System connected.', sender: 'ai' },
  ]);

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
    if (!input.trim()) return; // 빈 칸이면 실행 안 함
    
    const text = input;
    const dateStr = getYMD(selectedDate);
    
    // 낙관적 업데이트를 위해 임시 ID 생성
    const tempId = Date.now().toString(); 
    const optimisticTodo: TodoItem = { 
        _id: tempId, 
        text, 
        done: false, 
        date: dateStr 
    };

    setTodos(prev => [...prev, optimisticTodo]); // 화면에 먼저 표시
    setInput(''); // 입력창 비우기

    try {
        const newTodo = await api.todo.create({ text, done: false, date: dateStr });
        // 서버 응답이 오면 임시 항목을 실제 항목으로 교체
        setTodos(prev => prev.map(t => t._id === tempId ? newTodo : t));
    } catch (error) {
        console.error('추가 실패:', error);
        setTodos(prev => prev.filter(t => t._id !== tempId)); // 실패 시 롤백
    }
  };

  // [추가] 엔터키 핸들러 (한국어 IME 문제 해결)
  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    // 한글 입력 중(조합 중)일 때는 이벤트 무시
    if (e.nativeEvent.isComposing) return; 
    
    if (e.key === 'Enter') {
        addTodo();
    }
  };

  const handleDeleteTodo = async (id: string, e: MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation(); 
    
    // 1. 일단 화면에서 먼저 지움 (사용자 경험 향상)
    const originalTodos = [...todos];
    setTodos(todos.filter(t => t._id !== id));

    // ▼ [핵심 수정] ID 길이가 24자리보다 짧으면 '임시 ID'입니다.
    // 즉, 아직 DB에 저장 안 된 녀석이니 서버에 요청 보내지 말고 여기서 끝냄.
    if (id.length < 24) {
        console.log('⚠️ 아직 서버에 저장되지 않은(임시) 항목이라 화면에서만 삭제했습니다.');
        return; 
    }

    try {
        // 실제 DB에 있는 항목만 서버에 삭제 요청
        await api.todo.delete(id);
    } catch (error) {
        console.error('삭제 실패:', error);
        // 진짜 서버 에러라면 다시 되살림
        setTodos(originalTodos);
    }
  };

  const toggleTodo = async (id: string, currentDone: boolean) => {
    const original = [...todos];
    setTodos(todos.map(t => t._id === id ? { ...t, done: !currentDone } : t));
    try { await api.todo.update(id, !currentDone); } catch { setTodos(original); }
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

  const getWeatherKo = (c: string) => {
    const map: any = { 'Clear':'맑음','Clouds':'흐림','Rain':'비','Snow':'눈','Mist':'안개' };
    return map[c] || c;
  };

  const filteredTodos = todos.filter(todo => todo.date === getYMD(selectedDate));

  return (
    <div className="flex h-screen bg-black text-gray-200 overflow-hidden font-sans rounded-2xl tracking-tight border border-neutral-900 selection:bg-white selection:text-black draggable-area">
      
      {/* Sidebar */}
      <div className="w-24 flex flex-col border-r border-neutral-800 bg-neutral-950">
        <div className="h-32 flex flex-col items-center justify-center border-b border-neutral-800 py-4">
            <div className="scale-75 cursor-pointer non-draggable">
                <AICore state={aiState} />
            </div>
        </div>
        <div className="flex-1 flex flex-col py-4 space-y-4">
          {(['HOME', 'MLO', 'MEMORY', 'SETTINGS'] as TabType[]).map((tab) => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className={`w-full py-3 text-[12px] font-bold transition-all relative group flex justify-center items-center non-draggable ${
                activeTab === tab ? 'text-white' : 'text-neutral-600 hover:text-neutral-400'}`}>
              {activeTab === tab && <div className="absolute left-0 top-2 bottom-2 w-0.5 bg-white shadow-[0_0_10px_white]"></div>}
              <span className="uppercase tracking-widest">{tab}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col bg-black relative">
        <div className="absolute top-2 right-1.5 z-50 flex gap-2">
           <div className="w-3 h-3 bg-neutral-400 hover:bg-neutral-600 transition-colors cursor-pointer non-draggable"></div>
        </div>

        {activeTab === 'HOME' && (
            // 레이아웃 변경: auto(시계) -> auto(브리핑/달력) -> 1fr(이슈/할일)
            <div className="flex-1 p-6 grid grid-rows-[auto_auto_1fr] gap-4 overflow-hidden non-draggable">
                
                {/* 1. Header Row: Clock & Weather */}
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

                {/* 2. Middle Row: Briefing & Calendar */}
                <div className="grid grid-cols-2 gap-4 h-90">
                    {/* Left: Briefing */}
                    <div className="bg-neutral-900/20 border border-neutral-800 p-6 relative overflow-hidden flex flex-col">
                        <div className="absolute top-0 left-0 w-1 h-full bg-white"></div>
                        <h3 className="text-[14px] text-neutral-500 font-bold uppercase tracking-widest mb-3 flex justify-between shrink-0">
                            <span>주요 브리핑</span>
                            <span className="text-white animate-pulse">LIVE</span>
                        </h3>
                        <div className="prose prose-invert max-w-none flex-1 overflow-y-auto scrollbar-hide">
                            <p className="text-lg text-gray-300 font-light leading-relaxed">
                                "현서님, <span className="text-white font-medium border-b border-neutral-600">MongoDB</span> 연결에 성공했습니다. 
                                모든 작업 내역이 실시간으로 동기화되고 있습니다. 오른쪽 캘린더에서 일정을 확인하세요."
                            </p>
                        </div>
                    </div>

                    {/* Right: Calendar (여기로 이동됨) */}
                    <div className="bg-neutral-900/20 border border-neutral-800 p-5 flex flex-col justify-center">
                         <InteractiveCalendar 
                            selectedDate={selectedDate} 
                            onSelectDate={setSelectedDate}
                            todos={todos}
                        />
                    </div>
                </div>

                {/* 3. Bottom Row: Issues & Todo List (확장됨) */}
                <div className="grid grid-cols-2 gap-4 min-h-0">
                    
                    {/* Left: Issues */}
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

                    {/* Right: Todo List (캘린더 빠지고 공간 넓어짐) */}
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
                                        
                                        {/* 체크박스 */}
                                        <div className={`w-4 h-4 border flex items-center justify-center transition-all duration-200 ${
                                            todo.done ? 'bg-white border-white' : 'border-neutral-600 bg-transparent'}`}>
                                            {todo.done && <svg className="w-3 h-3 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path></svg>}
                                        </div>

                                        <span className={`text-sm truncate flex-1 ${todo.done ? 'line-through text-neutral-600' : 'text-gray-200'}`}>
                                            {todo.text}
                                        </span>

                                        <button onClick={(e) => handleDeleteTodo(todo._id, e)}
                                            className="text-neutral-600 hover:text-white opacity-0 group-hover:opacity-100 transition-all text-xs px-2"
                                            title="삭제">✕</button>
                                    </div>
                                 ))
                             )}
                        </div>
                        
                         <div className="mt-4 border-t border-neutral-800 pt-3 shrink-0 flex gap-2">
                            <input 
                                className="flex-1 bg-transparent text-sm text-white placeholder-neutral-600 outline-none"
                                placeholder={`+ ${selectedDate.getDate()}일 할 일 입력`}
                                value={input} // value 연결 필수
                                onChange={(e) => setInput(e.target.value)} // onChange 필수
                                onKeyDown={handleKeyDown}
                            />
                            <button 
                                onClick={addTodo}
                                className="bg-white text-black text-xs font-bold px-3 py-1 rounded hover:bg-gray-200 transition-colors"
                            >
                                추가
                            </button>
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