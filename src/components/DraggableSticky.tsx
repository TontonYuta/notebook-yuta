import React, { useState } from "react";
import { Pin, X } from "lucide-react";
import { StickyNote } from "../types";

interface Props {
  sticky: StickyNote;
  onUpdate: (content: string) => void;
  onDelete: () => void;
  onMove: (x: number, y: number) => void;
}

export function DraggableSticky({ sticky, onUpdate, onDelete, onMove }: Props) {
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  const colorMap: Record<string, string> = {
    pink: "bg-[var(--color-pastel-pink)]",
    green: "bg-[var(--color-pastel-green)]",
    blue: "bg-[var(--color-pastel-blue)]",
    yellow: "bg-[var(--color-highlighter)]",
  };

  const handlePointerDown = (e: React.PointerEvent) => {
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    setIsDragging(true);
    setDragOffset({
      x: e.clientX - sticky.position.x,
      y: e.clientY - sticky.position.y,
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
        cursor: isDragging ? "grabbing" : "auto",
      }}
    >
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
        <button
          onClick={onDelete}
          className="p-1 hover:text-[var(--color-red-pen)] cursor-pointer"
          onPointerDown={(e) => e.stopPropagation()}
        >
          <X size={16} strokeWidth={3} />
        </button>
      </div>
      <textarea
        value={sticky.content}
        onChange={(e) => onUpdate(e.target.value)}
        placeholder="Ghi nhớ..."
        className="w-full flex-grow bg-transparent outline-none resize-none notebook-body !line-height-[1.4] !text-base print:overflow-hidden print:resize-none"
        spellCheck={false}
      />
    </div>
  );
}
