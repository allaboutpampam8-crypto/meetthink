import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  const { searchParams } = new URL(request.url)
  const start = searchParams.get('start')
  const end = searchParams.get('end')

  if (!start || !end) {
    return NextResponse.json({ error: 'start and end required' }, { status: 400 })
  }

  const bookings = await prisma.booking.findMany({
    where: {
      roomId: id,
      status: { in: ['PENDING', 'APPROVED'] },
      startAt: { lt: new Date(end) },
      endAt: { gt: new Date(start) },
    },
    include: {
      requester: { select: { name: true } },
    },
    orderBy: { startAt: 'asc' },
  })

  return NextResponse.json({
    bookings: bookings.map((b) => ({
      id: b.id,
      title: b.title,
      startAt: b.startAt.toISOString(),
      endAt: b.endAt.toISOString(),
      status: b.status,
      requesterName: b.requester.name,
    })),
  })
}
