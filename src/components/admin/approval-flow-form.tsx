'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import Link from 'next/link'
import { ArrowLeft, Plus, X, Loader2, GripVertical } from 'lucide-react'

interface ApproverOption { id: string; name: string; division?: string | null }

interface Step {
  level: number
  label: string
  approverId: string
  deadlineHours: number
}

interface ApprovalFlowFormProps {
  mode: 'create' | 'edit'
  approvers: ApproverOption[]
  divisions?: string[]
  defaultValues?: {
    id?: string
    name?: string
    description?: string
    division?: string | null
    isDefault?: boolean
    isActive?: boolean
    steps?: Step[]
  }
}

const inputCls = 'w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 text-sm text-gray-900 bg-white placeholder-gray-400 outline-none transition-colors'
const labelCls = 'block text-sm font-medium text-gray-700 mb-1.5'

const DEFAULT_DIVISIONS = [
  'IT',
  'Marketing',
  'HRD',
  'Keuangan',
  'Operasional',
  'General Affairs',
]

export function ApprovalFlowForm({ mode, approvers, divisions = [], defaultValues }: ApprovalFlowFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [name, setName] = useState(defaultValues?.name ?? '')
  const [description, setDescription] = useState(defaultValues?.description ?? '')
  const [division, setDivision] = useState(defaultValues?.division ?? '')
  const [customDivision, setCustomDivision] = useState('')
  const [isCustomDivision, setIsCustomDivision] = useState(false)
  const [isDefault, setIsDefault] = useState(defaultValues?.isDefault ?? false)
  const [isActive, setIsActive] = useState(defaultValues?.isActive ?? true)
  const [steps, setSteps] = useState<Step[]>(
    defaultValues?.steps ?? [{ level: 1, label: 'Persetujuan Level 1', approverId: '', deadlineHours: 24 }]
  )

  // Gabungkan divisi yang ada dari database + default
  const allDivisions = Array.from(new Set([...DEFAULT_DIVISIONS, ...divisions].filter(Boolean)))

  const addStep = () => {
    setSteps([...steps, {
      level: steps.length + 1,
      label: `Persetujuan Level ${steps.length + 1}`,
      approverId: '',
      deadlineHours: 24,
    }])
  }

  const removeStep = (idx: number) => {
    const updated = steps.filter((_, i) => i !== idx).map((s, i) => ({ ...s, level: i + 1 }))
    setSteps(updated)
  }

  const updateStep = (idx: number, field: keyof Step, value: string | number) => {
    const updated = [...steps]
    updated[idx] = { ...updated[idx], [field]: value }
    setSteps(updated)
  }

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) { toast.error('Nama alur wajib diisi'); return }
    if (steps.some((s) => !s.approverId)) { toast.error('Semua langkah harus memiliki approver'); return }

    const targetDivision = isCustomDivision
      ? customDivision.trim()
      : division.trim()

    setLoading(true)
    try {
      const url = mode === 'create' ? '/api/approval-flows' : `/api/approval-flows/${defaultValues?.id}`
      const method = mode === 'create' ? 'POST' : 'PATCH'
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          description,
          division: targetDivision || null,
          isDefault,
          isActive,
          steps,
        }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? 'Terjadi kesalahan')
      toast.success(mode === 'create' ? 'Alur approval berhasil dibuat' : 'Alur approval berhasil diperbarui')
      router.push('/admin/approval-config')
      router.refresh()
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm('Yakin ingin menghapus alur ini?')) return
    setDeleting(true)
    try {
      const res = await fetch(`/api/approval-flows/${defaultValues?.id}`, { method: 'DELETE' })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? 'Gagal menghapus')
      toast.success('Alur approval berhasil dihapus')
      router.push('/admin/approval-config')
      router.refresh()
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <Link href="/admin/approval-config" className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700">
        <ArrowLeft className="w-4 h-4" />
        Kembali ke Konfigurasi Approval
      </Link>

      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          {mode === 'create' ? 'Tambah Alur Approval' : 'Edit Alur Approval'}
        </h1>
        <p className="text-gray-500 mt-1">Konfigurasi langkah-langkah persetujuan booking</p>
      </div>

      <form onSubmit={onSubmit} className="space-y-5">
        {/* Info Alur */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
          <h2 className="font-semibold text-gray-900">Informasi Alur</h2>

          <div>
            <label className={labelCls}>Nama Alur *</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Contoh: Alur Standar 2 Level"
              className={inputCls}
            />
          </div>

          <div>
            <label className={labelCls}>Deskripsi</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              placeholder="Deskripsi singkat alur approval (opsional)"
              className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 text-sm text-gray-900 bg-white placeholder-gray-400 outline-none resize-none"
            />
          </div>

          {/* Target Divisi */}
          <div>
            <label className={labelCls}>Target Divisi / Unit Kerja</label>
            <div className="space-y-2">
              <select
                value={isCustomDivision ? '__CUSTOM__' : division}
                onChange={(e) => {
                  if (e.target.value === '__CUSTOM__') {
                    setIsCustomDivision(true)
                  } else {
                    setIsCustomDivision(false)
                    setDivision(e.target.value)
                  }
                }}
                className={inputCls}
              >
                <option value="">Semua Divisi (Alur Umum / Default)</option>
                {allDivisions.map((d) => (
                  <option key={d} value={d}>
                    Divisi {d}
                  </option>
                ))}
                <option value="__CUSTOM__">+ Tulis Divisi Lainnya...</option>
              </select>

              {isCustomDivision && (
                <input
                  type="text"
                  placeholder="Ketik nama divisi target (misal: HRD, Keuangan, dll.)"
                  value={customDivision}
                  onChange={(e) => setCustomDivision(e.target.value)}
                  className={inputCls}
                />
              )}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Jika dipilih divisi tertentu, pengajuan booking dari pegawai di divisi tersebut akan otomatis dialihkan ke alur approval ini. Kosongkan jika berlaku untuk umum/semua divisi.
            </p>
          </div>

          <div className="flex items-center gap-6">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={isDefault}
                onChange={(e) => setIsDefault(e.target.checked)}
                className="w-4 h-4 rounded border-gray-300 text-blue-600"
              />
              <span className="text-sm font-medium text-gray-700">Jadikan alur default</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                className="w-4 h-4 rounded border-gray-300 text-blue-600"
              />
              <span className="text-sm font-medium text-gray-700">Alur aktif</span>
            </label>
          </div>
        </div>

        {/* Steps */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-gray-900">Langkah Approval ({steps.length})</h2>
            <button
              type="button"
              onClick={addStep}
              className="flex items-center gap-1.5 text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              <Plus className="w-4 h-4" />
              Tambah Langkah
            </button>
          </div>

          <div className="space-y-3">
            {steps.map((step, idx) => (
              <div key={idx} className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg">
                <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0 mt-1">
                  <span className="text-xs font-bold text-blue-700">{step.level}</span>
                </div>

                <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="sm:col-span-1">
                    <label className="block text-xs font-medium text-gray-600 mb-1">Label</label>
                    <input
                      value={step.label}
                      onChange={(e) => updateStep(idx, 'label', e.target.value)}
                      placeholder="Contoh: Kepala Divisi"
                      className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:border-blue-500 text-sm text-gray-900 bg-white outline-none"
                    />
                  </div>
                  <div className="sm:col-span-1">
                    <label className="block text-xs font-medium text-gray-600 mb-1">Approver *</label>
                    <select
                      value={step.approverId}
                      onChange={(e) => updateStep(idx, 'approverId', e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:border-blue-500 text-sm text-gray-900 bg-white outline-none"
                    >
                      <option value="">-- Pilih approver --</option>
                      {approvers.map((a) => (
                        <option key={a.id} value={a.id}>
                          {a.name}{a.division ? ` (${a.division})` : ''}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Deadline (jam)</label>
                    <input
                      type="number"
                      min="1"
                      value={step.deadlineHours}
                      onChange={(e) => updateStep(idx, 'deadlineHours', Number(e.target.value))}
                      className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:border-blue-500 text-sm text-gray-900 bg-white outline-none"
                    />
                  </div>
                </div>

                {steps.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeStep(idx)}
                    className="text-gray-400 hover:text-red-500 transition-colors mt-1 flex-shrink-0"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-semibold px-6 py-2.5 rounded-lg transition-colors"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              {loading ? 'Menyimpan...' : mode === 'create' ? 'Simpan Alur' : 'Perbarui Alur'}
            </button>
            <Link href="/admin/approval-config" className="px-5 py-2.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 font-medium text-sm">
              Batal
            </Link>
          </div>

          {mode === 'edit' && (
            <button
              type="button"
              onClick={handleDelete}
              disabled={deleting}
              className="flex items-center gap-2 text-red-600 hover:text-red-700 text-sm font-medium px-4 py-2.5 rounded-lg hover:bg-red-50 transition-colors"
            >
              {deleting && <Loader2 className="w-4 h-4 animate-spin" />}
              {deleting ? 'Menghapus...' : 'Hapus Alur'}
            </button>
          )}
        </div>
      </form>
    </div>
  )
}
