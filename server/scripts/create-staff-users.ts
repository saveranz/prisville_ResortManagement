import bcrypt from 'bcrypt';
import db from '../db';
import { ResultSetHeader } from 'mysql2';

const SALT_ROUNDS = 10;

async function createReceptionistAndAdmin() {
  try {
    console.log('Creating receptionist and admin users...');

    // Hash passwords
    const receptionistPassword = await bcrypt.hash('receptionist123', SALT_ROUNDS);
    const adminPassword = await bcrypt.hash('admin123', SALT_ROUNDS);

    // Delete existing users if they exist
    await db.query('DELETE FROM users WHERE email IN (?, ?)', 
      ['receptionist@prisville.com', 'admin@prisville.com']
    );

    // Create receptionist user
    const [receptionistResult] = await db.query<ResultSetHeader>(
      'INSERT INTO users (email, password, name, role) VALUES (?, ?, ?, ?)',
      ['receptionist@prisville.com', receptionistPassword, 'Receptionist User', 'receptionist']
    );

    console.log('✅ Receptionist user created:', {
      id: receptionistResult.insertId,
      email: 'receptionist@prisville.com',
      password: 'receptionist123',
      role: 'receptionist'
    });

    // Create admin user
    const [adminResult] = await db.query<ResultSetHeader>(
      'INSERT INTO users (email, password, name, role) VALUES (?, ?, ?, ?)',
      ['admin@prisville.com', adminPassword, 'Admin User', 'admin']
    );

    console.log('✅ Admin user created:', {
      id: adminResult.insertId,
      email: 'admin@prisville.com',
      password: 'admin123',
      role: 'admin'
    });

    console.log('\n✅ Setup complete! You can now login with:');
    console.log('Receptionist: receptionist@prisville.com / receptionist123');
    console.log('Admin: admin@prisville.com / admin123');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error creating users:', error);
    process.exit(1);
  }
}

createReceptionistAndAdmin();
