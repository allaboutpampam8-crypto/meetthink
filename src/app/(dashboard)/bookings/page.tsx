import { Metadata } from 'next'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { BookingTabsView } from '@/components/booking/booking-tabs-view'

export const metadata: Metadata = { title: 'Jadwal & Booking Ruang' }

export default async function BookingsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; tab?: string }>
}) {
  const session = await auth()
  const userId = session!.user!.id!
  const userEmail = session!.user!.email ?? ''
  const { status } = await searchParams

  const now = new Date()

  let statusFilterQuery: any = {}
  if (status === 'COMPLETED') {
    statusFilterQuery = {
      OR: [
        { status: 'COMPLETED' },
        { status: 'APPROVED', endAt: { lt: now } },
      ],
    }
  } else if (status === 'APPROVED') {
    statusFilterQuery = {
      status: 'APPROVED',
      endAt: { gte: now },
    }
  } else if (status) {
    statusFilterQuery = { status: status as any }
  }

  const [rooms, bookings] = await Promise.all([
    prisma.room.findMany({
      where: { isActive: true },
      include: { facilities: true },
      orderBy: { name: 'asc' },
    }),
    prisma.booking.findMany({
      where: {
        AND: [
          {
            OR: [
              // Pembuat booking: dapat melihat booking miliknya di semua status
              { requesterId: userId },
              // Peserta: HANYA melihat jika status sudah disetujui (APPROVED / COMPLETED)
              {
                participants: { some: { OR: [{ userId }, { email: userEmail }] } },
                status: { in: ['APPROVED', 'COMPLETED'] },
              },
            ],
          },
          statusFilterQuery,
        ],
      },
      include: {
        room: { select: { name: true, location: true, code: true } },
        requester: { select: { id: true, name: true, email: true } },
        _count: { select: { participants: true } },
        actions: {
          include: { approver: { select: { name: true } } },
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
      orderBy: { startAt: 'desc' },
    }),
  ])

  return (
    <BookingTabsView
      initialRooms={rooms}
      bookings={bookings as any}
      currentStatusFilter={status}
      currentUserId={userId}
    />
  )
}
