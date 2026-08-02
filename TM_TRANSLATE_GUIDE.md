# Hướng Dẫn Sử Dụng TM Translate (Userscript)

> Tài liệu này được cập nhật cho **TM Translate v3.5.5.14_beta**.

**TM Translate** là userscript chạy trên Tampermonkey/Violentmonkey, hỗ trợ:

- Dịch trang web Trung → Việt (đọc truyện convert).
- Quản lý **Name-set** (Edit Name) để thay tên chính xác.
- **Thư viện**: import TXT/EPUB/ZIP/Word/HTML, chỉnh sửa truyện, đọc và cache bản dịch, quản lý bìa/Name riêng, tìm kiếm, xuất sách và sao lưu/khôi phục.
- **OCR**: dịch chữ trong ảnh (khoanh vùng hoặc dịch ảnh).
- **TTS**: phát đoạn chọn trong reader, chọn nguồn Browser/TikTok/Google/Gemini/Bing/Zalo và chỉnh đầy đủ tham số trong Cài đặt.

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

*   **Chức năng:** Mở Thư viện toàn màn hình để import, đọc, tìm kiếm, chỉnh sửa, xuất và sao lưu/khôi phục truyện.
*   **Ghi chú:** Mặc định bật. Có thể tắt trong Cài đặt → tab **Thư viện**.

### 🔵 Edit Name (Màu Xanh Dương - Hình Bút Chì)

- **Chức năng:** Thêm/Sửa/Xóa một cặp **Trung → Việt** trong Bộ Name.
- **Trên trang web:** bật Edit Name, bôi đen phần đã dịch rồi bấm nút **Bút chì** màu xanh dương. Khi tắt Edit Name, script không tạo thêm `span`/`title` để tránh ảnh hưởng cấu trúc trang.
- **Trong Reader:** bôi đen nội dung để hiện thanh **Phát / Sửa tên hoặc Thay thế từ / Xóa rác / Sao chép**. Truyện Trung RAW+DỊCH dùng **Sửa tên**; truyện chỉ RAW dùng **Thay thế từ**. Các name trên trang có thể bấm trực tiếp để mở Edit Name.
- Name mới trong Reader mặc định lưu vào **Name Riêng — chỉ truyện này**. Hộp Edit Name cho phép chuyển sang một trong các **Name Chung đang áp dụng** nếu muốn dùng cho nhiều truyện.
- **Dự đoán cụm Trung/Việt beta** tự bật cùng Edit Name và có thể tắt ngay trong hộp Edit Name. Chế độ này dùng dấu câu, Name đã áp dụng và âm Hán Việt làm mốc để thu gọn cụm. Đang thử nghiệm nên có thể có lỗi xảy ra, hãy báo cáo nếu bạn gặp lỗi liên quan.
- Khi tắt beta, script dùng cách cũ: lấy nguyên khối Trung và **toàn bộ phần Việt tương ứng**.
- Hộp Edit Name không tự đóng khi bấm ra ngoài. Nếu đang sửa dở, nút đóng/quay lại sẽ hỏi xác nhận trước khi bỏ thay đổi.

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

- Danh sách truyện dạng grid toàn màn hình + **tiến độ đọc** (Chương X/Y + %). Truyện mới import và truyện vừa đọc được đưa lên đầu.
- Tên truyện dài chạy vòng một chiều trong thẻ, không kéo giãn làm lệch grid.
- EPUB có bìa nhúng sẽ tự dùng bìa đó. Truyện không có ảnh dùng bìa mặc định SVG; có thể thay bìa trong **Chỉnh sửa**.
- Tìm kiếm theo **tên truyện / tác giả gốc / tác giả đã dịch / RAW Trung / cache dịch**. Mặc định chọn tất cả phạm vi.
- Lazy load/phân trang khi cuộn để tránh lag khi có nhiều truyện; có hiển thị tổng số truyện và dung lượng kho nén.
- Mỗi thẻ ghi rõ nơi lưu: **TM** (Tampermonkey) hoặc **Máy · domain** (IndexedDB/OPFS của website đã import).
- Nút: **Mở**, **Chỉnh sửa**, **Xuất file...**, **Xóa**.
- Nút **Import** nhận TXT, EPUB, ZIP, Word và HTML.
- Nút **Xóa cache dịch** (xóa toàn bộ cache bản dịch, có hiện dung lượng).
- **Sao lưu / Khôi phục** dùng file `.tmbackup.jsonl`: bấm **Sao lưu** để tải file, hoặc **Khôi phục** để chọn file đó nhập lại. File gồm index, RAW, cache và bìa. Khi dữ liệu thay đổi, script có thể tự sao lưu theo chu kỳ trong tab **Thư viện** (mặc định 6 giờ sau lần sao lưu trước).

Từ v3.5.5.14_beta, danh sách chương, RAW và cache dịch được nén gzip ngay trong GM storage; bìa nằm ở key riêng. Lần chạy đầu sau update sẽ hiện tiến độ thu gọn dữ liệu cũ. Script giữ nguyên key và tự giải nén khi đọc/import/export nên không cần xóa truyện hay cài lại.

Script đo dung lượng GM storage sau nén và chừa khoảng an toàn trước giới hạn message 64 MiB của Tampermonkey: Thư viện cảnh báo từ khoảng 36 MiB, tự xóa cache dịch khi chạm khoảng 42 MiB, và không ghi thêm RAW/bìa nếu dự kiến vượt 50 MiB. Import được kiểm tra trọn bộ trước khi ghi nên thiếu chỗ sẽ báo ngay, không để lại nửa bộ truyện. Ảnh bìa lớn, kể cả bìa EPUB, được tự giảm tối đa 720×1080 bằng WebP/JPEG khi bản tối ưu nhỏ hơn ảnh gốc.

Khi import, mục **Nơi lưu nội dung truyện** có hai lựa chọn và luôn giải thích bất cập ngay bên dưới:

- **Tampermonkey — dùng chung mọi domain:** mở/đọc/sửa được ở mọi website, nhưng toàn bộ dữ liệu nằm trong kho Tampermonkey và phải tuân theo vùng an toàn 50 MiB nói trên.
- **Thiết bị này — IndexedDB/OPFS theo domain:** danh sách chương và bìa nằm trong IndexedDB; RAW/cache dịch ưu tiên OPFS, tự fallback sang IndexedDB nếu trình duyệt không hỗ trợ OPFS. Dung lượng thường lớn hơn nhiều nhưng **không vô hạn**: quota do trình duyệt cấp dựa trên ổ đĩa, profile và origin. Script xin persistent storage theo khả năng trình duyệt; dữ liệu vẫn có thể mất khi xóa dữ liệu website/profile, dùng chế độ riêng tư, đổi trình duyệt/máy hoặc khi trình duyệt thu hồi kho không-persistent.

Index nhẹ của Thư viện vẫn được lưu trong Tampermonkey, vì vậy truyện local vẫn hiện ở website khác; index này cũng nằm trong bộ đo/chặn 50 MiB để số lượng file cực lớn không làm Tampermonkey vượt 64 MiB. Nếu bấm **Mở/Thông tin/Chỉnh sửa/BN/Xuất/Xóa** từ sai domain, script ghi một yêu cầu mở nhanh, mở tab đúng domain đã import rồi tự tiếp tục thao tác. Nếu domain đó không còn truy cập được, dữ liệu local của origin ấy cũng không thể đọc trực tiếp; khi đó cần đưa domain hoạt động lại hoặc import/khôi phục truyện sang origin khác.

Dung lượng local hiển thị ở đầu Thư viện là ước lượng **toàn bộ storage của domain**, không chỉ riêng TM Translate. Backup tại một tab gồm dữ liệu GM và các truyện local của đúng domain hiện tại; truyện local thuộc domain khác được liệt kê là bỏ qua và có cảnh báo. Muốn backup đầy đủ, hãy mở từng domain đang giữ truyện rồi sao lưu. Khi khôi phục một truyện local, dữ liệu được đặt vào local storage của domain đang mở.

### 3.2 Import TXT/EPUB/ZIP/Word/HTML

Khi import, bạn chọn ngôn ngữ nguồn:

- **Trung (zh):** Reader có 2 chế độ **RAW / DỊCH**, có cache dịch, có prefetch.
- **Việt (vi):** Reader chỉ đọc (không dịch), ẩn nút RAW/DỊCH.

Các định dạng được hỗ trợ:

- **TXT:** tự nhận tiêu đề kiểu `Chương/Chapter/卷/第xx章`; nếu không có tiêu đề thì ưu tiên tách ở chỗ có hai dòng trống. Script có thể gộp chương quá ngắn và cắt chương quá dài.
- **EPUB:** đọc theo spine/TOC, lấy metadata và tự dùng ảnh bìa nhúng nếu có.
- **ZIP:** đọc các file TXT/EPUB/ZIP/DOCX/DOC/ODT/RTF/HTML bên trong theo thứ tự tự nhiên; hỗ trợ ZIP lồng tối đa hai cấp.
- **DOCX, DOC, ODT, RTF, HTML/HTM:** trích nội dung và đưa qua cùng quy trình chia/chỉnh chương. DOC đời cũ được đọc theo khả năng của trình duyệt nên file quá đặc biệt có thể cần đổi sang DOCX trước.

Với file lớn, popup hiện skeleton, tên file, dung lượng và trạng thái ngay trước khi xử lý. Giải nén/chia chương chạy nền khi trình duyệt hỗ trợ; EPUB nhiều chương sẽ nhường khung hình định kỳ để giao diện vẫn phản hồi. Nếu đóng hoặc rời trang khi tác vụ/bản nháp chưa xong, script sẽ cảnh báo trước.

Với lựa chọn Tampermonkey, trước lúc lưu script ước lượng dữ liệu đã nén của toàn bộ bản import. Nếu vượt vùng an toàn, cache dịch được dọn trước; nếu vẫn không đủ chỗ, import bị hủy nguyên vẹn và popup hiện lý do để bạn sao lưu/xóa bớt truyện rồi thử lại. Với lựa chọn Thiết bị, trình duyệt quyết định quota; lỗi hết quota được báo và bản import local đang ghi được dọn lại.

Mặc định tùy chọn **Tùy chỉnh trước khi nhập** được bật:

1. Script đọc file thành bản nháp rồi mở giao diện chỉnh sửa.
2. Bạn có thể sửa thông tin sách, nội dung chương, thêm/xóa chương hoặc chia lại chương.
3. Chỉ khi bấm **Nhập vào thư viện** dữ liệu mới được lưu. Bấm **Bỏ import** sẽ không tạo truyện.

Nếu bỏ chọn **Tùy chỉnh trước khi nhập**, script tự đặt thông tin và nhập ngay như cách cũ. Popup không tự đóng khi bấm ra ngoài; nếu đã thay đổi dữ liệu, script hỏi xác nhận trước khi thoát.

### 3.3 Trang Thông tin và Chỉnh sửa truyện

**Trang Thông tin**

- Truyện chưa đọc sẽ mở trang Thông tin; truyện đã đọc tiếp tục ở vị trí Reader gần nhất.
- Trang này có bìa, tên truyện, tác giả Hán Việt, mô tả, link bổ sung, mục lục, **Đọc ngay/Đọc tiếp** và nút **BN**.
- Từ Reader có nút **Thông tin** để quay lại trang này.

**Chỉnh sửa truyện**

- Sửa dữ liệu gốc gồm **tên truyện, tác giả, mô tả/văn án, bìa và link bổ sung**.
- Chọn lại **RAW/Việt**. Nếu là RAW, dữ liệu gốc vừa sửa sẽ được dịch lại; đây không phải thao tác sửa cache dịch.
- Tác giả tiếng Trung được đổi sang Hán Việt và viết hoa. Đoạn Latin dính chữ Hán sẽ được tách khoảng trắng, ví dụ `alpha他` → `Alpha Tha`.
- Sửa tiêu đề và RAW từng chương; thêm, xóa hoặc sắp xếp lại chương.
- **Chia lại chương** bằng regex riêng, có xem trước chi tiết và giới hạn số ký tự tối đa để tránh cắt chương lung tung.
- Văn án, tên truyện, tiêu đề chương và nội dung dịch đều áp dụng các Bộ Name đang chọn.
- Popup chỉ đóng bằng nút **Đóng/Bỏ**; nếu đang sửa dở sẽ hỏi xác nhận trước khi thoát.

### 3.4 UI Đọc Truyện (Reader)

Khi bấm **Mở**, script chuyển sang giao diện reader:

- Script sẽ vào **chế độ đọc sạch** (dừng trang gốc, loại phần thừa/quảng cáo).
- Khi thoát reader (nút ×) sẽ **reload lại trang**.

Thanh điều khiển trong reader:

- **RAW / DỊCH:** đổi nội dung chương (nếu truyện nguồn zh).
- **Thông tin:** quay về trang thông tin sách.
- **BN:** chọn Bộ Name Chung và quản lý Name Riêng của truyện.
- **Fullscreen:** bật/tắt fullscreen (không lưu). Khi bật sẽ có thông báo “Nhấn ESC để thoát”.
- **Cài đặt:** mở Cài đặt và nhảy thẳng tab **Thư viện**.
- **TTS:** mở Cài đặt và nhảy thẳng tab **TTS**.
- **Mục lục:** bật/tắt TOC bên trái.

**Thanh thao tác khi bôi đen text**

- Trên mobile, reader ẩn menu chọn text mặc định của máy như Copy/Share/Select all, chỉ hiện thanh thao tác của TM Translate.
- **Phát:** mở mini-player TTS và đọc từ vị trí bôi đen tới hết chương. Nếu bật **Tự qua đoạn/chương** + **Tự đọc chương kế**, TTS sẽ tự sang chương tiếp.
- Mini-player TTS có đĩa quay, nút **Tạm dừng/Phát**, **Tiếp**, **Dừng**, countdown hẹn giờ ngủ và highlight đoạn đang đọc. Nếu bật tự cuộn, reader sẽ cuộn theo đoạn đang phát.
- Khi tới cuối chương mà chưa bật đủ **Tự qua đoạn/chương** + **Tự đọc chương kế**, TTS sẽ phát thông báo nhắc bật hai tùy chọn này rồi dừng; khi hết truyện sẽ phát thông báo đã tới cuối truyện.
- TTS ưu tiên ngắt text ở dấu câu/xuống dòng gần nhất, prefetch trước các đoạn kế tiếp, và phát audio giữ media âm lượng rất thấp khi phải chờ remote audio.
- **Sửa tên:** chỉ dùng với truyện Trung có RAW+DỊCH, chọn ở RAW hay DỊCH đều được.
- **Thay thế từ:** dùng cho truyện chỉ RAW, thay đoạn chọn bằng từ user nhập.
- **Xóa rác:** sửa/xóa đoạn raw trước khi dịch; luôn có popup xác nhận và tùy chọn không phân biệt hoa thường.
- **Sao chép:** copy đoạn chọn.

**Cache + dịch trong reader**

- Khi mở chương: ưu tiên lấy cache trước, thiếu cache mới gọi server.
- Khi đang dịch sẽ hiện **“Đang dịch…”** trong nội dung, tránh hiểu lầm UI bị treo.
- Có **prefetch** chương sau khi đọc tới % cấu hình.
- Khi thêm/sửa/xóa Name, Reader ưu tiên dịch lại và vá đúng những đoạn bị ảnh hưởng, giữ nguyên vị trí cuộn và các đoạn không liên quan. Nếu bạn tự cuộn trong lúc đang vá nhiều đoạn, script tôn trọng vị trí mới và không kéo ngược lại. Chỉ khi cache lỗi/không còn ghép được an toàn mới tải lại cả chương.
- Cuộn và cập nhật tiến độ được gom theo khung hình; lưu tiến độ và prefetch được hoãn tới khi cuộn nghỉ để không cắt quán tính trên phone.

**Tiến độ đọc**

- Script tự lưu **chương đang đọc + vị trí cuộn** để lần sau mở truyện sẽ quay đúng chỗ.

### 3.5 Xuất TXT/EPUB/HTML

- Bấm **Xuất file...** rồi chọn định dạng, phạm vi **Toàn bộ / Chương đang đọc / Từ chương đang đọc / Khoảng tùy chọn**.
- Với truyện RAW, **Dịch khi xuất** được bật mặc định; có thể tắt để xuất nguyên văn. Với EPUB, có thể chọn chuẩn **EPUB 2** hoặc **EPUB 3**.
- Xuất dùng cache dịch và đúng Bộ Name hiệu lực của truyện theo ưu tiên **Name Riêng > Name Chung**. Script cũng sửa lại cách viết hoa Name trong cache cũ theo RAW, nên Name sau dấu nháy không bị hạ chữ đầu.
- Nếu thiếu cache và bật Dịch khi xuất, script tự dịch/cache phần còn thiếu và hiện tiến độ.
- Khi dịch lúc xuất, khoảng cách giữa hai request tối thiểu 800 ms nếu cài đặt hiện tại thấp hơn. Retry sẽ tăng delay dần có giới hạn sau mỗi lỗi; request thành công kế tiếp trở về delay xuất mặc định.
- Quy trình đóng gói EPUB có thể lâu → script sẽ hiện thông báo “Đang xuất EPUB…”.
- **TXT** ghi thông tin sách trước, sau đó mới tới các chương:

  ```text
  Tên sách: ...
  Tác giả: ...
  Mô tả: ...

  Tên chương 1
  Nội dung chương 1

  Tên chương 2
  Nội dung chương 2
  ```

- **EPUB** dùng bìa đã chỉnh/bìa nhúng từ EPUB gốc và có thêm trang Thông tin sách.
- **HTML** mở ở trang Thông tin nằm ngoài mục lục, gồm metadata, mô tả, link bổ sung và mục lục. Bấm chương hoặc **Đọc ngay/Đọc tiếp** để vào Reader; trong Reader có nút quay lại Thông tin.
- Popup tự đề xuất: truyện nhỏ/vừa dùng **HTML**, truyện lớn dùng **EPUB** vì HTML nhúng toàn bộ data nên dễ lag khi mở/xem.

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
- Có thể bấm vào Name đã được script đánh dấu trong HTML để **Edit Name**; Name không được tô màu riêng.

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
- Chu kỳ tự sao lưu khi thư viện thay đổi, mặc định 6 giờ sau lần sao lưu trước.
- Kiểu đọc: **Cuộn dọc liên tục** / Theo chương.
- Giao diện đọc: font, cỡ chữ, giãn dòng, màu nền, màu chữ, **lề ngang**, **căn lề**.
- Nút **Mặc định** để reset toàn bộ cài của tab Thư viện.
- Trên điện thoại, popup Cài đặt tự chuyển sang toàn màn hình, tab cuộn ngang và các hàng công cụ/nút được xếp lại để không mất nội dung.

### 5.2 Tab TTS
- Chọn nguồn **Browser / TikTok / Google / Gemini / Bing / Zalo** và giọng đọc tương ứng.
- TikTok có popup nhập cookie; Zalo có popup nhập một hoặc nhiều API key. Cookie/API key được lưu ngay khi bấm **Lưu** trong popup.
- Gemini cần đăng nhập `gemini.google.com`; Bing có thể cần mở `bing.com/translator` một lần nếu lỗi token.
- Chỉnh **tốc độ**, **cao độ**, **âm lượng**, **ký tự tối đa mỗi đoạn**, **delay giữa đoạn** và **hẹn giờ ngủ**. Hẹn giờ ngủ chỉ chạy khi bật checkbox và sẽ giảm âm lượng dần vài giây trước khi dừng.
- **Tự cuộn** sẽ highlight/cuộn theo đoạn đang đọc trong reader; **Tự qua đoạn/chương** + **Tự đọc chương kế** cho phép phát tiếp sang chương sau.
- Remote TTS có **prefetch audio**, **timeout**, **retry** và **giãn request**. Prefetch dùng ngưỡng an toàn riêng để tránh gọi quá dồn: timeout tối đa 16s, retry tối đa 1, request gap tối thiểu 320ms.
- Khi remote audio chưa sẵn sàng, script phát audio giữ media ở âm lượng rất thấp rồi tắt ngay khi audio thật bắt đầu.
- Có **thay thế từ khi đọc**: mỗi dòng dùng `từ gốc => từ đọc`.
- Có nút **Thử giọng**, **Dừng phát**, **Xóa cache audio**, **Mặc định**.

### 5.3 Tab Nâng cao
- Chọn provider dịch (dichngay / dichnhanh) + endpoint.
- Delay giữa các request (ms).
- Max ký tự / request.
- **Số lần retry khi lỗi** (mặc định 3). Retry áp dụng cả batch lẫn đoạn đơn; sau mỗi lỗi delay tăng dần có giới hạn. Khi xuất, delay hiệu lực luôn ít nhất 800 ms.

---

## 6. Tính Năng Khác

### 6.1 Chế độ đọc rút gọn (Simplified View)
- Mục đích: ẩn quảng cáo/khối thừa của web gốc, chỉ giữ lại nội dung đọc.
- Bật/Tắt trong Cài đặt → tab **Chung** → “Chế độ đọc rút gọn”.
- Có thể bật “Chặn JavaScript” để hạn chế popup/quảng cáo chạy ngầm.
- Khi đã vào Simplified View sẽ có nút **Style** để chỉnh giao diện nhanh.

### 6.2 Quản lý Name-set (Bộ Tên)

Trong Cài đặt → tab **Bộ Tên**:

- Tạo/Xóa Bộ Name Chung, chọn bộ đang hoạt động.
- Nhập từ file (`.json` / `.txt` dạng `Trung=Việt`), xuất ra JSON/TXT.
- Thêm/Sửa nhanh nhiều dòng (mỗi dòng `Trung=Việt`).

Trong mỗi truyện:

- Nút **BN** có ở cả trang Thông tin và Reader.
- Có thể áp dụng đồng thời nhiều Bộ Name Chung và một **Name Riêng** chỉ thuộc truyện đó.
- Name Riêng được ưu tiên hơn Name Chung khi cùng khớp một cụm.
- Name Riêng hỗ trợ nhập file, nhập text, thêm, sửa, xóa và xuất ngay trong truyện.
- Khi xóa truyện, Name Riêng của truyện cũng bị xóa; các Bộ Name Chung không bị ảnh hưởng.
- Edit Name trong Reader mặc định ghi vào Name Riêng. Nếu chọn Chung, bạn chọn chính xác Bộ Name Chung đang áp dụng để lưu.

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

- Nếu Tampermonkey đã báo `Message exceeded maximum allowed size of 64MiB` trước khi bản mới kịp chạy: đóng bớt tab, mở **Dashboard Tampermonkey → Settings**, đổi **Config mode** thành **Advanced**, chọn **Content Script API → UserScripts API Dynamic**, rồi tải lại đúng một tab web và chờ hộp **Đang thu gọn dữ liệu TM Translate** chạy xong. Sau đó có thể đổi Content Script API về lựa chọn cũ. Không xóa script/storage trong lúc cứu dữ liệu.
- Nếu không thấy mục **UserScripts API Dynamic**, hãy cập nhật Tampermonkey và bật quyền chạy userscript/Developer mode mà Chrome yêu cầu, rồi mở lại Settings.
- Chỉ khi **Edit Name đang bật**, script mới bọc phần dịch cần thiết để map “gốc ↔ dịch”. Khi tắt Edit Name, script dịch trực tiếp text node/link và không thêm `span` hay `title`.
- Name-set chỉ thay theo cặp **Trung → Việt**, không thay Việt → Việt để tránh lỗi khớp lố trong bản dịch.
- Nếu thấy chậm/lag khi dịch: giảm `maxCharsPerRequest`, tăng `delayMs`, hoặc tăng `retry` hợp lý.
- Nếu Reader phải tải lại cả chương sau khi sửa Name, cache của chương có thể đã cũ hoặc không còn đủ dữ liệu để vá an toàn; mở lại chương để script tạo cache mới rồi thử lại.
- TTS trong TM dùng chung logic với TTS Reader; xem thêm [hướng dẫn TTS Reader](https://github.com/BaoBao666888/Novel-Downloader5/blob/main/tools/HUONG_DAN_SU_DUNG_TTS_READER.md).

---

## 8. Thay đổi đáng chú ý trong 3.5.5.14_beta

- Nén gzip danh sách chương, RAW và cache dịch trong GM storage; dữ liệu được giải nén trong suốt khi sử dụng.
- Thêm migration một lần có tiến độ và cảnh báo đóng tab, giữ nguyên dữ liệu của bản cũ.
- Thêm `@noframes` để Tampermonkey không inject lặp TM Translate cùng storage vào iframe.
- Bổ sung hướng dẫn cứu storage đã vượt 64 MiB qua **UserScripts API Dynamic**, không cần xóa/cài lại script.
- Hiển thị dung lượng kho nén; tự dọn cache dịch ở 42 MiB và chặn ghi thêm dữ liệu thư viện trước vùng nguy hiểm ở 50 MiB.
- Kiểm tra đủ chỗ cho toàn bộ truyện trước khi import, đồng thời tự thu nhỏ bìa lớn/bìa EPUB nếu có lợi.
- Cho chọn nơi lưu khi import: kho Tampermonkey dùng chung mọi domain, hoặc kho thiết bị dùng OPFS/IndexedDB theo domain với quota lớn hơn.
- Giữ index nhẹ trong Tampermonkey; truyện local được gắn domain, bấm từ domain khác sẽ mở tab đúng nơi lưu và tự tiếp tục vào Reader/Thông tin/Chỉnh sửa/BN/Xuất/Xóa.
- Hiển thị rõ giới hạn của từng nơi lưu, quota local của origin và cảnh báo backup không thể lấy truyện local đang nằm ở domain khác.
