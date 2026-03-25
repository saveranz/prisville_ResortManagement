import { RequestHandler } from "express";
import db from "../db";
import { ResultSetHeader, RowDataPacket } from "mysql2";

// Helper: insert an audit log entry — called from other routes
export const insertAuditLog = async (
  userId: number,
  userName: string,
  action: string,
  entityType: string,
  entityId: string | null,
  details: string,
  ipAddress: string
): Promise<void> => {
  try {
    await db.query<ResultSetHeader>(
      `INSERT INTO admin_audit_logs (user_id, user_name, action, entity_type, entity_id, details, ip_address)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [userId, userName, action, entityType, entityId ?? null, details, ipAddress]
    );
  } catch (err) {
    // Never let audit logging crash the main request
    console.error("❌ Failed to write audit log:", err);
  }
};

// Migration: create admin_audit_logs table
export const migrateAuditLogs: RequestHandler = async (_req, res) => {
  try {
    await db.query(`
      CREATE TABLE IF NOT EXISTS admin_audit_logs (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        user_name VARCHAR(255) NOT NULL,
        action VARCHAR(100) NOT NULL,
        entity_type VARCHAR(100),
        entity_id VARCHAR(100),
        details TEXT,
        ip_address VARCHAR(50),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_user_id (user_id),
        INDEX idx_action (action),
        INDEX idx_entity_type (entity_type),
        INDEX idx_created_at (created_at)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    res.json({ success: true, message: "admin_audit_logs table ready" });
  } catch (error) {
    console.error("❌ Audit log migration error:", error);
    res.status(500).json({ success: false, message: "Migration failed" });
  }
};

// GET /api/admin/audit-logs — paginated, filterable
export const getAuditLogs: RequestHandler = async (req, res) => {
  try {
    const page = Math.max(1, parseInt(String(req.query.page || "1"), 10));
    const limit = 50;
    const offset = (page - 1) * limit;
    const action = req.query.action ? String(req.query.action) : null;
    const startDate = req.query.startDate ? String(req.query.startDate) : null;
    const endDate = req.query.endDate ? String(req.query.endDate) : null;

    let where = "WHERE 1=1";
    const params: unknown[] = [];

    if (action) {
      where += " AND action = ?";
      params.push(action);
    }
    if (startDate) {
      where += " AND DATE(created_at) >= ?";
      params.push(startDate);
    }
    if (endDate) {
      where += " AND DATE(created_at) <= ?";
      params.push(endDate);
    }

    const [logs] = await db.query<RowDataPacket[]>(
      `SELECT * FROM admin_audit_logs ${where} ORDER BY created_at DESC LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    );

    const [countResult] = await db.query<RowDataPacket[]>(
      `SELECT COUNT(*) as total FROM admin_audit_logs ${where}`,
      params
    );

    const total = countResult[0]?.total ?? 0;

    res.json({
      success: true,
      logs,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("❌ Error fetching audit logs:", error);
    res.status(500).json({ success: false, message: "Failed to fetch audit logs" });
  }
};
