fn main() {
    println!("cargo:rerun-if-changed=../../icon.ico");
    if std::env::var_os("CARGO_FEATURE_CUSTOM_PROTOCOL").is_some() {
        println!("cargo:rerun-if-changed=../dist");
    }
    let windows = tauri_build::WindowsAttributes::new().window_icon_path("../../icon.ico");
    tauri_build::try_build(tauri_build::Attributes::new().windows_attributes(windows))
        .expect("failed to configure Novel Studio");
}
