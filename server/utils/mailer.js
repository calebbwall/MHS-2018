const nodemailer = require('nodemailer');

// Create transporter once at module load
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

const FROM = process.env.EMAIL_FROM || 'MHS Class of 2018 <noreply@example.com>';
const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173';

/**
 * Internal helper — wraps sendMail; errors are logged, never thrown.
 */
async function send(options) {
  // Skip sending if SMTP credentials are not configured
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.log('[mailer] SMTP not configured — email skipped:', options.subject);
    return;
  }
  try {
    await transporter.sendMail({ from: FROM, ...options });
  } catch (err) {
    console.error('[mailer] Failed to send email:', err.message);
  }
}

// -------------------------------------------------------
// Email helpers
// -------------------------------------------------------

/** Sent to a new user right after they register. */
async function sendPendingApprovalEmail(user) {
  await send({
    to: user.email,
    subject: 'MHS 2018 — Your account is pending approval',
    html: `
      <p>Hi ${user.full_name},</p>
      <p>Thanks for signing up for the <strong>Magnolia High School Class of 2018 Alumni Hub</strong>!</p>
      <p>Your account is currently pending approval by an administrator. You'll receive another email as soon as you're approved.</p>
      <p>— The MHS 2018 Admin Team</p>
    `,
  });
}

/** Sent when an admin approves the user's account. */
async function sendApprovalEmail(user) {
  await send({
    to: user.email,
    subject: 'MHS 2018 — Your account has been approved!',
    html: `
      <p>Hi ${user.full_name},</p>
      <p>Great news — your <strong>MHS Class of 2018 Alumni Hub</strong> account has been approved!</p>
      <p><a href="${CLIENT_URL}/directory">Click here to explore the class directory</a></p>
      <p>See you there!</p>
      <p>— The MHS 2018 Admin Team</p>
    `,
  });
}

/** Sent to a message receiver when they receive a new message. */
async function sendNewMessageNotification(senderName, receiverEmail, senderUserId) {
  await send({
    to: receiverEmail,
    subject: `MHS 2018 — New message from ${senderName}`,
    html: `
      <p>You have a new message from <strong>${senderName}</strong>.</p>
      <p><a href="${CLIENT_URL}/messages/conversation/${senderUserId}">Click here to read it</a></p>
      <p>— The MHS 2018 Alumni Hub</p>
    `,
  });
}

/** Sent by an admin to all approved users as a class-wide announcement. */
async function sendAnnouncementEmail(recipientEmails, subject, body) {
  if (!recipientEmails || recipientEmails.length === 0) return;
  await send({
    // BCC all recipients to protect email privacy
    bcc: recipientEmails.join(','),
    subject,
    html: `
      <p>${body.replace(/\n/g, '<br>')}</p>
      <hr>
      <p style="font-size:12px;color:#999;">You received this because you are a member of the MHS Class of 2018 Alumni Hub.</p>
    `,
  });
}

module.exports = {
  sendPendingApprovalEmail,
  sendApprovalEmail,
  sendNewMessageNotification,
  sendAnnouncementEmail,
};
