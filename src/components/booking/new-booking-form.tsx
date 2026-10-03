'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { Loader2, X, Plus, AlertTriangle, CheckCircle2, Calendar as CalendarIcon, Info, MapPin } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { RoomDayTimeline } from '@/components/booking/room-day-timeline'
import { formatTime } from '@/lib/utils'

const schema = z.object({
  title: z.string().min(1, 'Judul wajib diisi'),
  agenda: z.string().optional(),
  roomId: z.string().min(1, 'Ruang wajib dipilih'),
  date: z.string().min(1, 'Tanggal wajib diisi'),
  startTime: z.string().min(1, 'Jam mulai wajib diisi'),
  endTime: z.string().min(1, 'Jam selesai wajib diisi'),
  notes: z.string().optional(),
})

type FormData = z.infer<typeof schema>

interface Room {
  id: string
  name: string
  code: string
  location: string
  capacity: number
  facilities: { id: string; name: string }[]
}

interface UserOption {
  id: string
  name: string
  email: string
  division?: string | null
}

interface Props {
  rooms: Room[]
  users: UserOption[]
  currentUserId: string
  onOpenCalendar?: () => void
}

export function NewBookingForm(props: Props) {
  return (
    <Suspense fallback={<div className="p-8 text-center text-gray-400">Memuat formulir...</div>}>
      <BookingFormContent {...props} />
    </Suspense>
  )
}

function BookingFormContent({ rooms, users, currentUserId, onOpenCalendar }: Props) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const defaultRoomId = searchParams.get('roomId') ?? (rooms[0]?.id ?? '')
  const defaultDate = searchParams.get('date') ?? new Date().toISOString().split('T')[0]
  const defaultStartTime = searchParams.get('startTime') ?? '09:00'
  const defaultEndTime = searchParams.get('endTime') ?? '10:00'

  const [participants, setParticipants] = useState<{ userId?: string; email: string; name: string; type: 'REQUIRED' | 'OPTIONAL' }[]>([])
  const [participantSearch, setParticipantSearch] = useState('')
  const [loading, setLoading] = useState(false)

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      title: '',
      agenda: '',
      roomId: defaultRoomId,
      date: defaultDate,
      startTime: defaultStartTime,
      endTime: defaultEndTime,
      notes: '',
    },
  })

  // Watch URL params changes to update form if navigated from calendar
  useEffect(() => {
    const rId = searchParams.get('roomId')
    const dt = searchParams.get('date')
    const st = searchParams.get('startTime')
    const et = searchParams.get('endTime')

    if (rId) setValue('roomId', rId)
    if (dt) setValue('date', dt)
    if (st) setValue('startTime', st)
    if (et) setValue('endTime', et)
  }, [searchParams, setValue])

  const [roomId, date, startTime, endTime] = watch(['roomId', 'date', 'startTime', 'endTime'])

  // Conflict check query
  const startAt = date && startTime ? `${date}T${startTime}:00` : null
  const endAt = date && endTime ? `${date}T${endTime}:00` : null

  const { data: conflictData, isFetching: checkingConflict } = useQuery({
    queryKey: ['conflict', roomId, startAt, endAt],
    queryFn: async () => {
      if (!roomId || !startAt || !endAt) return null
      const res = await fetch(
        `/api/rooms/availability?roomId=${roomId}&startAt=${encodeURIComponent(startAt)}&endAt=${encodeURIComponent(endAt)}`,
      )
      return res.json() as Promise<{ hasConflict: boolean; conflictingBooking?: any }>
    },
    enabled: Boolean(roomId && startAt && endAt && startTime < endTime),
  })

  // Participant conflict check query
  const participantUserIds = participants.map((p) => p.userId).filter(Boolean) as string[]
  const participantEmails = participants.map((p) => p.email).filter(Boolean) as string[]

  const { data: participantConflictsData } = useQuery({
    queryKey: ['participant-conflicts', startAt, endAt, participantUserIds, participantEmails],
    queryFn: async () => {
      if (!startAt || !endAt || (participantUserIds.length === 0 && participantEmails.length === 0)) {
        return { conflicts: [] }
      }
      const res = await fetch('/api/participants/availability', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          startAt: new Date(startAt).toISOString(),
          endAt: new Date(endAt).toISOString(),
          userIds: participantUserIds,
          emails: participantEmails,
        }),
      })
      if (!res.ok) return { conflicts: [] }
      return res.json() as Promise<{
        conflicts: Array<{
          userId?: string
          email: string
          name: string
          conflictingBooking: {
            id: string
            title: string
            startAt: string
            endAt: string
            roomName: string
            status: string
          }
        }>
      }>
    },
    enabled: Boolean(startAt && endAt && startTime < endTime && (participantUserIds.length > 0 || participantEmails.length > 0)),
  })

  const participantConflicts = participantConflictsData?.conflicts || []

  const selectedRoom = rooms.find((r) => r.id === roomId)

  const addParticipant = (user: UserOption) => {
    if (user.id === currentUserId) return
    if (participants.some((p) => p.userId === user.id)) return
    setParticipants((prev) => [...prev, { userId: user.id, email: user.email, name: user.name, type: 'REQUIRED' }])
    setParticipantSearch('')
  }

  const removeParticipant = (userId?: string, email?: string) => {
    setParticipants((prev) => prev.filter((p) => !(p.userId === userId || p.email === email)))
  }

  const filteredUsers = participantSearch.length >= 2
    ? users.filter(
        (u) =>
          u.id !== currentUserId &&
          !participants.some((p) => p.userId === u.id) &&
          (u.name.toLowerCase().includes(participantSearch.toLowerCase()) ||
           u.email.toLowerCase().includes(participantSearch.toLowerCase())),
      )
    : []

  const onSubmit = async (data: FormData) => {
    // 1. Client-side time range check
    if (data.startTime >= data.endTime) {
      toast.error('Jam selesai harus lebih akhir dari jam mulai (contoh: 11:00 ke 12:00)')
      return
    }

    if (conflictData?.hasConflict) {
      toast.error('Jadwal bertabrakan! Ruang sudah dipesan pada waktu ini. Silakan pilih jam lain.')
      return
    }

    // Format ISO string with user's local timezone
    const startDate = new Date(`${data.date}T${data.startTime}:00`)
    const endDate = new Date(`${data.date}T${data.endTime}:00`)
    const startAt = !isNaN(startDate.getTime()) ? startDate.toISOString() : `${data.date}T${data.startTime}:00Z`
    const endAt = !isNaN(endDate.getTime()) ? endDate.toISOString() : `${data.date}T${data.endTime}:00Z`

    setLoading(true)
    try {
      const res = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: data.title,
          agenda: data.agenda,
          roomId: data.roomId,
          startAt,
          endAt,
          notes: data.notes,
          participants,
        }),
      })
      const json = await res.json()

      if (!res.ok) {
        let errMsg = 'Terjadi kesalahan saat mengajukan booking'
        if (typeof json.error === 'string') {
          errMsg = json.error
        } else if (json.error?.formErrors?.length) {
          errMsg = json.error.formErrors[0]
        } else if (json.error?.fieldErrors) {
          const firstField = Object.values(json.error.fieldErrors).flat()[0]
          if (firstField) errMsg = String(firstField)
        } else if (json.message) {
          errMsg = json.message
        }
        throw new Error(errMsg)
      }

      toast.success('Booking berhasil diajukan!')
      router.push(`/bookings/${json.booking.id}`)
    } catch (err: any) {
      const msg =
        err?.message && err.message !== '[object Object]'
          ? err.message
          : 'Gagal mengajukan booking. Periksa kembali jam dan data yang diisi.'
      toast.error(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Basic Info */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
        <h2 className="font-semibold text-gray-900">Informasi Rapat</h2>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Judul Rapat *</label>
          <input
            {...register('title')}
            placeholder="Contoh: Rapat Evaluasi Q3 2026"
            className={`w-full px-4 py-2.5 rounded-lg border text-sm text-gray-900 bg-white placeholder-gray-400 outline-none transition-colors
              ${errors.title ? 'border-red-400 focus:ring-2 focus:ring-red-100' : 'border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100'}`}
          />
          {errors.title && <p className="mt-1 text-xs text-red-500">{errors.title.message}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Agenda</label>
          <textarea
            {...register('agenda')}
            rows={4}
            placeholder="Tuliskan poin-poin agenda rapat..."
            className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 text-sm text-gray-900 bg-white placeholder-gray-400 outline-none resize-none"
          />
        </div>
      </div>

      {/* Room & Time with Live Interactive Calendar Timeline */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-semibold text-gray-900">Ruang & Waktu</h2>
            <p className="text-xs text-gray-500 mt-0.5">
              Pilih ruang dan waktu, atau pilih slot kosong langsung di timeline
            </p>
          </div>
          {onOpenCalendar && (
            <button
              type="button"
              onClick={onOpenCalendar}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-lg transition-colors"
            >
              <CalendarIcon className="w-3.5 h-3.5" />
              Cek Kalender Semua Ruang
            </button>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Pilih Ruang *</label>
          <select
            {...register('roomId')}
            className={`w-full px-4 py-2.5 rounded-lg border text-sm text-gray-900 bg-white outline-none transition-colors
              ${errors.roomId ? 'border-red-400' : 'border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100'}`}
          >
            <option value="">-- Pilih ruang rapat --</option>
            {rooms.map((room) => (
              <option key={room.id} value={room.id}>
                {room.name} ({room.code}) — Kapasitas {room.capacity} orang
              </option>
            ))}
          </select>
          {errors.roomId && <p className="mt-1 text-xs text-red-500">{errors.roomId.message}</p>}

          {selectedRoom && (
            <div className="mt-2.5 p-3 bg-blue-50/70 border border-blue-100 rounded-lg text-sm flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <p className="text-blue-900 font-medium text-xs flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-blue-600 flex-shrink-0" />
                  <span>{selectedRoom.location} · Kapasitas: {selectedRoom.capacity} orang</span>
                </p>
                {selectedRoom.facilities.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-1.5">
                    {selectedRoom.facilities.map((f) => (
                      <span key={f.id} className="text-[11px] bg-white text-blue-700 border border-blue-200 px-2 py-0.5 rounded-md font-medium">
                        {f.name}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Tanggal Rapat *</label>
            <input
              type="date"
              {...register('date')}
              min={new Date().toISOString().split('T')[0]}
              className={`w-full px-4 py-2.5 rounded-lg border text-sm text-gray-900 bg-white outline-none transition-colors
                ${errors.date ? 'border-red-400' : 'border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100'}`}
            />
            {errors.date && <p className="mt-1 text-xs text-red-500">{errors.date.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Jam Mulai *</label>
            <input
              type="time"
              {...register('startTime')}
              className={`w-full px-4 py-2.5 rounded-lg border text-sm text-gray-900 bg-white outline-none transition-colors
                ${errors.startTime ? 'border-red-400' : 'border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100'}`}
            />
            {errors.startTime && <p className="mt-1 text-xs text-red-500">{errors.startTime.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Jam Selesai *</label>
            <input
              type="time"
              {...register('endTime')}
              className={`w-full px-4 py-2.5 rounded-lg border text-sm text-gray-900 bg-white outline-none transition-colors
                ${errors.endTime ? 'border-red-400' : 'border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100'}`}
            />
            {errors.endTime && <p className="mt-1 text-xs text-red-500">{errors.endTime.message}</p>}
          </div>
        </div>

        {/* Live Visual Timeline of the Room's Availability */}
        {roomId && date && (
          <div className="pt-2">
            <RoomDayTimeline
              roomId={roomId}
              date={date}
              selectedStartTime={startTime}
              selectedEndTime={endTime}
              onSelectSlot={(s, e) => {
                setValue('startTime', s, { shouldValidate: true })
                setValue('endTime', e, { shouldValidate: true })
              }}
            />
          </div>
        )}

        {/* Conflict indicator status message */}
        {roomId && startAt && endAt && startTime && endTime && startTime < endTime && (
          <div className={`flex items-center gap-2 p-3 rounded-lg text-sm ${
            checkingConflict ? 'bg-gray-50 text-gray-500' :
            conflictData?.hasConflict ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'
          }`}>
            {checkingConflict ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> Memverifikasi ketersediaan ruang...</>
            ) : conflictData?.hasConflict ? (
              <><AlertTriangle className="w-4 h-4 text-red-600 flex-shrink-0" /> Jadwal bertabrakan! Ruang sudah dipesan pada rentang jam ini.</>
            ) : conflictData ? (
              <><CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0" /> Ruang tersedia untuk waktu yang Anda pilih.</>
            ) : null}
          </div>
        )}
      </div>

      {/* Participants */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
        <h2 className="font-semibold text-gray-900">Peserta Rapat</h2>

        <div className="relative">
          <input
            type="text"
            value={participantSearch}
            onChange={(e) => setParticipantSearch(e.target.value)}
            placeholder="Cari nama atau email peserta (min. 2 karakter)..."
            className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 text-sm text-gray-900 bg-white placeholder-gray-400 outline-none"
          />
          {filteredUsers.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-lg shadow-lg border border-gray-200 z-10 max-h-48 overflow-y-auto">
              {filteredUsers.map((user) => (
                <button
                  key={user.id}
                  type="button"
                  onClick={() => addParticipant(user)}
                  className="w-full text-left px-4 py-2.5 hover:bg-gray-50 flex items-center gap-3 transition-colors"
                >
                  <div className="w-7 h-7 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                    <span className="text-xs font-bold text-blue-700">{user.name[0]}</span>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">{user.name}</p>
                    <p className="text-xs text-gray-400">{user.email} {user.division && `· ${user.division}`}</p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {participants.length > 0 && (
          <div className="flex flex-wrap gap-2 pt-1">
            {participants.map((p) => {
              const conflict = participantConflicts.find(
                (c) => (p.userId && c.userId === p.userId) || c.email === p.email,
              )
              return (
                <div
                  key={p.userId ?? p.email}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm transition-colors ${
                    conflict
                      ? 'bg-amber-50 text-amber-900 border border-amber-300'
                      : 'bg-blue-50 text-blue-700'
                  }`}
                >
                  <span className="font-medium">{p.name}</span>
                  {conflict && (
                    <span
                      title={`Bentrok dengan "${conflict.conflictingBooking.title}" (${formatTime(conflict.conflictingBooking.startAt)} - ${formatTime(conflict.conflictingBooking.endAt)}, ${conflict.conflictingBooking.roomName})`}
                      className="inline-flex items-center gap-1 text-[11px] font-semibold bg-amber-200/90 text-amber-900 px-2 py-0.5 rounded-full cursor-help"
                    >
                      <AlertTriangle className="w-3 h-3 text-amber-700 flex-shrink-0" />
                      Bentrok Jadwal
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={() => removeParticipant(p.userId, p.email)}
                    className="hover:opacity-75 ml-0.5"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              )
            })}
          </div>
        )}

        {/* Soft Warning Box if any participants have conflicts */}
        {participantConflicts.length > 0 && (
          <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs space-y-1.5">
            <div className="flex items-center gap-2 font-semibold text-amber-800">
              <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0" />
              <span>Perhatian: Terdapat {participantConflicts.length} peserta yang memiliki jadwal rapat lain di jam ini:</span>
            </div>
            <ul className="list-disc pl-5 space-y-1 text-amber-800/90">
              {participantConflicts.map((c, i) => (
                <li key={i}>
                  <strong>{c.name}</strong>: Terjadwal di &ldquo;{c.conflictingBooking.title}&rdquo; ({formatTime(c.conflictingBooking.startAt)} - {formatTime(c.conflictingBooking.endAt)}, {c.conflictingBooking.roomName}).
                </li>
              ))}
            </ul>
            <p className="text-[11px] text-amber-700 italic pt-0.5">
              💡 Catatan: Anda tetap dapat melanjutkan pengajuan booking jika rapat ini mendesak atau kehadiran peserta bersifat tentatif/opsional.
            </p>
          </div>
        )}

        {participants.length === 0 && (
          <p className="text-sm text-gray-400">Belum ada peserta ditambahkan</p>
        )}
      </div>

      {/* Notes */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <label className="block text-sm font-medium text-gray-700 mb-1.5">
          Catatan untuk Approver
        </label>
        <textarea
          {...register('notes')}
          rows={3}
          placeholder="Informasi tambahan untuk mempermudah proses persetujuan..."
          className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 text-sm text-gray-900 bg-white placeholder-gray-400 outline-none resize-none"
        />
      </div>

      {/* Submit */}
      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={loading || conflictData?.hasConflict}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-semibold px-6 py-2.5 rounded-lg transition-colors shadow-xs"
        >
          {loading && <Loader2 className="w-4 h-4 animate-spin" />}
          {loading ? 'Mengajukan...' : 'Ajukan Booking'}
        </button>
        <button
          type="button"
          onClick={() => router.back()}
          className="px-5 py-2.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 font-medium text-sm transition-colors"
        >
          Batal
        </button>
      </div>
    </form>
  )
}
