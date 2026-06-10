//utils/mailer.js

import nodemailer from 'nodemailer';

// Create reusable transporter
const createTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: process.env.SMTP_PORT === '465',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    }
  });
};

// 📧 Send OTP Email
export const sendOtpEmail = async (email, otp, name) => {
  try {
    const transporter = createTransporter();

    const mailOptions = {
      from: `"RideGo" <${process.env.SMTP_FROM}>`,
      to: email,
      subject: 'Verify Your RideGo Account - OTP Code',
      text: `
Hello ${name},

Welcome to RideGo! To complete your registration, please verify your email address using the OTP code below:

Your OTP Code: ${otp}

⏱️ This code will expire in 10 minutes.

If you didn't request this code, please ignore this email.

Best regards,
The RideGo Team
      `.trim(),
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Verify Your RideGo Account</title>
        </head>
        <body style="margin: 0; padding: 0; background-color: #f5f5f5; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Helvetica Neue', Arial, sans-serif;">
          <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 40px 20px;">
            <tr>
              <td align="center">
                <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);">
                  
                  <tr>
                    <td style="background-color: #000000; padding: 32px 40px; text-align: center;">
                      <table width="100%" cellpadding="0" cellspacing="0">
                        <tr>
                          <td align="center">
                            <div style="width: 56px; height: 56px; background-color: #ffffff; border-radius: 12px; display: inline-flex; align-items: center; justify-content: center; margin-bottom: 16px;">
                              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M5 13l4-8h6l4 8M5 13v5a2 2 0 002 2h10a2 2 0 002-2v-5M5 13h14M7 17h.01M17 17h.01" stroke="#000000" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                              </svg>
                            </div>
                            <h1 style="color: #ffffff; margin: 0; font-size: 32px; font-weight: 700; letter-spacing: -0.5px;">RideGo</h1>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>

                  <tr>
                    <td style="padding: 48px 40px;">
                      <table width="100%" cellpadding="0" cellspacing="0">
                        <tr>
                          <td align="center" style="padding-bottom: 24px;">
                            <div style="width: 80px; height: 80px; background-color: #000000; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center;">
                              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" stroke="#ffffff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                                <polyline points="22,6 12,13 2,6" stroke="#ffffff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                              </svg>
                            </div>
                          </td>
                        </tr>
                      </table>

                      <h2 style="color: #000000; font-size: 28px; font-weight: 600; margin: 0 0 16px 0; text-align: center; letter-spacing: -0.5px;">
                        Verify Your Email
                      </h2>
                      
                      <p style="color: #666666; font-size: 16px; line-height: 1.6; margin: 0 0 8px 0; text-align: center;">
                        Hello <strong style="color: #000000;">${name}</strong>,
                      </p>
                      
                      <p style="color: #666666; font-size: 16px; line-height: 1.6; margin: 0 0 32px 0; text-align: center;">
                        Welcome to RideGo! Enter this code to verify your account:
                      </p>

                      <table width="100%" cellpadding="0" cellspacing="0">
                        <tr>
                          <td align="center">
                            <div style="background-color: #f8f8f8; border: 2px solid #000000; border-radius: 16px; padding: 32px; margin: 0 0 24px 0; display: inline-block;">
                              <p style="color: #666666; font-size: 13px; text-transform: uppercase; letter-spacing: 1px; margin: 0 0 12px 0; font-weight: 600;">Your Verification Code</p>
                              <p style="color: #000000; font-size: 48px; font-weight: 700; letter-spacing: 12px; margin: 0; font-family: 'Courier New', monospace;">${otp}</p>
                            </div>
                          </td>
                        </tr>
                      </table>

                      <table width="100%" cellpadding="0" cellspacing="0">
                        <tr>
                          <td style="background-color: #fff3cd; border-left: 4px solid #000000; border-radius: 8px; padding: 16px 20px; margin: 0 0 32px 0;">
                            <table width="100%" cellpadding="0" cellspacing="0">
                              <tr>
                                <td width="24" valign="top">
                                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <circle cx="12" cy="12" r="10" stroke="#856404" stroke-width="2"/>
                                    <polyline points="12 6 12 12 16 14" stroke="#856404" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                                  </svg>
                                </td>
                                <td style="padding-left: 12px;">
                                  <p style="color: #856404; font-size: 14px; margin: 0; line-height: 1.5;">
                                    <strong>Time Sensitive:</strong> This code expires in 10 minutes for your security.
                                  </p>
                                </td>
                              </tr>
                            </table>
                          </td>
                        </tr>
                      </table>

                    </td>
                  </tr>

                  <tr>
                    <td style="background-color: #f8f8f8; padding: 24px 40px; text-align: center; border-top: 1px solid #e5e5e5;">
                      <p style="color: #999999; font-size: 13px; margin: 0 0 8px 0; line-height: 1.5;">
                        If you didn't request this code, you can safely ignore this email.
                      </p>
                      <p style="color: #999999; font-size: 12px; margin: 0;">
                        © 2025 RideGo. All rights reserved.
                      </p>
                    </td>
                  </tr>

                </table>
              </td>
            </tr>
          </table>
        </body>
        </html>
      `
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('✅ OTP Email sent:', info.messageId);
    return true;
  } catch (error) {
    console.error('❌ Email sending failed:', error.message);
    throw new Error('Failed to send OTP email');
  }
};

// 🔐 Send Password Reset Email
export const sendPasswordResetEmail = async (email, resetUrl, name) => {
  try {
    const transporter = createTransporter();

    const mailOptions = {
      from: `"RideGo" <${process.env.SMTP_FROM}>`,
      to: email,
      subject: 'Reset Your RideGo Password',
      text: `
Hello ${name},

We received a request to reset your password for your RideGo account.

Click the link below to reset your password:
${resetUrl}

⏱️ This link will expire in 1 hour.

If you didn't request a password reset, please ignore this email and your password will remain unchanged.

Best regards,
The RideGo Team
      `.trim(),
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Reset Your RideGo Password</title>
        </head>
        <body style="margin: 0; padding: 0; background-color: #f5f5f5; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Helvetica Neue', Arial, sans-serif;">
          <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 40px 20px;">
            <tr>
              <td align="center">
                <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);">
                  
                  <tr>
                    <td style="background-color: #000000; padding: 32px 40px; text-align: center;">
                      <table width="100%" cellpadding="0" cellspacing="0">
                        <tr>
                          <td align="center">
                            <div style="width: 56px; height: 56px; background-color: #ffffff; border-radius: 12px; display: inline-flex; align-items: center; justify-content: center; margin-bottom: 16px;">
                              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M5 13l4-8h6l4 8M5 13v5a2 2 0 002 2h10a2 2 0 002-2v-5M5 13h14M7 17h.01M17 17h.01" stroke="#000000" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                              </svg>
                            </div>
                            <h1 style="color: #ffffff; margin: 0; font-size: 32px; font-weight: 700; letter-spacing: -0.5px;">RideGo</h1>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>

                  <tr>
                    <td style="padding: 48px 40px;">
                      
                      <table width="100%" cellpadding="0" cellspacing="0">
                        <tr>
                          <td align="center" style="padding-bottom: 24px;">
                            <div style="width: 80px; height: 80px; background-color: #000000; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center;">
                              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" stroke="#ffffff" stroke-width="2"/>
                                <path d="M7 11V7a5 5 0 0 1 10 0v4" stroke="#ffffff" stroke-width="2"/>
                              </svg>
                            </div>
                          </td>
                        </tr>
                      </table>

                      <h2 style="color: #000000; font-size: 28px; font-weight: 600; margin: 0 0 16px 0; text-align: center; letter-spacing: -0.5px;">
                        Reset Your Password
                      </h2>
                      
                      <p style="color: #666666; font-size: 16px; line-height: 1.6; margin: 0 0 8px 0; text-align: center;">
                        Hello <strong style="color: #000000;">${name}</strong>,
                      </p>
                      
                      <p style="color: #666666; font-size: 16px; line-height: 1.6; margin: 0 0 32px 0; text-align: center;">
                        We received a request to reset the password for your RideGo account. Click the button below to create a new password:
                      </p>

                      <table width="100%" cellpadding="0" cellspacing="0">
                        <tr>
                          <td align="center" style="padding: 0 0 32px 0;">
                            <a href="${resetUrl}" style="display: inline-block; background-color: #000000; color: #ffffff; text-decoration: none; padding: 16px 48px; border-radius: 12px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);">
                              Reset Password
                            </a>
                          </td>
                        </tr>
                      </table>

                      <table width="100%" cellpadding="0" cellspacing="0">
                        <tr>
                          <td style="padding: 0 0 24px 0;">
                            <p style="color: #666666; font-size: 14px; line-height: 1.6; margin: 0; text-align: center;">
                              Or copy and paste this link into your browser:
                            </p>
                            <p style="color: #3b82f6; font-size: 13px; line-height: 1.6; margin: 8px 0 0 0; text-align: center; word-break: break-all;">
                              ${resetUrl}
                            </p>
                          </td>
                        </tr>
                      </table>

                      <table width="100%" cellpadding="0" cellspacing="0">
                        <tr>
                          <td style="background-color: #fff3cd; border-left: 4px solid #000000; border-radius: 8px; padding: 16px 20px; margin: 0 0 24px 0;">
                            <table width="100%" cellpadding="0" cellspacing="0">
                              <tr>
                                <td width="24" valign="top">
                                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <circle cx="12" cy="12" r="10" stroke="#856404" stroke-width="2"/>
                                    <polyline points="12 6 12 12 16 14" stroke="#856404" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                                  </svg>
                                </td>
                                <td style="padding-left: 12px;">
                                  <p style="color: #856404; font-size: 14px; margin: 0; line-height: 1.5;">
                                    <strong>Time Sensitive:</strong> This link expires in 1 hour for your security.
                                  </p>
                                </td>
                              </tr>
                            </table>
                          </td>
                        </tr>
                      </table>

                      <table width="100%" cellpadding="0" cellspacing="0">
                        <tr>
                          <td style="background-color: #f8f8f8; border-radius: 8px; padding: 16px 20px;">
                            <table width="100%" cellpadding="0" cellspacing="0">
                              <tr>
                                <td width="24" valign="top">
                                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" stroke="#666666" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                                  </svg>
                                </td>
                                <td style="padding-left: 12px;">
                                  <p style="color: #666666; font-size: 14px; margin: 0; line-height: 1.5;">
                                    <strong style="color: #000000;">Security Tip:</strong> If you didn't request this password reset, please ignore this email. Your password will remain unchanged.
                                  </p>
                                </td>
                              </tr>
                            </table>
                          </td>
                        </tr>
                      </table>

                    </td>
                  </tr>

                  <tr>
                    <td style="background-color: #f8f8f8; padding: 24px 40px; text-align: center; border-top: 1px solid #e5e5e5;">
                      <p style="color: #999999; font-size: 13px; margin: 0 0 8px 0; line-height: 1.5;">
                        If you didn't request this password reset, you can safely ignore this email.
                      </p>
                      <p style="color: #999999; font-size: 12px; margin: 0;">
                        © 2025 RideGo. All rights reserved.
                      </p>
                    </td>
                  </tr>

                </table>
              </td>
            </tr>
          </table>
        </body>
        </html>
      `
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('✅ Password Reset Email sent:', info.messageId);
    return true;
  } catch (error) {
    console.error('❌ Email sending failed:', error.message);
    throw new Error('Failed to send password reset email');
  }
}

// 🔐 Send Password Reset OTP Email
export const sendPasswordResetOtpEmail = async (email, otp, name) => {
  try {
    const transporter = createTransporter();

    const mailOptions = {
      from: `"RideGo" <${process.env.SMTP_FROM}>`,
      to: email,
      subject: 'Reset Your RideGo Password - OTP Code',
      text: `
Hello ${name},

We received a request to reset your password for your RideGo account.

Your OTP Code: ${otp}

⏱️ This code will expire in 5 minutes.

If you didn't request this password reset, please ignore this email and your password will remain unchanged.

Best regards,
The RideGo Team
      `.trim(),
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Reset Your RideGo Password</title>
        </head>
        <body style="margin: 0; padding: 0; background-color: #f5f5f5; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Helvetica Neue', Arial, sans-serif;">
          <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 40px 20px;">
            <tr>
              <td align="center">
                <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);">
                  
                  <tr>
                    <td style="background-color: #000000; padding: 32px 40px; text-align: center;">
                      <table width="100%" cellpadding="0" cellspacing="0">
                        <tr>
                          <td align="center">
                            <div style="width: 56px; height: 56px; background-color: #ffffff; border-radius: 12px; display: inline-flex; align-items: center; justify-content: center; margin-bottom: 16px;">
                              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M5 13l4-8h6l4 8M5 13v5a2 2 0 002 2h10a2 2 0 002-2v-5M5 13h14M7 17h.01M17 17h.01" stroke="#000000" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                              </svg>
                            </div>
                            <h1 style="color: #ffffff; margin: 0; font-size: 32px; font-weight: 700; letter-spacing: -0.5px;">RideGo</h1>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>

                  <tr>
                    <td style="padding: 48px 40px;">
                      
                      <table width="100%" cellpadding="0" cellspacing="0">
                        <tr>
                          <td align="center" style="padding-bottom: 24px;">
                            <div style="width: 80px; height: 80px; background-color: #000000; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center;">
                              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" stroke="#ffffff" stroke-width="2"/>
                                <path d="M7 11V7a5 5 0 0 1 10 0v4" stroke="#ffffff" stroke-width="2"/>
                              </svg>
                            </div>
                          </td>
                        </tr>
                      </table>

                      <h2 style="color: #000000; font-size: 28px; font-weight: 600; margin: 0 0 16px 0; text-align: center; letter-spacing: -0.5px;">
                        Reset Your Password
                      </h2>
                      
                      <p style="color: #666666; font-size: 16px; line-height: 1.6; margin: 0 0 8px 0; text-align: center;">
                        Hello <strong style="color: #000000;">${name}</strong>,
                      </p>
                      
                      <p style="color: #666666; font-size: 16px; line-height: 1.6; margin: 0 0 32px 0; text-align: center;">
                        Enter this code to reset your RideGo password:
                      </p>

                      <table width="100%" cellpadding="0" cellspacing="0">
                        <tr>
                          <td align="center">
                            <div style="background-color: #f8f8f8; border: 2px solid #000000; border-radius: 16px; padding: 32px; margin: 0 0 24px 0; display: inline-block;">
                              <p style="color: #666666; font-size: 13px; text-transform: uppercase; letter-spacing: 1px; margin: 0 0 12px 0; font-weight: 600;">Your Reset Code</p>
                              <p style="color: #000000; font-size: 48px; font-weight: 700; letter-spacing: 12px; margin: 0; font-family: 'Courier New', monospace;">${otp}</p>
                            </div>
                          </td>
                        </tr>
                      </table>

                      <table width="100%" cellpadding="0" cellspacing="0">
                        <tr>
                          <td style="background-color: #fff3cd; border-left: 4px solid #000000; border-radius: 8px; padding: 16px 20px; margin: 0 0 24px 0;">
                            <table width="100%" cellpadding="0" cellspacing="0">
                              <tr>
                                <td width="24" valign="top">
                                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <circle cx="12" cy="12" r="10" stroke="#856404" stroke-width="2"/>
                                    <polyline points="12 6 12 12 16 14" stroke="#856404" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                                  </svg>
                                </td>
                                <td style="padding-left: 12px;">
                                  <p style="color: #856404; font-size: 14px; margin: 0; line-height: 1.5;">
                                    <strong>Time Sensitive:</strong> This code expires in 5 minutes for your security.
                                  </p>
                                </td>
                              </tr>
                            </table>
                          </td>
                        </tr>
                      </table>

                    </td>
                  </tr>

                  <tr>
                    <td style="background-color: #f8f8f8; padding: 24px 40px; text-align: center; border-top: 1px solid #e5e5e5;">
                      <p style="color: #999999; font-size: 13px; margin: 0 0 8px 0; line-height: 1.5;">
                        If you didn't request this password reset, you can safely ignore this email.
                      </p>
                      <p style="color: #999999; font-size: 12px; margin: 0;">
                        © 2025 RideGo. All rights reserved.
                      </p>
                    </td>
                  </tr>

                </table>
              </td>
            </tr>
          </table>
        </body>
        </html>
      `
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('✅ Password reset OTP email sent:', info.messageId);
    return true;
  } catch (error) {
    console.error('❌ Email sending failed:', error.message);
    throw new Error('Failed to send password reset OTP email');
  }
};



// Add this function to your utils/mailer.js file

// 🚗 Send Booking Confirmation Email
export const sendBookingConfirmationEmail = async (email, bookingDetails) => {
  try {
    const transporter = createTransporter();

    const { userName, bookingId, vehicleName, amount, paymentId, bookingDate } = bookingDetails;

    const mailOptions = {
      from: `"RideGo" <${process.env.SMTP_FROM}>`,
      to: email,
      subject: 'RideGo Booking Confirmed 🚗',
      text: `
Hi ${userName},

Your RideGo booking has been confirmed successfully!

Booking Details:
- Booking ID: ${bookingId}
- Vehicle: ${vehicleName}
- Amount Paid: ₹${amount}
- Payment ID: ${paymentId}
- Booking Date: ${bookingDate}

A driver will be assigned to you within 5 minutes of booking.

Thank you for choosing RideGo. Have a safe ride!

Best regards,
The RideGo Team
      `.trim(),
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Booking Confirmed</title>
        </head>
        <body style="margin: 0; padding: 0; background-color: #f5f5f5; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Helvetica Neue', Arial, sans-serif;">
          <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 40px 20px;">
            <tr>
              <td align="center">
                <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);">
                  
                  <!-- Header -->
                  <tr>
                    <td style="background: linear-gradient(135deg, #000000 0%, #1a1a1a 100%); padding: 32px 40px; text-align: center;">
                      <table width="100%" cellpadding="0" cellspacing="0">
                        <tr>
                          <td align="center">
                            <div style="width: 64px; height: 64px; background-color: #ffffff; border-radius: 16px; display: inline-flex; align-items: center; justify-content: center; margin-bottom: 16px; box-shadow: 0 4px 12px rgba(255, 255, 255, 0.2);">
                              <svg width="36" height="36" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M5 13l4-8h6l4 8M5 13v5a2 2 0 002 2h10a2 2 0 002-2v-5M5 13h14M7 17h.01M17 17h.01" stroke="#000000" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                              </svg>
                            </div>
                            <h1 style="color: #ffffff; margin: 0; font-size: 36px; font-weight: 700; letter-spacing: -0.5px;">RideGo</h1>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>

                  <!-- Success Badge -->
                  <tr>
                    <td style="padding: 40px 40px 0;">
                      <table width="100%" cellpadding="0" cellspacing="0">
                        <tr>
                          <td align="center">
                            <div style="width: 96px; height: 96px; background: linear-gradient(135deg, #10b981 0%, #059669 100%); border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; box-shadow: 0 8px 24px rgba(16, 185, 129, 0.3); margin-bottom: 24px;">
                              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M20 6L9 17l-5-5" stroke="#ffffff" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
                              </svg>
                            </div>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>

                  <!-- Main Content -->
                  <tr>
                    <td style="padding: 0 40px 40px;">
                      <h2 style="color: #000000; font-size: 32px; font-weight: 700; margin: 0 0 12px 0; text-align: center; letter-spacing: -0.5px;">
                        Booking Confirmed! 🎉
                      </h2>
                      
                      <p style="color: #666666; font-size: 16px; line-height: 1.6; margin: 0 0 32px 0; text-align: center;">
                        Hi <strong style="color: #000000;">${userName}</strong>, your RideGo booking has been confirmed successfully!
                      </p>

                      <!-- Booking Details Card -->
                      <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 32px;">
                        <tr>
                          <td style="background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%); border-radius: 16px; padding: 28px; border: 2px solid #000000;">
                            <table width="100%" cellpadding="0" cellspacing="0">
                              <tr>
                                <td style="padding-bottom: 4px;">
                                  <p style="color: #666666; font-size: 12px; text-transform: uppercase; letter-spacing: 1.5px; margin: 0; font-weight: 600;">Booking Details</p>
                                </td>
                              </tr>
                              <tr>
                                <td style="padding: 20px 0 0 0; border-top: 1px solid #dee2e6;">
                                  <table width="100%" cellpadding="0" cellspacing="0">
                                    <!-- Booking ID -->
                                    <tr>
                                      <td style="padding: 12px 0;">
                                        <table width="100%" cellpadding="0" cellspacing="0">
                                          <tr>
                                            <td width="40" valign="top">
                                              <div style="width: 32px; height: 32px; background-color: #000000; border-radius: 8px; display: inline-flex; align-items: center; justify-content: center;">
                                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" stroke="#ffffff" stroke-width="2"/>
                                                  <polyline points="14 2 14 8 20 8" stroke="#ffffff" stroke-width="2"/>
                                                </svg>
                                              </div>
                                            </td>
                                            <td style="padding-left: 12px;">
                                              <p style="color: #666666; font-size: 13px; margin: 0 0 2px 0; font-weight: 500;">Booking ID</p>
                                              <p style="color: #000000; font-size: 16px; font-weight: 600; margin: 0; font-family: 'Courier New', monospace;">${bookingId}</p>
                                            </td>
                                          </tr>
                                        </table>
                                      </td>
                                    </tr>
                                    
                                    <!-- Vehicle -->
                                    <tr>
                                      <td style="padding: 12px 0; border-top: 1px solid #dee2e6;">
                                        <table width="100%" cellpadding="0" cellspacing="0">
                                          <tr>
                                            <td width="40" valign="top">
                                              <div style="width: 32px; height: 32px; background-color: #000000; border-radius: 8px; display: inline-flex; align-items: center; justify-content: center;">
                                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                  <path d="M5 13l4-8h6l4 8M5 13v5a2 2 0 002 2h10a2 2 0 002-2v-5M5 13h14" stroke="#ffffff" stroke-width="2"/>
                                                </svg>
                                              </div>
                                            </td>
                                            <td style="padding-left: 12px;">
                                              <p style="color: #666666; font-size: 13px; margin: 0 0 2px 0; font-weight: 500;">Vehicle</p>
                                              <p style="color: #000000; font-size: 16px; font-weight: 600; margin: 0;">${vehicleName}</p>
                                            </td>
                                          </tr>
                                        </table>
                                      </td>
                                    </tr>

                                    <!-- Amount Paid -->
                                    <tr>
                                      <td style="padding: 12px 0; border-top: 1px solid #dee2e6;">
                                        <table width="100%" cellpadding="0" cellspacing="0">
                                          <tr>
                                            <td width="40" valign="top">
                                              <div style="width: 32px; height: 32px; background: linear-gradient(135deg, #10b981 0%, #059669 100%); border-radius: 8px; display: inline-flex; align-items: center; justify-content: center;">
                                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                  <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" stroke="#ffffff" stroke-width="2" stroke-linecap="round"/>
                                                </svg>
                                              </div>
                                            </td>
                                            <td style="padding-left: 12px;">
                                              <p style="color: #666666; font-size: 13px; margin: 0 0 2px 0; font-weight: 500;">Amount Paid</p>
                                              <p style="color: #10b981; font-size: 20px; font-weight: 700; margin: 0;">₹${amount}</p>
                                            </td>
                                          </tr>
                                        </table>
                                      </td>
                                    </tr>

                                    <!-- Payment ID -->
                                    <tr>
                                      <td style="padding: 12px 0; border-top: 1px solid #dee2e6;">
                                        <table width="100%" cellpadding="0" cellspacing="0">
                                          <tr>
                                            <td width="40" valign="top">
                                              <div style="width: 32px; height: 32px; background-color: #000000; border-radius: 8px; display: inline-flex; align-items: center; justify-content: center;">
                                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                  <rect x="1" y="4" width="22" height="16" rx="2" stroke="#ffffff" stroke-width="2"/>
                                                  <line x1="1" y1="10" x2="23" y2="10" stroke="#ffffff" stroke-width="2"/>
                                                </svg>
                                              </div>
                                            </td>
                                            <td style="padding-left: 12px;">
                                              <p style="color: #666666; font-size: 13px; margin: 0 0 2px 0; font-weight: 500;">Payment ID</p>
                                              <p style="color: #000000; font-size: 14px; font-weight: 600; margin: 0; font-family: 'Courier New', monospace; word-break: break-all;">${paymentId}</p>
                                            </td>
                                          </tr>
                                        </table>
                                      </td>
                                    </tr>

                                    <!-- Booking Date -->
                                    <tr>
                                      <td style="padding: 12px 0; border-top: 1px solid #dee2e6;">
                                        <table width="100%" cellpadding="0" cellspacing="0">
                                          <tr>
                                            <td width="40" valign="top">
                                              <div style="width: 32px; height: 32px; background-color: #000000; border-radius: 8px; display: inline-flex; align-items: center; justify-content: center;">
                                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                  <rect x="3" y="4" width="18" height="18" rx="2" stroke="#ffffff" stroke-width="2"/>
                                                  <line x1="16" y1="2" x2="16" y2="6" stroke="#ffffff" stroke-width="2" stroke-linecap="round"/>
                                                  <line x1="8" y1="2" x2="8" y2="6" stroke="#ffffff" stroke-width="2" stroke-linecap="round"/>
                                                  <line x1="3" y1="10" x2="21" y2="10" stroke="#ffffff" stroke-width="2"/>
                                                </svg>
                                              </div>
                                            </td>
                                            <td style="padding-left: 12px;">
                                              <p style="color: #666666; font-size: 13px; margin: 0 0 2px 0; font-weight: 500;">Booking Date & Time</p>
                                              <p style="color: #000000; font-size: 16px; font-weight: 600; margin: 0;">${bookingDate}</p>
                                            </td>
                                          </tr>
                                        </table>
                                      </td>
                                    </tr>
                                  </table>
                                </td>
                              </tr>
                            </table>
                          </td>
                        </tr>
                      </table>

                      <!-- Driver Assignment Notice -->
                      <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 32px;">
                        <tr>
                          <td style="background: linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%); border-left: 4px solid #3b82f6; border-radius: 12px; padding: 20px 24px;">
                            <table width="100%" cellpadding="0" cellspacing="0">
                              <tr>
                                <td width="48" valign="top">
                                  <div style="width: 40px; height: 40px; background-color: #3b82f6; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center;">
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                      <path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" stroke="#ffffff" stroke-width="2" stroke-linecap="round"/>
                                    </svg>
                                  </div>
                                </td>
                                <td style="padding-left: 16px;">
                                  <p style="color: #1e40af; font-size: 15px; font-weight: 600; margin: 0 0 4px 0;">
                                    Driver Assignment in Progress
                                  </p>
                                  <p style="color: #1e40af; font-size: 14px; margin: 0; line-height: 1.5;">
                                    A driver will be assigned to you within <strong>5 minutes</strong> of booking. You'll receive a notification once assigned.
                                  </p>
                                </td>
                              </tr>
                            </table>
                          </td>
                        </tr>
                      </table>

                      <!-- Thank You Message -->
                      <table width="100%" cellpadding="0" cellspacing="0">
                        <tr>
                          <td style="text-align: center; padding: 24px 0;">
                            <p style="color: #000000; font-size: 18px; font-weight: 600; margin: 0 0 8px 0;">
                              Thank you for choosing RideGo! 🚗
                            </p>
                            <p style="color: #666666; font-size: 15px; margin: 0; line-height: 1.6;">
                              Have a safe and pleasant journey!
                            </p>
                          </td>
                        </tr>
                      </table>

                    </td>
                  </tr>

                  <!-- Footer -->
                  <tr>
                    <td style="background-color: #f8f8f8; padding: 32px 40px; text-align: center; border-top: 1px solid #e5e5e5;">
                      <p style="color: #666666; font-size: 14px; margin: 0 0 16px 0; line-height: 1.6;">
                        Need help? Contact us at <a href="mailto:support@ridego.com" style="color: #000000; text-decoration: none; font-weight: 600;">support@ridego.com</a>
                      </p>
                      <p style="color: #999999; font-size: 12px; margin: 0;">
                        © 2025 RideGo. All rights reserved.
                      </p>
                    </td>
                  </tr>

                </table>
              </td>
            </tr>
          </table>
        </body>
        </html>
      `
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('✅ Booking confirmation email sent:', info.messageId);
    return true;
  } catch (error) {
    console.error('❌ Booking confirmation email failed:', error.message);
    throw new Error('Failed to send booking confirmation email');
  }
};

/**
 * Send driver assignment notification to user
 */
export const sendDriverAssignmentEmailToUser = async (to, details) => {
  const mailOptions = {
    from: `"RideGo" <${process.env.EMAIL_USER}>`,
    to: to,
    subject: '🚗 Driver Assigned for Your RideGo Booking',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
          }
          .container {
            background: #ffffff;
            border-radius: 10px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            overflow: hidden;
          }
          .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 30px;
            text-align: center;
          }
          .header h1 {
            margin: 0;
            font-size: 28px;
          }
          .content {
            padding: 30px;
          }
          .driver-card {
            background: #f8f9fa;
            border-left: 4px solid #667eea;
            padding: 20px;
            margin: 20px 0;
            border-radius: 5px;
          }
          .driver-card h3 {
            margin-top: 0;
            color: #667eea;
          }
          .info-row {
            display: flex;
            justify-content: space-between;
            padding: 10px 0;
            border-bottom: 1px solid #e0e0e0;
          }
          .info-row:last-child {
            border-bottom: none;
          }
          .label {
            font-weight: 600;
            color: #666;
          }
          .value {
            color: #333;
            font-weight: 500;
          }
          .highlight {
            background: #fff3cd;
            padding: 15px;
            border-radius: 5px;
            margin: 20px 0;
            border-left: 4px solid #ffc107;
          }
          .footer {
            background: #f8f9fa;
            padding: 20px;
            text-align: center;
            color: #666;
            font-size: 14px;
          }
          .button {
            display: inline-block;
            background: #667eea;
            color: white;
            padding: 12px 30px;
            text-decoration: none;
            border-radius: 5px;
            margin: 20px 0;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🚗 Driver Assigned!</h1>
            <p style="margin: 10px 0 0 0; font-size: 16px;">Your RideGo booking is confirmed</p>
          </div>
          
          <div class="content">
            <p>Dear <strong>${details.userName}</strong>,</p>
            
            <p>Great news! A driver has been assigned to your booking.</p>
            
            <div class="driver-card">
              <h3>👤 Your Driver Details</h3>
              <div class="info-row">
                <span class="label">Driver Name:</span>
                <span class="value">${details.driverName}</span>
              </div>
              <div class="info-row">
                <span class="label">Contact Number:</span>
                <span class="value">${details.driverPhone}</span>
              </div>
              <div class="info-row">
                <span class="label">Gender:</span>
                <span class="value">${details.driverGender}</span>
              </div>
            </div>
            
            <div class="highlight">
              <strong>📋 Booking Details</strong>
              <div style="margin-top: 10px;">
                <div class="info-row">
                  <span class="label">Booking ID:</span>
                  <span class="value">#${details.bookingId.slice(-8).toUpperCase()}</span>
                </div>
                <div class="info-row">
                  <span class="label">Vehicle:</span>
                  <span class="value">${details.vehicleName}</span>
                </div>
                <div class="info-row">
                  <span class="label">Pickup Date:</span>
                  <span class="value">${details.pickupDate}</span>
                </div>
                <div class="info-row">
                  <span class="label">Pickup Location:</span>
                  <span class="value">${details.pickupLocation}</span>
                </div>
              </div>
            </div>
            
            <p><strong>Next Steps:</strong></p>
            <ul>
              <li>Your driver will contact you before the pickup time</li>
              <li>Please keep your phone accessible</li>
              <li>Ensure you have your booking ID ready</li>
              <li>Have your documents (license, ID) ready for verification</li>
            </ul>
            
            <div style="text-align: center;">
              <a href="${process.env.FRONTEND_URL}/my-bookings" class="button">View Booking Details</a>
            </div>
          </div>
          
          <div class="footer">
            <p><strong>Need Help?</strong></p>
            <p>Contact us at support@ridego.com or call +91-1234567890</p>
            <p style="margin-top: 15px; font-size: 12px; color: #999;">
              This is an automated email from RideGo. Please do not reply to this email.
            </p>
          </div>
        </div>
      </body>
      </html>
    `
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log('✅ Driver assignment email sent to user:', to);
  } catch (error) {
    console.error('❌ Failed to send driver assignment email to user:', error);
    throw error;
  }
};

/**
 * Send ride assignment notification to driver
 */
export const sendDriverAssignmentEmailToDriver = async (to, details) => {
  const mailOptions = {
    from: `"RideGo" <${process.env.EMAIL_USER}>`,
    to: to,
    subject: '🚗 New Ride Assignment - RideGo',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
          }
          .container {
            background: #ffffff;
            border-radius: 10px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            overflow: hidden;
          }
          .header {
            background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%);
            color: white;
            padding: 30px;
            text-align: center;
          }
          .header h1 {
            margin: 0;
            font-size: 28px;
          }
          .content {
            padding: 30px;
          }
          .ride-card {
            background: #f8f9fa;
            border-left: 4px solid #11998e;
            padding: 20px;
            margin: 20px 0;
            border-radius: 5px;
          }
          .ride-card h3 {
            margin-top: 0;
            color: #11998e;
          }
          .info-row {
            display: flex;
            justify-content: space-between;
            padding: 10px 0;
            border-bottom: 1px solid #e0e0e0;
          }
          .info-row:last-child {
            border-bottom: none;
          }
          .label {
            font-weight: 600;
            color: #666;
          }
          .value {
            color: #333;
            font-weight: 500;
          }
          .alert {
            background: #fff3cd;
            padding: 15px;
            border-radius: 5px;
            margin: 20px 0;
            border-left: 4px solid #ffc107;
          }
          .footer {
            background: #f8f9fa;
            padding: 20px;
            text-align: center;
            color: #666;
            font-size: 14px;
          }
          .badge {
            display: inline-block;
            padding: 5px 10px;
            background: #11998e;
            color: white;
            border-radius: 15px;
            font-size: 12px;
            font-weight: 600;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🚗 New Ride Assignment</h1>
            <p style="margin: 10px 0 0 0; font-size: 16px;">You have a new booking</p>
          </div>
          
          <div class="content">
            <p>Dear <strong>${details.driverName}</strong>,</p>
            
            <p>You have been assigned a new ride! Please review the details below and prepare accordingly.</p>
            
            <div class="ride-card">
              <h3>👤 Customer Information</h3>
              <div class="info-row">
                <span class="label">Customer Name:</span>
                <span class="value">${details.customerName}</span>
              </div>
              <div class="info-row">
                <span class="label">Contact Number:</span>
                <span class="value">${details.customerPhone}</span>
              </div>
              <div class="info-row">
                <span class="label">Booking ID:</span>
                <span class="value">#${details.bookingId.slice(-8).toUpperCase()}</span>
              </div>
            </div>
            
            <div class="ride-card">
              <h3>🚗 Trip Details</h3>
              <div class="info-row">
                <span class="label">Vehicle:</span>
                <span class="value">${details.vehicleName} <span class="badge">${details.vehicleType}</span></span>
              </div>
              <div class="info-row">
                <span class="label">Trip Type:</span>
                <span class="value">${details.tripType.charAt(0).toUpperCase() + details.tripType.slice(1)}</span>
              </div>
              <div class="info-row">
                <span class="label">Pickup Date & Time:</span>
                <span class="value">${details.pickupDate}</span>
              </div>
              <div class="info-row">
                <span class="label">Pickup Location:</span>
                <span class="value">${details.pickupLocation}</span>
              </div>
              <div class="info-row">
                <span class="label">Drop Location:</span>
                <span class="value">${details.dropLocation}</span>
              </div>
            </div>
            
            <div class="alert">
              <strong>⚠️ Important Instructions:</strong>
              <ul style="margin: 10px 0 0 0; padding-left: 20px;">
                <li>Contact the customer at least 30 minutes before pickup</li>
                <li>Ensure the vehicle is clean and fueled</li>
                <li>Carry all necessary documents (license, vehicle papers)</li>
                <li>Be punctual and professional</li>
                <li>Follow all traffic rules and safety guidelines</li>
              </ul>
            </div>
            
            <p style="margin-top: 20px;">If you have any questions or face any issues, please contact our support team immediately.</p>
          </div>
          
          <div class="footer">
            <p><strong>Need Support?</strong></p>
            <p>Contact RideGo Support at support@ridego.com or call +91-1234567890</p>
            <p style="margin-top: 15px; font-size: 12px; color: #999;">
              This is an automated email from RideGo. Please do not reply to this email.
            </p>
          </div>
        </div>
      </body>
      </html>
    `
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log('✅ Ride assignment email sent to driver:', to);
  } catch (error) {
    console.error('❌ Failed to send ride assignment email to driver:', error);
    throw error;
  }
};


// utils/mailer.js
// Add this new function to your existing mailer.js

/**
 * Send Journey Completion Email
 */
export const sendJourneyCompletionEmail = async (email, details) => {
  try {
    const transporter = createTransporter();

    const { userName, bookingId, vehicleName, completionDate, totalAmount, pickupLocation, dropLocation } = details;

    const mailOptions = {
      from: `"RideGo" <${process.env.SMTP_FROM}>`,
      to: email,
      subject: 'Journey Completed – RideGo ✅',
      text: `
Hi ${userName},

Your journey has been successfully completed!

Journey Details:
- Booking ID: ${bookingId}
- Vehicle: ${vehicleName}
- Completed On: ${completionDate}
- From: ${pickupLocation}
- To: ${dropLocation}
- Total Amount: ₹${totalAmount}

Thank you for choosing RideGo. We hope you had a safe and pleasant journey!

We'd love to hear about your experience. Please consider leaving us a review.

Best regards,
The RideGo Team
      `.trim(),
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Journey Completed</title>
        </head>
        <body style="margin: 0; padding: 0; background-color: #f5f5f5; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Helvetica Neue', Arial, sans-serif;">
          <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 40px 20px;">
            <tr>
              <td align="center">
                <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);">
                  
                  <!-- Header -->
                  <tr>
                    <td style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 32px 40px; text-align: center;">
                      <table width="100%" cellpadding="0" cellspacing="0">
                        <tr>
                          <td align="center">
                            <div style="width: 64px; height: 64px; background-color: #ffffff; border-radius: 16px; display: inline-flex; align-items: center; justify-content: center; margin-bottom: 16px; box-shadow: 0 4px 12px rgba(255, 255, 255, 0.2);">
                              <svg width="36" height="36" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M5 13l4-8h6l4 8M5 13v5a2 2 0 002 2h10a2 2 0 002-2v-5M5 13h14M7 17h.01M17 17h.01" stroke="#10b981" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                              </svg>
                            </div>
                            <h1 style="color: #ffffff; margin: 0; font-size: 36px; font-weight: 700; letter-spacing: -0.5px;">RideGo</h1>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>

                  <!-- Success Badge -->
                  <tr>
                    <td style="padding: 40px 40px 0;">
                      <table width="100%" cellpadding="0" cellspacing="0">
                        <tr>
                          <td align="center">
                            <div style="width: 96px; height: 96px; background: linear-gradient(135deg, #10b981 0%, #059669 100%); border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; box-shadow: 0 8px 24px rgba(16, 185, 129, 0.3); margin-bottom: 24px;">
                              <svg width="56" height="56" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M20 6L9 17l-5-5" stroke="#ffffff" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
                              </svg>
                            </div>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>

                  <!-- Main Content -->
                  <tr>
                    <td style="padding: 0 40px 40px;">
                      <h2 style="color: #000000; font-size: 32px; font-weight: 700; margin: 0 0 12px 0; text-align: center; letter-spacing: -0.5px;">
                        Journey Completed! 🎉
                      </h2>
                      
                      <p style="color: #666666; font-size: 16px; line-height: 1.6; margin: 0 0 32px 0; text-align: center;">
                        Hi <strong style="color: #000000;">${userName}</strong>, your journey has been successfully completed. Thank you for riding with RideGo!
                      </p>

                      <!-- Journey Summary Card -->
                      <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 32px;">
                        <tr>
                          <td style="background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%); border-radius: 16px; padding: 28px; border: 2px solid #10b981;">
                            <table width="100%" cellpadding="0" cellspacing="0">
                              <tr>
                                <td style="padding-bottom: 4px;">
                                  <p style="color: #10b981; font-size: 12px; text-transform: uppercase; letter-spacing: 1.5px; margin: 0; font-weight: 600;">Journey Summary</p>
                                </td>
                              </tr>
                              <tr>
                                <td style="padding: 20px 0 0 0; border-top: 1px solid #dee2e6;">
                                  <table width="100%" cellpadding="0" cellspacing="0">
                                    
                                    <!-- Booking ID -->
                                    <tr>
                                      <td style="padding: 12px 0;">
                                        <table width="100%" cellpadding="0" cellspacing="0">
                                          <tr>
                                            <td width="40" valign="top">
                                              <div style="width: 32px; height: 32px; background-color: #10b981; border-radius: 8px; display: inline-flex; align-items: center; justify-content: center;">
                                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" stroke="#ffffff" stroke-width="2"/>
                                                  <polyline points="14 2 14 8 20 8" stroke="#ffffff" stroke-width="2"/>
                                                </svg>
                                              </div>
                                            </td>
                                            <td style="padding-left: 12px;">
                                              <p style="color: #666666; font-size: 13px; margin: 0 0 2px 0; font-weight: 500;">Booking ID</p>
                                              <p style="color: #000000; font-size: 16px; font-weight: 600; margin: 0; font-family: 'Courier New', monospace;">${bookingId.slice(-8).toUpperCase()}</p>
                                            </td>
                                          </tr>
                                        </table>
                                      </td>
                                    </tr>
                                    
                                    <!-- Vehicle -->
                                    <tr>
                                      <td style="padding: 12px 0; border-top: 1px solid #dee2e6;">
                                        <table width="100%" cellpadding="0" cellspacing="0">
                                          <tr>
                                            <td width="40" valign="top">
                                              <div style="width: 32px; height: 32px; background-color: #10b981; border-radius: 8px; display: inline-flex; align-items: center; justify-content: center;">
                                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                  <path d="M5 13l4-8h6l4 8M5 13v5a2 2 0 002 2h10a2 2 0 002-2v-5M5 13h14" stroke="#ffffff" stroke-width="2"/>
                                                </svg>
                                              </div>
                                            </td>
                                            <td style="padding-left: 12px;">
                                              <p style="color: #666666; font-size: 13px; margin: 0 0 2px 0; font-weight: 500;">Vehicle</p>
                                              <p style="color: #000000; font-size: 16px; font-weight: 600; margin: 0;">${vehicleName}</p>
                                            </td>
                                          </tr>
                                        </table>
                                      </td>
                                    </tr>

                                    <!-- Completion Date -->
                                    <tr>
                                      <td style="padding: 12px 0; border-top: 1px solid #dee2e6;">
                                        <table width="100%" cellpadding="0" cellspacing="0">
                                          <tr>
                                            <td width="40" valign="top">
                                              <div style="width: 32px; height: 32px; background-color: #10b981; border-radius: 8px; display: inline-flex; align-items: center; justify-content: center;">
                                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                  <circle cx="12" cy="12" r="10" stroke="#ffffff" stroke-width="2"/>
                                                  <polyline points="12 6 12 12 16 14" stroke="#ffffff" stroke-width="2"/>
                                                </svg>
                                              </div>
                                            </td>
                                            <td style="padding-left: 12px;">
                                              <p style="color: #666666; font-size: 13px; margin: 0 0 2px 0; font-weight: 500;">Completed On</p>
                                              <p style="color: #000000; font-size: 16px; font-weight: 600; margin: 0;">${completionDate}</p>
                                            </td>
                                          </tr>
                                        </table>
                                      </td>
                                    </tr>

                                    <!-- Route -->
                                    <tr>
                                      <td style="padding: 12px 0; border-top: 1px solid #dee2e6;">
                                        <table width="100%" cellpadding="0" cellspacing="0">
                                          <tr>
                                            <td width="40" valign="top">
                                              <div style="width: 32px; height: 32px; background-color: #10b981; border-radius: 8px; display: inline-flex; align-items: center; justify-content: center;">
                                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" stroke="#ffffff" stroke-width="2"/>
                                                  <circle cx="12" cy="10" r="3" stroke="#ffffff" stroke-width="2"/>
                                                </svg>
                                              </div>
                                            </td>
                                            <td style="padding-left: 12px;">
                                              <p style="color: #666666; font-size: 13px; margin: 0 0 2px 0; font-weight: 500;">Route</p>
                                              <p style="color: #000000; font-size: 14px; font-weight: 600; margin: 0; line-height: 1.5;">
                                                ${pickupLocation} → ${dropLocation}
                                              </p>
                                            </td>
                                          </tr>
                                        </table>
                                      </td>
                                    </tr>

                                    <!-- Total Amount -->
                                    <tr>
                                      <td style="padding: 12px 0; border-top: 1px solid #dee2e6;">
                                        <table width="100%" cellpadding="0" cellspacing="0">
                                          <tr>
                                            <td width="40" valign="top">
                                              <div style="width: 32px; height: 32px; background-color: #10b981; border-radius: 8px; display: inline-flex; align-items: center; justify-content: center;">
                                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                  <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" stroke="#ffffff" stroke-width="2" stroke-linecap="round"/>
                                                </svg>
                                              </div>
                                            </td>
                                            <td style="padding-left: 12px;">
                                              <p style="color: #666666; font-size: 13px; margin: 0 0 2px 0; font-weight: 500;">Total Amount</p>
                                              <p style="color: #10b981; font-size: 20px; font-weight: 700; margin: 0;">₹${totalAmount.toLocaleString()}</p>
                                            </td>
                                          </tr>
                                        </table>
                                      </td>
                                    </tr>

                                  </table>
                                </td>
                              </tr>
                            </table>
                          </td>
                        </tr>
                      </table>

                      <!-- Feedback Request -->
                      <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 24px;">
                        <tr>
                          <td style="background: linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%); border-left: 4px solid #3b82f6; border-radius: 12px; padding: 20px 24px; text-align: center;">
                            <p style="color: #1e40af; font-size: 16px; font-weight: 600; margin: 0 0 12px 0;">
                              How was your experience?
                            </p>
                            <p style="color: #1e40af; font-size: 14px; margin: 0 0 16px 0; line-height: 1.5;">
                              We'd love to hear your feedback to help us improve our service.
                            </p>
                            <a href="${process.env.FRONTEND_URL}/feedback?booking=${bookingId}" style="display: inline-block; background-color: #3b82f6; color: #ffffff; text-decoration: none; padding: 12px 32px; border-radius: 8px; font-weight: 600; font-size: 14px;">
                              Leave Feedback
                            </a>
                          </td>
                        </tr>
                      </table>

                      <!-- Thank You -->
                      <table width="100%" cellpadding="0" cellspacing="0">
                        <tr>
                          <td style="text-align: center; padding: 20px 0;">
                            <p style="color: #000000; font-size: 18px; font-weight: 600; margin: 0 0 8px 0;">
                              Thank you for choosing RideGo! 🙏
                            </p>
                            <p style="color: #666666; font-size: 15px; margin: 0; line-height: 1.6;">
                              We hope you had a safe and pleasant journey. See you again soon!
                            </p>
                          </td>
                        </tr>
                      </table>

                    </td>
                  </tr>

                  <!-- Footer -->
                  <tr>
                    <td style="background-color: #f8f8f8; padding: 32px 40px; text-align: center; border-top: 1px solid #e5e5e5;">
                      <p style="color: #666666; font-size: 14px; margin: 0 0 16px 0; line-height: 1.6;">
                        Need help? Contact us at <a href="mailto:support@ridego.com" style="color: #10b981; text-decoration: none; font-weight: 600;">support@ridego.com</a>
                      </p>
                      <p style="color: #999999; font-size: 12px; margin: 0;">
                        © 2025 RideGo. All rights reserved.
                      </p>
                    </td>
                  </tr>

                </table>
              </td>
            </tr>
          </table>
        </body>
        </html>
      `
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('✅ Journey completion email sent:', info.messageId);
    return true;
  } catch (error) {
    console.error('❌ Journey completion email failed:', error.message);
    throw new Error('Failed to send journey completion email');
  }
};

// backend/utils/mailer.js - ADD this function

/**
 * 📧 Send Driver Assignment Email
 */
export const sendDriverAssignmentEmail = async (details) => {
  const {
    customerEmail,
    customerName,
    bookingId,
    driverName,
    driverPhone,
    driverGender,
    vehicleName,
    pickupDate,
    pickupLocation
  } = details;

  const formatDate = (date) => {
    return new Date(date).toLocaleString('en-IN', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'Asia/Kolkata'
    });
  };

  const mailOptions = {
    from: `"RideGo" <${process.env.EMAIL_USER}>`,
    to: customerEmail,
    subject: `🚗 Driver Assigned - Booking #${bookingId.slice(-8)}`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
                    color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
          .driver-card { background: white; padding: 20px; border-radius: 8px; 
                         margin: 20px 0; border-left: 4px solid #10b981; }
          .info-row { display: flex; justify-content: space-between; 
                      padding: 10px 0; border-bottom: 1px solid #e5e7eb; }
          .label { font-weight: bold; color: #6b7280; }
          .value { color: #111827; }
          .cta-button { display: inline-block; background: #667eea; color: white; 
                        padding: 12px 30px; text-decoration: none; border-radius: 6px; 
                        margin: 20px 0; }
          .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>✅ Driver Assigned!</h1>
            <p>Your ride is ready</p>
          </div>
          
          <div class="content">
            <p>Hi <strong>${customerName}</strong>,</p>
            
            <p>Great news! We've assigned a driver to your booking.</p>
            
            <div class="driver-card">
              <h3 style="margin-top: 0; color: #10b981;">👤 Your Driver</h3>
              <div class="info-row">
                <span class="label">Name:</span>
                <span class="value">${driverName}</span>
              </div>
              <div class="info-row">
                <span class="label">Contact:</span>
                <span class="value">📞 ${driverPhone}</span>
              </div>
              <div class="info-row">
                <span class="label">Gender:</span>
                <span class="value">${driverGender}</span>
              </div>
            </div>

            <div class="driver-card">
              <h3 style="margin-top: 0; color: #3b82f6;">👤 Your Contact Information</h3>
              <div class="info-row" style="border-bottom: none;">
                <span class="label">Your Phone:</span>
                <span class="value">${details.customerPhone || 'Not provided'}</span>
              </div>
            </div>
            
            <h3>📋 Booking Details</h3>
            <div class="info-row">
              <span class="label">Booking ID:</span>
              <span class="value">#${bookingId.slice(-8)}</span>
            </div>
            <div class="info-row">
              <span class="label">Vehicle:</span>
              <span class="value">${vehicleName}</span>
            </div>
            <div class="info-row">
              <span class="label">Pickup Date:</span>
              <span class="value">${formatDate(pickupDate)}</span>
            </div>
            <div class="info-row" style="border-bottom: none;">
              <span class="label">Pickup Location:</span>
              <span class="value">${pickupLocation}</span>
            </div>
            
            <p style="margin-top: 20px;">
              <strong>Next Steps:</strong><br>
              • Your driver will contact you before pickup<br>
              • Be ready 15 minutes before scheduled time<br>
              • Keep your booking ID handy<br>
              • Carry a valid ID proof
            </p>
            
            <center>
              <a href="${process.env.FRONTEND_URL}/my-bookings" class="cta-button">
                View Booking Details
              </a>
            </center>
          </div>
          
          <div class="footer">
            <p>Need help? Contact us at support@ridego.com or +91 1234567890</p>
            <p>&copy; ${new Date().getFullYear()} RideGo. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `
  };

  try {
    const transporter = createTransporter();
    await transporter.sendMail(mailOptions);
    console.log(`✅ Driver assignment email sent to ${customerEmail}`);
    return true;
  } catch (error) {
    console.error('❌ Error sending driver assignment email:', error);
    throw error;
  }
};

// utils/mailer.js - COMPLETE PENALTY NOTIFICATION EMAIL

/**
 * 📧 Send Penalty Notification Email
 */
export const sendPenaltyNotificationEmail = async (email, details) => {
  try {
    const transporter = createTransporter();

    const { 
      userName, 
      bookingId, 
      vehicleName, 
      damageReason, 
      penaltyAmount, 
      totalAmount,
      pickupLocation,
      dropLocation
    } = details;

    const mailOptions = {
      from: `"RideGo" <${process.env.SMTP_FROM}>`,
      to: email,
      subject: '⚠️ Penalty Applied - Payment Required - RideGo',
      text: `
Hi ${userName},

A penalty has been applied to your booking due to vehicle damage.

Booking Details:
- Booking ID: ${bookingId}
- Vehicle: ${vehicleName}

Damage Reason:
${damageReason}

Penalty Amount: ₹${penaltyAmount.toLocaleString()}
Total Amount Due: ₹${totalAmount.toLocaleString()}

You must pay the penalty amount to complete this booking. Please log in to your account to make the payment.

If you have any questions, please contact our support team.

Best regards,
The RideGo Team
      `.trim(),
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Penalty Applied</title>
        </head>
        <body style="margin: 0; padding: 0; background-color: #f5f5f5; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Helvetica Neue', Arial, sans-serif;">
          <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 40px 20px;">
            <tr>
              <td align="center">
                <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);">
                  
                  <!-- Header -->
                  <tr>
                    <td style="background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%); padding: 32px 40px; text-align: center;">
                      <table width="100%" cellpadding="0" cellspacing="0">
                        <tr>
                          <td align="center">
                            <div style="width: 64px; height: 64px; background-color: #ffffff; border-radius: 16px; display: inline-flex; align-items: center; justify-content: center; margin-bottom: 16px; box-shadow: 0 4px 12px rgba(255, 255, 255, 0.2);">
                              <svg width="36" height="36" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" stroke="#dc2626" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                              </svg>
                            </div>
                            <h1 style="color: #ffffff; margin: 0; font-size: 36px; font-weight: 700; letter-spacing: -0.5px;">RideGo</h1>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>

                  <!-- Alert Badge -->
                  <tr>
                    <td style="padding: 40px 40px 0;">
                      <table width="100%" cellpadding="0" cellspacing="0">
                        <tr>
                          <td align="center">
                            <div style="width: 96px; height: 96px; background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%); border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; box-shadow: 0 8px 24px rgba(220, 38, 38, 0.3); margin-bottom: 24px;">
                              <svg width="56" height="56" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <circle cx="12" cy="12" r="10" stroke="#ffffff" stroke-width="2"/>
                                <line x1="12" y1="8" x2="12" y2="12" stroke="#ffffff" stroke-width="2" stroke-linecap="round"/>
                                <line x1="12" y1="16" x2="12.01" y2="16" stroke="#ffffff" stroke-width="2" stroke-linecap="round"/>
                              </svg>
                            </div>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>

                  <!-- Main Content -->
                  <tr>
                    <td style="padding: 0 40px 40px;">
                      <h2 style="color: #dc2626; font-size: 32px; font-weight: 700; margin: 0 0 12px 0; text-align: center; letter-spacing: -0.5px;">
                        Penalty Applied ⚠️
                      </h2>
                      
                      <p style="color: #666666; font-size: 16px; line-height: 1.6; margin: 0 0 32px 0; text-align: center;">
                        Hi <strong style="color: #000000;">${userName}</strong>, a penalty has been applied to your booking due to vehicle damage.
                      </p>

                      <!-- Booking Details Card -->
                      <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 24px;">
                        <tr>
                          <td style="background: linear-gradient(135deg, #fee2e2 0%, #fecaca 100%); border-radius: 16px; padding: 28px; border: 2px solid #dc2626;">
                            <table width="100%" cellpadding="0" cellspacing="0">
                              <tr>
                                <td style="padding-bottom: 4px;">
                                  <p style="color: #dc2626; font-size: 12px; text-transform: uppercase; letter-spacing: 1.5px; margin: 0; font-weight: 600;">Booking Details</p>
                                </td>
                              </tr>
                              <tr>
                                <td style="padding: 20px 0 0 0; border-top: 1px solid #fca5a5;">
                                  <table width="100%" cellpadding="0" cellspacing="0">
                                    
                                    <!-- Booking ID -->
                                    <tr>
                                      <td style="padding: 12px 0;">
                                        <table width="100%" cellpadding="0" cellspacing="0">
                                          <tr>
                                            <td width="40" valign="top">
                                              <div style="width: 32px; height: 32px; background-color: #dc2626; border-radius: 8px; display: inline-flex; align-items: center; justify-content: center;">
                                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" stroke="#ffffff" stroke-width="2"/>
                                                  <polyline points="14 2 14 8 20 8" stroke="#ffffff" stroke-width="2"/>
                                                </svg>
                                              </div>
                                            </td>
                                            <td style="padding-left: 12px;">
                                              <p style="color: #991b1b; font-size: 13px; margin: 0 0 2px 0; font-weight: 500;">Booking ID</p>
                                              <p style="color: #000000; font-size: 16px; font-weight: 600; margin: 0; font-family: 'Courier New', monospace;">${bookingId.slice(-8).toUpperCase()}</p>
                                            </td>
                                          </tr>
                                        </table>
                                      </td>
                                    </tr>
                                    
                                    <!-- Vehicle -->
                                    <tr>
                                      <td style="padding: 12px 0; border-top: 1px solid #fca5a5;">
                                        <table width="100%" cellpadding="0" cellspacing="0">
                                          <tr>
                                            <td width="40" valign="top">
                                              <div style="width: 32px; height: 32px; background-color: #dc2626; border-radius: 8px; display: inline-flex; align-items: center; justify-content: center;">
                                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                  <path d="M5 13l4-8h6l4 8M5 13v5a2 2 0 002 2h10a2 2 0 002-2v-5M5 13h14" stroke="#ffffff" stroke-width="2"/>
                                                </svg>
                                              </div>
                                            </td>
                                            <td style="padding-left: 12px;">
                                              <p style="color: #991b1b; font-size: 13px; margin: 0 0 2px 0; font-weight: 500;">Vehicle</p>
                                              <p style="color: #000000; font-size: 16px; font-weight: 600; margin: 0;">${vehicleName}</p>
                                            </td>
                                          </tr>
                                        </table>
                                      </td>
                                    </tr>

                                    <!-- Damage Reason -->
                                    <tr>
                                      <td style="padding: 12px 0; border-top: 1px solid #fca5a5;">
                                        <table width="100%" cellpadding="0" cellspacing="0">
                                          <tr>
                                            <td width="40" valign="top">
                                              <div style="width: 32px; height: 32px; background-color: #dc2626; border-radius: 8px; display: inline-flex; align-items: center; justify-content: center;">
                                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                  <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" stroke="#ffffff" stroke-width="2"/>
                                                </svg>
                                              </div>
                                            </td>
                                            <td style="padding-left: 12px;">
                                              <p style="color: #991b1b; font-size: 13px; margin: 0 0 6px 0; font-weight: 500;">Damage Reason</p>
                                              <p style="color: #000000; font-size: 14px; font-weight: 500; margin: 0; line-height: 1.5;">${damageReason}</p>
                                            </td>
                                          </tr>
                                        </table>
                                      </td>
                                    </tr>

                                    <!-- Location -->
                                    <tr>
                                      <td style="padding: 12px 0; border-top: 1px solid #fca5a5;">
                                        <table width="100%" cellpadding="0" cellspacing="0">
                                          <tr>
                                            <td width="40" valign="top">
                                              <div style="width: 32px; height: 32px; background-color: #dc2626; border-radius: 8px; display: inline-flex; align-items: center; justify-content: center;">
                                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" stroke="#ffffff" stroke-width="2"/>
                                                  <circle cx="12" cy="10" r="3" stroke="#ffffff" stroke-width="2"/>
                                                </svg>
                                              </div>
                                            </td>
                                            <td style="padding-left: 12px;">
                                              <p style="color: #991b1b; font-size: 13px; margin: 0 0 4px 0; font-weight: 500;">Route</p>
                                              <p style="color: #000000; font-size: 14px; font-weight: 600; margin: 0; line-height: 1.5;">
                                                ${pickupLocation} → ${dropLocation}
                                              </p>
                                            </td>
                                          </tr>
                                        </table>
                                      </td>
                                    </tr>

                                  </table>
                                </td>
                              </tr>
                            </table>
                          </td>
                        </tr>
                      </table>

                      <!-- Penalty Summary -->
                      <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 32px;">
                        <tr>
                          <td style="background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%); border-radius: 16px; padding: 28px; border: 2px solid #dc2626;">
                            <table width="100%" cellpadding="0" cellspacing="0">
                              <tr>
                                <td style="padding-bottom: 4px;">
                                  <p style="color: #dc2626; font-size: 12px; text-transform: uppercase; letter-spacing: 1.5px; margin: 0; font-weight: 600;">Payment Summary</p>
                                </td>
                              </tr>
                              <tr>
                                <td style="padding: 20px 0 0 0; border-top: 1px solid #dee2e6;">
                                  <table width="100%" cellpadding="0" cellspacing="0">
                                    <tr>
                                      <td style="padding: 12px 0;">
                                        <p style="color: #666666; font-size: 15px; margin: 0; font-weight: 600;">Original Booking Amount</p>
                                      </td>
                                      <td align="right" style="padding: 12px 0;">
                                        <p style="color: #000000; font-size: 16px; margin: 0; font-weight: 700;">₹${(totalAmount - penaltyAmount).toLocaleString()}</p>
                                      </td>
                                    </tr>
                                    <tr>
                                      <td style="padding: 12px 0; border-top: 1px solid #dee2e6;">
                                        <p style="color: #dc2626; font-size: 15px; margin: 0; font-weight: 700;">Penalty Amount</p>
                                      </td>
                                      <td align="right" style="padding: 12px 0; border-top: 1px solid #dee2e6;">
                                        <p style="color: #dc2626; font-size: 18px; margin: 0; font-weight: 800;">+ ₹${penaltyAmount.toLocaleString()}</p>
                                      </td>
                                    </tr>
                                    <tr>
                                      <td style="padding: 16px 0 0 0; border-top: 2px solid #dc2626;">
                                        <p style="color: #000000; font-size: 17px; margin: 0; font-weight: 800;">Total Amount Due</p>
                                      </td>
                                      <td align="right" style="padding: 16px 0 0 0; border-top: 2px solid #dc2626;">
                                        <p style="color: #dc2626; font-size: 24px; margin: 0; font-weight: 800;">₹${totalAmount.toLocaleString()}</p>
                                      </td>
                                    </tr>
                                  </table>
                                </td>
                              </tr>
                            </table>
                          </td>
                        </tr>
                      </table>

                      <!-- Action Required -->
                      <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 32px;">
                        <tr>
                          <td style="background: linear-gradient(135deg, #fff3cd 0%, #fef3c7 100%); border-left: 4px solid #f59e0b; border-radius: 12px; padding: 20px 24px;">
                            <table width="100%" cellpadding="0" cellspacing="0">
                              <tr>
                                <td width="48" valign="top">
                                  <div style="width: 40px; height: 40px; background-color: #f59e0b; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center;">
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                      <path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" stroke="#ffffff" stroke-width="2"/>
                                    </svg>
                                  </div>
                                </td>
                                <td style="padding-left: 16px;">
                                  <p style="color: #92400e; font-size: 16px; font-weight: 700; margin: 0 0 8px 0;">
                                    Payment Required
                                  </p>
                                  <p style="color: #92400e; font-size: 14px; margin: 0; line-height: 1.6;">
                                    You must pay the penalty amount of <strong>₹${penaltyAmount.toLocaleString()}</strong> to complete this booking. Please log in to your account and process the payment.
                                  </p>
                                </td>
                              </tr>
                            </table>
                          </td>
                        </tr>
                      </table>

                      <!-- Pay Button -->
                      <table width="100%" cellpadding="0" cellspacing="0">
                        <tr>
                          <td align="center" style="padding: 0 0 24px 0;">
                            <a href="${process.env.FRONTEND_URL}/my-bookings" style="display: inline-block; background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%); color: #ffffff; text-decoration: none; padding: 16px 48px; border-radius: 12px; font-weight: 700; font-size: 16px; box-shadow: 0 4px 12px rgba(220, 38, 38, 0.3);">
                              Pay Penalty Now
                            </a>
                          </td>
                        </tr>
                      </table>

                      <!-- Support Info -->
                      <table width="100%" cellpadding="0" cellspacing="0">
                        <tr>
                          <td style="text-align: center; padding: 24px 0; border-top: 2px solid #f1f3f5;">
                            <p style="color: #666666; font-size: 14px; margin: 0 0 8px 0; line-height: 1.6;">
                              If you have any questions or concerns about this penalty, please contact our support team.
                            </p>
                            <p style="color: #000000; font-size: 14px; margin: 0; font-weight: 600;">
                              Email: <a href="mailto:support@ridego.com" style="color: #dc2626; text-decoration: none;">support@ridego.com</a> | 
                              Phone: <a href="tel:+911234567890" style="color: #dc2626; text-decoration: none;">+91 1234567890</a>
                            </p>
                          </td>
                        </tr>
                      </table>

                    </td>
                  </tr>

                  <!-- Footer -->
                  <tr>
                    <td style="background-color: #f8f8f8; padding: 32px 40px; text-align: center; border-top: 1px solid #e5e5e5;">
                      <p style="color: #666666; font-size: 14px; margin: 0 0 8px 0; line-height: 1.6;">
                        This penalty was applied by our team after vehicle inspection.
                      </p>
                      <p style="color: #999999; font-size: 12px; margin: 0;">
                        © 2025 RideGo. All rights reserved.
                      </p>
                    </td>
                  </tr>

                </table>
              </td>
            </tr>
          </table>
        </body>
        </html>
      `
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('✅ Penalty notification email sent:', info.messageId);
    return true;
  } catch (error) {
    console.error('❌ Penalty notification email failed:', error.message);
    throw new Error('Failed to send penalty notification email');
  }
};