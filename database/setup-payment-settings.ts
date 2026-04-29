import db from "../server/db";

async function setupPaymentSettings() {
  try {
    console.log('Creating payment_settings table...');
    
    await db.query(`
      CREATE TABLE IF NOT EXISTS payment_settings (
        id INT AUTO_INCREMENT PRIMARY KEY,
        account_name VARCHAR(100) NOT NULL,
        mobile_number VARCHAR(20) NOT NULL,
        note TEXT,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    
    console.log('✓ payment_settings table created');
    
    // Check if table is empty
    const [rows]: any = await db.query('SELECT COUNT(*) as count FROM payment_settings');
    
    if (rows[0].count === 0) {
      console.log('Inserting default payment settings...');
      await db.query(`
        INSERT INTO payment_settings (account_name, mobile_number, note)
        VALUES (?, ?, ?)
      `, [
        'Prisville Resort',
        '+63 912 345 6789',
        'This is a reservation fee (50% of total) to secure your booking. The remaining balance will be paid upon arrival.'
      ]);
      console.log('✓ Default payment settings inserted');
    } else {
      console.log('✓ Payment settings already exist');
    }
    
    console.log('Payment settings setup complete!');
    process.exit(0);
  } catch (error) {
    console.error('Error setting up payment settings:', error);
    process.exit(1);
  }
}

setupPaymentSettings();
