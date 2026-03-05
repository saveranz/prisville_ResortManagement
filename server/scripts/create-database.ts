import mysql from 'mysql2/promise';

async function createDatabase() {
  try {
    console.log('Creating database...');
    
    // Connect without specifying a database
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      port: parseInt(process.env.DB_PORT || '3306')
    });
    
    await connection.query('CREATE DATABASE IF NOT EXISTS prisville_02');
    console.log('✓ Database prisville_02 created successfully');
    
    await connection.end();
    process.exit(0);
  } catch (error) {
    console.error('✗ Failed to create database:', error);
    process.exit(1);
  }
}

createDatabase();
