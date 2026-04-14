'use client'

import { useState, useEffect, useCallback } from 'react'
import { 
  Search, 
  RefreshCw, 
  Filter, 
  CheckCircle2, 
  XCircle, 
  ExternalLink, 
  FileCheck,
  MoreVertical,
  Eye,
  Award,
  UserCheck,
  ChevronUp,
  ChevronDown,
  ChevronsUpDown,
  User,
  Plus,
  Trash2,
  AlertCircle
} from 'lucide-react'
import { toast } from 'react-hot-toast'
import Modal from '@/components/ui/Modal'
import Pagination from '@/components/ui/Pagination'
import ConfirmDialog from '@/components/ui/ConfirmDialog'
import { format } from 'date-fns'
import type { Participation, UserProfile } from '@/types'

const STATUS_OPTIONS = [
  { value: 'all', label: 'All Status' },
  { value: 'pending', label: 'Pending' },
  { value: 'approved', label: 'Approved' },
  { value: 'rejected', label: 'Rejected' },
]

export default function VerificationsPage() {
  const [items, setItems] = useState<Participation[]>([])
  const [teachers, setTeachers] = useState<UserProfile[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [mentorFilter, setMentorFilter] = useState('all')
  const [page, setPage] = useState(1)
  const [pagination, setPagination] = useState({ total: 0, totalPages: 1, limit: 50 })
  const [sortBy, setSortBy] = useState('created_at')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc')

  // Review Modal state
  const [reviewItem, setReviewItem] = useState<Participation | null>(null)
  const [reviewForm, setReviewForm] = useState({
    status: 'approved' as 'approved' | 'rejected',
    points_awarded: 0,
    rejection_reason: '',
    mentor_id: '',
    event_type: 'inside'
  })
  const [reviewLoading, setReviewLoading] = useState(false)

  // Add Modal state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [students, setStudents] = useState<UserProfile[]>([])
  const [studentSearch, setStudentSearch] = useState('')
  const [addForm, setAddForm] = useState({
    student_id: '',
    mentor_id: '',
    event_type: 'inside',
    event_details: '',
    participation_status: 'participant',
    status: 'pending' as 'pending' | 'approved' | 'rejected',
    points_awarded: 0,
    event_date: '',
    event_end_date: '',
    cert_link_1: '',
    cert_link_2: '',
    description: ''
  })
  const [addLoading, setAddLoading] = useState(false)

  // Delete state
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const fetchVerifications = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ 
        page: String(page), 
        limit: '50', 
        search, 
        status: statusFilter, 
        mentor_id: mentorFilter === 'all' ? '' : mentorFilter,
        sortBy, 
        sortDir 
      })
      const res = await fetch(`/api/admin/verifications?${params}`)
      const json = await res.json()
      if (json.success) {
        setItems(json.data)
        setPagination(json.pagination)
      } else {
        toast.error(json.error || 'Failed to load verifications')
      }
    } catch {
      toast.error('Network error')
    } finally {
      setLoading(false)
    }
  }, [page, search, statusFilter, mentorFilter, sortBy, sortDir])

  const fetchTeachers = async () => {
    try {
      const res = await fetch('/api/admin/users?role=teacher&limit=1000')
      const json = await res.json()
      if (json.success) {
        setTeachers(json.data)
      }
    } catch (err) {
      console.error('Failed to fetch teachers', err)
    }
  }

  useEffect(() => {
    fetchTeachers()
  }, [])

  useEffect(() => {
    const t = setTimeout(fetchVerifications, 300)
    return () => clearTimeout(t)
  }, [fetchVerifications])

  const handleSort = (col: string) => {
    if (sortBy === col) {
      setSortDir(d => (d === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortBy(col)
      setSortDir('asc')
    }
    setPage(1)
  }

  const openReview = (item: Participation) => {
    setReviewItem(item)
    setReviewForm({
      status: item.status === 'pending' ? 'approved' : item.status as any,
      points_awarded: item.points_awarded || 0,
      rejection_reason: item.rejection_reason || '',
      mentor_id: item.mentor_id || '',
      event_type: item.event_type || 'inside'
    })
  }

  const handleSaveReview = async () => {
    if (!reviewItem) return
    setReviewLoading(true)
    try {
      const res = await fetch('/api/admin/verifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: reviewItem.id,
        status: reviewForm.status,
          points_awarded: reviewForm.points_awarded,
          rejection_reason: reviewForm.status === 'rejected' ? reviewForm.rejection_reason : null,
          mentor_id: reviewForm.mentor_id,
          event_type: reviewForm.event_type
        }),
      })
      const json = await res.json()
      if (json.success) {
        toast.success('Verification updated')
        setReviewItem(null)
        fetchVerifications()
      } else {
        toast.error(json.error || 'Update failed')
      }
    } catch {
      toast.error('Network error')
    } finally {
      setReviewLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteId) return
    setIsDeleting(true)
    try {
      const res = await fetch(`/api/admin/verifications?id=${deleteId}`, { method: 'DELETE' })
      const json = await res.json()
      if (json.success) {
        toast.success('Verification deleted')
        setItems(items.filter(i => i.id !== deleteId))
        setPagination(p => ({ ...p, total: p.total - 1 }))
      } else {
        toast.error(json.error || 'Delete failed')
      }
    } catch {
      toast.error('Network error')
    } finally {
      setIsDeleting(false)
      setDeleteId(null)
    }
  }

  const fetchStudents = async (query: string) => {
    if (!query || query.length < 2) return
    try {
      const res = await fetch(`/api/admin/users?role=student&search=${query}&limit=10`)
      const json = await res.json()
      if (json.success) {
        setStudents(json.data)
      }
    } catch (err) {
      console.error(err)
    }
  }

  const handleAddVerification = async () => {
    if (!addForm.student_id || !addForm.event_details) {
      toast.error('Student and event details are required')
      return
    }
    setAddLoading(true)
    try {
      const res = await fetch('/api/admin/verifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(addForm),
      })
      const json = await res.json()
      if (json.success) {
        toast.success('Certificate added successfully')
        setIsAddModalOpen(false)
        fetchVerifications()
        setAddForm({
          student_id: '',
          mentor_id: '',
          event_type: 'inside',
          event_details: '',
          participation_status: 'participant',
          points_awarded: 0,
          event_date: '',
          event_end_date: '',
          cert_link_1: '',
          cert_link_2: '',
          description: ''
        })
      } else {
        toast.error(json.error || 'Failed to add certificate')
      }
    } catch {
      toast.error('Network error')
    } finally {
      setAddLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20'
      case 'rejected': return 'text-red-400 bg-red-500/10 border-red-500/20'
      default: return 'text-amber-400 bg-amber-500/10 border-amber-500/20'
    }
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Certificate Verifications</h1>
          <p className="text-sm text-dark-400 mt-0.5">{pagination.total.toLocaleString()} total requests</p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={() => setIsAddModalOpen(true)} className="btn btn-primary gap-2">
            <Plus size={14} />
            Add Certificate
          </button>
          <button onClick={fetchVerifications} className="btn btn-secondary gap-2">
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            Refresh
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="glass-card p-4 flex flex-col md:flex-row gap-4 items-stretch md:items-center">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-dark-400" />
          <input
            type="text"
            placeholder="Search student name..."
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1) }}
            className="input-field pl-9"
          />
        </div>
        
        <div className="flex flex-wrap gap-3">
          <div className="flex items-center gap-2">
            <Filter size={14} className="text-dark-400" />
            <select
              value={statusFilter}
              onChange={e => { setStatusFilter(e.target.value); setPage(1) }}
              className="input-field w-36"
            >
              {STATUS_OPTIONS.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <UserCheck size={14} className="text-dark-400" />
            <select
              value={mentorFilter}
              onChange={e => { setMentorFilter(e.target.value); setPage(1) }}
              className="input-field w-48"
            >
              <option value="all">All Mentors</option>
              {teachers.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="glass-card overflow-hidden">
        {loading ? (
          <div className="py-20 text-center">
            <div className="inline-block w-8 h-8 border-2 border-blue-400/30 border-t-blue-400 rounded-full animate-spin mb-4" />
            <p className="text-sm text-dark-400">Fetching requests...</p>
          </div>
        ) : items.length === 0 ? (
          <div className="py-20 text-center">
            <FileCheck size={40} className="mx-auto text-dark-600 mb-4" />
            <p className="text-dark-400">No verification requests found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="data-table min-w-full">
              <thead>
                <tr>
                  <th onClick={() => handleSort('created_at')} className="cursor-pointer group hover:text-white">
                    <span className="inline-flex items-center gap-1">
                      Date
                      {sortBy === 'created_at' ? (sortDir === 'asc' ? <ChevronUp size={12}/> : <ChevronDown size={12}/>) : <ChevronsUpDown size={12} className="opacity-0 group-hover:opacity-100"/>}
                    </span>
                  </th>
                  <th>Student</th>
                  <th>Event Details</th>
                  <th>Mentor</th>
                  <th className="text-center">Points</th>
                  <th className="text-center">Status</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {items.map(item => (
                  <tr key={item.id} className="hover:bg-white/[0.02]">
                    <td className="text-xs text-dark-400 truncate max-w-[100px]">
                      {format(new Date(item.created_at), 'MMM dd, yyyy')}
                    </td>
                    <td>
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 font-bold text-xs flex-shrink-0">
                          {(item as any).student?.name?.charAt(0) || 'S'}
                        </div>
                        <div className="flex flex-col min-w-0">
                          <span className="font-semibold text-white text-sm truncate">
                            {(item as any).student?.name || 'Unknown'}
                          </span>
                          <span className="text-[10px] text-dark-500 font-medium truncate">
                            {(item as any).student?.enrollment_number || 'No ID'}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div className="flex flex-col gap-1 max-w-[240px]">
                        <span className="text-xs font-semibold text-blue-300 uppercase tracking-wider">{item.event_type}</span>
                        <span className="text-sm text-white truncate" title={item.event_details}>{item.event_details}</span>
                        <div className="flex gap-2 mt-1">
                          {(item as any).cert_link_1 && (
                            <a href={(item as any).cert_link_1} target="_blank" rel="noopener noreferrer" 
                              className="text-[10px] flex items-center gap-1 text-blue-400 hover:text-blue-300 transition-colors">
                              <ExternalLink size={10} /> Cert 1
                            </a>
                          )}
                          {(item as any).cert_link_2 && (
                            <a href={(item as any).cert_link_2} target="_blank" rel="noopener noreferrer" 
                              className="text-[10px] flex items-center gap-1 text-blue-400 hover:text-blue-300 transition-colors">
                              <ExternalLink size={10} /> Cert 2
                            </a>
                          )}
                        </div>
                      </div>
                    </td>
                    <td>
                      <div className="flex items-center gap-2">
                        <User size={12} className="text-dark-500" />
                        <span className="text-xs text-dark-300">{(item as any).mentor?.name || 'Not assigned'}</span>
                      </div>
                    </td>
                    <td className="text-center">
                      <span className="text-sm font-bold text-white px-2 py-0.5 rounded bg-white/5 border border-white/10">
                        {item.points_awarded}
                      </span>
                    </td>
                    <td className="text-center">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-tight border ${getStatusColor(item.status)}`}>
                        {item.status}
                      </span>
                    </td>
                    <td>
                      <div className="flex items-center justify-end gap-2">
                        <button 
                          onClick={() => openReview(item)}
                          className="p-2 rounded-lg bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 transition-all border border-blue-500/20"
                          title="Review / Edit"
                        >
                          <Award size={14} />
                        </button>
                        <button 
                          onClick={() => setDeleteId(item.id)}
                          className="p-2 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-all border border-red-500/20"
                          title="Delete"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <Pagination
              page={page}
              totalPages={pagination.totalPages}
              total={pagination.total}
              limit={pagination.limit}
              onPageChange={setPage}
            />
          </div>
        )}
      </div>

      {/* Review Modal */}
      <Modal
        isOpen={!!reviewItem}
        onClose={() => setReviewItem(null)}
        title="Review Certificate Verification"
        size="md"
        footer={
          <div className="flex justify-end gap-3 w-full">
            <button onClick={() => setReviewItem(null)} className="btn btn-secondary flex-1 sm:flex-none">Cancel</button>
            <button onClick={handleSaveReview} disabled={reviewLoading} className="btn btn-primary flex-1 sm:flex-none min-w-[120px]">
              {reviewLoading ? <RefreshCw size={14} className="animate-spin" /> : 'Apply Changes'}
            </button>
          </div>
        }
      >
        {reviewItem && (
          <div className="space-y-5">
            {/* Student Info */}
            <div className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.06] flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-blue-500/20 border border-blue-500/30 flex items-center justify-center text-blue-400 font-bold text-lg">
                {(reviewItem as any).student?.name?.[0]?.toUpperCase() || 'S'}
              </div>
              <div>
                <p className="text-sm font-bold text-white">{(reviewItem as any).student?.name}</p>
                <div className="flex gap-2 text-[10px] text-dark-500 font-medium">
                  <span>{(reviewItem as any).student?.enrollment_number}</span>
                  <span>•</span>
                  <span>Year {(reviewItem as any).student?.year}</span>
                  <span>•</span>
                  <span>Div {(reviewItem as any).student?.division}-{(reviewItem as any).student?.batch}</span>
                </div>
              </div>
            </div>

            {/* Event Info */}
            <div className="space-y-1">
              <p className="text-[10px] font-bold text-dark-500 uppercase tracking-widest px-1">Assignment Details</p>
              <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.06] relative group">
                <button 
                  onClick={() => setReviewForm(f => ({ ...f, event_type: f.event_type === 'inside' ? 'outside' : 'inside' }))}
                  className="absolute top-3 right-3 px-2 py-1 rounded bg-blue-500/10 text-blue-400 text-[10px] font-bold uppercase hover:bg-blue-500/20 transition-all border border-blue-500/20 flex items-center gap-1"
                >
                  <RefreshCw size={10} />
                  Change
                </button>
                <p className="text-xs font-bold text-blue-400 uppercase tracking-wider mb-1 flex items-center gap-2">
                  <span className={`w-1.5 h-1.5 rounded-full ${reviewForm.event_type === 'inside' ? 'bg-emerald-400' : 'bg-blue-400'}`} />
                  {reviewForm.event_type}
                </p>
                <p className="text-sm text-white font-medium pr-16">{reviewItem.event_details}</p>
                {reviewItem.event_date && (
                  <p className="text-[10px] text-dark-400 mt-2">
                    Event Date: {format(new Date(reviewItem.event_date), 'dd MMM yyyy')}
                    {reviewItem.event_end_date && ` — ${format(new Date(reviewItem.event_end_date), 'dd MMM yyyy')}`}
                  </p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {/* Status Select */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-dark-500 uppercase tracking-widest px-1">Decide Status</label>
                <select 
                  value={reviewForm.status}
                  onChange={e => setReviewForm(f => ({ ...f, status: e.target.value as any }))}
                  className="input-field"
                >
                  <option value="approved">Approve</option>
                  <option value="rejected">Reject</option>
                </select>
              </div>

              {/* Points Awarded */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-dark-500 uppercase tracking-widest px-1">Points to Award</label>
                <input 
                  type="number"
                  min="0"
                  max="10"
                  value={reviewForm.points_awarded}
                  onChange={e => setReviewForm(f => ({ ...f, points_awarded: parseInt(e.target.value) || 0 }))}
                  className="input-field"
                />
              </div>
            </div>

            {/* Mentor Select */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-dark-500 uppercase tracking-widest px-1">Assigned Teacher (Mentor)</label>
              <select 
                value={reviewForm.mentor_id}
                onChange={e => setReviewForm(f => ({ ...f, mentor_id: e.target.value }))}
                className="input-field"
              >
                <option value="">-- No Teacher Assigned --</option>
                {teachers.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
              <p className="text-[9px] text-dark-600 mt-1">You can reassign this request to any teacher or approve it yourself.</p>
            </div>

            {/* Rejection Reason */}
            {reviewForm.status === 'rejected' && (
              <div className="space-y-1.5 animate-in slide-in-from-top-2 duration-300">
                <label className="text-[10px] font-bold text-dark-500 uppercase tracking-widest px-1">Rejection Reason</label>
                <textarea 
                  value={reviewForm.rejection_reason}
                  onChange={e => setReviewForm(f => ({ ...f, rejection_reason: e.target.value }))}
                  className="input-field min-h-[80px] py-3"
                  placeholder="Tell the student why it was rejected..."
                />
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Add Certificate Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Add Manual Certificate"
        size="lg"
        footer={
          <div className="flex justify-end gap-3 w-full">
            <button onClick={() => setIsAddModalOpen(false)} className="btn btn-secondary flex-1 sm:flex-none">Cancel</button>
            <button onClick={handleAddVerification} disabled={addLoading} className="btn btn-primary flex-1 sm:flex-none min-w-[140px]">
              {addLoading ? <RefreshCw size={14} className="animate-spin" /> : 'Create Record'}
            </button>
          </div>
        }
      >
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Student Search */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-dark-500 uppercase tracking-widest px-1">Select Student</label>
              <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-dark-400" />
                <input 
                  type="text"
                  placeholder="Search student by name..."
                  className="input-field pl-9"
                  value={studentSearch}
                  onChange={e => {
                    setStudentSearch(e.target.value)
                    fetchStudents(e.target.value)
                  }}
                />
                {students.length > 0 && studentSearch && !addForm.student_id && (
                  <div className="absolute z-10 w-full mt-1 glass-card border-white/10 shadow-2xl overflow-hidden max-h-48 overflow-y-auto">
                    {students.map(s => (
                      <button
                        key={s.id}
                        onClick={() => {
                          setAddForm(f => ({ ...f, student_id: s.id }))
                          setStudentSearch(s.name)
                          setStudents([])
                        }}
                        className="w-full px-4 py-2.5 text-left text-xs text-white hover:bg-white/10 border-b border-white/5 last:border-0 flex items-center gap-3 transition-colors"
                      >
                        <div className="w-6 h-6 rounded-full bg-blue-500/20 flex items-center justify-center text-[10px] font-bold text-blue-400">
                          {s.name[0]}
                        </div>
                        <div className="flex flex-col">
                          <span className="font-semibold">{s.name}</span>
                          <span className="text-[9px] text-dark-500">{s.enrollment_number}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
                {addForm.student_id && (
                  <button 
                    onClick={() => {
                      setAddForm(f => ({ ...f, student_id: '' }))
                      setStudentSearch('')
                    }}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-red-400 hover:text-red-300 font-bold"
                  >
                    Clear
                  </button>
                )}
              </div>
            </div>

            {/* Mentor Selection */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-dark-500 uppercase tracking-widest px-1">Assign Mentor (Optional)</label>
              <select 
                value={addForm.mentor_id}
                onChange={e => setAddForm(f => ({ ...f, mentor_id: e.target.value }))}
                className="input-field"
              >
                <option value="">-- No Mentor --</option>
                {teachers.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Event Details */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-dark-500 uppercase tracking-widest px-1">Event Name / Details</label>
              <input 
                type="text"
                placeholder="e.g. Smart India Hackathon"
                className="input-field"
                value={addForm.event_details}
                onChange={e => setAddForm(f => ({ ...f, event_details: e.target.value }))}
              />
            </div>

            {/* Event Type & Status */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-dark-500 uppercase tracking-widest px-1">Type</label>
                <select 
                  value={addForm.event_type}
                  onChange={e => setAddForm(f => ({ ...f, event_type: e.target.value }))}
                  className="input-field"
                >
                  <option value="inside">Inside</option>
                  <option value="outside">Outside</option>
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-dark-500 uppercase tracking-widest px-1">Status</label>
                <select 
                  value={addForm.status}
                  onChange={e => setAddForm(f => ({ ...f, status: e.target.value as any }))}
                  className="input-field"
                >
                  <option value="pending">Pending</option>
                  <option value="approved">Approved</option>
                  <option value="rejected">Rejected</option>
                </select>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Participation Status */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-dark-500 uppercase tracking-widest px-1">Role</label>
              <select 
                value={addForm.participation_status}
                onChange={e => setAddForm(f => ({ ...f, participation_status: e.target.value }))}
                className="input-field"
              >
                <option value="participant">Participant</option>
                <option value="winner">Winner</option>
                <option value="runner_up">Runner Up</option>
                <option value="organizer">Organizer</option>
                <option value="other">Other</option>
              </select>
            </div>

            {/* Points */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-dark-500 uppercase tracking-widest px-1">Points</label>
              <input 
                type="number"
                min="0"
                className="input-field"
                value={addForm.points_awarded}
                onChange={e => setAddForm(f => ({ ...f, points_awarded: parseInt(e.target.value) || 0 }))}
              />
            </div>

            {/* Date */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-dark-500 uppercase tracking-widest px-1">Event Date</label>
              <input 
                type="date"
                className="input-field"
                value={addForm.event_date}
                onChange={e => setAddForm(f => ({ ...f, event_date: e.target.value }))}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-dark-500 uppercase tracking-widest px-1">Certificate Link (Google Drive/Cloudinary)</label>
            <input 
              type="text"
              placeholder="https://drive.google.com/..."
              className="input-field text-xs"
              value={addForm.cert_link_1}
              onChange={e => setAddForm(f => ({ ...f, cert_link_1: e.target.value }))}
            />
          </div>
        </div>
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="Delete Verification"
        message="Are you sure you want to delete this certificate record? This action cannot be undone."
        confirmLabel="Delete Record"
        variant="danger"
        loading={isDeleting}
      />
    </div>
  )
}
