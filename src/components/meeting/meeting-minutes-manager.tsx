'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import {
  FileText,
  CheckCircle2,
  Clock,
  Plus,
  User,
  Calendar,
  AlertTriangle,
  Loader2,
  ChevronDown,
  X,
  Edit3,
} from 'lucide-react'
import { formatDate } from '@/lib/utils'

interface PIC {
  id: string
  name: string
  email: string
  division?: string | null
}

interface ActionItem {
  id: string
  description: string
  deadline: string | Date
  status: 'OPEN' | 'IN_PROGRESS' | 'DONE' | 'OVERDUE'
  notes?: string | null
  pic: PIC
}

interface Props {
  meetingId: string
  initialNotes?: string | null
  initialActionItems: ActionItem[]
  candidates: PIC[]
  canManage: boolean
  currentUserId: string
}

export function MeetingMinutesManager({
  meetingId,
  initialNotes = '',
  initialActionItems,
  candidates,
  canManage,
  currentUserId,
}: Props) {
  const router = useRouter()
  const [notes, setNotes] = useState(initialNotes ?? '')
  const [isEditingNotes, setIsEditingNotes] = useState(!initialNotes && canManage)
  const [savingNotes, setSavingNotes] = useState(false)

  const [actionItems, setActionItems] = useState<ActionItem[]>(initialActionItems)
  const [showAddForm, setShowAddForm] = useState(false)
  const [description, setDescription] = useState('')
  const [picId, setPicId] = useState(candidates[0]?.id ?? '')
  const [deadline, setDeadline] = useState('')
  const [initialTaskNotes, setInitialTaskNotes] = useState('')
  const [submittingAction, setSubmittingAction] = useState(false)

  // Modal Update Status & Catatan Action Item
  const [activeItem, setActiveItem] = useState<ActionItem | null>(null)
  const [modalStatus, setModalStatus] = useState<string>('OPEN')
  const [modalNotes, setModalNotes] = useState<string>('')
  const [savingItemProgress, setSavingItemProgress] = useState(false)

  // Save Notulensi
  const handleSaveNotes = async () => {
    setSavingNotes(true)
    try {
      const res = await fetch(`/api/meetings/${meetingId}/notes`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notes }),
      })
      if (!res.ok) throw new Error('Gagal menyimpan notulensi')
      toast.success('Notulensi rapat berhasil disimpan!')
      setIsEditingNotes(false)
      router.refresh()
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setSavingNotes(false)
    }
  }

  // Add Action Item
  const handleAddActionItem = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!description.trim()) {
      toast.error('Deskripsi tugas wajib diisi')
      return
    }
    if (!picId) {
      toast.error('Pilih PIC penanggung jawab tugas')
      return
    }
    if (!deadline) {
      toast.error('Tentukan batas waktu (deadline)')
      return
    }

    setSubmittingAction(true)
    try {
      const res = await fetch(`/api/meetings/${meetingId}/action-items`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          description,
          picId,
          deadline,
          notes: initialTaskNotes.trim() || undefined,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Gagal menambahkan tindak lanjut')

      toast.success(`Tindak lanjut berhasil ditugaskan ke ${data.actionItem.pic.name}!`)
      setActionItems((prev) => [...prev, data.actionItem])
      setDescription('')
      setDeadline('')
      setInitialTaskNotes('')
      setShowAddForm(false)
      router.refresh()
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setSubmittingAction(false)
    }
  }

  // Open modal to update status & notes
  const openProgressModal = (item: ActionItem, targetStatus?: string) => {
    setActiveItem(item)
    setModalStatus(targetStatus ?? item.status)
    setModalNotes(item.notes ?? '')
  }

  // Save updated progress & notes
  const handleSaveProgress = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!activeItem) return

    setSavingItemProgress(true)
    try {
      const res = await fetch(`/api/action-items/${activeItem.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: modalStatus,
          notes: modalNotes,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Gagal memperbarui progres')

      setActionItems((prev) =>
        prev.map((item) =>
          item.id === activeItem.id
            ? { ...item, status: modalStatus as any, notes: modalNotes }
            : item,
        ),
      )
      toast.success('Status dan catatan tindak lanjut berhasil diperbarui!')
      setActiveItem(null)
      router.refresh()
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setSavingItemProgress(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* 1. NOTULENSI RAPAT */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-blue-600" />
            <h2 className="font-bold text-gray-900 text-base">Notulensi Hasil Rapat</h2>
          </div>
          {canManage && !isEditingNotes && (
            <button
              onClick={() => setIsEditingNotes(true)}
              className="text-xs font-semibold text-blue-600 hover:text-blue-700 bg-blue-50 px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
            >
              {notes ? 'Edit Notulensi' : '+ Tulis Notulensi'}
            </button>
          )}
        </div>

        {isEditingNotes ? (
          <div className="space-y-3">
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={6}
              placeholder="Tuliskan ringkasan pembahasan, poin penting, dan keputusan yang dicapai dalam rapat ini..."
              className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 text-sm text-gray-900 bg-white placeholder-gray-400 outline-none"
            />
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleSaveNotes}
                disabled={savingNotes}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-xs disabled:opacity-60 transition-colors cursor-pointer"
              >
                {savingNotes && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                {savingNotes ? 'Menyimpan...' : 'Simpan Notulensi'}
              </button>
              {notes && (
                <button
                  type="button"
                  onClick={() => setIsEditingNotes(false)}
                  className="px-3 py-2 text-xs font-medium text-gray-600 hover:bg-gray-100 rounded-lg cursor-pointer"
                >
                  Batal
                </button>
              )}
            </div>
          </div>
        ) : notes ? (
          <div className="p-4 bg-slate-50 border border-slate-200/80 rounded-lg text-sm text-gray-800 whitespace-pre-wrap leading-relaxed">
            {notes}
          </div>
        ) : (
          <div className="py-6 text-center text-gray-400 text-xs">
            Belum ada notulensi yang dicatat untuk rapat ini.
          </div>
        )}
      </div>

      {/* 2. TINDAK LANJUT (ACTION ITEMS) */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-bold text-gray-900 text-base flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              Tindak Lanjut & Penugasan PIC ({actionItems.length})
            </h2>
            <p className="text-xs text-gray-500 mt-0.5">
              Tugas yang harus diselesaikan oleh peserta rapat beserta batas waktu dan catatan progres
            </p>
          </div>

          {canManage && !showAddForm && (
            <button
              onClick={() => setShowAddForm(true)}
              className="inline-flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-3.5 py-2 rounded-lg transition-colors shadow-xs cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              Tugaskan Tindak Lanjut
            </button>
          )}
        </div>

        {/* Form Tambah Tindak Lanjut */}
        {showAddForm && (
          <form
            onSubmit={handleAddActionItem}
            className="p-4 bg-blue-50/60 border border-blue-200 rounded-xl space-y-3.5 animate-in fade-in"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-blue-900 uppercase tracking-wide">
                Penugasan Tindak Lanjut Baru
              </h3>
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="text-gray-400 hover:text-gray-600 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Deskripsi Tugas / Action Item *
              </label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Contoh: Membuat draft revisi laporan evaluasi Q3"
                className="w-full px-3.5 py-2 rounded-lg border border-gray-300 text-xs text-gray-900 bg-white outline-none focus:border-blue-500"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Penanggung Jawab (PIC) *
                </label>
                <select
                  value={picId}
                  onChange={(e) => setPicId(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-lg border border-gray-300 text-xs text-gray-900 bg-white outline-none focus:border-blue-500"
                >
                  {candidates.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} {c.division ? `(${c.division})` : ''} · {c.email}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Batas Waktu (Deadline) *
                </label>
                <input
                  type="date"
                  value={deadline}
                  onChange={(e) => setDeadline(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                  className="w-full px-3.5 py-2 rounded-lg border border-gray-300 text-xs text-gray-900 bg-white outline-none focus:border-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Catatan Awal / Instruksi Tambahan (Opsional)
              </label>
              <textarea
                value={initialTaskNotes}
                onChange={(e) => setInitialTaskNotes(e.target.value)}
                rows={2}
                placeholder="Catatan panduan atau instruksi untuk PIC..."
                className="w-full px-3.5 py-2 rounded-lg border border-gray-300 text-xs text-gray-900 bg-white outline-none focus:border-blue-500"
              />
            </div>

            <div className="flex items-center gap-2 pt-1">
              <button
                type="submit"
                disabled={submittingAction}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-xs disabled:opacity-60 cursor-pointer"
              >
                {submittingAction && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                {submittingAction ? 'Menyimpan...' : 'Tugaskan ke PIC'}
              </button>
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="px-3 py-2 text-xs font-medium text-gray-600 hover:bg-gray-100 rounded-lg cursor-pointer"
              >
                Batal
              </button>
            </div>
          </form>
        )}

        {/* Daftar Action Items */}
        {actionItems.length === 0 ? (
          <div className="py-8 text-center text-gray-400 text-xs">
            Belum ada tindak lanjut yang ditentukan untuk rapat ini.
          </div>
        ) : (
          <div className="space-y-3 pt-1">
            {actionItems.map((item) => {
              const isOverdue =
                item.status !== 'DONE' && new Date(item.deadline) < new Date()
              const isMyItem = item.pic.id === currentUserId
              // Hanya PIC penanggung jawab yang berhak mengupdate status & catatan tugas
              const canEdit = isMyItem

              return (
                <div
                  key={item.id}
                  className={`p-4 rounded-xl border transition-all ${
                    item.status === 'DONE'
                      ? 'bg-slate-50/70 border-gray-200'
                      : isOverdue
                      ? 'bg-red-50/60 border-red-200'
                      : 'bg-white border-gray-200 shadow-2xs'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                    <div className="flex-1 min-w-0 space-y-1">
                      <p
                        className={`text-sm font-semibold ${
                          item.status === 'DONE'
                            ? 'text-gray-500 line-through'
                            : 'text-gray-900'
                        }`}
                      >
                        {item.description}
                      </p>
                      <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500">
                        <span className="flex items-center gap-1 text-gray-700 font-medium">
                          <User className="w-3.5 h-3.5 text-blue-600" />
                          PIC: <strong>{item.pic.name}</strong>
                          {item.pic.division && (
                            <span className="text-gray-400">({item.pic.division})</span>
                          )}
                          {isMyItem && (
                            <span className="text-[10px] bg-blue-100 text-blue-800 font-bold px-1.5 py-0.2 rounded ml-1">
                              Tugas Anda
                            </span>
                          )}
                        </span>
                        <span
                          className={`flex items-center gap-1 ${
                            isOverdue ? 'text-red-600 font-semibold' : 'text-gray-500'
                          }`}
                        >
                          <Calendar className="w-3.5 h-3.5" />
                          Deadline: {formatDate(item.deadline, 'dd MMMM yyyy')}
                          {isOverdue && ' (Terlambat!)'}
                        </span>
                      </div>
                    </div>

                    {/* Status & Actions */}
                    <div className="flex items-center gap-2 self-start flex-shrink-0">
                      <span
                        className={`text-xs px-2.5 py-1 rounded-full font-semibold ${
                          item.status === 'DONE'
                            ? 'bg-emerald-100 text-emerald-800'
                            : item.status === 'IN_PROGRESS'
                            ? 'bg-blue-100 text-blue-800'
                            : isOverdue
                            ? 'bg-red-100 text-red-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {item.status === 'DONE'
                          ? 'Selesai'
                          : item.status === 'IN_PROGRESS'
                          ? 'Sedang Dikerjakan'
                          : isOverdue
                          ? 'Terlambat'
                          : 'Belum Dikerjakan'}
                      </span>

                      {canEdit && (
                        <div className="flex items-center gap-1">
                          {item.status === 'OPEN' && (
                            <button
                              type="button"
                              onClick={() => openProgressModal(item, 'IN_PROGRESS')}
                              className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 transition-colors cursor-pointer"
                            >
                              Mulai Kerjakan
                            </button>
                          )}
                          {item.status === 'IN_PROGRESS' && (
                            <button
                              type="button"
                              onClick={() => openProgressModal(item, 'DONE')}
                              className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 transition-colors cursor-pointer"
                            >
                              Tandai Selesai
                            </button>
                          )}
                          {item.status === 'DONE' && (
                            <button
                              type="button"
                              onClick={() => openProgressModal(item, 'IN_PROGRESS')}
                              className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-gray-50 hover:bg-gray-100 text-gray-700 border border-gray-200 transition-colors cursor-pointer"
                            >
                              Buka Kembali
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => openProgressModal(item)}
                            title="Update Status / Catatan"
                            className="p-1.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-100 transition-colors cursor-pointer"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Kolom Catatan Progres / Hasil */}
                  <div className="mt-3 pt-2.5 border-t border-gray-100">
                    {item.notes ? (
                      <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-lg text-xs">
                        <div className="flex items-center justify-between gap-2 mb-1">
                          <span className="flex items-center gap-1.5 font-semibold text-slate-700">
                            <FileText className="w-3.5 h-3.5 text-blue-600" />
                            Catatan Hasil / Progres:
                          </span>
                          {canEdit && (
                            <button
                              type="button"
                              onClick={() => openProgressModal(item)}
                              className="text-[11px] text-blue-600 hover:text-blue-700 hover:underline font-medium cursor-pointer"
                            >
                              Edit Catatan
                            </button>
                          )}
                        </div>
                        <p className="text-slate-800 whitespace-pre-wrap leading-relaxed">
                          {item.notes}
                        </p>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between text-xs py-0.5">
                        <span className="text-gray-400 italic">
                          Belum ada catatan progres hasil pengerjaan dari PIC.
                        </span>
                        {canEdit && (
                          <button
                            type="button"
                            onClick={() => openProgressModal(item)}
                            className="text-blue-600 hover:text-blue-700 hover:underline font-medium cursor-pointer"
                          >
                            + Tambah Catatan
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Modal Update Status & Catatan Action Item */}
      {activeItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-xl border border-gray-200 p-6 space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div>
                <h3 className="font-bold text-gray-900 text-base">Update Status & Catatan Tindak Lanjut</h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  PIC: <strong>{activeItem.pic.name}</strong>
                </p>
              </div>
              <button
                type="button"
                onClick={() => setActiveItem(null)}
                className="text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveProgress} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Deskripsi Tugas:
                </label>
                <p className="text-xs text-gray-800 p-2.5 bg-gray-50 border border-gray-200 rounded-lg">
                  {activeItem.description}
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
                  placeholder="Tuliskan sampai mana proses pengerjaan, dokumen/link hasil kerja, atau kendala yang dihadapi..."
                  className="w-full px-3.5 py-2.5 rounded-lg border border-gray-300 text-xs text-gray-900 bg-white placeholder-gray-400 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
                <p className="text-[11px] text-gray-500 mt-1">
                  Catatan ini akan tersimpan dan dapat dibaca oleh tim rapat untuk memantau kemajuan.
                </p>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setActiveItem(null)}
                  className="px-4 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={savingItemProgress}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-xs disabled:opacity-60 transition-colors cursor-pointer"
                >
                  {savingItemProgress && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  {savingItemProgress ? 'Menyimpan...' : 'Simpan Progres'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
