import pool from '../db';
import fs from 'fs';
import path from 'path';

async function createSessionsTable() {
  try {
    console.log('Creating sessions table...');
    
    const sql = `
      CREATE TABLE IF NOT EXISTS sessions (
        session_id VARCHAR(128) COLLATE utf8mb4_unicode_ci NOT NULL,
        expires INT(11) UNSIGNED NOT NULL,
        data MEDIUMTEXT COLLATE utf8mb4_unicode_ci,
        PRIMARY KEY (session_id),
        INDEX expires_idx (expires)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `;
    
    await pool.query(sql);
    console.log('✓ Sessions table created successfully');
    process.exit(0);
  } catch (error) {
    console.error('✗ Failed to create sessions table:', error);
    process.exit(1);
  }
}

createSessionsTable();
