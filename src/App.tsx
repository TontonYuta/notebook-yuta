import React, { useState, useEffect } from 'react';
import { Menu } from 'lucide-react';
import { Notebook } from './types';
import { Sidebar } from './components/Sidebar';
import { NotebookEditor } from './components/NotebookEditor';

export default function App() {
  const [notebooks, setNotebooks] = useState<Notebook[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('studygram_notebooks_v3');
    if (saved) {
      try {
        const parsed: Notebook[] = JSON.parse(saved);
        setNotebooks(parsed.map(n => ({ ...n, stickies: n.stickies || [] })));
        if (parsed.length > 0) {
          setActiveId(parsed[0].id);
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
      setActiveId(hdsdNotebook.id);
    }
    setIsLoaded(true);
  }, []);

  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem('studygram_notebooks_v3', JSON.stringify(notebooks));
    }
  }, [notebooks, isLoaded]);

  const activeNotebook = notebooks.find(n => n.id === activeId) || null;

  const handleUpdateContent = (newContent: string) => {
    if (!activeId) return;
    setNotebooks(prev => prev.map(n => 
      n.id === activeId 
        ? { ...n, content: newContent, lastModified: Date.now() } 
        : n
    ));
  };

  const handleUpdateStickies = (stickies: Notebook['stickies']) => {
    if (!activeId) return;
    setNotebooks(prev => prev.map(n => 
      n.id === activeId 
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
    setActiveId(newNotebook.id);
    if (window.innerWidth < 768) {
       setIsSidebarOpen(false);
    }
  };

  const handleDeleteNotebook = (id: string) => {
    setNotebooks(prev => prev.filter(n => n.id !== id));
    if (activeId === id) {
      setActiveId(null);
    }
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

  const handleReorderNotebook = (startIndex: number, endIndex: number) => {
    setNotebooks((prev) => {
      const result = Array.from(prev);
      const [removed] = result.splice(startIndex, 1);
      result.splice(endIndex, 0, removed);
      return result;
    });
  };

  const handleImportNotebook = (name: string, content: string) => {
    const newNotebook: Notebook = {
      id: crypto.randomUUID(),
      name,
      content,
      lastModified: Date.now(),
      stickies: []
    };
    setNotebooks([newNotebook, ...notebooks]);
    setActiveId(newNotebook.id);
    if (window.innerWidth < 768) {
       setIsSidebarOpen(false);
    }
  };

  const handleSelectNotebook = (id: string) => {
     setActiveId(id);
     if (window.innerWidth < 768) {
       setIsSidebarOpen(false);
     }
  };

  return (
    <div className="flex h-screen w-full overflow-hidden bg-[var(--color-cream)] flex-row">
      
      {/* Sidebar Area */}
      <Sidebar 
        notebooks={notebooks}
        activeId={activeId}
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
      <main className="flex-grow h-full relative transition-all duration-300 overflow-hidden print:overflow-visible overflow-x-auto">
        
        {/* Toggle Sidebar Button */}
        <button 
           onClick={() => setIsSidebarOpen(!isSidebarOpen)}
           className={`absolute top-6 left-4 md:left-6 z-30 p-2 text-[var(--color-ink)] bg-white/60 backdrop-blur-[2px] rounded-full border-2 border-[var(--color-ink)] transition-transform hover:scale-105 cursor-pointer no-print shadow-sm ${isSidebarOpen ? 'hidden md:hidden' : ''}`}
           title="Mở giá sách"
         >
           <Menu size={28} strokeWidth={2.5} />
         </button>

        <NotebookEditor 
          notebook={activeNotebook} 
          onChange={handleUpdateContent}
          onUpdateStickies={handleUpdateStickies}
        />
      </main>
      
    </div>
  );
}

