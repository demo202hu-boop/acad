'use client'

import { useState } from 'react'
import { toast } from 'react-hot-toast'
import {
  Shield, Key, Database, Server, LogOut, CheckCircle,
  AlertCircle, ExternalLink, Copy
} from 'lucide-react'
import { useRouter } from 'next/navigation'

export default function SettingsPage() {
  const router = useRouter()
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [currentPassword, setCurrentPassword] = useState('')
  const [changingPw, setChangingPw] = useState(false)
  const [loggingOut, setLoggingOut] = useState(false)

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'Not configured'

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault()
    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match')
      return
    }
    if (newPassword.length < 8) {
      toast.error('Password must be at least 8 characters')
      return
    }

    setChangingPw(true)
    // In a real app: call /api/admin/change-password
    // For now we just show a toast — env var change is needed server-side
    await new Promise(r => setTimeout(r, 800))
    toast.success('To change the password, update ADMIN_PASSWORD in your .env.local and redeploy.')
    setChangingPw(false)
    setNewPassword('')
    setConfirmPassword('')
    setCurrentPassword('')
  }

  const handleLogout = async () => {
    setLoggingOut(true)
    try {
      await fetch('/api/auth/logout', { method: 'POST' })
      router.push('/login')
      router.refresh()
    } catch {
      setLoggingOut(false)
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    toast.success('Copied to clipboard')
  }

  return (
    <div className="space-y-6 animate-fade-in max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold text-white">Settings</h1>
        <p className="text-sm text-dark-400 mt-0.5">Manage admin configuration</p>
      </div>

      {/* Secret Snarky Message */}
      <div className="glass-card p-8 flex flex-col items-center justify-center text-center animate-pulse-slow">
        <div className="w-16 h-16 rounded-full flex items-center justify-center mb-4"
          style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
          <AlertCircle size={32} className="text-red-400" />
        </div>
        <h2 className="text-xl font-bold text-white mb-2 tracking-wide">Kya Dekh Raha hai BKL !!!!</h2>
        <p className="text-sm text-dark-400">Yaha kuch nahi milega tere kaam ka.</p>
      </div>

      {/* Security */}
      <div className="glass-card p-6">
        <div className="flex items-center gap-2 mb-5">
          <Shield size={18} className="text-yellow-400" />
          <h2 className="text-base font-semibold text-white">Security</h2>
        </div>

        <div className="mb-4 px-3 py-3 rounded-xl text-sm"
          style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)' }}>
          <div className="flex items-start gap-2">
            <AlertCircle size={15} className="text-yellow-400 mt-0.5 flex-shrink-0" />
            <p className="text-yellow-300/80 text-xs leading-relaxed">
              The admin password is stored in <code className="font-mono bg-black/30 px-1 rounded">ADMIN_PASSWORD</code> environment variable.
              To change it, update <code className="font-mono bg-black/30 px-1 rounded">.env.local</code> (local) or Vercel env vars (production) and redeploy.
            </p>
          </div>
        </div>

        <form onSubmit={handlePasswordChange} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-dark-300 mb-1.5">Current Password</label>
            <input
              type="password"
              value={currentPassword}
              onChange={e => setCurrentPassword(e.target.value)}
              className="input-field"
              placeholder="Enter current password"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-dark-300 mb-1.5">New Password</label>
            <input
              type="password"
              value={newPassword}
              onChange={e => setNewPassword(e.target.value)}
              className="input-field"
              placeholder="At least 8 characters"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-dark-300 mb-1.5">Confirm New Password</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              className="input-field"
              placeholder="Repeat new password"
            />
          </div>
          <button type="submit" disabled={changingPw} className="btn btn-primary">
            <Key size={14} />
            {changingPw ? 'Updating...' : 'Update Password'}
          </button>
        </form>
      </div>



      {/* Danger zone */}
      <div className="glass-card p-6"
        style={{ border: '1px solid rgba(239,68,68,0.2)' }}>
        <div className="flex items-center gap-2 mb-4">
          <AlertCircle size={18} className="text-red-400" />
          <h2 className="text-base font-semibold text-white">Session Management</h2>
        </div>
        <p className="text-sm text-dark-400 mb-4">
          Log out from admin panel. You&apos;ll need to enter the password again to access.
        </p>
        <button
          onClick={handleLogout}
          disabled={loggingOut}
          className="btn btn-danger"
        >
          <LogOut size={14} />
          {loggingOut ? 'Logging out...' : 'Log Out'}
        </button>
      </div>
    </div>
  )
}
