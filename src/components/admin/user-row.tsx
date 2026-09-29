'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Loader2, Check, X } from 'lucide-react'
import { roleLabel } from '@/lib/utils'

interface User {
  id: string
  name: string
  email: string
  role: string
  division: string | null
  position: string | null
  isActive: boolean
}

const ROLES = ['SUPER_ADMIN', 'ADMIN', 'APPROVER', 'USER']

interface UserRowProps {
  user: User
  currentUserId?: string
  currentUserRole?: string
}

export function UserRow({ user: initialUser, currentUserId, currentUserRole }: UserRowProps) {
  const router = useRouter()
  const [user, setUser] = useState(initialUser)
  const [loading, setLoading] = useState(false)
  const [togglingStatus, setTogglingStatus] = useState(false)
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState({
    role: user.role,
    division: user.division ?? '',
    position: user.position ?? '',
    isActive: user.isActive,
  })

  const isSelf = user.id === currentUserId

  const save = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/users/${user.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(draft),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? 'Gagal menyimpan')
      setUser({ ...user, ...json.user })
      setEditing(false)
      toast.success('Data pengguna berhasil diperbarui')
      router.refresh()
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setLoading(false)
    }
  }

  const toggleActiveStatus = async () => {
    if (isSelf) {
      toast.error('Anda tidak dapat menonaktifkan akun Anda sendiri')
      return
    }

    const nextStatus = !user.isActive
    const confirmMessage = nextStatus
      ? `Aktifkan kembali akun "${user.name}"? Pengguna akan dapat login kembali.`
      : `Nonaktifkan akun "${user.name}"? Pengguna tidak akan dapat login ke sistem, namun riwayat rapat dan datanya tetap aman.`

    if (!window.confirm(confirmMessage)) return

    setTogglingStatus(true)
    try {
      const res = await fetch(`/api/users/${user.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: nextStatus }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? 'Gagal mengubah status')
      setUser({ ...user, isActive: nextStatus })
      toast.success(nextStatus ? 'Akun berhasil diaktifkan' : 'Akun berhasil dinonaktifkan')
      router.refresh()
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setTogglingStatus(false)
    }
  }

  const cancel = () => {
    setDraft({
      role: user.role,
      division: user.division ?? '',
      position: user.position ?? '',
      isActive: user.isActive,
    })
    setEditing(false)
  }

  return (
    <tr className="border-b border-gray-100 hover:bg-gray-50/70 transition-colors">
      {/* User info */}
      <td className="px-4 py-3">
        <div className="flex items-center gap-3">
          <div
            className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 font-bold text-xs ${
              user.isActive
                ? 'bg-blue-100 text-blue-700'
                : 'bg-gray-200 text-gray-400'
            }`}
          >
            {user.name[0]?.toUpperCase()}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <p
                className={`text-sm font-semibold truncate ${
                  user.isActive ? 'text-gray-900' : 'text-gray-400 line-through'
                }`}
              >
                {user.name}
              </p>
              {isSelf && (
                <span className="text-[10px] bg-slate-100 text-slate-600 font-semibold px-1.5 py-0.2 rounded">
                  Anda
                </span>
              )}
            </div>
            <p className="text-xs text-gray-400 truncate">{user.email}</p>
          </div>
        </div>
      </td>

      {/* Role */}
      <td className="px-4 py-3">
        {editing ? (
          <select
            value={draft.role}
            onChange={(e) => setDraft({ ...draft, role: e.target.value })}
            className="px-2.5 py-1.5 rounded-lg border border-gray-300 text-xs font-medium text-gray-900 bg-white outline-none w-36"
          >
            {ROLES.map((r) => (
              <option
                key={r}
                value={r}
                disabled={r === 'SUPER_ADMIN' && currentUserRole !== 'SUPER_ADMIN'}
              >
                {roleLabel(r)}
              </option>
            ))}
          </select>
        ) : (
          <span
            className={`text-xs px-2.5 py-1 rounded-full font-medium ${
              user.role === 'SUPER_ADMIN'
                ? 'bg-purple-100 text-purple-700'
                : user.role === 'ADMIN'
                ? 'bg-blue-100 text-blue-700'
                : user.role === 'APPROVER'
                ? 'bg-orange-100 text-orange-700'
                : 'bg-gray-100 text-gray-600'
            }`}
          >
            {roleLabel(user.role)}
          </span>
        )}
      </td>

      {/* Division & Position */}
      <td className="px-4 py-3">
        {editing ? (
          <div className="space-y-1">
            <input
              value={draft.division}
              onChange={(e) => setDraft({ ...draft, division: e.target.value })}
              placeholder="Divisi"
              className="px-2.5 py-1 rounded-lg border border-gray-300 text-xs text-gray-900 bg-white outline-none w-36"
            />
            <input
              value={draft.position}
              onChange={(e) => setDraft({ ...draft, position: e.target.value })}
              placeholder="Jabatan"
              className="px-2.5 py-1 rounded-lg border border-gray-300 text-xs text-gray-900 bg-white outline-none w-36"
            />
          </div>
        ) : (
          <div>
            <p className="text-sm font-medium text-gray-700">{user.division ?? '—'}</p>
            {user.position && (
              <p className="text-xs text-gray-400">{user.position}</p>
            )}
          </div>
        )}
      </td>

      {/* Status */}
      <td className="px-4 py-3">
        {editing ? (
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={draft.isActive}
              onChange={(e) => setDraft({ ...draft, isActive: e.target.checked })}
              className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-xs font-semibold text-gray-700">Aktif</span>
          </label>
        ) : (
          <span
            className={`inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full font-semibold ${
              user.isActive
                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/80'
                : 'bg-red-50 text-red-600 border border-red-200/80'
            }`}
          >
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                user.isActive ? 'bg-emerald-500' : 'bg-red-500'
              }`}
            />
            {user.isActive ? 'Aktif' : 'Nonaktif'}
          </span>
        )}
      </td>

      {/* Actions */}
      <td className="px-4 py-3">
        {editing ? (
          <div className="flex items-center gap-1.5">
            <button
              onClick={save}
              disabled={loading}
              className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg transition-colors disabled:opacity-60"
            >
              {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
              <span>Simpan</span>
            </button>
            <button
              onClick={cancel}
              className="flex items-center gap-1 px-2.5 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-medium rounded-lg transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setEditing(true)}
              className="text-xs text-blue-600 hover:text-blue-700 font-medium px-2.5 py-1.5 rounded-lg hover:bg-blue-50 transition-colors"
            >
              Edit
            </button>

            {!isSelf && (
              <button
                onClick={toggleActiveStatus}
                disabled={togglingStatus}
                title={user.isActive ? 'Nonaktifkan akun pengguna' : 'Aktifkan kembali akun'}
                className={`text-xs font-medium px-2.5 py-1.5 rounded-lg transition-colors ${
                  user.isActive
                    ? 'text-red-600 hover:text-red-700 hover:bg-red-50'
                    : 'text-emerald-700 hover:text-emerald-800 hover:bg-emerald-50'
                }`}
              >
                {togglingStatus ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-gray-400" />
                ) : user.isActive ? (
                  'Nonaktifkan'
                ) : (
                  'Aktifkan'
                )}
              </button>
            )}
          </div>
        )}
      </td>
    </tr>
  )
}
