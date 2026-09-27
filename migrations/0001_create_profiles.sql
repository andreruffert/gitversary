-- Migration number: 0001 	 2026-09-26T09:13:19.777Z

CREATE TABLE profiles (
  username TEXT PRIMARY KEY,
  github_id INTEGER NOT NULL UNIQUE,
  github_created_at TEXT NOT NULL,
  github_url TEXT,
  avatar_url TEXT,

  image_key TEXT,
  image_years INTEGER,
  stats_json TEXT,

  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  expires_at TEXT
);
