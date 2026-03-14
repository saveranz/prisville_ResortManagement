-- Test Email Configuration Script
-- Run this to check if email is working: npm run test-email

import { sendVerificationEmail, testEmailConnection } from './server/utils/emailService.js';
import dotenv from 'dotenv';

dotenv.config();

async function testEmail() {
  console.log('\n🔍 Testing Email Configuration...\n');
  
  console.log('📋 Current Settings:');
  console.log(`   Host: ${process.env.EMAIL_HOST}`);
  console.log(`   Port: ${process.env.EMAIL_PORT}`);
  console.log(`   User: ${process.env.EMAIL_USER}`);
  console.log(`   Pass: ${process.env.EMAIL_PASS ? '***' + process.env.EMAIL_PASS.slice(-4) : 'Not set'}\n`);

  // Test connection
  console.log('🔌 Testing SMTP connection...');
  const connected = await testEmailConnection();
  
  if (!connected) {
    console.log('\n❌ Email connection failed!');
    console.log('\n💡 Troubleshooting:');
    console.log('   1. Check EMAIL_PASS has no spaces: gsljikktxvmlzhxb');
    console.log('   2. Verify Gmail App Password is correct');
    console.log('   3. Try regenerating App Password in Google');
    console.log('   4. Check firewall/antivirus blocking port 587\n');
    return;
  }

  console.log('\n✅ SMTP connection successful!\n');

  // Optionally send test email (uncomment below)
  /*
  const testEmail = 'your-email@example.com';
  console.log(`📤 Sending test verification email to ${testEmail}...`);
  try {
    await sendVerificationEmail(testEmail, 'test-token-12345', 'Test User');
    console.log('✅ Test email sent successfully!\n');
  } catch (error) {
    console.error('❌ Failed to send test email:', error.message);
  }
  */
}

testEmail().catch(console.error).finally(() => process.exit());
