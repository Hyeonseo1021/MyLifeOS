import { useState } from 'react';
import Sidebar from './components/Sidebar';
import Home from './pages/Home';
import Mlo from './pages/MLO';
import Memory from './pages/Memory';
import type { TabType, AiState } from './types';

const Placeholder = ({ title }: { title: string }) => (
  <div className="flex-1 flex items-center justify-center text-neutral-500">
    {title} 모듈 준비 중입니다.
  </div>
);

export default function App() {
  const [activeTab, setActiveTab] = useState<TabType>('HOME');
  const [aiState, setAiState] = useState<AiState>('idle');

  return (
    <div className="flex h-screen bg-black text-gray-200 overflow-hidden font-sans rounded-2xl tracking-tight border border-neutral-900 selection:bg-white selection:text-black draggable-area">
      
      <Sidebar 
        activeTab={activeTab} 
        onTabChange={setActiveTab} 
        aiState={aiState} 
      />

      <div className="flex-1 flex flex-col bg-black relative overflow-hidden non-draggable">
        <div className="absolute top-2 right-1.5 z-50 flex gap-2">
           <div className="w-3 h-3 bg-neutral-400 hover:bg-neutral-600 transition-colors cursor-pointer non-draggable"></div>
        </div>

        {activeTab === 'HOME' && <Home setAiState={setAiState} />}
        {activeTab === 'MLO' && <Mlo />}
        {activeTab === 'MEMORY' && <Memory />}
        {activeTab === 'SETTINGS' && <Placeholder title="Settings" />}
        
      </div>
    </div>
  );
}