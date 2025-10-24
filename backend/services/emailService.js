const nodemailer = require('nodemailer');

// Create reusable transporter object using SMTP transport
const createTransporter = () => {
  const config = {
    service: process.env.EMAIL_SERVICE || 'gmail',
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.EMAIL_PORT) || 587,
    secure: false, // true for 465, false for other ports
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  };

  // Validate configuration
  if (!config.auth.user || !config.auth.pass) {
    console.warn('⚠️  Email credentials not configured. Email sending will fail.');
    console.warn('   Set EMAIL_USER and EMAIL_PASS in .env file');
    return null;
  }

  return nodemailer.createTransport(config);
};

/**
 * Send password reset email
 * @param {string} to - Recipient email address
 * @param {string} resetToken - Password reset token
 * @param {string} userName - User's name (optional)
 * @returns {Promise<boolean>} - Success status
 */
const sendPasswordResetEmail = async (to, resetToken, userName = '') => {
  const transporter = createTransporter();
  
  if (!transporter) {
    throw new Error('Email service not configured');
  }

  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
  const resetLink = `${frontendUrl}/reset-password?token=${encodeURIComponent(resetToken)}`;
  
  // Email template with modern design
  const htmlTemplate = `
<!DOCTYPE html>
<html lang="vi">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Password Reset Request</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            background-color: #f4f4f4;
            margin: 0;
            padding: 0;
        }
        .container {
            max-width: 600px;
            margin: 20px auto;
            background: #ffffff;
            border-radius: 8px;
            overflow: hidden;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        }
        .header {
            background: linear-gradient(135deg, #0070ba 0%, #1546a0 100%);
            color: #ffffff;
            padding: 30px 20px;
            text-align: center;
        }
        .header h1 {
            margin: 0;
            font-size: 24px;
            font-weight: 600;
        }
        .content {
            padding: 30px 20px;
        }
        .greeting {
            font-size: 16px;
            margin-bottom: 20px;
        }
        .message {
            font-size: 14px;
            color: #555;
            margin-bottom: 25px;
        }
        .btn-container {
            text-align: center;
            margin: 30px 0;
        }
        .btn-reset {
            display: inline-block;
            padding: 14px 35px;
            background: #0070ba;
            color: #ffffff !important;
            text-decoration: none;
            border-radius: 6px;
            font-size: 16px;
            font-weight: 500;
            transition: background 0.3s ease;
        }
        .btn-reset:hover {
            background: #005a94;
        }
        .alternative {
            font-size: 13px;
            color: #777;
            margin-top: 25px;
            padding: 15px;
            background: #f9f9f9;
            border-radius: 4px;
            word-break: break-all;
        }
        .alternative strong {
            display: block;
            margin-bottom: 8px;
            color: #333;
        }
        .alternative code {
            display: block;
            padding: 10px;
            background: #fff;
            border: 1px solid #ddd;
            border-radius: 3px;
            font-size: 12px;
            margin-top: 5px;
        }
        .footer {
            background: #f9f9f9;
            padding: 20px;
            text-align: center;
            font-size: 12px;
            color: #777;
            border-top: 1px solid #e0e0e0;
        }
        .warning {
            background: #fff3cd;
            border-left: 4px solid #ffc107;
            padding: 12px;
            margin: 20px 0;
            font-size: 13px;
            color: #856404;
        }
        .security-notice {
            font-size: 12px;
            color: #999;
            margin-top: 20px;
            text-align: center;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🔐 Yêu Cầu Đặt Lại Mật Khẩu</h1>
        </div>
        <div class="content">
            <div class="greeting">
                Xin chào${userName ? ' ' + userName : ''},
            </div>
            <div class="message">
                Chúng tôi đã nhận được yêu cầu đặt lại mật khẩu cho tài khoản của bạn tại <strong>Group 10 Project</strong>.
            </div>
            <div class="message">
                Để tiếp tục, vui lòng nhấn vào nút bên dưới để tạo mật khẩu mới:
            </div>
            <div class="btn-container">
                <a href="${resetLink}" class="btn-reset">Đặt Lại Mật Khẩu</a>
            </div>
            <div class="warning">
                ⏱️ <strong>Lưu ý:</strong> Link này chỉ có hiệu lực trong <strong>10 phút</strong>. Sau thời gian đó, bạn cần yêu cầu đặt lại mật khẩu lại.
            </div>
            <div class="alternative">
                <strong>Hoặc copy link sau vào trình duyệt:</strong>
                <code>${resetLink}</code>
            </div>
            <div class="security-notice">
                🔒 Nếu bạn không yêu cầu đặt lại mật khẩu, vui lòng bỏ qua email này. 
                Tài khoản của bạn vẫn an toàn.
            </div>
        </div>
        <div class="footer">
            <p>© 2025 Group 10 Project. All rights reserved.</p>
            <p>Email này được gửi tự động. Vui lòng không trả lời.</p>
        </div>
    </div>
</body>
</html>
  `.trim();

  const textTemplate = `
Đặt Lại Mật Khẩu - Group 10 Project

Xin chào${userName ? ' ' + userName : ''},

Chúng tôi đã nhận được yêu cầu đặt lại mật khẩu cho tài khoản của bạn.

Để tiếp tục, vui lòng truy cập link sau:
${resetLink}

Link này chỉ có hiệu lực trong 10 phút.

Nếu bạn không yêu cầu đặt lại mật khẩu, vui lòng bỏ qua email này.

--
Group 10 Project Team
  `.trim();

  const mailOptions = {
    from: process.env.EMAIL_FROM || '"Group 10 Project" <noreply@group10project.com>',
    to: to,
    subject: process.env.RESET_EMAIL_SUBJECT || 'Password Reset Request - Group 10 Project',
    text: textTemplate,
    html: htmlTemplate,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('✅ Email sent successfully:', info.messageId);
    console.log('   Recipient:', to);
    console.log('   Preview URL:', nodemailer.getTestMessageUrl(info));
    return true;
  } catch (error) {
    console.error('❌ Failed to send email:', error.message);
    throw error;
  }
};

/**
 * Send test email to verify configuration
 * @param {string} to - Test recipient email
 * @returns {Promise<boolean>}
 */
const sendTestEmail = async (to) => {
  const transporter = createTransporter();
  
  if (!transporter) {
    throw new Error('Email service not configured');
  }

  const mailOptions = {
    from: process.env.EMAIL_FROM || '"Group 10 Project" <noreply@group10project.com>',
    to: to,
    subject: 'Test Email - Group 10 Project',
    text: 'This is a test email from Group 10 Project. If you received this, email configuration is working!',
    html: '<h2>✅ Email Configuration Test</h2><p>If you received this, your email configuration is working correctly!</p>',
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('✅ Test email sent:', info.messageId);
    return true;
  } catch (error) {
    console.error('❌ Test email failed:', error.message);
    throw error;
  }
};

module.exports = {
  sendPasswordResetEmail,
  sendTestEmail,
};
