-- Insert linen inventory records
-- This script adds the linen items (Towel, Pillow, Kumot, Bedsheet) with their quantities

-- First, let's check if these items already exist and delete them to avoid duplicates
DELETE FROM inventory_items WHERE item_name IN ('Towel', 'Pillow', 'Kumot', 'Bedsheet');

-- Insert the linen inventory records
INSERT INTO inventory_items (item_name, category, quantity, min_stock, unit, unit_price, supplier, created_at, updated_at) VALUES
-- Row 1
('Towel', 'Linens', 4, 5, 'pcs', 50.00, NULL, NOW(), NOW()),
('Pillow', 'Linens', 4, 5, 'pcs', 100.00, NULL, NOW(), NOW()),
('Kumot', 'Linens', 2, 3, 'pcs', 150.00, NULL, NOW(), NOW()),
('Bedsheet', 'Linens', 2, 3, 'pcs', 120.00, NULL, NOW(), NOW()),

-- Row 2
('Towel', 'Linens', 4, 5, 'pcs', 50.00, NULL, NOW(), NOW()),
('Pillow', 'Linens', 8, 5, 'pcs', 100.00, NULL, NOW(), NOW()),
('Kumot', 'Linens', 2, 3, 'pcs', 150.00, NULL, NOW(), NOW()),
('Bedsheet', 'Linens', 2, 3, 'pcs', 120.00, NULL, NOW(), NOW()),

-- Row 3
('Pillow', 'Linens', 11, 5, 'pcs', 100.00, NULL, NOW(), NOW()),
('Bedsheet', 'Linens', 3, 3, 'pcs', 120.00, NULL, NOW(), NOW()),

-- Row 4
('Towel', 'Linens', 4, 5, 'pcs', 50.00, NULL, NOW(), NOW()),
('Pillow', 'Linens', 10, 5, 'pcs', 100.00, NULL, NOW(), NOW()),
('Kumot', 'Linens', 3, 3, 'pcs', 150.00, NULL, NOW(), NOW()),
('Bedsheet', 'Linens', 4, 3, 'pcs', 120.00, NULL, NOW(), NOW()),

-- Row 5
('Pillow', 'Linens', 10, 5, 'pcs', 100.00, NULL, NOW(), NOW()),
('Kumot', 'Linens', 3, 3, 'pcs', 150.00, NULL, NOW(), NOW()),
('Bedsheet', 'Linens', 3, 3, 'pcs', 120.00, NULL, NOW(), NOW()),

-- Row 6
('Towel', 'Linens', 4, 5, 'pcs', 50.00, NULL, NOW(), NOW()),
('Bedsheet', 'Linens', 2, 3, 'pcs', 120.00, NULL, NOW(), NOW()),

-- Row 7
('Kumot', 'Linens', 5, 3, 'pcs', 150.00, NULL, NOW(), NOW()),

-- Row 8
('Towel', 'Linens', 8, 5, 'pcs', 50.00, NULL, NOW(), NOW()),
('Bedsheet', 'Linens', 6, 3, 'pcs', 120.00, NULL, NOW(), NOW());

-- Verify the inserted records
SELECT 
  item_name,
  COUNT(*) as record_count,
  SUM(quantity) as total_quantity,
  GROUP_CONCAT(quantity ORDER BY id SEPARATOR ', ') as quantities
FROM inventory_items 
WHERE item_name IN ('Towel', 'Pillow', 'Kumot', 'Bedsheet')
GROUP BY item_name
ORDER BY item_name;

-- Show all records
SELECT * FROM inventory_items 
WHERE item_name IN ('Towel', 'Pillow', 'Kumot', 'Bedsheet')
ORDER BY id;
