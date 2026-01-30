import { useState, useEffect } from 'react';
import { aiApi } from '../api/ai';

interface NoteItem {
  _id: string;
  title?: string;
  content: string;
  tags: string[];
  createdAt: string;
}

export default function Memory() {
  const [notes, setNotes] = useState<NoteItem[]>([]);
  const [isWriteMode, setIsWriteMode] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchNotes = async () => {
    try {
      const data = await aiApi.getNotes();
      setNotes(data || []);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchNotes();
  }, []);

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (!confirm('이 기록을 영구히 삭제하시겠습니까?')) return;
    await aiApi.deleteNote(id);
    fetchNotes();
  };

  const filteredNotes = notes.filter((n) =>
    n.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
    n.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    n.tags.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="flex-1 flex flex-col h-full bg-[#050505] text-white font-sans overflow-hidden relative">
      {!isWriteMode ? (
        <>
          <div className="pt-10 pb-6 px-10 flex justify-between items-end shrink-0">
            <div>
              <h1 className="text-4xl font-black tracking-tighter text-white uppercase">
                MEMORY
              </h1>
            </div>
            <button
              onClick={() => setIsWriteMode(true)}
              // 버튼도 드래그 방지 직접 적용
              style={{ WebkitAppRegion: 'no-drag' } as any}
              className="bg-white text-black px-8 py-2.5 rounded text-xs font-black hover:bg-neutral-200 transition-all active:scale-95 shadow-2xl cursor-pointer"
            >
              + NEW
            </button>
          </div>

          <div className="px-10 mb-10">
            <div className="relative max-w-md">
              <input
                // 검색창 드래그 방지 직접 적용
                style={{ WebkitAppRegion: 'no-drag', userSelect: 'text' } as any}
                className="w-full bg-[#0a0a0a] border border-neutral-900 rounded-lg px-5 py-3 pl-10 text-sm outline-none focus:border-neutral-700 transition-all placeholder-neutral-800 text-white cursor-text"
                placeholder="Search memories..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto px-10 pb-20 scrollbar-hide">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-8 text-left">
              {filteredNotes.map((note) => (
                <div key={note._id} className="group flex flex-col gap-3 cursor-pointer">
                  <div className="aspect-[3/4] bg-[#0a0a0a] border border-neutral-900 rounded-sm p-6 relative overflow-hidden transition-all hover:border-neutral-700">
                    <div className="h-full flex flex-col relative z-10">
                      <p className="text-[12px] text-neutral-500 font-mono leading-relaxed line-clamp-[12] group-hover:text-neutral-300 transition-colors">
                        {note.content}
                      </p>
                      <button
                        onClick={(e) => handleDelete(e, note._id)}
                        // 삭제 버튼 드래그 방지
                        style={{ WebkitAppRegion: 'no-drag' } as any}
                        className="mt-auto self-end opacity-0 group-hover:opacity-100 transition-opacity p-2 hover:text-red-500 cursor-pointer"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>
                  <div className="px-1">
                    <h3 className="text-[13px] font-bold text-neutral-200 truncate uppercase tracking-tight group-hover:text-white transition-colors">
                      {note.title || 'UNTITLED_LOG'}
                    </h3>
                    <span className="text-[10px] text-neutral-600 font-mono block mt-1">
                      {new Date(note.createdAt).toLocaleDateString('en-US').replace(/\//g, '.')}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      ) : (
        <div className="absolute inset-0 z-[100] bg-[#050505] flex flex-col">
          <div className="h-14 border-b border-neutral-900 flex items-center justify-between px-10 bg-[#050505] shrink-0 relative z-[101]">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setIsWriteMode(false)}
                // 뒤로가기 버튼 드래그 방지
                style={{ WebkitAppRegion: 'no-drag' } as any}
                className="flex items-center gap-1.5 text-neutral-500 hover:text-white transition-colors group cursor-pointer"
              >
                <svg className="w-5 h-5 group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                <span className="text-[10px] font-black uppercase tracking-widest">Back</span>
              </button>
              <div className="h-3 w-[1px] bg-neutral-800" />
              <span className="text-[9px] font-mono text-neutral-700 uppercase tracking-[0.2em]">Archive_Commit_v2.1</span>
            </div>
            <span className="text-[9px] font-mono text-neutral-800 uppercase tracking-widest">System_Ready</span>
          </div>

          <div className="flex-1 overflow-y-auto px-10 py-12 relative z-[100]">
            <div className="max-w-4xl mx-auto flex flex-col gap-10">
              <NoteEditor onSave={() => { setIsWriteMode(false); fetchNotes(); }} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function NoteEditor({ onSave }: { onSave: () => void }) {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [tags, setTags] = useState('');

  const handleSave = async () => {
    if (!content.trim()) return;
    const processedTags = tags.split(' ').map((t) => t.trim()).filter(Boolean);
    try {
      await aiApi.createNote(title, content, processedTags.length > 0 ? processedTags : ['Note']);
      onSave();
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="flex flex-col gap-12 w-full">
      <div className="flex flex-col gap-4 relative">
        <label
          htmlFor="note-subject"
          className="block w-max text-[10px] font-black text-neutral-600 uppercase tracking-[0.5em] font-mono select-none pointer-events-none"
        >
          01. Subject_
        </label>
        <input
          id="note-subject"
          autoFocus
          // [핵심] 드래그 방지 & 텍스트 선택 허용 직접 주입
          style={{ WebkitAppRegion: 'no-drag', userSelect: 'text' } as any}
          className="block w-full bg-transparent text-5xl font-black text-white outline-none placeholder-neutral-900 tracking-tighter py-2 border-b border-transparent focus:border-neutral-800 transition-colors cursor-text relative z-10"
          placeholder="TITLE"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
      </div>

      <div className="flex flex-col gap-4 relative">
        <label
          htmlFor="note-content"
          className="block w-max text-[10px] font-black text-neutral-600 uppercase tracking-[0.5em] font-mono select-none pointer-events-none"
        >
          02. Content_Body_
        </label>
        
        <textarea
          id="note-content"
          // [핵심] textarea는 이 속성이 없으면 상위 드래그 속성을 무조건 따라갑니다.
          style={{ WebkitAppRegion: 'no-drag', userSelect: 'text' } as any}
          className="block w-full min-h-[500px] bg-transparent text-xl text-white outline-none resize-none placeholder-neutral-900 leading-relaxed font-normal py-2 border-l-2 border-transparent focus:border-neutral-800 transition-colors cursor-text relative z-50"
          placeholder="Input data here..."
          value={content}
          onChange={(e) => setContent(e.target.value)}
        />
      </div>

      <div className="flex flex-col gap-10 border-t border-neutral-900 pt-10 mb-20 relative">
        <div className="flex flex-col gap-4">
          <label
            htmlFor="note-tags"
            className="block w-max text-[10px] font-black text-neutral-600 uppercase tracking-[0.5em] font-mono select-none pointer-events-none"
          >
            03. Index_Tags_
          </label>
          <input
            id="note-tags"
            // [핵심] 태그 입력창에도 동일하게 적용
            style={{ WebkitAppRegion: 'no-drag', userSelect: 'text' } as any}
            className="block w-full bg-transparent text-lg text-neutral-400 outline-none placeholder-neutral-900 font-mono py-2 border-b border-transparent focus:border-neutral-800 transition-colors cursor-text relative z-10"
            placeholder="Tag01 Tag02..."
            value={tags}
            onChange={(e) => setTags(e.target.value)}
          />
        </div>
        <div className="flex justify-end pt-4">
          <button
            onClick={handleSave}
            // 버튼 클릭도 막힐 수 있으므로 추가
            style={{ WebkitAppRegion: 'no-drag' } as any}
            className="bg-white text-black px-8 py-2.5 text-[10px] font-black uppercase tracking-[0.3em] hover:bg-neutral-200 transition-all active:scale-95 shadow-xl cursor-pointer relative z-10"
          >
            Save_Commit
          </button>
        </div>
      </div>
    </div>
  );
}