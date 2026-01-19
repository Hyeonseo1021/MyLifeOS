import { useState, useEffect, useRef } from 'react';
import ChatInterface from '../components/ChatInterface';
import SystemLog from '../components/SystemLog'; 
import type { LogEntry } from '../types'; 

export default function Mlo() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const isInitialized = useRef(false);
  const addLog = (level: LogEntry['level'], message: string) => {
    setLogs(prev => [...prev, {
        id: Date.now() + Math.random(), 
        timestamp: new Date(),
        level,
        message
    }]);
  };

  useEffect(() => {
    if (isInitialized.current) return;
    isInitialized.current = true;
    addLog('INFO', 'System interface initialized.');
    setTimeout(() => addLog('INFO', 'Waiting for user input...'), 1000);
  }, []);

  const handleChatActivity = (action: string) => {
      if (action === 'send') {
      }
  };

  const handleServerLogs = (serverLogs: any[]) => {
      if (!serverLogs || !Array.isArray(serverLogs)) return;
      
      serverLogs.forEach(log => {
          addLog(log.level as LogEntry['level'], log.message);
      });
  };

  return (
    <div className="flex-1 p-6 flex flex-col h-full overflow-hidden non-draggable">
      
      {/* 헤더 */}
      <div className="mb-4 flex items-end justify-between shrink-0">
        <div>
            <h1 className="text-2xl font-light text-white tracking-widest uppercase">
              MLO
            </h1>
        </div>
        <div className="text-[10px] text-green-500 border border-green-900 bg-green-900/20 px-2 py-1 rounded animate-pulse">
            SYSTEM ONLINE
        </div>
      </div>

      <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-3 gap-4">
        
        {/* 채팅 인터페이스 (2/3) */}
        <div className="lg:col-span-2 h-full">
            <ChatInterface 
                onActivity={handleChatActivity} 
                onLogs={handleServerLogs} 
            /> 
        </div>

        {/* 시스템 로그 (1/3) */}
        <div className="lg:col-span-1 h-full hidden lg:block">
            <SystemLog logs={logs} />
        </div>
      </div>
    </div>
  );
}