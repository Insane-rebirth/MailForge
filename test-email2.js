const nodemailer = require('nodemailer');

async function testConnection() {
  const transporter = nodemailer.createTransport({
    host: 'smtp.qq.com',
    port: 465,
    secure: true,
    auth: {
      user: '2964572587@qq.com',
      pass: 'bhxggkehbgdmbagj',
    },
    debug: true,
  });

  try {
    const info = await transporter.sendMail({
      from: 'MailForge <2964572587@qq.com>',
      to: '2964572587@qq.com',
      subject: '测试邮件',
      text: '测试内容',
    });
    console.log('成功:', info.messageId);
  } catch (err) {
    console.log('错误:', err.message);
    console.log('完整错误:', JSON.stringify(err, null, 2));
  }
}

testConnection();
