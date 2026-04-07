'use client'

import { useState, useEffect } from 'react'
import { toast } from 'react-hot-toast'
import {
  Shield, Key, LogOut, AlertCircle, Wrench,
  Power, PowerOff, Eye, EyeOff,
} from 'lucide-react'
import { useRouter } from 'next/navigation'

type Tab = 'security' | 'maintenance'

export default function SettingsPage() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<Tab>('security')

  // ── Security tab state ────────────────────────────────────────────────────
  const [newPassword,     setNewPassword]     = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [currentPassword, setCurrentPassword] = useState('')
  const [changingPw,      setChangingPw]      = useState(false)
  const [loggingOut,      setLoggingOut]      = useState(false)

  // ── Maintenance tab state ─────────────────────────────────────────────────
  const [maintCode,  setMaintCode]  = useState('')
  const [showCode,   setShowCode]   = useState(false)
  const [codeError,  setCodeError]  = useState(false)
  const [activating, setActivating] = useState(false)
  const [maintOn,    setMaintOn]    = useState(false)
  const [maintLoading, setMaintLoading] = useState(true)

  // Fetch real server state on mount
  useEffect(() => {
    fetch('/api/admin/maintenance')
      .then(r => r.json())
      .then(json => { if (json.success) setMaintOn(json.active) })
      .catch(() => {})
      .finally(() => setMaintLoading(false))
  }, [])

  // ── Handlers ──────────────────────────────────────────────────────────────
  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault()
    if (newPassword !== confirmPassword) { toast.error('Passwords do not match'); return }
    if (newPassword.length < 8) { toast.error('Password must be at least 8 characters'); return }
    setChangingPw(true)
    await new Promise(r => setTimeout(r, 800))
    toast.success('To change the password, update ADMIN_PASSWORD in your .env.local and redeploy.')
    setChangingPw(false)
    setNewPassword(''); setConfirmPassword(''); setCurrentPassword('')
  }

  const handleLogout = async () => {
    setLoggingOut(true)
    try {
      await fetch('/api/auth/logout', { method: 'POST' })
      router.push('/login')
      router.refresh()
    } catch { setLoggingOut(false) }
  }

  const callMaintenanceApi = async (active: boolean) => {
    const secret = process.env.NEXT_PUBLIC_MAINTENANCE_CODE || ''
    if (!maintCode.trim()) { toast.error('Enter the maintenance code first'); return }

    setActivating(true)
    try {
      // Verify code locally first for instant feedback
      if (maintCode.trim() !== secret) {
        setCodeError(true)
        setTimeout(() => setCodeError(false), 1500)
        toast.error('Wrong code! Hacker nahi banta 🕵️')
        return
      }

      const res  = await fetch('/api/admin/maintenance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ active }),
      })
      const json = await res.json()
      if (json.success) {
        setMaintOn(active)
        setMaintCode('')
        setCodeError(false)
        toast.success(active
          ? '🚧 Maintenance ON — site blocked for everyone!'
          : '✅ Maintenance OFF — site is live again!')
      } else {
        toast.error(json.error || 'Failed to update maintenance')
      }
    } catch { toast.error('Network error') }
    finally { setActivating(false) }
  }

  const handleEnableMaintenance  = () => callMaintenanceApi(true)
  const handleDisableMaintenance = () => callMaintenanceApi(false)

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6 animate-fade-in max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold text-white">Settings</h1>
        <p className="text-sm text-dark-400 mt-0.5">Manage admin configuration</p>
      </div>

      {/* Secret snarky card */}
      <div className="glass-card p-8 flex flex-col items-center justify-center text-center">
        <div className="w-16 h-16 rounded-full flex items-center justify-center mb-4"
          style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
          <AlertCircle size={32} className="text-red-400" />
        </div>
        <h2 className="text-xl font-bold text-white mb-2 tracking-wide">Kya Dekh Raha hai BKL !!!!</h2>
        <p className="text-sm text-dark-400">Yaha kuch nahi milega tere kaam ka.</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 rounded-xl"
        style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>
        {([
          { id: 'security',    label: 'Security',    icon: Shield },
          { id: 'maintenance', label: 'Maintenance', icon: Wrench },
        ] as { id: Tab; label: string; icon: React.ElementType }[]).map(({ id, label, icon: Icon }) => (
          <button key={id} onClick={() => setActiveTab(id)}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all ${
              activeTab === id
                ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                : 'text-dark-400 hover:text-dark-200'
            }`}
          >
            <Icon size={15} />
            {label}
            {id === 'maintenance' && maintOn && (
              <span className="w-2 h-2 rounded-full bg-orange-400 animate-pulse" />
            )}
          </button>
        ))}
      </div>

      {/* ── Security Tab ─────────────────────────────────────────────────── */}
      {activeTab === 'security' && (
        <>
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
                  Update <code className="font-mono bg-black/30 px-1 rounded">.env.local</code> (local) or Vercel env vars (production) and redeploy.
                </p>
              </div>
            </div>

            <form onSubmit={handlePasswordChange} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-dark-300 mb-1.5">Current Password</label>
                <input type="password" value={currentPassword}
                  onChange={e => setCurrentPassword(e.target.value)}
                  className="input-field" placeholder="Enter current password" />
              </div>
              <div>
                <label className="block text-xs font-medium text-dark-300 mb-1.5">New Password</label>
                <input type="password" value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  className="input-field" placeholder="At least 8 characters" />
              </div>
              <div>
                <label className="block text-xs font-medium text-dark-300 mb-1.5">Confirm New Password</label>
                <input type="password" value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  className="input-field" placeholder="Repeat new password" />
              </div>
              <button type="submit" disabled={changingPw} className="btn btn-primary">
                <Key size={14} />
                {changingPw ? 'Updating...' : 'Update Password'}
              </button>
            </form>
          </div>

          {/* Danger zone */}
          <div className="glass-card p-6" style={{ border: '1px solid rgba(239,68,68,0.2)' }}>
            <div className="flex items-center gap-2 mb-4">
              <AlertCircle size={18} className="text-red-400" />
              <h2 className="text-base font-semibold text-white">Session Management</h2>
            </div>
            <p className="text-sm text-dark-400 mb-4">
              Log out from admin panel. You&apos;ll need to enter the password again to access.
            </p>
            <button onClick={handleLogout} disabled={loggingOut} className="btn btn-danger">
              <LogOut size={14} />
              {loggingOut ? 'Logging out...' : 'Log Out'}
            </button>
          </div>
        </>
      )}

      {/* ── Maintenance Tab ───────────────────────────────────────────────── */}
      {activeTab === 'maintenance' && (
        <div className="space-y-4">

          {/* Status card */}
          <div
            className="glass-card p-5 flex items-center gap-4"
            style={{
              border: maintOn
                ? '1px solid rgba(251,146,60,0.3)'
                : '1px solid rgba(34,197,94,0.2)',
              background: maintOn
                ? 'rgba(251,146,60,0.05)'
                : 'rgba(34,197,94,0.04)',
            }}
          >
            <div
              className={`w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 ${
                maintOn ? 'bg-orange-500/15' : 'bg-green-500/10'
              }`}
            >
              {maintOn
                ? <PowerOff size={22} className="text-orange-400" />
                : <Power size={22} className="text-green-400" />}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="text-white font-semibold text-sm">
                  Maintenance Mode
                </p>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    maintOn
                      ? 'bg-orange-500/20 text-orange-400'
                      : 'bg-green-500/10 text-green-400'
                  }`}
                >
                  {maintOn ? '● ACTIVE' : '● INACTIVE'}
                </span>
                {maintOn && <span className="w-2 h-2 rounded-full bg-orange-400 animate-ping" />}
              </div>
              <p className="text-xs text-dark-400 mt-0.5">
                {maintOn
                  ? 'Site is currently BLOCKED. All pages show the maintenance screen.'
                  : 'Site is live and accessible to everyone.'}
              </p>
            </div>
          </div>

          {/* How it works */}
          <div className="glass-card p-5">
            <div className="flex items-center gap-2 mb-3">
              <Wrench size={16} className="text-indigo-400" />
              <h3 className="text-sm font-semibold text-white">How it works</h3>
            </div>
            <ul className="space-y-2 text-xs text-dark-400">
              <li className="flex items-start gap-2">
                <span className="text-indigo-400 font-bold mt-0.5">1.</span>
                Enter the maintenance secret code and click <span className="text-orange-300 font-medium">Enable Maintenance</span> to block the site.
              </li>
              <li className="flex items-start gap-2">
                <span className="text-indigo-400 font-bold mt-0.5">2.</span>
                A funny full-screen overlay will cover the entire dashboard — no one can use it.
              </li>
              <li className="flex items-start gap-2">
                <span className="text-indigo-400 font-bold mt-0.5">3.</span>
                To disable: <span className="text-white font-medium">double-tap</span> the tiny{' '}
                <code className="bg-white/5 px-1 rounded font-mono text-indigo-300">mkc</code>{' '}
                text at the bottom of the maintenance screen, then enter the code again.
              </li>
              <li className="flex items-start gap-2">
                <span className="text-indigo-400 font-bold mt-0.5">4.</span>
                Or come back here to this tab and disable it directly with the code.
              </li>
            </ul>
          </div>

          {/* Code input + action */}
          <div className="glass-card p-5 space-y-4">
            <div>
              <label className="block text-xs font-medium text-dark-300 mb-1.5">
                Maintenance Secret Code
                <span className="text-dark-600 font-normal ml-2">
                  (from <code className="font-mono">NEXT_PUBLIC_MAINTENANCE_CODE</code> in env)
                </span>
              </label>
              <div className="relative">
                <input
                  type={showCode ? 'text' : 'password'}
                  value={maintCode}
                  onChange={e => { setMaintCode(e.target.value); setCodeError(false) }}
                  onKeyDown={e => {
                    if (e.key === 'Enter') {
                      maintOn ? handleDisableMaintenance() : handleEnableMaintenance()
                    }
                  }}
                  placeholder="Enter secret code..."
                  className={`input-field pr-10 font-mono transition-all ${
                    codeError ? 'border-red-500/60 bg-red-500/5' : ''
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowCode(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-dark-400 hover:text-white transition-colors"
                >
                  {showCode ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
              {codeError && (
                <p className="text-red-400 text-xs mt-1">❌ Wrong code! Hacker nahi banta tu.</p>
              )}
            </div>

            <div className="flex gap-3">
              {!maintOn ? (
                <button
                  onClick={handleEnableMaintenance}
                  disabled={activating || !maintCode.trim()}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold text-white transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                  style={{ background: 'linear-gradient(135deg, #f97316, #ef4444)' }}
                >
                  <PowerOff size={15} />
                  {activating ? 'Activating...' : '🚧 Enable Maintenance'}
                </button>
              ) : (
                <button
                  onClick={handleDisableMaintenance}
                  disabled={activating || !maintCode.trim()}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold text-white transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                  style={{ background: 'linear-gradient(135deg, #22c55e, #16a34a)' }}
                >
                  <Power size={15} />
                  {activating ? 'Disabling...' : '✅ Disable Maintenance'}
                </button>
              )}
            </div>

            {maintOn && (
              <div className="px-3 py-2 rounded-lg text-xs text-orange-300/70 text-center"
                style={{ background: 'rgba(251,146,60,0.07)', border: '1px solid rgba(251,146,60,0.15)' }}>
                🚨 Maintenance is currently <strong>ACTIVE</strong>. Enter the code above and click <strong>Disable</strong> to restore site access.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
