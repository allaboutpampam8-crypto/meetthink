import { Metadata } from 'next'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { formatTime, getMeetingLifecycle } from '@/lib/utils'
import Link from 'next/link'
import {
  CalendarDays,
  Clock,
  CheckSquare,
  ClipboardList,
  Plus,
  ArrowRight,
  MapPin,
  Users,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Calendar,
  Building2,
  ExternalLink,
  ChevronRight,
  CircleDot,
  FileCheck,
  ShieldAlert,
} from 'lucide-react'

export const metadata: Metadata = {
  title: 'Dashboard | MeetThink',
  description: 'Ringkasan aktivitas rapat, jadwal ruangan, dan tindak lanjut tugas Anda.',
}

export default async function DashboardPage() {
  const session = await auth()
  const userId = session!.user!.id!
  const userEmail = session!.user!.email ?? ''
  const role = session!.user!.role ?? 'USER'
  const userName = session?.user?.name?.split(' ')[0] ?? 'Pengguna'

  const now = new Date()
  const in7Days = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0)
  const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59)

  // Fetch upcoming bookings, recent past bookings, my open action items, and active rooms in parallel
  const [upcomingBookings, recentPastBookings, myActionItems, activeRooms] = await Promise.all([
    // Upcoming & ongoing meetings
    prisma.booking.findMany({
      where: {
        endAt: { gte: now },
        startAt: { lte: in7Days },
        OR: [
          {
            requesterId: userId,
            status: { in: ['APPROVED', 'PENDING'] },
          },
          {
            status: 'APPROVED',
            participants: { some: { OR: [{ userId }, { email: userEmail }] } },
          },
        ],
      },
      include: {
        room: { select: { id: true, name: true, location: true, floor: true, capacity: true } },
        requester: { select: { id: true, name: true, division: true } },
        participants: { select: { id: true, attendedAt: true, name: true, email: true } },
        _count: { select: { participants: true } },
      },
      orderBy: { startAt: 'asc' },
      take: 8,
    }),

    // Recent past completed bookings
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
        meeting: { select: { id: true, isNotesFinalized: true } },
        _count: { select: { participants: true } },
      },
      orderBy: { startAt: 'desc' },
      take: 3,
    }),

    // My Open Action Items
    prisma.actionItem.findMany({
      where: {
        picId: userId,
        status: { in: ['OPEN', 'IN_PROGRESS', 'OVERDUE'] },
      },
      include: {
        meeting: {
          include: {
            booking: { select: { id: true, title: true } },
          },
        },
      },
      orderBy: { deadline: 'asc' },
      take: 4,
    }),

    // Quick status of active meeting rooms
    prisma.room.findMany({
      where: { isActive: true },
      include: {
        facilities: { take: 3 },
        bookings: {
          where: {
            status: 'APPROVED',
            startAt: { lte: now },
            endAt: { gte: now },
          },
          select: { id: true, title: true, endAt: true },
          take: 1,
        },
      },
      orderBy: { name: 'asc' },
      take: 4,
    }),
  ])

  // Count pending approvals for Approver / Admin
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
    pendingApprovalCount = pendingBookings.filter((b) =>
      b.approvalFlow?.steps.some(
        (s) => s.approverId === userId && s.level === b.currentLevel,
      ),
    ).length
  }

  // Count user's pending bookings
  const myPendingCount = await prisma.booking.count({
    where: { requesterId: userId, status: 'PENDING' },
  })

  // Count open action items
  const openActionItemsCount = await prisma.actionItem.count({
    where: { picId: userId, status: { in: ['OPEN', 'IN_PROGRESS', 'OVERDUE'] } },
  })

  // Detect live / ongoing meeting right now
  const ongoingMeeting = upcomingBookings.find((b) => {
    const start = new Date(b.startAt)
    const end = new Date(b.endAt)
    return b.status === 'APPROVED' && now >= start && now <= end
  })

  // Filter meetings today
  const todayBookings = upcomingBookings.filter((b) => {
    const start = new Date(b.startAt)
    return start >= startOfToday && start <= endOfToday
  })

  // Date and greeting
  const hour = now.getHours()
  const greeting =
    hour < 11
      ? 'Selamat Pagi'
      : hour < 15
      ? 'Selamat Siang'
      : hour < 18
      ? 'Selamat Sore'
      : 'Selamat Malam'

  const formattedDate = new Intl.DateTimeFormat('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(now)

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* 1. Hero & Welcome Command Bar */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 p-6 sm:p-8 text-white shadow-md">
        {/* Subtle decorative background glow */}
        <div className="absolute -right-10 -top-10 w-64 h-64 bg-orange-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute right-40 -bottom-10 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-sm border border-white/10 text-xs font-medium text-slate-200">
              <Calendar className="w-3.5 h-3.5 text-orange-400" />
              <span>{formattedDate}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
              {greeting}, {userName} 👋
            </h1>
            <p className="text-sm text-slate-300 max-w-xl leading-relaxed">
              {todayBookings.length > 0 ? (
                <span>
                  Hari ini Anda memiliki{' '}
                  <strong className="text-orange-300 font-semibold">
                    {todayBookings.length} jadwal rapat
                  </strong>
                  . Pastikan absensi dan agenda sudah dipersiapkan.
                </span>
              ) : (
                <span>
                  Tidak ada agenda rapat untuk hari ini. Anda dapat fokus menyelesaikan tindak lanjut atau melakukan reservasi ruangan baru.
                </span>
              )}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Link
              href="/bookings"
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 active:scale-[0.98] border border-white/15 text-white font-medium text-sm transition-all duration-150 backdrop-blur-sm shadow-xs"
            >
              <CalendarDays className="w-4 h-4 text-slate-300" />
              <span>Lihat Kalender</span>
            </Link>
            <Link
              href="/bookings/new"
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 active:scale-[0.98] text-white font-semibold text-sm transition-all duration-150 shadow-md shadow-orange-500/25"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span>Buat Booking Ruang</span>
            </Link>
          </div>
        </div>
      </div>

      {/* 2. Live Meeting Spotlight (Muncul jika ada rapat sedang berlangsung saat ini) */}
      {ongoingMeeting && (
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-emerald-50 via-teal-50/60 to-white border-2 border-emerald-300 p-5 sm:p-6 shadow-sm">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="relative flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-600" />
                </span>
                <span className="text-xs font-black uppercase tracking-wider text-emerald-800 bg-emerald-100 px-2.5 py-0.5 rounded-full border border-emerald-200">
                  Sedang Berlangsung Sekarang
                </span>
                <span className="text-xs text-emerald-700 font-medium">
                  {formatTime(ongoingMeeting.startAt)} – {formatTime(ongoingMeeting.endAt)} WIB
                </span>
              </div>

              <h2 className="text-xl font-bold text-slate-900 tracking-tight">
                {ongoingMeeting.title}
              </h2>

              <div className="flex flex-wrap items-center gap-4 text-xs text-slate-600">
                <span className="flex items-center gap-1.5 font-medium text-slate-700">
                  <MapPin className="w-4 h-4 text-emerald-600" />
                  {ongoingMeeting.room.name}{' '}
                  {ongoingMeeting.room.floor ? `(${ongoingMeeting.room.floor})` : ''} ·{' '}
                  {ongoingMeeting.room.location}
                </span>
                <span className="flex items-center gap-1.5">
                  <Users className="w-4 h-4 text-slate-400" />
                  {ongoingMeeting.participants.length + 1} Peserta
                </span>
                <span className="text-slate-500">
                  Penyelenggara: <strong className="text-slate-800">{ongoingMeeting.requester.name}</strong>
                </span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Link
                href={`/bookings/${ongoingMeeting.id}` as any}
                className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm transition-colors shadow-xs"
              >
                <span>Masuk Ruang & Absensi</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* 3. KPI Metrics Grid (Bento Style) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Rapat Mendatang */}
        <StatCard
          icon={<CalendarDays className="w-5 h-5 text-blue-600" />}
          label="Rapat Mendatang"
          subLabel="7 hari ke depan"
          value={upcomingBookings.length}
          iconBg="bg-blue-50 border-blue-100"
          href="/bookings"
          pillText={todayBookings.length > 0 ? `${todayBookings.length} hari ini` : undefined}
          pillColor="bg-blue-100 text-blue-700"
        />

        {/* Card 2: Menunggu Persetujuan (Khusus Approver/Admin) atau Booking Aktif */}
        {['APPROVER', 'ADMIN', 'SUPER_ADMIN'].includes(role) ? (
          <StatCard
            icon={<CheckSquare className="w-5 h-5 text-amber-600" />}
            label="Persetujuan Masuk"
            subLabel="Perlu evaluasi Anda"
            value={pendingApprovalCount}
            iconBg="bg-amber-50 border-amber-100"
            href="/approvals"
            urgent={pendingApprovalCount > 0}
            pillText={pendingApprovalCount > 0 ? 'Perlu Ditinjau' : 'Semua Beres'}
            pillColor={pendingApprovalCount > 0 ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-600'}
          />
        ) : (
          <StatCard
            icon={<CheckCircle2 className="w-5 h-5 text-emerald-600" />}
            label="Rapat Disetujui"
            subLabel="Jadwal konfirmasi aktif"
            value={upcomingBookings.filter((b) => b.status === 'APPROVED').length}
            iconBg="bg-emerald-50 border-emerald-100"
            href="/bookings"
            pillText="Terkonfirmasi"
            pillColor="bg-emerald-100 text-emerald-700"
          />
        )}

        {/* Card 3: Booking Saya (Pending) */}
        <StatCard
          icon={<Clock className="w-5 h-5 text-indigo-600" />}
          label="Pengajuan Pending"
          subLabel="Menunggu persetujuan"
          value={myPendingCount}
          iconBg="bg-indigo-50 border-indigo-100"
          href="/bookings?tab=list&status=PENDING"
          pillText={myPendingCount > 0 ? 'Dalam Proses' : 'Nihil'}
          pillColor="bg-indigo-100 text-indigo-700"
        />

        {/* Card 4: Tindak Lanjut Terbuka */}
        <StatCard
          icon={<ClipboardList className="w-5 h-5 text-rose-600" />}
          label="Tindak Lanjut Tugas"
          subLabel="Tugas PIC yang aktif"
          value={openActionItemsCount}
          iconBg="bg-rose-50 border-rose-100"
          href="/action-items"
          urgent={openActionItemsCount > 0}
          pillText={openActionItemsCount > 0 ? `${openActionItemsCount} Belum Selesai` : 'Tuntas'}
          pillColor={openActionItemsCount > 0 ? 'bg-rose-100 text-rose-800 font-bold' : 'bg-slate-100 text-slate-600'}
        />
      </div>

      {/* 4. Main Content: 2-Column Responsive Layout */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Kolom Kiri: Rapat Mendatang & Riwayat Selesai (2/3 width) */}
        <div className="xl:col-span-2 space-y-6">
          {/* Card: Rapat Mendatang */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-6 py-4.5 border-b border-slate-100 bg-slate-50/50">
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <h2 className="font-bold text-slate-900 text-base">Jadwal Rapat Mendatang</h2>
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-200/80 text-slate-700">
                    {upcomingBookings.length}
                  </span>
                </div>
                <p className="text-xs text-slate-500">
                  Daftar agenda rapat aktif dalam 7 hari ke depan
                </p>
              </div>
              <Link
                href="/bookings"
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:text-blue-700 group transition-colors"
              >
                <span>Buka Kalender Rapat</span>
                <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
              </Link>
            </div>

            {upcomingBookings.length === 0 ? (
              <div className="py-16 text-center px-4">
                <div className="w-14 h-14 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center mx-auto mb-3.5 text-blue-500">
                  <CalendarDays className="w-7 h-7" />
                </div>
                <h3 className="text-slate-800 font-bold text-sm">Tidak Ada Rapat Terjadwal</h3>
                <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                  Anda tidak memiliki agenda rapat dalam 7 hari ke depan. Butuh mengadakan rapat tim?
                </p>
                <Link
                  href="/bookings/new"
                  className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-medium text-xs transition-colors shadow-xs"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Reservasi Ruangan Sekarang</span>
                </Link>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {upcomingBookings.map((booking) => {
                  const isRequester = booking.requester.id === userId
                  const isToday =
                    new Date(booking.startAt).toDateString() === now.toDateString()
                  const lifecycle = getMeetingLifecycle(booking)
                  const totalExpected = booking.participants.length + 1
                  const attendedCount =
                    (booking.requesterAttendedAt ? 1 : 0) +
                    booking.participants.filter((p) => p.attendedAt !== null).length

                  return (
                    <Link
                      key={booking.id}
                      href={`/bookings/${booking.id}` as any}
                      className="group flex flex-col sm:flex-row sm:items-center gap-4 px-6 py-4 hover:bg-slate-50/80 transition-all duration-150"
                    >
                      {/* Date Badge */}
                      <div
                        className={`w-14 text-center flex-shrink-0 rounded-xl py-2 px-1 border transition-colors ${
                          isToday
                            ? 'bg-blue-50 border-blue-200 text-blue-900'
                            : 'bg-slate-50 border-slate-200 text-slate-800 group-hover:border-slate-300'
                        }`}
                      >
                        <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                          {new Date(booking.startAt).toLocaleDateString('id-ID', {
                            weekday: 'short',
                          })}
                        </div>
                        <div
                          className={`text-xl font-black leading-tight ${
                            isToday ? 'text-blue-600' : 'text-slate-900'
                          }`}
                        >
                          {new Date(booking.startAt).getDate()}
                        </div>
                        <div className="text-[10px] font-medium text-slate-400">
                          {new Date(booking.startAt).toLocaleDateString('id-ID', {
                            month: 'short',
                          })}
                        </div>
                      </div>

                      {/* Info Detail */}
                      <div className="flex-1 min-w-0 space-y-1.5">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-bold text-slate-900 text-sm truncate group-hover:text-blue-600 transition-colors">
                            {booking.title}
                          </p>

                          {/* Lifecycle Status Pill */}
                          <span
                            className={`text-[11px] px-2.5 py-0.5 rounded-full font-semibold border flex items-center gap-1.5 ${lifecycle.color}`}
                          >
                            {lifecycle.isOngoing && (
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                            )}
                            {lifecycle.label}
                          </span>

                          {isToday && !lifecycle.isOngoing && (
                            <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-amber-100 text-amber-800 border border-amber-200">
                              Hari Ini
                            </span>
                          )}

                          {/* Role Tag */}
                          <span
                            className={`text-[10px] px-2 py-0.5 rounded-md font-medium border ${
                              isRequester
                                ? 'bg-purple-50 text-purple-700 border-purple-200'
                                : 'bg-slate-100 text-slate-600 border-slate-200'
                            }`}
                          >
                            {isRequester ? 'Penyelenggara' : 'Peserta'}
                          </span>
                        </div>

                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500">
                          <span className="flex items-center gap-1 text-slate-700 font-medium">
                            <MapPin className="w-3.5 h-3.5 text-slate-400" />
                            {booking.room.name}{' '}
                            {booking.room.floor ? `(${booking.room.floor})` : ''} ·{' '}
                            {booking.room.location}
                          </span>
                          <span className="text-slate-400">
                            Diajukan oleh: <span className="text-slate-600">{booking.requester.name}</span>
                          </span>
                        </div>
                      </div>

                      {/* Time & Attendance */}
                      <div className="flex sm:flex-col items-center sm:items-end justify-between text-xs flex-shrink-0 pt-1 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                        <div className="flex items-center gap-1.5 font-bold text-slate-900 bg-slate-100/70 px-2.5 py-1 rounded-lg">
                          <Clock className="w-3.5 h-3.5 text-slate-500" />
                          <span>
                            {formatTime(booking.startAt)} – {formatTime(booking.endAt)}
                          </span>
                        </div>

                        <div className="mt-1 flex items-center gap-1 text-[11px] text-slate-500">
                          <Users className="w-3 h-3 text-slate-400" />
                          {lifecycle.isOngoing ? (
                            <span className="text-emerald-700 font-bold">
                              {attendedCount}/{totalExpected} hadir
                            </span>
                          ) : (
                            <span>{totalExpected} peserta</span>
                          )}
                        </div>
                      </div>

                      <ChevronRight className="hidden sm:block w-4 h-4 text-slate-300 group-hover:text-blue-600 group-hover:translate-x-0.5 transition-all flex-shrink-0" />
                    </Link>
                  )
                })}
              </div>
            )}
          </div>

          {/* Card: Riwayat Rapat Selesai */}
          {recentPastBookings.length > 0 && (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
              <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
                <div className="space-y-0.5">
                  <h3 className="font-bold text-slate-900 text-sm">Riwayat Rapat Selesai</h3>
                  <p className="text-xs text-slate-500">
                    Akses ringkasan notulensi dan arsip absensi rapat sebelumnya
                  </p>
                </div>
                <Link
                  href="/bookings?tab=list&status=COMPLETED"
                  className="flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-700"
                >
                  <span>Semua Riwayat</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              <div className="divide-y divide-slate-100">
                {recentPastBookings.map((booking) => {
                  const isRequester = booking.requester.id === userId
                  const totalExpected = booking.participants.length + 1
                  const attendedCount =
                    (booking.requesterAttendedAt ? 1 : 0) +
                    booking.participants.filter((p) => p.attendedAt !== null).length

                  return (
                    <Link
                      key={booking.id}
                      href={`/bookings/${booking.id}` as any}
                      className="group flex flex-col sm:flex-row sm:items-center gap-4 px-6 py-3.5 hover:bg-slate-50/70 transition-colors"
                    >
                      <div className="w-10 h-10 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-600 flex-shrink-0 group-hover:bg-blue-50 group-hover:text-blue-600 group-hover:border-blue-200 transition-colors">
                        <FileCheck className="w-5 h-5" />
                      </div>

                      <div className="flex-1 min-w-0 space-y-1">
                        <div className="flex items-center gap-2">
                          <p className="font-semibold text-sm text-slate-900 truncate group-hover:text-blue-600 transition-colors">
                            {booking.title}
                          </p>
                          {booking.meeting?.isNotesFinalized && (
                            <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                              Notulen Final
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-500 truncate">
                          {booking.room.name} · {new Date(booking.startAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })} · Oleh: {booking.requester.name}
                        </p>
                      </div>

                      <div className="text-xs text-right text-slate-500 flex-shrink-0">
                        <span className="font-medium text-slate-700">
                          {attendedCount}/{totalExpected} hadir
                        </span>
                      </div>

                      <ChevronRight className="hidden sm:block w-4 h-4 text-slate-300 group-hover:text-blue-600 group-hover:translate-x-0.5 transition-all flex-shrink-0" />
                    </Link>
                  )
                })}
              </div>
            </div>
          )}
        </div>

        {/* Kolom Kanan: Tindak Lanjut & Ketersediaan Ruangan (1/3 width) */}
        <div className="xl:col-span-1 space-y-6">
          {/* Widget 1: Tindak Lanjut Saya (Action Items) */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 bg-slate-50/50">
              <div className="flex items-center gap-2">
                <ClipboardList className="w-4 h-4 text-rose-500" />
                <h3 className="font-bold text-slate-900 text-sm">Tindak Lanjut Tugas</h3>
              </div>
              <Link
                href="/action-items"
                className="text-xs font-semibold text-blue-600 hover:text-blue-700"
              >
                Lihat Semua
              </Link>
            </div>

            {myActionItems.length === 0 ? (
              <div className="p-6 text-center">
                <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto mb-2" />
                <p className="text-xs font-bold text-slate-800">Semua Tugas Tuntas!</p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Anda tidak memiliki tanggungan tindak lanjut rapat yang terbuka saat ini.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {myActionItems.map((item) => {
                  const deadline = new Date(item.deadline)
                  const isOverdue = now > deadline && item.status !== 'DONE'

                  return (
                    <Link
                      key={item.id}
                      href={`/bookings/${item.meeting.booking.id}` as any}
                      className="block p-4 hover:bg-slate-50/80 transition-colors group"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-xs font-semibold text-slate-800 line-clamp-2 group-hover:text-blue-600 transition-colors">
                          {item.description}
                        </p>
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider flex-shrink-0 ${
                            isOverdue
                              ? 'bg-rose-100 text-rose-700 border border-rose-200'
                              : 'bg-amber-100 text-amber-800 border border-amber-200'
                          }`}
                        >
                          {isOverdue ? 'Terlambat' : 'Pending'}
                        </span>
                      </div>

                      <div className="mt-2 flex items-center justify-between text-[11px] text-slate-500">
                        <span className="truncate max-w-[140px] text-slate-400">
                          {item.meeting.booking.title}
                        </span>
                        <span
                          className={`font-semibold ${
                            isOverdue ? 'text-rose-600' : 'text-slate-600'
                          }`}
                        >
                          Tenggat: {deadline.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
                        </span>
                      </div>
                    </Link>
                  )
                })}
              </div>
            )}
          </div>

          {/* Widget 2: Status Ruang Rapat (Live Availability) */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 bg-slate-50/50">
              <div className="flex items-center gap-2">
                <Building2 className="w-4 h-4 text-orange-500" />
                <h3 className="font-bold text-slate-900 text-sm">Status Ruang Rapat</h3>
              </div>
              <Link
                href="/bookings"
                className="text-xs font-semibold text-blue-600 hover:text-blue-700"
              >
                Cek Semua
              </Link>
            </div>

            <div className="divide-y divide-slate-100">
              {activeRooms.map((room) => {
                const activeBooking = room.bookings[0]
                const isOccupied = !!activeBooking

                return (
                  <div
                    key={room.id}
                    className="p-4 flex items-center justify-between gap-3 hover:bg-slate-50/60 transition-colors"
                  >
                    <div className="min-w-0 space-y-0.5">
                      <div className="flex items-center gap-2">
                        <p className="font-bold text-xs text-slate-900 truncate">
                          {room.name}
                        </p>
                        <span className="text-[10px] text-slate-400 font-medium">
                          Kap. {room.capacity} org
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 truncate">
                        {room.location}
                      </p>
                      {isOccupied ? (
                        <p className="text-[11px] font-semibold text-rose-600 flex items-center gap-1 pt-0.5">
                          <CircleDot className="w-3 h-3 text-rose-500 animate-pulse" />
                          Terpakai s/d {formatTime(activeBooking.endAt)}
                        </p>
                      ) : (
                        <p className="text-[11px] font-semibold text-emerald-600 flex items-center gap-1 pt-0.5">
                          <CircleDot className="w-3 h-3 text-emerald-500" />
                          Tersedia sekarang
                        </p>
                      )}
                    </div>

                    <Link
                      href="/bookings/new"
                      className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-colors flex-shrink-0 ${
                        isOccupied
                          ? 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                          : 'bg-blue-50 text-blue-700 hover:bg-blue-100'
                      }`}
                    >
                      Pesan
                    </Link>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Widget 3: Quick Links / Bantuan */}
          <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl p-5 text-white shadow-xs">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="w-4 h-4 text-orange-400" />
              <h3 className="font-bold text-sm text-white">MeetThink Assistant</h3>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Membutuhkan panduan alur approval bertingkat atau reservasi ruang khusus dengan fasilitas proyektor & sound system?
            </p>
            <div className="mt-4 pt-3 border-t border-slate-700/60 flex items-center justify-between">
              <Link
                href="/bookings/new"
                className="text-xs font-bold text-orange-400 hover:text-orange-300 flex items-center gap-1 transition-colors"
              >
                <span>Ajukan Booking Sekarang</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function StatCard({
  icon,
  label,
  subLabel,
  value,
  iconBg,
  href,
  urgent,
  pillText,
  pillColor,
}: {
  icon: React.ReactNode
  label: string
  subLabel?: string
  value: number
  iconBg: string
  href: string
  urgent?: boolean
  pillText?: string
  pillColor?: string
}) {
  return (
    <Link
      href={href as any}
      className={`group block bg-white rounded-2xl border p-5 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md ${
        urgent
          ? 'border-amber-300 bg-amber-50/20 shadow-xs'
          : 'border-slate-200/80 hover:border-slate-300 shadow-xs'
      }`}
    >
      <div className="flex items-center justify-between mb-3">
        <div
          className={`w-11 h-11 rounded-xl flex items-center justify-center border transition-transform duration-200 group-hover:scale-105 ${iconBg}`}
        >
          {icon}
        </div>
        {pillText && (
          <span
            className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full ${
              pillColor ?? 'bg-slate-100 text-slate-700'
            }`}
          >
            {pillText}
          </span>
        )}
      </div>
      <div>
        <p className="text-3xl font-black text-slate-900 tracking-tight group-hover:text-blue-600 transition-colors">
          {value}
        </p>
        <p className="text-xs font-bold text-slate-800 mt-1">{label}</p>
        {subLabel && <p className="text-[11px] text-slate-400 mt-0.5">{subLabel}</p>}
      </div>
    </Link>
  )
}
