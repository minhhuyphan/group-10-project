const nodemailer = require('nodemailer');

class EmailService {
  constructor() {
    this.transporter = null;
    this.initializeTransporter();
  }

  initializeTransporter() {
    try {
      // Cấu hình Gmail SMTP
      this.transporter = nodemailer.createTransporter({
        service: 'gmail',
        host: 'smtp.gmail.com', 
        port: 587,
        secure: false, // true for 465, false for other ports
        auth: {
          user: process.env.EMAIL_USER, // Gmail address
          pass: process.env.EMAIL_PASS  // Gmail App Password
        },
        // Tùy chọn bổ sung
        tls: {
          rejectUnauthorized: false
        }
      });

      console.log('📧 Email transporter initialized');
    } catch (error) {
      console.error('❌ Email transporter initialization failed:', error.message);
      this.transporter = null;
    }
  }

  // Test kết nối email
  async testConnection() {
    if (!this.transporter) {
      throw new Error('Email transporter not initialized');
    }

    try {
      await this.transporter.verify();
      console.log('✅ Email connection verified successfully');
      return true;
    } catch (error) {
      console.error('❌ Email connection test failed:', error.message);
      throw error;
    }
  }

  // Gửi email reset password
  async sendPasswordResetEmail(to, resetToken, userInfo = {}) {
    if (!this.transporter) {
      throw new Error('Email service not available');
    }

    // Tạo reset URL
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const resetUrl = `${frontendUrl}/reset-password?token=${resetToken}`;

    // HTML template cho email
    const htmlTemplate = this.createResetEmailHTML(userInfo.name || 'User', resetUrl, resetToken);

    const mailOptions = {
      from: {
        name: process.env.EMAIL_FROM_NAME || 'Group 10 Project',
        address: process.env.EMAIL_USER
      },
      to: to,
      subject: process.env.RESET_EMAIL_SUBJECT || 'Yêu cầu đặt lại mật khẩu',
      html: htmlTemplate,
      // Text version for email clients that don't support HTML
      text: `
        Xin chào ${userInfo.name || ''},

        Chúng tôi nhận được yêu cầu đặt lại mật khẩu cho tài khoản của bạn.

        Vui lòng click vào link sau để đặt lại mật khẩu:
        ${resetUrl}

        Mã reset token: ${resetToken}

        Link này sẽ hết hạn sau 1 giờ.

        Nếu bạn không yêu cầu đặt lại mật khẩu, vui lòng bỏ qua email này.

        Trân trọng,
        Group 10 Project Team
      `
    };

    try {
      const info = await this.transporter.sendMail(mailOptions);
      
      console.log('📧 Password reset email sent successfully');
      console.log('📨 Message ID:', info.messageId);
      console.log('📬 Recipient:', to);
      
      return {
        success: true,
        messageId: info.messageId,
        recipient: to
      };
    } catch (error) {
      console.error('❌ Failed to send password reset email:', error.message);
      throw error;
    }
  }

  // Tạo HTML template cho email
  createResetEmailHTML(userName, resetUrl, resetToken) {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Đặt lại mật khẩu</title>
        <style>
          body { 
            font-family: Arial, sans-serif; 
            line-height: 1.6; 
            color: #333; 
            background-color: #f4f4f4;
            margin: 0;
            padding: 20px;
          }
          .container { 
            max-width: 600px; 
            margin: 0 auto; 
            background: white; 
            padding: 30px; 
            border-radius: 10px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
          }
          .header {
            text-align: center;
            margin-bottom: 30px;
          }
          .logo {
            font-size: 24px;
            font-weight: bold;
            color: #2c3e50;
            margin-bottom: 10px;
          }
          .title {
            color: #e74c3c;
            font-size: 20px;
            margin-bottom: 20px;
          }
          .content {
            margin-bottom: 30px;
          }
          .reset-button {
            display: inline-block;
            background-color: #3498db;
            color: white;
            padding: 12px 30px;
            text-decoration: none;
            border-radius: 5px;
            font-weight: bold;
            margin: 20px 0;
          }
          .reset-button:hover {
            background-color: #2980b9;
          }
          .token-box {
            background-color: #ecf0f1;
            padding: 15px;
            border-radius: 5px;
            font-family: monospace;
            font-size: 14px;
            word-break: break-all;
            margin: 15px 0;
          }
          .warning {
            background-color: #fff3cd;
            border: 1px solid #ffeaa7;
            color: #856404;
            padding: 12px;
            border-radius: 5px;
            margin: 20px 0;
          }
          .footer {
            text-align: center;
            font-size: 12px;
            color: #7f8c8d;
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #ecf0f1;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo">🔐 Group 10 Project</div>
            <h1 class="title">Đặt lại mật khẩu</h1>
          </div>
          
          <div class="content">
            <p>Xin chào <strong>${userName}</strong>,</p>
            
            <p>Chúng tôi nhận được yêu cầu đặt lại mật khẩu cho tài khoản của bạn.</p>
            
            <p>Vui lòng click vào nút bên dưới để đặt lại mật khẩu:</p>
            
            <div style="text-align: center;">
              <a href="${resetUrl}" class="reset-button">🔄 Đặt lại mật khẩu</a>
            </div>
            
            <p>Hoặc copy và paste link sau vào trình duyệt:</p>
            <div class="token-box">
              ${resetUrl}
            </div>
            
            <p><strong>Mã reset token:</strong></p>
            <div class="token-box">
              ${resetToken}
            </div>
            
            <div class="warning">
              ⚠️ <strong>Lưu ý quan trọng:</strong>
              <ul>
                <li>Link này sẽ hết hạn sau <strong>1 giờ</strong></li>
                <li>Mỗi token chỉ sử dụng được <strong>1 lần</strong></li>
                <li>Nếu bạn không yêu cầu đặt lại mật khẩu, vui lòng bỏ qua email này</li>
              </ul>
            </div>
          </div>
          
          <div class="footer">
            <p>Email này được gửi tự động từ hệ thống Group 10 Project</p>
            <p>Nếu bạn gặp vấn đề, vui lòng liên hệ support team</p>
            <p>&copy; 2025 Group 10 Project. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  // Gửi email test (để kiểm tra cấu hình)
  async sendTestEmail(to) {
    if (!this.transporter) {
      throw new Error('Email service not available');
    }

    const mailOptions = {
      from: {
        name: process.env.EMAIL_FROM_NAME || 'Group 10 Project',
        address: process.env.EMAIL_USER
      },
      to: to,
      subject: 'Test Email - Group 10 Project',
      html: `
        <h2>🎉 Test Email thành công!</h2>
        <p>Nếu bạn nhận được email này, nghĩa là cấu hình email đã hoạt động tốt.</p>
        <p><strong>Thời gian gửi:</strong> ${new Date().toLocaleString('vi-VN')}</p>
        <p><strong>Từ:</strong> ${process.env.EMAIL_USER}</p>
        <p><strong>Đến:</strong> ${to}</p>
      `,
      text: `Test email thành công! Thời gian: ${new Date().toLocaleString('vi-VN')}`
    };

    try {
      const info = await this.transporter.sendMail(mailOptions);
      console.log('✅ Test email sent successfully:', info.messageId);
      return { success: true, messageId: info.messageId };
    } catch (error) {
      console.error('❌ Failed to send test email:', error.message);
      throw error;
    }
  }
}

// Export singleton instance
const emailService = new EmailService();
module.exports = emailService;