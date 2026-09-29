import { Metadata } from 'next'
import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/db'
import { UserRow } from '@/components/admin/user-row'
import { UserManagementHeader } from '@/components/admin/user-management-header'
import { Users } from 'lucide-react'

export const metadata: Metadata = { title: 'Manajemen User' }

export default async function AdminUsersPage() {
  const session = await auth()
  const role = session?.user?.role ?? 'USER'
  const currentUserId = session?.user?.id
  if (!['SUPER_ADMIN', 'ADMIN'].includes(role)) redirect('/dashboard')

  const users = await prisma.user.findMany({
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      division: true,
      position: true,
      isActive: true,
    },
    orderBy: [{ role: 'asc' }, { name: 'asc' }],
  })

  const roleCounts = {
    SUPER_ADMIN: users.filter((u) => u.role === 'SUPER_ADMIN').length,
    ADMIN: users.filter((u) => u.role === 'ADMIN').length,
    APPROVER: users.filter((u) => u.role === 'APPROVER').length,
    USER: users.filter((u) => u.role === 'USER').length,
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header with Add User Modal */}
      <UserManagementHeader currentUserRole={role} totalUsers={users.length} />

      {/* Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Super Admin', count: roleCounts.SUPER_ADMIN, color: 'bg-purple-50 text-purple-700 border-purple-100' },
          { label: 'Admin', count: roleCounts.ADMIN, color: 'bg-blue-50 text-blue-700 border-blue-100' },
          { label: 'Approver', count: roleCounts.APPROVER, color: 'bg-orange-50 text-orange-700 border-orange-100' },
          { label: 'User', count: roleCounts.USER, color: 'bg-gray-50 text-gray-700 border-gray-200' },
        ].map((s) => (
          <div key={s.label} className={`rounded-xl border p-4 ${s.color}`}>
            <p className="text-2xl font-bold">{s.count}</p>
            <p className="text-sm font-medium mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-xs">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-orange-500" />
            <span className="font-bold text-gray-900 text-sm">Daftar Akun Pengguna</span>
          </div>
          <span className="text-xs text-gray-500">
            Total {users.filter((u) => u.isActive).length} aktif · {users.filter((u) => !u.isActive).length} nonaktif
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Pengguna</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Role</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Divisi & Jabatan</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Status</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <UserRow
                  key={user.id}
                  user={user}
                  currentUserId={currentUserId}
                  currentUserRole={role}
                />
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
