# Novel Downloader Debug Bridge

Debug Bridge dùng WebSocket local để dashboard gửi lệnh vào đúng tab userscript đang chạy. Server chỉ relay message; selector, rule, `deal`, `getChapters` và eval JS đều chạy trong môi trường Tampermonkey thật.

Server này cũng phục vụ `/nd-debug-bridge.js` và `/nd-rule-editor.js`, nên có thể test Rule Editor local bằng bản trong repo hiện tại.

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

## Cách dùng lần đầu

1. Chạy server local.
2. Mở trang truyện có Novel Downloader.
3. Vào `Quản lý tải xuống` -> tab `Cài đặt` -> `Mở Debug Bridge`.
4. Bấm `Mở dashboard` hoặc mở `http://127.0.0.1:17888/`.
5. Dùng cùng token ở popup userscript và dashboard.
6. Bấm `Kết nối` trong popup userscript nếu chưa tự kết nối.

Khi đã bật Debug Bridge một lần, setting `enabled/token/url` được lưu trong Tampermonkey. Các tab truyện mới do CLI mở sẽ tự nạp Debug Bridge và tự reconnect vào server local, miễn là server vẫn chạy và token không đổi.

## Dùng bằng terminal

CLI nằm ở:

```bash
node tools/nd-debug-bridge/cli.js --help
```

Nên export token để khỏi gõ lại:

```bash
export ND_DEBUG_TOKEN=token-cua-ban
```

Các lệnh hay dùng:

```bash
# Liệt kê tab đang nối
node tools/nd-debug-bridge/cli.js clients

# Mở web mới bằng tab debug hiện tại, tab mới sẽ tự reconnect
node tools/nd-debug-bridge/cli.js open https://www.69shuba.com/book/90509/

# Chọn target theo id/URL/title/host
node tools/nd-debug-bridge/cli.js --target 69shuba snapshot

# Xem chương đã nạp trong Storage.book
node tools/nd-debug-bridge/cli.js --target 69shuba chapters 100 10

# Chạy deal của rule hiện tại trên chương index 104
node tools/nd-debug-bridge/cli.js --target 69shuba deal 104

# Request text bằng helper trong môi trường Tampermonkey thật
node tools/nd-debug-bridge/cli.js --target 69shuba request https://example.com/chapter.html

# Eval JS ngắn hoặc từ file
node tools/nd-debug-bridge/cli.js --target 69shuba eval "return {href: location.href, rule: Storage.rule.siteName}"
node tools/nd-debug-bridge/cli.js --target 69shuba eval --file ./tmp/debug.js

# Inject rule test vào tab hiện tại rồi active rule đó
node tools/nd-debug-bridge/cli.js --target 69shuba inject-rule ./tmp/69shuba/rule.js

# Test một rule mới trên URL mới: mở tab, đợi reconnect, inject rule, snapshot và chạy getChapters
node tools/nd-debug-bridge/cli.js test-rule ./tmp/69shuba/rule.js https://www.69shuba.com/book/90509/
```

Nếu có nhiều tab userscript mà không truyền `--target`, CLI tự chọn tab mới nhất và in cảnh báo ra stderr. Khi cần chắc chắn, dùng `clients` rồi truyền `--target <id>`.

## Test rule mới từ terminal

`test-rule <file> <url>` dùng một tab Novel Downloader đang nối Debug Bridge làm tab điều khiển để mở URL mới. Tab mới phải tự nạp userscript và Debug Bridge, sau đó CLI sẽ inject rule test vào đầu `Rule.special`, reset `Storage.rule/Storage.mode`, gọi lại `init()`, in `env.snapshot`, rồi chạy `getChapters`.

File rule có thể là một object/array trả về trực tiếp:

```javascript
({
  siteName: 'Web Test',
  url: /example\.com\/book/,
  getChapters: async function() {
    return {
      name: document.title,
      author: '',
      chapters: Array.from(document.querySelectorAll('.chapter a')).map(a => ({
        title: a.textContent.trim(),
        url: a.href
      }))
    };
  },
  deal: async function(chapter) {
    return chapter;
  }
})
```

Hoặc dùng kiểu paste rule quen thuộc:

```javascript
Rule.special.push({
  siteName: 'Web Test',
  url: /example\.com\/book/,
  getChapters: async function() {
    return {
      name: document.title,
      author: '',
      chapters: []
    };
  }
});
```

Rule được inject chỉ sống trong tab debug hiện tại. Khi reload tab hoặc tắt tab thì rule test mất, không ghi vào cấu hình rule tùy chỉnh của user.

## Dashboard

Dashboard tại `http://127.0.0.1:17888/` vẫn dùng cùng token. Khi nhiều tab userscript cùng nối, chọn target trong dropdown trước khi bấm command.

## Command có sẵn

- `env.snapshot`: xem URL, rule, book, Storage/Config và API đang có.
- `bridge.status`: xem trạng thái Debug Bridge trong tab target.
- `browser.openUrl`: mở URL bằng tab target, có thể mở tab mới hoặc chuyển chính tab target.
- `browser.reload`: reload tab target.
- `selector.test`: test selector trên DOM trang thật.
- `rule.inject`: inject rule test vào runtime, ưu tiên trước rule gốc và active lại rule.
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
