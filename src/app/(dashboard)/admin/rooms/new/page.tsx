import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { RoomForm } from '@/components/admin/room-form'

export const metadata = { title: 'Tambah Ruang Rapat' }

export default async function NewRoomPage() {
  const session = await auth()
  if (!['SUPER_ADMIN', 'ADMIN'].includes(session?.user?.role ?? '')) redirect('/dashboard')

  return <RoomForm mode="create" />
}
