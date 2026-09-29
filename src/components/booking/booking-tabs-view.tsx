'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import {
  Calendar as CalendarIcon,
  ListFilter,
  Plus,
  Filter,
  Clock,
  Users,
  ChevronRight,
} from 'lucide-react'
import { BookingCalendar } from '@/components/booking/booking-calendar'
import { formatDate, formatTime, bookingStatusColor, bookingStatusLabel, getMeetingLifecycle } from '@/lib/utils'

interface Room {
  id: string
  name: string
  code: string
  location: string
  capacity: number
  facilities: { id: string; name: string }[]
}

interface BookingItem {
  id: string
  title: string
  status: string
  startAt: Date | string
  endAt: Date | string
  requester?: { id: string; name: string; email?: string }
  room: { name: string; location: string; code: string }
  _count: { participants: number }
  actions: { approver: { name: string } }[]
}

interface Props {
  initialRooms: Room[]
  bookings: BookingItem[]
  currentStatusFilter?: string
  currentUserId?: string
}

export function BookingTabsView({
  initialRooms,
  bookings,
  currentStatusFilter = '',
  currentUserId,
}: Props) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const initialTab = searchParams.get('tab') === 'list' ? 'list' : 'calendar'
  const [activeTab, setActiveTab] = useState<'calendar' | 'list'>(initialTab)

  const statusOptions = [
    { value: '', label: 'Semua Status' },
    { value: 'PENDING', label: 'Pending' },
    { value: 'APPROVED', label: 'Disetujui / Aktif' },
    { value: 'COMPLETED', label: 'Selesai' },
    { value: 'REJECTED', label: 'Ditolak' },
    { value: 'CANCELLED', label: 'Dibatalkan' },
  ]

  const handleTabChange = (tab: 'calendar' | 'list') => {
    setActiveTab(tab)
    const params = new URLSearchParams(searchParams.toString())
    params.set('tab', tab)
    router.replace(`/bookings?${params.toString()}`)
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Jadwal & Booking Ruang</h1>
          <p className="text-gray-500 mt-1 text-sm">
            Pantau ketersediaan ruang rapat secara real-time dan kelola jadwal rapat Anda
          </p>
        </div>
        <Link
          href="/bookings/new"
          className="inline-flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4 py-2.5 rounded-lg transition-colors text-sm shadow-xs"
        >
          <Plus className="w-4 h-4" />
          Booking Ruang Baru
        </Link>
      </div>

      {/* Tabs Switcher */}
      <div className="flex items-center gap-2 border-b border-gray-200">
        <button
          onClick={() => handleTabChange('calendar')}
          className={`flex items-center gap-2 px-4 py-2.5 text-sm font-semibold border-b-2 transition-colors ${
            activeTab === 'calendar'
              ? 'border-blue-600 text-blue-600 bg-blue-50/40 rounded-t-lg'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <CalendarIcon className="w-4 h-4" />
          Kalender Ketersediaan Ruang
        </button>
        <button
          onClick={() => handleTabChange('list')}
          className={`flex items-center gap-2 px-4 py-2.5 text-sm font-semibold border-b-2 transition-colors ${
            activeTab === 'list'
              ? 'border-blue-600 text-blue-600 bg-blue-50/40 rounded-t-lg'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <ListFilter className="w-4 h-4" />
          Daftar Rapat Saya ({bookings.length})
        </button>
      </div>

      {/* TAB 1: KALENDER KETERSEDIAAN RUANG */}
      {activeTab === 'calendar' && (
        <div>
          <BookingCalendar
            initialRooms={initialRooms}
            onSelectSlot={(roomId, date, startTime, endTime) => {
              router.push(
                `/bookings/new?roomId=${roomId}&date=${date}&startTime=${startTime}&endTime=${endTime}`,
              )
            }}
          />
        </div>
      )}

      {/* TAB 2: DAFTAR RAPAT SAYA */}
      {activeTab === 'list' && (
        <div className="space-y-4">
          {/* Status Filter Pills */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            <Filter className="w-4 h-4 text-gray-400 flex-shrink-0" />
            {statusOptions.map((opt) => (
              <Link
                key={opt.value}
                href={
                  opt.value
                    ? `/bookings?tab=list&status=${opt.value}`
                    : '/bookings?tab=list'
                }
                className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
                  (currentStatusFilter ?? '') === opt.value
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
                }`}
              >
                {opt.label}
              </Link>
            ))}
          </div>

          {/* List of Bookings */}
          <div className="space-y-3">
            {bookings.length === 0 ? (
              <div className="bg-white rounded-xl border border-gray-200 py-16 text-center shadow-xs">
                <CalendarIcon className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-700 font-semibold">Belum ada rapat</p>
                <p className="text-xs text-gray-400 mt-1">
                  Mulai dengan mengajukan booking baru atau pilih slot di kalender
                </p>
                <Link
                  href="/bookings/new"
                  className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-blue-600 hover:text-blue-700 hover:underline"
                >
                  Ajukan booking sekarang →
                </Link>
              </div>
            ) : (
              bookings.map((booking) => {
                const isRequester = booking.requester?.id === currentUserId
                const lifecycle = getMeetingLifecycle(booking)
                return (
                  <Link
                    key={booking.id}
                    href={`/bookings/${booking.id}` as any}
                    className="block bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition-all hover:border-blue-200"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-1.5">
                          <h3 className="font-semibold text-gray-900 truncate">
                            {booking.title}
                          </h3>
                          <span
                            className={`text-xs px-2.5 py-0.5 rounded-full font-semibold border flex items-center gap-1.5 flex-shrink-0 ${lifecycle.color}`}
                          >
                            {lifecycle.isOngoing && (
                              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                            )}
                            {lifecycle.label}
                          </span>
                          <span
                            className={`text-[10px] px-2 py-0.5 rounded font-medium ${
                              isRequester
                                ? 'bg-purple-50 text-purple-700 border border-purple-200'
                                : 'bg-blue-50 text-blue-700 border border-blue-200'
                            }`}
                          >
                            {isRequester
                              ? 'Penyelenggara'
                              : `Peserta (Oleh: ${booking.requester?.name ?? '—'})`}
                          </span>
                        </div>
                        <p className="text-xs text-gray-600">
                          📍 {booking.room.name} ({booking.room.code}) · {booking.room.location}
                        </p>
                        <div className="flex flex-wrap items-center gap-4 mt-2.5 text-xs text-gray-500">
                          <span className="flex items-center gap-1">
                            <CalendarIcon className="w-3.5 h-3.5 text-gray-400" />
                            {formatDate(booking.startAt, 'dd MMMM yyyy')}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5 text-gray-400" />
                            {formatTime(booking.startAt)} – {formatTime(booking.endAt)}
                          </span>
                          <span className="flex items-center gap-1">
                            <Users className="w-3.5 h-3.5 text-gray-400" />
                            {booking._count.participants + 1} peserta
                          </span>
                        </div>
                      </div>
                      <ChevronRight className="w-5 h-5 text-gray-300 flex-shrink-0 mt-1" />
                    </div>
                  </Link>
                )
              })
            )}
          </div>
        </div>
      )}
    </div>
  )
}
