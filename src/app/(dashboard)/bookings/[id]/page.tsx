import { Metadata } from 'next'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft,
  Calendar,
  Clock,
  MapPin,
  Users,
  CheckCircle2,
  XCircle,
  AlertCircle,
  RotateCcw,
  Coffee,
  Building2,
  Info,
} from 'lucide-react'
import { formatDateTime, formatTime, bookingStatusColor, bookingStatusLabel, getMeetingLifecycle } from '@/lib/utils'
import { ApprovalActionForm } from '@/components/approval/approval-action-form'
import { MeetingMinutesManager } from '@/components/meeting/meeting-minutes-manager'
import { CompleteMeetingButton } from '@/components/booking/complete-meeting-button'
import { AttendanceList } from '@/components/attendance/attendance-list'

export const metadata: Metadata = { title: 'Detail Booking & Rapat' }

export default async function BookingDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const session = await auth()
  const { id } = await params

  const booking = await prisma.booking.findUnique({
    where: { id },
    include: {
      room: { include: { facilities: true } },
      requester: { select: { id: true, name: true, email: true, division: true } },
      participants: { include: { user: { select: { id: true, name: true, email: true } } } },
      approvalFlow: {
        include: {
          steps: {
            orderBy: { level: 'asc' },
            include: { approver: { select: { name: true } } },
          },
        },
      },
      actions: {
        include: {
          approver: { select: { name: true } },
          approvalStep: { select: { label: true, level: true } },
        },
        orderBy: { createdAt: 'asc' },
      },
      meeting: {
        include: {
          actionItems: {
            include: { pic: { select: { id: true, name: true, email: true, division: true } } },
            orderBy: { createdAt: 'asc' },
          },
        },
      },
    },
  })

  if (!booking) notFound()

  const userId = session!.user!.id!
  const role = session!.user!.role ?? 'USER'

  // Hitung jumlah kehadiran & estimasi konsumsi
  const participantCount = booking.participants.length
  const totalAttendees = participantCount + 1 // Peserta + 1 Pemohon
  const requiredCount = booking.participants.filter((p) => p.type === 'REQUIRED').length + 1
  const optionalCount = booking.participants.filter((p) => p.type === 'OPTIONAL').length

  // Cek apakah user adalah approver level saat ini
  const currentStep = booking.approvalFlow?.steps.find(
    (s) => s.level === booking.currentLevel,
  )
  const isCurrentApprover =
    booking.status === 'PENDING' &&
    currentStep?.approver &&
    currentStep.approverId === userId

  // Auto-ensure meeting record exists if booking is approved
  let meeting = booking.meeting
  if (booking.status === 'APPROVED' && !meeting) {
    meeting = await prisma.meeting.create({
      data: { bookingId: booking.id },
      include: {
        actionItems: {
          include: { pic: { select: { id: true, name: true, email: true, division: true } } },
          orderBy: { createdAt: 'asc' },
        },
      },
    })
  }

  // Candidates list for action item assignments (requester + all participants)
  const candidates: { id: string; name: string; email: string; division?: string | null }[] = [
    {
      id: booking.requester.id,
      name: booking.requester.name,
      email: booking.requester.email,
      division: booking.requester.division,
    },
    ...booking.participants
      .filter((p) => p.userId && p.userId !== booking.requester.id)
      .map((p) => ({
        id: p.userId!,
        name: p.name ?? p.email,
        email: p.email,
        division: null,
      })),
  ]

  const isOrganizer = booking.requesterId === userId
  const isAdmin = ['ADMIN', 'SUPER_ADMIN'].includes(role)
  const isApproverInFlow =
    Boolean(booking.approvalFlow?.steps.some((s) => s.approverId === userId)) || role === 'APPROVER'
  const canManageMeeting = isOrganizer || isAdmin
  const canViewPending = isOrganizer || isApproverInFlow || isAdmin

  // Hak akses melihat rincian kalkulasi logistik konsumsi dan alur birokrasi approval
  // Hanya Pembuat Rapat (Organizer), Admin/Super Admin (GA), dan Approver yang dapat melihat
  const canViewLogistics = isOrganizer || isAdmin || isApproverInFlow
  const canViewApprovalFlow = isOrganizer || isAdmin || isApproverInFlow

  // Jika rapat masih PENDING, peserta undangan belum bisa melihat detailnya untuk menghindari kebingungan/batal rapat
  if (booking.status === 'PENDING' && !canViewPending) {
    return (
      <div className="max-w-md mx-auto my-16 bg-white rounded-2xl border border-gray-200 p-8 text-center shadow-xs space-y-4">
        <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-600 flex items-center justify-center mx-auto text-xl font-bold">
          ⏳
        </div>
        <h2 className="text-lg font-bold text-gray-900">Rapat Sedang Menunggu Persetujuan</h2>
        <p className="text-sm text-gray-500 leading-relaxed">
          Peminjaman ruang untuk rapat ini masih dalam proses persetujuan oleh approver. Informasi agenda dan presensi rapat akan otomatis muncul untuk peserta setelah booking disetujui.
        </p>
        <div className="pt-2">
          <Link
            href="/dashboard"
            className="inline-flex items-center justify-center px-4 py-2 bg-gray-900 text-white text-xs font-semibold rounded-lg hover:bg-gray-800 transition-colors"
          >
            Kembali ke Dashboard
          </Link>
        </div>
      </div>
    )
  }

  const lifecycle = getMeetingLifecycle(booking)
  const isTimePassed = new Date() > new Date(booking.endAt)

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Back */}
      <Link
        href="/bookings"
        className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-800 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Kembali ke Daftar Booking
      </Link>

      {/* Header */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2.5">
              <h1 className="text-xl font-bold text-gray-900">{booking.title}</h1>
              <span
                className={`text-xs px-2.5 py-1 rounded-full font-semibold border ${lifecycle.color}`}
              >
                {lifecycle.label}
              </span>
            </div>
            <p className="text-gray-500 mt-1 text-sm">
              Diajukan oleh <strong>{booking.requester.name}</strong>{' '}
              {booking.requester.division ? `(${booking.requester.division})` : ''} ·{' '}
              <span className="text-gray-400">{booking.requester.email}</span>
            </p>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0 self-start">
            <CompleteMeetingButton
              bookingId={booking.id}
              status={booking.status}
              canManage={canManageMeeting}
              isTimePassed={isTimePassed}
            />
          </div>
        </div>

        {/* Banner Status Lifecycle */}
        {lifecycle.isCompleted && (
          <div className="mt-4 p-3.5 bg-slate-50 border border-slate-200/90 rounded-xl flex items-center gap-3 text-xs">
            <div className="w-7 h-7 rounded-lg bg-emerald-100 border border-emerald-200 flex items-center justify-center text-emerald-700 flex-shrink-0">
              <CheckCircle2 className="w-4 h-4" />
            </div>
            <div>
              <p className="font-bold text-slate-800">Rapat Telah Selesai Dilaksanakan</p>
              <p className="text-slate-600 mt-0.5">
                Agenda rapat ini telah selesai pada {formatDateTime(booking.endAt)}. Notulensi dan catatan tindak lanjut dapat diakses di bawah.
              </p>
            </div>
          </div>
        )}

        {lifecycle.isOngoing && (
          <div className="mt-4 p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-3 text-xs">
            <span className="relative flex h-3 w-3 flex-shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
            </span>
            <div>
              <p className="font-bold text-emerald-950">Rapat Sedang Berlangsung Sekarang</p>
              <p className="text-emerald-800 mt-0.5">
                Jadwal rapat: {formatTime(booking.startAt)} – {formatTime(booking.endAt)} ({booking.room.name}).
              </p>
            </div>
          </div>
        )}

        {/* Info Grid with Konsumsi */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mt-6 pt-4 border-t border-gray-100">
          <InfoItem icon={<Calendar className="w-4 h-4" />} label="Tanggal">
            {new Date(booking.startAt).toLocaleDateString('id-ID', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </InfoItem>
          <InfoItem icon={<Clock className="w-4 h-4" />} label="Waktu">
            {formatTime(booking.startAt)} – {formatTime(booking.endAt)}
          </InfoItem>
          <InfoItem icon={<MapPin className="w-4 h-4" />} label="Ruang & Kapasitas">
            {booking.room.name} ({booking.room.capacity} orang)
          </InfoItem>
          <InfoItem
            icon={<Users className="w-4 h-4" />}
            label={canViewLogistics ? 'Peserta & Konsumsi' : 'Total Peserta'}
          >
            <strong>{totalAttendees} Orang</strong>{' '}
            {canViewLogistics && <span className="text-gray-500 font-normal">({totalAttendees} Porsi)</span>}
          </InfoItem>
        </div>

        {booking.agenda && (
          <div className="mt-4 pt-4 border-t border-gray-100">
            <p className="text-xs font-semibold text-gray-700 uppercase tracking-wide mb-1">Agenda Rapat</p>
            <p className="text-sm text-gray-700 whitespace-pre-wrap">{booking.agenda}</p>
          </div>
        )}
      </div>

      {/* BOX KHUSUS FASILITAS & ESTIMASI KONSUMSI (Hanya untuk Pembuat Rapat, Admin/GA, dan Approver) */}
      {canViewLogistics ? (
        <div className="bg-amber-50/70 border border-amber-200/80 rounded-xl p-5 shadow-xs space-y-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-lg bg-amber-100 border border-amber-200 flex items-center justify-center text-lg">
                🍱
              </div>
              <div>
                <h2 className="text-sm font-bold text-amber-950">
                  Kebutuhan Konsumsi & Persiapan Fasilitas
                </h2>
                <p className="text-xs text-amber-800 mt-0.5">
                  Rincian jumlah orang yang hadir untuk persiapan logistik, konsumsi, dan fasilitas ruangan
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Card 1: Porsi Konsumsi */}
            <div className="bg-white rounded-lg p-3.5 border border-amber-200/90 shadow-2xs">
              <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide">
                Estimasi Kebutuhan Konsumsi
              </p>
              <p className="text-2xl font-black text-amber-900 mt-1">
                {totalAttendees} <span className="text-sm font-bold text-amber-800">Porsi</span>
              </p>
              <p className="text-[11px] text-gray-500 mt-0.5">
                {participantCount} Undangan + 1 Pemohon Rapat
              </p>
            </div>

            {/* Card 2: Okupansi Ruang */}
            <div className="bg-white rounded-lg p-3.5 border border-amber-200/90 shadow-2xs">
              <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide">
                Okupansi Ruang Rapat
              </p>
              <p className="text-2xl font-black text-gray-900 mt-1">
                {totalAttendees}{' '}
                <span className="text-sm font-medium text-gray-500">/ {booking.room.capacity} org</span>
              </p>
              <p
                className={`text-[11px] mt-0.5 font-semibold ${
                  totalAttendees <= booking.room.capacity ? 'text-emerald-700' : 'text-red-600'
                }`}
              >
                {totalAttendees <= booking.room.capacity
                  ? `✓ Ruang memadai (${booking.room.capacity - totalAttendees} kursi tersisa)`
                  : `⚠ Melebihi kapasitas ruang (${totalAttendees - booking.room.capacity} lebih)`}
              </p>
            </div>

            {/* Card 3: Rincian Undangan */}
            <div className="bg-white rounded-lg p-3.5 border border-amber-200/90 shadow-2xs">
              <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide">
                Komposisi Kehadiran
              </p>
              <p className="text-base font-bold text-gray-900 mt-1">
                {requiredCount} Wajib · {optionalCount} Opsional
              </p>
              <p className="text-[11px] text-gray-500 mt-0.5">
                1 Pemohon + {participantCount} Peserta terdaftar
              </p>
            </div>
          </div>

          {/* Fasilitas Ruang */}
          {booking.room.facilities.length > 0 && (
            <div className="pt-1 flex flex-wrap items-center gap-1.5">
              <span className="text-xs font-semibold text-amber-900 mr-1">Fasilitas Ruang:</span>
              {booking.room.facilities.map((f) => (
                <span
                  key={f.id}
                  className="text-[11px] font-medium bg-white border border-amber-200 text-amber-900 px-2.5 py-0.5 rounded-md"
                >
                  ✓ {f.name}
                </span>
              ))}
            </div>
          )}

          {/* Catatan Khusus untuk Approver / Fasilitas */}
          {booking.notes && (
            <div className="pt-2 text-xs text-amber-900 bg-amber-100/70 rounded-lg p-3 border border-amber-200/80">
              <p className="font-bold mb-0.5">Catatan Tambahan untuk Approver & Tim Fasilitas:</p>
              <p className="whitespace-pre-wrap">{booking.notes}</p>
            </div>
          )}
        </div>
      ) : (
        /* Bagi peserta biasa: Tampilkan ringkasan fasilitas ruangan saja secara bersih tanpa kalkulasi logistik internal */
        booking.room.facilities.length > 0 && (
          <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-4 shadow-2xs flex flex-wrap items-center gap-2">
            <span className="text-xs font-semibold text-slate-700 mr-1">Fasilitas Ruangan:</span>
            {booking.room.facilities.map((f) => (
              <span
                key={f.id}
                className="text-[11px] font-medium bg-white border border-slate-200 text-slate-700 px-2.5 py-0.5 rounded-md"
              >
                ✓ {f.name}
              </span>
            ))}
          </div>
        )
      )}

      {/* Approval timeline & Action Form (Hanya untuk Pembuat Rapat, Admin/GA, dan Approver) */}
      {canViewApprovalFlow && (
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-xs">
          <h2 className="font-semibold text-gray-900 mb-4">Status & Alur Approval</h2>
          <div className="space-y-3">
            {booking.approvalFlow?.steps.map((step) => {
              const action = booking.actions.find((a) => a.approvalStep.level === step.level)
              const isCurrent = booking.status === 'PENDING' && step.level === booking.currentLevel
              return (
                <div key={step.id} className="flex items-start gap-3">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                      action?.action === 'APPROVE'
                        ? 'bg-green-100 text-green-600'
                        : action?.action === 'REJECT'
                        ? 'bg-red-100 text-red-600'
                        : isCurrent
                        ? 'bg-yellow-100 text-yellow-600'
                        : 'bg-gray-100 text-gray-400'
                    }`}
                  >
                    {action?.action === 'APPROVE' ? (
                      <CheckCircle2 className="w-4 h-4 text-green-600" />
                    ) : action?.action === 'REJECT' ? (
                      <XCircle className="w-4 h-4 text-red-600" />
                    ) : isCurrent ? (
                      <AlertCircle className="w-4 h-4 text-yellow-600" />
                    ) : (
                      <RotateCcw className="w-4 h-4 text-gray-400" />
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">
                      Level {step.level}: {step.label}
                      <span className="ml-2 font-normal text-gray-500">({step.approver.name})</span>
                    </p>
                    {action && (
                      <p className="text-xs text-gray-500 mt-0.5">
                        {action.action === 'APPROVE'
                          ? '✅ Disetujui'
                          : action.action === 'REJECT'
                          ? '❌ Ditolak'
                          : '🔄 Revisi'}
                        {action.comment && ` — "${action.comment}"`}
                      </p>
                    )}
                    {isCurrent && !action && (
                      <p className="text-xs text-yellow-600 font-medium mt-0.5">⏳ Menunggu persetujuan</p>
                    )}
                  </div>
                </div>
              )
            })}
          </div>

          {/* Approval action form — hanya tampil jika user adalah approver saat ini */}
          {isCurrentApprover && (
            <ApprovalActionForm bookingId={booking.id} participantCount={totalAttendees} />
          )}
        </div>
      )}

      {/* Attendance & Participant List */}
      <AttendanceList
        bookingId={booking.id}
        meetingTitle={booking.title}
        roomName={booking.room.name}
        dateTimeText={`${new Date(booking.startAt).toLocaleDateString('id-ID', {
          weekday: 'long',
          day: 'numeric',
          month: 'long',
          year: 'numeric',
        })} · ${formatTime(booking.startAt)} – ${formatTime(booking.endAt)}`}
        requester={booking.requester}
        initialRequesterAttendedAt={booking.requesterAttendedAt}
        initialParticipants={booking.participants}
        canManageMeeting={canManageMeeting}
        currentUserId={userId}
      />

      {/* MODUL NOTULENSI & KELOLA TINDAK LANJUT (Hanya aktif jika rapat sudah APPROVED) */}
      {meeting && (
        <MeetingMinutesManager
          meetingId={meeting.id}
          initialNotes={meeting.notes}
          initialActionItems={meeting.actionItems as any}
          candidates={candidates}
          canManage={canManageMeeting}
          currentUserId={userId}
        />
      )}
    </div>
  )
}

function InfoItem({
  icon,
  label,
  children,
}: {
  icon: React.ReactNode
  label: string
  children: React.ReactNode
}) {
  return (
    <div className="flex items-start gap-2">
      <div className="text-gray-400 mt-0.5">{icon}</div>
      <div>
        <p className="text-xs text-gray-400">{label}</p>
        <div className="text-sm font-medium text-gray-900">{children}</div>
      </div>
    </div>
  )
}
