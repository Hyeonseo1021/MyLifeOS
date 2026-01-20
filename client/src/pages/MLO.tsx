import { useState, useEffect, useRef } from 'react';
import ChatInterface from '../components/ChatInterface';
import SystemLog from '../components/SystemLog'; 
import { aiApi, type ChatSessionData } from '../api/ai';
import type { LogEntry } from '../types'; 

export default function Mlo() {
  const [logs, setLogs] = useState<LogEntry[]>([]);

  const [currentSessionId, setCurrentSessionId] = useState<string>(`session-${Date.now()}`);
  
  const [sessionList, setSessionList] = useState<ChatSessionData[]>([]);

  const isInitialized = useRef(false);

  const addLog = (level: LogEntry['level'], message: string) => {
    setLogs(prev => [...prev, {
        id: Date.now() + Math.random(), 
        timestamp: new Date(),
        level,
        message
    }]);
  };

  const loadSessions = async () => {
    try {
        const list = await aiApi.getSessions();
        if (list && list.length > 0) {
            setSessionList(list);
        }
    } catch (e) { console.error(e); }
  };

  useEffect(() => {
    loadSessions();
    if (!isInitialized.current) {
        isInitialized.current = true;
        addLog('INFO', 'System interface initialized.');
    }
  }, []);

  const handleTitleUpdate = (newTitle: string) => {
    setSessionList(prev => prev.map(session => 
        session.sessionId === currentSessionId 
            ? { ...session, title: newTitle } 
            : session
    ));
  };

  const handleNewChat = () => {
    const newId = `session-${Date.now()}`;
    
    const newSession: ChatSessionData = {
        sessionId: newId,
        title: '새로운 대화',
        updatedAt: new Date().toISOString()
    };
    
    setCurrentSessionId(newId);
    setSessionList(prev => [newSession, ...prev]);
  };

  const handleSelectSession = (sessionId: string) => {
      setCurrentSessionId(sessionId);
  };

  const handleServerLogs = (serverLogs: any[]) => {
      if (!serverLogs) return;
      serverLogs.forEach(log => addLog(log.level, log.message));
  };

  return (
    <div className="flex-1 p-4 flex flex-col h-full overflow-hidden bg-black text-white font-sans">
      
      <div className="mb-3 flex items-center justify-between shrink-0 px-2">
        <h1 className="text-xl font-light tracking-[0.2em] text-gray-200">
          MY LIFE OS <span className="text-neutral-600 text-xs ml-2">v2.2</span>
        </h1>
        <div className="text-[10px] text-green-500 border border-green-900 bg-green-900/20 px-2 py-0.5 rounded flex items-center gap-2">
            SYSTEM ONLINE
        </div>
      </div>

      <div className="flex-1 min-h-0 grid grid-cols-12 gap-4">

        <div className="col-span-2 bg-neutral-900/30 border border-neutral-800 rounded-lg flex flex-col overflow-hidden min-w-[200px]">
            <div className="p-3 border-b border-neutral-800 shrink-0">
                <button 
                    onClick={handleNewChat}
                    className="w-full bg-white text-black hover:bg-gray-200 transition-colors py-2 rounded text-xs font-bold"
                >
                    + NEW CHAT
                </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-2 space-y-1 scrollbar-thin scrollbar-thumb-neutral-800">
                <div className="text-[10px] text-neutral-500 font-bold px-2 py-1 uppercase">Recent Chats</div>
                {sessionList.map((session) => (
                    <button
                        key={session.sessionId}
                        onClick={() => handleSelectSession(session.sessionId)}
                        className={`w-full text-left px-3 py-2.5 rounded text-xs truncate transition-all duration-200
                            ${currentSessionId === session.sessionId 
                                ? 'bg-neutral-800 text-green-400 border-l-2 border-green-500 shadow-md' 
                                : 'text-gray-400 hover:bg-neutral-800/50 hover:text-gray-200'
                            }`}
                    >
                        {session.title || '새로운 대화'}
                    </button>
                ))}
            </div>
        </div>

        <div className="col-span-7 h-full min-h-0">
            <ChatInterface 
                key={currentSessionId} 
                sessionId={currentSessionId} 
                onLogs={handleServerLogs}
                onTitleUpdate={handleTitleUpdate} 
            /> 
        </div>

        <div className="col-span-3 h-full min-h-0 overflow-hidden">
            <SystemLog logs={logs} />
        </div>
      </div>
    </div>
  );
}