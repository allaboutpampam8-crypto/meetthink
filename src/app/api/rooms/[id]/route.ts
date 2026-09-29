import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  const room = await prisma.room.findUnique({
    where: { id },
    include: { facilities: true },
  })
  if (!room) return NextResponse.json({ error: 'Ruang tidak ditemukan' }, { status: 404 })
  return NextResponse.json({ room })
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth()
  if (!['SUPER_ADMIN', 'ADMIN'].includes(session?.user?.role ?? '')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { id } = await params
  const body = await request.json()
  const { name, code, location, capacity, description, isActive, facilities } = body

  // Hapus fasilitas lama, buat baru
  await prisma.roomFacility.deleteMany({ where: { roomId: id } })

  const room = await prisma.room.update({
    where: { id },
    data: {
      name,
      code,
      location,
      capacity: Number(capacity),
      description,
      isActive: Boolean(isActive),
      facilities: facilities?.length
        ? { create: (facilities as string[]).filter(Boolean).map((f: string) => ({ name: f })) }
        : undefined,
    },
    include: { facilities: true },
  })

  return NextResponse.json({ room })
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth()
  if (!['SUPER_ADMIN', 'ADMIN'].includes(session?.user?.role ?? '')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { id } = await params

  // Cek apakah ada booking aktif (PENDING atau APPROVED)
  const activeBookings = await prisma.booking.count({
    where: { roomId: id, status: { in: ['PENDING', 'APPROVED'] } },
  })
  if (activeBookings > 0) {
    return NextResponse.json(
      { error: 'Tidak dapat menghapus ruangan yang masih memiliki jadwal rapat aktif' },
      { status: 409 },
    )
  }

  // Cek apakah ada riwayat booking lampau (COMPLETED, REJECTED, CANCELLED)
  const totalBookings = await prisma.booking.count({
    where: { roomId: id },
  })

  if (totalBookings > 0) {
    // Soft-delete: nonaktifkan ruangan agar integritas arsip & riwayat rapat perusahaan tetap utuh
    await prisma.room.update({
      where: { id },
      data: { isActive: false },
    })
    return NextResponse.json({
      success: true,
      message: 'Ruangan memiliki riwayat rapat dan telah berhasil dinonaktifkan (diarsipkan).',
    })
  }

  // Jika belum pernah digunakan sama sekali, hapus fasilitas lalu hapus permanen
  await prisma.roomFacility.deleteMany({ where: { roomId: id } })
  await prisma.room.delete({ where: { id } })
  return NextResponse.json({ success: true, message: 'Ruangan berhasil dihapus' })
}
