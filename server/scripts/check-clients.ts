import pool from '../db';

async function checkClientUsers() {
  try {
    const [users] = await pool.query(
      'SELECT id, email, name, role FROM users WHERE role = ?',
      ['client']
    );
    
    console.log('Client users found:', users);
    
    if ((users as any[]).length === 0) {
      console.log('\nNo client users exist. Clients need to register via the "Sign up" link.');
    }
    
    await pool.end();
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkClientUsers();
