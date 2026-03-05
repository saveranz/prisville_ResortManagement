import bcrypt from 'bcrypt';
import pool from '../db';

async function hashExistingPasswords() {
  try {
    console.log('Hashing existing passwords...\n');

    const passwords = [
      { email: 'admin@prisville.com', password: 'admin123' },
      { email: 'receptionist@prisville.com', password: 'receptionist123' }
    ];

    for (const user of passwords) {
      const hashedPassword = await bcrypt.hash(user.password, 10);
      
      await pool.query(
        'UPDATE users SET password = ? WHERE email = ?',
        [hashedPassword, user.email]
      );
      
      console.log(`✓ Updated password for ${user.email}`);
      console.log(`  Original: ${user.password}`);
      console.log(`  Hashed: ${hashedPassword}\n`);
    }

    console.log('✓ All passwords hashed successfully!');
    await pool.end();
    process.exit(0);
  } catch (error) {
    console.error('✗ Failed to hash passwords:', error);
    await pool.end();
    process.exit(1);
  }
}

hashExistingPasswords();
