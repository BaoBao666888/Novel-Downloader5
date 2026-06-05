# Novel Downloader Debug Bridge

Debug Bridge dùng WebSocket local để dashboard gửi lệnh vào đúng tab userscript đang chạy. Server chỉ relay message; selector, rule, `deal`, `getChapters` và eval JS đều chạy trong môi trường Tampermonkey thật.

## Chạy server

```bash
node tools/nd-debug-bridge/server.js
```

Mặc định dashboard mở tại:

```text
http://127.0.0.1:17888/
```

Có thể đổi port:

```bash
ND_DEBUG_PORT=17889 node tools/nd-debug-bridge/server.js
```

## Cách dùng

1. Chạy server local.
2. Mở trang truyện có Novel Downloader.
3. Vào `Quản lý tải xuống` -> tab `Cài đặt` -> `Mở Debug Bridge`.
4. Bấm `Mở dashboard` hoặc mở `http://127.0.0.1:17888/`.
5. Dùng cùng token ở popup userscript và dashboard.
6. Bấm `Kết nối` trong popup userscript nếu chưa tự kết nối.

## Command có sẵn

- `env.snapshot`: xem URL, rule, book, Storage/Config và API đang có.
- `selector.test`: test selector trên DOM trang thật.
- `rule.current`: xem rule hiện tại.
- `storage.book`: xem thông tin sách và mẫu chương.
- `storage.config`: xem config.
- `chapter.sample`: xem một đoạn danh sách chương.
- `rule.getChapters`: chạy `getChapters` của rule hiện tại nếu có.
- `rule.dealChapter`: chạy `deal` cho một chương theo index.
- `request.text`: gọi `helpers.requestText`.
- `eval.js`: chạy JS trong context có `Rule`, `Storage`, `Config`, `helpers`, `xhr`, `$`, `sleep`, `html2Text`, `replaceWithDict`.

## Lưu ý

Tính năng này có thể chạy eval, nên mặc định tắt và chỉ nên dùng với server local `127.0.0.1`.
