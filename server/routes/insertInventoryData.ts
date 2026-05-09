import { RequestHandler } from "express";
import db from "../db";

// Insert inventory data (admin only)
export const insertInventoryData: RequestHandler = async (req, res) => {
  try {
    // Check if user is admin
    if (!req.session.userId || req.session.userRole !== 'admin') {
      res.status(403).json({ 
        success: false, 
        message: 'Unauthorized - Admin only' 
      });
      return;
    }

    // Inventory data - all columns nullable except item_name, category, quantity, unit
    const inventoryItems = [
      // Linens
      ['Bedsheet', 'Linens', 22, 'pcs', '120.00', 18, 'N/A', null],
      ['Kumot', 'Linens', 15, 'pcs', '150.00', 12, 'N/A', null],
      ['Pillow', 'Linens', 53, 'pcs', '100.00', 42, 'N/A', null],
      ['Towel', 'Linens', 24, 'pcs', '50.00', 20, 'N/A', null],
      
      // Office
      ['Ballpoint Pens', 'Office', 25, 'pcs', '0.00', 10, 'National Bookstore', null],
      ['Printer Paper (A4)', 'Office', 8, 'reams', '0.00', 5, 'National Bookstore', null],
      
      // Kitchen
      ['Creamer Sachets', 'Kitchen', 9, 'pcs', '0.00', 40, 'Nestle Dist.', '2026-07-20'],
      ['Sugar Packets', 'Kitchen', 180, 'pcs', '0.00', 50, 'Metro Supplies', '2027-04-15'],
      ['Bottled Water (500ml)', 'Kitchen', 200, 'bottles', '0.00', 60, 'Metro Supplies', '2026-10-01'],
      ['Coffee Sachets', 'Kitchen', 10, 'pcs', '0.00', 40, 'Nestle Dist.', '2026-05-10'],
      ['Paper Cups', 'Kitchen', 150, 'pcs', '0.00', 50, 'Metro Supplies', null],
      
      // Maintenance
      ['Extension Cord', 'Maintenance', 6, 'pcs', '0.00', 2, 'Ace Hardware', null],
      ['Faucet Washers', 'Maintenance', 20, 'pcs', '0.00', 10, 'Ace Hardware', null],
      ['Light Bulbs (LED)', 'Maintenance', 30, 'pcs', '0.00', 10, 'Ace Hardware', null],
      
      // Pool
      ['Pool Skimmer Net', 'Pool', 4, 'pcs', '0.00', 2, 'Pool Chem Inc.', null],
      ['pH Test Kit', 'Pool', 8, 'kits', '0.00', 3, 'Pool Chem Inc.', '2027-02-28'],
      ['Chlorine Tablets', 'Pool', 5, 'kg', '0.00', 10, 'Pool Chem Inc.', '2026-08-15'],
      
      // Cleaning
      ['Trash Bags (Large)', 'Cleaning', 3, 'packs', '0.00', 20, 'Metro Supplies', null],
      ['Glass Cleaner', 'Cleaning', 15, 'bottles', '0.00', 5, 'CleanPro PH', '2026-11-30'],
      ['Floor Disinfectant', 'Cleaning', 18, 'gallons', '0.00', 8, 'CleanPro PH', '2027-03-20']
    ];

    let inserted = 0;
    for (const item of inventoryItems) {
      try {
        await db.query(
          `INSERT INTO inventory_items (item_name, category, quantity, unit, unit_price, min_stock, supplier, expiry_date) 
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          item
        );
        inserted++;
      } catch (error) {
        console.error('Error inserting inventory item:', error);
      }
    }

    // Get final count
    const [count] = await db.query('SELECT COUNT(*) as count FROM inventory_items');
    const total = (count as any)[0].count;

    res.json({ 
      success: true, 
      message: 'Inventory data inserted successfully',
      inserted,
      total
    });
  } catch (error) {
    console.error('Insert inventory data error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to insert inventory data',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};
