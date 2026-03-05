import db from '../server/db';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function setupSiteSettings() {
  console.log('🔧 Setting up site settings table...\n');

  const connection = await db.getConnection();

  try {
    // Read SQL file
    const settingsSQL = await fs.readFile(
      path.join(__dirname, 'site_settings_table.sql'),
      'utf-8'
    );

    // Execute table creation
    console.log('📝 Creating site_settings table...');
    const statements = settingsSQL
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0);

    for (const statement of statements) {
      await connection.query(statement);
    }
    console.log('✅ Site settings table created successfully\n');

    // Verify data
    const [settings] = await connection.query('SELECT COUNT(*) as count FROM site_settings');

    console.log('📊 Summary:');
    console.log(`   - Settings: ${(settings as any)[0].count} records`);
    console.log('\n✅ Site settings setup complete!');
    console.log('\n📌 You can now customize your site from the Admin Dashboard > Site Settings');

  } catch (error) {
    console.error('❌ Error setting up site settings:', error);
    throw error;
  } finally {
    connection.release();
    await db.end();
  }
}

setupSiteSettings().catch(console.error);
