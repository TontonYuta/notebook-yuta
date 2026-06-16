import React, { useEffect, useRef, useState, useMemo } from 'react';
import ReactMarkdown from 'react-markdown';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
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
import { DraggableSticky } from './DraggableSticky';
import { CheatSheetModal } from './CheatSheetModal';
import { AIToolbar } from './AIToolbar';
import { MarkdownPreview } from './MarkdownPreview';

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
  const [isPrinting, setIsPrinting] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [showLines, setShowLines] = useState(true);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  
  const [aiMenuPos, setAiMenuPos] = useState<{ top: number, left: number } | null>(null);
  const [selectedText, setSelectedText] = useState('');

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

  const handleTextSelection = () => {
    // 1. Check window selection first (for preview pane)
    const selection = window.getSelection();
    let text = selection?.toString() || '';
    let isFromTextarea = false;

    // 2. Check textarea selection
    if (textareaRef.current && document.activeElement === textareaRef.current) {
      const start = textareaRef.current.selectionStart;
      const end = textareaRef.current.selectionEnd;
      if (start !== undefined && end !== undefined && start !== end && notebook) {
        text = notebook.content.substring(start, end);
        isFromTextarea = true;
      }
    }

    text = text.trim();

    if (text.length > 0) {
      setSelectedText(text);

      if (isFromTextarea && textareaRef.current) {
        try {
          const start = Math.min(textareaRef.current.selectionStart, textareaRef.current.selectionEnd);
          const end = Math.max(textareaRef.current.selectionStart, textareaRef.current.selectionEnd);
          const caretStart = getCaretCoordinates(textareaRef.current, start);
          const caretEnd = getCaretCoordinates(textareaRef.current, end);
          const rect = textareaRef.current.getBoundingClientRect();
          
          let leftPos = rect.left + caretEnd.left - 150;
          let topPos = rect.top + caretStart.top - 50;
          
          const vw = document.documentElement.clientWidth;
          leftPos = Math.max(10, Math.min(leftPos, vw - 310)); // bounded width

          setAiMenuPos({
            top: topPos,
            left: leftPos,
          });
        } catch (e) {
          // fallback
        }
      } else if (selection && selection.rangeCount > 0) {
        const range = selection.getRangeAt(0);
        const rect = range.getBoundingClientRect();
        if (rect.width > 0 && rect.height > 0) {
          let leftPos = rect.left + rect.width / 2 - 150;
          let topPos = rect.top - 50;
          
          const vw = document.documentElement.clientWidth;
          leftPos = Math.max(10, Math.min(leftPos, vw - 310));
          
          setAiMenuPos({
            top: topPos,
            left: leftPos,
          });
        }
      }
    } else {
      setSelectedText('');
      setAiMenuPos(null);
    }
  };

  const handleAskAI = (ai: 'gemini' | 'chatgpt' | 'grok') => {
    const prompt = `[Role]: Bạn là một trợ lý học tập xuất sắc, có khả năng giải thích các khái niệm phức tạp một cách đơn giản và trực quan.
[Context]: Tôi đang đọc tài liệu và có thắc mắc về đoạn nội dung được trích dẫn.
[Task]: Hãy giải thích chi tiết, cặn kẽ ý nghĩa của đoạn nội dung này. Giảng giải như đang dạy cho một người mới bắt đầu học khái niệm này.
[Format]: Trình bày rõ ràng, chia thành các ý nhỏ dễ hiểu và cung cấp ví dụ thực tế nếu cần.

Nội dung cần giải thích:
"${selectedText}"`;
    navigator.clipboard.writeText(prompt);
    
    let url = '';
    if (ai === 'gemini') url = 'https://gemini.google.com/app';
    if (ai === 'chatgpt') url = `https://chatgpt.com/?q=${encodeURIComponent(prompt)}`;
    if (ai === 'grok') url = 'https://grok.com/';
    
    if (url) {
      if (ai !== 'chatgpt') {
         // ChatGPT has direct URL query, others need clipboard paste instruction
         alert(`Đã copy câu lệnh vào Clipboard!\n\nNhấn Ctrl+V (hoặc Cmd+V) để dán vào ${ai} nhé.`);
      }
      window.open(url, '_blank', 'noopener,noreferrer');
    }
    setAiMenuPos(null);
  };

  useEffect(() => {
    document.addEventListener('mouseup', handleTextSelection);
    document.addEventListener('touchend', handleTextSelection);
    document.addEventListener('keyup', (e) => {
      if (e.key === 'Shift' || e.key.startsWith('Arrow')) {
        handleTextSelection();
      }
    });
    return () => {
      document.removeEventListener('mouseup', handleTextSelection);
      document.removeEventListener('touchend', handleTextSelection);
    };
  }, [notebook?.content]);

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

  const handlePrint = async () => {
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
    
    const previousViewMode = viewMode;
    setViewMode('split');
    setIsPrinting(true);
    
    // Wait for the layout to change to 'split' and settle
    setTimeout(async () => {
      try {
        const previewContainer = document.getElementById('print-preview-container');
        const previewScroller = document.getElementById('preview-scroller');
        
        if (!previewContainer || !previewScroller) return;

        const originalPreviewScroll = previewScroller.scrollTop;
        // Evaluate the full content height that we need to capture
        const scrollHeight = previewScroller.scrollHeight;
        
        let clientHeight = previewContainer.clientHeight;
        let clientWidth = previewContainer.clientWidth;
        
        if (clientHeight <= 0) clientHeight = 800; // Fallback
        if (clientWidth <= 0) clientWidth = 600; // Fallback

        // Setup PDF (portrait for a single notebook page)
        const pdf = new jsPDF({
          orientation: 'portrait',
          unit: 'px',
          format: [clientWidth, clientHeight]
        });

        // 1. Lock the preview container size so it doesn't expand
        const originalContainerHeight = previewContainer.style.height;
        const originalContainerMaxHeight = previewContainer.style.maxHeight;
        const originalContainerOverflow = previewContainer.style.overflow;
        
        previewContainer.style.height = `${clientHeight}px`;
        previewContainer.style.maxHeight = `${clientHeight}px`;
        previewContainer.style.overflow = 'hidden';

        // 2. Expand the scroller to full height to disable inner scrolling (html2canvas issue)
        const originalScrollerHeight = previewScroller.style.height;
        const originalScrollerMaxHeight = previewScroller.style.maxHeight;
        const originalScrollerOverflow = previewScroller.style.overflow;
        const originalScrollerTransform = previewScroller.style.transform;
        
        previewScroller.style.height = `${scrollHeight}px`;
        previewScroller.style.maxHeight = 'none';
        previewScroller.style.overflow = 'visible';

        let currentScroll = 0;
        let isFirstPage = true;

        while (currentScroll < scrollHeight) {
          // 3. Translate the full-height scroller upwards inside the hidden-overflow container
          previewScroller.style.transform = `translateY(-${currentScroll}px)`;
          
          // Small delay to let rendering catch up
          await new Promise(r => setTimeout(r, 400));
          
          const canvas = await html2canvas(previewContainer, {
            scale: 2, 
            useCORS: true,
            logging: false,
            backgroundColor: null,
            ignoreElements: (element) => element.classList.contains('no-print') || element.classList.contains('print:hidden') || element.classList.contains('print\\:hidden')
          });
          
          const imgData = canvas.toDataURL('image/jpeg', 0.95);
          
          if (!isFirstPage) {
            pdf.addPage([clientWidth, clientHeight], 'portrait');
          }
          pdf.addImage(imgData, 'JPEG', 0, 0, clientWidth, clientHeight);
          isFirstPage = false;
          
          currentScroll += clientHeight;
        }

        pdf.save(`${notebook.name}.pdf`);
        
        // Restore elements
        previewScroller.style.transform = originalScrollerTransform;
        previewScroller.style.height = originalScrollerHeight;
        previewScroller.style.maxHeight = originalScrollerMaxHeight;
        previewScroller.style.overflow = originalScrollerOverflow;
        
        previewContainer.style.height = originalContainerHeight;
        previewContainer.style.maxHeight = originalContainerMaxHeight;
        previewContainer.style.overflow = originalContainerOverflow;
        
        previewScroller.scrollTo(0, originalPreviewScroll);
        
      } catch (err) {
        console.error("Error creating PDF", err);
      } finally {
        setIsPrinting(false);
        setViewMode(previousViewMode);
      }
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
      
      {/* Floating AI Toolbar for selected text */}
      {aiMenuPos && selectedText && !isPrinting && (
        <AIToolbar pos={aiMenuPos} onAskAI={handleAskAI} />
      )}

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

      {/* Loading Overlay for Print */}
      {isPrinting && (
        <div className="fixed inset-0 z-[100] bg-white/80 backdrop-blur-sm flex items-center justify-center no-print">
          <div className="bg-white border-2 border-[var(--color-ink)] p-6 rounded-2xl shadow-[8px_8px_0px_var(--color-ink)] flex flex-col items-center gap-4">
            <div className="w-12 h-12 border-4 border-[var(--color-red-pen)] border-t-transparent rounded-full animate-spin"></div>
            <h3 className="text-xl font-bold font-heading text-[var(--color-ink)]">Đang tạo bản scan PDF...</h3>
            <p className="text-gray-500 text-sm">Vui lòng chờ một chút để ứng dụng chụp lại quyển vở.</p>
          </div>
        </div>
      )}

      {/* Desk Area with Sheets */}
      <div id="print-capture-area" className="w-full flex-grow flex gap-6 relative overflow-hidden print:overflow-visible print:block">
        
        {/* Editor Half */}
        {notebook.type !== 'pdf' && (viewMode === 'edit' || viewMode === 'split') && (
          <div 
            className={`flex-1 min-w-0 h-full notebook-paper flex flex-col relative ${viewMode === 'split' ? 'hidden md:flex' : 'flex'}`}
            data-color={notebook.color || 'default'}
          >
            <div className="flex-grow overflow-y-auto w-full relative" id="editor-scroller">
              <TextareaAutosize
                ref={textareaRef}
                value={notebook.content}
                onChange={(e) => {
                  onChange(e.target.value);
                  requestAnimationFrame(() => handleCaretCenter(false));
                  setAiMenuPos(null);
                  setSelectedText('');
                }}
                onSelect={() => {
                  requestAnimationFrame(() => handleCaretCenter(false));
                  handleTextSelection();
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
            id="print-preview-container"
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
                  <MarkdownPreview content={notebook.content} />
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
        <CheatSheetModal onClose={() => setShowHint(false)} />
      )}
    </div>
  );
}

