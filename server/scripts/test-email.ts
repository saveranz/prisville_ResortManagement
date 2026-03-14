/**
 * Test Email Configuration
 * Run this script to verify your email setup is working correctly
 * 
 * Usage: node server/scripts/test-email.js
 */

import { testEmailConnection, sendPasswordResetEmail } from '../utils/emailService.js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

async function testEmail() {
  console.log('\n🔍 Testing Email Configuration...\n');
  
  // Check if email credentials are set
  console.log('📋 Email Settings:');
  console.log(`   Host: ${process.env.EMAIL_HOST || 'Not set'}`);
  console.log(`   Port: ${process.env.EMAIL_PORT || 'Not set'}`);
  console.log(`   User: ${process.env.EMAIL_USER || 'Not set'}`);
  console.log(`   Pass: ${process.env.EMAIL_PASS ? '***' + process.env.EMAIL_PASS.slice(-4) : 'Not set'}`);
  console.log(`   From: ${process.env.EMAIL_FROM || 'Not set'}\n`);

  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.log('⚠️  Email credentials not configured in .env file');
    console.log('   The system will still work in development mode,');
    console.log('   but emails will not be sent.\n');
    return;
  }

  // Test connection
  console.log('🔌 Testing SMTP connection...');
  const connectionOk = await testEmailConnection();
  
  if (!connectionOk) {
    console.log('\n❌ Email connection failed!');
    console.log('   Check your SMTP settings in .env file\n');
    return;
  }

  // Ask if user wants to send a test email
  console.log('\n✅ Connection successful!');
  console.log('\n📧 To send a test password reset email:');
  console.log('   1. Uncomment the test code below');
  console.log('   2. Replace with your test email');
  console.log('   3. Run this script again\n');

  // Uncomment below to send test email
  /*
  try {
    const testEmail = 'your-test-email@example.com';
    const testToken = 'test-token-123456789';
    const testName = 'Test User';
    
    console.log(`📤 Sending test email to ${testEmail}...`);
    await sendPasswordResetEmail(testEmail, testToken, testName);
    console.log('✅ Test email sent successfully!');
    console.log(`   Check ${testEmail} for the password reset email\n`);
  } catch (error) {
    console.error('❌ Failed to send test email:', error.message);
  }
  */
}

testEmail()
  .then(() => {
    console.log('✨ Email test complete!\n');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Test failed:', error);
    process.exit(1);
  });
