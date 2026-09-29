'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Calendar as CalendarIcon, FileText } from 'lucide-react'
import { NewBookingForm } from '@/components/booking/new-booking-form'
import { BookingCalendar } from '@/components/booking/booking-calendar'

interface Room {
  id: string
  name: string
  code: string
  location: string
  capacity: number
  facilities: { id: string; name: string }[]
}

interface UserOption {
  id: string
  name: string
  email: string
  division?: string | null
}

interface Props {
  rooms: Room[]
  users: UserOption[]
  currentUserId: string
}

export function NewBookingFlow({ rooms, users, currentUserId }: Props) {
  const [activeView, setActiveView] = useState<'form' | 'calendar'>('form')

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Top Bar with Back & View Toggle */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <Link
          href="/bookings"
          className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-800 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Kembali ke Jadwal & Booking
        </Link>

        {/* View Toggle */}
        <div className="inline-flex rounded-lg border border-gray-200 p-1 bg-white shadow-2xs text-xs font-medium">
          <button
            type="button"
            onClick={() => setActiveView('form')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-colors ${
              activeView === 'form'
                ? 'bg-blue-600 text-white font-semibold shadow-xs'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            Formulir Booking
          </button>
          <button
            type="button"
            onClick={() => setActiveView('calendar')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-colors ${
              activeView === 'calendar'
                ? 'bg-blue-600 text-white font-semibold shadow-xs'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <CalendarIcon className="w-3.5 h-3.5" />
            Lihat Kalender Semua Ruang
          </button>
        </div>
      </div>

      {/* Header Info */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          {activeView === 'form' ? 'Booking Ruang Baru' : 'Cek Ketersediaan di Kalender'}
        </h1>
        <p className="text-gray-500 mt-1 text-sm">
          {activeView === 'form'
            ? 'Isi formulir berikut dan pantau timeline ketersediaan ruang secara real-time.'
            : 'Pilih slot waktu kosong pada ruang yang diinginkan untuk langsung mengisi formulir booking.'}
        </p>
      </div>

      {/* View Content */}
      {activeView === 'form' ? (
        <NewBookingForm
          rooms={rooms}
          users={users}
          currentUserId={currentUserId}
          onOpenCalendar={() => setActiveView('calendar')}
        />
      ) : (
        <div className="space-y-4">
          <div className="p-3 bg-blue-50 border border-blue-100 rounded-xl text-xs text-blue-800 flex items-center justify-between">
            <span>
              💡 Klik pada slot hijau kosong pada ruang mana saja untuk memilih waktu dan ruang tersebut.
            </span>
            <button
              onClick={() => setActiveView('form')}
              className="text-xs font-semibold text-blue-700 underline ml-2"
            >
              Kembali ke Formulir
            </button>
          </div>

          <BookingCalendar
            initialRooms={rooms}
            onSelectSlot={(roomId, date, startTime, endTime) => {
              // Update URL search params and return to form view
              const params = new URLSearchParams(window.location.search)
              params.set('roomId', roomId)
              params.set('date', date)
              params.set('startTime', startTime)
              params.set('endTime', endTime)
              window.history.replaceState(null, '', `?${params.toString()}`)
              setActiveView('form')
            }}
          />
        </div>
      )}
    </div>
  )
}
