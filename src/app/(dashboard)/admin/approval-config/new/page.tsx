import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/db'
import { ApprovalFlowForm } from '@/components/admin/approval-flow-form'

export const metadata = { title: 'Tambah Alur Approval' }

export default async function NewApprovalConfigPage() {
  const session = await auth()
  if (!['SUPER_ADMIN', 'ADMIN'].includes(session?.user?.role ?? '')) redirect('/dashboard')

  const [approvers, usersWithDivisions] = await Promise.all([
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

  const divisions = usersWithDivisions.map((u) => u.division!).filter(Boolean)

  return <ApprovalFlowForm mode="create" approvers={approvers} divisions={divisions} />
}
