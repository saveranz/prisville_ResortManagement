import db from "../server/db";

async function checkAnnouncements() {
  try {
    const [rows] = await db.query(`
      SELECT 
        id, 
        title, 
        is_active, 
        start_date, 
        end_date, 
        target_audience,
        priority
      FROM announcements 
      ORDER BY id
    `);
    
    console.log('\n=== All Announcements ===');
    console.table(rows);
    
    const [active] = await db.query(`
      SELECT 
        id, 
        title, 
        is_active, 
        start_date, 
        end_date, 
        target_audience
      FROM announcements 
      WHERE is_active = TRUE
        AND start_date <= NOW()
        AND (end_date IS NULL OR end_date >= NOW())
        AND target_audience = 'all'
      ORDER BY priority DESC, created_at DESC
    `);
    
    console.log('\n=== Active Announcements (for guests) ===');
    console.table(active);
    
    await db.end();
  } catch (error) {
    console.error("Error:", error);
    process.exit(1);
  }
}

checkAnnouncements();
