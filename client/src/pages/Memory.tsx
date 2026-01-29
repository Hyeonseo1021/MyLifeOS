import { useState, useEffect } from 'react';
import { aiApi } from '../api/ai';

type TabType = 'note' | 'neural';

interface NoteItem {
  _id: string;
  title?: string;
  content: string;
  tags: string[];
  createdAt: string;
}

export default function Memory() {
  const [activeTab, setActiveTab] = useState<TabType>('note');

  return (
    <div className="flex-1 p-6 flex flex-col h-full bg-black text-white font-sans overflow-hidden">
      {/* 헤더 */}
      <div className="mb-6 flex justify-between items-end shrink-0">
        <div>
          <h1 className="text-3xl font-light tracking-[0.2em] text-gray-100">MEMORY CORE</h1>
        </div>
        
        <div className="flex bg-neutral-900/50 p-1 rounded-lg border border-neutral-800">
          <TabButton label="NOTE" active={activeTab === 'note'} onClick={() => setActiveTab('note')} icon="book" />
          <TabButton label="RAG" active={activeTab === 'neural'} onClick={() => setActiveTab('neural')} icon="cpu" />
        </div>
      </div>

      {/* 메인 영역 */}
      <div className="flex-1 min-h-0 bg-neutral-900/20 border border-neutral-800 rounded-xl overflow-hidden relative">
        <div className="absolute inset-0 overflow-y-auto p-6 scrollbar-thin scrollbar-thumb-neutral-800">
          {activeTab === 'note' && <NoteView />}
          {activeTab === 'neural' && <NeuralView />}
        </div>
      </div>
    </div>
  );
}

function TabButton({ label, active, onClick }: any) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-2 rounded-md text-xs font-bold transition-all flex items-center gap-2
        ${active ? 'bg-neutral-800 text-white shadow-sm' : 'text-neutral-500 hover:text-gray-300'}`}
    >
      <span className={`w-2 h-2 rounded-full ${active ? 'bg-green-500' : 'bg-neutral-600'}`} />
      {label}
    </button>
  );
}

function NoteView() {
  const [notes, setNotes] = useState<NoteItem[]>([]);
  const [isWriteMode, setIsWriteMode] = useState(false); 
  const [searchQuery, setSearchQuery] = useState('');

  const fetchNotes = async () => {
    try {
      const data = await aiApi.getNotes();
      setNotes(data || []);
    } catch (e) { console.error(e); }
  };

  useEffect(() => { fetchNotes(); }, []);

  const handleDelete = async (id: string) => {
    if(!confirm('삭제하시겠습니까?')) return;
    await aiApi.deleteNote(id);
    fetchNotes();
  };

  const filteredNotes = notes.filter(n => 
    n.content.toLowerCase().includes(searchQuery.toLowerCase()) || 
    n.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    n.tags.some(t => t.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <>
      {/* 1. 상단 컨트롤 바 (검색 + 작성 버튼) */}
      <div className="flex justify-between items-center mb-6">
        <div className="relative w-full max-w-md">
            <input 
                className="w-full bg-neutral-900 border border-neutral-800 rounded-full px-4 py-2 pl-10 text-sm outline-none focus:border-green-500/50 transition-colors placeholder-neutral-600"
                placeholder="기억 검색 (내용, 태그...)"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
            />
            <svg className="w-4 h-4 text-neutral-500 absolute left-3.5 top-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
        </div>

        <button 
            onClick={() => setIsWriteMode(true)}
            className="bg-white text-black px-4 py-2 rounded-full text-xs font-bold hover:bg-gray-200 transition-colors flex items-center gap-2 shadow-lg"
        >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path></svg>
            NEW NOTE
        </button>
      </div>

      {/* 2. 노트 리스트 (전체 화면 활용) */}
      {filteredNotes.length === 0 ? (
        <div className="h-64 flex flex-col items-center justify-center text-neutral-600 gap-4">
             <div className="w-16 h-16 rounded-full bg-neutral-900 border border-neutral-800 flex items-center justify-center">
                <svg className="w-6 h-6 text-neutral-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path></svg>
            </div>
            <p className="text-sm">기록된 노트가 없습니다.</p>
        </div>
      ) : (
        <div className="columns-1 sm:columns-2 lg:columns-3 xl:columns-4 gap-4 space-y-4 pb-10">
            {filteredNotes.map(note => (
                <div key={note._id} className="break-inside-avoid bg-neutral-900 border border-neutral-800 p-4 rounded-xl hover:border-neutral-600 transition-all group relative hover:shadow-lg hover:-translate-y-1 duration-200">
                    <div className="flex justify-between items-start mb-2 opacity-70">
                        <span className="text-[10px] text-neutral-400 font-mono">{new Date(note.createdAt).toLocaleDateString()}</span>
                        <div className="flex gap-1">
                            {note.tags.map((tag, idx) => (
                                <span key={idx} className="text-[9px] text-green-600 bg-green-900/10 px-1 rounded">{tag}</span>
                            ))}
                        </div>
                    </div>
                    {note.title && <h3 className="font-bold text-gray-200 mb-2">{note.title}</h3>}
                    <p className="text-sm text-gray-400 whitespace-pre-wrap leading-relaxed">{note.content}</p>
                    
                    <button 
                        onClick={() => handleDelete(note._id)}
                        className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 p-1.5 bg-black/50 rounded hover:bg-red-500 hover:text-white text-neutral-400 transition-all"
                    >
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                    </button>
                </div>
            ))}
        </div>
      )}

      {/* 3. 작성 모달 (Write Mode Modal) */}
      {isWriteMode && (
        <div className="absolute inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
            <div className="bg-neutral-900 border border-neutral-700 w-full max-w-2xl rounded-2xl shadow-2xl p-6 flex flex-col gap-4 animate-in zoom-in-95 duration-200">
                <div className="flex justify-between items-center border-b border-neutral-800 pb-4">
                    <h2 className="text-lg font-bold text-white tracking-widest">NEW MEMORY</h2>
                    <button onClick={() => setIsWriteMode(false)} className="text-neutral-500 hover:text-white">✕ ESC</button>
                </div>
                
                <NoteEditor onSave={() => { setIsWriteMode(false); fetchNotes(); }} />
            </div>
        </div>
      )}
    </>
  );
}

// 작성 에디터 컴포넌트 (모달 내부용)
function NoteEditor({ onSave }: { onSave: () => void }) {
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [tags, setTags] = useState('');

    const handleSave = async () => {
        if(!content.trim()) return;
        const processedTags = tags.split(' ').map(t => t.trim()).filter(Boolean).map(t => t.startsWith('#')?t:`#${t}`);
        
        try {
            await aiApi.createNote(title, content, processedTags.length > 0 ? processedTags : ['#Note']);
            onSave();
        } catch(e) { alert('Error'); }
    };

    return (
        <div className="flex flex-col gap-4">
            <input 
                autoFocus
                className="bg-transparent text-xl font-bold text-white outline-none placeholder-neutral-600"
                placeholder="제목 (선택사항)"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
            />
            <textarea
                className="h-64 bg-neutral-950/50 rounded-lg p-4 text-sm text-gray-300 outline-none resize-none placeholder-neutral-600 leading-relaxed border border-neutral-800 focus:border-green-500/50 transition-colors"
                placeholder="무엇을 기록하고 싶으신가요?"
                value={content}
                onChange={(e) => setContent(e.target.value)}
            />
            <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-neutral-500">TAGS:</span>
                <input 
                    className="flex-1 bg-transparent text-sm text-green-400 outline-none placeholder-neutral-700"
                    placeholder="#Idea #Dev (Space로 구분)"
                    value={tags}
                    onChange={(e) => setTags(e.target.value)}
                />
            </div>
            <div className="flex justify-end gap-2 mt-2">
                <button 
                    onClick={handleSave}
                    className="bg-white text-black px-8 py-3 rounded-lg text-sm font-bold hover:bg-gray-200 transition-colors"
                >
                    SAVE
                </button>
            </div>
        </div>
    );
}

function NeuralView() {
  const [docs] = useState<any[]>([]);

  return (
    <div className="space-y-6 h-full flex flex-col">
      <div className="flex justify-between items-center shrink-0">
        <div>
            <h3 className="text-lg text-green-400 font-light">Rag Document</h3>
        </div>
        <button className="bg-white text-black text-xs font-bold px-4 py-2 rounded hover:bg-gray-200 transition-colors flex items-center gap-2">
          UPLOAD PDF
        </button>
      </div>
      
      {/* 빈 화면 */}
      <div className="h-full flex flex-col items-center justify-center text-neutral-600 gap-4 border-2 border-dashed border-neutral-800 rounded-xl">
         <p className="text-sm">저장된 지식 문서가 없습니다.</p>
      </div>
    </div>
  );
}