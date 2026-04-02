'use client'

import { clsx } from 'clsx'

interface BadgeProps {
  variant: 'blue' | 'green' | 'yellow' | 'red' | 'gray' | 'purple'
  children: React.ReactNode
  dot?: boolean
}

export function Badge({ variant, children, dot }: BadgeProps) {
  const variantClass = `badge-${variant}`
  return (
    <span className={clsx('badge', variantClass)}>
      {dot && <span className="w-1.5 h-1.5 rounded-full bg-current opacity-70" />}
      {children}
    </span>
  )
}

// Role badge
export function RoleBadge({ role }: { role: string }) {
  const config: Record<string, { label: string; variant: BadgeProps['variant'] }> = {
    admin:   { label: 'Admin',   variant: 'red' },
    teacher: { label: 'Teacher', variant: 'green' },
    student: { label: 'Student', variant: 'blue' },
  }
  const { label, variant } = config[role] || { label: role, variant: 'gray' }
  return <Badge variant={variant} dot>{label}</Badge>
}

// Status badge for submissions
export function StatusBadge({ status }: { status: string }) {
  const config: Record<string, { label: string; variant: BadgeProps['variant'] }> = {
    evaluated: { label: 'Evaluated', variant: 'green' },
    submitted: { label: 'Submitted', variant: 'blue' },
    draft:     { label: 'Draft',     variant: 'gray' },
  }
  const { label, variant } = config[status] || { label: status, variant: 'gray' }
  return <Badge variant={variant} dot>{label}</Badge>
}

// Practical status badge
export function PracticalStatusBadge({ status }: { status: string }) {
  const config: Record<string, { label: string; variant: BadgeProps['variant'] }> = {
    active: { label: 'Active', variant: 'green' },
    closed: { label: 'Closed', variant: 'gray' },
  }
  const { label, variant } = config[status] || { label: status, variant: 'gray' }
  return <Badge variant={variant} dot>{label}</Badge>
}

// Ticket status badge
export function TicketStatusBadge({ status }: { status: string }) {
  const config: Record<string, { label: string; variant: BadgeProps['variant'] }> = {
    resolved: { label: 'Resolved', variant: 'green' },
    open:     { label: 'Open',     variant: 'yellow' },
  }
  const { label, variant } = config[status] || { label: status, variant: 'gray' }
  return <Badge variant={variant} dot>{label}</Badge>
}
