'use client'

import { getSupabase } from '@/lib/supabase/client'
import { useState, useEffect } from 'react'
import { Sparkles, AlertCircle } from 'lucide-react'
import Link from 'next/link'

export default function LoginPage() {
  const [loading, setLoading] = useState(false)
  const [redirectPath, setRedirectPath] = useState('/dashboard')
  const [error, setError] = useState('')

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search)
    const redirect = urlParams.get('redirect')
    if (redirect) {
      setRedirectPath(redirect)
    }
  }, [])

  const handleGitHubLogin = async () => {
    setLoading(true)
    setError('')
    try {
      const client = getSupabase()
      const { error } = await client.auth.signInWithOAuth({
        provider: 'github',
        options: {
          redirectTo: window.location.origin + redirectPath
        }
      })
      if (error) {
        setError(error.message)
        setLoading(false)
      }
    } catch (err) {
      setError('Failed to sign in with GitHub. Please try again.')
      console.error('GitHub login error:', err)
      setLoading(false)
    }
  }

  const handleFacebookLogin = async () => {
    setLoading(true)
    setError('')
    try {
      const FACEBOOK_APP_ID = '838193829244049'
      const redirectUri = `${window.location.origin}/auth/callback?provider=facebook`
      const state = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
      
      const fbOAuthUrl = `https://www.facebook.com/dialog/oauth?client_id=${FACEBOOK_APP_ID}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=email&state=${state}`
      
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
            onClick={handleGitHubLogin}
            disabled={loading}
            className="w-full py-4 bg-white hover:bg-gray-100 text-gray-800 font-semibold rounded-xl transition-all flex items-center justify-center gap-3 disabled:opacity-50 mb-3"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
            </svg>
            {loading ? 'Signing in...' : 'Continue with GitHub'}
          </button>

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