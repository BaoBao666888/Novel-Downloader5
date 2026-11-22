pub mod archive;
pub mod first_line;
pub mod library;
mod names;
mod python;
pub mod rename;
pub mod rename_apply;
pub mod split;
mod split_session;
pub mod text_tools;

pub type CoreError = Box<dyn std::error::Error + Send + Sync>;
