# Novel Studio Desktop

Bản development đầu tiên của desktop Tauri 2 và Svelte. Màn hình **Đổi tên chương** dùng chung Rust core với CLI.

## Chạy trên Windows x64

Cần Rust 1.91.1 trở lên, công cụ build MSVC, Node.js 24, WebView2 và CPython 3. Từ thư mục này:

```powershell
npm ci
npm run tauri -- dev
```

Dùng nút **Chọn Python…** để chọn `python.exe` của môi trường đã cài. Nếu đã đặt `NOVEL_STUDIO_PYTHON` hoặc có Python trên PATH, có thể dùng mặc định. Lựa chọn trong giao diện áp dụng cho phiên hiện tại.

Chọn thư mục, chỉnh mẫu tên rồi bấm **Xem trước**. Bảng hiện cặp tên cũ/mới, file thiếu số và cảnh báo trùng đích. Có thể tìm tên và bỏ chọn từng hàng trước khi xác nhận. Giao diện sáng/tối lưu theo tùy chọn trên máy.

## Kiểm thử và build

```powershell
npm run check
npm run build
cargo test --locked --manifest-path src-tauri/Cargo.toml --features custom-protocol
cargo build --locked --manifest-path src-tauri/Cargo.toml --features custom-protocol
```

Bản development nằm trong `src-tauri/target/debug/novel-studio-desktop.exe`. Frontend được nhúng vào exe. Cần WebView2 và Python trên máy chạy. Lệnh đổi tên kiểm tra lại các file đã duyệt và dùng primitive chống ghi đè của Rust core. Nếu filesystem báo lỗi giữa batch, màn hình hiện số file đã đổi và file dừng.

Desktop có hai thao tác độc lập cho TXT trong thư mục được chọn. `Đổi tên chương` đổi tên file đã duyệt. `Sửa dòng đầu` gợi ý từ mẫu tên, cho nhập dòng riêng và hiển thị dòng cũ/mới trước khi lưu. Lần lưu gần nhất có thể hoàn tác trong phiên. Các bản sao trước khi ghi nằm cạnh file và đường dẫn xuất hiện trong kết quả. Chia chương vẫn chạy qua CLI.


## Build setup Windows từ WSL

Giữ checkout Git ở vị trí hiện tại. Từ root của checkout, trong WSL, đồng bộ đầu vào build vào thư mục Linux riêng. Cần `cargo-xwin`, `llvm-rc`, NSIS 3.13 với `makensis` native Linux, Python 3 và Node.js. Bộ NSIS phải có cả headers, plugins và stubs cùng phiên bản. Dùng lại Rust, Windows SDK và npm cache đã có trong WSL.

```sh
python3 rename_chapters/desktop/sync-wsl-build.py ~/novel-studio-build
cd ~/novel-studio-build/rename_chapters/desktop
npm ci --prefer-offline
npm run package:windows
```

Lệnh sync chép Rust, desktop và các file cũ mà build/test dùng; Git, các thư mục ignore và dữ liệu cá nhân nằm ở checkout gốc. Lần sau chạy lại bước sync, thư mục build giữ cache và các output đã tạo.

Nếu dùng bộ NSIS riêng, thêm thư mục chứa `makensis` vào `PATH` và đặt `NSISDIR` trỏ tới bộ dữ liệu NSIS ở WSL. [Build NSIS trên Linux](https://nsis.sourceforge.io/Docs/AppendixG.html)

Bản cài x64 nằm tại `src-tauri/target/x86_64-pc-windows-msvc/release/bundle/nsis/`. Lệnh chuẩn bị dùng CPython 3.14.10 embeddable từ Python.org, kiểm SHA-256 trước khi giải nén và giữ nguyên giấy phép kèm theo. Archive cache và runtime dàn dựng nằm trong `src-tauri/runtime/` đã ignore.

NSIS cài theo tài khoản Windows hiện tại. Nếu máy thiếu WebView2, bộ cài tải runtime WebView2 và cần Internet ở bước đó. Sau khi cài, app chạy Python được bố trí sẵn tại `runtime/python/python.exe` trong thư mục cài; không giải nén Python ra vùng tạm mỗi lần mở app. Vẫn có thể chọn Python khác trong phiên bằng hộp thoại. [CPython](https://www.python.org/downloads/release/python-31410/) · [Windows Installer của Tauri](https://v2.tauri.app/distribute/windows-installer/)

Build setup này là bản build local. Ký phân phối, nâng cấp và updater là các bước riêng.
