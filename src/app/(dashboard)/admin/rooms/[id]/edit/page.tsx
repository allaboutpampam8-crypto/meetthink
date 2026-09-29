import { auth } from '@/lib/auth'
import { redirect, notFound } from 'next/navigation'
import { prisma } from '@/lib/db'
import { RoomForm } from '@/components/admin/room-form'

export const metadata = { title: 'Edit Ruang Rapat' }

export default async function EditRoomPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const session = await auth()
  if (!['SUPER_ADMIN', 'ADMIN'].includes(session?.user?.role ?? '')) redirect('/dashboard')

  const { id } = await params
  const room = await prisma.room.findUnique({
    where: { id },
    include: { facilities: true },
  })
  if (!room) notFound()

  return (
    <RoomForm
      mode="edit"
      defaultValues={{
        id: room.id,
        name: room.name,
        code: room.code,
        location: room.location,
        capacity: room.capacity,
        description: room.description ?? '',
        isActive: room.isActive,
        facilities: room.facilities.map((f) => f.name),
      }}
    />
  )
}
