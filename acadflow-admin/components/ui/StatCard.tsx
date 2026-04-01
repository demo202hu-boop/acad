import { clsx } from 'clsx'
import { ReactNode } from 'react'

interface StatCardProps {
  title: string
  value: string | number
  subtitle?: string
  icon: ReactNode
  color: 'blue' | 'green' | 'yellow' | 'red' | 'purple'
  trend?: { value: number; label: string }
}

const colorConfig = {
  blue:   { bg: 'rgba(59,130,246,0.12)',   icon: 'rgba(59,130,246,0.2)',   text: '#60a5fa', border: 'rgba(59,130,246,0.2)' },
  green:  { bg: 'rgba(16,185,129,0.12)',   icon: 'rgba(16,185,129,0.2)',   text: '#34d399', border: 'rgba(16,185,129,0.2)' },
  yellow: { bg: 'rgba(245,158,11,0.12)',   icon: 'rgba(245,158,11,0.2)',   text: '#fbbf24', border: 'rgba(245,158,11,0.2)' },
  red:    { bg: 'rgba(239,68,68,0.12)',    icon: 'rgba(239,68,68,0.2)',    text: '#f87171', border: 'rgba(239,68,68,0.2)' },
  purple: { bg: 'rgba(168,85,247,0.12)',   icon: 'rgba(168,85,247,0.2)',   text: '#c084fc', border: 'rgba(168,85,247,0.2)' },
}

export default function StatCard({ title, value, subtitle, icon, color, trend }: StatCardProps) {
  const c = colorConfig[color]!

  return (
    <div
      className="relative rounded-2xl p-5 overflow-hidden transition-all duration-200 hover:scale-[1.01]"
      style={{
        background: 'rgba(15, 23, 42, 0.8)',
        border: `1px solid ${c.border}`,
        backdropFilter: 'blur(12px)',
      }}
    >
      {/* Gradient overlay */}
      <div
        className="absolute inset-0 rounded-2xl pointer-events-none"
        style={{ background: `linear-gradient(135deg, ${c.bg} 0%, transparent 60%)` }}
      />

      <div className="relative flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold tracking-wider uppercase mb-2"
            style={{ color: 'rgba(255,255,255,0.4)' }}>
            {title}
          </p>
          <p className="text-3xl font-bold text-white mb-1 leading-none">
            {typeof value === 'number' ? value.toLocaleString() : value}
          </p>
          {subtitle && (
            <p className="text-xs" style={{ color: 'rgba(255,255,255,0.45)' }}>
              {subtitle}
            </p>
          )}
          {trend && (
            <p className="text-xs mt-1.5" style={{ color: trend.value >= 0 ? '#34d399' : '#f87171' }}>
              {trend.value >= 0 ? '↑' : '↓'} {Math.abs(trend.value)}% {trend.label}
            </p>
          )}
        </div>

        <div
          className="flex-shrink-0 w-11 h-11 rounded-xl flex items-center justify-center"
          style={{ background: c.icon, color: c.text }}
        >
          {icon}
        </div>
      </div>
    </div>
  )
}
