export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { createCheckout, createProduct, listProducts } from '@/lib/creem'

export async function GET() {
  try {
    const apiKey = process.env.CREEM_API_KEY
    if (!apiKey) {
      return NextResponse.json(
        { success: false, error: 'CREEM_API_KEY not configured' },
        { status: 500 }
      )
    }

    if (apiKey === 'creem_xxx' || apiKey.length < 10) {
      return NextResponse.json(
        { success: false, error: 'CREEM_API_KEY is placeholder', keyLength: apiKey.length },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Creem API key configured',
      keyLength: apiKey.length,
      keyPrefix: apiKey.substring(0, 10) + '...',
    })
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}

export async function POST() {
  try {
    const products = await listProducts()
    
    return NextResponse.json({
      success: true,
      products,
      productCount: products.length,
    })
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}