# Hướng Dẫn Sử Dụng TM Translate (Userscript)

**TM Translate** là một công cụ mạnh mẽ chạy trên trình duyệt (thông qua Tampermonkey) giúp dịch trang web từ tiếng Trung sang tiếng Việt, chuyên dụng cho việc đọc truyện convert. Script hỗ trợ quản lý VietPhrase (Names), chế độ đọc rút gọn sạch sẽ, và tùy chỉnh giao diện linh hoạt.

## 1. Cài Đặt

Nếu bạn chưa cài đặt script, hãy nhấp vào liên kết bên dưới để cài đặt vào Tampermonkey/Violentmonkey:

👉 **[Cài đặt TM Translate.user.js](https://raw.githubusercontent.com/BaoBao666888/Novel-Downloader5/main/TM%20Translate.user.js)**

---

## 2. Giao Diện & Các Nút Chức Năng

Khi script hoạt động, bạn sẽ thấy các nút tròn nổi ở góc dưới bên phải màn hình. Mỗi nút tương ứng với một chức năng quan trọng:

### 🟢 Nút Bắt Đầu Dịch (Màu Xanh Lá)
*   **Chức năng:** Kích hoạt tính năng dịch toàn bộ trang web hiện tại sang tiếng Việt.
*   **Cách dùng:** Bấm vào nút này khi vừa vào trang truyện. Script sẽ quét văn bản và gửi yêu cầu dịch.
*   **Tự động cuộn:** Sau khi bấm dịch, khi bạn cuộn trang xuống, script sẽ tự động dịch các đoạn văn mới xuất hiện.

### 🔵 Nút Sửa Tên / Edit Name (Màu Xanh Dương - Hình Bút Chì)
*   **Chức năng:** Thêm nhanh một quy tắc thay thế tên (Name Update) khi bạn phát hiện tên nhân vật bị dịch sai hoặc chưa được dịch.
*   **Cách dùng:** 
    1. Bôi đen (tô chọn) đoạn văn bản gốc tiếng Trung (hoặc đoạn text trên màn hình mà bạn muốn sửa).
    2. Bấm vào nút **Bút Chì**.
    3. Hộp thoại hiện ra, bạn nhập tên tiếng Việt mong muốn vào ô thay thế.
    4. Bấm "Cập nhật". Script sẽ lưu lại và tự động thay thế lại toàn bộ các từ đó trên trang hiện tại.

### ⚫ Nút Giao Diện / Style (Màu Đen/Tối - Hình Tùy Chỉnh)
*   **Chức năng:** Tùy chỉnh giao diện đọc (chỉ hiện khi ở chế độ đọc rút gọn).
*   **Các tùy chọn:**
    *   **Màu nền:** Chọn các màu dịu mắt (Vàng nhạt, Xám, Đen...).
    *   **Font chữ:** Đổi font (Times New Roman, Arial, v.v.).
    *   **Cỡ chữ & Dãn dòng:** Tăng giảm kích thước chữ và khoảng cách dòng cho dễ đọc.

### 🟡 Nút Khôi Phục / Restore (Màu Vàng - Góc trên hoặc dưới)
*   **Chức năng:** Quay trở lại trang gốc ban đầu (chưa dịch).
*   **Cách dùng:** Bấm nút này nếu bạn muốn xem lại text gốc hoặc script vỡ giao diện web.

### 🔘 Nút Dịch Nhanh (Màu Xám)
*   **Chức năng:** Mở một bảng nhỏ để dán text vào và dịch nhanh một đoạn văn bản bất kỳ mà không cần dịch cả trang.

---

## 3. Các Tính Năng Nổi Bật Khác

Để truy cập cài đặt đầy đủ, bạn có thể tìm menu lệnh của Tampermonkey -> tìm đến "TM Translate" -> chọn nút "Cài đặt".

### 📖 Chế Độ Đọc Rút Gọn (Simplified Mode)
Script có khả năng ẩn đi các quảng cáo, banner, sidebar rườm rà của trang web gốc và chỉ giữ lại phần nội dung truyện chính. Điều này giúp trải nghiệm đọc giống như đang đọc Ebook. 
*   *Lưu ý:* Chế độ này thường tự kích hoạt sau khi bấm Dịch, hoặc bạn có thể cài đặt trong Config.

### 📝 Quản Lý Name-Set (Nâng Cao)
Script lưu trữ các tên bạn đã sửa vào bộ nhớ. Bạn có thể quản lý nhiều bộ Name-Set khác nhau (ví dụ: Bộ Name cho Tiên Hiệp, Bộ Name cho Đô Thị...).

### 🔓 Mở Khóa Copy (Unlock Page)
Nhiều trang truyện chặn chuột phải hoặc không cho copy. **TM Translate** tích hợp sẵn tính năng "bẻ khóa" này, cho phép bôi đen và copy văn bản thoải mái ở mọi trang web mà script chạy.

### 🛡️ Hỗ trợ Fanqie (Cà Chua)
Script tích hợp sẵn thuật toán giải mã font chữ đặc biệt của Fanqie (đã bao gồm font map), giúp hiển thị đúng nội dung bị mã hóa trên trang này.

---

## 4. Cấu Hình (Config)
Script cho phép tùy chỉnh nguồn dịch:
*   **Máy chủ dịch:** `dichngay` (mặc định) hoặc `dichnhanh`.
*   **Chế độ dịch:** Hán Việt (HV), Tiếng Việt (VI) nếu server hỗ trợ.

Nếu gặp lỗi khi dịch, hãy thử tải lại trang và đợi vài giây trước khi bấm nút Dịch.
