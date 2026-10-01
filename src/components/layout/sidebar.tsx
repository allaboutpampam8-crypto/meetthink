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
  isDemoMode?: boolean
}

export function Sidebar({ user, isDemoMode }: SidebarProps) {
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
      <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto">
        {filteredNav.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors group',
              isActive(item.href)
                ? 'bg-blue-50 text-blue-700'
                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900',
            )}
          >
            <item.icon className={cn('w-5 h-5 flex-shrink-0', isActive(item.href) ? 'text-blue-600' : 'text-gray-400 group-hover:text-gray-600')} />
            {item.label}
            {isActive(item.href) && (
              <ChevronRight className="w-4 h-4 ml-auto text-blue-400" />
            )}
          </Link>
        ))}

        {/* Admin section */}
        {filteredAdminNav.length > 0 && (
          <>
            <div className="pt-4 pb-1">
              <p className="px-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Admin</p>
            </div>
            {filteredAdminNav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors group',
                  isActive(item.href)
                    ? 'bg-blue-50 text-blue-700'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900',
                )}
              >
                <item.icon className={cn('w-5 h-5 flex-shrink-0', isActive(item.href) ? 'text-blue-600' : 'text-gray-400 group-hover:text-gray-600')} />
                {item.label}
              </Link>
            ))}
          </>
        )}
      </nav>

      {/* Demo Sandbox Indicator Card */}
      {isDemoMode && (
        <div className="mx-4 mb-2 p-3 rounded-xl bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200/90 text-amber-950 shadow-xs">
          <div className="flex items-center justify-between gap-1 mb-1">
            <span className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-900">
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
              Demo Sandbox
            </span>
            <span className="text-[10px] uppercase font-bold text-amber-700 bg-amber-200/60 px-1.5 py-0.5 rounded">
              Portofolio
            </span>
          </div>
          <p className="text-[11px] text-amber-800 leading-snug">
            Data bersifat simulasi untuk peninjauan fitur.
          </p>
          <Link
            href="/demo"
            className="mt-2 inline-flex items-center gap-1 text-[11px] font-bold text-orange-600 hover:text-orange-700 hover:underline"
          >
            Pusat Demo & Ganti Akun →
          </Link>
        </div>
      )}

      {/* User info */}
      <div className="px-4 py-4 border-t border-gray-100">
        <div className="flex items-center gap-3 px-3 py-2">
          <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
            <span className="text-xs font-bold text-blue-700">
              {generateInitials(user.name ?? 'U')}
            </span>
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-gray-900 truncate">{user.name}</p>
            <p className="text-xs text-gray-400 truncate">{user.division ?? user.email}</p>
          </div>
        </div>
      </div>
    </aside>
  )
}
