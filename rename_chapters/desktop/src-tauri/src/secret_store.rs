use std::fs;
use std::io::Write;
use std::path::PathBuf;

use serde::{Deserialize, Serialize};
use tempfile::NamedTempFile;

const SESSION_FILE_NAME: &str = "session.dpapi";

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SessionSecretStatus {
    pub configured: bool,
    pub readable: bool,
    pub masked: String,
}

/// Lưu cookie phiên bằng Windows DPAPI (`CryptProtectData`), không bao giờ lưu bản rõ ra đĩa.
#[derive(Debug, Clone)]
pub struct SessionSecretStore {
    directory: PathBuf,
}

impl SessionSecretStore {
    pub fn new(workspace_dir: PathBuf) -> Self {
        Self {
            directory: workspace_dir,
        }
    }

    fn path(&self) -> PathBuf {
        self.directory.join(SESSION_FILE_NAME)
    }

    pub fn save(&self, raw_cookie: &str) -> Result<SessionSecretStatus, String> {
        let trimmed = raw_cookie.trim();
        if trimmed.is_empty() {
            return Err("Hãy dán chuỗi Cookie phiên đăng nhập.".into());
        }
        if trimmed.contains(['\r', '\n', '\0']) {
            return Err("Cookie chứa ký tự xuống dòng hoặc null không hợp lệ.".into());
        }

        let encrypted = dpapi_encrypt(trimmed.as_bytes())?;
        fs::create_dir_all(&self.directory).map_err(|err| err.to_string())?;
        let mut temp = NamedTempFile::new_in(&self.directory).map_err(|err| err.to_string())?;
        temp.write_all(&encrypted).map_err(|err| err.to_string())?;
        temp.flush().map_err(|err| err.to_string())?;
        temp.as_file().sync_all().map_err(|err| err.to_string())?;
        temp.persist(self.path())
            .map_err(|err| err.error.to_string())?;

        Ok(self.status())
    }

    pub fn load(&self) -> Result<Option<String>, String> {
        let path = self.path();
        if !path.is_file() {
            return Ok(None);
        }
        let encrypted = fs::read(&path).map_err(|err| err.to_string())?;
        let plain = dpapi_decrypt(&encrypted)?;
        let cookie = String::from_utf8(plain)
            .map_err(|_| "Dữ liệu phiên DPAPI không phải UTF-8 hợp lệ.".to_owned())?;
        let trimmed = cookie.trim().to_owned();
        if trimmed.is_empty() {
            Ok(None)
        } else {
            Ok(Some(trimmed))
        }
    }

    pub fn clear(&self) -> Result<(), String> {
        let path = self.path();
        match fs::remove_file(path) {
            Ok(()) => Ok(()),
            Err(err) if err.kind() == std::io::ErrorKind::NotFound => Ok(()),
            Err(err) => Err(err.to_string()),
        }
    }

    pub fn status(&self) -> SessionSecretStatus {
        let configured = self.path().is_file();
        if !configured {
            return SessionSecretStatus {
                configured: false,
                readable: false,
                masked: String::new(),
            };
        }
        match self.load() {
            Ok(Some(val)) => SessionSecretStatus {
                configured: true,
                readable: true,
                masked: mask_cookie(&val),
            },
            _ => SessionSecretStatus {
                configured: true,
                readable: false,
                masked: String::new(),
            },
        }
    }
}

fn mask_cookie(raw: &str) -> String {
    let chars: Vec<char> = raw.chars().filter(|c| !c.is_whitespace()).collect();
    if chars.len() >= 8 {
        let tail: String = chars[chars.len() - 4..].iter().collect();
        format!("•••• •••• {tail}")
    } else {
        "••••".to_owned()
    }
}

#[cfg(windows)]
fn dpapi_encrypt(plain: &[u8]) -> Result<Vec<u8>, String> {
    use windows_sys::Win32::Foundation::LocalFree;
    use windows_sys::Win32::Security::Cryptography::{
        CRYPT_INTEGER_BLOB, CRYPTPROTECT_UI_FORBIDDEN, CryptProtectData,
    };

    let len = u32::try_from(plain.len()).map_err(|_| "Dữ liệu phiên quá lớn.".to_owned())?;
    let input = CRYPT_INTEGER_BLOB {
        cbData: len,
        pbData: plain.as_ptr() as *mut u8,
    };
    let mut output = CRYPT_INTEGER_BLOB {
        cbData: 0,
        pbData: std::ptr::null_mut(),
    };

    // Safety: input points to valid immutable slice for duration of call; output freed via LocalFree.
    let ok = unsafe {
        CryptProtectData(
            &input,
            std::ptr::null(),
            std::ptr::null(),
            std::ptr::null(),
            std::ptr::null(),
            CRYPTPROTECT_UI_FORBIDDEN,
            &mut output,
        )
    };
    if ok == 0 || output.pbData.is_null() {
        return Err("Không mã hóa được phiên bằng Windows DPAPI.".into());
    }

    let bytes =
        unsafe { std::slice::from_raw_parts(output.pbData, output.cbData as usize) }.to_vec();
    unsafe {
        LocalFree(output.pbData.cast());
    }
    Ok(bytes)
}

#[cfg(not(windows))]
fn dpapi_encrypt(_plain: &[u8]) -> Result<Vec<u8>, String> {
    Err("Lưu phiên DPAPI chỉ hỗ trợ trên Windows.".into())
}

#[cfg(windows)]
fn dpapi_decrypt(cipher: &[u8]) -> Result<Vec<u8>, String> {
    use windows_sys::Win32::Foundation::LocalFree;
    use windows_sys::Win32::Security::Cryptography::{
        CRYPT_INTEGER_BLOB, CRYPTPROTECT_UI_FORBIDDEN, CryptUnprotectData,
    };

    let len = u32::try_from(cipher.len()).map_err(|_| "Dữ liệu phiên quá lớn.".to_owned())?;
    let input = CRYPT_INTEGER_BLOB {
        cbData: len,
        pbData: cipher.as_ptr() as *mut u8,
    };
    let mut output = CRYPT_INTEGER_BLOB {
        cbData: 0,
        pbData: std::ptr::null_mut(),
    };

    let ok = unsafe {
        CryptUnprotectData(
            &input,
            std::ptr::null_mut(),
            std::ptr::null(),
            std::ptr::null(),
            std::ptr::null(),
            CRYPTPROTECT_UI_FORBIDDEN,
            &mut output,
        )
    };
    if ok == 0 || output.pbData.is_null() {
        return Err("Không giải mã được tệp phiên Windows DPAPI.".into());
    }

    let bytes =
        unsafe { std::slice::from_raw_parts(output.pbData, output.cbData as usize) }.to_vec();
    unsafe {
        LocalFree(output.pbData.cast());
    }
    Ok(bytes)
}

#[cfg(not(windows))]
fn dpapi_decrypt(_cipher: &[u8]) -> Result<Vec<u8>, String> {
    Err("Lưu phiên DPAPI chỉ hỗ trợ trên Windows.".into())
}

#[cfg(all(test, windows))]
mod tests {
    use super::*;
    use tempfile::tempdir;

    #[test]
    fn dpapi_roundtrips_cookie_and_never_stores_plaintext() {
        let dir = tempdir().expect("tempdir");
        let store = SessionSecretStore::new(dir.path().to_path_buf());
        assert!(!store.status().configured);

        let raw = "connect.sid=s%3Astage4_secret_token_9876; theme=dark";
        let st = store.save(raw).expect("save dpapi");
        assert!(st.configured);
        assert!(st.readable);
        assert!(st.masked.ends_with("dark"));
        assert!(!st.masked.contains("secret_token"));

        let on_disk = fs::read(dir.path().join(SESSION_FILE_NAME)).expect("read disk");
        assert!(
            !on_disk
                .windows(b"secret_token".len())
                .any(|w| w == b"secret_token"),
            "DPAPI blob must not contain plaintext cookie"
        );

        assert_eq!(store.load().expect("load").as_deref(), Some(raw));
        store.clear().expect("clear");
        assert!(!store.status().configured);
        assert!(store.load().expect("empty").is_none());
    }
}
