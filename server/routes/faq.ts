import { RequestHandler } from "express";
import db from "../db";
import { RowDataPacket, ResultSetHeader } from "mysql2";

// ============================================
// FAQ ROUTES
// ============================================

// Get all active FAQs
export const getAllFAQs: RequestHandler = async (req, res) => {
  try {
    const connection = await db.getConnection();

    try {
      const [faqs] = await connection.query<RowDataPacket[]>(
        `SELECT id, question, answer, category, display_order
        FROM faqs
        WHERE is_active = TRUE
        ORDER BY display_order ASC, id ASC`
      );

      connection.release();

      res.json({
        success: true,
        faqs
      });

    } catch (error) {
      connection.release();
      throw error;
    }

  } catch (error) {
    console.error('❌ Error fetching FAQs:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch FAQs' 
    });
  }
};

// Get all FAQs (admin - includes inactive)
export const getAdminFAQs: RequestHandler = async (req, res) => {
  try {
    const connection = await db.getConnection();

    try {
      const [faqs] = await connection.query<RowDataPacket[]>(
        `SELECT id, question, answer, category, display_order, is_active, created_at, updated_at
        FROM faqs
        ORDER BY display_order ASC, id ASC`
      );

      connection.release();

      res.json({
        success: true,
        faqs
      });

    } catch (error) {
      connection.release();
      throw error;
    }

  } catch (error) {
    console.error('❌ Error fetching admin FAQs:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch FAQs' 
    });
  }
};

// Create FAQ
export const createFAQ: RequestHandler = async (req, res) => {
  try {
    const { question, answer, category, display_order } = req.body;
    const userId = (req.session as any).userId;

    if (!question || !answer) {
      return res.status(400).json({
        success: false,
        message: 'Question and answer are required'
      });
    }

    const connection = await db.getConnection();

    try {
      const [result] = await connection.query<ResultSetHeader>(
        `INSERT INTO faqs (question, answer, category, display_order, created_by)
        VALUES (?, ?, ?, ?, ?)`,
        [question, answer, category || 'general', display_order || 0, userId]
      );

      connection.release();

      res.json({
        success: true,
        message: 'FAQ created successfully',
        faqId: result.insertId
      });

    } catch (error) {
      connection.release();
      throw error;
    }

  } catch (error) {
    console.error('❌ Error creating FAQ:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to create FAQ' 
    });
  }
};

// Update FAQ
export const updateFAQ: RequestHandler = async (req, res) => {
  try {
    const { faqId } = req.params;
    const { question, answer, category, display_order, is_active } = req.body;

    const connection = await db.getConnection();

    try {
      const [result] = await connection.query<ResultSetHeader>(
        `UPDATE faqs 
        SET question = ?, answer = ?, category = ?, display_order = ?, is_active = ?
        WHERE id = ?`,
        [question, answer, category, display_order, is_active, faqId]
      );

      connection.release();

      if (result.affectedRows === 0) {
        return res.status(404).json({
          success: false,
          message: 'FAQ not found'
        });
      }

      res.json({
        success: true,
        message: 'FAQ updated successfully'
      });

    } catch (error) {
      connection.release();
      throw error;
    }

  } catch (error) {
    console.error('❌ Error updating FAQ:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to update FAQ' 
    });
  }
};

// Delete FAQ
export const deleteFAQ: RequestHandler = async (req, res) => {
  try {
    const { faqId } = req.params;

    const connection = await db.getConnection();

    try {
      const [result] = await connection.query<ResultSetHeader>(
        `DELETE FROM faqs WHERE id = ?`,
        [faqId]
      );

      connection.release();

      if (result.affectedRows === 0) {
        return res.status(404).json({
          success: false,
          message: 'FAQ not found'
        });
      }

      res.json({
        success: true,
        message: 'FAQ deleted successfully'
      });

    } catch (error) {
      connection.release();
      throw error;
    }

  } catch (error) {
    console.error('❌ Error deleting FAQ:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to delete FAQ' 
    });
  }
};

// ============================================
// INQUIRY ROUTES
// ============================================

// Submit inquiry (guest)
export const submitInquiry: RequestHandler = async (req, res) => {
  try {
    const { name, email, phone, subject, message, category } = req.body;

    if (!name || !email || !subject || !message) {
      return res.status(400).json({
        success: false,
        message: 'Name, email, subject, and message are required'
      });
    }

    const connection = await db.getConnection();

    try {
      const [result] = await connection.query<ResultSetHeader>(
        `INSERT INTO guest_inquiries (name, email, phone, subject, message, category)
        VALUES (?, ?, ?, ?, ?, ?)`,
        [name, email, phone, subject, message, category || 'general']
      );

      connection.release();

      res.json({
        success: true,
        message: 'Your inquiry has been submitted successfully. We will respond to you shortly.',
        inquiryId: result.insertId
      });

    } catch (error) {
      connection.release();
      throw error;
    }

  } catch (error) {
    console.error('❌ Error submitting inquiry:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to submit inquiry' 
    });
  }
};

// Get all inquiries (admin/staff)
export const getAllInquiries: RequestHandler = async (req, res) => {
  try {
    const { status } = req.query;

    const connection = await db.getConnection();

    try {
      let query = `
        SELECT 
          i.*,
          u.name as responder_name,
          u.email as responder_email
        FROM guest_inquiries i
        LEFT JOIN users u ON i.responded_by = u.id
      `;

      const params: any[] = [];

      if (status) {
        query += ` WHERE i.status = ?`;
        params.push(status);
      }

      query += ` ORDER BY 
        CASE i.priority 
          WHEN 'urgent' THEN 1
          WHEN 'high' THEN 2
          WHEN 'normal' THEN 3
          WHEN 'low' THEN 4
        END,
        i.created_at DESC
      `;

      const [inquiries] = await connection.query<RowDataPacket[]>(query, params);

      connection.release();

      res.json({
        success: true,
        inquiries
      });

    } catch (error) {
      connection.release();
      throw error;
    }

  } catch (error) {
    console.error('❌ Error fetching inquiries:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch inquiries' 
    });
  }
};

// Get inquiry stats (admin)
export const getInquiryStats: RequestHandler = async (req, res) => {
  try {
    const connection = await db.getConnection();

    try {
      const [stats] = await connection.query<RowDataPacket[]>(
        `SELECT 
          COUNT(*) as total_inquiries,
          SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending,
          SUM(CASE WHEN status = 'in_progress' THEN 1 ELSE 0 END) as in_progress,
          SUM(CASE WHEN status = 'resolved' THEN 1 ELSE 0 END) as resolved,
          SUM(CASE WHEN status = 'closed' THEN 1 ELSE 0 END) as closed,
          SUM(CASE WHEN priority = 'urgent' THEN 1 ELSE 0 END) as urgent_count,
          SUM(CASE WHEN priority = 'high' THEN 1 ELSE 0 END) as high_priority_count
        FROM guest_inquiries`
      );

      connection.release();

      res.json({
        success: true,
        stats: stats[0]
      });

    } catch (error) {
      connection.release();
      throw error;
    }

  } catch (error) {
    console.error('❌ Error fetching inquiry stats:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch inquiry stats' 
    });
  }
};

// Update inquiry status
export const updateInquiryStatus: RequestHandler = async (req, res) => {
  try {
    const { inquiryId } = req.params;
    const { status, priority } = req.body;

    const connection = await db.getConnection();

    try {
      let query = 'UPDATE guest_inquiries SET ';
      const params: any[] = [];
      const updates: string[] = [];

      if (status) {
        updates.push('status = ?');
        params.push(status);
      }

      if (priority) {
        updates.push('priority = ?');
        params.push(priority);
      }

      if (updates.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'No updates provided'
        });
      }

      query += updates.join(', ') + ' WHERE id = ?';
      params.push(inquiryId);

      const [result] = await connection.query<ResultSetHeader>(query, params);

      connection.release();

      if (result.affectedRows === 0) {
        return res.status(404).json({
          success: false,
          message: 'Inquiry not found'
        });
      }

      res.json({
        success: true,
        message: 'Inquiry updated successfully'
      });

    } catch (error) {
      connection.release();
      throw error;
    }

  } catch (error) {
    console.error('❌ Error updating inquiry:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to update inquiry' 
    });
  }
};

// Respond to inquiry
export const respondToInquiry: RequestHandler = async (req, res) => {
  try {
    const { inquiryId } = req.params;
    const { response } = req.body;
    const userId = (req.session as any).userId;

    if (!response) {
      return res.status(400).json({
        success: false,
        message: 'Response is required'
      });
    }

    const connection = await db.getConnection();

    try {
      const [result] = await connection.query<ResultSetHeader>(
        `UPDATE guest_inquiries 
        SET response = ?, responded_by = ?, responded_at = CURRENT_TIMESTAMP, status = 'resolved'
        WHERE id = ?`,
        [response, userId, inquiryId]
      );

      connection.release();

      if (result.affectedRows === 0) {
        return res.status(404).json({
          success: false,
          message: 'Inquiry not found'
        });
      }

      res.json({
        success: true,
        message: 'Response sent successfully'
      });

    } catch (error) {
      connection.release();
      throw error;
    }

  } catch (error) {
    console.error('❌ Error responding to inquiry:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to respond to inquiry' 
    });
  }
};
