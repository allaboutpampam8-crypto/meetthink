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

export interface ParticipantConflictInfo {
  userId?: string
  email: string
  name: string
  conflictingBooking: {
    id: string
    title: string
    startAt: Date
    endAt: Date
    roomName: string
    status: string
  }
}

interface CheckParticipantConflictsParams {
  userIds?: string[]
  emails?: string[]
  startAt: Date
  endAt: Date
  excludeBookingId?: string
}

export async function checkParticipantConflicts({
  userIds = [],
  emails = [],
  startAt,
  endAt,
  excludeBookingId,
}: CheckParticipantConflictsParams): Promise<ParticipantConflictInfo[]> {
  const validUserIds = userIds.filter((id): id is string => Boolean(id))
  const validEmails = emails.filter((em): em is string => Boolean(em))

  if (validUserIds.length === 0 && validEmails.length === 0) {
    return []
  }

  // 1. Cari rapat di mana user adalah peserta (BookingParticipant)
  const participantMatches = await prisma.bookingParticipant.findMany({
    where: {
      OR: [
        validUserIds.length > 0 ? { userId: { in: validUserIds } } : undefined,
        validEmails.length > 0 ? { email: { in: validEmails } } : undefined,
      ].filter(Boolean) as any,
      booking: {
        status: { in: ['PENDING', 'APPROVED'] },
        id: excludeBookingId ? { not: excludeBookingId } : undefined,
        AND: [
          { startAt: { lt: endAt } },
          { endAt: { gt: startAt } },
        ],
      },
    },
    include: {
      booking: {
        select: {
          id: true,
          title: true,
          startAt: true,
          endAt: true,
          status: true,
          room: { select: { name: true } },
        },
      },
    },
  })

  // 2. Cari rapat di mana user adalah pembuat rapat (Requester)
  const requesterMatches = await prisma.booking.findMany({
    where: {
      OR: [
        validUserIds.length > 0 ? { requesterId: { in: validUserIds } } : undefined,
        validEmails.length > 0 ? { requester: { email: { in: validEmails } } } : undefined,
      ].filter(Boolean) as any,
      status: { in: ['PENDING', 'APPROVED'] },
      id: excludeBookingId ? { not: excludeBookingId } : undefined,
      AND: [
        { startAt: { lt: endAt } },
        { endAt: { gt: startAt } },
      ],
    },
    include: {
      requester: { select: { id: true, name: true, email: true } },
      room: { select: { name: true } },
    },
  })

  const conflicts: ParticipantConflictInfo[] = []

  for (const match of participantMatches) {
    conflicts.push({
      userId: match.userId ?? undefined,
      email: match.email,
      name: match.name ?? match.email,
      conflictingBooking: {
        id: match.booking.id,
        title: match.booking.title,
        startAt: match.booking.startAt,
        endAt: match.booking.endAt,
        roomName: match.booking.room?.name ?? 'Ruang Rapat',
        status: match.booking.status,
      },
    })
  }

  for (const match of requesterMatches) {
    const isAlreadyListed = conflicts.some(
      (c) => (match.requesterId && c.userId === match.requesterId) || c.email === match.requester.email,
    )
    if (!isAlreadyListed) {
      conflicts.push({
        userId: match.requester.id,
        email: match.requester.email,
        name: match.requester.name ?? match.requester.email,
        conflictingBooking: {
          id: match.id,
          title: match.title,
          startAt: match.startAt,
          endAt: match.endAt,
          roomName: match.room?.name ?? 'Ruang Rapat',
          status: match.status,
        },
      })
    }
  }

  return conflicts
}
