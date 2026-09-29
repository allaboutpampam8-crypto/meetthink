'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { CheckCircle2, XCircle, RotateCcw, Loader2, Utensils } from 'lucide-react'

interface Props {
  bookingId: string
  participantCount?: number
}

export function ApprovalActionForm({ bookingId, participantCount }: Props) {
  const router = useRouter()
  const [action, setAction] = useState<'APPROVE' | 'REJECT' | 'REVISE' | null>(null)
  const [comment, setComment] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async () => {
    if (!action) return
    if ((action === 'REJECT' || action === 'REVISE') && !comment.trim()) {
      toast.error('Komentar/alasan wajib diisi untuk penolakan atau revisi')
      return
    }

    setLoading(true)
    try {
      const res = await fetch(`/api/approvals/${bookingId}/action`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, comment: comment.trim() || undefined }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Terjadi kesalahan')

      toast.success(
        action === 'APPROVE' ? 'Booking berhasil disetujui' :
        action === 'REJECT' ? 'Booking berhasil ditolak' : 'Revisi berhasil diminta'
      )
      router.refresh()
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mt-6 pt-6 border-t border-gray-100 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold text-gray-900">Tindakan Anda</p>
          {participantCount && (
            <p className="text-xs text-gray-500 mt-0.5">
              Total peserta rapat: <strong>{participantCount} orang</strong> (estimasi {participantCount} porsi konsumsi).
            </p>
          )}
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex flex-wrap gap-2">
        {([
          { key: 'APPROVE', label: 'Setujui', icon: CheckCircle2, color: 'border-green-300 text-green-700 bg-green-50 hover:bg-green-100' },
          { key: 'REJECT', label: 'Tolak', icon: XCircle, color: 'border-red-300 text-red-700 bg-red-50 hover:bg-red-100' },
          { key: 'REVISE', label: 'Minta Revisi', icon: RotateCcw, color: 'border-yellow-300 text-yellow-700 bg-yellow-50 hover:bg-yellow-100' },
        ] as const).map(({ key, label, icon: Icon, color }) => (
          <button
            key={key}
            type="button"
            onClick={() => setAction(action === key ? null : key)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg border text-sm font-medium transition-colors
              ${action === key ? color.replace('hover:', '') : 'border-gray-200 text-gray-600 bg-white hover:bg-gray-50'}
            `}
          >
            <Icon className="w-4 h-4" />
            {label}
          </button>
        ))}
      </div>

      {/* Comment textarea */}
      {action && (
        <div className="space-y-3 pt-1">
          {action === 'APPROVE' && participantCount && (
            <div className="flex items-center gap-2 p-2.5 rounded-lg bg-green-50 border border-green-200 text-xs text-green-800">
              <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0" />
              <span>
                Dengan menyetujui, peminjaman ruang dan penyediaan konsumsi untuk <strong>{participantCount} orang</strong> akan diproses ke tahap berikutnya.
              </span>
            </div>
          )}

          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder={
              action === 'APPROVE'
                ? 'Catatan tambahan perihal fasilitas/konsumsi (opsional)...'
                : 'Alasan penolakan / catatan revisi (wajib)...'
            }
            rows={3}
            className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 text-sm text-gray-900 bg-white placeholder-gray-400 outline-none resize-none"
          />
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleSubmit}
              disabled={loading}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-white font-semibold text-sm transition-colors disabled:opacity-60
                ${action === 'APPROVE' ? 'bg-green-600 hover:bg-green-700' :
                  action === 'REJECT' ? 'bg-red-600 hover:bg-red-700' : 'bg-yellow-600 hover:bg-yellow-700'}
              `}
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              Konfirmasi{' '}
              {action === 'APPROVE' ? 'Persetujuan' : action === 'REJECT' ? 'Penolakan' : 'Revisi'}
            </button>
            <button
              type="button"
              onClick={() => setAction(null)}
              className="px-4 py-2.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 text-sm font-medium"
            >
              Batal
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
