-- Simple script to add min_stock column
-- If you get "Duplicate column name" error, the column already exists - that's OK!

ALTER TABLE inventory_items 
ADD COLUMN min_stock INT DEFAULT 0 AFTER quantity;

-- Verify it was added
DESCRIBE inventory_items;

SELECT '✅ Done! The min_stock column has been added.' AS result;
