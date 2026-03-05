import db from '../server/db';

async function removeDuplicates() {
  try {
    console.log('🧹 Removing duplicate FAQs...\n');

    // IDs to delete (newer duplicates, keeping the older ones)
    const idsToDelete = [19, 17, 14, 12, 20, 16, 15, 11, 13, 18];

    console.log(`Deleting ${idsToDelete.length} duplicate FAQ entries...`);
    
    const [result] = await db.query(`
      DELETE FROM faqs 
      WHERE id IN (${idsToDelete.join(',')})
    `) as any[];

    console.log(`✅ Deleted ${result.affectedRows} duplicate FAQ(s)\n`);

    // Verify remaining FAQs
    const [remaining] = await db.query(`
      SELECT id, question, category 
      FROM faqs 
      ORDER BY category, display_order
    `) as any[];

    console.log(`📋 Remaining FAQs (${remaining.length} total):\n`);
    remaining.forEach((faq: any) => {
      console.log(`   [${faq.category}] ${faq.question}`);
    });

    console.log('\n✅ Duplicate cleanup complete!');
    await db.end();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

removeDuplicates();
