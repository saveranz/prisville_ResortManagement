import { RequestHandler } from "express";
import db from "../db";
import { ResultSetHeader } from "mysql2";

// Temporary endpoint to insert linen inventory data
// DELETE THIS FILE after data is inserted!
export const insertLinenInventory: RequestHandler = async (req, res) => {
  try {
    // Only allow admin or receptionist to run this
    if (!req.session.userId || (req.session.userRole !== 'admin' && req.session.userRole !== 'receptionist')) {
      res.status(403).json({ 
        success: false, 
        message: 'Admin or receptionist access required' 
      });
      return;
    }

    const linenItems = [
      { name: 'Towel', quantity: 4, minStock: 10, unit: 'pcs', price: '50.00' },
      { name: 'Pillow', quantity: 4, minStock: 15, unit: 'pcs', price: '150.00' },
      { name: 'Kumot', quantity: 2, minStock: 10, unit: 'pcs', price: '200.00' },
      { name: 'Bedsheet', quantity: 2, minStock: 12, unit: 'pcs', price: '180.00' }
    ];

    console.log('🔄 Starting linen inventory insertion...');
    console.log(`📊 Total items to insert: ${linenItems.length}`);
    
    let successCount = 0;
    let errorCount = 0;
    const errors: string[] = [];
    
    for (const item of linenItems) {
      try {
        await db.query(
          `INSERT INTO inventory_items 
          (item_name, category, quantity, min_stock, unit, unit_price, created_at) 
          VALUES (?, 'Linens', ?, ?, ?, ?, NOW())`,
          [item.name, item.quantity, item.minStock, item.unit, item.price]
        );
        successCount++;
        console.log(`✅ Inserted: ${item.name} (Qty: ${item.quantity})`);
      } catch (error) {
        errorCount++;
        const errorMsg = `Failed to insert ${item.name}: ${error instanceof Error ? error.message : 'Unknown error'}`;
        console.error(`❌ ${errorMsg}`);
        errors.push(errorMsg);
      }
    }
    
    console.log('\n📊 Summary:');
    console.log(`   ✅ Successfully inserted: ${successCount}`);
    console.log(`   ❌ Failed: ${errorCount}`);
    
    res.json({ 
      success: true, 
      message: `Inserted ${successCount} out of ${linenItems.length} linen items`,
      successCount,
      errorCount,
      errors: errors.length > 0 ? errors : undefined
    });
  } catch (error) {
    console.error('❌ Fatal error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to insert linen inventory',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};
