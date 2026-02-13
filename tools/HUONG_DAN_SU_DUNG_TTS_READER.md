# Hướng Dẫn Cài Đặt Và Sử Dụng TTS Reader

Script `TTS Reader` dùng để đọc tiêu đề + nội dung chương bằng TTS, tô màu tiến độ, và tự chuyển phần/chương tiếp theo trên:
- `wikicv.net`
- `koanchay.org`

## 1) Mục đích
- Đọc truyện trực tiếp trên web bằng nhiều nguồn giọng:
  - Browser Speech (giọng của trình duyệt)
  - TikTok TTS
  - Google TTS
  - Bing TTS
- Tô màu đoạn đang đọc/đã đọc.
- Tự chuyển phần kế tiếp (nếu chương có chia phần) và tự qua chương sau (nếu có).

## 2) Chuẩn bị
- Trình duyệt có cài Tampermonkey (hoặc userscript manager tương đương).
- Cài script:
  - Link cài (auto-install): [TTS_Reader.user.js](https://raw.githubusercontent.com/BaoBao666888/Novel-Downloader5/main/tools/TTS_Reader.user.js)
- Nếu dùng TikTok TTS:
  - Bạn cần đăng nhập TikTok để lấy cookie phiên (cookie nhạy cảm).
  - Tampermonkey Beta có thể tự đọc cookie HttpOnly; bản Stable/Violentmonkey thường không đọc được và phải nhập cookie thủ công (xem mục 6 và 7).

## 3) Cách dùng nhanh
1. Mở trang chương truyện (VD):
   - `https://wikicv.net/truyen/.../...`
   - `https://koanchay.org/truyen/.../...`
2. Panel `TTS Reader` sẽ xuất hiện ở góc phải dưới (nếu bị thu gọn thì bấm nút tai nghe tròn để mở).
3. Chọn:
   - `Nguồn giọng` (Browser/TikTok/Google/Bing)
   - `Giọng đọc`
4. Bấm `Play` để bắt đầu.
5. Bấm `?` (nút hướng dẫn) trên header của panel để xem hướng dẫn ngay trong UI.

## 4) Các nút chính (UI)
- `Play`: bắt đầu đọc / tiếp tục khi đang pause
- `Pause`: tạm dừng / tiếp tục
- `Stop`: dừng hẳn
- `Next`: bỏ qua đoạn hiện tại và đọc đoạn kế tiếp
- `Chọn vị trí`: bật chế độ chọn đoạn trên trang; chọn xong sẽ tự đọc luôn từ đoạn đó

## 5) Tùy chọn quan trọng
- `Tốc độ` / `Âm lượng`:
  - Browser Speech: áp dụng cho SpeechSynthesis.
  - TikTok/Google/Bing: áp dụng cho audio phát ra (rate/volume). (Pitch không áp dụng cho remote.)
- `Max ký tự/chunk`:
  - TikTok/Google sẽ tự giới hạn 200 ký tự (kể cả bạn set cao hơn).
  - Bing có thể cao hơn.
- `Delay giữa mục (ms)`: nghỉ giữa 2 đoạn audio.
- `Prefetch (remote)`: tải trước vài đoạn cho TikTok/Google/Bing để chuyển đoạn nhanh hơn.
- `Remote: Timeout/Retry/Gap`: timeout/retry/gap dùng chung cho các giọng remote.
- `Thay thế khi đọc`: thay cụm từ khi đọc (giá trị thay thế sẽ được trim; để trống nghĩa là xóa khỏi câu đọc).

## 6) TikTok TTS: Cookie và cách nhập
TikTok TTS cần cookie phiên (ví dụ: `sessionid`, `sid_tt`, `sid_guard`). Đây là dữ liệu nhạy cảm, tương đương đăng nhập.

### 6.1) Nếu bạn dùng Tampermonkey Beta (có GM_cookie đọc HttpOnly)
1. Đăng nhập TikTok trên trình duyệt.
2. Reload trang truyện.
3. Chọn `Nguồn giọng` = TikTok và thử `Play`.
4. Nếu vẫn báo thiếu cookie, dùng cách nhập thủ công bên dưới.

### 6.2) Nếu bạn dùng Tampermonkey Stable / Violentmonkey (thường không đọc được HttpOnly)
1. Chọn `Nguồn giọng` = TikTok.
2. Bấm `Nhập cookie` trong panel.
3. Dán cookie theo 1 trong các định dạng:
   - Cookie header: `a=b; c=d; ...`
   - JSON cookies
   - Netscape cookie file (Cookie-Editor export)
4. Bấm `Lưu`.

Ghi chú:
- Script sẽ lưu cookie lại nhưng không hiển thị lại trong UI để hạn chế lộ.
- Nếu cookie sai/hết hạn, script sẽ tự yêu cầu nhập lại khi TikTok fail.

## 7) Hướng dẫn riêng cho Tampermonkey Stable (Edge Mobile, không có Beta)
Trên một số môi trường (VD Edge mobile), bạn không có Tampermonkey Beta nên thường không đọc được cookie HttpOnly.

Bạn có 2 cách phổ biến:

### Cách A: Lấy cookie TikTok bằng PC rồi dán vào điện thoại
1. Trên PC: đăng nhập TikTok bằng Chrome/Edge.
2. Export cookie bằng Cookie-Editor (xem Cách B để cài Cookie-Editor).
3. Copy cookie dạng `Netscape` hoặc `Cookie header`.
4. Gửi cookie sang điện thoại (tự gửi cho chính bạn qua ghi chú cá nhân, file local, v.v.).
5. Trên điện thoại: mở trang truyện → `Nguồn giọng` TikTok → `Nhập cookie` → dán → `Lưu`.

### Cách B: Cài Cookie-Editor (khuyến nghị làm trên PC)
Bạn có thể dùng Cookie-Editor để export cookie TikTok nhanh và đầy đủ (bao gồm HttpOnly).

- Cookie-Editor là tiện ích mã nguồn mở. Bạn có thể cài trực tiếp trong cửa hàng tiện ích cho trình duyệt của mình, kể cả mobile.
- Repo này có sẵn bản đã Việt hóa + lược bỏ quảng cáo: [cookie_ext.zip](https://github.com/BaoBao666888/Novel-Downloader5/raw/refs/heads/main/extensions/cookie_ext.zip).
- Theo mình đã kiểm tra: không thấy mã độc và không thấy request "lạ" ra ngoài. Nếu bạn kỹ tính thì nên tự kiểm tra lại trước khi cài.
- Lưu ý: cookie là dữ liệu nhạy cảm. Chỉ dùng extension từ nguồn bạn tin tưởng và tự chịu trách nhiệm khi cài.

Cách cài (Chrome/Edge desktop):
1. Giải nén `extensions/cookie_ext.zip` ra một thư mục.
2. Mở trang:
   - Chrome: `chrome://extensions`
   - Edge: `edge://extensions`
3. Bật `Developer mode` (Chế độ nhà phát triển).
4. Chọn `Load unpacked` (Tải tiện ích đã giải nén) → trỏ vào thư mục con bên trong thư mục vừa giải nén.
5. Mở `tiktok.com/login` → đăng nhập → mở Cookie-Editor → export cookie → copy.

## 8) Lỗi thường gặp
- Không thấy panel TTS Reader
  - Kiểm tra script đã bật trong Tampermonkey chưa.
  - Đúng domain chưa: chỉ chạy trên trang chương truyện của `wikicv.net` / `koanchay.org`.
  - Reload trang.
- TikTok TTS báo thiếu cookie / cookie invalid
  - Đăng nhập TikTok lại, export cookie lại (đảm bảo có `sessionid`/`sid_tt`/`sid_guard`).
  - Nếu dùng Stable/mobile: bắt buộc nhập cookie thủ công.
- Remote TTS bị timeout/rate-limit
  - Tăng `Remote timeout`, tăng `Retry`, tăng `Gap` và giảm `Prefetch count`.

## 9) Cập nhật script
- Tampermonkey có thể tự cập nhật nhờ `@updateURL/@downloadURL` (tùy cài đặt của bạn).
- Cập nhật thủ công:
  1. Mở lại link cài script: `https://raw.githubusercontent.com/BaoBao666888/Novel-Downloader5/main/tools/TTS_Reader.user.js`
  2. Bấm cài/ghi đè (Tampermonkey sẽ nhận ra và update).
  3. Reload trang truyện.
- Bạn cũng có thể bấm nút `?` trong panel → `Mở link update`.

## 10) Cảnh báo an toàn (đọc kỹ)
- Cookie TikTok là thông tin nhạy cảm (tương đương phiên đăng nhập).
  - Không gửi cookie lên nhóm chat công khai, issue public, hoặc pastebin công khai.
  - Nếu nghi ngờ lộ cookie: đăng xuất TikTok và đăng nhập lại (hoặc đăng xuất tất cả thiết bị nếu có).
- Bạn tự chịu trách nhiệm khi sử dụng script và dữ liệu đăng nhập của mình.
