import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'

// CRITICAL: Use Consumer-type Facebook App (1330758902461953) which is in Live mode
// The old Business-type app (838193829244049) requires company verification
// and will show "App not active" error to foreign users
const OLD_BUSINESS_APP_ID = '838193829244049'
const CONSUMER_APP_ID = '1330758902461953'
const CONSUMER_APP_SECRET = 'f3335a10dd2eba15d43720bf215a967c'

// Determine which App ID to use — override if env var is set to old Business app
const envAppId = process.env.FACEBOOK_APP_ID || process.env.NEXT_PUBLIC_FACEBOOK_APP_ID
const FACEBOOK_APP_ID = (!envAppId || envAppId === OLD_BUSINESS_APP_ID) ? CONSUMER_APP_ID : envAppId

// CRITICAL: App Secret MUST match the App ID.
// If we override to Consumer App ID, we MUST also use Consumer App Secret.
// A mismatched App ID + Secret causes Facebook token exchange to fail silently
// with "invalid code" — even though the code is perfectly valid.
// This happens when Vercel env still has the OLD Business App's secret.
const FACEBOOK_APP_SECRET = (FACEBOOK_APP_ID === CONSUMER_APP_ID)
  ? CONSUMER_APP_SECRET
  : (process.env.FACEBOOK_APP_SECRET || CONSUMER_APP_SECRET)
const FACEBOOK_REDIRECT_URI = (process.env.NEXT_PUBLIC_APP_URL || 'https://getmailforge.top') + '/auth/callback'

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
    const { code, redirectUri } = await request.json()

    // #region debug-point facebook-exchange-1
    console.log('[DEBUG FB-EXCHANGE] Incoming request:', {
      hasCode: !!code,
      codeLength: code?.length || 0,
      redirectUriFromClient: redirectUri || '(none)',
      redirectUriFromEnv: FACEBOOK_REDIRECT_URI,
      FACEBOOK_APP_ID,
      envAppId,
      FACEBOOK_APP_SECRET_LENGTH: FACEBOOK_APP_SECRET?.length || 0,
      envAppSecret: process.env.FACEBOOK_APP_SECRET ? 'set' : 'not_set',
      appUrlEnv: process.env.NEXT_PUBLIC_APP_URL || '(not set)',
    })
    // #endregion

    if (!code) {
      return NextResponse.json({ success: false, error: 'No authorization code provided' }, { status: 400 })
    }

    const effectiveRedirectUri = redirectUri || FACEBOOK_REDIRECT_URI

    // #region debug-point facebook-exchange-2
    console.log('[DEBUG FB-EXCHANGE] Effective redirectUri:', effectiveRedirectUri)
    console.log('[DEBUG FB-EXCHANGE] Facebook token URL:', `https://graph.facebook.com/v18.0/oauth/access_token?client_id=${FACEBOOK_APP_ID}&redirect_uri=${encodeURIComponent(effectiveRedirectUri)}&code=${code?.substring(0, 20)}...`)
    // #endregion

    // Step 1: Exchange authorization code for Facebook access token
    const fbTokenResponse = await fetch(
      `https://graph.facebook.com/v18.0/oauth/access_token?client_id=${FACEBOOK_APP_ID}&client_secret=${FACEBOOK_APP_SECRET}&redirect_uri=${encodeURIComponent(effectiveRedirectUri)}&code=${code}`
    )

    // #region debug-point facebook-exchange-3
    console.log('[DEBUG FB-EXCHANGE] Facebook token response status:', fbTokenResponse.status)
    // #endregion

    if (!fbTokenResponse.ok) {
      const errorText = await fbTokenResponse.text()
      // #region debug-point facebook-exchange-4
      console.error('[DEBUG FB-EXCHANGE] Facebook token exchange FAILED:', errorText)
      // #endregion
      return NextResponse.json({ success: false, error: `Facebook token exchange error: ${errorText}` }, { status: 500 })
    }

    const fbTokenData = await fbTokenResponse.json()
    const fbAccessToken = fbTokenData.access_token

    if (!fbAccessToken) {
      console.error('No access token from Facebook')
      return NextResponse.json({ success: false, error: 'No access token received from Facebook' }, { status: 500 })
    }

    // Step 2: Fetch Facebook user profile
    const fbUserResponse = await fetch(
      `https://graph.facebook.com/me?access_token=${fbAccessToken}&fields=email,id,name,picture`
    )

    if (!fbUserResponse.ok) {
      console.error('Facebook user fetch failed:', await fbUserResponse.text())
      return NextResponse.json({ success: false, error: 'Failed to fetch Facebook user data' }, { status: 500 })
    }

    const fbUserData = await fbUserResponse.json()
    const fbId = fbUserData.id
    const fbName = fbUserData.name
    let email = fbUserData.email

    if (!email) {
      email = `fb_${fbId}@facebook.local`
      console.log('No email from Facebook, using generated email:', email)
    }

    // Normalize email to lowercase for consistent storage and matching
    email = email.toLowerCase()

    const serviceClient = createServiceClient()
    if (!serviceClient) {
      console.error('Supabase service client not configured')
      return NextResponse.json({ success: false, error: 'Service unavailable' }, { status: 500 })
    }

    // Step 3: Find existing user — CRITICAL: match by facebook_id first, then email
    // This prevents duplicate accounts when Facebook inconsistently returns email
    let userId: string | null = null
    let userExists = false

    // Priority 1: Match by facebook_id in profiles table (most reliable)
    const { data: profileByFbId, error: fbIdQueryError } = await serviceClient
      .from('profiles')
      .select('id, email, subscription_tier')
      .eq('facebook_id', fbId)
      .limit(1)

    if (fbIdQueryError) {
      console.error('Error querying by facebook_id:', fbIdQueryError)
    }

    if (profileByFbId && profileByFbId.length > 0) {
      userId = profileByFbId[0].id
      userExists = true
      console.log('Found existing user by facebook_id:', fbId, '-> user:', userId)
    }

    // Priority 2: Match by email in profiles table
    if (!userId) {
      const { data: profileByEmail, error: emailQueryError } = await serviceClient
        .from('profiles')
        .select('id, email, subscription_tier')
        .eq('email', email.toLowerCase())
        .limit(1)

      if (emailQueryError) {
        console.error('Error querying by email:', emailQueryError)
      }

      if (profileByEmail && profileByEmail.length > 0) {
        userId = profileByEmail[0].id
        userExists = true
        console.log('Found existing user by email:', email, '-> user:', userId)
      }
    }

    const tempPassword = generatePassword()

    // CRITICAL: Track the email used by the auth account.
    // For existing users, this is their ACTUAL auth email (which may differ from
    // the Facebook-provided email — e.g. Facebook didn't return email on first login,
    // so we generated fb_{id}@facebook.local). We MUST sign in with the auth account's
    // real email, not the current Facebook-provided email, or signInWithPassword fails.
    let signInEmail = email

    if (userExists && userId) {
      // === EXISTING USER — preserve all data, only update login credentials ===
      // CRITICAL: Do NOT touch subscription_tier, emails_used_this_month, or any usage data

      // Get current auth user to preserve user_metadata and capture real auth email
      const { data: userData, error: getUserError } = await serviceClient.auth.admin.getUserById(userId)

      if (getUserError || !userData?.user) {
        console.error('Failed to get existing user data:', getUserError)
        return NextResponse.json({ success: false, error: 'Failed to update account' }, { status: 500 })
      }

      const existingMetadata = userData.user.user_metadata || {}

      // Use the auth account's REAL email for sign-in — NOT the Facebook email.
      // This is critical because Facebook may return a different email (or none) on
      // subsequent logins, but the auth account email stays fixed at creation time.
      signInEmail = userData.user.email || email

      // Update password for login (needed for signInWithPassword)
      const { error: updateError } = await serviceClient.auth.admin.updateUserById(userId, {
        password: tempPassword,
        user_metadata: {
          ...existingMetadata,         // Preserve ALL existing metadata
          facebook_id: fbId,            // Update Facebook-specific fields
          facebook_name: fbName,
          provider: 'facebook',
        },
      })

      if (updateError) {
        console.error('Failed to update user password:', updateError)
        return NextResponse.json({ success: false, error: 'Failed to update account' }, { status: 500 })
      }

      // Update profiles table — ONLY touch facebook_id and facebook_name
      // Do NOT touch: subscription_tier, emails_used_this_month, stripe_customer_id, etc.
      // Retry up to 3 times to ensure facebook_id is saved (critical for future logins)
      for (let attempt = 1; attempt <= 3; attempt++) {
        const { error: profileUpdateError } = await serviceClient
          .from('profiles')
          .update({
            facebook_id: fbId,
            facebook_name: fbName,
            updated_at: new Date().toISOString(),
          })
          .eq('id', userId)

        if (!profileUpdateError) {
          console.log(`Profile facebook_id saved (attempt ${attempt})`)
          break
        }
        if (attempt === 3) {
          console.error('Failed to update profile facebook_id after 3 attempts:', profileUpdateError)
          // Non-fatal: login can still proceed, but future logins may not match by facebook_id
          // The auth user_metadata still has facebook_id as a backup
        } else {
          await new Promise(resolve => setTimeout(resolve, 200 * attempt))
        }
      }

      console.log('Existing user login successful, subscription preserved:', userId, 'sign-in email:', signInEmail)
    } else {
      // === NEW USER — create account with default values ===
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

      userId = newUser.user.id

      // Explicitly create profiles record (in addition to DB trigger)
      // This ensures profiles row exists with facebook_id even if trigger fails.
      // Retry up to 3 times — facebook_id is CRITICAL for future logins.
      let profileCreated = false
      for (let attempt = 1; attempt <= 3; attempt++) {
        const { error: profileError } = await serviceClient
          .from('profiles')
          .upsert({
            id: userId,
            email: email,
            full_name: fbName,
            facebook_id: fbId,
            facebook_name: fbName,
            subscription_tier: 'free',
            subscription_status: 'inactive',
            emails_used_this_month: 0,
            last_usage_reset: new Date().toISOString(),
          }, {
            onConflict: 'id',
            ignoreDuplicates: false,
          })

        if (!profileError) {
          profileCreated = true
          console.log(`Profile created with facebook_id (attempt ${attempt})`)
          break
        }
        if (attempt === 3) {
          console.error('Failed to create profile after 3 attempts:', profileError)
          // Non-fatal: DB trigger should have created a minimal profile.
          // The auth user_metadata has facebook_id as a backup for future logins.
        } else {
          await new Promise(resolve => setTimeout(resolve, 200 * attempt))
        }
      }

      console.log('New user created:', userId, 'with facebook_id:', fbId, 'profile created:', profileCreated)
    }

    if (!userId) {
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 500 })
    }

    // Step 4: Sign in with the temporary password
    // CRITICAL: This is the last step. Retry up to 3 times with increasing delays
    // because Supabase's auth cluster may take time to propagate password updates.
    const supabase = await createClient()
    if (!supabase) {
      console.error('Supabase client not configured')
      return NextResponse.json({ success: false, error: 'Service unavailable' }, { status: 500 })
    }

    let signInError: any = null
    let signedIn = false

    for (let attempt = 1; attempt <= 3; attempt++) {
      // Wait before each attempt (longer for later attempts)
      await new Promise(resolve => setTimeout(resolve, 500 * attempt))

      const result = await supabase.auth.signInWithPassword({
        email: signInEmail,
        password: tempPassword,
      })

      if (!result.error) {
        signedIn = true
        console.log(`Sign-in successful on attempt ${attempt}`)
        break
      }

      signInError = result.error
      console.error(`Sign-in attempt ${attempt} failed:`, signInError.message)

      // If the error is "Invalid credentials", the password update may not have
      // propagated yet. Wait and retry. If it's a different error (e.g., user
      // not found), retrying won't help but we still try as a last resort.
    }

    if (!signedIn) {
      console.error('All sign-in attempts failed. Last error:', signInError)
      return NextResponse.json({
        success: false,
        error: 'Login failed after multiple attempts. Please try again.',
      }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('Facebook OAuth exchange error:', err)
    return NextResponse.json({ success: false, error: 'An unexpected error occurred' }, { status: 500 })
  }
}
