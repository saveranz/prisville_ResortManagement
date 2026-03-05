import pool from '../db';
import fs from 'fs';
import path from 'path';

async function setupDatabase() {
  try {
    console.log('Setting up database schema...\n');
    
    // Order matters - tables with foreign keys must be created after their references
    const sqlFiles = [
      'users_table.sql',
      'sessions_table.sql',
      'user_preferences_table.sql',
      'user_activity_tracking_table.sql',
      'room_bookings_table.sql',
      'room_status_table.sql',
      'stay_history_table.sql',
      'amenity_bookings_table.sql',
      'day_pass_bookings_table.sql',
      'day_pass_guests_table.sql',
      'booking_issues_table.sql',
      'inventory_items_table.sql',
      'financial_transactions_table.sql',
      'notifications_table.sql',
      'announcements_table.sql',
      'announcement_views_table.sql'
    ];
    
    for (const file of sqlFiles) {
      const filePath = path.join(process.cwd(), 'database', file);
      
      if (!fs.existsSync(filePath)) {
        console.log(`⚠ Skipping ${file} (not found)`);
        continue;
      }
      
      console.log(`Creating table from ${file}...`);
      const sql = fs.readFileSync(filePath, 'utf8');
      
      // Split by semicolon and execute each statement
      const statements = sql.split(';').filter(s => s.trim());
      
      for (const statement of statements) {
        if (statement.trim()) {
          try {
            await pool.query(statement);
          } catch (error: any) {
            // Ignore duplicate entry errors (for INSERT statements)
            if (error.code !== 'ER_DUP_ENTRY') {
              throw error;
            }
            console.log(`  ⚠ Skipped statement (duplicate entry)`);
          }
        }
      }
      
      console.log(`✓ ${file} executed successfully`);
    }
    
    console.log('\n✓ Database schema setup complete!');
    await pool.end();
    process.exit(0);
  } catch (error) {
    console.error('✗ Failed to setup database:', error);
    await pool.end();
    process.exit(1);
  }
}

setupDatabase();
