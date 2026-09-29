'use client'

import { useState } from 'react'
import { UserPlus } from 'lucide-react'
import { CreateUserModal } from './create-user-modal'

interface UserManagementHeaderProps {
  currentUserRole: string
  totalUsers: number
}

export function UserManagementHeader({
  currentUserRole,
  totalUsers,
}: UserManagementHeaderProps) {
  const [showCreateModal, setShowCreateModal] = useState(false)

  return (
    <>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Manajemen User</h1>
          <p className="text-gray-500 mt-1">{totalUsers} pengguna terdaftar di sistem MeetThink</p>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white text-xs font-bold rounded-xl shadow-xs hover:shadow transition-all flex-shrink-0"
        >
          <UserPlus className="w-4 h-4" />
          <span>Tambah Pengguna Baru</span>
        </button>
      </div>

      <CreateUserModal
        currentUserRole={currentUserRole}
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
      />
    </>
  )
}
