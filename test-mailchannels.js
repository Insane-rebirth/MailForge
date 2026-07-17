async function sendTestEmail() {
  try {
    const webhookUrl = 'https://api.mailchannels.net/tx/v1/send';
    
    const payload = {
      personalizations: [
        {
          to: [{ email: '2964572587@qq.com' }],
        },
      ],
      from: {
        email: 'notify@getmailforge.top',
        name: 'MailForge',
      },
      subject: '✅ 邮件通知测试 - MailForge',
      content: [
        {
          type: 'text/html',
          value: `
            <div style="max-width: 600px; margin: 0 auto; padding: 20px; font-family: Arial, sans-serif;">
              <div style="background: linear-gradient(135deg, #22c55e, #16a34a); padding: 20px; border-radius: 12px; text-align: center; color: white;">
                <h1 style="margin: 0;">测试成功</h1>
              </div>
              <div style="background: #f8fafc; padding: 24px; margin-top: 20px; border-radius: 12px;">
                <p style="color: #1e293b;">邮件通知系统已配置完成！</p>
                <p style="color: #64748b; margin-top: 10px;">当有用户支付时，您会收到邮件通知。</p>
              </div>
            </div>
          `,
        },
      ],
    };

    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    console.log('Response status:', response.status);
    
    if (response.ok) {
      const data = await response.json();
      console.log('Success:', data);
      return true;
    } else {
      const errorText = await response.text();
      console.error('Failed:', errorText);
      return false;
    }
  } catch (error) {
    console.error('Error:', error);
    return false;
  }
}

sendTestEmail();
