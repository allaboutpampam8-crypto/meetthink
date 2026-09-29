'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { CheckCircle2, Loader2, UserCheck, QrCode, ArrowRight } from 'lucide-react'
import Link from 'next/link'
import { formatDateTime } from '@/lib/utils'

interface Props {
  token: string
  meetingTitle: string
  roomName: string
  isLoggedIn: boolean
  currentUser?: {
    name?: string | null
    email?: string | null
  } | null
  initialAttended: boolean
  initialAttendedAt?: Date | string | null
  isParticipantInList: boolean
}

export function AttendActionBox({
  token,
  meetingTitle,
  roomName,
  isLoggedIn,
  currentUser,
  initialAttended,
  initialAttendedAt,
  isParticipantInList,
}: Props) {
  const router = useRouter()
  const [attended, setAttended] = useState(initialAttended)
  const [attendedAt, setAttendedAt] = useState<Date | string | null>(initialAttendedAt ?? null)
  const [attendeeName, setAttendeeName] = useState<string>(currentUser?.name ?? '')

  const [loading, setLoading] = useState(false)
  const [guestName, setGuestName] = useState('')
  const [guestEmail, setGuestEmail] = useState('')

  const handleCheckIn = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    setLoading(true)

    try {
      const payload: any = { token }
      if (!isLoggedIn) {
        if (!guestEmail.trim()) {
          toast.error('Email wajib diisi untuk absensi')
          setLoading(false)
          return
        }
        payload.email = guestEmail.trim()
        payload.name = guestName.trim() || undefined
      }

      const res = await fetch('/api/attendance/check-in', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Gagal mencatat absensi')

      setAttended(true)
      setAttendedAt(data.attendedAt ?? new Date())
      if (data.attendeeName) setAttendeeName(data.attendeeName)
      toast.success(data.message ?? 'Kehadiran berhasil dicatat!')
      router.refresh()
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setLoading(false)
    }
  }

  if (attended) {
    return (
      <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-6 text-center space-y-4 animate-in fade-in">
        <div className="w-16 h-16 rounded-full bg-emerald-100 border border-emerald-300 text-emerald-600 flex items-center justify-center mx-auto shadow-sm">
          <CheckCircle2 className="w-9 h-9" />
        </div>
        <div>
          <span className="text-xs uppercase tracking-wider font-extrabold text-emerald-800 bg-emerald-100 px-3 py-1 rounded-full">
            Presensi Berhasil
          </span>
          <h2 className="text-xl font-bold text-gray-900 mt-3">
            Kehadiran Anda Telah Tercatat
          </h2>
          <p className="text-xs text-gray-600 mt-1">
            Terima kasih telah melakukan absensi kehadiran rapat.
          </p>
        </div>

        <div className="p-4 bg-white rounded-xl border border-emerald-100 text-left text-xs space-y-2">
          <div className="flex justify-between border-b border-gray-100 pb-2">
            <span className="text-gray-500">Nama Peserta:</span>
            <span className="font-semibold text-gray-900">{attendeeName || currentUser?.name || 'Tamu'}</span>
          </div>
          <div className="flex justify-between border-b border-gray-100 pb-2">
            <span className="text-gray-500">Waktu Presensi:</span>
            <span className="font-semibold text-emerald-700">
              {attendedAt ? formatDateTime(attendedAt) : 'Baru saja'}
            </span>
          </div>
          <div className="flex justify-between border-b border-gray-100 pb-2">
            <span className="text-gray-500">Agenda:</span>
            <span className="font-semibold text-gray-900 truncate max-w-[200px]">{meetingTitle}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Ruangan:</span>
            <span className="font-semibold text-gray-900">{roomName}</span>
          </div>
        </div>

        {isLoggedIn ? (
          <Link
            href="/dashboard"
            className="inline-flex items-center justify-center gap-1.5 w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors"
          >
            Buka Dashboard <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        ) : (
          <Link
            href="/login"
            className="inline-flex items-center justify-center gap-1.5 w-full py-2.5 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 rounded-xl text-xs font-semibold shadow-xs transition-colors"
          >
            Masuk ke Akun MeetThink
          </Link>
        )}
      </div>
    )
  }

  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm space-y-5">
      <div className="text-center space-y-1">
        <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-700 bg-blue-50 px-3 py-1 rounded-full">
          <QrCode className="w-3.5 h-3.5" />
          Presensi Mandiri Peserta
        </div>
        <h2 className="text-lg font-bold text-gray-900 pt-1">
          Konfirmasi Kehadiran Rapat
        </h2>
        <p className="text-xs text-gray-500">
          Silakan konfirmasi kehadiran Anda untuk rapat ini.
        </p>
      </div>

      {isLoggedIn ? (
        <div className="space-y-4">
          <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-sm flex-shrink-0">
              {(currentUser?.name ?? 'U')[0].toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs text-gray-400">Akun terdeteksi:</p>
              <p className="text-sm font-bold text-gray-900 truncate">{currentUser?.name}</p>
              <p className="text-xs text-gray-500 truncate">{currentUser?.email}</p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => handleCheckIn()}
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-bold shadow-md shadow-emerald-600/10 disabled:opacity-60 transition-all cursor-pointer"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <UserCheck className="w-4 h-4" />
            )}
            {loading ? 'Mencatat Kehadiran...' : 'Konfirmasi Hadir Sekarang'}
          </button>
        </div>
      ) : (
        <form onSubmit={handleCheckIn} className="space-y-3.5">
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Nama Lengkap
            </label>
            <input
              type="text"
              value={guestName}
              onChange={(e) => setGuestName(e.target.value)}
              placeholder="Masukkan nama Anda..."
              className="w-full px-3.5 py-2.5 rounded-lg border border-gray-300 text-xs text-gray-900 bg-white placeholder-gray-400 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Alamat Email Undangan *
            </label>
            <input
              type="email"
              required
              value={guestEmail}
              onChange={(e) => setGuestEmail(e.target.value)}
              placeholder="nama@perusahaan.com"
              className="w-full px-3.5 py-2.5 rounded-lg border border-gray-300 text-xs text-gray-900 bg-white placeholder-gray-400 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
            <p className="text-[11px] text-gray-400 mt-1">
              Gunakan email yang diundang oleh penyelenggara rapat.
            </p>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-bold shadow-md shadow-emerald-600/10 disabled:opacity-60 transition-all cursor-pointer mt-2"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <UserCheck className="w-4 h-4" />
            )}
            {loading ? 'Mencatat Kehadiran...' : 'Konfirmasi Hadir'}
          </button>
        </form>
      )}
    </div>
  )
}
