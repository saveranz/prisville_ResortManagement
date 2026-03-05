import { RequestHandler } from "express";
import db from "../db";
import { RowDataPacket, ResultSetHeader } from "mysql2";
import { sendNotificationToUser } from "./notifications";

// Get active announcements for user
export const getAnnouncements: RequestHandler = async (req, res) => {
  const userId = req.query.userId as string;
  const userRole = req.query.userRole as string;

  try {
    const now = new Date();
    
    let query = `
      SELECT 
        a.id,
        a.title,
        a.content,
        a.target_audience,
        a.start_date,
        a.end_date,
        a.priority,
        a.banner_color,
        a.icon,
        a.created_at,
        a.views_count,
        u.name as created_by_name,
        CASE WHEN av.id IS NOT NULL THEN TRUE ELSE FALSE END as is_viewed
      FROM announcements a
      LEFT JOIN users u ON a.created_by = u.id
      LEFT JOIN announcement_views av ON a.id = av.announcement_id AND av.user_id = ?
      WHERE a.is_active = TRUE
        AND a.start_date <= NOW()
        AND (a.end_date IS NULL OR a.end_date >= NOW())
    `;

    const params: any[] = [userId];

    // Filter by target audience
    if (userRole) {
      query += ` AND (a.target_audience = 'all' OR a.target_audience = ?)`;
      params.push(userRole === 'client' ? 'clients' : 'staff');
    }

    query += ` ORDER BY a.priority DESC, a.created_at DESC`;

    const [announcements] = await db.query<RowDataPacket[]>(query, params);

    // Parse target_user_ids from JSON if present
    const formattedAnnouncements = announcements.map(a => ({
      ...a,
      target_user_ids: a.target_user_ids ? JSON.parse(a.target_user_ids) : null,
      is_viewed: Boolean(a.is_viewed)
    }));

    res.json({ announcements: formattedAnnouncements });
  } catch (error) {
    console.error("Error fetching announcements:", error);
    res.status(500).json({ error: "Failed to fetch announcements" });
  }
};

// Get all announcements (admin only)
export const getAllAnnouncements: RequestHandler = async (req, res) => {
  try {
    const [announcements] = await db.query<RowDataPacket[]>(`
      SELECT 
        a.id,
        a.title,
        a.content,
        a.target_audience,
        a.target_user_ids,
        a.start_date,
        a.end_date,
        a.is_active,
        a.priority,
        a.banner_color,
        a.icon,
        a.created_at,
        a.updated_at,
        a.views_count,
        u.name as created_by_name,
        u.email as created_by_email
      FROM announcements a
      LEFT JOIN users u ON a.created_by = u.id
      ORDER BY a.created_at DESC
    `);

    // Parse target_user_ids from JSON
    const formattedAnnouncements = announcements.map(a => ({
      ...a,
      target_user_ids: a.target_user_ids ? JSON.parse(a.target_user_ids) : null
    }));

    res.json({ announcements: formattedAnnouncements });
  } catch (error) {
    console.error("Error fetching all announcements:", error);
    res.status(500).json({ error: "Failed to fetch announcements" });
  }
};

// Create announcement (admin only)
export const createAnnouncement: RequestHandler = async (req, res) => {
  const {
    title,
    content,
    targetAudience = "all",
    targetUserIds = null,
    startDate = new Date(),
    endDate = null,
    priority = "normal",
    bannerColor = "#3b82f6",
    icon = "info",
    createdBy,
    notifyUsers = true
  } = req.body;

  if (!title || !content || !createdBy) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  try {
    const [result] = await db.query<ResultSetHeader>(
      `INSERT INTO announcements 
       (title, content, target_audience, target_user_ids, start_date, end_date, 
        priority, banner_color, icon, created_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        title,
        content,
        targetAudience,
        targetUserIds ? JSON.stringify(targetUserIds) : null,
        startDate,
        endDate,
        priority,
        bannerColor,
        icon,
        createdBy
      ]
    );

    // Send notifications to targeted users
    if (notifyUsers) {
      let userIds: number[] = [];

      if (targetAudience === "all") {
        const [users] = await db.query<RowDataPacket[]>(
          `SELECT id FROM users WHERE role != 'admin'`
        );
        userIds = users.map(u => u.id);
      } else if (targetAudience === "clients") {
        const [users] = await db.query<RowDataPacket[]>(
          `SELECT id FROM users WHERE role = 'client'`
        );
        userIds = users.map(u => u.id);
      } else if (targetAudience === "staff") {
        const [users] = await db.query<RowDataPacket[]>(
          `SELECT id FROM users WHERE role IN ('receptionist', 'staff')`
        );
        userIds = users.map(u => u.id);
      } else if (targetAudience === "specific" && targetUserIds) {
        userIds = targetUserIds;
      }

      // Create notification for each user
      for (const userId of userIds) {
        await sendNotificationToUser(
          userId,
          "announcement",
          `New Announcement: ${title}`,
          content.substring(0, 200) + (content.length > 200 ? "..." : ""),
          {
            link: "/announcements",
            priority: priority
          }
        );
      }
    }

    res.json({ 
      success: true, 
      announcementId: result.insertId 
    });
  } catch (error) {
    console.error("Error creating announcement:", error);
    res.status(500).json({ error: "Failed to create announcement" });
  }
};

// Update announcement (admin only)
export const updateAnnouncement: RequestHandler = async (req, res) => {
  const { announcementId } = req.params;
  const {
    title,
    content,
    targetAudience,
    targetUserIds,
    startDate,
    endDate,
    isActive,
    priority,
    bannerColor,
    icon
  } = req.body;

  try {
    const [result] = await db.query<ResultSetHeader>(
      `UPDATE announcements 
       SET title = ?, content = ?, target_audience = ?, target_user_ids = ?,
           start_date = ?, end_date = ?, is_active = ?, priority = ?,
           banner_color = ?, icon = ?
       WHERE id = ?`,
      [
        title,
        content,
        targetAudience,
        targetUserIds ? JSON.stringify(targetUserIds) : null,
        startDate,
        endDate,
        isActive,
        priority,
        bannerColor,
        icon,
        announcementId
      ]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Announcement not found" });
    }

    res.json({ success: true });
  } catch (error) {
    console.error("Error updating announcement:", error);
    res.status(500).json({ error: "Failed to update announcement" });
  }
};

// Delete announcement (admin only)
export const deleteAnnouncement: RequestHandler = async (req, res) => {
  const { announcementId } = req.params;

  try {
    const [result] = await db.query<ResultSetHeader>(
      `DELETE FROM announcements WHERE id = ?`,
      [announcementId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Announcement not found" });
    }

    res.json({ success: true });
  } catch (error) {
    console.error("Error deleting announcement:", error);
    res.status(500).json({ error: "Failed to delete announcement" });
  }
};

// Mark announcement as viewed
export const markAnnouncementViewed: RequestHandler = async (req, res) => {
  const { announcementId } = req.params;
  const { userId } = req.body;

  if (!userId) {
    return res.status(400).json({ error: "User ID is required" });
  }

  try {
    // Insert view record (ignore if already exists)
    await db.query(
      `INSERT IGNORE INTO announcement_views (announcement_id, user_id) 
       VALUES (?, ?)`,
      [announcementId, userId]
    );

    // Increment views count
    await db.query(
      `UPDATE announcements SET views_count = views_count + 1 WHERE id = ?`,
      [announcementId]
    );

    res.json({ success: true });
  } catch (error) {
    console.error("Error marking announcement as viewed:", error);
    res.status(500).json({ error: "Failed to mark announcement as viewed" });
  }
};

// Toggle announcement active status (admin only)
export const toggleAnnouncementStatus: RequestHandler = async (req, res) => {
  const { announcementId } = req.params;

  try {
    const [result] = await db.query<ResultSetHeader>(
      `UPDATE announcements 
       SET is_active = NOT is_active 
       WHERE id = ?`,
      [announcementId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Announcement not found" });
    }

    res.json({ success: true });
  } catch (error) {
    console.error("Error toggling announcement status:", error);
    res.status(500).json({ error: "Failed to toggle announcement status" });
  }
};
