# Hướng Dẫn Sử Dụng TM Translate (Userscript)

**TM Translate** là userscript chạy trên Tampermonkey/Violentmonkey, hỗ trợ:
- Dịch trang web Trung → Việt (đọc truyện convert).
- Quản lý **Name-set** (Edit Name) để thay tên chính xác.
- **Thư viện**: import TXT/EPUB, đọc truyện bằng giao diện riêng, cache dịch, export TXT/EPUB.
- **OCR**: dịch chữ trong ảnh (khoanh vùng hoặc dịch ảnh).

## 1. Cài Đặt

Nếu bạn chưa cài script, hãy nhấp vào link dưới để cài vào Tampermonkey/Violentmonkey:

👉 **[Cài đặt TM Translate.user.js](https://raw.githubusercontent.com/BaoBao666888/Novel-Downloader5/main/TM%20Translate.user.js)**

---

## 2. Nút Nổi Trên Trang (Floating Buttons)

Các nút nổi thường nằm ở góc dưới bên phải (có thể bật/tắt trong Cài đặt).

### 🟢 Dịch Trang (Màu Xanh Lá)
*   **Chức năng:** Dịch toàn bộ trang hiện tại sang tiếng Việt.
*   **Tự động dịch khi cuộn:** Nếu bật trong Cài đặt, khi cuộn sẽ dịch phần nội dung mới xuất hiện.

### 🟩 Thư viện (Màu Xanh Ngọc)
*   **Chức năng:** Mở Thư viện để import, đọc, export truyện.
*   **Ghi chú:** Mặc định bật. Có thể tắt trong Cài đặt → tab **Thư viện**.

### 🔵 Edit Name (Màu Xanh Dương - Hình Bút Chì)
*   **Chức năng:** Thêm/Sửa/Xóa một cặp **Trung → Việt** trong **Name-set** đang dùng.
*   **Cách dùng (trang đã dịch):**
    1. Bôi đen đúng đoạn đã được script bọc (thường là đoạn đã dịch/hightlight).
    2. Bấm nút **Bút chì** để mở hộp Edit Name.
*   **Cách dùng (UI đọc truyện):**
    * Bôi đen đoạn trong khu nội dung → sẽ hiện nút **Sửa tên** nhỏ, bấm để mở Edit Name.
    * Hoặc bấm trực tiếp vào tên đã được tô highlight.

### 🔘 Dịch Nhanh (Màu Xám)
*   **Chức năng:** Mở bảng dịch nhanh để dán text và dịch nhanh (không cần dịch cả trang).

### 📷 OCR (Màu Teal)
*   **Chức năng:** Dịch chữ trong ảnh.
*   **Cách dùng nhanh:** Bấm nút OCR → chọn chế độ (khoanh vùng / dịch ảnh) trong tab OCR → làm theo hướng dẫn bên dưới.

### ⚫ Style (Màu Tối)
*   **Chức năng:** Tùy chỉnh giao diện **Chế độ đọc rút gọn (Simplified View)**.
*   **Ghi chú:** Giao diện đọc truyện trong **Thư viện** có phần cài riêng (tab Thư viện).

### 🟡 Quay Về (Restore)
*   **Chức năng:** Quay lại trang gốc (chưa dịch).
*   **Lưu ý:** Khi đang ở UI đọc truyện (Thư viện), thoát reader sẽ **reload lại trang**.

---

## 3. Thư Viện (Library) & UI Đọc Truyện (Reader)

### 3.1 Mở Thư viện
Bạn có thể mở Thư viện bằng:
- Nút nổi **Thư viện** trên trang.
- Tampermonkey menu → **Thư viện (Beta)**.

Trong Thư viện sẽ có:
- Danh sách truyện + **tiến độ đọc** (Chương X/Y + %).
- Nút: **Mở**, **Xuất TXT**, **Xuất EPUB**, **Xóa**.
- Nút **Import** (import TXT/EPUB).
- Nút **Xóa cache dịch** (xóa toàn bộ cache bản dịch, có hiện dung lượng).

### 3.2 Import TXT/EPUB
Khi import, bạn chọn ngôn ngữ nguồn:
- **Trung (zh):** Reader có 2 chế độ **RAW / DỊCH**, có cache dịch, có prefetch.
- **Việt (vi):** Reader chỉ đọc (không dịch), ẩn nút RAW/DỊCH.

**TXT**
- Nếu file có tiêu đề kiểu `Chương/Chapter/卷/第xx章` → tách theo tiêu đề.
- Nếu không có tiêu đề → tách theo xuống dòng (ưu tiên chỗ có **2 dòng trống**).
- Có cơ chế **gộp chương quá ngắn**, và **cắt chương quá dài** để tránh lag.

**EPUB**
- Đọc theo spine/TOC của EPUB, trích text từ XHTML/HTML bên trong.

### 3.3 UI Đọc Truyện (Reader)
Khi bấm **Mở**, script chuyển sang giao diện reader:
- Script sẽ vào **chế độ đọc sạch** (dừng trang gốc, loại phần thừa/quảng cáo).
- Khi thoát reader (nút ×) sẽ **reload lại trang**.

Thanh điều khiển trong reader:
- **RAW / DỊCH:** đổi nội dung chương (nếu truyện nguồn zh).
- **Fullscreen:** bật/tắt fullscreen (không lưu). Khi bật sẽ có thông báo “Nhấn ESC để thoát”.
- **Cài đặt:** mở Cài đặt và nhảy thẳng tab **Thư viện**.
- **Mục lục:** bật/tắt TOC bên trái.

**Cache + dịch trong reader**
- Khi mở chương: ưu tiên lấy cache trước, thiếu cache mới gọi server.
- Khi đang dịch sẽ hiện **“Đang dịch…”** trong nội dung, tránh hiểu lầm UI bị treo.
- Có **prefetch** chương sau khi đọc tới % cấu hình.

**Tiến độ đọc**
- Script tự lưu **chương đang đọc + vị trí cuộn** để lần sau mở truyện sẽ quay đúng chỗ.

### 3.4 Xuất TXT/EPUB
- Xuất sẽ dùng cache dịch (và Name-set hiện tại).
- Nếu thiếu cache dịch: script sẽ hỏi có muốn dịch & cache trước khi xuất không, và có hiện tiến độ.
- Quy trình đóng gói EPUB có thể lâu → script sẽ hiện thông báo “Đang xuất EPUB…”.

---

## 4. OCR (Dịch Ảnh)
OCR chạy trên trình duyệt của bạn (không gửi ảnh lên server lạ), nhưng lần đầu cần tải model.

### 4.1 Cách dùng
Trong Cài đặt → tab **OCR** bạn có thể chọn:
- **Chế độ hành động (Action Mode):**
  - **Khoanh vùng (Crop):** kéo chọn vùng chữ trên màn hình để OCR & dịch.
  - **Dịch ảnh (Image Trans):** dịch ảnh toàn màn hình hoặc ảnh nhập.
- **Nguồn ảnh (Source):**
  - **Screen:** toàn màn hình.
  - **Import:** nhập ảnh (file/URL).
- **Kiểu hiển thị kết quả (Display):** `Overlay` hoặc `Popup` (một số tổ hợp sẽ bị khóa tự động để đúng ngữ cảnh).

Trong kết quả OCR:
- Có thể bôi đen để copy.
- Có thể click tên đã highlight để **Edit Name**.

### 4.2 Extension Helper + Quản lý Model
Tab OCR có phần hiển thị trạng thái:
- Extension hỗ trợ (nếu cài) giúp OCR nhanh hơn và giảm lỗi CORS.
- Model OCR sẽ tự tải lần đầu. Nếu lỗi, có thể:
  - Thử lại.
  - Hoặc cài thủ công bằng nút **“📂 Chọn file Zip Model để cài…”**.
  - Có nút **Xóa Cache Model & WASM** để tải lại từ đầu khi cần.

---

## 5. Cài Đặt Quan Trọng
Bạn mở Cài đặt bằng Tampermonkey menu → **Cài đặt** (hoặc bấm **Cài đặt** trong reader).

### 5.1 Tab Thư viện
- Hiển thị nút “Thư viện” trên trang.
- Prefetch chương sau khi đọc đến (%).
- Kiểu đọc: **Cuộn dọc liên tục** / Theo chương.
- Giao diện đọc: font, cỡ chữ, giãn dòng, màu nền, màu chữ, **lề ngang**, **căn lề**.
- Nút **Mặc định** để reset toàn bộ cài của tab Thư viện.

### 5.2 Tab Nâng cao
- Chọn provider dịch (dichngay / dichnhanh) + endpoint.
- Delay giữa các request (ms).
- Max ký tự / request.
- **Số lần retry khi lỗi** (mặc định 3). Retry theo từng batch (không retry cả chương).

---

## 6. Tính Năng Khác

### 6.1 Chế độ đọc rút gọn (Simplified View)
- Mục đích: ẩn quảng cáo/khối thừa của web gốc, chỉ giữ lại nội dung đọc.
- Bật/Tắt trong Cài đặt → tab **Chung** → “Chế độ đọc rút gọn”.
- Có thể bật “Chặn JavaScript” để hạn chế popup/quảng cáo chạy ngầm.
- Khi đã vào Simplified View sẽ có nút **Style** để chỉnh giao diện nhanh.

### 6.2 Quản lý Name-set (Bộ Tên)
Trong Cài đặt → tab **Bộ Tên**:
- Tạo/Xóa bộ name, chọn bộ đang hoạt động.
- Nhập từ file (`.json` / `.txt` dạng `Trung=Việt`), xuất ra JSON/TXT.
- Thêm/Sửa nhanh nhiều dòng (mỗi dòng `Trung=Việt`).

### 6.3 Dịch Local (Offline) + Từ điển Local
- Tab **Chung** có “Chế độ dịch”: `Server` hoặc `Local` (dịch offline, nhanh).
- Khi dùng Local lần đầu có thể cần tải từ điển.
- Tab **Từ điển Local** cho phép tìm/đổi/xóa mục trong cache từ điển Local và khôi phục từ điển gốc.

### 6.4 Blacklist (Chặn theo tên miền)
- Tab **Blacklist**: thêm domain để script không hiện nút dịch và không tự động dịch trên domain đó.
- Vẫn có thể mở Cài đặt từ menu Tampermonkey để chỉnh lại.

### 6.5 Hỗ trợ Fanqie (Cà Chua)
- Script có tích hợp giải mã font đặc biệt của Fanqie để đọc đúng nội dung bị mã hoá.

---

## 7. Ghi chú & Xử Lý Lỗi
- Edit Name (Sửa Tên) cần bọc text trong `<span>` để map “gốc ↔ dịch”, có thể gây lỗi hiển thị ở một số web. Nếu web bị vỡ giao diện, hãy tắt trong tab **Chung**.
- Nếu thấy chậm/lag khi dịch: giảm `maxCharsPerRequest`, tăng `delayMs`, hoặc tăng `retry` hợp lý.
