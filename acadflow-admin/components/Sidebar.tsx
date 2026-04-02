'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  Users,
  FileText,
  FlaskConical,
  Settings,
  Zap,
  ChevronLeft,
  ChevronRight,
  GraduationCap,
  MessageSquare,
  MessageCircle,
} from 'lucide-react'
import { clsx } from 'clsx'

interface SidebarProps {
  collapsed: boolean
  onToggle: () => void
}

const navItems = [
  { href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard', exact: true },
  { href: '/dashboard/users', icon: Users, label: 'Users' },
  { href: '/dashboard/submissions', icon: FileText, label: 'Submissions' },
  { href: '/dashboard/practicals', icon: FlaskConical, label: 'Practicals' },
  { href: '/dashboard/support', icon: MessageSquare, label: 'Support Desk' },
  { href: '/dashboard/hod-messages', icon: MessageCircle, label: 'HOD Messages' },
  { href: '/dashboard/redo-email', icon: Zap, label: 'Redo Email ⚡' },
  { href: '/dashboard/settings', icon: Settings, label: 'Settings' },
]

export default function Sidebar({ collapsed, onToggle }: SidebarProps) {
  const pathname = usePathname()

  const isActive = (href: string, exact?: boolean) => {
    if (exact) return pathname === href
    return pathname.startsWith(href)
  }

  return (
    <aside
      className={clsx(
        'fixed left-0 top-0 h-full flex flex-col z-40 transition-all duration-300',
        collapsed 
          ? '-translate-x-full md:translate-x-0 w-[260px] md:w-[72px]' 
          : 'translate-x-0 w-[260px]'
      )}
      style={{
        background: 'linear-gradient(180deg, #0f1629 0%, #090e1a 100%)',
        borderRight: '1px solid rgba(255, 255, 255, 0.06)',
      }}
    >
      {/* Logo */}
      <div className="flex items-center h-16 px-4 flex-shrink-0"
        style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <div className="flex items-center gap-3 min-w-0">
          <div
            className="flex-shrink-0 w-9 h-9 rounded-xl flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, #2563eb, #3B82F6)' }}
          >
            <Zap size={18} className="text-white" />
          </div>
          {!collapsed && (
            <div className="min-w-0 overflow-hidden">
              <div className="text-white font-bold text-sm leading-tight">LundFlow</div>
              <div className="text-dark-400 text-xs">Jhatu Panel</div>
            </div>
          )}
        </div>
      </div>

      {/* Nav items */}
      <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto overflow-x-hidden">
        {!collapsed && (
          <div className="px-2 mb-3">
            <p className="text-xs font-semibold tracking-widest uppercase" style={{ color: 'rgba(255,255,255,0.2)' }}>
              Navigation
            </p>
          </div>
        )}

        {navItems.map(({ href, icon: Icon, label, exact }) => {
          const active = isActive(href, exact)
          return (
            <Link key={href} href={href}>
              <div
                className={clsx(
                  'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 cursor-pointer group',
                  collapsed ? 'justify-center' : '',
                  active
                    ? 'text-blue-300'
                    : 'text-dark-400 hover:text-dark-100'
                )}
                style={active ? {
                  background: 'linear-gradient(135deg, rgba(59,130,246,0.18), rgba(59,130,246,0.06))',
                  border: '1px solid rgba(59,130,246,0.2)',
                } : {
                  border: '1px solid transparent',
                }}
                title={collapsed ? label : undefined}
              >
                <Icon
                  size={18}
                  className={clsx(
                    'flex-shrink-0 transition-colors',
                    active ? 'text-blue-400' : 'text-dark-500 group-hover:text-dark-300'
                  )}
                />
                {!collapsed && (
                  <span className="truncate">{label}</span>
                )}
                {!collapsed && active && (
                  <div className="ml-auto w-1.5 h-1.5 rounded-full bg-blue-400 flex-shrink-0" />
                )}
              </div>
            </Link>
          )
        })}
      </nav>

      {/* Footer info */}
      {!collapsed && (
        <div className="px-4 py-3 flex-shrink-0" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          <div className="flex items-center gap-2">
            <GraduationCap size={14} className="text-dark-500" />
            <div>
              <p className="text-xs font-medium text-dark-400">PVPPCOE</p>
              <p className="text-xs text-dark-600">Service Role Mode</p>
            </div>
          </div>
        </div>
      )}

      {/* Collapse toggle (Desktop only) */}
      <button
        onClick={onToggle}
        className="hidden md:flex absolute -right-3 top-20 w-6 h-6 rounded-full items-center justify-center transition-all hover:scale-110 z-50"
        style={{
          background: '#1e40af',
          border: '1px solid rgba(59,130,246,0.4)',
          boxShadow: '0 2px 8px rgba(0,0,0,0.4)',
        }}
      >
        {collapsed
          ? <ChevronRight size={12} className="text-white" />
          : <ChevronLeft size={12} className="text-white" />
        }
      </button>
    </aside>
  )
}
