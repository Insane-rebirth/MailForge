import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'

const FACEBOOK_APP_ID = '838193829244049'
const FACEBOOK_APP_SECRET = 'b5ca6382a83028233de5259d4959f4d7'
const FACEBOOK_REDIRECT_URI = 'https://getmailforge.top/auth/callback'

function generatePassword() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%'
  let password = ''
  for (let i = 0; i < 32; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return password
}

export async function POST(request: Request) {
  try {
    const { code } = await request.json()

    if (!code) {
      return NextResponse.json({ success: false, error: 'No authorization code provided' }, { status: 400 })
    }

    const fbTokenResponse = await fetch(
      `https://graph.facebook.com/v18.0/oauth/access_token?client_id=${FACEBOOK_APP_ID}&client_secret=${FACEBOOK_APP_SECRET}&redirect_uri=${encodeURIComponent(FACEBOOK_REDIRECT_URI)}&code=${code}`
    )

    if (!fbTokenResponse.ok) {
      const errorText = await fbTokenResponse.text()
      console.error('Facebook token exchange failed:', errorText)
      return NextResponse.json({ success: false, error: 'Failed to exchange Facebook authorization code' }, { status: 500 })
    }

    const fbTokenData = await fbTokenResponse.json()
    const fbAccessToken = fbTokenData.access_token

    if (!fbAccessToken) {
      console.error('No access token from Facebook')
      return NextResponse.json({ success: false, error: 'No access token received from Facebook' }, { status: 500 })
    }

    const fbUserResponse = await fetch(
      `https://graph.facebook.com/me?access_token=${fbAccessToken}&fields=email,id,name,picture`
    )

    if (!fbUserResponse.ok) {
      console.error('Facebook user fetch failed:', await fbUserResponse.text())
      return NextResponse.json({ success: false, error: 'Failed to fetch Facebook user data' }, { status: 500 })
    }

    const fbUserData = await fbUserResponse.json()
    const email = fbUserData.email
    const fbId = fbUserData.id
    const fbName = fbUserData.name

    if (!email) {
      return NextResponse.json({ success: false, error: 'Facebook account does not have an email address' }, { status: 400 })
    }

    const serviceClient = createServiceClient()
    if (!serviceClient) {
      console.error('Supabase service client not configured')
      return NextResponse.json({ success: false, error: 'Service unavailable' }, { status: 500 })
    }

    const tempPassword = generatePassword()

    const { data: existingUsers } = await serviceClient.auth.admin.listUsers()

    let userExists = false

    if (existingUsers && existingUsers.users) {
      const user = existingUsers.users.find(u => u.email?.toLowerCase() === email.toLowerCase())
      if (user) {
        userExists = true

        const { error: updateError } = await serviceClient.auth.admin.updateUserById(user.id, {
          password: tempPassword,
          user_metadata: {
            ...user.user_metadata,
            facebook_id: fbId,
            facebook_name: fbName,
            provider: 'facebook',
          },
        })

        if (updateError) {
          console.error('Failed to update user:', updateError)
          return NextResponse.json({ success: false, error: 'Failed to update account' }, { status: 500 })
        }
      }
    }

    if (!userExists) {
      const { data: newUser, error: createError } = await serviceClient.auth.admin.createUser({
        email,
        password: tempPassword,
        email_confirm: true,
        user_metadata: {
          facebook_id: fbId,
          facebook_name: fbName,
          provider: 'facebook',
        },
      })

      if (createError) {
        console.error('Failed to create user:', createError)
        return NextResponse.json({ success: false, error: 'Failed to create account' }, { status: 500 })
      }

      if (!newUser || !newUser.user) {
        return NextResponse.json({ success: false, error: 'Failed to create account' }, { status: 500 })
      }
    }

    const supabase = await createClient()
    if (!supabase) {
      console.error('Supabase client not configured')
      return NextResponse.json({ success: false, error: 'Service unavailable' }, { status: 500 })
    }

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password: tempPassword,
    })

    if (signInError) {
      console.error('Failed to sign in:', signInError)
      return NextResponse.json({ success: false, error: 'Failed to sign in' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('Facebook OAuth exchange error:', err)
    return NextResponse.json({ success: false, error: 'An unexpected error occurred' }, { status: 500 })
  }
}