'use client'

import { useState } from 'react'
import { 
  Send, 
  User, 
  Mail, 
  Type, 
  MessageSquare,
  Loader2,
  ArrowLeft,
  CheckCircle2
} from 'lucide-react'
import toast from 'react-hot-toast'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

export default function RaiseTicketForm({ dashboard = false }: { dashboard?: boolean }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const res = await fetch('/api/support', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      const json = await res.json()

      if (json.success) {
        toast.success('Ticket raised! Our team will contact you soon.')
        setSubmitted(true)
        setFormData({ name: '', email: '', subject: '', message: '' })
        
        if (dashboard) {
          setTimeout(() => router.push('/dashboard/support'), 2000)
        }
      } else {
        toast.error('Failed to send message: ' + (json.error || 'Unknown error'))
      }
    } catch (err: any) {
      toast.error('Failed to send message: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  if (submitted && !dashboard) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center animate-fade-in">
        <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center text-green-400 mb-6">
          <CheckCircle2 size={32} />
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">Ticket Raised!</h2>
        <p className="text-dark-400 mb-8 max-w-sm">
          We&apos;ve received your inquiry. Our support team will get back to you at <strong>{formData.email}</strong> as soon as possible.
        </p>
        <button 
          onClick={() => setSubmitted(false)}
          className="btn btn-secondary"
        >
          Raise Another Ticket
        </button>
      </div>
    )
  }

  return (
    <div className={dashboard ? "max-w-2xl" : "max-w-xl mx-auto"}>
      {dashboard && (
        <Link href="/dashboard/support" className="inline-flex items-center gap-2 text-dark-500 hover:text-dark-300 mb-6 transition-colors group">
          <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
          Back to Tickets
        </Link>
      )}

      <div className="glass-card p-6 md:p-8 animate-slide-up">
        <div className="mb-8">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <MessageSquare size={20} className="text-blue-500" />
            Raise a Support Ticket
          </h2>
          <p className="text-sm text-dark-400 mt-1">
            Please fill out the form below and we&apos;ll help you out.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-dark-300 uppercase tracking-wider flex items-center gap-1.5">
                <User size={12} />
                Full Name
              </label>
              <input
                required
                type="text"
                placeholder="John Doe"
                disabled={loading}
                className="w-full bg-dark-900/50 border border-white/10 rounded-xl py-3 px-4 text-sm text-white placeholder:text-dark-600 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/50 transition-all disabled:opacity-50"
                value={formData.name}
                onChange={e => setFormData({ ...formData, name: e.target.value })}
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-dark-300 uppercase tracking-wider flex items-center gap-1.5">
                <Mail size={12} />
                Email Address
              </label>
              <input
                required
                type="email"
                placeholder="john@example.com"
                disabled={loading}
                className="w-full bg-dark-900/50 border border-white/10 rounded-xl py-3 px-4 text-sm text-white placeholder:text-dark-600 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/50 transition-all disabled:opacity-50"
                value={formData.email}
                onChange={e => setFormData({ ...formData, email: e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-dark-300 uppercase tracking-wider flex items-center gap-1.5">
              <Type size={12} />
              Subject
            </label>
            <input
              required
              type="text"
              placeholder="How do I access my dashboard?"
              disabled={loading}
              className="w-full bg-dark-900/50 border border-white/10 rounded-xl py-3 px-4 text-sm text-white placeholder:text-dark-600 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/50 transition-all disabled:opacity-50"
              value={formData.subject}
              onChange={e => setFormData({ ...formData, subject: e.target.value })}
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-dark-300 uppercase tracking-wider flex items-center gap-1.5">
              <MessageSquare size={12} />
              Message
            </label>
            <textarea
              required
              rows={5}
              placeholder="Describe your issue in detail..."
              disabled={loading}
              className="w-full bg-dark-900/50 border border-white/10 rounded-xl py-3 px-4 text-sm text-white placeholder:text-dark-600 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/50 transition-all resize-none disabled:opacity-50"
              value={formData.message}
              onChange={e => setFormData({ ...formData, message: e.target.value })}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn btn-primary w-full justify-center py-3.5 font-bold tracking-wide group disabled:opacity-50"
            style={{ background: 'linear-gradient(135deg, #3B82F6, #2563EB)' }}
          >
            {loading ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <Send size={18} className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                Submit Ticket
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  )
}
