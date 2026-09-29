import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { checkParticipantConflicts } from '@/lib/conflict-check'

export async function POST(request: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { userIds, emails, startAt, endAt, excludeBookingId } = body

    if (!startAt || !endAt) {
      return NextResponse.json({ error: 'startAt dan endAt wajib diisi' }, { status: 400 })
    }

    const conflicts = await checkParticipantConflicts({
      userIds: Array.isArray(userIds) ? userIds : [],
      emails: Array.isArray(emails) ? emails : [],
      startAt: new Date(startAt),
      endAt: new Date(endAt),
      excludeBookingId,
    })

    return NextResponse.json({ conflicts })
  } catch (error: any) {
    console.error('Participant availability error:', error)
    return NextResponse.json({ error: 'Gagal mengecek ketersediaan peserta' }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const startAt = searchParams.get('startAt')
  const endAt = searchParams.get('endAt')
  const userIdsParam = searchParams.get('userIds')
  const emailsParam = searchParams.get('emails')
  const excludeBookingId = searchParams.get('excludeBookingId') ?? undefined

  if (!startAt || !endAt) {
    return NextResponse.json({ error: 'startAt dan endAt wajib diisi' }, { status: 400 })
  }

  const userIds = userIdsParam ? userIdsParam.split(',').filter(Boolean) : []
  const emails = emailsParam ? emailsParam.split(',').filter(Boolean) : []

  const conflicts = await checkParticipantConflicts({
    userIds,
    emails,
    startAt: new Date(startAt),
    endAt: new Date(endAt),
    excludeBookingId,
  })

  return NextResponse.json({ conflicts })
}
