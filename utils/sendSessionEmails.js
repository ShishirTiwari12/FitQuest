const transporter = require("../config/mailer");

// Sent to user after payment is confirmed
async function sendSessionConfirmationEmail(
  to,
  { userName, expertName, specialization, date, startTime, endTime, amount },
) {
  const html = `
    <!DOCTYPE html>
    <html>
    <body style="margin:0;padding:0;background:#0f0f0f;font-family:'Segoe UI',sans-serif;">
      <div style="max-width:560px;margin:40px auto;background:#1a1a1a;border-radius:16px;overflow:hidden;border:1px solid #2a2a2a;">
        <div style="background:linear-gradient(135deg,#f97316,#dc2626);padding:32px 40px;">
          <h1 style="margin:0;color:#fff;font-size:24px;font-weight:700;">Session Booked! 🎉</h1>
          <p style="margin:8px 0 0;color:rgba(255,255,255,0.85);font-size:14px;">Your expert session is confirmed</p>
        </div>
        <div style="padding:32px 40px;">
          <p style="color:#d4d4d4;font-size:15px;margin:0 0 24px;">Hi <strong style="color:#fff;">${userName}</strong>,</p>
          <p style="color:#a3a3a3;font-size:14px;margin:0 0 24px;">Your session has been successfully booked and payment confirmed. Here are your session details:</p>

          <div style="background:#242424;border-radius:12px;padding:20px 24px;margin-bottom:24px;">
            <table style="width:100%;border-collapse:collapse;">
              <tr>
                <td style="color:#737373;font-size:13px;padding:8px 0;width:40%;">Expert</td>
                <td style="color:#fff;font-size:13px;font-weight:600;">${expertName}</td>
              </tr>
              <tr>
                <td style="color:#737373;font-size:13px;padding:8px 0;">Specialization</td>
                <td style="color:#f97316;font-size:13px;font-weight:600;">${specialization}</td>
              </tr>
              <tr>
                <td style="color:#737373;font-size:13px;padding:8px 0;">Date</td>
                <td style="color:#fff;font-size:13px;font-weight:600;">${date}</td>
              </tr>
              <tr>
                <td style="color:#737373;font-size:13px;padding:8px 0;">Time</td>
                <td style="color:#fff;font-size:13px;font-weight:600;">${startTime} – ${endTime}</td>
              </tr>
              <tr>
                <td style="color:#737373;font-size:13px;padding:8px 0;">Amount Paid</td>
                <td style="color:#22c55e;font-size:13px;font-weight:600;">NPR ${amount}</td>
              </tr>
            </table>
          </div>

          <div style="background:#1c2a1c;border:1px solid #166534;border-radius:12px;padding:16px 20px;margin-bottom:24px;">
            <p style="margin:0;color:#86efac;font-size:13px;">⏳ <strong>Zoom link coming soon!</strong> Your expert will send the Zoom meeting link to this email before your session.</p>
          </div>

          <p style="color:#525252;font-size:12px;margin:0;">If you have any issues, please contact FitQuest support.</p>
        </div>
        <div style="padding:20px 40px;border-top:1px solid #2a2a2a;text-align:center;">
          <p style="margin:0;color:#404040;font-size:12px;">© ${new Date().getFullYear()} FitQuest. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  await transporter.sendMail({
    from: process.env.EMAIL_USER,
    to,
    subject: `✅ Session Confirmed – ${expertName} on ${date}`,
    html,
  });

  console.log(`Session confirmation email sent to ${to}`);
}

// Sent to user when expert submits zoom link via dashboard
async function sendZoomLinkEmail(
  to,
  { userName, expertName, date, startTime, endTime, zoomLink },
) {
  const html = `
    <!DOCTYPE html>
    <html>
    <body style="margin:0;padding:0;background:#0f0f0f;font-family:'Segoe UI',sans-serif;">
      <div style="max-width:560px;margin:40px auto;background:#1a1a1a;border-radius:16px;overflow:hidden;border:1px solid #2a2a2a;">
        <div style="background:linear-gradient(135deg,#2563eb,#7c3aed);padding:32px 40px;">
          <h1 style="margin:0;color:#fff;font-size:24px;font-weight:700;">Your Zoom Link is Ready! 🎥</h1>
          <p style="margin:8px 0 0;color:rgba(255,255,255,0.85);font-size:14px;">Join your expert session</p>
        </div>
        <div style="padding:32px 40px;">
          <p style="color:#d4d4d4;font-size:15px;margin:0 0 24px;">Hi <strong style="color:#fff;">${userName}</strong>,</p>
          <p style="color:#a3a3a3;font-size:14px;margin:0 0 24px;">Your expert <strong style="color:#fff;">${expertName}</strong> has set up your Zoom session. Here are the details:</p>

          <div style="background:#242424;border-radius:12px;padding:20px 24px;margin-bottom:24px;">
            <table style="width:100%;border-collapse:collapse;">
              <tr>
                <td style="color:#737373;font-size:13px;padding:8px 0;width:40%;">Date</td>
                <td style="color:#fff;font-size:13px;font-weight:600;">${date}</td>
              </tr>
              <tr>
                <td style="color:#737373;font-size:13px;padding:8px 0;">Time</td>
                <td style="color:#fff;font-size:13px;font-weight:600;">${startTime} – ${endTime}</td>
              </tr>
            </table>
          </div>

          <div style="text-align:center;margin:32px 0;">
            <a href="${zoomLink}" style="display:inline-block;background:linear-gradient(135deg,#2563eb,#7c3aed);color:#fff;text-decoration:none;font-size:15px;font-weight:700;padding:14px 36px;border-radius:12px;">
              🎥 Join Zoom Meeting
            </a>
          </div>

          <p style="color:#525252;font-size:12px;text-align:center;margin:0;">Or copy this link: <span style="color:#60a5fa;">${zoomLink}</span></p>
        </div>
        <div style="padding:20px 40px;border-top:1px solid #2a2a2a;text-align:center;">
          <p style="margin:0;color:#404040;font-size:12px;">© ${new Date().getFullYear()} FitQuest. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  await transporter.sendMail({
    from: process.env.EMAIL_USER,
    to,
    subject: `🎥 Zoom Link – Your session with ${expertName} on ${date}`,
    html,
  });

  console.log(`Zoom link email sent to ${to}`);
}

// Sent to expert when a new booking is confirmed
async function sendExpertBookingNotification(
  to,
  { expertName, userName, userEmail, date, startTime, endTime },
) {
  const html = `
    <!DOCTYPE html>
    <html>
    <body style="margin:0;padding:0;background:#0f0f0f;font-family:'Segoe UI',sans-serif;">
      <div style="max-width:560px;margin:40px auto;background:#1a1a1a;border-radius:16px;overflow:hidden;border:1px solid #2a2a2a;">
        <div style="background:linear-gradient(135deg,#f97316,#dc2626);padding:32px 40px;">
          <h1 style="margin:0;color:#fff;font-size:24px;font-weight:700;">New Session Booked! 📅</h1>
          <p style="margin:8px 0 0;color:rgba(255,255,255,0.85);font-size:14px;">A user has booked a session with you</p>
        </div>
        <div style="padding:32px 40px;">
          <p style="color:#d4d4d4;font-size:15px;margin:0 0 24px;">Hi <strong style="color:#fff;">${expertName}</strong>,</p>

          <div style="background:#242424;border-radius:12px;padding:20px 24px;margin-bottom:24px;">
            <table style="width:100%;border-collapse:collapse;">
              <tr>
                <td style="color:#737373;font-size:13px;padding:8px 0;width:40%;">User</td>
                <td style="color:#fff;font-size:13px;font-weight:600;">${userName}</td>
              </tr>
              <tr>
                <td style="color:#737373;font-size:13px;padding:8px 0;">Date</td>
                <td style="color:#fff;font-size:13px;font-weight:600;">${date}</td>
              </tr>
              <tr>
                <td style="color:#737373;font-size:13px;padding:8px 0;">Time</td>
                <td style="color:#fff;font-size:13px;font-weight:600;">${startTime} – ${endTime}</td>
              </tr>
            </table>
          </div>

          <div style="background:#1c2233;border:1px solid #1e3a5f;border-radius:12px;padding:16px 20px;margin-bottom:24px;">
            <p style="margin:0 0 8px;color:#93c5fd;font-size:13px;font-weight:600;">📋 Next Steps:</p>
            <p style="margin:0;color:#a3a3a3;font-size:13px;">Please log in to your <strong style="color:#fff;">FitQuest Expert Dashboard</strong>, go to your upcoming sessions, and submit the Zoom meeting link. This will automatically send it to the user.</p>
          </div>
        </div>
        <div style="padding:20px 40px;border-top:1px solid #2a2a2a;text-align:center;">
          <p style="margin:0;color:#404040;font-size:12px;">© ${new Date().getFullYear()} FitQuest. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  await transporter.sendMail({
    from: process.env.EMAIL_USER,
    to,
    subject: `📅 New Booking – ${userName} on ${date} at ${startTime}`,
    html,
  });

  console.log(`Expert booking notification sent to ${to}`);
}

module.exports = {
  sendSessionConfirmationEmail,
  sendZoomLinkEmail,
  sendExpertBookingNotification,
};
