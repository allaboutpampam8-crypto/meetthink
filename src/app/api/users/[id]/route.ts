import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'

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
  const { role, division, position, isActive } = body
  const currentUserRole = session?.user?.role ?? ''
  const currentUserId = session?.user?.id

  // Ambil data target user
  const targetUser = await prisma.user.findUnique({
    where: { id },
    select: { id: true, role: true, isActive: true },
  })

  if (!targetUser) {
    return NextResponse.json({ error: 'Pengguna tidak ditemukan' }, { status: 404 })
  }

  // 1. Akun SUPER_ADMIN hanya dapat dikelola oleh sesama SUPER_ADMIN
  if (targetUser.role === 'SUPER_ADMIN' && currentUserRole !== 'SUPER_ADMIN') {
    return NextResponse.json(
      { error: 'Akses ditolak. Akun Super Admin hanya dapat dikelola oleh sesama Super Admin.' },
      { status: 403 },
    )
  }

  // 2. Hanya SUPER_ADMIN yang bisa menaikkan role user lain menjadi SUPER_ADMIN
  if (role === 'SUPER_ADMIN' && currentUserRole !== 'SUPER_ADMIN') {
    return NextResponse.json(
      { error: 'Hanya Super Admin yang berhak memberikan role Super Admin' },
      { status: 403 },
    )
  }

  // 3. Cegah Super Admin menonaktifkan akunnya sendiri jika merupakan satu-satunya Super Admin aktif
  if (id === currentUserId && isActive === false && targetUser.role === 'SUPER_ADMIN') {
    const activeSuperAdminCount = await prisma.user.count({
      where: { role: 'SUPER_ADMIN', isActive: true },
    })
    if (activeSuperAdminCount <= 1) {
      return NextResponse.json(
        { error: 'Tidak dapat menonaktifkan akun ini. Sistem harus memiliki minimal satu Super Admin yang aktif.' },
        { status: 400 },
      )
    }
  }

  const user = await prisma.user.update({
    where: { id },
    data: {
      ...(role !== undefined ? { role } : {}),
      ...(division !== undefined ? { division } : {}),
      ...(position !== undefined ? { position } : {}),
      ...(isActive !== undefined ? { isActive: Boolean(isActive) } : {}),
    },
    select: { id: true, name: true, email: true, role: true, division: true, isActive: true },
  })

  return NextResponse.json({ user })
}
