'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import {
  Search, RefreshCw, Edit2, Trash2, FileText, Star,
  X, User, ChevronDown, Filter
} from 'lucide-react'
import { toast } from 'react-hot-toast'
import Modal from '@/components/ui/Modal'
import ConfirmDialog from '@/components/ui/ConfirmDialog'
import Pagination from '@/components/ui/Pagination'
import { StatusBadge } from '@/components/ui/Badge'
import type { Submission, SubmissionStatus } from '@/types'
import { getYearLabel } from '@/lib/yearLabel'
import { format } from 'date-fns'

// ─── Types ────────────────────────────────────────────────
interface StudentOption {
  id: string
  name: string
  email: string
  enrollment_number: string | null
  department: string | null
  year: number | null
  division: string | null
  batch: string | null
}

const STATUS_OPTIONS: { value: SubmissionStatus | 'all'; label: string }[] = [
  { value: 'all', label: 'All Status' },
  { value: 'submitted', label: 'Submitted' },
  { value: 'evaluated', label: 'Evaluated' },
  { value: 'draft', label: 'Draft' },
]

// ─── Student Autocomplete ──────────────────────────────────
function StudentSearch({
  selected,
  onSelect,
  onClear,
}: {
  selected: StudentOption | null
  onSelect: (s: StudentOption) => void
  onClear: () => void
}) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<StudentOption[]>([])
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const wrapperRef = useRef<HTMLDivElement>(null)

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  // Live search
  useEffect(() => {
    if (!query.trim() || selected) { setResults([]); return }
    const t = setTimeout(async () => {
      setLoading(true)
      try {
        const res = await fetch(
          `/api/admin/users?search=${encodeURIComponent(query)}&role=student&limit=10`
        )
        const json = await res.json()
        if (json.success) setResults(json.data)
      } catch { /* silent */ } finally {
        setLoading(false)
      }
    }, 250)
    return () => clearTimeout(t)
  }, [query, selected])

  if (selected) {
    return (
      <div
        className="flex items-center gap-3 pl-3 pr-2 py-2 rounded-xl"
        style={{ background: 'rgba(59,130,246,0.12)', border: '1px solid rgba(59,130,246,0.3)' }}
      >
        <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
          style={{ background: 'rgba(59,130,246,0.3)', color: '#60a5fa' }}>
          {selected.name.charAt(0).toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-white truncate">{selected.name}</p>
          <p className="text-xs text-dark-400 truncate">
            <span className="font-mono">{selected.enrollment_number || selected.email}</span>
            {getYearLabel(selected.year) && (
              <span className="ml-2 text-indigo-400 font-medium">{getYearLabel(selected.year)}</span>
            )}
            {selected.division && <span className="ml-1.5">· Div {selected.division}{selected.batch ? ` / Batch ${selected.batch}` : ''}</span>}
          </p>
        </div>
        <button
          onClick={onClear}
          className="flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center hover:bg-white/10 text-dark-400 hover:text-white transition-colors"
          title="Clear student filter"
        >
          <X size={13} />
        </button>
      </div>
    )
  }

  return (
    <div ref={wrapperRef} className="relative flex-1 min-w-[260px]">
      <div className="relative">
        <User size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-dark-400" />
        <input
          type="text"
          placeholder="Search student by name or enrollment..."
          value={query}
          onChange={e => { setQuery(e.target.value); setOpen(true) }}
          onFocus={() => setOpen(true)}
          className="input-field pl-9 pr-9"
          autoComplete="off"
        />
        {loading && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <div className="w-4 h-4 border-2 border-blue-400/30 border-t-blue-400 rounded-full animate-spin" />
          </div>
        )}
        {!loading && query && (
          <button
            onClick={() => { setQuery(''); setResults([]); setOpen(false) }}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-dark-400 hover:text-white"
          >
            <X size={14} />
          </button>
        )}
      </div>

      {/* Dropdown */}
      {open && results.length > 0 && (
        <div
          className="absolute top-full left-0 right-0 mt-1 rounded-xl overflow-hidden shadow-2xl z-[200]"
          style={{ background: '#131d35', border: '1px solid rgba(255,255,255,0.1)' }}
        >
          {results.map(student => (
            <button
              key={student.id}
              onClick={() => {
                onSelect(student)
                setQuery('')
                setResults([])
                setOpen(false)
              }}
              className="w-full flex items-center gap-3 px-4 py-2.5 text-left hover:bg-white/06 transition-colors"
              style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}
            >
              <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                style={{ background: 'rgba(59,130,246,0.2)', color: '#60a5fa' }}>
                {student.name.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">{student.name}</p>
                <p className="text-xs text-dark-400">
                  <span className="font-mono">{student.enrollment_number || student.email}</span>
                  {getYearLabel(student.year) && (
                    <span className="ml-2 font-semibold" style={{ color: '#a5b4fc' }}>{getYearLabel(student.year)}</span>
                  )}
                  {student.division && (
                    <span className="ml-1.5">· Div {student.division}{student.batch ? ` / Batch ${student.batch}` : ''}</span>
                  )}
                </p>
              </div>
              <ChevronDown size={13} className="text-dark-500 flex-shrink-0 rotate-[-90deg]" />
            </button>
          ))}
        </div>
      )}

      {open && query.length > 1 && !loading && results.length === 0 && (
        <div
          className="absolute top-full left-0 right-0 mt-1 rounded-xl px-4 py-3 text-sm text-dark-400 z-[200]"
          style={{ background: '#131d35', border: '1px solid rgba(255,255,255,0.1)' }}
        >
          No students found for &quot;{query}&quot;
        </div>
      )}
    </div>
  )
}

// ─── Main Page ─────────────────────────────────────────────
export default function SubmissionsPage() {
  const [submissions, setSubmissions] = useState<Submission[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedStudent, setSelectedStudent] = useState<StudentOption | null>(null)
  const [statusFilter, setStatusFilter] = useState<SubmissionStatus | 'all'>('all')
  const [batchId, setBatchId]       = useState('')      // Named batch UUID
  const [batches, setBatches]       = useState<{ id: string; name: string; code: string; year: number | null; division: string; batch: string; academic_year: string }[]>([])
  const [page, setPage] = useState(1)
  const [pagination, setPagination] = useState({ total: 0, totalPages: 1, limit: 50 })

  // Edit modal
  const [editSub, setEditSub] = useState<Submission | null>(null)
  const [editForm, setEditForm] = useState({ marks: '', feedback: '', viva_score: '0', status: '' })
  const [rubricScores, setRubricScores] = useState<Record<string, string>>({})
  const [editLoading, setEditLoading] = useState(false)

  // Delete confirm
  const [deleteTarget, setDeleteTarget] = useState<Submission | null>(null)
  const [deleteLoading, setDeleteLoading] = useState(false)

  // Derived
  const hasFilter = !!selectedStudent || !!batchId

  // Fetch batches — scoped to student when one is selected, else all
  useEffect(() => {
    const url = selectedStudent
      ? `/api/admin/batches?student_id=${selectedStudent.id}`
      : '/api/admin/batches'
    fetch(url)
      .then(r => r.json())
      .then(json => { if (json.success) setBatches(json.data) })
      .catch(() => {})
  }, [selectedStudent])

  const fetchSubmissions = useCallback(async () => {
    if (!selectedStudent && !batchId) {
      setSubmissions([])
      setPagination({ total: 0, totalPages: 1, limit: 50 })
      return
    }
    setLoading(true)
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: '50',
        status: statusFilter,
        ...(selectedStudent ? { student_id: selectedStudent.id } : {}),
        ...(batchId        ? { batch_id: batchId }              : {}),
      })
      const res = await fetch(`/api/admin/submissions?${params}`)
      const json = await res.json()
      if (json.success) {
        setSubmissions(json.data)
        setPagination(json.pagination)
      } else {
        toast.error(json.error || 'Failed to load submissions')
      }
    } catch {
      toast.error('Network error')
    } finally {
      setLoading(false)
    }
  }, [selectedStudent, batchId, page, statusFilter])

  useEffect(() => {
    fetchSubmissions()
  }, [fetchSubmissions])

  const handleSelectStudent = (student: StudentOption) => {
    setSelectedStudent(student)
    setBatchId('')   // reset batch when student changes
    setPage(1)
  }

  const handleClearStudent = () => {
    setSelectedStudent(null)
    setSubmissions([])
    setPagination({ total: 0, totalPages: 1, limit: 50 })
  }

  const openEdit = (sub: Submission) => {
    setEditSub(sub)
    setEditForm({
      marks: sub.marks != null ? String(sub.marks) : '',
      feedback: sub.feedback || '',
      viva_score: String(sub.viva_score || 0),
      status: sub.status,
    })
    // Pre-fill rubric scores from saved rubric_scores map
    const rubrics = sub.practical?.rubrics || sub.assignment?.rubrics || []
    if (rubrics.length > 0) {
      const initial: Record<string, string> = {}
      rubrics.forEach((r, idx) => {
        const ra = r as unknown as Record<string, unknown>
        const key = String(ra.id || ra.title || ra.name || idx)
        initial[key] = sub.rubric_scores?.[key] != null ? String(sub.rubric_scores[key]) : ''
      })
      setRubricScores(initial)
    } else {
      setRubricScores({})
    }
  }

  const handleSaveEdit = async () => {
    if (!editSub) return
    setEditLoading(true)
    try {
      const rubrics = editSub.practical?.rubrics || editSub.assignment?.rubrics || []
      // Compute total marks from rubric scores if rubrics exist
      let computedMarks: number | null = null
      let rubricScoresPayload: Record<string, number | null> | undefined
      if (rubrics.length > 0) {
        rubricScoresPayload = {}
        let sum = 0
        rubrics.forEach((r, idx) => {
          const ra = r as unknown as Record<string, unknown>
          const key = String(ra.id || ra.title || ra.name || idx)
          const val = rubricScores[key] !== '' ? parseInt(rubricScores[key] || '0') || 0 : 0
          rubricScoresPayload![key] = val
          sum += val
        })
        computedMarks = sum
      } else {
        computedMarks = editForm.marks !== '' ? parseInt(editForm.marks) : null
      }

      const res = await fetch('/api/admin/submissions', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editSub.id,
          marks: computedMarks,
          feedback: editForm.feedback || null,
          viva_score: parseInt(editForm.viva_score) || 0,
          status: editForm.status,
          ...(rubricScoresPayload ? { rubric_scores: rubricScoresPayload } : {}),
        }),
      })
      const json = await res.json()
      if (json.success) {
        toast.success('Submission updated!')
        setEditSub(null)
        fetchSubmissions()
      } else {
        toast.error(json.error || 'Update failed')
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
      const res = await fetch('/api/admin/submissions', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: deleteTarget.id }),
      })
      const json = await res.json()
      if (json.success) {
        toast.success('Submission deleted')
        setDeleteTarget(null)
        fetchSubmissions()
      } else {
        toast.error(json.error || 'Delete failed')
      }
    } catch {
      toast.error('Network error')
    } finally {
      setDeleteLoading(false)
    }
  }

  const getPlagiarismColor = (score: number) => {
    if (score > 70) return '#ef4444'
    if (score > 40) return '#f59e0b'
    return '#10b981'
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-white">Submissions</h1>
          <p className="text-sm text-dark-400 mt-0.5">
          {selectedStudent
            ? `${pagination.total} submission${pagination.total !== 1 ? 's' : ''} for ${selectedStudent.name}`
            : batchId
              ? `${pagination.total} submission${pagination.total !== 1 ? 's' : ''} · ${batches.find(b => b.id === batchId)?.name ?? 'Selected Batch'}`
              : 'Search a student or select a batch to view submissions'}
        </p>
        </div>
        {hasFilter && (
          <button onClick={fetchSubmissions} className="btn btn-secondary">
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            Refresh
          </button>
        )}
      </div>

      {/* Filter bar */}
      <div className="glass-card p-3 md:p-4 flex flex-col md:flex-row gap-3 items-stretch md:items-center relative z-10">
        <StudentSearch
          selected={selectedStudent}
          onSelect={handleSelectStudent}
          onClear={handleClearStudent}
        />

        {/* Batch filter — shows named batches from batches table */}
        <div className="flex items-center gap-2 w-full md:w-auto">
          <Filter size={14} className="text-dark-400 flex-shrink-0 hidden md:block" />
          <select
            value={batchId}
            onChange={e => {
              setBatchId(e.target.value)
              setPage(1)
            }}
            className="input-field w-full md:w-52"
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
        <div className="flex items-center gap-2 w-full md:w-auto">
          <select
            value={statusFilter}
            onChange={e => { setStatusFilter(e.target.value as SubmissionStatus | 'all'); setPage(1) }}
            className="input-field w-full md:w-40"
          >
            {STATUS_OPTIONS.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Empty state — no filter active */}
      {!hasFilter && (
        <div className="glass-card py-20 text-center">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4"
            style={{ background: 'rgba(59,130,246,0.1)' }}>
            <Search size={28} className="text-blue-400" />
          </div>
          <h3 className="text-base font-semibold text-white mb-1">Find submissions</h3>
          <p className="text-sm text-dark-400 max-w-xs mx-auto">
            Search a student by name or enrollment number, or select a batch from the dropdown to view submissions.
          </p>
        </div>
      )}

      {/* Submissions table */}
      {hasFilter && (
        <div className="glass-card overflow-hidden">
          {loading ? (
            <div className="py-16 text-center">
              <div className="inline-block w-8 h-8 border-2 border-blue-400/30 border-t-blue-400 rounded-full animate-spin mb-3" />
              <p className="text-sm text-dark-400">Loading submissions...</p>
            </div>
          ) : submissions.length === 0 ? (
            <div className="py-16 text-center">
              <FileText size={32} className="mx-auto text-dark-600 mb-3" />
              <p className="text-dark-300 font-medium">No submissions found</p>
              <p className="text-dark-500 text-sm mt-1">
                {statusFilter !== 'all'
                  ? `No "${statusFilter}" submissions found`
                  : selectedStudent
                    ? `${selectedStudent.name} has no submissions yet`
                    : 'No submissions found for this batch'}
              </p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="data-table min-w-full">
                  <thead>
                    <tr>
                      <th>Practical / Assignment</th>
                      <th className="text-center">Marks</th>
                      <th>Status</th>
                      <th className="text-center">Plagiarism</th>
                      <th className="text-center">Viva</th>
                      <th>Feedback</th>
                      <th>Submitted</th>
                      <th>Evaluated</th>
                      <th className="text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {submissions.map(sub => (
                      <tr key={sub.id}>
                        {/* Practical / Assignment */}
                        <td>
                          {sub.practical?.title && (
                            <div>
                              <div className="text-xs text-blue-400 font-mono mb-0.5">
                                {sub.practical.experiment_number || 'Practical'}
                              </div>
                              <div className="text-sm font-medium text-white line-clamp-1">
                                {sub.practical.title}
                              </div>
                              <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                                {sub.practical.total_points && (
                                  <span className="text-xs text-dark-500">{sub.practical.total_points} pts</span>
                                )}
                                {getYearLabel(sub.student?.year) && (
                                  <span className="text-xs font-semibold px-1.5 py-0.5 rounded"
                                    style={{ background: 'rgba(99,102,241,0.2)', color: '#a5b4fc' }}>
                                    {getYearLabel(sub.student?.year)}
                                  </span>
                                )}
                                {sub.student?.division && (
                                  <span className="text-xs font-medium px-1.5 py-0.5 rounded"
                                    style={{ background: 'rgba(99,102,241,0.12)', color: '#c4b5fd' }}>
                                    Div {sub.student.division}{sub.student.batch ? ` / Batch ${sub.student.batch}` : ''}
                                  </span>
                                )}
                              </div>
                            </div>
                          )}
                          {sub.assignment?.title && (
                            <div>
                              <div className="text-xs text-purple-400 font-mono mb-0.5">Assignment</div>
                              <div className="text-sm font-medium text-white line-clamp-1">
                                {sub.assignment.title}
                              </div>
                              <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                                {getYearLabel(sub.student?.year) && (
                                  <span className="text-xs font-semibold px-1.5 py-0.5 rounded"
                                    style={{ background: 'rgba(99,102,241,0.2)', color: '#a5b4fc' }}>
                                    {getYearLabel(sub.student?.year)}
                                  </span>
                                )}
                                {sub.student?.division && (
                                  <span className="text-xs font-medium px-1.5 py-0.5 rounded"
                                    style={{ background: 'rgba(99,102,241,0.12)', color: '#c4b5fd' }}>
                                    Div {sub.student.division}{sub.student.batch ? ` / Batch ${sub.student.batch}` : ''}
                                  </span>
                                )}
                              </div>
                            </div>
                          )}
                          {!sub.practical?.title && !sub.assignment?.title && (
                            <span className="text-dark-500 text-sm">—</span>
                          )}
                        </td>

                        {/* Marks */}
                        <td className="text-center">
                          {sub.marks != null ? (
                            <div className="flex flex-col items-center">
                              <span className="text-lg font-bold text-green-400">{sub.marks}</span>
                              {sub.practical?.total_points && (
                                <span className="text-xs text-dark-500">/ {sub.practical.total_points}</span>
                              )}
                            </div>
                          ) : (
                            <span className="text-dark-500 text-sm">—</span>
                          )}
                        </td>

                        {/* Status */}
                        <td><StatusBadge status={sub.status} /></td>

                        {/* Plagiarism */}
                        <td className="text-center">
                          {sub.plagiarism_score > 0 ? (
                            <div className="flex flex-col items-center">
                              <span className="text-sm font-semibold"
                                style={{ color: getPlagiarismColor(sub.plagiarism_score) }}>
                                {sub.plagiarism_score}%
                              </span>
                            </div>
                          ) : <span className="text-dark-500 text-sm">—</span>}
                        </td>

                        {/* Viva */}
                        <td className="text-center">
                          {sub.viva_score > 0 ? (
                            <span className="flex items-center gap-1 justify-center text-sm font-medium text-yellow-400">
                              <Star size={12} />
                              {sub.viva_score}
                            </span>
                          ) : <span className="text-dark-500 text-sm">—</span>}
                        </td>

                        {/* Feedback preview */}
                        <td>
                          {sub.feedback ? (
                            <p className="text-xs text-dark-300 line-clamp-2 max-w-[180px]">{sub.feedback}</p>
                          ) : (
                            <span className="text-dark-600 text-xs italic">No feedback yet</span>
                          )}
                        </td>

                        {/* Submitted at */}
                        <td className="text-xs text-dark-400 whitespace-nowrap">
                          {sub.submitted_at
                            ? format(new Date(sub.submitted_at), 'dd MMM yy HH:mm')
                            : '—'}
                        </td>

                        {/* Evaluated at */}
                        <td className="text-xs text-dark-400 whitespace-nowrap">
                          {sub.evaluated_at
                            ? format(new Date(sub.evaluated_at), 'dd MMM yy HH:mm')
                            : <span className="text-dark-600 italic">Pending</span>}
                        </td>

                        {/* Actions */}
                        <td>
                          <div className="flex items-center gap-1 justify-end">
                            <button
                              onClick={() => openEdit(sub)}
                              className="p-1.5 rounded-lg text-dark-400 hover:text-blue-400 hover:bg-blue-500/10 transition-colors"
                              title="Edit submission"
                            >
                              <Edit2 size={14} />
                            </button>
                            <button
                              onClick={() => setDeleteTarget(sub)}
                              className="p-1.5 rounded-lg text-dark-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                              title="Delete submission"
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
      )}

      {/* Edit Modal */}
      <Modal
        isOpen={!!editSub}
        onClose={() => setEditSub(null)}
        title="Edit Submission"
        size="md"
        footer={
          <>
            <button onClick={() => setEditSub(null)} className="btn btn-secondary">Cancel</button>
            <button onClick={handleSaveEdit} disabled={editLoading} className="btn btn-primary">
              {editLoading ? (
                <span className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Saving...
                </span>
              ) : 'Save Changes'}
            </button>
          </>
        }
      >
        {editSub && (
          <div className="space-y-4">
            {/* Context info */}
            <div className="px-3 py-2.5 rounded-lg"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
              <p className="text-xs text-dark-400 mb-0.5">Practical / Assignment</p>
              <p className="text-sm font-semibold text-white">
                {editSub.practical?.title || editSub.assignment?.title || 'Unknown'}
              </p>
              {editSub.practical?.experiment_number && (
                <p className="text-xs font-mono text-blue-400 mt-0.5">{editSub.practical.experiment_number}</p>
              )}
            </div>

            {/* Rubric-based marks OR plain marks input */}
            {((editSub.practical?.rubrics?.length ?? 0) > 0 || (editSub.assignment?.rubrics?.length ?? 0) > 0) ? (() => {
              const activeRubrics = editSub.practical?.rubrics || editSub.assignment?.rubrics || [];
              const totalPoints = editSub.practical?.total_points || editSub.assignment?.total_points;
              
              return (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-medium text-dark-300">Marks Breakdown</label>
                  <span className="text-xs px-2 py-0.5 rounded-full font-semibold"
                    style={{ background: 'rgba(16,185,129,0.15)', color: '#34d399' }}>
                    Total: {activeRubrics.reduce((sum, r, idx) => {
                      const ra = r as unknown as Record<string, unknown>
                      const key = String(ra.id || ra.title || ra.name || idx)
                      return sum + (parseInt(rubricScores[key] || '0') || 0)
                    }, 0)} / {totalPoints ?? activeRubrics.reduce((s, r) => {
                      const ra = r as unknown as Record<string, unknown>
                      return s + Number(ra.max_marks ?? ra.maxMarks ?? ra.marks ?? 0)
                    }, 0)}
                  </span>
                </div>
                <div className="space-y-2">
                  {activeRubrics.map((rubric, idx) => {
                    // Handle various possible field names from Supabase JSONB
                    const rubricAny = rubric as unknown as Record<string, unknown>
                    const label = String(
                      rubricAny.title || rubricAny.name || rubricAny.criteria ||
                      rubricAny.label || rubricAny.criterion || `Criterion ${idx + 1}`
                    )
                    const desc = String(rubricAny.description || rubricAny.desc || '')
                    const maxMarks = Number(rubricAny.max_marks ?? rubricAny.maxMarks ?? rubricAny.marks ?? 0)
                    const key = String(rubricAny.id || rubricAny.title || rubricAny.name || idx)
                    return (
                      <div key={key}
                        className="flex items-center gap-3 px-3 py-2.5 rounded-lg"
                        style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.09)' }}
                      >
                        <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                          style={{ background: 'rgba(99,102,241,0.25)', color: '#a5b4fc' }}>
                          {idx + 1}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-white">{label}</p>
                          {desc && (
                            <p className="text-xs text-dark-400 mt-0.5">{desc}</p>
                          )}
                        </div>
                        <div className="flex items-center gap-1.5 flex-shrink-0">
                          <input
                            type="number"
                            min="0"
                            max={maxMarks}
                            value={rubricScores[key] ?? ''}
                            onChange={e => setRubricScores(prev => ({ ...prev, [key]: e.target.value }))}
                            className="input-field text-center font-semibold"
                            style={{ width: '72px' }}
                            placeholder="0"
                          />
                          <span className="text-xs text-dark-400 whitespace-nowrap">/ {maxMarks}</span>
                        </div>
                      </div>
                    )
                  })}
                </div>
                {/* Viva below rubrics */}
                <div>
                  <label className="block text-xs font-medium text-dark-300 mb-1.5">Viva Score (0–10)</label>
                  <input
                    type="number"
                    min="0"
                    max="10"
                    value={editForm.viva_score}
                    onChange={e => setEditForm(f => ({ ...f, viva_score: e.target.value }))}
                    className="input-field"
                  />
                </div>
              </div>
            )})() : (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-dark-300 mb-1.5">
                    Marks
                    {(editSub.practical?.total_points || editSub.assignment?.total_points) && (
                      <span className="text-dark-500 ml-1">/ {editSub.practical?.total_points || editSub.assignment?.total_points}</span>
                    )}
                  </label>
                  <input
                    type="number"
                    min="0"
                    max={editSub.practical?.total_points || editSub.assignment?.total_points || 100}
                    value={editForm.marks}
                    onChange={e => setEditForm(f => ({ ...f, marks: e.target.value }))}
                    className="input-field text-lg font-semibold"
                    placeholder="0"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-dark-300 mb-1.5">Viva Score (0–10)</label>
                  <input
                    type="number"
                    min="0"
                    max="10"
                    value={editForm.viva_score}
                    onChange={e => setEditForm(f => ({ ...f, viva_score: e.target.value }))}
                    className="input-field"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-medium text-dark-300 mb-1.5">Status</label>
              <select
                value={editForm.status}
                onChange={e => setEditForm(f => ({ ...f, status: e.target.value }))}
                className="input-field"
              >
                <option value="draft">Draft</option>
                <option value="submitted">Submitted</option>
                <option value="evaluated">Evaluated</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-dark-300 mb-1.5">
                Feedback
                <span className="text-dark-600 font-normal ml-1">— visible to student</span>
              </label>
              <textarea
                rows={4}
                value={editForm.feedback}
                onChange={e => setEditForm(f => ({ ...f, feedback: e.target.value }))}
                className="input-field resize-none"
                placeholder="Write feedback that will be visible to the student..."
              />
            </div>

            {/* Read-only scores */}
            <div className="grid grid-cols-3 gap-2 pt-1">
              {[
                { label: 'Plagiarism', value: `${editSub.plagiarism_score || 0}%`, color: getPlagiarismColor(editSub.plagiarism_score) },
                { label: 'AI Score', value: `${editSub.ai_score || 0}%`, color: 'rgba(255,255,255,0.4)' },
                { label: 'Violations', value: String(editSub.violation_logs?.length || 0), color: '#f87171' },
              ].map(item => (
                <div key={item.label} className="text-center px-3 py-2 rounded-lg"
                  style={{ background: 'rgba(255,255,255,0.04)' }}>
                  <div className="text-xs text-dark-400 mb-0.5">{item.label}</div>
                  <div className="text-sm font-semibold" style={{ color: item.color }}>{item.value}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </Modal>

      {/* Delete Confirm */}
      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Delete Submission"
        message={`Delete this submission from ${deleteTarget?.student?.name || selectedStudent?.name}? This action cannot be undone.`}
        confirmLabel="Delete Submission"
        variant="danger"
        loading={deleteLoading}
      />
    </div>
  )
}
