import { Metadata } from 'next'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { formatDateTime, formatTime, bookingStatusColor, bookingStatusLabel, getMeetingLifecycle } from '@/lib/utils'
import Link from 'next/link'
import { CalendarDays, Clock, CheckSquare, ClipboardList, Plus, ArrowRight, User } from 'lucide-react'

export const metadata: Metadata = { title: 'Dashboard' }

export default async function DashboardPage() {
  const session = await auth()
  const userId = session!.user!.id!
  const userEmail = session!.user!.email ?? ''
  const role = session!.user!.role ?? 'USER'

  // Rapat mendatang dan sedang berlangsung (endAt >= now)
  const now = new Date()
  const in7Days = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)

  const [upcomingBookings, recentPastBookings] = await Promise.all([
    prisma.booking.findMany({
      where: {
        endAt: { gte: now },
        startAt: { lte: in7Days },
        OR: [
          // Pembuat rapat: bisa melihat rapat miliknya (baik PENDING maupun APPROVED)
          {
            requesterId: userId,
            status: { in: ['APPROVED', 'PENDING'] },
          },
          // Peserta rapat: HANYA bisa melihat jika booking sudah APPROVED
          {
            status: 'APPROVED',
            participants: { some: { OR: [{ userId }, { email: userEmail }] } },
          },
        ],
      },
      include: {
        room: { select: { name: true, location: true } },
        requester: { select: { id: true, name: true, division: true } },
        participants: { select: { attendedAt: true } },
        _count: { select: { participants: true } },
      },
      orderBy: { startAt: 'asc' },
      take: 10,
    }),
    prisma.booking.findMany({
      where: {
        OR: [
          { status: 'COMPLETED' },
          { status: 'APPROVED', endAt: { lt: now } },
        ],
        AND: [
          {
            OR: [
              { requesterId: userId },
              { participants: { some: { OR: [{ userId }, { email: userEmail }] } } },
            ],
          },
        ],
      },
      include: {
        room: { select: { name: true, location: true } },
        requester: { select: { id: true, name: true, division: true } },
        participants: { select: { attendedAt: true } },
        _count: { select: { participants: true } },
      },
      orderBy: { startAt: 'desc' },
      take: 5,
    }),
  ])

  // Pending approval (untuk approver) — ambil semua pending lalu filter di JS
  let pendingApprovalCount = 0
  if (['APPROVER', 'ADMIN', 'SUPER_ADMIN'].includes(role)) {
    const pendingBookings = await prisma.booking.findMany({
      where: {
        status: 'PENDING',
        approvalFlow: {
          steps: { some: { approverId: userId } },
        },
      },
      select: {
        currentLevel: true,
        approvalFlow: {
          select: {
            steps: { select: { approverId: true, level: true } },
          },
        },
      },
    })
    // Hanya hitung booking di mana user adalah approver pada level yang sedang aktif
    pendingApprovalCount = pendingBookings.filter((b) =>
      b.approvalFlow?.steps.some(
        (s) => s.approverId === userId && s.level === b.currentLevel,
      ),
    ).length
  }

  // Booking saya yang pending (sebagai pemohon)
  const myPendingCount = await prisma.booking.count({
    where: { requesterId: userId, status: 'PENDING' },
  })

  // Action items saya yang open
  const openActionItems = await prisma.actionItem.count({
    where: { picId: userId, status: { in: ['OPEN', 'IN_PROGRESS', 'OVERDUE'] } },
  })

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Welcome header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Selamat datang, {session?.user?.name?.split(' ')[0]} 👋
          </h1>
          <p className="text-gray-500 mt-1 text-sm">
            Ringkasan aktivitas rapat dan jadwal Anda
          </p>
        </div>
        <Link
          href="/bookings/new"
          className="inline-flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4 py-2.5 rounded-lg transition-colors text-sm shadow-xs"
        >
          <Plus className="w-4 h-4" />
          Buat Booking
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <StatCard
          icon={<CalendarDays className="w-5 h-5 text-blue-600" />}
          label="Rapat Mendatang (7 hari)"
          value={upcomingBookings.length}
          bg="bg-blue-50"
          href="/bookings"
        />
        {['APPROVER', 'ADMIN', 'SUPER_ADMIN'].includes(role) && (
          <StatCard
            icon={<CheckSquare className="w-5 h-5 text-orange-600" />}
            label="Menunggu Persetujuan Saya"
            value={pendingApprovalCount}
            bg="bg-orange-50"
            href="/approvals"
            urgent={pendingApprovalCount > 0}
          />
        )}
        <StatCard
          icon={<Clock className="w-5 h-5 text-yellow-600" />}
          label="Booking Saya (Pending)"
          value={myPendingCount}
          bg="bg-yellow-50"
          href="/bookings?tab=list&status=PENDING"
        />
        <StatCard
          icon={<ClipboardList className="w-5 h-5 text-purple-600" />}
          label="Tindak Lanjut Terbuka"
          value={openActionItems}
          bg="bg-purple-50"
          href="/action-items"
          urgent={openActionItems > 0}
        />
      </div>

      {/* Upcoming meetings */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-xs">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div>
            <h2 className="font-semibold text-gray-900">Rapat Mendatang & Berlangsung</h2>
            <p className="text-xs text-gray-500 mt-0.5">
              Rapat aktif yang akan datang atau sedang berlangsung
            </p>
          </div>
          <Link
            href="/bookings"
            className="flex items-center gap-1 text-sm font-semibold text-blue-600 hover:text-blue-700"
          >
            Lihat Kalender <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {upcomingBookings.length === 0 ? (
          <div className="py-14 text-center">
            <CalendarDays className="w-10 h-10 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-700 font-semibold">Tidak ada rapat mendatang dalam 7 hari ke depan</p>
            <p className="text-xs text-gray-400 mt-1">Anda belum memiliki jadwal rapat aktif mendatang</p>
            <Link
              href="/bookings/new"
              className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-blue-600 hover:text-blue-700 hover:underline"
            >
              Buat booking sekarang →
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {upcomingBookings.map((booking) => {
              const isRequester = booking.requester.id === userId
              const isToday =
                new Date(booking.startAt).toDateString() === new Date().toDateString()
              const lifecycle = getMeetingLifecycle(booking)

              return (
                <Link
                  key={booking.id}
                  href={`/bookings/${booking.id}` as any}
                  className="flex flex-col sm:flex-row sm:items-center gap-4 px-6 py-4 hover:bg-slate-50/70 transition-colors group"
                >
                  {/* Date block */}
                  <div className="w-12 text-center flex-shrink-0 bg-slate-50 border border-slate-200/80 rounded-lg py-1.5">
                    <div className="text-[10px] font-semibold text-gray-400 uppercase">
                      {new Date(booking.startAt).toLocaleDateString('id-ID', { weekday: 'short' })}
                    </div>
                    <div className="text-lg font-extrabold text-gray-900 leading-tight">
                      {new Date(booking.startAt).getDate()}
                    </div>
                    <div className="text-[10px] text-gray-400">
                      {new Date(booking.startAt).toLocaleDateString('id-ID', { month: 'short' })}
                    </div>
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-bold text-gray-900 truncate group-hover:text-blue-600 transition-colors">
                        {booking.title}
                      </p>
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded-full font-semibold border flex items-center gap-1 ${lifecycle.color}`}
                      >
                        {lifecycle.isOngoing && (
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                        )}
                        {lifecycle.label}
                      </span>
                      {isToday && !lifecycle.isOngoing && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-blue-100 text-blue-700">
                          Hari Ini
                        </span>
                      )}
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded font-medium ${
                          isRequester
                            ? 'bg-purple-50 text-purple-700 border border-purple-200'
                            : 'bg-blue-50 text-blue-700 border border-blue-200'
                        }`}
                      >
                        {isRequester ? 'Penyelenggara' : 'Peserta'}
                      </span>
                    </div>

                    <p className="text-xs text-gray-500 truncate">
                      📍 {booking.room.name} · {booking.room.location} ·{' '}
                      <span className="text-gray-400">
                        Diajukan oleh: {booking.requester.name}
                      </span>
                    </p>
                  </div>

                  {/* Time & Attendance */}
                  {(() => {
                    const isHappeningNow = now >= new Date(booking.startAt) && now <= new Date(booking.endAt)
                    const totalExpected = booking.participants.length + 1
                    const attendedCount =
                      (booking.requesterAttendedAt ? 1 : 0) +
                      booking.participants.filter((p) => p.attendedAt !== null).length

                    return (
                      <div className="flex sm:flex-col items-center sm:items-end justify-between text-xs flex-shrink-0 pt-1 sm:pt-0">
                        <p className="font-semibold text-gray-800">
                          {formatTime(booking.startAt)} – {formatTime(booking.endAt)}
                        </p>
                        {isHappeningNow ? (
                          <p className="text-emerald-600 font-semibold text-[11px] mt-0.5">
                            {attendedCount}/{totalExpected} hadir
                          </p>
                        ) : (
                          <p className="text-gray-400 mt-0.5">
                            {totalExpected} peserta
                          </p>
                        )}
                      </div>
                    )
                  })()}

                  <ArrowRight className="hidden sm:block w-4 h-4 text-gray-300 group-hover:text-blue-600 group-hover:translate-x-1 transition-all flex-shrink-0" />
                </Link>
              )
            })}
          </div>
        )}
      </div>

      {/* Recent finished meetings (if any) */}
      {recentPastBookings.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-xs">
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
            <div>
              <h2 className="font-semibold text-gray-900">Riwayat Rapat Selesai</h2>
              <p className="text-xs text-gray-500 mt-0.5">
                Rapat yang telah selesai dilaksanakan beserta notulensi & tindak lanjut
              </p>
            </div>
            <Link
              href="/bookings?tab=list&status=COMPLETED"
              className="flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-700"
            >
              Lihat Semua Riwayat <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="divide-y divide-gray-100">
            {recentPastBookings.map((booking) => {
              const isRequester = booking.requester.id === userId

              return (
                <Link
                  key={booking.id}
                  href={`/bookings/${booking.id}` as any}
                  className="flex flex-col sm:flex-row sm:items-center gap-4 px-6 py-3.5 hover:bg-slate-50/70 transition-colors group opacity-90 hover:opacity-100"
                >
                  {/* Date block */}
                  <div className="w-12 text-center flex-shrink-0 bg-slate-50 border border-slate-200/80 rounded-lg py-1">
                    <div className="text-[10px] font-semibold text-gray-400 uppercase">
                      {new Date(booking.startAt).toLocaleDateString('id-ID', { weekday: 'short' })}
                    </div>
                    <div className="text-base font-extrabold text-gray-700 leading-tight">
                      {new Date(booking.startAt).getDate()}
                    </div>
                    <div className="text-[9px] text-gray-400">
                      {new Date(booking.startAt).toLocaleDateString('id-ID', { month: 'short' })}
                    </div>
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0 space-y-0.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-semibold text-sm text-gray-800 truncate group-hover:text-blue-600 transition-colors">
                        {booking.title}
                      </p>
                      <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                        Selesai Dilaksanakan
                      </span>
                      <span
                        className={`text-[10px] px-1.5 py-0.2 rounded font-medium ${
                          isRequester
                            ? 'bg-purple-50 text-purple-700 border border-purple-200'
                            : 'bg-blue-50 text-blue-700 border border-blue-200'
                        }`}
                      >
                        {isRequester ? 'Penyelenggara' : 'Peserta'}
                      </span>
                    </div>

                    <p className="text-xs text-gray-500 truncate">
                      📍 {booking.room.name} · {booking.room.location} ·{' '}
                      <span className="text-gray-400">
                        Oleh: {booking.requester.name}
                      </span>
                    </p>
                  </div>

                  {/* Time & Real Attendance */}
                  {(() => {
                    const totalExpected = booking.participants.length + 1
                    const attendedCount =
                      (booking.requesterAttendedAt ? 1 : 0) +
                      booking.participants.filter((p) => p.attendedAt !== null).length

                    return (
                      <div className="flex sm:flex-col items-center sm:items-end justify-between text-xs flex-shrink-0 pt-1 sm:pt-0">
                        <p className="font-medium text-gray-600">
                          {formatTime(booking.startAt)} – {formatTime(booking.endAt)}
                        </p>
                        <p
                          className={`text-[11px] mt-0.5 font-medium ${
                            attendedCount === 0 ? 'text-gray-400' : 'text-emerald-600'
                          }`}
                        >
                          {attendedCount}/{totalExpected} hadir
                        </p>
                      </div>
                    )
                  })()}

                  <ArrowRight className="hidden sm:block w-4 h-4 text-gray-300 group-hover:text-blue-600 group-hover:translate-x-1 transition-all flex-shrink-0" />
                </Link>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

function StatCard({
  icon,
  label,
  value,
  bg,
  href,
  urgent,
}: {
  icon: React.ReactNode
  label: string
  value: number
  bg: string
  href: string
  urgent?: boolean
}) {
  return (
    <Link
      href={href as any}
      className={`block bg-white rounded-xl border p-5 hover:shadow-md transition-all ${
        urgent ? 'border-orange-300 bg-orange-50/20' : 'border-gray-200'
      }`}
    >
      <div className="flex items-center justify-between">
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${bg}`}>
          {icon}
        </div>
        {urgent && (
          <span className="text-[11px] font-bold text-orange-600 bg-orange-100 px-2 py-0.5 rounded-full">
            Perlu tindakan
          </span>
        )}
      </div>
      <p className="text-2xl font-black text-gray-900 mt-3">{value}</p>
      <p className="text-xs font-medium text-gray-500 mt-0.5">{label}</p>
    </Link>
  )
}
