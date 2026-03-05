-- ============================================
-- SITE SETTINGS TABLE - Customizable site appearance and branding
-- ============================================

CREATE TABLE IF NOT EXISTS site_settings (
  id INT PRIMARY KEY AUTO_INCREMENT,
  setting_key VARCHAR(100) NOT NULL UNIQUE,
  setting_value TEXT,
  setting_type ENUM('text', 'color', 'image', 'number', 'boolean') DEFAULT 'text',
  category VARCHAR(50) NOT NULL COMMENT 'branding, colors, typography, content, layout',
  description TEXT,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  updated_by INT,
  FOREIGN KEY (updated_by) REFERENCES users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert default settings
INSERT INTO site_settings (setting_key, setting_value, setting_type, category, description) VALUES
-- Branding
('site_name', 'Prisville Resort', 'text', 'branding', 'Name of the resort/site'),
('site_tagline', 'Your Perfect Getaway Destination', 'text', 'branding', 'Site tagline or slogan'),
('site_logo_url', '', 'image', 'branding', 'URL to the main logo'),
('site_favicon_url', '', 'image', 'branding', 'URL to the favicon'),
('hero_image_url', '', 'image', 'branding', 'Main hero/banner image URL'),

-- Colors (using CSS color values)
('primary_color', '#8B5CF6', 'color', 'colors', 'Primary brand color'),
('accent_color', '#EC4899', 'color', 'colors', 'Accent/secondary color'),
('success_color', '#10B981', 'color', 'colors', 'Success state color'),
('warning_color', '#F59E0B', 'color', 'colors', 'Warning state color'),
('error_color', '#EF4444', 'color', 'colors', 'Error state color'),
('background_color', '#F9FAFB', 'color', 'colors', 'Page background color'),
('text_primary_color', '#111827', 'color', 'colors', 'Primary text color'),
('text_secondary_color', '#6B7280', 'color', 'colors', 'Secondary text color'),

-- Typography
('font_family_heading', 'Inter', 'text', 'typography', 'Font family for headings'),
('font_family_body', 'Inter', 'text', 'typography', 'Font family for body text'),
('font_size_base', '16', 'number', 'typography', 'Base font size in pixels'),

-- Content
('welcome_message', 'Welcome to Prisville Resort! Book your perfect vacation with us.', 'text', 'content', 'Homepage welcome message'),
('contact_email', 'info@prisvilleresort.com', 'text', 'content', 'Contact email address'),
('contact_phone', '+63 123-456-7890', 'text', 'content', 'Contact phone number'),
('footer_text', '© 2026 Prisville Resort. All rights reserved.', 'text', 'content', 'Footer copyright text'),

-- Layout
('show_announcements', 'true', 'boolean', 'layout', 'Show announcements banner'),
('show_recommendations', 'true', 'boolean', 'layout', 'Show recommendations section'),
('show_map', 'true', 'boolean', 'layout', 'Show resort map');
