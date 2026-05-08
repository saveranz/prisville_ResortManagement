-- Update all partial payment status bookings to paid
-- This updates the payment information for bookings that should be marked as paid

UPDATE walk_in_bookings 
SET 
  down_payment = total_amount,
  balance = 0.00,
  payment_status = 'paid'
WHERE payment_status = 'partial';
