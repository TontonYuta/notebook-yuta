# Digital Notebook & PDF Reader

Một ứng dụng ghi chú kỹ thuật số mã nguồn mở, hỗ trợ viết Markdown kết hợp đọc tài liệu PDF song song. Ứng dụng mang lại trải nghiệm giống như đang sử dụng một cuốn sổ tay thực tế với giao diện chia màn hình, giúp bạn dễ dàng vừa đọc tài liệu vừa ghi chép nghiên cứu.

## 🌟 Tính năng Nổi bật

- **Chế độ xem Song song (Split View):** Vừa mở sách (PDF đính kèm) ở một bên màn hình, vừa ghi chép bằng Markdown ở nửa còn lại.
- **Sắp xếp kéo thả (Drag & Drop):** Kéo thả tự do để thay đổi thứ tự và sắp xếp gọn gàng trong "Kho Vở" (Ghi chú Markdown) và "Kho Sách" (Tài liệu PDF).
- **Trải nghiệm Sổ tay thực tế:**
  - Giao diện góc viền giấy kẻ ngang cổ điển, tự do tùy chỉnh nhãn dán màu sắc (Theme gáy vở màu: xanh, hồng, vàng, mặc định).
  - Hỗ trợ gắn *Sticky Notes* (giấy nhớ) có thể ghim, di chuyển và kéo thả tự do trên trang.
- **Hỗ trợ định dạng siêu việt (Markdown + LaTeX + HTML):**
  - Viết công thức Toán học chuẩn khoa học với `KaTeX`.
  - Hỗ trợ Github Flavored Markdown (bảng biểu, task list, liên kết neo - anchor link, footnotes...).
  - Highlight khối Code nâng cao với `highlight.js`.
  - Có thể sử dụng các thẻ HTML an toàn như `<details>`, `<span>`, `<img>` để trình bày tài liệu phong phú. Cú pháp bôi vàng (`==highlight==`).
- **Cheat Sheet Gợi ý nhanh:** Có sẵn nút Cẩm nang (Tùy chọn dấu chấm hỏi) giúp tra cứu nhanh các lệnh Markdown và LaTeX thông dụng ngay trong giao diện soạn thảo.
- **Khả năng Tìm kiếm và Điều hướng thông minh:** Tìm kiếm nội dung từ khóa ngay bên trong ghi chú, highlight các kết quả và tự động cuộn (Jump to match) chuyên nghiệp.
- **Lưu trữ Offline-first:** Toàn bộ dữ liệu của bạn được lưu ngay trong trình duyệt (`localStorage`), đảm bảo tốc độ phản hồi tức thì và sự riêng tư tuyệt đối (không cần internet).
- **Trích xuất & In ấn:** Hỗ trợ phím tắt (`Ctrl+P`) để lưu file bài viết của bạn ra định dạng PDF dễ dàng, giữ nguyên bố cục dàn trang như một tờ giấy.
- **Thiết kế Responsive:** Giao diện co giãn phù hợp trên nhiều thiết bị với Sidebar tiện lợi.

## 🛠 Cài đặt & Chạy ứng dụng

Ứng dụng được xây dựng trên **React, Vite và TypeScript**. Sức mạnh hệ thống style được xử lý hoàn toàn qua **TailwindCSS**.

### 1. Yêu cầu hệ thống
- Node.js bản 18.x trở lên
- npm, yarn, hoặc pnpm

### 2. Cài đặt các thư viện

```bash
npm install
```

### 3. Chạy môi trường phát triển (Development)

```bash
npm run dev
```

Server sẽ tự động khởi động (thường là tại `http://localhost:3000`).

### 4. Build môi trường Production

```bash
npm run build
npm run start
```

## 📁 Cấu trúc thư mục (Tổng quan)

- `/src/App.tsx`: Chứa Layout quản lý state chính của ứng dụng và logic Render màn hình Split (Chia đôi màn hình).
- `/src/components/Sidebar.tsx`: Chứa giao diện hiển thị danh sách Vở và Sách. Xử lý logic tìm kiếm, Kéo/Thả (Drag & Drop) và Nút Import nội dung.
- `/src/components/NotebookEditor.tsx`: Chứa Component chỉnh sửa bài viết Markdown trung tâm. Chịu trách nhiệm hiển thị iFrame cho file PDF, render Markdown (Rehype/Remark pipelines), Cẩm nang cú pháp (Cheat Sheet) và thanh công cụ soạn thảo.
- `/src/types.ts`: Chứa các chuẩn kiểu dữ liệu Typescript (Notebook, StickyNote).
- `/src/index.css`: Cấu hình hệ thống TailwindCSS cũng như tùy chỉnh CSS Global (Typography, Scrollbars, Animations).

## 💡 Đóng góp (Contributing)
Mọi Pull Request đóng góp sửa lỗi, cải tiến tính năng hoặc chỉnh sửa định dạng UI/UX đều được xem xét và hoan nghênh.

**Giấy phép (License)**: MIT License.
