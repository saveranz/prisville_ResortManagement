import { RequestHandler } from "express";
import db from "../db";
import { ResultSetHeader } from "mysql2";

// Delete linen inventory items (admin/receptionist only)
export const deleteLinenInventory: RequestHandler = async (req, res) => {
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

    console.log('🗑️ Starting linen inventory deletion...');

    // Get count before deletion
    const [beforeCount] = await db.query<any[]>(
      `SELECT COUNT(*) as count FROM inventory_items WHERE category = 'Linens'`
    );
    const itemsToDelete = beforeCount[0]?.count || 0;

    console.log(`📊 Found ${itemsToDelete} linen items to delete`);

    // Delete linen items
    const [result] = await db.query<ResultSetHeader>(
      `DELETE FROM inventory_items WHERE category = 'Linens'`
    );

    console.log(`✅ Deleted ${result.affectedRows} linen items`);

    // Get remaining count
    const [afterCount] = await db.query<any[]>(
      `SELECT COUNT(*) as count FROM inventory_items WHERE category = 'Linens'`
    );
    const remainingItems = afterCount[0]?.count || 0;

    res.json({ 
      success: true, 
      message: `Successfully deleted ${result.affectedRows} linen inventory items`,
      deletedCount: result.affectedRows,
      remainingLinenItems: remainingItems
    });
  } catch (error) {
    console.error('❌ Delete linen inventory error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to delete linen inventory',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};
