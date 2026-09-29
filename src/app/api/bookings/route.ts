import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { z } from 'zod'
import { checkRoomConflict } from '@/lib/conflict-check'
import { notifyBookingSubmitted } from '@/lib/notifications'
import crypto from 'crypto'

const createBookingSchema = z.object({
  title: z.string().min(1, 'Judul rapat wajib diisi'),
  agenda: z.string().optional(),
  roomId: z.string().min(1, 'Ruang rapat wajib dipilih'),
  startAt: z.string().min(1, 'Waktu mulai wajib diisi'),
  endAt: z.string().min(1, 'Waktu selesai wajib diisi'),
  notes: z.string().optional(),
  participants: z
    .array(
      z.object({
        userId: z.string().optional(),
        email: z.string().email('Format email peserta tidak valid'),
        name: z.string().optional(),
        type: z.enum(['REQUIRED', 'OPTIONAL']).default('REQUIRED'),
      }),
    )
    .optional(),
})

export async function GET(request: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const status = searchParams.get('status')
  const mine = searchParams.get('mine') === 'true'
  const userId = session.user.id
  const userEmail = session.user.email ?? ''
  const role = session.user.role ?? 'USER'
  const isAdmin = ['ADMIN', 'SUPER_ADMIN'].includes(role)

  const bookings = await prisma.booking.findMany({
    where: {
      ...(mine
        ? { requesterId: userId }
        : isAdmin
        ? {}
        : {
            OR: [
              { requesterId: userId },
              {
                participants: { some: { OR: [{ userId }, { email: userEmail }] } },
                status: { in: ['APPROVED', 'COMPLETED'] },
              },
            ],
          }),
      ...(status ? { status: status as any } : {}),
    },
    include: {
      room: { select: { name: true, location: true, code: true } },
      requester: { select: { name: true, email: true, division: true } },
      _count: { select: { participants: true } },
    },
    orderBy: { startAt: 'asc' },
  })

  return NextResponse.json({ bookings })
}

export async function POST(request: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Sesi login tidak valid. Silakan login kembali.' }, { status: 401 })
  }

  const body = await request.json()
  const parsed = createBookingSchema.safeParse(body)
  if (!parsed.success) {
    const flat = parsed.error.flatten()
    const firstFieldErr = Object.values(flat.fieldErrors).flat()[0]
    const firstFormErr = flat.formErrors[0]
    const errorMessage = firstFieldErr ?? firstFormErr ?? 'Data formulir tidak valid'
    return NextResponse.json({ error: errorMessage }, { status: 400 })
  }

  const data = parsed.data
  const startAt = new Date(data.startAt)
  const endAt = new Date(data.endAt)

  // Validasi format tanggal
  if (isNaN(startAt.getTime()) || isNaN(endAt.getTime())) {
    return NextResponse.json({ error: 'Format tanggal atau jam tidak valid' }, { status: 400 })
  }

  // Validasi rentang waktu
  if (endAt <= startAt) {
    return NextResponse.json(
      { error: 'Jam selesai harus lebih akhir dari jam mulai (misal: 11:00 ke 12:00)' },
      { status: 400 },
    )
  }

  // Toleransi 15 menit untuk keterlambatan/perbedaan jam server-client
  const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000)
  if (endAt < fifteenMinutesAgo) {
    return NextResponse.json(
      { error: 'Tidak dapat booking untuk waktu yang sudah berlalu' },
      { status: 400 },
    )
  }

  // Conflict check (apakah ruang sudah dipakai di waktu tersebut)
  const conflict = await checkRoomConflict({ roomId: data.roomId, startAt, endAt })
  if (conflict.hasConflict) {
    return NextResponse.json(
      {
        error: 'Jadwal bertabrakan! Ruang sudah dipesan pada waktu ini. Silakan pilih ruang atau jam lain.',
        conflictingBooking: conflict.conflictingBooking,
      },
      { status: 409 },
    )
  }

  // Ambil data pemohon untuk mengetahui divisi asalnya
  const requester = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, name: true, division: true },
  })

  // Cari alur approval:
  // 1. Alur khusus divisi pemohon (jika ada yang aktif)
  let approvalFlow = null
  if (requester?.division) {
    approvalFlow = await prisma.approvalFlow.findFirst({
      where: {
        division: { equals: requester.division.trim(), mode: 'insensitive' },
        isActive: true,
      },
      include: { steps: { orderBy: { level: 'asc' } } },
    })
  }

  // 2. Jika tidak ada alur khusus divisi, gunakan alur default
  if (!approvalFlow) {
    approvalFlow = await prisma.approvalFlow.findFirst({
      where: { isDefault: true, isActive: true },
      include: { steps: { orderBy: { level: 'asc' } } },
    })
  }

  // 3. Fallback jika alur default belum diset
  if (!approvalFlow) {
    approvalFlow = await prisma.approvalFlow.findFirst({
      where: { isActive: true },
      include: { steps: { orderBy: { level: 'asc' } } },
    })
  }

  // Buat booking
  const booking = await prisma.booking.create({
    data: {
      title: data.title,
      agenda: data.agenda,
      roomId: data.roomId,
      requesterId: session.user.id,
      startAt,
      endAt,
      notes: data.notes,
      status: 'PENDING',
      approvalFlowId: approvalFlow?.id,
      currentLevel: 1,
      attendanceToken: crypto.randomUUID(),
      participants: data.participants
        ? {
            create: data.participants.map((p) => ({
              userId: p.userId,
              email: p.email,
              name: p.name,
              type: p.type,
            })),
          }
        : undefined,
    },
    include: {
      room: true,
      participants: true,
    },
  })

  // Audit log
  await prisma.auditLog.create({
    data: {
      userId: session.user.id,
      action: 'booking.created',
      entityType: 'Booking',
      entityId: booking.id,
      newData: booking as any,
    },
  })

  // Notifikasi ke approver level 1
  if (approvalFlow?.steps?.length) {
    const step1 = approvalFlow.steps.find((s) => s.level === 1)
    if (step1) {
      await notifyBookingSubmitted(booking.id, step1.approverId)
    }
  }

  return NextResponse.json({ booking }, { status: 201 })
}
