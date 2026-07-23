const CREEM_API_BASE = 'https://api.creem.io'

export interface CreemCheckout {
  id: string
  checkoutUrl: string
  success: boolean
}

export interface CreemProduct {
  id: string
  name: string
  status: string
}

export async function createProduct(
  name: string,
  description: string,
  price: number,
  currency: string,
  billingInterval: 'monthly' | 'yearly' = 'monthly',
): Promise<CreemProduct | null> {
  try {
    const apiKey = process.env.CREEM_API_KEY
    if (!apiKey) {
      console.error('Creem API key not configured')
      return null
    }

    const response = await fetch(`${CREEM_API_BASE}/v1/products`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
      },
      body: JSON.stringify({
        name,
        description,
        price,
        currency,
        billing_interval: billingInterval,
      }),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => null)
      console.error('Creem create product error:', response.status, errorData)
      return null
    }

    const data = await response.json()
    console.log('Creem product created:', data.id)
    return data
  } catch (error) {
    console.error('Failed to create product:', error)
    return null
  }
}

const KNOWN_PRODUCT_IDS = [
  'prod_4dAo3HSgudsOS2yPl9l7p3',
  'prod_5PFhRwPFFD22wCpoNjHuUF',
]

export async function listProducts(): Promise<CreemProduct[]> {
  try {
    const apiKey = process.env.CREEM_API_KEY
    if (!apiKey) {
      console.error('Creem API key not configured')
      return []
    }

    const products: CreemProduct[] = []

    for (const productId of KNOWN_PRODUCT_IDS) {
      try {
        const response = await fetch(`${CREEM_API_BASE}/v1/products?product_id=${productId}`, {
          headers: {
            'x-api-key': apiKey,
            'Content-Type': 'application/json',
          },
        })

        if (response.ok) {
          const data = await response.json()
          if (data && data.id) {
            products.push({
              id: data.id,
              name: data.name,
              status: data.status,
            })
          }
        }
      } catch (err) {
        console.error(`Failed to fetch product ${productId}:`, err)
      }
    }

    return products
  } catch (error) {
    console.error('Failed to list products:', error)
    return []
  }
}

export async function createCheckout(
  productId: string,
  customerEmail?: string,
  successUrl?: string,
  metadata?: Record<string, string>
): Promise<CreemCheckout | null> {
  try {
    const apiKey = process.env.CREEM_API_KEY
    if (!apiKey) {
      console.error('Creem API key not configured')
      return null
    }

    const body: any = {
      product_id: productId,
    }

    if (customerEmail) {
      body.customer = { email: customerEmail }
    }

    if (successUrl) {
      body.success_url = successUrl
    }

    if (metadata) {
      body.metadata = metadata
    }

    const response = await fetch(`${CREEM_API_BASE}/v1/checkouts`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
      },
      body: JSON.stringify(body),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => null)
      console.error('Creem create checkout error:', response.status, errorData)
      return null
    }

    const data = await response.json()
    console.log('Creem checkout created:', data.id)
    return {
      id: data.id,
      checkoutUrl: data.checkout_url || data.url,
      success: true,
    }
  } catch (error) {
    console.error('Failed to create checkout:', error)
    return null
  }
}

export async function retrieveCheckout(checkoutId: string) {
  try {
    const apiKey = process.env.CREEM_API_KEY
    if (!apiKey) {
      console.error('Creem API key not configured')
      return null
    }

    const response = await fetch(`${CREEM_API_BASE}/v1/checkouts?checkout_id=${checkoutId}`, {
      headers: {
        'x-api-key': apiKey,
      },
    })

    if (!response.ok) {
      return null
    }

    return await response.json()
  } catch (error) {
    console.error('Failed to retrieve checkout:', error)
    return null
  }
}

export async function verifyPayment(checkoutId: string): Promise<{ paid: boolean; amount: number; status: string; product: string } | null> {
  try {
    const checkout = await retrieveCheckout(checkoutId)
    if (!checkout) {
      return null
    }

    return {
      paid: checkout.status === 'paid',
      amount: checkout.amount || 0,
      status: checkout.status,
      product: checkout.product || '',
    }
  } catch (error) {
    console.error('Failed to verify payment:', error)
    return null
  }
}
