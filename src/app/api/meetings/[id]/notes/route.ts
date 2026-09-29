import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id: meetingId } = await params
  const body = await request.json()
  const { notes, isNotesFinalized } = body

  const meeting = await prisma.meeting.findUnique({
    where: { id: meetingId },
    include: {
      booking: {
        include: { participants: true },
      },
    },
  })

  if (!meeting) {
    return NextResponse.json({ error: 'Rapat tidak ditemukan' }, { status: 404 })
  }

  const role = session.user.role ?? 'USER'
  const isOrganizer = meeting.booking.requesterId === session.user.id
  const isParticipant = meeting.booking.participants.some((p) => p.userId === session.user.id)
  const isAdmin = ['ADMIN', 'SUPER_ADMIN'].includes(role)

  if (!isOrganizer && !isParticipant && !isAdmin) {
    return NextResponse.json(
      { error: 'Hanya penyelenggara, peserta, atau admin yang dapat mencatat notulensi' },
      { status: 403 },
    )
  }

  // Jika notulensi sudah difinalisasi, hanya Penyelenggara atau Admin yang berhak mengubah atau membuka kunci
  if (meeting.isNotesFinalized && !isOrganizer && !isAdmin) {
    return NextResponse.json(
      { error: 'Notulensi rapat ini telah difinalisasi secara resmi dan tidak dapat diubah oleh peserta' },
      { status: 403 },
    )
  }

  const updated = await prisma.meeting.update({
    where: { id: meetingId },
    data: {
      notes: typeof notes === 'string' ? notes : undefined,
      isNotesFinalized: typeof isNotesFinalized === 'boolean' ? isNotesFinalized : undefined,
      finalizedAt: isNotesFinalized ? new Date() : undefined,
    },
  })

  return NextResponse.json({ meeting: updated })
}
