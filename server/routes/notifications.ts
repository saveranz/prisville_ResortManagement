import { RequestHandler } from "express";
import db from "../db";
import { RowDataPacket, ResultSetHeader } from "mysql2";

// Get notifications for current user
export const getUserNotifications: RequestHandler = async (req, res) => {
  const userId = req.query.userId as string;
  const unreadOnly = req.query.unreadOnly === 'true';
  const limit = parseInt(req.query.limit as string) || 50;

  if (!userId) {
    return res.status(400).json({ error: "User ID is required" });
  }

  try {
    let query = `
      SELECT 
        id,
        type,
        title,
        message,
        link,
        is_read,
        related_booking_id,
        related_booking_type,
        priority,
        created_at,
        read_at
      FROM notifications
      WHERE user_id = ?
    `;

    if (unreadOnly) {
      query += ` AND is_read = FALSE`;
    }

    query += ` ORDER BY created_at DESC LIMIT ?`;

    const [notifications] = await db.query<RowDataPacket[]>(query, [userId, limit]);

    res.json({ notifications });
  } catch (error) {
    console.error("Error fetching notifications:", error);
    res.status(500).json({ error: "Failed to fetch notifications" });
  }
};

// Get unread notification count
export const getUnreadCount: RequestHandler = async (req, res) => {
  const userId = req.query.userId as string;

  if (!userId) {
    return res.status(400).json({ error: "User ID is required" });
  }

  try {
    const [result] = await db.query<RowDataPacket[]>(
      `SELECT COUNT(*) as count FROM notifications WHERE user_id = ? AND is_read = FALSE`,
      [userId]
    );

    res.json({ count: result[0].count });
  } catch (error) {
    console.error("Error fetching unread count:", error);
    res.status(500).json({ error: "Failed to fetch unread count" });
  }
};

// Mark notification as read
export const markAsRead: RequestHandler = async (req, res) => {
  const { notificationId } = req.params;
  const userId = req.body.userId;

  if (!userId) {
    return res.status(400).json({ error: "User ID is required" });
  }

  try {
    const [result] = await db.query<ResultSetHeader>(
      `UPDATE notifications 
       SET is_read = TRUE, read_at = NOW() 
       WHERE id = ? AND user_id = ?`,
      [notificationId, userId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Notification not found" });
    }

    res.json({ success: true });
  } catch (error) {
    console.error("Error marking notification as read:", error);
    res.status(500).json({ error: "Failed to mark notification as read" });
  }
};

// Mark all notifications as read
export const markAllAsRead: RequestHandler = async (req, res) => {
  const userId = req.body.userId;

  if (!userId) {
    return res.status(400).json({ error: "User ID is required" });
  }

  try {
    await db.query(
      `UPDATE notifications 
       SET is_read = TRUE, read_at = NOW() 
       WHERE user_id = ? AND is_read = FALSE`,
      [userId]
    );

    res.json({ success: true });
  } catch (error) {
    console.error("Error marking all notifications as read:", error);
    res.status(500).json({ error: "Failed to mark all notifications as read" });
  }
};

// Create a notification (internal helper - can also be called via API)
export const createNotification: RequestHandler = async (req, res) => {
  const {
    userId,
    type,
    title,
    message,
    link,
    relatedBookingId,
    relatedBookingType,
    priority = "normal"
  } = req.body;

  if (!userId || !type || !title || !message) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  try {
    const [result] = await db.query<ResultSetHeader>(
      `INSERT INTO notifications 
       (user_id, type, title, message, link, related_booking_id, related_booking_type, priority)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [userId, type, title, message, link || null, relatedBookingId || null, relatedBookingType || null, priority]
    );

    res.json({ 
      success: true, 
      notificationId: result.insertId 
    });
  } catch (error) {
    console.error("Error creating notification:", error);
    res.status(500).json({ error: "Failed to create notification" });
  }
};

// Delete a notification
export const deleteNotification: RequestHandler = async (req, res) => {
  const { notificationId } = req.params;
  const userId = req.body.userId;

  if (!userId) {
    return res.status(400).json({ error: "User ID is required" });
  }

  try {
    const [result] = await db.query<ResultSetHeader>(
      `DELETE FROM notifications WHERE id = ? AND user_id = ?`,
      [notificationId, userId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Notification not found" });
    }

    res.json({ success: true });
  } catch (error) {
    console.error("Error deleting notification:", error);
    res.status(500).json({ error: "Failed to delete notification" });
  }
};

// Helper function to send notification to user (can be called from other routes)
export async function sendNotificationToUser(
  userId: number,
  type: string,
  title: string,
  message: string,
  options: {
    link?: string;
    relatedBookingId?: number;
    relatedBookingType?: string;
    priority?: string;
  } = {}
) {
  try {
    await db.query(
      `INSERT INTO notifications 
       (user_id, type, title, message, link, related_booking_id, related_booking_type, priority)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        userId,
        type,
        title,
        message,
        options.link || null,
        options.relatedBookingId || null,
        options.relatedBookingType || null,
        options.priority || "normal"
      ]
    );
    return true;
  } catch (error) {
    console.error("Error sending notification:", error);
    return false;
  }
}
