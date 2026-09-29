import { Metadata } from 'next'
import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/db'
import Link from 'next/link'
import { ArrowRight, Calendar, Clock, CheckSquare, User, Users, Coffee, Building2 } from 'lucide-react'
import { formatDate, formatTime } from '@/lib/utils'

export const metadata: Metadata = { title: 'Panel Approval' }

export default async function ApprovalsPage() {
  const session = await auth()
  const userId = session!.user!.id!
  const role = session!.user!.role ?? 'USER'

  if (!['APPROVER', 'ADMIN', 'SUPER_ADMIN'].includes(role)) {
    redirect('/dashboard')
  }

  // Pending bookings di mana user adalah approver level saat ini
  const pendingBookings = await prisma.booking.findMany({
    where: {
      status: 'PENDING',
      approvalFlow: {
        steps: {
          some: {
            approverId: userId,
          },
        },
      },
    },
    include: {
      room: { select: { name: true, location: true, capacity: true } },
      requester: { select: { name: true, division: true } },
      approvalFlow: {
        include: {
          steps: { where: { approverId: userId }, select: { level: true, label: true } },
        },
      },
      _count: { select: { participants: true } },
    },
    orderBy: { createdAt: 'asc' },
  })

  // Filter hanya yang level-nya match dengan currentLevel
  const myPending = pendingBookings.filter((b) => {
    const myStep = b.approvalFlow?.steps[0]
    return myStep && myStep.level === b.currentLevel
  })

  // Riwayat approval yang sudah saya proses
  const recentActions = await prisma.approvalAction.findMany({
    where: { approverId: userId },
    include: {
      booking: {
        select: { id: true, title: true, status: true, startAt: true, room: { select: { name: true } } },
      },
      approvalStep: { select: { label: true } },
    },
    orderBy: { createdAt: 'desc' },
    take: 10,
  })

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Panel Approval</h1>
        <p className="text-gray-500 mt-1">
          Review pengajuan peminjaman ruang rapat, kapasitas, dan kebutuhan konsumsi
        </p>
      </div>

      {/* Pending */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <h2 className="font-semibold text-gray-800">Menunggu Tindakan Anda</h2>
          {myPending.length > 0 && (
            <span className="px-2.5 py-0.5 rounded-full bg-orange-100 text-orange-700 text-xs font-bold">
              {myPending.length} perlu diproses
            </span>
          )}
        </div>

        {myPending.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 py-12 text-center shadow-xs">
            <CheckSquare className="w-10 h-10 text-green-400 mx-auto mb-3" />
            <p className="text-gray-700 font-semibold">Semua pengajuan sudah diproses</p>
            <p className="text-xs text-gray-400 mt-1">Tidak ada pengajuan yang perlu ditindaklanjuti saat ini</p>
          </div>
        ) : (
          <div className="space-y-3.5">
            {myPending.map((booking) => {
              const participantCount = booking._count.participants
              const totalAttendees = participantCount + 1 // Peserta + Pemohon

              return (
                <Link
                  key={booking.id}
                  href={`/bookings/${booking.id}` as any}
                  className="block bg-white rounded-xl border border-orange-200/90 p-5 hover:shadow-md hover:border-orange-300 transition-all group"
                >
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1.5">
                        <span className="text-xs font-semibold text-orange-700 bg-orange-50 border border-orange-200 px-2.5 py-0.5 rounded-full">
                          Level {booking.approvalFlow?.steps[0]?.level}: {booking.approvalFlow?.steps[0]?.label}
                        </span>
                      </div>
                      <h3 className="font-bold text-gray-900 text-base group-hover:text-blue-600 transition-colors">
                        {booking.title}
                      </h3>

                      <div className="flex items-center gap-1.5 mt-1 text-sm text-gray-600">
                        <User className="w-3.5 h-3.5 text-gray-400" />
                        <span>Diajukan oleh: <strong>{booking.requester.name}</strong></span>
                        {booking.requester.division && (
                          <span className="text-gray-400">· {booking.requester.division}</span>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center gap-4 mt-2.5 text-xs text-gray-500">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5 text-gray-400" />
                          {formatDate(booking.startAt, 'EEEE, dd MMMM yyyy')}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-gray-400" />
                          {formatTime(booking.startAt)} – {formatTime(booking.endAt)}
                        </span>
                        <span className="flex items-center gap-1">
                          <Building2 className="w-3.5 h-3.5 text-gray-400" />
                          {booking.room.name} · {booking.room.location}
                        </span>
                      </div>

                      {/* INFORMASI KONSUMSI & JUMLAH PESERTA */}
                      <div className="mt-3.5 pt-3 border-t border-gray-100 flex flex-wrap items-center gap-2.5">
                        <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-50 border border-amber-200 text-amber-900 rounded-lg text-xs font-semibold">
                          <span>🍱</span>
                          <span>
                            Estimasi Konsumsi: <strong>{totalAttendees} Porsi</strong>
                          </span>
                          <span className="text-amber-700 font-normal">
                            ({participantCount} peserta + 1 pemohon)
                          </span>
                        </div>
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-gray-50 border border-gray-200 text-gray-700 rounded-lg text-xs font-medium">
                          <Users className="w-3.5 h-3.5 text-gray-400" />
                          <span>Kapasitas Ruang: {booking.room.capacity} org</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex sm:flex-col items-center sm:items-end justify-between self-stretch shrink-0 pt-2 sm:pt-0">
                      <span className="px-3 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-100 flex items-center gap-1">
                        <Users className="w-3.5 h-3.5" />
                        {totalAttendees} Peserta
                      </span>
                      <div className="flex items-center gap-1 text-xs text-blue-600 font-semibold group-hover:translate-x-1 transition-transform mt-auto">
                        <span>Review & Setujui</span>
                        <ArrowRight className="w-4 h-4" />
                      </div>
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </div>

      {/* Riwayat */}
      <div>
        <h2 className="font-semibold text-gray-800 mb-3">Riwayat Approval Saya</h2>
        {recentActions.length === 0 ? (
          <p className="text-sm text-gray-400">Belum ada riwayat approval</p>
        ) : (
          <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-50 shadow-xs">
            {recentActions.map((action) => (
              <Link
                key={action.id}
                href={`/bookings/${action.bookingId}`}
                className="flex items-center gap-4 px-5 py-3.5 hover:bg-gray-50 transition-colors"
              >
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-sm ${
                    action.action === 'APPROVE'
                      ? 'bg-green-100 text-green-700'
                      : action.action === 'REJECT'
                      ? 'bg-red-100 text-red-700'
                      : 'bg-yellow-100 text-yellow-700'
                  }`}
                >
                  {action.action === 'APPROVE' ? '✅' : action.action === 'REJECT' ? '❌' : '🔄'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{action.booking.title}</p>
                  <p className="text-xs text-gray-400">
                    {action.booking.room.name} · {action.approvalStep.label}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xs font-medium text-gray-600">{formatDate(action.booking.startAt)}</p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
