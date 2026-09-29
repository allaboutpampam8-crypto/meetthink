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

  const { id } = await params
  const body = await request.json()
  const { status, notes } = body

  const validStatuses = ['OPEN', 'IN_PROGRESS', 'DONE']
  if (status && !validStatuses.includes(status)) {
    return NextResponse.json({ error: 'Status tidak valid' }, { status: 400 })
  }

  // Pastikan action item ada
  const item = await prisma.actionItem.findUnique({
    where: { id },
    include: {
      meeting: {
        include: {
          booking: {
            select: { requesterId: true },
          },
        },
      },
    },
  })
  if (!item) return NextResponse.json({ error: 'Action item tidak ditemukan' }, { status: 404 })

  const role = session.user.role ?? 'USER'
  const isAdminOrAbove = ['SUPER_ADMIN', 'ADMIN'].includes(role)
  const isPic = item.picId === session.user.id
  const isOrganizer = item.meeting.booking.requesterId === session.user.id

  if (!isPic && !isOrganizer && !isAdminOrAbove) {
    return NextResponse.json(
      { error: 'Hanya PIC penanggung jawab, penyelenggara rapat, atau admin yang berhak memperbarui status tindak lanjut ini' },
      { status: 403 },
    )
  }

  const updateData: {
    status?: any
    notes?: string | null
    completedAt?: Date | null
  } = {}

  if (status) {
    updateData.status = status
    if (status === 'DONE') {
      updateData.completedAt = new Date()
    } else {
      updateData.completedAt = null
    }
  }

  if (notes !== undefined) {
    updateData.notes = typeof notes === 'string' ? notes.trim() : null
  }

  const updated = await prisma.actionItem.update({
    where: { id },
    data: updateData,
    include: {
      pic: { select: { id: true, name: true, email: true, division: true } },
    },
  })

  return NextResponse.json({ actionItem: updated })
}
