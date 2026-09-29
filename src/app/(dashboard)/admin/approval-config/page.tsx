import { Metadata } from 'next'
import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/db'
import Link from 'next/link'
import { Plus, Settings, ChevronRight, Users, Clock, Edit } from 'lucide-react'

export const metadata: Metadata = { title: 'Konfigurasi Approval' }

export default async function ApprovalConfigPage() {
  const session = await auth()
  const role = session?.user?.role ?? 'USER'
  if (!['SUPER_ADMIN', 'ADMIN'].includes(role)) redirect('/dashboard')

  const flows = await prisma.approvalFlow.findMany({
    include: {
      steps: {
        orderBy: { level: 'asc' },
        include: { approver: { select: { name: true, division: true } } },
      },
      _count: { select: { bookings: true } },
    },
    orderBy: { createdAt: 'asc' },
  })

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Konfigurasi Approval</h1>
          <p className="text-gray-500 mt-1">Kelola alur persetujuan booking ruang rapat</p>
        </div>
        <Link
          href="/admin/approval-config/new"
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4 py-2.5 rounded-lg transition-colors text-sm"
        >
          <Plus className="w-4 h-4" />
          Tambah Alur
        </Link>
      </div>

      <div className="space-y-4">
        {flows.map((flow) => (
          <div key={flow.id} className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-semibold text-gray-900">{flow.name}</h3>
                  {flow.division ? (
                    <span className="text-xs px-2.5 py-0.5 bg-purple-50 text-purple-700 border border-purple-200 rounded-full font-medium">
                      Divisi: {flow.division}
                    </span>
                  ) : (
                    <span className="text-xs px-2.5 py-0.5 bg-gray-100 text-gray-600 rounded-full font-medium">
                      Semua Divisi
                    </span>
                  )}
                  {flow.isDefault && (
                    <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full font-medium">Default</span>
                  )}
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${flow.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                    {flow.isActive ? 'Aktif' : 'Nonaktif'}
                  </span>
                </div>
                {flow.description && <p className="text-sm text-gray-500 mt-1">{flow.description}</p>}
                <p className="text-xs text-gray-400 mt-1">{flow._count.bookings} booking menggunakan alur ini</p>
              </div>
              <Link
                href={`/admin/approval-config/${flow.id}/edit` as any}
                className="flex items-center gap-1.5 text-sm text-blue-600 hover:text-blue-700"
              >
                <Edit className="w-4 h-4" />
                Edit
              </Link>
            </div>

            {/* Steps */}
            <div className="space-y-2">
              {flow.steps.map((step, idx) => (
                <div key={step.id} className="flex items-center gap-3">
                  {/* Level badge */}
                  <div className="w-7 h-7 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                    <span className="text-xs font-bold text-blue-700">{step.level}</span>
                  </div>

                  {/* Connector */}
                  <div className="flex-1 flex items-center gap-3 bg-gray-50 rounded-lg px-4 py-2.5">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">{step.label}</p>
                      <div className="flex items-center gap-2 text-xs text-gray-400 mt-0.5">
                        <Users className="w-3 h-3" />
                        <span>{step.approver.name}</span>
                        {step.approver.division && <span>· {step.approver.division}</span>}
                      </div>
                    </div>
                    <div className="flex items-center gap-1 text-xs text-gray-400">
                      <Clock className="w-3 h-3" />
                      <span>Deadline {step.deadlineHours}j</span>
                    </div>
                  </div>

                  {idx < flow.steps.length - 1 && (
                    <ChevronRight className="w-4 h-4 text-gray-300 flex-shrink-0" />
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
