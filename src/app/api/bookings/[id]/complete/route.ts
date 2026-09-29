import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params
  const booking = await prisma.booking.findUnique({
    where: { id },
    include: {
      meeting: true,
      requester: { select: { id: true, name: true, email: true } },
    },
  })

  if (!booking) {
    return NextResponse.json({ error: 'Data booking tidak ditemukan' }, { status: 404 })
  }

  const role = session.user.role ?? 'USER'
  const isOrganizer = booking.requesterId === session.user.id
  const isAdmin = ['ADMIN', 'SUPER_ADMIN'].includes(role)

  if (!isOrganizer && !isAdmin) {
    return NextResponse.json(
      { error: 'Hanya penyelenggara rapat atau admin yang dapat menandai rapat selesai' },
      { status: 403 },
    )
  }

  if (booking.status !== 'APPROVED' && booking.status !== 'COMPLETED') {
    return NextResponse.json(
      { error: 'Hanya rapat yang telah disetujui yang dapat diselesaikan' },
      { status: 400 },
    )
  }

  // Update booking status to COMPLETED
  const updatedBooking = await prisma.booking.update({
    where: { id },
    data: {
      status: 'COMPLETED',
    },
  })

  // Finalize meeting notes if meeting record exists
  if (booking.meeting) {
    await prisma.meeting.update({
      where: { id: booking.meeting.id },
      data: {
        isNotesFinalized: true,
        finalizedAt: new Date(),
      },
    })
  }

  return NextResponse.json({
    success: true,
    booking: updatedBooking,
    message: 'Rapat berhasil ditandai selesai dilaksanakan',
  })
}
