'use client'

import Modal from './Modal'
import { AlertTriangle } from 'lucide-react'

interface ConfirmDialogProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  title: string
  message: string
  confirmLabel?: string
  variant?: 'danger' | 'warning'
  loading?: boolean
}

export default function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = 'Confirm',
  variant = 'danger',
  loading = false,
}: ConfirmDialogProps) {
  const isDanger = variant === 'danger'

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      size="sm"
      footer={
        <>
          <button
            onClick={onClose}
            disabled={loading}
            className="btn btn-secondary"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className={`btn ${isDanger ? 'btn-danger' : 'btn-warning'}`}
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Processing...
              </span>
            ) : confirmLabel}
          </button>
        </>
      }
    >
      <div className="flex gap-4 items-start">
        <div
          className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center"
          style={{
            background: isDanger ? 'rgba(239,68,68,0.15)' : 'rgba(245,158,11,0.15)',
          }}
        >
          <AlertTriangle
            size={20}
            className={isDanger ? 'text-red-400' : 'text-yellow-400'}
          />
        </div>
        <p className="text-sm text-dark-300 leading-relaxed pt-1">{message}</p>
      </div>
    </Modal>
  )
}
