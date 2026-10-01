import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { auth } from '@/lib/auth'
import { Sidebar } from '@/components/layout/sidebar'
import { Navbar } from '@/components/layout/navbar'
import { DemoModeBanner } from '@/components/demo/demo-mode-banner'

const DEMO_EMAILS = [
  'superadmin@company.com',
  'kepala@company.com',
  'budi@company.com',
  'fasilitas@company.com',
  'sari@company.com',
]

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()
  if (!session) redirect('/login')

  const cookieStore = await cookies()
  const isDemoCookie = cookieStore.get('meetthink_demo_mode')?.value === 'true'
  const isDemoEmail = DEMO_EMAILS.includes(session.user.email ?? '')
  const isDemoMode = isDemoCookie || isDemoEmail

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden flex-col">
      {/* Banner Demo / Sandbox Mode */}
      {isDemoMode && (
        <DemoModeBanner
          userRole={session.user.role}
          userName={session.user.name}
        />
      )}

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <Sidebar user={session.user} isDemoMode={isDemoMode} />

        {/* Main content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <Navbar user={session.user} isDemoMode={isDemoMode} />
          <main className="flex-1 overflow-y-auto p-6">
            {children}
          </main>
        </div>
      </div>
    </div>
  )
}
