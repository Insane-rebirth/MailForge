'use client'

import { useEffect, useState, useRef, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'

function CallbackContent() {
  const searchParams = useSearchParams()
  const [status, setStatus] = useState<'processing' | 'success' | 'error'>('processing')
  const [errorMessage, setErrorMessage] = useState('')
  const processedRef = useRef(false)

  useEffect(() => {
    if (processedRef.current) return
    processedRef.current = true

    async function handleCallback() {
      try {
        let code: string | null = null
        let state: string | null = null
        let error: string | null = null

        code = searchParams.get('code')
        error = searchParams.get('error')
        state = searchParams.get('state')

        if (!code) {
          const hash = window.location.hash
          if (hash) {
            const cleanHash = hash.startsWith('#_=_') ? hash.substring(4) : hash.startsWith('#') ? hash.substring(1) : hash
            if (cleanHash) {
              const hashParams = new URLSearchParams(cleanHash)
              code = hashParams.get('code')
              state = hashParams.get('state')
              if (!error) error = hashParams.get('error')
            }
          }
        }

        if (error) {
          setErrorMessage(decodeURIComponent(error))
          setStatus('error')
          setTimeout(() => {
            window.location.href = `/login?error=${encodeURIComponent(decodeURIComponent(error))}`
          }, 2000)
          return
        }

        if (!code) {
          setErrorMessage('No authorization code found')
          setStatus('error')
          setTimeout(() => {
            window.location.href = '/login'
          }, 2000)
          return
        }

        if (state && state.startsWith('facebook:')) {
          const randomState = state.substring(9)
          const savedState = sessionStorage.getItem('fb_oauth_state')
          
          if (savedState && savedState !== randomState) {
            console.warn('State mismatch: possible CSRF attack')
          }
          
          sessionStorage.removeItem('fb_oauth_state')
          
          const redirectUri = `${window.location.origin}/auth/callback`
          
          // #region debug-point callback-1
          console.log('[DEBUG CALLBACK] Sending to facebook-exchange:', {
            codeLength: code.length,
            codePrefix: code.substring(0, 20),
            redirectUri,
            windowOrigin: window.location.origin,
            fullUrl: window.location.href,
          })
          // #endregion
          
          const response = await fetch('/api/auth/facebook-exchange', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ code, redirectUri }),
          })
          
          const data = await response.json()
          
          // #region debug-point callback-2
          console.log('[DEBUG CALLBACK] Response from facebook-exchange:', {
            status: response.status,
            ok: response.ok,
            data,
          })
          // #endregion
          
          if (response.ok && data.success) {
            setStatus('success')
            setTimeout(() => {
              window.location.href = '/dashboard'
            }, 1000)
          } else {
            // Show the actual error from the server so we can diagnose
            setErrorMessage(data.error || 'Facebook login failed')
            setStatus('error')
            setTimeout(() => {
              window.location.href = `/login?error=${encodeURIComponent(data.error || 'facebook_login_failed')}`
            }, 2000)
          }
        } else {
          setErrorMessage('Invalid authorization state')
          setStatus('error')
          setTimeout(() => {
            window.location.href = '/login?error=invalid_state'
          }, 2000)
        }
      } catch (err) {
        console.error('Callback error:', err)
        setErrorMessage('An unexpected error occurred')
        setStatus('error')
        setTimeout(() => {
          window.location.href = '/login?error=unexpected_error'
        }, 2000)
      }
    }

    handleCallback()
  }, [searchParams])

  if (status === 'processing') {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-violet-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-400">Processing your login...</p>
        </div>
      </div>
    )
  }

  if (status === 'success') {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <p className="text-white">Login successful! Redirecting...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
      <div className="text-center">
        <div className="w-16 h-16 bg-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </div>
        <p className="text-red-400 mb-2">Login failed</p>
        <p className="text-gray-400 text-sm">{errorMessage}</p>
        <p className="text-gray-500 text-xs mt-4">Redirecting to login page...</p>
      </div>
    </div>
  )
}

export default function CallbackPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-violet-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-400">Loading...</p>
          </div>
        </div>
      }
    >
      <CallbackContent />
    </Suspense>
  )
}
