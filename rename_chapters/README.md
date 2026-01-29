# Rename Chapters + Auto Volume/Chapter Uploader

Tài liệu nhanh cho app đổi tên/chia file và userscript upload chương lên Wikidich/Web hồng.

## 1) Cài đặt app (Rename Chapters)

Khuyến nghị: cài bản setup chính thức để đầy đủ tính năng (fanqie_bridge và một số phần bảo mật chỉ có trong bản setup).

- Vào trang release: [Releases](https://github.com/BaoBao666888/Novel-Downloader5/releases)
- Tải file `Rename-Chapters-setup.exe`
- Cài đặt và chạy app từ shortcut

## 2) Hướng dẫn nhanh app 

(Vào app, chọn `Trợ giúp`, chọn `Hướng dẫn thao tác` để xem hướng dẫn chi tiết)

### Tab Đổi Tên
- Chọn thư mục chứa file `.txt` → app tự quét và phân tích.
- "Cấu trúc mới" dùng `{num}`, `{title}` (có thể `{num+1}` / `{num-1}`).
- Regex tên file/nội dung có lịch sử.
- Double‑click 1 dòng trong bảng để xem nội dung và đổi tên thủ công.

### Tab Xử lý Văn bản
- **Tìm & Thay thế**: hỗ trợ Regex, nhóm `$1`, `$2`..., có lịch sử + ghim.
- **Chia file**: regex phải khớp cả dòng; chọn “Chia sau/trước regex”.
- **Công cụ nhanh**:
  - Đánh lại số chương: Regex tìm chương + mẫu `{num}`.
  - Thêm tiêu đề từ Mục lục: regex mục lục có **1 nhóm bắt** để lấy tag chương.

### Tab Wikidich / Web hồng
- **Tải Works / Chi tiết**: Tải toàn bộ work của bạn hoặc của user bất kỳ (cần cookie nếu có là work của bạn).
- **Kiểm tra cập nhật**: Tự động kiểm tra chương mới cho danh sách truyện hiện tại, hỗ trợ kiểm tra các trang trong Lấy Tiêu Đề Online.
- **DS Chương**: Tải danh sách chương, xem/sửa nội dung (nếu profile hiện tại có cookie), cập nhật số chương và link chi tiết.
- **Chỉnh sửa**: Cho phép bổ sung file vào truyện nào đó, chức năng gần như script Auto Volume Chapter Uploader.
- **Lọc**: Hỗ trợ lọc cơ bản/nâng cao (thể loại, số chương, tình trạng, tác giả, tên truyện, liên kết bổ sung, ngày cập nhật,...).
- **Auto update**: Tự động tải chương mới cho truyện đang chọn (hiện chỉ hỗ trợ bridge Fanqie).
- **Ghi chú/Liên kết**: Tự động quản lý ghi chú và liên kết thư mục truyện.

### Tab Diễn đàn
- **Đồng bộ**:
  - **Lấy data forum**: Tải dữ liệu cơ sở (bắt buộc làm lần đầu để mở khóa tính năng khác).
  - **Đồng bộ chuyên khu**: Chọn cụ thể các khu vực muốn tải về. (Bạn cần có quyền truy cập.)
  - **Đồng bộ gần đây**: Cập nhật bài viết mới cho các chủ đề đã có (nhanh).
- **Tra cứu**: Tìm kiếm theo từ khóa, user, ngày tháng; xem offline tốc độ cao.
- **Lưu ý**: Mặc định delay 2s để an toàn cho kết nối.

### Các tab khác
- **Thêm Credit**: chèn 1 dòng vào đầu/cuối/giữa file.
- **Lấy tiêu đề online**: lấy mục lục từ site và copy vào “Tiêu đề tùy chỉnh”.

## 3) Regex mini‑guide (rút gọn)

Ký hiệu hay dùng:
- `\d` số, `\w` chữ/số/`_`, `\s` khoảng trắng, `.` mọi ký tự
- `^` đầu dòng, `$` cuối dòng, `(...)` nhóm bắt, `[...]` tập ký tự
- `*` 0+, `+` 1+, `?` 0/1 hoặc chuyển sang “lười”, `{n,m}` số lần

Ví dụ đổi tên file (bắt buộc 2 nhóm: **num** + **title**):
- Tên: `Truyen-A-Chap-123-Tieu-de-chuong.txt`
  Regex: `Chap-(\d+)-(.*)`
- Tên: `Quyen 3 - 098 . Ten chuong.txt`
  Regex: `(\d+)\s*\.\s*(.*)`

Ví dụ tìm & thay thế:
- Tìm: `Chương\s*(\d+)` → Thay: `Chapter $1`
- Tìm: `\"(.*?)\"` → Thay: `『$1』`
- Tìm: `^\s+$\n` → Thay: (trống) để xóa dòng trắng

Ví dụ chia file:
- `^第.*?章.*$` (chương tiếng Trung)
- `^Chương\s*\d+.*$` (chương tiếng Việt)
- `^\*{5,}$` (dòng có >= 5 dấu `*`)

## 4) Cài userscript Auto Volume Chapter Uploader

### Cài đặt
1. Cài Tampermonkey trên trình duyệt.
2. Click link sau để auto‑install: [Auto Volume Chapter Uploader.user.js](https://raw.githubusercontent.com/BaoBao666888/Novel-Downloader5/main/Auto%20Volume%20Chapter%20Uploader.user.js)

### Site hỗ trợ
- `https://truyenwikidich.net/nhung-file`
- `https://truyenwikidich.net/truyen/*/chinh-sua`
- `https://koanchay.org/nhung-file`
- `https://koanchay.org/truyen/*/chinh-sua`

## 5) Cách dùng userscript

1. Mở trang nhúng file hoặc chỉnh sửa truyện → panel nổi sẽ xuất hiện.
2. **Chọn Quyển** (Volume) cần bổ sung.
3. Bấm **Chọn Files TXT** và chọn các file chương.
4. Script tự parse số chương + tiêu đề, sắp xếp lại, điền số file và tên chương.
5. Nếu có file lỗi/thiếu num, panel sẽ hiện ô nhập thủ công.
6. Bấm **→ Ấn nút Tải lên (web)** để nhấn nút upload thật trên trang.

Mặc định nhận dạng tên file:
- `Chương 123...` hoặc `第123章...`

### Cài đặt nâng cao (nút ⚙)
- Ưu tiên parse từ **Tên file** hoặc **Dòng đầu**.
- Chọn encoding (UTF‑8/GBK/UTF‑16/Windows‑1252).
- Regex dòng đầu / Regex tên file (bắt buộc **2 nhóm**: `num`, `title`).
- Mẫu tên chương: ví dụ `第{num}章 {title}`.

Ghi chú: script có đồng bộ mô tả (descCn/noteCn) và appendMode nếu form có các ô này.

## 6) Kho plugin ND5 (tuỳ chọn)

Nếu muốn dùng extension bổ sung trong app ND5, thêm kho plugin:
```
https://raw.githubusercontent.com/BaoBao666888/Novel-Downloader5/main/rename_chapters/nd5_plugins/plugin.json
```
