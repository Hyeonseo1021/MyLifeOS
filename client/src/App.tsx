import { useState } from 'react';
import Sidebar from './components/Sidebar';
import Home from './pages/Home';
import Mlo from './pages/MLO';
import Memory from './pages/Memory';
import Setting from './pages/Setting';
import { ThemeProvider } from './context/ThemeContext';
import type { TabType, AiState } from './types';

export default function App() {
  return (
    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
  );
}

function AppContent() {
  const [activeTab, setActiveTab] = useState<TabType>('HOME');
  const [aiState, setAiState] = useState<AiState>('idle');

  return (
    
    <div className="flex h-screen bg-[var(--bg-main)] text-[var(--text-main)] font-sans rounded-4xl tracking-tight border border-[var(--border-main)] selection:bg-[var(--text-main)] selection:text-[var(--bg-main)] draggable-area transition-colors duration-300 overflow-hidden shadow-2xl">
      
      <Sidebar 
        activeTab={activeTab} 
        onTabChange={setActiveTab} 
        aiState={aiState} 
      />

      <div className="flex-1 flex flex-col bg-transparent relative overflow-hidden non-draggable">
        <div className="absolute top-4 right-4 z-50 flex gap-2 group">
           <div className="w-3 h-3 rounded-full bg-neutral-400/50 hover:bg-red-500 transition-colors cursor-pointer non-draggable shadow-sm"></div>
           <div className="w-3 h-3 rounded-full bg-neutral-400/50 hover:bg-yellow-500 transition-colors cursor-pointer non-draggable shadow-sm"></div>
        </div>

        {activeTab === 'HOME' && <Home setAiState={setAiState} />}
        {activeTab === 'MLO' && <Mlo />}
        {activeTab === 'MEMORY' && <Memory />}
        {activeTab === 'SETTINGS' && <Setting />}
      </div>
    </div>
  );
}