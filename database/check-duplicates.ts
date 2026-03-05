import db from '../server/db';

async function checkDuplicates() {
  try {
    console.log('🔍 Checking for duplicate FAQs...\n');

    const [faqs] = await db.query(`
      SELECT id, question, category, created_at 
      FROM faqs 
      ORDER BY question, created_at
    `) as any[];

    console.log(`Total FAQs in database: ${faqs.length}\n`);
    
    // Group by question to find duplicates
    const questionMap = new Map<string, any[]>();
    faqs.forEach((faq: any) => {
      if (!questionMap.has(faq.question)) {
        questionMap.set(faq.question, []);
      }
      questionMap.get(faq.question)!.push(faq);
    });

    console.log('📋 FAQ Analysis:');
    questionMap.forEach((entries, question) => {
      if (entries.length > 1) {
        console.log(`\n⚠️ DUPLICATE: "${question}"`);
        entries.forEach((entry: any) => {
          console.log(`   - ID: ${entry.id}, Created: ${entry.created_at}`);
        });
      }
    });

    // Find IDs to keep (oldest) and delete (newer)
    const idsToDelete: number[] = [];
    questionMap.forEach((entries) => {
      if (entries.length > 1) {
        // Sort by created_at, keep the oldest
        entries.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
        // Delete all except the first (oldest)
        for (let i = 1; i < entries.length; i++) {
          idsToDelete.push(entries[i].id);
        }
      }
    });

    if (idsToDelete.length > 0) {
      console.log(`\n🗑️ Will delete ${idsToDelete.length} duplicate FAQ(s): ${idsToDelete.join(', ')}`);
    } else {
      console.log('\n✅ No duplicates found!');
    }

    await db.end();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

checkDuplicates();
