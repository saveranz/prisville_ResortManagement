import { RequestHandler } from "express";
import db from "../db";
import { RowDataPacket, ResultSetHeader } from "mysql2";
import bcrypt from "bcrypt";

interface User extends RowDataPacket {
  id: number;
  email: string;
  password: string;
  name: string;
  role: 'client' | 'admin' | 'receptionist';
  created_at: Date;
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

    // Check if user already exists
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

    // Hash password
    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

    // Insert new user (default role is 'client')
    const [result] = await db.query<ResultSetHeader>(
      'INSERT INTO users (email, password, name, role) VALUES (?, ?, ?, ?)',
      [email, hashedPassword, name, 'client']
    );

    // Store current session ID before changes
    const currentSessionId = req.sessionID;

    // Store user in session
    req.session.userId = result.insertId;
    req.session.userEmail = email;
    req.session.userName = name;
    req.session.userRole = 'client';

    // Link any anonymous activity from this session to the new user account
    try {
      await db.query(
        `UPDATE user_activity_tracking 
         SET user_id = ? 
         WHERE session_id = ? AND user_id IS NULL`,
        [result.insertId, currentSessionId]
      );
      console.log('✅ Linked session activities to new user account');
    } catch (error) {
      console.error('Failed to link session activities:', error);
    }

    // Save session explicitly
    req.session.save((err) => {
      if (err) {
        console.error('Session save error:', err);
        res.status(500).json({
          success: false,
          message: 'Registration successful but failed to save session. Please login.'
        });
        return;
      }

      console.log('✅ Registration successful, session saved:', {
        sessionId: req.sessionID,
        userId: result.insertId,
        userEmail: email
      });

      res.json({ 
        success: true, 
        message: 'Registration successful! Please login with your credentials.',
        user: {
          id: result.insertId,
          email,
          name,
          role: 'client'
        }
      });
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
