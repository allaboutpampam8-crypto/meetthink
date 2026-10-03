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
  MapPin,
  Sparkles,
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200/60">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-blue-50 text-blue-700 border border-blue-200/60 mb-1.5">
            <Sparkles className="w-3 h-3 text-blue-500" />
            <span>Manajemen Rapat</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Jadwal & Booking Ruang
          </h1>
          <p className="text-slate-500 mt-1 text-xs sm:text-sm">
            Pantau ketersediaan ruang rapat secara real-time dan kelola agenda rapat Anda
          </p>
        </div>
        <Link
          href="/bookings/new"
          className="inline-flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-semibold px-4 py-2.5 rounded-xl transition-all text-sm shadow-xs hover:shadow"
        >
          <Plus className="w-4 h-4" />
          <span>Booking Ruang Baru</span>
        </Link>
      </div>

      {/* Modern Segmented Tab Switcher */}
      <div className="inline-flex p-1 rounded-xl bg-slate-100/90 border border-slate-200/80 shadow-2xs">
        <button
          onClick={() => handleTabChange('calendar')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all ${
            activeTab === 'calendar'
              ? 'bg-white text-blue-700 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <CalendarIcon className="w-4 h-4 text-blue-600" />
          <span>Kalender Ketersediaan Ruang</span>
        </button>
        <button
          onClick={() => handleTabChange('list')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all ${
            activeTab === 'list'
              ? 'bg-white text-blue-700 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <ListFilter className="w-4 h-4 text-blue-600" />
          <span>Daftar Rapat Saya</span>
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-700">
            {bookings.length}
          </span>
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
          <div className="flex items-center gap-2 overflow-x-auto pb-1.5 pt-0.5 no-scrollbar">
            <span className="inline-flex items-center gap-1 text-xs font-semibold text-slate-400 pl-1 pr-2">
              <Filter className="w-3.5 h-3.5" />
              <span>Filter:</span>
            </span>
            {statusOptions.map((opt) => {
              const isSelected = (currentStatusFilter ?? '') === opt.value
              return (
                <Link
                  key={opt.value}
                  href={
                    opt.value
                      ? `/bookings?tab=list&status=${opt.value}`
                      : '/bookings?tab=list'
                  }
                  className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all duration-150 ${
                    isSelected
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'bg-white border border-slate-200/90 text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                >
                  {opt.label}
                </Link>
              )
            })}
          </div>

          {/* List of Bookings */}
          <div className="space-y-3.5">
            {bookings.length === 0 ? (
              <div className="bg-white rounded-2xl border border-slate-200/90 py-16 px-4 text-center shadow-xs">
                <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto mb-3 shadow-2xs">
                  <CalendarIcon className="w-7 h-7" />
                </div>
                <p className="text-slate-900 font-bold text-base">Belum Ada Rapat Ditemukan</p>
                <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto leading-relaxed">
                  Tidak ada agenda rapat yang sesuai dengan filter ini. Mulai dengan membuat booking baru atau ubah status filter.
                </p>
                <Link
                  href="/bookings/new"
                  className="mt-5 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Ajukan Booking Sekarang</span>
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
                    className="block bg-white rounded-2xl border border-slate-200/90 p-5 hover:shadow-md transition-all duration-150 hover:border-blue-300 group"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        {/* Status Badges Row */}
                        <div className="flex flex-wrap items-center gap-2 mb-2">
                          <span
                            className={`text-xs px-2.5 py-0.5 rounded-full font-bold border flex items-center gap-1.5 flex-shrink-0 ${lifecycle.color}`}
                          >
                            {lifecycle.isOngoing && (
                              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                            )}
                            {lifecycle.label}
                          </span>
                          <span
                            className={`text-[11px] px-2.5 py-0.5 rounded-full font-semibold border ${
                              isRequester
                                ? 'bg-purple-50 text-purple-700 border-purple-200/70'
                                : 'bg-blue-50 text-blue-700 border-blue-200/70'
                            }`}
                          >
                            {isRequester
                              ? 'Penyelenggara Rapat'
                              : `Peserta (Oleh: ${booking.requester?.name ?? '—'})`}
                          </span>
                        </div>

                        {/* Title */}
                        <h3 className="font-bold text-slate-900 text-base sm:text-lg group-hover:text-blue-600 transition-colors truncate mb-1">
                          {booking.title}
                        </h3>

                        {/* Location */}
                        <p className="text-xs text-slate-600 flex items-center gap-1.5 mb-3">
                          <MapPin className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                          <span>
                            <strong>{booking.room.name}</strong> ({booking.room.code}) · {booking.room.location}
                          </span>
                        </p>

                        {/* Metadata Chips */}
                        <div className="flex flex-wrap items-center gap-2.5 text-xs text-slate-600">
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-50 border border-slate-200/60 font-medium">
                            <CalendarIcon className="w-3.5 h-3.5 text-slate-400" />
                            {formatDate(booking.startAt, 'dd MMMM yyyy')}
                          </span>
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-50 border border-slate-200/60 font-medium">
                            <Clock className="w-3.5 h-3.5 text-slate-400" />
                            {formatTime(booking.startAt)} – {formatTime(booking.endAt)}
                          </span>
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-50 border border-slate-200/60 font-medium">
                            <Users className="w-3.5 h-3.5 text-slate-400" />
                            {booking._count.participants + 1} Orang (Peserta + Host)
                          </span>
                        </div>
                      </div>

                      <div className="w-8 h-8 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400 group-hover:text-blue-600 group-hover:bg-blue-50 group-hover:border-blue-200 transition-all flex-shrink-0 mt-1">
                        <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                      </div>
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
