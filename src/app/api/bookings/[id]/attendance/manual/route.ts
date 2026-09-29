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

  const { id: bookingId } = await params
  const body = await request.json()
  const { participantId, isRequester, attended } = body

  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    select: { requesterId: true },
  })

  if (!booking) {
    return NextResponse.json({ error: 'Data rapat tidak ditemukan' }, { status: 404 })
  }

  const role = session.user.role ?? 'USER'
  const isOrganizer = booking.requesterId === session.user.id
  const isAdmin = ['ADMIN', 'SUPER_ADMIN'].includes(role)

  if (!isOrganizer && !isAdmin) {
    return NextResponse.json(
      { error: 'Hanya penyelenggara rapat atau admin yang dapat mengubah daftar hadir manual' },
      { status: 403 },
    )
  }

  const attendedAt = attended ? new Date() : null

  if (isRequester) {
    await prisma.booking.update({
      where: { id: bookingId },
      data: { requesterAttendedAt: attendedAt },
    })

    return NextResponse.json({
      success: true,
      message: attended ? 'Penyelenggara ditandai hadir' : 'Status kehadiran penyelenggara dibatalkan',
    })
  }

  if (participantId) {
    // Verifikasi bahwa peserta benar-benar terdaftar pada rapat ini (cegah IDOR)
    const participant = await prisma.bookingParticipant.findFirst({
      where: { id: participantId, bookingId },
    })

    if (!participant) {
      return NextResponse.json(
        { error: 'Peserta tidak ditemukan pada jadwal rapat ini' },
        { status: 404 },
      )
    }

    const updated = await prisma.bookingParticipant.update({
      where: { id: participant.id },
      data: {
        attendedAt,
        checkInMethod: attended ? 'MANUAL' : null,
      },
    })

    return NextResponse.json({
      success: true,
      participant: updated,
      message: attended ? 'Peserta ditandai hadir' : 'Status kehadiran peserta dibatalkan',
    })
  }

  return NextResponse.json({ error: 'Target presensi tidak ditentukan' }, { status: 400 })
}
