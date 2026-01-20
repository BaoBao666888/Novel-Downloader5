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

### 📷 Nút Dịch Ảnh / OCR (Màu Xanh Xanh?? / Teal)
*   **Chức năng:** Quét và dịch văn bản trực tiếp từ hình ảnh (truyện tranh, banner, nút bấm dạng ảnh...).
*   **Cách dùng:**
    1. Bấm vào nút **OCR** (biểu tượng vùng chọn).
    2. Con trỏ chuột sẽ đổi thành hình chữ thập.
    3. Nhấn và kéo chuột để **khoanh vùng** chứa chữ Trung cần dịch trên màn hình.
    4. Thả chuột ra và đợi vài giây.
*   **Lưu ý:**
    *   Lần đầu tiên sử dụng, script sẽ cần tải bộ thư viện AI (khoảng ~15MB) nên sẽ hơi lâu. Các lần sau sẽ rất nhanh (offline).
    *   Kết quả dịch sẽ hiện đè ngay lên vị trí bạn vừa khoanh (Overlay). Bạn có thể bôi đen copy hoặc dùng nút Sửa Tên ngay trong ô đó.

---

## 3. Các Tính Năng Nổi Bật Khác

Để truy cập cài đặt đầy đủ, bạn có thể tìm menu lệnh của Tampermonkey -> tìm đến "TM Translate" -> chọn nút "Cài đặt".

### 📷 Hướng Dẫn Cấu Hình OCR (Tab Cài Đặt)
Trong bảng Cài đặt (Script Menu -> Cài đặt), tab **OCR** cung cấp các tùy chọn để tối ưu trải nghiệm dịch ảnh:

**1. Extension Hỗ Trợ (Khuyên Dùng)**
Script có khả năng kết nối với Extension hỗ trợ (nếu được cài đặt) để xử lý ảnh nhanh hơn và vượt qua các chặn tải (CORS) của trình duyệt.
*   Nếu có Extension, script sẽ ưu tiên dùng nó để tải ảnh và OCR.
*   Nếu không, script vẫn hoạt động tốt ở chế độ "Offline/Local".

**2. Quản Lý Model (Bộ Thư Viện AI)**
Chức năng OCR chạy hoàn toàn trên trình duyệt của bạn (không gửi ảnh đi server lạ), do đó cần tải bộ Model AI (~15MB) trong lần đầu tiên.
*   **Tự động:** Script sẽ tự tải khi bạn bấm nút OCR lần đầu.
*   **Lỗi tải:** Nếu mạng lag hoặc tải thất bại, hãy thử dùng lại nút OCR để script tự tải lại, hoặc tải lại trang và thử lại.
*   **Cài thủ công:** Nếu tự động không được, bạn có thể tải file `ch.zip` từ link dự phòng và dùng nút **"📂 Chọn file Zip Model để cài..."** trong cài đặt để nạp thủ công.

**3. Tinh Chỉnh Hiển Thị**
*   **Chế độ (Mode):**
    *   `Overlay` (Mặc định): Vẽ khung dịch đè lên ảnh. Phù hợp đọc truyện tranh.
    *   `Popup`: Hiện bảng kết quả riêng. Dùng khi ảnh quá phức tạp hoặc muốn copy text dễ dàng.
*   **Tỷ lệ cỡ chữ (Scale Factor):**
    *   Mặc định là `1.8`.
    *   Nếu chữ dịch bị **tràn ra ngoài** khung -> **Tăng** số này lên (ví dụ 2.2).
    *   Nếu chữ dịch **quá bé** -> **Giảm** số này xuống (ví dụ 1.4).


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
