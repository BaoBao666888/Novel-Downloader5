pub fn destination_key(name: &str) -> String {
    if cfg!(windows) {
        name.to_lowercase()
    } else {
        name.to_owned()
    }
}

pub fn valid_target(name: &str) -> bool {
    if matches!(name, "" | "." | "..") || name.contains(['\0', '/', '\\']) {
        return false;
    }
    if cfg!(windows) {
        let stem = name
            .split('.')
            .next()
            .unwrap_or_default()
            .trim_end_matches(' ');
        let reserved = stem.to_ascii_uppercase();
        let serial_device = reserved
            .strip_prefix("COM")
            .or_else(|| reserved.strip_prefix("LPT"));
        return !name.contains([':', '"', '*', '?', '<', '>', '|'])
            && !name.ends_with(['.', ' '])
            && !name.chars().any(|ch| ch < ' ')
            && !matches!(
                reserved.as_str(),
                "CON" | "PRN" | "AUX" | "NUL" | "CONIN$" | "CONOUT$"
            )
            && !matches!(
                serial_device,
                Some("1" | "2" | "3" | "4" | "5" | "6" | "7" | "8" | "9" | "¹" | "²" | "³")
            );
    }
    true
}

pub fn valid_chapter(name: &str) -> bool {
    valid_target(name) && name.to_ascii_lowercase().ends_with(".txt")
}
