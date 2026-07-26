'use client'

import { useEffect, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'

function FacebookCallbackContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [status, setStatus] = useState<'processing' | 'error'>('processing')
  const [errorMsg, setErrorMsg] = useState('')

  useEffect(() => {
    async function handleCallback() {
      try {
        let code: string | null = null
        let error: string | null = null

        code = searchParams.get('code')
        error = searchParams.get('error')

        if (!code) {
          const hash = window.location.hash
          if (hash) {
            const cleanHash = hash.startsWith('#_=_') ? hash.substring(4) : hash.startsWith('#') ? hash.substring(1) : hash
            if (cleanHash) {
              const hashParams = new URLSearchParams(cleanHash)
              code = hashParams.get('code')
              if (!error) error = hashParams.get('error')
            }
          }
        }

        if (!code) {
          const queryString = window.location.search
          if (queryString) {
            const urlParams = new URLSearchParams(queryString)
            code = urlParams.get('code')
            if (!error) error = urlParams.get('error')
          }
        }

        if (error) {
          setErrorMsg('Facebook authorization was denied.')
          setStatus('error')
          return
        }

        if (!code) {
          setErrorMsg('No authorization code received from Facebook.')
          setStatus('error')
          return
        }

        const res = await fetch('/api/auth/facebook-exchange', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ code }),
        })

        const data = await res.json()

        if (!res.ok || !data.success) {
          setErrorMsg(data.error || 'Failed to complete Facebook login.')
          setStatus('error')
          return
        }

        window.history.replaceState({}, '', '/dashboard')
        router.push('/dashboard')
      } catch (err) {
        console.error('Facebook callback error:', err)
        setErrorMsg('An unexpected error occurred during Facebook login.')
        setStatus('error')
      }
    }

    handleCallback()
  }, [])

  if (status === 'processing') {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin mx-auto mb-6" />
          <p className="text-white text-lg">Completing Facebook sign in...</p>
          <p className="text-white/50 text-sm mt-2">Please wait</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-[#1a1a2e] border border-[#2a2a3e] rounded-2xl p-8 text-center">
        <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg className="w-8 h-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </div>
        <h2 className="text-xl font-bold text-white mb-3">Facebook Login Failed</h2>
        <p className="text-white/60 mb-6">{errorMsg}</p>
        <Link
          href="/login"
          className="inline-flex items-center justify-center w-full py-3 bg-[#1877F2] hover:bg-[#166FE5] text-white font-semibold rounded-xl transition-all"
        >
          Back to Login
        </Link>
      </div>
    </div>
  )
}

function LoadingFallback() {
  return (
    <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
      <div className="text-center">
        <div className="w-16 h-16 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin mx-auto mb-6" />
        <p className="text-white text-lg">Loading...</p>
      </div>
    </div>
  )
}

export default function FacebookCallbackPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <FacebookCallbackContent />
    </Suspense>
  )
}
