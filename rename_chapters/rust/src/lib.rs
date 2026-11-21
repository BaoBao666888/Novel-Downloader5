pub mod first_line;
mod names;
mod python;
pub mod rename;
pub mod rename_apply;
pub mod split;

pub type CoreError = Box<dyn std::error::Error + Send + Sync>;
