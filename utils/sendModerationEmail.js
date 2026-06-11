// utils/sendModerationEmail.js
const transporter = require("../config/mailer");

async function sendModerationEmail(to, subject, htmlBody) {
  try {
    await transporter.sendMail({
      from: process.env.EMAIL_USER, // uses same email as signup/forgot-password
      to,
      subject,
      html: htmlBody,
    });
    console.log(`Moderation email sent to ${to}`);
  } catch (err) {
    console.error("Failed to send moderation email:", err);
  }
}

module.exports = sendModerationEmail;
