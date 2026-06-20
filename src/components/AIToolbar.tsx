import React from "react";

interface Props {
  pos: { top: number; left: number };
  onAskAI: (ai: "gemini" | "chatgpt" | "grok") => void;
}

export function AIToolbar({ pos, onAskAI }: Props) {
  return (
    <div
      className="fixed z-[150] animate-in fade-in zoom-in duration-100 flex items-center p-1 md:p-1.5 gap-1 md:gap-1.5 shadow-[4px_4px_0_rgba(15,23,42,1)] bg-white border-2 border-[var(--color-ink)] rounded-full max-w-[calc(100vw-20px)] overflow-x-auto no-scrollbar"
      style={{
        top: `${Math.max(10, pos.top)}px`,
        left: `${Math.max(10, pos.left)}px`,
      }}
      onMouseDown={(e) => {
        // Prevent selection loss when clicking
        e.preventDefault();
        e.stopPropagation();
      }}
    >
      <div className="flex items-center pl-2 md:pl-3 pr-1 md:pr-2 py-1 border-r-2 border-dashed border-gray-300 gap-1.5 font-bold text-xs md:text-sm text-[var(--color-ink)] select-none shrink-0 border-[var(--color-ink)]/20">
        <span className="text-[var(--color-red-pen)] animate-pulse">✦</span>
        <span className="hidden sm:inline">Hỏi AI</span>
      </div>
      <button
        onClick={(e) => {
          e.preventDefault();
          onAskAI("gemini");
        }}
        className="px-2 md:px-3 py-1.5 hover:bg-[var(--color-pastel-blue)] rounded-full text-xs md:text-sm font-bold text-[var(--color-ink)] transition-colors cursor-pointer whitespace-nowrap shrink-0"
      >
        Gemini
      </button>
      <button
        onClick={(e) => {
          e.preventDefault();
          onAskAI("chatgpt");
        }}
        className="px-2 md:px-3 py-1.5 hover:bg-[var(--color-highlighter)] rounded-full text-xs md:text-sm font-bold text-[var(--color-ink)] transition-colors cursor-pointer whitespace-nowrap shrink-0"
      >
        ChatGPT
      </button>
      <button
        onClick={(e) => {
          e.preventDefault();
          onAskAI("grok");
        }}
        className="px-2 md:px-3 py-1.5 hover:bg-[#FFEAE5] rounded-full text-xs md:text-sm font-bold text-[var(--color-ink)] transition-colors cursor-pointer whitespace-nowrap shrink-0 mr-1"
      >
        Grok
      </button>
    </div>
  );
}
