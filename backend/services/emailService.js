const nodemailer = require('nodemailer');

class EmailService {
  constructor() {
    this.transporter = null;
    this.initializeTransporter();
  }

  initializeTransporter() {
    try {
      const emailUser = process.env.EMAIL_USER;
      const emailPass = process.env.EMAIL_PASS;
      
      console.log('📧 Email config check:');
      console.log('   EMAIL_USER:', emailUser ? `${emailUser.substring(0, 5)}...` : 'NOT SET');
      console.log('   EMAIL_PASS:', emailPass ? `${emailPass.substring(0, 3)}***` : 'NOT SET');
      
      if (!emailUser || !emailPass) {
        console.error('❌ Email credentials not configured in .env file');
        this.transporter = null;
        return;
      }
      
      this.transporter = nodemailer.createTransport({
        service: 'gmail',
        host: 'smtp.gmail.com', 
        port: 587,
        secure: false,
        auth: {
          user: emailUser,
          pass: emailPass
        },
        tls: {
          rejectUnauthorized: false
        }
      });
      console.log('✅ Email transporter initialized successfully');
    } catch (error) {
      console.error('❌ Email transporter initialization failed:', error.message);
      this.transporter = null;
    }
  }

  async sendPasswordResetEmail(to, resetToken, userInfo = {}) {
    if (!this.transporter) {
      throw new Error('Email service not available');
    }

    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const resetUrl = `${frontendUrl}/reset-password?token=${resetToken}`;

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: to,
      subject: 'Yêu cầu đặt lại mật khẩu',
      html: `
        <h2>🔐 Đặt lại mật khẩu</h2>
        <p>Xin chào ${userInfo.name || 'User'},</p>
        <p>Bạn đã yêu cầu đặt lại mật khẩu. Click link bên dưới:</p>
        <p><a href="${resetUrl}">Đặt lại mật khẩu</a></p>
        <p>Token: ${resetToken}</p>
        <p>Link này sẽ hết hạn sau 1 giờ.</p>
      `
    };

    return this.transporter.sendMail(mailOptions);
  }
}

const emailService = new EmailService();
module.exports = emailService;
