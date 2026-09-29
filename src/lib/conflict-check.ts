import { prisma } from '@/lib/db'

interface CheckConflictParams {
  roomId: string
  startAt: Date
  endAt: Date
  excludeBookingId?: string // untuk edit booking
}

export async function checkRoomConflict({
  roomId,
  startAt,
  endAt,
  excludeBookingId,
}: CheckConflictParams): Promise<{ hasConflict: boolean; conflictingBooking?: any }> {
  // Cek overlap: booking yang statusnya PENDING, APPROVED, atau COMPLETED
  // Overlap terjadi jika: startA < endB AND endA > startB
  const conflict = await prisma.booking.findFirst({
    where: {
      roomId,
      status: { in: ['PENDING', 'APPROVED', 'COMPLETED'] },
      id: excludeBookingId ? { not: excludeBookingId } : undefined,
      AND: [
        { startAt: { lt: endAt } },
        { endAt: { gt: startAt } },
      ],
    },
    include: {
      requester: { select: { name: true } },
    },
  })

  if (conflict) {
    return { hasConflict: true, conflictingBooking: conflict }
  }

  // Cek blocked period
  const blockedPeriod = await prisma.roomBlockedPeriod.findFirst({
    where: {
      roomId,
      AND: [
        { startAt: { lt: endAt } },
        { endAt: { gt: startAt } },
      ],
    },
  })

  if (blockedPeriod) {
    return {
      hasConflict: true,
      conflictingBooking: {
        title: `Ruang diblokir: ${blockedPeriod.reason ?? 'Maintenance'}`,
        startAt: blockedPeriod.startAt,
        endAt: blockedPeriod.endAt,
      },
    }
  }

  return { hasConflict: false }
}

export async function getRoomAvailability(
  roomId: string,
  date: Date,
): Promise<{ startAt: Date; endAt: Date; title: string; status: string }[]> {
  const dayStart = new Date(date)
  dayStart.setHours(0, 0, 0, 0)
  const dayEnd = new Date(date)
  dayEnd.setHours(23, 59, 59, 999)

  // Gunakan irisan rentang waktu standar agar rapat lintas hari (cross-midnight) tetap terdeteksi
  const bookings = await prisma.booking.findMany({
    where: {
      roomId,
      status: { in: ['PENDING', 'APPROVED', 'COMPLETED'] },
      AND: [
        { startAt: { lt: dayEnd } },
        { endAt: { gt: dayStart } },
      ],
    },
    select: {
      id: true,
      title: true,
      startAt: true,
      endAt: true,
      status: true,
    },
    orderBy: { startAt: 'asc' },
  })

  return bookings
}
