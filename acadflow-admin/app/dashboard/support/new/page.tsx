'use client'

import RaiseTicketForm from '@/components/RaiseTicketForm'

export default function NewTicketPage() {
  return (
    <div className="animate-fade-in space-y-6">
      <div className="mb-2">
        <h1 className="text-2xl font-bold text-white mb-1">Support</h1>
        <p className="text-sm text-dark-400">Raise a new support ticket or inquiry.</p>
      </div>

      <RaiseTicketForm dashboard={true} />
    </div>
  )
}
