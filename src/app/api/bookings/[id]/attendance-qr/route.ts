import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import QRCode from 'qrcode'
import crypto from 'crypto'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params

  const booking = await prisma.booking.findUnique({
    where: { id },
    include: {
      requester: { select: { id: true, name: true } },
      participants: { select: { id: true, email: true, name: true, attendedAt: true } },
    },
  })

  if (!booking) {
    return NextResponse.json({ error: 'Rapat tidak ditemukan' }, { status: 404 })
  }

  // Generate attendanceToken if not existing
  let token = booking.attendanceToken
  if (!token) {
    token = crypto.randomBytes(12).toString('hex')
    await prisma.booking.update({
      where: { id },
      data: { attendanceToken: token },
    })
  }

  // Base URL
  const host = request.headers.get('x-forwarded-host') ?? request.headers.get('host')
  const proto = request.headers.get('x-forwarded-proto') ?? (host?.startsWith('localhost') ? 'http' : 'https')
  const origin =
    request.headers.get('origin') ??
    (host ? `${proto}://${host}` : (process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'))
  const checkInUrl = `${origin}/attend/${token}`

  // Generate QR Code data URL
  const qrDataUrl = await QRCode.toDataURL(checkInUrl, {
    width: 400,
    margin: 2,
    color: {
      dark: '#1e293b',
      light: '#ffffff',
    },
  })

  const totalAttendees = booking.participants.length + 1
  const attendedParticipants = booking.participants.filter((p) => p.attendedAt != null).length
  const attendedCount = attendedParticipants + (booking.requesterAttendedAt ? 1 : 0)

  return NextResponse.json({
    token,
    checkInUrl,
    qrDataUrl,
    stats: {
      total: totalAttendees,
      attended: attendedCount,
      percentage: Math.round((attendedCount / totalAttendees) * 100),
    },
  })
}
