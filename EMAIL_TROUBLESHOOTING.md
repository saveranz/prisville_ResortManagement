# Email Troubleshooting Guide

## Problem: Not Receiving Verification/Reset Emails

### Quick Solutions (Choose One)

#### Option 1: Use Console URL (Fastest)
When you register or request password reset, check your **server console** for:
```
📧 EMAIL DELIVERY FAILED - Copy this URL to verify manually:
🔗 http://localhost:8080/verify-email?token=abc123...
```
Copy and paste that URL into your browser.

#### Option 2: Manual Database Verification
Run this SQL command:
```sql
-- Verify specific user by email
UPDATE users SET email_verified = TRUE WHERE email = 'your@email.com';

-- Or verify all unverified users
UPDATE users SET email_verified = TRUE WHERE email_verified = FALSE;
```

#### Option 3: Test Email Configuration
```bash
node test-email-config.mjs
```

---

## Detailed Troubleshooting

### 1. Check Environment Variables

Verify your `.env` file has:
```env
EMAIL_USER=resortprisvilletriangle@gmail.com
EMAIL_PASS=gsljikktxvmlzhxb
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_FROM=Prisville Resort <resortprisvilletriangle@gmail.com>
NODE_ENV=development
```

**Common Issues:**
- ❌ Spaces in `EMAIL_PASS` (should be `gsljikktxvmlzhxb`, not `gslj ikkt xvml zhxb`)
- ❌ Wrong Gmail App Password
- ❌ Using regular Gmail password instead of App Password

### 2. Gmail App Password Setup

1. Go to https://myaccount.google.com/security
2. Enable 2-Step Verification
3. Go to App Passwords: https://myaccount.google.com/apppasswords
4. Create new app password for "Mail" on "Windows Computer"
5. Copy the 16-character password (no spaces!)
6. Update `EMAIL_PASS` in `.env`

### 3. Check Server Console Logs

When emails fail, the system logs full verification URLs in development mode:

**For Registration:**
```
✅ Registration successful, verification email sent
❌ Failed to send verification email: [error details]
📧 EMAIL DELIVERY FAILED - Copy this URL to verify manually:
🔗 http://localhost:8080/verify-email?token=...
```

**For Password Reset:**
```
✅ Password reset email sent
❌ Failed to send reset email: [error details]
📧 EMAIL DELIVERY FAILED - Copy this URL to reset password:
🔗 http://localhost:8080/reset-password?token=...
```

### 4. Test SMTP Connection

Run the test script:
```bash
node test-email-config.mjs
```

Expected output:
```
🔍 Testing Email Configuration...
📋 Current Settings:
   Host: smtp.gmail.com
   Port: 587
   User: resortprisvilletriangle@gmail.com
   Pass: ***zhxb
🔌 Testing SMTP connection...
✅ SMTP connection successful!
```

### 5. Common Error Messages

#### "Invalid login: 535-5.7.8 Username and Password not accepted"
- **Cause**: Wrong App Password or using regular password
- **Fix**: Generate new App Password from Google

#### "Connection timeout"
- **Cause**: Firewall/antivirus blocking port 587
- **Fix**: Temporarily disable firewall or add exception for Node.js

#### "self signed certificate in certificate chain"
- **Cause**: Corporate proxy/firewall
- **Fix**: Add `tls: { rejectUnauthorized: false }` (development only!)

#### "Email service connection failed"
- **Cause**: No internet or Gmail SMTP down
- **Fix**: Check internet connection, try again later

### 6. Alternative Email Providers

If Gmail doesn't work, try these:

#### SendGrid (Recommended for production)
```env
EMAIL_HOST=smtp.sendgrid.net
EMAIL_PORT=587
EMAIL_USER=apikey
EMAIL_PASS=your_sendgrid_api_key
```

#### Mailgun
```env
EMAIL_HOST=smtp.mailgun.org
EMAIL_PORT=587
EMAIL_USER=your_mailgun_username
EMAIL_PASS=your_mailgun_password
```

#### AWS SES
```env
EMAIL_HOST=email-smtp.us-east-1.amazonaws.com
EMAIL_PORT=587
EMAIL_USER=your_aws_access_key
EMAIL_PASS=your_aws_secret_key
```

---

## Development vs Production

### Development Mode
- Logs full verification URLs to console when email fails
- Allows registration even if email fails
- Shows detailed error messages

### Production Mode
- Never logs tokens to console
- Returns generic success messages (security)
- Email must work for users to verify accounts

---

## Testing the Full Flow

### Test Registration + Verification

1. **Register new account:**
   - Fill registration form
   - Submit

2. **Check server console** for verification URL

3. **Two ways to verify:**
   - **Email works**: Click link in email
   - **Email fails**: Copy URL from console, paste in browser

4. **Verify success:**
   - Should see "Email verified! Redirecting to login..."
   - Gets auto-logged in
   - Redirected to home page after 3 seconds

### Test Password Reset

1. **Request reset:**
   - Click "Forgot Password"
   - Enter email
   - Submit

2. **Check server console** for reset URL

3. **Two ways to reset:**
   - **Email works**: Click link in email
   - **Email fails**: Copy URL from console, paste in browser

4. **Reset password:**
   - Enter new password
   - Confirm new password
   - Submit

5. **Verify success:**
   - Should see "Password changed successfully!"
   - Login with new password

---

## Quick SQL Commands

### Check user verification status
```sql
SELECT id, email, name, email_verified, 
       verification_token_expires, reset_token_expires 
FROM users 
ORDER BY id DESC 
LIMIT 10;
```

### Manually verify a user
```sql
UPDATE users 
SET email_verified = TRUE, 
    verification_token = NULL, 
    verification_token_expires = NULL 
WHERE email = 'user@example.com';
```

### Reset all verification tokens (testing only!)
```sql
UPDATE users 
SET email_verified = TRUE, 
    verification_token = NULL, 
    verification_token_expires = NULL,
    reset_token = NULL,
    reset_token_expires = NULL;
```

### Delete test users
```sql
DELETE FROM users WHERE email LIKE '%test%';
```

---

## Files Modified for Email Features

### Database Migrations
- `database/add_password_reset_tokens.sql` - Reset token columns
- `database/add_email_verification.sql` - Verification columns

### Backend
- `server/utils/emailService.ts` - Email templates and sending
- `server/routes/auth.ts` - Authentication endpoints with email

### Frontend
- `client/components/ForgotPasswordModal.tsx` - Password reset request
- `client/components/ResendVerificationModal.tsx` - Resend verification
- `client/pages/ResetPassword.tsx` - Password reset page
- `client/pages/VerifyEmail.tsx` - Email verification page
- `client/components/LoginModal.tsx` - Updated with verification flow

### Utilities
- `test-email-config.mjs` - Email configuration tester
- `database/manual_verify_user.sql` - Manual verification helper

---

## Support Checklist

Before asking for help, check:

- [ ] `.env` file exists and EMAIL_* variables are set
- [ ] `EMAIL_PASS` has no spaces (should be 16 characters)
- [ ] Database migrations have been run
- [ ] Server console shows the verification URL
- [ ] Gmail has 2FA enabled and App Password generated
- [ ] Port 587 is not blocked by firewall
- [ ] `npm install` has been run (`nodemailer` installed)
- [ ] Server is running (`pnpm dev`)

---

## Need More Help?

1. Run `node test-email-config.mjs` and share the output
2. Share server console logs when registering
3. Check browser console for errors
4. Verify database schema matches migrations
