# Novel Studio Rust core

Bản đầu tiên chạy preview chia chương từ dòng lệnh. Rust chia nội dung và tạo preview, CPython đọc UTF-8 và chạy regex theo cú pháp của Novel Studio. Chương trình chỉ đọc file đầu vào.

Từ thư mục `rename_chapters/rust`, chạy với một file fixture UTF-8:

```sh
cargo run --locked -- "sample.txt" "^第[0-9]+章" before
```

Vị trí mặc định là `after`. Output JSON có `chunks` gồm `text`, `size` và trường `error` chứa thông báo nếu không tạo được preview. Mã thoát khác 0 báo lỗi. CLI tìm `python` trên Windows và `python3` trên Linux/macOS. Có thể đặt `NOVEL_STUDIO_PYTHON` thành tên hoặc đường dẫn executable của CPython để dùng cùng môi trường với app cũ.

## Kiểm thử

Từ thư mục này, chạy `cargo test --locked` và `cargo build --locked`. Sau đó chạy một trong hai lệnh sau. Python cần có Tkinter để import đúng module legacy, bộ test chạy không cần cửa sổ Tk.

- Windows `python -B tests/split_parity.py target/debug/novel-studio-core.exe`
- Linux/macOS `python3 -B tests/split_parity.py target/debug/novel-studio-core`

Bộ test so trực tiếp với `TextOperations.split_file` trên file tạm, bao gồm regex Python, ký tự Unicode, các kiểu xuống dòng và lỗi đọc file.

Workflow Windows chạy cùng bộ đối chiếu từ các file public, cache Cargo và xuất artifact development `novel-studio-core-dev-windows-x64`. Bản exe development vẫn cần CPython để chạy regex. Nút chạy thủ công trên GitHub khả dụng khi workflow có trên nhánh mặc định. [Tài liệu workflow_dispatch](https://docs.github.com/en/actions/reference/workflows-and-actions/events-that-trigger-workflows#workflow_dispatch)
