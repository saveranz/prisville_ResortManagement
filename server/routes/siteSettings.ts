import { RequestHandler } from "express";
import db from "../db";
import { RowDataPacket, ResultSetHeader } from "mysql2";

// Get all site settings
export const getAllSettings: RequestHandler = async (req, res) => {
  try {
    const connection = await db.getConnection();

    try {
      const [settings] = await connection.query<RowDataPacket[]>(
        `SELECT 
          id,
          setting_key,
          setting_value,
          setting_type,
          category,
          description,
          updated_at
        FROM site_settings
        ORDER BY category, setting_key`
      );

      connection.release();

      // Transform into a more usable format
      const settingsByCategory: any = {};
      const settingsMap: any = {};

      settings.forEach((setting: any) => {
        if (!settingsByCategory[setting.category]) {
          settingsByCategory[setting.category] = [];
        }
        settingsByCategory[setting.category].push(setting);
        settingsMap[setting.setting_key] = setting.setting_value;
      });

      res.json({
        success: true,
        settings: settings,
        settingsByCategory,
        settingsMap
      });

    } catch (error) {
      connection.release();
      throw error;
    }

  } catch (error) {
    console.error('❌ Error fetching site settings:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch site settings' 
    });
  }
};

// Update a single setting
export const updateSetting: RequestHandler = async (req, res) => {
  try {
    const { settingKey } = req.params;
    const { value } = req.body;
    const userId = (req.session as any).userId;

    if (!settingKey || value === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Setting key and value are required'
      });
    }

    const connection = await db.getConnection();

    try {
      const [result] = await connection.query<ResultSetHeader>(
        `UPDATE site_settings 
        SET setting_value = ?, updated_by = ?, updated_at = CURRENT_TIMESTAMP
        WHERE setting_key = ?`,
        [value, userId, settingKey]
      );

      connection.release();

      if (result.affectedRows === 0) {
        return res.status(404).json({
          success: false,
          message: 'Setting not found'
        });
      }

      res.json({
        success: true,
        message: 'Setting updated successfully'
      });

    } catch (error) {
      connection.release();
      throw error;
    }

  } catch (error) {
    console.error('❌ Error updating setting:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to update setting' 
    });
  }
};

// Update multiple settings at once
export const updateMultipleSettings: RequestHandler = async (req, res) => {
  try {
    const { settings } = req.body;
    const userId = (req.session as any).userId;

    if (!settings || typeof settings !== 'object') {
      return res.status(400).json({
        success: false,
        message: 'Settings object is required'
      });
    }

    const connection = await db.getConnection();

    try {
      // Start transaction
      await connection.beginTransaction();

      // Update each setting
      for (const [key, value] of Object.entries(settings)) {
        await connection.query(
          `UPDATE site_settings 
          SET setting_value = ?, updated_by = ?, updated_at = CURRENT_TIMESTAMP
          WHERE setting_key = ?`,
          [value, userId, key]
        );
      }

      await connection.commit();
      connection.release();

      res.json({
        success: true,
        message: 'Settings updated successfully'
      });

    } catch (error) {
      await connection.rollback();
      connection.release();
      throw error;
    }

  } catch (error) {
    console.error('❌ Error updating multiple settings:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to update settings' 
    });
  }
};

// Reset settings to defaults
export const resetSettings: RequestHandler = async (req, res) => {
  try {
    const userId = (req.session as any).userId;
    const connection = await db.getConnection();

    try {
      // Reset to default values
      await connection.query(`
        UPDATE site_settings SET
          setting_value = CASE setting_key
            WHEN 'site_name' THEN 'Prisville Resort'
            WHEN 'site_tagline' THEN 'Your Perfect Getaway Destination'
            WHEN 'primary_color' THEN '#8B5CF6'
            WHEN 'accent_color' THEN '#EC4899'
            WHEN 'success_color' THEN '#10B981'
            WHEN 'warning_color' THEN '#F59E0B'
            WHEN 'error_color' THEN '#EF4444'
            WHEN 'background_color' THEN '#F9FAFB'
            WHEN 'text_primary_color' THEN '#111827'
            WHEN 'text_secondary_color' THEN '#6B7280'
            WHEN 'font_family_heading' THEN 'Inter'
            WHEN 'font_family_body' THEN 'Inter'
            WHEN 'font_size_base' THEN '16'
            WHEN 'welcome_message' THEN 'Welcome to Prisville Resort! Book your perfect vacation with us.'
            WHEN 'contact_email' THEN 'info@prisvilleresort.com'
            WHEN 'contact_phone' THEN '+63 123-456-7890'
            WHEN 'footer_text' THEN '© 2026 Prisville Resort. All rights reserved.'
            WHEN 'show_announcements' THEN 'true'
            WHEN 'show_recommendations' THEN 'true'
            WHEN 'show_map' THEN 'true'
            ELSE setting_value
          END,
          updated_by = ?,
          updated_at = CURRENT_TIMESTAMP
      `, [userId]);

      connection.release();

      res.json({
        success: true,
        message: 'Settings reset to defaults successfully'
      });

    } catch (error) {
      connection.release();
      throw error;
    }

  } catch (error) {
    console.error('❌ Error resetting settings:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to reset settings' 
    });
  }
};
