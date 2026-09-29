'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import {
  CheckCircle2,
  Clock,
  AlertTriangle,
  Loader2,
  FileText,
  X,
  Edit3,
  Calendar,
} from 'lucide-react'
import Link from 'next/link'
import { formatDate, actionItemStatusLabel } from '@/lib/utils'

interface ActionItem {
  id: string
  description: string
  deadline: Date | string
  status: string
  notes?: string | null
  completedAt?: Date | string | null
  meeting: { booking: { id: string; title: string } }
}

const statusIcon = (s: string) => {
  if (s === 'DONE') return <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />
  if (s === 'OVERDUE') return <AlertTriangle className="w-4 h-4 text-red-500 flex-shrink-0" />
  if (s === 'IN_PROGRESS') return <Clock className="w-4 h-4 text-blue-500 flex-shrink-0" />
  return <Clock className="w-4 h-4 text-yellow-500 flex-shrink-0" />
}

const statusBadge = (s: string) => {
  if (s === 'DONE') return 'bg-green-100 text-green-700 border-green-200'
  if (s === 'OVERDUE') return 'bg-red-100 text-red-700 border-red-200'
  if (s === 'IN_PROGRESS') return 'bg-blue-100 text-blue-700 border-blue-200'
  return 'bg-yellow-100 text-yellow-700 border-yellow-200'
}

const NEXT_STATUS: Record<string, { value: string; label: string; color: string }[]> = {
  OPEN: [{ value: 'IN_PROGRESS', label: 'Mulai Kerjakan', color: 'bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200' }],
  IN_PROGRESS: [{ value: 'DONE', label: 'Tandai Selesai', color: 'bg-green-50 text-green-700 hover:bg-green-100 border border-green-200' }],
  DONE: [{ value: 'IN_PROGRESS', label: 'Buka Kembali', color: 'bg-gray-50 text-gray-700 hover:bg-gray-100 border border-gray-200' }],
  OVERDUE: [{ value: 'IN_PROGRESS', label: 'Mulai Kerjakan', color: 'bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200' }],
}

function ActionItemCard({ item }: { item: ActionItem }) {
  const router = useRouter()
  const [status, setStatus] = useState(item.status)
  const [notes, setNotes] = useState(item.notes ?? '')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [modalStatus, setModalStatus] = useState(item.status)
  const [modalNotes, setModalNotes] = useState(item.notes ?? '')
  const [saving, setSaving] = useState(false)

  const openUpdateModal = (targetStatus?: string) => {
    setModalStatus(targetStatus ?? status)
    setModalNotes(notes)
    setIsModalOpen(true)
  }

  const handleSaveProgress = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      const res = await fetch(`/api/action-items/${item.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: modalStatus,
          notes: modalNotes,
        }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? 'Gagal memperbarui progres')

      setStatus(modalStatus)
      setNotes(modalNotes)
      setIsModalOpen(false)
      toast.success('Status dan catatan tindak lanjut berhasil disimpan!')
      router.refresh()
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setSaving(false)
    }
  }

  const actions = NEXT_STATUS[status] ?? []
  const isOverdue = status !== 'DONE' && new Date(item.deadline) < new Date()

  return (
    <>
      <div className={`bg-white rounded-xl border p-5 transition-shadow hover:shadow-xs ${isOverdue && status !== 'DONE' ? 'border-red-200' : 'border-gray-200'}`}>
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div className="flex items-start gap-3 flex-1 min-w-0">
            <div className="mt-0.5">{statusIcon(isOverdue && status !== 'DONE' ? 'OVERDUE' : status)}</div>
            <div className="flex-1 min-w-0">
              <p className={`font-semibold text-sm ${status === 'DONE' ? 'text-gray-500 line-through' : 'text-gray-900'}`}>
                {item.description}
              </p>
              <Link
                href={`/bookings/${item.meeting.booking.id}` as any}
                className="text-xs text-blue-600 hover:underline mt-1 inline-block truncate max-w-full font-medium"
              >
                📋 {item.meeting.booking.title}
              </Link>
              <p className={`text-xs mt-1 flex items-center gap-1.5 ${isOverdue && status !== 'DONE' ? 'text-red-600 font-semibold' : 'text-gray-500'}`}>
                <Calendar className="w-3.5 h-3.5" />
                Deadline: {formatDate(item.deadline, 'dd MMMM yyyy')}
                {isOverdue && status !== 'DONE' && ' (Terlambat!)'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0 self-start">
            <span className={`text-xs px-2.5 py-1 rounded-full font-semibold border ${statusBadge(isOverdue && status !== 'DONE' ? 'OVERDUE' : status)}`}>
              {actionItemStatusLabel(isOverdue && status !== 'DONE' ? 'OVERDUE' : status)}
            </span>

            {/* Tombol Aksi Cepat / Update Modal */}
            <div className="flex items-center gap-1.5">
              {actions.map((a) => (
                <button
                  key={a.value}
                  type="button"
                  onClick={() => openUpdateModal(a.value)}
                  className={`text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${a.color}`}
                >
                  {a.label}
                </button>
              ))}
              <button
                type="button"
                onClick={() => openUpdateModal()}
                title="Perbarui Catatan & Status"
                className="text-xs font-medium px-2.5 py-1.5 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-100 transition-colors flex items-center gap-1 cursor-pointer"
              >
                <Edit3 className="w-3 h-3 text-gray-500" />
                Catatan
              </button>
            </div>
          </div>
        </div>

        {/* Kolom Catatan Progres / Hasil */}
        <div className="mt-3.5 pt-3 border-t border-gray-100">
          {notes ? (
            <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-lg">
              <div className="flex items-center justify-between gap-2 mb-1.5">
                <span className="flex items-center gap-1.5 text-xs font-semibold text-slate-700">
                  <FileText className="w-3.5 h-3.5 text-blue-600" />
                  Catatan Progres / Hasil Pengerjaan:
                </span>
                <button
                  type="button"
                  onClick={() => openUpdateModal()}
                  className="text-[11px] font-medium text-blue-600 hover:text-blue-700 hover:underline cursor-pointer"
                >
                  Edit Catatan
                </button>
              </div>
              <p className="text-xs text-slate-800 whitespace-pre-wrap leading-relaxed">
                {notes}
              </p>
            </div>
          ) : (
            <div className="flex items-center justify-between text-xs py-0.5">
              <span className="text-gray-400 italic">
                Belum ada catatan progres pengerjaan
              </span>
              <button
                type="button"
                onClick={() => openUpdateModal()}
                className="text-blue-600 hover:text-blue-700 hover:underline font-medium cursor-pointer inline-flex items-center gap-1"
              >
                + Tambah Catatan Hasil
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Modal Update Status & Catatan */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-xl border border-gray-200 p-6 space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div>
                <h3 className="font-bold text-gray-900 text-base">Update Status & Catatan Hasil</h3>
                <p className="text-xs text-gray-500 mt-0.5 truncate max-w-sm">
                  {item.meeting.booking.title}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveProgress} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Deskripsi Tindak Lanjut:
                </label>
                <p className="text-xs text-gray-800 p-2.5 bg-gray-50 border border-gray-200 rounded-lg">
                  {item.description}
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                  Pilih Status Progres *
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { val: 'OPEN', label: 'Belum Dikerjakan', activeColor: 'bg-amber-50 border-amber-400 text-amber-900' },
                    { val: 'IN_PROGRESS', label: 'Sedang Dikerjakan', activeColor: 'bg-blue-50 border-blue-400 text-blue-900' },
                    { val: 'DONE', label: 'Selesai', activeColor: 'bg-emerald-50 border-emerald-400 text-emerald-900' },
                  ].map((opt) => (
                    <button
                      key={opt.val}
                      type="button"
                      onClick={() => setModalStatus(opt.val)}
                      className={`text-xs font-semibold py-2.5 px-2 rounded-lg border text-center transition-all cursor-pointer ${
                        modalStatus === opt.val
                          ? `${opt.activeColor} ring-2 ring-offset-1 ring-blue-400`
                          : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-gray-700">
                    Catatan Hasil Pengerjaan / Progress
                  </label>
                  <span className="text-[11px] text-gray-400">Opsional namun sangat dianjurkan</span>
                </div>
                <textarea
                  value={modalNotes}
                  onChange={(e) => setModalNotes(e.target.value)}
                  rows={4}
                  placeholder="Tuliskan sampai mana proses pengerjaan, dokumen/link hasil kerja, atau kendala yang dihadapi (contoh: Dokumen telah diserahkan ke bagian hukum, menunggu validasi)..."
                  className="w-full px-3.5 py-2.5 rounded-lg border border-gray-300 text-xs text-gray-900 bg-white placeholder-gray-400 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
                <p className="text-[11px] text-gray-500 mt-1">
                  Catatan ini akan dapat dilihat oleh penyelenggara rapat dan peserta lain untuk memantau kemajuan.
                </p>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-xs disabled:opacity-60 transition-colors cursor-pointer"
                >
                  {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  {saving ? 'Menyimpan...' : 'Simpan Progres'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}

export function ActionItemList({ items }: { items: ActionItem[] }) {
  const open = items.filter((i) => i.status === 'OPEN')
  const inProgress = items.filter((i) => i.status === 'IN_PROGRESS')
  const overdue = items.filter((i) => i.status === 'OVERDUE' || (i.status !== 'DONE' && new Date(i.deadline) < new Date()))
  const done = items.filter((i) => i.status === 'DONE')

  if (items.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 py-16 text-center">
        <CheckCircle2 className="w-12 h-12 text-gray-300 mx-auto mb-3" />
        <p className="text-gray-500 font-medium">Tidak ada tindak lanjut</p>
        <p className="text-sm text-gray-400 mt-1">Anda belum memiliki action item yang ditugaskan</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {overdue.length > 0 && (
        <section>
          <h2 className="text-xs font-bold text-red-600 uppercase tracking-wide mb-2.5 flex items-center gap-1.5">
            <AlertTriangle className="w-4 h-4" />
            Terlambat ({overdue.length})
          </h2>
          <div className="space-y-3">
            {overdue.map((item) => <ActionItemCard key={item.id} item={item} />)}
          </div>
        </section>
      )}
      {inProgress.length > 0 && (
        <section>
          <h2 className="text-xs font-bold text-blue-600 uppercase tracking-wide mb-2.5 flex items-center gap-1.5">
            <Clock className="w-4 h-4" />
            Sedang Dikerjakan ({inProgress.length})
          </h2>
          <div className="space-y-3">
            {inProgress.map((item) => <ActionItemCard key={item.id} item={item} />)}
          </div>
        </section>
      )}
      {open.length > 0 && (
        <section>
          <h2 className="text-xs font-bold text-yellow-600 uppercase tracking-wide mb-2.5 flex items-center gap-1.5">
            <Clock className="w-4 h-4" />
            Belum Dikerjakan ({open.length})
          </h2>
          <div className="space-y-3">
            {open.map((item) => <ActionItemCard key={item.id} item={item} />)}
          </div>
        </section>
      )}
      {done.length > 0 && (
        <section>
          <h2 className="text-xs font-bold text-green-600 uppercase tracking-wide mb-2.5 flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4" />
            Selesai ({done.length})
          </h2>
          <div className="space-y-3">
            {done.map((item) => <ActionItemCard key={item.id} item={item} />)}
          </div>
        </section>
      )}
    </div>
  )
}
