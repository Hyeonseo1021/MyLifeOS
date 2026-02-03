import { useState, useEffect, useMemo } from 'react';
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
  const [viewMode, setViewMode] = useState<'list' | 'write' | 'detail' | 'edit'>('list');
  const [selectedNote, setSelectedNote] = useState<NoteItem | null>(null);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTag, setSelectedTag] = useState<string>('ALL');

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

  const allTags = useMemo(() => {
    const tags = new Set<string>(['ALL']);
    notes.forEach(note => {
      if (note.tags && Array.isArray(note.tags)) {
        note.tags.forEach(tag => {
          if (tag) tags.add(tag);
        });
      }
    });
    return Array.from(tags).sort((a, b) => {
      if (a === 'ALL') return -1;
      if (b === 'ALL') return 1;
      return a.localeCompare(b);
    });
  }, [notes]);

  const filteredNotes = useMemo(() => {
    let result = notes;

    if (searchQuery) {
      const lowerQuery = searchQuery.toLowerCase();
      result = result.filter((n) =>
        n.content.toLowerCase().includes(lowerQuery) ||
        n.title?.toLowerCase().includes(lowerQuery) ||
        n.tags.some((t) => t.toLowerCase().includes(lowerQuery))
      );
    }

    if (selectedTag !== 'ALL') {
      result = result.filter((n) => n.tags.includes(selectedTag));
    }

    return result;
  }, [notes, searchQuery, selectedTag]);

  const handleNoteClick = (note: NoteItem) => {
    setSelectedNote(note);
    setViewMode('detail');
  };

  const handleBack = () => {
    setSelectedNote(null);
    setViewMode('list');
    fetchNotes();
  };

  const handleEdit = () => {
    if (selectedNote) setViewMode('edit');
  };

  const handleDelete = async (id: string) => {
    if (!confirm('정말 삭제하시겠습니까?')) return;
    await aiApi.deleteNote(id);
    handleBack();
  };

  const noDrag = { WebkitAppRegion: 'no-drag' } as any;

  return (
    <div className="flex-1 flex flex-col h-full bg-[#0a0a0a] text-gray-100  overflow-hidden relative selection:bg-[#fff] selection:text-black">
      
      {viewMode === 'list' && (
        <>
          <div className="flex flex-col gap-6 pt-10 pb-6 px-8 md:px-12 shrink-0 bg-[#0a0a0a] z-10 border-b border-[#333]">
            <div className="flex justify-between items-end">
              <div>
                <h1 className="text-xl md:text-2xl font-bold tracking-[0.2em] text-white uppercase">
                  MEMORY
                </h1>
                <p className="text-[#888] text-xs mt-2  tracking-wide">
                  {notes.length} RECORDS
                </p>
              </div>
              
              <button
                onClick={() => setViewMode('write')}
                style={noDrag}
                className="bg-white text-black border border-white px-5 py-2 text-[10px] md:text-xs font-bold hover:bg-gray-200 transition-all uppercase tracking-widest cursor-pointer shadow-lg"
              >
                + New Note
              </button>
            </div>

            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div className="flex gap-2 overflow-x-auto max-w-full pb-2 md:pb-0 scrollbar-hide mask-linear">
                {allTags.map(tag => (
                  <button
                    key={tag}
                    onClick={() => setSelectedTag(tag)}
                    style={noDrag}
                    className={`text-[10px] md:text-xs px-3 py-1 rounded-full border transition-all whitespace-nowrap uppercase tracking-wider cursor-pointer ${
                      selectedTag === tag 
                        ? 'bg-[#333] border-[#888] text-white font-bold' 
                        : 'border-[#333] text-[#888] hover:border-[#666] hover:text-[#ddd]'
                    }`}
                  >
                    {tag === 'ALL' ? 'VIEW ALL' : `#${tag}`}
                  </button>
                ))}
              </div>

              <input
                style={{ ...noDrag, userSelect: 'text' }}
                className="bg-transparent border-b border-[#444] py-1 text-sm outline-none focus:border-[#fff] transition-colors text-white w-full md:w-48  placeholder-[#666]"
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto px-8 md:px-12 pb-20 scrollbar-thin scrollbar-thumb-[#444] scrollbar-track-transparent">
            {filteredNotes.length === 0 ? (
               <div className="flex flex-col items-center justify-center h-80 text-[#666]">
                 <p className="italic  text-lg">No notes found.</p>
               </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-x-6 gap-y-12 pb-12 mt-10">
                {filteredNotes.map((note) => (
                  <div 
                    key={note._id} 
                    onClick={() => handleNoteClick(note)}
                    className="group relative cursor-pointer w-full aspect-[2/3] bg-[#1a1a1a] transition-all duration-300 hover:-translate-y-3 hover:shadow-[0_15px_30px_-5px_rgba(255,255,255,0.1)] border border-[#333] hover:border-[#777] flex flex-col"
                  >
                    <div className="absolute left-0 top-0 bottom-0 w-3 md:w-4 bg-[#252525] border-r border-[#444] z-10 box-border"></div>
                    
                    <div className="h-full flex flex-col p-3 pl-6 md:p-4 md:pl-8 overflow-hidden">
                      <h3 className="text-xs md:text-sm font-bold text-gray-200 leading-snug line-clamp-4  group-hover:text-white break-words">
                        {note.title || 'Untitled'}
                      </h3>
                      <div className="mt-auto border-t border-[#333] pt-2">
                        {note.tags && note.tags.length > 0 && (
                           <span className="block text-[9px] md:text-[10px] text-[#888] truncate  uppercase tracking-wider group-hover:text-[#bbb]">
                             {note.tags[0]}
                           </span>
                        )}
                        <span className="block text-[8px] text-[#666] mt-1  group-hover:text-[#888]">
                          {new Date(note.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}

      {(viewMode === 'write' || viewMode === 'edit') && (
        <div className="absolute inset-0 z-[100] bg-[#0a0a0a] flex flex-col animate-fadeIn">
          <TopBar onBack={handleBack} />
          <div className="flex-1 overflow-y-auto px-6 md:px-10 pb-10 scrollbar-thin scrollbar-thumb-[#444]">
            <NoteEditor 
              onSave={handleBack} 
              initialData={viewMode === 'edit' ? selectedNote : null}
              key={viewMode === 'edit' && selectedNote ? selectedNote._id : 'new'}
            />
          </div>
        </div>
      )}

      {viewMode === 'detail' && selectedNote && (
        <div className="absolute inset-0 z-[100] bg-[#0a0a0a] flex flex-col animate-fadeIn">
          <TopBar onBack={handleBack} />
          
          <div className="flex-1 overflow-y-auto px-6 md:px-20 py-12 scrollbar-thin scrollbar-thumb-[#444]">
            <div className="max-w-2xl mx-auto flex flex-col gap-10 min-h-[80vh]">
              
              <div className="flex flex-col gap-4 text-center pb-8 border-b border-[#333]">
                 <h1 className="text-3xl md:text-5xl font-bold text-white  leading-tight break-keep">
                   {selectedNote.title || 'Untitled'}
                 </h1>
                 <div className="flex flex-col gap-1 items-center">
                   <span className="text-xs text-[#888]  tracking-widest uppercase">
                     TOTAL {new Date(selectedNote.createdAt).toLocaleDateString()}
                   </span>
                   {selectedNote.tags && selectedNote.tags.length > 0 && (
                      <div className="flex gap-2 mt-2">
                        {selectedNote.tags.map(t => (
                           <span key={t} className="text-[10px] text-[#888] border border-[#444] px-2 py-0.5 uppercase tracking-wider">#{t}</span>
                        ))}
                      </div>
                   )}
                 </div>
              </div>

              <div className="text-lg text-[#eee] leading-loose whitespace-pre-wrap  text-justify">
                {selectedNote.content}
              </div>

              <div className="mt-auto pt-12 flex justify-end gap-6 border-t border-[#333]">
                  <button
                    onClick={handleEdit}
                    style={noDrag}
                    className="text-xs font-bold text-[#888] hover:text-white uppercase tracking-widest transition-colors cursor-pointer border border-transparent hover:border-[#666] px-3 py-1"
                  >
                    EDIT
                  </button>
                  <button
                    onClick={() => handleDelete(selectedNote._id)}
                    style={noDrag}
                    className="text-xs font-bold text-[#b55] hover:text-[#f66] uppercase tracking-widest transition-colors cursor-pointer border border-transparent hover:border-[#833] px-3 py-1"
                  >
                    DELETE
                  </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function TopBar({ onBack }: { onBack: () => void }) {
  return (
    <div className="h-14 md:h-16 flex items-center justify-between px-6 md:px-8 shrink-0 bg-[#0a0a0a] border-b border-[#333] sticky top-0 z-50">
      <button
        onClick={onBack}
        style={{ WebkitAppRegion: 'no-drag' } as any}
        className="flex items-center gap-3 text-[#888] hover:text-white transition-colors group cursor-pointer"
      >
        <span className="text-sm  italic">← Back</span>
      </button>
    </div>
  );
}

function NoteEditor({ onSave, initialData }: { onSave: () => void, initialData?: NoteItem | null }) {
  const [title, setTitle] = useState(initialData?.title || '');
  const [content, setContent] = useState(initialData?.content || '');
  const [tags, setTags] = useState(initialData?.tags ? initialData.tags.join(' ') : '');

  useEffect(() => {
    if (initialData) {
      setTitle(initialData.title || '');
      setContent(initialData.content || '');
      setTags(initialData.tags ? initialData.tags.join(' ') : '');
    } else {
      setTitle('');
      setContent('');
      setTags('');
    }
  }, [initialData]);

  const inputStyle = { WebkitAppRegion: 'no-drag', userSelect: 'text', cursor: 'text' } as any;
  const btnStyle = { WebkitAppRegion: 'no-drag', cursor: 'pointer' } as any;

  const handleSave = async () => {
    if (!content.trim()) return;
    
    const processedTags = tags.split(' ').map((t) => t.trim()).filter(Boolean);
    const finalTags = processedTags.length > 0 ? processedTags : ['Note'];

    try {
      if (initialData) {
        await (aiApi as any).updateNote(initialData._id, title, content, finalTags);
      } else {
        await aiApi.createNote(title, content, finalTags);
      }
      onSave();
    } catch (e) {
      console.error(e);
      alert('Failed to save.');
    }
  };

  return (
    <div className="flex flex-col gap-8 w-full max-w-2xl mx-auto p-4 md:p-12">
      <div className="flex flex-col gap-2">
        <label className="text-xs text-[#888] font-bold  tracking-widest uppercase">Title</label>
        <input
          autoFocus
          style={inputStyle}
          className="block w-full bg-[#111] p-3 rounded-sm text-2xl md:text-3xl font-bold  text-white outline-none placeholder-[#666] border-b-2 border-[#444] focus:border-[#fff] focus:bg-[#161616] transition-all"
          placeholder="제목을 입력하세요..."
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
      </div>

      <div className="flex flex-col gap-2 flex-1">
        <label className="text-xs text-[#888] font-bold  tracking-widest uppercase">Content</label>
        <textarea
          style={inputStyle}
          className="block w-full min-h-[60vh] bg-[#111] p-4 rounded-sm text-lg text-[#eee] outline-none resize-none placeholder-[#666] leading-loose  border border-[#333] focus:border-[#666] focus:bg-[#161616] transition-all"
          placeholder="내용을 자유롭게 작성하세요..."
          value={content}
          onChange={(e) => setContent(e.target.value)}
        />
      </div>

      <div className="flex items-end justify-between pt-6 border-t border-[#333]">
        <div className="flex flex-col gap-2 w-full max-w-[300px]">
          <label className="text-xs text-[#888] font-bold  tracking-widest uppercase">Tags (Optional)</label>
          <input
            style={inputStyle}
            className="bg-[#111] px-3 py-2 rounded-sm text-sm text-white outline-none placeholder-[#666] w-full  border-b border-[#444] focus:border-[#fff] transition-all"
            placeholder="예: idea diary project"
            value={tags}
            onChange={(e) => setTags(e.target.value)}
          />
        </div>
        <button
          onClick={handleSave}
          style={btnStyle}
          className="bg-[#eee] text-black px-8 py-3 text-xs font-bold uppercase tracking-widest hover:bg-white transition-all shadow-md ml-4 rounded-sm"
        >
          Save Note
        </button>
      </div>
    </div>
  );
}