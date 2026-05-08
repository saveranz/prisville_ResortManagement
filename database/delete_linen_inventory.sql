-- Delete linen inventory items
-- This removes Towel, Pillow, Kumot, and Bedsheet from inventory

-- Show what will be deleted
SELECT 
  'Items to be deleted:' as 'Action',
  COUNT(*) as 'Count'
FROM inventory_items 
WHERE category = 'Linens';

SELECT 
  id,
  item_name,
  category,
  quantity,
  unit
FROM inventory_items 
WHERE category = 'Linens'
ORDER BY id;

-- Delete the linen items
DELETE FROM inventory_items WHERE category = 'Linens';

-- Verify deletion
SELECT 
  'Deletion complete!' as 'Status',
  COUNT(*) as 'Remaining Linen Items'
FROM inventory_items 
WHERE category = 'Linens';

-- Show remaining inventory
SELECT 
  'Remaining inventory items:' as 'Info',
  COUNT(*) as 'Total Items'
FROM inventory_items;
