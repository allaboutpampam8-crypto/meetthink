'use client'

import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import {
  ShieldCheck,
  CheckCircle2,
  User,
  Sparkles,
  Loader2,
  Copy,
  Check,
  ArrowRight,
  KeyRound,
  ExternalLink,
  Laptop,
} from 'lucide-react'

interface DemoAccount {
  id: string
  role: string
  name: string
  division: string
  email: string
  password: string
  badgeColor: string
  accentColor: string
  borderColor: string
  btnColor: string
  icon: typeof ShieldCheck
  description: string
  highlights: string[]
}

const DEMO_ACCOUNTS: DemoAccount[] = [
  {
    id: 'superadmin',
    role: 'Super Admin',
    name: 'Super Admin',
    division: 'Divisi IT',
    email: 'superadmin@company.com',
    password: 'Admin@1234',
    badgeColor: 'bg-purple-100 text-purple-700 border-purple-200',
    accentColor: 'from-purple-600 to-indigo-600',
    borderColor: 'hover:border-purple-300',
    btnColor: 'bg-purple-600 hover:bg-purple-700 active:bg-purple-800 text-white',
    icon: ShieldCheck,
    description: 'Akses penuh seluruh konfigurasi sistem, data ruangan, alur approval, dan master user.',
    highlights: [
      'Manajemen Master Ruangan & Fasilitas',
      'Konfigurasi Alur Approval Bertingkat',
      'Kelola Akun Pengguna & Hak Akses',
      'Laporan Utilisasi & Analitik Komprehensif',
    ],
  },
  {
    id: 'approver',
    role: 'Approver / Kepala Divisi',
    name: 'Kepala Divisi IT',
    division: 'Divisi IT',
    email: 'kepala@company.com',
    password: 'Admin@1234',
    badgeColor: 'bg-amber-100 text-amber-800 border-amber-200',
    accentColor: 'from-amber-500 to-orange-600',
    borderColor: 'hover:border-amber-300',
    btnColor: 'bg-amber-600 hover:bg-amber-700 active:bg-amber-800 text-white',
    icon: CheckCircle2,
    description: 'Memverifikasi dan memberikan persetujuan (Approve / Reject) atas pengajuan jadwal rapat.',
    highlights: [
      'Tab Khusus Antrean Approval Masuk',
      'Approve & Reject dengan Catatan / Alasan',
      'Validasi Kebutuhan & Konsumsi Rapat',
      'Monitoring Jadwal Rapat Anggota Tim',
    ],
  },
  {
    id: 'user',
    role: 'Karyawan / User',
    name: 'Budi Santoso',
    division: 'Developer (IT)',
    email: 'budi@company.com',
    password: 'User@1234',
    badgeColor: 'bg-blue-100 text-blue-700 border-blue-200',
    accentColor: 'from-blue-600 to-cyan-600',
    borderColor: 'hover:border-blue-300',
    btnColor: 'bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white',
    icon: User,
    description: 'Mengajukan booking rapat baru, scan QR Code absensi, serta melihat tugas & notulensi.',
    highlights: [
      'Form Smart Booking (Deteksi Bentrok Ganda)',
      'Peringatan Real-time Jika Peserta Bentrok',
      'Presensi Mandiri via Scan QR Code',
      'Pantau Action Items & Deadline Tugas',
    ],
  },
]

export function DemoLoginCards({ currentSessionUser }: { currentSessionUser?: any }) {
  const router = useRouter()
  const [loadingEmail, setLoadingEmail] = useState<string | null>(null)
  const [copiedId, setCopiedId] = useState<string | null>(null)

  const handleQuickLogin = async (account: DemoAccount) => {
    setLoadingEmail(account.email)
    try {
      const result = await signIn('credentials', {
        email: account.email,
        password: account.password,
        redirect: false,
      })

      if (result?.error) {
        toast.error('Gagal masuk. Pastikan database seed aktif.')
        return
      }

      // Aktifkan mode demo melalui cookie agar aplikasi menampilkan banner & indikator demo
      document.cookie = 'meetthink_demo_mode=true; path=/; max-age=86400; SameSite=Lax'

      toast.success(`Berhasil masuk sebagai ${account.role}! Mengalihkan ke dashboard...`)
      router.push('/dashboard')
      router.refresh()
    } catch {
      toast.error('Terjadi kesalahan saat proses masuk otomatis.')
    } finally {
      setLoadingEmail(null)
    }
  }

  const handleCopyCredentials = (account: DemoAccount) => {
    const text = `Email: ${account.email}\nPassword: ${account.password}`
    navigator.clipboard.writeText(text)
    setCopiedId(account.id)
    toast.success(`Kredensial ${account.role} disalin ke clipboard!`)
    setTimeout(() => setCopiedId(null), 2500)
  }

  return (
    <div className="space-y-6">
      {/* Active Session Notice if logged in */}
      {currentSessionUser && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-sm">
          <div className="flex items-center gap-3">
            <span className="flex h-3 w-3 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
            </span>
            <div>
              <p className="text-sm font-semibold text-emerald-950">
                Anda sedang masuk sebagai <span className="font-bold">{currentSessionUser.name}</span> ({currentSessionUser.role})
              </p>
              <p className="text-xs text-emerald-700">
                Email: {currentSessionUser.email}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => router.push('/dashboard')}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors"
            >
              <Laptop className="w-3.5 h-3.5" />
              Buka Dashboard
            </button>
          </div>
        </div>
      )}

      {/* Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {DEMO_ACCOUNTS.map((account) => {
          const Icon = account.icon
          const isLoading = loadingEmail === account.email
          const isCopied = copiedId === account.id

          return (
            <div
              key={account.id}
              className={`relative bg-white rounded-2xl border border-gray-200/90 shadow-sm transition-all duration-200 hover:shadow-lg flex flex-col justify-between overflow-hidden group ${account.borderColor}`}
            >
              {/* Top Accent Gradient Bar */}
              <div className={`h-2 w-full bg-gradient-to-r ${account.accentColor}`} />

              <div className="p-6 flex-1 flex flex-col">
                {/* Header Badge & Role */}
                <div className="flex items-center justify-between gap-2 mb-3">
                  <span
                    className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold border ${account.badgeColor}`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    {account.role}
                  </span>
                  <span className="text-xs font-medium text-gray-400">
                    {account.division}
                  </span>
                </div>

                <h3 className="text-lg font-bold text-gray-900 group-hover:text-blue-600 transition-colors">
                  {account.name}
                </h3>
                <p className="text-xs text-gray-600 mt-1 mb-4 leading-relaxed">
                  {account.description}
                </p>

                {/* Highlights List */}
                <div className="bg-gray-50/80 rounded-xl p-3 border border-gray-100 mb-5 flex-1">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-gray-500 mb-2">
                    Fitur untuk Dicoba:
                  </p>
                  <ul className="space-y-1.5">
                    {account.highlights.map((h, idx) => (
                      <li key={idx} className="text-xs text-gray-700 flex items-start gap-1.5">
                        <span className="text-emerald-500 font-bold shrink-0 mt-0.5">•</span>
                        <span>{h}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Credentials Preview */}
                <div className="bg-slate-50 border border-slate-200/70 rounded-xl p-3 mb-5 text-xs text-slate-700 font-mono space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400 font-sans text-[11px]">Email:</span>
                    <span className="font-semibold text-slate-800">{account.email}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400 font-sans text-[11px]">Password:</span>
                    <span className="font-semibold text-slate-800">{account.password}</span>
                  </div>
                </div>

                {/* Actions */}
                <div className="space-y-2 mt-auto">
                  {/* 1-Click Login Button */}
                  <button
                    onClick={() => handleQuickLogin(account)}
                    disabled={!!loadingEmail}
                    className={`w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl font-semibold text-sm shadow-sm transition-all disabled:opacity-60 disabled:cursor-not-allowed ${account.btnColor}`}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Memproses Masuk...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4" />
                        <span>1-Click Login</span>
                        <ArrowRight className="w-3.5 h-3.5 opacity-80 group-hover:translate-x-1 transition-transform" />
                      </>
                    )}
                  </button>

                  {/* Copy Credential Button */}
                  <button
                    type="button"
                    onClick={() => handleCopyCredentials(account)}
                    className="w-full flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg text-xs font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors"
                  >
                    {isCopied ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                        <span className="text-emerald-700 font-semibold">Tersalin!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5 text-gray-400" />
                        <span>Salin Kredensial Manual</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
