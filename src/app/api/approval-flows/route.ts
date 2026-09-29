import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function POST(request: NextRequest) {
  const session = await auth()
  if (!['SUPER_ADMIN', 'ADMIN'].includes(session?.user?.role ?? '')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = await request.json()
  const { name, description, division, isDefault, isActive = true, steps } = body

  if (!name) return NextResponse.json({ error: 'Nama wajib diisi' }, { status: 400 })
  if (!steps?.length) return NextResponse.json({ error: 'Minimal 1 langkah approval' }, { status: 400 })

  // Jika isDefault, unset semua flow lain yang isDefault
  if (isDefault) {
    await prisma.approvalFlow.updateMany({ data: { isDefault: false } })
  }

  const flow = await prisma.approvalFlow.create({
    data: {
      name,
      description,
      division: division ? division.trim() : null,
      isDefault: Boolean(isDefault),
      isActive: Boolean(isActive),
      steps: {
        create: steps.map((s: any) => ({
          level: Number(s.level),
          label: s.label,
          approverId: s.approverId,
          deadlineHours: Number(s.deadlineHours) || 24,
        })),
      },
    },
    include: { steps: { orderBy: { level: 'asc' } } },
  })

  return NextResponse.json({ flow }, { status: 201 })
}

export async function GET() {
  const flows = await prisma.approvalFlow.findMany({
    include: {
      steps: { orderBy: { level: 'asc' }, include: { approver: { select: { name: true, division: true } } } },
      _count: { select: { bookings: true } },
    },
    orderBy: { createdAt: 'asc' },
  })
  return NextResponse.json({ flows })
}
