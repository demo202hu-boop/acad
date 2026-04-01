'use client'

import { useState, useEffect, useCallback } from 'react'
import { Search, RefreshCw, Edit2, Trash2, Plus, FlaskConical, Calendar, Users2, Zap, Filter } from 'lucide-react'
import { toast } from 'react-hot-toast'
import Modal from '@/components/ui/Modal'
import ConfirmDialog from '@/components/ui/ConfirmDialog'
import Pagination from '@/components/ui/Pagination'
import { PracticalStatusBadge } from '@/components/ui/Badge'
import type { BatchPractical } from '@/types'
import { format } from 'date-fns'
import { getYearLabel } from '@/lib/yearLabel'

interface NamedBatch {
  id: string
  name: string
  code: string
  year: number | null
  division: string
  batch: string
  academic_year: string
}

export default function PracticalsPage() {
  const [practicals, setPracticals] = useState<BatchPractical[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [selectedBatchId, setSelectedBatchId] = useState('')   // Named batch UUID filter
  const [batches, setBatches] = useState<NamedBatch[]>([])
  const [page, setPage] = useState(1)
  const [pagination, setPagination] = useState({ total: 0, totalPages: 1, limit: 50 })

  const [editPractical, setEditPractical] = useState<BatchPractical | null>(null)
  const [editMode, setEditMode] = useState<'create' | 'edit'>('edit')
  const [editForm, setEditForm] = useState<Partial<BatchPractical>>({})
  const [editLoading, setEditLoading] = useState(false)

  const [deleteTarget, setDeleteTarget] = useState<BatchPractical | null>(null)
  const [deleteLoading, setDeleteLoading] = useState(false)

  const [bulkTarget, setBulkTarget] = useState<{ practical: BatchPractical; marks: number } | null>(null)
  const [bulkLoading, setBulkLoading] = useState(false)

  // Load named batches for filter dropdown
  useEffect(() => {
    fetch('/api/admin/batches')
      .then(r => r.json())
      .then(json => { if (json.success) setBatches(json.data) })
      .catch(() => {})
  }, [])

  const fetchPracticals = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: '50',
        search,
        status: statusFilter,
        ...(selectedBatchId ? { batch_id: selectedBatchId } : {}),
      })
      const res = await fetch(`/api/admin/practicals?${params}`)
      const json = await res.json()
      if (json.success) {
        setPracticals(json.data)
        setPagination(json.pagination)
      } else {
        toast.error(json.error || 'Failed to load practicals')
      }
    } catch {
      toast.error('Network error')
    } finally {
      setLoading(false)
    }
  }, [page, search, statusFilter, selectedBatchId])

  useEffect(() => {
    const t = setTimeout(fetchPracticals, 300)
    return () => clearTimeout(t)
  }, [fetchPracticals])

  const openCreate = () => {
    setEditMode('create')
    setEditPractical({} as BatchPractical)
    setEditForm({
      title: '',
      experiment_number: '',
      division: '',
      batch: '',
      deadline: new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 16),
      total_points: 20,
      status: 'active',
      notes: '',
      resource_link: '',
    })
  }

  const openEdit = (practical: BatchPractical) => {
    setEditMode('edit')
    setEditPractical(practical)
    setEditForm({
      title: practical.title,
      experiment_number: practical.experiment_number || '',
      division: practical.division,
      batch: practical.batch,
      deadline: practical.deadline
        ? new Date(practical.deadline).toISOString().slice(0, 16)
        : '',
      total_points: practical.total_points,
      status: practical.status,
      notes: practical.notes || '',
      resource_link: practical.resource_link || '',
    })
  }

  const handleSave = async () => {
    setEditLoading(true)
    try {
      const url = '/api/admin/practicals'
      const method = editMode === 'create' ? 'POST' : 'PATCH'
      const body = editMode === 'edit'
        ? { id: editPractical?.id, ...editForm }
        : editForm

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const json = await res.json()
      if (json.success) {
        toast.success(editMode === 'create' ? 'Practical created!' : 'Practical updated!')
        setEditPractical(null)
        fetchPracticals()
      } else {
        toast.error(json.error || 'Save failed')
      }
    } catch {
      toast.error('Network error')
    } finally {
      setEditLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    setDeleteLoading(true)
    try {
      const res = await fetch('/api/admin/practicals', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: deleteTarget.id }),
      })
      const json = await res.json()
      if (json.success) {
        toast.success(`"${deleteTarget.title}" deleted`)
        setDeleteTarget(null)
        fetchPracticals()
      } else {
        toast.error(json.error || 'Delete failed')
      }
    } catch {
      toast.error('Network error')
    } finally {
      setDeleteLoading(false)
    }
  }

  const handleBulkGrade = async () => {
    if (!bulkTarget) return
    setBulkLoading(true)
    try {
      const res = await fetch('/api/admin/submissions/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          practicalId: bulkTarget.practical.id,
          marks: bulkTarget.marks,
        }),
      })
      const json = await res.json()
      if (json.success) {
        toast.success(`Bulk graded ${json.updated ?? 'all'} submissions`)
        setBulkTarget(null)
      } else {
        toast.error(json.error || 'Bulk grade failed')
      }
    } catch {
      toast.error('Network error')
    } finally {
      setBulkLoading(false)
    }
  }

  const isDeadlinePassed = (deadline: string) => new Date(deadline) < new Date()

  // Derive the active batch name for header display
  const activeBatch = batches.find(b => b.id === selectedBatchId)

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Practicals</h1>
          <p className="text-sm text-dark-400 mt-0.5">
            {pagination.total.toLocaleString()} practical{pagination.total !== 1 ? 's' : ''}
            {activeBatch ? ` · ${activeBatch.name}` : ''}
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={fetchPracticals} className="btn btn-secondary">
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          </button>
          <button onClick={openCreate} className="btn btn-primary">
            <Plus size={16} />
            New Practical
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="glass-card p-3 md:p-4 flex flex-col md:flex-row gap-3 items-stretch md:items-center">
        {/* Search */}
        <div className="relative flex-1 w-full md:min-w-[200px]">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-dark-400" />
          <input
            type="text"
            placeholder="Search title, experiment number, division..."
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1) }}
            className="input-field pl-9"
          />
        </div>

        {/* Named Batch filter */}
        <div className="flex items-center gap-2 w-full md:w-auto">
          <Filter size={14} className="text-dark-400 flex-shrink-0 hidden md:block" />
          <select
            value={selectedBatchId}
            onChange={e => { setSelectedBatchId(e.target.value); setPage(1) }}
            className="input-field w-full md:w-56"
          >
            <option value="">All Batches</option>
            {Object.entries(
              batches.reduce<Record<string, typeof batches>>((acc, b) => {
                const key = getYearLabel(b.year) ?? 'Other'
                ;(acc[key] ??= []).push(b)
                return acc
              }, {})
            ).flatMap(([yearLabel, group]) => [
              <option key={`hdr-${yearLabel}`} disabled>
                ── {yearLabel} ──
              </option>,
              ...group.map(b => (
                <option key={b.id} value={b.id}>
                  Div {b.division} · Batch {b.batch} — {b.name}
                </option>
              )),
            ])}
          </select>
        </div>

        {/* Status filter */}
        <select
          value={statusFilter}
          onChange={e => { setStatusFilter(e.target.value); setPage(1) }}
          className="input-field w-full md:w-36"
        >
          <option value="all">All Status</option>
          <option value="active">Active</option>
          <option value="closed">Closed</option>
        </select>
      </div>

      {/* Active batch info banner */}
      {activeBatch && (
        <div className="glass-card p-3 flex items-center gap-3 border border-blue-500/20"
          style={{ background: 'rgba(59,130,246,0.06)' }}>
          <FlaskConical size={16} className="text-blue-400 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <span className="text-sm text-white font-medium">{activeBatch.name}</span>
            <span className="text-xs text-dark-400 ml-2">
              {getYearLabel(activeBatch.year)} · Div {activeBatch.division} · Batch {activeBatch.batch}
              {activeBatch.academic_year ? ` · ${activeBatch.academic_year}` : ''}
            </span>
          </div>
          <button
            onClick={() => setSelectedBatchId('')}
            className="text-xs text-dark-400 hover:text-white transition-colors flex-shrink-0"
          >
            Clear ×
          </button>
        </div>
      )}

      {/* Table */}
      <div className="glass-card overflow-hidden">
        {loading ? (
          <div className="py-16 text-center">
            <div className="inline-block w-8 h-8 border-2 border-blue-400/30 border-t-blue-400 rounded-full animate-spin mb-3" />
            <p className="text-sm text-dark-400">Loading practicals...</p>
          </div>
        ) : practicals.length === 0 ? (
          <div className="py-16 text-center">
            <FlaskConical size={32} className="mx-auto text-dark-600 mb-3" />
            <p className="text-dark-400">No practicals found</p>
            <button onClick={openCreate} className="btn btn-primary mt-4">
              <Plus size={16} /> Create First Practical
            </button>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="data-table min-w-full">
                <thead>
                  <tr>
                    <th>Experiment</th>
                    <th>Title</th>
                    <th>Year / Batch</th>
                    <th className="text-center">Points</th>
                    <th>Deadline</th>
                    <th>Status</th>
                    <th className="text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {practicals.map(prac => (
                      <tr key={prac.id}>
                        <td>
                          <span className="font-mono text-xs text-blue-300 px-1.5 py-0.5 rounded"
                            style={{ background: 'rgba(59,130,246,0.1)' }}>
                            {prac.experiment_number || '—'}
                          </span>
                        </td>
                        <td>
                          <div className="font-medium text-white text-sm line-clamp-1">{prac.title}</div>
                          {prac.notes && <div className="text-xs text-dark-400 mt-0.5 line-clamp-1">{prac.notes}</div>}
                        </td>
                        <td>
                          <div className="flex flex-col gap-0.5">
                            {/* Year — only show from activeBatch when filter is active (avoids ambiguous matching) */}
                            {activeBatch?.year != null && (
                              <span className="text-xs font-semibold text-indigo-300">
                                {getYearLabel(activeBatch.year)}
                              </span>
                            )}
                            <div className="flex items-center gap-1.5">
                              <Users2 size={12} className="text-dark-400" />
                              <span className="text-sm text-dark-200">
                                Div {prac.division} / Batch {prac.batch}
                              </span>
                            </div>
                            {/* Batch name only when actively filtering by that batch */}
                            {activeBatch && (
                              <span className="text-xs text-dark-500 line-clamp-1">
                                {activeBatch.name}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="text-center">
                          <span className="text-sm font-semibold text-white">{prac.total_points}</span>
                          <span className="text-xs text-dark-400 ml-0.5">pts</span>
                        </td>
                        <td>
                          <div className="flex items-center gap-1.5">
                            <Calendar size={12} className={isDeadlinePassed(prac.deadline) ? 'text-red-400' : 'text-dark-400'} />
                            <span className={`text-xs ${isDeadlinePassed(prac.deadline) ? 'text-red-400' : 'text-dark-300'}`}>
                              {prac.deadline
                                ? format(new Date(prac.deadline), 'dd MMM yy')
                                : '—'}
                            </span>
                          </div>
                        </td>
                        <td><PracticalStatusBadge status={prac.status} /></td>
                        <td>
                          <div className="flex items-center gap-1 justify-end">
                            <button
                              onClick={() => {
                                const marks = prompt(`Set marks for ALL submissions in "${prac.title}":`, String(prac.total_points))
                                if (marks && !isNaN(parseInt(marks))) {
                                  setBulkTarget({ practical: prac, marks: parseInt(marks) })
                                }
                              }}
                              className="p-1.5 rounded-lg text-dark-400 hover:text-green-400 hover:bg-green-500/10 transition-colors"
                              title="Bulk grade all submissions"
                            >
                              <Zap size={14} />
                            </button>
                            <button
                              onClick={() => openEdit(prac)}
                              className="p-1.5 rounded-lg text-dark-400 hover:text-blue-400 hover:bg-blue-500/10 transition-colors"
                              title="Edit practical"
                            >
                              <Edit2 size={14} />
                            </button>
                            <button
                              onClick={() => setDeleteTarget(prac)}
                              className="p-1.5 rounded-lg text-dark-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                              title="Delete practical"
                            >
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

      {/* Edit / Create Modal */}
      <Modal
        isOpen={!!editPractical}
        onClose={() => setEditPractical(null)}
        title={editMode === 'create' ? 'Create New Practical' : `Edit — ${editPractical?.title}`}
        size="lg"
        footer={
          <>
            <button onClick={() => setEditPractical(null)} className="btn btn-secondary">Cancel</button>
            <button onClick={handleSave} disabled={editLoading} className="btn btn-primary">
              {editLoading ? (
                <span className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Saving...
                </span>
              ) : editMode === 'create' ? 'Create Practical' : 'Save Changes'}
            </button>
          </>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-dark-300 mb-1.5">Title *</label>
            <input
              type="text"
              value={editForm.title || ''}
              onChange={e => setEditForm(f => ({ ...f, title: e.target.value }))}
              className="input-field"
              placeholder="e.g. Introduction to Python"
            />
          </div>

          {/* Named batch picker — populates division + batch automatically */}
          <div>
            <label className="block text-xs font-medium text-dark-300 mb-1.5">
              Batch (select from lab batches)
            </label>
            <select
              value={
                batches.find(b => b.division === editForm.division && b.batch === editForm.batch)?.id ?? ''
              }
              onChange={e => {
                const b = batches.find(x => x.id === e.target.value)
                if (b) setEditForm(f => ({ ...f, division: b.division, batch: b.batch }))
              }}
              className="input-field"
            >
              <option value="">— Select a batch —</option>
              {Object.entries(
                batches.reduce<Record<string, typeof batches>>((acc, b) => {
                  const key = getYearLabel(b.year) ?? 'Other'
                  ;(acc[key] ??= []).push(b)
                  return acc
                }, {})
              ).flatMap(([yearLabel, group]) => [
                <option key={`hdr-${yearLabel}`} disabled>
                  ── {yearLabel} ──
                </option>,
                ...group.map(b => (
                  <option key={b.id} value={b.id}>
                    Div {b.division} · Batch {b.batch} — {b.name}
                  </option>
                )),
              ])}
            </select>
            {/* Fallback manual entry if batches list is empty */}
            {batches.length === 0 && (
              <div className="grid grid-cols-2 gap-3 mt-3">
                <div>
                  <label className="block text-xs font-medium text-dark-300 mb-1">Division</label>
                  <input
                    type="text"
                    value={editForm.division || ''}
                    onChange={e => setEditForm(f => ({ ...f, division: e.target.value }))}
                    className="input-field"
                    placeholder="e.g. A"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-dark-300 mb-1">Batch</label>
                  <input
                    type="text"
                    value={editForm.batch || ''}
                    onChange={e => setEditForm(f => ({ ...f, batch: e.target.value }))}
                    className="input-field"
                    placeholder="e.g. A"
                  />
                </div>
              </div>
            )}
            {/* Show selected division/batch as confirmation */}
            {(editForm.division || editForm.batch) && (
              <p className="text-xs text-dark-400 mt-1.5">
                Selected: Div <strong className="text-dark-200">{editForm.division}</strong>
                {' / '}Batch <strong className="text-dark-200">{editForm.batch}</strong>
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-dark-300 mb-1.5">Experiment Number</label>
              <input
                type="text"
                value={editForm.experiment_number || ''}
                onChange={e => setEditForm(f => ({ ...f, experiment_number: e.target.value }))}
                className="input-field font-mono"
                placeholder="e.g. P1"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-dark-300 mb-1.5">Total Points</label>
              <input
                type="number"
                min="0"
                value={editForm.total_points || 20}
                onChange={e => setEditForm(f => ({ ...f, total_points: parseInt(e.target.value) || 0 }))}
                className="input-field"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-dark-300 mb-1.5">Deadline *</label>
              <input
                type="datetime-local"
                value={editForm.deadline ? String(editForm.deadline).slice(0, 16) : ''}
                onChange={e => setEditForm(f => ({ ...f, deadline: e.target.value }))}
                className="input-field"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-dark-300 mb-1.5">Status</label>
              <select
                value={editForm.status || 'active'}
                onChange={e => setEditForm(f => ({ ...f, status: e.target.value as BatchPractical['status'] }))}
                className="input-field"
              >
                <option value="active">Active</option>
                <option value="closed">Closed</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-dark-300 mb-1.5">Resource Link</label>
            <input
              type="url"
              value={editForm.resource_link || ''}
              onChange={e => setEditForm(f => ({ ...f, resource_link: e.target.value }))}
              className="input-field"
              placeholder="https://..."
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-dark-300 mb-1.5">Notes / Instructions</label>
            <textarea
              rows={3}
              value={editForm.notes || ''}
              onChange={e => setEditForm(f => ({ ...f, notes: e.target.value }))}
              className="input-field resize-none"
              placeholder="Any special instructions for students..."
            />
          </div>
        </div>
      </Modal>

      {/* Delete Confirm */}
      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Delete Practical"
        message={`Delete "${deleteTarget?.title}"? This may affect related submissions. This action cannot be undone.`}
        confirmLabel="Delete Practical"
        variant="danger"
        loading={deleteLoading}
      />

      {/* Bulk Grade Confirm */}
      <ConfirmDialog
        isOpen={!!bulkTarget}
        onClose={() => setBulkTarget(null)}
        onConfirm={handleBulkGrade}
        title="Bulk Grade Submissions"
        message={`Set marks to ${bulkTarget?.marks} for ALL submitted submissions in "${bulkTarget?.practical.title}"?`}
        confirmLabel="Apply Bulk Grade"
        variant="warning"
        loading={bulkLoading}
      />
    </div>
  )
}
