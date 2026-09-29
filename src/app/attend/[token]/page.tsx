import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { formatDateTime, formatTime } from '@/lib/utils'
import { AttendActionBox } from '@/components/attendance/attend-action-box'
import { Calendar, Clock, MapPin, Building2, AlertTriangle } from 'lucide-react'
import logoImg from '@/assets/logo.png'

export const metadata: Metadata = {
  title: 'Presensi Rapat | MeetThink',
  description: 'Konfirmasi kehadiran presensi rapat MeetThink',
}

export default async function AttendPage({
  params,
}: {
  params: Promise<{ token: string }>
}) {
  const { token } = await params

  const booking = await prisma.booking.findUnique({
    where: { attendanceToken: token },
    include: {
      room: true,
      requester: { select: { id: true, name: true, email: true, division: true } },
      participants: { include: { user: true } },
    },
  })

  if (!booking) {
    notFound()
  }

  const session = await auth()
  const user = session?.user

  // Check attendance status
  let initialAttended = false
  let initialAttendedAt: Date | null = null
  let isParticipantInList = false

  if (user) {
    const isRequester = booking.requesterId === user.id
    if (isRequester) {
      isParticipantInList = true
      initialAttended = !!booking.requesterAttendedAt
      initialAttendedAt = booking.requesterAttendedAt
    } else {
      const p = booking.participants.find(
        (part) =>
          (part.userId && part.userId === user.id) ||
          part.email.toLowerCase() === user.email?.toLowerCase(),
      )
      if (p) {
        isParticipantInList = true
        initialAttended = !!p.attendedAt
        initialAttendedAt = p.attendedAt
      }
    }
  }

  const isCancelled = booking.status === 'CANCELLED' || booking.status === 'REJECTED'

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-orange-50/15 to-blue-50/20 py-8 px-4 flex flex-col justify-between">
      <div className="max-w-md mx-auto w-full space-y-6">
        {/* Header Branding */}
        <div className="text-center space-y-2">
          <Link href="/" className="inline-flex items-center gap-2">
            <div className="w-10 h-10 rounded-2xl bg-white border border-orange-100 shadow-xs flex items-center justify-center p-1">
              <Image
                src={logoImg}
                alt="MeetThink Logo"
                width={36}
                height={36}
                className="w-full h-full object-contain"
                priority
              />
            </div>
            <span className="text-2xl font-black text-gray-900 tracking-tight">
              Meet<span className="text-orange-500">Think</span>
            </span>
          </Link>
          <p className="text-xs text-gray-500 font-medium">Sistem Presensi & Manajemen Rapat</p>
        </div>

        {/* Meeting Information Card */}
        <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-xs space-y-4">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider bg-blue-50 text-blue-700 px-2 py-0.5 rounded">
              Agenda Rapat
            </span>
            <h1 className="text-lg font-bold text-gray-900 mt-1.5 leading-snug">
              {booking.title}
            </h1>
            <p className="text-xs text-gray-500 mt-1">
              Penyelenggara: <strong>{booking.requester.name}</strong>{' '}
              {booking.requester.division ? `(${booking.requester.division})` : ''}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-3 border-t border-gray-100 text-xs text-gray-600">
            <div className="space-y-1">
              <span className="flex items-center gap-1.5 text-gray-400 font-medium text-[11px]">
                <Calendar className="w-3.5 h-3.5" /> Tanggal
              </span>
              <p className="font-semibold text-gray-800">
                {new Date(booking.startAt).toLocaleDateString('id-ID', {
                  weekday: 'short',
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                })}
              </p>
            </div>

            <div className="space-y-1">
              <span className="flex items-center gap-1.5 text-gray-400 font-medium text-[11px]">
                <Clock className="w-3.5 h-3.5" /> Waktu
              </span>
              <p className="font-semibold text-gray-800">
                {formatTime(booking.startAt)} – {formatTime(booking.endAt)}
              </p>
            </div>

            <div className="col-span-2 space-y-1 pt-1">
              <span className="flex items-center gap-1.5 text-gray-400 font-medium text-[11px]">
                <MapPin className="w-3.5 h-3.5" /> Lokasi Ruangan
              </span>
              <p className="font-semibold text-gray-800">
                {booking.room.name} ({booking.room.location})
              </p>
            </div>
          </div>
        </div>

        {/* Warning if cancelled or pending */}
        {isCancelled ? (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-5 text-center text-xs text-red-800 space-y-1">
            <AlertTriangle className="w-6 h-6 text-red-600 mx-auto mb-1" />
            <p className="font-bold text-sm">Rapat Telah Dibatalkan / Ditolak</p>
            <p className="text-red-600">Presensi untuk rapat ini tidak dapat dilakukan.</p>
          </div>
        ) : booking.status === 'PENDING' ? (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 text-center text-xs text-amber-800 space-y-1">
            <div className="w-8 h-8 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center mx-auto mb-1 text-sm font-bold">
              ⏳
            </div>
            <p className="font-bold text-sm text-amber-950">Rapat Menunggu Persetujuan</p>
            <p className="text-amber-800">
              Booking ruang untuk rapat ini masih menunggu persetujuan approver. Presensi baru dapat dilakukan setelah rapat disetujui.
            </p>
          </div>
        ) : (
          <AttendActionBox
            token={token}
            meetingTitle={booking.title}
            roomName={booking.room.name}
            isLoggedIn={!!user}
            currentUser={user}
            initialAttended={initialAttended}
            initialAttendedAt={initialAttendedAt}
            isParticipantInList={isParticipantInList}
          />
        )}
      </div>

      <footer className="text-center text-[11px] text-gray-400 pt-8">
        &copy; {new Date().getFullYear()} MeetThink. Dilindungi hak cipta.
      </footer>
    </div>
  )
}
