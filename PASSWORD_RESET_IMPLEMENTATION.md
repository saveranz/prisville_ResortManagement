# Password Reset & Recovery Implementation

## Overview
This document describes the complete password reset and recovery functionality for the Prisville Resort application, including email notifications and token-based verification.

## Features Implemented

✅ **Request Password Reset**
- Users can request a password reset from the login modal
- Email notification sent to registered email address
- Secure token generation and storage

✅ **Email Notifications**
- Professional HTML email templates
- Password reset link with 1-hour expiration
- Password change confirmation email
- Security tips and instructions

✅ **Token Verification**
- Secure token hashing (SHA-256)
- Automatic expiration after 1 hour
- Validation before password reset

✅ **Password Reset Page**
- User-friendly interface
- Password strength requirements
- Confirmation password matching
- Success/error state handling

## Database Setup

### Step 1: Run Database Migration

Run this command in your MySQL database (or using Laragon):

```bash
mysql -u root -p prisville_02 < database/add_password_reset_tokens.sql
```

Or execute directly in MySQL:

```sql
ALTER TABLE users 
ADD COLUMN reset_token VARCHAR(255) NULL,
ADD COLUMN reset_token_expires DATETIME NULL,
ADD INDEX idx_reset_token (reset_token);
```

This adds the following columns to the `users` table:
- `reset_token`: Stores the hashed reset token
- `reset_token_expires`: Token expiration timestamp
- Index on `reset_token` for faster lookups

## Email Configuration

### Environment Variables

Create a `.env` file in the project root (if not already exists) and add:

```env
# Email Configuration
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
EMAIL_FROM=Prisville Resort <noreply@prisville.com>

# Application URL (for reset links)
APP_URL=http://localhost:8080

# Session Secret (if not set)
SESSION_SECRET=your-secret-key-change-in-production
```

### Gmail Setup (Recommended for Development)

1. **Enable 2-Factor Authentication** on your Gmail account
2. **Generate App Password**:
   - Go to Google Account Settings → Security
   - Under "2-Step Verification", select "App passwords"
   - Generate a new app password for "Mail"
   - Use this password in `EMAIL_PASS`

### Alternative Email Providers

**SendGrid:**
```env
EMAIL_HOST=smtp.sendgrid.net
EMAIL_PORT=587
EMAIL_USER=apikey
EMAIL_PASS=your-sendgrid-api-key
```

**Mailgun:**
```env
EMAIL_HOST=smtp.mailgun.org
EMAIL_PORT=587
EMAIL_USER=your-mailgun-username
EMAIL_PASS=your-mailgun-password
```

**Development/Testing:**
- If email configuration is not set up, the system will log the reset token to the console in development mode
- You can manually construct the reset URL: `http://localhost:8080/reset-password?token=TOKEN_HERE`

## File Structure

### Backend Files

```
server/
├── routes/
│   └── auth.ts                     # Added password reset endpoints
├── utils/
│   └── emailService.ts             # NEW: Email service utilities
└── index.ts                        # Updated with new routes

database/
└── add_password_reset_tokens.sql   # NEW: Database migration
```

### Frontend Files

```
client/
├── components/
│   ├── LoginModal.tsx              # Updated with forgot password link
│   └── ForgotPasswordModal.tsx     # NEW: Forgot password modal
├── pages/
│   └── ResetPassword.tsx           # NEW: Password reset page
└── App.tsx                         # Updated with reset password route
```

## API Endpoints

### 1. Request Password Reset
```http
POST /api/auth/request-password-reset
Content-Type: application/json

{
  "email": "user@example.com"
}
```

**Response:**
```json
{
  "success": true,
  "message": "If an account with that email exists, a password reset link has been sent."
}
```

### 2. Verify Reset Token
```http
POST /api/auth/verify-reset-token
Content-Type: application/json

{
  "token": "reset-token-here"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Token is valid",
  "email": "user@example.com"
}
```

### 3. Reset Password
```http
POST /api/auth/reset-password
Content-Type: application/json

{
  "token": "reset-token-here",
  "newPassword": "newSecurePassword123"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Password has been reset successfully. You can now log in with your new password."
}
```

## User Flow

### 1. Request Password Reset
1. User clicks "Forgot password?" on login modal
2. Enters their registered email address
3. Receives email with reset link (or error message if email doesn't exist)

### 2. Click Reset Link
1. User clicks the link in their email
2. System verifies the token is valid and not expired
3. If valid, shows password reset form
4. If invalid/expired, shows error message

### 3. Reset Password
1. User enters new password and confirmation
2. System validates password requirements
3. Password is updated and token is cleared
4. Confirmation email is sent
5. User is redirected to home page

## Security Features

### Token Security
- Tokens are 32-byte random hex strings (crypto.randomBytes)
- Tokens are hashed (SHA-256) before storage
- Only hashed tokens are stored in database
- Tokens expire after 1 hour
- Tokens are single-use (cleared after successful reset)

### Password Security
- Passwords are hashed with bcrypt (10 rounds)
- Minimum password length: 6 characters
- Password confirmation required

### Email Security
- Doesn't reveal if email exists in system (same response for valid/invalid)
- Reset links expire after 1 hour
- Confirmation email sent after password change
- Security tips included in emails

## Testing

### Manual Testing (Without Email)

1. **Request Reset:**
   ```bash
   curl -X POST http://localhost:8080/api/auth/request-password-reset \
     -H "Content-Type: application/json" \
     -d '{"email":"admin@prisville.com"}'
   ```

2. **Check Console** for the reset token (in development mode)

3. **Verify Token:**
   ```bash
   curl -X POST http://localhost:8080/api/auth/verify-reset-token \
     -H "Content-Type: application/json" \
     -d '{"token":"TOKEN_FROM_CONSOLE"}'
   ```

4. **Reset Password:**
   ```bash
   curl -X POST http://localhost:8080/api/auth/reset-password \
     -H "Content-Type: application/json" \
     -d '{"token":"TOKEN_FROM_CONSOLE","newPassword":"newpassword123"}'
   ```

### Test Accounts

Use these existing accounts for testing:
- **Admin:** admin@prisville.com
- **Receptionist:** receptionist@prisville.com
- **Client:** john.doe@gmail.com (if created)

## Troubleshooting

### Email Not Sending

1. **Check Console Logs:**
   - Look for error messages in server console
   - In development, the reset URL is logged

2. **Verify Email Configuration:**
   - Check `.env` file exists
   - Verify SMTP credentials are correct
   - Test with Gmail app password first

3. **Firewall/Network:**
   - Ensure SMTP port (587 or 465) is not blocked
   - Try different email provider

### Token Invalid/Expired

1. **Token Expiration:**
   - Tokens expire after 1 hour
   - Request a new reset if expired

2. **Token Already Used:**
   - Tokens are single-use
   - Request new reset for another attempt

### Database Errors

1. **Column Not Found:**
   - Run database migration: `mysql -u root -p prisville_02 < database/add_password_reset_tokens.sql`
   - Verify columns exist: `DESCRIBE users;`

2. **Connection Issues:**
   - Check database is running
   - Verify connection in `.env` or `server/db.ts`

## Development vs Production

### Development
- Email errors are logged (doesn't stop reset process)
- Reset tokens logged to console
- Can manually construct reset URLs
- `NODE_ENV=development`

### Production
- Email failures will prevent reset (security)
- No console logging of tokens
- Must use email links
- Set `NODE_ENV=production`
- Use HTTPS (set `cookie.secure: true`)
- Use strong `SESSION_SECRET`
- Use dedicated email service (SendGrid, Mailgun, etc.)

## Future Enhancements

Possible improvements:
- Rate limiting on password reset requests
- CAPTCHA on forgot password form
- Password strength meter
- Password history (prevent reusing old passwords)
- Multi-factor authentication
- SMS-based password reset option

## Support

For issues or questions:
1. Check console logs (both client and server)
2. Verify database migration completed
3. Test email configuration
4. Review this documentation

---

**Implementation Date:** March 2026
**Version:** 1.0
**Status:** ✅ Complete and Ready for Testing
