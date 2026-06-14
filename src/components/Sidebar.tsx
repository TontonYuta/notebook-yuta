import React, { useState, useMemo } from 'react';
import { Notebook } from '../types';
import { Plus, X, Trash2, Edit2, Check, Book, Search, GripVertical, Upload, FileText } from 'lucide-react';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';

interface Props {
  notebooks: Notebook[];
  activeIds: string[];
  isOpen: boolean;
  onClose: () => void;
  onSelect: (id: string) => void;
  onAdd: () => void;
  onDelete: (id: string) => void;
  onRename: (id: string, newName: string) => void;
  onChangeColor?: (id: string, color: Notebook['color']) => void;
  onReorder?: (movedId: string, destIndex: number, type: 'text' | 'pdf') => void;
  onImport?: (name: string, content: string, type: 'text' | 'pdf') => void;
}

const COLOR_MAP = {
  default: 'bg-white border-[var(--color-ink)]',
  pink: 'bg-[var(--color-pastel-pink)] border-pink-400',
  green: 'bg-[#a7f3d0] border-emerald-500', 
  blue: 'bg-[var(--color-pastel-blue)] border-blue-400',
  yellow: 'bg-[var(--color-highlighter)] border-amber-500'
};

const COLORS: Notebook['color'][] = ['default', 'pink', 'green', 'blue', 'yellow'];

export function Sidebar({
  notebooks,
  activeIds,
  isOpen,
  onClose,
  onSelect,
  onAdd,
  onDelete,
  onRename,
  onChangeColor,
  onReorder,
  onImport
}: Props) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  const startEdit = (e: React.MouseEvent, notebook: Notebook) => {
    e.stopPropagation();
    setEditingId(notebook.id);
    setEditName(notebook.name);
  };

  const saveEdit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (editingId && editName.trim()) {
      onRename(editingId, editName.trim());
    }
    setEditingId(null);
  };

  const handleDelete = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (window.confirm("Bạn có chắc chắn muốn xóa quyển vở này? Toàn bộ nội dung sẽ bị mất.")) {
      onDelete(id);
    }
  };

  const isSearching = searchQuery.trim().length > 0;

  const filteredNotebooks = useMemo(() => {
    if (!isSearching) return notebooks;
    return notebooks.filter(n => n.name.toLowerCase().includes(searchQuery.toLowerCase()));
  }, [notebooks, searchQuery, isSearching]);

  const textNotebooks = useMemo(() => filteredNotebooks.filter(n => n.type !== 'pdf'), [filteredNotebooks]);
  const pdfNotebooks = useMemo(() => filteredNotebooks.filter(n => n.type === 'pdf'), [filteredNotebooks]);

  const handleDragEnd = (result: DropResult) => {
    const { source, destination, draggableId } = result;
    if (!destination) return;
    if (source.droppableId !== destination.droppableId) return;

    if (onReorder && !isSearching) {
      const type = source.droppableId === 'notebooks-list' ? 'text' : 'pdf';
      onReorder(draggableId, destination.index, type);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !onImport) return;
    
    try {
      const isPdf = file.name.toLowerCase().endsWith('.pdf');
      let content = '';
      let type: 'text' | 'pdf' = 'text';

      if (isPdf) {
        // Read file as Data URL
        const base64 = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });
        content = base64;
        type = 'pdf';
      } else {
        content = await file.text();
        type = 'text';
      }
      
      const rawName = file.name.replace(/\.[^/.]+$/, '');
      onImport(rawName, content, type);
    } catch (err) {
      console.error('Failed to import file:', err);
      alert('Không thể tải file, vui lòng thử lại.');
    }
    
    // reset target value to allow uploading same file again
    e.target.value = '';
  };

  const renderDraggableItem = (notebook: Notebook, index: number) => (
    <Draggable key={notebook.id} draggableId={notebook.id} index={index} isDragDisabled={isSearching}>
      {(provided, snapshot) => (
        <div 
          ref={provided.innerRef}
          {...provided.draggableProps}
          onClick={() => {
            if (editingId !== notebook.id) {
              onSelect(notebook.id);
            }
          }}
          className={`group relative p-3 transition-colors cursor-pointer sketchy-border ${
            activeIds.includes(notebook.id) 
              ? 'bg-[var(--color-ink)]/5' 
              : 'bg-white hover:bg-[var(--color-ink)]/5'
          } ${snapshot.isDragging ? 'shadow-xl scale-[1.02] z-50 ring-2 ring-[var(--color-pastel-blue)]' : ''}`}
          style={{...provided.draggableProps.style}}
        >
          {/* Drag handle must always be rendered for dnd to work */}
          <div 
            {...provided.dragHandleProps} 
            style={{ display: (isSearching || editingId === notebook.id) ? 'none' : 'block' }}
            className="absolute left-1 top-1/2 -translate-y-1/2 text-[var(--color-ink)]/30 hover:text-[var(--color-ink)]/60 cursor-grab active:cursor-grabbing z-10"
            onClick={e => e.stopPropagation()}
          >
            <GripVertical size={16} />
          </div>

          {editingId === notebook.id ? (
            <div className="flex flex-col gap-2 relative z-10">
              <form onSubmit={saveEdit} onClick={e => e.stopPropagation()} className="flex items-center gap-2">
                  <input
                    autoFocus
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    onBlur={() => {
                      // delay blur to allow clicking color circles
                      setTimeout(() => saveEdit(), 150);
                    }}
                    className="flex-grow bg-transparent border-b border-[var(--color-ink)] outline-none notebook-body !line-height-normal !px-1"
                  />
                  <button type="submit" className="text-[var(--color-green-pen)] cursor-pointer p-1">
                    <Check size={18} strokeWidth={3} />
                  </button>
              </form>
              {notebook.type !== 'pdf' && (
                <div className="flex gap-2 px-1 mb-1" onClick={e => e.stopPropagation()}>
                  {COLORS.map(c => (
                    <button
                      key={c}
                      title={`Màu ${c}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        onChangeColor?.(notebook.id, c);
                      }}
                      onMouseDown={(e) => e.preventDefault()}
                      className={`w-5 h-5 rounded-full border-2 ${COLOR_MAP[c || 'default']} ${(notebook.color || 'default') === c ? 'ring-2 ring-offset-1 ring-[var(--color-ink)]' : 'opacity-80 hover:opacity-100 hover:scale-110'}`}
                    />
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center justify-between pointer-events-auto pl-4 relative z-10">
                <div className="flex items-center gap-2 flex-grow min-w-0 pr-2">
                  {notebook.type === 'pdf' ? (
                    <FileText size={18} className="text-[var(--color-red-pen)] shrink-0" strokeWidth={2.5} />
                  ) : (
                    <div className={`w-3 h-3 rounded-full border-2 shrink-0 ${COLOR_MAP[notebook.color || 'default']}`} />
                  )}
                  <span className="notebook-body !line-height-[1.4] font-semibold line-clamp-1 truncate block">
                    {notebook.name}
                  </span>
                </div>
                <div className="flex items-center shrink-0 opacity-0 group-hover:opacity-100 transition-opacity bg-white/80 rounded pl-1">
                  <button 
                    onClick={(e) => startEdit(e, notebook)}
                    className="p-1 text-[var(--color-ink)] hover:text-[var(--color-green-pen)] transition-colors cursor-pointer"
                    title="Tùy chỉnh vở"
                  >
                    <Edit2 size={16} />
                  </button>
                  <button 
                    onClick={(e) => handleDelete(e, notebook.id)}
                    className="p-1 text-[var(--color-ink)] hover:text-[var(--color-red-pen)] transition-colors cursor-pointer"
                    title="Xóa vở"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
            </div>
          )}
          <div className="text-xs opacity-50 mt-1 ml-9">
            Chỉnh sửa: {new Date(notebook.lastModified).toLocaleDateString('vi-VN')}
          </div>
        </div>
      )}
    </Draggable>
  );

  return (
    <>
      {/* Backdrop for mobile */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/10 backdrop-blur-sm z-20 md:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar Panel */}
      <div 
        className={`fixed md:relative top-0 left-0 h-full w-80 shrink-0 bg-[var(--color-cream)] border-r-2 border-[var(--color-ink)]/20 z-30 transition-all duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)] print:hidden shadow-[4px_0_15px_rgba(0,0,0,0.08)] flex flex-col ${
          isOpen ? 'translate-x-0 ml-0' : '-translate-x-full md:translate-x-0 md:-ml-80'
        }`}
      >
        <div className="flex flex-col h-full bg-[var(--color-cream)] w-full absolute left-0">
          <div className="p-4 border-b-2 border-dashed border-[var(--color-ink)]/20 flex justify-between items-center bg-[var(--color-pastel-pink)]/20">
                <h2 className="notebook-title !text-2xl m-0 flex items-center gap-2">
                   <Book className="text-[var(--color-ink)]" />
                   Giá sách
                </h2>
                <button 
                  onClick={onClose}
                  className="text-[var(--color-ink)] hover:scale-110 transition-transform p-1 cursor-pointer"
                >
                  <X size={24} />
                </button>
              </div>

              {/* Search Bar */}
              <div className="px-4 pt-4 pb-2">
                <div className="relative">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Tìm kiếm vở..."
                    className="w-full pl-9 pr-3 py-2 bg-white/50 border-2 border-[var(--color-ink)]/20 rounded-xl outline-none focus:border-[var(--color-pastel-blue)] notebook-body !text-base transition-colors"
                  />
                  <Search className="absolute left-3 top-2.5 text-[var(--color-ink)]/50" size={18} />
                </div>
              </div>

              <DragDropContext onDragEnd={handleDragEnd}>
                <div className="flex-grow overflow-y-auto p-4 pt-2">
                  <div className="mb-6">
                    <h3 className="text-sm font-bold mb-3 uppercase tracking-wider opacity-60">
                      Kho Vở (Ghi chép)
                    </h3>
                    <Droppable droppableId="notebooks-list" isDropDisabled={isSearching}>
                      {(provided) => (
                        <div 
                          className="space-y-3 min-h-[10px]"
                          ref={provided.innerRef}
                          {...provided.droppableProps}
                        >
                          {textNotebooks.map((notebook, index) => renderDraggableItem(notebook, index))}
                          {provided.placeholder}
                        </div>
                      )}
                    </Droppable>
                  </div>
                  
                  <div>
                    <h3 className="text-sm font-bold mb-3 mt-8 uppercase tracking-wider opacity-60">
                      Kho Sách (PDF)
                    </h3>
                    <Droppable droppableId="books-list" isDropDisabled={isSearching}>
                      {(provided) => (
                        <div 
                          className="space-y-3 min-h-[10px]"
                          ref={provided.innerRef}
                          {...provided.droppableProps}
                        >
                          {pdfNotebooks.map((notebook, index) => renderDraggableItem(notebook, index))}
                          {provided.placeholder}
                        </div>
                      )}
                    </Droppable>
                  </div>

                  {filteredNotebooks.length === 0 && (
                    <div className="text-center opacity-50 pt-4 notebook-body">
                      Không tìm thấy vở nào.
                    </div>
                  )}
                </div>
              </DragDropContext>

              <div className="p-4 border-t-2 border-dashed border-[var(--color-ink)]/20 shrink-0 flex flex-col gap-3">
                 <button
                   onClick={onAdd}
                   className="w-full py-3 sketchy-border flex justify-center items-center gap-2 text-[var(--color-ink)] hover:bg-[var(--color-pastel-blue)]/30 transition-colors cursor-pointer font-bold notebook-body !text-lg bg-white"
                 >
                   <Plus size={20} className="text-[var(--color-red-pen)]" strokeWidth={3} />
                   Mua vở mới
                 </button>
                 <label className="w-full py-3 sketchy-border flex justify-center items-center gap-2 text-[var(--color-ink)] hover:bg-[var(--color-pastel-pink)]/30 transition-colors cursor-pointer font-bold notebook-body !text-lg bg-white relative">
                   <Upload size={20} className="text-[var(--color-green-pen)]" strokeWidth={3} />
                   Tải file lên
                   <input type="file" accept=".txt,.md,.pdf" className="hidden" onChange={handleFileUpload} />
                 </label>
              </div>
          </div>
      </div>
    </>
  );
}
