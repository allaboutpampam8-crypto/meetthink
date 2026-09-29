import { Metadata } from 'next'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { ClipboardList, CheckCircle2, Clock, AlertTriangle } from 'lucide-react'
import { ActionItemList } from '@/components/action-items/action-item-list'

export const metadata: Metadata = { title: 'Tindak Lanjut' }

export default async function ActionItemsPage() {
  const session = await auth()
  const userId = session!.user!.id!

  const actionItems = await prisma.actionItem.findMany({
    where: { picId: userId },
    include: {
      meeting: {
        include: {
          booking: { select: { id: true, title: true } },
        },
      },
    },
    orderBy: [{ status: 'asc' }, { deadline: 'asc' }],
  })

  const counts = {
    open: actionItems.filter((i) => i.status === 'OPEN').length,
    inProgress: actionItems.filter((i) => i.status === 'IN_PROGRESS').length,
    done: actionItems.filter((i) => i.status === 'DONE').length,
    overdue: actionItems.filter((i) => i.status !== 'DONE' && new Date(i.deadline) < new Date()).length,
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Tindak Lanjut Saya</h1>
        <p className="text-gray-500 mt-1">Action items yang ditugaskan kepada Anda</p>
      </div>

      {/* Summary cards */}
      {actionItems.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-white rounded-xl border border-yellow-100 p-4">
            <div className="flex items-center gap-2 mb-1">
              <Clock className="w-4 h-4 text-yellow-500" />
              <span className="text-xs font-medium text-yellow-600">Belum Dikerjakan</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">{counts.open}</p>
          </div>
          <div className="bg-white rounded-xl border border-blue-100 p-4">
            <div className="flex items-center gap-2 mb-1">
              <Clock className="w-4 h-4 text-blue-500" />
              <span className="text-xs font-medium text-blue-600">Sedang Dikerjakan</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">{counts.inProgress}</p>
          </div>
          <div className="bg-white rounded-xl border border-green-100 p-4">
            <div className="flex items-center gap-2 mb-1">
              <CheckCircle2 className="w-4 h-4 text-green-500" />
              <span className="text-xs font-medium text-green-600">Selesai</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">{counts.done}</p>
          </div>
          <div className="bg-white rounded-xl border border-red-100 p-4">
            <div className="flex items-center gap-2 mb-1">
              <AlertTriangle className="w-4 h-4 text-red-500" />
              <span className="text-xs font-medium text-red-600">Terlambat</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">{counts.overdue}</p>
          </div>
        </div>
      )}

      <ActionItemList items={actionItems as any} />
    </div>
  )
}
