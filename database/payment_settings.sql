-- payment_settings.sql
-- Table to store GCash payment details for admin editing
CREATE TABLE IF NOT EXISTS payment_settings (
    id SERIAL PRIMARY KEY,
    account_name VARCHAR(100) NOT NULL,
    mobile_number VARCHAR(20) NOT NULL,
    note TEXT,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);