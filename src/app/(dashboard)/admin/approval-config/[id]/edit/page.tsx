import { auth } from '@/lib/auth'
import { redirect, notFound } from 'next/navigation'
import { prisma } from '@/lib/db'
import { ApprovalFlowForm } from '@/components/admin/approval-flow-form'

export const metadata = { title: 'Edit Alur Approval' }

export default async function EditApprovalConfigPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const session = await auth()
  if (!['SUPER_ADMIN', 'ADMIN'].includes(session?.user?.role ?? '')) redirect('/dashboard')

  const { id } = await params
  const [flow, approvers, usersWithDivisions] = await Promise.all([
    prisma.approvalFlow.findUnique({
      where: { id },
      include: { steps: { orderBy: { level: 'asc' } } },
    }),
    prisma.user.findMany({
      where: { isActive: true, role: { in: ['APPROVER', 'ADMIN', 'SUPER_ADMIN'] } },
      select: { id: true, name: true, division: true },
      orderBy: { name: 'asc' },
    }),
    prisma.user.findMany({
      where: { division: { not: null } },
      select: { division: true },
      distinct: ['division'],
    }),
  ])

  if (!flow) notFound()

  const divisions = usersWithDivisions.map((u) => u.division!).filter(Boolean)

  return (
    <ApprovalFlowForm
      mode="edit"
      approvers={approvers}
      divisions={divisions}
      defaultValues={{
        id: flow.id,
        name: flow.name,
        description: flow.description ?? '',
        division: flow.division ?? '',
        isDefault: flow.isDefault,
        isActive: flow.isActive,
        steps: flow.steps.map((s) => ({
          level: s.level,
          label: s.label,
          approverId: s.approverId,
          deadlineHours: s.deadlineHours,
        })),
      }}
    />
  )
}
