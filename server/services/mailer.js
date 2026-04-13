const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASS,
  },
});

async function sendWelcomeEmail({ to, librarianName, libraryName }) {
  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Welcome to Studyly</title>
</head>
<body style="margin:0;padding:0;background:#f0fdf4;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f0fdf4;padding:40px 16px;">
    <tr>
      <td align="center">
        <table width="100%" style="max-width:560px;background:#ffffff;border-radius:24px;overflow:hidden;box-shadow:0 20px 60px rgba(16,185,129,0.15);">

          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#10b981,#0d9488);padding:40px 40px 32px;text-align:center;">
              <div style="display:inline-flex;align-items:center;justify-content:center;width:64px;height:64px;background:rgba(255,255,255,0.2);border-radius:20px;margin-bottom:16px;">
                <span style="font-size:32px;">📚</span>
              </div>
              <h1 style="margin:0;color:#ffffff;font-size:26px;font-weight:800;letter-spacing:-0.5px;">Welcome to Studyly!</h1>
              <p style="margin:8px 0 0;color:rgba(255,255,255,0.85);font-size:14px;">Your library is now live and ready to go.</p>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:36px 40px;">
              <p style="margin:0 0 8px;color:#64748b;font-size:13px;font-weight:700;text-transform:uppercase;letter-spacing:1px;">Hey ${librarianName},</p>
              <h2 style="margin:0 0 16px;color:#0f172a;font-size:22px;font-weight:800;letter-spacing:-0.3px;">${libraryName} is ready! 🎉</h2>
              <p style="margin:0 0 24px;color:#475569;font-size:15px;line-height:1.7;">
                Congratulations on setting up your library on Studyly. You can now manage students, seats, attendance, payments, and documents — all from one dashboard.
              </p>

              <!-- Feature pills -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
                <tr>
                  <td style="padding:0 6px 12px 0;width:50%;vertical-align:top;">
                    <div style="background:#f0fdf4;border:1px solid #d1fae5;border-radius:14px;padding:14px 16px;">
                      <p style="margin:0;font-size:20px;">🪑</p>
                      <p style="margin:6px 0 2px;color:#065f46;font-size:13px;font-weight:700;">Seat Management</p>
                      <p style="margin:0;color:#6b7280;font-size:12px;">Track real-time occupancy</p>
                    </div>
                  </td>
                  <td style="padding:0 0 12px 6px;width:50%;vertical-align:top;">
                    <div style="background:#f0fdf4;border:1px solid #d1fae5;border-radius:14px;padding:14px 16px;">
                      <p style="margin:0;font-size:20px;">📋</p>
                      <p style="margin:6px 0 2px;color:#065f46;font-size:13px;font-weight:700;">Attendance</p>
                      <p style="margin:0;color:#6b7280;font-size:12px;">Auto-tracked daily logs</p>
                    </div>
                  </td>
                </tr>
                <tr>
                  <td style="padding:0 6px 0 0;width:50%;vertical-align:top;">
                    <div style="background:#f0fdf4;border:1px solid #d1fae5;border-radius:14px;padding:14px 16px;">
                      <p style="margin:0;font-size:20px;">💰</p>
                      <p style="margin:6px 0 2px;color:#065f46;font-size:13px;font-weight:700;">Payments</p>
                      <p style="margin:0;color:#6b7280;font-size:12px;">Fee records & reminders</p>
                    </div>
                  </td>
                  <td style="padding:0 0 0 6px;width:50%;vertical-align:top;">
                    <div style="background:#f0fdf4;border:1px solid #d1fae5;border-radius:14px;padding:14px 16px;">
                      <p style="margin:0;font-size:20px;">📁</p>
                      <p style="margin:6px 0 2px;color:#065f46;font-size:13px;font-weight:700;">Documents</p>
                      <p style="margin:0;color:#6b7280;font-size:12px;">Student ID & file uploads</p>
                    </div>
                  </td>
                </tr>
              </table>

              <!-- CTA -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center">
                    <a href="https://studyly.in/login"
                       style="display:inline-block;background:linear-gradient(135deg,#10b981,#0d9488);color:#ffffff;text-decoration:none;font-size:15px;font-weight:800;padding:14px 36px;border-radius:16px;letter-spacing:-0.2px;box-shadow:0 8px 24px rgba(16,185,129,0.35);">
                      Go to your dashboard →
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="border-top:1px solid #f1f5f9;padding:24px 40px;text-align:center;">
              <p style="margin:0;color:#94a3b8;font-size:12px;">
                You're receiving this because you registered <strong>${libraryName}</strong> on Studyly.<br/>
                Need help? Reply to this email anytime.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();

  await transporter.sendMail({
    from: `"Studyly" <${process.env.MAIL_USER}>`,
    to,
    subject: `Welcome to Studyly — ${libraryName} is live! 🎉`,
    html,
  });
}

module.exports = { sendWelcomeEmail };
