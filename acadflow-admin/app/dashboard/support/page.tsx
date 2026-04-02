'use client'

import { useEffect, useState } from 'react'
import { 
  Search, 
  MessageSquare, 
  Clock, 
  CheckCircle, 
  User, 
  Mail, 
  Calendar,
  AlertCircle,
  Loader2,
  Plus,
  Trash2,
  Reply
} from 'lucide-react'
import { TicketStatusBadge, Badge } from '@/components/ui/Badge'
import toast from 'react-hot-toast'
import Link from 'next/link'
import { format } from 'date-fns'

interface Ticket {
  id: string
  name: string
  email: string
  subject: string
  message: string
  status: 'open' | 'resolved'
  created_at: string
}

export default function SupportDeskPage() {
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [loading, setLoading] = useState(true)
  const [updatingId, setUpdatingId] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')

  const fetchTickets = async () => {
    try {
      const res = await fetch('/api/admin/tickets')
      const json = await res.json()
      if (json.success) {
        setTickets(json.data)
      } else {
        toast.error('Failed to load tickets: ' + json.error)
      }
    } catch (err) {
      toast.error('Failed to fetch tickets')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchTickets()
  }, [])

  const markAsResolved = async (id: string) => {
    setUpdatingId(id)
    try {
      const res = await fetch('/api/admin/tickets', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status: 'resolved' })
      })
      const json = await res.json()
      if (json.success) {
        toast.success('Ticket marked as resolved')
        setTickets(prev => prev.map(t => t.id === id ? { ...t, status: 'resolved' } : t))
      } else {
        toast.error('Failed to update ticket: ' + json.error)
      }
    } catch (err) {
      toast.error('Failed to update ticket')
    } finally {
      setUpdatingId(null)
    }
  }

  const deleteTicket = async (id: string) => {
    if (!confirm('Are you sure you want to PERMANENTLY delete this ticket? This cannot be undone.')) return
    
    setDeletingId(id)
    try {
      const res = await fetch('/api/admin/tickets', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
      })
      const json = await res.json()
      if (json.success) {
        toast.success('Ticket deleted successfully')
        setTickets(prev => prev.filter(t => t.id !== id))
      } else {
        toast.error('Failed to delete: ' + json.error)
      }
    } catch (err) {
      toast.error('Failed to delete ticket')
    } finally {
      setDeletingId(null)
    }
  }

  const filteredTickets = tickets.filter(t => 
    t.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.subject.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white mb-1">Support Desk</h1>
          <p className="text-sm text-dark-400">Manage user inquiries and technical issues.</p>
        </div>
        <Link href="/dashboard/support/new">
          <button className="btn btn-primary gap-2">
            <Plus size={18} />
            Raise New Ticket
          </button>
        </Link>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="glass-card p-4 flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-400">
            <MessageSquare size={20} />
          </div>
          <div>
            <p className="text-xs text-dark-400">Total Tickets</p>
            <p className="text-xl font-bold text-white">{tickets.length}</p>
          </div>
        </div>
        <div className="glass-card p-4 flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-yellow-500/10 flex items-center justify-center text-yellow-400">
            <Clock size={20} />
          </div>
          <div>
            <p className="text-xs text-dark-400">Open Tickets</p>
            <p className="text-xl font-bold text-white">
              {tickets.filter(t => t.status === 'open').length}
            </p>
          </div>
        </div>
        <div className="glass-card p-4 flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-green-500/10 flex items-center justify-center text-green-400">
            <CheckCircle size={20} />
          </div>
          <div>
            <p className="text-xs text-dark-400">Resolved</p>
            <p className="text-xl font-bold text-white">
              {tickets.filter(t => t.status === 'resolved').length}
            </p>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="glass-card flex flex-col min-h-[400px]">
        {/* Search Bar */}
        <div className="p-4 border-b border-white/5 bg-white/2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-dark-500" size={18} />
            <input 
              type="text" 
              placeholder="Search by name, email or subject..."
              className="w-full bg-dark-900/50 border border-white/10 rounded-lg py-2.5 pl-10 pr-4 text-sm text-white placeholder:text-dark-500 focus:outline-none focus:ring-1 focus:ring-blue-500/50 transition-all"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {/* Tickets Table */}
        <div className="flex-1 overflow-x-auto">
          {loading ? (
            <div className="flex flex-col items-center justify-center h-64 gap-3">
              <Loader2 className="animate-spin text-blue-500" size={32} />
              <p className="text-sm text-dark-400">Loading tickets...</p>
            </div>
          ) : filteredTickets.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 gap-2">
              <AlertCircle className="text-dark-600" size={40} />
              <p className="text-sm text-dark-400">No tickets found.</p>
            </div>
          ) : (
            <div className="max-h-[500px] overflow-y-auto custom-scrollbar">
              <table className="w-full text-left border-collapse">
                <thead className="sticky top-0 bg-dark-900/90 backdrop-blur-md z-10">
                  <tr className="border-b border-white/5">
                    <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-dark-400">User Details</th>
                    <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-dark-400">Issue / Subject</th>
                    <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-dark-400">Message</th>
                    <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-dark-400">Date</th>
                    <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-dark-400">Status</th>
                    <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-dark-400 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {filteredTickets.map((ticket) => (
                    <tr key={ticket.id} className="hover:bg-white/[0.02] transition-colors group">
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="text-sm font-medium text-white flex items-center gap-1.5">
                            <User size={14} className="text-dark-400" />
                            {ticket.name}
                          </span>
                          <span className="text-xs text-dark-500 mt-0.5 flex items-center gap-1.5 hover:text-blue-400 transition-colors">
                            <Mail size={12} />
                            {ticket.email}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <Badge variant="blue" dot>{ticket.subject}</Badge>
                      </td>
                      <td className="px-6 py-4">
                        <div 
                          className="max-w-[300px] text-sm text-dark-300 line-clamp-2 transition-all group-hover:line-clamp-none cursor-default py-1"
                          title="Hover to expand full message"
                        >
                          {ticket.message}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1.5 text-xs text-dark-400">
                          <Calendar size={14} />
                          {format(new Date(ticket.created_at), 'PPP')}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-2">
                          <Link href={`/dashboard/redo-email`}>
                            <button
                              className="p-2 rounded-lg text-dark-400 hover:text-blue-400 hover:bg-blue-500/10 transition-all"
                              title="Reply via Email"
                            >
                              <Reply size={16} />
                            </button>
                          </Link>
                          {ticket.status === 'resolved' ? (
                            <TicketStatusBadge status="resolved" />
                          ) : (
                            <button
                              onClick={() => markAsResolved(ticket.id)}
                              disabled={updatingId === ticket.id}
                              className="btn py-1 px-3 text-xs font-medium rounded-full bg-orange-500/10 text-orange-400 border border-orange-500/20 hover:bg-orange-500/20 transition-all flex items-center gap-1.5 disabled:opacity-50"
                            >
                              {updatingId === ticket.id ? (
                                <Loader2 className="animate-spin" size={12} />
                              ) : (
                                <Clock size={12} />
                              )}
                              Mark Done
                            </button>
                          )}
                          <button
                            onClick={() => deleteTicket(ticket.id)}
                            disabled={deletingId === ticket.id}
                            className="p-2 rounded-lg text-dark-400 hover:text-red-400 hover:bg-red-500/10 transition-all"
                            title="Delete Ticket"
                          >
                            {deletingId === ticket.id ? (
                              <Loader2 className="animate-spin" size={16} />
                            ) : (
                              <Trash2 size={16} />
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
