//! Lõi dịch thuật, chuẩn hóa văn bản tiếng Việt, Edit Name V3, Hán-Việt gợi ý,
//! parser DichNgay/DichNhanh và Translation Memory / Unit Map dùng chung
//! cho Desktop (Windows/Linux) và Android.
//!
//! Thiết kế hoàn toàn độc lập với UI (Tauri/Svelte) và Upload Engine.

pub mod dichngay;
pub mod name_set;
pub mod pipeline;
pub mod selection;
pub mod storage;
pub mod text;
