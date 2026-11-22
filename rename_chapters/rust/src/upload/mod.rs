//! Nền tảng lõi cho Upload Engine, đối chiếu server và khôi phục công việc,
//! dùng chung cho Desktop (Windows/Linux) và Android.
//!
//! Toàn bộ I/O mạng, lưu kho khóa/cookie và picker phụ thuộc nền tảng được tách
//! qua các trait và kiểu dữ liệu thuần trong module này.

pub mod engine;
pub mod model;
pub mod multipart;
pub mod protocol;
