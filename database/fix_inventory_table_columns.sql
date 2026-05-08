-- Fix inventory_items table - Add missing columns
-- This script adds min_stock and archived columns if they don't exist

-- Step 1: Add min_stock column
SET @col_exists = (
  SELECT COUNT(*) 
  FROM INFORMATION_SCHEMA.COLUMNS 
  WHERE TABLE_SCHEMA = DATABASE() 
    AND TABLE_NAME = 'inventory_items' 
    AND COLUMN_NAME = 'min_stock'
);

SET @sql = IF(@col_exists = 0,
  'ALTER TABLE inventory_items ADD COLUMN min_stock INT DEFAULT 0 AFTER quantity',
  'SELECT "min_stock column already exists" AS message'
);

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Step 2: Add archived column
SET @col_exists = (
  SELECT COUNT(*) 
  FROM INFORMATION_SCHEMA.COLUMNS 
  WHERE TABLE_SCHEMA = DATABASE() 
    AND TABLE_NAME = 'inventory_items' 
    AND COLUMN_NAME = 'archived'
);

SET @sql = IF(@col_exists = 0,
  'ALTER TABLE inventory_items ADD COLUMN archived TINYINT(1) DEFAULT 0',
  'SELECT "archived column already exists" AS message'
);

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Step 3: Add supplier column if missing
SET @col_exists = (
  SELECT COUNT(*) 
  FROM INFORMATION_SCHEMA.COLUMNS 
  WHERE TABLE_SCHEMA = DATABASE() 
    AND TABLE_NAME = 'inventory_items' 
    AND COLUMN_NAME = 'supplier'
);

SET @sql = IF(@col_exists = 0,
  'ALTER TABLE inventory_items ADD COLUMN supplier VARCHAR(255) NULL AFTER unit_price',
  'SELECT "supplier column already exists" AS message'
);

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Step 4: Add expiry_date column if missing
SET @col_exists = (
  SELECT COUNT(*) 
  FROM INFORMATION_SCHEMA.COLUMNS 
  WHERE TABLE_SCHEMA = DATABASE() 
    AND TABLE_NAME = 'inventory_items' 
    AND COLUMN_NAME = 'expiry_date'
);

SET @sql = IF(@col_exists = 0,
  'ALTER TABLE inventory_items ADD COLUMN expiry_date DATE NULL AFTER supplier',
  'SELECT "expiry_date column already exists" AS message'
);

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Verify the table structure
DESCRIBE inventory_items;

-- Show sample data
SELECT 
  id,
  item_name,
  category,
  quantity,
  min_stock,
  unit,
  unit_price,
  supplier,
  expiry_date,
  archived
FROM inventory_items
LIMIT 5;

SELECT '✅ SUCCESS! All required columns have been added to inventory_items table.' AS result;
