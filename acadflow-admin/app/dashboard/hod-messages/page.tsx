'use client'

import { useEffect, useState, useRef } from 'react'
import {
  Search, Bell, CheckCircle, Trash2, MailOpen,
  Mail as MailIcon, Loader2, AlertCircle, User,
  RefreshCw, BellOff, Check, X, ChevronRight,
  Clock,
} from 'lucide-react'
import toast from 'react-hot-toast'
import { format, formatDistanceToNow } from 'date-fns'
import ConfirmDialog from '@/components/ui/ConfirmDialog'

interface Notification {
  id: string
  teacher_id: string
  message: string
  is_read: boolean
  created_at: string
  teacher: {
    name: string
    email: string
  }
}

type FilterTab = 'all' | 'unread' | 'read'

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading]             = useState(true)
  const [refreshing, setRefreshing]       = useState(false)
  const [selected, setSelected]           = useState<Notification | null>(null)
  const [filter, setFilter]               = useState<FilterTab>('all')
  const [search, setSearch]               = useState('')
  const [updatingId, setUpdatingId]       = useState<string | null>(null)
  const [deleteTarget, setDeleteTarget]   = useState<Notification | null>(null)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const detailRef = useRef<HTMLDivElement>(null)

  // ── fetch ─────────────────────────────────────────────────────────────────
  const fetchNotifications = async (silent = false) => {
    if (!silent) setLoading(true)
    else setRefreshing(true)
    try {
      const res  = await fetch('/api/admin/hod-messages')
      const json = await res.json()
      if (json.success) {
        setNotifications(json.data)
        // keep selected in sync
        if (selected) {
          const fresh = (json.data as Notification[]).find(n => n.id === selected.id)
          setSelected(fresh ?? null)
        }
      } else {
        toast.error('Failed to load: ' + json.error)
      }
    } catch { toast.error('Network error') }
    finally { setLoading(false); setRefreshing(false) }
  }

  useEffect(() => { fetchNotifications() }, []) // eslint-disable-line

  // auto-mark as read when opened
  const openNotification = (n: Notification) => {
    setSelected(n)
    if (!n.is_read) toggleRead(n.id, false)
  }

  // ── toggle read ───────────────────────────────────────────────────────────
  const toggleRead = async (id: string, currentStatus: boolean) => {
    setUpdatingId(id)
    try {
      const res  = await fetch('/api/admin/hod-messages', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, is_read: !currentStatus }),
      })
      const json = await res.json()
      if (json.success) {
        setNotifications(prev =>
          prev.map(n => n.id === id ? { ...n, is_read: !currentStatus } : n)
        )
        if (selected?.id === id) setSelected(s => s ? { ...s, is_read: !currentStatus } : null)
        if (currentStatus) toast.success('Marked as unread')
      } else { toast.error(json.error || 'Update failed') }
    } catch { toast.error('Network error') }
    finally { setUpdatingId(null) }
  }

  // ── delete ────────────────────────────────────────────────────────────────
  const handleDelete = async () => {
    if (!deleteTarget) return
    setDeleteLoading(true)
    try {
      const res  = await fetch('/api/admin/hod-messages', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: deleteTarget.id }),
      })
      const json = await res.json()
      if (json.success) {
        toast.success('Notification deleted')
        setNotifications(prev => prev.filter(n => n.id !== deleteTarget.id))
        if (selected?.id === deleteTarget.id) setSelected(null)
        setDeleteTarget(null)
      } else { toast.error(json.error || 'Delete failed') }
    } catch { toast.error('Network error') }
    finally { setDeleteLoading(false) }
  }

  // ── mark all read ─────────────────────────────────────────────────────────
  const markAllRead = async () => {
    const unread = notifications.filter(n => !n.is_read)
    if (!unread.length) return
    await Promise.all(unread.map(n =>
      fetch('/api/admin/hod-messages', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: n.id, is_read: true }),
      })
    ))
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })))
    if (selected) setSelected(s => s ? { ...s, is_read: true } : null)
    toast.success('All marked as read')
  }

  // ── derived ───────────────────────────────────────────────────────────────
  const unreadCount = notifications.filter(n => !n.is_read).length

  const filtered = notifications.filter(n => {
    const matchesTab =
      filter === 'all'    ? true :
      filter === 'unread' ? !n.is_read :
                             n.is_read
    const q = search.toLowerCase()
    const matchesSearch = !q ||
      n.teacher.name.toLowerCase().includes(q) ||
      n.teacher.email.toLowerCase().includes(q) ||
      n.message.toLowerCase().includes(q)
    return matchesTab && matchesSearch
  })

  const avatarLetter = (name: string) => name?.charAt(0)?.toUpperCase() || '?'

  return (
    <div className="space-y-5 animate-fade-in">

      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="relative">
            <Bell size={24} className="text-white" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] rounded-full bg-blue-500 text-white text-[10px] font-bold flex items-center justify-center px-1">
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Notifications</h1>
            <p className="text-xs text-dark-400 mt-0.5">
              {unreadCount > 0
                ? `${unreadCount} unread notification${unreadCount !== 1 ? 's' : ''}`
                : 'All caught up!'}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          {unreadCount > 0 && (
            <button onClick={markAllRead} className="btn btn-secondary text-xs gap-1.5">
              <Check size={14} /> Mark all read
            </button>
          )}
          <button
            onClick={() => fetchNotifications(true)}
            className="btn btn-secondary"
            disabled={refreshing}
          >
            <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* ── Stats row ──────────────────────────────────────────────────── */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Total', value: notifications.length, color: 'blue', icon: Bell },
          { label: 'Unread', value: unreadCount, color: 'orange', icon: MailIcon },
          { label: 'Read', value: notifications.length - unreadCount, color: 'green', icon: CheckCircle },
        ].map(({ label, value, color, icon: Icon }) => (
          <div key={label} className="glass-card p-3 flex items-center gap-3">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 bg-${color}-500/10 text-${color}-400`}>
              <Icon size={18} />
            </div>
            <div>
              <p className="text-xs text-dark-400">{label}</p>
              <p className="text-lg font-bold text-white leading-tight">{value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ── Main panel (2-column on md+) ───────────────────────────────── */}
      <div className="glass-card overflow-hidden flex flex-col md:flex-row" style={{ minHeight: '520px' }}>

        {/* ── LEFT: list pane ─────────────────────────────────────────── */}
        <div
          className={`flex flex-col border-r border-white/5 ${selected ? 'hidden md:flex md:w-[340px] lg:w-[380px]' : 'flex w-full'} flex-shrink-0`}
        >
          {/* Search + Tabs */}
          <div className="p-3 border-b border-white/5 space-y-2">
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-dark-500" />
              <input
                type="text"
                placeholder="Search notifications..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="input-field pl-9 text-sm py-2"
              />
              {search && (
                <button onClick={() => setSearch('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-dark-500 hover:text-white transition-colors">
                  <X size={14} />
                </button>
              )}
            </div>
            {/* Filter tabs */}
            <div className="flex gap-1">
              {(['all', 'unread', 'read'] as FilterTab[]).map(tab => (
                <button key={tab}
                  onClick={() => setFilter(tab)}
                  className={`flex-1 text-xs py-1.5 rounded-lg font-medium capitalize transition-all ${
                    filter === tab
                      ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                      : 'text-dark-400 hover:text-dark-200 border border-transparent'
                  }`}
                >
                  {tab}
                  {tab === 'unread' && unreadCount > 0 && (
                    <span className="ml-1 px-1 py-0 bg-orange-500/20 text-orange-400 rounded text-[10px]">
                      {unreadCount}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* List */}
          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="flex flex-col items-center justify-center h-48 gap-3">
                <Loader2 className="animate-spin text-blue-400" size={28} />
                <p className="text-xs text-dark-400">Loading notifications...</p>
              </div>
            ) : filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-48 gap-2 text-center px-6">
                <BellOff size={32} className="text-dark-600" />
                <p className="text-sm text-dark-400">
                  {search ? 'No results for your search' : `No ${filter !== 'all' ? filter : ''} notifications`}
                </p>
              </div>
            ) : (
              <ul className="divide-y divide-white/[0.04]">
                {filtered.map(n => (
                  <li key={n.id}>
                    <button
                      onClick={() => openNotification(n)}
                      className={`w-full text-left px-4 py-3.5 transition-all group relative ${
                        selected?.id === n.id
                          ? 'bg-blue-500/10 border-l-2 border-blue-400'
                          : 'hover:bg-white/[0.02] border-l-2 border-transparent'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        {/* Avatar */}
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs flex-shrink-0 ${
                          !n.is_read ? 'bg-blue-500/20 text-blue-300' : 'bg-white/5 text-dark-400'
                        }`}>
                          {avatarLetter(n.teacher.name)}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 justify-between">
                            <span className={`text-sm font-medium truncate ${!n.is_read ? 'text-white' : 'text-dark-200'}`}>
                              {n.teacher.name}
                            </span>
                            <span className="text-[10px] text-dark-500 flex-shrink-0">
                              {formatDistanceToNow(new Date(n.created_at), { addSuffix: true })}
                            </span>
                          </div>
                          <p className={`text-xs mt-0.5 line-clamp-2 ${!n.is_read ? 'text-dark-200' : 'text-dark-500'}`}>
                            {n.message}
                          </p>
                        </div>
                      </div>
                      {/* Unread dot */}
                      {!n.is_read && (
                        <div className="absolute right-3 top-4 w-2 h-2 rounded-full bg-blue-400 flex-shrink-0" />
                      )}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* ── RIGHT: detail pane ──────────────────────────────────────── */}
        <div ref={detailRef} className={`flex-1 flex flex-col ${selected ? 'flex' : 'hidden md:flex'}`}>
          {!selected ? (
            <div className="flex-1 flex flex-col items-center justify-center gap-3 text-center px-8">
              <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center">
                <Bell size={28} className="text-dark-600" />
              </div>
              <p className="text-dark-400 text-sm">Select a notification to read it</p>
            </div>
          ) : (
            <>
              {/* Detail header */}
              <div className="px-5 py-4 border-b border-white/5 flex items-center gap-3">
                {/* Mobile back button */}
                <button
                  onClick={() => setSelected(null)}
                  className="md:hidden p-1.5 rounded-lg text-dark-400 hover:text-white hover:bg-white/5 transition-colors"
                >
                  <ChevronRight size={16} className="rotate-180" />
                </button>

                {/* Teacher avatar */}
                <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm bg-blue-500/15 text-blue-300 flex-shrink-0">
                  {avatarLetter(selected.teacher.name)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white font-semibold text-sm">{selected.teacher.name}</p>
                  <p className="text-xs text-dark-400">{selected.teacher.email}</p>
                </div>

                {/* Action buttons */}
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => toggleRead(selected.id, selected.is_read)}
                    disabled={updatingId === selected.id}
                    title={selected.is_read ? 'Mark as unread' : 'Mark as read'}
                    className="p-2 rounded-lg text-dark-400 hover:text-blue-400 hover:bg-blue-500/10 transition-all"
                  >
                    {updatingId === selected.id
                      ? <Loader2 size={16} className="animate-spin" />
                      : selected.is_read
                        ? <MailIcon size={16} />
                        : <MailOpen size={16} />}
                  </button>
                  <button
                    onClick={() => setDeleteTarget(selected)}
                    className="p-2 rounded-lg text-dark-400 hover:text-red-400 hover:bg-red-500/10 transition-all"
                    title="Delete notification"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>

              {/* Status pill */}
              <div className="px-5 pt-4 pb-1">
                <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full ${
                  selected.is_read
                    ? 'bg-green-500/10 text-green-400 border border-green-500/20'
                    : 'bg-orange-500/10 text-orange-400 border border-orange-500/20'
                }`}>
                  {selected.is_read
                    ? <><CheckCircle size={11} /> Read</>
                    : <><AlertCircle size={11} /> Unread</>}
                </span>
              </div>

              {/* Timestamp */}
              <div className="px-5 pt-2 pb-3 flex items-center gap-2 text-xs text-dark-500">
                <Clock size={12} />
                <span>{format(new Date(selected.created_at), 'EEEE, MMMM d, yyyy')} at {format(new Date(selected.created_at), 'h:mm a')}</span>
                <span className="text-dark-600">·</span>
                <span>{formatDistanceToNow(new Date(selected.created_at), { addSuffix: true })}</span>
              </div>

              {/* Divider */}
              <div className="mx-5 border-t border-white/5" />

              {/* Message body */}
              <div className="flex-1 overflow-y-auto px-5 py-5">
                <div className="rounded-xl p-4"
                  style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                  <p className="text-sm text-dark-100 leading-relaxed whitespace-pre-wrap">
                    {selected.message}
                  </p>
                </div>
              </div>

              {/* Footer quick-actions */}
              <div className="px-5 py-3 border-t border-white/5 flex justify-between items-center">
                <span className="text-xs text-dark-500">
                  From <span className="text-dark-300">{selected.teacher.name}</span>
                </span>
                <div className="flex gap-2">
                  <button
                    onClick={() => toggleRead(selected.id, selected.is_read)}
                    disabled={updatingId === selected.id}
                    className="text-xs btn btn-secondary py-1.5 px-3 gap-1.5"
                  >
                    {selected.is_read ? <MailIcon size={13} /> : <MailOpen size={13} />}
                    {selected.is_read ? 'Mark unread' : 'Mark read'}
                  </button>
                  <button
                    onClick={() => setDeleteTarget(selected)}
                    className="text-xs btn py-1.5 px-3 gap-1.5 text-red-400 hover:bg-red-500/10 transition-colors border border-red-500/20"
                  >
                    <Trash2 size={13} /> Delete
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* ── Delete confirm ──────────────────────────────────────────────── */}
      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Delete Notification"
        message={`Permanently delete this notification from ${deleteTarget?.teacher.name}? This cannot be undone.`}
        confirmLabel="Delete"
        variant="danger"
        loading={deleteLoading}
      />
    </div>
  )
}
