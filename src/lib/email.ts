export async function sendPaymentNotification(
  amount: string,
  plan: string,
  customerEmail: string,
  timestamp: string
): Promise<boolean> {
  try {
    const webhookUrl = 'https://api.mailchannels.net/tx/v1/send'

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
      subject: `💰 新支付通知 - $${amount}`,
      content: [
        {
          type: 'text/html',
          value: `
            <div style="max-width: 600px; margin: 0 auto; padding: 20px; font-family: Arial, sans-serif;">
              <div style="background: linear-gradient(135deg, #6366f1, #ec4899); padding: 20px; border-radius: 12px; text-align: center; color: white;">
                <h1 style="margin: 0;">新订单通知</h1>
              </div>
              <div style="background: #f8fafc; padding: 24px; margin-top: 20px; border-radius: 12px;">
                <h2 style="color: #1e293b; margin-top: 0;">💰 收到新支付</h2>
                <table style="width: 100%; margin-top: 20px;">
                  <tr>
                    <td style="padding: 10px; background: #f1f5f9; border-radius: 6px; color: #64748b;">金额</td>
                    <td style="padding: 10px; color: #1e293b; font-weight: bold;">$${amount}</td>
                  </tr>
                  <tr>
                    <td style="padding: 10px; background: #f1f5f9; border-radius: 6px; color: #64748b;">套餐</td>
                    <td style="padding: 10px; color: #1e293b; font-weight: bold;">${plan}</td>
                  </tr>
                  <tr>
                    <td style="padding: 10px; background: #f1f5f9; border-radius: 6px; color: #64748b;">客户邮箱</td>
                    <td style="padding: 10px; color: #1e293b;">${customerEmail}</td>
                  </tr>
                  <tr>
                    <td style="padding: 10px; background: #f1f5f9; border-radius: 6px; color: #64748b;">时间</td>
                    <td style="padding: 10px; color: #1e293b;">${timestamp}</td>
                  </tr>
                </table>
              </div>
              <p style="text-align: center; color: #94a3b8; margin-top: 20px; font-size: 12px;">
                MailForge - AI-Powered B2B Email Generator
              </p>
            </div>
          `,
        },
      ],
    }

    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    })

    if (response.ok) {
      console.log('Payment notification sent successfully')
      return true
    } else {
      console.error('Failed to send email:', response.status, await response.text())
      return false
    }
  } catch (error) {
    console.error('Failed to send payment notification:', error)
    return false
  }
}

export async function sendTestEmail(): Promise<boolean> {
  try {
    const webhookUrl = 'https://api.mailchannels.net/tx/v1/send'

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
    }

    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    })

    if (response.ok) {
      console.log('Test email sent successfully')
      return true
    } else {
      console.error('Failed to send test email:', response.status, await response.text())
      return false
    }
  } catch (error) {
    console.error('Failed to send test email:', error)
    return false
  }
}
