import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { checkRoomConflict } from '@/lib/conflict-check'

export async function GET(request: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const roomId = searchParams.get('roomId')
  const startAt = searchParams.get('startAt')
  const endAt = searchParams.get('endAt')
  const excludeBookingId = searchParams.get('excludeBookingId') ?? undefined

  if (!roomId || !startAt || !endAt) {
    return NextResponse.json({ error: 'roomId, startAt, endAt wajib diisi' }, { status: 400 })
  }

  const result = await checkRoomConflict({
    roomId,
    startAt: new Date(startAt),
    endAt: new Date(endAt),
    excludeBookingId,
  })

  return NextResponse.json(result)
}
