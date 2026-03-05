import pool from '../db';

async function checkUser() {
  try {
    const [rows] = await pool.query(
      'SELECT id, email, password, role FROM users WHERE email = ?',
      ['john.doe@gmail.com']
    );
    
    console.log('User found:', rows);
    
    // Also check total users
    const [allUsers] = await pool.query('SELECT email, role FROM users');
    console.log('\nAll users:', allUsers);
    
    await pool.end();
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkUser();
