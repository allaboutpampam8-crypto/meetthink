import { Metadata } from 'next'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { ClipboardList, CheckCircle2, Clock, AlertTriangle, Sparkles, CheckSquare2 } from 'lucide-react'
import { ActionItemList } from '@/components/action-items/action-item-list'

export const metadata: Metadata = {
  title: 'Tindak Lanjut & Action Items | MeetThink',
  description: 'Daftar tugas, tenggat waktu, dan komitmen hasil rapat yang ditugaskan kepada Anda.',
}

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
    <div className="max-w-5xl mx-auto space-y-8">
      {/* Header */}
      <div className="pb-3 border-b border-slate-200/60">
        <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-purple-50 text-purple-700 border border-purple-200/60 mb-1.5">
          <ClipboardList className="w-3.5 h-3.5 text-purple-500" />
          <span>Akuntabilitas & Eksekusi Rapat</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          Tindak Lanjut & Action Items
        </h1>
        <p className="text-slate-500 mt-1 text-xs sm:text-sm">
          Pantau komitmen tugas, perbarui status pengerjaan, dan pastikan setiap keputusan rapat tereksekusi tepat waktu
        </p>
      </div>

      {/* Summary Stat Cards */}
      {actionItems.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-white rounded-2xl border border-slate-200/90 p-4 sm:p-5 shadow-2xs hover:shadow-xs transition-shadow">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-amber-700">Belum Mulai</span>
              <div className="w-7 h-7 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
                <Clock className="w-4 h-4" />
              </div>
            </div>
            <p className="text-3xl font-extrabold text-slate-900">{counts.open}</p>
            <p className="text-[11px] text-slate-400 mt-0.5">Menunggu penanganan</p>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200/90 p-4 sm:p-5 shadow-2xs hover:shadow-xs transition-shadow">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-blue-700">Dikerjakan</span>
              <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                <Clock className="w-4 h-4" />
              </div>
            </div>
            <p className="text-3xl font-extrabold text-slate-900">{counts.inProgress}</p>
            <p className="text-[11px] text-slate-400 mt-0.5">Sedang berjalan</p>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200/90 p-4 sm:p-5 shadow-2xs hover:shadow-xs transition-shadow">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-700">Selesai</span>
              <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <CheckCircle2 className="w-4 h-4" />
              </div>
            </div>
            <p className="text-3xl font-extrabold text-slate-900">{counts.done}</p>
            <p className="text-[11px] text-slate-400 mt-0.5">Tuntas dieksekusi</p>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200/90 p-4 sm:p-5 shadow-2xs hover:shadow-xs transition-shadow">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-rose-700">Terlambat</span>
              <div className="w-7 h-7 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center">
                <AlertTriangle className="w-4 h-4" />
              </div>
            </div>
            <p className="text-3xl font-extrabold text-rose-600">{counts.overdue}</p>
            <p className="text-[11px] text-slate-400 mt-0.5">Melewati batas waktu</p>
          </div>
        </div>
      )}

      <ActionItemList items={actionItems as any} />
    </div>
  )
}
