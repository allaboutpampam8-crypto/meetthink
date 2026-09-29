import { Metadata } from 'next'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { NewBookingFlow } from '@/components/booking/new-booking-flow'

export const metadata: Metadata = { title: 'Booking Ruang Baru' }

export default async function NewBookingPage() {
  const session = await auth()

  const [rooms, users] = await Promise.all([
    prisma.room.findMany({
      where: { isActive: true },
      include: { facilities: true },
      orderBy: { name: 'asc' },
    }),
    prisma.user.findMany({
      where: { isActive: true },
      select: { id: true, name: true, email: true, division: true },
      orderBy: { name: 'asc' },
    }),
  ])

  return (
    <NewBookingFlow
      rooms={rooms}
      users={users}
      currentUserId={session!.user!.id!}
    />
  )
}
