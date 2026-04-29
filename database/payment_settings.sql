-- payment_settings.sql
-- Table to store GCash payment details for admin editing
CREATE TABLE IF NOT EXISTS payment_settings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    account_name VARCHAR(100) NOT NULL,
    mobile_number VARCHAR(20) NOT NULL,
    note TEXT,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Insert default payment settings if table is empty
INSERT INTO payment_settings (account_name, mobile_number, note)
SELECT 'Prisville Resort', '+63 912 345 6789', 'This is a reservation fee (50% of total) to secure your booking. The remaining balance will be paid upon arrival.'
WHERE NOT EXISTS (SELECT 1 FROM payment_settings LIMIT 1);
