CREATE TABLE lib_entries (
  id TEXT PRIMARY KEY CHECK (length(id) = 64 AND id NOT GLOB '*[^0-9a-f]*'),
  file_name TEXT NOT NULL CHECK (length(file_name) >= 1),
  title TEXT NOT NULL,
  original_path TEXT NOT NULL CHECK (length(original_path) >= 1),
  added_at TEXT NOT NULL,
  opened_at TEXT,
  progress_page INTEGER CHECK (progress_page IS NULL OR progress_page >= 1)
);
