# Email Verification - Quick Start

## 🚀 Setup in 3 Minutes

### Step 1: Run Database Migration

```bash
mysql -u root -p prisville_02 < database/add_email_verification.sql
```

This adds email verification columns to your users table.

### Step 2: Email Already Configured? ✅

If you already set up email for password reset, you're done! The same configuration works for email verification.

Your `.env` file should have:
```env
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=resortprisvilletriangle@gmail.com
EMAIL_PASS=gslj ikkt xvml zhxb
EMAIL_FROM=Prisville Resort <resortprisvilletriangle@gmail.com>
APP_URL=http://localhost:8080
```

### Step 3: Restart Server

```bash
npm run dev
```

## ✅ That's It!

Email verification is now active!

## 🧪 Test It Now

### Test New Registration:

1. Go to http://localhost:8080
2. Click "Sign up" in login modal
3. Fill in registration form
4. Click "Sign Up"
5. Check your email for verification link
6. Click the link to verify

### Test Login Before Verification:

1. Register new account
2. Try to log in without verifying
3. You'll see: "Please verify your email before logging in"
4. Click "Resend Verification Email" button
5. Enter your email to get new verification link

## 🔑 Key Features

✅ **Email verification required** for new registrations  
✅ **Can't log in** until email is verified  
✅ **Resend verification** option available  
✅ **Auto-login** after successful verification  
✅ **Welcome email** sent after verification  
✅ **Staff accounts** (admin/receptionist) bypass verification  

## 📧 No Email Configured?

If you skip email setup, the system still works in development:
- Registration succeeds
- Verification token appears in console logs
- Manually visit: `http://localhost:8080/verify-email?token=TOKEN_FROM_CONSOLE`
- Verification will work normally

## ⚠️ Important Notes

### Existing Users
The migration automatically marks existing users as verified, so they won't be locked out.

### Staff Accounts
Admin and receptionist accounts can log in without email verification (for convenience).

### Token Expiration
Verification links expire after **24 hours**. Users can request a new one.

## 🆘 Troubleshooting

### Can't Log In?
If using an old test account, manually verify it:
```sql
UPDATE users SET email_verified = TRUE WHERE email = 'your@email.com';
```

### Email Not Receiving?
1. Check spam folder
2. Check console logs for verification URL
3. Use "Resend Verification Email" button
4. Verify email config in `.env`

### Token Expired?
Request a new verification email - tokens expire after 24 hours.

## 📖 Complete Documentation

- **[EMAIL_VERIFICATION_IMPLEMENTATION.md](./EMAIL_VERIFICATION_IMPLEMENTATION.md)** - Full implementation guide
- **[PASSWORD_RESET_IMPLEMENTATION.md](./PASSWORD_RESET_IMPLEMENTATION.md)** - Password reset documentation

## 🎯 Complete Flow Example

```
1. User clicks "Sign up" → Registration form appears
2. User enters name, email, password → Submits form
3. Account created (unverified) → Verification email sent
4. Modal closes → Toast: "Please check your email to verify your account"
5. User checks email → Clicks verification link
6. Redirected to /verify-email → Token verified automatically
7. Email marked as verified → Welcome email sent
8. User auto-logged in → Redirected to home page
9. User can now use all features → Session active
```

## ✨ Ready to Use!

Your email verification system is now fully functional. New users must verify their email before accessing the platform.

For password reset, see: [PASSWORD_RESET_QUICKSTART.md](./PASSWORD_RESET_QUICKSTART.md)
