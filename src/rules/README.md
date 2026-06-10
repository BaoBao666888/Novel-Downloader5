# Novel Downloader Rules

Rule gốc được tách khỏi `novelDownloaderVietSub.user.js` để sửa từng site dễ hơn.

## Cấu trúc

- `special/*.rule.js`: rule match site cụ thể, được build vào `Rule.special`.
- `template/*.rule.js`: rule template, được build vào `Rule.template`.
- `../novelDownloaderVietSub.core.user.js`: userscript chính không chứa danh sách rule dài.

Tên file có prefix số để giữ nguyên thứ tự match. Rule phía trên được ưu tiên trước rule phía dưới.

## Sửa hoặc thêm rule

1. Sửa file rule có sẵn, hoặc copy một file gần giống rồi đổi prefix/tên.
2. Giữ nội dung rule trong vùng `// @rule-begin` và `// @rule-end`.
3. Chạy build:

```bash
node tools/build-novel-downloader.js build
node --check novelDownloaderVietSub.user.js
```

File `novelDownloaderVietSub.user.js` là output để Tampermonkey cài/update, nên vẫn cần commit sau khi build.

## Test nhanh rule mới

Rule file có thể test qua Debug Bridge:

```bash
node tools/nd-debug-bridge/cli.js test-rule src/rules/special/0001-example.rule.js https://example.com/book/1
```

Khi test rule riêng trong CLI, code giữa marker vẫn là object literal bình thường nên Debug Bridge có thể inject tạm vào runtime.
