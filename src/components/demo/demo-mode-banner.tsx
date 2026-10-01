'use client'

import { useState } from 'react'
import Link from 'next/link'
import { signOut } from 'next-auth/react'
import { Sparkles, ArrowRight, LogOut, X } from 'lucide-react'

interface DemoModeBannerProps {
  userRole?: string | null
  userName?: string | null
}

export function DemoModeBanner({ userRole, userName }: DemoModeBannerProps) {
  const [isDismissed, setIsDismissed] = useState(false)

  const handleExitDemo = () => {
    // Clear demo cookie
    document.cookie = 'meetthink_demo_mode=; path=/; max-age=0'
    signOut({ callbackUrl: '/login' })
  }

  if (isDismissed) {
    return (
      <div className="bg-amber-600 text-white px-4 py-1 text-[11px] font-bold flex items-center justify-between shadow-sm">
        <span className="flex items-center gap-1.5">
          <Sparkles className="w-3 h-3 text-amber-200" />
          <span>PORTFOLIO DEMO MODE • Akun: {userRole ?? 'Simulasi'}</span>
        </span>
        <div className="flex items-center gap-3">
          <Link href="/demo" className="underline text-amber-100 hover:text-white text-[11px]">
            Pusat Demo
          </Link>
          <button
            onClick={() => setIsDismissed(false)}
            className="text-amber-200 hover:text-white text-[11px] underline"
          >
            Buka Banner
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-gradient-to-r from-amber-600 via-orange-600 to-amber-700 text-white px-4 py-2 text-xs shadow-md border-b border-orange-500/50 flex flex-wrap items-center justify-between gap-2 z-50">
      <div className="flex items-center gap-2 flex-wrap">
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-white/20 text-white font-extrabold text-[10px] uppercase tracking-wider border border-white/30 backdrop-blur-sm">
          <Sparkles className="w-3 h-3 text-amber-200" />
          Demo / Sandbox Mode
        </span>
        <span className="text-white/95 font-medium hidden sm:inline">
          Anda sedang menguji coba aplikasi sebagai <strong className="font-bold underline decoration-amber-300">{userName}</strong> ({userRole}). Data bersifat simulasi untuk peninjauan portofolio.
        </span>
        <span className="text-white/95 font-medium sm:hidden">
          Demo: <strong>{userRole}</strong>
        </span>
      </div>

      <div className="flex items-center gap-2">
        <Link
          href="/demo"
          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white text-orange-900 hover:bg-orange-50 font-bold text-[11px] transition-colors shadow-sm"
        >
          <span>Ganti Role Demo</span>
          <ArrowRight className="w-3 h-3" />
        </Link>
        <button
          onClick={handleExitDemo}
          className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-black/20 hover:bg-black/30 text-white font-medium text-[11px] transition-colors"
          title="Keluar dari akun demo"
        >
          <LogOut className="w-3 h-3" />
          <span className="hidden md:inline">Keluar Demo</span>
        </button>
        <button
          onClick={() => setIsDismissed(true)}
          className="p-1 text-white/80 hover:text-white rounded transition-colors"
          title="Kecilkan banner"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  )
}
