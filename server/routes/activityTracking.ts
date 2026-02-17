import { RequestHandler } from "express";
import db from "../db";
import { ResultSetHeader, RowDataPacket } from "mysql2";

interface ActivityData {
  activityType: 'view_room' | 'view_amenity' | 'view_daypass' | 'click_book' | 'search' | 'filter';
  itemType?: string;
  itemName?: string;
  timeSpent?: number;
  additionalData?: any;
}

// Track user activity
export const trackActivity: RequestHandler = async (req, res) => {
  try {
    const { activityType, itemType, itemName, timeSpent, additionalData }: ActivityData = req.body;

    if (!activityType) {
      res.status(400).json({
        success: false,
        message: 'Activity type is required'
      });
      return;
    }

    const userId = req.session.userId || null;
    const sessionId = req.sessionID;

    console.log('📊 Tracking activity:', {
      userId,
      sessionId: sessionId.substring(0, 8) + '...',
      activityType,
      itemType,
      itemName,
      timeSpent
    });

    await db.query(
      `INSERT INTO user_activity_tracking 
       (user_id, session_id, activity_type, item_type, item_name, time_spent, additional_data)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        userId,
        sessionId,
        activityType,
        itemType || null,
        itemName || null,
        timeSpent || 0,
        additionalData ? JSON.stringify(additionalData) : null
      ]
    );

    res.json({
      success: true,
      message: 'Activity tracked successfully'
    });
  } catch (error) {
    console.error('Track activity error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to track activity'
    });
  }
};

// Get user activity history
export const getUserActivity: RequestHandler = async (req, res) => {
  try {
    if (!req.session.userId) {
      res.status(401).json({
        success: false,
        message: 'Not authenticated'
      });
      return;
    }

    const limit = parseInt(req.query.limit as string) || 50;

    const [activities] = await db.query<RowDataPacket[]>(
      `SELECT * FROM user_activity_tracking
       WHERE user_id = ?
       ORDER BY created_at DESC
       LIMIT ?`,
      [req.session.userId, limit]
    );

    res.json({
      success: true,
      activities
    });
  } catch (error) {
    console.error('Get user activity error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get activity'
    });
  }
};

// Get activity statistics for a user
export const getUserActivityStats: RequestHandler = async (req, res) => {
  try {
    if (!req.session.userId) {
      res.status(401).json({
        success: false,
        message: 'Not authenticated'
      });
      return;
    }

    // Get most viewed room types
    const [viewedRooms] = await db.query<RowDataPacket[]>(
      `SELECT item_type, item_name, COUNT(*) as view_count, SUM(time_spent) as total_time
       FROM user_activity_tracking
       WHERE user_id = ? AND activity_type = 'view_room' AND item_type IS NOT NULL
       GROUP BY item_type, item_name
       ORDER BY view_count DESC, total_time DESC
       LIMIT 10`,
      [req.session.userId]
    );

    // Get most viewed amenities
    const [viewedAmenities] = await db.query<RowDataPacket[]>(
      `SELECT item_type, item_name, COUNT(*) as view_count, SUM(time_spent) as total_time
       FROM user_activity_tracking
       WHERE user_id = ? AND activity_type = 'view_amenity' AND item_type IS NOT NULL
       GROUP BY item_type, item_name
       ORDER BY view_count DESC, total_time DESC
       LIMIT 10`,
      [req.session.userId]
    );

    // Get day pass interest
    const [dayPassViews] = await db.query<RowDataPacket[]>(
      `SELECT COUNT(*) as view_count, SUM(time_spent) as total_time
       FROM user_activity_tracking
       WHERE user_id = ? AND activity_type = 'view_daypass'`,
      [req.session.userId]
    );

    // Get recent activity summary
    const [recentActivity] = await db.query<RowDataPacket[]>(
      `SELECT activity_type, COUNT(*) as count
       FROM user_activity_tracking
       WHERE user_id = ? AND created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
       GROUP BY activity_type`,
      [req.session.userId]
    );

    res.json({
      success: true,
      stats: {
        viewedRooms,
        viewedAmenities,
        dayPassViews: dayPassViews[0] || { view_count: 0, total_time: 0 },
        recentActivity
      }
    });
  } catch (error) {
    console.error('Get activity stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get activity stats'
    });
  }
};
