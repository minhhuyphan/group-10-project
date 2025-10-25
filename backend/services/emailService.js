const nodemailer = require('nodemailer');const nodemailer = require('nodemailer');



class EmailService {<<<<<<< HEAD

  constructor() {class EmailService {

    this.transporter = null;  constructor() {

    this.initializeTransporter();    this.transporter = null;

  }    this.initializeTransporter();

  }

  initializeTransporter() {

    try {  initializeTransporter() {

      // Cấu hình Gmail SMTP    try {

      this.transporter = nodemailer.createTransporter({      // Cấu hình Gmail SMTP

        service: 'gmail',      this.transporter = nodemailer.createTransporter({

        host: 'smtp.gmail.com',         service: 'gmail',

        port: 587,        host: 'smtp.gmail.com', 

        secure: false, // true for 465, false for other ports        port: 587,

        auth: {        secure: false, // true for 465, false for other ports

          user: process.env.EMAIL_USER, // Gmail address        auth: {

          pass: process.env.EMAIL_PASS  // Gmail App Password          user: process.env.EMAIL_USER, // Gmail address

        },          pass: process.env.EMAIL_PASS  // Gmail App Password

        // Tùy chọn bổ sung        },

        tls: {        // Tùy chọn bổ sung

          rejectUnauthorized: false        tls: {

        }          rejectUnauthorized: false

      });        }

      });

      console.log('📧 Email transporter initialized');

    } catch (error) {      console.log('📧 Email transporter initialized');

      console.error('❌ Email transporter initialization failed:', error.message);    } catch (error) {

      this.transporter = null;      console.error('❌ Email transporter initialization failed:', error.message);

    }      this.transporter = null;

  }    }

  }

  // Test kết nối email

  async testConnection() {  // Test kết nối email

    if (!this.transporter) {  async testConnection() {

      throw new Error('Email transporter not initialized');    if (!this.transporter) {

    }      throw new Error('Email transporter not initialized');

    }

    try {

      await this.transporter.verify();    try {

      console.log('✅ Email connection verified successfully');      await this.transporter.verify();

      return true;      console.log('✅ Email connection verified successfully');

    } catch (error) {      return true;

      console.error('❌ Email connection test failed:', error.message);    } catch (error) {

      throw error;      console.error('❌ Email connection test failed:', error.message);

    }      throw error;

  }    }

  }

  // Gửi email reset password

  async sendPasswordResetEmail(to, resetToken, userInfo = {}) {  // Gửi email reset password

    if (!this.transporter) {  async sendPasswordResetEmail(to, resetToken, userInfo = {}) {

      throw new Error('Email service not available');    if (!this.transporter) {

    }      throw new Error('Email service not available');

    }

    // Tạo reset URL

    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';    // Tạo reset URL

    const resetUrl = `${frontendUrl}/reset-password?token=${resetToken}`;    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';

    const resetUrl = `${frontendUrl}/reset-password?token=${resetToken}`;

    // HTML template cho email

    const htmlTemplate = this.createResetEmailHTML(userInfo.name || 'User', resetUrl, resetToken);    // HTML template cho email

    const htmlTemplate = this.createResetEmailHTML(userInfo.name || 'User', resetUrl, resetToken);

    const mailOptions = {

      from: {    const mailOptions = {

        name: process.env.EMAIL_FROM_NAME || 'Group 10 Project',      from: {

        address: process.env.EMAIL_USER        name: process.env.EMAIL_FROM_NAME || 'Group 10 Project',

      },        address: process.env.EMAIL_USER

      to: to,      },

      subject: process.env.RESET_EMAIL_SUBJECT || 'Yêu cầu đặt lại mật khẩu',      to: to,

      html: htmlTemplate,      subject: process.env.RESET_EMAIL_SUBJECT || 'Yêu cầu đặt lại mật khẩu',

      // Text version for email clients that don't support HTML      html: htmlTemplate,

      text: `      // Text version for email clients that don't support HTML

        Xin chào ${userInfo.name || ''},      text: `

        Xin chào ${userInfo.name || ''},

        Chúng tôi nhận được yêu cầu đặt lại mật khẩu cho tài khoản của bạn.

        Chúng tôi nhận được yêu cầu đặt lại mật khẩu cho tài khoản của bạn.

        Vui lòng click vào link sau để đặt lại mật khẩu:

        ${resetUrl}        Vui lòng click vào link sau để đặt lại mật khẩu:

        ${resetUrl}

        Mã reset token: ${resetToken}

        Mã reset token: ${resetToken}

        Link này sẽ hết hạn sau 1 giờ.

        Link này sẽ hết hạn sau 1 giờ.

        Nếu bạn không yêu cầu đặt lại mật khẩu, vui lòng bỏ qua email này.

        Nếu bạn không yêu cầu đặt lại mật khẩu, vui lòng bỏ qua email này.

        Trân trọng,

        Group 10 Project Team        Trân trọng,

      `        Group 10 Project Team

    };      `

    };

    try {

      const info = await this.transporter.sendMail(mailOptions);    try {

            const info = await this.transporter.sendMail(mailOptions);

      console.log('📧 Password reset email sent successfully');      

      console.log('📨 Message ID:', info.messageId);      console.log('📧 Password reset email sent successfully');

      console.log('📬 Recipient:', to);      console.log('📨 Message ID:', info.messageId);

            console.log('📬 Recipient:', to);

      return {      

        success: true,      return {

        messageId: info.messageId,        success: true,

        recipient: to        messageId: info.messageId,

      };        recipient: to

    } catch (error) {      };

      console.error('❌ Failed to send password reset email:', error.message);    } catch (error) {

      throw error;      console.error('❌ Failed to send password reset email:', error.message);

    }      throw error;

  }    }

  }

  // Tạo HTML template cho email

  createResetEmailHTML(userName, resetUrl, resetToken) {  // Tạo HTML template cho email

    return `  createResetEmailHTML(userName, resetUrl, resetToken) {

      <!DOCTYPE html>    return `

      <html>      <!DOCTYPE html>

      <head>      <html>

        <meta charset="utf-8">      <head>

        <meta name="viewport" content="width=device-width, initial-scale=1.0">        <meta charset="utf-8">

        <title>Đặt lại mật khẩu</title>        <meta name="viewport" content="width=device-width, initial-scale=1.0">

        <style>        <title>Đặt lại mật khẩu</title>

          body {         <style>

            font-family: Arial, sans-serif;           body { 

            line-height: 1.6;             font-family: Arial, sans-serif; 

            color: #333;             line-height: 1.6; 

            background-color: #f4f4f4;            color: #333; 

            margin: 0;            background-color: #f4f4f4;

            padding: 20px;            margin: 0;

          }            padding: 20px;

          .container {           }

            max-width: 600px;           .container { 

            margin: 0 auto;             max-width: 600px; 

            background: white;             margin: 0 auto; 

            padding: 30px;             background: white; 

            border-radius: 10px;            padding: 30px; 

            box-shadow: 0 2px 10px rgba(0,0,0,0.1);            border-radius: 10px;

          }            box-shadow: 0 2px 10px rgba(0,0,0,0.1);

          .header {          }

            text-align: center;          .header {

            margin-bottom: 30px;            text-align: center;

          }            margin-bottom: 30px;

          .logo {          }

            font-size: 24px;          .logo {

            font-weight: bold;            font-size: 24px;

            color: #2c3e50;            font-weight: bold;

            margin-bottom: 10px;            color: #2c3e50;

          }            margin-bottom: 10px;

          .title {          }

            color: #e74c3c;          .title {

            font-size: 20px;            color: #e74c3c;

            margin-bottom: 20px;            font-size: 20px;

          }            margin-bottom: 20px;

          .content {          }

            margin-bottom: 30px;          .content {

            line-height: 1.8;            margin-bottom: 30px;

          }          }

          .reset-button {          .reset-button {

            display: inline-block;            display: inline-block;

            padding: 15px 30px;            background-color: #3498db;

            background-color: #3498db;            color: white;

            color: white !important;            padding: 12px 30px;

            text-decoration: none;            text-decoration: none;

            border-radius: 5px;            border-radius: 5px;

            font-weight: bold;            font-weight: bold;

            text-align: center;            margin: 20px 0;

            margin: 20px 0;          }

          }          .reset-button:hover {

          .reset-button:hover {            background-color: #2980b9;

            background-color: #2980b9;          }

          }          .token-box {

          .token-info {            background-color: #ecf0f1;

            background-color: #ecf0f1;            padding: 15px;

            padding: 15px;            border-radius: 5px;

            border-radius: 5px;            font-family: monospace;

            margin: 20px 0;            font-size: 14px;

            font-family: 'Courier New', monospace;            word-break: break-all;

            word-break: break-all;            margin: 15px 0;

          }          }

          .warning {          .warning {

            background-color: #fff3cd;            background-color: #fff3cd;

            border: 1px solid #ffeaa7;            border: 1px solid #ffeaa7;

            padding: 15px;            color: #856404;

            border-radius: 5px;            padding: 12px;

            margin: 20px 0;            border-radius: 5px;

            color: #856404;            margin: 20px 0;

          }          }

          .footer {          .footer {

            text-align: center;            text-align: center;

            margin-top: 30px;            font-size: 12px;

            padding-top: 20px;            color: #7f8c8d;

            border-top: 1px solid #ecf0f1;            margin-top: 30px;

            color: #7f8c8d;            padding-top: 20px;

            font-size: 12px;            border-top: 1px solid #ecf0f1;

          }          }

        </style>        </style>

      </head>      </head>

      <body>      <body>

        <div class="container">        <div class="container">

          <div class="header">          <div class="header">

            <div class="logo">🔐 Group 10 Project</div>            <div class="logo">🔐 Group 10 Project</div>

            <div class="title">Yêu cầu đặt lại mật khẩu</div>            <h1 class="title">Đặt lại mật khẩu</h1>

          </div>          </div>

                    

          <div class="content">          <div class="content">

            <p>Xin chào <strong>${userName}</strong>,</p>            <p>Xin chào <strong>${userName}</strong>,</p>

                        

            <p>Chúng tôi nhận được yêu cầu đặt lại mật khẩu cho tài khoản của bạn. Để tiếp tục, vui lòng click vào nút bên dưới:</p>            <p>Chúng tôi nhận được yêu cầu đặt lại mật khẩu cho tài khoản của bạn.</p>

                        

            <div style="text-align: center;">            <p>Vui lòng click vào nút bên dưới để đặt lại mật khẩu:</p>

              <a href="${resetUrl}" class="reset-button">🔄 Đặt lại mật khẩu</a>            

            </div>            <div style="text-align: center;">

                          <a href="${resetUrl}" class="reset-button">🔄 Đặt lại mật khẩu</a>

            <p>Hoặc copy và paste link sau vào trình duyệt:</p>            </div>

            <div class="token-info">            

              <strong>Reset URL:</strong><br>            <p>Hoặc copy và paste link sau vào trình duyệt:</p>

              ${resetUrl}            <div class="token-box">

            </div>              ${resetUrl}

                        </div>

            <div class="token-info">            

              <strong>Reset Token:</strong><br>            <p><strong>Mã reset token:</strong></p>

              ${resetToken}            <div class="token-box">

            </div>              ${resetToken}

                        </div>

            <div class="warning">            

              <strong>⚠️ Lưu ý quan trọng:</strong><br>            <div class="warning">

              • Link này chỉ có hiệu lực trong <strong>1 giờ</strong><br>              ⚠️ <strong>Lưu ý quan trọng:</strong>

              • Chỉ sử dụng được <strong>1 lần</strong><br>              <ul>

              • Nếu bạn không yêu cầu đặt lại mật khẩu, vui lòng bỏ qua email này                <li>Link này sẽ hết hạn sau <strong>1 giờ</strong></li>

            </div>                <li>Mỗi token chỉ sử dụng được <strong>1 lần</strong></li>

                            <li>Nếu bạn không yêu cầu đặt lại mật khẩu, vui lòng bỏ qua email này</li>

            <p>Nếu bạn gặp vấn đề với link trên, bạn có thể thử yêu cầu reset password mới hoặc liên hệ với chúng tôi.</p>              </ul>

          </div>            </div>

                    </div>

          <div class="footer">          

            <p>Email này được gửi từ hệ thống Group 10 Project<br>          <div class="footer">

            Vui lòng không reply email này.</p>            <p>Email này được gửi tự động từ hệ thống Group 10 Project</p>

            <p>© 2025 Group 10 Project. All rights reserved.</p>            <p>Nếu bạn gặp vấn đề, vui lòng liên hệ support team</p>

          </div>            <p>&copy; 2025 Group 10 Project. All rights reserved.</p>

        </div>          </div>

      </body>        </div>

      </html>      </body>

    `;      </html>

  }    `;

  }

  // Gửi email test

  async sendTestEmail(to) {  // Gửi email test (để kiểm tra cấu hình)

    if (!this.transporter) {  async sendTestEmail(to) {

      throw new Error('Email service not available');    if (!this.transporter) {

    }      throw new Error('Email service not available');

    }

    const mailOptions = {

      from: {    const mailOptions = {

        name: process.env.EMAIL_FROM_NAME || 'Group 10 Project',      from: {

        address: process.env.EMAIL_USER        name: process.env.EMAIL_FROM_NAME || 'Group 10 Project',

      },        address: process.env.EMAIL_USER

      to: to,      },

      subject: 'Test Email - Group 10 Project',      to: to,

      html: `      subject: 'Test Email - Group 10 Project',

        <h2>🎉 Email Test Thành Công!</h2>      html: `

        <p>Xin chào,</p>        <h2>🎉 Test Email thành công!</h2>

        <p>Đây là email test để kiểm tra cấu hình email service.</p>        <p>Nếu bạn nhận được email này, nghĩa là cấu hình email đã hoạt động tốt.</p>

        <p><strong>Thời gian gửi:</strong> ${new Date().toLocaleString('vi-VN')}</p>        <p><strong>Thời gian gửi:</strong> ${new Date().toLocaleString('vi-VN')}</p>

        <p><strong>Service:</strong> Gmail SMTP</p>        <p><strong>Từ:</strong> ${process.env.EMAIL_USER}</p>

        <p>Nếu bạn nhận được email này, có nghĩa là email service đã hoạt động chính xác! ✅</p>        <p><strong>Đến:</strong> ${to}</p>

        <hr>      `,

        <p><small>Group 10 Project - Forgot Password Feature</small></p>      text: `Test email thành công! Thời gian: ${new Date().toLocaleString('vi-VN')}`

      `,    };

      text: `

        Email Test Thành Công!    try {

              const info = await this.transporter.sendMail(mailOptions);

        Xin chào,      console.log('✅ Test email sent successfully:', info.messageId);

              return { success: true, messageId: info.messageId };

        Đây là email test để kiểm tra cấu hình email service.    } catch (error) {

              console.error('❌ Failed to send test email:', error.message);

        Thời gian gửi: ${new Date().toLocaleString('vi-VN')}      throw error;

        Service: Gmail SMTP    }

          }

        Nếu bạn nhận được email này, có nghĩa là email service đã hoạt động chính xác!}

        

        Group 10 Project - Forgot Password Feature// Export singleton instance

      `const emailService = new EmailService();

    };module.exports = emailService;

    },

    try {  };

      const info = await this.transporter.sendMail(mailOptions);

        // Validate configuration

      console.log('📧 Test email sent successfully');  if (!config.auth.user || !config.auth.pass) {

      console.log('📨 Message ID:', info.messageId);    console.warn('⚠️  Email credentials not configured. Email sending will fail.');

      console.log('📬 Recipient:', to);    console.warn('   Set EMAIL_USER and EMAIL_PASS in .env file');

          return null;

      return {  }

        success: true,

        messageId: info.messageId,  return nodemailer.createTransport(config);

        recipient: to};

      };

    } catch (error) {/**

      console.error('❌ Failed to send test email:', error.message); * Send password reset email

      throw error; * @param {string} to - Recipient email address

    } * @param {string} resetToken - Password reset token

  } * @param {string} userName - User's name (optional)

} * @returns {Promise<boolean>} - Success status

 */

// Export singleton instanceconst sendPasswordResetEmail = async (to, resetToken, userName = '') => {

const emailService = new EmailService();  const transporter = createTransporter();

module.exports = emailService;  
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
>>>>>>> 44def9785d97f81f91b0a065e7287eeafc71fb70
