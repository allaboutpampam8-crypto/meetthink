import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { notifyBookingApproved, notifyBookingRejected } from '@/lib/notifications'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id: bookingId } = await params
  const body = await request.json()
  const { action, comment } = body // action: 'APPROVE' | 'REJECT' | 'REVISE'

  if (!['APPROVE', 'REJECT', 'REVISE'].includes(action)) {
    return NextResponse.json({ error: 'Action tidak valid' }, { status: 400 })
  }

  // Ambil booking beserta approval flow
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: {
      approvalFlow: {
        include: { steps: { orderBy: { level: 'asc' } } },
      },
    },
  })

  if (!booking) return NextResponse.json({ error: 'Booking tidak ditemukan' }, { status: 404 })
  if (booking.status !== 'PENDING') {
    return NextResponse.json({ error: 'Booking tidak dalam status pending' }, { status: 400 })
  }

  // Cek apakah user adalah approver level saat ini
  const currentStep = booking.approvalFlow?.steps.find(
    (s) => s.level === booking.currentLevel,
  )
  if (!currentStep || currentStep.approverId !== session.user.id) {
    return NextResponse.json({ error: 'Anda bukan approver pada level ini' }, { status: 403 })
  }

  // Simpan aksi approval
  await prisma.approvalAction.create({
    data: {
      bookingId,
      approvalStepId: currentStep.id,
      approverId: session.user.id,
      action,
      comment,
    },
  })

  if (action === 'REJECT') {
    await prisma.booking.update({
      where: { id: bookingId },
      data: { status: 'REJECTED', rejectedReason: comment },
    })
    await notifyBookingRejected(bookingId, comment ?? 'Tidak ada keterangan')
  } else if (action === 'REVISE') {
    // Kembalikan ke pemohon untuk direvisi — tetap PENDING, turunkan ke level sebelumnya (atau 1)
    await prisma.booking.update({
      where: { id: bookingId },
      data: { currentLevel: Math.max(1, booking.currentLevel - 1) },
    })
    // Notifikasi pemohon
    const { createNotification } = await import('@/lib/notifications')
    await createNotification({
      userId: booking.requesterId,
      bookingId,
      type: 'BOOKING_REVISED',
      title: 'Revisi Dibutuhkan',
      body: `Pengajuan booking Anda membutuhkan revisi. Komentar: ${comment}`,
      link: `/bookings/${bookingId}`,
    })
  } else {
    // APPROVE — cek apakah ada level berikutnya
    const nextStep = booking.approvalFlow?.steps.find(
      (s) => s.level === booking.currentLevel + 1,
    )

    if (nextStep) {
      // Naik ke level berikutnya
      await prisma.booking.update({
        where: { id: bookingId },
        data: { currentLevel: nextStep.level },
      })
      // Notifikasi approver berikutnya
      await import('@/lib/notifications').then(({ notifyBookingSubmitted }) =>
        notifyBookingSubmitted(bookingId, nextStep.approverId),
      )
    } else {
      // Final approved
      await prisma.booking.update({
        where: { id: bookingId },
        data: { status: 'APPROVED' },
      })
      // Buat record Meeting jika belum ada (idempotent upsert cegah P2002 duplicate key)
      await prisma.meeting.upsert({
        where: { bookingId },
        create: { bookingId },
        update: {},
      })
      await notifyBookingApproved(bookingId)
    }
  }

  // Audit log
  await prisma.auditLog.create({
    data: {
      userId: session.user.id,
      action: `booking.${action.toLowerCase()}`,
      entityType: 'Booking',
      entityId: bookingId,
    },
  })

  return NextResponse.json({ success: true })
}
