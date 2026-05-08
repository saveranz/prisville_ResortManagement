-- Safe version: Insert consolidated linen inventory
-- This script handles the min_stock column gracefully

-- Step 1: Check if min_stock column exists, if not add it
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

-- Step 2: Clear existing linen records to avoid duplicates
DELETE FROM inventory_items WHERE category = 'Linens';

-- Step 3: Insert consolidated linen inventory records
-- Totals calculated from your data:
-- Towel: 24 pcs (PAR level: 20 = 80%)
-- Pillow: 53 pcs (PAR level: 42 = 80%)
-- Kumot: 15 pcs (PAR level: 12 = 80%)
-- Bedsheet: 22 pcs (PAR level: 18 = 80%)

INSERT INTO inventory_items (item_name, category, quantity, min_stock, unit, unit_price) VALUES
('Towel', 'Linens', 24, 20, 'pcs', '50.00'),
('Pillow', 'Linens', 53, 42, 'pcs', '100.00'),
('Kumot', 'Linens', 15, 12, 'pcs', '150.00'),
('Bedsheet', 'Linens', 22, 18, 'pcs', '120.00');

-- Step 4: Verify the inserted records
SELECT 
  '✅ INSERTED RECORDS' as 'Status',
  '' as '',
  '' as ' ',
  '' as '  ',
  '' as '   ',
  '' as '    ',
  '' as '     ';

SELECT 
  item_name as 'Item Name',
  quantity as 'Current Stock',
  min_stock as 'PAR Level (80%)',
  unit as 'Unit',
  CONCAT('₱', FORMAT(CAST(unit_price AS DECIMAL(10,2)), 2)) as 'Unit Price',
  CONCAT('₱', FORMAT(quantity * CAST(unit_price AS DECIMAL(10,2)), 2)) as 'Total Value',
  CASE 
    WHEN quantity <= min_stock THEN '⚠️ LOW STOCK'
    ELSE '✅ OK'
  END as 'Status'
FROM inventory_items 
WHERE category = 'Linens'
ORDER BY item_name;

-- Step 5: Show grand total
SELECT 
  'TOTAL INVENTORY' as 'Summary',
  COUNT(*) as 'Item Types',
  SUM(quantity) as 'Total Pieces',
  CONCAT('₱', FORMAT(SUM(quantity * CAST(unit_price AS DECIMAL(10,2))), 2)) as 'Total Value'
FROM inventory_items 
WHERE category = 'Linens';

SELECT '✅ SUCCESS! Consolidated linen inventory inserted.' as 'Result';
