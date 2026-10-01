import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { auth } from '@/lib/auth'
import { DemoLoginCards } from '@/components/demo/demo-login-cards'
import logoImg from '@/assets/logo.png'
import {
  CalendarCheck2,
  GitBranch,
  QrCode,
  ClipboardList,
  BarChart3,
  Mail,
  ShieldCheck,
  Server,
  Database,
  Lock,
  ArrowRight,
  ExternalLink,
  Github,
  Sparkles,
  Layers,
  Cpu,
} from 'lucide-react'

export const metadata: Metadata = {
  title: 'Demo & Portfolio Showcase | MeetThink',
  description:
    'Halaman demo interaktif aplikasi MeetThink - Smart Meeting Management System. Coba langsung dengan 1-Click Login untuk Super Admin, Approver, dan User.',
}

export default async function DemoPage() {
  const session = await auth()

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-950 to-slate-900 text-slate-100 selection:bg-orange-500 selection:text-white">
      {/* ─── Top Navigation Bar ─────────────────────────────────────────── */}
      <header className="sticky top-0 z-50 backdrop-blur-md bg-slate-900/80 border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white p-1 flex items-center justify-center shadow-md">
              <Image
                src={logoImg}
                alt="MeetThink Logo"
                width={36}
                height={36}
                className="w-full h-full object-contain"
                priority
              />
            </div>
            <div>
              <span className="text-xl font-black text-white tracking-tight">
                Meet<span className="text-orange-500">Think</span>
              </span>
              <span className="hidden sm:inline-block ml-2 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-orange-500/10 text-orange-400 border border-orange-500/20">
                Portfolio Demo
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <a
              href="https://github.com/allaboutpampam8-crypto/meetthink"
              target="_blank"
              rel="noopener noreferrer"
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-800 transition-colors border border-slate-700/80"
            >
              <Github className="w-4 h-4" />
              <span>GitHub</span>
            </a>
            <Link
              href="/login"
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-white text-slate-900 hover:bg-slate-100 transition-colors shadow-sm"
            >
              <span>Login Biasa</span>
              <ArrowRight className="w-3.5 h-3.5 text-slate-500" />
            </Link>
          </div>
        </div>
      </header>

      {/* ─── Hero Section ──────────────────────────────────────────────── */}
      <section className="relative overflow-hidden pt-12 pb-16 sm:pt-20 sm:pb-24 border-b border-slate-800/80">
        {/* Background glow effects */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-gradient-to-tr from-blue-600/15 via-orange-500/15 to-purple-600/15 blur-3xl pointer-events-none -z-10" />

        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-800/90 border border-slate-700 text-xs font-medium text-slate-300 mb-6 shadow-sm">
            <Sparkles className="w-3.5 h-3.5 text-orange-400" />
            <span>Interactive Live Showcase & Evaluation Sandbox</span>
          </div>

          <h1 className="text-4xl sm:text-6xl font-black text-white tracking-tight leading-tight">
            Meet<span className="text-orange-500">Think</span>
            <span className="block text-2xl sm:text-3xl font-bold text-slate-300 mt-2">
              Smart Meeting Management System
            </span>
          </h1>

          <p className="mt-5 text-base sm:text-lg text-slate-400 max-w-3xl mx-auto leading-relaxed">
            Aplikasi web enterprise end-to-end untuk efisiensi rapat perusahaan:
            pencegahan bentrok ganda ruangan & jadwal pegawai, alur persetujuan berjenjang,
            presensi digital QR Code, hingga notulensi terkunci & action items dengan notifikasi email.
          </p>

          {/* Tech Badges */}
          <div className="mt-8 flex flex-wrap items-center justify-center gap-2 max-w-2xl mx-auto">
            {[
              'Next.js 15 (App Router)',
              'React 19',
              'PostgreSQL (Neon)',
              'Prisma ORM',
              'NextAuth.js v5',
              'Resend Email API',
              'Tailwind CSS',
              'TypeScript',
            ].map((tech) => (
              <span
                key={tech}
                className="px-2.5 py-1 rounded-md text-xs font-medium bg-slate-800/80 text-slate-300 border border-slate-700/80"
              >
                {tech}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ─── 1-Click Interactive Demo Login Section ──────────────────────── */}
      <section className="py-16 sm:py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-xs font-semibold text-blue-400 mb-3">
            <span>Uji Coba Langsung (1-Click Access)</span>
          </div>
          <h2 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
            Pilih Peran untuk Mulai Eksplorasi
          </h2>
          <p className="text-sm sm:text-base text-slate-400 mt-2">
            Klik tombol <strong className="text-slate-200">1-Click Login</strong> pada salah satu kartu di bawah ini.
            Sistem akan otomatis mengautentikasi Anda tanpa perlu mengetikkan email atau password.
          </p>
        </div>

        {/* Demo Cards Component */}
        <DemoLoginCards currentSessionUser={session?.user} />
      </section>

      {/* ─── Key Features Showcase Section ──────────────────────────────── */}
      <section className="py-16 border-t border-slate-800/80 bg-slate-950/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <span className="text-xs font-bold uppercase tracking-wider text-orange-400">
              Fitur Utama Sistem
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight mt-1">
              Solusi Terintegrasi di Setiap Siklus Rapat
            </h2>
            <p className="text-sm text-slate-400 mt-2">
              Dirancang untuk mengatasi problem tumpang tindih fasilitas fisik dan waktu kerja karyawan.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Feature 1 */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 hover:border-slate-700 transition-colors">
              <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center mb-4">
                <CalendarCheck2 className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">
                Proteksi Bentrok Ganda (Dual Protection)
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Tidak hanya memblokir pemesanan ruangan yang sudah terpakai, sistem juga mengevaluasi ketersediaan jadwal setiap pegawai yang diundang dan memberikan peringatan visual jika ada bentrok agenda.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 hover:border-slate-700 transition-colors">
              <div className="w-10 h-10 rounded-xl bg-orange-500/10 border border-orange-500/20 text-orange-400 flex items-center justify-center mb-4">
                <GitBranch className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">
                Alur Persetujuan Berjenjang (Multi-Level)
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Workflow persetujuan otomatis bertingkat (Kepala Divisi verifikasi urgensi & Admin Fasilitas persiapkan alat/konsumsi) dilengkapi audit log dan catatan alasan penolakan yang transparan.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 hover:border-slate-700 transition-colors">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mb-4">
                <QrCode className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">
                Absensi Digital QR Code Mandiri
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Presensi nirsentuh melalui kamera smartphone dengan validasi waktu cerdas (dibuka 30 menit sebelum rapat) dan rekap kehadiran live (tepat waktu vs terlambat) serta fallback manual.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 hover:border-slate-700 transition-colors">
              <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400 flex items-center justify-center mb-4">
                <ClipboardList className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">
                Notulensi Terkunci & Action Items
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Hasil rapat resmi dapat difinalisasi dan dikunci untuk menjaga integritas data. Setiap tugas dihubungkan langsung ke PIC dengan tenggat waktu (deadline) dan status overdue dinamis.
              </p>
            </div>

            {/* Feature 5 */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 hover:border-slate-700 transition-colors">
              <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center mb-4">
                <Mail className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">
                Integrasi Notifikasi Email (Resend)
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Notifikasi email otomatis untuk approval pengajuan rapat, konfirmasi persetujuan, penolakan, hingga penugasan action items ke PIC secara real-time via Resend API.
              </p>
            </div>

            {/* Feature 6 */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 hover:border-slate-700 transition-colors">
              <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 flex items-center justify-center mb-4">
                <BarChart3 className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">
                Dashboard & Ekspor Laporan
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Visibilitas manajemen dengan metrik utilisasi ruangan, rasio ketepatan waktu divisi, tingkat penyelesaian action items, serta dukungan ekspor laporan komprehensif ke format PDF & Excel.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Architecture & Tech Stack Section ──────────────────────────── */}
      <section className="py-16 border-t border-slate-800/80">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <span className="text-xs font-bold uppercase tracking-wider text-blue-400">
              Spesifikasi Rekayasa Perangkat Lunak
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight mt-1">
              Arsitektur & Standar Produksi
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5 flex items-start gap-4">
              <div className="p-2.5 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-400 shrink-0">
                <Cpu className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-white">Full-Stack Next.js 15 App Router</h4>
                <p className="text-xs text-slate-400 mt-1">
                  React 19 Server Components untuk performa tinggi, Server Actions, dan API Route terisolasi.
                </p>
              </div>
            </div>

            <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5 flex items-start gap-4">
              <div className="p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 shrink-0">
                <Database className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-white">Neon PostgreSQL & Prisma ORM</h4>
                <p className="text-xs text-slate-400 mt-1">
                  Database relasional cloud serverless dengan transaksi ACID tinggi, enkripsi SSL/TLS, dan foreign-key safety.
                </p>
              </div>
            </div>

            <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5 flex items-start gap-4">
              <div className="p-2.5 rounded-lg bg-purple-500/10 border border-purple-500/20 text-purple-400 shrink-0">
                <Lock className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-white">NextAuth.js v5 & RBAC Security</h4>
                <p className="text-xs text-slate-400 mt-1">
                  Otentikasi aman berbasis JWT cookie, enkripsi password bcrypt (salt 12), serta Role-Based Access Control 4 tingkat.
                </p>
              </div>
            </div>

            <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5 flex items-start gap-4">
              <div className="p-2.5 rounded-lg bg-orange-500/10 border border-orange-500/20 text-orange-400 shrink-0">
                <Server className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-white">Deployment Vercel Edge & Resend</h4>
                <p className="text-xs text-slate-400 mt-1">
                  Global CDN deployment dengan proteksi DDoS otomatis, custom domain SSL, dan transactional email deliverability tinggi.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Footer ────────────────────────────────────────────────────── */}
      <footer className="py-12 border-t border-slate-800 bg-slate-950 text-slate-400 text-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-bold text-white">MeetThink</span>
            <span>• Smart Meeting Management System</span>
          </div>

          <div className="flex items-center gap-6">
            <a
              href="https://github.com/allaboutpampam8-crypto/meetthink"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-white transition-colors flex items-center gap-1"
            >
              <Github className="w-3.5 h-3.5" />
              <span>GitHub Repository</span>
            </a>
            <Link href="/login" className="hover:text-white transition-colors">
              Halaman Login
            </Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
