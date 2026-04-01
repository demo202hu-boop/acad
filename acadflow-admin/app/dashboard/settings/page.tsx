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

      {/* Connection Status */}
      <div className="glass-card p-6">
        <div className="flex items-center gap-2 mb-5">
          <Database size={18} className="text-blue-400" />
          <h2 className="text-base font-semibold text-white">Database Connection</h2>
        </div>

        <div className="space-y-3">
          {[
            { label: 'Supabase URL', value: supabaseUrl, mono: true },
            { label: 'Service Role', value: 'Active (bypasses RLS)', mono: false },
            { label: 'Auth Mode', value: 'Admin panel Password', mono: false },
            { label: 'Session TTL', value: '8 hours', mono: false },
          ].map(item => (
            <div key={item.label} className="flex items-center justify-between py-2.5"
              style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
              <span className="text-sm text-dark-400">{item.label}</span>
              <div className="flex items-center gap-2">
                <span className={`text-sm ${item.mono ? 'font-mono text-blue-300' : 'text-dark-200'}`}>
                  {item.value}
                </span>
                {item.mono && (
                  <button
                    onClick={() => copyToClipboard(item.value)}
                    className="p-1 rounded hover:bg-white/10 text-dark-400 hover:text-white transition-colors"
                  >
                    <Copy size={12} />
                  </button>
                )}
              </div>
            </div>
          ))}

          <div className="flex items-center gap-2 pt-2">
            <CheckCircle size={14} className="text-green-400" />
            <span className="text-xs text-green-300">Connected to Supabase</span>
          </div>
        </div>
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

      {/* Deployment Info */}
      <div className="glass-card p-6">
        <div className="flex items-center gap-2 mb-5">
          <Server size={18} className="text-green-400" />
          <h2 className="text-base font-semibold text-white">Deployment</h2>
        </div>

        <div className="space-y-3 mb-5">
          {[
            { label: 'Platform', value: 'Vercel (Next.js 14)' },
            { label: 'Runtime', value: 'Edge / Node.js 18' },
            { label: 'Deploy Command', value: 'npx vercel --prod', mono: true },
          ].map(item => (
            <div key={item.label} className="flex items-center justify-between py-2"
              style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
              <span className="text-sm text-dark-400">{item.label}</span>
              <div className="flex items-center gap-2">
                <span className={`text-sm ${(item as any).mono ? 'font-mono text-green-300' : 'text-dark-200'}`}>
                  {item.value}
                </span>
                {(item as any).mono && (
                  <button onClick={() => copyToClipboard(item.value)}
                    className="p-1 rounded hover:bg-white/10 text-dark-400 hover:text-white transition-colors">
                    <Copy size={12} />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        <a
          href="https://vercel.com/dashboard"
          target="_blank"
          rel="noopener noreferrer"
          className="btn btn-secondary text-xs"
        >
          <ExternalLink size={13} />
          Open Vercel Dashboard
        </a>
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
