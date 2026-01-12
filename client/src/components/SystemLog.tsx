import { useEffect, useRef } from 'react';

export interface LogEntry {
  id: number;
  timestamp: Date;
  level: 'INFO' | 'SUCCESS' | 'WARNING' | 'ERROR';
  message: string;
}

interface SystemLogProps {
  logs: LogEntry[];
}

export default function SystemLog({ logs }: SystemLogProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('ko-KR', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };

  const getColor = (level: string) => {
    switch (level) {
      case 'SUCCESS': return 'text-green-500';
      case 'WARNING': return 'text-yellow-500';
      case 'ERROR': return 'text-red-500';
      default: return 'text-neutral-400';
    }
  };

  return (
    <div className="h-full flex flex-col bg-neutral-900/40 border border-neutral-800 rounded-lg overflow-hidden font-mono text-xs">
      
      {/* 헤더 */}
      <div className="px-3 py-2 border-b border-neutral-800 bg-neutral-950 flex justify-between items-center">
        <span className="text-neutral-500 font-bold uppercase tracking-widest">System Kernel</span>
        <div className="flex gap-1.5">
          <div className="w-2 h-2 rounded-full bg-neutral-700"></div>
          <div className="w-2 h-2 rounded-full bg-neutral-700"></div>
        </div>
      </div>

      {/* 로그 리스트 */}
      <div className="flex-1 overflow-y-auto p-3 space-y-1.5 scrollbar-thin scrollbar-thumb-neutral-800">
        {logs.length === 0 && (
            <div className="text-neutral-600 italic">Waiting for system events...</div>
        )}
        
        {logs.map((log) => (
          <div key={log.id} className="flex gap-2 leading-tight hover:bg-neutral-800/50 p-0.5 rounded transition-colors">
            <span className="text-neutral-600 shrink-0">[{formatTime(log.timestamp)}]</span>
            <span className={`font-bold shrink-0 w-16 ${getColor(log.level)}`}>{log.level}</span>
            <span className="text-gray-300 break-all">{log.message}</span>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>
    </div>
  );
}