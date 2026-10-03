import { Metadata } from 'next'
import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/db'
import Link from 'next/link'
import {
  ArrowRight,
  Calendar,
  Clock,
  CheckSquare,
  User,
  Users,
  Building2,
  UtensilsCrossed,
  CheckCircle2,
  XCircle,
  RotateCcw,
  Sparkles,
  ShieldCheck,
  MapPin,
  ChevronRight,
} from 'lucide-react'
import { formatDate, formatTime, generateInitials } from '@/lib/utils'

export const metadata: Metadata = { title: 'Panel Approval | MeetThink' }

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
    <div className="max-w-5xl mx-auto space-y-8">
      {/* Page Header */}
      <div className="pb-3 border-b border-slate-200/60">
        <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-orange-50 text-orange-700 border border-orange-200/60 mb-1.5">
          <ShieldCheck className="w-3.5 h-3.5 text-orange-500" />
          <span>Workflow & Verifikasi</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          Panel Persetujuan Rapat
        </h1>
        <p className="text-slate-500 mt-1 text-xs sm:text-sm">
          Tinjau pengajuan jadwal, verifikasi ketersediaan ruang, kapasitas, dan kebutuhan logistik/konsumsi
        </p>
      </div>

      {/* Pending Approval Section */}
      <div>
        <div className="flex items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-2.5">
            <h2 className="font-bold text-slate-900 text-lg">Menunggu Tindakan Anda</h2>
            {myPending.length > 0 ? (
              <span className="px-2.5 py-0.5 rounded-full bg-orange-100 text-orange-700 text-xs font-bold border border-orange-200/80">
                {myPending.length} Perlu Diproses
              </span>
            ) : (
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-xs font-semibold border border-emerald-200/60">
                Semua Bersih
              </span>
            )}
          </div>
        </div>

        {myPending.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200/90 py-14 px-4 text-center shadow-xs">
            <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-3 shadow-2xs">
              <CheckSquare className="w-7 h-7" />
            </div>
            <p className="text-slate-900 font-bold text-base">Semua Pengajuan Selesai Diproses</p>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto leading-relaxed">
              Tidak ada permohonan rapat yang sedang menunggu persetujuan Anda saat ini.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {myPending.map((booking) => {
              const participantCount = booking._count.participants
              const totalAttendees = participantCount + 1 // Peserta + Pemohon
              const currentStep = booking.approvalFlow?.steps[0]

              return (
                <Link
                  key={booking.id}
                  href={`/bookings/${booking.id}` as any}
                  className="block bg-white rounded-2xl border border-orange-200/90 p-5 sm:p-6 hover:shadow-md hover:border-orange-400 transition-all duration-150 group"
                >
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      {/* Level Step Badge */}
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-xs font-bold text-orange-800 bg-orange-100/80 border border-orange-200 px-3 py-0.5 rounded-full">
                          Level {currentStep?.level ?? 1}: {currentStep?.label ?? 'Verifikasi Rapat'}
                        </span>
                        <span className="text-[11px] font-semibold text-slate-400">
                          Diajukan {formatDate(booking.createdAt, 'dd MMM yyyy')}
                        </span>
                      </div>

                      {/* Meeting Title */}
                      <h3 className="font-extrabold text-slate-900 text-base sm:text-lg group-hover:text-blue-600 transition-colors mb-1.5">
                        {booking.title}
                      </h3>

                      {/* Requester Info */}
                      <div className="flex items-center gap-2 mb-3 text-xs sm:text-sm text-slate-600">
                        <div className="w-6 h-6 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-[10px] font-bold text-slate-700">
                          {generateInitials(booking.requester.name ?? 'U')}
                        </div>
                        <span>
                          Diajukan oleh: <strong className="text-slate-900">{booking.requester.name}</strong>
                          {booking.requester.division && (
                            <span className="text-slate-500 font-medium"> ({booking.requester.division})</span>
                          )}
                        </span>
                      </div>

                      {/* Time & Room Info Chips */}
                      <div className="flex flex-wrap items-center gap-2 text-xs text-slate-600 mb-3.5">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-50 border border-slate-200/60 font-medium">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" />
                          {formatDate(booking.startAt, 'EEEE, dd MMMM yyyy')}
                        </span>
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-50 border border-slate-200/60 font-medium">
                          <Clock className="w-3.5 h-3.5 text-slate-400" />
                          {formatTime(booking.startAt)} – {formatTime(booking.endAt)}
                        </span>
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-50 border border-slate-200/60 font-medium">
                          <Building2 className="w-3.5 h-3.5 text-slate-400" />
                          {booking.room.name} · {booking.room.location}
                        </span>
                      </div>

                      {/* Catering & Attendees Summary */}
                      <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center gap-2.5">
                        <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-50 border border-amber-200/80 text-amber-900 rounded-lg text-xs font-semibold">
                          <UtensilsCrossed className="w-3.5 h-3.5 text-amber-600" />
                          <span>
                            Estimasi Konsumsi: <strong>{totalAttendees} Porsi</strong>
                          </span>
                          <span className="text-amber-700 font-normal">
                            ({participantCount} peserta + 1 pemohon)
                          </span>
                        </div>
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-slate-50 border border-slate-200/60 text-slate-700 rounded-lg text-xs font-medium">
                          <Users className="w-3.5 h-3.5 text-slate-400" />
                          <span>Kapasitas Ruang: {booking.room.capacity} orang</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex sm:flex-col items-center sm:items-end justify-between self-stretch shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                      <span className="px-3 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200/70 flex items-center gap-1.5">
                        <Users className="w-3.5 h-3.5" />
                        <span>{totalAttendees} Peserta</span>
                      </span>
                      <div className="inline-flex items-center gap-1 text-xs text-blue-600 font-bold group-hover:translate-x-1 transition-transform mt-auto pt-2">
                        <span>Review & Setujui</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </div>
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </div>

      {/* Riwayat Approval Section */}
      <div>
        <h2 className="font-bold text-slate-900 text-lg mb-3">Riwayat Keputusan Saya</h2>
        {recentActions.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200/80 p-8 text-center text-xs text-slate-400">
            Belum ada riwayat persetujuan atau penolakan rapat
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-slate-200/90 divide-y divide-slate-100 shadow-xs overflow-hidden">
            {recentActions.map((action) => {
              const isApproved = action.action === 'APPROVE'
              const isRejected = action.action === 'REJECT'

              return (
                <Link
                  key={action.id}
                  href={`/bookings/${action.bookingId}`}
                  className="flex items-center gap-4 px-5 py-4 hover:bg-slate-50/80 transition-colors group"
                >
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 shadow-2xs ${
                      isApproved
                        ? 'bg-emerald-50 text-emerald-600 border border-emerald-200/80'
                        : isRejected
                        ? 'bg-rose-50 text-rose-600 border border-rose-200/80'
                        : 'bg-amber-50 text-amber-600 border border-amber-200/80'
                    }`}
                  >
                    {isApproved ? (
                      <CheckCircle2 className="w-4 h-4" />
                    ) : isRejected ? (
                      <XCircle className="w-4 h-4" />
                    ) : (
                      <RotateCcw className="w-4 h-4" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-slate-900 group-hover:text-blue-600 transition-colors truncate">
                      {action.booking.title}
                    </p>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {action.booking.room.name} · {action.approvalStep.label}
                    </p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <span
                      className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-bold border mb-0.5 ${
                        isApproved
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : isRejected
                          ? 'bg-rose-50 text-rose-700 border-rose-200'
                          : 'bg-amber-50 text-amber-700 border-amber-200'
                      }`}
                    >
                      {isApproved ? 'Disetujui' : isRejected ? 'Ditolak' : 'Revisi'}
                    </span>
                    <p className="text-[11px] text-slate-400">
                      {formatDate(action.createdAt, 'dd MMM yyyy')}
                    </p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-slate-500 group-hover:translate-x-0.5 transition-all flex-shrink-0" />
                </Link>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

