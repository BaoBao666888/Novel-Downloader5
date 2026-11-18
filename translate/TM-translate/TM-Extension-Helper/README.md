# TM Translate Hybrid Helper

Extension Chrome tùy chọn cho OCR của TM Translate. Không cần extension nếu chỉ
dịch chữ. Phiên bản hiện tại: **2.1.1**.

## Cài Đặt

1. Tải `TM-Extension-Helper-2.1.1.zip` từ [Releases](https://github.com/BaoBao666888/Novel-Downloader5/releases/tag/tm-helper-v2.1.1), giải nén rồi mở `chrome://extensions`.
2. Bật **Developer mode**, chọn **Load unpacked**.
3. Chọn thư mục `TM-Extension-Helper` vừa giải nén, nơi có `manifest.json`.
4. Cài [TM Translate mới từ cùng release](https://github.com/BaoBao666888/Novel-Downloader5/releases/download/tm-helper-v2.1.1/TM-Translate-3.5.5.20_beta.user.js) trong Tampermonkey.
5. Reload trang truyện rồi dùng nút OCR của userscript.

Khi cập nhật code, bấm **Reload** trên thẻ extension rồi reload trang truyện.
Offscreen document cũ không tự nạp lại file JavaScript vừa sửa.

## Xử Lý Ảnh

OCR chạy cục bộ trong offscreen document, dùng eSearch OCR, ONNX Runtime Web và
model Trung/Anh kèm theo trong `assets/ch.zip`. Model đã giải nén được cache
trong `chrome.storage.local`. Kết quả chữ cần dịch được userscript gửi đến
provider dịch đã chọn.

Ảnh được giải mã thành ImageData có kích thước hợp lệ trước khi chạy model.
Ảnh hỏng, rỗng hoặc quá lớn sẽ trả lỗi, không tạo canvas với kích thước sai.
Nếu ảnh quá lớn, khoanh một vùng nhỏ hơn.

Extension khai báo quyền truy cập website và cho phép userscript gửi lệnh OCR.
Chỉ cài bản code bạn tin tưởng. Có thể giới hạn quyền website trong Chrome.
`rules.json` là file tham khảo, không được manifest đăng ký làm bộ rule mạng.

## Tệp Trong Git

Git giữ mã, các thư viện JavaScript nhỏ và `assets-manifest.json` có SHA-256.
Model `assets/ch.zip` và các file WASM lớn chỉ nằm trong bộ ZIP trên Releases,
không nằm trong Git. ZIP tải riêng, PDF và source tham khảo cũng được bỏ qua.

Nếu chạy từ source checkout, dùng Node.js 20 trở lên, tại thư mục gốc repo:

```bash
node tools/build-tm-helper.cjs --download-assets
node tools/build-tm-helper.cjs --verify
node tools/build-tm-helper.cjs --pack
```

Lệnh đầu tải bộ release và chỉ khôi phục asset còn thiếu sau khi kiểm tra SHA-256.
Không tự ghi đè file đã có nhưng sai checksum. Lệnh pack tạo ZIP đầy đủ, model
riêng và `SHA256SUMS` trong `dist/tm-helper`. Thư mục output không vào Git.

## Điện Thoại

Không cần extension để chạy OCR local nếu trình duyệt chạy được userscript và
WebAssembly. Trong TM Translate, chọn ảnh hoặc ảnh chụp màn hình từ máy. Nếu
trình duyệt không có API chụp màn hình, nút OCR tự mở phần nhập ảnh.

Helper này dùng API offscreen của Chrome extension, không phải extension dùng
chung cho mọi trình duyệt Android/iOS. Khả năng chạy OCR local và tốc độ còn phụ
thuộc trình duyệt, RAM và kích thước ảnh. Khi ảnh quá lớn, hãy cắt nhỏ trước.

## Thay Đổi 2.1.1

- Chuẩn hóa cả payload từ content script và request trực tiếp từ userscript.
- Sửa lỗi OffscreenCanvas do truyền object thay vì chuỗi ảnh.
- Kiểm tra ảnh trước khi OCR, báo lỗi ảnh hỏng và giới hạn kích thước.
- Sửa biến kết quả text và khôi phục model cache chưa đầy đủ.
- Không ghi toàn bộ nội dung OCR vào log.

## License

Mã của repo dùng [AGPL-3.0-only](../../../LICENSE). Thư viện và model giữ license
gốc. Xem [ghi nhận bên thứ ba](../../../THIRD_PARTY_NOTICES.md),
[MIT](../../../LICENSES/MIT-third-party.txt) và [Apache-2.0](../../../LICENSES/Apache-2.0.txt). Khi đóng gói để phát hành, kèm các tệp license và ghi nhận này cùng extension.
