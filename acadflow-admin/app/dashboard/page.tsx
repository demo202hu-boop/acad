'use client'

import { useEffect, useState } from 'react'
import {
  Users, FileText, FlaskConical, Clock,
  CheckCircle, TrendingUp, BookOpen, GraduationCap
} from 'lucide-react'
import StatCard from '@/components/ui/StatCard'
import type { DashboardMetrics } from '@/types'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell
} from 'recharts'

const MOCK_WEEKLY_DATA = [
  { day: 'Mon', submissions: 12 },
  { day: 'Tue', submissions: 28 },
  { day: 'Wed', submissions: 18 },
  { day: 'Thu', submissions: 35 },
  { day: 'Fri', submissions: 22 },
  { day: 'Sat', submissions: 8 },
  { day: 'Sun', submissions: 5 },
]

function SkeletonCard() {
  return (
    <div className="rounded-2xl p-5" style={{ background: 'rgba(15,23,42,0.8)', border: '1px solid rgba(255,255,255,0.08)' }}>
      <div className="skeleton h-3 w-24 mb-3" />
      <div className="skeleton h-8 w-16 mb-2" />
      <div className="skeleton h-2.5 w-20" />
    </div>
  )
}

export default function DashboardPage() {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showWelcome, setShowWelcome] = useState(false)

  useEffect(() => {
    // Only show welcome popup when maintenance mode is OFF
    const isMaintenance = localStorage.getItem('acadflow_maintenance_on') === 'true'
    if (!isMaintenance) {
      setTimeout(() => setShowWelcome(true), 600)
    }
  }, [])

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch('/api/admin/dashboard')
        const json = await res.json()
        if (json.success) setMetrics(json.data)
        else setError(json.error || 'Failed to load metrics')
      } catch {
        setError('Failed to load dashboard data')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const statCards = metrics ? [
    {
      title: 'Total Students',
      value: metrics.totalStudents,
      subtitle: 'Registered students',
      icon: <GraduationCap size={20} />,
      color: 'blue' as const,
    },
    {
      title: 'Teachers',
      value: metrics.totalTeachers,
      subtitle: `${metrics.totalAdmins} admin(s)`,
      icon: <Users size={20} />,
      color: 'green' as const,
    },
    {
      title: 'Total Submissions',
      value: metrics.totalSubmissions,
      subtitle: `${metrics.evaluatedSubmissions} evaluated`,
      icon: <FileText size={20} />,
      color: 'purple' as const,
    },
    {
      title: 'Pending Evaluation',
      value: metrics.pendingEvaluations,
      subtitle: 'Awaiting grades',
      icon: <Clock size={20} />,
      color: 'yellow' as const,
    },
    {
      title: 'Active Practicals',
      value: metrics.activePracticals,
      subtitle: `${metrics.closedPracticals} closed`,
      icon: <FlaskConical size={20} />,
      color: 'blue' as const,
    },
    {
      title: 'Average Grade',
      value: metrics.averageGrade > 0 ? `${metrics.averageGrade}` : '—',
      subtitle: 'Average marks awarded',
      icon: <TrendingUp size={20} />,
      color: 'green' as const,
    },
  ] : []

  return (
    <>
      <div className="space-y-8 animate-fade-in">
        {/* Page header */}
        <div>
          <h1 className="text-2xl font-bold text-white mb-1">Dashboard</h1>
          <p className="text-sm text-dark-400">
            Welcome back! Here&apos;s what&apos;s happening with LundFlow.
          </p>
        </div>

        {/* Error */}
        {error && (
          <div className="px-4 py-3 rounded-xl text-sm text-red-300"
            style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)' }}>
            ⚠️ {error}
          </div>
        )}

        {/* Metrics grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {loading
            ? Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)
            : statCards.map((card) => <StatCard key={card.title} {...card} />)
          }
        </div>

        {/* Charts & Info row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Weekly submissions chart */}
          <div className="lg:col-span-2 glass-card p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="font-semibold text-white">Submission Activity</h3>
                <p className="text-xs text-dark-400 mt-0.5">Last 7 days (sample data)</p>
              </div>
              <span className="badge badge-blue">Weekly</span>
            </div>
            <div className="h-52">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={MOCK_WEEKLY_DATA} barSize={28}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" vertical={false} />
                  <XAxis dataKey="day" tick={{ fill: 'rgba(255,255,255,0.35)', fontSize: 12 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: 'rgba(255,255,255,0.35)', fontSize: 12 }} axisLine={false} tickLine={false} />
                  <Tooltip
                    contentStyle={{
                      background: '#1e293b',
                      border: '1px solid rgba(255,255,255,0.1)',
                      borderRadius: '10px',
                      color: 'white',
                      fontSize: '12px',
                    }}
                    cursor={{ fill: 'rgba(255,255,255,0.04)' }}
                  />
                  <Bar dataKey="submissions" radius={[6, 6, 0, 0]}>
                    {MOCK_WEEKLY_DATA.map((_, idx) => (
                      <Cell key={idx} fill={idx === 3 ? '#3B82F6' : 'rgba(59,130,246,0.45)'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Quick status panel */}
          <div className="glass-card p-6 flex flex-col gap-4">
            <h3 className="font-semibold text-white">System Status</h3>

            {[
              { label: 'Supabase DB', status: 'Operational', color: '#10B981' },
              { label: 'Auth Service', status: 'Operational', color: '#10B981' },
              { label: 'Storage', status: 'Operational', color: '#10B981' },
              { label: 'API Routes', status: 'Active', color: '#3B82F6' },
            ].map(item => (
              <div key={item.label} className="flex items-center justify-between">
                <span className="text-sm text-dark-300">{item.label}</span>
                <span className="flex items-center gap-1.5 text-xs font-medium" style={{ color: item.color }}>
                  <span className="w-1.5 h-1.5 rounded-full" style={{ background: item.color }} />
                  {item.status}
                </span>
              </div>
            ))}

            <div className="mt-2 pt-4" style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }}>
              <div className="flex items-center gap-2 text-xs text-dark-400">
                <CheckCircle size={14} className="text-green-400" />
                Service Role Key Active
              </div>
              <div className="flex items-center gap-2 text-xs text-dark-400 mt-1.5">
                <BookOpen size={14} className="text-blue-400" />
                RLS Bypassed (Admin Mode)
              </div>
            </div>
          </div>
        </div>

        {/* Quick actions */}
        <div className="glass-card p-6">
          <h3 className="font-semibold text-white mb-4">Quick Actions</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { label: 'View Users', href: '/dashboard/users', icon: Users, color: '#3B82F6' },
              { label: 'Review Submissions', href: '/dashboard/submissions', icon: FileText, color: '#8b5cf6' },
              { label: 'Manage Practicals', href: '/dashboard/practicals', icon: FlaskConical, color: '#10B981' },
              { label: 'Pending Evals', href: '/dashboard/submissions?status=submitted', icon: Clock, color: '#F59E0B' },
            ].map(action => (
              <a key={action.label} href={action.href}
                className="flex flex-col items-center gap-2 p-4 rounded-xl text-center transition-all hover:scale-105"
                style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
                <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                  style={{ background: `${action.color}20`, color: action.color }}>
                  <action.icon size={20} />
                </div>
                <span className="text-xs font-medium text-dark-200">{action.label}</span>
              </a>
            ))}
          </div>
        </div>
      </div>

      {/* ── Fakir System*/}
      {showWelcome && (
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)' }}
          onClick={() => setShowWelcome(false)}
        >
          <div
            className="relative max-w-sm w-full rounded-2xl p-8 text-center animate-slide-up"
            style={{
              background: 'linear-gradient(135deg, #0f1629, #1a1040)',
              border: '1px solid rgba(139,92,246,0.4)',
              boxShadow: '0 0 60px rgba(139,92,246,0.25), 0 25px 50px rgba(0,0,0,0.6)',
            }}
            onClick={e => e.stopPropagation()}
          >
            <div className="text-6xl mb-4 animate-bounce">🎉</div>

            <h2 className="text-2xl font-bold text-white mb-2">
              Warm Welcome to LundFlow!
            </h2>

            <p className="text-sm mb-1" style={{ color: 'rgba(255,255,255,0.5)' }}>
              PVPPCOE Jhatu Educational Management System
            </p>

            <div
              className="my-5 px-4 py-3 rounded-xl text-sm font-medium"
              style={{ background: 'rgba(139,92,246,0.15)', border: '1px solid rgba(139,92,246,0.3)', color: '#c4b5fd' }}
            >
              Chaliye... inki maa chodte hai 😈
            </div>

            <p className="text-xs mb-6" style={{ color: 'rgba(255,255,255,0.3)' }}>
              Powered by Chutbase™ &amp; Lundrcel™ · All systems non-operational
            </p>

            <button
              onClick={() => setShowWelcome(false)}
              className="btn btn-primary w-full justify-center py-2.5 font-semibold"
              style={{ background: 'linear-gradient(135deg, #7c3aed, #8b5cf6)' }}
            >
              Haan bhai, shuru karte hai 🚀
            </button>

            <p className="text-xs mt-3" style={{ color: 'rgba(255,255,255,0.2)' }}>
              Fakir System😵‍💫
            </p>
          </div>
        </div>
      )}
    </>
  )
}
