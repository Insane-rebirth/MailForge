'use client'

import { useState, useEffect } from 'react'
import { ArrowLeft, AlertTriangle, Check, RefreshCw } from 'lucide-react'
import Link from 'next/link'
import toast from 'react-hot-toast'
import { supabase } from '@/lib/supabase/client'

export default function SettingsPage() {
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState({ full_name: '', email: '' })
  const [isLoading, setIsLoading] = useState(true)
  
  // Profile form state
  const [fullName, setFullName] = useState('')
  const [profileSaved, setProfileSaved] = useState(false)
  
  // Password form state
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [passwordErrors, setPasswordErrors] = useState({
    current: '',
    new: '',
    confirm: ''
  })
  
  // Delete account state
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [showFinalConfirm, setShowFinalConfirm] = useState(false)
  const [confirmEmail, setConfirmEmail] = useState('')
  const [isDeleting, setIsDeleting] = useState(false)

  // CRM integration state
  const [crmProviders, setCrmProviders] = useState<Array<{ id: string; name: string; icon: string; color: string }>>([])
  const [crmSettings, setCrmSettings] = useState<any>(null)
  const [selectedProvider, setSelectedProvider] = useState<string>('')
  const [apiKey, setApiKey] = useState('')
  const [crmLoading, setCrmLoading] = useState(false)
  const [connectingProvider, setConnectingProvider] = useState<string | null>(null)

  useEffect(() => {
    const checkUser = async () => {
      const { data: { user: authUser } } = await supabase.auth.getUser()
      if (!authUser) {
        window.location.href = '/login'
        return
      }
      setUser(authUser)
    }
    checkUser()
  }, [])

  useEffect(() => {
    if (user) {
      fetchProfile(user.id)
      fetchCrmSettings()
    }
    fetchCrmProviders()
  }, [user])

  const fetchCrmProviders = async () => {
    try {
      const response = await fetch('/api/crm?action=get-providers')
      if (response.ok) {
        const data = await response.json()
        setCrmProviders(data.providers)
      }
    } catch (error) {
      console.error('Error fetching CRM providers:', error)
    }
  }

  const fetchCrmSettings = async () => {
    setCrmLoading(true)
    try {
      const response = await fetch('/api/crm?action=get-settings')
      if (response.ok) {
        const data = await response.json()
        setCrmSettings(data.settings)
      }
    } catch (error) {
      console.error('Error fetching CRM settings:', error)
    } finally {
      setCrmLoading(false)
    }
  }

  const handleConnectCrm = async (providerId: string) => {
    setConnectingProvider(providerId)
    try {
      const response = await fetch('/api/crm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'connect',
          provider: providerId,
          apiKey: apiKey || 'demo_key_' + Date.now(),
          accessToken: 'demo_access_token_' + Date.now()
        })
      })
      if (response.ok) {
        toast.success('CRM connected successfully!')
        await fetchCrmSettings()
        setApiKey('')
      } else {
        const data = await response.json()
        toast.error(data.error || 'Failed to connect CRM')
      }
    } catch (error) {
      console.error('Error connecting CRM:', error)
      toast.error('Failed to connect CRM')
    } finally {
      setConnectingProvider(null)
    }
  }

  const handleDisconnectCrm = async () => {
    try {
      const response = await fetch('/api/crm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'disconnect' })
      })
      if (response.ok) {
        toast.success('CRM disconnected successfully')
        setCrmSettings(null)
      } else {
        const data = await response.json()
        toast.error(data.error || 'Failed to disconnect CRM')
      }
    } catch (error) {
      console.error('Error disconnecting CRM:', error)
      toast.error('Failed to disconnect CRM')
    }
  }

  const fetchProfile = async (userId: string) => {
    setIsLoading(true)
    try {
      const response = await fetch(`/api/profile?userId=${userId}`)
      if (response.ok) {
        const data = await response.json()
        setProfile({
          full_name: data.full_name || '',
          email: data.email || user?.email || ''
        })
        setFullName(data.full_name || '')
      }
    } catch (error) {
      console.error('Error fetching profile:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSaveProfile = async () => {
    if (!fullName.trim()) {
      toast.error('Please enter your name')
      return
    }

    try {
      const { error } = await supabase
        .from('profiles')
        .update({ full_name: fullName.trim() })
        .eq('id', user?.id)

      if (error) {
        throw error
      }

      setProfile(prev => ({ ...prev, full_name: fullName.trim() }))
      setProfileSaved(true)
      toast.success('Profile updated successfully')
      setTimeout(() => setProfileSaved(false), 3000)
    } catch (error) {
      console.error('Error updating profile:', error)
      toast.error('Failed to update profile')
    }
  }

  const validatePassword = () => {
    const errors = { current: '', new: '', confirm: '' }
    
    if (!currentPassword) {
      errors.current = 'Current password is required'
    }
    
    if (newPassword.length < 6) {
      errors.new = 'Password must be at least 6 characters'
    }
    
    if (newPassword !== confirmPassword) {
      errors.confirm = 'Passwords do not match'
    }
    
    setPasswordErrors(errors)
    return Object.values(errors).every(e => !e)
  }

  const handleChangePassword = async () => {
    if (!validatePassword()) return

    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      })

      if (error) {
        if (error.message.includes('Password incorrect')) {
          setPasswordErrors(prev => ({ ...prev, current: 'Current password is incorrect' }))
        } else {
          throw error
        }
        return
      }

      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
      setPasswordErrors({ current: '', new: '', confirm: '' })
      toast.success('Password updated successfully')
    } catch (error) {
      console.error('Error changing password:', error)
      toast.error('Failed to change password')
    }
  }

  const handleDeleteAccount = async () => {
    if (confirmEmail !== profile.email) {
      toast.error('Email does not match')
      return
    }

    setIsDeleting(true)
    try {
      const response = await fetch('/api/account', {
        method: 'DELETE'
      })

      if (response.ok) {
        await supabase.auth.signOut()
        window.location.href = '/'
      } else {
        const data = await response.json()
        toast.error(data.error || 'Failed to delete account')
      }
    } catch (error) {
      console.error('Error deleting account:', error)
      toast.error('Failed to delete account')
    } finally {
      setIsDeleting(false)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-800 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            Back to Dashboard
          </Link>
        </div>

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Account Settings</h1>
          <p className="text-gray-600">Manage your account information</p>
        </div>

        <div className="space-y-8">
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-6">Profile Information</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter your full name"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  value={profile.email}
                  disabled
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-500 cursor-not-allowed"
                  readOnly
                />
              </div>
              
              <div className="flex items-center gap-3">
                <button
                  onClick={handleSaveProfile}
                  className="px-6 py-2 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-lg font-medium hover:from-blue-600 hover:to-purple-600 transition-colors"
                >
                  Save Changes
                </button>
                {profileSaved && (
                  <span className="flex items-center gap-1 text-green-600">
                    <Check className="w-4 h-4" />
                    Profile updated successfully
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-6">Change Password</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Current Password
                </label>
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    passwordErrors.current ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Enter current password"
                />
                {passwordErrors.current && (
                  <p className="mt-1 text-sm text-red-600">{passwordErrors.current}</p>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  New Password
                </label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    passwordErrors.new ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Enter new password"
                />
                {passwordErrors.new ? (
                  <p className="mt-1 text-sm text-red-600">{passwordErrors.new}</p>
                ) : (
                  <p className="mt-1 text-sm text-gray-500">Minimum 6 characters</p>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Confirm Password
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    passwordErrors.confirm ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Confirm new password"
                />
                {passwordErrors.confirm && (
                  <p className="mt-1 text-sm text-red-600">{passwordErrors.confirm}</p>
                )}
              </div>
              
              <button
                onClick={handleChangePassword}
                className="px-6 py-2 bg-gray-700 text-white rounded-lg font-medium hover:bg-gray-800 transition-colors"
              >
                Update Password
              </button>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-6">CRM Integration</h2>
            
            {crmLoading ? (
              <div className="flex items-center justify-center py-8">
                <RefreshCw className="w-6 h-6 text-gray-400 animate-spin" />
              </div>
            ) : crmSettings ? (
              <div className="bg-green-50 rounded-lg p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div 
                      className="w-12 h-12 rounded-xl flex items-center justify-center"
                      style={{ backgroundColor: crmProviders.find(p => p.id === crmSettings.provider)?.color + '20' }}
                    >
                      <span className="text-2xl">
                        {crmSettings.provider === 'hubspot' ? '🟠' : 
                         crmSettings.provider === 'salesforce' ? '🔵' : '🟠'}
                      </span>
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-800">
                        {crmProviders.find(p => p.id === crmSettings.provider)?.name || 'CRM'}
                      </h3>
                      <p className="text-gray-500 text-sm">Connected</p>
                    </div>
                  </div>
                  <button
                    onClick={handleDisconnectCrm}
                    className="px-4 py-2 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 transition-colors"
                  >
                    Disconnect
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-gray-500 text-sm">
                  Connect your CRM to import contacts and sync email activity.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {crmProviders.map((provider) => (
                    <div
                      key={provider.id}
                      className="border border-gray-200 rounded-xl p-6 hover:border-blue-500/50 transition-all cursor-pointer"
                      onClick={() => setSelectedProvider(provider.id)}
                    >
                      <div 
                        className="w-12 h-12 rounded-xl flex items-center justify-center mb-4 mx-auto"
                        style={{ backgroundColor: provider.color + '20' }}
                      >
                        <span className="text-2xl">
                          {provider.id === 'hubspot' ? '🟠' : 
                           provider.id === 'salesforce' ? '🔵' : '🟠'}
                        </span>
                      </div>
                      <h3 className="font-semibold text-gray-800 text-center">{provider.name}</h3>
                    </div>
                  ))}
                </div>
                
                {selectedProvider && (
                  <div className="mt-6 p-4 bg-blue-50 rounded-xl">
                    <h4 className="font-semibold text-gray-800 mb-3">
                      Connect {crmProviders.find(p => p.id === selectedProvider)?.name}
                    </h4>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          API Key / Access Token
                        </label>
                        <input
                          type="text"
                          value={apiKey}
                          onChange={(e) => setApiKey(e.target.value)}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="Enter your API key"
                        />
                        <p className="text-xs text-gray-500 mt-1">
                          Get your API key from your CRM account settings
                        </p>
                      </div>
                      <div className="flex gap-3">
                        <button
                          onClick={() => setSelectedProvider('')}
                          className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={() => handleConnectCrm(selectedProvider)}
                          disabled={connectingProvider === selectedProvider}
                          className="px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-lg font-medium hover:from-blue-600 hover:to-purple-600 transition-colors disabled:opacity-50"
                        >
                          {connectingProvider === selectedProvider ? 'Connecting...' : 'Connect'}
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-6 border-2 border-red-200">
            <h2 className="text-lg font-semibold text-red-700 mb-6">Danger Zone</h2>
            
            <div className="bg-red-50 rounded-lg p-6">
              <div className="flex items-start gap-4">
                <AlertTriangle className="w-8 h-8 text-red-500 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold text-red-800 mb-2">Delete Account</h3>
                  <p className="text-red-600 text-sm mb-4">
                    Once you delete your account, there is no going back. Please be certain.
                  </p>
                  <button
                    onClick={() => setShowDeleteConfirm(true)}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors"
                  >
                    Delete My Account
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-red-500" />
              </div>
              <h3 className="text-lg font-semibold text-gray-800">Confirm Deletion</h3>
            </div>
            
            {!showFinalConfirm ? (
              <>
                <p className="text-gray-600 mb-6">
                  Are you sure? This action cannot be undone. All your data will be permanently deleted.
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowDeleteConfirm(false)}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => setShowFinalConfirm(true)}
                    className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                  >
                    Continue
                  </button>
                </div>
              </>
            ) : (
              <>
                <p className="text-gray-600 mb-4">
                  To confirm, please type your email:
                </p>
                <input
                  type="email"
                  value={confirmEmail}
                  onChange={(e) => setConfirmEmail(e.target.value)}
                  className={`w-full px-4 py-2 border rounded-lg mb-4 ${
                    confirmEmail && confirmEmail !== profile.email ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder={profile.email}
                />
                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      setShowFinalConfirm(false)
                      setConfirmEmail('')
                    }}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Back
                  </button>
                  <button
                    onClick={handleDeleteAccount}
                    disabled={isDeleting || !confirmEmail}
                    className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isDeleting ? 'Deleting...' : 'Delete Account'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
