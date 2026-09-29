import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function GET(request: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const start = searchParams.get('start')
  const end = searchParams.get('end')
  const roomId = searchParams.get('roomId')

  if (!start || !end) {
    return NextResponse.json(
      { error: 'Parameter start dan end (format ISO/date) wajib disertakan' },
      { status: 400 },
    )
  }

  const startDate = new Date(start)
  const endDate = new Date(end)

  const [rooms, bookings, blockedPeriods] = await Promise.all([
    prisma.room.findMany({
      where: { isActive: true },
      include: { facilities: true },
      orderBy: { name: 'asc' },
    }),
    prisma.booking.findMany({
      where: {
        ...(roomId ? { roomId } : {}),
        status: { in: ['PENDING', 'APPROVED'] },
        startAt: { lt: endDate },
        endAt: { gt: startDate },
      },
      include: {
        room: { select: { id: true, name: true, code: true, location: true, capacity: true } },
        requester: { select: { id: true, name: true, division: true, email: true } },
        _count: { select: { participants: true } },
      },
      orderBy: { startAt: 'asc' },
    }),
    prisma.roomBlockedPeriod.findMany({
      where: {
        ...(roomId ? { roomId } : {}),
        startAt: { lt: endDate },
        endAt: { gt: startDate },
      },
      include: {
        room: { select: { id: true, name: true, code: true } },
      },
      orderBy: { startAt: 'asc' },
    }),
  ])

  return NextResponse.json({
    rooms,
    bookings: bookings.map((b) => ({
      id: b.id,
      title: b.title,
      agenda: b.agenda,
      roomId: b.roomId,
      roomName: b.room.name,
      roomCode: b.room.code,
      roomLocation: b.room.location,
      capacity: b.room.capacity,
      startAt: b.startAt.toISOString(),
      endAt: b.endAt.toISOString(),
      status: b.status,
      requesterName: b.requester.name,
      requesterDivision: b.requester.division,
      participantCount: b._count.participants,
    })),
    blockedPeriods: blockedPeriods.map((bp) => ({
      id: bp.id,
      roomId: bp.roomId,
      roomName: bp.room.name,
      roomCode: bp.room.code,
      startAt: bp.startAt.toISOString(),
      endAt: bp.endAt.toISOString(),
      reason: bp.reason,
    })),
  })
}
