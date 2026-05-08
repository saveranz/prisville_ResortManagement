-- Add min_stock column to inventory_items table
-- This enables PAR level tracking for inventory items

-- Check if column exists first
SET @col_exists = (
  SELECT COUNT(*) 
  FROM INFORMATION_SCHEMA.COLUMNS 
  WHERE TABLE_SCHEMA = DATABASE() 
    AND TABLE_NAME = 'inventory_items' 
    AND COLUMN_NAME = 'min_stock'
);

-- Add column if it doesn't exist
SET @sql = IF(@col_exists = 0,
  'ALTER TABLE inventory_items ADD COLUMN min_stock INT DEFAULT 0 AFTER quantity',
  'SELECT "min_stock column already exists" AS message'
);

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Verify the column was added
DESCRIBE inventory_items;

-- Show current inventory with new min_stock column
SELECT 
  id,
  item_name,
  category,
  quantity,
  min_stock,
  unit,
  unit_price
FROM inventory_items
LIMIT 10;

SELECT '✅ min_stock column added successfully!' AS result;
