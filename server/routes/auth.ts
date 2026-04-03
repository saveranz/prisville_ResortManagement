import { RequestHandler } from "express";
import db from "../db";
import { RowDataPacket, ResultSetHeader } from "mysql2";
import bcrypt from "bcrypt";
import crypto from "crypto";
import { sendPasswordResetEmail, sendPasswordChangedEmail, sendVerificationEmail, sendWelcomeEmail } from "../utils/emailService";

interface User extends RowDataPacket {
  id: number;
  email: string;
  password: string;
  name: string;
  role: 'client' | 'admin' | 'receptionist';
  created_at: Date;
  reset_token?: string;
  reset_token_expires?: Date;
  email_verified: boolean;
  verification_token?: string;
  verification_token_expires?: Date;
}

const SALT_ROUNDS = 10;

// Register a new user
export const register: RequestHandler = async (req, res) => {
  try {
    const { email, password, name } = req.body;

    // Validate input
    if (!email || !password || !name) {
      res.status(400).json({ 
        success: false, 
        message: 'Email, password, and name are required' 
      });
      return;
    }

    // Check if email already exists in users or pending_users
    const [existingUsers] = await db.query<User[]>(
      'SELECT * FROM users WHERE email = ?',
      [email]
    );

    if (existingUsers.length > 0) {
      res.status(400).json({ 
        success: false, 
        message: 'Email already registered' 
      });
      return;
    }

    const [pendingUsers] = await db.query<any[]>(
      'SELECT * FROM pending_users WHERE email = ?',
      [email]
    );

    // If user already has pending registration, update it with new token and resend email
    // This allows users to try registering again if they didn't receive the first email
    if (pendingUsers.length > 0) {
      const pendingUser = pendingUsers[0];
      
      // Generate new verification token
      const verificationToken = crypto.randomBytes(32).toString('hex');
      const hashedToken = crypto
        .createHash('sha256')
        .update(verificationToken)
        .digest('hex');
      const tokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000);
      
      // Update password if user changed it, and update verification token
      const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);
      await db.query(
        'UPDATE pending_users SET password = ?, name = ?, verification_token = ?, verification_token_expires = ? WHERE id = ?',
        [hashedPassword, name, hashedToken, tokenExpiry, pendingUser.id]
      );
      
      // Send verification email
      try {
        await sendVerificationEmail(email, verificationToken, name);
        console.log('✅ Verification email resent to existing pending user:', email);
      } catch (emailError) {
        console.error('❌ Failed to send verification email:', emailError);
        if (process.env.NODE_ENV === 'development') {
          const verificationUrl = `${process.env.FRONTEND_URL || 'http://localhost:8080'}/verify-email?token=${verificationToken}`;
          console.log('\n📧 EMAIL DELIVERY FAILED - Copy this URL to verify manually:');
          console.log('🔗', verificationUrl);
          console.log('');
        }
      }
      
      res.json({ 
        success: true, 
        message: 'A new verification email has been sent. Please check your inbox.',
        requiresVerification: true
      });
      return;
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

    // Generate verification token
    const verificationToken = crypto.randomBytes(32).toString('hex');
    
    // Hash the token before storing
    const hashedToken = crypto
      .createHash('sha256')
      .update(verificationToken)
      .digest('hex');

    // Set token expiry (24 hours from now)
    const tokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000);

    // Insert into pending_users table (not users table yet)
    // User will be moved to users table only after email verification
    const [result] = await db.query<ResultSetHeader>(
      'INSERT INTO pending_users (email, password, name, verification_token, verification_token_expires) VALUES (?, ?, ?, ?, ?)',
      [email, hashedPassword, name, hashedToken, tokenExpiry]
    );

    // Send verification email
    try {
      await sendVerificationEmail(email, verificationToken, name);
      console.log('✅ Verification email sent to:', email);
    } catch (emailError) {
      console.error('❌ Failed to send verification email:', emailError);
      if (process.env.NODE_ENV === 'development') {
        const verificationUrl = `${process.env.FRONTEND_URL || 'http://localhost:8080'}/verify-email?token=${verificationToken}`;
        console.log('\n📧 EMAIL DELIVERY FAILED - Copy this URL to verify manually:');
        console.log('🔗', verificationUrl);
        console.log('');
      }
    }

    console.log('✅ Pending registration created, verification email sent:', {
      pendingUserId: result.insertId,
      userEmail: email
    });

    res.json({ 
      success: true, 
      message: 'Please check your email to verify your account and complete registration.',
      requiresVerification: true
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Registration failed',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

// Login user
export const login: RequestHandler = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      res.status(400).json({ 
        success: false, 
        message: 'Email and password are required' 
      });
      return;
    }

    // Check user exists
    const [users] = await db.query<User[]>(
      'SELECT * FROM users WHERE email = ?',
      [email]
    );

    if (users.length === 0) {
      res.status(401).json({ 
        success: false, 
        message: 'Invalid email or password' 
      });
      return;
    }

    const user = users[0];

    // Compare password with hashed password
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      res.status(401).json({ 
        success: false, 
        message: 'Invalid email or password' 
      });
      return;
    }

    // Check if email is verified (skip for staff accounts)
    if (!user.email_verified && user.role === 'client') {
      res.status(403).json({ 
        success: false, 
        message: 'Please verify your email before logging in. Check your inbox for the verification link.',
        requiresVerification: true,
        email: user.email
      });
      return;
    }

    // Store current session ID before it changes
    const currentSessionId = req.sessionID;

    // Store user in session
    req.session.userId = user.id;
    req.session.userEmail = user.email;
    req.session.userName = user.name;
    req.session.userRole = user.role;

    // Link any anonymous activity from this session to the user account
    try {
      await db.query(
        `UPDATE user_activity_tracking 
         SET user_id = ? 
         WHERE session_id = ? AND user_id IS NULL`,
        [user.id, currentSessionId]
      );
      console.log('✅ Linked session activities to user account');
    } catch (error) {
      console.error('Failed to link session activities:', error);
    }

    // Save session explicitly to ensure it's persisted
    req.session.save((err) => {
      if (err) {
        console.error('Session save error:', err);
        res.status(500).json({
          success: false,
          message: 'Failed to save session'
        });
        return;
      }

      console.log('✅ Login successful, session saved:', {
        sessionId: req.sessionID,
        userId: user.id,
        userEmail: user.email
      });

      res.json({ 
        success: true, 
        message: 'Login successful',
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role
        }
      });
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Login failed',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

// Get current user from session
export const getCurrentUser: RequestHandler = async (req, res) => {
  try {
    console.log('🔍 Auth check - Session ID:', req.sessionID);
    console.log('🔍 Auth check - Session data:', {
      userId: req.session.userId,
      userEmail: req.session.userEmail,
      userName: req.session.userName,
      userRole: req.session.userRole
    });
    console.log('🔍 Auth check - Cookies:', req.headers.cookie);

    if (!req.session.userId) {
      console.log('❌ No userId in session - not authenticated');
      res.status(401).json({ 
        success: false, 
        message: 'Not authenticated' 
      });
      return;
    }

    console.log('✅ User authenticated:', req.session.userEmail);
    res.json({ 
      success: true,
      user: {
        id: req.session.userId,
        email: req.session.userEmail,
        name: req.session.userName,
        role: req.session.userRole
      }
    });
  } catch (error) {
    console.error('Get current user error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to get user data'
    });
  }
};

// Logout user
export const logout: RequestHandler = async (req, res) => {
  try {
    req.session.destroy((err) => {
      if (err) {
        console.error('Logout error:', err);
        res.status(500).json({ 
          success: false, 
          message: 'Logout failed' 
        });
        return;
      }
      
      res.clearCookie('connect.sid');
      res.json({ 
        success: true, 
        message: 'Logout successful' 
      });
    });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Logout failed'
    });
  }
};

// Request password reset - sends email with reset token
export const requestPasswordReset: RequestHandler = async (req, res) => {
  try {
    const { email } = req.body;

    // Validate input
    if (!email) {
      res.status(400).json({ 
        success: false, 
        message: 'Email is required' 
      });
      return;
    }

    // Check if user exists
    const [users] = await db.query<User[]>(
      'SELECT * FROM users WHERE email = ?',
      [email]
    );

    // Always return success message for security (don't reveal if email exists)
    if (users.length === 0) {
      console.log('Password reset requested for non-existent email:', email);
      res.json({ 
        success: true, 
        message: 'If an account with that email exists, a password reset link has been sent.' 
      });
      return;
    }

    const user = users[0];

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    
    // Hash the token before storing
    const hashedToken = crypto
      .createHash('sha256')
      .update(resetToken)
      .digest('hex');

    // Set token expiry (1 hour from now)
    const tokenExpiry = new Date(Date.now() + 60 * 60 * 1000);

    // Store token in database
    await db.query(
      'UPDATE users SET reset_token = ?, reset_token_expires = ? WHERE id = ?',
      [hashedToken, tokenExpiry, user.id]
    );

    // Send reset email
    try {
      await sendPasswordResetEmail(email, resetToken, user.name);
      console.log('✅ Password reset email sent to:', email);
    } catch (emailError) {
      console.error('❌ Failed to send reset email:', emailError);
      // In development, still return success and log the reset URL
      if (process.env.NODE_ENV === 'development') {
        const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:8080'}/reset-password?token=${resetToken}`;
        console.log('\n📧 EMAIL DELIVERY FAILED - Copy this URL to reset password:');
        console.log('🔗', resetUrl);
        console.log('');
      }
    }

    res.json({ 
      success: true, 
      message: 'If an account with that email exists, a password reset link has been sent.' 
    });
  } catch (error) {
    console.error('Password reset request error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to process password reset request',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

// Verify reset token
export const verifyResetToken: RequestHandler = async (req, res) => {
  try {
    const { token } = req.body;

    if (!token) {
      res.status(400).json({ 
        success: false, 
        message: 'Reset token is required' 
      });
      return;
    }

    // Hash the provided token
    const hashedToken = crypto
      .createHash('sha256')
      .update(token)
      .digest('hex');

    // Find user with this token
    const [users] = await db.query<User[]>(
      'SELECT * FROM users WHERE reset_token = ? AND reset_token_expires > NOW()',
      [hashedToken]
    );

    if (users.length === 0) {
      res.status(400).json({ 
        success: false, 
        message: 'Invalid or expired reset token' 
      });
      return;
    }

    res.json({ 
      success: true, 
      message: 'Token is valid',
      email: users[0].email
    });
  } catch (error) {
    console.error('Token verification error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to verify token'
    });
  }
};

// Reset password with token
export const resetPassword: RequestHandler = async (req, res) => {
  try {
    const { token, newPassword } = req.body;

    // Validate input
    if (!token || !newPassword) {
      res.status(400).json({ 
        success: false, 
        message: 'Token and new password are required' 
      });
      return;
    }

    if (newPassword.length < 6) {
      res.status(400).json({ 
        success: false, 
        message: 'Password must be at least 6 characters long' 
      });
      return;
    }

    // Hash the provided token
    const hashedToken = crypto
      .createHash('sha256')
      .update(token)
      .digest('hex');

    // Find user with this token
    const [users] = await db.query<User[]>(
      'SELECT * FROM users WHERE reset_token = ? AND reset_token_expires > NOW()',
      [hashedToken]
    );

    if (users.length === 0) {
      res.status(400).json({ 
        success: false, 
        message: 'Invalid or expired reset token' 
      });
      return;
    }

    const user = users[0];

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, SALT_ROUNDS);

    // Update password and clear reset token
    await db.query(
      'UPDATE users SET password = ?, reset_token = NULL, reset_token_expires = NULL WHERE id = ?',
      [hashedPassword, user.id]
    );

    // Send confirmation email
    try {
      await sendPasswordChangedEmail(user.email, user.name);
      console.log('✅ Password changed confirmation email sent to:', user.email);
    } catch (emailError) {
      console.error('Failed to send confirmation email:', emailError);
      // Continue anyway - password was changed successfully
    }

    console.log('✅ Password reset successful for user:', user.email);

    res.json({ 
      success: true, 
      message: 'Password has been reset successfully. You can now log in with your new password.' 
    });
  } catch (error) {
    console.error('Password reset error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to reset password',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

// Verify email with token
export const verifyEmail: RequestHandler = async (req, res) => {
  try {
    const { token } = req.body;

    if (!token) {
      res.status(400).json({ 
        success: false, 
        message: 'Verification token is required' 
      });
      return;
    }

    // Hash the provided token
    const hashedToken = crypto
      .createHash('sha256')
      .update(token)
      .digest('hex');

    // First check if user already exists (already verified)
    const [existingUsers] = await db.query<User[]>(
      'SELECT * FROM users WHERE email IN (SELECT email FROM pending_users WHERE verification_token = ?)',
      [hashedToken]
    );

    if (existingUsers.length > 0) {
      res.json({ 
        success: true, 
        message: 'Email already verified. You can now log in.',
        alreadyVerified: true
      });
      return;
    }

    // Find pending user with this token
    const [pendingUsers] = await db.query<any[]>(
      'SELECT * FROM pending_users WHERE verification_token = ? AND verification_token_expires > NOW()',
      [hashedToken]
    );

    if (pendingUsers.length === 0) {
      res.status(400).json({ 
        success: false, 
        message: 'Invalid or expired verification token. Please request a new verification email.' 
      });
      return;
    }

    const pendingUser = pendingUsers[0];

    // Create the actual user account in users table
    const [result] = await db.query<ResultSetHeader>(
      'INSERT INTO users (email, password, name, role, email_verified) VALUES (?, ?, ?, ?, ?)',
      [pendingUser.email, pendingUser.password, pendingUser.name, 'client', true]
    );

    const newUserId = result.insertId;

    // Delete from pending_users table
    await db.query(
      'DELETE FROM pending_users WHERE id = ?',
      [pendingUser.id]
    );

    console.log('✅ User account created after email verification:', pendingUser.email);

    // Send welcome email
    try {
      await sendWelcomeEmail(pendingUser.email, pendingUser.name);
      console.log('✅ Welcome email sent to:', pendingUser.email);
    } catch (emailError) {
      console.error('Failed to send welcome email:', emailError);
      // Continue anyway - verification was successful
    }

    // Store current session ID before changes
    const currentSessionId = req.sessionID;

    // Auto-login the user after verification
    req.session.userId = newUserId;
    req.session.userEmail = pendingUser.email;
    req.session.userName = pendingUser.name;
    req.session.userRole = 'client';

    // Link any anonymous activity from this session to the user account
    try {
      await db.query(
        `UPDATE user_activity_tracking 
         SET user_id = ? 
         WHERE session_id = ? AND user_id IS NULL`,
        [newUserId, currentSessionId]
      );
      console.log('✅ Linked session activities to verified user account');
    } catch (error) {
      console.error('Failed to link session activities:', error);
    }

    // Save session explicitly
    req.session.save((err) => {
      if (err) {
        console.error('Session save error:', err);
        // Still return success - they can log in manually
        res.json({ 
          success: true, 
          message: 'Email verified successfully! Please log in to continue.'
        });
        return;
      }

      console.log('✅ Email verification successful and user logged in:', pendingUser.email);

      res.json({ 
        success: true, 
        message: 'Email verified successfully! Your account has been created. Welcome to Prisville Resort.',
        user: {
          id: newUserId,
          email: pendingUser.email,
          name: pendingUser.name,
          role: 'client'
        }
      });
    });
  } catch (error) {
    console.error('Email verification error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to verify email',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

// Resend verification email
export const resendVerification: RequestHandler = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      res.status(400).json({ 
        success: false, 
        message: 'Email is required' 
      });
      return;
    }

    // Check if user already exists (already verified)
    const [existingUsers] = await db.query<User[]>(
      'SELECT * FROM users WHERE email = ?',
      [email]
    );

    if (existingUsers.length > 0) {
      res.json({ 
        success: true, 
        message: 'This email is already verified. You can log in to your account.' 
      });
      return;
    }

    // Find pending user by email
    const [pendingUsers] = await db.query<any[]>(
      'SELECT * FROM pending_users WHERE email = ?',
      [email]
    );

    if (pendingUsers.length === 0) {
      // Don't reveal if email exists or not (security best practice)
      res.json({ 
        success: true, 
        message: 'If a pending registration exists for that email, a new verification email has been sent.' 
      });
      return;
    }

    const pendingUser = pendingUsers[0];

    // Generate new verification token
    const verificationToken = crypto.randomBytes(32).toString('hex');
    
    // Hash the token before storing
    const hashedToken = crypto
      .createHash('sha256')
      .update(verificationToken)
      .digest('hex');

    // Set token expiry (24 hours from now)
    const tokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000);

    // Update verification token in pending_users
    await db.query(
      'UPDATE pending_users SET verification_token = ?, verification_token_expires = ? WHERE id = ?',
      [hashedToken, tokenExpiry, pendingUser.id]
    );

    // Send verification email
    try {
      await sendVerificationEmail(email, verificationToken, pendingUser.name);
      console.log('✅ Verification email resent to:', email);
    } catch (emailError) {
      console.error('❌ Failed to resend verification email:', emailError);
      if (process.env.NODE_ENV === 'development') {
        const verificationUrl = `${process.env.FRONTEND_URL || 'http://localhost:8080'}/verify-email?token=${verificationToken}`;
        console.log('\n📧 EMAIL DELIVERY FAILED - Copy this URL to verify manually:');
        console.log('🔗', verificationUrl);
        console.log('');
      }
    }

    res.json({ 
      success: true, 
      message: 'A new verification email has been sent. Please check your inbox.' 
    });
  } catch (error) {
    console.error('Resend verification error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to resend verification email',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};
