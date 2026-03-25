-- ============================================
-- Add special_requests column to rooms table
-- ============================================

ALTER TABLE rooms 
ADD COLUMN special_requests TEXT COMMENT 'Special requests or notes for the room' 
AFTER description;

-- Display message
SELECT 'special_requests column added to rooms table' AS status;
