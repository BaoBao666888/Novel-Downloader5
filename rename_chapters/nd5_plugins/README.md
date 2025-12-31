# ND5 plugin drop-in

Thư mục này chứa các plugin ngoài (không cần rebuild). Mỗi plugin nằm trong một thư mục con:

```
nd5_plugins/
  mysite/
    manifest.json
    plugin.py
    icon.png   (tùy chọn)
```

`manifest.json` mẫu:

```json
{
  "id": "mysite",
  "name": "My Site Downloader",
  "entry": "plugin.py",
  "sample_url": "https://mysite.com/book/123",
  "version": "1.0.0",
  "author": "Your Name",
  "source": "https://mysite.com/",
  "description": "Mô tả ngắn",
  "icon": "icon.png"
}
```

`plugin.py` phải có hàm `get_plugin()` trả về object implement giao diện `app.nd5.plugin_api.ND5Plugin`:

```python
from app.nd5.plugin_api import ND5Context

class MySitePlugin:
    id = "mysite"
    name = "My Site Downloader"
    domains = ["mysite.com"]
    sample_url = "https://mysite.com/book/123"
    icon = None
    requires_bridge = False  # True nếu cần backend riêng

    def supports_url(self, url: str) -> bool:
        return "mysite.com" in (url or "")

    def fetch_book_and_toc(self, url: str, ctx: ND5Context):
        # Trả về meta dict và danh sách toc [{'num': 1, 'id': 'abc', 'title': '...'}, ...]
        ...

    def download_chapter_batch(self, book, ids, fmt, fallback_titles, ctx: ND5Context):
        # Trả về dict {chapter_id: {"title": "...", "content": "html hoặc text"}}
        ...

    def content_to_text(self, content: str) -> str:
        # Chuyển nội dung (html/text) sang text thuần
        ...


def get_plugin():
    return MySitePlugin()
```

Thêm plugin mới chỉ cần thả thư mục vào đây rồi mở lại cửa sổ “Download Novel 5”. Built-in Fanqie bridge luôn có sẵn.

## Danh sách plugin (link tổng)

Link danh sách plugin phải trả về JSON có dạng:

```json
{
  "metadata": {
    "author": "QuocBao",
    "description": ""
  },
  "data": [
    {
      "name": "Example",
      "author": "QuocBao",
      "path": "https://example.com/plugin.zip",
      "version": 1,
      "source": "https://example.com/",
      "icon": "https://example.com/icon.png",
      "description": "Mô tả ngắn về plugin",
    }
  ]
}
```

`path` là link tới file zip plugin. File zip phải chứa `manifest.json` ở thư mục gốc plugin (kèm `plugin.py`, icon nếu có).

## Thư viện Python có sẵn (thường dùng)

Plugin có thể dùng các thư viện đã có sẵn trong app, ví dụ:

- `requests`
- `beautifulsoup4` (`bs4`)
- `pillow` (`PIL`)
- `numpy`
- `opencv-python` (`cv2`)
- `packaging`
