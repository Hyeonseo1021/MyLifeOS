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
    <div className="w-40 flex flex-col border-r border-[var(--border-main)] bg-[var(--bg-card)] transition-colors duration-300 z-50">
      <div className="h-32 flex flex-col items-center justify-center border-b border-[var(--border-main)] py-4 shrink-0">
        <div className="scale-75 cursor-pointer non-draggable hover:scale-90 transition-transform duration-300">
          <AICore state={aiState} />
        </div>
      </div>
      
      <div className="flex-1 flex flex-col py-6 space-y-6 items-center">
        {tabs.map((tab) => (
          <button 
            key={tab} 
            onClick={() => onTabChange(tab)}
            className={`
              w-full py-2 text-[16px] font-black transition-all relative group flex flex-col justify-center items-center gap-1 non-draggable tracking-[0.2em]
              ${activeTab === tab 
                ? 'text-[var(--text-main)] opacity-100' 
                : 'text-[var(--text-muted)] opacity-40 hover:opacity-100 hover:text-[var(--text-main)]'}
            `}
          >
            {/* Active Indicator Line */}
            <div className={`
              absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-4 bg-[var(--text-main)] transition-all duration-300
              ${activeTab === tab ? 'opacity-100 shadow-[0_0_10px_currentColor]' : 'opacity-0 h-0'}
            `}></div>
            
            <span className="uppercase writing-mode-vertical">{tab}</span>
          </button>
        ))}
      </div>
      
      {/* Bottom Decoration */}
      <div className="p-4 flex flex-col items-center opacity-30 gap-1 pb-6">
        <div className="w-1 h-1 rounded-full bg-[var(--text-muted)]"></div>
        <div className="w-1 h-1 rounded-full bg-[var(--text-muted)]"></div>
        <div className="w-1 h-1 rounded-full bg-[var(--text-muted)]"></div>
      </div>
    </div>
  );
}