pub mod archive;
pub mod credit;
pub mod first_line;
pub mod library;
pub mod merge;
mod names;
mod python;
pub mod rename;
pub mod rename_apply;
pub mod split;
mod split_session;
pub mod text_tools;
pub mod translate;
pub mod upload;
pub mod vbook;

pub type CoreError = Box<dyn std::error::Error + Send + Sync>;
