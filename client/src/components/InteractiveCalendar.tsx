import { getYMD } from '../utils/date';
import type { TodoItem } from '../types';

interface CalendarProps {
  selectedDate: Date;
  onSelectDate: (date: Date) => void;
  todos: TodoItem[];
}

export default function InteractiveCalendar({ selectedDate, onSelectDate, todos }: CalendarProps) {
  const year = selectedDate.getFullYear();
  const month = selectedDate.getMonth();
  
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOfMonth = new Date(year, month, 1).getDay();
  
  const days = [];
  
  for (let i = 0; i < firstDayOfMonth; i++) {
    days.push(<div key={`empty-${i}`} className="w-full h-full"></div>);
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
      // ▼▼▼ [수정됨] aspect-square 제거 (높이 강제 늘어남 방지) ▼▼▼
      <div key={i} className="relative group w-full h-full" onClick={() => onSelectDate(currentDate)}>
        
        <div className={`
          w-full h-full flex flex-col items-center justify-center rounded-md cursor-pointer transition-all duration-200 border relative overflow-hidden
          ${isSelected 
            ? 'bg-neutral-200 border-white text-black shadow-[0_0_15px_rgba(255,255,255,0.4)] z-10 scale-105' 
            : 'bg-neutral-900 border-neutral-800/50 text-neutral-500 hover:bg-neutral-800 hover:text-neutral-200 hover:border-neutral-600 shadow-[inset_0_2px_4px_rgba(0,0,0,0.6)]'
          }
          ${isToday && !isSelected ? 'border-neutral-500 text-neutral-300 shadow-[inset_0_0_0_1px_rgba(115,115,115,0.5)]' : ''}
        `}>
          
          <span className={`font-mono text-lg font-bold z-10 ${isSunday && !isSelected ? 'text-red-900 group-hover:text-red-500' : ''}`}>
            {i}
          </span>

          {hasTodo && (
            <div className={`absolute top-2 right-2 w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-black' : 'bg-blue-500 shadow-[0_0_5px_#3b82f6]'}`}></div>
          )}
          
          {!isSelected && (
             <>
               <div className="absolute bottom-0 left-0 w-2 h-2 border-b border-l border-neutral-700/30 rounded-bl-sm"></div>
               <div className="absolute top-0 right-0 w-2 h-2 border-t border-r border-neutral-700/30 rounded-tr-sm"></div>
             </>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col w-full h-full justify-between">
      
      <div className="flex justify-between items-end mb-3 px-1 border-b border-neutral-800 pb-2">
        <div className="flex flex-col">
            <span className="text-3xl font-black text-white uppercase tracking-tighter font-mono flex items-baseline gap-2 drop-shadow-[0_0_10px_rgba(255,255,255,0.1)]">
                {selectedDate.toLocaleDateString('en-US', { month: 'long' }).toUpperCase()}
            </span>
        </div>
        <span className="text-2xl font-bold font-mono text-neutral-500 tracking-widest opacity-80">
            {year}
        </span>
      </div>
      
      <div className="grid grid-cols-7 gap-2 mb-2">
        {['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'].map((d, i) => (
            <div key={i} className={`
                text-[16px] py-1 text-center font-bold font-mono rounded bg-neutral-900/50 border border-neutral-800/50
                ${i === 0 ? 'text-red-800 border-red-900/20' : 'text-neutral-500'}
            `}>
                {d}
            </div>
        ))}
      </div>

      <div className="flex-1 grid grid-cols-7 gap-2 items-stretch content-stretch">
        {days}
      </div>
    </div>
  );
}