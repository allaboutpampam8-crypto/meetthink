'use client'

import { signOut } from 'next-auth/react'
import { Bell, LogOut, User, KeyRound } from 'lucide-react'
import { generateInitials } from '@/lib/utils'
import { NotificationBell } from '@/components/notification/notification-bell'
import { ChangePasswordModal } from '@/components/auth/change-password-modal'
import { useState } from 'react'

interface NavbarProps {
  user: {
    name?: string | null
    email?: string | null
    role?: string | null
  }
  isDemoMode?: boolean
}

export function Navbar({ user, isDemoMode }: NavbarProps) {
  const [showUserMenu, setShowUserMenu] = useState(false)
  const [showPasswordModal, setShowPasswordModal] = useState(false)

  return (
    <>
      <header className="bg-white border-b border-gray-200 px-6 py-3.5 flex items-center justify-between">
        {/* Page title placeholder & demo badge */}
        <div className="flex items-center gap-3">
          <div id="page-title" />
          {isDemoMode && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800 border border-amber-300 shadow-xs">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
              DEMO SANDBOX
            </span>
          )}
        </div>

        {/* Right actions */}
        <div className="flex items-center gap-3">
          {/* Notification Bell */}
          <NotificationBell />

          {/* User menu */}
          <div className="relative">
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center gap-2.5 hover:bg-gray-50 rounded-lg px-2 py-1.5 transition-colors"
            >
              <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                <span className="text-xs font-bold text-blue-700">
                  {generateInitials(user.name ?? 'U')}
                </span>
              </div>
              <div className="hidden sm:block text-left">
                <p className="text-sm font-medium text-gray-900">{user.name}</p>
                <p className="text-xs text-gray-400">{user.role}</p>
              </div>
            </button>

            {showUserMenu && (
              <>
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setShowUserMenu(false)}
                />
                <div className="absolute right-0 top-full mt-1 w-52 bg-white rounded-xl shadow-lg border border-gray-100 z-20 py-1 overflow-hidden">
                  <div className="px-4 py-2.5 border-b border-gray-100 bg-gray-50/50">
                    <p className="text-sm font-semibold text-gray-900 truncate">{user.name}</p>
                    <p className="text-xs text-gray-400 truncate">{user.email}</p>
                  </div>

                  <button
                    onClick={() => {
                      setShowUserMenu(false)
                      setShowPasswordModal(true)
                    }}
                    className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 hover:bg-orange-50 hover:text-orange-700 transition-colors border-b border-gray-100"
                  >
                    <KeyRound className="w-4 h-4 text-orange-500" />
                    <span>Ganti Password</span>
                  </button>

                  {isDemoMode && (
                    <a
                      href="/demo"
                      className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-amber-700 bg-amber-50/70 hover:bg-amber-100/70 transition-colors border-b border-gray-100 font-medium"
                    >
                      <span>🧪 Pusat Demo Portofolio</span>
                    </a>
                  )}

                  <button
                    onClick={() => signOut({ callbackUrl: '/login' })}
                    className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Keluar</span>
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </header>

      <ChangePasswordModal
        isOpen={showPasswordModal}
        onClose={() => setShowPasswordModal(false)}
      />
    </>
  )
}
