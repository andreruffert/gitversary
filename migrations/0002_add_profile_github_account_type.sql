-- Migration number: 0002 	 2026-10-01T09:19:08.810Z

ALTER TABLE profiles
ADD COLUMN github_account_type TEXT NOT NULL DEFAULT 'User';
