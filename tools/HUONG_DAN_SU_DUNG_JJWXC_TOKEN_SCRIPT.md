# Hướng Dẫn Sử Dụng Script Lấy Token App JJWXC (v484)

## 1) Mục đích
Script dùng để đăng nhập tài khoản JJWXC theo luồng app Android và lấy `token` phục vụ các tác vụ cần token app.

## 2) Chuẩn bị
- Trình duyệt có cài Tampermonkey (hoặc userscript manager tương đương).
- Cài script: **[Lấy Token App Android.user.js](https://raw.githubusercontent.com/BaoBao666888/Novel-Downloader5/main/TM%20Translate.user.js)**
- Mở trang thuộc domain JJWXC (ví dụ `www.jjwxc.net`).

## 3) Cách dùng nhanh
1. Bấm nút nổi `Lấy Token JJ` ở góc trái dưới.
2. Nhập:
   - `Tài khoản`
   - `Mật khẩu`
   - `Mã xác minh` (để trống nếu chưa được yêu cầu)
3. Bấm `Đăng nhập và lấy token`.
4. Nếu thành công, token sẽ hiện trong ô kết quả. Nếu cần mã xác mình script sẽ thông báo và yêu cầu user nhập, sau đó nhấn lại nút `Đăng nhập và lấy token`, token sẽ hiện.
5. Bấm `Sao chép token` để copy hoặc tự copy thủ công.

## 4) Khi bị yêu cầu xác minh thiết bị
- Nếu hệ thống trả về thông báo cần xác minh, script sẽ hiển thị trạng thái tương ứng.
- Lúc này nhập mã xác minh (SMS/email) vào ô `Mã xác minh` rồi bấm lại nút đăng nhập.

## 5) Cảnh báo quan trọng (đọc kỹ)
- `Token app là thông tin nhạy cảm`:
  - Ai có token có thể dùng như phiên đăng nhập của bạn cho các API liên quan.
  - Không gửi token vào nhóm chat công khai, issue public, hoặc pastebin công khai.
- `Có thể làm thay đổi phiên đăng nhập trên app cũ`:
  - Khi đăng nhập lấy token mới, hệ thống có thể làm phiên trên một số thiết bị/app Android cũ bị vô hiệu hoặc đăng xuất.
  - Đây là hành vi thường gặp với cơ chế quản lý phiên/token của app.
- `Đăng nhập quá dày có thể bị hạn chế`:
  - Nhiều lần thử liên tiếp có thể kích hoạt captcha, giới hạn tần suất, hoặc khóa tạm.
- `Rủi ro bảo mật thiết bị`:
  - Nếu máy dính malware/keylogger thì tài khoản và token đều có thể bị lộ.

## 6) Khuyến nghị an toàn
- Chỉ dùng khi thật sự cần lấy token.
- Không spam đăng nhập liên tục.
- Không chia sẻ token cho bên thứ ba.
- Nếu nghi ngờ lộ token:
  1. Đổi mật khẩu ngay.
  2. Đăng xuất các phiên lạ trong phần quản lý thiết bị (nếu có).
  3. Lấy token mới sau khi đổi mật khẩu.
- Ưu tiên dùng máy cá nhân, không dùng máy công cộng.

## 7) Lỗi thường gặp
- Không thấy nút `Lấy Token JJ`
  - Kiểm tra script đã bật chưa.
  - Reload trang JJWXC.
  - Kiểm tra có extension khác chặn script không.
- Có thông báo lỗi nhưng không ra token
  - Kiểm tra lại tài khoản/mật khẩu.
  - Thử lại sau vài phút (tránh thao tác quá dày).
  - Nếu có yêu cầu xác minh thì phải nhập mã xác minh.

## 8) Ghi chú pháp lý
Bạn tự chịu trách nhiệm khi sử dụng script và token trên tài khoản của mình. Chỉ sử dụng cho mục đích hợp pháp, tuân thủ điều khoản dịch vụ của nền tảng.
