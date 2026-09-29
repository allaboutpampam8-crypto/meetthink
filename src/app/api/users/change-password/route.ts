import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import bcrypt from 'bcryptjs'
import { z } from 'zod'

const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Password saat ini wajib diisi'),
    newPassword: z.string().min(6, 'Password baru minimal 6 karakter'),
    confirmPassword: z.string().min(6, 'Konfirmasi password baru minimal 6 karakter'),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'Konfirmasi password baru tidak cocok',
    path: ['confirmPassword'],
  })

export async function POST(request: NextRequest) {
  const session = await auth()
  const userId = session?.user?.id

  if (!userId) {
    return NextResponse.json(
      { error: 'Sesi login tidak valid. Silakan login kembali.' },
      { status: 401 },
    )
  }

  try {
    const body = await request.json()
    const parsed = changePasswordSchema.safeParse(body)

    if (!parsed.success) {
      const flat = parsed.error.flatten()
      const errorMsg =
        Object.values(flat.fieldErrors).flat()[0] ??
        flat.formErrors[0] ??
        'Data formulir tidak valid'
      return NextResponse.json({ error: errorMsg }, { status: 400 })
    }

    const { currentPassword, newPassword } = parsed.data

    // Ambil data user beserta password hash dari database
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, password: true },
    })

    if (!user) {
      return NextResponse.json({ error: 'Pengguna tidak ditemukan' }, { status: 404 })
    }

    // Verifikasi password saat ini
    const isCurrentValid = await bcrypt.compare(currentPassword, user.password)
    if (!isCurrentValid) {
      return NextResponse.json(
        { error: 'Password saat ini yang Anda masukkan salah. Silakan coba lagi.' },
        { status: 400 },
      )
    }

    // Cek agar tidak menggunakan password yang sama persis
    const isSameAsOld = await bcrypt.compare(newPassword, user.password)
    if (isSameAsOld) {
      return NextResponse.json(
        { error: 'Password baru tidak boleh sama persis dengan password saat ini.' },
        { status: 400 },
      )
    }

    // Hash password baru dengan bcrypt
    const hashedNewPassword = await bcrypt.hash(newPassword, 12)

    // Simpan ke DB
    await prisma.user.update({
      where: { id: userId },
      data: { password: hashedNewPassword },
    })

    return NextResponse.json({
      success: true,
      message: 'Password Anda berhasil diperbarui!',
    })
  } catch (error: any) {
    console.error('Error changing password:', error)
    return NextResponse.json(
      { error: error.message || 'Terjadi kesalahan saat mengubah password' },
      { status: 500 },
    )
  }
}
