-- Add archived column to walk_in_bookings table
ALTER TABLE walk_in_bookings 
ADD COLUMN IF NOT EXISTS archived BOOLEAN DEFAULT FALSE;

-- Add index for better query performance
CREATE INDEX IF NOT EXISTS idx_walk_in_archived ON walk_in_bookings(archived);
