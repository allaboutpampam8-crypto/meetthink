import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { notifyActionItemAssigned } from '@/lib/notifications'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id: meetingId } = await params
  const body = await request.json()
  const { description, picId, deadline, notes } = body

  if (!description?.trim()) {
    return NextResponse.json({ error: 'Deskripsi tugas wajib diisi' }, { status: 400 })
  }
  if (!picId) {
    return NextResponse.json({ error: 'Penanggung jawab (PIC) wajib dipilih' }, { status: 400 })
  }
  if (!deadline) {
    return NextResponse.json({ error: 'Batas waktu (deadline) wajib diisi' }, { status: 400 })
  }

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
      { error: 'Hanya penyelenggara, peserta, atau admin yang dapat menetapkan tindak lanjut' },
      { status: 403 },
    )
  }

  const actionItem = await prisma.actionItem.create({
    data: {
      meetingId,
      description: description.trim(),
      picId,
      deadline: new Date(deadline),
      notes: notes?.trim() || undefined,
      status: 'OPEN',
    },
    include: {
      pic: { select: { id: true, name: true, email: true, division: true } },
    },
  })

  // Kirim notifikasi ke PIC
  try {
    await notifyActionItemAssigned(actionItem.id)
  } catch (err) {
    console.error('Failed to notify PIC:', err)
  }

  return NextResponse.json({ actionItem }, { status: 201 })
}
