import React, { useState, useEffect } from 'react';
import { Menu } from 'lucide-react';
import { Notebook } from './types';
import { Sidebar } from './components/Sidebar';
import { NotebookEditor } from './components/NotebookEditor';

export default function App() {
  const [notebooks, setNotebooks] = useState<Notebook[]>([]);
  const [activeTextId, setActiveTextId] = useState<string | null>(null);
  const [activePdfId, setActivePdfId] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('studygram_notebooks_v3');
    if (saved) {
      try {
        const parsed: Notebook[] = JSON.parse(saved);
        setNotebooks(parsed.map(n => ({ ...n, stickies: n.stickies || [] })));
        if (parsed.length > 0) {
          const textNb = parsed.find(n => n.type !== 'pdf');
          if (textNb) setActiveTextId(textNb.id);
          const pdfNb = parsed.find(n => n.type === 'pdf');
          if (pdfNb) setActivePdfId(pdfNb.id);
        }
      } catch (e) {
        console.error('Failed to parse notebooks');
      }
    } else {
      // Default initial notebooks
      const hdsdNotebook: Notebook = {
        id: crypto.randomUUID(),
        name: 'HDSD & Demo LaTeX',
        content: `# Hướng Dẫn Sử Dụng

Chào mừng bạn đến với quyển vở Offline! Không gian này hỗ trợ gõ bài học với phong cách Studygram siêu dễ thương.

## 1. Gõ Công Thức Toán Học (LaTeX)

Bạn có thể gõ công thức ngay trong dòng bằng cách bọc trong 1 dấu \`$\`: Dạng pt bậc hai $ax^2 + bx + c = 0$.

Hoặc gõ công thức nằm riêng một khối (bọc trong 2 dấu \`$$\`):

$$ x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a} $$

**Một số ví dụ LaTeX:**
- Phân số: \`\\frac{a}{b}\` $\\rightarrow \\frac{a}{b}$
- Tích phân: \`\\int_{0}^{\\pi} \\sin(x) dx\` $\\rightarrow \\int_{0}^{\\pi} \\sin(x) dx$
- Giới hạn: \`\\lim_{x \\to \\infty} f(x)\` $\\rightarrow \\lim_{x \\to \\infty} f(x)$
- Ma trận:
$$ \\begin{pmatrix} 1 & 2 \\\\ 3 & 4 \\end{pmatrix} $$

## 2. Định Dạng Văn Bản (Markdown)

- **In đậm**: bọc trong \`**\`
- *In nghiêng*: bọc trong \`*\`
- Gạch ngang: bọc trong \`~~\`

Danh sách:
- Một quyển vở đẹp
- Bút highlight

1. Học bài
2. Đi ngủ

## 3. Khám Phá Chức Năng
- Bạn đang trong chế độ **Chia đôi**, gõ bên trái là bên phải hiện ra kết quả liền! Thử xoá dòng này đi xem.
- Bấm nút giấy nhớ góc trên kia kìa để dán thêm ghi chú.
- Bấm biểu tượng \`Máy In\` để lưu ra file PDF nhé!`,
        lastModified: Date.now(),
        stickies: []
      };

      const defaultNotebook: Notebook = {
        id: crypto.randomUUID(),
        name: 'Vở Nháp',
        content: '# Nháp\n\nNơi ghi chép nhanh...',
        lastModified: Date.now(),
        stickies: []
      };
      setNotebooks([hdsdNotebook, defaultNotebook]);
      setActiveTextId(hdsdNotebook.id);
    }
    setIsLoaded(true);
  }, []);

  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem('studygram_notebooks_v3', JSON.stringify(notebooks));
    }
  }, [notebooks, isLoaded]);

  const activeTextNb = notebooks.find(n => n.id === activeTextId) || null;
  const activePdfNb = notebooks.find(n => n.id === activePdfId) || null;

  const handleUpdateContent = (id: string, newContent: string) => {
    setNotebooks(prev => prev.map(n => 
      n.id === id 
        ? { ...n, content: newContent, lastModified: Date.now() } 
        : n
    ));
  };

  const handleUpdateStickies = (id: string, stickies: Notebook['stickies']) => {
    setNotebooks(prev => prev.map(n => 
      n.id === id 
        ? { ...n, stickies, lastModified: Date.now() } 
        : n
    ));
  };

  const handleAddNotebook = () => {
    const newNotebook: Notebook = {
      id: crypto.randomUUID(),
      name: 'Quyển vở mới',
      content: '',
      lastModified: Date.now(),
      stickies: []
    };
    setNotebooks([newNotebook, ...notebooks]);
    setActiveTextId(newNotebook.id);
    if (window.innerWidth < 768) {
       setIsSidebarOpen(false);
    }
  };

  const handleDeleteNotebook = (id: string) => {
    setNotebooks(prev => prev.filter(n => n.id !== id));
    if (activeTextId === id) setActiveTextId(null);
    if (activePdfId === id) setActivePdfId(null);
  };

  const handleRenameNotebook = (id: string, newName: string) => {
    setNotebooks(prev => prev.map(n => 
      n.id === id 
        ? { ...n, name: newName, lastModified: Date.now() } 
        : n
    ));
  };

  const handleChangeColor = (id: string, color: Notebook['color']) => {
    setNotebooks(prev => prev.map(n => 
      n.id === id 
        ? { ...n, color, lastModified: Date.now() } 
        : n
    ));
  };

  const handleReorderNotebook = (movedId: string, destIndex: number, type: 'text' | 'pdf') => {
    setNotebooks((prev) => {
      const itemIndex = prev.findIndex(n => n.id === movedId);
      if (itemIndex === -1) return prev;
      const item = prev[itemIndex];
      
      let newNotebooks = [...prev];
      newNotebooks.splice(itemIndex, 1);
      
      const sameTypeItems = newNotebooks.filter(n => type === 'pdf' ? n.type === 'pdf' : n.type !== 'pdf');
      
      if (destIndex < sameTypeItems.length) {
         const targetId = sameTypeItems[destIndex].id;
         const globalTargetIndex = newNotebooks.findIndex(n => n.id === targetId);
         newNotebooks.splice(globalTargetIndex, 0, item);
      } else {
         if (sameTypeItems.length > 0) {
            const lastId = sameTypeItems[sameTypeItems.length - 1].id;
            const globalLastIndex = newNotebooks.findIndex(n => n.id === lastId);
            newNotebooks.splice(globalLastIndex + 1, 0, item);
         } else {
            // No items of this type, find where to put it
            if (type === 'text') {
               newNotebooks.unshift(item); // Texts at the top
            } else {
               newNotebooks.push(item); // Pdfs at the bottom
            }
         }
      }
      return newNotebooks;
    });
  };

  const handleImportNotebook = (name: string, content: string, type: 'text' | 'pdf' = 'text') => {
    const newNotebook: Notebook = {
      id: crypto.randomUUID(),
      name,
      content,
      type,
      lastModified: Date.now(),
      stickies: []
    };
    setNotebooks([newNotebook, ...notebooks]);
    if (type === 'pdf') {
       setActivePdfId(newNotebook.id);
    } else {
       setActiveTextId(newNotebook.id);
    }
    if (window.innerWidth < 768) {
       setIsSidebarOpen(false);
    }
  };

  const handleSelectNotebook = (id: string) => {
     const nb = notebooks.find(n => n.id === id);
     if (!nb) return;
     
     if (nb.type === 'pdf') {
       setActivePdfId(prev => prev === id ? null : id); // toggle PDF
     } else {
       setActiveTextId(id);
     }
     
     if (window.innerWidth < 768) {
       setIsSidebarOpen(false);
     }
  };

  return (
    <div className="flex h-screen w-full overflow-hidden bg-[var(--color-cream)] flex-row print:h-auto print:overflow-visible print:block">
      
      {/* Sidebar Area */}
      <Sidebar 
        notebooks={notebooks}
        activeIds={[activeTextId, activePdfId].filter(Boolean) as string[]}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        onSelect={handleSelectNotebook}
        onAdd={handleAddNotebook}
        onDelete={handleDeleteNotebook}
        onRename={handleRenameNotebook}
        onChangeColor={handleChangeColor}
        onReorder={handleReorderNotebook}
        onImport={handleImportNotebook}
      />
      
      {/* Main Content Area */}
      <main className="flex-grow flex h-full relative transition-all duration-300 overflow-hidden print:overflow-visible overflow-x-auto min-w-0">
        
        {/* Toggle Sidebar Button */}
        <button 
           onClick={() => setIsSidebarOpen(!isSidebarOpen)}
           className={`absolute top-6 left-4 md:left-6 z-30 p-2 text-[var(--color-ink)] bg-white/60 backdrop-blur-[2px] rounded-full border-2 border-[var(--color-ink)] transition-transform hover:scale-105 cursor-pointer no-print shadow-sm ${isSidebarOpen ? 'hidden md:hidden' : ''}`}
           title="Mở giá sách"
         >
           <Menu size={28} strokeWidth={2.5} />
         </button>

        {activeTextNb && (
          <div className={`flex-1 min-w-0 h-full ${activePdfNb ? 'hidden md:block' : 'block'}`}>
            <NotebookEditor 
              notebook={activeTextNb} 
              onChange={(c) => handleUpdateContent(activeTextNb.id, c)}
              onUpdateStickies={(s) => handleUpdateStickies(activeTextNb.id, s)}
            />
          </div>
        )}

        {activePdfNb && (
          <div className={`flex-1 min-w-0 h-full ${activeTextNb ? 'border-l-2 border-[var(--color-ink)]/20 shadow-[-4px_0_15px_rgba(0,0,0,0.03)]' : ''}`}>
            <NotebookEditor 
              notebook={activePdfNb} 
              onChange={(c) => handleUpdateContent(activePdfNb.id, c)}
              onUpdateStickies={(s) => handleUpdateStickies(activePdfNb.id, s)}
            />
          </div>
        )}

        {!activeTextNb && !activePdfNb && (
          <div className="w-full h-full flex flex-col items-center justify-center opacity-40">
            <h2 className="notebook-title !text-3xl">Hãy mở một quyển vở ra để bắt đầu viết nhé!</h2>
          </div>
        )}
      </main>
      
    </div>
  );
}

