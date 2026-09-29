import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { z } from 'zod'

const createRoomSchema = z.object({
  name: z.string().min(1),
  code: z.string().min(1).toUpperCase(),
  location: z.string().min(1),
  floor: z.string().optional(),
  capacity: z.number().int().min(1),
  description: z.string().optional(),
  facilities: z.array(z.string()).optional(),
  operationalHours: z.record(z.any()).optional(),
})

export async function GET(request: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const capacityMin = searchParams.get('capacityMin')
  const search = searchParams.get('search')

  const rooms = await prisma.room.findMany({
    where: {
      isActive: true,
      ...(capacityMin ? { capacity: { gte: parseInt(capacityMin) } } : {}),
      ...(search
        ? {
            OR: [
              { name: { contains: search, mode: 'insensitive' } },
              { location: { contains: search, mode: 'insensitive' } },
              { code: { contains: search, mode: 'insensitive' } },
            ],
          }
        : {}),
    },
    include: {
      facilities: true,
      _count: { select: { bookings: true } },
    },
    orderBy: { name: 'asc' },
  })

  return NextResponse.json({ rooms })
}

export async function POST(request: NextRequest) {
  const session = await auth()
  if (!session?.user?.id || !['SUPER_ADMIN', 'ADMIN'].includes(session.user.role ?? '')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = await request.json()
  const parsed = createRoomSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  const { facilities, ...data } = parsed.data

  const room = await prisma.room.create({
    data: {
      ...data,
      facilities: facilities
        ? { create: facilities.map((name) => ({ name })) }
        : undefined,
    },
    include: { facilities: true },
  })

  return NextResponse.json({ room }, { status: 201 })
}
