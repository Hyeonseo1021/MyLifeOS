// src/components/ContextViewer.tsx

export interface SourceItem {
  filename: string;
  content: string;
}

interface ContextViewerProps {
  sources: SourceItem[];
}

export default function ContextViewer({ sources }: ContextViewerProps) {
  return (
    <div className="h-full flex flex-col bg-neutral-900/30 border border-neutral-800 rounded-lg overflow-hidden">
      {/* 헤더 */}
      <div className="p-3 border-b border-neutral-800 flex justify-between items-center bg-neutral-950/50">
        <div className="flex items-center gap-2">
            <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
            <span className="text-xs font-bold text-gray-300 uppercase tracking-wider">Context Memory</span>
        </div>
        <span className="text-[10px] text-neutral-500">
            {sources.length > 0 ? `${sources.length} REFS` : 'IDLE'}
        </span>
      </div>

      {/* 컨텐츠 영역 */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3 scrollbar-thin scrollbar-thumb-neutral-800">
        {sources.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-neutral-600 gap-2 opacity-50">
                <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.384-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z"></path></svg>
                <p className="text-xs text-center">대화와 관련된 문서가<br/>여기에 표시됩니다.</p>
            </div>
        ) : (
            sources.map((source, idx) => (
                <div key={idx} className="bg-neutral-800/40 border border-neutral-700/50 rounded-lg p-3 hover:bg-neutral-800 transition-colors group">
                    <div className="flex items-start gap-2 mb-2">
                        <div className="min-w-[24px] h-6 bg-blue-500/10 text-blue-400 rounded flex items-center justify-center text-[10px] font-bold border border-blue-500/20">
                            PDF
                        </div>
                        <div className="flex-1 min-w-0">
                            <h4 className="text-xs font-medium text-gray-200 truncate leading-tight" title={source.filename}>
                                {source.filename}
                            </h4>
                        </div>
                    </div>
                    <p className="text-[11px] text-gray-400 leading-relaxed line-clamp-4 border-l-2 border-neutral-700 pl-2 group-hover:border-green-500/50 transition-colors">
                        "{source.content}"
                    </p>
                </div>
            ))
        )}
      </div>
    </div>
  );
}