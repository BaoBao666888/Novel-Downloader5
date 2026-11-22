# Novel Studio Rust core

CLI development có preview chia chương và kế hoạch đổi tên hàng loạt. Hai lệnh preview chỉ đọc file đầu vào. CPython giữ cú pháp regex và mẫu tên của Novel Studio.

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

## Thực thi kế hoạch đổi tên

Xem preview trước rồi lưu các cặp tên đã chọn vào `plan.json`. Ví dụ với file mẫu:

```json
{
  "folder": "sample-chapters",
  "operations": [
    {"source": "1 Lời mở đầu.txt", "target": "第001章 Lời mở đầu.txt"}
  ]
}
```

```sh
cargo run --locked -- rename-apply --confirm < plan.json
```

Lệnh kiểm tra toàn bộ kế hoạch trước khi đổi tên. Mỗi cặp dùng tên file thuộc cùng thư mục. Nguồn phải là file TXT thường. Tên nguồn lặp, tên đích trùng hoặc đích đã tồn tại sẽ dừng cả kế hoạch ở bước kiểm tra. Nếu có lỗi filesystem trong lúc chạy, output JSON ghi các cặp đã đổi trong `renamed` và cặp đầu tiên gặp lỗi trong `failure`. Lệnh giữ nguyên nội dung file. Đổi hoa/thường khi tên đích trỏ tới cùng file, hoán đổi tên, và sửa dòng đầu hiện thuộc luồng riêng.

## Sửa dòng đầu và hoàn tác

Có thể thêm `"include_first_line": true` vào yêu cầu `rename-preview` để lấy gợi ý dòng đầu độc lập với tên file đã lọc ký tự. File thiếu số chương cần một dòng thay thế do bạn chọn.

Lưu yêu cầu sửa vào `edits.json`:

```json
{
  "folder": "sample-chapters",
  "edits": [{"file": "1 Lời mở đầu.txt", "replacement": "Chương 1: Lời mở đầu"}]
}
```

```sh
cargo run --locked -- first-line-preview < edits.json > edits-preview.json
cargo run --locked -- first-line-apply --confirm < edits-preview.json > edits-result.json
```

Trên PowerShell, dùng `cmd.exe /d /c` với lệnh và các chuyển hướng nằm trong cùng một cặp dấu nháy để giữ UTF-8. Preview trả dòng hiện tại, dòng đề xuất và SHA-256 của từng file. Xem kết quả preview trước khi chạy lệnh thứ hai. Khi có file đổi bytes sau preview, cả batch dừng ở bước kiểm tra.

Chỉ dòng đầu được thay. BOM, kiểu xuống dòng và toàn bộ phần sau được giữ nguyên theo byte. Các dòng giống sẵn được ghi vào `unchanged`. Kết quả trả đường dẫn tới nội dung gốc trong `changed[].backup` và đối tượng `undo`. Lưu đối tượng `undo` thành JSON rồi đưa lại vào `first-line-apply --confirm` để khôi phục dòng cũ. Undo cũng kiểm tra SHA-256 trước khi ghi.

Khi lỗi xuất hiện sau khi batch bắt đầu, xem các mục đã lưu và trường `failure`. Nếu báo `recovery_dir`, thư mục đó giữ bản phục hồi cần kiểm tra. Bản lưu do công cụ tạo trong `.novel-studio-backup-*` ngay cạnh file. Giữ các bản này cho tới khi xác nhận kết quả. Trên Linux/macOS, file mới giữ mode nhưng các metadata Unix khác nằm ở bản gốc trong thư mục backup.

## Kiểm thử

Từ thư mục này, chạy `cargo test --locked` và `cargo build --locked`. Python cần có Tkinter để import module TextOps cũ. Các bộ test chạy trên file tạm và không mở cửa sổ Tk.

- Lấy thư mục đích từ `cargo metadata --offline --no-deps --format-version 1`, trường `target_directory`. Với cấu hình repo đầy đủ, đây là `../desktop/src-tauri/target` tính từ thư mục Rust.
- Linux/macOS chạy `python3 -B tests/split_parity.py ../desktop/src-tauri/target/debug/novel-studio-core` và `python3 -B tests/rename_parity.py ../desktop/src-tauri/target/debug/novel-studio-core`.
- Windows native dùng đường dẫn tương ứng có đuôi `.exe`. Build chéo thêm thư mục target triple vào trước `debug`.
