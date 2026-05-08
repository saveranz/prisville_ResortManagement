-- Insert linen inventory items
-- Clear existing linen items first (optional)
-- DELETE FROM inventory_items WHERE category = 'Linens';

-- Insert Towels
INSERT INTO inventory_items (item_name, category, quantity, min_stock, unit, unit_price, supplier, created_at) 
VALUES ('Towel', 'Linens', 4, 10, 'pcs', '50.00', NULL, NOW());

-- Insert Pillows  
INSERT INTO inventory_items (item_name, category, quantity, min_stock, unit, unit_price, supplier, created_at) 
VALUES ('Pillow', 'Linens', 4, 15, 'pcs', '150.00', NULL, NOW());

-- Insert Kumot (Blankets)
INSERT INTO inventory_items (item_name, category, quantity, min_stock, unit, unit_price, supplier, created_at) 
VALUES ('Kumot', 'Linens', 2, 10, 'pcs', '200.00', NULL, NOW());

-- Insert Bedsheets
INSERT INTO inventory_items (item_name, category, quantity, min_stock, unit, unit_price, supplier, created_at) 
VALUES ('Bedsheet', 'Linens', 2, 12, 'pcs', '180.00', NULL, NOW());

-- Verify the inserted data
SELECT * FROM inventory_items WHERE category = 'Linens' ORDER BY item_name;
