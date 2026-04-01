'use client'

import { usePathname, useRouter } from 'next/navigation'
import { LogOut, ChevronRight, Bell, Menu } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'react-hot-toast'
import Modal from '@/components/ui/Modal'

interface HeaderProps {
  onMenuToggle?: () => void
}

const breadcrumbMap: Record<string, string> = {
  dashboard: 'Dashboard',
  users: 'User Management',
  submissions: 'Submissions',
  practicals: 'Practicals',
  settings: 'Settings',
}

function getBreadcrumbs(pathname: string) {
  const parts = pathname.split('/').filter(Boolean)
  return parts.map((part, i) => ({
    label: breadcrumbMap[part] || part,
    href: '/' + parts.slice(0, i + 1).join('/'),
    isLast: i === parts.length - 1,
  }))
}

export default function Header({ onMenuToggle }: HeaderProps) {
  const pathname = usePathname()
  const router = useRouter()
  const [loggingOut, setLoggingOut] = useState(false)
  const [showJoke, setShowJoke] = useState(false)
  const breadcrumbs = getBreadcrumbs(pathname)

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

  return (
    <header
      className="sticky top-0 z-30 h-16 flex items-center px-4 md:px-6 gap-3 md:gap-4"
      style={{
        background: 'rgba(9, 14, 26, 0.85)',
        backdropFilter: 'blur(12px)',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
      }}
    >
      {/* Mobile menu toggle */}
      <button
        onClick={onMenuToggle}
        className="md:hidden p-2 rounded-lg hover:bg-white/5 text-dark-400 hover:text-white transition-colors"
      >
        <Menu size={20} />
      </button>

      {/* Breadcrumbs */}
      <nav className="flex items-center gap-1.5 flex-1 min-w-0">
        {breadcrumbs.map((crumb) => (
          <span key={crumb.href} className="flex items-center gap-1.5 min-w-0">
            {!crumb.isLast ? (
              <>
                <span className="text-sm text-dark-500 hover:text-dark-300 cursor-pointer truncate transition-colors">
                  {crumb.label}
                </span>
                <ChevronRight size={14} className="text-dark-600 flex-shrink-0" />
              </>
            ) : (
              <span className="text-sm font-semibold text-white truncate">
                {crumb.label}
              </span>
            )}
          </span>
        ))}
      </nav>

      {/* Right side actions */}
      <div className="flex items-center gap-2 flex-shrink-0">
        {/* Notification bell — easter egg */}
        <button
          onClick={() => setShowJoke(true)}
          className="relative p-2 rounded-lg transition-colors hover:bg-white/5 text-dark-400 hover:text-white"
          title="Notifications"
        >
          <Bell size={18} />
          <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
        </button>

        {/* Admin badge */}
        <div
          className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg"
          style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}
        >
          <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white"
            style={{ background: 'linear-gradient(135deg, #2563eb, #7c3aed)' }}>
            A
          </div>
          <span className="text-sm font-medium text-dark-200">ADMIN BAAP</span>
        </div>

        {/* Logout */}
        <button
          onClick={handleLogout}
          disabled={loggingOut}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium text-dark-400 hover:text-red-400 transition-all hover:bg-red-500/10"
          title="Logout"
        >
          {loggingOut ? (
            <div className="w-4 h-4 border-2 border-red-400/30 border-t-red-400 rounded-full animate-spin" />
          ) : (
            <LogOut size={16} />
          )}
          <span className="hidden sm:inline">{loggingOut ? 'Logging out...' : 'Logout'}</span>
        </button>
      </div>

      <Modal isOpen={showJoke} onClose={() => setShowJoke(false)} title="Important Update" size="sm">
        <div className="py-8 flex flex-col items-center justify-center text-center animate-fade-in">
          <div className="text-6xl mb-4 animate-bounce">🤡</div>
          <h2 className="text-2xl font-black text-white mb-2 leading-tight">
            Haa padh le lode<br/>chull tera jayega nhi
          </h2>
          <button 
            onClick={() => setShowJoke(false)} 
            className="btn btn-primary mt-6 px-8 py-3 text-lg w-full justify-center"
          >
            Theek Hai Bhai
          </button>
        </div>
      </Modal>
    </header>
  )
}
