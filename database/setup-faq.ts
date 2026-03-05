import db from '../server/db';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function setupFAQ() {
  console.log('🔧 Setting up FAQ and Inquiries system...\n');

  const connection = await db.getConnection();

  try {
    // Read SQL file
    const faqSQL = await fs.readFile(
      path.join(__dirname, 'faq_inquiries_table.sql'),
      'utf-8'
    );

    // Execute table creation
    console.log('📝 Creating FAQs and inquiries tables...');
    const statements = faqSQL
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0);

    for (const statement of statements) {
      await connection.query(statement);
    }
    console.log('✅ FAQ and inquiries tables created successfully\n');

    // Verify data
    const [faqs] = await connection.query('SELECT COUNT(*) as count FROM faqs');
    const [inquiries] = await connection.query('SELECT COUNT(*) as count FROM guest_inquiries');

    console.log('📊 Summary:');
    console.log(`   - FAQs: ${(faqs as any)[0].count} records`);
    console.log(`   - Inquiries: ${(inquiries as any)[0].count} records`);
    console.log('\n✅ FAQ system setup complete!');
    console.log('\n📌 Features:');
    console.log('   - Floating help button on landing page');
    console.log('   - 10 default FAQs organized by category');
    console.log('   - Guest inquiry submission form');
    console.log('   - Admin interface to manage FAQs and respond to inquiries');

  } catch (error) {
    console.error('❌ Error setting up FAQ system:', error);
    throw error;
  } finally {
    connection.release();
    await db.end();
  }
}

setupFAQ().catch(console.error);
