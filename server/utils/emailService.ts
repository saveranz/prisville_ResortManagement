import nodemailer from 'nodemailer';

// Email configuration
// In production, use environment variables for sensitive data
const EMAIL_USER = process.env.EMAIL_USER || 'noreply@prisville.com';
const EMAIL_PASS = process.env.EMAIL_PASS || '';
const EMAIL_HOST = process.env.EMAIL_HOST || 'smtp.gmail.com';
const EMAIL_PORT = parseInt(process.env.EMAIL_PORT || '587');
const EMAIL_FROM = process.env.EMAIL_FROM || 'Prisville Resort <noreply@prisville.com>';

// Create reusable transporter
const transporter = nodemailer.createTransport({
  host: EMAIL_HOST,
  port: EMAIL_PORT,
  secure: EMAIL_PORT === 465, // true for 465, false for other ports
  auth: {
    user: EMAIL_USER,
    pass: EMAIL_PASS,
  },
});

// Test email connection (optional, for debugging)
export const testEmailConnection = async () => {
  try {
    await transporter.verify();
    console.log('✅ Email server is ready to send messages');
    return true;
  } catch (error) {
    console.error('❌ Email server connection failed:', error);
    return false;
  }
};

// Send password reset email
export const sendPasswordResetEmail = async (
  to: string,
  resetToken: string,
  userName: string
) => {
  // In development, construct the reset URL
  const resetUrl = `${process.env.APP_URL || 'http://localhost:8080'}/reset-password?token=${resetToken}`;
  
  const mailOptions = {
    from: EMAIL_FROM,
    to,
    subject: 'Password Reset Request - Prisville Resort',
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body {
              font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
              line-height: 1.6;
              color: #333;
              background-color: #f4f4f4;
              margin: 0;
              padding: 0;
            }
            .container {
              max-width: 600px;
              margin: 20px auto;
              background: white;
              border-radius: 10px;
              overflow: hidden;
              box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            }
            .header {
              background: linear-gradient(135deg, #1f2937 0%, #374151 100%);
              color: white;
              padding: 30px;
              text-align: center;
            }
            .header h1 {
              margin: 0;
              font-size: 24px;
            }
            .content {
              padding: 40px 30px;
            }
            .content p {
              margin: 15px 0;
            }
            .button {
              display: inline-block;
              padding: 15px 35px;
              background: #1f2937;
              color: white;
              text-decoration: none;
              border-radius: 5px;
              margin: 20px 0;
              font-weight: bold;
            }
            .button:hover {
              background: #374151;
            }
            .button-container {
              text-align: center;
            }
            .footer {
              background: #f9fafb;
              padding: 20px 30px;
              text-align: center;
              font-size: 12px;
              color: #6b7280;
              border-top: 1px solid #e5e7eb;
            }
            .warning {
              background: #fef3c7;
              border-left: 4px solid #f59e0b;
              padding: 15px;
              margin: 20px 0;
              border-radius: 4px;
            }
            .divider {
              border: 0;
              height: 1px;
              background: #e5e7eb;
              margin: 25px 0;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🔐 Password Reset Request</h1>
            </div>
            <div class="content">
              <p>Hello <strong>${userName}</strong>,</p>
              
              <p>We received a request to reset your password for your Prisville Resort account.</p>
              
              <div class="button-container">
                <a href="${resetUrl}" class="button">Reset Your Password</a>
              </div>
              
              <p style="text-align: center; color: #6b7280; font-size: 14px;">
                Or copy and paste this link into your browser:<br>
                <a href="${resetUrl}" style="color: #1f2937; word-break: break-all;">${resetUrl}</a>
              </p>
              
              <hr class="divider">
              
              <div class="warning">
                <strong>⏰ This link will expire in 1 hour</strong><br>
                For security reasons, this password reset link is only valid for 1 hour.
              </div>
              
              <p><strong>🔒 Security Tips:</strong></p>
              <ul>
                <li>If you didn't request this password reset, please ignore this email. Your password will remain unchanged.</li>
                <li>Never share your password reset link with anyone.</li>
                <li>Always use a strong, unique password for your account.</li>
              </ul>
              
              <p>If you continue to have problems, please contact our support team.</p>
              
              <p>Best regards,<br>
              <strong>The Prisville Resort Team</strong></p>
            </div>
            <div class="footer">
              <p>© ${new Date().getFullYear()} Prisville Resort. All rights reserved.</p>
              <p>This is an automated message, please do not reply to this email.</p>
            </div>
          </div>
        </body>
      </html>
    `,
    text: `
Hello ${userName},

We received a request to reset your password for your Prisville Resort account.

Reset your password by clicking this link:
${resetUrl}

This link will expire in 1 hour for security reasons.

If you didn't request this password reset, please ignore this email. Your password will remain unchanged.

Best regards,
The Prisville Resort Team

© ${new Date().getFullYear()} Prisville Resort. All rights reserved.
    `.trim(),
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('✅ Password reset email sent:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('❌ Failed to send password reset email:', error);
    // In development, log the reset URL for testing
    if (process.env.NODE_ENV === 'development') {
      console.log('🔗 Password Reset URL (for testing):', resetUrl);
    }
    throw error;
  }
};

// Send password change confirmation email
export const sendPasswordChangedEmail = async (
  to: string,
  userName: string
) => {
  const mailOptions = {
    from: EMAIL_FROM,
    to,
    subject: 'Password Changed Successfully - Prisville Resort',
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body {
              font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
              line-height: 1.6;
              color: #333;
              background-color: #f4f4f4;
              margin: 0;
              padding: 0;
            }
            .container {
              max-width: 600px;
              margin: 20px auto;
              background: white;
              border-radius: 10px;
              overflow: hidden;
              box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            }
            .header {
              background: linear-gradient(135deg, #059669 0%, #10b981 100%);
              color: white;
              padding: 30px;
              text-align: center;
            }
            .header h1 {
              margin: 0;
              font-size: 24px;
            }
            .content {
              padding: 40px 30px;
            }
            .content p {
              margin: 15px 0;
            }
            .footer {
              background: #f9fafb;
              padding: 20px 30px;
              text-align: center;
              font-size: 12px;
              color: #6b7280;
              border-top: 1px solid #e5e7eb;
            }
            .alert {
              background: #fef2f2;
              border-left: 4px solid #ef4444;
              padding: 15px;
              margin: 20px 0;
              border-radius: 4px;
            }
            .success-icon {
              font-size: 48px;
              text-align: center;
              margin: 20px 0;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>✅ Password Changed Successfully</h1>
            </div>
            <div class="content">
              <div class="success-icon">🔓</div>
              
              <p>Hello <strong>${userName}</strong>,</p>
              
              <p>Your password for your Prisville Resort account has been successfully changed.</p>
              
              <p><strong>Change Details:</strong></p>
              <ul>
                <li>Date & Time: ${new Date().toLocaleString()}</li>
                <li>Account: ${to}</li>
              </ul>
              
              <div class="alert">
                <strong>⚠️ Didn't make this change?</strong><br>
                If you did not change your password, please contact our support team immediately. Your account may be compromised.
              </div>
              
              <p>If you made this change, no further action is required. You can now use your new password to log in to your account.</p>
              
              <p>Best regards,<br>
              <strong>The Prisville Resort Team</strong></p>
            </div>
            <div class="footer">
              <p>© ${new Date().getFullYear()} Prisville Resort. All rights reserved.</p>
              <p>This is an automated message, please do not reply to this email.</p>
            </div>
          </div>
        </body>
      </html>
    `,
    text: `
Hello ${userName},

Your password for your Prisville Resort account has been successfully changed.

Change Details:
- Date & Time: ${new Date().toLocaleString()}
- Account: ${to}

If you did not make this change, please contact our support team immediately.

Best regards,
The Prisville Resort Team

© ${new Date().getFullYear()} Prisville Resort. All rights reserved.
    `.trim(),
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('✅ Password changed confirmation email sent:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('❌ Failed to send password changed email:', error);
    throw error;
  }
};

// Send email verification email
export const sendVerificationEmail = async (
  to: string,
  verificationToken: string,
  userName: string
) => {
  const verificationUrl = `${process.env.APP_URL || 'http://localhost:8080'}/verify-email?token=${verificationToken}`;
  
  const mailOptions = {
    from: EMAIL_FROM,
    to,
    subject: 'Verify Your Email - Prisville Resort',
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body {
              font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
              line-height: 1.6;
              color: #333;
              background-color: #f4f4f4;
              margin: 0;
              padding: 0;
            }
            .container {
              max-width: 600px;
              margin: 20px auto;
              background: white;
              border-radius: 10px;
              overflow: hidden;
              box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            }
            .header {
              background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
              color: white;
              padding: 30px;
              text-align: center;
            }
            .header h1 {
              margin: 0;
              font-size: 24px;
            }
            .content {
              padding: 40px 30px;
            }
            .content p {
              margin: 15px 0;
            }
            .button {
              display: inline-block;
              padding: 15px 35px;
              background: #3b82f6;
              color: white;
              text-decoration: none;
              border-radius: 5px;
              margin: 20px 0;
              font-weight: bold;
            }
            .button:hover {
              background: #2563eb;
            }
            .button-container {
              text-align: center;
            }
            .footer {
              background: #f9fafb;
              padding: 20px 30px;
              text-align: center;
              font-size: 12px;
              color: #6b7280;
              border-top: 1px solid #e5e7eb;
            }
            .info-box {
              background: #dbeafe;
              border-left: 4px solid #3b82f6;
              padding: 15px;
              margin: 20px 0;
              border-radius: 4px;
            }
            .divider {
              border: 0;
              height: 1px;
              background: #e5e7eb;
              margin: 25px 0;
            }
            .welcome-icon {
              font-size: 48px;
              text-align: center;
              margin: 20px 0;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🎉 Welcome to Prisville Resort!</h1>
            </div>
            <div class="content">
              <div class="welcome-icon">👋</div>
              
              <p>Hello <strong>${userName}</strong>,</p>
              
              <p>Thank you for starting your registration with Prisville Resort! We're excited to have you join our community.</p>
              
              <p><strong>To complete your account registration</strong>, please click the button below to verify your identity:</p>
              
              <div class="button-container">
                <a href="${verificationUrl}" class="button">✓ Verify User</a>
              </div>
              
              <p style="text-align: center; color: #6b7280; font-size: 14px;">
                Or copy and paste this link into your browser:<br>
                <a href="${verificationUrl}" style="color: #3b82f6; word-break: break-all;">${verificationUrl}</a>
              </p>
              
              <hr class="divider">
              
              <div class="info-box">
                <strong>⏰ This link will expire in 24 hours</strong><br>
                Please verify within 24 hours to complete your account registration.
              </div>
              
              <p><strong>What happens after verification?</strong></p>
              <ul>
                <li>✓ Your account will be fully registered and activated</li>
                <li>✓ You'll be automatically logged in</li>
                <li>✓ You can start booking rooms and amenities</li>
                <li>✓ You'll receive confirmations and updates via email</li>
              </ul>
              
              <p>If you didn't create this account, you can safely ignore this email.</p>
              
              <p>Best regards,<br>
              <strong>The Prisville Resort Team</strong></p>
            </div>
            <div class="footer">
              <p>© ${new Date().getFullYear()} Prisville Resort. All rights reserved.</p>
              <p>This is an automated message, please do not reply to this email.</p>
            </div>
          </div>
        </body>
      </html>
    `,
    text: `
Welcome to Prisville Resort!

Hello ${userName},

Thank you for starting your registration with Prisville Resort! We're excited to have you join our community.

To complete your account registration, please verify your identity by clicking this link:
${verificationUrl}

This link will expire in 24 hours for security reasons.

What happens after verification?
- Your account will be fully registered and activated
- You'll be automatically logged in
- You can start booking rooms and amenities
- You'll receive confirmations and updates via email

If you didn't create this account, you can safely ignore this email.

Best regards,
The Prisville Resort Team

© ${new Date().getFullYear()} Prisville Resort. All rights reserved.
    `.trim(),
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('✅ Verification email sent:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('❌ Failed to send verification email:', error);
    // In development, log the verification URL for testing
    if (process.env.NODE_ENV === 'development') {
      console.log('🔗 Verification URL (for testing):', verificationUrl);
    }
    throw error;
  }
};

// Send welcome email after verification
export const sendWelcomeEmail = async (
  to: string,
  userName: string
) => {
  const mailOptions = {
    from: EMAIL_FROM,
    to,
    subject: 'Welcome to Prisville Resort - Account Verified!',
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body {
              font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
              line-height: 1.6;
              color: #333;
              background-color: #f4f4f4;
              margin: 0;
              padding: 0;
            }
            .container {
              max-width: 600px;
              margin: 20px auto;
              background: white;
              border-radius: 10px;
              overflow: hidden;
              box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            }
            .header {
              background: linear-gradient(135deg, #059669 0%, #10b981 100%);
              color: white;
              padding: 30px;
              text-align: center;
            }
            .header h1 {
              margin: 0;
              font-size: 24px;
            }
            .content {
              padding: 40px 30px;
            }
            .content p {
              margin: 15px 0;
            }
            .button {
              display: inline-block;
              padding: 15px 35px;
              background: #059669;
              color: white;
              text-decoration: none;
              border-radius: 5px;
              margin: 20px 0;
              font-weight: bold;
            }
            .button:hover {
              background: #047857;
            }
            .button-container {
              text-align: center;
            }
            .footer {
              background: #f9fafb;
              padding: 20px 30px;
              text-align: center;
              font-size: 12px;
              color: #6b7280;
              border-top: 1px solid #e5e7eb;
            }
            .success-icon {
              font-size: 56px;
              text-align: center;
              margin: 20px 0;
            }
            .feature-box {
              background: #f0fdf4;
              border-left: 4px solid #10b981;
              padding: 15px;
              margin: 20px 0;
              border-radius: 4px;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>✨ Account Verified Successfully!</h1>
            </div>
            <div class="content">
              <div class="success-icon">🎊</div>
              
              <p>Hello <strong>${userName}</strong>,</p>
              
              <p>Congratulations! Your email has been verified and your Prisville Resort account is now fully activated.</p>
              
              <div class="feature-box">
                <strong>🌟 What's Next?</strong>
                <ul style="margin: 10px 0;">
                  <li>Book your dream vacation rooms</li>
                  <li>Reserve exclusive amenities and facilities</li>
                  <li>Purchase day passes for pool and spa access</li>
                  <li>Receive personalized recommendations</li>
                  <li>Get notified about special promotions</li>
                </ul>
              </div>
              
              <div class="button-container">
                <a href="${process.env.APP_URL || 'http://localhost:8080'}" class="button">Start Exploring</a>
              </div>
              
              <p>We're thrilled to have you as part of the Prisville Resort family. If you have any questions or need assistance, our support team is always here to help.</p>
              
              <p>Happy booking and enjoy your stay!</p>
              
              <p>Best regards,<br>
              <strong>The Prisville Resort Team</strong></p>
            </div>
            <div class="footer">
              <p>© ${new Date().getFullYear()} Prisville Resort. All rights reserved.</p>
              <p>This is an automated message, please do not reply to this email.</p>
            </div>
          </div>
        </body>
      </html>
    `,
    text: `
Account Verified Successfully!

Hello ${userName},

Congratulations! Your email has been verified and your Prisville Resort account is now fully activated.

What's Next?
- Book your dream vacation rooms
- Reserve exclusive amenities and facilities
- Purchase day passes for pool and spa access
- Receive personalized recommendations
- Get notified about special promotions

Visit us at: ${process.env.APP_URL || 'http://localhost:8080'}

We're thrilled to have you as part of the Prisville Resort family. If you have any questions or need assistance, our support team is always here to help.

Happy booking and enjoy your stay!

Best regards,
The Prisville Resort Team

© ${new Date().getFullYear()} Prisville Resort. All rights reserved.
    `.trim(),
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('✅ Welcome email sent:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('❌ Failed to send welcome email:', error);
    throw error;
  }
};

export default transporter;
