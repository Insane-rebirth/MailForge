'use client'

import { useState, useEffect } from 'react'
import { Sparkles, AlertCircle } from 'lucide-react'
import Link from 'next/link'

export default function LoginPage() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search)
    const redirect = urlParams.get('redirect')
    if (redirect) {
      sessionStorage.setItem('post_login_redirect', redirect)
    }
  }, [])

  const handleFacebookLogin = async () => {
    setLoading(true)
    setError('')
    try {
      // Use the Consumer-type Facebook App (1330758902461953) which is in Live mode
      // This app does NOT require business verification, so all users can log in
      // CRITICAL: If env var is set to the old Business-type app (838193829244049),
      // override it with the new Consumer-type app that's already in Live mode
      const OLD_BUSINESS_APP_ID = '838193829244049'
      const CONSUMER_APP_ID = '1330758902461953'
      const envAppId = process.env.NEXT_PUBLIC_FACEBOOK_APP_ID
      const FACEBOOK_APP_ID = (!envAppId || envAppId === OLD_BUSINESS_APP_ID) ? CONSUMER_APP_ID : envAppId
      const redirectUri = `${window.location.origin}/auth/callback`
      const randomState = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
      const state = `facebook:${randomState}`
      
      // Request both public_profile and email scopes
      // email allows us to match users who registered with email
      // If email permission is not granted, we fall back to facebook_id matching
      const fbOAuthUrl = `https://www.facebook.com/dialog/oauth?client_id=${FACEBOOK_APP_ID}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=email,public_profile&state=${state}`
      
      sessionStorage.setItem('fb_oauth_state', randomState)
      window.location.href = fbOAuthUrl
    } catch (err) {
      setError('Failed to sign in with Facebook. Please try again.')
      console.error('Facebook login error:', err)
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center pt-20 px-4">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 w-full max-w-md">
        <div className="bg-[#1a1a2e] border border-[#2a2a3e] rounded-2xl p-8 shadow-2xl">
          <div className="text-center mb-8">
            <Link href="/" className="inline-flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-500 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/30">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <span className="text-2xl font-bold text-white">MailForge</span>
            </Link>
            <h1 className="text-2xl font-bold text-white mb-2">Welcome Back</h1>
            <p className="text-white/60">Sign in to continue</p>
          </div>

          {error && (
            <div className="flex items-center gap-2 text-red-400 mb-4 px-4 py-3 bg-red-500/10 rounded-xl">
              <AlertCircle className="w-5 h-5" />
              <span>{error}</span>
            </div>
          )}

          <button
            onClick={handleFacebookLogin}
            disabled={loading}
            className="w-full py-4 bg-[#1877F2] hover:bg-[#166FE5] text-white font-semibold rounded-xl transition-all flex items-center justify-center gap-3 disabled:opacity-50"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
            </svg>
            {loading ? 'Signing in...' : 'Continue with Facebook'}
          </button>

          <div className="mt-6 text-center">
            <p className="text-white/60 text-sm">
              Don't have an account?
              <Link href="/signup" className="ml-2 text-blue-400 hover:text-blue-300 font-medium transition-colors">
                Sign up
              </Link>
            </p>
          </div>
        </div>

        <p className="mt-8 text-center text-white/40 text-sm">
          By continuing, you agree to our{' '}
          <Link href="/terms" className="text-blue-400 hover:text-blue-300 transition-colors">
            Terms of Service
          </Link>{' '}
          and{' '}
          <Link href="/privacy" className="text-blue-400 hover:text-blue-300 transition-colors">
            Privacy Policy
          </Link>
        </p>
      </div>
    </div>
  )
}