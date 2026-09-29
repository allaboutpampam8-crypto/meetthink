import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function PATCH(request: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()

  if (body.all) {
    await prisma.notification.updateMany({
      where: { userId: session.user.id, isRead: false },
      data: { isRead: true, readAt: new Date() },
    })
  } else if (body.id) {
    await prisma.notification.updateMany({
      where: { id: body.id, userId: session.user.id },
      data: { isRead: true, readAt: new Date() },
    })
  }

  return NextResponse.json({ success: true })
}
