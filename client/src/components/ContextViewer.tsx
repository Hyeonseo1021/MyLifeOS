export interface SourceItem {
  filename: string;
  content: string;
}

interface ContextViewerProps {
  sources: SourceItem[];
}

export default function ContextViewer({ sources }: ContextViewerProps) {
  const safeSources = Array.isArray(sources) ? sources : [];

  // 파일명을 기준으로 중복 제거하여 목록 생성
  const uniqueFiles = Array.from(new Set(safeSources.map(s => s.filename)));

  return (
    <div className="h-full flex flex-col bg-neutral-900/30 border border-neutral-800 rounded-lg overflow-hidden font-sans">
      {/* 헤더 */}
      <div className="p-3 border-b border-neutral-800 flex justify-between items-center bg-neutral-950/50">
        <div className="flex items-center gap-2">
          <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <span className="text-xs font-bold text-gray-300 uppercase tracking-wider">Context Memory</span>
        </div>
        <span className="text-[10px] text-neutral-500 font-mono">
          {uniqueFiles.length > 0 ? `${uniqueFiles.length.toString().padStart(2, '0')} FILES` : 'IDLE'}
        </span>
      </div>

      {/* 파일 리스트 영역 */}
      <div className="flex-1 overflow-y-auto p-2 space-y-1 scrollbar-thin scrollbar-thumb-neutral-800">
        {uniqueFiles.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-neutral-600 gap-2 opacity-40">
            <p className="text-[11px]">참조된 문서 없음</p>
          </div>
        ) : (
          uniqueFiles.map((filename, idx) => (
            <div 
              key={`${filename}-${idx}`} 
              className="flex items-center gap-3 p-2.5 rounded-md bg-neutral-800/30 border border-neutral-700/20 hover:bg-neutral-800/60 hover:border-neutral-700 transition-all cursor-default group"
            >
              {/* 아이콘/타입 표시 */}
              <div className="w-8 h-8 shrink-0 bg-blue-500/10 text-blue-400 rounded flex items-center justify-center text-[9px] font-bold border border-blue-500/20">
                {filename.split('.').pop()?.toUpperCase() || 'PDF'}
              </div>

              {/* 파일명 */}
              <div className="flex-1 min-w-0">
                <h4 className="text-[11px] font-medium text-gray-300 truncate" title={filename}>
                  {filename}
                </h4>
              </div>

              {/* 상태 표시 점 */}
              <div className="w-1.5 h-1.5 rounded-full bg-green-500/50 shadow-[0_0_8px_rgba(34,197,94,0.4)]" />
            </div>
          ))
        )}
      </div>
    </div>
  );
}