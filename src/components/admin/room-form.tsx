'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import Link from 'next/link'
import { ArrowLeft, Plus, X, Loader2 } from 'lucide-react'

const schema = z.object({
  name: z.string().min(1, 'Nama ruang wajib diisi'),
  code: z.string().min(1, 'Kode ruang wajib diisi'),
  location: z.string().min(1, 'Lokasi wajib diisi'),
  capacity: z.number({ invalid_type_error: 'Kapasitas harus angka' }).min(1, 'Kapasitas minimal 1'),
  description: z.string().optional(),
  isActive: z.boolean(),
})

type RoomFormData = z.infer<typeof schema>

interface RoomFormProps {
  defaultValues?: Partial<RoomFormData> & { id?: string; facilities?: string[] }
  mode: 'create' | 'edit'
}

const inputCls = 'w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 text-sm text-gray-900 bg-white placeholder-gray-400 outline-none transition-colors'
const inputErrCls = 'w-full px-4 py-2.5 rounded-lg border border-red-400 focus:ring-2 focus:ring-red-100 text-sm text-gray-900 bg-white placeholder-gray-400 outline-none'
const labelCls = 'block text-sm font-medium text-gray-700 mb-1.5'

export function RoomForm({ defaultValues, mode }: RoomFormProps) {
  const router = useRouter()
  const [facilities, setFacilities] = useState<string[]>(defaultValues?.facilities ?? [])
  const [facilityInput, setFacilityInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const { register, handleSubmit, formState: { errors } } = useForm<RoomFormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: defaultValues?.name ?? '',
      code: defaultValues?.code ?? '',
      location: defaultValues?.location ?? '',
      capacity: defaultValues?.capacity ?? 10,
      description: defaultValues?.description ?? '',
      isActive: defaultValues?.isActive ?? true,
    },
  })

  const addFacility = () => {
    const trimmed = facilityInput.trim()
    if (trimmed && !facilities.includes(trimmed)) {
      setFacilities([...facilities, trimmed])
      setFacilityInput('')
    }
  }

  const removeFacility = (name: string) => {
    setFacilities(facilities.filter((f) => f !== name))
  }

  const onSubmit = async (data: RoomFormData) => {
    setLoading(true)
    try {
      const url = mode === 'create' ? '/api/rooms' : `/api/rooms/${defaultValues?.id}`
      const method = mode === 'create' ? 'POST' : 'PATCH'
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...data, facilities }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? 'Terjadi kesalahan')
      toast.success(mode === 'create' ? 'Ruang berhasil ditambahkan' : 'Ruang berhasil diperbarui')
      router.push('/admin/rooms')
      router.refresh()
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm('Yakin ingin menghapus ruang ini? Tindakan ini tidak dapat dibatalkan.')) return
    setDeleting(true)
    try {
      const res = await fetch(`/api/rooms/${defaultValues?.id}`, { method: 'DELETE' })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? 'Gagal menghapus ruang')
      toast.success('Ruang berhasil dihapus')
      router.push('/admin/rooms')
      router.refresh()
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/admin/rooms" className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700">
          <ArrowLeft className="w-4 h-4" />
          Kembali
        </Link>
      </div>

      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          {mode === 'create' ? 'Tambah Ruang Rapat' : 'Edit Ruang Rapat'}
        </h1>
        <p className="text-gray-500 mt-1">
          {mode === 'create' ? 'Tambahkan ruang baru ke sistem' : 'Perbarui informasi ruang rapat'}
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        {/* Info Dasar */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
          <h2 className="font-semibold text-gray-900">Informasi Ruang</h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Nama Ruang *</label>
              <input {...register('name')} placeholder="Contoh: Ruang Rapat A" className={errors.name ? inputErrCls : inputCls} />
              {errors.name && <p className="mt-1 text-xs text-red-500">{errors.name.message}</p>}
            </div>
            <div>
              <label className={labelCls}>Kode Ruang *</label>
              <input {...register('code')} placeholder="Contoh: RR-A" className={errors.code ? inputErrCls : inputCls} />
              {errors.code && <p className="mt-1 text-xs text-red-500">{errors.code.message}</p>}
            </div>
          </div>

          <div>
            <label className={labelCls}>Lokasi *</label>
            <input {...register('location')} placeholder="Contoh: Lantai 3, Gedung A" className={errors.location ? inputErrCls : inputCls} />
            {errors.location && <p className="mt-1 text-xs text-red-500">{errors.location.message}</p>}
          </div>

          <div>
            <label className={labelCls}>Kapasitas (orang) *</label>
            <input
              type="number"
              {...register('capacity', { valueAsNumber: true })}
              placeholder="10"
              min="1"
              className={errors.capacity ? inputErrCls : inputCls}
            />
            {errors.capacity && <p className="mt-1 text-xs text-red-500">{errors.capacity.message}</p>}
          </div>

          <div>
            <label className={labelCls}>Deskripsi</label>
            <textarea
              {...register('description')}
              rows={3}
              placeholder="Deskripsi tambahan ruang (opsional)"
              className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 text-sm text-gray-900 bg-white placeholder-gray-400 outline-none resize-none"
            />
          </div>

          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="isActive"
              {...register('isActive')}
              className="w-4 h-4 rounded border-gray-300 text-blue-600"
            />
            <label htmlFor="isActive" className="text-sm font-medium text-gray-700">
              Ruang Aktif (dapat dibooking)
            </label>
          </div>
        </div>

        {/* Fasilitas */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
          <h2 className="font-semibold text-gray-900">Fasilitas</h2>
          <div className="flex gap-2">
            <input
              type="text"
              value={facilityInput}
              onChange={(e) => setFacilityInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addFacility() } }}
              placeholder="Contoh: Proyektor, AC, Whiteboard..."
              className="flex-1 px-4 py-2.5 rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 text-sm text-gray-900 bg-white placeholder-gray-400 outline-none"
            />
            <button
              type="button"
              onClick={addFacility}
              className="flex items-center gap-1.5 px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm font-medium transition-colors"
            >
              <Plus className="w-4 h-4" />
              Tambah
            </button>
          </div>

          {facilities.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {facilities.map((f) => (
                <span
                  key={f}
                  className="flex items-center gap-1.5 bg-blue-50 text-blue-700 px-3 py-1.5 rounded-full text-sm"
                >
                  {f}
                  <button type="button" onClick={() => removeFacility(f)} className="hover:text-blue-900">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </span>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-400">Belum ada fasilitas ditambahkan</p>
          )}
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
              {loading ? 'Menyimpan...' : mode === 'create' ? 'Simpan Ruang' : 'Perbarui Ruang'}
            </button>
            <Link
              href="/admin/rooms"
              className="px-5 py-2.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 font-medium text-sm"
            >
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
              {deleting ? 'Menghapus...' : 'Hapus Ruang'}
            </button>
          )}
        </div>
      </form>
    </div>
  )
}
