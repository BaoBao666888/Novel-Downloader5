//! Nền tảng lõi cho Upload Engine, đối chiếu server và khôi phục công việc,
//! dùng chung cho Desktop (Windows/Linux) và Android.
//!
//! Toàn bộ I/O mạng, lưu kho khóa/cookie và picker phụ thuộc nền tảng được tách
//! qua các trait và kiểu dữ liệu thuần trong module này.

pub mod backup_zip;
pub mod engine;
pub mod html;
pub mod model;
pub mod multipart;
pub mod objects;
pub mod policy;
pub mod protocol;
pub mod reconcile;
pub mod recovery;
pub mod runner;
pub mod session;
pub mod store;
pub mod verifier;
pub mod worker;
pub mod workspace;
