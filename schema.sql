-- D1 Database Schema for Telegram Mini App

-- Config Table (single row configuration)
CREATE TABLE IF NOT EXISTS config (
    id INTEGER PRIMARY KEY DEFAULT 1,
    ad_reward REAL NOT NULL DEFAULT 0.10,
    daily_login_reward REAL NOT NULL DEFAULT 0.50,
    referral_bonus REAL NOT NULL DEFAULT 1.00,
    new_user_bonus REAL NOT NULL DEFAULT 0.50,
    min_withdraw REAL NOT NULL DEFAULT 5.00,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert default config
INSERT OR IGNORE INTO config (id, ad_reward, daily_login_reward, referral_bonus, new_user_bonus, min_withdraw)
VALUES (1, 0.10, 0.50, 1.00, 0.50, 5.00);

-- Users Table
CREATE TABLE IF NOT EXISTS users (
    user_id TEXT PRIMARY KEY,
    first_name TEXT NOT NULL DEFAULT '',
    username TEXT NOT NULL DEFAULT '',
    balance REAL NOT NULL DEFAULT 0,
    total_earned REAL NOT NULL DEFAULT 0,
    streak INTEGER NOT NULL DEFAULT 0,
    last_login TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    referrals INTEGER NOT NULL DEFAULT 0,
    referrer_id TEXT,
    completed_tasks TEXT NOT NULL DEFAULT '[]',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Index for referrer lookups
CREATE INDEX IF NOT EXISTS idx_users_referrer ON users(referrer_id);

-- Tasks Table
CREATE TABLE IF NOT EXISTS tasks (
    task_id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    reward REAL NOT NULL,
    link TEXT NOT NULL,
    type TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Ad Watches Table (for tracking limits)
CREATE TABLE IF NOT EXISTS ad_watches (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT NOT NULL,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Index for ad watch queries
CREATE INDEX IF NOT EXISTS idx_ad_watches_user_time ON ad_watches(user_id, timestamp);

-- Withdrawals Table
CREATE TABLE IF NOT EXISTS withdrawals (
    req_id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    amount REAL NOT NULL,
    wallet TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending',
    requested_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    processed_at TIMESTAMP,
    processed_by TEXT
);

-- Index for withdrawal queries
CREATE INDEX IF NOT EXISTS idx_withdrawals_user ON withdrawals(user_id);
CREATE INDEX IF NOT EXISTS idx_withdrawals_status ON withdrawals(status);

-- Example Queries

-- Get user with all data
-- SELECT * FROM users WHERE user_id = ?;

-- Update user balance
-- UPDATE users SET balance = balance + ?, total_earned = total_earned + ? WHERE user_id = ?;

-- Check daily login eligibility
-- SELECT last_login FROM users WHERE user_id = ? AND last_login < date('now');

-- Get pending withdrawals
-- SELECT * FROM withdrawals WHERE status = 'pending' ORDER BY requested_at DESC;

-- Count hourly ad watches
-- SELECT COUNT(*) FROM ad_watches WHERE user_id = ? AND timestamp > datetime('now', '-1 hour');

-- Get user's referrals
-- SELECT first_name, username, created_at FROM users WHERE referrer_id = ? ORDER BY created_at DESC;
