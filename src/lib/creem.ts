const CREEM_API_BASES = [
  'https://api.creem.io/v1',
  'https://api.creem.dev/v1',
]

export interface CreemPaymentLink {
  id: string
  url: string
  amount: number
  currency: string
  description: string
}

export async function createPaymentLink(
  amount: number,
  currency: string,
  description: string,
  metadata?: Record<string, string>
): Promise<CreemPaymentLink | null> {
  try {
    const apiKey = process.env.CREEM_API_KEY
    const storeId = process.env.CREEM_STORE_ID

    if (!apiKey || !storeId) {
      console.error('Creem API key or store ID not configured')
      return null
    }

    for (const baseUrl of CREEM_API_BASES) {
      try {
        console.log(`Trying Creem API: ${baseUrl}`)
        const response = await fetch(`${baseUrl}/payment-links`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            store_id: storeId,
            amount,
            currency,
            description,
            metadata,
          }),
          timeout: 30000,
        })

        if (!response.ok) {
          const errorData = await response.json().catch(() => null)
          console.error(`Creem API error (${baseUrl}): ${response.status}`, errorData)
          continue
        }

        const data = await response.json()
        console.log('Creem payment link created:', data.id)
        return data
      } catch (error) {
        console.error(`Failed to call Creem API (${baseUrl}):`, error)
        continue
      }
    }

    console.error('All Creem API endpoints failed')
    return null
  } catch (error) {
    console.error('Failed to create payment link:', error)
    return null
  }
}

export async function getPaymentLink(linkId: string): Promise<CreemPaymentLink | null> {
  try {
    const apiKey = process.env.CREEM_API_KEY

    if (!apiKey) {
      console.error('Creem API key not configured')
      return null
    }

    for (const baseUrl of CREEM_API_BASES) {
      try {
        const response = await fetch(`${baseUrl}/payment-links/${linkId}`, {
          headers: {
            Authorization: `Bearer ${apiKey}`,
          },
          timeout: 30000,
        })

        if (!response.ok) {
          continue
        }

        return await response.json()
      } catch {
        continue
      }
    }

    return null
  } catch (error) {
    console.error('Failed to get payment link:', error)
    return null
  }
}

export async function verifyPayment(linkId: string): Promise<{ paid: boolean; amount?: number } | null> {
  try {
    const link = await getPaymentLink(linkId)
    if (!link) return null

    const apiKey = process.env.CREEM_API_KEY

    for (const baseUrl of CREEM_API_BASES) {
      try {
        const response = await fetch(`${baseUrl}/payments?payment_link_id=${linkId}`, {
          headers: {
            Authorization: `Bearer ${apiKey}`,
          },
          timeout: 30000,
        })

        if (!response.ok) {
          continue
        }

        const data = await response.json()
        const payments = data.data || []
        
        if (payments.length > 0) {
          const latestPayment = payments[payments.length - 1]
          return {
            paid: latestPayment.status === 'completed',
            amount: latestPayment.amount,
          }
        }

        return { paid: false }
      } catch {
        continue
      }
    }

    return { paid: false }
  } catch (error) {
    console.error('Failed to verify payment:', error)
    return null
  }
}