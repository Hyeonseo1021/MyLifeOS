import { useState, useEffect, useRef } from 'react';
import ChatInterface from '../components/ChatInterface';
import ContextViewer, { type SourceItem } from '../components/ContextViewer'; 
import { aiApi, type ChatSessionData } from '../api/ai';
import type { LogEntry } from '../types'; 

export default function Mlo() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string>(`session-${Date.now()}`);
  const [sessionList, setSessionList] = useState<ChatSessionData[]>([]);
  const [contextSources, setContextSources] = useState<SourceItem[]>([]);
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
            setCurrentSessionId(list[0].sessionId);
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
    setContextSources([]);
  };

  const handleSelectSession = (sessionId: string) => {
      setCurrentSessionId(sessionId);
      setContextSources([]);
  };

  const handleContextUpdate = (sources: SourceItem[]) => {
      setContextSources(sources);
  };

  const handleDeleteSession = async (e: React.MouseEvent, sessionIdToDelete: string) => {
    e.stopPropagation();

    const remainingSessions = sessionList.filter(s => s.sessionId !== sessionIdToDelete);

    if (remainingSessions.length > 0) {
      setSessionList(remainingSessions);
      if (currentSessionId === sessionIdToDelete) {
        setCurrentSessionId(remainingSessions[0].sessionId);
        setContextSources([]);
      }
    } else {
      const newId = `session-${Date.now()}`;
      setSessionList([{ sessionId: newId, title: '새로운 대화', updatedAt: new Date().toISOString() }]);
      setCurrentSessionId(newId);
      setContextSources([]);
    }

    aiApi.deleteSession(sessionIdToDelete)
      .then(() => {
        addLog('SUCCESS', '삭제 완료.');
      })
      .catch((error) => {
        console.error(error);
        loadSessions(); 
      });
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
                    <div
                        key={session.sessionId}
                        onClick={() => handleSelectSession(session.sessionId)}
                        className={`group flex items-center justify-between w-full px-3 py-2.5 rounded text-xs transition-all duration-200 cursor-pointer
                            ${currentSessionId === session.sessionId 
                                ? 'bg-neutral-800 text-green-400 border-l-2 border-green-500 shadow-md' 
                                : 'text-gray-400 hover:bg-neutral-800/50 hover:text-gray-200'
                            }`}
                    >
                        <span className="truncate flex-1 text-left">{session.title || '새로운 대화'}</span>
                        <button
                            onClick={(e) => handleDeleteSession(e, session.sessionId)}
                            className="opacity-0 group-hover:opacity-100 text-neutral-500 hover:text-red-500 transition-all p-1"
                            title="삭제"
                        >
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                        </button>
                    </div>
                ))}
            </div>
        </div>

        <div className="col-span-7 h-full min-h-0">
            <ChatInterface 
                key={currentSessionId} 
                sessionId={currentSessionId} 
                onLogs={handleServerLogs}
                onTitleUpdate={handleTitleUpdate} 
                onContextUpdate={handleContextUpdate}
            /> 
        </div>

        <div className="col-span-3 h-full min-h-0 overflow-hidden">
            <ContextViewer sources={contextSources} />
        </div>
      </div>
    </div>
  );
}