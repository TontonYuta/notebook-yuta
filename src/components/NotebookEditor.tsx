import React, { useEffect, useRef, useState, useMemo } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import rehypeSlug from 'rehype-slug';
import rehypeHighlight from 'rehype-highlight';
import remarkBreaks from 'remark-breaks';
import rehypeSanitize, { defaultSchema } from 'rehype-sanitize';
import getCaretCoordinates from 'textarea-caret';
import TextareaAutosize from 'react-textarea-autosize';
import { Notebook, StickyNote } from '../types';
import { Columns, Eye, Edit3, Printer, StickyNote as StickyIcon, X, Plus, Search, ChevronUp, ChevronDown, Pin, HelpCircle, AlignJustify } from 'lucide-react';

interface Props {
  notebook: Notebook | null;
  onChange: (content: string) => void;
  onUpdateStickies: (stickies: StickyNote[]) => void;
}

type ViewMode = 'edit' | 'split' | 'preview';

const processHighlight = (text: string) => {
  const parts = text.split(/(```[\s\S]*?```|`[^`]+`|\$\$[\s\S]*?\$\$|\$[^$]+\$)/g);
  return parts.map((part, index) => {
    if (index % 2 === 1) return part; // Inside code block or math
    return part.replace(/==([^=]+)==/g, '<mark>$1</mark>');
  }).join('');
};

const customSchema = {
  ...defaultSchema,
  tagNames: [...(defaultSchema.tagNames || []), 'mark', 'details', 'summary', 'iframe'],
  attributes: {
    ...defaultSchema.attributes,
    '*': [...(defaultSchema.attributes?.['*'] || []), 'style', 'className', 'align'],
    span: ['style'],
    p: ['align'],
    img: ['src', 'alt', 'width', 'height', 'align'],
    iframe: ['src', 'width', 'height', 'allowfullscreen', 'allow', 'frameborder']
  }
};

export function NotebookEditor({ notebook, onChange, onUpdateStickies }: Props) {
  const [viewMode, setViewMode] = useState<ViewMode>('split');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentMatch, setCurrentMatch] = useState(-1);
  const [isSearchActive, setIsSearchActive] = useState(false);
  const [isPrinting, setIsPrinting] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [showLines, setShowLines] = useState(true);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const searchMatches = useMemo(() => {
    if (!notebook || !searchQuery || notebook.type === 'pdf') return [];
    const text = notebook.content.toLowerCase();
    const query = searchQuery.toLowerCase();
    const matches: number[] = [];
    let i = 0;
    while ((i = text.indexOf(query, i)) !== -1) {
      matches.push(i);
      i += query.length;
    }
    return matches;
  }, [notebook?.content, notebook?.type, searchQuery]);

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

  const handleCaretCenter = (smooth = false) => {
    if (!textareaRef.current) return;
    const scroller = document.getElementById('editor-scroller');
    if (!scroller) return;

    try {
      const caret = getCaretCoordinates(textareaRef.current, textareaRef.current.selectionEnd);
      
      const scrollerTop = scroller.scrollTop;
      const scrollerBottom = scrollerTop + scroller.clientHeight;
      
      const caretTop = caret.top;
      const caretBottom = caret.top + (caret.height || 20);

      // Only scroll if the caret is less than 40px from the top or bottom of the visible area
      if (caretTop < scrollerTop + 40 || caretBottom > scrollerBottom - 40) {
        const centerY = scroller.clientHeight / 2;
        const targetScroll = caret.top - centerY + (caret.height || 20) / 2;
        
        scroller.scrollTo({
          top: Math.max(0, targetScroll),
          behavior: smooth ? 'smooth' : 'auto'
        });
      }
    } catch (e) {
      console.error('Failed to center caret', e);
    }
  };

  if (!notebook) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center opacity-40">
        <h2 className="notebook-title !text-3xl">Hãy mở một quyển vở ra để bắt đầu viết nhé!</h2>
      </div>
    );
  }

  const handlePrint = () => {
    if (notebook.type === 'pdf') {
      try {
        const iframe = document.querySelector('iframe[title="PDF Viewer"]') as HTMLIFrameElement;
        if (iframe && iframe.contentWindow) {
          iframe.contentWindow.print();
          return;
        }
      } catch (e) {
        console.log("Could not print iframe directly, opening the PDF in a new tab instead");
      }
      
      // Fallback: open the PDF in a new tab so the user can use the browser's native PDF print.
      window.open(notebook.content, '_blank', 'noopener,noreferrer');
      return;
    }
    
    setViewMode('preview');
    setIsPrinting(true);
    document.body.classList.add('printing-mode');
    setTimeout(() => {
      window.print();
      setIsPrinting(false);
      document.body.classList.remove('printing-mode');
    }, 500);
  };

  const addStickyNote = () => {
    let scrollY = 0;
    const scroller = viewMode === 'preview' ? document.getElementById('preview-scroller') : document.getElementById('editor-scroller');
    if (scroller) {
      scrollY = scroller.scrollTop;
    }

    const newSticky: StickyNote = {
      id: crypto.randomUUID(),
      content: '',
      color: ['pink', 'green', 'blue', 'yellow'][Math.floor(Math.random() * 4)] as any,
      position: { x: 50 + Math.random() * 100, y: scrollY + 50 + Math.random() * 100 },
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
    <div className={`notebook-editor-container w-full h-full flex flex-col relative px-4 md:px-8 py-6 print:p-0 ${isPrinting ? 'is-printing print:bg-white print:w-full print:block print:h-auto print:overflow-visible' : ''}`}>
      
      {/* Top Header & Toolbar */}
      <div className="flex justify-between items-start md:items-center mb-6 z-20 shrink-0 gap-4 flex-col md:flex-row no-print">
        <div className="flex items-center pl-20 md:pl-24"> 
            <h1 className="notebook-title !text-3xl md:!text-4xl m-0 drop-shadow-sm">
              {notebook.name}
            </h1>
        </div>
        
        <div className="flex gap-3 justify-end items-center flex-wrap shrink-0">
          
          {/* Search Bar */}
          {notebook.type !== 'pdf' && (
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
          )}

          {notebook.type !== 'pdf' && (
            <button 
              onClick={() => setShowHint(true)}
              className="p-2 bg-white/60 backdrop-blur-sm rounded-full border-2 border-[var(--color-ink)] hover:bg-[var(--color-highlighter)] transition-colors cursor-pointer text-[var(--color-ink)] shadow-sm"
              title="Cú pháp Markdown & LaTeX"
            >
              <HelpCircle size={20} strokeWidth={2.5} />
            </button>
          )}

          {notebook.type !== 'pdf' && (
            <button 
              onClick={() => setShowLines(!showLines)}
              className={`p-2 backdrop-blur-sm rounded-full border-2 border-[var(--color-ink)] transition-colors cursor-pointer text-[var(--color-ink)] shadow-sm ${showLines ? 'bg-black/5 hover:bg-white/60' : 'bg-white/60 hover:bg-black/5'}`}
              title={showLines ? "Tắt tự động căn dòng kẻ" : "Bật tự động căn dòng kẻ"}
            >
              <AlignJustify size={20} strokeWidth={2.5} />
            </button>
          )}

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
          {notebook.type !== 'pdf' && (
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
          )}
        </div>
      </div>

      {/* Desk Area with Sheets */}
      <div className="w-full flex-grow flex gap-6 relative overflow-hidden print:overflow-visible print:block">
        
        {/* Editor Half */}
        {notebook.type !== 'pdf' && (viewMode === 'edit' || viewMode === 'split') && (
          <div 
            className={`flex-1 min-w-0 h-full notebook-paper flex flex-col relative ${viewMode === 'split' ? 'hidden md:flex' : 'flex'} print:hidden`}
            data-color={notebook.color || 'default'}
          >
            <div className="flex-grow overflow-y-auto w-full relative" id="editor-scroller">
              <TextareaAutosize
                ref={textareaRef}
                value={notebook.content}
                onChange={(e) => {
                  onChange(e.target.value);
                  requestAnimationFrame(() => handleCaretCenter(false));
                }}
                onSelect={() => {
                  requestAnimationFrame(() => handleCaretCenter(false));
                }}
                onClick={() => {
                  setIsSearchActive(false);
                  requestAnimationFrame(() => handleCaretCenter(false));
                }}
                placeholder="Gõ nội dung Markdown & LaTeX tại đây..."
                className={`w-full min-h-full resize-none outline-none notebook-body bg-transparent ${showLines ? 'lined-paper' : ''} pl-[60px] pr-8 pt-8 pb-[50vh] overflow-hidden block relative z-0`}
                spellCheck={false}
              />
              {/* Sticky Notes for Editor */}
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
        )}

        {/* Preview Half (Markdown or PDF) */}
        {((notebook.type !== 'pdf' && (viewMode === 'preview' || viewMode === 'split')) || notebook.type === 'pdf') && (
          <div 
            className={`flex-1 min-w-0 h-full notebook-paper flex flex-col relative ${viewMode === 'split' && notebook.type !== 'pdf' ? 'flex' : 'flex'} print:h-auto print:block`}
            data-color={notebook.color || 'default'}
          >
            <div className="flex-grow overflow-y-auto w-full scroll-smooth overflow-x-auto p-4 relative print:overflow-visible print:h-auto" id="preview-scroller">
              {notebook.type === 'pdf' ? (
                <iframe
                  src={notebook.content || undefined}
                  className="w-full h-[80vh] border-none rounded print:hidden relative z-0"
                  title="PDF Viewer"
                />
              ) : (
                <div className={`notebook-body bg-transparent ${showLines ? 'lined-paper-preview' : ''} prose-notebook pl-[60px] pr-8 pt-8 pb-[50vh] min-h-full h-fit flex flex-col min-w-0 relative z-0 print:h-auto print:min-h-0 print:p-0`}>
                  <ReactMarkdown 
                    remarkPlugins={[remarkMath, remarkGfm, remarkBreaks]} 
                    rehypePlugins={[rehypeRaw, [rehypeSanitize, customSchema], rehypeKatex, rehypeSlug, rehypeHighlight]}
                  >
                    {processHighlight(notebook.content || '*Chưa có nội dung...*')}
                  </ReactMarkdown>
                </div>
              )}
              {/* Sticky Notes for Preview */}
              {notebook.stickies.map(sticky => (
                <DraggableSticky 
                  key={`preview-${sticky.id}`} 
                  sticky={sticky} 
                  onUpdate={(content) => updateSticky(sticky.id, content)}
                  onDelete={() => deleteSticky(sticky.id)}
                  onMove={(x, y) => updateStickyPos(sticky.id, x, y)}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Hint Modal */}
      {showHint && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm print:hidden">
          <div className="bg-[var(--color-cream)] border-2 border-[var(--color-ink)] rounded-2xl shadow-[8px_8px_0px_var(--color-ink)] w-full max-w-2xl max-h-[85vh] overflow-hidden flex flex-col">
            <div className="flex justify-between items-center p-4 border-b-2 border-dashed border-[var(--color-ink)]/20 bg-[var(--color-pastel-blue)]/20">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <HelpCircle size={24} className="text-[var(--color-ink)]" />
                Hướng dẫn cú pháp (Cheat Sheet)
              </h2>
              <button onClick={() => setShowHint(false)} className="p-1 hover:bg-black/10 rounded-full transition-colors cursor-pointer">
                <X size={24} strokeWidth={2.5} />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto overflow-x-hidden flex-grow notebook-body !text-base space-y-6">
              <section>
                <h3 className="font-bold text-lg mb-2 text-[var(--color-red-pen)] flex items-center gap-2 border-b-2 border-[var(--color-ink)]/10 pb-1">1. Định dạng cơ bản</h3>
                <ul className="list-disc pl-5 space-y-1">
                  <li><strong>In đậm</strong>: <code>**nội dung**</code></li>
                  <li><em>In nghiêng</em>: <code>*nội dung*</code></li>
                  <li><del>Gạch ngang</del>: <code>~~nội dung~~</code></li>
                  <li><mark>Highlight vàng</mark>: <code>==nội dung==</code></li>
                  <li>Chú thích (Footnote): <code>Nguồn[^1]</code> và giải thích ở dưới cùng <code>[^1]: Chi tiết nguồn</code></li>
                </ul>
              </section>

              <section>
                <h3 className="font-bold text-lg mb-2 text-[var(--color-green-pen)] border-b-2 border-[var(--color-ink)]/10 flex items-center gap-2 pb-1">2. Toán học (LaTeX)</h3>
                <ul className="list-disc pl-5 space-y-1">
                  <li>Công thức cùng dòng: <code>$E=mc^2$</code></li>
                  <li>Công thức khối (căn giữa):<br/>
                    <code>$$<br/>{"\\int_0^\\infty e^{-x^2} dx = \\frac{\\sqrt{\\pi}}{2}"}<br/>$$</code>
                  </li>
                  <li>Phân số: <code>{"$\\frac{a}{b}$"}</code>, Căn bậc hai: <code>{"$\\sqrt{x}$"}</code></li>
                </ul>
              </section>

              <section>
                <h3 className="font-bold text-lg mb-2 text-purple-600 border-b-2 border-[var(--color-ink)]/10 flex items-center gap-2 pb-1">3. Cấu trúc HTML & Nâng cao</h3>
                <ul className="list-disc pl-5 space-y-1">
                  <li>Đổi màu chữ: <code>&lt;span style="color: red;"&gt;chữ đỏ&lt;/span&gt;</code></li>
                  <li>Căn lề hình ảnh: <code>&lt;img align="center" src="..." width="300"/&gt;</code></li>
                  <li>Khối nội dung ẩn/hiện (Collapsible):<br/>
                    <pre className="bg-black/5 p-2 rounded border border-[var(--color-ink)]/20 text-sm mt-1 whitespace-pre-wrap"><code>{"<details>\n  <summary><b>Bấm xem chi tiết</b></summary>\n  Nội dung bị ẩn đi...\n</details>"}</code></pre>
                  </li>
                  <li>Liên kết neo (TOC): <code>{"[Tên mục](#1-ten-muc)"}</code> (Viết thường, thay dấu cách bằng gạch nối)</li>
                  <li>Bỏ qua markdown bằng gạch chéo ngược: <code>{"\\*Không bị in nghiêng\\*"}</code></li>
                </ul>
              </section>

              <section>
                <h3 className="font-bold text-lg mb-2 border-b-2 border-[var(--color-ink)]/10 flex items-center gap-2 pb-1">4. Khối Code & Khác</h3>
                <ul className="list-disc pl-5 space-y-1">
                  <li>Code trên cùng 1 dòng: <code>`console.log("hello")`</code></li>
                  <li>Khối Code nhiều dòng có màu cú pháp:
                    <pre className="bg-black/5 p-2 rounded border border-[var(--color-ink)]/20 text-sm mt-1"><code>```javascript<br/>function add(a, b) &#123;<br/>  return a + b;<br/>&#125;<br/>```</code></pre>
                  </li>
                  <li>Trích dẫn (Quote): <code>&gt; Câu trích dẫn</code></li>
                </ul>
              </section>
            </div>
          </div>
        </div>
      )}
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
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
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
    (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
    setIsDragging(false);
  };

  return (
    <div 
      className={`absolute w-48 min-h-[140px] p-3 pt-4 sticky-note flex flex-col gap-1 shadow-md z-10 ${colorMap[sticky.color] || colorMap.yellow} print:hidden`}
      style={{ 
        transform: `rotate(${sticky.rotation}deg)`,
        left: sticky.position.x,
        top: sticky.position.y,
        cursor: isDragging ? 'grabbing' : 'auto'
      }}
    >
      {/* Pin Icon overlaying the top center */}
      <div className="absolute top-[-10px] left-1/2 -translate-x-1/2 text-red-500 drop-shadow-md z-20">
        <Pin size={28} className="fill-red-500" strokeWidth={1.5} />
      </div>

      <div 
        className="w-full h-6 cursor-grab active:cursor-grabbing flex justify-between items-center opacity-40 hover:opacity-100 transition-opacity print:hidden"
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
        className="w-full flex-grow bg-transparent outline-none resize-none notebook-body !line-height-[1.4] !text-base print:overflow-hidden print:resize-none"
        spellCheck={false}
      />
    </div>
  );
}

