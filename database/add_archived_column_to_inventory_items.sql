-- Migration: Add 'archived' column to inventory_items
ALTER TABLE inventory_items
ADD COLUMN archived TINYINT(1) NOT NULL DEFAULT 0 COMMENT '1 = archived, 0 = active';
