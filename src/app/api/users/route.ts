import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import bcrypt from 'bcryptjs'
import { z } from 'zod'

const createUserSchema = z.object({
  name: z.string().min(2, 'Nama minimal 2 karakter'),
  email: z.string().email('Format email tidak valid'),
  password: z.string().min(6, 'Password minimal 6 karakter'),
  role: z.enum(['SUPER_ADMIN', 'ADMIN', 'APPROVER', 'USER']).default('USER'),
  division: z.string().optional().nullable(),
  position: z.string().optional().nullable(),
})

export async function GET() {
  const session = await auth()
  if (!['SUPER_ADMIN', 'ADMIN'].includes(session?.user?.role ?? '')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const users = await prisma.user.findMany({
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      division: true,
      position: true,
      isActive: true,
      createdAt: true,
    },
    orderBy: [{ role: 'asc' }, { name: 'asc' }],
  })

  return NextResponse.json({ users })
}

export async function POST(request: NextRequest) {
  const session = await auth()
  const currentUserRole = session?.user?.role ?? ''

  if (!['SUPER_ADMIN', 'ADMIN'].includes(currentUserRole)) {
    return NextResponse.json(
      { error: 'Akses ditolak. Hanya Super Admin atau Admin yang dapat menambahkan pengguna.' },
      { status: 403 },
    )
  }

  try {
    const body = await request.json()
    const parsed = createUserSchema.safeParse(body)

    if (!parsed.success) {
      const flat = parsed.error.flatten()
      const errorMsg =
        Object.values(flat.fieldErrors).flat()[0] ??
        flat.formErrors[0] ??
        'Data formulir tidak valid'
      return NextResponse.json({ error: errorMsg }, { status: 400 })
    }

    const { name, email, password, role, division, position } = parsed.data

    // Hanya SUPER_ADMIN yang bisa membuat pengguna ber-role SUPER_ADMIN
    if (role === 'SUPER_ADMIN' && currentUserRole !== 'SUPER_ADMIN') {
      return NextResponse.json(
        { error: 'Hanya Super Admin yang berhak membuat akun dengan role Super Admin' },
        { status: 403 },
      )
    }

    // Cek apakah email sudah terdaftar
    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
    })

    if (existingUser) {
      return NextResponse.json(
        { error: 'Email tersebut sudah terdaftar di sistem. Gunakan email lain.' },
        { status: 400 },
      )
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12)

    // Buat pengguna baru
    const newUser = await prisma.user.create({
      data: {
        name: name.trim(),
        email: email.toLowerCase().trim(),
        password: hashedPassword,
        role,
        division: division ? division.trim() : null,
        position: position ? position.trim() : null,
        isActive: true,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        division: true,
        position: true,
        isActive: true,
        createdAt: true,
      },
    })

    return NextResponse.json(
      {
        success: true,
        message: 'Pengguna baru berhasil ditambahkan',
        user: newUser,
      },
      { status: 201 },
    )
  } catch (error: any) {
    console.error('Error creating user:', error)
    return NextResponse.json(
      { error: error.message || 'Terjadi kesalahan pada server saat menambahkan pengguna' },
      { status: 500 },
    )
  }
}

