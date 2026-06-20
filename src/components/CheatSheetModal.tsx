import React from "react";
import { HelpCircle, X } from "lucide-react";

interface Props {
  onClose: () => void;
}

export function CheatSheetModal({ onClose }: Props) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm print:hidden">
      <div className="bg-[var(--color-cream)] border-2 border-[var(--color-ink)] rounded-2xl shadow-[8px_8px_0px_var(--color-ink)] w-full max-w-2xl max-h-[85vh] overflow-hidden flex flex-col">
        <div className="flex justify-between items-center p-4 border-b-2 border-dashed border-[var(--color-ink)]/20 bg-[var(--color-pastel-blue)]/20">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <HelpCircle size={24} className="text-[var(--color-ink)]" />
            Hướng dẫn cú pháp (Cheat Sheet)
          </h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-black/10 rounded-full transition-colors cursor-pointer"
          >
            <X size={24} strokeWidth={2.5} />
          </button>
        </div>

        <div className="p-6 overflow-y-auto overflow-x-hidden flex-grow notebook-body !text-base space-y-6">
          <section>
            <h3 className="font-bold text-lg mb-2 text-[var(--color-red-pen)] flex items-center gap-2 border-b-2 border-[var(--color-ink)]/10 pb-1">
              1. Định dạng cơ bản
            </h3>
            <ul className="list-disc pl-5 space-y-1">
              <li>
                <strong>In đậm</strong>: <code>**nội dung**</code>
              </li>
              <li>
                <em>In nghiêng</em>: <code>*nội dung*</code>
              </li>
              <li>
                <del>Gạch ngang</del>: <code>~~nội dung~~</code>
              </li>
              <li>
                <mark>Highlight vàng</mark>: <code>==nội dung==</code>
              </li>
              <li>
                Chú thích (Footnote): <code>Nguồn[^1]</code> và giải thích ở
                dưới cùng <code>[^1]: Chi tiết nguồn</code>
              </li>
            </ul>
          </section>

          <section>
            <h3 className="font-bold text-lg mb-2 text-[var(--color-green-pen)] border-b-2 border-[var(--color-ink)]/10 flex items-center gap-2 pb-1">
              2. Toán học (LaTeX)
            </h3>
            <ul className="list-disc pl-5 space-y-1">
              <li>
                Công thức cùng dòng: <code>$E=mc^2$</code>
              </li>
              <li>
                Công thức khối (căn giữa):
                <br />
                <code>
                  $$
                  <br />
                  {"\\int_0^\\infty e^{-x^2} dx = \\frac{\\sqrt{\\pi}}{2}"}
                  <br />
                  $$
                </code>
              </li>
              <li>
                Phân số: <code>{"$\\frac{a}{b}$"}</code>, Căn bậc hai:{" "}
                <code>{"$\\sqrt{x}$"}</code>
              </li>
            </ul>
          </section>

          <section>
            <h3 className="font-bold text-lg mb-2 text-purple-600 border-b-2 border-[var(--color-ink)]/10 flex items-center gap-2 pb-1">
              3. Cấu trúc HTML & Nâng cao
            </h3>
            <ul className="list-disc pl-5 space-y-1">
              <li>
                Đổi màu chữ:{" "}
                <code>&lt;span style="color: red;"&gt;chữ đỏ&lt;/span&gt;</code>
              </li>
              <li>
                Căn lề hình ảnh:{" "}
                <code>&lt;img align="center" src="..." width="300"/&gt;</code>
              </li>
              <li>
                Khối nội dung ẩn/hiện (Collapsible):
                <br />
                <pre className="bg-black/5 p-2 rounded border border-[var(--color-ink)]/20 text-sm mt-1 whitespace-pre-wrap">
                  <code>
                    {
                      "<details>\n  <summary><b>Bấm xem chi tiết</b></summary>\n  Nội dung bị ẩn đi...\n</details>"
                    }
                  </code>
                </pre>
              </li>
              <li>
                Liên kết neo (TOC): <code>{"[Tên mục](#1-ten-muc)"}</code> (Viết
                thường, thay dấu cách bằng gạch nối)
              </li>
              <li>
                Bỏ qua markdown bằng gạch chéo ngược:{" "}
                <code>{"\\*Không bị in nghiêng\\*"}</code>
              </li>
            </ul>
          </section>

          <section>
            <h3 className="font-bold text-lg mb-2 border-b-2 border-[var(--color-ink)]/10 flex items-center gap-2 pb-1">
              4. Khối Code & Khác
            </h3>
            <ul className="list-disc pl-5 space-y-1">
              <li>
                Code trên cùng 1 dòng: <code>\`console.log("hello")\`</code>
              </li>
              <li>
                Khối Code nhiều dòng có màu cú pháp:
                <pre className="bg-black/5 p-2 rounded border border-[var(--color-ink)]/20 text-sm mt-1">
                  <code>
                    \`\`\`javascript
                    <br />
                    function add(a, b) &#123;
                    <br /> return a + b;
                    <br />
                    &#125;
                    <br />
                    \`\`\`
                  </code>
                </pre>
              </li>
              <li>
                Trích dẫn (Quote): <code>&gt; Câu trích dẫn</code>
              </li>
            </ul>
          </section>
        </div>
      </div>
    </div>
  );
}
