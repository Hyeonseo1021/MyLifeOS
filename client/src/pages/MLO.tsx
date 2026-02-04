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
            const firstSessionId = list[0].sessionId;
            setCurrentSessionId(firstSessionId);

            const sources = await aiApi.getContextFiles(firstSessionId);
            setContextSources(sources || []);
        }
    } catch (e) { 
        console.error(e);
    }
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

  const handleSelectSession = async (sessionId: string) => {
    setCurrentSessionId(sessionId);
    try {
        const sources = await aiApi.getContextFiles(sessionId);
        setContextSources(sources || []);
        addLog('INFO', `Loaded context for session: ${sessionId}`);
    } catch (e) {
        console.error("Failed to load context:", e);
        setContextSources([]);
    }
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
    <div className="flex-1 p-6 flex flex-col h-full overflow-hidden text-[var(--text-main)] font-sans transition-colors duration-300">
      
      <div className="mb-4 flex items-center justify-between shrink-0 px-1">
        <h1 className="text-xl font-light tracking-[0.2em] text-[var(--text-main)]">
          MY LIFE OS
        </h1>
        <div className="text-[10px] font-bold text-emerald-500 border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 rounded-full flex items-center gap-2 shadow-sm">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            SYSTEM ONLINE
        </div>
      </div>

      <div className="flex-1 min-h-0 grid grid-cols-12 gap-6">

        <div className="col-span-3 lg:col-span-2 bg-[var(--bg-card)] border border-[var(--border-main)] rounded-2xl flex flex-col overflow-hidden min-w-[200px] shadow-sm">
            <div className="p-4 border-b border-[var(--border-main)] shrink-0 bg-[var(--bg-card)]">
                <button 
                    onClick={handleNewChat}
                    className="w-full bg-[var(--text-main)] text-[var(--bg-main)] hover:opacity-90 transition-opacity py-2.5 rounded-lg text-xs font-black uppercase tracking-widest shadow-sm"
                >
                    + New Chat
                </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-2 space-y-1 scrollbar-thin">
                <div className="text-[10px] text-[var(--text-muted)] font-black px-3 py-2 uppercase tracking-widest opacity-60">Recent Chats</div>
                {sessionList.map((session) => (
                    <div
                        key={session.sessionId}
                        onClick={() => handleSelectSession(session.sessionId)}
                        className={`group flex items-center justify-between w-full px-3 py-3 rounded-lg text-xs transition-all duration-200 cursor-pointer border border-transparent
                            ${currentSessionId === session.sessionId 
                                ? 'bg-[var(--bg-main)] text-[var(--text-main)] border-[var(--border-main)] shadow-sm font-bold' 
                                : 'text-[var(--text-muted)] hover:bg-[var(--bg-main)] hover:text-[var(--text-main)]'
                            }`}
                    >
                        <span className="truncate flex-1 text-left">{session.title || 'New Chat'}</span>
                        <button
                            onClick={(e) => handleDeleteSession(e, session.sessionId)}
                            className="opacity-0 group-hover:opacity-100 text-[var(--text-muted)] hover:text-red-500 transition-all p-1"
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

        <div className="col-span-6 lg:col-span-7 h-full min-h-0 shadow-sm rounded-2xl overflow-hidden border border-[var(--border-main)] bg-[var(--bg-card)]">
            <ChatInterface 
                key={currentSessionId} 
                sessionId={currentSessionId} 
                onLogs={handleServerLogs}
                onTitleUpdate={handleTitleUpdate} 
                onContextUpdate={handleContextUpdate}
            /> 
        </div>

        <div className="col-span-3 h-full min-h-0 overflow-hidden shadow-sm rounded-2xl border border-[var(--border-main)] bg-[var(--bg-card)]">
            <ContextViewer sources={contextSources} />
        </div>
      </div>
    </div>
  );
}