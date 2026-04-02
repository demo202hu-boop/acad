'use client'

import { useState } from 'react'
import toast from 'react-hot-toast'
import {
  Send,
  UserCircle,
  BookOpen,
  MessageSquare,
  GraduationCap,
  Tag,
  Loader2,
  CheckCircle2,
  XCircle,
  RotateCcw,
  Zap,
} from 'lucide-react'

const EMAIL_TYPES = [
  { value: 'missing', label: '🚫 Missing Submission' },
  { value: 'redo', label: '🔁 Redo Required' },
  { value: 'late', label: '⏰ Late Submission' },
  { value: 'reminder', label: '📢 Reminder' },
]

interface LogEntry {
  id: number
  time: string
  enrollment: string
  student: string
  type: string
  status: 'success' | 'error'
  message: string
}

export default function RedoEmailPage() {
  const [form, setForm] = useState({
    enrollment_number: '',
    studentName: '',
    taskTitle: '',
    feedback: '',
    teacherName: '',
    emailType: 'missing',
  })
  const [sending, setSending] = useState(false)
  const [logs, setLogs] = useState<LogEntry[]>([])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault()
    setSending(true)
    try {
      const res = await fetch('/api/send-redo-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const json = await res.json()
      const logEntry: LogEntry = {
        id: Date.now(),
        time: new Date().toLocaleTimeString(),
        enrollment: form.enrollment_number,
        student: form.studentName,
        type: form.emailType,
        status: json.success ? 'success' : 'error',
        message: json.success ? 'Email sent successfully' : (json.error?.message || json.error || 'Failed'),
      }
      setLogs(prev => [logEntry, ...prev])
      if (json.success) {
        toast.success(`Email sent to ${form.studentName}!`)
      } else {
        toast.error('Failed: ' + (json.error?.message || json.error || 'Unknown error'))
      }
    } catch (err: any) {
      toast.error('Network error: ' + err.message)
      setLogs(prev => [{
        id: Date.now(),
        time: new Date().toLocaleTimeString(),
        enrollment: form.enrollment_number,
        student: form.studentName,
        type: form.emailType,
        status: 'error',
        message: err.message,
      }, ...prev])
    } finally {
      setSending(false)
    }
  }

  const handleReset = () => {
    setForm({
      enrollment_number: '',
      studentName: '',
      taskTitle: '',
      feedback: '',
      teacherName: '',
      emailType: 'missing',
    })
  }

  const handleQuickFill = () => {
    setForm({
      enrollment_number: 'VU1F2223083',
      studentName: 'Harshit Ajay Upadhyay',
      taskTitle: 'Assignment 2 on Unit 4,5,6',
      feedback: 'You have not submitted this task yet. Please submit it as soon as possible to avoid losing marks.',
      teacherName: 'Prof. Sneha Tapre',
      emailType: 'missing',
    })
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            <div className="p-2 rounded-xl bg-gradient-to-br from-orange-500/20 to-red-500/20 border border-orange-500/30">
              <Zap size={24} className="text-orange-400" />
            </div>
            Redo Email Sender
          </h1>
          <p className="text-sm text-dark-400 mt-1">
            Proxy emails through AcadFlow PVPPCOE — no API key required.
          </p>
        </div>
        <button
          onClick={handleQuickFill}
          className="px-4 py-2 rounded-lg bg-dark-700/60 border border-dark-600 text-dark-300 hover:text-white hover:border-orange-500/40 transition-all text-sm flex items-center gap-2"
        >
          <Zap size={14} /> Quick Fill Demo
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Form Card */}
        <div className="lg:col-span-2 bg-dark-800/60 backdrop-blur-sm rounded-2xl border border-dark-700/50 p-6">
          <form onSubmit={handleSend} className="space-y-5">
            {/* Row 1: Enrollment + Student Name */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-dark-300 mb-1.5 flex items-center gap-2">
                  <GraduationCap size={14} className="text-blue-400" />
                  Enrollment Number
                </label>
                <input
                  name="enrollment_number"
                  value={form.enrollment_number}
                  onChange={handleChange}
                  required
                  placeholder="e.g. VU1F2223083"
                  className="w-full px-4 py-2.5 rounded-xl bg-dark-900/80 border border-dark-600 text-white placeholder-dark-500 focus:outline-none focus:ring-2 focus:ring-orange-500/40 focus:border-orange-500/50 transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-dark-300 mb-1.5 flex items-center gap-2">
                  <UserCircle size={14} className="text-green-400" />
                  Student Name
                </label>
                <input
                  name="studentName"
                  value={form.studentName}
                  onChange={handleChange}
                  required
                  placeholder="Full name"
                  className="w-full px-4 py-2.5 rounded-xl bg-dark-900/80 border border-dark-600 text-white placeholder-dark-500 focus:outline-none focus:ring-2 focus:ring-orange-500/40 focus:border-orange-500/50 transition-all"
                />
              </div>
            </div>

            {/* Row 2: Task Title + Email Type */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-dark-300 mb-1.5 flex items-center gap-2">
                  <BookOpen size={14} className="text-purple-400" />
                  Task Title
                </label>
                <input
                  name="taskTitle"
                  value={form.taskTitle}
                  onChange={handleChange}
                  required
                  placeholder="e.g. Assignment 2 on Unit 4,5,6"
                  className="w-full px-4 py-2.5 rounded-xl bg-dark-900/80 border border-dark-600 text-white placeholder-dark-500 focus:outline-none focus:ring-2 focus:ring-orange-500/40 focus:border-orange-500/50 transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-dark-300 mb-1.5 flex items-center gap-2">
                  <Tag size={14} className="text-yellow-400" />
                  Email Type
                </label>
                <select
                  name="emailType"
                  value={form.emailType}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 rounded-xl bg-dark-900/80 border border-dark-600 text-white focus:outline-none focus:ring-2 focus:ring-orange-500/40 focus:border-orange-500/50 transition-all"
                >
                  {EMAIL_TYPES.map(t => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Teacher Name */}
            <div>
              <label className="block text-sm font-medium text-dark-300 mb-1.5 flex items-center gap-2">
                <UserCircle size={14} className="text-cyan-400" />
                Teacher Name
              </label>
              <input
                name="teacherName"
                value={form.teacherName}
                onChange={handleChange}
                required
                placeholder="e.g. Prof. Sneha Tapre"
                className="w-full px-4 py-2.5 rounded-xl bg-dark-900/80 border border-dark-600 text-white placeholder-dark-500 focus:outline-none focus:ring-2 focus:ring-orange-500/40 focus:border-orange-500/50 transition-all"
              />
            </div>

            {/* Feedback */}
            <div>
              <label className="block text-sm font-medium text-dark-300 mb-1.5 flex items-center gap-2">
                <MessageSquare size={14} className="text-red-400" />
                Feedback / Message
              </label>
              <textarea
                name="feedback"
                value={form.feedback}
                onChange={handleChange}
                required
                rows={4}
                placeholder="Custom feedback message for the student..."
                className="w-full px-4 py-2.5 rounded-xl bg-dark-900/80 border border-dark-600 text-white placeholder-dark-500 focus:outline-none focus:ring-2 focus:ring-orange-500/40 focus:border-orange-500/50 transition-all resize-none"
              />
            </div>

            {/* Actions */}
            <div className="flex items-center gap-3 pt-2">
              <button
                type="submit"
                disabled={sending}
                className="flex-1 group flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-500 hover:to-red-500 text-white font-semibold shadow-lg shadow-orange-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {sending ? (
                  <Loader2 size={18} className="animate-spin" />
                ) : (
                  <Send size={18} className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                )}
                {sending ? 'Sending...' : 'Send Email'}
              </button>
              <button
                type="button"
                onClick={handleReset}
                className="px-4 py-3 rounded-xl bg-dark-700/60 border border-dark-600 text-dark-300 hover:text-white hover:border-dark-500 transition-all"
              >
                <RotateCcw size={18} />
              </button>
            </div>
          </form>
        </div>

        {/* Info & Payload Preview */}
        <div className="space-y-6">
          {/* Target Info */}
          <div className="bg-dark-800/60 backdrop-blur-sm rounded-2xl border border-dark-700/50 p-5">
            <h3 className="text-sm font-semibold text-dark-300 mb-3">🎯 Target Endpoint</h3>
            <div className="p-3 rounded-xl bg-dark-900/80 border border-dark-600">
              <p className="text-xs text-dark-500 font-mono">POST</p>
              <p className="text-sm text-orange-400 font-mono break-all mt-1">
                acadflow-pvppcoe.vercel.app<br />/api/send-redo-email
              </p>
            </div>
            <p className="text-xs text-dark-500 mt-3">
              Proxied server-to-server. No CORS or API key required.
            </p>
          </div>

          {/* Live Payload */}
          <div className="bg-dark-800/60 backdrop-blur-sm rounded-2xl border border-dark-700/50 p-5">
            <h3 className="text-sm font-semibold text-dark-300 mb-3">📦 Live Payload</h3>
            <pre className="text-xs text-dark-400 bg-dark-900/80 border border-dark-600 rounded-xl p-3 overflow-auto max-h-64 font-mono whitespace-pre-wrap">
              {JSON.stringify(form, null, 2)}
            </pre>
          </div>
        </div>
      </div>

      {/* Logs */}
      {logs.length > 0 && (
        <div className="bg-dark-800/60 backdrop-blur-sm rounded-2xl border border-dark-700/50 p-6">
          <h3 className="text-sm font-semibold text-dark-300 mb-4">📋 Send Log</h3>
          <div className="space-y-2 max-h-60 overflow-auto">
            {logs.map(log => (
              <div
                key={log.id}
                className={`flex items-center gap-3 text-sm p-3 rounded-xl border ${
                  log.status === 'success'
                    ? 'bg-green-500/5 border-green-500/20 text-green-400'
                    : 'bg-red-500/5 border-red-500/20 text-red-400'
                }`}
              >
                {log.status === 'success' ? <CheckCircle2 size={16} /> : <XCircle size={16} />}
                <span className="text-dark-500 font-mono text-xs">{log.time}</span>
                <span className="font-medium">{log.enrollment}</span>
                <span className="text-dark-400">—</span>
                <span className="text-dark-300">{log.student}</span>
                <span className="ml-auto text-xs px-2 py-0.5 rounded-full bg-dark-700/60 text-dark-400">{log.type}</span>
                <span className="text-xs">{log.message}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
