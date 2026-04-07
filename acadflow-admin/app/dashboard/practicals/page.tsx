'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  Search, RefreshCw, Edit2, Trash2, Plus, FlaskConical,
  Calendar, Users2, Zap, ChevronRight, User, BookOpen,
  ArrowLeft, GraduationCap, Layers,
} from 'lucide-react'
import { toast } from 'react-hot-toast'
import Modal from '@/components/ui/Modal'
import ConfirmDialog from '@/components/ui/ConfirmDialog'
import Pagination from '@/components/ui/Pagination'
import { PracticalStatusBadge } from '@/components/ui/Badge'
import type { BatchPractical } from '@/types'
import { format } from 'date-fns'
import { getYearLabel } from '@/lib/yearLabel'

// ─── Types ─────────────────────────────────────────────────────────────────
interface NamedBatch {
  id: string
  name: string
  code: string
  year: number | null
  division: string
  batch: string
  academic_year: string
  created_by?: string | null
}

interface TeacherOption {
  id: string
  name: string
  email: string
}

type BatchForm = {
  name: string
  code: string
  division: string
  batch: string
  year: string        // keep as string for input; cast on submit
  academic_year: string
  created_by: string
}

type Step = 'teacher' | 'batch' | 'practicals'

// ─── Helpers ────────────────────────────────────────────────────────────────
const emptyBatchForm = (teacherId = ''): BatchForm => ({
  name: '',
  code: '',
  division: '',
  batch: '',
  year: '',
  academic_year: '',
  created_by: teacherId,
})

export default function PracticalsPage() {
  // ── drill-down ─────────────────────────────────────────────────────────────
  const [step, setStep] = useState<Step>('teacher')
  const [selectedTeacher, setSelectedTeacher] = useState<TeacherOption | null>(null)
  const [selectedBatch,   setSelectedBatch]   = useState<NamedBatch   | null>(null)

  // ── teachers ───────────────────────────────────────────────────────────────
  const [teachers,        setTeachers]        = useState<TeacherOption[]>([])
  const [teachersLoading, setTeachersLoading] = useState(true)
  const [teacherSearch,   setTeacherSearch]   = useState('')

  // ── batches ────────────────────────────────────────────────────────────────
  const [batches,        setBatches]        = useState<NamedBatch[]>([])
  const [batchesLoading, setBatchesLoading] = useState(false)
  const [allBatches,     setAllBatches]     = useState<NamedBatch[]>([])  // for practical modal

  // batch CRUD modal
  const [batchModal, setBatchModal] = useState<'create' | 'edit' | null>(null)
  const [batchForm,  setBatchForm]  = useState<BatchForm>(emptyBatchForm())
  const [batchSaving, setBatchSaving] = useState(false)
  const [editingBatch, setEditingBatch] = useState<NamedBatch | null>(null)

  // batch delete
  const [deleteBatchTarget,  setDeleteBatchTarget]  = useState<NamedBatch | null>(null)
  const [deleteBatchLoading, setDeleteBatchLoading] = useState(false)

  // ── practicals ─────────────────────────────────────────────────────────────
  const [practicals,       setPracticals]       = useState<BatchPractical[]>([])
  const [practicalLoading, setPracticalLoading] = useState(false)
  const [search,       setSearch]       = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [page,         setPage]         = useState(1)
  const [pagination,   setPagination]   = useState({ total: 0, totalPages: 1, limit: 50 })

  // practical CRUD modal
  const [editPractical, setEditPractical] = useState<BatchPractical | null>(null)
  const [editMode,      setEditMode]      = useState<'create' | 'edit'>('edit')
  const [editForm,      setEditForm]      = useState<Partial<BatchPractical>>({})
  const [editLoading,   setEditLoading]   = useState(false)

  // practical delete
  const [deleteTarget,  setDeleteTarget]  = useState<BatchPractical | null>(null)
  const [deleteLoading, setDeleteLoading] = useState(false)

  // bulk grade
  const [bulkTarget,  setBulkTarget]  = useState<{ practical: BatchPractical; marks: number } | null>(null)
  const [bulkLoading, setBulkLoading] = useState(false)

  // =========================================================================
  // DATA FETCHING
  // =========================================================================

  // Step 1 — teachers
  useEffect(() => {
    setTeachersLoading(true)
    fetch('/api/admin/users?role=teacher&limit=200')
      .then(r => r.json())
      .then(json => { if (json.success) setTeachers(json.data) })
      .catch(() => {})
      .finally(() => setTeachersLoading(false))
  }, [])

  // Step 2 — teacher's batches
  const loadBatches = useCallback((teacherId: string) => {
    setBatchesLoading(true)
    fetch('/api/admin/batches')
      .then(r => r.json())
      .then(json => {
        if (json.success) {
          const all = json.data as NamedBatch[]
          setAllBatches(all)
          setBatches(all.filter(b => b.created_by === teacherId))
        }
      })
      .catch(() => {})
      .finally(() => setBatchesLoading(false))
  }, [])

  useEffect(() => {
    if (selectedTeacher) loadBatches(selectedTeacher.id)
  }, [selectedTeacher, loadBatches])

  // also load all batches once for the practicals create-modal picker
  useEffect(() => {
    fetch('/api/admin/batches')
      .then(r => r.json())
      .then(json => { if (json.success) setAllBatches(json.data) })
      .catch(() => {})
  }, [])

  // Step 3 — practicals for selected batch
  const fetchPracticals = useCallback(async () => {
    if (!selectedBatch) return
    setPracticalLoading(true)
    try {
      const params = new URLSearchParams({
        page: String(page), limit: '50',
        search, status: statusFilter,
        batch_id: selectedBatch.id,
      })
      const res  = await fetch(`/api/admin/practicals?${params}`)
      const json = await res.json()
      if (json.success) {
        setPracticals(json.data)
        setPagination(json.pagination)
      } else {
        toast.error(json.error || 'Failed to load practicals')
      }
    } catch { toast.error('Network error') }
    finally  { setPracticalLoading(false) }
  }, [selectedBatch, page, search, statusFilter])

  useEffect(() => {
    if (step !== 'practicals') return
    const t = setTimeout(fetchPracticals, 300)
    return () => clearTimeout(t)
  }, [fetchPracticals, step])

  // =========================================================================
  // NAVIGATION
  // =========================================================================
  const selectTeacher = (t: TeacherOption) => {
    setSelectedTeacher(t)
    setSelectedBatch(null)
    setBatches([])
    setPracticals([])
    setStep('batch')
  }

  const selectBatch = (b: NamedBatch) => {
    setSelectedBatch(b)
    setPracticals([])
    setPage(1); setSearch(''); setStatusFilter('all')
    setStep('practicals')
  }

  const goBack = () => {
    if (step === 'practicals') { setSelectedBatch(null); setStep('batch') }
    else if (step === 'batch') { setSelectedTeacher(null); setBatches([]); setStep('teacher') }
  }

  // =========================================================================
  // BATCH CRUD
  // =========================================================================
  const openCreateBatch = () => {
    setBatchForm(emptyBatchForm(selectedTeacher?.id ?? ''))
    setEditingBatch(null)
    setBatchModal('create')
  }

  const openEditBatch = (b: NamedBatch, e: React.MouseEvent) => {
    e.stopPropagation()
    setBatchForm({
      name: b.name,
      code: b.code,
      division: b.division,
      batch: b.batch,
      year: b.year != null ? String(b.year) : '',
      academic_year: b.academic_year ?? '',
      created_by: b.created_by ?? selectedTeacher?.id ?? '',
    })
    setEditingBatch(b)
    setBatchModal('edit')
  }

  const handleSaveBatch = async () => {
    if (!batchForm.name.trim() || !batchForm.division.trim() || !batchForm.batch.trim()) {
      toast.error('Name, Division and Batch letter are required')
      return
    }
    setBatchSaving(true)
    try {
      const payload: Record<string, unknown> = {
        name: batchForm.name.trim(),
        code: batchForm.code.trim() || undefined,
        division: batchForm.division.trim().toUpperCase(),
        batch: batchForm.batch.trim().toUpperCase(),
        year: batchForm.year ? parseInt(batchForm.year) : null,
        academic_year: batchForm.academic_year.trim() || null,
        created_by: batchForm.created_by || selectedTeacher?.id || null,
      }
      const isEdit = batchModal === 'edit' && editingBatch
      if (isEdit) payload.id = editingBatch!.id

      const res  = await fetch('/api/admin/batches', {
        method: isEdit ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const json = await res.json()
      if (json.success) {
        toast.success(isEdit ? 'Batch updated!' : 'Batch created!')
        setBatchModal(null)
        if (selectedTeacher) loadBatches(selectedTeacher.id)
      } else {
        toast.error(json.error || 'Save failed')
      }
    } catch { toast.error('Network error') }
    finally  { setBatchSaving(false) }
  }

  const handleDeleteBatch = async () => {
    if (!deleteBatchTarget) return
    setDeleteBatchLoading(true)
    try {
      const res  = await fetch('/api/admin/batches', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: deleteBatchTarget.id }),
      })
      const json = await res.json()
      if (json.success) {
        toast.success(`Batch "${deleteBatchTarget.name}" deleted`)
        setDeleteBatchTarget(null)
        if (selectedTeacher) loadBatches(selectedTeacher.id)
      } else {
        toast.error(json.error || 'Delete failed')
      }
    } catch { toast.error('Network error') }
    finally  { setDeleteBatchLoading(false) }
  }

  // =========================================================================
  // PRACTICAL CRUD
  // =========================================================================
  const openCreate = () => {
    setEditMode('create')
    setEditPractical({} as BatchPractical)
    setEditForm({
      title: '', experiment_number: '',
      division: selectedBatch?.division || '',
      batch: selectedBatch?.batch || '',
      deadline: new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 16),
      total_points: 20, status: 'active', notes: '', resource_link: '',
    })
  }

  const openEdit = (p: BatchPractical) => {
    setEditMode('edit')
    setEditPractical(p)
    setEditForm({
      title: p.title,
      experiment_number: p.experiment_number || '',
      division: p.division, batch: p.batch,
      deadline: p.deadline ? new Date(p.deadline).toISOString().slice(0, 16) : '',
      total_points: p.total_points,
      status: p.status,
      notes: p.notes || '',
      resource_link: p.resource_link || '',
    })
  }

  const handleSavePractical = async () => {
    setEditLoading(true)
    try {
      const method = editMode === 'create' ? 'POST' : 'PATCH'
      const body   = editMode === 'edit'
        ? { id: editPractical?.id, ...editForm }
        : editForm
      const res  = await fetch('/api/admin/practicals', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const json = await res.json()
      if (json.success) {
        toast.success(editMode === 'create' ? 'Practical created!' : 'Practical updated!')
        setEditPractical(null)
        fetchPracticals()
      } else { toast.error(json.error || 'Save failed') }
    } catch { toast.error('Network error') }
    finally  { setEditLoading(false) }
  }

  const handleDeletePractical = async () => {
    if (!deleteTarget) return
    setDeleteLoading(true)
    try {
      const res  = await fetch('/api/admin/practicals', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: deleteTarget.id }),
      })
      const json = await res.json()
      if (json.success) {
        toast.success(`"${deleteTarget.title}" deleted`)
        setDeleteTarget(null)
        fetchPracticals()
      } else { toast.error(json.error || 'Delete failed') }
    } catch { toast.error('Network error') }
    finally  { setDeleteLoading(false) }
  }

  const handleBulkGrade = async () => {
    if (!bulkTarget) return
    setBulkLoading(true)
    try {
      const res  = await fetch('/api/admin/submissions/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ practicalId: bulkTarget.practical.id, marks: bulkTarget.marks }),
      })
      const json = await res.json()
      if (json.success) {
        toast.success(`Bulk graded ${json.updated ?? 'all'} submissions`)
        setBulkTarget(null)
      } else { toast.error(json.error || 'Bulk grade failed') }
    } catch { toast.error('Network error') }
    finally  { setBulkLoading(false) }
  }

  const isDeadlinePassed = (d: string) => new Date(d) < new Date()

  const filteredTeachers = teacherSearch
    ? teachers.filter(t =>
        t.name.toLowerCase().includes(teacherSearch.toLowerCase()) ||
        t.email.toLowerCase().includes(teacherSearch.toLowerCase())
      )
    : teachers

  // =========================================================================
  // BREADCRUMB
  // =========================================================================
  const BreadcrumbBar = () => (
    <div className="flex items-center gap-2 text-sm flex-wrap">
      <button
        onClick={() => { setSelectedTeacher(null); setSelectedBatch(null); setStep('teacher') }}
        className={`font-medium transition-colors ${step === 'teacher' ? 'text-white' : 'text-dark-400 hover:text-white'}`}
      >
        Teachers
      </button>
      {selectedTeacher && (
        <>
          <ChevronRight size={14} className="text-dark-600" />
          <button
            onClick={() => { setSelectedBatch(null); setStep('batch') }}
            className={`font-medium transition-colors ${step === 'batch' ? 'text-white' : 'text-dark-400 hover:text-white'}`}
          >
            {selectedTeacher.name}
          </button>
        </>
      )}
      {selectedBatch && (
        <>
          <ChevronRight size={14} className="text-dark-600" />
          <span className="font-medium text-white">
            Div {selectedBatch.division} · Batch {selectedBatch.batch}
          </span>
        </>
      )}
    </div>
  )

  // =========================================================================
  // RENDER
  // =========================================================================
  return (
    <div className="space-y-6 animate-fade-in">

      {/* ── Header ────────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Practicals</h1>
          <div className="mt-1"><BreadcrumbBar /></div>
        </div>
        <div className="flex gap-2">
          {step !== 'teacher' && (
            <button onClick={goBack} className="btn btn-secondary">
              <ArrowLeft size={14} /> Back
            </button>
          )}
          {step === 'batch' && (
            <button onClick={openCreateBatch} className="btn btn-primary">
              <Plus size={16} /> New Batch
            </button>
          )}
          {step === 'practicals' && (
            <>
              <button onClick={fetchPracticals} className="btn btn-secondary">
                <RefreshCw size={14} className={practicalLoading ? 'animate-spin' : ''} />
              </button>
              <button onClick={openCreate} className="btn btn-primary">
                <Plus size={16} /> New Practical
              </button>
            </>
          )}
        </div>
      </div>

      {/* ── STEP 1 : Teacher selection ────────────────────────────────────── */}
      {step === 'teacher' && (
        <div className="space-y-4">
          <div className="glass-card p-4 flex items-center gap-3"
            style={{ background: 'rgba(139,92,246,0.06)', borderColor: 'rgba(139,92,246,0.2)' }}>
            <GraduationCap size={18} className="text-purple-400 flex-shrink-0" />
            <p className="text-sm text-dark-300">
              Select a <span className="text-white font-medium">teacher</span> to view and manage their batches &amp; practicals.
            </p>
          </div>

          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-dark-400" />
            <input
              type="text"
              placeholder="Search teachers..."
              value={teacherSearch}
              onChange={e => setTeacherSearch(e.target.value)}
              className="input-field pl-9 w-full"
            />
          </div>

          {teachersLoading ? (
            <div className="glass-card py-16 text-center">
              <div className="inline-block w-8 h-8 border-2 border-purple-400/30 border-t-purple-400 rounded-full animate-spin mb-3" />
              <p className="text-sm text-dark-400">Loading teachers...</p>
            </div>
          ) : filteredTeachers.length === 0 ? (
            <div className="glass-card py-16 text-center">
              <User size={32} className="mx-auto text-dark-600 mb-3" />
              <p className="text-dark-400">No teachers found</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {filteredTeachers.map(t => (
                <button key={t.id} onClick={() => selectTeacher(t)}
                  className="glass-card p-4 text-left hover:border-purple-500/40 transition-all group"
                  style={{ borderColor: 'rgba(255,255,255,0.06)' }}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 font-bold text-sm text-purple-300"
                      style={{ background: 'rgba(139,92,246,0.18)' }}>
                      {t.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="font-semibold text-white text-sm group-hover:text-purple-300 transition-colors truncate">{t.name}</div>
                      <div className="text-xs text-dark-400 truncate">{t.email}</div>
                    </div>
                    <ChevronRight size={16} className="text-dark-600 group-hover:text-purple-400 transition-colors flex-shrink-0" />
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── STEP 2 : Batch selection + CRUD ──────────────────────────────── */}
      {step === 'batch' && (
        <div className="space-y-4">
          {/* Teacher banner */}
          <div className="glass-card p-4 flex items-center gap-3"
            style={{ background: 'rgba(139,92,246,0.06)', borderColor: 'rgba(139,92,246,0.2)' }}>
            <div className="w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm text-purple-300 flex-shrink-0"
              style={{ background: 'rgba(139,92,246,0.2)' }}>
              {selectedTeacher?.name.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white font-semibold text-sm">{selectedTeacher?.name}</p>
              <p className="text-xs text-dark-400">{selectedTeacher?.email}</p>
            </div>
            <span className="text-xs text-dark-500">
              {batches.length} batch{batches.length !== 1 ? 'es' : ''}
            </span>
          </div>

          {batchesLoading ? (
            <div className="glass-card py-16 text-center">
              <div className="inline-block w-8 h-8 border-2 border-blue-400/30 border-t-blue-400 rounded-full animate-spin mb-3" />
              <p className="text-sm text-dark-400">Loading batches...</p>
            </div>
          ) : batches.length === 0 ? (
            <div className="glass-card py-12 text-center">
              <Layers size={32} className="mx-auto text-dark-600 mb-3" />
              <p className="text-dark-400">No batches for this teacher yet</p>
              <button onClick={openCreateBatch} className="btn btn-primary mt-4">
                <Plus size={16} /> Create First Batch
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {batches.map(b => (
                <div key={b.id}
                  className="glass-card p-4 group relative hover:border-blue-500/30 transition-all"
                  style={{ borderColor: 'rgba(255,255,255,0.06)' }}
                >
                  {/* Edit / Delete buttons — top-right */}
                  <div className="absolute top-3 right-3 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={e => openEditBatch(b, e)}
                      className="p-1.5 rounded-lg text-dark-400 hover:text-blue-400 hover:bg-blue-500/10 transition-colors"
                      title="Edit batch"
                    >
                      <Edit2 size={13} />
                    </button>
                    <button
                      onClick={e => { e.stopPropagation(); setDeleteBatchTarget(b) }}
                      className="p-1.5 rounded-lg text-dark-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                      title="Delete batch"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>

                  {/* Clickable area → drill into practicals */}
                  <button className="w-full text-left" onClick={() => selectBatch(b)}>
                    <div className="flex items-start gap-3 pr-14">
                      <div className="min-w-0 flex-1">
                        <div className="font-semibold text-white text-sm group-hover:text-blue-300 transition-colors">
                          {b.name}
                        </div>
                        <div className="flex items-center gap-1.5 mt-1.5">
                          <Users2 size={12} className="text-dark-400" />
                          <span className="text-xs text-dark-300">
                            Div <span className="text-white font-medium">{b.division}</span>
                            {' · '}Batch <span className="text-white font-medium">{b.batch}</span>
                          </span>
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          {b.year != null && (
                            <span className="text-xs font-medium text-indigo-400">
                              {getYearLabel(b.year)}
                            </span>
                          )}
                          {b.academic_year && (
                            <span className="text-xs text-dark-500">{b.academic_year}</span>
                          )}
                          {b.code && (
                            <span className="text-xs font-mono text-dark-600">{b.code}</span>
                          )}
                        </div>
                      </div>
                      <ChevronRight size={16} className="text-dark-600 group-hover:text-blue-400 transition-colors flex-shrink-0 mt-0.5" />
                    </div>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── STEP 3 : Practicals list ──────────────────────────────────────── */}
      {step === 'practicals' && (
        <div className="space-y-4">
          {/* Batch info banner */}
          <div className="glass-card p-4 flex items-center gap-3"
            style={{ background: 'rgba(59,130,246,0.06)', borderColor: 'rgba(59,130,246,0.2)' }}>
            <FlaskConical size={16} className="text-blue-400 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-white font-semibold text-sm">{selectedBatch?.name}</p>
              <p className="text-xs text-dark-400">
                {selectedTeacher?.name} ·{' '}
                {getYearLabel(selectedBatch?.year ?? null)} ·{' '}
                Div {selectedBatch?.division} · Batch {selectedBatch?.batch}
                {selectedBatch?.academic_year ? ` · ${selectedBatch.academic_year}` : ''}
              </p>
            </div>
            <span className="text-xs text-dark-500 font-mono">{selectedBatch?.code}</span>
          </div>

          {/* Filters */}
          <div className="glass-card p-3 flex flex-col md:flex-row gap-3 items-stretch md:items-center">
            <div className="relative flex-1">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-dark-400" />
              <input
                type="text"
                placeholder="Search experiment, title..."
                value={search}
                onChange={e => { setSearch(e.target.value); setPage(1) }}
                className="input-field pl-9"
              />
            </div>
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

          {/* Table */}
          <div className="glass-card overflow-hidden">
            {practicalLoading ? (
              <div className="py-16 text-center">
                <div className="inline-block w-8 h-8 border-2 border-blue-400/30 border-t-blue-400 rounded-full animate-spin mb-3" />
                <p className="text-sm text-dark-400">Loading practicals...</p>
              </div>
            ) : practicals.length === 0 ? (
              <div className="py-16 text-center">
                <BookOpen size={32} className="mx-auto text-dark-600 mb-3" />
                <p className="text-dark-400">No practicals found for this batch</p>
                <button onClick={openCreate} className="btn btn-primary mt-4">
                  <Plus size={16} /> Add First Practical
                </button>
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="data-table min-w-full">
                    <thead>
                      <tr>
                        <th>Exp #</th>
                        <th>Title</th>
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
                            {prac.notes && (
                              <div className="text-xs text-dark-400 mt-0.5 line-clamp-1">{prac.notes}</div>
                            )}
                          </td>
                          <td className="text-center">
                            <span className="text-sm font-semibold text-white">{prac.total_points}</span>
                            <span className="text-xs text-dark-400 ml-0.5">pts</span>
                          </td>
                          <td>
                            <div className="flex items-center gap-1.5">
                              <Calendar size={12} className={isDeadlinePassed(prac.deadline) ? 'text-red-400' : 'text-dark-400'} />
                              <span className={`text-xs ${isDeadlinePassed(prac.deadline) ? 'text-red-400' : 'text-dark-300'}`}>
                                {prac.deadline ? format(new Date(prac.deadline), 'dd MMM yy') : '—'}
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
        </div>
      )}

      {/* ================================================================= */}
      {/* BATCH Create / Edit Modal                                          */}
      {/* ================================================================= */}
      <Modal
        isOpen={!!batchModal}
        onClose={() => setBatchModal(null)}
        title={batchModal === 'create' ? 'Create New Batch' : `Edit Batch — ${editingBatch?.name}`}
        size="md"
        footer={
          <>
            <button onClick={() => setBatchModal(null)} className="btn btn-secondary">Cancel</button>
            <button onClick={handleSaveBatch} disabled={batchSaving} className="btn btn-primary">
              {batchSaving ? (
                <span className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Saving...
                </span>
              ) : batchModal === 'create' ? 'Create Batch' : 'Save Changes'}
            </button>
          </>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-dark-300 mb-1.5">Batch Name *</label>
            <input
              type="text"
              value={batchForm.name}
              onChange={e => setBatchForm(f => ({ ...f, name: e.target.value }))}
              className="input-field"
              placeholder="e.g. Computer Engineering Lab A"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-dark-300 mb-1.5">Division *</label>
              <input
                type="text"
                value={batchForm.division}
                onChange={e => setBatchForm(f => ({ ...f, division: e.target.value }))}
                className="input-field"
                placeholder="e.g. A"
                maxLength={5}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-dark-300 mb-1.5">Batch Letter *</label>
              <input
                type="text"
                value={batchForm.batch}
                onChange={e => setBatchForm(f => ({ ...f, batch: e.target.value }))}
                className="input-field"
                placeholder="e.g. A1"
                maxLength={5}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-dark-300 mb-1.5">Year</label>
              <select
                value={batchForm.year}
                onChange={e => setBatchForm(f => ({ ...f, year: e.target.value }))}
                className="input-field"
              >
                <option value="">— Select year —</option>
                <option value="1">1st Year</option>
                <option value="2">2nd Year</option>
                <option value="3">3rd Year</option>
                <option value="4">4th Year</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-dark-300 mb-1.5">Academic Year</label>
              <input
                type="text"
                value={batchForm.academic_year}
                onChange={e => setBatchForm(f => ({ ...f, academic_year: e.target.value }))}
                className="input-field"
                placeholder="e.g. 2024-25"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-dark-300 mb-1.5">Code (auto-generated if blank)</label>
            <input
              type="text"
              value={batchForm.code}
              onChange={e => setBatchForm(f => ({ ...f, code: e.target.value }))}
              className="input-field font-mono"
              placeholder="e.g. AA1-KXYZ"
            />
          </div>

          {/* Show assigned teacher */}
          {selectedTeacher && (
            <div className="rounded-lg px-3 py-2.5 text-sm flex items-center gap-2"
              style={{ background: 'rgba(139,92,246,0.1)', border: '1px solid rgba(139,92,246,0.2)' }}>
              <User size={14} className="text-purple-400 flex-shrink-0" />
              <span className="text-dark-300 text-xs">
                Assigned to <span className="text-white font-medium">{selectedTeacher.name}</span>
              </span>
            </div>
          )}
        </div>
      </Modal>

      {/* ================================================================= */}
      {/* PRACTICAL Create / Edit Modal                                      */}
      {/* ================================================================= */}
      <Modal
        isOpen={!!editPractical}
        onClose={() => setEditPractical(null)}
        title={editMode === 'create' ? 'Create New Practical' : `Edit — ${editPractical?.title}`}
        size="lg"
        footer={
          <>
            <button onClick={() => setEditPractical(null)} className="btn btn-secondary">Cancel</button>
            <button onClick={handleSavePractical} disabled={editLoading} className="btn btn-primary">
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

          <div>
            <label className="block text-xs font-medium text-dark-300 mb-1.5">Batch</label>
            <select
              value={allBatches.find(b => b.division === editForm.division && b.batch === editForm.batch)?.id ?? ''}
              onChange={e => {
                const b = allBatches.find(x => x.id === e.target.value)
                if (b) setEditForm(f => ({ ...f, division: b.division, batch: b.batch }))
              }}
              className="input-field"
            >
              <option value="">— Select a batch —</option>
              {Object.entries(
                allBatches.reduce<Record<string, typeof allBatches>>((acc, b) => {
                  const key = getYearLabel(b.year) ?? 'Other'
                  ;(acc[key] ??= []).push(b)
                  return acc
                }, {})
              ).flatMap(([yearLabel, group]) => [
                <option key={`hdr-${yearLabel}`} disabled>── {yearLabel} ──</option>,
                ...group.map(b => (
                  <option key={b.id} value={b.id}>
                    Div {b.division} · Batch {b.batch} — {b.name}
                  </option>
                )),
              ])}
            </select>
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
                type="number" min="0"
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

      {/* ── Batch Delete Confirm ──────────────────────────────────────────── */}
      <ConfirmDialog
        isOpen={!!deleteBatchTarget}
        onClose={() => setDeleteBatchTarget(null)}
        onConfirm={handleDeleteBatch}
        title="Delete Batch"
        message={`Delete batch "${deleteBatchTarget?.name}"? All practicals in this batch may be affected. This cannot be undone.`}
        confirmLabel="Delete Batch"
        variant="danger"
        loading={deleteBatchLoading}
      />

      {/* ── Practical Delete Confirm ──────────────────────────────────────── */}
      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDeletePractical}
        title="Delete Practical"
        message={`Delete "${deleteTarget?.title}"? This may affect related submissions. This action cannot be undone.`}
        confirmLabel="Delete Practical"
        variant="danger"
        loading={deleteLoading}
      />

      {/* ── Bulk Grade Confirm ────────────────────────────────────────────── */}
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
