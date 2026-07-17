const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: 'smtp.qq.com',
  port: 465,
  secure: true,
  auth: {
    user: '2964572587@qq.com',
    pass: 'bhxggkehbgdmbagj',
  },
});

async function sendTestEmail() {
  try {
    const mailOptions = {
      from: 'MailForge <2964572587@qq.com>',
      to: '2964572587@qq.com',
      subject: '✅ 邮件通知测试 - MailForge',
      html: `
        <div style="max-width: 600px; margin: 0 auto; padding: 20px; font-family: Arial, sans-serif;">
          <div style="background: linear-gradient(135deg, #22c55e, #16a34a); padding: 20px; border-radius: 12px; text-align: center; color: white;">
            <h1 style="margin: 0;">测试成功</h1>
          </div>
          <div style="background: #f8fafc; padding: 24px; margin-top: 20px; border-radius: 12px;">
            <p style="color: #1e293b;">邮件通知系统已配置完成！</p>
            <p style="color: #64748b; margin-top: 10px;">当有用户支付时，您会收到邮件通知。</p>
            <p style="color: #64748b; margin-top: 10px;">测试时间：${new Date().toLocaleString('zh-CN')}</p>
          </div>
        </div>
      `,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Test email sent successfully!');
    console.log('Message ID:', info.messageId);
    return true;
  } catch (error) {
    console.error('Failed to send test email:', error);
    return false;
  }
}

sendTestEmail();
