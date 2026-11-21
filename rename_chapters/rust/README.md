# Novel Studio Rust core

CLI development có preview chia chương và kế hoạch đổi tên hàng loạt. Chương trình chỉ đọc file đầu vào. CPython giữ cú pháp regex và mẫu tên của Novel Studio.

## Preview chia chương

Từ thư mục `rename_chapters/rust`, chạy với một file fixture UTF-8:

```sh
cargo run --locked -- "sample.txt" "^第[0-9]+章" before
```

Vị trí mặc định là `after`. Output JSON có `chunks` gồm `text`, `size` và trường `error` chứa thông báo nếu không tạo được preview. Mã thoát khác 0 báo lỗi. CLI tìm `python` trên Windows và `python3` trên Linux/macOS. Có thể đặt `NOVEL_STUDIO_PYTHON` thành tên hoặc đường dẫn executable của CPython để dùng cùng môi trường với app cũ.

## Preview đổi tên

Lưu một yêu cầu JSON như sau vào `request.json`:

```json
{
  "folder": "sample-chapters",
  "sort_by": "content",
  "strategy": "content_first",
  "name_format": "第{num:03d}章 {title}.txt",
  "excluded": ["1 Lời mở đầu.txt"]
}
```

```sh
cargo run --locked -- rename-preview < request.json
```

Trong PowerShell dùng `cmd.exe /d /c "cargo run --locked -- rename-preview < request.json"`. Lưu JSON ở UTF-8. Đường dẫn tương đối tính từ thư mục chạy CLI.

Chỉ cần trường `folder`. Mặc định sắp xếp và ưu tiên lấy số/tựa theo nội dung, với mẫu `第{num}章 {title}.txt`. Có thể truyền thêm `filename_regexes`, `content_regexes` và `custom_titles` dưới dạng mảng chuỗi. Tiêu đề tùy chỉnh gắn theo thứ tự đã sắp xếp, kể cả vị trí của file bị loại trừ.

Kết quả là một mảng JSON gồm phân tích từng file, tên gợi ý, trạng thái và cảnh báo. Số chương được ghi dưới dạng chuỗi để giữ nguyên số vượt giới hạn số nguyên của JavaScript. Cảnh báo đích trùng, đích đã tồn tại hoặc tên đích không hợp lệ phản ánh thời điểm preview. Trên Windows, cảnh báo tên đích trùng bỏ qua hoa thường. File có lỗi đọc vẫn xuất hiện cùng thông tin đọc được từ tên file nếu có.

## Kiểm thử

Từ thư mục này, chạy `cargo test --locked` và `cargo build --locked`. Python cần có Tkinter để import module TextOps cũ. Các bộ test chạy trên file tạm và không mở cửa sổ Tk.

- Windows `python -B tests/split_parity.py target/debug/novel-studio-core.exe` và `python -B tests/rename_parity.py target/debug/novel-studio-core.exe`.
- Linux/macOS `python3 -B tests/split_parity.py target/debug/novel-studio-core` và `python3 -B tests/rename_parity.py target/debug/novel-studio-core`.
