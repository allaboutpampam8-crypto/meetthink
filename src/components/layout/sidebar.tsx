'use client'

import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import logoImg from '@/assets/logo.png'
import {
  LayoutDashboard,
  CalendarCheck,
  Building2,
  CheckSquare,
  Bell,
  Settings,
  Users,
  ClipboardList,
  BarChart3,
  ChevronRight,
} from 'lucide-react'
import { cn, generateInitials } from '@/lib/utils'

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

interface SidebarProps {
  user: {
    name?: string | null
    email?: string | null
    role?: string | null
    division?: string | null
  }
}

export function Sidebar({ user }: SidebarProps) {
  const pathname = usePathname()
  const role = user.role ?? 'USER'

  const isActive = (href: string) => {
    if (href === '/dashboard') return pathname === '/dashboard'
    return pathname.startsWith(href)
  }

  const filteredNav = navItems.filter((item) => item.roles.includes(role))
  const filteredAdminNav = adminNavItems.filter((item) => item.roles.includes(role))

  return (
    <aside className="hidden lg:flex flex-col w-64 bg-white border-r border-gray-200 h-full">
      {/* Logo */}
      <div className="flex items-center gap-3 px-6 py-5 border-b border-gray-100">
        <div className="w-9 h-9 rounded-xl bg-orange-50 border border-orange-100/80 flex items-center justify-center flex-shrink-0 overflow-hidden shadow-2xs">
          <Image
            src={logoImg}
            alt="MeetThink Logo"
            width={36}
            height={36}
            className="w-full h-full object-contain p-0.5"
            priority
          />
        </div>
        <div className="min-w-0">
          <p className="text-base font-extrabold text-gray-900 tracking-tight leading-none">
            Meet<span className="text-orange-500">Think</span>
          </p>
          <p className="text-[11px] text-gray-400 mt-0.5 truncate">Smart Meeting System</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {filteredNav.map((item) => {
          const active = isActive(item.href)
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 group',
                active
                  ? 'bg-blue-50 text-blue-700 font-semibold border border-blue-200/70 shadow-2xs'
                  : 'text-slate-600 hover:bg-slate-100/80 hover:text-slate-900',
              )}
            >
              <item.icon
                className={cn(
                  'w-5 h-5 flex-shrink-0 transition-colors',
                  active ? 'text-blue-600' : 'text-slate-400 group-hover:text-slate-700',
                )}
              />
              <span className="flex-1 truncate">{item.label}</span>
              {active && (
                <ChevronRight className="w-4 h-4 text-blue-500 flex-shrink-0" />
              )}
            </Link>
          )
        })}

        {/* Admin section */}
        {filteredAdminNav.length > 0 && (
          <>
            <div className="pt-5 pb-1.5">
              <p className="px-3 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                Panel Administrasi
              </p>
            </div>
            {filteredAdminNav.map((item) => {
              const active = isActive(item.href)
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 group',
                    active
                      ? 'bg-blue-50 text-blue-700 font-semibold border border-blue-200/70 shadow-2xs'
                      : 'text-slate-600 hover:bg-slate-100/80 hover:text-slate-900',
                  )}
                >
                  <item.icon
                    className={cn(
                      'w-5 h-5 flex-shrink-0 transition-colors',
                      active ? 'text-blue-600' : 'text-slate-400 group-hover:text-slate-700',
                    )}
                  />
                  <span className="flex-1 truncate">{item.label}</span>
                  {active && (
                    <ChevronRight className="w-4 h-4 text-blue-500 flex-shrink-0" />
                  )}
                </Link>
              )
            })}
          </>
        )}
      </nav>

      {/* User info */}
      <div className="p-3 border-t border-slate-100 bg-slate-50/50">
        <div className="flex items-center gap-3 p-2 rounded-xl bg-white border border-slate-200/80 shadow-2xs">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center flex-shrink-0 text-white font-bold text-xs shadow-xs">
            {generateInitials(user.name ?? 'U')}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between gap-1">
              <p className="text-xs font-bold text-slate-900 truncate">{user.name}</p>
              <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-orange-50 text-orange-700 border border-orange-200/60 flex-shrink-0">
                {role.replace('_', ' ')}
              </span>
            </div>
            <p className="text-[11px] text-slate-500 truncate mt-0.5">
              {user.division ?? user.email}
            </p>
          </div>
        </div>
      </div>
    </aside>
  )
}
