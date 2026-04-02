'use client'

import { useEffect, useState } from 'react'
import {
  Search,
  MessageSquare,
  CheckCircle,
  User,
  Mail,
  Calendar,
  AlertCircle,
  Loader2,
  Trash2,
  MailOpen,
  Mail as MailIcon
} from 'lucide-react'
import toast from 'react-hot-toast'
import { format } from 'date-fns'
import { Badge } from '@/components/ui/Badge'

interface HODMessage {
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

export default function HODMessagesPage() {
  const [messages, setMessages] = useState<HODMessage[]>([])
  const [loading, setLoading] = useState(true)
  const [updatingId, setUpdatingId] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')

  const fetchMessages = async () => {
    try {
      const res = await fetch('/api/admin/hod-messages')
      const json = await res.json()
      if (json.success) {
        setMessages(json.data)
      } else {
        toast.error('Failed to load messages: ' + json.error)
      }
    } catch (err) {
      toast.error('Failed to fetch messages')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchMessages()
  }, [])

  const toggleReadStatus = async (id: string, currentStatus: boolean) => {
    setUpdatingId(id)
    try {
      const res = await fetch('/api/admin/hod-messages', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, is_read: !currentStatus })
      })
      const json = await res.json()
      if (json.success) {
        toast.success(`Message marked as ${!currentStatus ? 'read' : 'unread'}`)
        setMessages(prev => prev.map(m => m.id === id ? { ...m, is_read: !currentStatus } : m))
      } else {
        toast.error('Failed to update message: ' + json.error)
      }
    } catch (err) {
      toast.error('Failed to update message')
    } finally {
      setUpdatingId(null)
    }
  }

  const deleteMessage = async (id: string) => {
    if (!confirm('Are you sure you want to PERMANENTLY delete this message? This cannot be undone.')) return
    
    setDeletingId(id)
    try {
      const res = await fetch('/api/admin/hod-messages', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
      })
      const json = await res.json()
      if (json.success) {
        toast.success('Message deleted successfully')
        setMessages(prev => prev.filter(m => m.id !== id))
      } else {
        toast.error('Failed to delete: ' + json.error)
      }
    } catch (err) {
      toast.error('Failed to delete message')
    } finally {
      setDeletingId(null)
    }
  }

  const filteredMessages = messages.filter(m => 
    m.teacher.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    m.teacher.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    m.message.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const unreadCount = messages.filter(m => !m.is_read).length

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white mb-1">HOD Messages</h1>
          <p className="text-sm text-dark-400">Manage internal communications from teachers to the HOD.</p>
        </div>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="glass-card p-4 flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-400">
            <MessageSquare size={20} />
          </div>
          <div>
            <p className="text-xs text-dark-400">Total Messages</p>
            <p className="text-xl font-bold text-white">{messages.length}</p>
          </div>
        </div>
        <div className="glass-card p-4 flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-orange-500/10 flex items-center justify-center text-orange-400">
            <MailIcon size={20} />
          </div>
          <div>
            <p className="text-xs text-dark-400">Unread</p>
            <p className="text-xl font-bold text-white">{unreadCount}</p>
          </div>
        </div>
        <div className="glass-card p-4 flex items-center gap-4 hidden lg:flex">
          <div className="w-10 h-10 rounded-xl bg-green-500/10 flex items-center justify-center text-green-400">
            <CheckCircle size={20} />
          </div>
          <div>
            <p className="text-xs text-dark-400">Read</p>
            <p className="text-xl font-bold text-white">{messages.length - unreadCount}</p>
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
              placeholder="Search by teacher name, email or message content..."
              className="w-full bg-dark-900/50 border border-white/10 rounded-lg py-2.5 pl-10 pr-4 text-sm text-white placeholder:text-dark-500 focus:outline-none focus:ring-1 focus:ring-blue-500/50 transition-all"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {/* Messages Table */}
        <div className="flex-1 overflow-x-auto">
          {loading ? (
            <div className="flex flex-col items-center justify-center h-64 gap-3">
              <Loader2 className="animate-spin text-blue-500" size={32} />
              <p className="text-sm text-dark-400">Loading messages...</p>
            </div>
          ) : filteredMessages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 gap-2">
              <AlertCircle className="text-dark-600" size={40} />
              <p className="text-sm text-dark-400">No messages found.</p>
            </div>
          ) : (
            <div className="max-h-[500px] overflow-y-auto custom-scrollbar">
              <table className="w-full text-left border-collapse">
                <thead className="sticky top-0 bg-dark-900/90 backdrop-blur-md z-10">
                  <tr className="border-b border-white/5">
                    <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-dark-400">Sender (Teacher)</th>
                    <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-dark-400">Message Content</th>
                    <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-dark-400 w-32">Date</th>
                    <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-dark-400 w-24">Status</th>
                    <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-dark-400 text-right w-32">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {filteredMessages.map((msg) => (
                    <tr key={msg.id} className={`hover:bg-white/[0.02] transition-colors group ${!msg.is_read ? 'bg-blue-500/[0.02]' : ''}`}>
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="text-sm font-medium text-white flex items-center gap-1.5">
                            <User size={14} className={!msg.is_read ? "text-blue-400" : "text-dark-400"} />
                            {msg.teacher.name}
                          </span>
                          <span className="text-xs text-dark-500 mt-0.5 flex items-center gap-1.5 transition-colors">
                            <Mail size={12} />
                            {msg.teacher.email}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div 
                          className={`max-w-[400px] text-sm ${!msg.is_read ? 'text-white font-medium' : 'text-dark-300'} line-clamp-2 transition-all group-hover:line-clamp-none cursor-default py-1`}
                          title="Hover to expand full message"
                        >
                          {msg.message}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col gap-0.5">
                          <div className="flex items-center gap-1.5 text-xs text-dark-300 whitespace-nowrap">
                            <Calendar size={12} />
                            {format(new Date(msg.created_at), 'MMM d, yyyy')}
                          </div>
                          <div className="pl-4 text-[10px] text-dark-500">
                            {format(new Date(msg.created_at), 'p')}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {msg.is_read ? (
                          <Badge variant="blue">Read</Badge>
                        ) : (
                          <Badge variant="yellow">Unread</Badge>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => toggleReadStatus(msg.id, msg.is_read)}
                            disabled={updatingId === msg.id}
                            className={`p-2 rounded-lg transition-all ${
                              msg.is_read 
                                ? 'text-dark-400 hover:text-orange-400 hover:bg-orange-500/10' 
                                : 'text-blue-400 hover:bg-blue-500/10'
                            }`}
                            title={msg.is_read ? "Mark as unread" : "Mark as read"}
                          >
                            {updatingId === msg.id ? (
                              <Loader2 className="animate-spin" size={16} />
                            ) : msg.is_read ? (
                              <MailIcon size={16} />
                            ) : (
                              <MailOpen size={16} />
                            )}
                          </button>
                          <button
                            onClick={() => deleteMessage(msg.id)}
                            disabled={deletingId === msg.id}
                            className="p-2 rounded-lg text-dark-400 hover:text-red-400 hover:bg-red-500/10 transition-all"
                            title="Delete Message"
                          >
                            {deletingId === msg.id ? (
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
