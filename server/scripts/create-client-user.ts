import bcrypt from 'bcrypt';
import pool from '../db';

async function createClientUser() {
  try {
    console.log('Creating client user...\n');

    const email = 'john.doe@gmail.com';
    const password = 'password123';
    const name = 'John Doe';
    const role = 'client';

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insert the user
    await pool.query(
      'INSERT INTO users (email, password, name, role) VALUES (?, ?, ?, ?)',
      [email, hashedPassword, name, role]
    );

    console.log('✓ Client user created successfully!');
    console.log('\nLogin credentials:');
    console.log(`  Email: ${email}`);
    console.log(`  Password: ${password}`);
    console.log(`  Role: ${role}\n`);

    await pool.end();
    process.exit(0);
  } catch (error: any) {
    if (error.code === 'ER_DUP_ENTRY') {
      console.log('✓ User already exists');
    } else {
      console.error('✗ Failed to create user:', error);
    }
    await pool.end();
    process.exit(error.code === 'ER_DUP_ENTRY' ? 0 : 1);
  }
}

createClientUser();
