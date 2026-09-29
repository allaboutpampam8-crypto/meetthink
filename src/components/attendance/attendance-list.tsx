'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Users,
  QrCode,
  CheckCircle2,
  Clock,
  Check,
  X,
  UserCheck,
  UserX,
  RefreshCw,
  Sparkles,
} from 'lucide-react'
import { AttendanceQrModal } from './attendance-qr-modal'

interface ParticipantItem {
  id: string
  name: string | null
  email: string
  type: string
  attendedAt: string | Date | null
  checkInMethod: string | null
  userId?: string | null
  user?: { id: string; name: string; email: string } | null
}

interface RequesterItem {
  id: string
  name: string
  email: string
  division?: string | null
}

interface AttendanceListProps {
  bookingId: string
  meetingTitle: string
  roomName: string
  dateTimeText: string
  requester: RequesterItem
  initialRequesterAttendedAt: string | Date | null
  initialParticipants: ParticipantItem[]
  canManageMeeting: boolean
  currentUserId: string
}

export function AttendanceList({
  bookingId,
  meetingTitle,
  roomName,
  dateTimeText,
  requester,
  initialRequesterAttendedAt,
  initialParticipants,
  canManageMeeting,
  currentUserId,
}: AttendanceListProps) {
  const router = useRouter()
  const [showQrModal, setShowQrModal] = useState(false)
  const [requesterAttendedAt, setRequesterAttendedAt] = useState<string | Date | null>(
    initialRequesterAttendedAt,
  )
  const [participants, setParticipants] = useState<ParticipantItem[]>(initialParticipants)
  const [updatingId, setUpdatingId] = useState<string | null>(null)
  const [isRefreshing, setIsRefreshing] = useState(false)

  // Calculations
  const totalAttendees = participants.length + 1
  const attendedParticipants = participants.filter((p) => p.attendedAt != null).length
  const totalAttended = attendedParticipants + (requesterAttendedAt != null ? 1 : 0)
  const notAttendedCount = totalAttendees - totalAttended
  const percentage = Math.round((totalAttended / totalAttendees) * 100)

  // Refresh handler
  const handleRefresh = async () => {
    setIsRefreshing(true)
    try {
      router.refresh()
      // Also fetch updated attendance stats
      const res = await fetch(`/api/bookings/${bookingId}/attendance-qr`)
      if (res.ok) {
        // Will be synced through router.refresh() or subsequent render
      }
    } finally {
      setTimeout(() => setIsRefreshing(false), 500)
    }
  }

  // Toggle manual attendance
  const handleToggleAttendance = async (
    target: { isRequester: true } | { participantId: string },
    currentStatus: boolean,
  ) => {
    const actionKey = 'isRequester' in target ? 'requester' : target.participantId
    setUpdatingId(actionKey)

    const nextStatus = !currentStatus

    // Optimistic update
    if ('isRequester' in target) {
      setRequesterAttendedAt(nextStatus ? new Date() : null)
    } else {
      setParticipants((prev) =>
        prev.map((p) =>
          p.id === target.participantId
            ? {
                ...p,
                attendedAt: nextStatus ? new Date() : null,
                checkInMethod: nextStatus ? 'MANUAL' : null,
              }
            : p,
        ),
      )
    }

    try {
      const res = await fetch(`/api/bookings/${bookingId}/attendance/manual`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...target,
          attended: nextStatus,
        }),
      })

      if (!res.ok) {
        throw new Error('Gagal memperbarui status kehadiran')
      }

      router.refresh()
    } catch (err: any) {
      alert(err.message || 'Terjadi kesalahan')
      // Revert optimistic update
      if ('isRequester' in target) {
        setRequesterAttendedAt(currentStatus ? new Date() : null)
      } else {
        setParticipants((prev) =>
          prev.map((p) =>
            p.id === target.participantId
              ? {
                  ...p,
                  attendedAt: currentStatus ? new Date() : null,
                }
              : p,
          ),
        )
      }
    } finally {
      setUpdatingId(null)
    }
  }

  const formatTimeOnly = (date: string | Date | null) => {
    if (!date) return ''
    const d = new Date(date)
    return d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + ' WIB'
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-xs space-y-5">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-gray-100">
        <div>
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-orange-500" />
            <h2 className="font-bold text-gray-900 text-base">
              Daftar Hadir & Presensi Peserta
            </h2>
          </div>
          <p className="text-xs text-gray-500 mt-0.5">
            Kelola kehadiran dan pantau peserta yang sudah hadir di ruang rapat
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            title="Segarkan daftar hadir"
            className="p-2 text-gray-500 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors border border-gray-200"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-orange-500' : ''}`} />
          </button>

          {canManageMeeting && (
            <button
              onClick={() => setShowQrModal(true)}
              className="inline-flex items-center gap-2 px-3.5 py-2 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white text-xs font-bold rounded-lg shadow-sm hover:shadow transition-all"
            >
              <QrCode className="w-4 h-4" />
              <span>Tampilkan Barcode / QR Presensi</span>
            </button>
          )}
        </div>
      </div>

      {/* Summary Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3.5">
          <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">
            Total Terdaftar
          </p>
          <p className="text-2xl font-black text-slate-900 mt-1">
            {totalAttendees} <span className="text-xs font-semibold text-slate-500">Orang</span>
          </p>
          <p className="text-[11px] text-slate-500 mt-0.5">1 Penyelenggara + {participants.length} Undangan</p>
        </div>

        <div className="bg-emerald-50/80 border border-emerald-200/90 rounded-xl p-3.5">
          <div className="flex items-center justify-between">
            <p className="text-[11px] font-semibold text-emerald-700 uppercase tracking-wide">
              Sudah Hadir
            </p>
            <span className="text-[11px] font-bold text-emerald-700 bg-emerald-100/90 px-2 py-0.5 rounded-full">
              {percentage}%
            </span>
          </div>
          <p className="text-2xl font-black text-emerald-900 mt-1">
            {totalAttended} <span className="text-xs font-semibold text-emerald-700">Orang</span>
          </p>
          <div className="w-full bg-emerald-200/70 h-1.5 rounded-full mt-2 overflow-hidden">
            <div
              className="bg-emerald-600 h-full rounded-full transition-all duration-500"
              style={{ width: `${percentage}%` }}
            />
          </div>
        </div>

        <div className="bg-amber-50/70 border border-amber-200/90 rounded-xl p-3.5">
          <p className="text-[11px] font-semibold text-amber-700 uppercase tracking-wide">
            Belum Hadir
          </p>
          <p className="text-2xl font-black text-amber-900 mt-1">
            {notAttendedCount} <span className="text-xs font-semibold text-amber-700">Orang</span>
          </p>
          <p className="text-[11px] text-amber-600 mt-0.5">
            {notAttendedCount === 0 ? 'Semua peserta sudah hadir' : 'Menunggu presensi peserta'}
          </p>
        </div>
      </div>

      {/* Attendee Cards List */}
      <div className="space-y-2.5">
        <p className="text-xs font-bold text-gray-700 uppercase tracking-wide">
          Rincian Presensi Peserta
        </p>

        {/* 1. Pemohon / Penyelenggara */}
        <div
          className={`flex items-center justify-between p-3.5 rounded-xl border transition-all ${
            requesterAttendedAt
              ? 'bg-emerald-50/40 border-emerald-200/80'
              : 'bg-white border-gray-200 hover:border-gray-300'
          }`}
        >
          <div className="flex items-center gap-3 min-w-0">
            <div
              className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold ${
                requesterAttendedAt
                  ? 'bg-emerald-600 text-white'
                  : 'bg-orange-500 text-white'
              }`}
            >
              {requester.name[0]?.toUpperCase()}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <p className="text-sm font-bold text-gray-900 truncate">{requester.name}</p>
                <span className="text-[10px] bg-orange-100 text-orange-800 font-semibold px-2 py-0.5 rounded">
                  Penyelenggara
                </span>
                {requester.id === currentUserId && (
                  <span className="text-[10px] bg-gray-100 text-gray-700 font-medium px-1.5 py-0.5 rounded">
                    Anda
                  </span>
                )}
              </div>
              <p className="text-xs text-gray-500 truncate mt-0.5">
                {requester.email} {requester.division ? `· ${requester.division}` : ''}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 flex-shrink-0">
            {/* Status badge */}
            {requesterAttendedAt ? (
              <div className="text-right">
                <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 bg-emerald-100 px-2.5 py-1 rounded-full">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Hadir</span>
                </span>
                <p className="text-[10px] text-emerald-800 font-medium mt-0.5">
                  {formatTimeOnly(requesterAttendedAt)}
                </p>
              </div>
            ) : (
              <span className="inline-flex items-center gap-1 text-xs font-semibold text-gray-500 bg-gray-100 px-2.5 py-1 rounded-full">
                <Clock className="w-3.5 h-3.5 text-gray-400" />
                <span>Belum Hadir</span>
              </span>
            )}

            {/* Manual Toggle Button (For Organizer/Admin) */}
            {canManageMeeting && (
              <button
                onClick={() =>
                  handleToggleAttendance({ isRequester: true }, requesterAttendedAt != null)
                }
                disabled={updatingId === 'requester'}
                title={requesterAttendedAt ? 'Ubah menjadi belum hadir' : 'Tandai sudah hadir'}
                className={`p-1.5 rounded-lg border text-xs font-medium transition-colors ${
                  requesterAttendedAt
                    ? 'border-gray-200 text-gray-500 hover:text-red-600 hover:bg-red-50'
                    : 'border-emerald-300 text-emerald-700 bg-emerald-50 hover:bg-emerald-100'
                }`}
              >
                {updatingId === 'requester' ? (
                  <RefreshCw className="w-4 h-4 animate-spin text-gray-400" />
                ) : requesterAttendedAt ? (
                  <UserX className="w-4 h-4" />
                ) : (
                  <UserCheck className="w-4 h-4" />
                )}
              </button>
            )}
          </div>
        </div>

        {/* 2. Undangan Rapat */}
        {participants.map((p) => {
          const isAttended = p.attendedAt != null
          const isUpdating = updatingId === p.id
          const displayName = p.name ?? p.user?.name ?? p.email
          const isSelf = p.userId === currentUserId || p.email.toLowerCase() === requester.email.toLowerCase()

          return (
            <div
              key={p.id}
              className={`flex items-center justify-between p-3.5 rounded-xl border transition-all ${
                isAttended
                  ? 'bg-emerald-50/40 border-emerald-200/80'
                  : 'bg-white border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <div
                  className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold ${
                    isAttended
                      ? 'bg-emerald-600 text-white'
                      : 'bg-gray-200 text-gray-700'
                  }`}
                >
                  {displayName[0]?.toUpperCase()}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-semibold text-gray-900 truncate">{displayName}</p>
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded font-medium ${
                        p.type === 'REQUIRED'
                          ? 'bg-amber-100 text-amber-800 font-semibold'
                          : p.type === 'OPTIONAL'
                          ? 'bg-gray-100 text-gray-600'
                          : 'bg-blue-100 text-blue-700'
                      }`}
                    >
                      {p.type === 'REQUIRED' ? 'Wajib' : p.type === 'OPTIONAL' ? 'Opsional' : 'Tamu'}
                    </span>
                    {isSelf && (
                      <span className="text-[10px] bg-gray-100 text-gray-700 font-medium px-1.5 py-0.5 rounded">
                        Anda
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 truncate mt-0.5">{p.email}</p>
                </div>
              </div>

              <div className="flex items-center gap-3 flex-shrink-0">
                {/* Status Badge */}
                {isAttended ? (
                  <div className="text-right">
                    <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 bg-emerald-100 px-2.5 py-1 rounded-full">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Hadir</span>
                    </span>
                    <p className="text-[10px] text-emerald-800 font-medium mt-0.5">
                      {formatTimeOnly(p.attendedAt)}{' '}
                      <span className="text-[9px] text-emerald-600">
                        ({p.checkInMethod === 'QR_SCAN' ? 'Scan Barcode' : 'Manual'})
                      </span>
                    </p>
                  </div>
                ) : (
                  <span className="inline-flex items-center gap-1 text-xs font-semibold text-gray-500 bg-gray-100 px-2.5 py-1 rounded-full">
                    <Clock className="w-3.5 h-3.5 text-gray-400" />
                    <span>Belum Hadir</span>
                  </span>
                )}

                {/* Manual Toggle Button (For Organizer/Admin) */}
                {canManageMeeting && (
                  <button
                    onClick={() =>
                      handleToggleAttendance({ participantId: p.id }, isAttended)
                    }
                    disabled={isUpdating}
                    title={isAttended ? 'Ubah menjadi belum hadir' : 'Tandai sudah hadir'}
                    className={`p-1.5 rounded-lg border text-xs font-medium transition-colors ${
                      isAttended
                        ? 'border-gray-200 text-gray-500 hover:text-red-600 hover:bg-red-50'
                        : 'border-emerald-300 text-emerald-700 bg-emerald-50 hover:bg-emerald-100'
                    }`}
                  >
                    {isUpdating ? (
                      <RefreshCw className="w-4 h-4 animate-spin text-gray-400" />
                    ) : isAttended ? (
                      <UserX className="w-4 h-4" />
                    ) : (
                      <UserCheck className="w-4 h-4" />
                    )}
                  </button>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* QR Modal instance */}
      <AttendanceQrModal
        bookingId={bookingId}
        meetingTitle={meetingTitle}
        roomName={roomName}
        dateTimeText={dateTimeText}
        isOpen={showQrModal}
        onClose={() => setShowQrModal(false)}
        onAttendeeUpdated={handleRefresh}
      />
    </div>
  )
}
