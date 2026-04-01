import { ChevronLeft, ChevronRight } from 'lucide-react'

interface PaginationProps {
  page: number
  totalPages: number
  total: number
  limit: number
  onPageChange: (page: number) => void
}

export default function Pagination({ page, totalPages, total, limit, onPageChange }: PaginationProps) {
  const start = total === 0 ? 0 : (page - 1) * limit + 1
  const end = Math.min(page * limit, total)

  return (
    <div className="flex items-center justify-between px-4 py-3"
      style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
      <p className="text-xs text-dark-400">
        Showing <span className="font-medium text-dark-200">{start}–{end}</span> of{' '}
        <span className="font-medium text-dark-200">{total.toLocaleString()}</span> results
      </p>

      <div className="flex items-center gap-1">
        <button
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
          className="w-8 h-8 rounded-lg flex items-center justify-center text-dark-400 hover:text-white hover:bg-white/08 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          style={{ background: page > 1 ? 'rgba(255,255,255,0.05)' : 'transparent' }}
        >
          <ChevronLeft size={16} />
        </button>

        {/* Page numbers */}
        {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
          let pageNum: number
          if (totalPages <= 5) {
            pageNum = i + 1
          } else if (page <= 3) {
            pageNum = i + 1
          } else if (page >= totalPages - 2) {
            pageNum = totalPages - 4 + i
          } else {
            pageNum = page - 2 + i
          }

          return (
            <button
              key={pageNum}
              onClick={() => onPageChange(pageNum)}
              className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-medium transition-all"
              style={pageNum === page ? {
                background: '#2563eb',
                color: 'white',
              } : {
                background: 'rgba(255,255,255,0.04)',
                color: 'rgba(255,255,255,0.5)',
              }}
            >
              {pageNum}
            </button>
          )
        })}

        <button
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages}
          className="w-8 h-8 rounded-lg flex items-center justify-center text-dark-400 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          style={{ background: page < totalPages ? 'rgba(255,255,255,0.05)' : 'transparent' }}
        >
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  )
}
