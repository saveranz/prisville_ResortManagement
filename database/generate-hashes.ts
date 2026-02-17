import bcrypt from 'bcrypt';

// Script to generate hashed passwords for existing database users
async function hashPasswords() {
  const passwords = [
    { email: 'admin@prisville.com', password: 'admin123' },
    { email: 'receptionist@prisville.com', password: 'receptionist123' }
  ];

  console.log('Generating hashed passwords...\n');

  for (const user of passwords) {
    const hashedPassword = await bcrypt.hash(user.password, 10);
    console.log(`${user.email}:`);
    console.log(`Original: ${user.password}`);
    console.log(`Hashed: ${hashedPassword}`);
    console.log(`\nSQL Update:`);
    console.log(`UPDATE users SET password = '${hashedPassword}' WHERE email = '${user.email}';\n`);
    console.log('---\n');
  }
}

hashPasswords().catch(console.error);
