'use client'

import { signOut } from 'next-auth/react'
import {
  Menu,
  X,
  LogOut,
  KeyRound,
  LayoutDashboard,
  CalendarCheck,
  CheckSquare,
  ClipboardList,
  BarChart3,
  Building2,
  Settings,
  Users,
  ChevronRight,
} from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import logoImg from '@/assets/logo.png'
import { generateInitials, cn } from '@/lib/utils'
import { NotificationBell } from '@/components/notification/notification-bell'
import { ChangePasswordModal } from '@/components/auth/change-password-modal'
import { useState } from 'react'

const navItems = [
  {
    label: 'Dashboard',
    href: '/dashboard',
    icon: LayoutDashboard,
    roles: ['SUPER_ADMIN', 'ADMIN', 'APPROVER', 'USER'],
  },
  {
    label: 'Booking Ruang',
    href: '/bookings',
    icon: CalendarCheck,
    roles: ['SUPER_ADMIN', 'ADMIN', 'APPROVER', 'USER'],
  },
  {
    label: 'Approval',
    href: '/approvals',
    icon: CheckSquare,
    roles: ['SUPER_ADMIN', 'ADMIN', 'APPROVER'],
  },
  {
    label: 'Tindak Lanjut',
    href: '/action-items',
    icon: ClipboardList,
    roles: ['SUPER_ADMIN', 'ADMIN', 'APPROVER', 'USER'],
  },
  {
    label: 'Laporan',
    href: '/reports',
    icon: BarChart3,
    roles: ['SUPER_ADMIN', 'ADMIN'],
  },
]

const adminNavItems = [
  {
    label: 'Manajemen Ruang',
    href: '/admin/rooms',
    icon: Building2,
    roles: ['SUPER_ADMIN', 'ADMIN'],
  },
  {
    label: 'Konfigurasi Approval',
    href: '/admin/approval-config',
    icon: Settings,
    roles: ['SUPER_ADMIN', 'ADMIN'],
  },
  {
    label: 'Manajemen User',
    href: '/admin/users',
    icon: Users,
    roles: ['SUPER_ADMIN'],
  },
]

interface NavbarProps {
  user: {
    name?: string | null
    email?: string | null
    role?: string | null
    division?: string | null
  }
}

export function Navbar({ user }: NavbarProps) {
  const pathname = usePathname()
  const [showUserMenu, setShowUserMenu] = useState(false)
  const [showMobileMenu, setShowMobileMenu] = useState(false)
  const [showPasswordModal, setShowPasswordModal] = useState(false)

  const role = user.role ?? 'USER'

  const isActive = (href: string) => {
    if (href === '/dashboard') return pathname === '/dashboard'
    return pathname.startsWith(href)
  }

  const filteredNav = navItems.filter((item) => item.roles.includes(role))
  const filteredAdminNav = adminNavItems.filter((item) => item.roles.includes(role))

  return (
    <>
      <header className="bg-white border-b border-slate-200 px-4 sm:px-6 py-3 flex items-center justify-between z-20">
        {/* Left: Mobile hamburger & Logo on mobile */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setShowMobileMenu(true)}
            className="lg:hidden p-2 rounded-xl text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors focus-visible:ring-2 focus-visible:ring-blue-500"
            aria-label="Buka menu navigasi"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="lg:hidden flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-orange-50 border border-orange-100 flex items-center justify-center overflow-hidden p-0.5 shadow-2xs">
              <Image src={logoImg} alt="MeetThink Logo" width={32} height={32} className="object-contain" priority />
            </div>
            <span className="font-extrabold text-sm text-slate-900 tracking-tight">
              Meet<span className="text-orange-500">Think</span>
            </span>
          </div>

          <div id="page-title" className="hidden lg:block" />
        </div>

        {/* Right actions: Notification & User Menu */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Notification Bell */}
          <NotificationBell />

          {/* User menu */}
          <div className="relative">
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center gap-2.5 hover:bg-slate-50 border border-transparent hover:border-slate-200 rounded-xl px-2.5 py-1.5 transition-all"
            >
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-xs font-bold shadow-xs">
                {generateInitials(user.name ?? 'U')}
              </div>
              <div className="hidden sm:block text-left">
                <p className="text-xs font-bold text-slate-900 leading-tight">{user.name}</p>
                <p className="text-[10px] text-slate-400 font-medium">{role.replace('_', ' ')}</p>
              </div>
            </button>

            {showUserMenu && (
              <>
                <div
                  className="fixed inset-0 z-30"
                  onClick={() => setShowUserMenu(false)}
                />
                <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-2xl shadow-xl border border-slate-200 z-40 py-1.5 overflow-hidden animate-in fade-in-50 zoom-in-95 duration-100">
                  <div className="px-4 py-3 border-b border-slate-100 bg-slate-50/70">
                    <p className="text-xs font-bold text-slate-900 truncate">{user.name}</p>
                    <p className="text-[11px] text-slate-500 truncate mt-0.5">{user.email}</p>
                    <div className="mt-1.5">
                      <span className="text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">
                        {role.replace('_', ' ')}
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      setShowUserMenu(false)
                      setShowPasswordModal(true)
                    }}
                    className="w-full flex items-center gap-2.5 px-4 py-2.5 text-xs font-medium text-slate-700 hover:bg-orange-50 hover:text-orange-700 transition-colors"
                  >
                    <KeyRound className="w-4 h-4 text-orange-500" />
                    <span>Ganti Kata Sandi</span>
                  </button>

                  <div className="my-1 border-t border-slate-100" />

                  <button
                    onClick={() => signOut({ callbackUrl: '/login' })}
                    className="w-full flex items-center gap-2.5 px-4 py-2.5 text-xs font-medium text-rose-600 hover:bg-rose-50 transition-colors"
                  >
                    <LogOut className="w-4 h-4 text-rose-500" />
                    <span>Keluar Akun</span>
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Mobile Drawer Navigation */}
      {showMobileMenu && (
        <div className="fixed inset-0 z-50 lg:hidden">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity"
            onClick={() => setShowMobileMenu(false)}
          />

          {/* Drawer panel */}
          <div className="fixed inset-y-0 left-0 w-72 bg-white shadow-2xl flex flex-col z-50 animate-in slide-in-from-left duration-200">
            {/* Drawer Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-orange-50 border border-orange-100 flex items-center justify-center p-0.5 shadow-2xs">
                  <Image src={logoImg} alt="MeetThink Logo" width={32} height={32} className="object-contain" priority />
                </div>
                <div>
                  <p className="text-base font-extrabold text-slate-900 tracking-tight leading-none">
                    Meet<span className="text-orange-500">Think</span>
                  </p>
                  <p className="text-[10px] text-slate-400 mt-0.5">Smart Meeting System</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowMobileMenu(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Drawer Links */}
            <div className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
              {filteredNav.map((item) => {
                const active = isActive(item.href)
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setShowMobileMenu(false)}
                    className={cn(
                      'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150',
                      active
                        ? 'bg-blue-50 text-blue-700 font-semibold border border-blue-200/70'
                        : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900',
                    )}
                  >
                    <item.icon
                      className={cn(
                        'w-5 h-5 flex-shrink-0',
                        active ? 'text-blue-600' : 'text-slate-400',
                      )}
                    />
                    <span className="flex-1">{item.label}</span>
                    {active && <ChevronRight className="w-4 h-4 text-blue-500" />}
                  </Link>
                )
              })}

              {filteredAdminNav.length > 0 && (
                <>
                  <div className="pt-4 pb-1">
                    <p className="px-3 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                      Admin Panel
                    </p>
                  </div>
                  {filteredAdminNav.map((item) => {
                    const active = isActive(item.href)
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => setShowMobileMenu(false)}
                        className={cn(
                          'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150',
                          active
                            ? 'bg-blue-50 text-blue-700 font-semibold border border-blue-200/70'
                            : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900',
                        )}
                      >
                        <item.icon
                          className={cn(
                            'w-5 h-5 flex-shrink-0',
                            active ? 'text-blue-600' : 'text-slate-400',
                          )}
                        />
                        <span className="flex-1">{item.label}</span>
                        {active && <ChevronRight className="w-4 h-4 text-blue-500" />}
                      </Link>
                    )
                  })}
                </>
              )}
            </div>

            {/* Drawer User Footer */}
            <div className="p-3 border-t border-slate-100 bg-slate-50">
              <div className="flex items-center gap-3 p-2 rounded-xl bg-white border border-slate-200 shadow-2xs">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-xs font-bold">
                  {generateInitials(user.name ?? 'U')}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold text-slate-900 truncate">{user.name}</p>
                  <p className="text-[10px] text-slate-400 truncate">{user.email}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <ChangePasswordModal
        isOpen={showPasswordModal}
        onClose={() => setShowPasswordModal(false)}
      />
    </>
  )
}
