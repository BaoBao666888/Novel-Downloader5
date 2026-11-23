# Novel Studio Desktop

Bản thử nghiệm desktop Tauri 2 và Svelte, dùng Rust core để xử lý file.

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

Thanh điều hướng gồm **Thư viện**, **Biên tập** và **Tệp**. Trong Biên tập, `Đổi tên chương` và `Sửa dòng đầu` làm việc với các TXT trong thư mục đã chọn. `Chia chương` hỗ trợ chỉnh mốc và xuất chương. Nhóm Tệp có `Giải nén ZIP` để chọn mục cần xuất và đọc thử TXT.

Trong **Thư viện**, dùng **Thêm truyện** để mở TXT hoặc ZIP. Bấm **Tùy chọn** để chỉnh cỡ chữ, giãn dòng, khổ và màu trang. Dùng F11 để chuyển toàn màn hình và Esc để thoát. Có thể chia sẻ thư viện ở chế độ chỉ đọc trong **Cài đặt → Dịch vụ web**.

Trong `Công cụ văn bản`, chọn một TXT để đánh số lại, áp mục lục hoặc Tìm & thay thế. Tìm & thay thế hỗ trợ văn bản thường, regex, khớp cả từ và phân biệt hoa thường. Trong regex, dùng `$1` cho nhóm bắt thứ nhất và `$$` cho một dấu đô la. Trước khi lưu, đối chiếu các đoạn theo số dòng. App lưu bản sao `.bak` cạnh tệp và cho hoàn tác lần lưu gần nhất trong phiên.


## Build setup Windows từ WSL

Giữ checkout Git ở vị trí hiện tại. Từ root của checkout, trong WSL, đồng bộ đầu vào build vào thư mục Linux riêng. Cần `cargo-xwin`, `llvm-rc`, NSIS 3.13 với `makensis` native Linux, Python 3 và Node.js. Bộ NSIS phải có cả headers, plugins và stubs cùng phiên bản. Dùng lại Rust, Windows SDK và npm cache đã có trong WSL.

```sh
python3 rename_chapters/desktop/sync-wsl-build.py ~/novel-studio-build
cd ~/novel-studio-build/rename_chapters/desktop
npm ci --prefer-offline
npm run package:windows
```

Lệnh sync chép các file build cần và giữ cache. `npm run package:windows` tạo bộ cài public. Thư viện, biên tập và quản lý kho VBook dùng được ngay. Mở nguồn và tải chương qua extension VBook cần runner local và Java 21.

Chạy Cargo từ `rename_chapters/rust` hoặc `rename_chapters/desktop/src-tauri` trong cùng thư mục WSL. Cấu hình `rename_chapters/.cargo/config.toml` dùng chung `desktop/src-tauri/target` cho cả hai gói. Cargo vẫn tự tách output theo nền tảng và debug/release trong thư mục này. Dùng debug cho test và release để đóng gói. Có thể đối chiếu `target_directory` và `build_directory` bằng `cargo metadata --offline --no-deps --format-version 1`. [Cấu hình cache của Cargo](https://doc.rust-lang.org/cargo/reference/build-cache.html)

Nếu dùng bộ NSIS riêng, thêm thư mục chứa `makensis` vào `PATH` và đặt `NSISDIR` trỏ tới bộ dữ liệu NSIS ở WSL. [Build NSIS trên Linux](https://nsis.sourceforge.io/Docs/AppendixG.html)

Bản cài x64 nằm tại `src-tauri/target/x86_64-pc-windows-msvc/release/bundle/nsis/`. Lệnh chuẩn bị dùng CPython 3.14.10 embeddable từ Python.org, kiểm SHA-256 trước khi giải nén và giữ nguyên giấy phép kèm theo. Archive cache và runtime dàn dựng nằm trong `src-tauri/runtime/` đã ignore.

## Bộ chạy VBook local

Sau khi cài bản public, tạo thư mục `%LOCALAPPDATA%\io.github.baobao666888.novelstudio\private` rồi đặt `vbook_runner.jar` vào đó. Mở lại Cài đặt để kiểm tra bộ chạy. Nếu Java chưa được nhận diện, chọn Java 21 trong Cài đặt. Chỉ dùng JAR từ nguồn tin cậy.

Để tạo bộ cài local đã kèm JAR, chạy sync với `--runner-jar /path/to/local/vbook_runner.jar` rồi chạy `npm run package:windows:private` trong thư mục build WSL. Bộ cài có hậu tố `-private-setup.exe`. Lệnh public chỉ đóng gói tài nguyên public kể cả khi thư mục WSL còn JAR đã dàn dựng. [Tài nguyên đóng gói của Tauri](https://v2.tauri.app/develop/resources/)

NSIS cài theo tài khoản Windows hiện tại. Nếu máy thiếu WebView2, bộ cài tải runtime WebView2 và cần Internet ở bước đó. Sau khi cài, app chạy Python được bố trí sẵn tại `runtime/python/python.exe` trong thư mục cài; không giải nén Python ra vùng tạm mỗi lần mở app. Vẫn có thể chọn Python khác trong phiên bằng hộp thoại. [CPython](https://www.python.org/downloads/release/python-31410/) · [Windows Installer của Tauri](https://v2.tauri.app/distribute/windows-installer/)

Build setup này là bản build local. Ký phân phối, nâng cấp và updater là các bước riêng.
