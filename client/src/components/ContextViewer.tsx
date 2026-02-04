export interface SourceItem {
  filename: string;
  content: string;
}

interface ContextViewerProps {
  sources: SourceItem[];
}

export default function ContextViewer({ sources }: ContextViewerProps) {
  const safeSources = Array.isArray(sources) ? sources : [];
  const uniqueFiles = Array.from(new Set(safeSources.map(s => s.filename)));

  return (
    <div className="h-full flex flex-col bg-[var(--bg-card)] overflow-hidden font-sans">
      <div className="p-4 border-b border-[var(--border-main)] flex justify-between items-center bg-[var(--bg-card)]">
        <div className="flex items-center gap-2">
          <svg className="w-4 h-4 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <span className="text-xs font-black text-[var(--text-main)] uppercase tracking-widest">Context Memory</span>
        </div>
        <span className="text-[10px] font-bold text-[var(--text-muted)] font-mono bg-[var(--bg-main)] px-2 py-0.5 rounded border border-[var(--border-main)]">
          {uniqueFiles.length > 0 ? `${uniqueFiles.length.toString().padStart(2, '0')} FILES` : 'IDLE'}
        </span>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-2 scrollbar-thin">
        {uniqueFiles.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-[var(--text-muted)] gap-2 opacity-50">
            <p className="text-[10px] font-bold uppercase tracking-widest">No Context Loaded</p>
          </div>
        ) : (
          uniqueFiles.map((filename, idx) => (
            <div 
              key={`${filename}-${idx}`} 
              className="flex items-center gap-3 p-3 rounded-lg bg-[var(--bg-main)] border border-[var(--border-main)] hover:border-[var(--text-main)] transition-all cursor-default group shadow-sm"
            >
              <div className="w-8 h-8 shrink-0 bg-[var(--bg-card)] text-[var(--text-main)] rounded flex items-center justify-center text-[9px] font-black border border-[var(--border-main)] uppercase tracking-tighter">
                {filename.split('.').pop() || 'FILE'}
              </div>

              <div className="flex-1 min-w-0">
                <h4 className="text-[11px] font-bold text-[var(--text-main)] truncate leading-tight" title={filename}>
                  {filename}
                </h4>
                <div className="text-[9px] text-[var(--text-muted)] mt-0.5 font-medium">Synced</div>
              </div>

              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]" />
            </div>
          ))
        )}
      </div>
    </div>
  );
}