/**
 * Email Configuration with Nodemailer + Gmail SMTP
 * Activity 4 - SV3 Database & Integration
 */

const nodemailer = require('nodemailer');

// Gmail SMTP Configuration
const emailConfig = {
  service: 'gmail',
  host: 'smtp.gmail.com',
  port: 587,
  secure: false, // true for 465, false for other ports
  auth: {
    user: process.env.EMAIL_USER, // Gmail address
    pass: process.env.EMAIL_PASSWORD, // Gmail App Password (not regular password)
  },
};

// Create transporter
const createTransporter = () => {
  return nodemailer.createTransport(emailConfig);
};

// Send forgot password email
const sendResetPasswordEmail = async (to, resetToken, userName) => {
  const transporter = createTransporter();
  
  const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password/${resetToken}`;
  
  const mailOptions = {
    from: `"User Management System" <${process.env.EMAIL_USER}>`,
    to: to,
    subject: '🔐 Đặt lại mật khẩu - Password Reset Request',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .button { display: inline-block; padding: 12px 30px; background: #667eea; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .token { background: #fff; padding: 15px; border-left: 4px solid #667eea; margin: 20px 0; font-family: monospace; }
          .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
          .warning { background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🔐 Đặt lại mật khẩu</h1>
          </div>
          <div class="content">
            <p>Xin chào <strong>${userName}</strong>,</p>
            
            <p>Chúng tôi nhận được yêu cầu đặt lại mật khẩu cho tài khoản của bạn.</p>
            
            <p>Nhấn vào nút bên dưới để đặt lại mật khẩu:</p>
            
            <div style="text-align: center;">
              <a href="${resetUrl}" class="button">Đặt lại mật khẩu</a>
            </div>
            
            <p>Hoặc copy link sau vào trình duyệt:</p>
            <div class="token">
              <strong>Reset URL:</strong><br>
              ${resetUrl}
            </div>
            
            <div class="token">
              <strong>Reset Token:</strong><br>
              ${resetToken}
            </div>
            
            <div class="warning">
              <strong>⚠️ Lưu ý:</strong>
              <ul>
                <li>Link này chỉ có hiệu lực trong <strong>10 phút</strong></li>
                <li>Nếu bạn không yêu cầu đặt lại mật khẩu, vui lòng bỏ qua email này</li>
                <li>Không chia sẻ link này với bất kỳ ai</li>
              </ul>
            </div>
            
            <p>Cảm ơn bạn đã sử dụng dịch vụ của chúng tôi!</p>
            <p><strong>User Management System Team</strong></p>
          </div>
          <div class="footer">
            <p>© 2025 User Management System. All rights reserved.</p>
            <p>Email này được gửi tự động, vui lòng không reply.</p>
          </div>
        </div>
      </body>
      </html>
    `,
    text: `
      Xin chào ${userName},
      
      Chúng tôi nhận được yêu cầu đặt lại mật khẩu cho tài khoản của bạn.
      
      Vui lòng truy cập link sau để đặt lại mật khẩu:
      ${resetUrl}
      
      Reset Token: ${resetToken}
      
      Link này chỉ có hiệu lực trong 10 phút.
      
      Nếu bạn không yêu cầu đặt lại mật khẩu, vui lòng bỏ qua email này.
      
      Cảm ơn,
      User Management System Team
    `,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('✅ Email sent successfully:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('❌ Email send failed:', error);
    throw error;
  }
};

// Send password changed confirmation email
const sendPasswordChangedEmail = async (to, userName) => {
  const transporter = createTransporter();
  
  const mailOptions = {
    from: `"User Management System" <${process.env.EMAIL_USER}>`,
    to: to,
    subject: '✅ Mật khẩu đã được thay đổi - Password Changed',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .success { background: #d4edda; border-left: 4px solid #28a745; padding: 15px; margin: 20px 0; }
          .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>✅ Mật khẩu đã được thay đổi</h1>
          </div>
          <div class="content">
            <p>Xin chào <strong>${userName}</strong>,</p>
            
            <div class="success">
              <strong>✅ Thành công!</strong><br>
              Mật khẩu của bạn đã được thay đổi thành công.
            </div>
            
            <p>Nếu bạn không thực hiện thay đổi này, vui lòng liên hệ với chúng tôi ngay lập tức.</p>
            
            <p><strong>Thời gian:</strong> ${new Date().toLocaleString('vi-VN')}</p>
            
            <p>Cảm ơn bạn đã sử dụng dịch vụ của chúng tôi!</p>
            <p><strong>User Management System Team</strong></p>
          </div>
          <div class="footer">
            <p>© 2025 User Management System. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('✅ Password changed email sent:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('❌ Email send failed:', error);
    throw error;
  }
};

// Test email connection
const testEmailConnection = async () => {
  try {
    const transporter = createTransporter();
    await transporter.verify();
    console.log('✅ Email server is ready to send messages');
    return true;
  } catch (error) {
    console.error('❌ Email server connection failed:', error.message);
    return false;
  }
};

module.exports = {
  createTransporter,
  sendResetPasswordEmail,
  sendPasswordChangedEmail,
  testEmailConnection,
  emailConfig,
};
