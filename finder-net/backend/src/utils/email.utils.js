/**
 * Email Utility Functions
 * Send emails using Nodemailer
 */

const nodemailer = require('nodemailer');

// Create transporter
const createTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    secure: false,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD
    }
  });
};

/**
 * Send email
 * @param {Object} options - Email options
 */
const sendEmail = async (options) => {
  try {
    const transporter = createTransporter();

    const mailOptions = {
      from: process.env.EMAIL_FROM,
      to: options.to,
      subject: options.subject,
      html: options.html,
      text: options.text
    };

    await transporter.sendMail(mailOptions);
    console.log('Email sent successfully to:', options.to);
  } catch (error) {
    console.error('Email send error:', error);
    throw new Error('Failed to send email');
  }
};

/**
 * Send welcome email
 */
const sendWelcomeEmail = async (user) => {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #4F46E5;">Welcome to Finder-Net!</h2>
      <p>Hi ${user.name},</p>
      <p>Thank you for joining Finder-Net - the AI-powered lost and found management system.</p>
      <p>You can now:</p>
      <ul>
        <li>Report lost items</li>
        <li>Report found items</li>
        <li>Get AI-powered match suggestions</li>
        <li>Connect with other users</li>
      </ul>
      <p>Get started by visiting your dashboard!</p>
      <p>Best regards,<br>The Finder-Net Team</p>
    </div>
  `;

  await sendEmail({
    to: user.email,
    subject: 'Welcome to Finder-Net',
    html
  });
};

/**
 * Send password reset email
 */
const sendPasswordResetEmail = async (user, resetToken) => {
  const resetUrl = `${process.env.CLIENT_URL}/reset-password?token=${resetToken}`;

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #4F46E5;">Password Reset Request</h2>
      <p>Hi ${user.name},</p>
      <p>You requested to reset your password. Click the button below to reset it:</p>
      <div style="text-align: center; margin: 30px 0;">
        <a href="${resetUrl}" style="background-color: #4F46E5; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
          Reset Password
        </a>
      </div>
      <p>Or copy and paste this link in your browser:</p>
      <p style="color: #666; word-break: break-all;">${resetUrl}</p>
      <p>This link will expire in 1 hour.</p>
      <p>If you didn't request this, please ignore this email.</p>
      <p>Best regards,<br>The Finder-Net Team</p>
    </div>
  `;

  await sendEmail({
    to: user.email,
    subject: 'Password Reset - Finder-Net',
    html
  });
};

/**
 * Send match notification email
 */
const sendMatchNotificationEmail = async (user, item, matchedItem) => {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #4F46E5;">🎯 Potential Match Found!</h2>
      <p>Hi ${user.name},</p>
      <p>Great news! We found a potential match for your ${item.type} item:</p>
      <div style="background-color: #f9fafb; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <h3 style="margin-top: 0;">${item.title}</h3>
        <p><strong>Matched with:</strong> ${matchedItem.title}</p>
        <p><strong>Location:</strong> ${matchedItem.location.city}</p>
      </div>
      <div style="text-align: center; margin: 30px 0;">
        <a href="${process.env.CLIENT_URL}/items/${matchedItem.id}" style="background-color: #4F46E5; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
          View Match
        </a>
      </div>
      <p>Best regards,<br>The Finder-Net Team</p>
    </div>
  `;

  await sendEmail({
    to: user.email,
    subject: 'Potential Match Found - Finder-Net',
    html
  });
};

/**
 * Send item approval notification
 */
const sendItemApprovalEmail = async (user, item, approved) => {
  const status = approved ? 'Approved' : 'Rejected';
  const color = approved ? '#10B981' : '#EF4444';

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: ${color};">Item ${status}</h2>
      <p>Hi ${user.name},</p>
      <p>Your ${item.type} item report has been ${approved ? 'approved' : 'rejected'} by our admin team.</p>
      <div style="background-color: #f9fafb; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <h3 style="margin-top: 0;">${item.title}</h3>
        <p><strong>Category:</strong> ${item.category}</p>
        <p><strong>Status:</strong> ${status}</p>
      </div>
      ${approved ? `
        <p>Your item is now visible to other users and will be matched using our AI system.</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${process.env.CLIENT_URL}/items/${item.id}" style="background-color: #4F46E5; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
            View Item
          </a>
        </div>
      ` : `
        <p>Please contact support if you have any questions.</p>
      `}
      <p>Best regards,<br>The Finder-Net Team</p>
    </div>
  `;

  await sendEmail({
    to: user.email,
    subject: `Item ${status} - Finder-Net`,
    html
  });
};

module.exports = {
  sendEmail,
  sendWelcomeEmail,
  sendPasswordResetEmail,
  sendMatchNotificationEmail,
  sendItemApprovalEmail
};
