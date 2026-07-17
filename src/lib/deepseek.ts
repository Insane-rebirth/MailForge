export interface EmailGenerationRequest {
  prospectInfo: string
  productDescription: string
}

export interface EmailGenerationResponse {
  subject: string
  body: string
}

export async function generateEmail(
  request: EmailGenerationRequest
): Promise<EmailGenerationResponse> {
  const apiKey = process.env.DEEPSEEK_API_KEY
  if (!apiKey) {
    throw new Error('DeepSeek API key is not configured')
  }

  const prompt = `
You are a professional B2B sales email writer. Create a personalized, high-converting sales email based on the following information:

Prospect Information:
${request.prospectInfo}

Product/Service Description:
${request.productDescription}

Please output ONLY the email in this JSON format:
{
  "subject": "Subject line here",
  "body": "Email body here"
}

The email should be:
- Professional but not too formal
- Personalized to the prospect
- Clear value proposition
- Include a clear call to action
- Appropriate length (3-5 short paragraphs)
`

  const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'deepseek-chat',
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.7,
    }),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.message || 'Failed to generate email')
  }

  const data = await response.json()
  const content = data.choices[0]?.message?.content

  if (!content) {
    throw new Error('Invalid response from AI')
  }

  try {
    return JSON.parse(content)
  } catch {
    throw new Error('Invalid response format from AI')
  }
}
