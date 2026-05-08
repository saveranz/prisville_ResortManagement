import { RequestHandler } from "express";
import db from "../db";
import { ResultSetHeader } from "mysql2";

// Insert linen inventory records (admin/receptionist only)
export const insertLinenInventory: RequestHandler = async (req, res) => {
  try {
    // Check if user is logged in and is admin or receptionist
    if (!req.session.userId) {
      res.status(401).json({ 
        success: false, 
        message: 'Please login' 
      });
      return;
    }

    if (req.session.userRole !== 'admin' && req.session.userRole !== 'receptionist') {
      res.status(403).json({ 
        success: false, 
        message: 'Access denied. Admin or receptionist privileges required.' 
      });
      return;
    }

    console.log('📦 Starting linen inventory insertion...');

    // First, delete existing linen records to avoid duplicates
    await db.query(`DELETE FROM inventory_items WHERE category = 'Linens'`);
    console.log('🗑️ Cleared existing linen records');

    // Define the linen records based on the image
    const linenRecords = [
      // Row 1
      { item_name: 'Towel', quantity: 4, min_stock: 5, unit_price: 50.00 },
      { item_name: 'Pillow', quantity: 4, min_stock: 5, unit_price: 100.00 },
      { item_name: 'Kumot', quantity: 2, min_stock: 3, unit_price: 150.00 },
      { item_name: 'Bedsheet', quantity: 2, min_stock: 3, unit_price: 120.00 },
      
      // Row 2
      { item_name: 'Towel', quantity: 4, min_stock: 5, unit_price: 50.00 },
      { item_name: 'Pillow', quantity: 8, min_stock: 5, unit_price: 100.00 },
      { item_name: 'Kumot', quantity: 2, min_stock: 3, unit_price: 150.00 },
      { item_name: 'Bedsheet', quantity: 2, min_stock: 3, unit_price: 120.00 },
      
      // Row 3
      { item_name: 'Pillow', quantity: 11, min_stock: 5, unit_price: 100.00 },
      { item_name: 'Bedsheet', quantity: 3, min_stock: 3, unit_price: 120.00 },
      
      // Row 4
      { item_name: 'Towel', quantity: 4, min_stock: 5, unit_price: 50.00 },
      { item_name: 'Pillow', quantity: 10, min_stock: 5, unit_price: 100.00 },
      { item_name: 'Kumot', quantity: 3, min_stock: 3, unit_price: 150.00 },
      { item_name: 'Bedsheet', quantity: 4, min_stock: 3, unit_price: 120.00 },
      
      // Row 5
      { item_name: 'Pillow', quantity: 10, min_stock: 5, unit_price: 100.00 },
      { item_name: 'Kumot', quantity: 3, min_stock: 3, unit_price: 150.00 },
      { item_name: 'Bedsheet', quantity: 3, min_stock: 3, unit_price: 120.00 },
      
      // Row 6
      { item_name: 'Towel', quantity: 4, min_stock: 5, unit_price: 50.00 },
      { item_name: 'Bedsheet', quantity: 2, min_stock: 3, unit_price: 120.00 },
      
      // Row 7
      { item_name: 'Kumot', quantity: 5, min_stock: 3, unit_price: 150.00 },
      
      // Row 8
      { item_name: 'Towel', quantity: 8, min_stock: 5, unit_price: 50.00 },
      { item_name: 'Bedsheet', quantity: 6, min_stock: 3, unit_price: 120.00 },
    ];

    let successCount = 0;
    let errorCount = 0;

    // Insert each record
    for (const record of linenRecords) {
      try {
        await db.query<ResultSetHeader>(
          `INSERT INTO inventory_items 
          (item_name, category, quantity, min_stock, unit, unit_price, supplier) 
          VALUES (?, 'Linens', ?, ?, 'pcs', ?, NULL)`,
          [record.item_name, record.quantity, record.min_stock, record.unit_price]
        );
        successCount++;
      } catch (error) {
        console.error(`❌ Error inserting ${record.item_name}:`, error);
        errorCount++;
      }
    }

    console.log(`✅ Inserted ${successCount} out of ${linenRecords.length} records`);

    // Get summary
    const [summary] = await db.query(`
      SELECT 
        item_name,
        COUNT(*) as record_count,
        SUM(quantity) as total_quantity
      FROM inventory_items 
      WHERE category = 'Linens'
      GROUP BY item_name
      ORDER BY item_name
    `);

    res.json({ 
      success: true, 
      message: `Inserted ${successCount} out of ${linenRecords.length} records`,
      successCount,
      errorCount,
      summary
    });
  } catch (error) {
    console.error('❌ Insert linen inventory error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to insert linen inventory',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};
