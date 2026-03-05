import db from '../server/db';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function setupFacilitiesTables() {
  console.log('🔧 Setting up facilities tables...\n');

  const connection = await db.getConnection();

  try {
    // Read SQL files
    const roomsSQL = await fs.readFile(
      path.join(__dirname, 'rooms_table.sql'),
      'utf-8'
    );
    const amenitiesSQL = await fs.readFile(
      path.join(__dirname, 'amenities_table.sql'),
      'utf-8'
    );

    // Execute rooms table creation
    console.log('📝 Creating rooms table...');
    const roomStatements = roomsSQL
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0);

    for (const statement of roomStatements) {
      await connection.query(statement);
    }
    console.log('✅ Rooms table created successfully\n');

    // Execute amenities table creation
    console.log('📝 Creating amenities table...');
    const amenityStatements = amenitiesSQL
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0);

    for (const statement of amenityStatements) {
      await connection.query(statement);
    }
    console.log('✅ Amenities table created successfully\n');

    // Verify data
    const [rooms] = await connection.query('SELECT COUNT(*) as count FROM rooms');
    const [amenities] = await connection.query('SELECT COUNT(*) as count FROM amenities');

    console.log('📊 Summary:');
    console.log(`   - Rooms: ${(rooms as any)[0].count} records`);
    console.log(`   - Amenities: ${(amenities as any)[0].count} records`);
    console.log('\n✅ Facilities tables setup complete!');

  } catch (error) {
    console.error('❌ Error setting up facilities tables:', error);
    throw error;
  } finally {
    connection.release();
    await db.end();
  }
}

setupFacilitiesTables().catch(console.error);
