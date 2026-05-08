-- Simple version: Insert consolidated linen inventory
-- Run this if you already have the min_stock column, or if you want to skip the ALTER TABLE step

-- Step 1: Clear existing linen records to avoid duplicates
DELETE FROM inventory_items WHERE category = 'Linens';

-- Step 2: Insert consolidated linen inventory records
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

-- Step 3: Verify the inserted records
SELECT 
  item_name as 'Item Name',
  quantity as 'Current Stock',
  min_stock as 'PAR Level',
  unit as 'Unit',
  CONCAT('₱', FORMAT(CAST(unit_price AS DECIMAL(10,2)), 2)) as 'Unit Price',
  CONCAT('₱', FORMAT(quantity * CAST(unit_price AS DECIMAL(10,2)), 2)) as 'Total Value'
FROM inventory_items 
WHERE category = 'Linens'
ORDER BY item_name;

-- Step 4: Show grand total
SELECT 
  'TOTAL' as 'Summary',
  COUNT(*) as 'Items',
  SUM(quantity) as 'Total Pcs',
  CONCAT('₱', FORMAT(SUM(quantity * CAST(unit_price AS DECIMAL(10,2))), 2)) as 'Total Value'
FROM inventory_items 
WHERE category = 'Linens';
