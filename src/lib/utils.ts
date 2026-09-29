import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { format, formatDistance, parseISO } from 'date-fns'
import { id } from 'date-fns/locale'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function toZonedDate(date: Date | string, timeZone = 'Asia/Jakarta'): Date {
  const d = typeof date === 'string' ? (date.includes('T') ? parseISO(date) : new Date(date)) : date
  if (isNaN(d.getTime())) return d
  return new Date(d.toLocaleString('en-US', { timeZone }))
}

export function formatDate(date: Date | string, fmt = 'dd MMMM yyyy', timeZone = 'Asia/Jakarta') {
  const zoned = toZonedDate(date, timeZone)
  if (isNaN(zoned.getTime())) return ''
  return format(zoned, fmt, { locale: id })
}

export function formatDateTime(date: Date | string, timeZone = 'Asia/Jakarta') {
  const zoned = toZonedDate(date, timeZone)
  if (isNaN(zoned.getTime())) return ''
  return format(zoned, 'dd MMM yyyy, HH:mm', { locale: id })
}

export function formatTime(date: Date | string, timeZone = 'Asia/Jakarta') {
  const zoned = toZonedDate(date, timeZone)
  if (isNaN(zoned.getTime())) return ''
  return format(zoned, 'HH:mm', { locale: id })
}

export function timeAgo(date: Date | string) {
  const d = typeof date === 'string' ? parseISO(date) : date
  return formatDistance(d, new Date(), { addSuffix: true, locale: id })
}

export function bookingStatusLabel(status: string) {
  const map: Record<string, string> = {
    DRAFT: 'Draft',
    PENDING: 'Menunggu Persetujuan',
    APPROVED: 'Disetujui',
    REJECTED: 'Ditolak',
    CANCELLED: 'Dibatalkan',
    COMPLETED: 'Selesai',
  }
  return map[status] ?? status
}

export function bookingStatusColor(status: string) {
  const map: Record<string, string> = {
    DRAFT: 'bg-gray-100 text-gray-700',
    PENDING: 'bg-yellow-100 text-yellow-700',
    APPROVED: 'bg-green-100 text-green-700',
    REJECTED: 'bg-red-100 text-red-700',
    CANCELLED: 'bg-gray-100 text-gray-500',
    COMPLETED: 'bg-slate-100 text-slate-700 border border-slate-200',
  }
  return map[status] ?? 'bg-gray-100 text-gray-700'
}

export function getMeetingLifecycle(booking: {
  status: string
  startAt: Date | string
  endAt: Date | string
}) {
  const start = typeof booking.startAt === 'string' ? parseISO(booking.startAt) : booking.startAt
  const end = typeof booking.endAt === 'string' ? parseISO(booking.endAt) : booking.endAt
  const now = new Date()

  if (booking.status === 'CANCELLED') {
    return {
      statusKey: 'CANCELLED',
      label: 'Dibatalkan',
      color: 'bg-gray-100 text-gray-500 border-gray-200',
      badgeText: 'Dibatalkan',
      isCompleted: false,
      isOngoing: false,
      isUpcoming: false,
    }
  }

  if (booking.status === 'REJECTED') {
    return {
      statusKey: 'REJECTED',
      label: 'Ditolak',
      color: 'bg-red-100 text-red-700 border-red-200',
      badgeText: 'Ditolak',
      isCompleted: false,
      isOngoing: false,
      isUpcoming: false,
    }
  }

  if (booking.status === 'PENDING') {
    return {
      statusKey: 'PENDING',
      label: 'Menunggu Persetujuan',
      color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      badgeText: 'Menunggu Approval',
      isCompleted: false,
      isOngoing: false,
      isUpcoming: false,
    }
  }

  if (booking.status === 'COMPLETED') {
    return {
      statusKey: 'COMPLETED',
      label: 'Selesai Dilaksanakan',
      color: 'bg-slate-100 text-slate-700 border-slate-300',
      badgeText: 'Selesai',
      isCompleted: true,
      isOngoing: false,
      isUpcoming: false,
    }
  }

  // APPROVED: periksa waktu pelaksanaan
  if (booking.status === 'APPROVED') {
    if (now > end) {
      return {
        statusKey: 'COMPLETED_TIME',
        label: 'Selesai Dilaksanakan',
        color: 'bg-slate-100 text-slate-700 border-slate-300',
        badgeText: 'Selesai',
        isCompleted: true,
        isOngoing: false,
        isUpcoming: false,
      }
    }
    if (now >= start && now <= end) {
      return {
        statusKey: 'ONGOING',
        label: 'Sedang Berlangsung',
        color: 'bg-emerald-100 text-emerald-800 border-emerald-300 font-bold',
        badgeText: 'Sedang Berlangsung',
        isCompleted: false,
        isOngoing: true,
        isUpcoming: false,
      }
    }
    return {
      statusKey: 'UPCOMING',
      label: 'Disetujui (Mendatang)',
      color: 'bg-green-100 text-green-700 border-green-200',
      badgeText: 'Disetujui',
      isCompleted: false,
      isOngoing: false,
      isUpcoming: true,
    }
  }

  return {
    statusKey: booking.status,
    label: bookingStatusLabel(booking.status),
    color: bookingStatusColor(booking.status),
    badgeText: bookingStatusLabel(booking.status),
    isCompleted: false,
    isOngoing: false,
    isUpcoming: false,
  }
}

export function actionItemStatusLabel(status: string) {
  const map: Record<string, string> = {
    OPEN: 'Belum Dikerjakan',
    IN_PROGRESS: 'Sedang Dikerjakan',
    DONE: 'Selesai',
    OVERDUE: 'Terlambat',
  }
  return map[status] ?? status
}

export function roleLabel(role: string) {
  const map: Record<string, string> = {
    SUPER_ADMIN: 'Super Admin',
    ADMIN: 'Admin',
    APPROVER: 'Approver',
    USER: 'Pengguna',
  }
  return map[role] ?? role
}

export function generateInitials(name: string) {
  return name
    .split(' ')
    .slice(0, 2)
    .map((n) => n[0])
    .join('')
    .toUpperCase()
}
