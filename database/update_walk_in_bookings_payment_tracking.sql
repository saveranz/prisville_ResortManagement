-- Update walk_in_bookings table to support payment tracking
-- This migration adds down payment and balance tracking for walk-in bookings

-- Add new columns for payment tracking
ALTER TABLE walk_in_bookings 
ADD COLUMN total_amount DECIMAL(10, 2) DEFAULT 0.00 AFTER amount,
ADD COLUMN down_payment DECIMAL(10, 2) DEFAULT 0.00 AFTER total_amount,
ADD COLUMN balance DECIMAL(10, 2) DEFAULT 0.00 AFTER down_payment,
ADD COLUMN payment_status ENUM('partial', 'paid') DEFAULT 'partial' AFTER balance;

-- Migrate existing data: copy amount to total_amount and set as paid
UPDATE walk_in_bookings 
SET 
  total_amount = amount,
  down_payment = amount,
  balance = 0.00,
  payment_status = 'paid'
WHERE total_amount IS NULL OR total_amount = 0;

-- Remove address column (no longer needed)
ALTER TABLE walk_in_bookings 
DROP COLUMN IF EXISTS address;

-- Optional: Make amount column nullable since we're using total_amount now
ALTER TABLE walk_in_bookings 
MODIFY COLUMN amount DECIMAL(10, 2) NULL;
