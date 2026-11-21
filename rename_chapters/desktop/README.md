# Novel Studio Desktop

Bản development đầu tiên của desktop Tauri 2 và Svelte. Màn hình **Đổi tên chương** dùng chung Rust core với CLI.

## Chạy trên Windows x64

Cần Rust 1.91.1 trở lên, công cụ build MSVC, Node.js 24, WebView2 và CPython 3. Từ thư mục này:

```powershell
npm ci
npm run tauri -- dev
```

Dùng nút **Chọn Python…** để chọn `python.exe` của môi trường đã cài. Nếu đã đặt `NOVEL_STUDIO_PYTHON` hoặc có Python trên PATH, có thể dùng mặc định. Lựa chọn trong giao diện áp dụng cho phiên hiện tại.

Chọn thư mục, chỉnh mẫu tên rồi bấm **Xem trước**. Bảng hiện cặp tên cũ/mới, file thiếu số và cảnh báo trùng đích. Có thể tìm tên và bỏ chọn từng hàng trước khi xác nhận. Giao diện sáng/tối lưu theo tùy chọn trên máy.

## Kiểm thử và build

```powershell
npm run check
npm run build
cargo test --locked --manifest-path src-tauri/Cargo.toml --features custom-protocol
cargo build --locked --manifest-path src-tauri/Cargo.toml --features custom-protocol
```

Bản development nằm trong `src-tauri/target/debug/novel-studio-desktop.exe`. Frontend được nhúng vào exe. Cần WebView2 và Python trên máy chạy. Lệnh đổi tên kiểm tra lại các file đã duyệt và dùng primitive chống ghi đè của Rust core. Nếu filesystem báo lỗi giữa batch, màn hình hiện số file đã đổi và file dừng.

Phạm vi desktop hiện tại là đổi tên TXT trong thư mục được chọn. Các thao tác chia chương và sửa dòng đầu vẫn chạy qua CLI.
