import { useState, useEffect } from 'react';
import ChatInterface from '../components/ChatInterface';
import SystemLog, { type LogEntry } from '../components/SystemLog'; // 방금 만든 컴포넌트 import

export default function Mlo() {
  const [logs, setLogs] = useState<LogEntry[]>([]);

  const addLog = (level: LogEntry['level'], message: string) => {
    setLogs(prev => [...prev, {
        id: Date.now(),
        timestamp: new Date(),
        level,
        message
    }]);
  };

  useEffect(() => {
    addLog('INFO', 'System interface initialized.');
    setTimeout(() => addLog('SUCCESS', 'Connected to Vector DB (RAG).'), 500);
    setTimeout(() => addLog('INFO', 'Waiting for user input...'), 1000);
  }, []);

  const handleChatActivity = (action: string) => {
      if (action === 'send') {
          addLog('INFO', 'User message received.');
          addLog('WARNING', 'Processing via LLM...');
      } else if (action === 'receive') {
          addLog('SUCCESS', 'Response generated.');
      }
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
        
        <div className="lg:col-span-2 h-full">
            <ChatInterface onActivity={handleChatActivity} /> 
        </div>

        <div className="lg:col-span-1 h-full hidden lg:block">
            <SystemLog logs={logs} />
        </div>
      </div>
    </div>
  );
}