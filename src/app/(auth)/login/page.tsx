import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import Image from 'next/image'
import { auth } from '@/lib/auth'
import { LoginForm } from '@/components/auth/login-form'
import logoImg from '@/assets/logo.png'

export const metadata: Metadata = { title: 'Masuk | MeetThink' }

export default async function LoginPage() {
  const session = await auth()
  if (session) redirect('/dashboard')

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-orange-50/20 to-blue-50/30 p-4">
      <div className="w-full max-w-md">
        {/* Logo & Title */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-white shadow-md border border-orange-100 p-2 mb-4">
            <Image
              src={logoImg}
              alt="MeetThink Logo"
              width={72}
              height={72}
              className="w-full h-full object-contain"
              priority
            />
          </div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight">
            Meet<span className="text-orange-500">Think</span>
          </h1>
          <p className="text-gray-500 text-sm mt-1 font-medium">
            Smart Meeting Management System
          </p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8">
          <LoginForm />
        </div>

        {/* Portfolio Demo Quick Link */}
        <div className="mt-6 text-center">
          <a
            href="/demo"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white/80 hover:bg-white text-xs font-semibold text-slate-700 hover:text-blue-600 border border-slate-200/80 shadow-sm transition-all hover:shadow"
          >
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-orange-500"></span>
            </span>
            <span>Meninjau untuk portofolio? Coba 1-Click Demo di sini</span>
            <span className="text-orange-500">→</span>
          </a>
        </div>
      </div>
    </div>
  )
}
