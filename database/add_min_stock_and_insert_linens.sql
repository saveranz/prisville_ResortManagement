-- Step 1: Add min_stock column to inventory_items table
-- Note: If you get error "Duplicate column name 'min_stock'", that's OK - it means the column already exists
-- You can ignore that error and continue with the rest of the script
ALTER TABLE inventory_items 
ADD COLUMN min_stock INT DEFAULT 0 AFTER quantity;

-- Step 2: Clear existing linen records to avoid duplicates
DELETE FROM inventory_items WHERE category = 'Linens';

-- Step 3: Insert consolidated linen inventory records
-- Based on your data, totals are:
-- Towel: 24 pcs (PAR level: 20 = 80% of 24, rounded)
-- Pillow: 53 pcs (PAR level: 42 = 80% of 53, rounded)
-- Kumot: 15 pcs (PAR level: 12 = 80% of 15, rounded)
-- Bedsheet: 22 pcs (PAR level: 18 = 80% of 22, rounded)

INSERT INTO inventory_items (item_name, category, quantity, min_stock, unit, unit_price) VALUES
('Towel', 'Linens', 24, 20, 'pcs', '50.00'),
('Pillow', 'Linens', 53, 42, 'pcs', '100.00'),
('Kumot', 'Linens', 15, 12, 'pcs', '150.00'),
('Bedsheet', 'Linens', 22, 18, 'pcs', '120.00');

-- Step 4: Verify the inserted records
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
