import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'

// GET meeting info by attendance token
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const token = searchParams.get('token')

  if (!token) {
    return NextResponse.json({ error: 'Token absensi tidak valid' }, { status: 400 })
  }

  const booking = await prisma.booking.findUnique({
    where: { attendanceToken: token },
    include: {
      room: { select: { name: true, location: true } },
      requester: { select: { id: true, name: true, email: true } },
      participants: { select: { id: true, email: true, name: true, attendedAt: true } },
    },
  })

  if (!booking) {
    return NextResponse.json({ error: 'Jadwal rapat tidak ditemukan' }, { status: 404 })
  }

  const session = await auth()
  let myAttendance: { isAttended: boolean; attendedAt?: Date | null; role?: string } = {
    isAttended: false,
  }

  if (session?.user) {
    const isRequester = booking.requesterId === session.user.id
    if (isRequester) {
      myAttendance = {
        isAttended: !!booking.requesterAttendedAt,
        attendedAt: booking.requesterAttendedAt,
        role: 'Penyelenggara',
      }
    } else {
      const p = booking.participants.find(
        (part) =>
          part.email.toLowerCase() === session.user.email?.toLowerCase(),
      )
      if (p) {
        myAttendance = {
          isAttended: !!p.attendedAt,
          attendedAt: p.attendedAt,
          role: 'Peserta',
        }
      }
    }
  }

  const nowTime = Date.now()
  const startTime = new Date(booking.startAt).getTime()
  const endTime = new Date(booking.endAt).getTime()
  const isEarly = nowTime < startTime - 30 * 60 * 1000
  const isClosed = booking.status === 'COMPLETED' || nowTime > endTime + 60 * 60 * 1000
  const isCheckInOpen = !isEarly && !isClosed && booking.status === 'APPROVED'

  return NextResponse.json({
    booking: {
      id: booking.id,
      title: booking.title,
      startAt: booking.startAt,
      endAt: booking.endAt,
      status: booking.status,
      room: booking.room,
      requester: booking.requester,
      participantCount: booking.participants.length + 1,
    },
    user: session?.user ?? null,
    myAttendance,
    checkInStatus: {
      isOpen: isCheckInOpen,
      isEarly,
      isClosed,
    },
  })
}

// POST to check in attendance
export async function POST(request: NextRequest) {
  const body = await request.json()
  const { token, email, name } = body

  if (!token) {
    return NextResponse.json({ error: 'Token absensi wajib disertakan' }, { status: 400 })
  }

  const booking = await prisma.booking.findUnique({
    where: { attendanceToken: token },
    include: {
      room: { select: { name: true, location: true } },
      requester: { select: { id: true, name: true, email: true } },
      participants: true,
    },
  })

  if (!booking) {
    return NextResponse.json({ error: 'Jadwal rapat tidak ditemukan' }, { status: 404 })
  }

  if (booking.status === 'CANCELLED' || booking.status === 'REJECTED') {
    return NextResponse.json(
      { error: 'Rapat ini telah dibatalkan atau ditolak, absensi tidak dapat dilakukan' },
      { status: 400 },
    )
  }

  if (booking.status === 'PENDING') {
    return NextResponse.json(
      { error: 'Rapat belum disetujui oleh approver, absensi belum dapat dilakukan' },
      { status: 400 },
    )
  }

  const now = new Date()
  const nowTime = now.getTime()
  const startTime = new Date(booking.startAt).getTime()
  const endTime = new Date(booking.endAt).getTime()
  const earliestCheckIn = startTime - 30 * 60 * 1000 // 30 menit sebelum rapat dimulai
  const latestCheckIn = endTime + 60 * 60 * 1000 // toleransi 1 jam setelah selesai jika belum ditandai selesai

  if (nowTime < earliestCheckIn) {
    const formattedStartTime = new Date(booking.startAt).toLocaleTimeString('id-ID', {
      hour: '2-digit',
      minute: '2-digit',
    })
    return NextResponse.json(
      {
        error: `Presensi belum dibuka. Presensi mandiri dibuka mulai 30 menit sebelum rapat dimulai (pukul ${formattedStartTime} WIB).`,
      },
      { status: 400 },
    )
  }

  if (booking.status === 'COMPLETED' || nowTime > latestCheckIn) {
    return NextResponse.json(
      { error: 'Rapat telah selesai dilaksanakan. Waktu presensi mandiri telah ditutup.' },
      { status: 400 },
    )
  }

  const session = await auth()

  // 1. Logged-in session check-in
  if (session?.user?.id) {
    const userId = session.user.id
    const userEmail = session.user.email?.toLowerCase() ?? ''
    const userName = session.user.name ?? userEmail

    // Check if requester
    if (booking.requesterId === userId || booking.requester.email.toLowerCase() === userEmail) {
      await prisma.booking.update({
        where: { id: booking.id },
        data: { requesterAttendedAt: now },
      })

      return NextResponse.json({
        success: true,
        message: 'Presensi Penyelenggara berhasil dicatat!',
        attendeeName: booking.requester.name,
        attendedAt: now,
        meetingTitle: booking.title,
        roomName: booking.room.name,
      })
    }

    // Check existing participant
    const existing = booking.participants.find(
      (p) =>
        (p.userId && p.userId === userId) ||
        p.email.toLowerCase() === userEmail,
    )

    if (existing) {
      await prisma.bookingParticipant.update({
        where: { id: existing.id },
        data: {
          attendedAt: now,
          checkInMethod: 'QR_SCAN',
          userId: userId,
          name: existing.name || userName,
        },
      })

      return NextResponse.json({
        success: true,
        message: 'Presensi kehadiran Anda berhasil dicatat!',
        attendeeName: existing.name || userName,
        attendedAt: now,
        meetingTitle: booking.title,
        roomName: booking.room.name,
      })
    }

    // Walk-in participant (user registered but not in invite list)
    const walkIn = await prisma.bookingParticipant.create({
      data: {
        bookingId: booking.id,
        userId: userId,
        email: userEmail,
        name: userName,
        type: 'OPTIONAL',
        rsvp: 'ACCEPTED',
        attendedAt: now,
        checkInMethod: 'QR_SCAN',
      },
    })

    return NextResponse.json({
      success: true,
      message: 'Presensi berhasil dicatat sebagai peserta tambahan!',
      attendeeName: walkIn.name ?? userName,
      attendedAt: now,
      meetingTitle: booking.title,
      roomName: booking.room.name,
    })
  }

  // 2. Unauthenticated check-in via email & name input
  if (!email || !email.trim()) {
    return NextResponse.json(
      { error: 'Email wajib diisi untuk melakukan absensi' },
      { status: 400 },
    )
  }

  const cleanEmail = email.trim().toLowerCase()
  const cleanName = (name ?? '').trim() || cleanEmail

  // Check if requester
  if (booking.requester.email.toLowerCase() === cleanEmail) {
    await prisma.booking.update({
      where: { id: booking.id },
      data: { requesterAttendedAt: now },
    })

    return NextResponse.json({
      success: true,
      message: 'Presensi Penyelenggara berhasil dicatat!',
      attendeeName: booking.requester.name,
      attendedAt: now,
      meetingTitle: booking.title,
      roomName: booking.room.name,
    })
  }

  // Check existing participant
  const existing = booking.participants.find(
    (p) => p.email.toLowerCase() === cleanEmail,
  )

  if (existing) {
    await prisma.bookingParticipant.update({
      where: { id: existing.id },
      data: {
        attendedAt: now,
        checkInMethod: 'QR_SCAN',
        name: existing.name || cleanName,
      },
    })

    return NextResponse.json({
      success: true,
      message: 'Presensi kehadiran Anda berhasil dicatat!',
      attendeeName: existing.name || cleanName,
      attendedAt: now,
      meetingTitle: booking.title,
      roomName: booking.room.name,
    })
  }

  // Walk-in guest attendee
  const newGuest = await prisma.bookingParticipant.create({
    data: {
      bookingId: booking.id,
      email: cleanEmail,
      name: cleanName,
      type: 'OPTIONAL',
      rsvp: 'ACCEPTED',
      attendedAt: now,
      checkInMethod: 'QR_SCAN',
    },
  })

  return NextResponse.json({
    success: true,
    message: 'Presensi berhasil dicatat!',
    attendeeName: newGuest.name ?? cleanName,
    attendedAt: now,
    meetingTitle: booking.title,
    roomName: booking.room.name,
  })
}
