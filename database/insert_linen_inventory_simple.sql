-- Insert linen inventory records based on the provided data
-- Each row represents a separate inventory record

-- First, clear existing linen records to avoid duplicates
DELETE FROM inventory_items WHERE category = 'Linens';

-- Insert records row by row as shown in the image
-- Row 1: Towel=4, Pillow=4, Kumot=2, Bedsheet=2
INSERT INTO inventory_items (item_name, category, quantity, unit, unit_price) VALUES
('Towel', 'Linens', 4, 'pcs', '50.00');

INSERT INTO inventory_items (item_name, category, quantity, unit, unit_price) VALUES
('Pillow', 'Linens', 4, 'pcs', '100.00');

INSERT INTO inventory_items (item_name, category, quantity, unit, unit_price) VALUES
('Kumot', 'Linens', 2, 'pcs', '150.00');

INSERT INTO inventory_items (item_name, category, quantity, unit, unit_price) VALUES
('Bedsheet', 'Linens', 2, 'pcs', '120.00');

-- Row 2: Towel=4, Pillow=8, Kumot=2, Bedsheet=2
INSERT INTO inventory_items (item_name, category, quantity, unit, unit_price) VALUES
('Towel', 'Linens', 4, 'pcs', '50.00');

INSERT INTO inventory_items (item_name, category, quantity, unit, unit_price) VALUES
('Pillow', 'Linens', 8, 'pcs', '100.00');

INSERT INTO inventory_items (item_name, category, quantity, unit, unit_price) VALUES
('Kumot', 'Linens', 2, 'pcs', '150.00');

INSERT INTO inventory_items (item_name, category, quantity, unit, unit_price) VALUES
('Bedsheet', 'Linens', 2, 'pcs', '120.00');

-- Row 3: Pillow=11, Bedsheet=3
INSERT INTO inventory_items (item_name, category, quantity, unit, unit_price) VALUES
('Pillow', 'Linens', 11, 'pcs', '100.00');

INSERT INTO inventory_items (item_name, category, quantity, unit, unit_price) VALUES
('Bedsheet', 'Linens', 3, 'pcs', '120.00');

-- Row 4: Towel=4, Pillow=10, Kumot=3, Bedsheet=4
INSERT INTO inventory_items (item_name, category, quantity, unit, unit_price) VALUES
('Towel', 'Linens', 4, 'pcs', '50.00');

INSERT INTO inventory_items (item_name, category, quantity, unit, unit_price) VALUES
('Pillow', 'Linens', 10, 'pcs', '100.00');

INSERT INTO inventory_items (item_name, category, quantity, unit, unit_price) VALUES
('Kumot', 'Linens', 3, 'pcs', '150.00');

INSERT INTO inventory_items (item_name, category, quantity, unit, unit_price) VALUES
('Bedsheet', 'Linens', 4, 'pcs', '120.00');

-- Row 5: Pillow=10, Kumot=3, Bedsheet=3
INSERT INTO inventory_items (item_name, category, quantity, unit, unit_price) VALUES
('Pillow', 'Linens', 10, 'pcs', '100.00');

INSERT INTO inventory_items (item_name, category, quantity, unit, unit_price) VALUES
('Kumot', 'Linens', 3, 'pcs', '150.00');

INSERT INTO inventory_items (item_name, category, quantity, unit, unit_price) VALUES
('Bedsheet', 'Linens', 3, 'pcs', '120.00');

-- Row 6: Towel=4, Bedsheet=2
INSERT INTO inventory_items (item_name, category, quantity, unit, unit_price) VALUES
('Towel', 'Linens', 4, 'pcs', '50.00');

INSERT INTO inventory_items (item_name, category, quantity, unit, unit_price) VALUES
('Bedsheet', 'Linens', 2, 'pcs', '120.00');

-- Row 7: Kumot=5
INSERT INTO inventory_items (item_name, category, quantity, unit, unit_price) VALUES
('Kumot', 'Linens', 5, 'pcs', '150.00');

-- Row 8: Towel=8, Bedsheet=6
INSERT INTO inventory_items (item_name, category, quantity, unit, unit_price) VALUES
('Towel', 'Linens', 8, 'pcs', '50.00');

INSERT INTO inventory_items (item_name, category, quantity, unit, unit_price) VALUES
('Bedsheet', 'Linens', 6, 'pcs', '120.00');

-- Verify the inserted records
SELECT 
  'Summary by Item' as report_type,
  item_name,
  COUNT(*) as record_count,
  SUM(quantity) as total_quantity
FROM inventory_items 
WHERE category = 'Linens'
GROUP BY item_name
ORDER BY item_name;

-- Show total count
SELECT 
  'Total Records' as report_type,
  COUNT(*) as total_records,
  SUM(quantity) as total_items
FROM inventory_items 
WHERE category = 'Linens';

-- Verify the inserted records
SELECT 
  'Summary by Item' as report_type,
  item_name,
  COUNT(*) as record_count,
  SUM(quantity) as total_quantity
FROM inventory_items 
WHERE category = 'Linens'
GROUP BY item_name
ORDER BY item_name;

-- Show total count
SELECT 
  'Total Records' as report_type,
  COUNT(*) as total_records,
  SUM(quantity) as total_items
FROM inventory_items 
WHERE category = 'Linens';
