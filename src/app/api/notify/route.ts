import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { amount, plan, customerEmail } = await request.json()
    
    const timestamp = new Date().toLocaleString('zh-CN', {
      timeZone: 'Asia/Shanghai',
    })

    const slackWebhook = process.env.SLACK_WEBHOOK_URL || ''
    
    const payload = {
      blocks: [
        {
          type: 'header',
          text: {
            type: 'plain_text',
            text: '💰 新支付通知',
            emoji: true,
          },
        },
        {
          type: 'section',
          fields: [
            {
              type: 'mrkdwn',
              text: `*金额:* $${amount}`,
            },
            {
              type: 'mrkdwn',
              text: `*套餐:* ${plan}`,
            },
            {
              type: 'mrkdwn',
              text: `*客户邮箱:* ${customerEmail}`,
            },
            {
              type: 'mrkdwn',
              text: `*时间:* ${timestamp}`,
            },
          ],
        },
      ],
    }

    await fetch(slackWebhook, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    }).catch(() => {})

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ success: false })
  }
}
