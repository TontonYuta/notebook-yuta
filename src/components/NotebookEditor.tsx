import React, { useEffect, useRef, useState, useMemo } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import remarkGfm from 'remark-gfm';
import { Notebook, StickyNote } from '../types';
import { Columns, Eye, Edit3, Printer, StickyNote as StickyIcon, X, Plus, Search, ChevronUp, ChevronDown } from 'lucide-react';

interface Props {
  notebook: Notebook | null;
  onChange: (content: string) => void;
  onUpdateStickies: (stickies: StickyNote[]) => void;
}

type ViewMode = 'edit' | 'split' | 'preview';

export function NotebookEditor({ notebook, onChange, onUpdateStickies }: Props) {
  const [viewMode, setViewMode] = useState<ViewMode>('split');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentMatch, setCurrentMatch] = useState(-1);
  const [isSearchActive, setIsSearchActive] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const searchMatches = useMemo(() => {
    if (!notebook || !searchQuery) return [];
    const text = notebook.content.toLowerCase();
    const query = searchQuery.toLowerCase();
    const matches: number[] = [];
    let i = 0;
    while ((i = text.indexOf(query, i)) !== -1) {
      matches.push(i);
      i += query.length;
    }
    return matches;
  }, [notebook?.content, searchQuery]);

  useEffect(() => {
    if (searchMatches.length === 0) {
      setCurrentMatch(-1);
    } else if (currentMatch >= searchMatches.length || currentMatch < 0) {
      setCurrentMatch(0);
    }
  }, [searchMatches.length, currentMatch]);

  useEffect(() => {
    if (searchQuery && searchMatches.length > 0) {
       setCurrentMatch(0);
       scrollToMatch(0, searchMatches, false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery]);

  useEffect(() => {
    if (textareaRef.current) {
      // Auto resize height to fit content
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
      
      // Auto focus on open if not searching
      if (viewMode !== 'preview' && !isSearchActive && document.activeElement !== textareaRef.current) {
        // Only focus if we just opened a new notebook
        textareaRef.current.focus();
      }
    }
  }, [notebook?.id, viewMode]);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
    }
  }, [notebook?.content]);

  const scrollToMatch = (index: number, matches: number[] = searchMatches, stealFocus: boolean = true) => {
    if (index >= 0 && index < matches.length && textareaRef.current) {
      const matchPos = matches[index];
      
      if (stealFocus && document.activeElement !== textareaRef.current) {
         textareaRef.current.focus();
      }
      textareaRef.current.setSelectionRange(matchPos, matchPos + searchQuery.length);
      
      const scroller = document.getElementById('editor-scroller');
      if (scroller) {
        const textUpToMatch = notebook?.content.substring(0, matchPos) || '';
        const lines = textUpToMatch.split('\n').length;
        const estimatedY = (lines - 1) * 32 + 32; 
        scroller.scrollTo({
          top: Math.max(0, estimatedY - scroller.clientHeight / 2),
          behavior: 'smooth'
        });
      }
    }
  };

  const clearSearch = () => {
    setSearchQuery('');
    setIsSearchActive(false);
  };

  if (!notebook) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center opacity-40">
        <h2 className="notebook-title !text-3xl">Hãy mở một quyển vở ra để bắt đầu viết nhé!</h2>
      </div>
    );
  }

  const handlePrint = () => {
    setViewMode('preview');
    setTimeout(() => {
      window.print();
    }, 100);
  };

  const addStickyNote = () => {
    const newSticky: StickyNote = {
      id: crypto.randomUUID(),
      content: '',
      color: ['pink', 'green', 'blue', 'yellow'][Math.floor(Math.random() * 4)] as any,
      position: { x: 50 + Math.random() * 100, y: 50 + Math.random() * 100 },
      rotation: Math.random() * 6 - 3,
    };
    onUpdateStickies([...notebook.stickies, newSticky]);
  };

  const updateSticky = (id: string, newContent: string) => {
    onUpdateStickies(notebook.stickies.map(s => s.id === id ? { ...s, content: newContent } : s));
  };

  const deleteSticky = (id: string) => {
    onUpdateStickies(notebook.stickies.filter(s => s.id !== id));
  };

  const updateStickyPos = (id: string, x: number, y: number) => {
    onUpdateStickies(notebook.stickies.map(s => s.id === id ? { ...s, position: { x, y } } : s));
  };

  return (
    <div className="w-full h-full flex flex-col relative px-4 md:px-8 py-6 print:p-0">
      
      {/* Top Header & Toolbar */}
      <div className="flex justify-between items-start md:items-center mb-6 z-20 shrink-0 gap-4 flex-col md:flex-row no-print">
        <div className="flex items-center pl-20 md:pl-24"> 
            <h1 className="notebook-title !text-3xl md:!text-4xl m-0 drop-shadow-sm">
              {notebook.name}
            </h1>
        </div>
        
        <div className="flex gap-3 justify-end items-center flex-wrap shrink-0">
          
          {/* Search Bar */}
          <div className="flex items-center bg-white/60 backdrop-blur-sm rounded-full border-2 border-[var(--color-ink)] px-2 py-1 shadow-sm h-10 w-full sm:w-auto relative group focus-within:ring-2 ring-[var(--color-pastel-blue)]">
             <Search size={16} className="text-[var(--color-ink)] mr-2 flex-shrink-0" />
             <input
               type="text"
               value={searchQuery}
               onChange={(e) => setSearchQuery(e.target.value)}
               onKeyDown={(e) => {
                 if (e.key === 'Enter' && searchMatches.length > 0) {
                   e.preventDefault();
                   const next = (currentMatch + 1) % searchMatches.length;
                   setCurrentMatch(next);
                   scrollToMatch(next);
                 }
               }}
               onFocus={() => {
                 setIsSearchActive(true);
                 if (viewMode === 'preview') setViewMode('split');
               }}
               placeholder="Tìm kiếm..."
               className="bg-transparent outline-none border-none w-24 focus:w-40 sm:w-32 sm:focus:w-48 transition-all notebook-body !text-base h-full"
             />
             {searchQuery && (
               <div className="flex items-center ml-2 border-l-2 border-[var(--color-ink)]/20 pl-2 gap-1 h-full">
                 <span className="text-xs font-semibold px-1 min-w-[30px] text-center">
                   {searchMatches.length > 0 ? `${currentMatch + 1}/${searchMatches.length}` : '0/0'}
                 </span>
                 <button 
                   onClick={() => {
                     const next = (currentMatch - 1 + searchMatches.length) % searchMatches.length;
                     setCurrentMatch(next);
                     scrollToMatch(next);
                   }}
                   className="p-1 hover:bg-[var(--color-ink)]/10 rounded cursor-pointer disabled:opacity-50"
                   disabled={searchMatches.length === 0}
                 >
                   <ChevronUp size={16} strokeWidth={3} />
                 </button>
                 <button 
                   onClick={() => {
                     const next = (currentMatch + 1) % searchMatches.length;
                     setCurrentMatch(next);
                     scrollToMatch(next);
                   }}
                   className="p-1 hover:bg-[var(--color-ink)]/10 rounded cursor-pointer disabled:opacity-50"
                   disabled={searchMatches.length === 0}
                 >
                   <ChevronDown size={16} strokeWidth={3} />
                 </button>
                 <button onClick={clearSearch} className="p-1 hover:bg-[var(--color-red-pen)]/20 text-[var(--color-red-pen)] rounded cursor-pointer ml-1">
                   <X size={16} strokeWidth={3} />
                 </button>
               </div>
             )}
          </div>

          <button 
            onClick={addStickyNote}
            className="p-2 bg-white/60 backdrop-blur-sm rounded-full border-2 border-[var(--color-ink)] hover:bg-[var(--color-pastel-pink)] transition-colors cursor-pointer text-[var(--color-ink)] shadow-sm"
            title="Thêm giấy ghi nhớ"
          >
            <StickyIcon size={20} className="fill-current text-[var(--color-ink)] opacity-40" strokeWidth={2} />
          </button>
          
          <button 
            onClick={handlePrint}
            className="p-2 bg-white/60 backdrop-blur-sm rounded-full border-2 border-[var(--color-ink)] hover:bg-[var(--color-pastel-blue)] transition-colors cursor-pointer text-[var(--color-ink)] shadow-sm"
            title="Xuất PDF / In ấn"
          >
            <Printer size={20} strokeWidth={2.5} />
          </button>

          {/* View Mode Toggle */}
          <div className="flex bg-white/60 backdrop-blur-sm rounded-full border-2 border-[var(--color-ink)] overflow-hidden shadow-sm font-bold text-[var(--color-ink)] h-10">
            <button 
              onClick={() => setViewMode('edit')}
              className={`px-3 py-1 flex items-center gap-1 transition-colors hover:bg-black/5 cursor-pointer h-full ${viewMode === 'edit' ? 'bg-[var(--color-highlighter)]' : ''}`}
              title="Chế độ Viết"
            >
              <Edit3 size={16} strokeWidth={2.5} className="md:mr-1" /> <span className="hidden md:inline">Viết</span>
            </button>
            <button 
              onClick={() => setViewMode('split')}
              className={`px-3 py-1 flex items-center gap-1 transition-colors hover:bg-black/5 border-l-2 border-r-2 border-[var(--color-ink)] cursor-pointer h-full ${viewMode === 'split' ? 'bg-[var(--color-highlighter)]' : ''}`}
              title="Chia đôi màn hình"
            >
              <Columns size={16} strokeWidth={2.5} className="md:mr-1" /> <span className="hidden md:inline">Chia đôi</span>
            </button>
            <button 
              onClick={() => setViewMode('preview')}
              className={`px-3 py-1 flex items-center gap-1 transition-colors hover:bg-black/5 cursor-pointer h-full ${viewMode === 'preview' ? 'bg-[var(--color-highlighter)]' : ''}`}
              title="Chế độ Xem"
            >
              <Eye size={16} strokeWidth={2.5} className="md:mr-1" /> <span className="hidden md:inline">Xem</span>
            </button>
          </div>
        </div>
      </div>

      {/* Desk Area with Sheets */}
      <div className="w-full flex-grow flex gap-6 relative overflow-hidden print:overflow-visible">
        
        {/* Editor Half */}
        {(viewMode === 'edit' || viewMode === 'split') && (
          <div className={`flex-1 min-w-0 h-full notebook-paper flex flex-col ${viewMode === 'split' ? 'hidden md:flex' : 'flex'} print:hidden`}>
            <div className="flex-grow overflow-y-auto w-full scroll-smooth" id="editor-scroller">
              <textarea
                ref={textareaRef}
                value={notebook.content}
                onChange={(e) => {
                  e.target.style.height = 'auto';
                  e.target.style.height = e.target.scrollHeight + 'px';
                  onChange(e.target.value);
                }}
                onClick={() => setIsSearchActive(false)}
                placeholder="Gõ nội dung Markdown & LaTeX tại đây..."
                className="w-full min-h-full resize-none outline-none notebook-body bg-transparent lined-paper pl-[60px] pr-8 pt-8 pb-32 overflow-hidden block"
                spellCheck={false}
              />
            </div>
          </div>
        )}

        {/* Preview Half */}
        {(viewMode === 'preview' || viewMode === 'split') && (
          <div className={`flex-1 min-w-0 h-full notebook-paper flex flex-col ${viewMode === 'split' ? 'flex' : 'flex'}`}>
            <div className="flex-grow overflow-y-auto w-full scroll-smooth overflow-x-auto">
              <div className="notebook-body bg-transparent lined-paper prose-notebook pl-[60px] pr-8 pt-8 pb-32 min-h-full h-fit flex flex-col min-w-0">
                <ReactMarkdown 
                  remarkPlugins={[remarkMath, remarkGfm]} 
                  rehypePlugins={[rehypeKatex]}
                >
                  {notebook.content || '*Chưa có nội dung...*'}
                </ReactMarkdown>
              </div>
            </div>
          </div>
        )}

        {/* Sticky Notes */}
        {notebook.stickies.map(sticky => (
          <DraggableSticky 
            key={sticky.id} 
            sticky={sticky} 
            onUpdate={(content) => updateSticky(sticky.id, content)}
            onDelete={() => deleteSticky(sticky.id)}
            onMove={(x, y) => updateStickyPos(sticky.id, x, y)}
          />
        ))}
      </div>
    </div>
  );
}

function DraggableSticky({ sticky, onUpdate, onDelete, onMove }: { sticky: StickyNote, onUpdate: (c: string) => void, onDelete: () => void, onMove: (x: number, y: number) => void }) {
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  const colorMap = {
    pink: 'bg-[var(--color-pastel-pink)]',
    green: 'bg-[var(--color-pastel-green)]',
    blue: 'bg-[var(--color-pastel-blue)]',
    yellow: 'bg-[var(--color-highlighter)]'
  };

  const handlePointerDown = (e: React.PointerEvent) => {
    e.target.setPointerCapture(e.pointerId);
    setIsDragging(true);
    setDragOffset({
      x: e.clientX - sticky.position.x,
      y: e.clientY - sticky.position.y
    });
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (isDragging) {
      onMove(e.clientX - dragOffset.x, e.clientY - dragOffset.y);
    }
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    e.target.releasePointerCapture(e.pointerId);
    setIsDragging(false);
  };

  return (
    <div 
      className={`absolute w-48 min-h-[140px] p-3 sticky-note flex flex-col gap-1 shadow-md z-10 ${colorMap[sticky.color] || colorMap.yellow} print:hidden`}
      style={{ 
        transform: `rotate(${sticky.rotation}deg)`,
        left: sticky.position.x,
        top: sticky.position.y,
        cursor: isDragging ? 'grabbing' : 'auto'
      }}
    >
      <div 
        className="w-full h-6 cursor-grab active:cursor-grabbing flex justify-between items-center opacity-40 hover:opacity-100 transition-opacity"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
      >
        <div className="flex-grow flex gap-1 justify-center px-2">
          {/* subtle drag handle texture */}
          <div className="w-1 h-1 rounded-full bg-[var(--color-ink)] opacity-50"></div>
          <div className="w-1 h-1 rounded-full bg-[var(--color-ink)] opacity-50"></div>
          <div className="w-1 h-1 rounded-full bg-[var(--color-ink)] opacity-50"></div>
        </div>
        <button onClick={onDelete} className="p-1 hover:text-[var(--color-red-pen)] cursor-pointer" onPointerDown={e => e.stopPropagation()}>
          <X size={16} strokeWidth={3} />
        </button>
      </div>
      <textarea 
        value={sticky.content}
        onChange={e => onUpdate(e.target.value)}
        placeholder="Ghi nhớ..."
        className="w-full flex-grow bg-transparent outline-none resize-none notebook-body !line-height-[1.4] !text-base"
        spellCheck={false}
      />
    </div>
  );
}

