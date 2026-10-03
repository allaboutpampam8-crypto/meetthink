'use client'

import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import {
  Eye,
  EyeOff,
  Loader2,
  AlertCircle,
  Mail,
  Lock,
  ArrowRight,
  ShieldCheck,
  UserCheck,
  User,
  Sparkles,
} from 'lucide-react'

const schema = z.object({
  email: z.string().email('Email tidak valid'),
  password: z.string().min(1, 'Password wajib diisi'),
})

type FormData = z.infer<typeof schema>

const DEMO_ACCOUNTS = [
  {
    role: 'SUPER_ADMIN',
    label: 'Super Admin',
    email: 'superadmin@company.com',
    password: 'Admin@1234',
    icon: ShieldCheck,
    badgeColor: 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100',
  },
  {
    role: 'APPROVER',
    label: 'Approver / Kepala',
    email: 'kepala@company.com',
    password: 'Admin@1234',
    icon: UserCheck,
    badgeColor: 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100',
  },
  {
    role: 'USER',
    label: 'Staff / Pemohon',
    email: 'budi@company.com',
    password: 'User@1234',
    icon: User,
    badgeColor: 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100',
  },
] as const

export function LoginForm() {
  const router = useRouter()
  const [showPassword, setShowPassword] = useState(false)
  const [activeDemo, setActiveDemo] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      email: '',
      password: '',
    },
  })

  const fillDemoAccount = (acc: typeof DEMO_ACCOUNTS[number]) => {
    setActiveDemo(acc.role)
    setValue('email', acc.email, { shouldValidate: true })
    setValue('password', acc.password, { shouldValidate: true })
    toast.info(`Akun demo [${acc.label}] terpilih`)
  }

  const onSubmit = async (data: FormData) => {
    try {
      const result = await signIn('credentials', {
        email: data.email,
        password: data.password,
        redirect: false,
      })

      if (result?.error) {
        toast.error('Email atau password salah')
        return
      }

      toast.success('Login berhasil! Mengalihkan ke dashboard...')
      router.push('/dashboard')
      router.refresh()
    } catch {
      toast.error('Terjadi kesalahan pada sistem. Silakan coba kembali.')
    }
  }

  return (
    <div className="space-y-6">
      {/* Demo Account Quick Selector Helper */}
      <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/90 space-y-2">
        <div className="flex items-center justify-between text-xs">
          <span className="font-semibold text-slate-700 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-orange-500" />
            <span>Pilih Akun Demo (Quick Login):</span>
          </span>
          <span className="text-[10px] text-slate-400 font-medium">1-Klik Isi Form</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-1.5">
          {DEMO_ACCOUNTS.map((acc) => {
            const Icon = acc.icon
            const isSelected = activeDemo === acc.role
            return (
              <button
                key={acc.role}
                type="button"
                onClick={() => fillDemoAccount(acc)}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-semibold transition-all cursor-pointer text-left ${
                  isSelected
                    ? 'ring-2 ring-blue-500 border-transparent shadow-2xs ' + acc.badgeColor
                    : acc.badgeColor
                }`}
              >
                <Icon className="w-3.5 h-3.5 flex-shrink-0" />
                <span className="truncate">{acc.label}</span>
              </button>
            )
          })}
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* Email Field */}
        <div className="space-y-1.5">
          <label
            htmlFor="email"
            className="block text-xs font-bold uppercase tracking-wider text-slate-700"
          >
            Alamat Email
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
              <Mail className="w-4 h-4" />
            </div>
            <input
              id="email"
              type="email"
              autoComplete="email"
              placeholder="nama@company.com"
              {...register('email')}
              className={`w-full pl-10 pr-4 py-2.5 rounded-xl border text-sm text-slate-900 bg-white placeholder-slate-400 outline-none transition-all ${
                errors.email
                  ? 'border-rose-400 focus:border-rose-500 focus:ring-4 focus:ring-rose-100'
                  : 'border-slate-300 focus:border-blue-600 focus:ring-4 focus:ring-blue-100'
              }`}
            />
          </div>
          {errors.email && (
            <p className="text-xs text-rose-600 flex items-center gap-1 font-medium mt-1">
              <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
              <span>{errors.email.message}</span>
            </p>
          )}
        </div>

        {/* Password Field */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label
              htmlFor="password"
              className="block text-xs font-bold uppercase tracking-wider text-slate-700"
            >
              Kata Sandi
            </label>
          </div>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
              <Lock className="w-4 h-4" />
            </div>
            <input
              id="password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="current-password"
              placeholder="••••••••"
              {...register('password')}
              className={`w-full pl-10 pr-10 py-2.5 rounded-xl border text-sm text-slate-900 bg-white placeholder-slate-400 outline-none transition-all ${
                errors.password
                  ? 'border-rose-400 focus:border-rose-500 focus:ring-4 focus:ring-rose-100'
                  : 'border-slate-300 focus:border-blue-600 focus:ring-4 focus:ring-blue-100'
              }`}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              aria-label={showPassword ? 'Sembunyikan password' : 'Lihat password'}
              className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          {errors.password && (
            <p className="text-xs text-rose-600 flex items-center gap-1 font-medium mt-1">
              <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
              <span>{errors.password.message}</span>
            </p>
          )}
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold py-2.5 px-4 rounded-xl transition-all duration-150 shadow-sm hover:shadow-md cursor-pointer mt-2"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Memvalidasi & Masuk...</span>
            </>
          ) : (
            <>
              <span>Masuk ke Dashboard</span>
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </form>
    </div>
  )
}
