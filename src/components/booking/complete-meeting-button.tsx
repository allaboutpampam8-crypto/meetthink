'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { CheckCircle2, Loader2, X, AlertCircle } from 'lucide-react'

interface Props {
  bookingId: string
  status: string
  canManage: boolean
  isTimePassed?: boolean
}

export function CompleteMeetingButton({
  bookingId,
  status,
  canManage,
  isTimePassed = false,
}: Props) {
  const router = useRouter()
  const [showConfirm, setShowConfirm] = useState(false)
  const [loading, setLoading] = useState(false)

  const isCompleted = status === 'COMPLETED'

  if (isCompleted) {
    return (
      <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 text-slate-700 border border-slate-300 text-xs font-semibold">
        <CheckCircle2 className="w-3.5 h-3.5 text-slate-600" />
        Rapat Selesai Dilaksanakan
      </div>
    )
  }

  if (status !== 'APPROVED' || !canManage) {
    return null
  }

  const handleComplete = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/bookings/${bookingId}/complete`, {
        method: 'POST',
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Gagal menyelesaikan rapat')

      toast.success('Rapat berhasil ditandai selesai dilaksanakan!')
      setShowConfirm(false)
      router.refresh()
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setShowConfirm(true)}
        className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold shadow-xs transition-colors cursor-pointer ${
          isTimePassed
            ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
            : 'bg-white hover:bg-gray-50 text-gray-700 border border-gray-300'
        }`}
      >
        <CheckCircle2 className="w-3.5 h-3.5" />
        Selesaikan Rapat
      </button>

      {/* Confirmation Modal */}
      {showConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-xl border border-gray-200 p-6 space-y-4">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 text-base">Konfirmasi Selesai Rapat</h3>
                  <p className="text-xs text-gray-500">Tandai agenda rapat telah selesai</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowConfirm(false)}
                className="text-gray-400 hover:text-gray-600 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700 space-y-1">
              <p className="font-semibold text-slate-800">
                Apakah rapat ini telah selesai dilaksanakan?
              </p>
              <p className="text-slate-600 leading-relaxed">
                Status booking akan diperbarui menjadi <strong>Selesai (COMPLETED)</strong> dan notulensi rapat akan difinalisasi.
              </p>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-100">
              <button
                type="button"
                onClick={() => setShowConfirm(false)}
                className="px-4 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-100 rounded-lg cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleComplete}
                disabled={loading}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-xs disabled:opacity-60 transition-colors cursor-pointer"
              >
                {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                {loading ? 'Memproses...' : 'Ya, Tandai Selesai'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
