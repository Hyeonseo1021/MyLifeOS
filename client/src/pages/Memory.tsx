import { useState, useEffect, useMemo } from 'react';
import { noteApi } from '../api/notes';
import type { NoteItem } from '../api/types';
import Editor from '../components/Editor'; 

export default function Memory() {
  const [notes, setNotes] = useState<NoteItem[]>([]);
  const [viewMode, setViewMode] = useState<'list' | 'write' | 'detail' | 'edit'>('list');
  const [selectedNote, setSelectedNote] = useState<NoteItem | null>(null);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTag, setSelectedTag] = useState<string>('ALL');

  const fetchNotes = async () => {
    try {
      const data = await noteApi.getNotes();
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
    try {
      await noteApi.deleteNote(id);
      handleBack();
    } catch (e) {
      console.error(e);
      alert('Failed to delete.');
    }
  };

  const noDrag = { WebkitAppRegion: 'no-drag' } as any;

  return (
    <div className="flex-1 flex flex-col h-full text-[var(--text-main)] overflow-hidden relative selection:bg-[var(--text-main)] selection:text-[var(--bg-main)] transition-colors duration-300 font-sans">
      
      {viewMode === 'list' && (
        <>
          <div className="flex flex-col gap-6 pt-8 pb-6 px-8 md:px-12 shrink-0 z-10 border-b border-[var(--border-main)] bg-[var(--bg-main)]">
            <div className="flex justify-between items-end">
              <div>
                <h1 className="text-xl md:text-2xl font-black tracking-[0.2em] text-[var(--text-main)] uppercase">
                  MEMORY
                </h1>
                <p className="text-[var(--text-muted)] text-xs mt-2 tracking-wide font-bold opacity-60">
                  {notes.length} RECORDS
                </p>
              </div>
              
              <button
                onClick={() => setViewMode('write')}
                style={noDrag}
                className="bg-[var(--text-main)] text-[var(--bg-main)] px-5 py-2.5 text-[10px] md:text-xs font-black hover:opacity-80 transition-all uppercase tracking-widest cursor-pointer shadow-sm rounded-sm"
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
                    className={`text-[10px] md:text-xs px-3 py-1.5 rounded-full border transition-all whitespace-nowrap uppercase tracking-wider cursor-pointer font-bold ${
                      selectedTag === tag 
                        ? 'bg-[var(--text-main)] border-[var(--text-main)] text-[var(--bg-main)]' 
                        : 'border-[var(--border-main)] text-[var(--text-muted)] hover:border-[var(--text-main)] hover:text-[var(--text-main)]'
                    }`}
                  >
                    {tag === 'ALL' ? 'VIEW ALL' : `#${tag}`}
                  </button>
                ))}
              </div>

              <input
                style={{ ...noDrag, userSelect: 'text' }}
                className="bg-transparent border-b border-[var(--border-main)] py-1.5 text-sm outline-none focus:border-[var(--text-main)] transition-colors text-[var(--text-main)] w-full md:w-56 placeholder-[var(--text-muted)] font-medium"
                placeholder="Search memories..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto px-8 md:px-12 pb-20 scrollbar-thin bg-[var(--bg-main)]">
            {filteredNotes.length === 0 ? (
               <div className="flex flex-col items-center justify-center h-80 text-[var(--text-muted)] opacity-50">
                 <p className="italic text-lg font-serif">No notes found.</p>
               </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-x-6 gap-y-10 pb-12 mt-10">
                {filteredNotes.map((note) => (
                  <div 
                    key={note._id} 
                    onClick={() => handleNoteClick(note)}
                    className="group relative cursor-pointer w-full aspect-[3/4] bg-[var(--bg-card)] transition-all duration-300 hover:-translate-y-2 hover:shadow-lg border border-[var(--border-main)] hover:border-[var(--text-main)] flex flex-col rounded-sm overflow-hidden"
                  >
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-[var(--border-main)] group-hover:bg-[var(--text-main)] transition-colors z-10"></div>
                    
                    <div className="h-full flex flex-col p-4 pl-6 overflow-hidden">
                      <h3 className="text-xs md:text-sm font-bold text-[var(--text-main)] leading-snug line-clamp-4 break-words mb-auto">
                        {note.title || 'Untitled'}
                      </h3>
                      
                      <div className="mt-4 pt-3 border-t border-[var(--border-main)]">
                        {note.tags && note.tags.length > 0 && (
                           <span className="block text-[9px] text-[var(--text-muted)] truncate uppercase tracking-wider font-bold group-hover:text-[var(--text-main)] mb-1">
                             {note.tags[0]}
                           </span>
                        )}
                        <span className="block text-[8px] text-[var(--text-muted)] font-mono opacity-60">
                          {new Date(note.createdAt || Date.now()).toLocaleDateString()}
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
        <div className="absolute inset-0 z-[100] bg-[var(--bg-main)] flex flex-col animate-fadeIn">
          <TopBar onBack={handleBack} />
          <div className="flex-1 overflow-hidden">
            <NoteEditor 
              onSave={handleBack} 
              initialData={viewMode === 'edit' ? selectedNote : null}
              key={viewMode === 'edit' && selectedNote ? selectedNote._id : 'new'}
            />
          </div>
        </div>
      )}

      {viewMode === 'detail' && selectedNote && (
        <div className="absolute inset-0 z-[100] bg-[var(--bg-main)] flex flex-col animate-fadeIn">
          <TopBar onBack={handleBack} />
          
          <div className="flex-1 overflow-y-auto px-6 md:px-20 py-12 scrollbar-thin">
            <div className="max-w-4xl mx-auto flex flex-col gap-10 min-h-[80vh]">
              
              <div className="flex flex-col gap-4 text-center pb-8 border-b border-[var(--border-main)]">
                 <h1 className="text-3xl md:text-5xl font-black text-[var(--text-main)] leading-tight break-keep tracking-tight">
                   {selectedNote.title || 'Untitled'}
                 </h1>
                 <div className="flex flex-col gap-2 items-center">
                   <span className="text-xs text-[var(--text-muted)] tracking-widest uppercase font-bold opacity-60">
                    {new Date(selectedNote.createdAt || Date.now()).toLocaleDateString()}
                   </span>
                   {selectedNote.tags && selectedNote.tags.length > 0 && (
                      <div className="flex gap-2 mt-2">
                        {selectedNote.tags.map(t => (
                           <span key={t} className="text-[10px] text-[var(--text-main)] border border-[var(--border-main)] px-2 py-0.5 uppercase tracking-wider font-bold rounded-sm">
                             #{t}
                           </span>
                        ))}
                      </div>
                   )}
                 </div>
              </div>

              <div className="flex-1 -ml-1 text-[var(--text-main)] pointer-events-none"> 
                 <Editor
                   initialContent={selectedNote.content}
                   onChange={() => {}} 
                   editable={false} 
                 />
              </div>

              <div className="mt-auto pt-12 flex justify-end gap-6 border-t border-[var(--border-main)]">
                  <button
                    onClick={handleEdit}
                    style={noDrag}
                    className="text-xs font-bold text-[var(--text-muted)] hover:text-[var(--text-main)] uppercase tracking-widest transition-colors cursor-pointer border border-transparent hover:border-[var(--border-main)] px-4 py-2"
                  >
                    EDIT NOTE
                  </button>
                  <button
                    onClick={() => handleDelete(selectedNote._id)}
                    style={noDrag}
                    className="text-xs font-bold text-red-500 hover:text-red-600 uppercase tracking-widest transition-colors cursor-pointer border border-transparent hover:border-red-200 px-4 py-2"
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
    <div className="h-16 flex items-center justify-between px-6 md:px-8 shrink-0 bg-[var(--bg-main)] border-b border-[var(--border-main)] sticky top-0 z-50">
      <button
        onClick={onBack}
        style={{ WebkitAppRegion: 'no-drag' } as any}
        className="flex items-center gap-2 text-[var(--text-muted)] hover:text-[var(--text-main)] transition-colors group cursor-pointer"
      >
        <span className="text-lg">←</span>
        <span className="text-xs font-bold uppercase tracking-widest">Back</span>
      </button>
    </div>
  );
}

function NoteEditor({ onSave, initialData }: { onSave: () => void, initialData?: NoteItem | null }) {
  const [title, setTitle] = useState(initialData?.title || '');
  const [content, setContent] = useState(initialData?.content || '');
  const [tags, setTags] = useState(initialData?.tags ? initialData.tags.join(' ') : '');
  
  const [isSaving, setIsSaving] = useState(false);

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

  const handleSave = async () => {
    if (!title.trim() && !content.trim()) {
        alert("내용을 입력해주세요.");
        return;
    }
    
    if (isSaving) return;

    const processedTags = tags.split(' ').map((t) => t.trim()).filter(Boolean);
    const finalTags = processedTags.length > 0 ? processedTags : ['Note'];

    try {
      setIsSaving(true);
      
      if (initialData) {
        await noteApi.updateNote(initialData._id, title, content, finalTags);
      } else {
        await noteApi.createNote(title, content, finalTags);
      }
      onSave();
    } catch (e) {
      console.error(e);
      alert('Failed to save.');
      setIsSaving(false);
    }
  };

  return (
    <div className="flex flex-col h-full w-full max-w-4xl mx-auto px-6 md:px-12 pt-6 relative">
      <div className="shrink-0 mb-8">
        <input
          autoFocus
          style={inputStyle}
          className="block w-full bg-transparent text-3xl md:text-5xl font-black text-[var(--text-main)] outline-none placeholder-[var(--text-muted)] placeholder-opacity-40 transition-all leading-tight"
          placeholder="Untitled"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          disabled={isSaving}
        />
      </div>

      <div className="flex-1 -ml-1 overflow-hidden">
          <Editor 
              initialContent={initialData?.content || ''}
              onChange={(html) => setContent(html)}
          />
      </div>

      <div className="shrink-0 pt-8 pb-8 mt-4 border-t border-[var(--border-main)] flex items-end justify-between bg-[var(--bg-main)] z-10">
        <div className="flex flex-col gap-2 w-full max-w-[350px]">
          <label className="text-[10px] text-[var(--text-muted)] font-bold tracking-widest uppercase opacity-50">Tags</label>
          <input
            style={inputStyle}
            className="bg-transparent py-2 text-sm text-[var(--text-main)] outline-none placeholder-[var(--text-muted)] w-full border-b border-[var(--border-main)] focus:border-[var(--text-main)] transition-all"
            placeholder="Add tags..."
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            disabled={isSaving}
          />
        </div>
        <button
          onClick={handleSave}
          disabled={isSaving}
          style={{ WebkitAppRegion: 'no-drag', cursor: isSaving ? 'wait' : 'pointer' } as any}
          className={`bg-[var(--text-main)] text-[var(--bg-main)] px-8 py-3 text-xs font-black uppercase tracking-widest transition-all shadow-md ml-6 rounded-sm ${
            isSaving ? 'opacity-50' : 'hover:opacity-80'
          }`}
        >
          {isSaving ? 'SAVING...' : 'SAVE'}
        </button>
      </div>
    </div>
  );
}