import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'

const FACEBOOK_APP_ID = '838193829244049'
const FACEBOOK_APP_SECRET = 'b5ca6382a83028233de5259d4959f4d7'
const FACEBOOK_REDIRECT_URI = 'https://getmailforge.top/auth/callback?provider=facebook'

function generatePassword() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%'
  let password = ''
  for (let i = 0; i < 32; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return password
}

async function handleFacebookCallback(code: string, origin: string) {
  try {
    const fbTokenResponse = await fetch(
      `https://graph.facebook.com/v18.0/oauth/access_token?client_id=${FACEBOOK_APP_ID}&client_secret=${FACEBOOK_APP_SECRET}&redirect_uri=${encodeURIComponent(FACEBOOK_REDIRECT_URI)}&code=${code}`
    )

    if (!fbTokenResponse.ok) {
      console.error('Facebook token exchange failed:', await fbTokenResponse.text())
      return NextResponse.redirect(`${origin}/login?error=facebook_token_failed`)
    }

    const fbTokenData = await fbTokenResponse.json()
    const fbAccessToken = fbTokenData.access_token

    if (!fbAccessToken) {
      console.error('No access token from Facebook')
      return NextResponse.redirect(`${origin}/login?error=facebook_no_token`)
    }

    const fbUserResponse = await fetch(
      `https://graph.facebook.com/me?access_token=${fbAccessToken}&fields=email,id,name`
    )

    if (!fbUserResponse.ok) {
      console.error('Facebook user fetch failed:', await fbUserResponse.text())
      return NextResponse.redirect(`${origin}/login?error=facebook_user_failed`)
    }

    const fbUserData = await fbUserResponse.json()
    const email = fbUserData.email
    const fbId = fbUserData.id

    if (!email) {
      return NextResponse.redirect(`${origin}/login?error=facebook_no_email`)
    }

    const serviceClient = createServiceClient()
    if (!serviceClient) {
      console.error('Supabase service client not configured')
      return NextResponse.redirect(`${origin}/login?error=service_unavailable`)
    }

    const tempPassword = generatePassword()

    const { data: existingUsers } = await serviceClient.auth.listUsers()
    
    let userExists = false
    if (existingUsers) {
      const user = existingUsers.find(u => u.email?.toLowerCase() === email.toLowerCase())
      if (user) {
        userExists = true
        const { error: updateError } = await serviceClient.auth.updateUser(user.id, {
          password: tempPassword,
        })
        if (updateError) {
          console.error('Failed to update user password:', updateError)
          return NextResponse.redirect(`${origin}/login?error=user_update_failed`)
        }
      }
    }

    if (!userExists) {
      const { data: newUser, error: createError } = await serviceClient.auth.createUser({
        email,
        password: tempPassword,
        email_confirm: true,
        user_metadata: {
          facebook_id: fbId,
          provider: 'facebook',
        },
      })

      if (createError) {
        console.error('Failed to create user:', createError)
        return NextResponse.redirect(`${origin}/login?error=user_create_failed`)
      }

      if (!newUser) {
        return NextResponse.redirect(`${origin}/login?error=user_create_failed`)
      }
    }

    const supabase = await createClient()
    if (!supabase) {
      console.error('Supabase client not configured')
      return NextResponse.redirect(`${origin}/login?error=service_unavailable`)
    }

    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password: tempPassword,
    })

    if (signInError) {
      console.error('Failed to sign in:', signInError)
      return NextResponse.redirect(`${origin}/login?error=signin_failed`)
    }

    return NextResponse.redirect(`${origin}/dashboard`)
  } catch (err) {
    console.error('Facebook OAuth error:', err)
    return NextResponse.redirect(`${origin}/login?error=oauth_failed`)
  }
}

async function handleSupabaseCallback(code: string, origin: string, next: string) {
  const supabase = await createClient()
  if (!supabase) {
    console.error('Supabase not configured')
    return NextResponse.redirect(`${origin}/login?error=service_unavailable`)
  }
  const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)
  
  if (!exchangeError) {
    return NextResponse.redirect(`${origin}${next}`)
  } else {
    console.error('Failed to exchange code:', exchangeError)
    return NextResponse.redirect(`${origin}/login?error=auth_failed`)
  }
}

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const error = searchParams.get('error')
  const provider = searchParams.get('provider')
  const next = searchParams.get('next') ?? '/dashboard'

  if (error) {
    console.error('Auth error:', error)
    return NextResponse.redirect(`${origin}/login?error=${encodeURIComponent(error)}`)
  }

  if (!code) {
    return NextResponse.redirect(`${origin}/login`)
  }

  if (provider === 'facebook') {
    return handleFacebookCallback(code, origin)
  }

  return handleSupabaseCallback(code, origin, next)
}
