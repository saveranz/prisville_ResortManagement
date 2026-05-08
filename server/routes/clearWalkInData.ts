import { RequestHandler } from "express";
import db from "../db";

// Clear all walk-in data (admin only - use with caution!)
export const clearAllWalkInData: RequestHandler = async (req, res) => {
  try {
    // Check if user is admin
    if (!req.session.userId || req.session.userRole !== 'admin') {
      res.status(403).json({ 
        success: false, 
        message: 'Unauthorized - Admin only' 
      });
      return;
    }

    // Disable foreign key checks
    await db.query('SET FOREIGN_KEY_CHECKS = 0');

    // Delete all walk-in bookings
    await db.query('DELETE FROM walk_in_bookings');
    
    // Delete all day pass walk-ins
    await db.query('DELETE FROM day_pass_walk_in');

    // Reset auto increment
    await db.query('ALTER TABLE walk_in_bookings AUTO_INCREMENT = 1');
    await db.query('ALTER TABLE day_pass_walk_in AUTO_INCREMENT = 1');

    // Re-enable foreign key checks
    await db.query('SET FOREIGN_KEY_CHECKS = 1');

    // Get counts to verify
    const [walkInCount] = await db.query('SELECT COUNT(*) as count FROM walk_in_bookings');
    const [dayPassCount] = await db.query('SELECT COUNT(*) as count FROM day_pass_walk_in');

    res.json({ 
      success: true, 
      message: 'All walk-in data cleared successfully',
      walkInCount: (walkInCount as any)[0].count,
      dayPassCount: (dayPassCount as any)[0].count
    });
  } catch (error) {
    console.error('Clear walk-in data error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to clear data',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};
