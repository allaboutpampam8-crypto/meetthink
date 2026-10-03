import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import Image from 'next/image'
import { auth } from '@/lib/auth'
import { LoginForm } from '@/components/auth/login-form'
import logoImg from '@/assets/logo.png'
import {
  CalendarDays,
  ShieldCheck,
  QrCode,
  CheckCircle2,
  Sparkles,
  Layers,
  ArrowUpRight,
} from 'lucide-react'

export const metadata: Metadata = {
  title: 'Masuk ke Sistem | MeetThink',
  description: 'Login ke MeetThink - Sistem Manajemen Rapat & Kolaborasi Terpadu',
}

const HIGHLIGHTS = [
  {
    icon: CalendarDays,
    title: 'Smart Room Scheduling',
    desc: 'Deteksi otomatis konflik jadwal ruangan & ketersediaan peserta secara real-time.',
    color: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  },
  {
    icon: ShieldCheck,
    title: 'Multi-tier Approval Workflow',
    desc: 'Otorisasi berjenjang untuk peminjaman ruang, fasilitas teknis, dan konsumsi.',
    color: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
  },
  {
    icon: QrCode,
    title: 'QR Presensi & Notulensi Digital',
    desc: 'Presensi kilat via QR token, tracking action items terpusat, dan rekapitulasi data.',
    color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  },
]

export default async function LoginPage() {
  const session = await auth()
  if (session) redirect('/dashboard')

  return (
    <div className="min-h-screen w-full bg-slate-950 flex flex-col lg:grid lg:grid-cols-12 overflow-hidden selection:bg-blue-500 selection:text-white">
      {/* Left Column: Brand & Value Showcase (Large screens) */}
      <div className="relative hidden lg:flex lg:col-span-7 flex-col justify-between p-12 xl:p-16 bg-gradient-to-br from-slate-950 via-slate-900 to-blue-950 text-white border-r border-slate-800/80 overflow-hidden">
        {/* Subtle Ambient Glows & Grid Pattern */}
        <div className="absolute -top-32 -left-32 w-96 h-96 bg-blue-600/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-[30rem] h-[30rem] bg-orange-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b0f_1px,transparent_1px),linear-gradient(to_bottom,#1e293b0f_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />

        {/* Top Branding */}
        <div className="relative z-10 flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 p-2 shadow-inner flex items-center justify-center">
            <Image
              src={logoImg}
              alt="MeetThink"
              width={40}
              height={40}
              className="w-full h-full object-contain"
              priority
            />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xl font-black tracking-tight text-white">
                Meet<span className="text-orange-500">Think</span>
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-blue-500/20 text-blue-300 border border-blue-500/30">
                Enterprise
              </span>
            </div>
            <p className="text-xs text-slate-400 font-medium">Smart Meeting Management System</p>
          </div>
        </div>

        {/* Center Presentation */}
        <div className="relative z-10 my-auto py-12 max-w-xl space-y-8">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-white/5 border border-white/10 text-slate-300 backdrop-blur-xs">
              <Sparkles className="w-3.5 h-3.5 text-orange-400" />
              <span>Solusi Manajemen Kolaborasi & Ruang Rapat Modern</span>
            </div>
            <h1 className="text-3xl xl:text-4xl font-extrabold text-white tracking-tight leading-tight">
              Koordinasi Rapat Lebih Tertata, Cepat, dan Bebas Jadwal Ganda.
            </h1>
            <p className="text-sm xl:text-base text-slate-300/90 leading-relaxed">
              Otomasi siklus permohonan rapat mulai dari ketersediaan ruangan, verifikasi bertingkat, logistik konsumsi, presensi digital, hingga tindak lanjut notulensi tim.
            </p>
          </div>

          {/* Key Feature Pillars */}
          <div className="space-y-3.5 pt-2">
            {HIGHLIGHTS.map((item, idx) => {
              const Icon = item.icon
              return (
                <div
                  key={idx}
                  className="flex items-start gap-3.5 p-3.5 rounded-xl bg-white/[0.03] border border-white/[0.08] backdrop-blur-xs hover:bg-white/[0.06] transition-colors"
                >
                  <div className={`w-9 h-9 rounded-lg border flex items-center justify-center flex-shrink-0 mt-0.5 ${item.color}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div>
                    <h2 className="text-sm font-bold text-white flex items-center gap-1.5">
                      <span>{item.title}</span>
                    </h2>
                    <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">{item.desc}</p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Bottom Trust & Reliability Note */}
        <div className="relative z-10 pt-6 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="text-slate-300 font-medium">Sistem Berjalan Aktif</span>
          </div>
          <div className="flex items-center gap-4 text-[11px] text-slate-400">
            <span>Role-Based Access Control</span>
            <span>•</span>
            <span>Next-Auth Session Security</span>
          </div>
        </div>
      </div>

      {/* Right Column: Login Card & Credentials Helper */}
      <div className="lg:col-span-5 min-h-screen bg-slate-50 flex flex-col justify-center items-center p-6 sm:p-10 lg:p-12">
        <div className="w-full max-w-md space-y-6">
          {/* Mobile Top Brand (visible only on small screens) */}
          <div className="lg:hidden text-center space-y-2 mb-6">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-white shadow-md border border-orange-100 p-2">
              <Image
                src={logoImg}
                alt="MeetThink"
                width={56}
                height={56}
                className="w-full h-full object-contain"
                priority
              />
            </div>
            <div>
              <h1 className="text-2xl font-black text-slate-900 tracking-tight">
                Meet<span className="text-orange-500">Think</span>
              </h1>
              <p className="text-xs text-slate-500 font-medium">Smart Meeting Management System</p>
            </div>
          </div>

          {/* Form Header */}
          <div className="space-y-1.5 text-center lg:text-left">
            <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">
              Selamat Datang Kembali
            </h2>
            <p className="text-xs sm:text-sm text-slate-500">
              Silakan masukkan kredensial akun Anda untuk mengakses sistem rapat.
            </p>
          </div>

          {/* White Card Wrapper */}
          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xl shadow-slate-200/50 p-6 sm:p-7">
            <LoginForm />
          </div>

          {/* Footer Information */}
          <div className="text-center space-y-1.5 text-xs text-slate-400 pt-2">
            <p>
              Mengalami kendala akun? Hubungi{' '}
              <span className="text-slate-600 font-medium">Administrator IT</span>
            </p>
            <p className="text-[11px] text-slate-400">
              &copy; {new Date().getFullYear()} MeetThink. Hak Cipta Dilindungi.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
