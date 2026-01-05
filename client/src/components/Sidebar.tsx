import AICore from './AICore';
import type { TabType, AiState } from '../types';

interface SidebarProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
  aiState: AiState;
}

export default function Sidebar({ activeTab, onTabChange, aiState }: SidebarProps) {
  const tabs: TabType[] = ['HOME', 'MLO', 'MEMORY', 'SETTINGS'];

  return (
    <div className="w-24 flex flex-col border-r border-neutral-800 bg-neutral-950">
      <div className="h-32 flex flex-col items-center justify-center border-b border-neutral-800 py-4">
        <div className="scale-75 cursor-pointer non-draggable">
          <AICore state={aiState} />
        </div>
      </div>
      <div className="flex-1 flex flex-col py-4 space-y-4">
        {tabs.map((tab) => (
          <button key={tab} onClick={() => onTabChange(tab)}
            className={`w-full py-3 text-[12px] font-bold transition-all relative group flex justify-center items-center non-draggable ${
              activeTab === tab ? 'text-white' : 'text-neutral-600 hover:text-neutral-400'}`}>
            {activeTab === tab && <div className="absolute left-0 top-2 bottom-2 w-0.5 bg-white shadow-[0_0_10px_white]"></div>}
            <span className="uppercase tracking-widest">{tab}</span>
          </button>
        ))}
      </div>
    </div>
  );
}