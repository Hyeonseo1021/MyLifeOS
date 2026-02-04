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
      <div key={i} className="relative group w-full h-full" onClick={() => onSelectDate(currentDate)}>
        
        <div className={`
          w-full h-full flex flex-col items-center justify-center rounded-md cursor-pointer transition-all duration-200 border relative overflow-hidden
          ${isSelected 
            ? 'bg-[var(--text-main)] text-[var(--bg-main)] border-transparent shadow-lg scale-105 z-10' 
            : 'bg-[var(--bg-main)] border-[var(--border-main)] text-[var(--text-muted)] hover:bg-[var(--bg-card)] hover:text-[var(--text-main)] hover:border-[var(--text-main)] shadow-sm'
          }
          ${isToday && !isSelected 
            ? 'border-[var(--text-muted)] text-[var(--text-main)]' 
            : ''}
        `}>
          
          <span className={`font-mono text-lg font-bold z-10 
            ${isSunday && !isSelected 
              ? 'text-red-500' 
              : ''}
          `}>
            {i}
          </span>

          {hasTodo && (
            <div className={`absolute top-2 right-2 w-1.5 h-1.5 rounded-full 
              ${isSelected 
                ? 'bg-[var(--bg-main)]' 
                : 'bg-blue-500 shadow-[0_0_3px_#3b82f6]'}
            `}></div>
          )}
          
          {!isSelected && (
             <>
               <div className="absolute bottom-0 left-0 w-2 h-2 border-b border-l border-[var(--border-main)] rounded-bl-sm opacity-50"></div>
               <div className="absolute top-0 right-0 w-2 h-2 border-t border-r border-[var(--border-main)] rounded-tr-sm opacity-50"></div>
             </>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col w-full h-full justify-between">
      
      {/* Header Area */}
      <div className="flex justify-between items-end mb-3 px-1 border-b pb-2 border-[var(--border-main)]">
        <div className="flex flex-col">
            <span className="text-3xl font-black uppercase tracking-tighter font-mono flex items-baseline gap-2 
              text-[var(--text-main)] drop-shadow-sm">
                {selectedDate.toLocaleDateString('en-US', { month: 'long' }).toUpperCase()}
            </span>
        </div>
        <span className="text-2xl font-bold font-mono tracking-widest opacity-60 text-[var(--text-muted)]">
            {year}
        </span>
      </div>
      
      {/* Weekdays Header */}
      <div className="grid grid-cols-7 gap-2 mb-2">
        {['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'].map((d, i) => (
            <div key={i} className={`
                text-[16px] py-1 text-center font-bold font-mono rounded border
                bg-[var(--bg-main)] border-[var(--border-main)]
                ${i === 0 
                  ? 'text-red-500 border-red-500/20' 
                  : 'text-[var(--text-muted)]'}
            `}>
                {d}
            </div>
        ))}
      </div>

      {/* Calendar Grid */}
      <div className="flex-1 grid grid-cols-7 gap-2 items-stretch content-stretch">
        {days}
      </div>
    </div>
  );
}