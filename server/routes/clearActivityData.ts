import { RequestHandler } from "express";
import db from "../db";
import { insertAuditLog } from "./auditLog";

// Clear old activity tracking data (admin only)
export const clearActivityData: RequestHandler = async (req, res) => {
  try {
    // Check if user is admin
    if (!req.session.userId || req.session.userRole !== 'admin') {
      res.status(403).json({ 
        success: false, 
        message: 'Admin access required' 
      });
      return;
    }

    const { daysToKeep } = req.body;
    const days = parseInt(daysToKeep) || 30; // Default: keep last 30 days

    const connection = await db.getConnection();

    try {
      // Get count before deletion
      const [beforeCount] = await connection.query(
        'SELECT COUNT(*) as count FROM user_activity_tracking'
      );

      // Delete old activity data
      const [result] = await connection.query(
        `DELETE FROM user_activity_tracking 
         WHERE created_at < DATE_SUB(NOW(), INTERVAL ? DAY)`,
        [days]
      );

      // Get count after deletion
      const [afterCount] = await connection.query(
        'SELECT COUNT(*) as count FROM user_activity_tracking'
      );

      const deletedCount = (beforeCount as any)[0].count - (afterCount as any)[0].count;

      connection.release();

      // Log the action
      await insertAuditLog(
        req.session.userId,
        req.session.userName || 'Admin',
        'CLEAR_ACTIVITY_DATA',
        'user_activity_tracking',
        null,
        `Cleared ${deletedCount} activity records older than ${days} days`,
        req.ip || ''
      );

      res.json({ 
        success: true,
        message: `Successfully cleared ${deletedCount} old activity records`,
        deletedCount,
        remainingCount: (afterCount as any)[0].count,
        daysKept: days
      });
    } catch (error) {
      connection.release();
      throw error;
    }
  } catch (error) {
    console.error('Clear activity data error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to clear activity data',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

// Get activity data statistics (admin only)
export const getActivityStats: RequestHandler = async (req, res) => {
  try {
    // Check if user is admin
    if (!req.session.userId || req.session.userRole !== 'admin') {
      res.status(403).json({ 
        success: false, 
        message: 'Admin access required' 
      });
      return;
    }

    const connection = await db.getConnection();

    try {
      // Total records
      const [totalCount] = await connection.query(
        'SELECT COUNT(*) as count FROM user_activity_tracking'
      );

      // Records by age
      const [last7Days] = await connection.query(
        'SELECT COUNT(*) as count FROM user_activity_tracking WHERE created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)'
      );
      const [last30Days] = await connection.query(
        'SELECT COUNT(*) as count FROM user_activity_tracking WHERE created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)'
      );
      const [last90Days] = await connection.query(
        'SELECT COUNT(*) as count FROM user_activity_tracking WHERE created_at >= DATE_SUB(NOW(), INTERVAL 90 DAY)'
      );
      const [older90Days] = await connection.query(
        'SELECT COUNT(*) as count FROM user_activity_tracking WHERE created_at < DATE_SUB(NOW(), INTERVAL 90 DAY)'
      );

      // Oldest and newest records
      const [oldestRecord] = await connection.query(
        'SELECT created_at FROM user_activity_tracking ORDER BY created_at ASC LIMIT 1'
      );
      const [newestRecord] = await connection.query(
        'SELECT created_at FROM user_activity_tracking ORDER BY created_at DESC LIMIT 1'
      );

      // Activity type breakdown
      const [activityTypes] = await connection.query(
        `SELECT activity_type, COUNT(*) as count 
         FROM user_activity_tracking 
         GROUP BY activity_type 
         ORDER BY count DESC`
      );

      connection.release();

      res.json({ 
        success: true,
        stats: {
          total: (totalCount as any)[0].count,
          last7Days: (last7Days as any)[0].count,
          last30Days: (last30Days as any)[0].count,
          last90Days: (last90Days as any)[0].count,
          older90Days: (older90Days as any)[0].count,
          oldestRecord: (oldestRecord as any)[0]?.created_at || null,
          newestRecord: (newestRecord as any)[0]?.created_at || null,
          activityTypes
        }
      });
    } catch (error) {
      connection.release();
      throw error;
    }
  } catch (error) {
    console.error('Get activity stats error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to get activity statistics',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};
