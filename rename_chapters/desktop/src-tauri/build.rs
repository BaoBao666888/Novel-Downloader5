fn main() {
    let windows = tauri_build::WindowsAttributes::new().window_icon_path("../../icon.ico");
    tauri_build::try_build(tauri_build::Attributes::new().windows_attributes(windows))
        .expect("failed to configure Novel Studio");
}
