import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  const flow = await prisma.approvalFlow.findUnique({
    where: { id },
    include: {
      steps: { orderBy: { level: 'asc' }, include: { approver: { select: { id: true, name: true } } } },
    },
  })
  if (!flow) return NextResponse.json({ error: 'Flow tidak ditemukan' }, { status: 404 })
  return NextResponse.json({ flow })
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth()
  if (!['SUPER_ADMIN', 'ADMIN'].includes(session?.user?.role ?? '')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { id } = await params
  const body = await request.json()
  const { name, description, division, isDefault, isActive, steps } = body

  if (isDefault) {
    await prisma.approvalFlow.updateMany({
      where: { id: { not: id } },
      data: { isDefault: false },
    })
  }

  // Update data utama alur approval
  await prisma.approvalFlow.update({
    where: { id },
    data: {
      name,
      description,
      division: division ? division.trim() : null,
      isDefault: Boolean(isDefault),
      isActive: Boolean(isActive),
    },
  })

  // Sinkronisasi steps dengan idempotent upsert (menjaga ID step & relasi approval_actions lama tetap utuh)
  if (Array.isArray(steps) && steps.length > 0) {
    const newLevels = steps.map((s: any) => Number(s.level))

    for (const s of steps) {
      const level = Number(s.level)
      await prisma.approvalStep.upsert({
        where: {
          approvalFlowId_level: {
            approvalFlowId: id,
            level,
          },
        },
        create: {
          approvalFlowId: id,
          level,
          label: s.label,
          approverId: s.approverId,
          deadlineHours: Number(s.deadlineHours) || 24,
        },
        update: {
          label: s.label,
          approverId: s.approverId,
          deadlineHours: Number(s.deadlineHours) || 24,
        },
      })
    }

    // Hapus level yang sudah dihilangkan jika belum memiliki aksi persetujuan terkait
    const obsoleteSteps = await prisma.approvalStep.findMany({
      where: {
        approvalFlowId: id,
        level: { notIn: newLevels },
      },
      include: { _count: { select: { actions: true } } },
    })

    for (const obs of obsoleteSteps) {
      if (obs._count.actions === 0) {
        await prisma.approvalStep.delete({ where: { id: obs.id } })
      }
    }
  }

  const flow = await prisma.approvalFlow.findUnique({
    where: { id },
    include: { steps: { orderBy: { level: 'asc' } } },
  })

  return NextResponse.json({ flow })
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth()
  if (!['SUPER_ADMIN', 'ADMIN'].includes(session?.user?.role ?? '')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { id } = await params
  const bookingCount = await prisma.booking.count({ where: { approvalFlowId: id } })
  if (bookingCount > 0) {
    return NextResponse.json(
      { error: 'Flow ini masih digunakan oleh booking yang ada' },
      { status: 409 },
    )
  }

  await prisma.approvalFlow.delete({ where: { id } })
  return NextResponse.json({ success: true })
}
