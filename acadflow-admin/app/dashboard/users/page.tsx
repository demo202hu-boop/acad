'use client'

import { useState, useEffect, useCallback } from 'react'
import { Search, Edit2, Trash2, RefreshCw, Filter, Users, Key, Eye, EyeOff, Clipboard, ClipboardX, ChevronUp, ChevronDown, ChevronsUpDown } from 'lucide-react'
import { toast } from 'react-hot-toast'
import Modal from '@/components/ui/Modal'
import ConfirmDialog from '@/components/ui/ConfirmDialog'
import Pagination from '@/components/ui/Pagination'
import { RoleBadge } from '@/components/ui/Badge'
import type { UserProfile, UserRole } from '@/types'
import { getYearLabel } from '@/lib/yearLabel'
import { format } from 'date-fns'

const ROLE_OPTIONS: { value: UserRole; label: string }[] = [
  { value: 'all',     label: 'All Roles' },
  { value: 'student', label: 'Students'  },
  { value: 'teacher', label: 'Teachers'  },
  { value: 'admin',   label: 'Admins'    },
]

const YEAR_OPTIONS = ['', '1', '2', '3', '4']

export default function UsersPage() {
  const [users, setUsers]           = useState<UserProfile[]>([])
  const [loading, setLoading]       = useState(true)
  const [search, setSearch]         = useState('')
  const [roleFilter, setRoleFilter] = useState<UserRole>('all')
  const [page, setPage]             = useState(1)
  const [pagination, setPagination] = useState({ total: 0, totalPages: 1, limit: 50 })
  const [sortBy, setSortBy]   = useState('created_at')
  const [sortDir, setSortDir] = useState<'asc'|'desc'>('desc')

  const [editUser, setEditUser]     = useState<UserProfile | null>(null)
  const [editForm, setEditForm]     = useState<Partial<UserProfile>>({})
  const [editLoading, setEditLoading] = useState(false)

  const [deleteTarget, setDeleteTarget]   = useState<UserProfile | null>(null)
  const [deleteLoading, setDeleteLoading] = useState(false)

  const [resetTarget, setResetTarget]   = useState<UserProfile | null>(null)
  const [resetLoading, setResetLoading] = useState(false)
  const [newPassword, setNewPassword]   = useState('')
  const [showPwd, setShowPwd]           = useState(false)

  const fetchUsers = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ page: String(page), limit: '50', search, role: roleFilter, sortBy, sortDir })
      const res  = await fetch(`/api/admin/users?${params}`)
      const json = await res.json()
      if (json.success) { setUsers(json.data); setPagination(json.pagination) }
      else toast.error(json.error || 'Failed to load users')
    } catch { toast.error('Network error') }
    finally { setLoading(false) }
  }, [page, search, roleFilter, sortBy, sortDir])

  // Toggle sort: same column → flip dir; new column → asc
  const handleSort = (col: string) => {
    if (sortBy === col) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    } else {
      setSortBy(col)
      setSortDir('asc')
    }
    setPage(1)
  }

  useEffect(() => { const t = setTimeout(fetchUsers, 300); return () => clearTimeout(t) }, [fetchUsers])

  const openEdit = (user: UserProfile) => {
    setEditUser(user)
    setEditForm({
      name:              user.name,
      role:              user.role,
      enrollment_number: user.enrollment_number || '',
      department:        user.department || '',
      year:              user.year,
      division:          user.division || '',
      batch:             user.batch || '',
    })
  }

  const handleSaveEdit = async () => {
    if (!editUser) return
    setEditLoading(true)
    try {
      const res  = await fetch('/api/admin/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: editUser.id, ...editForm }),
      })
      const json = await res.json()
      if (json.success) { toast.success('User updated'); setEditUser(null); fetchUsers() }
      else toast.error(json.error || 'Update failed')
    } catch { toast.error('Network error') }
    finally { setEditLoading(false) }
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    setDeleteLoading(true)
    try {
      const res  = await fetch('/api/admin/users', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: deleteTarget.id }),
      })
      const json = await res.json()
      if (json.success) { toast.success(`${deleteTarget.name} deleted`); setDeleteTarget(null); fetchUsers() }
      else toast.error(json.error || 'Delete failed')
    } catch { toast.error('Network error') }
    finally { setDeleteLoading(false) }
  }

  const handleSetPassword = async () => {
    if (!resetTarget) return
    if (!newPassword || newPassword.length < 6) {
      toast.error('Password must be at least 6 characters')
      return
    }
    setResetLoading(true)
    try {
      const res  = await fetch(`/api/admin/users/${resetTarget.id}/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: newPassword }),
      })
      const json = await res.json()
      if (json.success) {
        toast.success(`Password updated for ${resetTarget.name}`)
        setResetTarget(null)
        setNewPassword('')
      } else {
        toast.error(json.error || 'Failed to update password')
      }
    } catch { toast.error('Network error') }
    finally { setResetLoading(false) }
  }

  const handleToggleCopyPaste = async (user: UserProfile) => {
    try {
      const res = await fetch('/api/admin/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: user.id, copy_paste_enabled: !user.copy_paste_enabled }),
      })
      const json = await res.json()
      if (json.success) {
        toast.success(
          !user.copy_paste_enabled
            ? `Copy-paste ENABLED for ${user.name}`
            : `Copy-paste DISABLED for ${user.name}`
        )
        // Optimistic update
        setUsers(prev => prev.map(u =>
          u.id === user.id ? { ...u, copy_paste_enabled: !user.copy_paste_enabled } : u
        ))
      } else {
        toast.error(json.error || 'Failed to update')
      }
    } catch { toast.error('Network error') }
  }

  return (
    <div className="space-y-6 animate-fade-in">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">User Management</h1>
          <p className="text-sm text-dark-400 mt-0.5">{pagination.total.toLocaleString()} total users</p>
        </div>
        <button onClick={fetchUsers} className="btn btn-secondary gap-2">
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      {/* Filters */}
      <div className="glass-card p-3 md:p-4 flex flex-col md:flex-row gap-3 items-stretch md:items-center">
        <div className="relative flex-1 w-full md:min-w-[200px]">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-dark-400" />
          <input
            type="text"
            placeholder="Search name, email, enrollment ID..."
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1) }}
            className="input-field pl-9"
          />
        </div>
        <div className="flex items-center gap-2 w-full md:w-auto">
          <Filter size={14} className="text-dark-400 hidden md:block" />
          <select
            value={roleFilter}
            onChange={e => { setRoleFilter(e.target.value as UserRole); setPage(1) }}
            className="input-field w-full md:w-36"
          >
            {ROLE_OPTIONS.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="glass-card overflow-hidden">
        {loading ? (
          <div className="py-16 text-center">
            <div className="inline-block w-8 h-8 border-2 border-blue-400/30 border-t-blue-400 rounded-full animate-spin mb-3" />
            <p className="text-sm text-dark-400">Loading users...</p>
          </div>
        ) : users.length === 0 ? (
          <div className="py-16 text-center">
            <Users size={32} className="mx-auto text-dark-600 mb-3" />
            <p className="text-dark-400">No users found</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="data-table min-w-full">
                <thead>
                  <tr>
                    {([
                      ['name',              'Name'],
                      ['email',             'Email'],
                      ['role',              'Role'],
                      ['enrollment_number', 'Enrollment ID'],
                      ['year',              'Year'],
                      ['division',          'Div / Batch'],
                    ] as [string, string][]).map(([col, label]) => (
                      <th key={col}
                        onClick={() => handleSort(col)}
                        className="cursor-pointer select-none hover:text-white transition-colors"
                      >
                        <span className="inline-flex items-center gap-1">
                          {label}
                          {sortBy === col
                            ? sortDir === 'asc'
                              ? <ChevronUp size={12} className="text-blue-400" />
                              : <ChevronDown size={12} className="text-blue-400" />
                            : <ChevronsUpDown size={11} className="text-dark-600" />}
                        </span>
                      </th>
                    ))}
                    <th
                      onClick={() => handleSort('copy_paste_enabled')}
                      className="text-center cursor-pointer select-none hover:text-white transition-colors"
                    >
                      <span className="inline-flex items-center gap-1 justify-center">
                        Copy-Paste
                        {sortBy === 'copy_paste_enabled'
                          ? sortDir === 'asc'
                            ? <ChevronUp size={12} className="text-blue-400" />
                            : <ChevronDown size={12} className="text-blue-400" />
                          : <ChevronsUpDown size={11} className="text-dark-600" />}
                      </span>
                    </th>
                    <th className="text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map(user => (
                    <tr key={user.id}>
                      {/* Name */}
                      <td>
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                            style={{ background: 'rgba(59,130,246,0.2)', color: '#60a5fa' }}>
                            {user.name?.charAt(0)?.toUpperCase() || '?'}
                          </div>
                          <span className="font-medium text-white text-sm">{user.name || '—'}</span>
                        </div>
                      </td>

                      {/* Email */}
                      <td className="text-dark-300 text-xs">{user.email}</td>

                      {/* Role */}
                      <td><RoleBadge role={user.role} /></td>

                      {/* Enrollment ID */}
                      <td>
                        <span className="font-mono text-xs text-blue-300 px-1.5 py-0.5 rounded"
                          style={{ background: user.enrollment_number ? 'rgba(59,130,246,0.1)' : 'transparent' }}>
                          {user.enrollment_number || '—'}
                        </span>
                      </td>

                      {/* Year */}
                      <td>
                        {user.year ? (
                          <span className="px-2 py-0.5 rounded text-xs font-semibold"
                            style={{ background: 'rgba(16,185,129,0.12)', color: '#34d399' }}>
                            {getYearLabel(user.year)}
                          </span>
                        ) : '—'}
                      </td>

                      {/* Division / Practical Batch */}
                      <td>
                        {user.division ? (
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-xs font-medium px-1.5 py-0.5 rounded"
                              style={{ background: 'rgba(99,102,241,0.15)', color: '#a5b4fc' }}>
                              Div {user.division}
                            </span>
                            {user.batch && (
                              <span className="text-xs font-medium px-1.5 py-0.5 rounded"
                                style={{ background: 'rgba(245,158,11,0.12)', color: '#fbbf24' }}>
                                Batch {user.batch}
                              </span>
                            )}
                          </div>
                        ) : '—'}
                      </td>

                      {/* Copy-Paste toggle */}
                      <td className="text-center">
                        <button
                          onClick={() => handleToggleCopyPaste(user)}
                          title={user.copy_paste_enabled ? 'Copy-paste ON — click to disable' : 'Copy-paste OFF — click to enable'}
                          className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs font-medium transition-all ${
                            user.copy_paste_enabled
                              ? 'text-emerald-400 hover:bg-emerald-500/10'
                              : 'text-dark-500 hover:bg-red-500/10 hover:text-red-400'
                          }`}
                        >
                          {user.copy_paste_enabled
                            ? <><Clipboard size={13} />ON</>
                            : <><ClipboardX size={13} />OFF</>}
                        </button>
                      </td>

                      {/* Actions */}
                      <td>
                        <div className="flex items-center gap-1 justify-end">
                          <button onClick={() => openEdit(user)}
                            className="p-1.5 rounded-lg text-dark-400 hover:text-blue-400 hover:bg-blue-500/10 transition-colors"
                            title="Edit user">
                            <Edit2 size={14} />
                          </button>
                          <button onClick={() => { setResetTarget(user); setNewPassword(''); setShowPwd(false) }}
                            className="p-1.5 rounded-lg text-dark-400 hover:text-yellow-400 hover:bg-yellow-500/10 transition-colors"
                            title="Set password">
                            <Key size={14} />
                          </button>
                          <button onClick={() => setDeleteTarget(user)}
                            className="p-1.5 rounded-lg text-dark-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                            title="Delete user">
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Pagination
              page={page}
              totalPages={pagination.totalPages}
              total={pagination.total}
              limit={pagination.limit}
              onPageChange={setPage}
            />
          </>
        )}
      </div>

      {/* ── Edit Modal ────────────────────── */}
      <Modal
        isOpen={!!editUser}
        onClose={() => setEditUser(null)}
        title={`Edit User — ${editUser?.name}`}
        size="lg"
        footer={
          <>
            <button onClick={() => setEditUser(null)} className="btn btn-secondary">Cancel</button>
            <button onClick={handleSaveEdit} disabled={editLoading} className="btn btn-primary">
              {editLoading
                ? <span className="flex items-center gap-2"><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Saving...</span>
                : 'Save Changes'}
            </button>
          </>
        }
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

          {/* Full Name */}
          <div className="sm:col-span-2">
            <label className="block text-xs font-medium text-dark-300 mb-1.5">Full Name</label>
            <input type="text" value={editForm.name || ''}
              onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))}
              className="input-field" />
          </div>

          {/* Role */}
          <div>
            <label className="block text-xs font-medium text-dark-300 mb-1.5">Role</label>
            <select value={editForm.role || 'student'}
              onChange={e => setEditForm(f => ({ ...f, role: e.target.value as UserProfile['role'] }))}
              className="input-field">
              <option value="student">Student</option>
              <option value="teacher">Teacher</option>
              <option value="admin">Admin</option>
            </select>
          </div>

          {/* Enrollment ID */}
          <div>
            <label className="block text-xs font-medium text-dark-300 mb-1.5">
              Enrollment ID
              <span className="text-dark-600 font-normal ml-1">e.g. VU1F2223092</span>
            </label>
            <input type="text" value={editForm.enrollment_number || ''}
              onChange={e => setEditForm(f => ({ ...f, enrollment_number: e.target.value }))}
              className="input-field font-mono"
              placeholder="VU1F2223092" />
          </div>

          {/* Department */}
          <div className="sm:col-span-2">
            <label className="block text-xs font-medium text-dark-300 mb-1.5">
              Department / Branch
            </label>
            <input type="text" value={editForm.department || ''}
              onChange={e => setEditForm(f => ({ ...f, department: e.target.value }))}
              className="input-field"
              placeholder="e.g. Computer Engineering" />
          </div>

          {/* Current Year */}
          <div>
            <label className="block text-xs font-medium text-dark-300 mb-1.5">Current Year</label>
            <select value={editForm.year || ''}
              onChange={e => setEditForm(f => ({ ...f, year: parseInt(e.target.value) || undefined }))}
              className="input-field">
              <option value="">— Select Year —</option>
              {YEAR_OPTIONS.filter(Boolean).map(y => (
                <option key={y} value={y}>Year {y}</option>
              ))}
            </select>
          </div>

          {/* Division */}
          <div>
            <label className="block text-xs font-medium text-dark-300 mb-1.5">Division</label>
            <input type="text" value={editForm.division || ''}
              onChange={e => setEditForm(f => ({ ...f, division: e.target.value.toUpperCase() }))}
              className="input-field"
              placeholder="e.g. B"
              maxLength={2} />
          </div>

          {/* Practical Batch */}
          <div>
            <label className="block text-xs font-medium text-dark-300 mb-1.5">Practical Batch</label>
            <input type="text" value={editForm.batch || ''}
              onChange={e => setEditForm(f => ({ ...f, batch: e.target.value.toUpperCase() }))}
              className="input-field"
              placeholder="e.g. A"
              maxLength={4} />
          </div>

        </div>

        {/* Read-only info strip */}
        <div className="mt-4 px-3 py-2.5 rounded-lg text-xs text-dark-400 flex flex-wrap gap-3"
          style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
          <span>Email: <span className="text-dark-200">{editUser?.email}</span></span>
          <span>ID: <span className="text-dark-200 font-mono">{editUser?.id?.slice(0, 8)}…</span></span>
        </div>
      </Modal>

      {/* Delete Confirm */}
      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Delete User"
        message={`Delete "${deleteTarget?.name}"? This cannot be undone and will affect all related submissions.`}
        confirmLabel="Delete User"
        variant="danger"
        loading={deleteLoading}
      />

      {/* Set Password Modal */}
      <Modal
        isOpen={!!resetTarget}
        onClose={() => { setResetTarget(null); setNewPassword('') }}
        title={`Set Password — ${resetTarget?.name}`}
        size="sm"
        footer={
          <>
            <button onClick={() => { setResetTarget(null); setNewPassword('') }} className="btn btn-secondary">Cancel</button>
            <button onClick={handleSetPassword} disabled={resetLoading || newPassword.length < 6} className="btn btn-primary">
              {resetLoading
                ? <span className="flex items-center gap-2"><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Saving...</span>
                : 'Set Password'}
            </button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="px-3 py-2.5 rounded-lg text-xs text-dark-400"
            style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
            <span className="text-dark-200 font-medium">{resetTarget?.email}</span>
          </div>
          <div>
            <label className="block text-xs font-medium text-dark-300 mb-1.5">
              New Password
              <span className="text-dark-600 font-normal ml-1">— min 6 characters</span>
            </label>
            <div className="relative">
              <input
                type={showPwd ? 'text' : 'password'}
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSetPassword()}
                className="input-field pr-10"
                placeholder="Enter new password"
                autoFocus
              />
              <button
                type="button"
                onClick={() => setShowPwd(p => !p)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-dark-400 hover:text-white transition-colors"
              >
                {showPwd ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
            {newPassword.length > 0 && newPassword.length < 6 && (
              <p className="text-xs text-red-400 mt-1">Too short — minimum 6 characters</p>
            )}
          </div>
        </div>
      </Modal>

    </div>
  )
}
