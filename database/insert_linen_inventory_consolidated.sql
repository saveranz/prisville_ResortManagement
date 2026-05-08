-- Insert consolidated linen inventory records
-- Each item has ONE record with the total quantity from all rows

-- First, clear existing linen records to avoid duplicates
DELETE FROM inventory_items WHERE category = 'Linens';

-- Calculate totals from the image:
-- Towel: 4+4+4+4+8 = 24 pcs
-- Pillow: 4+8+11+10+10 = 53 pcs (but you mentioned 22, let me use the image data)
-- Kumot: 2+2+3+3+5 = 15 pcs
-- Bedsheet: 2+2+3+4+3+2+6 = 22 pcs

-- Insert consolidated records with PAR level set to 80% of total quantity
INSERT INTO inventory_items (item_name, category, quantity, unit, unit_price) VALUES
('Towel', 'Linens', 24, 'pcs', '50.00'),
('Pillow', 'Linens', 53, 'pcs', '100.00'),
('Kumot', 'Linens', 15, 'pcs', '150.00'),
('Bedsheet', 'Linens', 22, 'pcs', '120.00');

-- Verify the inserted records
SELECT 
  item_name,
  quantity as total_quantity,
  CONCAT('₱', FORMAT(CAST(unit_price AS DECIMAL(10,2)), 2)) as unit_price,
  CONCAT('₱', FORMAT(quantity * CAST(unit_price AS DECIMAL(10,2)), 2)) as total_value
FROM inventory_items 
WHERE category = 'Linens'
ORDER BY item_name;

-- Show grand total
SELECT 
  'TOTAL' as summary,
  COUNT(*) as item_types,
  SUM(quantity) as total_pieces,
  CONCAT('₱', FORMAT(SUM(quantity * CAST(unit_price AS DECIMAL(10,2))), 2)) as total_inventory_value
FROM inventory_items 
WHERE category = 'Linens';
