# Digital Notebook & PDF Reader

Một ứng dụng ghi chú kỹ thuật số mã nguồn mở, hỗ trợ viết Markdown kết hợp đọc tài liệu PDF song song. Ứng dụng mang lại trải nghiệm giống như đang sử dụng một cuốn sổ tay thực tế với giao diện chia màn hình, giúp bạn dễ dàng vừa đọc tài liệu vừa ghi chép.

## 🌟 Tính năng Nổi bật

- **Chế độ xem Song song (Split View):** Vừa mở sách (PDF) ở một bên màn hình, vừa ghi chép (Markdown) ở nửa còn lại.
- **Quản lý đa dạng:** Phân loại rõ ràng giữa "Kho Vở" (File Text/Markdown) và "Kho Sách" (File PDF).
- **Hỗ trợ Markdown mạnh mẽ:** Hỗ trợ toán học (KaTeX) và Github Flavored Markdown (bảng biểu, task list,...).
- **Trải nghiệm Sổ tay thực tế:**
  - Giao diện giấy kẻ ngang cổ điển.
  - Hỗ trợ gắn *Sticky Notes* (giấy nhớ) có thể kéo thả tự do ở cả chế độ xem và sửa.
  - Thay đổi màu sắc nhãn dán cho từng cuốn vở.
- **Lưu trữ Offline-first:** Toàn bộ dữ liệu của bạn được lưu ngay trong trình duyệt (`localStorage`), đảm bảo sự riêng tư và có thể truy cập mọi lúc không cần mạng.
- **Tìm kiếm thông minh:** Tính năng tìm kiếm nội dung trong trang với highlight, hỗ trợ điều hướng lên/xuống (Dành cho Note Text/MD).
- **In ấn chuẩn chỉ (Chế độ In):** Bấm nút In hoặc (`Ctrl+P`) để lưu quyển vở của bạn ra PDF dễ dàng. Layout in được tùy chỉnh riêng để ẩn giao diện thừa, giữ lại toàn văn trang giấy.
- **Hỗ trợ Thiết bị Di động:** Giao diện Responsive có Sidebar trượt ẩn hiện.

## 🛠 Cài đặt & Chạy ứng dụng

Ứng dụng được xây dựng trên **React, Vite và TypeScript**.
Sử dụng TailwindCSS để thiết kế giao diện.

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

- `/src/App.tsx`: Chứa Layout quản lý state chính của ứng dụng và logic Render màn hình Split (Chia đôi).
- `/src/components/Sidebar.tsx`: Chứa giao diện hiển thị danh sách Vở và Sách. Logic tìm kiếm, Kéo/Thả (Drag & Drop) và Nút Import File.
- `/src/components/NotebookEditor.tsx`: Chứa Component chỉnh sửa bài viết Markdown, Sticky Notes. Chịu trách nhiệm hiển thị iFrame cho file PDF và thanh công cụ (Tìm kiếm, Chọn chế độ xem, In ấn).
- `/src/types.ts`: Chứa các chuẩn kiểu dữ liệu TypeScript (Notebook, StickyNote).
- `/src/index.css`: Cấu hình TailwindCSS và Custom CSS (Typography, Animation).

## 💡 Đóng góp (Contributing)
Mọi Pull Request đóng góp sửa lỗi, cải tiến tính năng hoặc chỉnh sửa UI/UX đều được khuyến khích. 

**Giấy phép (License)**: MIT License.
