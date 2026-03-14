# Password Reset Quick Start Guide

## 🚀 Quick Setup (5 minutes)

### Step 1: Run Database Migration

Open your MySQL client (or Laragon Terminal) and run:

```bash
mysql -u root -p prisville_02 < database/add_password_reset_tokens.sql
```

Or in MySQL Workbench/phpMyAdmin, run this SQL:

```sql
ALTER TABLE users 
ADD COLUMN reset_token VARCHAR(255) NULL,
ADD COLUMN reset_token_expires DATETIME NULL,
ADD INDEX idx_reset_token (reset_token);
```

### Step 2: Configure Email (Optional for Testing)

1. Copy `.env.example` to `.env` (if not exists)
2. Add your email configuration:

```env
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
EMAIL_FROM=Prisville Resort <noreply@prisville.com>
APP_URL=http://localhost:8080
```

**For Gmail:**
- Enable 2-Factor Authentication
- Generate App Password: [Google Account → Security → App Passwords](https://myaccount.google.com/apppasswords)
- Use the generated password in `EMAIL_PASS`

**Skip Email Setup?**
- The system will work without email configuration in development mode
- Reset tokens will be logged to the console
- You can manually test using the console token

### Step 3: Restart Server

```bash
npm run dev
```

### Step 4: Test It!

1. Go to http://localhost:8080
2. Click login button
3. Click "Forgot password?"
4. Enter email (e.g., admin@prisville.com)
5. Check console for reset link (if email not configured)
6. Or check your email inbox

## ✅ That's It!

The password reset feature is now fully functional!

## 📖 Need More Details?

See [PASSWORD_RESET_IMPLEMENTATION.md](./PASSWORD_RESET_IMPLEMENTATION.md) for:
- Complete API documentation
- Security features
- Troubleshooting guide
- Production deployment tips

## 🎯 Quick Test Without Email

```bash
# 1. Request reset
curl -X POST http://localhost:8080/api/auth/request-password-reset \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@prisville.com"}'

# 2. Check server console for token
# 3. Use token in reset URL:
# http://localhost:8080/reset-password?token=YOUR_TOKEN_HERE
```
