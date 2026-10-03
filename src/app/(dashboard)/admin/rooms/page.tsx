import { Metadata } from 'next'
import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/db'
import Link from 'next/link'
import { Plus, Building2, Users, Settings, Edit, MapPin } from 'lucide-react'

export const metadata: Metadata = { title: 'Manajemen Ruang | MeetThink' }

export default async function AdminRoomsPage() {
  const session = await auth()
  const role = session?.user?.role ?? 'USER'
  if (!['SUPER_ADMIN', 'ADMIN'].includes(role)) redirect('/dashboard')

  const rooms = await prisma.room.findMany({
    include: {
      facilities: true,
      _count: { select: { bookings: true } },
    },
    orderBy: { name: 'asc' },
  })

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Manajemen Ruang</h1>
          <p className="text-gray-500 mt-1">{rooms.length} ruang terdaftar</p>
        </div>
        <Link
          href="/admin/rooms/new"
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4 py-2.5 rounded-lg transition-colors text-sm"
        >
          <Plus className="w-4 h-4" />
          Tambah Ruang
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {rooms.map((room) => (
          <div key={room.id} className="bg-white rounded-xl border border-gray-200 p-5">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${room.isActive ? 'bg-blue-50' : 'bg-gray-100'}`}>
                  <Building2 className={`w-5 h-5 ${room.isActive ? 'text-blue-600' : 'text-gray-400'}`} />
                </div>
                <div>
                  <p className="font-semibold text-gray-900">{room.name}</p>
                  <p className="text-sm text-gray-400">{room.code}</p>
                </div>
              </div>
              <Link
                href={`/admin/rooms/${room.id}/edit` as any}
                className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <Edit className="w-4 h-4" />
              </Link>
            </div>

            <div className="mt-4 space-y-1.5">
              <p className="text-sm text-slate-600 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                <span>{room.location}</span>
              </p>
              <div className="flex items-center gap-3 text-sm text-slate-500">
                <span className="flex items-center gap-1"><Users className="w-3.5 h-3.5 text-slate-400" /> {room.capacity} orang</span>
                <span>· {room._count.bookings} booking</span>
              </div>
            </div>

            {room.facilities.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-1.5">
                {room.facilities.slice(0, 4).map((f) => (
                  <span key={f.id} className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full">
                    {f.name}
                  </span>
                ))}
                {room.facilities.length > 4 && (
                  <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-400 rounded-full">
                    +{room.facilities.length - 4}
                  </span>
                )}
              </div>
            )}

            <div className="mt-3 flex items-center gap-2">
              <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium
                ${room.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                {room.isActive ? '● Aktif' : '○ Nonaktif'}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
